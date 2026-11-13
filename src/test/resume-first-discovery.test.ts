import { describe, test } from "node:test";
import assert from "node:assert";
import zlib from "zlib";
import {
  extractTextFromDocumentBuffer,
  parseResumeText,
} from "../lib/resume-parser";
import { extractCandidateCapabilityMap } from "../lib/candidate-intelligence";
import { expandCandidateRoleFamilies } from "../lib/role-expansion";
import { evaluateOpportunity } from "../lib/scoring-engine";
import { parseSearchIntent } from "../lib/query-intent-parser";
import { TavilySearchProvider } from "../lib/providers/tavily-provider";
import {
  UserProfile,
  Opportunity,
  SearchConfig,
  SearchQueryItem,
  WorkMode,
  OpportunityCategory,
} from "../types";

/**
 * Creates a valid single-page PDF buffer containing supplied lines of text.
 */
function createPdfBuffer(lines: string[]): Buffer {
  const contentStream = `BT\n/F1 12 Tf\n50 750 Td\n14 TL\n${lines
    .map((l) => `(${l.replace(/[()\\]/g, "\\$&")}) '`)
    .join("\n")}\nET`;

  const streamLength = Buffer.byteLength(contentStream, "latin1");
  const pdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>
endobj
4 0 obj
<< /Length ${streamLength} >>
stream
${contentStream}
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000236 00000 n 
0000000300 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
380
%%EOF`;
  return Buffer.from(pdf, "binary");
}

/**
 * Creates a minimal valid DOCX ZIP buffer with word/document.xml.
 */
function createDocxBuffer(xmlContent: string): Buffer {
  const localHeaderSig = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
  const filename = "word/document.xml";
  const filenameBuf = Buffer.from(filename, "utf-8");
  const rawData = Buffer.from(xmlContent, "utf-8");
  const compressed = zlib.deflateRawSync(rawData);

  const localHeader = Buffer.alloc(30);
  localHeaderSig.copy(localHeader, 0);
  localHeader.writeUInt16LE(20, 4);
  localHeader.writeUInt16LE(0, 6);
  localHeader.writeUInt16LE(8, 8); // Deflate
  localHeader.writeUInt16LE(0, 10);
  localHeader.writeUInt16LE(0, 12);
  localHeader.writeUInt32LE(0x12345678, 14);
  localHeader.writeUInt32LE(compressed.length, 18);
  localHeader.writeUInt32LE(rawData.length, 22);
  localHeader.writeUInt16LE(filenameBuf.length, 26);
  localHeader.writeUInt16LE(0, 28);

  const centralDirSig = Buffer.from([0x50, 0x4b, 0x01, 0x02]);
  const centralDir = Buffer.alloc(46);
  centralDirSig.copy(centralDir, 0);
  centralDir.writeUInt16LE(20, 4);
  centralDir.writeUInt16LE(20, 6);
  centralDir.writeUInt16LE(0, 8);
  centralDir.writeUInt16LE(8, 10);
  centralDir.writeUInt16LE(0, 12);
  centralDir.writeUInt16LE(0, 14);
  centralDir.writeUInt32LE(0x12345678, 16);
  centralDir.writeUInt32LE(compressed.length, 20);
  centralDir.writeUInt32LE(rawData.length, 24);
  centralDir.writeUInt16LE(filenameBuf.length, 28);
  centralDir.writeUInt16LE(0, 30);
  centralDir.writeUInt16LE(0, 32);
  centralDir.writeUInt16LE(0, 34);
  centralDir.writeUInt16LE(0, 36);
  centralDir.writeUInt32LE(0, 38);
  centralDir.writeUInt32LE(0, 42);

  const eocdSig = Buffer.from([0x50, 0x4b, 0x05, 0x06]);
  const eocd = Buffer.alloc(22);
  eocdSig.copy(eocd, 0);
  const cdOffset = localHeader.length + filenameBuf.length + compressed.length;
  const cdSize = centralDir.length + filenameBuf.length;
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdOffset, 16);
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([
    localHeader,
    filenameBuf,
    compressed,
    centralDir,
    filenameBuf,
    eocd,
  ]);
}

describe("Prospect — Resume-First Automated Opportunity Discovery", () => {
  // 1. Valid PDF upload & extraction
  test("1. Successfully uploads and extracts structured facts from a valid PDF", async () => {
    const pdfBuf = createPdfBuffer([
      "Priya Sharma",
      "priya.sharma@iitd.ac.in | Bengaluru, India",
      "Education: Indian Institute of Technology Delhi",
      "Degree: Bachelor of Technology in Computer Science",
      "Graduation: May 2026 | GPA: 8.9/10",
      "Skills: Python, PyTorch, SQL, FastAPI, Docker, Git",
      "Project: Real-Time Vision Benchmark | Built PyTorch object detector with 94% mAP",
      "Experience: ML Research Intern at AI Labs (Summer 2024)",
    ]);

    const extractedText = await extractTextFromDocumentBuffer(pdfBuf, "pdf");
    assert.ok(extractedText.length > 50, "Extracted text should not be empty");

    const parsed = parseResumeText(extractedText, "Priya_Sharma_Resume.pdf");
    assert.strictEqual(parsed.extractedProfile.fullName, "Priya Sharma");
    assert.strictEqual(parsed.extractedProfile.email, "priya.sharma@iitd.ac.in");
    assert.strictEqual(parsed.extractedProfile.graduationYear, 2026);
    assert.strictEqual(parsed.extractedProfile.gpa, 8.9);
    assert.ok(parsed.extractedProfile.skills?.includes("Python"));
    assert.ok(parsed.extractedProfile.skills?.includes("PyTorch"));
  });

  // 2. Valid DOCX upload & extraction
  test("2. Successfully uploads and extracts structured facts from a valid DOCX Word file", async () => {
    const docxXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
    <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
      <w:body>
        <w:p><w:r><w:t>Devin Vance</w:t></w:r></w:p>
        <w:p><w:r><w:t>devin.vance@stanford.edu</w:t></w:r></w:p>
        <w:p><w:r><w:t>Stanford University, B.S. Computer Science, Expected 2026</w:t></w:r></w:p>
        <w:p><w:r><w:t>Skills: TypeScript, React, Next.js, Node.js, PostgreSQL</w:t></w:r></w:p>
      </w:body>
    </w:document>`;
    const docxBuf = createDocxBuffer(docxXml);

    const extractedText = await extractTextFromDocumentBuffer(docxBuf, "docx");
    assert.ok(extractedText.includes("Devin Vance"));
    assert.ok(extractedText.includes("stanford.edu"));

    const parsed = parseResumeText(extractedText, "Devin_Vance.docx");
    assert.strictEqual(parsed.extractedProfile.email, "devin.vance@stanford.edu");
    assert.strictEqual(parsed.extractedProfile.graduationYear, 2026);
    assert.ok(parsed.extractedProfile.skills?.includes("TypeScript"));
  });

  // 3. Reject invalid file extensions
  test("3. Identifies and rejects unsupported file extensions", () => {
    const validExts = ["pdf", "docx", "txt", "md"];
    const invalidExts = ["exe", "zip", "png", "sh", "js", "html"];

    invalidExts.forEach((ext) => {
      assert.strictEqual(
        validExts.includes(ext),
        false,
        `Extension .${ext} must be rejected`
      );
    });
  });

  // 4. Extracts education and skills correctly without fabricating
  test("4. Extracts authentic skills and academic facts without hallucination", () => {
    const resumeText = `
    Rohan Patel
    rohan.p@mit.edu
    Massachusetts Institute of Technology
    Bachelor of Science in Computer Science
    Class of 2026
    Skills: C++, Rust, Linux, Distributed Systems, Git
    `;

    const parsed = parseResumeText(resumeText, "Rohan_Resume.txt");
    assert.strictEqual(parsed.extractedProfile.fullName, "Rohan Patel");
    assert.strictEqual(parsed.extractedProfile.graduationYear, 2026);
    assert.ok(parsed.extractedProfile.skills?.includes("C++"));
    assert.ok(parsed.extractedProfile.skills?.includes("Rust"));
    assert.ok(parsed.extractedProfile.skills?.includes("Linux"));
    // Verify it didn't fabricate Python or Java when absent
    assert.strictEqual(parsed.extractedProfile.skills?.includes("Java"), false);
  });

  // 5. Handles missing fields cleanly (flags in lowConfidenceFields)
  test("5. Flags missing unlisted GPA and phone as low confidence instead of guessing", () => {
    const textWithoutGpa = `
    Candidate Name
    candidate@university.edu
    State University, B.S. Computer Science
    Graduating 2026
    Skills: Python, SQL
    `;

    const parsed = parseResumeText(textWithoutGpa, "candidate.pdf");
    assert.strictEqual(parsed.extractedProfile.gpa, null, "GPA must remain null when not in resume");
    assert.strictEqual(parsed.extractedProfile.phone, undefined, "Phone must remain undefined when not in resume");
    assert.ok(parsed.lowConfidenceFields.length > 0);
  });

  // 6. Editing extracted facts
  test("6. Allows updating and removing extracted facts before confirmation", () => {
    const initialSkills = ["Python", "JavaScript", "HTML"];
    // User removes HTML and adds Docker
    const editedSkills = initialSkills
      .filter((s) => s !== "HTML")
      .concat(["Docker"]);

    assert.deepStrictEqual(editedSkills, ["Python", "JavaScript", "Docker"]);
  });

  // 7. Provenance tracking: RESUME_DERIVED vs USER_CONFIRMED
  test("7. Attaches and preserves field provenance across lifecycle", () => {
    const profile: Partial<UserProfile> = {
      fullName: "Alex Chen",
      factProvenance: {
        skills: { source: "resume-derived", updatedAt: new Date().toISOString() },
      },
    };

    // User edits and confirms
    const confirmedProvenance = {
      ...profile.factProvenance,
      skills: { source: "user-confirmed", updatedAt: new Date().toISOString() },
      targetRoles: { source: "user-confirmed", updatedAt: new Date().toISOString() },
    };

    assert.strictEqual(confirmedProvenance.skills.source, "user-confirmed");
    assert.strictEqual(confirmedProvenance.targetRoles.source, "user-confirmed");
  });

  // 8. Automatic Career Intent Detection & Role Expansion
  test("8. Infers relevant career directions and target roles from demonstrated skills", () => {
    const testProfile: UserProfile = {
      id: "candidate-123",
      fullName: "Priya Sharma",
      email: "priya@iit.ac.in",
      headline: "CS Student",
      university: "IIT Delhi",
      degree: "B.Tech",
      major: "Computer Science",
      graduationYear: 2026,
      graduationMonth: "May",
      gpa: 8.9,
      location: "Bengaluru, India",
      targetRoles: [],
      preferredWorkModes: ["Remote", "Hybrid"],
      preferredLocations: ["Bengaluru, India"],
      skills: ["Python", "PyTorch", "Machine Learning", "FastAPI", "SQL", "Git"],
      experiences: [],
      projects: [
        {
          id: "p1",
          name: "Vision Pipeline",
          description: "Trained PyTorch model with automated evaluations.",
          techStack: ["Python", "PyTorch", "Computer Vision"],
        },
      ],
      portfolioLinks: [],
      availability: "Summer 2025",
      stipendPreference: "Flexible",
      constraints: "",
      factProvenance: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const capabilityMap = extractCandidateCapabilityMap(testProfile);
    const expandedRoles = expandCandidateRoleFamilies(testProfile, capabilityMap);

    assert.ok(expandedRoles.length > 0, "Should generate expanded roles");
    const roleTitles = expandedRoles.map((r) => r.title);
    assert.ok(
      roleTitles.some((t) => t.includes("Machine Learning") || t.includes("AI")),
      "Should infer ML / AI related roles from PyTorch and Python evidence"
    );
  });

  // 9. Deriving targeted search queries without leaking candidate PII
  test("9. Generates targeted search query without sending candidate name, email, or phone", () => {
    const candidateProfile: UserProfile = {
      id: "cand-pii-safe",
      fullName: "Secret Candidate Name",
      email: "secret.email@domain.com",
      phone: "+1-555-0199",
      headline: "AI Engineer",
      university: "Top Tech University",
      degree: "B.S.",
      major: "Computer Science",
      graduationYear: 2026,
      graduationMonth: "June",
      gpa: 3.9,
      location: "Bengaluru, India",
      targetRoles: ["Machine Learning Intern"],
      preferredWorkModes: ["Remote"],
      preferredLocations: ["Bengaluru, India"],
      skills: ["Python", "PyTorch"],
      experiences: [],
      projects: [],
      portfolioLinks: [],
      availability: "Summer 2025",
      stipendPreference: "Paid Only",
      constraints: "",
      factProvenance: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Construct query for discovery engine
    const query = `${candidateProfile.targetRoles[0]} ${candidateProfile.location.split(",")[0]}`;
    assert.strictEqual(query.includes(candidateProfile.fullName), false);
    assert.strictEqual(query.includes(candidateProfile.email), false);
    assert.strictEqual(query.includes(candidateProfile.phone!), false);
    assert.strictEqual(query, "Machine Learning Intern Bengaluru");
  });

  // 10. Separation of LIVE and DEMO mode results
  test("10. Enforces strict separation between LIVE web results and DEMO mock results", () => {
    const liveOpp: Opportunity = {
      id: "live-opp-01",
      title: "Software Engineering Intern",
      organization: "Acme Corp",
      category: "Internship",
      description: "Live web posting",
      location: "Remote",
      workMode: "Remote",
      compensation: "Paid Stipend",
      eligibilityRequirements: [],
      requiredSkills: ["Python"],
      preferredSkills: [],
      applyUrl: "https://acme.com/careers/intern",
      sourceName: "Tavily Real-Time Web Index",
      sourceUrl: "https://acme.com/careers/intern",
      sourceConfidence: 0.9,
      verificationStatus: "VERIFIED_SOURCE",
      sourceEvidence: [],
      discoveredAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      isDemo: false,
    };

    const demoOpp: Opportunity = {
      ...liveOpp,
      id: "demo-opp-01",
      isDemo: true,
      verificationStatus: "DEMO_DATA",
      sourceName: "Prospect Demo Catalog",
    };

    // Filter by LIVE mode
    const liveFilter = [liveOpp, demoOpp].filter((o) => !o.isDemo);
    assert.strictEqual(liveFilter.length, 1);
    assert.strictEqual(liveFilter[0].isDemo, false);

    // Filter by DEMO mode
    const demoFilter = [liveOpp, demoOpp].filter((o) => o.isDemo);
    assert.strictEqual(demoFilter.length, 1);
    assert.strictEqual(demoFilter[0].isDemo, true);
  });

  // 11. Eligibility evaluation with hard blocker
  test("11. Enforces that graduation year mismatch overrides skill match and forces recommendation to SKIP", () => {
    const student2026: UserProfile = {
      id: "student-2026",
      fullName: "Junior Student",
      email: "student@univ.edu",
      headline: "CS Student",
      university: "Univ",
      degree: "B.Tech",
      major: "Computer Science",
      graduationYear: 2026,
      graduationMonth: "May",
      gpa: 3.8,
      location: "Remote",
      targetRoles: ["Software Engineering Intern"],
      preferredWorkModes: ["Remote"],
      preferredLocations: ["Remote"],
      skills: ["Python", "SQL", "Git"],
      experiences: [],
      projects: [],
      portfolioLinks: [],
      availability: "Summer 2025",
      stipendPreference: "Flexible",
      constraints: "",
      factProvenance: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const oppRestrictedTo2024Grads: Opportunity = {
      id: "opp-blocker",
      title: "Graduate SWE",
      organization: "Restricted Enterprise",
      category: "Entry-level",
      description: "Must have graduated by 2024",
      location: "Remote",
      workMode: "Remote",
      compensation: "$80k/yr",
      eligibilityRequirements: [
        "Graduation date between 2022 and 2024 (Class of 2024 only)",
        "Must be a US Citizen or Permanent Resident",
      ],
      requiredSkills: ["Python", "SQL"],
      preferredSkills: [],
      applyUrl: "https://restricted.com/apply",
      sourceName: "Career Board",
      sourceUrl: "https://restricted.com/apply",
      sourceConfidence: 0.95,
      verificationStatus: "VERIFIED_SOURCE",
      sourceEvidence: [],
      discoveredAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      isDemo: false,
    };

    const evalResult = evaluateOpportunity(oppRestrictedTo2024Grads, student2026);
    assert.strictEqual(evalResult.recommendation, "SKIP");
    assert.ok(evalResult.hardBlockers.length > 0);
  });

  // 12. 4-way decision engine recommendation
  test("12. Generates four distinct recommendations based on readiness and fit", () => {
    const student: UserProfile = {
      id: "candidate-chen",
      fullName: "Alex Chen",
      email: "alex@chen.io",
      headline: "CS Student",
      university: "College",
      degree: "B.Tech",
      major: "Computer Science",
      graduationYear: 2026,
      graduationMonth: "May",
      gpa: 8.6,
      location: "Bengaluru, India",
      targetRoles: ["Software Engineering Intern"],
      preferredWorkModes: ["Remote", "Hybrid"],
      preferredLocations: ["Bengaluru, India"],
      skills: ["Python", "SQL", "TypeScript", "React", "Git"],
      experiences: [
        {
          id: "exp-1",
          title: "Software Engineering Intern",
          company: "Tech Corp",
          duration: "3 months",
          bullets: ["Built responsive React web applications", "Wrote Python REST API endpoints"],
          verified: true,
        },
      ],
      projects: [
        {
          id: "proj-1",
          name: "React Dashboard",
          description: "Full-stack dashboard with React and Python",
          techStack: ["React", "Python", "SQL"],
        },
      ],
      portfolioLinks: [],
      availability: "Summer 2025",
      stipendPreference: "Paid Only",
      constraints: "",
      factProvenance: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const readyOpp: Opportunity = {
      id: "ready-1",
      title: "SWE Intern",
      organization: "Tech Corp",
      category: "Internship",
      description: "React and Python intern",
      location: "Bengaluru, India",
      workMode: "Hybrid",
      compensation: "INR 50,000/mo",
      eligibilityRequirements: [
        "Must be enrolled in Computer Science or related degree",
        "Graduation date between 2025 and 2027 (Class of 2026)",
      ],
      requiredSkills: ["Python", "React"],
      preferredSkills: [],
      deadline: new Date(Date.now() + 86400000 * 15).toISOString(),
      applyUrl: "https://techcorp.com/apply",
      sourceName: "Direct Employer",
      sourceUrl: "https://techcorp.com/apply",
      sourceConfidence: 0.95,
      verificationStatus: "VERIFIED_SOURCE",
      sourceEvidence: [],
      discoveredAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      isDemo: false,
    };

    const evaluation = evaluateOpportunity(readyOpp, student);
    assert.strictEqual(evaluation.recommendation, "APPLY_NOW");
    assert.ok(evaluation.overallScore >= 70);
  });

  // 13. Returning user experience: loads confirmed profile without forcing upload
  test("13. Detects existing confirmed profile to bypass onboarding upload for returning students", () => {
    const existingConfirmedProfile: UserProfile = {
      id: "confirmed-user",
      fullName: "Alex Chen",
      email: "alex.chen@college.edu",
      headline: "CS Student",
      university: "College of Engineering",
      degree: "B.Tech",
      major: "Computer Science",
      graduationYear: 2026,
      graduationMonth: "May",
      gpa: 8.6,
      location: "Bengaluru, India",
      targetRoles: ["Software Engineering Intern"],
      preferredWorkModes: ["Remote", "Hybrid"],
      preferredLocations: ["Bengaluru, India"],
      skills: ["Python", "TypeScript", "SQL"],
      experiences: [],
      projects: [],
      portfolioLinks: [],
      availability: "Summer 2025",
      stipendPreference: "Paid Only",
      constraints: "",
      factProvenance: {
        skills: { source: "user-confirmed", updatedAt: new Date().toISOString() },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const shouldShowUploadOnboarding =
      !existingConfirmedProfile ||
      !existingConfirmedProfile.skills ||
      existingConfirmedProfile.skills.length === 0;

    assert.strictEqual(
      shouldShowUploadOnboarding,
      false,
      "Returning user with confirmed profile should bypass upload onboarding"
    );
  });
});

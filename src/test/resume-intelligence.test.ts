import { describe, test } from "node:test";
import assert from "node:assert";
import zlib from "zlib";
import {
  extractTextFromDocumentBuffer,
  parseResumeText,
} from "../lib/resume-parser";

/**
 * Helper to build a minimal valid single-page PDF containing given text.
 */
function createTestPdfBuffer(textLines: string[]): Buffer {
  const contentStream = `BT\n/F1 12 Tf\n50 750 Td\n14 TL\n${textLines
    .map((l) => `(${l.replace(/[()\\]/g, "\\$&")}) '`)
    .join("\n")}\nET`;

  const streamLength = Buffer.byteLength(contentStream, "latin1");
  const pdfSource = `%PDF-1.4
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

  return Buffer.from(pdfSource, "latin1");
}

/**
 * Helper to build a minimal valid DOCX buffer (ZIP archive with word/document.xml).
 */
function createTestDocxBuffer(paragraphs: string[]): Buffer {
  const xmlContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphs.map((p) => `<w:p><w:r><w:t>${p}</w:t></w:r></w:p>`).join("\n")}
  </w:body>
</w:document>`;

  const xmlBuffer = Buffer.from(xmlContent, "utf-8");
  const compressedXml = zlib.deflateRawSync(xmlBuffer);
  const entryName = "word/document.xml";
  const entryNameBuffer = Buffer.from(entryName, "utf-8");

  // Local file header
  const localHeader = Buffer.alloc(30 + entryNameBuffer.length);
  localHeader.writeUInt32LE(0x04034b50, 0); // signature
  localHeader.writeUInt16LE(20, 4); // version needed
  localHeader.writeUInt16LE(0, 6); // general purpose bit flag
  localHeader.writeUInt16LE(8, 8); // compression method (deflate)
  localHeader.writeUInt16LE(0, 10); // file time
  localHeader.writeUInt16LE(0, 12); // file date
  localHeader.writeUInt32LE(0, 14); // crc32 placeholder
  localHeader.writeUInt32LE(compressedXml.length, 18); // compressed size
  localHeader.writeUInt32LE(xmlBuffer.length, 22); // uncompressed size
  localHeader.writeUInt16LE(entryNameBuffer.length, 26); // file name length
  localHeader.writeUInt16LE(0, 28); // extra field length
  entryNameBuffer.copy(localHeader, 30);

  // Central directory header
  const centralHeader = Buffer.alloc(46 + entryNameBuffer.length);
  centralHeader.writeUInt32LE(0x02014b50, 0);
  centralHeader.writeUInt16LE(20, 4);
  centralHeader.writeUInt16LE(20, 6);
  centralHeader.writeUInt16LE(0, 8);
  centralHeader.writeUInt16LE(8, 10);
  centralHeader.writeUInt16LE(0, 12);
  centralHeader.writeUInt16LE(0, 14);
  centralHeader.writeUInt32LE(0, 16);
  centralHeader.writeUInt32LE(compressedXml.length, 20);
  centralHeader.writeUInt32LE(xmlBuffer.length, 24);
  centralHeader.writeUInt16LE(entryNameBuffer.length, 28);
  centralHeader.writeUInt16LE(0, 30);
  centralHeader.writeUInt16LE(0, 32);
  centralHeader.writeUInt16LE(0, 34);
  centralHeader.writeUInt16LE(0, 36);
  centralHeader.writeUInt32LE(0, 38);
  centralHeader.writeUInt32LE(0, 42); // relative offset of local header
  entryNameBuffer.copy(centralHeader, 46);

  // End of central directory record
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(1, 8); // total entries on this disk
  eocd.writeUInt16LE(1, 10); // total entries
  eocd.writeUInt32LE(centralHeader.length, 12); // size of central directory
  eocd.writeUInt32LE(localHeader.length + compressedXml.length, 16); // offset of central directory
  eocd.writeUInt16LE(0, 20);

  return Buffer.concat([localHeader, compressedXml, centralHeader, eocd]);
}

describe("Complete Resume Intelligence System", () => {
  // Scenario 1: PDF Extraction & Fact Population
  test("Extracts structured profile facts from real PDF document buffer", async () => {
    const pdfBuffer = createTestPdfBuffer([
      "Marcus Vance",
      "marcus.vance@stanford.edu | (650) 555-0192 | San Francisco, CA",
      "github.com/marcusvance | linkedin.com/in/marcus-vance",
      "EDUCATION",
      "Stanford University",
      "Bachelor of Science in Computer Science & AI, Expected Graduation: May 2026",
      "GPA: 3.91 / 4.0",
      "Relevant Coursework: Data Structures, Algorithms, Operating Systems, Machine Learning",
      "TECHNICAL SKILLS",
      "Languages: Python, TypeScript, C++, SQL, Go",
      "Frameworks & Tools: PyTorch, React, Next.js, Docker, Kubernetes, PostgreSQL",
      "EXPERIENCE",
      "Distributed Systems Intern at Acme Cloud Systems",
      "• Engineered high-throughput gRPC microservices in Go and Redis.",
      "• Reduced p99 latency by 35% through connection pooling.",
      "PROJECTS",
      "Autonomous Vision Robot",
      "• Trained ResNet and PyTorch models for real-time obstacle avoidance with OpenCV.",
    ]);

    const extractedText = await extractTextFromDocumentBuffer(pdfBuffer, "pdf");
    assert.ok(extractedText.length > 50, "Extracted PDF text must not be empty");
    assert.ok(extractedText.includes("Marcus Vance"));

    const parsed = parseResumeText(extractedText, "Marcus_Vance_Resume.pdf");
    const profile = parsed.extractedProfile;

    assert.strictEqual(profile.fullName, "Marcus Vance");
    assert.strictEqual(profile.email, "marcus.vance@stanford.edu");
    assert.ok(profile.phone?.includes("555-0192"));
    assert.strictEqual(profile.university, "Stanford University");
    assert.strictEqual(profile.graduationYear, 2026);
    assert.strictEqual(profile.gpa, 3.91);
    assert.ok(profile.skills?.includes("Python"));
    assert.ok(profile.skills?.includes("PyTorch"));
    assert.ok(profile.skills?.includes("Go"));
    assert.ok(profile.skills?.includes("Docker"));
    assert.ok(profile.portfolioLinks?.some((l) => l.label === "GitHub"));
    assert.ok(profile.portfolioLinks?.some((l) => l.label === "LinkedIn"));
    assert.ok(profile.coursework?.includes("Data Structures"));
    assert.ok(profile.experiences && profile.experiences.length > 0);
    assert.ok(parsed.confidence >= 0.85);
  });

  // Scenario 2: DOCX Extraction
  test("Extracts structured profile facts from DOCX Word document buffer", async () => {
    const docxBuffer = createTestDocxBuffer([
      "Priya Sharma",
      "priya.sharma@iitb.ac.in | +91 98765 43210 | Bengaluru, India",
      "https://github.com/priyasharma | https://linkedin.com/in/priya-sharma",
      "EDUCATION",
      "Indian Institute of Technology Bombay",
      "Bachelor of Technology in Computer Science, Class of 2025",
      "GPA: 3.85",
      "SKILLS",
      "Python, TypeScript, React, Next.js, Node.js, PostgreSQL, Docker, AWS",
      "EXPERIENCE",
      "Full-Stack Engineering Intern at TechCorp",
      "• Developed responsive web applications using React and Next.js.",
      "PROJECTS",
      "Distributed Task Scheduler",
      "• Built distributed queue workers with Redis and Python handling 10k tasks/sec.",
    ]);

    const extractedText = await extractTextFromDocumentBuffer(docxBuffer, "docx");
    assert.ok(extractedText.length > 50, "Extracted DOCX text must not be empty");
    assert.ok(extractedText.includes("Priya Sharma"));

    const parsed = parseResumeText(extractedText, "Priya_Sharma_CV.docx");
    const profile = parsed.extractedProfile;

    assert.strictEqual(profile.fullName, "Priya Sharma");
    assert.strictEqual(profile.email, "priya.sharma@iitb.ac.in");
    assert.strictEqual(profile.graduationYear, 2025);
    assert.ok(profile.skills?.includes("React"));
    assert.ok(profile.skills?.includes("TypeScript"));
    assert.ok(profile.skills?.includes("PostgreSQL"));
    assert.ok(profile.skills?.includes("AWS"));
  });

  // Scenario 3: Categorized Skills & Normalization
  test("Normalizes aliases and groups skills into strict standard categories", () => {
    const sample = `
      John Doe
      john@example.com
      Skills: Golang, Postgres, ReactJS, NodeJS, K8s, PyTorch, Scikit-learn, AWS, Terraform, Docker
    `;
    const parsed = parseResumeText(sample, "resume.txt");
    const skills = parsed.extractedProfile.skills || [];

    // Verify aliases normalized
    assert.ok(skills.includes("Go"), "Golang must be normalized to Go");
    assert.ok(skills.includes("PostgreSQL"), "Postgres must be normalized to PostgreSQL");
    assert.ok(skills.includes("React"), "ReactJS must be normalized to React");
    assert.ok(skills.includes("Node.js"), "NodeJS must be normalized to Node.js");
    assert.ok(skills.includes("Kubernetes"), "K8s must be normalized to Kubernetes");

    // Verify categories
    const categories = parsed.extractedProfile.categorizedSkills;
    assert.ok(categories?.Languages?.includes("Go"));
    assert.ok(categories?.["ML / AI"]?.includes("PyTorch"));
    assert.ok(categories?.["Backend & Systems"]?.includes("PostgreSQL"));
    assert.ok(categories?.["Data & Cloud"]?.includes("AWS"));
  });

  // Scenario 4: Does not invent missing fields & flags low confidence
  test("Does not invent unlisted GPA or Phone, flags missing fields as low confidence", () => {
    const sparseResume = `
      Alex Rivers
      alex.rivers@college.edu
      Skills: Python, Git
    `;
    const parsed = parseResumeText(sparseResume, "resume.txt");
    assert.strictEqual(parsed.extractedProfile.gpa, null, "GPA must remain null when not in resume");
    assert.strictEqual(parsed.extractedProfile.phone, undefined, "Phone must remain undefined when not in resume");
    assert.ok(parsed.lowConfidenceFields.includes("degree") || parsed.lowConfidenceFields.includes("skills"));
  });

  // Scenario 5: Distinguishes Project experience from Employment experience
  test("Separates direct professional employment from academic technical projects", () => {
    const resumeText = `
      Elena Gomez
      elena@mit.edu
      EXPERIENCE
      Software Engineering Intern at Stripe
      • Built automated payment reconciliation pipelines in Python and SQL.
      
      PROJECTS
      Autonomous Drone Navigation
      • Designed real-time obstacle avoidance with PyTorch and OpenCV.
    `;
    const parsed = parseResumeText(resumeText, "Elena_Gomez.pdf");
    const profile = parsed.extractedProfile;

    assert.strictEqual(profile.experiences?.length, 1);
    assert.ok(profile.experiences?.[0].bullets[0].includes("payment reconciliation"));

    assert.strictEqual(profile.projects?.length, 1);
    assert.strictEqual(profile.projects?.[0].name, "Autonomous Drone Navigation");
  });
});

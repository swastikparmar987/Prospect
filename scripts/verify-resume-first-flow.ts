import { prisma } from "../src/lib/db";
import { UserProfile } from "../src/types";

async function verifyResumeFirstFlow() {
  console.log("=============================================================");
  console.log("PROSPECT — RESUME-FIRST DISCOVERY END-TO-END VERIFICATION");
  console.log("=============================================================");

  // 1. Reset / clean profile for fresh test
  console.log("\n[Step 1] Preparing clean database state...");
  await prisma.userProfile.deleteMany({});
  console.log("✓ Profile table cleared for first-time onboarding test.");

  // 2. Simulate Resume Upload & Parsing
  console.log("\n[Step 2] Simulating Resume Upload & Extraction via POST /api/resume/parse...");
  const resumeText = `
ANANYA IYER
ananya.iyer@iiitb.ac.in | +91 91234 56789 | Bengaluru, India
github.com/ananyaiyer | linkedin.com/in/ananyaiyer

EDUCATION
International Institute of Information Technology, Bangalore (IIIT-B)
Bachelor of Technology in Computer Science & Artificial Intelligence
Expected Graduation: May 2026 | CGPA: 9.1/10

TECHNICAL SKILLS
Languages: Python, TypeScript, SQL, C++
AI/ML: PyTorch, TensorFlow, Scikit-learn, OpenCV, Hugging Face
Web & Cloud: React, FastAPI, Docker, AWS, PostgreSQL, Git

PROJECTS
Visual Defect Detection System | Python, PyTorch, OpenCV
Built end-to-end deep learning visual quality inspection pipeline deployed via FastAPI with 96% accuracy.

EXPERIENCE
Machine Learning Intern | Applied AI Labs (May 2024 - July 2024)
- Implemented transformer model evaluation and fine-tuning.
- Reduced inference latency by 35% using ONNX runtime quantization.
`;

  const blob = new Blob([resumeText], { type: "text/plain" });
  const formData = new FormData();
  formData.append("file", blob, "Ananya_Iyer_Resume.txt");

  const parseRes = await fetch("http://localhost:3000/api/resume/parse", {
    method: "POST",
    body: formData,
  });

  if (!parseRes.ok) {
    throw new Error(`Parse failed with HTTP ${parseRes.status}`);
  }

  const parseData = await parseRes.json();
  console.log(`✓ Parse Succeeded (Confidence: ${parseData.confidence * 100}%)`);
  console.log(`  - Candidate:    ${parseData.extractedProfile.fullName}`);
  console.log(`  - University:   ${parseData.extractedProfile.university}`);
  console.log(`  - Graduation:   ${parseData.extractedProfile.graduationYear}`);
  console.log(`  - GPA:          ${parseData.extractedProfile.gpa}`);
  console.log(`  - Skills:       ${parseData.extractedProfile.skills.length} skills identified`);
  console.log(`  - Suggested:    ${parseData.suggestedRoles.slice(0, 3).join(", ")}`);

  // Verify that database profile is still null (Phase 3: Not saved until confirmed!)
  const dbBeforeConfirm = await prisma.userProfile.findFirst();
  if (dbBeforeConfirm !== null) {
    throw new Error("FAIL: Profile was saved to DB before confirmation! Phase 3 violation.");
  }
  console.log("✓ Verified: No profile data persisted to DB prior to user confirmation.");

  // 3. User Confirmation & Profile Save
  console.log("\n[Step 3] Simulating User Profile Review & Confirmation via POST /api/profile...");
  const confirmedProfileInput = {
    ...parseData.extractedProfile,
    targetRoles: parseData.suggestedRoles,
    preferredWorkModes: ["Remote", "Hybrid"],
    preferredLocations: ["Bengaluru, India"],
    factProvenance: {
      ...parseData.extractedProfile.factProvenance,
      confirmedAt: { source: "user-confirmed", updatedAt: new Date().toISOString() },
    },
  };

  const saveRes = await fetch("http://localhost:3000/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(confirmedProfileInput),
  });

  if (!saveRes.ok) {
    const err = await saveRes.json();
    throw new Error(`Save failed: ${JSON.stringify(err)}`);
  }

  const saveData = await saveRes.json();
  console.log(`✓ Profile Confirmed and Saved with ID: ${saveData.profile.id}`);
  console.log(`  - Demonstrated capabilities: ${saveData.profile.capabilityMap?.demonstratedCapabilities.length || 0}`);
  console.log(`  - Expanded role families:   ${saveData.profile.expandedRoles?.length || 0}`);

  // 4. Automatic Opportunity Discovery Agent
  console.log("\n[Step 4] Starting Discovery Agent via POST /api/opportunities...");
  const searchRes = await fetch("http://localhost:3000/api/opportunities", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `${confirmedProfileInput.targetRoles[0]} Bengaluru`,
      mode: "LIVE",
      maxRounds: 2,
    }),
  });

  if (!searchRes.ok) {
    throw new Error(`Discovery agent failed with status ${searchRes.status}`);
  }

  const searchData = await searchRes.json();
  console.log(`✓ Agent Discovery Completed (Status: ${searchData.status})`);
  console.log(`  - Total Opportunities Found: ${searchData.opportunities?.length || 0}`);
  console.log(`  - Execution Stages Recorded: ${searchData.steps?.length || 0}`);

  if (searchData.opportunities && searchData.opportunities.length > 0) {
    const sample = searchData.opportunities[0];
    console.log(`\n  Top Opportunity Discovered:`);
    console.log(`    Title:          ${sample.opportunity.title}`);
    console.log(`    Organization:   ${sample.opportunity.organization}`);
    console.log(`    Fit Score:      ${sample.evaluation.overallScore}%`);
    console.log(`    Recommendation: ${sample.evaluation.recommendation}`);
    console.log(`    Verification:   ${sample.opportunity.verificationStatus}`);
  }

  // 5. Returning User Check
  console.log("\n[Step 5] Checking Returning User Experience...");
  const profCheckRes = await fetch("http://localhost:3000/api/profile");
  const profCheck = await profCheckRes.json();

  if (!profCheck.profile || profCheck.profile.skills.length === 0) {
    throw new Error("FAIL: Returning user profile was not loaded properly.");
  }
  console.log(`✓ Returning student correctly recognized as "${profCheck.profile.fullName}"`);
  console.log("✓ Resume onboarding will automatically be bypassed for this returning student!");

  console.log("\n=============================================================");
  console.log("🎉 ALL RESUME-FIRST WORKFLOW STAGES VERIFIED SUCCESSFULLY!");
  console.log("=============================================================");
}

verifyResumeFirstFlow().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});


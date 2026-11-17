import { Opportunity, UserProfile, PreparationPlan, PreparationPlanItem } from "@/types";

/**
 * Generates actionable, realistic preparation steps for bridging qualification gaps.
 * Every gap maps directly to an opportunity requirement.
 * Clearly labels effort as rough planning estimates.
 */
export function generatePreparationPlan(
  opportunity: Opportunity,
  profile: UserProfile | null,
  _evaluation?: unknown
): PreparationPlan {
  const items: PreparationPlanItem[] = [];
  const candidateSkills = profile?.skills || [];
  const userSkills = new Set(candidateSkills.map((s) => s.toLowerCase().trim()));
  const primaryProject = profile?.projects?.[0];
  const primaryExp = profile?.experiences?.[0];

  // 1. Identify missing required technical or domain skills
  const missingSkills = (opportunity.requiredSkills || []).filter(
    (skill) => !userSkills.has(skill.toLowerCase().trim())
  );

  // 1b. Identify missing preferred skills
  const missingPreferredSkills = (opportunity.preferredSkills || [])
    .filter(
      (skill) =>
        !userSkills.has(skill.toLowerCase().trim()) &&
        !missingSkills.some((m) => m.toLowerCase() === skill.toLowerCase())
    )
    .slice(0, 2);

  let stepIndex = 1;
  const baselineAnchor = primaryProject
    ? `extending your "${primaryProject.name}" project (${primaryProject.techStack.slice(0, 3).join(", ") || "core stack"})`
    : candidateSkills.length > 0
      ? `leveraging your existing ${candidateSkills.slice(0, 3).join(", ")} background`
      : "building from first principles";

  for (const skill of missingSkills) {
    items.push({
      id: `gap-${stepIndex++}`,
      gap: `Missing verified skill: ${skill}`,
      requirement: `Required Technical Competency: ${skill} (extracted from ${opportunity.organization} posting)`,
      concreteAction: `Bridge ${skill} gap by implementing a focused module ${baselineAnchor}.`,
      deliverable: `A public GitHub repository with a README, typed implementation of ${skill}, and unit tests.`,
      completionCriteria: `Working sample project pushed to GitHub demonstrating ${skill} with clear architecture notes and passing test coverage.`,
      estimatedEffort: "4–8 hours over 3 days (Rough planning estimate)",
      portfolioProof: `Add project URL and 2 evidence-backed bullet points to your Prospect profile under '${skill}'.`,
      skillTag: skill,
      priority: "High",
      instructions: [
        `Candidate baseline detected: ${candidateSkills.slice(0, 4).join(", ") || "Entry profile"}${primaryProject ? ` + project "${primaryProject.name}"` : ""}.`,
        `Role demand detected: ${opportunity.title} explicitly lists "${skill}" as a required skill.`,
        `Build a reproducible feature integrating ${skill} and attach measured latency, accuracy, or test pass results to your resume.`,
      ],
      isCompleted: false,
    });
  }

  for (const skill of missingPreferredSkills) {
    items.push({
      id: `gap-${stepIndex++}`,
      gap: `Preferred growth skill: ${skill}`,
      requirement: `Preferred Advantage Competency: ${skill} for ${opportunity.title}`,
      concreteAction: `Add ${skill} integration & benchmark notes onto ${primaryProject ? `"${primaryProject.name}"` : "a focused sample service"}.`,
      deliverable: `Documented branch or pull request proving hands-on usage of ${skill} with before/after benchmarks.`,
      completionCriteria: `Clear architecture note + runnable script demonstrating ${skill} proficiency.`,
      estimatedEffort: "3–5 hours (Rough planning estimate)",
      portfolioProof: `Cite concrete ${skill} outcome in your ${opportunity.organization} application bullets.`,
      skillTag: skill,
      priority: "Medium",
      instructions: [
        `Builds competitive edge beyond baseline requirements for ${opportunity.organization}.`,
        `Pair ${skill} with your demonstrated strengths in ${candidateSkills.slice(0, 3).join(", ") || "software development"}.`,
      ],
      isCompleted: false,
    });
  }

  // 2. Unmet or unknown eligibility items
  for (const req of opportunity.eligibilityRequirements) {
    const reqLower = req.toLowerCase();
    if (reqLower.includes("gpa") && (!profile?.gpa || profile.gpa === null)) {
      items.push({
        id: `gap-${stepIndex++}`,
        gap: "Unrecorded GPA on profile",
        requirement: req,
        concreteAction: "Obtain official or unofficial transcript and record accurate cumulative GPA.",
        deliverable: "Updated Prospect profile with verified cumulative GPA and graduation standing.",
        completionCriteria: "Profile GPA field updated to reflect official university registrar records.",
        estimatedEffort: "30 minutes (Rough planning estimate)",
        portfolioProof: "Verified GPA field in student profile.",
        skillTag: "Academic Credentials",
        priority: "High",
        isCompleted: false,
      });
    }

    if (reqLower.includes("transcript") || reqLower.includes("coursework")) {
      items.push({
        id: `gap-${stepIndex++}`,
        gap: "Relevant coursework documentation",
        requirement: req,
        concreteAction: "Assemble a 1-page PDF syllabus summary of relevant upper-division coursework taken.",
        deliverable: "Coursework summary document citing relevant algorithms, systems, or data analysis courses.",
        completionCriteria: "Document ready to attach to application portal with course codes and grades.",
        estimatedEffort: "1 hour (Rough planning estimate)",
        portfolioProof: "Coursework section updated in resume and profile.",
        skillTag: "Coursework Proof",
        priority: "Medium",
        isCompleted: false,
      });
    }
  }

  // 3. Project & Experience Story Alignment Step
  if (primaryProject || primaryExp || items.length === 0) {
    const anchorName = primaryProject?.name || primaryExp?.company || `${opportunity.title} domain`;
    items.push({
      id: `gap-${stepIndex++}`,
      gap: "Targeted architecture & STAR narrative alignment",
      requirement: `Tailored interview & portfolio alignment for ${opportunity.title} at ${opportunity.organization}`,
      concreteAction: `Prepare a deep-dive system walkthrough connecting "${anchorName}" to ${opportunity.organization}'s stack (${(opportunity.requiredSkills || []).slice(0, 3).join(", ") || "core systems"}).`,
      deliverable: `Written talking points & 3 STAR stories linking your verified work in ${anchorName} to ${opportunity.title}.`,
      completionCriteria: `Practiced 2-minute architecture breakdown in Live Voice Mock Interview Studio with >75% rubric readiness.`,
      estimatedEffort: "2 hours (Rough planning estimate)",
      portfolioProof: "Tailored bullet points + voice interview scorecard saved in Preparation Studio.",
      skillTag: "Interview Readiness",
      priority: missingSkills.length === 0 ? "High" : "Medium",
      instructions: [
        `Grounded in your verified ${primaryProject ? `project "${primaryProject.name}"` : primaryExp ? `experience at ${primaryExp.company}` : "resume foundation"}.`,
        `Practice explaining architecture trade-offs aloud using the AI Voice Mock Interview Studio.`,
      ],
      isCompleted: false,
    });
  }

  const matchedSkillsCount = (opportunity.requiredSkills || []).filter((s) =>
    userSkills.has(s.toLowerCase().trim())
  ).length;

  return {
    id: `plan-${opportunity.id}-${Date.now()}`,
    opportunityId: opportunity.id,
    title: `Preparation Plan: ${opportunity.title}`,
    summary: `Synthesized from ${candidateSkills.length} resume skill(s) (${matchedSkillsCount}/${(opportunity.requiredSkills || []).length} required matched) into ${items.length} actionable milestone(s) for ${opportunity.organization}. Effort times are rough planning estimates.`,
    items,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const generateGapActionPlan = generatePreparationPlan;

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
  const userSkills = new Set((profile?.skills || []).map((s) => s.toLowerCase().trim()));

  // 1. Identify missing technical or domain skills
  const missingSkills = (opportunity.requiredSkills || []).filter(
    (skill) => !userSkills.has(skill.toLowerCase().trim())
  );

  let stepIndex = 1;

  for (const skill of missingSkills) {
    items.push({
      id: `gap-${stepIndex++}`,
      gap: `Missing verified skill: ${skill}`,
      requirement: `Required Technical Competency: ${skill}`,
      concreteAction: `Build a focused, mini demonstration repo implementing core patterns with ${skill}.`,
      deliverable: `A public GitHub repository with a README, typed implementation of ${skill}, and unit tests.`,
      completionCriteria: `Working sample project pushed to GitHub with architecture diagram and live demonstration or demo recording.`,
      estimatedEffort: "4–8 hours over 3 days (Rough planning estimate)",
      portfolioProof: `Add project URL and 2 evidence-backed bullet points to your Prospect profile under '${skill}'.`,
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
        isCompleted: false,
      });
    }
  }

  // 3. Fallback generic technical alignment if no specific gaps detected
  if (items.length === 0) {
    items.push({
      id: `gap-${stepIndex++}`,
      gap: "Targeted domain alignment",
      requirement: `Tailored alignment for ${opportunity.title} at ${opportunity.organization}`,
      concreteAction: `Deep dive into ${opportunity.organization}'s engineering/product blog and open-source contributions.`,
      deliverable: `Written talking points connecting your prior experience directly to ${opportunity.organization}'s current projects.`,
      completionCriteria: `Drafted 3 specific interview stories adhering to the STAR method grounded in your existing profile facts.`,
      estimatedEffort: "2 hours (Rough planning estimate)",
      portfolioProof: "Customized cover letter and interview talking points in Preparation Studio.",
      isCompleted: false,
    });
  }

  return {
    id: `plan-${opportunity.id}-${Date.now()}`,
    opportunityId: opportunity.id,
    title: `Preparation Plan: ${opportunity.title}`,
    summary: `Structured action items to address ${items.length} qualification gap(s) before applying to ${opportunity.organization}. Note: Completing these steps strengthens your evidence base but does not guarantee an interview or offer.`,
    items,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export const generateGapActionPlan = generatePreparationPlan;

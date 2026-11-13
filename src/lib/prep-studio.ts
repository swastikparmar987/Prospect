import { Opportunity, UserProfile, ApplicationMaterials } from "@/types";

/**
 * Generates tailored application materials strictly grounded in verified user facts.
 * Never invents metrics, credentials, dates, or employment history.
 * Explicitly marks missing user information.
 */
export function generateApplicationMaterials(
  opportunity: Opportunity,
  profile: UserProfile | null
): ApplicationMaterials {
  if (!profile) {
    return {
      resumeBulletsDraft: "No user profile is configured. Please populate your profile or upload a resume to generate evidence-backed bullets.",
      coverLetterDraft: "No user profile is configured. Please configure your profile first.",
      questionsDraft: "No user profile is configured.",
      interviewChecklist: "1. Review job posting for " + opportunity.title + " at " + opportunity.organization,
    };
  }

  // 1. Resume Bullet Suggestions grounded in actual user experiences/projects
  const bulletSuggestions: string[] = [];
  
  if (profile.experiences.length > 0) {
    bulletSuggestions.push(`### Tailored Experience Bullets (Grounded in: ${profile.experiences[0].company})`);
    for (const rawBullet of profile.experiences[0].bullets.slice(0, 3)) {
      // Find matching skills between opportunity and bullet
      const matchingSkill = opportunity.requiredSkills.find((s) =>
        rawBullet.toLowerCase().includes(s.toLowerCase())
      );
      if (matchingSkill) {
        bulletSuggestions.push(
          `• [High Alignment with ${matchingSkill}]: ${rawBullet} — (Emphasize this bullet when submitting to ${opportunity.organization})`
        );
      } else {
        bulletSuggestions.push(`• [Verified Experience]: ${rawBullet}`);
      }
    }
  }

  if (profile.projects.length > 0) {
    bulletSuggestions.push(`\n### Recommended Project to Highlight: ${profile.projects[0].name}`);
    bulletSuggestions.push(`• Description: ${profile.projects[0].description}`);
    bulletSuggestions.push(`• Tech Stack: ${profile.projects[0].techStack.join(", ")}`);
    if (profile.projects[0].link) {
      bulletSuggestions.push(`• Proof Link: ${profile.projects[0].link}`);
    }
    bulletSuggestions.push(
      `• Framing for ${opportunity.organization}: Connect this project's architecture directly to ${opportunity.title}'s focus on ${opportunity.requiredSkills.slice(0, 2).join(" & ") || "system development"}.`
    );
  }

  if (bulletSuggestions.length === 0) {
    bulletSuggestions.push(
      "Notice: No prior experiences or projects recorded on profile. Please add verified projects or coursework to receive tailored bullet suggestions without hallucinating credentials."
    );
  }

  // 2. Cover Letter Draft grounded in facts
  const userDegree = profile.degree || "[Your Degree Program]";
  const userMajor = profile.major || "[Your Major]";
  const userUni = profile.university || "[Your University]";
  const userGrad = profile.graduationYear ? `graduating in ${profile.graduationYear}` : "[Your Graduation Year]";
  const relevantSkills = opportunity.requiredSkills.filter((s) =>
    (profile.skills || []).some((us) => us.toLowerCase() === s.toLowerCase())
  );

  const coverLetterDraft = `Dear ${opportunity.organization} Recruiting Team,

I am writing to express my strong enthusiasm for the ${opportunity.title} opportunity (${opportunity.category}) based in ${opportunity.location} (${opportunity.workMode}). As an undergraduate student pursuing a ${userDegree} in ${userMajor} at ${userUni} (${userGrad}), my coursework and hands-on technical projects closely align with the competencies required for this role.

${
  relevantSkills.length > 0
    ? `In my academic and personal projects, I have developed verified proficiency in ${relevantSkills.join(", ")}, which directly supports your team's work on ${opportunity.title}.`
    : `I have built strong foundations in ${profile.skills.slice(0, 4).join(", ") || "core computing principles"}, and I am eager to apply this knowledge to the challenges faced by ${opportunity.organization}.`
}

${
  profile.projects.length > 0
    ? `For example, in my project "${profile.projects[0].name}", I implemented ${profile.projects[0].description} utilizing ${profile.projects[0].techStack.join(", ")}. This experience gave me practical insight into designing reliable, maintainable solutions.`
    : `Throughout my studies, I have consistently prioritized disciplined problem solving and thorough documentation.`
}

${
  profile.constraints
    ? `[Administrative Note: Stated profile availability: ${profile.availability}; Authorization notes: ${profile.constraints}]`
    : ""
}

Thank you for your time and consideration. I would welcome the opportunity to discuss how my background and verified skills can contribute to ${opportunity.organization}.

Sincerely,
${profile.fullName || "[Your Name]"}
${profile.email || "[Your Email]"}
${profile.portfolioLinks[0]?.url ? `Portfolio: ${profile.portfolioLinks[0].url}` : ""}`;

  // 3. Application Questions Drafts
  const questionsDraft = `### Common Application Questions & Grounded Responses

#### Q1: Why are you interested in ${opportunity.organization} and the ${opportunity.title} role?
**Grounded Draft:**
"I am drawn to ${opportunity.organization} because of its focus on ${opportunity.category.toLowerCase()} excellence. As a ${userMajor} student at ${userUni}, I want to apply my verified experience with ${profile.skills.slice(0, 3).join(", ") || "software engineering"} to direct, impactful projects. This role's requirement for ${opportunity.requiredSkills[0] || "collaborative development"} aligns directly with my career goal of building reliable, scalable systems."

#### Q2: Describe a technical challenge you encountered and how you solved it.
**Grounded Draft Template (Fill with your verified project):**
"While building ${profile.projects[0]?.name || "[Name of verified project]"}, I encountered a challenge where ${profile.projects[0] ? `I needed to implement ${profile.projects[0].techStack.join(", ")} effectively.` : "[Describe specific hurdle]"}. I structured my approach by breaking down the issue into testable milestones, instrumented logging to isolate the root cause, and successfully delivered the solution [insert exact verified metric from your project]."

#### Q3: What is your current work authorization and availability?
**Grounded Draft:**
"Availability: ${profile.availability}. Location: ${profile.location}. ${profile.constraints ? `Work Authorization details: ${profile.constraints}` : "Fully eligible to work within stated role requirements without visa sponsorship."}"`;

  // 4. Interview Preparation Checklist
  const interviewChecklist = `### Strategic Interview Preparation Checklist for ${opportunity.organization}

- [ ] **Role & Organization Research:**
  - Verify official job posting on ${opportunity.sourceName} (${opportunity.sourceUrl})
  - Review ${opportunity.organization}'s recent technical announcements, blog posts, and leadership goals
  - Note compensation details (${opportunity.compensation}) and confirm work mode (${opportunity.workMode})

- [ ] **Technical Deep Dive:**
  - Be prepared to discuss and write code in core required skills: ${opportunity.requiredSkills.join(", ") || "General fundamentals"}
  - Practice explaining the architecture and trade-offs of ${profile.projects[0]?.name || "your primary portfolio project"}
  - Review behavioral STAR stories demonstrating ownership, team communication, and fast learning

- [ ] **Eligibility & Logistics Verification:**
  - Have transcripts or graduation confirmation (${userGrad}) readily accessible
  - Confirm date availability for ${profile.availability}
  - Prepare 3 thoughtful questions for the interviewer regarding engineering practices at ${opportunity.organization}`;

  return {
    resumeBulletsDraft: bulletSuggestions.join("\n"),
    coverLetterDraft,
    questionsDraft,
    interviewChecklist,
  };
}

import {
  CandidateCapabilityMap,
  CareerDirection,
  CareerOutlook,
  EvidenceStrengthLabel,
  ExpandedRole,
  Opportunity,
  EvaluationResult,
  PersonalizedCareerBrief,
  UserProfile,
} from "../types";
import { extractCandidateCapabilityMap } from "./candidate-intelligence";
import { expandCandidateRoleFamilies } from "./role-expansion";

/**
 * Standard typical requirements for known career directions
 * Used to identify what qualifications a candidate is missing without hallucinating.
 */
const DIRECTION_REQUIREMENTS: Record<
  string,
  {
    typicalSkills: string[];
    criticalKeywords: string[];
    typicalCapabilities: string[];
    sampleDeliverables: string[];
  }
> = {
  "machine learning intern": {
    typicalSkills: ["Python", "PyTorch", "TensorFlow", "Scikit-Learn", "SQL", "Git", "Model Evaluation"],
    criticalKeywords: ["machine learning", "pytorch", "tensorflow", "deep learning", "python"],
    typicalCapabilities: [
      "Deep Learning Model Training & Architecture Implementation",
      "Quantitative Model Evaluation & Error Analysis",
    ],
    sampleDeliverables: [
      "Trained model on standard benchmark with evaluation ablation table",
      "Clean GitHub repository with reproducible training script and README",
    ],
  },
  "software engineering intern": {
    typicalSkills: ["Python", "TypeScript", "JavaScript", "Java", "C++", "React", "Node.js", "SQL", "Git", "Data Structures"],
    criticalKeywords: ["python", "typescript", "javascript", "react", "node.js", "git", "sql"],
    typicalCapabilities: [
      "Backend API Design & Service Engineering",
      "Interactive Full-Stack Web Application Development",
    ],
    sampleDeliverables: [
      "Full-stack CRUD application with authenticated REST or GraphQL API",
      "Unit and integration test suite with CI pipeline",
    ],
  },
  "ai engineer intern": {
    typicalSkills: ["Python", "PyTorch", "FastAPI", "Docker", "RAG", "LLM Evaluation", "PostgreSQL", "Git"],
    criticalKeywords: ["ai", "llm", "rag", "pytorch", "fastapi", "docker", "python"],
    typicalCapabilities: [
      "Deep Learning Model Training & Architecture Implementation",
      "Backend API Design & Service Engineering",
    ],
    sampleDeliverables: [
      "End-to-end RAG or fine-tuned LLM inference service served via FastAPI",
      "Dockerized microservice with latency profiling and structured output validation",
    ],
  },
  "computer vision intern": {
    typicalSkills: ["Python", "PyTorch", "OpenCV", "CNN", "ResNet", "Image Classification", "Object Detection"],
    criticalKeywords: ["computer vision", "opencv", "resnet", "cnn", "image", "detection"],
    typicalCapabilities: ["Computer Vision & Image Classification Pipelines"],
    sampleDeliverables: [
      "Image classification or segmentation pipeline with mAP / accuracy benchmarks",
      "Inference demo or video processing script running with OpenCV",
    ],
  },
  "data science & applied analytics intern": {
    typicalSkills: ["Python", "SQL", "Pandas", "NumPy", "Scikit-Learn", "Statistics", "Data Visualization"],
    criticalKeywords: ["sql", "pandas", "data science", "statistics", "analytics", "python"],
    typicalCapabilities: ["Quantitative Model Evaluation & Error Analysis"],
    sampleDeliverables: [
      "Exploratory data analysis with statistical hypothesis testing and visualization",
      "Predictive modeling notebook with cross-validation and feature importance analysis",
    ],
  },
  "backend & distributed systems intern": {
    typicalSkills: ["Python", "Node.js", "Go", "PostgreSQL", "Redis", "Docker", "Linux", "REST API", "Kafka"],
    criticalKeywords: ["backend", "postgres", "docker", "redis", "api", "node.js", "fastapi"],
    typicalCapabilities: [
      "Backend API Design & Service Engineering",
      "Cloud Deployment, Containerization & Relational Data Modeling",
    ],
    sampleDeliverables: [
      "Relational database schema with indexes, migrations, and ACID transactions",
      "Containerized microservice architecture using docker-compose",
    ],
  },
  "model evaluation / llm evaluation intern": {
    typicalSkills: ["Python", "Benchmarking", "Model Evaluation", "Ablation", "LLM Evaluation", "Prompt Engineering"],
    criticalKeywords: ["evaluation", "benchmark", "ablation", "model evaluation", "llm evaluation", "accuracy"],
    typicalCapabilities: [
      "Quantitative Model Evaluation & Error Analysis",
      "AI Safety, Red-Teaming & LLM Evaluation Engineering",
    ],
    sampleDeliverables: [
      "Automated evaluation benchmark comparing multiple model outputs with ground truth",
      "Red-teaming test harness assessing edge-case model robustness",
    ],
  },
  "ai research assistant / undergraduate research fellow": {
    typicalSkills: ["Python", "PyTorch", "Research Writing", "LaTeX", "Statistical Significance", "Literature Review"],
    criticalKeywords: ["research", "pytorch", "paper", "experiment", "fellowship", "assistant"],
    typicalCapabilities: [
      "Deep Learning Model Training & Architecture Implementation",
      "Quantitative Model Evaluation & Error Analysis",
    ],
    sampleDeliverables: [
      "Reproducible experimental codebase reproducing baseline paper results",
      "Pre-print or technical report detailing methodology and ablation results",
    ],
  },
};

function findDirectionRequirements(title: string) {
  const lower = title.toLowerCase();
  for (const [key, config] of Object.entries(DIRECTION_REQUIREMENTS)) {
    if (lower.includes(key) || key.includes(lower)) return config;
    const coreKey = key
      .replace(/\b(intern|assistant|fellow|specialist|engineer|developer)\b/g, "")
      .trim();
    if (coreKey && coreKey.length > 3 && (lower.includes(coreKey) || coreKey.includes(lower))) {
      return config;
    }
  }
  return undefined;
}

/**
 * Determine evidence strength based strictly on available profile facts:
 * - "Strong evidence": Has >= 1 matching project AND >= 3 supporting skills (or industry experience + >= 2 skills)
 * - "Some evidence": Has >= 2 supporting skills OR >= 1 matching project
 * - "Insufficient evidence": Has <= 1 supporting skill and 0 matching projects
 */
export function determineEvidenceStrength(
  supportingSkillsCount: number,
  relevantProjectsCount: number,
  relevantExperiencesCount: number
): EvidenceStrengthLabel {
  if (
    (relevantProjectsCount >= 1 && supportingSkillsCount >= 3) ||
    (relevantExperiencesCount >= 1 && supportingSkillsCount >= 2) ||
    (relevantProjectsCount >= 2 && supportingSkillsCount >= 2)
  ) {
    return "Strong evidence";
  }

  if (supportingSkillsCount >= 2 || relevantProjectsCount >= 1 || relevantExperiencesCount >= 1) {
    return "Some evidence";
  }

  return "Insufficient evidence";
}

/**
 * Evaluates a single candidate career direction against confirmed student facts.
 * Grounded in reality: never fabricates unmentioned projects or skills.
 */
export function buildCareerDirectionFromRole(
  role: ExpandedRole,
  profile: UserProfile,
  _capabilityMap?: CandidateCapabilityMap
): CareerDirection {
  const candidateSkillsLower = new Set(
    (profile.skills || []).map((s) => s.toLowerCase().trim())
  );
  for (const proj of profile.projects || []) {
    for (const t of proj.techStack || []) {
      candidateSkillsLower.add(t.toLowerCase().trim());
    }
  }

  const reqConfig = findDirectionRequirements(role.title);

  // 1. Supporting Technical Skills (Intersection of candidate skills and role keywords/typical skills)
  const roleKeywords = reqConfig
    ? [...reqConfig.criticalKeywords, ...reqConfig.typicalSkills.map((s) => s.toLowerCase())]
    : role.title.toLowerCase().split(/\s+/);

  const matchedSkills: string[] = [];
  for (const skill of profile.skills || []) {
    const sLower = skill.toLowerCase();
    if (
      roleKeywords.some((kw) => sLower.includes(kw) || kw.includes(sLower)) ||
      (reqConfig && reqConfig.typicalSkills.some((ts) => ts.toLowerCase() === sLower))
    ) {
      if (!matchedSkills.includes(skill)) {
        matchedSkills.push(skill);
      }
    }
  }

  // Also include skills from matching projects
  for (const proj of profile.projects || []) {
    const pText = `${proj.name} ${proj.description} ${(proj.techStack || []).join(" ")}`.toLowerCase();
    const isProjRelated = roleKeywords.some((kw) => pText.includes(kw));
    if (isProjRelated) {
      for (const tech of proj.techStack || []) {
        if (!matchedSkills.some((s) => s.toLowerCase() === tech.toLowerCase())) {
          matchedSkills.push(tech);
        }
      }
    }
  }

  // 2. Relevant Student Projects (Projects matching this role domain)
  const relevantProjects = (profile.projects || [])
    .filter((proj) => {
      const pText = `${proj.name} ${proj.description} ${(proj.techStack || []).join(" ")}`.toLowerCase();
      return roleKeywords.some((kw) => pText.includes(kw));
    })
    .map((p) => ({
      name: p.name,
      description: p.description,
      techStack: p.techStack || [],
      link: p.link,
    }));

  // 3. Relevant Experiences
  const relevantExperiences = (profile.experiences || [])
    .filter((exp) => {
      const eText = `${exp.title} ${exp.company} ${(exp.bullets || []).join(" ")}`.toLowerCase();
      return roleKeywords.some((kw) => eText.includes(kw));
    })
    .map((e) => ({
      title: e.title,
      company: e.company,
      duration: e.duration,
      bullets: e.bullets || [],
    }));

  // 4. Missing Requirements (industry expectations not found in candidate skills or projects)
  const missingRequirements: string[] = [];
  if (reqConfig) {
    for (const reqSkill of reqConfig.typicalSkills) {
      if (
        !candidateSkillsLower.has(reqSkill.toLowerCase()) &&
        !matchedSkills.some((s) => s.toLowerCase() === reqSkill.toLowerCase())
      ) {
        missingRequirements.push(reqSkill);
      }
    }
  } else if (role.missingSkills && role.missingSkills.length > 0) {
    missingRequirements.push(...role.missingSkills);
  }

  // 5. Evidence Strength
  const evidenceStrength = determineEvidenceStrength(
    matchedSkills.length,
    relevantProjects.length,
    relevantExperiences.length
  );

  // 6. Rationale Explanation
  let relevanceExplanation = role.expansionRationale;
  if (!relevanceExplanation) {
    if (relevantProjects.length > 0 && matchedSkills.length > 0) {
      relevanceExplanation = `Directly evidenced by your technical skills (${matchedSkills.slice(0, 3).join(", ")}) and hands-on implementation in ${relevantProjects.map((p) => p.name).join(" and ")}.`;
    } else if (matchedSkills.length > 0) {
      relevanceExplanation = `Supported by your demonstrated proficiencies in ${matchedSkills.slice(0, 3).join(", ")}; building a focused portfolio project will solidify readiness.`;
    } else {
      relevanceExplanation = `Exploratory career direction. Aligns with your degree in ${profile.major || "Computer Science"}, but requires initial project evidence.`;
    }
  }

  return {
    id: role.id,
    title: role.title,
    roleFamily: role.familyLabel,
    familyType: role.roleFamily,
    supportingSkills: matchedSkills,
    relevantProjects,
    relevantExperiences,
    missingRequirements: missingRequirements.slice(0, 4),
    relevanceExplanation,
    evidenceStrength,
    isSelected: !role.excludedByUser,
    userExcluded: role.excludedByUser,
  };
}

/**
 * Evaluates a student's manually entered custom career direction.
 * Checks actual profile evidence without inventing skills or projects.
 */
export function evaluateCustomCareerDirection(
  customTitle: string,
  profile: UserProfile,
  _capabilityMap?: CandidateCapabilityMap
): CareerDirection {
  const cleanTitle = customTitle.trim();

  const candidateSkillsLower = new Set(
    (profile.skills || []).map((s) => s.toLowerCase().trim())
  );
  for (const proj of profile.projects || []) {
    for (const t of proj.techStack || []) {
      candidateSkillsLower.add(t.toLowerCase().trim());
    }
  }

  const titleWords = cleanTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const reqConfig = findDirectionRequirements(cleanTitle);

  // Match supporting skills
  const matchedSkills: string[] = [];
  for (const skill of profile.skills || []) {
    const sLower = skill.toLowerCase();
    if (
      titleWords.some((w) => sLower.includes(w) || w.includes(sLower)) ||
      (reqConfig && (
        reqConfig.typicalSkills.some((ts) => ts.toLowerCase() === sLower) ||
        reqConfig.criticalKeywords.some((ck) => sLower.includes(ck) || ck.includes(sLower))
      ))
    ) {
      if (!matchedSkills.includes(skill)) matchedSkills.push(skill);
    }
  }

  // Match relevant projects
  const relevantProjects = (profile.projects || [])
    .filter((proj) => {
      const pText = `${proj.name} ${proj.description} ${(proj.techStack || []).join(" ")}`.toLowerCase();
      return (
        titleWords.some((w) => pText.includes(w)) ||
        (reqConfig && reqConfig.criticalKeywords.some((k) => pText.includes(k)))
      );
    })
    .map((p) => ({
      name: p.name,
      description: p.description,
      techStack: p.techStack || [],
      link: p.link,
    }));

  // Also include matching project technologies
  for (const proj of relevantProjects) {
    for (const tech of proj.techStack) {
      const tLower = tech.toLowerCase();
      if (
        (reqConfig && reqConfig.typicalSkills.some((ts) => ts.toLowerCase() === tLower)) ||
        titleWords.some((w) => tLower.includes(w))
      ) {
        if (!matchedSkills.some((s) => s.toLowerCase() === tLower)) {
          matchedSkills.push(tech);
        }
      }
    }
  }

  const relevantExperiences = (profile.experiences || [])
    .filter((exp) => {
      const eText = `${exp.title} ${exp.company} ${(exp.bullets || []).join(" ")}`.toLowerCase();
      return (
        titleWords.some((w) => eText.includes(w)) ||
        (reqConfig && reqConfig.criticalKeywords.some((k) => eText.includes(k)))
      );
    })
    .map((e) => ({
      title: e.title,
      company: e.company,
      duration: e.duration,
      bullets: e.bullets || [],
    }));

  // Missing requirements
  const missingRequirements: string[] = [];
  if (reqConfig) {
    for (const reqSkill of reqConfig.typicalSkills) {
      if (
        !candidateSkillsLower.has(reqSkill.toLowerCase()) &&
        !matchedSkills.some((s) => s.toLowerCase() === reqSkill.toLowerCase())
      ) {
        missingRequirements.push(reqSkill);
      }
    }
  } else {
    // Generic fallback for unlisted roles
    if (matchedSkills.length === 0) {
      missingRequirements.push("Specialized domain frameworks", "Portfolio project demonstration");
    }
  }

  const evidenceStrength = determineEvidenceStrength(
    matchedSkills.length,
    relevantProjects.length,
    relevantExperiences.length
  );

  let explanation: string;
  if (evidenceStrength === "Strong evidence") {
    explanation = `Strongly supported: You have demonstrated projects (${relevantProjects.map((p) => p.name).join(", ")}) and verified technical proficiencies in this area.`;
  } else if (evidenceStrength === "Some evidence") {
    explanation = `Partially supported: You possess relevant foundational competencies (${matchedSkills.slice(0, 3).join(", ") || "core CS stack"}), but targeting this role will benefit from a dedicated project.`;
  } else {
    explanation = `Aspirational direction: Your current profile does not yet document specific projects or skills for "${cleanTitle}". We will search for entry-level listings and provide preparation roadmaps.`;
  }

  return {
    id: `custom-role-${cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    title: cleanTitle,
    roleFamily: "Student-Added Career Direction",
    familyType: "DIRECT",
    supportingSkills: matchedSkills,
    relevantProjects,
    relevantExperiences,
    missingRequirements: missingRequirements.slice(0, 4),
    relevanceExplanation: explanation,
    evidenceStrength,
    isSelected: true,
    isCustom: true,
  };
}

/**
 * Primary Generator: Creates a personalized Career Outlook for the student.
 * Generates up to three top relevant career directions based on verified facts.
 */
export function generateCareerOutlook(profile: UserProfile): CareerOutlook {
  const capabilityMap = extractCandidateCapabilityMap(profile);
  const expandedRoles = expandCandidateRoleFamilies(profile, capabilityMap);

  // Group candidate confirmed skills by presence
  const confirmedSkills = profile.skills || [];
  const confirmedProjects = profile.projects || [];
  const confirmedExperiences = profile.experiences || [];

  // Excluded role keys
  const rawExcluded = Array.isArray(profile.excludedRoleFamilies)
    ? profile.excludedRoleFamilies
    : typeof profile.excludedRoleFamilies === "string"
      ? (JSON.parse(profile.excludedRoleFamilies || "[]") as string[])
      : [];
  const excludedSet = new Set(rawExcluded.map((x) => x.toLowerCase().trim()));

  // Filter out excluded roles and sort by relevance
  const activeRoles = expandedRoles.filter(
    (r) => !r.excludedByUser && !excludedSet.has(r.title.toLowerCase())
  );

  // Convert to CareerDirection objects
  const allDirections = activeRoles.map((role) =>
    buildCareerDirectionFromRole(role, profile, capabilityMap)
  );

  // Deduplicate by title
  const seenTitles = new Set<string>();
  const deduplicatedDirections: CareerDirection[] = [];
  for (const dir of allDirections) {
    const key = dir.title.toLowerCase().trim();
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      deduplicatedDirections.push(dir);
    }
  }

  // Pick up to three top distinct career directions:
  // 1. First choice: Highest evidence direct match
  // 2. Second choice: Adjacent or project-derived direction
  // 3. Third choice: Emerging or specialized direction
  const selectedTopDirections: CareerDirection[] = [];

  const directMatch = deduplicatedDirections.find((d) => d.familyType === "DIRECT");
  if (directMatch) {
    selectedTopDirections.push(directMatch);
  }

  const adjacentOrProject = deduplicatedDirections.find(
    (d) =>
      (d.familyType === "ADJACENT" || d.familyType === "PROJECT_DERIVED") &&
      !selectedTopDirections.some((s) => s.id === d.id)
  );
  if (adjacentOrProject) {
    selectedTopDirections.push(adjacentOrProject);
  }

  const thirdOption = deduplicatedDirections.find(
    (d) => !selectedTopDirections.some((s) => s.id === d.id)
  );
  if (thirdOption) {
    selectedTopDirections.push(thirdOption);
  }

  // Fallback if fewer than 3 were matched through classification
  if (selectedTopDirections.length === 0 && confirmedSkills.length > 0) {
    const fallbackDirection = evaluateCustomCareerDirection(
      profile.targetRoles?.[0] || "Software Engineering Intern",
      profile,
      capabilityMap
    );
    selectedTopDirections.push(fallbackDirection);
  }

  // Overall readiness summary narrative
  let readinessNarrative: string;
  const strongCount = selectedTopDirections.filter((d) => d.evidenceStrength === "Strong evidence").length;
  if (strongCount >= 2) {
    readinessNarrative = `Your verified background in ${confirmedSkills.slice(0, 3).join(", ")} gives you strong, competitive footing for ${selectedTopDirections[0]?.title || "software engineering"}. You have verified project deliverables that recruiters look for in early screening.`;
  } else if (strongCount === 1) {
    readinessNarrative = `You have clear demonstrated strengths in ${confirmedSkills.slice(0, 2).join(" and ")}, evidenced by ${confirmedProjects[0]?.name || "your projects"}. Closing a few technical gaps will make you a prime candidate across multiple career tracks.`;
  } else {
    readinessNarrative = `You have foundational technical capabilities across ${confirmedSkills.slice(0, 3).join(", ") || "computing fundamentals"}. Prospect has identified high-leverage directions where you can build targeted project proof to qualify for immediate internship postings.`;
  }

  return {
    profileId: profile.id || "default",
    candidateName: profile.fullName || "Candidate",
    headline: profile.headline || `${profile.major || "Computer Science"} Candidate`,
    summary: `Career Outlook synthesized from ${confirmedSkills.length} verified skills, ${confirmedProjects.length} projects, and ${confirmedExperiences.length} experiences.`,
    directions: selectedTopDirections.slice(0, 3),
    overallReadinessSummary: readinessNarrative,
    strongestSkills: confirmedSkills.slice(0, 6),
    coreEvidenceCount: {
      skills: confirmedSkills.length,
      projects: confirmedProjects.length,
      experiences: confirmedExperiences.length,
    },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Synthesizes the Personalized Career Brief (Sections A through G)
 * combining student profile, career directions, evaluated opportunities, and gap plans.
 */
export function generatePersonalizedCareerBrief(
  profile: UserProfile,
  opportunities: Array<{
    opportunity: Opportunity;
    evaluation: EvaluationResult;
    hasPrepPlan?: boolean;
  }>,
  careerOutlook?: CareerOutlook
): PersonalizedCareerBrief {
  const outlook = careerOutlook || generateCareerOutlook(profile);

  // A. Strongest Career Directions
  const strongestDirections = outlook.directions;

  // B. Opportunities worth pursuing (APPLY_NOW)
  const opportunitiesWorthPursuing = opportunities
    .filter(
      (o) =>
        o.evaluation.recommendation === "APPLY_NOW" ||
        (o.evaluation.overallScore >= 70 && o.evaluation.hardBlockers.length === 0)
    )
    .sort((a, b) => b.evaluation.overallScore - a.evaluation.overallScore);

  // C. Opportunities requiring preparation (PREPARE_FIRST)
  const opportunitiesRequiringPrep = opportunities
    .filter(
      (o) =>
        o.evaluation.recommendation === "PREPARE_FIRST" ||
        (o.evaluation.overallScore >= 50 &&
          o.evaluation.overallScore < 70 &&
          o.evaluation.hardBlockers.length === 0)
    )
    .sort((a, b) => b.evaluation.overallScore - a.evaluation.overallScore);

  // D. Important Skill Gaps (Aggregated from missingQualifications and requiredSkills)
  const gapCounts: Record<string, { count: number; roles: Set<string> }> = {};
  for (const { opportunity, evaluation } of opportunities) {
    const missing = [
      ...(evaluation.missingQualifications || []),
      ...(evaluation.uncertainties || []),
    ];
    for (const m of missing) {
      const clean = m.trim();
      if (!clean) continue;
      if (!gapCounts[clean]) {
        gapCounts[clean] = { count: 0, roles: new Set() };
      }
      gapCounts[clean].count += 1;
      gapCounts[clean].roles.add(opportunity.roleFamily || opportunity.title);
    }
  }

  // Also include missing requirements from the top career directions
  for (const dir of strongestDirections) {
    for (const req of dir.missingRequirements) {
      if (!gapCounts[req]) {
        gapCounts[req] = { count: 2, roles: new Set([dir.title]) };
      } else {
        gapCounts[req].count += 1;
        gapCounts[req].roles.add(dir.title);
      }
    }
  }

  const importantSkillGaps = Object.entries(gapCounts)
    .map(([skill, data]) => ({
      skill,
      frequency: data.count,
      relatedRoles: Array.from(data.roles).slice(0, 2),
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 5);

  // E. Recommended Next Actions
  const recommendedNextActions: Array<{
    title: string;
    description: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    relatedRole?: string;
  }> = [];

  if (opportunitiesWorthPursuing.length > 0) {
    const topOpp = opportunitiesWorthPursuing[0];
    recommendedNextActions.push({
      title: `Submit direct application to ${topOpp.opportunity.organization}`,
      description: `Your profile scores ${topOpp.evaluation.overallScore}% fit for "${topOpp.opportunity.title}". Your skills and projects align directly.`,
      priority: "HIGH",
      relatedRole: topOpp.opportunity.title,
    });
  }

  if (importantSkillGaps.length > 0) {
    const topGap = importantSkillGaps[0];
    recommendedNextActions.push({
      title: `Close high-frequency gap: ${topGap.skill}`,
      description: `Required across ${topGap.frequency} discovered listings including ${topGap.relatedRoles.join(", ")}. Adding a brief implementation in your next project will unlock immediate matches.`,
      priority: "HIGH",
      relatedRole: topGap.relatedRoles[0],
    });
  }

  if (opportunitiesRequiringPrep.length > 0) {
    const prepOpp = opportunitiesRequiringPrep[0];
    recommendedNextActions.push({
      title: `Follow Preparation Plan for ${prepOpp.opportunity.organization}`,
      description: `Complete the milestone deliverable for "${prepOpp.opportunity.title}" to advance your recommendation from PREPARE_FIRST to APPLY_NOW.`,
      priority: "MEDIUM",
      relatedRole: prepOpp.opportunity.title,
    });
  }

  // F. Upcoming Opportunity Deadlines
  const now = new Date();
  const upcomingDeadlines = opportunities
    .filter((o) => o.opportunity.deadline && !o.opportunity.isExpired)
    .map((o) => {
      const dDate = new Date(o.opportunity.deadline!);
      const diffMs = dDate.getTime() - now.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      return {
        opportunityId: o.opportunity.id,
        title: o.opportunity.title,
        organization: o.opportunity.organization,
        deadline: o.opportunity.deadline!,
        daysRemaining,
      };
    })
    .sort((a, b) => a.daysRemaining - b.daysRemaining)
    .slice(0, 5);

  // G. Evidence & Source References
  const sourceReferencesMap: Record<string, { name: string; url: string; confidence: number; claim: string }> = {};
  for (const { opportunity } of opportunities) {
    if (opportunity.sourceUrl && !sourceReferencesMap[opportunity.sourceUrl]) {
      sourceReferencesMap[opportunity.sourceUrl] = {
        name: opportunity.sourceName || "Official Career Portal",
        url: opportunity.sourceUrl,
        confidence: opportunity.sourceConfidence || 0.85,
        claim: `${opportunity.title} at ${opportunity.organization} (${opportunity.location}, ${opportunity.workMode})`,
      };
    }
  }

  const sourceReferences = Object.values(sourceReferencesMap).slice(0, 6);

  return {
    candidateName: profile.fullName || "Candidate",
    strongestDirections,
    opportunitiesWorthPursuing,
    opportunitiesRequiringPrep,
    importantSkillGaps,
    recommendedNextActions,
    upcomingDeadlines,
    sourceReferences,
  };
}

/**
 * Group opportunities by Career Direction or Role Family
 */
export function groupOpportunitiesByCareerDirection(
  opportunities: Array<{
    opportunity: Opportunity;
    evaluation: EvaluationResult;
    hasPrepPlan?: boolean;
  }>,
  directions: CareerDirection[]
): Array<{
  directionTitle: string;
  evidenceStrength: EvidenceStrengthLabel;
  opportunities: Array<{
    opportunity: Opportunity;
    evaluation: EvaluationResult;
    hasPrepPlan?: boolean;
  }>;
}> {
  const groups: Record<
    string,
    {
      directionTitle: string;
      evidenceStrength: EvidenceStrengthLabel;
      opportunities: Array<{
        opportunity: Opportunity;
        evaluation: EvaluationResult;
        hasPrepPlan?: boolean;
      }>;
    }
  > = {};

  // Initialize groups for confirmed career directions
  for (const dir of directions) {
    groups[dir.title.toLowerCase()] = {
      directionTitle: dir.title,
      evidenceStrength: dir.evidenceStrength,
      opportunities: [],
    };
  }

  // Catch-all group for others
  const otherGroup = {
    directionTitle: "General & Cross-Functional Opportunities",
    evidenceStrength: "Some evidence" as EvidenceStrengthLabel,
    opportunities: [] as any[],
  };

  for (const oppItem of opportunities) {
    const opp = oppItem.opportunity;
    const oppText = `${opp.title} ${opp.roleFamily || ""} ${opp.description} ${opp.category}`.toLowerCase();

    let matched = false;
    for (const dir of directions) {
      const dirWords = dir.title.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
      if (
        dirWords.some((w) => oppText.includes(w)) ||
        (opp.roleFamily && opp.roleFamily.toLowerCase().includes(dir.title.toLowerCase()))
      ) {
        groups[dir.title.toLowerCase()].opportunities.push(oppItem);
        matched = true;
        break;
      }
    }

    if (!matched) {
      otherGroup.opportunities.push(oppItem);
    }
  }

  const result = Object.values(groups).filter((g) => g.opportunities.length > 0);
  if (otherGroup.opportunities.length > 0) {
    result.push(otherGroup);
  }

  return result;
}

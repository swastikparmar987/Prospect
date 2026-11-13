import {
  CandidateCapabilityMap,
  ExpandedRole,
  RoleFamilyType,
  UserProfile,
} from "../types";
import { extractCandidateCapabilityMap } from "./candidate-intelligence";

interface RoleExpansionTemplate {
  id: string;
  title: string;
  roleFamily: RoleFamilyType;
  familyLabel: string;
  triggerSkillsOrKeywords: string[];
  minMatches: number;
  requiredCapabilities: string[];
  typicalSkills: string[];
  rationaleTemplate: (matched: string[], projects: string[]) => string;
  baseRelevance: number;
  baseConfidence: number;
  uncertaintyNote: string;
}

const ROLE_EXPANSION_TEMPLATES: RoleExpansionTemplate[] = [
  // A. DIRECT ROLES
  {
    id: "role-direct-ml-intern",
    title: "Machine Learning Intern",
    roleFamily: "DIRECT",
    familyLabel: "Direct Roles (Core Competency Match)",
    triggerSkillsOrKeywords: ["python", "machine learning", "pytorch", "tensorflow", "scikit-learn"],
    minMatches: 2,
    requiredCapabilities: [
      "Deep Learning Model Training & Architecture Implementation",
      "Quantitative Model Evaluation & Error Analysis",
    ],
    typicalSkills: ["Python", "PyTorch", "Machine Learning", "SQL", "Git"],
    rationaleTemplate: (matched, projects) =>
      `Directly supported by core ML stack (${matched.join(", ")})${
        projects.length > 0 ? ` and demonstrated in ${projects.join(", ")}` : ""
      }.`,
    baseRelevance: 94,
    baseConfidence: 0.9,
    uncertaintyNote: "Some teams require publication track records or graduate standing; check degree level per posting.",
  },
  {
    id: "role-direct-swe-intern",
    title: "Software Engineering Intern",
    roleFamily: "DIRECT",
    familyLabel: "Direct Roles (Core Competency Match)",
    triggerSkillsOrKeywords: ["python", "typescript", "javascript", "java", "react", "node.js", "git", "sql"],
    minMatches: 2,
    requiredCapabilities: [
      "Backend API Design & Service Engineering",
      "Interactive Full-Stack Web Application Development",
    ],
    typicalSkills: ["TypeScript", "Python", "React", "Git", "SQL"],
    rationaleTemplate: (matched, projects) =>
      `Directly supported by software engineering fundamentals (${matched.join(", ")})${
        projects.length > 0 ? ` across ${projects.join(", ")}` : ""
      }.`,
    baseRelevance: 92,
    baseConfidence: 0.9,
    uncertaintyNote: "Interview loops typically emphasize algorithmic problem-solving alongside project depth.",
  },

  // B. ADJACENT ROLES
  {
    id: "role-adjacent-ai-engineer-intern",
    title: "AI Engineer Intern",
    roleFamily: "ADJACENT",
    familyLabel: "Adjacent Roles (Overlapping Capabilities)",
    triggerSkillsOrKeywords: ["python", "pytorch", "machine learning", "typescript", "fastapi", "api", "llm", "rag"],
    minMatches: 2,
    requiredCapabilities: [
      "Deep Learning Model Training & Architecture Implementation",
      "Backend API Design & Service Engineering",
    ],
    typicalSkills: ["Python", "TypeScript", "API Design", "Machine Learning", "Docker"],
    rationaleTemplate: (matched) =>
      `Combines your ML/Python foundation with software API engineering (${matched.join(", ")}) to ship applied AI systems.`,
    baseRelevance: 88,
    baseConfidence: 0.84,
    uncertaintyNote: "Requires bridging model experimentation with production API latency and structured output reliability.",
  },
  {
    id: "role-adjacent-data-science-intern",
    title: "Data Science & Applied Analytics Intern",
    roleFamily: "ADJACENT",
    familyLabel: "Adjacent Roles (Overlapping Capabilities)",
    triggerSkillsOrKeywords: ["python", "sql", "machine learning", "pandas", "model evaluation", "statistics"],
    minMatches: 2,
    requiredCapabilities: ["Quantitative Model Evaluation & Error Analysis"],
    typicalSkills: ["Python", "SQL", "Machine Learning", "Statistical Analysis"],
    rationaleTemplate: (matched) =>
      `Overlaps with your quantitative modeling and evaluation skills (${matched.join(", ")}).`,
    baseRelevance: 82,
    baseConfidence: 0.8,
    uncertaintyNote: "Product data science roles may emphasize A/B experimentation and SQL business metrics over deep learning.",
  },

  // C. PROJECT-DERIVED ROLES
  {
    id: "role-project-cv-intern",
    title: "Computer Vision Intern",
    roleFamily: "PROJECT_DERIVED",
    familyLabel: "Project-Derived Roles (Demonstrated Project Tasks)",
    triggerSkillsOrKeywords: [
      "resnet",
      "resnet50",
      "image classification",
      "computer vision",
      "opencv",
      "object detection",
      "multimodal",
      "cnn",
    ],
    minMatches: 1,
    requiredCapabilities: ["Computer Vision & Image Classification Pipelines"],
    typicalSkills: ["Python", "PyTorch", "Computer Vision", "Model Evaluation", "Docker"],
    rationaleTemplate: (matched, projects) =>
      `Inferred directly from hands-on visual modeling responsibilities (${matched.join(", ")}) demonstrated in ${
        projects.length > 0 ? projects.join(", ") : "your technical projects"
      }.`,
    baseRelevance: 90,
    baseConfidence: 0.86,
    uncertaintyNote: "Derived from project evidence rather than prior industry employment; highlight benchmark metrics in your application.",
  },
  {
    id: "role-project-backend-systems-intern",
    title: "Backend & Distributed Systems Intern",
    roleFamily: "PROJECT_DERIVED",
    familyLabel: "Project-Derived Roles (Demonstrated Project Tasks)",
    triggerSkillsOrKeywords: [
      "fastapi",
      "postgresql",
      "docker",
      "node.js",
      "distributed",
      "microservice",
      "redis",
      "graphql",
      "linux",
    ],
    minMatches: 2,
    requiredCapabilities: [
      "Backend API Design & Service Engineering",
      "Cloud Deployment, Containerization & Relational Data Modeling",
    ],
    typicalSkills: ["Python", "TypeScript", "PostgreSQL", "Docker", "Linux"],
    rationaleTemplate: (matched, projects) =>
      `Derived from backend API, database, and containerization tasks (${matched.join(", ")}) built in ${
        projects.length > 0 ? projects.join(", ") : "your engineering projects"
      }.`,
    baseRelevance: 85,
    baseConfidence: 0.82,
    uncertaintyNote: "Systems teams may probe concurrency, container networking, and Linux fundamentals.",
  },

  // D. EMERGING / SPECIALIZED ROLES (Only generated when candidate evidence supports them)
  {
    id: "role-emerging-model-eval-intern",
    title: "Model Evaluation / LLM Evaluation Intern",
    roleFamily: "EMERGING_SPECIALIZED",
    familyLabel: "Emerging & Specialized Roles",
    triggerSkillsOrKeywords: [
      "model evaluation",
      "llm evaluation",
      "benchmark",
      "ablation",
      "precision",
      "recall",
      "f1",
      "accuracy",
      "validation",
      "red-teaming",
      "evaluation",
    ],
    minMatches: 1,
    requiredCapabilities: [
      "Quantitative Model Evaluation & Error Analysis",
      "AI Safety, Red-Teaming & LLM Evaluation Engineering",
    ],
    typicalSkills: ["Python", "Machine Learning", "Model Evaluation", "TypeScript", "Benchmarking"],
    rationaleTemplate: (matched, projects) =>
      `Supported by your demonstrated model evaluation/validation work (${matched.join(", ")})${
        projects.length > 0 ? ` in ${projects.join(", ")}` : ""
      }. AI labs actively hire interns to build rigorous evaluation harnesses.`,
    baseRelevance: 89,
    baseConfidence: 0.83,
    uncertaintyNote: "Emerging role category; titles vary across labs (e.g., Evals Engineer Intern, AI Safety & Evaluation Intern).",
  },
  {
    id: "role-emerging-ai-research-assistant",
    title: "AI Research Assistant / Undergraduate Research Fellow",
    roleFamily: "EMERGING_SPECIALIZED",
    familyLabel: "Emerging & Specialized Roles",
    triggerSkillsOrKeywords: [
      "pytorch",
      "machine learning",
      "resnet",
      "computer vision",
      "research",
      "model evaluation",
      "deep learning",
      "nlp",
    ],
    minMatches: 2,
    requiredCapabilities: [
      "Deep Learning Model Training & Architecture Implementation",
      "Quantitative Model Evaluation & Error Analysis",
    ],
    typicalSkills: ["Python", "PyTorch", "Machine Learning", "Research Writing"],
    rationaleTemplate: (matched, projects) =>
      `Supported by empirical ML experimentation (${matched.join(", ")})${
        projects.length > 0 ? ` in ${projects.join(", ")}` : ""
      }, matching university lab fellowships and NSF REU / research assistantships.`,
    baseRelevance: 87,
    baseConfidence: 0.85,
    uncertaintyNote: "Academic fellowships often check GPA thresholds and enrollment status.",
  },
];

/**
 * Generates structured Role Families (Direct, Adjacent, Project-Derived, Emerging/Specialized)
 * based on what the candidate can actually do.
 * Never invents unsupported roles solely to inflate result volume.
 */
export function expandCandidateRoleFamilies(
  profile: UserProfile,
  existingCapabilityMap?: CandidateCapabilityMap
): ExpandedRole[] {
  const capabilityMap =
    existingCapabilityMap || extractCandidateCapabilityMap(profile);

  const rawExcluded = Array.isArray(profile.excludedRoleFamilies)
    ? profile.excludedRoleFamilies
    : typeof profile.excludedRoleFamilies === "string"
      ? (JSON.parse(profile.excludedRoleFamilies || "[]") as string[])
      : [];
  const excludedSet = new Set(
    rawExcluded.map((x) => x.toLowerCase().trim())
  );

  const candidateSkillsLower = new Set(
    (profile.skills || []).map((s) => s.toLowerCase().trim())
  );
  for (const proj of profile.projects || []) {
    for (const tech of proj.techStack || []) {
      candidateSkillsLower.add(tech.toLowerCase().trim());
    }
  }

  const fullEvidenceCorpus = [
    ...(profile.skills || []),
    ...(profile.targetRoles || []),
    ...(profile.projects || []).map(
      (p) => `${p.name} ${p.description} ${(p.techStack || []).join(" ")}`
    ),
    ...(profile.experiences || []).map(
      (e) => `${e.title} ${e.company} ${(e.bullets || []).join(" ")}`
    ),
    profile.resumeText || "",
  ]
    .join(" \n ")
    .toLowerCase();

  const expandedRoles: ExpandedRole[] = [];
  const seenTitles = new Set<string>();

  // 1. Honor explicit user-entered target roles first as DIRECT roles
  for (const explicitRole of profile.targetRoles || []) {
    const cleanTitle = explicitRole.trim();
    if (!cleanTitle) continue;
    const key = cleanTitle.toLowerCase();
    if (seenTitles.has(key)) continue;
    seenTitles.add(key);

    const supportingEvidence: string[] = [
      `Explicitly targeted in candidate profile ("${cleanTitle}")`,
    ];
    for (const cap of capabilityMap.demonstratedCapabilities.slice(0, 2)) {
      supportingEvidence.push(
        `${cap.capability} (${cap.technologies.join(", ")})`
      );
    }

    const isExcluded =
      excludedSet.has(key) || excludedSet.has("direct");

    expandedRoles.push({
      id: `role-explicit-${key.replace(/[^a-z0-9]+/g, "-")}`,
      title: cleanTitle,
      roleFamily: "DIRECT",
      familyLabel: "Direct Roles (Core Competency Match)",
      supportingEvidence,
      requiredCapabilities: capabilityMap.demonstratedCapabilities
        .slice(0, 2)
        .map((c) => c.capability),
      missingSkills: [],
      expansionRationale: `Explicit candidate target role backed by ${
        (profile.skills || []).slice(0, 4).join(", ") || "profile skills"
      }.`,
      relevanceEstimate: 95,
      confidence: 0.92,
      uncertainty: "Direct target role; specific team stack requirements vary by employer.",
      excludedByUser: isExcluded,
    });
  }

  // 2. Evaluate capability-driven role expansion templates
  for (const tpl of ROLE_EXPANSION_TEMPLATES) {
    const titleKey = tpl.title.toLowerCase();
    if (seenTitles.has(titleKey)) continue;

    const matchedTriggers = tpl.triggerSkillsOrKeywords.filter((kw) =>
      fullEvidenceCorpus.includes(kw.toLowerCase())
    );

    if (matchedTriggers.length < tpl.minMatches) {
      continue; // Do not invent roles when candidate evidence does not support them!
    }

    seenTitles.add(titleKey);

    const supportingProjects = (profile.projects || [])
      .filter((p) => {
        const pText = `${p.name} ${p.description} ${(p.techStack || []).join(" ")}`.toLowerCase();
        return matchedTriggers.some((kw) => pText.includes(kw));
      })
      .map((p) => p.name);

    const supportingExperiences = (profile.experiences || [])
      .filter((e) => {
        const eText = `${e.title} ${e.company} ${(e.bullets || []).join(" ")}`.toLowerCase();
        return matchedTriggers.some((kw) => eText.includes(kw));
      })
      .map((e) => `${e.title} at ${e.company}`);

    const supportingEvidence: string[] = [];
    if (supportingProjects.length > 0) {
      supportingEvidence.push(`Demonstrated in project(s): ${supportingProjects.join(", ")}`);
    }
    if (supportingExperiences.length > 0) {
      supportingEvidence.push(`Demonstrated in experience: ${supportingExperiences.join(", ")}`);
    }
    supportingEvidence.push(`Matched technical evidence: ${matchedTriggers.join(", ")}`);

    const missingSkills = tpl.typicalSkills.filter(
      (sk) => !candidateSkillsLower.has(sk.toLowerCase()) && !fullEvidenceCorpus.includes(sk.toLowerCase())
    );

    const isExcluded =
      excludedSet.has(tpl.id.toLowerCase()) ||
      excludedSet.has(titleKey) ||
      excludedSet.has(tpl.roleFamily.toLowerCase());

    expandedRoles.push({
      id: tpl.id,
      title: tpl.title,
      roleFamily: tpl.roleFamily,
      familyLabel: tpl.familyLabel,
      supportingEvidence,
      requiredCapabilities: tpl.requiredCapabilities,
      missingSkills,
      expansionRationale: tpl.rationaleTemplate(matchedTriggers, supportingProjects),
      relevanceEstimate: Math.max(
        60,
        tpl.baseRelevance - missingSkills.length * 4
      ),
      confidence: Number(
        Math.max(0.55, tpl.baseConfidence - missingSkills.length * 0.04).toFixed(2)
      ),
      uncertainty: tpl.uncertaintyNote,
      excludedByUser: isExcluded,
    });
  }

  return expandedRoles.sort((a, b) => b.relevanceEstimate - a.relevanceEstimate);
}

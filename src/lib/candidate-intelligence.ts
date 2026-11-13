import {
  CandidateCapabilityMap,
  DemonstratedCapability,
  MissingProfileDetailPrompt,
  ProjectResponsibility,
  ProvenanceCode,
  SkillCategory,
  UserProfile,
} from "../types";

const SKILL_CATEGORY_RULES: Array<{ category: SkillCategory; keywords: string[] }> = [
  {
    category: "Languages",
    keywords: [
      "python",
      "typescript",
      "javascript",
      "java",
      "c++",
      "c",
      "rust",
      "go",
      "golang",
      "sql",
      "bash",
      "r",
      "scala",
    ],
  },
  {
    category: "ML / AI",
    keywords: [
      "pytorch",
      "tensorflow",
      "machine learning",
      "deep learning",
      "computer vision",
      "nlp",
      "llm",
      "resnet",
      "resnet50",
      "transformers",
      "scikit-learn",
      "huggingface",
      "opencv",
      "rag",
      "fine-tuning",
      "ai",
    ],
  },
  {
    category: "Research & Evaluation",
    keywords: [
      "model evaluation",
      "llm evaluation",
      "benchmarking",
      "ablation",
      "research",
      "experiment tracking",
      "weights & biases",
      "red-teaming",
      "statistical analysis",
      "data annotation",
    ],
  },
  {
    category: "Backend & Systems",
    keywords: [
      "node.js",
      "fastapi",
      "django",
      "flask",
      "express",
      "graphql",
      "rest api",
      "grpc",
      "microservices",
      "distributed systems",
      "linux",
      "redis",
      "kafka",
    ],
  },
  {
    category: "Frontend & Product",
    keywords: [
      "react",
      "next.js",
      "tailwind",
      "html",
      "css",
      "ui/ux",
      "svelte",
      "vue",
      "d3.js",
    ],
  },
  {
    category: "Data & Cloud",
    keywords: [
      "postgresql",
      "mongodb",
      "docker",
      "kubernetes",
      "aws",
      "gcp",
      "azure",
      "spark",
      "airflow",
      "git",
      "ci/cd",
      "pandas",
      "numpy",
    ],
  },
];

interface TechCapabilityRule {
  triggers: string[];
  capability: string;
  category: SkillCategory;
  description: string;
  inferredAdjacent?: {
    capability: string;
    category: SkillCategory;
    description: string;
  };
}

const TECH_TO_CAPABILITY_RULES: TechCapabilityRule[] = [
  {
    triggers: ["pytorch", "tensorflow", "deep learning", "resnet", "resnet50", "transformers"],
    capability: "Deep Learning Model Training & Architecture Implementation",
    category: "ML / AI",
    description: "Implementing, training, and tuning neural network architectures using modern deep learning frameworks.",
    inferredAdjacent: {
      capability: "MLOps & Model Serving Pipelines",
      category: "ML / AI",
      description: "Adjacent capability to package trained models into reproducible inference services and evaluation harnesses.",
    },
  },
  {
    triggers: ["computer vision", "resnet", "resnet50", "opencv", "image classification", "object detection", "vit"],
    capability: "Computer Vision & Image Classification Pipelines",
    category: "ML / AI",
    description: "Building visual recognition, dataset preprocessing, and image classification/detection workflows.",
    inferredAdjacent: {
      capability: "Multimodal Data Curation & Perception Benchmarking",
      category: "Research & Evaluation",
      description: "Adjacent capability to evaluate multimodal/vision models on edge cases and dataset quality.",
    },
  },
  {
    triggers: ["model evaluation", "llm evaluation", "benchmark", "ablation", "f1", "accuracy", "roc", "eval"],
    capability: "Quantitative Model Evaluation & Error Analysis",
    category: "Research & Evaluation",
    description: "Designing validation splits, measuring precision/recall/latency metrics, and diagnosing model failure modes.",
    inferredAdjacent: {
      capability: "AI Safety, Red-Teaming & LLM Evaluation Engineering",
      category: "Research & Evaluation",
      description: "Adjacent capability to build automated evaluation suites and truthfulness/robustness benchmarks for LLMs.",
    },
  },
  {
    triggers: ["llm", "rag", "langchain", "openai", "anthropic", "prompt", "embeddings", "agent"],
    capability: "Applied LLM Workflows & Retrieval-Augmented Generation",
    category: "ML / AI",
    description: "Integrating language models, vector retrieval, structured outputs, and tool-use pipelines.",
    inferredAdjacent: {
      capability: "Agentic Systems Reliability & Evaluation",
      category: "Research & Evaluation",
      description: "Adjacent capability to test and monitor multi-step AI agent workflows in production.",
    },
  },
  {
    triggers: ["fastapi", "node.js", "express", "django", "flask", "rest", "graphql", "api", "backend"],
    capability: "Backend API Design & Service Engineering",
    category: "Backend & Systems",
    description: "Designing and implementing HTTP/GraphQL APIs, authentication, and server-side business logic.",
    inferredAdjacent: {
      capability: "Distributed Systems & High-Throughput Data Services",
      category: "Backend & Systems",
      description: "Adjacent capability to scale backend services with caching, queues, and asynchronous workers.",
    },
  },
  {
    triggers: ["react", "next.js", "typescript", "tailwind", "frontend"],
    capability: "Interactive Full-Stack Web Application Development",
    category: "Frontend & Product",
    description: "Building type-safe, responsive user interfaces and full-stack product workflows.",
    inferredAdjacent: {
      capability: "Developer Tools & AI Product Engineering",
      category: "Frontend & Product",
      description: "Adjacent capability to build interactive dashboards, observability UIs, and AI-native product experiences.",
    },
  },
  {
    triggers: ["docker", "kubernetes", "aws", "gcp", "ci/cd", "linux", "postgresql", "sql"],
    capability: "Cloud Deployment, Containerization & Relational Data Modeling",
    category: "Data & Cloud",
    description: "Structuring relational schemas, writing SQL queries, and packaging services with Docker/cloud tooling.",
  },
];

const RESPONSIBILITY_ACTION_PATTERNS: Array<{
  pattern: RegExp;
  label: string;
}> = [
  {
    pattern: /\b(train(?:ed)?|fine-tun(?:ed|ing)|implemented|built)\b.*?\b(model|resnet\w*|classifier|neural|network|cnn|transformer)\b/i,
    label: "Trained and fine-tuned machine learning / neural network models",
  },
  {
    pattern: /\b(evaluat(?:ed|ing)|benchmark(?:ed|ing)|measured|analyzed|validated)\b.*?\b(accuracy|precision|recall|f1|latency|performance|model|output)\b/i,
    label: "Evaluated model performance and conducted systematic error/metric analysis",
  },
  {
    pattern: /\b(preprocess(?:ed|ing)|curat(?:ed|ing)|cleaned|augmented|pipeline|ingest(?:ed|ion))\b.*?\b(data|dataset|images?|corpus|records)\b/i,
    label: "Built data preprocessing, augmentation, or ingestion pipelines",
  },
  {
    pattern: /\b(designed|built|developed|shipped|architected)\b.*?\b(api|endpoint|microservice|backend|server|database|schema)\b/i,
    label: "Designed and implemented backend APIs and database schemas",
  },
  {
    pattern: /\b(deployed|containerized|docker\w*|ci\/cd|cloud|aws|gcp|latency|throughput)\b/i,
    label: "Containerized and deployed services with production latency/reliability focus",
  },
  {
    pattern: /\b(ui|interface|dashboard|react|next\.js|frontend|component|visualization)\b/i,
    label: "Built interactive user interfaces and data visualizations",
  },
];

/**
 * Curated bidirectional synonym and alias mappings for technical skills
 */
export const SKILL_SYNONYMS: Record<string, string> = {
  js: "JavaScript",
  javascript: "JavaScript",
  ts: "TypeScript",
  typescript: "TypeScript",
  py: "Python",
  python: "Python",
  cpp: "C++",
  "c++": "C++",
  cplusplus: "C++",
  ml: "Machine Learning",
  "machine learning": "Machine Learning",
  dl: "Deep Learning",
  "deep learning": "Deep Learning",
  cv: "Computer Vision",
  "computer vision": "Computer Vision",
  nlp: "Natural Language Processing",
  "natural language processing": "Natural Language Processing",
  k8s: "Kubernetes",
  kubernetes: "Kubernetes",
  tf: "TensorFlow",
  tensorflow: "TensorFlow",
  pytorch: "PyTorch",
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  psql: "PostgreSQL",
  mongo: "MongoDB",
  mongodb: "MongoDB",
  node: "Node.js",
  nodejs: "Node.js",
  "node.js": "Node.js",
  react: "React",
  reactjs: "React",
  "react.js": "React",
  nextjs: "Next.js",
  "next.js": "Next.js",
  fastapi: "FastAPI",
  django: "Django",
  flask: "Flask",
  aws: "AWS",
  gcp: "Google Cloud Platform",
  azure: "Azure",
  docker: "Docker",
  git: "Git",
  github: "GitHub",
  gitlab: "GitLab",
  sql: "SQL",
  nosql: "NoSQL",
  graphql: "GraphQL",
  rest: "REST API",
  "rest api": "REST API",
  ai: "Artificial Intelligence",
  genai: "Generative AI",
  "generative ai": "Generative AI",
  llm: "LLM",
  llms: "LLM",
  rag: "RAG",
};

export function normalizeSkillAlias(rawSkill: string): string {
  const trimmed = rawSkill.trim();
  const lower = trimmed.toLowerCase();
  return SKILL_SYNONYMS[lower] || trimmed;
}

export function getSkillSynonyms(skill: string): string[] {
  const canonical = normalizeSkillAlias(skill).toLowerCase();
  const synonyms: string[] = [skill];
  for (const [alias, target] of Object.entries(SKILL_SYNONYMS)) {
    if (target.toLowerCase() === canonical && !synonyms.includes(alias)) {
      synonyms.push(alias);
    }
  }
  return synonyms;
}

/**
 * Normalizes legacy provenance strings into canonical ProvenanceCode values.
 * Never upgrades `RESUME_DERIVED` or `RESUME_AI` to `USER_CONFIRMED` or `USER_OVERRIDE` automatically.
 */
export function resolveProvenanceCode(
  profile: UserProfile,
  fieldKey: string,
  explicit?: ProvenanceCode
): ProvenanceCode {
  if (explicit) return explicit;
  const entry = profile.factProvenance?.[fieldKey];
  if (!entry) return "PROFILE_ENTERED";
  if (entry.provenanceCode) return entry.provenanceCode;
  const raw = String(entry.source || "").toLowerCase();
  if (raw.includes("override")) return "USER_OVERRIDE";
  if (raw.includes("input") || raw.includes("manual")) return "USER_INPUT";
  if (raw.includes("ai") || raw.includes("groq") || raw.includes("gemini")) return "RESUME_AI";
  if (raw.includes("deterministic") || raw.includes("regex")) return "RESUME_DETERMINISTIC";
  if (raw.includes("resume")) return "RESUME_DERIVED";
  if (raw.includes("confirm")) return "USER_CONFIRMED";
  if (raw.includes("extern") || raw.includes("verif")) return "EXTERNALLY_VERIFIED";
  return "PROFILE_ENTERED";
}

export function categorizeCandidateSkills(skills: string[]): Record<SkillCategory, string[]> {
  const buckets: Record<SkillCategory, string[]> = {
    Languages: [],
    "ML / AI": [],
    "Backend & Systems": [],
    "Frontend & Product": [],
    "Data & Cloud": [],
    "Research & Evaluation": [],
    Other: [],
  };

  for (const rawSkill of skills) {
    const canonicalSkill = normalizeSkillAlias(rawSkill);
    if (!canonicalSkill) continue;
    const lower = canonicalSkill.toLowerCase();
    let matched = false;
    for (const rule of SKILL_CATEGORY_RULES) {
      if (
        rule.keywords.some(
          (kw) => lower === kw || (kw.length >= 3 && lower.includes(kw))
        )
      ) {
        if (!buckets[rule.category].includes(canonicalSkill)) {
          buckets[rule.category].push(canonicalSkill);
        }
        matched = true;
        break;
      }
    }
    if (!matched && !buckets.Other.includes(canonicalSkill)) {
      buckets.Other.push(canonicalSkill);
    }
  }

  return buckets;
}

/**
 * Extracts structured responsibilities actually performed in candidate projects.
 * Carefully distinguishes project work from professional employment.
 */
export function extractProjectResponsibilities(
  profile: UserProfile
): ProjectResponsibility[] {
  const projectProvenance = resolveProvenanceCode(profile, "projects");
  const responsibilities: ProjectResponsibility[] = [];

  for (const proj of profile.projects || []) {
    const text = `${proj.name}. ${proj.description || ""} ${(proj.techStack || []).join(" ")}`;
    const demonstratedTasks: string[] = [];

    for (const { pattern, label } of RESPONSIBILITY_ACTION_PATTERNS) {
      if (pattern.test(text) && !demonstratedTasks.includes(label)) {
        demonstratedTasks.push(label);
      }
    }

    if (demonstratedTasks.length === 0 && proj.description) {
      demonstratedTasks.push(
        `Built project "${proj.name}" using ${(proj.techStack || []).slice(0, 4).join(", ") || "software tools"}`
      );
    }

    const hasLink = Boolean(proj.link && proj.link.trim().length > 0);
    const hasDetailedDesc = (proj.description || "").trim().length >= 40;
    const evidenceStrength: "HIGH" | "MEDIUM" | "LOW" =
      hasLink && hasDetailedDesc
        ? "HIGH"
        : hasDetailedDesc || (proj.techStack || []).length >= 2
          ? "MEDIUM"
          : "LOW";

    responsibilities.push({
      projectName: proj.name,
      responsibility: demonstratedTasks[0] || `Developed ${proj.name}`,
      demonstratedTasks,
      technologiesUsed: proj.techStack || [],
      provenance: proj.provenance || projectProvenance,
      evidenceStrength,
    });
  }

  return responsibilities;
}

/**
 * Runs the full Candidate Capability Extraction Pipeline (Phase 1):
 * 1. Categorizes skills.
 * 2. Identifies projects, experiences, and technologies.
 * 3. Maps technologies & project descriptions to direct demonstrated capabilities.
 * 4. Separates direct evidence from inferred adjacent capabilities.
 * 5. Assigns evidence strength and provenance without inventing professional experience.
 * 6. Generates missing detail confirmation prompts when essential profile details are absent.
 */
export function extractCandidateCapabilityMap(
  profile: UserProfile
): CandidateCapabilityMap {
  const allSkills = new Set<string>(profile.skills || []);
  for (const proj of profile.projects || []) {
    for (const tech of proj.techStack || []) {
      if (tech.trim()) allSkills.add(tech.trim());
    }
  }

  const categorizedSkills = categorizeCandidateSkills(Array.from(allSkills));
  const projectResponsibilities = extractProjectResponsibilities(profile);

  const demonstratedCapabilities: DemonstratedCapability[] = [];
  const inferredAdjacentCapabilities: DemonstratedCapability[] = [];

  const skillsProvenance = resolveProvenanceCode(profile, "skills");
  const projectsProvenance = resolveProvenanceCode(profile, "projects");
  const experiencesProvenance = resolveProvenanceCode(profile, "experiences");

  const corpusParts = [
    ...(profile.skills || []),
    ...(profile.projects || []).map(
      (p) => `${p.name} ${p.description} ${(p.techStack || []).join(" ")}`
    ),
    ...(profile.experiences || []).map(
      (e) => `${e.title} ${e.company} ${(e.bullets || []).join(" ")}`
    ),
    profile.resumeText || "",
  ];
  const fullCorpusLower = corpusParts.join(" \n ").toLowerCase();

  for (let i = 0; i < TECH_TO_CAPABILITY_RULES.length; i++) {
    const rule = TECH_TO_CAPABILITY_RULES[i];
    const matchedTriggers = rule.triggers.filter((t) =>
      fullCorpusLower.includes(t.toLowerCase())
    );
    if (matchedTriggers.length === 0) continue;

    const supportingProjects = (profile.projects || [])
      .filter((p) => {
        const pText = `${p.name} ${p.description} ${(p.techStack || []).join(" ")}`.toLowerCase();
        return rule.triggers.some((t) => pText.includes(t.toLowerCase()));
      })
      .map((p) => p.name);

    const supportingExperiences = (profile.experiences || [])
      .filter((e) => {
        const eText = `${e.title} ${e.company} ${(e.bullets || []).join(" ")}`.toLowerCase();
        return rule.triggers.some((t) => eText.includes(t.toLowerCase()));
      })
      .map((e) => `${e.title} at ${e.company}`);

    const hasExperienceSupport = supportingExperiences.length > 0;
    const hasProjectSupport = supportingProjects.length > 0;

    const evidenceStrength: "HIGH" | "MEDIUM" | "LOW" =
      hasExperienceSupport && hasProjectSupport
        ? "HIGH"
        : hasExperienceSupport || supportingProjects.length >= 1
          ? "MEDIUM"
          : "LOW";

    let provenance: ProvenanceCode = skillsProvenance;
    if (hasExperienceSupport) provenance = experiencesProvenance;
    else if (hasProjectSupport) provenance = projectsProvenance;

    demonstratedCapabilities.push({
      id: `cap-direct-${i + 1}`,
      capability: rule.capability,
      category: rule.category,
      sourceType: "DIRECT",
      evidenceStrength,
      provenance,
      supportingProjects,
      supportingExperiences,
      technologies: matchedTriggers,
      description:
        hasExperienceSupport
          ? `${rule.description} Supported by work/internship experience (${supportingExperiences.join(", ")}) and project evidence.`
          : hasProjectSupport
            ? `${rule.description} Demonstrated in project work (${supportingProjects.join(", ")}); not claimed as full-time employment experience.`
            : `${rule.description} Derived from listed technical skills (${matchedTriggers.join(", ")}).`,
    });

    if (rule.inferredAdjacent) {
      inferredAdjacentCapabilities.push({
        id: `cap-adjacent-${i + 1}`,
        capability: rule.inferredAdjacent.capability,
        category: rule.inferredAdjacent.category,
        sourceType: "INFERRED_ADJACENT",
        evidenceStrength: evidenceStrength === "HIGH" ? "MEDIUM" : "LOW",
        provenance,
        supportingProjects,
        supportingExperiences,
        technologies: matchedTriggers,
        description: `${rule.inferredAdjacent.description} (Inferred adjacent capability from ${rule.capability}).`,
      });
    }
  }

  const missingDetailsPrompts: MissingProfileDetailPrompt[] = [];

  if (!profile.graduationYear) {
    missingDetailsPrompts.push({
      field: "graduationYear",
      question: "What is your expected graduation year and month?",
      reason:
        "Many internships and new-grad roles enforce strict class-standing and graduation-window eligibility rules.",
      priority: "HIGH",
    });
  }

  if (!profile.workAuthStatus && !profile.constraints) {
    missingDetailsPrompts.push({
      field: "workAuthStatus",
      question:
        "Do you require visa sponsorship (e.g., CPT/OPT/H-1B) or hold unrestricted work authorization in your target locations?",
      reason:
        "Helps filter out roles with hard citizenship/clearance restrictions while respecting your privacy.",
      priority: "HIGH",
    });
  }

  if (!profile.preferredLocations || profile.preferredLocations.length === 0) {
    missingDetailsPrompts.push({
      field: "preferredLocations",
      question: "Which cities, countries, or remote regions are you open to working in?",
      reason:
        "Allows the Search Planner to target regional and remote-friendly postings accurately.",
      priority: "MEDIUM",
    });
  }

  if (
    Object.values(profile.factProvenance || {}).some(
      (fp) =>
        fp.source === "resume-derived" || fp.provenanceCode === "RESUME_DERIVED"
    )
  ) {
    missingDetailsPrompts.push({
      field: "factProvenance",
      question:
        "Please review and confirm facts extracted automatically from your resume (education, skills, and project stack).",
      reason:
        "Resume-derived facts are treated as unconfirmed until you verify them in your profile.",
      priority: "MEDIUM",
    });
  }

  const summary = `Extracted ${demonstratedCapabilities.length} direct demonstrated capabilities, ${inferredAdjacentCapabilities.length} inferred adjacent capabilities, and ${projectResponsibilities.length} project responsibility records across ${Array.from(allSkills).length} technical skills.`;

  return {
    categorizedSkills,
    demonstratedCapabilities,
    inferredAdjacentCapabilities,
    projectResponsibilities,
    missingDetailsPrompts,
    summary,
  };
}


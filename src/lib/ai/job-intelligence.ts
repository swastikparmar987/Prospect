import { z } from "zod";
import { modelRouter } from "./model-router";
import {
  AiMatchIntelligence,
  AiResumeInsights,
  EvaluationResult,
  Opportunity,
  SkillGapIntelligenceItem,
  StructuredJobIntelligence,
  UserProfile,
} from "@/types";
import {
  computeCosineSimilarity,
  generateCandidateEmbedding,
  generateOpportunityEmbedding,
} from "./semantic-embeddings";

/**
 * Zod Schema for Priority 4B: Semantic Job Understanding
 */
export const StructuredJobIntelligenceSchema = z.object({
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  experience: z.string().default("Intern / Early-Career"),
  education: z.string().default("Pursuing or holding BS/MS in Computer Science or related field"),
  responsibilities: z.array(z.string()).default([]),
  location: z.string().default("Unspecified"),
  employmentType: z.string().default("Internship"),
  eligibility: z.array(z.string()).default([]),
});

/**
 * Zod Schema for Priority 4C & 4E: Candidate-to-Job Matching + Skill Gap Intelligence
 */
export const AiMatchAndGapSchema = z.object({
  whyCandidateMatches: z.string(),
  matchedSkills: z.array(z.string()).default([]),
  missingQualifications: z.array(z.string()).default([]),
  eligibilityAssessment: z.string(),
  preparationNeeded: z.string(),
  skillGaps: z
    .array(
      z.object({
        skill: z.string(),
        importance: z.enum(["CRITICAL", "PREFERRED"]).default("CRITICAL"),
        whyItMatters: z.string(),
        preparationPath: z.string(),
        estimatedEffort: z.string().default("4-6 hours"),
        recommendedResources: z
          .array(
            z.object({
              title: z.string(),
              url: z.string(),
              type: z
                .enum(["Documentation", "Course", "Project Guide", "Benchmark"])
                .default("Documentation"),
            })
          )
          .default([]),
      })
    )
    .default([]),
});

/**
 * Curated, verified technical learning resources by skill for grounding skill gap intelligence
 */
const VERIFIED_SKILL_RESOURCES: Record<
  string,
  {
    whyItMatters: string;
    preparationPath: string;
    estimatedEffort: string;
    resources: Array<{
      title: string;
      url: string;
      type: "Documentation" | "Course" | "Project Guide" | "Benchmark";
    }>;
  }
> = {
  pytorch: {
    whyItMatters:
      "Required for building, training, and profiling custom deep learning and foundation model pipelines.",
    preparationPath:
      "Implement a custom neural network training loop with mixed-precision (`torch.amp`), DataLoader profiling, and evaluation metrics on a public dataset.",
    estimatedEffort: "6-8 hours",
    resources: [
      {
        title: "PyTorch Official Tutorials & Recipes",
        url: "https://pytorch.org/tutorials/",
        type: "Documentation",
      },
      {
        title: "PyTorch Performance Tuning Guide",
        url: "https://pytorch.org/tutorials/recipes/recipes/tuning_guide.html",
        type: "Project Guide",
      },
    ],
  },
  kubernetes: {
    whyItMatters:
      "Core orchestration layer for deploying, scaling, and operating production microservices and ML workloads.",
    preparationPath:
      "Containerize an existing API service and deploy it to a local `kind` or `minikube` cluster with readiness probes, ConfigMaps, and HorizontalPodAutoscaler.",
    estimatedEffort: "5-7 hours",
    resources: [
      {
        title: "Kubernetes Official Basics & Concepts",
        url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/",
        type: "Documentation",
      },
    ],
  },
  rust: {
    whyItMatters:
      "Used for memory-safe, zero-cost abstraction systems programming, high-throughput networking, and runtime engines.",
    preparationPath:
      "Build a concurrent CLI or HTTP/gRPC microservice in Rust using `tokio` and `serde`, documenting ownership and benchmark latency.",
    estimatedEffort: "8-10 hours",
    resources: [
      {
        title: "The Rust Programming Language Book",
        url: "https://doc.rust-lang.org/book/",
        type: "Documentation",
      },
      {
        title: "Tokio Async Rust Tutorial",
        url: "https://tokio.rs/tokio/tutorial",
        type: "Project Guide",
      },
    ],
  },
  "distributed systems": {
    whyItMatters:
      "Essential for designing fault-tolerant storage, replication, consensus, and high-throughput backend infrastructure.",
    preparationPath:
      "Add leader election, idempotent retries, or write-ahead log replication to a networked service and benchmark failure recovery.",
    estimatedEffort: "8-12 hours",
    resources: [
      {
        title: "MIT 6.5840 Distributed Systems Engineering Labs",
        url: "https://pdos.csail.mit.edu/6.824/",
        type: "Course",
      },
    ],
  },
  cuda: {
    whyItMatters:
      "Critical for GPU kernel optimization, custom operator acceleration, and high-throughput ML inference.",
    preparationPath:
      "Write and profile a custom tiled matrix multiplication or softmax kernel in CUDA C++ or Triton and compare throughput against baseline.",
    estimatedEffort: "8-10 hours",
    resources: [
      {
        title: "NVIDIA CUDA C++ Programming Guide",
        url: "https://docs.nvidia.com/cuda/cuda-c-programming-guide/",
        type: "Documentation",
      },
      {
        title: "Triton Language Tutorials",
        url: "https://triton-lang.org/main/getting-started/tutorials/index.html",
        type: "Project Guide",
      },
    ],
  },
  aws: {
    whyItMatters:
      "Widely required for cloud-native deployment, IAM security, object storage (S3), and serverless/container execution.",
    preparationPath:
      "Deploy a containerized service with Terraform or AWS CDK using least-privilege IAM roles and automated CI/CD.",
    estimatedEffort: "5-6 hours",
    resources: [
      {
        title: "AWS Well-Architected Labs",
        url: "https://www.wellarchitectedlabs.com/",
        type: "Project Guide",
      },
    ],
  },
  graphql: {
    whyItMatters:
      "Enables strongly-typed, declarative client-driven data fetching across web and mobile product surfaces.",
    preparationPath:
      "Add a typed GraphQL schema and resolver layer with DataLoader batching to an existing TypeScript/Node or Python API.",
    estimatedEffort: "4-5 hours",
    resources: [
      {
        title: "GraphQL Official Learn Guide",
        url: "https://graphql.org/learn/",
        type: "Documentation",
      },
    ],
  },
  kafka: {
    whyItMatters:
      "Backbone for event-driven architectures, real-time telemetry ingestion, and asynchronous stream processing.",
    preparationPath:
      "Set up a producer/consumer pipeline with partitioned topics and dead-letter queue handling using Docker Compose.",
    estimatedEffort: "5-6 hours",
    resources: [
      {
        title: "Apache Kafka Quickstart & Documentation",
        url: "https://kafka.apache.org/quickstart",
        type: "Documentation",
      },
    ],
  },
};

/**
 * Deterministic fallback builder for SkillGapIntelligenceItem when a skill is missing
 */
export function buildDeterministicSkillGapItem(
  skill: string,
  importance: "CRITICAL" | "PREFERRED",
  oppTitle: string,
  oppOrg: string
): SkillGapIntelligenceItem {
  const key = skill.trim().toLowerCase();
  const known = VERIFIED_SKILL_RESOURCES[key];
  if (known) {
    return {
      skill,
      importance,
      whyItMatters: `${known.whyItMatters} Specifically listed for ${oppTitle} at ${oppOrg}.`,
      preparationPath: known.preparationPath,
      estimatedEffort: known.estimatedEffort,
      recommendedResources: known.resources,
    };
  }

  return {
    skill,
    importance,
    whyItMatters: `${skill} is an explicit ${
      importance === "CRITICAL" ? "required" : "preferred"
    } technical qualification for ${oppTitle} at ${oppOrg}.`,
    preparationPath: `Extend one of your existing portfolio projects to integrate ${skill} with automated tests and a clear README architecture section demonstrating production usage.`,
    estimatedEffort: "4-6 hours",
    recommendedResources: [
      {
        title: `${skill} Official Documentation & Developer Reference`,
        url: `https://devdocs.io/#q=${encodeURIComponent(skill)}`,
        type: "Documentation",
      },
      {
        title: ` Roadmap & Best Practices for ${skill}`,
        url: "https://roadmap.sh",
        type: "Project Guide",
      },
    ],
  };
}

/**
 * Priority 4B: Semantic Job Understanding
 * Extracts structured requirements, responsibilities, education, experience, and eligibility from a job description.
 * Uses ModelRouter structured completion when configured; returns deterministic extraction with clear provenance otherwise.
 */
export async function extractStructuredJobIntelligence(
  opp: Opportunity,
  useLiveAi = true
): Promise<StructuredJobIntelligence> {
  if (useLiveAi && modelRouter.isAnyAiConfigured()) {
    const prompt = `Extract structured job requirements from this opportunity listing.
ONLY extract facts explicitly present in the title, snippet, or description. Do not invent requirements.

Title: ${opp.title}
Organization: ${opp.organization}
Location: ${opp.location} (${opp.workMode})
Category: ${opp.category}
Description:
${(opp.description || "").slice(0, 3500)}

Return JSON matching:
{
  "requiredSkills": string[],
  "preferredSkills": string[],
  "experience": string,
  "education": string,
  "responsibilities": string[],
  "location": string,
  "employmentType": string,
  "eligibility": string[]
}`;

    const aiRes = await modelRouter.completeStructured(
      "FAST_EXTRACTION",
      prompt,
      StructuredJobIntelligenceSchema,
      {
        temperature: 0.1,
        timeoutMs: 12000,
        systemPrompt:
          "You are a precise job requirement extraction engine. Extract only stated requirements and responsibilities into valid JSON.",
      }
    );

    if (aiRes) {
      return {
        requiredSkills:
          aiRes.data.requiredSkills.length > 0
            ? aiRes.data.requiredSkills
            : opp.requiredSkills || [],
        preferredSkills:
          aiRes.data.preferredSkills.length > 0
            ? aiRes.data.preferredSkills
            : opp.preferredSkills || [],
        experience: aiRes.data.experience || opp.seniority || "Intern / Early-Career",
        education:
          aiRes.data.education ||
          "Pursuing or holding BS/MS in Computer Science or related technical field",
        responsibilities: aiRes.data.responsibilities,
        location: aiRes.data.location || opp.location,
        employmentType: aiRes.data.employmentType || opp.employmentType || opp.category,
        eligibility:
          aiRes.data.eligibility.length > 0
            ? aiRes.data.eligibility
            : opp.eligibilityRequirements || [],
        extractedBy: `${aiRes.provider}:${aiRes.model}`,
        extractedAt: new Date().toISOString(),
      };
    }
  }

  // Deterministic extraction from description sentences
  const sentences = (opp.description || "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.replace(/^[•\-*]\s*/, "").trim())
    .filter((s) => s.length >= 25 && s.length <= 220);

  const responsibilities = sentences
    .filter((s) =>
      /\b(build|design|develop|implement|collaborate|optimize|research|architect|deploy|maintain|analyze|benchmark|train)\b/i.test(
        s
      )
    )
    .slice(0, 5);

  return {
    requiredSkills: opp.requiredSkills || [],
    preferredSkills: opp.preferredSkills || [],
    experience: opp.seniority || "Intern / Early-Career",
    education:
      (opp.eligibilityRequirements || []).find((r) =>
        /\b(degree|bs|ms|phd|bachelor|master)\b/i.test(r)
      ) || "Computer Science or related quantitative/engineering discipline",
    responsibilities:
      responsibilities.length > 0
        ? responsibilities
        : [
            `Contribute to ${opp.roleFamily || opp.category} engineering and technical deliverables at ${opp.organization}.`,
          ],
    location: opp.location,
    employmentType: opp.employmentType || opp.category,
    eligibility: opp.eligibilityRequirements || [],
    extractedBy: "deterministic-parser",
    extractedAt: new Date().toISOString(),
  };
}

/**
 * Priority 4C & 4E: Candidate-to-Job Matching & Skill Gap Intelligence
 * Uses semantic similarity + evidence-grounded LLM reasoning when configured.
 * If an AI API key is missing, explicitly sets `isAiGenerated: false` and `unavailableReason`
 * so the UI never pretends fabricated output came from an LLM.
 */
export async function generateCandidateJobMatchIntelligence(params: {
  opportunity: Opportunity;
  profile: UserProfile;
  evaluation: EvaluationResult;
  useLiveAi?: boolean;
}): Promise<AiMatchIntelligence> {
  const { opportunity, profile, evaluation, useLiveAi = true } = params;

  const candidateSkills = profile.skills || [];
  const candidateSkillsLower = new Set(candidateSkills.map((s) => s.toLowerCase()));

  const matchedSkills = [
    ...(opportunity.requiredSkills || []),
    ...(opportunity.preferredSkills || []),
  ].filter((s) => candidateSkillsLower.has(s.toLowerCase()));

  const missingRequired = (opportunity.requiredSkills || []).filter(
    (s) => !candidateSkillsLower.has(s.toLowerCase())
  );
  const missingPreferred = (opportunity.preferredSkills || []).filter(
    (s) => !candidateSkillsLower.has(s.toLowerCase())
  );

  const candVec =
    profile.embedding && profile.embedding.length > 0
      ? profile.embedding
      : generateCandidateEmbedding(profile);
  const oppVec =
    opportunity.embedding && opportunity.embedding.length > 0
      ? opportunity.embedding
      : generateOpportunityEmbedding(opportunity);
  const cosineSim = computeCosineSimilarity(candVec, oppVec);

  const unavailableReason = modelRouter.getAiUnavailableReason();

  if (useLiveAi && modelRouter.isAnyAiConfigured() && !unavailableReason) {
    const prompt = `Analyze the fit between this candidate and opportunity using ONLY the provided evidence. Never invent skills or experience not listed.

CANDIDATE PROFILE:
- Name: ${profile.fullName || "Candidate"}
- Education: ${profile.degree || ""} in ${profile.major || ""} at ${profile.university || ""} (Grad: ${profile.graduationYear || "Unknown"})
- Verified Skills: ${candidateSkills.join(", ") || "None listed"}
- Projects: ${(profile.projects || []).map((p) => `${p.name} (${(p.techStack || []).join(", ")})`).join("; ") || "None"}
- Experience: ${(profile.experiences || []).map((e) => `${e.title} at ${e.company}`).join("; ") || "None"}
- Constraints / Work Auth: ${profile.workAuthStatus || profile.constraints || "Not specified"}

OPPORTUNITY:
- Title: ${opportunity.title} at ${opportunity.organization}
- Location / Mode: ${opportunity.location} (${opportunity.workMode})
- Required Skills: ${(opportunity.requiredSkills || []).join(", ")}
- Preferred Skills: ${(opportunity.preferredSkills || []).join(", ")}
- Eligibility Requirements: ${(opportunity.eligibilityRequirements || []).join("; ") || "Standard"}
- Semantic Cosine Similarity: ${(cosineSim * 100).toFixed(1)}%
- Deterministic Eligibility Verdict: ${evaluation.hardBlockers.length > 0 ? `Hard Blocker: ${evaluation.hardBlockers.join("; ")}` : "Eligible / No Hard Blockers"}
- Description Excerpt: ${(opportunity.description || "").slice(0, 1500)}

Return valid JSON matching this exact structure:
{
  "whyCandidateMatches": "2-3 sentence evidence-grounded explanation citing specific candidate projects/skills and semantic alignment",
  "matchedSkills": string[],
  "missingQualifications": string[],
  "eligibilityAssessment": "Clear statement on whether the candidate meets eligibility requirements",
  "preparationNeeded": "Concrete preparation advice for this specific role",
  "skillGaps": [
    {
      "skill": string,
      "importance": "CRITICAL" | "PREFERRED",
      "whyItMatters": "Why this skill matters for ${opportunity.title} at ${opportunity.organization}",
      "preparationPath": "Concrete hands-on step to close this gap",
      "estimatedEffort": "e.g. 5-8 hours",
      "recommendedResources": [
        { "title": string, "url": string, "type": "Documentation" | "Course" | "Project Guide" | "Benchmark" }
      ]
    }
  ]
}`;

    const aiResult = await modelRouter.completeStructured(
      "REASONING",
      prompt,
      AiMatchAndGapSchema,
      {
        temperature: 0.15,
        timeoutMs: 14000,
        systemPrompt:
          "You are an evidence-grounded AI career advisor. Never fabricate candidate qualifications or hiring probabilities. Output strict JSON.",
      }
    );

    if (aiResult) {
      const mergedGaps: SkillGapIntelligenceItem[] =
        aiResult.data.skillGaps.length > 0
          ? aiResult.data.skillGaps
          : [
              ...missingRequired.map((s) =>
                buildDeterministicSkillGapItem(
                  s,
                  "CRITICAL",
                  opportunity.title,
                  opportunity.organization
                )
              ),
              ...missingPreferred
                .slice(0, 2)
                .map((s) =>
                  buildDeterministicSkillGapItem(
                    s,
                    "PREFERRED",
                    opportunity.title,
                    opportunity.organization
                  )
                ),
            ];

      return {
        whyCandidateMatches: aiResult.data.whyCandidateMatches,
        matchedSkills:
          aiResult.data.matchedSkills.length > 0
            ? aiResult.data.matchedSkills
            : matchedSkills,
        missingQualifications:
          aiResult.data.missingQualifications.length > 0
            ? aiResult.data.missingQualifications
            : [...missingRequired, ...missingPreferred],
        eligibilityAssessment: aiResult.data.eligibilityAssessment,
        preparationNeeded: aiResult.data.preparationNeeded,
        skillGaps: mergedGaps,
        provider: aiResult.provider,
        model: aiResult.model,
        isAiGenerated: true,
      };
    }
  }

  // Honest fallback when AI API key is missing or call failed
  const deterministicGaps: SkillGapIntelligenceItem[] = [
    ...missingRequired.map((s) =>
      buildDeterministicSkillGapItem(
        s,
        "CRITICAL",
        opportunity.title,
        opportunity.organization
      )
    ),
    ...missingPreferred
      .slice(0, 2)
      .map((s) =>
        buildDeterministicSkillGapItem(
          s,
          "PREFERRED",
          opportunity.title,
          opportunity.organization
        )
      ),
  ];

  const supportingProjectNames = (profile.projects || [])
    .filter((p) =>
      (p.techStack || []).some((t) =>
        matchedSkills.some((m) => m.toLowerCase() === t.toLowerCase())
      )
    )
    .map((p) => p.name);

  const whyMatches =
    matchedSkills.length > 0
      ? `Candidate demonstrates ${matchedSkills.length} matching technical skills (${matchedSkills.join(
          ", "
        )})${
          supportingProjectNames.length > 0
            ? ` backed by portfolio evidence in ${supportingProjectNames.join(", ")}`
            : ""
        }, achieving a ${(cosineSim * 100).toFixed(
          0
        )}% semantic vector similarity with ${opportunity.title}.`
      : `Semantic embedding similarity is ${(cosineSim * 100).toFixed(
          0
        )}% based on transferable ${profile.major || "technical"} background, though direct required skills (${missingRequired
          .slice(0, 3)
          .join(", ")}) are not yet listed on the confirmed profile.`;

  const eligibilityAssessment =
    evaluation.hardBlockers.length > 0
      ? `Hard Eligibility Blocker detected: ${evaluation.hardBlockers.join("; ")}`
      : evaluation.uncertainties.length > 0
        ? `No hard blockers failed, but verify: ${evaluation.uncertainties.join("; ")}`
        : "Candidate satisfies all stated graduation window, degree, and work authorization checks.";

  const preparationNeeded =
    missingRequired.length > 0
      ? `Close ${missingRequired.length} required skill gap${
          missingRequired.length > 1 ? "s" : ""
        } (${missingRequired.join(
          ", "
        )}) by building a focused portfolio proof before submitting.`
      : "Core required skills are satisfied. Tailor resume bullets to highlight measurable impact and apply directly.";

  return {
    whyCandidateMatches: whyMatches,
    matchedSkills,
    missingQualifications: [...missingRequired, ...missingPreferred],
    eligibilityAssessment,
    preparationNeeded,
    skillGaps: deterministicGaps,
    provider: "deterministic",
    model: "evidence-rule-engine-v1",
    isAiGenerated: false,
    unavailableReason:
      unavailableReason ||
      (useLiveAi
        ? "Live LLM response unavailable for this request; showing deterministic evidence-grounded analysis."
        : undefined),
  };
}

/**
 * Priority 4A: Structured AI Resume Insights (Responsibilities, Achievements, Career Direction)
 */
const AiResumeInsightsSchema = z.object({
  responsibilities: z.array(z.string()).default([]),
  achievements: z.array(z.string()).default([]),
  careerDirections: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(0.9),
});

export async function extractAiResumeInsights(
  profile: Partial<UserProfile>,
  rawText: string
): Promise<AiResumeInsights> {
  const unavailableReason = modelRouter.getAiUnavailableReason();

  if (modelRouter.isAnyAiConfigured() && !unavailableReason && rawText.trim().length >= 40) {
    const prompt = `Extract demonstrated responsibilities, measurable achievements, and grounded career directions from this candidate resume.
ONLY include facts supported by the text. Never fabricate metrics or achievements.

RESUME TEXT:
${rawText.slice(0, 4500)}

Return JSON:
{
  "responsibilities": ["concise responsibility demonstrated in projects/experience"],
  "achievements": ["specific achievement, metric, award, or deliverable stated in resume"],
  "careerDirections": ["evidence-backed career direction or role family"],
  "confidence": 0.92
}`;

    const res = await modelRouter.completeStructured(
      "FAST_EXTRACTION",
      prompt,
      AiResumeInsightsSchema,
      {
        temperature: 0.1,
        timeoutMs: 12000,
      }
    );

    if (res) {
      return {
        responsibilities: res.data.responsibilities,
        achievements: res.data.achievements,
        careerDirections: res.data.careerDirections,
        confidence: res.data.confidence,
        provider: res.provider,
        model: res.model,
        extractedAt: new Date().toISOString(),
      };
    }
  }

  // Deterministic extraction from parsed experiences/projects/awards
  const responsibilities = [
    ...(profile.experiences || []).flatMap((e) => (e.bullets || []).slice(0, 2)),
    ...(profile.projects || []).map(
      (p) => `${p.name}: ${p.description.slice(0, 140)}`
    ),
  ].slice(0, 6);

  const achievements = [
    ...(profile.awards || []),
    ...(profile.certifications || []),
    ...(profile.experiences || [])
      .flatMap((e) => e.bullets || [])
      .filter((b) => /\b(\d+%|\d+x|reduced|improved|built|published|co-authored|won)\b/i.test(b)),
  ].slice(0, 5);

  return {
    responsibilities,
    achievements,
    careerDirections: profile.targetRoles || [],
    confidence: 0.85,
    provider: "deterministic",
    model: "deterministic-section-parser",
    extractedAt: new Date().toISOString(),
    unavailableReason: unavailableReason || undefined,
  };
}

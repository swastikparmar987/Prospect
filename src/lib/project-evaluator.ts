import { z } from "zod";
import {
  EvaluationResult,
  Opportunity,
  ProjectEvaluationInput,
  ProjectEvaluationResult,
  ProjectVerdict,
  UserProfile,
} from "@/types";
import { modelRouter } from "./ai/model-router";
import {
  computeCosineSimilarity,
  generateOpportunityEmbedding,
  generateSemanticEmbedding,
} from "./ai/semantic-embeddings";
import { isSafePublicUrl } from "./safe-url";
import { evaluateOpportunity } from "./scoring-engine";

const AiProjectCritiqueSchema = z.object({
  summary: z.string(),
  strengths: z.array(z.string()).min(1).max(6),
  weaknesses: z.array(z.string()).min(1).max(6),
  recommendedResumeBullets: z.array(z.string()).min(2).max(4),
  upgradeSteps: z.array(z.string()).min(2).max(5),
  extractedCapabilities: z.array(z.string()).min(2).max(8),
  technicalComplexityAdjustment: z.number().min(-4).max(4).optional(),
  differentiationAdjustment: z.number().min(-4).max(4).optional(),
});

const HIGH_SIGNAL_SYSTEM_TERMS = [
  "rag",
  "llm",
  "pytorch",
  "tensorflow",
  "transformers",
  "vector",
  "embeddings",
  "bm25",
  "cuda",
  "distributed",
  "kubernetes",
  "docker",
  "fastapi",
  "grpc",
  "kafka",
  "redis",
  "postgresql",
  "prisma",
  "next.js",
  "typescript",
  "rust",
  "go",
  "graphql",
  "ci/cd",
  "playwright",
  "pytest",
  "opencv",
  "yolo",
  "fine-tuning",
  "lora",
  "websocket",
  "sse",
];

const CLONE_OR_TRIVIAL_TERMS = [
  "todo list",
  "to-do app",
  "calculator",
  "weather app",
  "tic tac toe",
  "netflix clone",
  "amazon clone",
  "spotify clone",
  "portfolio website",
  "hello world",
  "snake game",
];

interface GitHubInspectResult {
  note: string;
  stars?: number;
  language?: string | null;
  topics?: string[];
  hasPublicActivity?: boolean;
}

async function inspectGitHubRepository(
  repoUrl?: string,
  fetchImpl: typeof fetch = fetch
): Promise<GitHubInspectResult | null> {
  if (!repoUrl || !repoUrl.trim()) return null;
  const safe = isSafePublicUrl(repoUrl.trim());
  if (!safe.isSafe) {
    return { note: "Repository URL failed safety validation and was not fetched." };
  }

  try {
    const parsed = new URL(repoUrl.trim());
    if (!/^(?:www\.)?github\.com$/i.test(parsed.hostname)) {
      return { note: "External non-GitHub link recorded without automated repository inspection." };
    }
    const parts = parsed.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/i, "");

    const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
    const res = await fetchImpl(apiUrl, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "ProspectProjectEvaluator/1.0",
      },
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      return {
        note: `GitHub API returned HTTP ${res.status} for ${owner}/${repo}; evaluated strictly from supplied project details.`,
      };
    }

    const data = await res.json();
    const stars = Number(data?.stargazers_count || 0);
    const language = data?.language ? String(data.language) : null;
    const topics = Array.isArray(data?.topics)
      ? data.topics.map((t: unknown) => String(t)).slice(0, 8)
      : [];

    return {
      note: `Verified public repository ${owner}/${repo}${
        language ? ` (${language})` : ""
      } • ${stars} stars${data?.description ? ` — "${String(data.description).slice(0, 90)}"` : ""}.`,
      stars,
      language,
      topics,
      hasPublicActivity: true,
    };
  } catch {
    return {
      note: "Could not reach GitHub API within timeout; evaluated from supplied project text and stack.",
    };
  }
}

export function computeDeterministicProjectEvaluation(
  input: ProjectEvaluationInput,
  profile: UserProfile | null,
  ghInfo: GitHubInspectResult | null
): Omit<
  ProjectEvaluationResult,
  "matchingOpportunitiesCount" | "topMatchingOpportunities" | "provider" | "model" | "evaluatedAt"
> {
  const title = input.title.trim();
  const description = input.description.trim();
  const stack = Array.from(new Set(input.techStack.map((s) => s.trim()).filter(Boolean)));
  const combinedLower = `${title} ${description} ${stack.join(" ")} ${(ghInfo?.topics || []).join(" ")}`.toLowerCase();

  // 1. Technical Complexity (0 - 25)
  const advancedMatches = HIGH_SIGNAL_SYSTEM_TERMS.filter((term) =>
    combinedLower.includes(term)
  );
  let technicalComplexity = Math.min(
    25,
    8 + Math.min(10, advancedMatches.length * 2.5) + Math.min(5, stack.length * 1.1) + (description.length > 160 ? 2 : 0)
  );
  technicalComplexity = Math.round(technicalComplexity);

  // 2. Engineering & Production Signals (0 - 20)
  let engineeringProduction = 6;
  if (/\b(test|unit|integration|ci\/cd|benchmark|latency|throughput|docker|kubernetes|cache|sse|websocket|stream|schema|auth|prisma|sql|eval|evaluation|ndcg|precision)\b/i.test(combinedLower)) {
    engineeringProduction += 6;
  }
  if (input.repoUrl?.trim() && isSafePublicUrl(input.repoUrl.trim()).isSafe) {
    engineeringProduction += ghInfo?.hasPublicActivity ? 5 : 3;
  }
  if (input.liveUrl?.trim() && isSafePublicUrl(input.liveUrl.trim()).isSafe) {
    engineeringProduction += 3;
  }
  engineeringProduction = Math.min(20, engineeringProduction);

  // 3. Role Relevance to Candidate Target Roles (0 - 25)
  const targetRoleText = (
    input.targetRole ||
    profile?.targetRoles?.join(" ") ||
    profile?.headline ||
    "Software & Machine Learning Engineer"
  ).toLowerCase();
  const roleVec = generateSemanticEmbedding(targetRoleText, profile?.skills || []);
  const projVec = generateSemanticEmbedding(`${title} ${description}`, stack);
  const sim = computeCosineSimilarity(roleVec, projVec);
  const stackMatchesProfile = stack.filter((t) =>
    (profile?.skills || []).some((s) => s.toLowerCase() === t.toLowerCase())
  );
  const roleRelevance = Math.min(
    25,
    Math.round(10 + sim * 14 + Math.min(4, stackMatchesProfile.length * 1.2))
  );

  // 4. Differentiation vs Tutorial Clone (0 - 15)
  const isTutorialClone = CLONE_OR_TRIVIAL_TERMS.some((c) => combinedLower.includes(c));
  let differentiation = isTutorialClone ? 4 : 11;
  if (!isTutorialClone && /\b(custom|hybrid|pipeline|real-time|autonomous|agent|multi-platform|engine|architecture|fine-tuned|benchmark)\b/i.test(combinedLower)) {
    differentiation = 15;
  } else if (description.length < 60) {
    differentiation = Math.max(4, differentiation - 4);
  }

  // 5. Quantified Impact & Evidence (0 - 15)
  const hasMetrics =
    /\b\d+(?:\.\d+)?\s*(%|ms|s\b|x\b|k\b|m\b|rps|qps|accuracy|f1|bleu|ndcg|users|jobs)\b/i.test(
      description
    );
  let impactEvidence = hasMetrics ? 13 : 6;
  if (/\b(reduced|improved|achieved|processed|scaled|built|deployed|indexed|evaluated)\b/i.test(description)) {
    impactEvidence = Math.min(15, impactEvidence + 2);
  }

  const overallScore = Math.min(
    100,
    Math.max(
      0,
      technicalComplexity +
        engineeringProduction +
        roleRelevance +
        differentiation +
        impactEvidence
    )
  );

  let verdict: ProjectVerdict = "ADD_WITH_QUANTIFIED_IMPACT";
  let verdictLabel = "Resume-Ready (Sharpen Impact Bullets)";
  if (overallScore >= 78) {
    verdict = "STRONG_RESUME_ASSET";
    verdictLabel = "Strong Flagship Resume Asset";
  } else if (overallScore >= 58) {
    verdict = "ADD_WITH_QUANTIFIED_IMPACT";
    verdictLabel = "Good for Resume (Add Quantified Metrics)";
  } else if (overallScore >= 40) {
    verdict = "NEEDS_ENGINEERING_DEPTH";
    verdictLabel = "Needs Deeper Engineering Before Resume";
  } else {
    verdict = "REPLACE_OR_KEEP_LEARNING";
    verdictLabel = "Keep as Practice / Replace with Stronger Project";
  }

  const shouldIncludeOnResume = overallScore >= 58;

  const strengths: string[] = [];
  if (advancedMatches.length > 0) {
    strengths.push(
      `Uses production-relevant technical stack (${advancedMatches.slice(0, 5).join(", ")})`
    );
  }
  if (engineeringProduction >= 14) {
    strengths.push("Demonstrates verification/testing, deployment, or public repository artifacts.");
  }
  if (roleRelevance >= 18) {
    strengths.push(`Strong vector alignment (${Math.round(sim * 100)}%) with target roles.`);
  }
  if (strengths.length === 0) {
    strengths.push(`Hands-on practice building with ${stack.slice(0, 4).join(", ") || "core tools"}.`);
  }

  const weaknesses: string[] = [];
  if (!hasMetrics) {
    weaknesses.push(
      "Missing quantitative evaluation or latency/scale numbers (e.g., latency ms, precision/nDCG, throughput)."
    );
  }
  if (isTutorialClone) {
    weaknesses.push(
      "Resembles a common tutorial/clone theme unless extended with unique engineering constraints."
    );
  }
  if (!input.repoUrl?.trim() && !input.liveUrl?.trim()) {
    weaknesses.push("No public GitHub repository or live demo link attached for recruiter proof.");
  }
  if (weaknesses.length === 0) {
    weaknesses.push("Add an explicit architecture diagram & ablation/benchmark table in README for maximum recruiter impact.");
  }

  const primaryStackStr = stack.slice(0, 4).join(", ") || "modern software frameworks";
  const recommendedResumeBullets = [
    `Engineered ${title} using ${primaryStackStr}, implementing core architecture described as: ${description.slice(0, 120)}${description.length > 120 ? "..." : ""}`,
    `Designed end-to-end data/model workflow in ${title} integrating ${stack.slice(0, 3).join(" and ") || "modular services"} with verifiable error handling and structured evaluation.`,
    hasMetrics
      ? `Validated system quality and performance improvements across real-world inputs, documenting measurable engineering outcomes.`
      : `Add a concrete benchmark (e.g., latency, accuracy, Precision@K, or active dataset size) to strengthen this bullet for ATS & technical interviews.`,
  ];

  const upgradeSteps: string[] = [
    !hasMetrics
      ? "Run a repeatable benchmark (latency, Precision@5/nDCG, or test pass rate) and put those real numbers in the top resume bullet."
      : "Document your system tradeoffs and evaluation methodology concisely in your README.",
    !input.repoUrl?.trim()
      ? "Publish clean code with tests and an architecture diagram on GitHub."
      : "Ensure your GitHub README includes a 30-second setup guide, API contract, and screenshots.",
    "Add automated integration tests + CI workflow to prove production engineering rigor.",
  ];

  return {
    title,
    overallScore,
    verdict,
    verdictLabel,
    shouldIncludeOnResume,
    summary: shouldIncludeOnResume
      ? `"${title}" scores ${overallScore}/100 and IS strong enough to feature on your resume—especially for roles requiring ${stack.slice(0, 4).join(", ") || "similar engineering depth"}.`
      : `"${title}" currently scores ${overallScore}/100 and needs stronger engineering depth or quantified benchmarks before taking valuable resume space.`,
    dimensionScores: {
      technicalComplexity,
      engineeringProduction,
      roleRelevance,
      differentiation,
      impactEvidence,
    },
    strengths,
    weaknesses,
    recommendedResumeBullets,
    upgradeSteps,
    extractedCapabilities: Array.from(
      new Set([
        ...stack,
        ...advancedMatches.map((m) => m.toUpperCase()),
      ])
    ).slice(0, 8),
    repoInspectNote: ghInfo?.note,
  };
}

/**
 * Evaluates a user-submitted class or personal project for Resume-Worthiness,
 * optionally enriches critique via live Groq/Gemini LLM, and retrieves the top
 * matching live opportunities in the database powered by 128-D RAG similarity.
 */
export async function evaluateProjectForResumeAndJobs(
  input: ProjectEvaluationInput,
  profile: UserProfile | null,
  activeOpportunities: Opportunity[]
): Promise<ProjectEvaluationResult> {
  const ghInfo = await inspectGitHubRepository(input.repoUrl);
  const baseEval = computeDeterministicProjectEvaluation(input, profile, ghInfo);

  let finalSummary = baseEval.summary;
  let finalStrengths = baseEval.strengths;
  let finalWeaknesses = baseEval.weaknesses;
  let finalBullets = baseEval.recommendedResumeBullets;
  let finalUpgrades = baseEval.upgradeSteps;
  let finalCapabilities = baseEval.extractedCapabilities;
  let finalScore = baseEval.overallScore;
  let provider = "deterministic";
  let model = "project-evaluator-v1";

  if (modelRouter.isAnyAiConfigured()) {
    const prompt = `Evaluate this software/ML project for a candidate targeting "${
      input.targetRole || profile?.targetRoles?.join(", ") || "ML / Software Engineering"
    }".
Project Title: ${input.title}
Tech Stack: ${input.techStack.join(", ")}
Description: ${input.description}
${ghInfo?.note ? `Repo Verification Note: ${ghInfo.note}` : ""}

Return strictly grounded analysis without inventing fake metrics not present in the description (if metrics are missing, tell the user to measure them). Provide crisp, actionable ATS resume bullets and concrete technical upgrades.`;

    const aiRes = await modelRouter.completeStructured(
      "REASONING",
      prompt,
      AiProjectCritiqueSchema,
      { temperature: 0.25, maxTokens: 900, timeoutMs: 8000 }
    );

    if (aiRes) {
      provider = aiRes.provider;
      model = aiRes.model;
      finalSummary = aiRes.data.summary;
      finalStrengths = aiRes.data.strengths;
      finalWeaknesses = aiRes.data.weaknesses;
      finalBullets = aiRes.data.recommendedResumeBullets;
      finalUpgrades = aiRes.data.upgradeSteps;
      finalCapabilities = Array.from(
        new Set([...baseEval.extractedCapabilities, ...aiRes.data.extractedCapabilities])
      ).slice(0, 8);
      const delta =
        (aiRes.data.technicalComplexityAdjustment || 0) +
        (aiRes.data.differentiationAdjustment || 0);
      finalScore = Math.min(100, Math.max(0, baseEval.overallScore + delta));
    }
  }

  // Augment temporary profile with this project and run RAG matching against live jobs
  const augmentedProfile: UserProfile = {
    ...(profile || {
      id: "project-eval-temp",
      fullName: "Candidate",
      email: "",
      headline: input.targetRole || "Software & AI Engineer",
      university: "",
      degree: "B.Tech",
      major: "Computer Science",
      location: "",
      targetRoles: input.targetRole ? [input.targetRole] : ["Machine Learning Engineer", "Software Engineer"],
      preferredWorkModes: ["Remote", "Hybrid", "On-site"],
      preferredLocations: [],
      skills: [],
      experiences: [],
      projects: [],
      portfolioLinks: [],
      availability: "Immediate",
      stipendPreference: "Any",
      constraints: "",
      factProvenance: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    skills: Array.from(
      new Set([...(profile?.skills || []), ...input.techStack])
    ),
    projects: [
      {
        id: "eval-project-preview",
        name: input.title,
        description: input.description,
        techStack: input.techStack,
        link: input.repoUrl || input.liveUrl,
      },
      ...(profile?.projects || []),
    ],
  };

  const projectOnlyVec = generateSemanticEmbedding(
    `${input.title} ${input.description} ${input.targetRole || ""}`,
    input.techStack
  );

  const matchedBundles: Array<{
    opportunity: Opportunity;
    evaluation: EvaluationResult;
    projectSimilarity: number;
  }> = [];

  for (const opp of activeOpportunities) {
    if (opp.isExpired) continue;
    const oppVec =
      opp.embedding && opp.embedding.length > 0
        ? opp.embedding
        : generateOpportunityEmbedding(opp);
    const projectSimilarity = computeCosineSimilarity(projectOnlyVec, oppVec);
    if (projectSimilarity < 0.25) continue;

    const evaluation = evaluateOpportunity(opp, augmentedProfile);
    if (evaluation.domainVerdict === "DOMAIN_MISMATCH") continue;
    if (evaluation.hardBlockers.length > 0) continue;

    matchedBundles.push({
      opportunity: opp,
      evaluation,
      projectSimilarity: Math.round(projectSimilarity * 100),
    });
  }

  matchedBundles.sort((a, b) => {
    const scoreDiff =
      b.projectSimilarity * 0.5 +
      b.evaluation.overallScore * 0.5 -
      (a.projectSimilarity * 0.5 + a.evaluation.overallScore * 0.5);
    return scoreDiff;
  });

  const shouldInclude = finalScore >= 58;

  return {
    ...baseEval,
    overallScore: finalScore,
    shouldIncludeOnResume: shouldInclude,
    verdictLabel:
      finalScore >= 78
        ? "Strong Flagship Resume Asset"
        : finalScore >= 58
          ? "Good for Resume (Add Quantified Metrics)"
          : finalScore >= 40
            ? "Needs Deeper Engineering Before Resume"
            : "Keep as Practice / Replace with Stronger Project",
    verdict:
      finalScore >= 78
        ? "STRONG_RESUME_ASSET"
        : finalScore >= 58
          ? "ADD_WITH_QUANTIFIED_IMPACT"
          : finalScore >= 40
            ? "NEEDS_ENGINEERING_DEPTH"
            : "REPLACE_OR_KEEP_LEARNING",
    summary: finalSummary,
    strengths: finalStrengths,
    weaknesses: finalWeaknesses,
    recommendedResumeBullets: finalBullets,
    upgradeSteps: finalUpgrades,
    extractedCapabilities: finalCapabilities,
    matchingOpportunitiesCount: matchedBundles.length,
    topMatchingOpportunities: matchedBundles.slice(0, 8),
    provider,
    model,
    evaluatedAt: new Date().toISOString(),
  };
}

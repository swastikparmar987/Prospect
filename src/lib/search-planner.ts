import { z } from "zod";
import {
  AdaptiveRoundMetrics,
  CandidateCapabilityMap,
  ExpandedRole,
  ExpansionCaseCode,
  OpportunityCategory,
  SearchConfig,
  SearchHardConstraints,
  SearchPlan,
  SearchQueryItem,
  SearchSoftPreferences,
  UserProfile,
  WorkMode,
} from "../types";
import { parseSearchIntent } from "./query-intent-parser";

const WorkModeSchema = z.string().transform((val) => {
  const lower = String(val || "").toLowerCase();
  if (lower.includes("remote")) return "Remote" as const;
  if (lower.includes("hybrid")) return "Hybrid" as const;
  if (lower.includes("on-site") || lower.includes("onsite")) return "On-site" as const;
  return "Flexible" as const;
});

export const SearchQueryItemSchema = z.object({
  id: z.string().min(1),
  query: z.string().min(2),
  strategy: z.enum([
    "DIRECT_ROLE",
    "ADJACENT_ROLE",
    "PROJECT_RESPONSIBILITY",
    "RESEARCH_ACADEMIC",
    "EMERGING_SPECIALIZED",
    "COMPANY_CAREER_BOARD",
    "BROADENED_FALLBACK",
  ]),
  roleTitles: z.array(z.string()),
  skillCombinations: z.array(z.string()),
  projectKeywords: z.array(z.string()),
  locationFilters: z.array(z.string()),
  workModeFilters: z.array(WorkModeSchema).default([]),
  experienceLevelTerms: z.array(z.string()),
  companyTargets: z.array(z.string()),
  targetProviders: z.array(z.string()).min(1),
  exclusionTerms: z.array(z.string()),
  rationale: z.string().min(3),
  expectedCategory: z.enum([
    "Internship",
    "Fellowship",
    "Research",
    "Hackathon",
    "Entry-level",
  ]),
  priority: z.number().int().min(1).max(10),
  maxResults: z.number().int().min(1).max(50),
});

export const SearchPlanSchema = z.object({
  roundId: z.string().min(1),
  roundNumber: z.number().int().min(1),
  queryGroups: z.array(SearchQueryItemSchema),
  roleTitles: z.array(z.string()),
  skillCombinations: z.array(z.string()),
  projectResponsibilityKeywords: z.array(z.string()),
  locationFilters: z.array(z.string()),
  workModeFilters: z.array(WorkModeSchema).default([]),
  experienceLevelTerms: z.array(z.string()),
  companyCareerTargets: z.array(z.string()),
  relevantSourceProviders: z.array(z.string()),
  exclusionTerms: z.array(z.string()),
  queryRationale: z.string().min(3),
  expectedResultCategory: z.enum([
    "Internship",
    "Fellowship",
    "Research",
    "Hackathon",
    "Entry-level",
  ]),
  priority: z.number().int().min(1).max(10),
  maxResultLimits: z.number().int().min(1),
  hardConstraints: z.object({
    workAuth: z.string().optional(),
    remoteOnly: z.boolean().optional(),
    strictLocations: z.array(z.string()).optional(),
    excludedEmployers: z.array(z.string()),
    excludedRoleFamilies: z.array(z.string()),
    internshipOrGradOnly: z.boolean().optional(),
  }),
  softPreferences: z.object({
    preferredLocations: z.array(z.string()),
    preferredWorkModes: z.array(z.enum(["Remote", "Hybrid", "On-site", "Flexible"])),
    stipendPreference: z.string(),
    targetCategories: z.array(
      z.enum(["Internship", "Fellowship", "Research", "Hackathon", "Entry-level"])
    ),
  }),
  plannerSource: z.enum(["DETERMINISTIC", "LLM_VALIDATED"]),
  expansionReasonsTriggered: z
    .array(
      z.enum([
        "CASE_A_LOW_RESULT_COUNT",
        "CASE_B_MANY_DUPLICATES",
        "CASE_C_LOW_SKILL_RELEVANCE",
        "CASE_D_GEOGRAPHIC_LIMITATION",
        "CASE_E_MISSING_CATEGORIES",
        "CASE_F_POOR_SOURCE_COVERAGE",
        "CASE_G_INSUFFICIENT_CANDIDATE_EVIDENCE",
      ])
    )
    .optional(),
  createdAt: z.string(),
});

export interface SearchPlannerInput {
  profile: UserProfile;
  capabilityMap: CandidateCapabilityMap;
  expandedRoles: ExpandedRole[];
  roundNumber: number;
  executedQueries: Set<string>;
  previousRounds: AdaptiveRoundMetrics[];
  expansionCasesTriggered: ExpansionCaseCode[];
  remainingBudget: number;
  config: SearchConfig;
  userQueryOverride?: string;
  feedbackBoostedFamilies?: string[];
  feedbackPenalizedFamilies?: string[];
}

/**
 * Separates hard constraints (which must NEVER be silently removed to boost volume)
 * from soft preferences (which can be broadened in later rounds when coverage is low).
 */
export function extractConstraintsAndPreferences(profile: UserProfile): {
  hardConstraints: SearchHardConstraints;
  softPreferences: SearchSoftPreferences;
} {
  const constraintsLower = `${profile.constraints || ""} ${profile.workAuthStatus || ""}`.toLowerCase();
  const remoteOnly =
    /\b(remote\s+only|must\s+be\s+remote|only\s+remote)\b/i.test(constraintsLower);

  const strictLocations: string[] = [];
  const strictLocMatch = constraintsLower.match(/\bonly\s+in\s+([a-z\s,]+)/i);
  if (strictLocMatch && strictLocMatch[1]) {
    strictLocations.push(strictLocMatch[1].trim());
  }

  const parsedExcludedEmployers = Array.isArray(profile.hiddenEmployers)
    ? profile.hiddenEmployers
    : typeof profile.hiddenEmployers === "string"
      ? (JSON.parse(profile.hiddenEmployers || "[]") as string[])
      : [];
  const parsedExcludedFamilies = Array.isArray(profile.excludedRoleFamilies)
    ? profile.excludedRoleFamilies
    : typeof profile.excludedRoleFamilies === "string"
      ? (JSON.parse(profile.excludedRoleFamilies || "[]") as string[])
      : [];

  const hardConstraints: SearchHardConstraints = {
    workAuth:
      profile.workAuthStatus?.trim() ||
      (constraintsLower.includes("visa") || constraintsLower.includes("sponsorship")
        ? profile.constraints
        : undefined),
    remoteOnly,
    strictLocations: strictLocations.length > 0 ? strictLocations : undefined,
    excludedEmployers: parsedExcludedEmployers,
    excludedRoleFamilies: parsedExcludedFamilies,
    internshipOrGradOnly: Boolean(
      profile.graduationYear && profile.graduationYear >= new Date().getFullYear()
    ),
  };

  const detectedCity = profile.locationPreference?.city?.trim() || "";
  const basePreferredLocations = profile.preferredLocations || [];
  const mergedPreferredLocations = detectedCity
    ? Array.from(new Set([detectedCity, ...basePreferredLocations]))
    : basePreferredLocations;

  const softPreferences: SearchSoftPreferences = {
    preferredLocations: mergedPreferredLocations,
    preferredWorkModes:
      profile.preferredWorkModes && profile.preferredWorkModes.length > 0
        ? profile.preferredWorkModes
        : (["Remote", "Hybrid", "On-site"] as WorkMode[]),
    stipendPreference: profile.stipendPreference || "Flexible",
    targetCategories: ["Internship", "Fellowship", "Research", "Entry-level"],
  };

  return { hardConstraints, softPreferences };
}

function normalizeQueryKey(query: string, strategy: string): string {
  return `${strategy}::${query.trim().toLowerCase().replace(/\s+/g, " ")}`;
}

/**
 * Deterministic, schema-validated Search Planner that generates distinct search strategies
 * across rounds based on candidate capabilities, role families, and previous round gaps.
 */
export function buildDeterministicSearchPlan(input: SearchPlannerInput): SearchPlan {
  const {
    profile,
    capabilityMap,
    expandedRoles,
    roundNumber,
    executedQueries,
    expansionCasesTriggered,
    remainingBudget,
    config,
    userQueryOverride,
    feedbackBoostedFamilies = [],
    feedbackPenalizedFamilies = [],
  } = input;

  const { hardConstraints, softPreferences } =
    extractConstraintsAndPreferences(profile);

  const activeRoles = expandedRoles.filter((r) => !r.excludedByUser);
  const directRoles = activeRoles.filter((r) => r.roleFamily === "DIRECT");
  const adjacentRoles = activeRoles.filter((r) => r.roleFamily === "ADJACENT");
  const projectRoles = activeRoles.filter((r) => r.roleFamily === "PROJECT_DERIVED");
  const emergingRoles = activeRoles.filter(
    (r) => r.roleFamily === "EMERGING_SPECIALIZED"
  );

  const hasTavily = Boolean(
    process.env.TAVILY_API_KEY && process.env.ENABLE_WEB_DISCOVERY !== "false"
  );
  const activeProviders =
    config.mode === "DEMO"
      ? ["demo_freehire", "demo_career_feeds"]
      : hasTavily
        ? ["tavily", "public_boards", "career_feeds", "freehire"]
        : ["public_boards", "career_feeds", "freehire"];

  // If CASE_F_POOR_SOURCE_COVERAGE or CASE_B_MANY_DUPLICATES occurred, prioritize career_feeds or tavily
  const prioritizeCareerFeeds =
    expansionCasesTriggered.includes("CASE_B_MANY_DUPLICATES") ||
    expansionCasesTriggered.includes("CASE_F_POOR_SOURCE_COVERAGE");

  const broadenGeography =
    expansionCasesTriggered.includes("CASE_D_GEOGRAPHIC_LIMITATION") &&
    !hardConstraints.remoteOnly &&
    (!hardConstraints.strictLocations || hardConstraints.strictLocations.length === 0);

  const effectiveLocations = hardConstraints.strictLocations?.length
    ? hardConstraints.strictLocations
    : broadenGeography
      ? ["Remote", ...softPreferences.preferredLocations]
      : softPreferences.preferredLocations;

  const rawWorkModes = hardConstraints.remoteOnly
    ? ["Remote"]
    : broadenGeography
      ? ["Remote", "Hybrid", "Flexible"]
      : (softPreferences.preferredWorkModes?.length > 0 ? softPreferences.preferredWorkModes : ["Remote", "Hybrid", "Flexible"]);

  const effectiveWorkModes: WorkMode[] = rawWorkModes.map((m) => {
    const lower = String(m || "").toLowerCase();
    if (lower.includes("remote")) return "Remote" as const;
    if (lower.includes("hybrid")) return "Hybrid" as const;
    if (lower.includes("on-site") || lower.includes("onsite")) return "On-site" as const;
    return "Flexible" as const;
  });

  const exclusionTerms = [
    "Senior",
    "Staff",
    "Principal",
    "Director",
    ...(hardConstraints.excludedEmployers || []),
  ];

  const topSkills = (profile.skills || []).slice(0, 6);
  const projectKeywords = capabilityMap.projectResponsibilities
    .flatMap((pr) => pr.technologiesUsed)
    .filter((v, i, a) => Boolean(v) && a.indexOf(v) === i)
    .slice(0, 6);

  const candidateQueryItems: SearchQueryItem[] = [];

  const tryAddQuery = (item: Omit<SearchQueryItem, "id" | "priority"> & { basePriority: number }) => {
    const key = normalizeQueryKey(item.query, item.strategy);
    if (executedQueries.has(key)) {
      return; // Never execute the same query repeatedly!
    }

    let priority = item.basePriority;
    if (
      feedbackBoostedFamilies.some((f) =>
        item.strategy.toLowerCase().includes(f.toLowerCase()) ||
        item.roleTitles.some((rt) => rt.toLowerCase().includes(f.toLowerCase()))
      )
    ) {
      priority = Math.max(1, priority - 2);
    }
    if (
      feedbackPenalizedFamilies.some((f) =>
        item.strategy.toLowerCase().includes(f.toLowerCase()) ||
        item.roleTitles.some((rt) => rt.toLowerCase().includes(f.toLowerCase()))
      )
    ) {
      priority = Math.min(10, priority + 2);
    }

    candidateQueryItems.push({
      ...item,
      id: `q-r${roundNumber}-${candidateQueryItems.length + 1}-${item.strategy.toLowerCase()}`,
      priority,
    });
  };

  // Strategy 1: Direct role search (primary in Round 1)
  const directTitles =
    directRoles.length > 0
      ? directRoles.map((r) => r.title)
      : profile.targetRoles?.length > 0
        ? profile.targetRoles
        : ["Software Engineering Intern", "Machine Learning Intern"];

  const userIntent =
    roundNumber === 1 && userQueryOverride?.trim()
      ? parseSearchIntent(userQueryOverride)
      : null;

  const directQueryText =
    roundNumber === 1 && userQueryOverride?.trim()
      ? userIntent?.tavilySearchQueries[0] || userQueryOverride.trim()
      : `${directTitles.slice(0, 2).join(" OR ")} ${topSkills.slice(0, 3).join(" ")}`.trim();

  if (roundNumber === 1) {
    tryAddQuery({
      query: directQueryText,
      strategy: "DIRECT_ROLE",
      roleTitles: userIntent?.roleTitle ? [userIntent.roleTitle, ...directTitles.slice(0, 2)] : directTitles.slice(0, 3),
      skillCombinations: userIntent?.skills && userIntent.skills.length > 0 ? userIntent.skills : topSkills.slice(0, 4),
      projectKeywords: projectKeywords.slice(0, 3),
      locationFilters: userIntent?.location ? [userIntent.location] : effectiveLocations,
      workModeFilters: userIntent?.workMode ? [userIntent.workMode] : effectiveWorkModes,
      experienceLevelTerms: ["Intern", "Internship", "Early Career", "New Grad"],
      companyTargets: [],
      targetProviders: activeProviders,
      exclusionTerms,
      rationale: userIntent
        ? `Natural language search targeting ${userIntent.roleTitle || userIntent.category || "student opportunity"} (${userIntent.skills.join(", ") || "core tech stack"}).`
        : `Direct competency search targeting ${directTitles.slice(0, 2).join(", ")} with core stack (${topSkills.slice(0, 3).join(", ")}) in ${effectiveLocations[0] || "your vicinity"}.`,
      expectedCategory: userIntent?.category || "Internship",
      basePriority: 1,
      maxResults: config.resultsPerProvider,
    });

    // Multi-platform web portal discovery (LinkedIn/Naukri/Indeed/Wellfound/Internshala)
    if (hasTavily && !userQueryOverride?.trim()) {
      const cityFocus =
        effectiveLocations.find((l) => l && !/^(remote|flexible)$/i.test(l)) || "";
      const portalQuery = `${directTitles[0] || "Software Machine Learning Intern"} ${
        cityFocus ? `${cityFocus} ` : ""
      }(site:linkedin.com/jobs/view OR site:naukri.com/job-listings OR site:indeed.com OR site:wellfound.com/jobs OR site:internshala.com/internship/detail)`.trim();
      tryAddQuery({
        query: portalQuery,
        strategy: "DIRECT_ROLE",
        roleTitles: directTitles.slice(0, 3),
        skillCombinations: topSkills.slice(0, 4),
        projectKeywords: projectKeywords.slice(0, 2),
        locationFilters: effectiveLocations,
        workModeFilters: effectiveWorkModes,
        experienceLevelTerms: ["Intern", "Entry-level", "New Grad"],
        companyTargets: [],
        targetProviders: ["tavily"],
        exclusionTerms,
        rationale: `Multi-platform portal index query targeting live job listings near ${cityFocus || "your profile location"}.`,
        expectedCategory: "Internship",
        basePriority: 1,
        maxResults: config.resultsPerProvider,
      });
    }

    // Secondary direct query in Round 1 for software/engineering breadth
    if (directTitles.length > 1 || topSkills.length > 2) {
      tryAddQuery({
        query: `${directTitles[directTitles.length - 1]} ${topSkills.slice(0, 2).join(" ")} Intern`.trim(),
        strategy: "DIRECT_ROLE",
        roleTitles: directTitles,
        skillCombinations: topSkills.slice(0, 3),
        projectKeywords: [],
        locationFilters: effectiveLocations,
        workModeFilters: effectiveWorkModes,
        experienceLevelTerms: ["Intern", "New Grad"],
        companyTargets: [],
        targetProviders: activeProviders,
        exclusionTerms,
        rationale: "Secondary direct title search to establish baseline direct role coverage.",
        expectedCategory: "Internship",
        basePriority: 2,
        maxResults: config.resultsPerProvider,
      });
    }
  }

  // Strategy 2: Project-derived search (Expanded in Round >= 2 or if no direct roles exist)
  if ((roundNumber >= 2 || directRoles.length === 0) && (projectRoles.length > 0 || projectKeywords.length > 0)) {
    const projTitles =
      projectRoles.length > 0
        ? projectRoles.map((r) => r.title)
        : ["Computer Vision Intern", "Backend Systems Intern"];
    const projQuery = `${projTitles[0]} ${projectKeywords.slice(0, 3).join(" ")}`.trim();

    tryAddQuery({
      query: projQuery,
      strategy: "PROJECT_RESPONSIBILITY",
      roleTitles: projTitles,
      skillCombinations: projectKeywords.slice(0, 4),
      projectKeywords,
      locationFilters: effectiveLocations,
      workModeFilters: effectiveWorkModes,
      experienceLevelTerms: ["Intern", "Co-op", "Junior"],
      companyTargets: ["Scale AI", "Modal", "Linear"],
      targetProviders: prioritizeCareerFeeds
        ? [...activeProviders].reverse()
        : activeProviders,
      exclusionTerms,
      rationale: `Project-derived search inferred from demonstrated responsibilities in ${(profile.projects || []).map((p) => p.name).join(", ") || "candidate projects"}.`,
      expectedCategory: "Internship",
      basePriority: 1,
      maxResults: config.resultsPerProvider,
    });
  }

  // Strategy 3: Adjacent role search (Expanded in Round >= 2)
  if (roundNumber >= 2 && adjacentRoles.length > 0) {
    const adjTitles = adjacentRoles.map((r) => r.title);
    const adjQuery = `${adjTitles[0]} ${topSkills.slice(0, 3).join(" ")}`.trim();

    tryAddQuery({
      query: adjQuery,
      strategy: "ADJACENT_ROLE",
      roleTitles: adjTitles,
      skillCombinations: topSkills.slice(0, 4),
      projectKeywords: projectKeywords.slice(0, 3),
      locationFilters: effectiveLocations,
      workModeFilters: effectiveWorkModes,
      experienceLevelTerms: ["Intern", "Internship", "Associate"],
      companyTargets: ["Anthropic", "Scale AI", "Modal"],
      targetProviders: activeProviders,
      exclusionTerms,
      rationale: `Adjacent role expansion targeting ${adjTitles.join(", ")} where candidate skills overlap strongly.`,
      expectedCategory: "Internship",
      basePriority: 2,
      maxResults: config.resultsPerProvider,
    });
  }

  // Strategy 4: Research & Fellowship search (Round >= 2 when categories missing or low results)
  const shouldIncludeResearch =
    roundNumber >= 2 &&
    (expansionCasesTriggered.includes("CASE_E_MISSING_CATEGORIES") ||
      expansionCasesTriggered.includes("CASE_A_LOW_RESULT_COUNT") ||
      roundNumber >= 3);

  if (shouldIncludeResearch) {
    const researchQuery = `AI Research Assistant Fellowship Undergraduate Research ${topSkills.slice(0, 2).join(" ")}`.trim();
    tryAddQuery({
      query: researchQuery,
      strategy: "RESEARCH_ACADEMIC",
      roleTitles: [
        "AI Research Assistant",
        "Undergraduate Research Fellow",
        "Open Source AI Fellow",
      ],
      skillCombinations: topSkills.slice(0, 4),
      projectKeywords,
      locationFilters: effectiveLocations,
      workModeFilters: effectiveWorkModes,
      experienceLevelTerms: ["Fellow", "Research Intern", "REU", "Undergraduate"],
      companyTargets: ["Carnegie Mellon University", "MLCommons", "Anthropic", "Together AI"],
      targetProviders:
        config.mode === "DEMO"
          ? activeProviders
          : hasTavily
            ? [...activeProviders, "institutional_research"]
            : activeProviders,
      exclusionTerms,
      rationale:
        "Expands coverage to academic research assistantships, REU programs, and technical fellowships missing from standard job boards.",
      expectedCategory: "Research",
      basePriority: 2,
      maxResults: config.resultsPerProvider,
    });
  }

  // Strategy 5: Emerging / Specialized search (Model Evaluation / LLM Evaluation Intern) — Round >= 3 or Round 2 if prioritized
  if (emergingRoles.length > 0 && roundNumber >= 3) {
    const emTitles = emergingRoles.map((r) => r.title);
    const emQuery = `${emTitles[0]} Model Evaluation Benchmarking Python`.trim();
    tryAddQuery({
      query: emQuery,
      strategy: "EMERGING_SPECIALIZED",
      roleTitles: emTitles,
      skillCombinations: ["Python", "Model Evaluation", "Machine Learning", "TypeScript"],
      projectKeywords,
      locationFilters: effectiveLocations,
      workModeFilters: effectiveWorkModes,
      experienceLevelTerms: ["Intern", "Fellow", "Early Career"],
      companyTargets: ["Weights & Biases", "Anthropic", "Scale AI"],
      targetProviders: activeProviders,
      exclusionTerms,
      rationale: `Emerging/specialized search for ${emTitles.join(", ")}, backed by candidate's model evaluation and benchmarking evidence.`,
      expectedCategory: "Internship",
      basePriority: 1,
      maxResults: config.resultsPerProvider,
    });
  }

  // Strategy 6: Company Career Board targeted search (Round >= 3 or when duplicates/low coverage detected in Round >= 2)
  if (roundNumber >= 3 || (roundNumber >= 2 && prioritizeCareerFeeds)) {
    const companyQuery = `Anthropic Scale AI Weights & Biases Modal Intern ${topSkills.slice(0, 2).join(" ")}`.trim();
    tryAddQuery({
      query: companyQuery,
      strategy: "COMPANY_CAREER_BOARD",
      roleTitles: activeRoles.slice(0, 4).map((r) => r.title),
      skillCombinations: topSkills.slice(0, 4),
      projectKeywords,
      locationFilters: effectiveLocations,
      workModeFilters: effectiveWorkModes,
      experienceLevelTerms: ["Intern", "Fellow"],
      companyTargets: [
        "Anthropic",
        "Scale AI",
        "Weights & Biases",
        "Modal",
        "Stripe",
        "Linear",
        "Databricks",
        "Figma",
        "Vercel",
        "Cloudflare",
        "Discord",
        "Together AI",
      ],
      targetProviders:
        config.mode === "DEMO" ? ["demo_career_feeds"] : ["career_feeds"],
      exclusionTerms,
      rationale:
        "Direct company career-board sweep across participating Greenhouse, Lever, and Ashby boards for AI/ML and systems organizations.",
      expectedCategory: "Internship",
      basePriority: 2,
      maxResults: config.resultsPerProvider,
    });
  }

  // Sort by priority and bound by queriesPerRound and remainingBudget
  candidateQueryItems.sort((a, b) => a.priority - b.priority);
  const maxQueriesThisRound = Math.min(
    config.queriesPerRound || 4,
    Math.max(1, remainingBudget)
  );
  const selectedQueries = candidateQueryItems.slice(0, maxQueriesThisRound);

  // Mark selected queries as executed so future rounds never repeat them
  for (const q of selectedQueries) {
    executedQueries.add(normalizeQueryKey(q.query, q.strategy));
  }

  const allRoleTitles = Array.from(
    new Set(selectedQueries.flatMap((q) => q.roleTitles))
  );
  const allCompanyTargets = Array.from(
    new Set(selectedQueries.flatMap((q) => q.companyTargets))
  );
  const allProviders = Array.from(
    new Set(selectedQueries.flatMap((q) => q.targetProviders))
  );

  const expectedCategory: OpportunityCategory =
    selectedQueries[0]?.expectedCategory || "Internship";

  const rawPlan: SearchPlan = {
    roundId: `round-${roundNumber}-${Date.now()}`,
    roundNumber,
    queryGroups: selectedQueries,
    roleTitles: allRoleTitles,
    skillCombinations: topSkills,
    projectResponsibilityKeywords: projectKeywords,
    locationFilters: effectiveLocations,
    workModeFilters: effectiveWorkModes,
    experienceLevelTerms: ["Intern", "Internship", "Fellowship", "Research", "Early-Career"],
    companyCareerTargets: allCompanyTargets,
    relevantSourceProviders: allProviders,
    exclusionTerms,
    queryRationale:
      roundNumber === 1
        ? `Round 1 prioritizes direct role alignment (${directTitles.slice(0, 2).join(", ")}) and core project capabilities while enforcing all hard candidate constraints.`
        : `Round ${roundNumber} adaptively expands search into ${selectedQueries.map((q) => q.strategy).join(", ")} triggered by [${expansionCasesTriggered.join(", ") || "coverage expansion"}] without relaxing mandatory constraints.`,
    expectedResultCategory: expectedCategory,
    priority: 1,
    maxResultLimits: config.resultsPerProvider,
    hardConstraints,
    softPreferences,
    plannerSource: "DETERMINISTIC",
    expansionReasonsTriggered: expansionCasesTriggered,
    createdAt: new Date().toISOString(),
  };

  // Validate against Zod schema before returning
  return SearchPlanSchema.parse(rawPlan);
}

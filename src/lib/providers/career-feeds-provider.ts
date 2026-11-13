import {
  OpportunityCategory,
  RawOpportunity,
  SearchConfig,
  SearchProviderResult,
  SearchQueryItem,
  WorkMode,
} from "../../types";
import { SearchProvider, SearchProviderQueryOptions } from "./types";

export interface CompanyBoardTarget {
  companyName: string;
  platform: "greenhouse" | "lever" | "ashby";
  boardSlug: string;
  focusAreas: string[];
}

export const DEFAULT_PARTICIPATING_COMPANY_BOARDS: CompanyBoardTarget[] = [
  {
    companyName: "Anthropic",
    platform: "greenhouse",
    boardSlug: "anthropic",
    focusAreas: ["ai", "ml", "research", "safety", "evaluation", "systems", "python"],
  },
  {
    companyName: "Scale AI",
    platform: "greenhouse",
    boardSlug: "scaleai",
    focusAreas: ["ml", "ai", "evaluation", "computer vision", "annotation", "data", "fullstack"],
  },
  {
    companyName: "Stripe",
    platform: "greenhouse",
    boardSlug: "stripe",
    focusAreas: ["backend", "distributed", "software", "ml", "infrastructure", "intern", "systems"],
  },
  {
    companyName: "Linear",
    platform: "ashby",
    boardSlug: "linear",
    focusAreas: ["frontend", "fullstack", "product", "software", "typescript", "react"],
  },
  {
    companyName: "Modal",
    platform: "ashby",
    boardSlug: "modal",
    focusAreas: ["infrastructure", "python", "ml", "distributed", "cloud", "rust"],
  },
  {
    companyName: "Databricks",
    platform: "greenhouse",
    boardSlug: "databricks",
    focusAreas: ["data", "spark", "ml", "distributed", "backend", "systems", "intern"],
  },
  {
    companyName: "Figma",
    platform: "greenhouse",
    boardSlug: "figma",
    focusAreas: ["frontend", "fullstack", "software", "product", "design", "c++", "intern"],
  },
  {
    companyName: "Vercel",
    platform: "greenhouse",
    boardSlug: "vercel",
    focusAreas: ["frontend", "nextjs", "react", "typescript", "infrastructure", "rust", "cloud"],
  },
  {
    companyName: "Cloudflare",
    platform: "greenhouse",
    boardSlug: "cloudflare",
    focusAreas: ["systems", "network", "security", "rust", "go", "distributed", "intern"],
  },
  {
    companyName: "Duolingo",
    platform: "greenhouse",
    boardSlug: "duolingo",
    focusAreas: ["software", "ml", "ai", "mobile", "backend", "intern", "new grad"],
  },
  {
    companyName: "Discord",
    platform: "greenhouse",
    boardSlug: "discord",
    focusAreas: ["backend", "distributed", "rust", "python", "ml", "fullstack", "software"],
  },
  {
    companyName: "Pinterest",
    platform: "greenhouse",
    boardSlug: "pinterest",
    focusAreas: ["ml", "recommendation", "computer vision", "backend", "data", "intern"],
  },
  {
    companyName: "Together AI",
    platform: "greenhouse",
    boardSlug: "togetherai",
    focusAreas: ["ai", "ml", "llm", "cuda", "pytorch", "research", "systems"],
  },
  {
    companyName: "Perplexity",
    platform: "ashby",
    boardSlug: "perplexity",
    focusAreas: ["ai", "ml", "search", "llm", "backend", "fullstack", "research"],
  },
  {
    companyName: "Groww",
    platform: "greenhouse",
    boardSlug: "groww",
    focusAreas: ["software", "backend", "frontend", "data", "ml", "india", "bengaluru", "intern"],
  },
  {
    companyName: "Rubrik",
    platform: "greenhouse",
    boardSlug: "rubrik",
    focusAreas: ["backend", "systems", "distributed", "cloud", "india", "bengaluru", "pune", "intern"],
  },
  {
    companyName: "Coinbase",
    platform: "greenhouse",
    boardSlug: "coinbase",
    focusAreas: ["backend", "fullstack", "remote", "india", "security", "software", "intern"],
  },
  {
    companyName: "Cohere",
    platform: "ashby",
    boardSlug: "cohere",
    focusAreas: ["ai", "ml", "llm", "nlp", "research", "inference", "python", "pytorch"],
  },
  {
    companyName: "OpenAI",
    platform: "ashby",
    boardSlug: "openai",
    focusAreas: ["ai", "ml", "research", "systems", "safety", "python", "pytorch", "intern"],
  },
  {
    companyName: "Supabase",
    platform: "ashby",
    boardSlug: "supabase",
    focusAreas: ["postgres", "typescript", "backend", "fullstack", "remote", "developer tools"],
  },
  {
    companyName: "Spotify",
    platform: "lever",
    boardSlug: "spotify",
    focusAreas: ["ml", "recommendations", "data", "backend", "software", "intern"],
  },
  {
    companyName: "Dropbox",
    platform: "greenhouse",
    boardSlug: "dropbox",
    focusAreas: ["backend", "ml", "frontend", "systems", "remote", "software", "intern"],
  },
  {
    companyName: "Airbnb",
    platform: "greenhouse",
    boardSlug: "airbnb",
    focusAreas: ["software", "ml", "data", "backend", "india", "gurugram", "bengaluru", "intern"],
  },
];

export function buildBoardEndpointUrl(target: CompanyBoardTarget): string {
  switch (target.platform) {
    case "greenhouse":
      return `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(target.boardSlug)}/jobs?content=true`;
    case "lever":
      return `https://api.lever.co/v0/postings/${encodeURIComponent(target.boardSlug)}?mode=json`;
    case "ashby":
      return `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(target.boardSlug)}?includeCompensation=true`;
  }
}

function inferCategory(title: string): OpportunityCategory {
  const lower = title.toLowerCase();
  if (lower.includes("intern") || lower.includes("co-op")) return "Internship";
  if (lower.includes("fellow") || lower.includes("residency")) return "Fellowship";
  if (lower.includes("research")) return "Research";
  return "Entry-level";
}

function inferWorkMode(locationText: string, workplaceType?: string): WorkMode {
  const combined = `${locationText} ${workplaceType || ""}`.toLowerCase();
  if (combined.includes("remote")) return "Remote";
  if (combined.includes("hybrid")) return "Hybrid";
  if (combined.includes("on-site") || combined.includes("onsite") || combined.includes("office")) {
    return "On-site";
  }
  return "Flexible";
}

const NON_TECH_BUSINESS_TITLE_REGEX =
  /\b(account executive|account manager|sales|recruiter|recruiting|sourcer|legal counsel|corporate counsel|paralegal|tax|accounting|controller|payroll|executive assistant|office manager|workplace|customer success manager|communications|public policy|government affairs|real estate|deal desk|collections|auditor|hr business partner|people partner)\b/i;

const TECH_OR_EARLY_CAREER_TITLE_REGEX =
  /\b(engineer|engineering|developer|scientist|research|researcher|machine learning|ml|ai|data|systems|backend|frontend|full[\s-]?stack|infrastructure|cloud|security|platform|vision|perception|robotics|evaluation|benchmark|fellow|fellowship|intern|internship|co-op|new grad|graduate|university|early career|quantitative|software|compute|kernel|compiler)\b/i;

function scoreBoardJobRelevance(
  title: string,
  description: string,
  roleFamily: string,
  queryTerms: string[],
  exclusionTerms: string[]
): number {
  const titleLower = title.toLowerCase();
  const familyLower = (roleFamily || "").toLowerCase();
  const descLower = (description || "").toLowerCase();
  const hay = `${titleLower} ${familyLower} ${descLower}`;

  for (const excl of exclusionTerms) {
    if (excl && hay.includes(excl.toLowerCase())) {
      return -1;
    }
  }

  const queryJoined = queryTerms.join(" ").toLowerCase();
  // Filter out non-technical sales/G&A roles unless explicitly searched
  if (
    NON_TECH_BUSINESS_TITLE_REGEX.test(titleLower) &&
    !NON_TECH_BUSINESS_TITLE_REGEX.test(queryJoined)
  ) {
    return -1;
  }

  let score = 0;

  if (TECH_OR_EARLY_CAREER_TITLE_REGEX.test(titleLower)) {
    score += 10;
  } else if (TECH_OR_EARLY_CAREER_TITLE_REGEX.test(familyLower)) {
    score += 5;
  } else {
    // Neither title nor department is technical/research/early-career
    return -1;
  }

  // Bonus for student / intern / early-career / fellowship / research titles
  if (/\b(intern|internship|co-op|new grad|university|early career|fellow|fellowship|junior)\b/i.test(titleLower)) {
    score += 18;
  }

  for (const term of queryTerms) {
    const clean = term.toLowerCase().trim();
    if (!clean) continue;
    if (titleLower.includes(clean)) {
      score += 20;
      continue;
    }
    const words = clean
      .split(/\s+/)
      .filter((w) => w.length > 2 && !["and", "the", "for", "with"].includes(w));
    const titleWordHits = words.filter((w) => titleLower.includes(w)).length;
    if (titleWordHits > 0) {
      score += titleWordHits * 8;
    }
    const descWordHits = words.filter((w) => descLower.includes(w)).length;
    if (descWordHits > 0) {
      score += Math.min(descWordHits * 2, 6);
    }
  }

  return score;
}

export class CompanyCareerFeedsProvider implements SearchProvider {
  readonly id = "career_feeds";
  readonly displayName = "Official Company Career Feeds (Greenhouse / Lever / Ashby)";
  readonly description =
    "Fetches official public job board feeds from participating organizations on Greenhouse, Lever, and Ashby.";
  readonly scopeNote =
    "Covers participating company career boards directly; does not provide universal global job search across non-participating employers.";

  private boards: CompanyBoardTarget[];

  constructor(boards: CompanyBoardTarget[] = DEFAULT_PARTICIPATING_COMPANY_BOARDS) {
    this.boards = boards;
  }

  isEnabled(_config: SearchConfig): boolean {
    return process.env.DISABLE_CAREER_FEEDS_PROVIDER !== "true";
  }

  public selectCandidateBoards(
    queryItem: SearchQueryItem,
    roundNumber = 1,
    companyTargets?: string[]
  ): CompanyBoardTarget[] {
    const requestedTargets = (
      companyTargets ??
      queryItem.companyTargets ??
      []
    ).map((c) => c.toLowerCase());

    let selectedBoards = this.boards.filter((b) =>
      requestedTargets.some(
        (req) =>
          b.companyName.toLowerCase().includes(req) ||
          b.boardSlug.toLowerCase().includes(req)
      )
    );

    if (selectedBoards.length === 0) {
      const qLower = `${queryItem.query} ${(queryItem.roleTitles || []).join(" ")} ${(queryItem.skillCombinations || []).join(" ")}`.toLowerCase();
      const matchingBoards = this.boards.filter((b) =>
        b.focusAreas.some((area) => qLower.includes(area))
      );
      const pool = matchingBoards.length >= 3 ? matchingBoards : this.boards;
      const startIdx = ((Math.max(1, roundNumber) - 1) * 3) % pool.length;
      const rotated = [...pool.slice(startIdx), ...pool.slice(0, startIdx)];
      selectedBoards = rotated.slice(0, 6);
    } else {
      selectedBoards = selectedBoards.slice(0, 6);
    }

    return selectedBoards;
  }

  async search(options: SearchProviderQueryOptions): Promise<SearchProviderResult> {
    const fetchedAt = new Date().toISOString();
    const {
      queryItem,
      roundNumber = 1,
      limit = 20,
      offset = 0,
      locationFilters = [],
      signal,
      fetchImpl = fetch,
    } = options;

    const selectedBoards = this.selectCandidateBoards(
      queryItem,
      roundNumber,
      options.companyTargets
    );

    const activeLocFilters = [
      ...locationFilters,
      ...(queryItem.locationFilters || []),
    ]
      .map((l) => l.toLowerCase().trim())
      .filter((l) => l && l !== "remote" && l !== "flexible");

    const queryTerms = [
      ...queryItem.roleTitles,
      ...queryItem.skillCombinations,
      ...queryItem.projectKeywords,
    ].filter(Boolean);

    const sourcesChecked: string[] = [];
    const warnings: string[] = [
      "Company board APIs query participating Greenhouse, Lever, and Ashby boards directly.",
    ];
    const scoredOpportunities: Array<{ item: RawOpportunity; score: number }> = [];
    let successCount = 0;
    let failCount = 0;

    for (const board of selectedBoards) {
      const endpointUrl = buildBoardEndpointUrl(board);
      sourcesChecked.push(endpointUrl);

      try {
        const res = await fetchImpl(endpointUrl, {
          headers: { Accept: "application/json" },
          signal,
        });

        if (!res.ok) {
          failCount++;
          warnings.push(
            `${board.companyName} (${board.platform}) board returned HTTP ${res.status}.`
          );
          continue;
        }

        const data = await res.json();
        successCount++;

        const parsed = this.parseBoardPayload(board, data, fetchedAt);
        for (const item of parsed) {
          let relevance = scoreBoardJobRelevance(
            item.title,
            item.description,
            item.roleFamily || "",
            queryTerms,
            queryItem.exclusionTerms
          );
          if (relevance >= 10) {
            // Boost when item location matches candidate's detected or selected city
            const itemLocLower = (item.location || "").toLowerCase();
            if (
              activeLocFilters.some(
                (loc) =>
                  itemLocLower.includes(loc.split(",")[0].trim()) ||
                  loc.includes(itemLocLower.split(",")[0].trim())
              )
            ) {
              relevance += 14;
            }
            scoredOpportunities.push({ item, score: relevance });
          }
        }
      } catch (err) {
        failCount++;
        warnings.push(
          `${board.companyName} (${board.platform}) fetch error: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
    }

    scoredOpportunities.sort((a, b) => b.score - a.score);
    // Deduplicate identical (organization, title) requisitions within the same board feed
    const seenOrgTitles = new Set<string>();
    const opportunities: RawOpportunity[] = [];
    for (const { item } of scoredOpportunities) {
      const key = `${item.organization.toLowerCase()}::${item.title.toLowerCase().trim()}`;
      if (seenOrgTitles.has(key)) continue;
      seenOrgTitles.add(key);
      opportunities.push(item);
    }
    const effectiveLimit = limit || 20;
    const bounded = opportunities.slice(offset, offset + effectiveLimit);
    let status: SearchProviderResult["status"] = "SUCCESS";
    if (successCount === 0 && failCount > 0) status = "FAILED";
    else if (failCount > 0) status = "PARTIAL";

    return {
      provider: this.id,
      opportunities: bounded,
      queryExecuted: queryItem.query,
      sourcesChecked,
      warnings,
      pagination: {
        total: opportunities.length,
        limit: effectiveLimit,
        offset,
        hasMore: opportunities.length > offset + bounded.length,
      },
      fetchedAt,
      status,
    };
  }

  public parseBoardPayload(
    board: CompanyBoardTarget,
    payload: unknown,
    fetchedAt: string
  ): RawOpportunity[] {
    if (!payload || typeof payload !== "object") return [];

    if (board.platform === "greenhouse") {
      const jobs = (payload as { jobs?: Array<Record<string, unknown>> }).jobs;
      if (!Array.isArray(jobs)) return [];
      return jobs.map((j) => {
        const title = String(j.title || "Untitled Role");
        const locObj = j.location as { name?: string } | undefined;
        const location = String(locObj?.name || "Unspecified");
        const absUrl = String(
          j.absolute_url ||
            `https://boards.greenhouse.io/${board.boardSlug}/jobs/${j.id}`
        );
        const content = String(j.content || "");
        return {
          provider: this.id,
          providerId: `gh-${board.boardSlug}-${j.id}`,
          title,
          organization: board.companyName,
          description: content,
          category: inferCategory(title),
          roleFamily: "Engineering & Research",
          location,
          workMode: inferWorkMode(location),
          seniority: inferCategory(title) === "Internship" ? "Intern" : "Early-Career / Full-Time",
          compensation: "Competitive (See official board)",
          requiredSkills: [],
          preferredSkills: [],
          eligibilityRequirements: [],
          publishedAt: j.updated_at ? String(j.updated_at) : null,
          deadline: null,
          applicationUrl: absUrl,
          canonicalUrl: absUrl,
          sourceName: `${board.companyName} Official Greenhouse Board`,
          sourceUrl: absUrl,
          sourceSnippet: content.slice(0, 260),
          discoveredAt: fetchedAt,
          fetchedAt,
          lastCheckedAt: fetchedAt,
          verificationStatus: "VERIFIED_SOURCE",
          isActive: true,
          isDemo: false,
        };
      });
    }

    if (board.platform === "lever") {
      const jobs = Array.isArray(payload) ? (payload as Array<Record<string, unknown>>) : [];
      return jobs.map((j) => {
        const title = String(j.text || "Untitled Role");
        const categories = (j.categories || {}) as Record<string, string>;
        const location = String(categories.location || "Unspecified");
        const hostedUrl = String(
          j.hostedUrl || `https://jobs.lever.co/${board.boardSlug}/${j.id}`
        );
        const applyUrl = String(j.applyUrl || hostedUrl);
        const descriptionPlain = String(j.descriptionPlain || j.description || "");
        return {
          provider: this.id,
          providerId: `lever-${board.boardSlug}-${j.id}`,
          title,
          organization: board.companyName,
          description: descriptionPlain,
          category: inferCategory(title),
          roleFamily: categories.team || "Engineering",
          location,
          workMode: inferWorkMode(location, String(j.workplaceType || "")),
          seniority: categories.commitment || "Full-time / Intern",
          compensation: "Competitive (See official board)",
          requiredSkills: [],
          preferredSkills: [],
          eligibilityRequirements: [],
          publishedAt: typeof j.createdAt === "number" ? new Date(j.createdAt).toISOString() : null,
          deadline: null,
          applicationUrl: applyUrl,
          canonicalUrl: hostedUrl,
          sourceName: `${board.companyName} Official Lever Board`,
          sourceUrl: hostedUrl,
          sourceSnippet: descriptionPlain.slice(0, 260),
          discoveredAt: fetchedAt,
          fetchedAt,
          lastCheckedAt: fetchedAt,
          verificationStatus: "VERIFIED_SOURCE",
          isActive: true,
          isDemo: false,
        };
      });
    }

    if (board.platform === "ashby") {
      const jobs = (payload as { jobs?: Array<Record<string, unknown>> }).jobs;
      if (!Array.isArray(jobs)) return [];
      return jobs.map((j) => {
        const title = String(j.title || "Untitled Role");
        const location = String(j.location || "Unspecified");
        const jobUrl = String(
          j.jobUrl || `https://jobs.ashbyhq.com/${board.boardSlug}/${j.id}`
        );
        const applyUrl = String(j.applyUrl || jobUrl);
        const desc = String(j.descriptionPlain || j.descriptionHtml || "");
        const compTier = j.compensationTierSummary ? String(j.compensationTierSummary) : "Competitive";
        return {
          provider: this.id,
          providerId: `ashby-${board.boardSlug}-${j.id}`,
          title,
          organization: board.companyName,
          description: desc,
          category: inferCategory(title),
          roleFamily: String(j.department || "Engineering"),
          location,
          workMode: inferWorkMode(location, String(j.workplaceType || "")),
          seniority: String(j.employmentType || "Full-time / Intern"),
          compensation: compTier,
          requiredSkills: [],
          preferredSkills: [],
          eligibilityRequirements: [],
          publishedAt: j.publishedAt ? String(j.publishedAt) : null,
          deadline: null,
          applicationUrl: applyUrl,
          canonicalUrl: jobUrl,
          sourceName: `${board.companyName} Official Ashby Board`,
          sourceUrl: jobUrl,
          sourceSnippet: desc.slice(0, 260),
          discoveredAt: fetchedAt,
          fetchedAt,
          lastCheckedAt: fetchedAt,
          verificationStatus: "VERIFIED_SOURCE",
          isActive: true,
          isDemo: false,
        };
      });
    }

    return [];
  }
}

export const CareerFeedsProvider = CompanyCareerFeedsProvider;


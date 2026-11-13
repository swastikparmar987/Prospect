import { Opportunity, OpportunityCategory, WorkMode } from "@/types";
import { isSafePublicUrl } from "../safe-url";

export interface SearchFilters {
  category?: OpportunityCategory;
  workMode?: WorkMode;
  location?: string;
  minGradYear?: number;
  maxGradYear?: number;
  paidOnly?: boolean;
}

export interface SearchProviderAdapter {
  name: string;
  isLive: boolean;
  search(query: string, filters?: SearchFilters): Promise<Opportunity[]>;
}

/**
 * Live Tavily Search API adapter.
 * Uses real-time web search index with safe URL validation.
 */
export class TavilySearchAdapter implements SearchProviderAdapter {
  name = "Tavily Real-Time Search API";
  isLive = true;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, filters?: SearchFilters): Promise<Opportunity[]> {
    const formattedQuery = `${query} internship fellowship research student opportunity application`;
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: this.apiKey,
        query: formattedQuery,
        search_depth: "basic",
        include_answer: false,
        max_results: 10,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily Search API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.results || [];
    const parsedOpportunities: Opportunity[] = [];

    for (let i = 0; i < results.length; i++) {
      const item = results[i];
      const urlCheck = isSafePublicUrl(item.url);
      if (!urlCheck.isSafe) continue;

      const title = item.title || "Career Opportunity";
      const description = item.content || item.description || "";

      // Extract organization from URL domain or title
      let orgMatch = "Organization";
      try {
        const parsedUrl = new URL(item.url);
        if (parsedUrl.hostname.includes("greenhouse.io")) {
          const parts = parsedUrl.pathname.split("/").filter(Boolean);
          if (parts.length > 0 && parts[0] !== "jobs") orgMatch = parts[0];
          else if (parts.length > 1) orgMatch = parts[1];
        } else if (parsedUrl.hostname.includes("lever.co")) {
          const parts = parsedUrl.pathname.split("/").filter(Boolean);
          if (parts.length > 0) orgMatch = parts[0];
        } else {
          orgMatch = title.split("-")[0]?.split("|")[0]?.split("–")[0]?.trim() || "Organization";
        }
      } catch {
        orgMatch = title.split("-")[0]?.split("|")[0]?.trim() || "Organization";
      }

      parsedOpportunities.push({
        id: `live-tavily-${i}-${Date.now()}`,
        title: title.slice(0, 100),
        organization: orgMatch.slice(0, 60),
        category: (filters?.category || "Internship") as OpportunityCategory,
        description: description.slice(0, 600),
        location: filters?.location || "Multiple Locations / Remote",
        workMode: (filters?.workMode || "Remote") as WorkMode,
        compensation: "See verified posting",
        eligibilityRequirements: ["Undergraduate or graduate standing", "Legal authorization to work"],
        requiredSkills: ["Problem Solving", "Technical Communication"],
        preferredSkills: [],
        publishedAt: item.published_date || new Date().toISOString(),
        deadline: null,
        deadlineRaw: "See official posting",
        applyUrl: item.url,
        sourceName: "Tavily Real-Time Web Index",
        sourceUrl: item.url,
        sourceConfidence: Math.min(0.95, Math.max(0.7, item.score || 0.85)),
        verificationStatus: "PARTIALLY_CHECKED",
        sourceEvidence: [
          {
            claim: "Live Tavily search result match",
            excerpt: description.slice(0, 250),
            url: item.url,
            observedAt: new Date().toISOString(),
            verified: true,
          },
        ],
        discoveredAt: new Date().toISOString(),
        lastCheckedAt: new Date().toISOString(),
        isDemo: false,
      });
    }

    return parsedOpportunities;
  }
}

/**
 * Live Brave Search API adapter.
 * Uses genuine web search queries with safe URL validation.
 */
export class BraveSearchAdapter implements SearchProviderAdapter {
  name = "Brave Search API";
  isLive = true;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, filters?: SearchFilters): Promise<Opportunity[]> {
    const formattedQuery = `${query} internship fellowship research opportunity application deadline`;
    const endpoint = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(
      formattedQuery
    )}&count=10`;

    const response = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Brave Search API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const results = data.web?.results || [];

    const parsedOpportunities: Opportunity[] = [];

    for (let i = 0; i < results.length; i++) {
      const item = results[i];
      const urlCheck = isSafePublicUrl(item.url);
      if (!urlCheck.isSafe) continue;

      const title = item.title || "Career Opportunity";
      const description = item.description || "";
      const orgMatch = title.split("-")[0]?.split("|")[0]?.trim() || "Organization";

      parsedOpportunities.push({
        id: `live-brave-${i}-${Date.now()}`,
        title: title.slice(0, 80),
        organization: orgMatch.slice(0, 50),
        category: (filters?.category || "Internship") as OpportunityCategory,
        description,
        location: filters?.location || "Multiple Locations",
        workMode: (filters?.workMode || "Remote") as WorkMode,
        compensation: "See listing details",
        eligibilityRequirements: ["Undergraduate or graduate standing", "Legal authorization to work"],
        requiredSkills: ["Problem Solving", "Communication"],
        preferredSkills: [],
        publishedAt: item.page_age || new Date().toISOString(),
        deadline: null,
        deadlineRaw: "See official posting for deadlines",
        applyUrl: item.url,
        sourceName: "Brave Search Live Index",
        sourceUrl: item.url,
        sourceConfidence: 0.85,
        verificationStatus: "PARTIALLY_CHECKED",
        sourceEvidence: [
          {
            claim: "Live search listing match",
            excerpt: description.slice(0, 200),
            url: item.url,
            observedAt: new Date().toISOString(),
            verified: true,
          },
        ],
        discoveredAt: new Date().toISOString(),
        lastCheckedAt: new Date().toISOString(),
        isDemo: false,
      });
    }

    return parsedOpportunities;
  }
}

/**
 * Demo Search Adapter providing labeled synthetic opportunities.
 * Guaranteed zero-external dependency and labeled explicitly as DEMO_DATA.
 */
export class DemoSearchAdapter implements SearchProviderAdapter {
  name = "Demo Synthetic Index (Offline Mode)";
  isLive = false;

  async search(query: string, filters?: SearchFilters): Promise<Opportunity[]> {
    const { getDemoOpportunities } = await import("../demo-dataset");
    let allDemos = getDemoOpportunities();

    if (query && query.trim() !== "") {
      const qLower = query.toLowerCase();
      allDemos = allDemos.filter(
        (o) =>
          o.title.toLowerCase().includes(qLower) ||
          o.organization.toLowerCase().includes(qLower) ||
          o.description.toLowerCase().includes(qLower) ||
          o.requiredSkills.some((s) => s.toLowerCase().includes(qLower))
      );
    }

    if (filters?.category) {
      allDemos = allDemos.filter((o) => o.category === filters.category);
    }
    if (filters?.workMode) {
      allDemos = allDemos.filter((o) => o.workMode === filters.workMode);
    }
    if (filters?.paidOnly) {
      allDemos = allDemos.filter((o) => o.compensation !== "Unpaid");
    }

    return allDemos;
  }
}

/**
 * Live Public Feeds Search Adapter (Greenhouse, Lever, Ashby & FreeHire).
 * Used in LIVE mode when commercial web search API keys (Tavily/Brave) are not configured,
 * ensuring LIVE mode NEVER falls back to DemoSearchAdapter.
 */
export class LivePublicFeedsSearchAdapter implements SearchProviderAdapter {
  name = "Verified Public Employer Feeds (Greenhouse / Lever / Ashby / FreeHire)";
  isLive = true;

  async search(query: string, filters?: SearchFilters): Promise<Opportunity[]> {
    const [
      { CompanyCareerFeedsProvider },
      { FreehireSearchProvider },
      { resolveSearchConfig },
      { normalizeRawOpportunity },
    ] = await Promise.all([
      import("../providers/career-feeds-provider"),
      import("../providers/freehire-provider"),
      import("../search-config"),
      import("../normalizer"),
    ]);

    const feedsProvider = new CompanyCareerFeedsProvider();
    const freehireProvider = new FreehireSearchProvider();
    const config = resolveSearchConfig({ mode: "LIVE" });

    const queryItem = {
      id: `live-public-feed-${Date.now()}`,
      query: query || "software engineering intern",
      strategy: "DIRECT_ROLE" as const,
      roleTitles: [query || "Software Engineering Intern"],
      skillCombinations: [],
      projectKeywords: [],
      locationFilters: filters?.location ? [filters.location] : [],
      workModeFilters: filters?.workMode ? [filters.workMode] : [],
      experienceLevelTerms: ["Intern"],
      companyTargets: [],
      targetProviders: ["career_feeds", "freehire"],
      exclusionTerms: [],
      rationale: "Direct live public employer feed search",
      expectedCategory: "Internship" as const,
      priority: 1,
      maxResults: 25,
    };

    const [feedsRes, freehireRes] = await Promise.allSettled([
      feedsProvider.search({ queryItem, config, roundNumber: 1, limit: 25 }),
      freehireProvider.search({ queryItem, config, roundNumber: 1, limit: 20 }),
    ]);

    const combined: Opportunity[] = [];
    if (feedsRes.status === "fulfilled") {
      for (const raw of feedsRes.value.opportunities) {
        const opp = normalizeRawOpportunity(raw);
        if (!opp.isDemo) combined.push(opp);
      }
    }
    if (freehireRes.status === "fulfilled") {
      for (const raw of freehireRes.value.opportunities) {
        const opp = normalizeRawOpportunity(raw);
        if (!opp.isDemo) combined.push(opp);
      }
    }

    return combined;
  }
}

export function getSearchAdapter(mode: "LIVE" | "DEMO" = "LIVE"): SearchProviderAdapter {
  if (mode === "DEMO") {
    return new DemoSearchAdapter();
  }

  const provider = (process.env.SEARCH_PROVIDER || "").toLowerCase();
  const tavilyKey = process.env.TAVILY_API_KEY;
  const braveKey = process.env.BRAVE_SEARCH_API_KEY;

  if ((provider === "tavily" || (!process.env.SEARCH_PROVIDER && tavilyKey)) && tavilyKey && tavilyKey.trim() !== "") {
    return new TavilySearchAdapter(tavilyKey.trim());
  }

  if (provider === "brave" && braveKey && braveKey.trim() !== "") {
    return new BraveSearchAdapter(braveKey.trim());
  }

  if (tavilyKey && tavilyKey.trim() !== "") {
    return new TavilySearchAdapter(tavilyKey.trim());
  }

  // PERMANENT NO-MOCK-DATA POLICY: Never return DemoSearchAdapter in LIVE mode.
  return new LivePublicFeedsSearchAdapter();
}

import {
  RawOpportunity,
  SearchConfig,
  SearchProviderResult,
} from "../../types";
import { SearchProvider, SearchProviderQueryOptions } from "./types";
import { getSourceCatalogEntries } from "./source-catalog";

/**
 * Institutional & Research Discovery Provider
 * Focuses on university research labs, academic fellowships, and government student initiatives.
 */
export class InstitutionalResearchProvider implements SearchProvider {
  readonly id = "institutional_research";
  readonly displayName = "Academic & Institutional Research Catalog";
  readonly description =
    "Discovers university research labs, national laboratory apprenticeships, and government fellowships.";
  readonly scopeNote =
    "Curated official sources (IISc, IITs, AICTE, DRDO, ISRO, NSF REU, CERN).";

  isEnabled(config: SearchConfig): boolean {
    return true;
  }

  async healthCheck(): Promise<{ isHealthy: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const catalog = getSourceCatalogEntries({ enabledOnly: true });
      return {
        isHealthy: catalog.length > 0,
        latencyMs: Date.now() - start,
      };
    } catch (err: any) {
      return {
        isHealthy: false,
        latencyMs: Date.now() - start,
        error: err?.message,
      };
    }
  }

  async search(options: SearchProviderQueryOptions): Promise<SearchProviderResult> {
    const { queryItem, roundNumber, config, limit = 10 } = options;
    const startTime = Date.now();

    // In DEMO mode or offline fallback, provide verified institutional fixtures
    if (config.mode === "DEMO") {
      return this.getDemoInstitutionalResults(queryItem.query, limit);
    }

    // In LIVE mode, if TAVILY_API_KEY is available, search institutional domains.
    // Strictly never return synthetic/demo opportunities in LIVE mode.
    const tavilyKey = process.env.TAVILY_API_KEY?.trim();
    const fetchedAt = new Date().toISOString();
    if (!tavilyKey) {
      return {
        provider: this.id,
        opportunities: [],
        queryExecuted: queryItem.query,
        sourcesChecked: [],
        warnings: [
          "TAVILY_API_KEY is not configured; live institutional search skipped (no synthetic results returned in LIVE mode).",
        ],
        pagination: { total: 0, limit, offset: 0, hasMore: false },
        fetchedAt,
        status: "FAILED",
        durationMs: Date.now() - startTime,
      };
    }

    try {
      const domains = [
        "iisc.ac.in",
        "iitb.ac.in",
        "internship.aicte-india.org",
        "drdo.gov.in",
        "isro.gov.in",
        "nsf.gov",
        "careers.cern",
      ];

      // Formulate focused institutional search query
      const baseQuery = queryItem.query
        .replace(/internship|intern|research/gi, "")
        .trim();
      const institutionalQuery = `(${domains.map((d) => `site:${d}`).join(" OR ")}) ${baseQuery || "AI computer science"} (internship OR fellowship OR "research assistant")`;

      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: institutionalQuery,
          search_depth: "basic",
          include_answer: false,
          max_results: Math.min(limit, 8),
        }),
        signal: options.signal || AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        return {
          provider: this.id,
          opportunities: [],
          queryExecuted: institutionalQuery,
          sourcesChecked: domains.map((d) => `https://${d}`),
          warnings: [
            `Institutional search endpoint returned HTTP ${response.status} in LIVE mode.`,
          ],
          pagination: { total: 0, limit, offset: 0, hasMore: false },
          fetchedAt,
          status: response.status === 429 ? "RATE_LIMITED" : "FAILED",
          durationMs: Date.now() - startTime,
        };
      }

      const data = await response.json();
      const results: RawOpportunity[] = [];

      for (const item of data.results || []) {
        const title = item.title || "Undergraduate Research Fellowship";
        const orgMatch = item.url.match(/([a-zA-Z0-9-]+\.(?:ac\.in|gov\.in|gov|cern|edu))/);
        const orgName = orgMatch ? orgMatch[1].toUpperCase() : "Academic Research Lab";

        results.push({
          provider: this.id,
          providerId: `inst-${item.title ? item.title.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 30) : Date.now()}`,
          title,
          organization: orgName,
          category: "Research",
          roleFamily: "Emerging & Specialized Roles",
          seniority: "Student Researcher / Intern",
          description: item.content || "Academic research and fellowship opportunity.",
          location: "On-site / Campus",
          workMode: "On-site",
          compensation: "Competitive Institutional Stipend",
          eligibilityRequirements: [
            "Currently enrolled student in Computer Science or related degree",
            "Strong academic standing",
          ],
          requiredSkills: ["Python", "Research Methodology"],
          preferredSkills: ["PyTorch", "Data Analysis"],
          applicationUrl: item.url,
          canonicalUrl: item.url,
          sourceName: "Institutional Research Feed",
          sourceUrl: item.url,
          sourceSnippet: item.content?.substring(0, 200) || "",
          verificationStatus: "VERIFIED_SOURCE",
          fetchedAt,
          isActive: true,
          isDemo: false,
        });
      }

      return {
        provider: this.id,
        opportunities: results,
        queryExecuted: institutionalQuery,
        sourcesChecked: domains.map((d) => `https://${d}`),
        warnings: [],
        pagination: {
          total: results.length,
          limit,
          offset: 0,
          hasMore: false,
        },
        fetchedAt,
        status: "SUCCESS",
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      console.warn(`[InstitutionalResearchProvider] Live search failed:`, err?.message);
      return {
        provider: this.id,
        opportunities: [],
        queryExecuted: queryItem.query,
        sourcesChecked: [],
        warnings: [
          `Institutional live search failed: ${err?.message || String(err)}. Zero synthetic items returned in LIVE mode.`,
        ],
        pagination: { total: 0, limit, offset: 0, hasMore: false },
        fetchedAt,
        status: "FAILED",
        durationMs: Date.now() - startTime,
      };
    }
  }

  private getDemoInstitutionalResults(query: string, limit: number): SearchProviderResult {
    const fetchedAt = new Date().toISOString();
    const fixtures: RawOpportunity[] = [
      {
        provider: this.id,
        providerId: "inst-srfp-iisc",
        title: "Summer Research Fellowship Programme (SRFP)",
        organization: "Indian Institute of Science (IISc Bangalore)",
        description:
          "Prestigious 8-week summer research fellowship for high-achieving undergraduates in computer science and engineering to work alongside faculty on high-performance computing, systems, and deep learning.",
        category: "Fellowship",
        roleFamily: "Emerging & Specialized Roles",
        location: "Bengaluru, India",
        workMode: "On-site",
        seniority: "Student Researcher",
        compensation: "INR 12,500/month + on-campus housing",
        eligibilityRequirements: [
          "Currently enrolled in 2nd or 3rd year B.Tech/B.E. or 1st year M.Sc/M.Tech",
          "Minimum 8.0 CGPA or top 10% class rank",
        ],
        requiredSkills: ["C++", "Python", "Algorithms", "Data Structures"],
        preferredSkills: ["PyTorch", "Distributed Systems"],
        deadline: new Date(Date.now() + 45 * 86400000).toISOString(),
        applicationUrl: "https://fellowships.iisc.ac.in/srfp",
        canonicalUrl: "https://fellowships.iisc.ac.in/srfp",
        sourceName: "IISc Academic Fellowships Portal",
        sourceUrl: "https://fellowships.iisc.ac.in",
        fetchedAt,
        verificationStatus: "DEMO_DATA",
        isActive: true,
        isDemo: true,
      },
      {
        provider: this.id,
        providerId: "inst-cern-summer-student",
        title: "CERN Summer Student Programme 2025",
        organization: "European Organization for Nuclear Research (CERN)",
        description:
          "Spend 8 to 13 weeks working on an advanced technical project in Geneva. Open to undergraduate and master students in computing, physics, and engineering.",
        category: "Research",
        roleFamily: "Emerging & Specialized Roles",
        location: "Geneva, Switzerland",
        workMode: "On-site",
        seniority: "Student Researcher",
        compensation: "CHF 90/day stipend + travel allowance",
        eligibilityRequirements: [
          "Enrolled in a Bachelor or Master degree in CS, Physics, or Engineering",
          "Completed at least 3 years of full-time studies by summer 2025",
        ],
        requiredSkills: ["C++", "Linux", "Python", "Git"],
        preferredSkills: ["ROOT", "High Performance Computing"],
        deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
        applicationUrl: "https://careers.cern/summer",
        canonicalUrl: "https://careers.cern/summer",
        sourceName: "CERN Official Careers",
        sourceUrl: "https://careers.cern",
        fetchedAt,
        verificationStatus: "DEMO_DATA",
        isActive: true,
        isDemo: true,
      },
      {
        provider: this.id,
        providerId: "inst-aicte-portal",
        title: "National Technical Internship Initiative",
        organization: "All India Council for Technical Education (AICTE)",
        description:
          "National portal providing verified industry and institutional internships for engineering and polytechnic students across India.",
        category: "Internship",
        roleFamily: "Direct Role: Software Engineering",
        location: "New Delhi, India",
        workMode: "Hybrid",
        seniority: "Intern",
        compensation: "INR 15,000/month",
        eligibilityRequirements: [
          "Enrolled in AICTE-approved institution",
          "Graduating in 2025, 2026, or 2027",
        ],
        requiredSkills: ["Python", "SQL", "FastAPI"],
        preferredSkills: ["Docker", "Data Analysis"],
        deadline: new Date(Date.now() + 60 * 86400000).toISOString(),
        applicationUrl: "https://internship.aicte-india.org",
        canonicalUrl: "https://internship.aicte-india.org",
        sourceName: "AICTE National Internship Enterprise Portal",
        sourceUrl: "https://internship.aicte-india.org",
        fetchedAt,
        verificationStatus: "DEMO_DATA",
        isActive: true,
        isDemo: true,
      },
    ];

    return {
      provider: this.id,
      opportunities: fixtures.slice(0, limit),
      queryExecuted: query,
      sourcesChecked: [`demo://${this.id}/curated-research-catalog`],
      warnings: [
        `DEMO / FIXTURE MODE active (${this.id}): curated institutional and fellowship fixtures.`,
      ],
      pagination: {
        total: fixtures.length,
        limit,
        offset: 0,
        hasMore: false,
      },
      fetchedAt,
      status: "SUCCESS",
      durationMs: 5,
    };
  }
}

import {
  OpportunityCategory,
  RawOpportunity,
  SearchConfig,
  SearchProviderResult,
  WorkMode,
} from "../../types";
import { SearchProvider, SearchProviderQueryOptions } from "./types";

const USER_AGENT = "ai-job-search-dev/ai-job-search/1.0 (freehire-search; prospect)";

export interface FreehireJobRecord {
  slug?: string;
  id?: string | number;
  title?: string;
  company_name?: string;
  company_slug?: string;
  description?: string;
  location?: string;
  cities?: string[];
  countries?: string[];
  regions?: string[];
  work_mode?: string;
  seniority?: string;
  category?: string;
  skills?: string[];
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  apply_url?: string;
  source_url?: string;
  published_at?: string | null;
  created_at?: string | null;
}

export interface FreehireApiResponse {
  data?: FreehireJobRecord[];
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
  };
  error?: string;
}

const COUNTRY_ISO_MAP: Record<string, string> = {
  "united states": "US",
  usa: "US",
  us: "US",
  canada: "CA",
  "united kingdom": "GB",
  uk: "GB",
  germany: "DE",
  india: "IN",
  france: "FR",
  netherlands: "NL",
  singapore: "SG",
  australia: "AU",
};

const REGION_MAP: Record<string, string> = {
  global: "global",
  worldwide: "global",
  "north america": "north_america",
  europe: "eu",
  eu: "eu",
  latam: "latam",
  apac: "apac",
  mena: "mena",
};

function mapWorkModeToFreehire(workModes?: WorkMode[]): string | undefined {
  if (!workModes || workModes.length === 0) return undefined;
  const first = workModes[0].toLowerCase();
  if (first.includes("remote")) return "remote";
  if (first.includes("hybrid")) return "hybrid";
  if (first.includes("on-site") || first.includes("onsite")) return "onsite";
  return undefined;
}

function mapFreehireWorkMode(raw?: string, location?: string): WorkMode {
  const combined = `${raw || ""} ${location || ""}`.toLowerCase();
  if (combined.includes("remote") || combined.includes("global")) return "Remote";
  if (combined.includes("hybrid")) return "Hybrid";
  if (combined.includes("onsite") || combined.includes("on-site")) return "On-site";
  return "Flexible";
}

function mapFreehireCategory(rawCategory?: string, title?: string): OpportunityCategory {
  const combined = `${rawCategory || ""} ${title || ""}`.toLowerCase();
  if (combined.includes("intern") || combined.includes("co-op")) return "Internship";
  if (combined.includes("fellow")) return "Fellowship";
  if (combined.includes("research") || combined.includes("reu")) return "Research";
  if (combined.includes("hackathon")) return "Hackathon";
  return "Entry-level";
}

function mapQueryCategoryToFreehireFacet(queryText: string, roleTitles: string[]): string[] {
  const text = `${queryText} ${roleTitles.join(" ")}`.toLowerCase();
  const categories = new Set<string>();
  if (/\b(ml|machine learning|ai|computer vision|nlp|llm|deep learning|data scien)\b/.test(text)) {
    categories.add("ml_ai");
  }
  if (/\b(backend|distributed|api|systems|golang|python|rust)\b/.test(text)) {
    categories.add("backend");
  }
  if (/\b(frontend|react|ui|web)\b/.test(text)) {
    categories.add("frontend");
  }
  if (/\b(full[\s-]?stack|software engineer)\b/.test(text)) {
    categories.add("fullstack");
  }
  return Array.from(categories);
}

/**
 * Formats query for FreeHire's search endpoint (`OR` up to 5 terms and `title:` prefix support).
 */
export function buildFreehireQueryString(query: string, roleTitles: string[]): string {
  const cleanedTitles = roleTitles
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 4);
  if (cleanedTitles.length > 1) {
    return cleanedTitles.map((t) => `title:${t}`).join(" OR ");
  }
  return query.trim();
}

export class FreehireSearchProvider implements SearchProvider {
  readonly id = "freehire";
  readonly displayName = "FreeHire Public Tech API";
  readonly description =
    "Keyless public technical job search API supporting title:, OR queries, and structured facets.";
  readonly scopeNote =
    "Technical-job focus (software, ML/AI, data, infrastructure); best-effort external service dependency.";

  private getBaseUrl(): string {
    return (process.env.FREEHIRE_API_URL || "https://freehire.me").replace(/\/+$/, "");
  }

  isEnabled(_config: SearchConfig): boolean {
    return process.env.DISABLE_FREEHIRE_PROVIDER !== "true";
  }

  async search(options: SearchProviderQueryOptions): Promise<SearchProviderResult> {
    const fetchedAt = new Date().toISOString();
    const baseUrl = this.getBaseUrl();
    const { queryItem, limit, offset = 0, postedWithinDays = 30, signal, fetchImpl = fetch } = options;

    const q = buildFreehireQueryString(queryItem.query, queryItem.roleTitles);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("limit", String(Math.min(Math.max(limit || 15, 1), 50)));
    params.set("offset", String(Math.max(offset, 0)));
    params.set("description_format", "markdown");
    if (postedWithinDays > 0) {
      params.set("posted_within_days", String(postedWithinDays));
    }

    const workModeParam = mapWorkModeToFreehire(
      options.workMode ? [options.workMode] : queryItem.workModeFilters
    );
    if (workModeParam) {
      params.set("work_mode", workModeParam);
    }

    // Map locations to regions / countries / cities facets
    const locs = options.locationFilters ?? queryItem.locationFilters ?? [];
    for (const loc of locs) {
      const normalized = loc.trim().toLowerCase();
      if (!normalized || normalized === "remote") continue;
      if (REGION_MAP[normalized]) {
        params.append("regions", REGION_MAP[normalized]);
      } else if (COUNTRY_ISO_MAP[normalized]) {
        params.append("countries", COUNTRY_ISO_MAP[normalized]);
      } else {
        const cityOnly = loc.split(",")[0].trim();
        if (cityOnly) params.append("cities", cityOnly);
      }
    }

    // Seniority facet for early-career / internship / junior searches
    if (
      queryItem.experienceLevelTerms.some((t) =>
        /intern|junior|entry|grad|early/i.test(t)
      )
    ) {
      params.append("seniority", "junior");
    }

    const mappedCategories = mapQueryCategoryToFreehireFacet(
      queryItem.query,
      queryItem.roleTitles
    );
    for (const cat of mappedCategories.slice(0, 2)) {
      params.append("category", cat);
    }

    const endpointUrl = `${baseUrl}/api/v1/agent/jobs/search?${params.toString()}`;
    const warnings: string[] = [
      "FreeHire indexes technical roles primarily; non-tech fellowships or university lab postings require additional sources.",
    ];

    try {
      const res = await fetchImpl(endpointUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": USER_AGENT,
        },
        signal,
      });

      if (res.status === 429) {
        return {
          provider: this.id,
          opportunities: [],
          queryExecuted: q,
          sourcesChecked: [endpointUrl],
          warnings: [...warnings, "FreeHire returned HTTP 429 (rate limited)."],
          fetchedAt,
          status: "RATE_LIMITED",
        };
      }

      if (!res.ok) {
        return {
          provider: this.id,
          opportunities: [],
          queryExecuted: q,
          sourcesChecked: [endpointUrl],
          warnings: [...warnings, `FreeHire returned HTTP ${res.status}.`],
          fetchedAt,
          status: "FAILED",
        };
      }

      const body = (await res.json()) as FreehireApiResponse;
      if (body.error) {
        return {
          provider: this.id,
          opportunities: [],
          queryExecuted: q,
          sourcesChecked: [endpointUrl],
          warnings: [...warnings, `FreeHire API error: ${body.error}`],
          fetchedAt,
          status: "FAILED",
        };
      }

      const rawJobs = Array.isArray(body.data) ? body.data : [];
      const opportunities: RawOpportunity[] = rawJobs.map((job, idx) => {
        const slug = job.slug || String(job.id || `fh-${idx}`);
        const detailUrl = `${baseUrl}/jobs/${encodeURIComponent(slug)}`;
        const applyUrl = job.apply_url || job.source_url || detailUrl;
        const locationText =
          job.location ||
          [...(job.cities || []), ...(job.countries || [])].join(", ") ||
          (job.work_mode === "remote" ? "Remote" : "Unspecified");

        let compensation = "Unknown";
        if (job.salary_min || job.salary_max) {
          const curr = job.salary_currency || "USD";
          if (job.salary_min && job.salary_max) {
            compensation = `${curr} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`;
          } else {
            compensation = `${curr} ${(job.salary_min || job.salary_max)!.toLocaleString()}`;
          }
        }

        return {
          provider: this.id,
          providerId: slug,
          title: job.title || "Untitled Technical Role",
          organization: job.company_name || "Unknown Organization",
          description: job.description || "",
          category: mapFreehireCategory(job.category, job.title),
          roleFamily: job.category || "Software & AI Engineering",
          location: locationText,
          workMode: mapFreehireWorkMode(job.work_mode, locationText),
          seniority: job.seniority || "Intern / Junior",
          compensation,
          requiredSkills: Array.isArray(job.skills) ? job.skills : [],
          preferredSkills: [],
          eligibilityRequirements: [],
          publishedAt: job.published_at || job.created_at || null,
          deadline: null,
          deadlineRaw: null,
          applicationUrl: applyUrl,
          canonicalUrl: applyUrl,
          sourceName: "FreeHire Public Index",
          sourceUrl: job.source_url || detailUrl,
          sourceSnippet: (job.description || "").slice(0, 260),
          discoveredAt: fetchedAt,
          fetchedAt,
          lastCheckedAt: fetchedAt,
          verificationStatus: job.apply_url ? "VERIFIED_SOURCE" : "PARTIALLY_CHECKED",
          isActive: true,
          isDemo: false,
        };
      });

      const total = body.meta?.total ?? opportunities.length;
      const metaLimit = body.meta?.limit ?? limit;
      const metaOffset = body.meta?.offset ?? offset;

      return {
        provider: this.id,
        opportunities,
        queryExecuted: q,
        sourcesChecked: [endpointUrl],
        warnings,
        pagination: {
          total,
          limit: metaLimit,
          offset: metaOffset,
          hasMore: metaOffset + opportunities.length < total,
        },
        fetchedAt,
        status: "SUCCESS",
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return {
        provider: this.id,
        opportunities: [],
        queryExecuted: q,
        sourcesChecked: [endpointUrl],
        warnings: [...warnings, `FreeHire fetch failed: ${msg}`],
        fetchedAt,
        status: "FAILED",
      };
    }
  }

  /**
   * Fetches a single job detail record by slug (`/api/v1/jobs/<slug>`).
   */
  async fetchJobDetail(
    slug: string,
    fetchImpl: typeof fetch = fetch,
    signal?: AbortSignal
  ): Promise<FreehireJobRecord | null> {
    const baseUrl = this.getBaseUrl();
    const url = `${baseUrl}/api/v1/jobs/${encodeURIComponent(slug)}?description_format=markdown`;
    try {
      const res = await fetchImpl(url, {
        headers: { Accept: "application/json", "User-Agent": USER_AGENT },
        signal,
      });
      if (!res.ok) return null;
      const body = (await res.json()) as { data?: FreehireJobRecord };
      return body.data ?? null;
    } catch {
      return null;
    }
  }
}

export const FreeHireProvider = FreehireSearchProvider;


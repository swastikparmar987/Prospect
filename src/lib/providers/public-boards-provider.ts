import {
  OpportunityCategory,
  RawOpportunity,
  SearchConfig,
  SearchProviderResult,
  WorkMode,
} from "../../types";
import { SearchProvider, SearchProviderQueryOptions } from "./types";

const USER_AGENT = "ProspectCareerAgent/2.0 (Public-Board-Aggregator)";

interface RemotiveJob {
  id: number | string;
  url?: string;
  title?: string;
  company_name?: string;
  category?: string;
  tags?: string[];
  job_type?: string;
  publication_date?: string;
  candidate_required_location?: string;
  salary?: string;
  description?: string;
}

interface ArbeitnowJob {
  slug?: string;
  company_name?: string;
  title?: string;
  description?: string;
  remote?: boolean;
  url?: string;
  tags?: string[];
  job_types?: string[];
  location?: string;
  created_at?: number | string;
}

interface HimalayasJob {
  title?: string;
  companyName?: string;
  company_name?: string;
  guid?: string;
  applicationLink?: string;
  locationRestrictions?: string[];
  categories?: string[];
  pubDate?: string | number;
  description?: string;
  excerpt?: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  currency?: string | null;
}

const NON_TECH_EXCLUDE_RE =
  /\b(account executive|sales development|sales manager|sdr|bdr|recruiter|recruiting|sourcer|legal counsel|paralegal|tax|accounting|payroll|bookkeeper|nurse|therapist|real estate agent)\b/i;

function stripHtmlTags(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function inferPublicCategory(title: string, jobType = ""): OpportunityCategory {
  const combined = `${title} ${jobType}`.toLowerCase();
  if (/\b(intern|internship|co-op|trainee|apprentice)\b/.test(combined)) return "Internship";
  if (/\b(fellow|fellowship|residency)\b/.test(combined)) return "Fellowship";
  if (/\b(research|researcher)\b/.test(combined)) return "Research";
  return "Entry-level";
}

function scorePublicBoardRelevance(
  title: string,
  description: string,
  tags: string[],
  location: string,
  queryTerms: string[],
  locFilters: string[],
  exclusionTerms: string[]
): number {
  const hay = `${title} ${tags.join(" ")} ${description}`.toLowerCase();
  const titleLower = title.toLowerCase();
  const queryJoined = queryTerms.join(" ").toLowerCase();

  for (const ex of exclusionTerms) {
    if (ex && hay.includes(ex.toLowerCase())) return -1;
  }

  if (NON_TECH_EXCLUDE_RE.test(titleLower) && !NON_TECH_EXCLUDE_RE.test(queryJoined)) {
    return -1;
  }

  let score = 5;
  if (/\b(engineer|developer|machine learning|ml|ai|data|python|react|backend|full[\s-]?stack|software|intern|research|devops|cloud|llm|rag)\b/i.test(titleLower)) {
    score += 12;
  }

  if (/\b(intern|internship|junior|entry|graduate|early career|fellow)\b/i.test(titleLower)) {
    score += 12;
  }

  for (const term of queryTerms) {
    const clean = term.trim().toLowerCase();
    if (!clean || clean.length < 2) continue;
    if (titleLower.includes(clean)) score += 16;
    else if (tags.some((t) => t.toLowerCase().includes(clean))) score += 12;
    else if (hay.includes(clean)) score += 5;
  }

  const locLow = location.toLowerCase();
  if (locFilters.some((lf) => locLow.includes(lf.split(",")[0].trim().toLowerCase()))) {
    score += 12;
  } else if (locLow.includes("worldwide") || locLow.includes("anywhere") || locLow.includes("global")) {
    score += 5;
  }

  return score;
}

/**
 * Queries real-time public no-key tech job boards (Remotive, Arbeitnow, Himalayas)
 * so Discover stays diverse across platforms instead of relying solely on single company ATS boards.
 */
export class PublicJobBoardsProvider implements SearchProvider {
  readonly id = "public_boards";
  readonly displayName = "Multi-Platform Public Job Boards (Remotive, Arbeitnow, Himalayas)";
  readonly description =
    "Live public JSON feeds aggregating verified remote, hybrid, and international software/AI/data opportunities.";
  readonly scopeNote =
    "Public unauthenticated JSON job APIs with live timestamps and employer provenance.";

  isEnabled(config: SearchConfig): boolean {
    if (config.mode === "DEMO") return false;
    return process.env.DISABLE_PUBLIC_BOARDS_PROVIDER !== "true";
  }

  async search(options: SearchProviderQueryOptions): Promise<SearchProviderResult> {
    const fetchedAt = new Date().toISOString();
    const { queryItem, limit, signal, fetchImpl = fetch } = options;

    const queryTerms = Array.from(
      new Set(
        [
          ...queryItem.roleTitles,
          ...queryItem.skillCombinations,
          ...queryItem.query.split(/\s+/),
        ]
          .map((t) => t.trim())
          .filter((t) => t.length >= 2)
      )
    );
    const locFilters = queryItem.locationFilters || [];
    const warnings: string[] = [];
    const sourcesChecked: string[] = [];
    const candidates: Array<{ item: RawOpportunity; score: number }> = [];

    const boardFetches = [
      {
        name: "Remotive",
        url: `https://remotive.com/api/remote-jobs?limit=45${
          queryItem.skillCombinations[0]
            ? `&search=${encodeURIComponent(queryItem.skillCombinations[0])}`
            : ""
        }`,
      },
      {
        name: "Arbeitnow",
        url: "https://www.arbeitnow.com/api/job-board-api",
      },
      {
        name: "Himalayas",
        url: "https://himalayas.app/jobs/api?limit=35",
      },
    ];

    let okCount = 0;

    await Promise.all(
      boardFetches.map(async (board) => {
        sourcesChecked.push(board.url);
        try {
          const res = await fetchImpl(board.url, {
            headers: {
              Accept: "application/json",
              "User-Agent": USER_AGENT,
            },
            signal: signal || AbortSignal.timeout(6500),
          });
          if (!res.ok) {
            warnings.push(`${board.name} returned HTTP ${res.status}.`);
            return;
          }

          const payload = await res.json();
          okCount++;

          if (board.name === "Remotive") {
            const jobs = Array.isArray(payload?.jobs) ? (payload.jobs as RemotiveJob[]) : [];
            for (const j of jobs.slice(0, 60)) {
              const title = (j.title || "").trim();
              const org = (j.company_name || "").trim();
              const url = (j.url || "").trim();
              if (!title || !org || !url) continue;
              const desc = stripHtmlTags(j.description || "");
              const loc = (j.candidate_required_location || "Remote").trim() || "Remote";
              const tags = Array.isArray(j.tags) ? j.tags : [];
              const rel = scorePublicBoardRelevance(
                title,
                desc,
                tags,
                loc,
                queryTerms,
                locFilters,
                queryItem.exclusionTerms
              );
              if (rel < 10) continue;

              const raw: RawOpportunity = {
                provider: this.id,
                providerId: `remotive-${j.id}`,
                title,
                organization: org,
                description: desc.slice(0, 2200) || `${title} at ${org}`,
                category: inferPublicCategory(title, j.job_type),
                roleFamily: j.category || "Software & AI Engineering",
                location: loc.toLowerCase().includes("remote") || loc.toLowerCase().includes("anywhere")
                  ? loc
                  : `${loc} (Remote)`,
                workMode: "Remote",
                seniority: /intern/i.test(title) ? "Intern" : "Early-Career",
                compensation: j.salary?.trim() || "Competitive / Listed on Posting",
                requiredSkills: tags.slice(0, 8),
                preferredSkills: [],
                eligibilityRequirements: [],
                publishedAt: j.publication_date ? new Date(j.publication_date).toISOString() : null,
                deadline: null,
                deadlineRaw: null,
                applicationUrl: url,
                canonicalUrl: url,
                sourceName: "Remotive Public Feed",
                sourceUrl: url,
                sourceSnippet: desc.slice(0, 260),
                fetchedAt,
                discoveredAt: fetchedAt,
                lastCheckedAt: fetchedAt,
                verificationStatus: "VERIFIED_SOURCE",
                isActive: true,
                isDemo: false,
              };
              candidates.push({ item: raw, score: rel });
            }
          } else if (board.name === "Arbeitnow") {
            const jobs = Array.isArray(payload?.data) ? (payload.data as ArbeitnowJob[]) : [];
            for (const j of jobs.slice(0, 60)) {
              const title = (j.title || "").trim();
              const org = (j.company_name || "").trim();
              const url = (j.url || "").trim();
              if (!title || !org || !url) continue;
              const desc = stripHtmlTags(j.description || "");
              const loc = (j.location || (j.remote ? "Remote" : "Unspecified")).trim();
              const tags = Array.isArray(j.tags) ? j.tags : [];
              const rel = scorePublicBoardRelevance(
                title,
                desc,
                tags,
                loc,
                queryTerms,
                locFilters,
                queryItem.exclusionTerms
              );
              if (rel < 10) continue;

              const workMode: WorkMode = j.remote ? "Remote" : "On-site";
              const pubIso =
                typeof j.created_at === "number"
                  ? new Date(j.created_at * 1000).toISOString()
                  : typeof j.created_at === "string"
                    ? new Date(j.created_at).toISOString()
                    : null;

              const raw: RawOpportunity = {
                provider: this.id,
                providerId: `arbeitnow-${j.slug || title.slice(0, 24)}`,
                title,
                organization: org,
                description: desc.slice(0, 2200) || `${title} at ${org}`,
                category: inferPublicCategory(title, (j.job_types || []).join(" ")),
                roleFamily: "Engineering & Tech",
                location: loc,
                workMode,
                seniority: /intern/i.test(title) ? "Intern" : "Early-Career",
                compensation: "Compensation on posting",
                requiredSkills: tags.slice(0, 8),
                preferredSkills: [],
                eligibilityRequirements: [],
                publishedAt: pubIso,
                deadline: null,
                deadlineRaw: null,
                applicationUrl: url,
                canonicalUrl: url,
                sourceName: "Arbeitnow Live Feed",
                sourceUrl: url,
                sourceSnippet: desc.slice(0, 260),
                fetchedAt,
                discoveredAt: fetchedAt,
                lastCheckedAt: fetchedAt,
                verificationStatus: "VERIFIED_SOURCE",
                isActive: true,
                isDemo: false,
              };
              candidates.push({ item: raw, score: rel });
            }
          } else if (board.name === "Himalayas") {
            const jobs = Array.isArray(payload?.jobs) ? (payload.jobs as HimalayasJob[]) : [];
            for (const j of jobs.slice(0, 45)) {
              const title = (j.title || "").trim();
              const org = (j.companyName || j.company_name || "").trim();
              const url = (j.applicationLink || j.guid || "").trim();
              if (!title || !org || !url) continue;
              const desc = stripHtmlTags(j.description || j.excerpt || "");
              const locList = Array.isArray(j.locationRestrictions)
                ? j.locationRestrictions.filter(Boolean)
                : [];
              const loc =
                locList.length > 0 ? `${locList.slice(0, 2).join(", ")} (Remote)` : "Remote (Worldwide)";
              const tags = Array.isArray(j.categories) ? j.categories : [];
              const rel = scorePublicBoardRelevance(
                title,
                desc,
                tags,
                loc,
                queryTerms,
                locFilters,
                queryItem.exclusionTerms
              );
              if (rel < 10) continue;

              const comp =
                j.minSalary || j.maxSalary
                  ? `${j.currency || "$"}${j.minSalary || ""}${j.maxSalary ? ` - ${j.maxSalary}` : ""}`
                  : "Listed on Posting";

              const pubDate =
                typeof j.pubDate === "number"
                  ? new Date(j.pubDate * 1000).toISOString()
                  : typeof j.pubDate === "string"
                    ? new Date(j.pubDate).toISOString()
                    : null;

              const raw: RawOpportunity = {
                provider: this.id,
                providerId: `himalayas-${j.guid || title.slice(0, 24)}`,
                title,
                organization: org,
                description: desc.slice(0, 2200) || `${title} at ${org}`,
                category: inferPublicCategory(title),
                roleFamily: tags[0] || "Remote Tech",
                location: loc,
                workMode: "Remote",
                seniority: /intern/i.test(title) ? "Intern" : "Early-Career",
                compensation: comp,
                requiredSkills: tags.slice(0, 8),
                preferredSkills: [],
                eligibilityRequirements: [],
                publishedAt: pubDate && !isNaN(new Date(pubDate).getTime()) ? pubDate : null,
                deadline: null,
                deadlineRaw: null,
                applicationUrl: url,
                canonicalUrl: url,
                sourceName: "Himalayas Live Feed",
                sourceUrl: url,
                sourceSnippet: desc.slice(0, 260),
                fetchedAt,
                discoveredAt: fetchedAt,
                lastCheckedAt: fetchedAt,
                verificationStatus: "VERIFIED_SOURCE",
                isActive: true,
                isDemo: false,
              };
              candidates.push({ item: raw, score: rel });
            }
          }
        } catch (err) {
          warnings.push(
            `${board.name} fetch error: ${err instanceof Error ? err.message : String(err)}`
          );
        }
      })
    );

    candidates.sort((a, b) => b.score - a.score);
    const effectiveLimit = limit || 25;
    const sliced = candidates.slice(0, effectiveLimit).map((c) => c.item);

    return {
      provider: this.id,
      opportunities: sliced,
      queryExecuted: queryItem.query,
      sourcesChecked,
      warnings,
      fetchedAt,
      status: okCount > 0 ? (warnings.length > 0 ? "PARTIAL" : "SUCCESS") : "FAILED",
    };
  }
}

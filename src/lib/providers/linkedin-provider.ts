import {
  OpportunityCategory,
  RawOpportunity,
  SearchConfig,
  SearchProviderResult,
  WorkMode,
} from "../../types";
import { SearchProvider, SearchProviderQueryOptions } from "./types";

export interface LinkedInNormalizedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  jobUrl: string;
  applyUrl?: string;
  postedTime?: string;
  publishedAt?: string;
  seniorityLevel?: string;
  employmentType?: string;
  workplaceType?: "Remote" | "Hybrid" | "On-site";
  salary?: string;
  description: string;
  isActive: boolean;
}

/**
 * Normalizes a LinkedIn job payload (matching upstream linkedin-search output schema)
 * into Prospect's RawOpportunity contract while honoring `isActive` closed-at-source checks.
 */
export function normalizeLinkedInJobRecord(
  record: LinkedInNormalizedJob,
  fetchedAt = new Date().toISOString()
): RawOpportunity {
  const titleLower = `${record.title} ${record.employmentType || ""} ${record.seniorityLevel || ""}`.toLowerCase();
  let category: OpportunityCategory = "Entry-level";
  if (titleLower.includes("intern")) category = "Internship";
  else if (titleLower.includes("fellow")) category = "Fellowship";
  else if (titleLower.includes("research")) category = "Research";

  let workMode: WorkMode = record.workplaceType || "Flexible";
  const locLower = (record.location || "").toLowerCase();
  if (locLower.includes("remote")) workMode = "Remote";
  else if (locLower.includes("hybrid")) workMode = "Hybrid";

  return {
    provider: "linkedin",
    providerId: record.id,
    title: record.title,
    organization: record.company,
    description: record.description,
    category,
    roleFamily: "General Technical",
    location: record.location || "Unspecified",
    workMode,
    seniority: record.seniorityLevel || "Intern / Entry-level",
    compensation: record.salary || "Unknown",
    requiredSkills: [],
    preferredSkills: [],
    eligibilityRequirements: [],
    publishedAt: record.publishedAt || null,
    deadline: record.isActive === false ? "1970-01-01T00:00:00.000Z" : null,
    deadlineRaw: record.isActive === false ? "Closed at source" : null,
    applicationUrl: record.applyUrl || record.jobUrl,
    canonicalUrl: record.jobUrl,
    sourceName: "LinkedIn (Normalized Local Import)",
    sourceUrl: record.jobUrl,
    sourceSnippet: (record.description || "").slice(0, 240),
    discoveredAt: fetchedAt,
    fetchedAt,
    lastCheckedAt: fetchedAt,
    verificationStatus: record.isActive ? "PARTIALLY_CHECKED" : "STALE",
    isActive: record.isActive,
    isDemo: false,
  };
}

export class LinkedInSearchProvider implements SearchProvider {
  readonly id = "linkedin";
  readonly displayName = "LinkedIn Adapter (Restricted / Disabled by Default)";
  readonly description =
    "Reuses upstream linkedin-search normalized schema and isActive closed-at-source verification. Automated guest scraping is disabled for multi-user Prospect.";
  readonly scopeNote =
    "Disabled by default for platform compliance. Only accepts authorized/local normalized imports when LINKEDIN_LOCAL_PERSONAL_ENABLED=true.";

  isEnabled(config: SearchConfig): boolean {
    return (
      Boolean(config.enableLinkedInLocalPersonal) &&
      process.env.LINKEDIN_LOCAL_PERSONAL_ENABLED === "true"
    );
  }

  async search(options: SearchProviderQueryOptions): Promise<SearchProviderResult> {
    const fetchedAt = new Date().toISOString();
    const q = options.queryItem.query;

    if (!this.isEnabled(options.config)) {
      return {
        provider: this.id,
        opportunities: [],
        queryExecuted: q,
        sourcesChecked: [],
        warnings: [
          "LinkedIn automated scraping is disabled in Prospect to respect platform access controls and terms of service. Use FreeHire, official company career feeds (Greenhouse/Lever/Ashby), or authorized imports.",
        ],
        fetchedAt,
        status: "FAILED",
      };
    }

    // Even when local personal mode is enabled, we never bypass login/CAPTCHA or scrape guest HTML directly.
    // Instead, we only read from an explicitly provided local authorized JSON feed URL if configured.
    const authorizedFeedUrl = process.env.LINKEDIN_AUTHORIZED_FEED_URL;
    if (!authorizedFeedUrl) {
      return {
        provider: this.id,
        opportunities: [],
        queryExecuted: q,
        sourcesChecked: [],
        warnings: [
          "LINKEDIN_LOCAL_PERSONAL_ENABLED is true, but no LINKEDIN_AUTHORIZED_FEED_URL was configured. Unauthenticated guest scraping remains disabled.",
        ],
        fetchedAt,
        status: "PARTIAL",
      };
    }

    const fetchImpl = options.fetchImpl || fetch;
    try {
      const res = await fetchImpl(authorizedFeedUrl, {
        headers: { Accept: "application/json" },
        signal: options.signal,
      });
      if (!res.ok) {
        return {
          provider: this.id,
          opportunities: [],
          queryExecuted: q,
          sourcesChecked: [authorizedFeedUrl],
          warnings: [`Authorized LinkedIn feed returned HTTP ${res.status}.`],
          fetchedAt,
          status: "FAILED",
        };
      }
      const items = (await res.json()) as LinkedInNormalizedJob[];
      const normalized = (Array.isArray(items) ? items : []).map((item) =>
        normalizeLinkedInJobRecord(item, fetchedAt)
      );
      return {
        provider: this.id,
        opportunities: normalized,
        queryExecuted: q,
        sourcesChecked: [authorizedFeedUrl],
        warnings: [],
        fetchedAt,
        status: "SUCCESS",
      };
    } catch (err) {
      return {
        provider: this.id,
        opportunities: [],
        queryExecuted: q,
        sourcesChecked: [authorizedFeedUrl],
        warnings: [
          `Authorized LinkedIn feed error: ${err instanceof Error ? err.message : String(err)}`,
        ],
        fetchedAt,
        status: "FAILED",
      };
    }
  }
}


import {
  MultiSourceProvenanceRecord,
  Opportunity,
  SourceEvidenceItem,
} from "../types";
import { makeCanonicalJobKey } from "./posting-guard";

/**
 * Normalizes URL for canonical matching (strips tracking query params, fragments, trailing slashes).
 */
export function canonicalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.trim());
    const paramsToStrip = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "ref",
      "fbclid",
      "gclid",
      "trk",
      "trackingId",
    ];
    paramsToStrip.forEach((p) => url.searchParams.delete(p));

    let pathname = url.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    return `${url.origin}${pathname}${url.search ? url.search : ""}`.toLowerCase();
  } catch {
    return (rawUrl || "").trim().toLowerCase();
  }
}

function normalizeString(str: string): string {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function jaccardSimilarity(s1: string, s2: string): number {
  const words1 = new Set(normalizeString(s1).split(" ").filter((w) => w.length > 2));
  const words2 = new Set(normalizeString(s2).split(" ").filter((w) => w.length > 2));
  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  words1.forEach((w) => {
    if (words2.has(w)) intersection++;
  });
  const union = new Set([...words1, ...words2]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Checks if two postings have conflicting deadlines or incompatible distinct locations
 * that make merging unsafe/ambiguous.
 */
function hasAmbiguousConflict(a: Opportunity, b: Opportunity): boolean {
  const d1 = a.deadline ? new Date(a.deadline).toISOString().slice(0, 7) : null;
  const d2 = b.deadline ? new Date(b.deadline).toISOString().slice(0, 7) : null;
  if (d1 && d2 && d1 !== d2) {
    return true;
  }

  // If both specify concrete non-remote, non-overlapping locations (e.g., "Austin, TX" vs "London, UK"),
  // and their canonical URLs differ, treat them as separate regional requisitions rather than merging blindly.
  const loc1 = normalizeString(a.location || "");
  const loc2 = normalizeString(b.location || "");
  if (
    loc1 &&
    loc2 &&
    loc1 !== loc2 &&
    !loc1.includes("unspecified") &&
    !loc2.includes("unspecified") &&
    !loc1.includes(loc2) &&
    !loc2.includes(loc1)
  ) {
    const tokens1 = loc1.split(" ").filter((t) => t.length > 2 && t !== "hybrid" && t !== "remote");
    const tokens2 = loc2.split(" ").filter((t) => t.length > 2 && t !== "hybrid" && t !== "remote");
    if (tokens1.length > 0 && tokens2.length > 0) {
      const overlap = tokens1.some((t) => tokens2.includes(t));
      if (!overlap && canonicalizeUrl(a.applyUrl) !== canonicalizeUrl(b.applyUrl)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Merges multi-source provenance and evidence records from `duplicate` into `kept`.
 */
function mergeOpportunityProvenance(kept: Opportunity, duplicate: Opportunity): void {
  const existingEvUrls = new Set((kept.sourceEvidence || []).map((e) => `${e.url}::${e.claim}`));
  const dupEvList: SourceEvidenceItem[] = duplicate.sourceEvidence || [];
  for (const ev of dupEvList) {
    const key = `${ev.url}::${ev.claim}`;
    if (!existingEvUrls.has(key)) {
      kept.sourceEvidence = [...(kept.sourceEvidence || []), ev];
      existingEvUrls.add(key);
    }
  }
  if (!dupEvList.length && duplicate.sourceUrl) {
    const fallbackEv: SourceEvidenceItem = {
      claim: `${duplicate.title} (${duplicate.sourceName})`,
      excerpt: duplicate.sourceSnippet || duplicate.description.slice(0, 180),
      url: duplicate.sourceUrl,
      observedAt: duplicate.fetchedAt || duplicate.lastCheckedAt,
      verified: duplicate.verificationStatus === "VERIFIED_SOURCE",
    };
    kept.sourceEvidence = [...(kept.sourceEvidence || []), fallbackEv];
  }
  kept.evidenceRecords = kept.sourceEvidence;

  const existingProv = kept.multiSourceProvenance || [
    {
      provider: kept.sourceName,
      sourceName: kept.sourceName,
      sourceUrl: kept.sourceUrl,
      applicationUrl: kept.applyUrl,
      fetchedAt: kept.fetchedAt || kept.lastCheckedAt,
      verificationStatus: kept.verificationStatus,
      snippet: kept.sourceSnippet,
    },
  ];
  const incomingProv: MultiSourceProvenanceRecord[] =
    duplicate.multiSourceProvenance && duplicate.multiSourceProvenance.length > 0
      ? duplicate.multiSourceProvenance
      : [
          {
            provider: duplicate.sourceName,
            sourceName: duplicate.sourceName,
            sourceUrl: duplicate.sourceUrl,
            applicationUrl: duplicate.applyUrl,
            fetchedAt: duplicate.fetchedAt || duplicate.lastCheckedAt,
            verificationStatus: duplicate.verificationStatus,
            snippet: duplicate.sourceSnippet,
          },
        ];

  const seenProvKeys = new Set(existingProv.map((p) => `${p.sourceName}::${p.sourceUrl}`));
  for (const p of incomingProv) {
    const key = `${p.sourceName}::${p.sourceUrl}`;
    if (!seenProvKeys.has(key)) {
      existingProv.push(p);
      seenProvKeys.add(key);
    }
  }
  kept.multiSourceProvenance = existingProv;

  // Union required & preferred skills
  kept.requiredSkills = Array.from(
    new Set([...(kept.requiredSkills || []), ...(duplicate.requiredSkills || [])])
  );
  kept.preferredSkills = Array.from(
    new Set([...(kept.preferredSkills || []), ...(duplicate.preferredSkills || [])])
  );
}

/**
 * Cautiously deduplicates opportunity candidates across multiple providers:
 * 1. Canonical URL match.
 * 2. Provider listing ID match.
 * 3. Canonical `<company>_<title>` key match (when non-ambiguous).
 * 4. Scoped fuzzy similarity on (Organization + Title) without merging conflicting postings.
 * Preserves provenance from every source when multiple providers report the same opportunity.
 */
export function deduplicateOpportunities(opportunities: Opportunity[]): {
  unique: Opportunity[];
  duplicatesRemoved: number;
  duplicatePairs: Array<{ keptId: string; duplicateId: string; reason: string }>;
} {
  const unique: Opportunity[] = [];
  const seenCanonicalUrls = new Map<string, Opportunity>();
  const seenProviderIds = new Map<string, Opportunity>();
  const seenJobKeys = new Map<string, Opportunity>();
  const duplicatePairs: Array<{ keptId: string; duplicateId: string; reason: string }> = [];

  for (const rawOpp of opportunities) {
    // Clone so we can safely enrich provenance without mutating caller references unexpectedly
    const opp: Opportunity = {
      ...rawOpp,
      sourceEvidence: [...(rawOpp.sourceEvidence || [])],
      multiSourceProvenance: rawOpp.multiSourceProvenance
        ? [...rawOpp.multiSourceProvenance]
        : undefined,
    };

    const cUrl = canonicalizeUrl(opp.canonicalUrl || opp.applyUrl || opp.sourceUrl);
    const providerKey = opp.providerId ? `${opp.providerId.toLowerCase()}` : "";
    const jobKey = makeCanonicalJobKey(opp.organization, opp.title);

    // 1. Exact canonical URL check
    if (cUrl && seenCanonicalUrls.has(cUrl)) {
      const existing = seenCanonicalUrls.get(cUrl)!;
      mergeOpportunityProvenance(existing, opp);
      duplicatePairs.push({
        keptId: existing.id,
        duplicateId: opp.id,
        reason: `Duplicate canonical URL: ${cUrl}`,
      });
      continue;
    }

    // 2. Exact provider listing ID check
    if (providerKey && seenProviderIds.has(providerKey)) {
      const existing = seenProviderIds.get(providerKey)!;
      mergeOpportunityProvenance(existing, opp);
      duplicatePairs.push({
        keptId: existing.id,
        duplicateId: opp.id,
        reason: `Duplicate provider listing ID: ${providerKey}`,
      });
      continue;
    }

    // 3. Canonical <organization>_<title> key check (if non-ambiguous)
    if (jobKey && seenJobKeys.has(jobKey)) {
      const existing = seenJobKeys.get(jobKey)!;
      if (!hasAmbiguousConflict(existing, opp)) {
        mergeOpportunityProvenance(existing, opp);
        duplicatePairs.push({
          keptId: existing.id,
          duplicateId: opp.id,
          reason: `Matching canonical organization + title key: ${jobKey}`,
        });
        continue;
      }
    }

    // 4. Scoped fuzzy similarity check on (Organization + Title)
    let isFuzzyDuplicate = false;
    for (const existing of unique) {
      const orgSim = jaccardSimilarity(existing.organization, opp.organization);
      const titleSim = jaccardSimilarity(existing.title, opp.title);

      if (orgSim >= 0.8 && titleSim >= 0.75) {
        if (hasAmbiguousConflict(existing, opp)) {
          continue;
        }

        isFuzzyDuplicate = true;
        mergeOpportunityProvenance(existing, opp);
        duplicatePairs.push({
          keptId: existing.id,
          duplicateId: opp.id,
          reason: `High fuzzy similarity for ${opp.organization} - ${opp.title}`,
        });
        break;
      }
    }

    if (!isFuzzyDuplicate) {
      if (cUrl) seenCanonicalUrls.set(cUrl, opp);
      if (providerKey) seenProviderIds.set(providerKey, opp);
      if (jobKey) seenJobKeys.set(jobKey, opp);
      unique.push(opp);
    }
  }

  return {
    unique,
    duplicatesRemoved: opportunities.length - unique.length,
    duplicatePairs,
  };
}

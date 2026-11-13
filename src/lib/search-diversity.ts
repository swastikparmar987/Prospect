import { Opportunity } from "@/types";

/**
 * Re-ranks opportunities to avoid single-employer dominance in the top results.
 * Limits any single employer to at most `maxPerEmployerInTop` positions within the `topWindow`,
 * deferring excess items behind diverse high-quality alternatives while preserving overall candidate access.
 */
export function applyEmployerDiversity<T extends { opportunity: Opportunity }>(
  items: T[],
  maxPerEmployerInTop = 3,
  topWindow = 10
): T[] {
  if (items.length <= maxPerEmployerInTop) {
    return items;
  }

  const topItems: T[] = [];
  const deferredItems: T[] = [];
  const employerCountInTop = new Map<string, number>();

  for (const item of items) {
    const employerKey = (item.opportunity.organization || "unknown").trim().toLowerCase();
    const currentCount = employerCountInTop.get(employerKey) || 0;

    if (topItems.length < topWindow) {
      if (currentCount < maxPerEmployerInTop) {
        topItems.push(item);
        employerCountInTop.set(employerKey, currentCount + 1);
      } else {
        deferredItems.push(item);
      }
    } else {
      deferredItems.push(item);
    }
  }

  // If topItems didn't reach topWindow because alternatives ran out, fill from deferredItems
  while (topItems.length < topWindow && deferredItems.length > 0) {
    topItems.push(deferredItems.shift()!);
  }

  return [...topItems, ...deferredItems];
}

/**
 * Multi-platform + employer diversity re-ranker for live feeds:
 * Prevents any single employer OR single ingestion platform from monopolizing the top window
 * so users see balanced opportunities across ATS boards, public job APIs, and live web portals.
 */
export function applyMultiPlatformDiversity<T extends { opportunity: Opportunity }>(
  items: T[],
  maxPerEmployerInTop = 2,
  maxPerSourceInTop = 4,
  topWindow = 12
): T[] {
  if (items.length <= 2) return items;

  const topItems: T[] = [];
  const deferredItems: T[] = [];
  const employerCount = new Map<string, number>();
  const sourceCount = new Map<string, number>();

  const normalizeSourceBucket = (opp: Opportunity): string => {
    const prov = (opp.providerId || "").toLowerCase();
    const src = (opp.sourceName || "").toLowerCase();
    if (prov) return prov;
    if (src.includes("greenhouse") || src.includes("lever") || src.includes("ashby")) {
      return "ats_feeds";
    }
    return src || "unknown";
  };

  for (const item of items) {
    const employerKey = (item.opportunity.organization || "unknown").trim().toLowerCase();
    const sourceKey = normalizeSourceBucket(item.opportunity);
    const empCur = employerCount.get(employerKey) || 0;
    const srcCur = sourceCount.get(sourceKey) || 0;

    if (topItems.length < topWindow) {
      if (empCur < maxPerEmployerInTop && srcCur < maxPerSourceInTop) {
        topItems.push(item);
        employerCount.set(employerKey, empCur + 1);
        sourceCount.set(sourceKey, srcCur + 1);
      } else {
        deferredItems.push(item);
      }
    } else {
      deferredItems.push(item);
    }
  }

  // Fill remainder up to topWindow relaxing source cap before employer cap
  for (let pass = 0; pass < 2 && topItems.length < topWindow; pass++) {
    for (let i = 0; i < deferredItems.length && topItems.length < topWindow; ) {
      const item = deferredItems[i];
      const employerKey = (item.opportunity.organization || "unknown").trim().toLowerCase();
      const empCur = employerCount.get(employerKey) || 0;
      if (pass === 1 || empCur < maxPerEmployerInTop) {
        topItems.push(item);
        employerCount.set(employerKey, empCur + 1);
        deferredItems.splice(i, 1);
      } else {
        i++;
      }
    }
  }

  return [...topItems, ...deferredItems];
}

/**
 * Computes concentration metrics across employers and data sources.
 */
export function computeConcentrationMetrics(items: Array<{ opportunity: Opportunity }>) {
  const total = items.length;
  if (total === 0) {
    return {
      top10EmployerDistribution: {},
      maxEmployerShareInTop10: 0,
      totalEmployers: 0,
      sourceDistribution: {},
    };
  }

  const top10 = items.slice(0, 10);
  const employerCountsTop10: Record<string, number> = {};
  for (const item of top10) {
    const org = item.opportunity.organization.trim();
    employerCountsTop10[org] = (employerCountsTop10[org] || 0) + 1;
  }

  const allEmployers = new Set(items.map((i) => i.opportunity.organization.trim()));
  const maxInTop10 = Math.max(...Object.values(employerCountsTop10), 0);

  const sourceCounts: Record<string, number> = {};
  for (const item of items) {
    const src = item.opportunity.sourceName || "Unknown";
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
  }

  return {
    top10EmployerDistribution: employerCountsTop10,
    maxEmployerShareInTop10: top10.length > 0 ? Math.round((maxInTop10 / top10.length) * 100) : 0,
    totalEmployers: allEmployers.size,
    sourceDistribution: sourceCounts,
  };
}

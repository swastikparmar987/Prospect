import crypto from "crypto";
import { prisma } from "../db";
import {
  SearchConfig,
  SearchProviderResult,
  SearchQueryItem,
} from "../../types";
import { CompanyCareerFeedsProvider } from "./career-feeds-provider";
import { DemoFixtureProvider } from "./demo-fixtures-provider";
import { FreehireSearchProvider } from "./freehire-provider";
import { LinkedInSearchProvider } from "./linkedin-provider";
import { SearchProvider, SearchProviderQueryOptions } from "./types";
import { GeneralWebDiscoveryProvider } from "./web-discovery-provider";
import { TavilySearchProvider } from "./tavily-provider";
import { InstitutionalResearchProvider } from "./institutional-research-provider";
import { PublicJobBoardsProvider } from "./public-boards-provider";

interface CacheEntry {
  result: SearchProviderResult;
  fetchedAt: string;
  expiresAtMs: number;
}

const memoryCache = new Map<string, CacheEntry>();

export function computeSearchCacheKey(
  providerId: string,
  query: string,
  filters: Record<string, unknown>
): string {
  const canonicalFilters = JSON.stringify(
    Object.keys(filters)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = filters[key];
        return acc;
      }, {})
  );
  return crypto
    .createHash("sha256")
    .update(`${providerId}::${query.trim().toLowerCase()}::${canonicalFilters}`)
    .digest("hex");
}

export async function clearSearchMemoryCache(): Promise<void> {
  memoryCache.clear();
  try {
    await prisma.searchCache.deleteMany({});
  } catch {
    // Ignore DB errors in isolated unit tests
  }
}

export class SearchProviderRegistry {
  private providers = new Map<string, SearchProvider>();

  constructor(customProviders?: SearchProvider[]) {
    if (customProviders && customProviders.length > 0) {
      for (const p of customProviders) {
        this.register(p);
      }
    } else {
      this.register(new FreehireSearchProvider());
      this.register(new CompanyCareerFeedsProvider());
      this.register(new PublicJobBoardsProvider());
      this.register(new LinkedInSearchProvider());
      this.register(new GeneralWebDiscoveryProvider());
      this.register(new TavilySearchProvider());
      this.register(new InstitutionalResearchProvider());
      this.register(new DemoFixtureProvider("demo_freehire"));
      this.register(new DemoFixtureProvider("demo_career_feeds"));
    }
  }

  register(provider: SearchProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: string): SearchProvider | undefined {
    return this.providers.get(id);
  }

  listProviders(): SearchProvider[] {
    return Array.from(this.providers.values());
  }

  getActiveProviders(config: SearchConfig, requestedIds?: string[]): SearchProvider[] {
    if (config.mode === "DEMO") {
      const demoProviders = ["demo_freehire", "demo_career_feeds"]
        .map((id) => this.providers.get(id))
        .filter((p): p is SearchProvider => Boolean(p && p.isEnabled(config)));
      if (demoProviders.length > 0) {
        return demoProviders;
      }
    }

    const requestedMatches =
      requestedIds && requestedIds.length > 0
        ? requestedIds
            .map((id) => this.providers.get(id))
            .filter(
              (p): p is SearchProvider =>
                Boolean(p && (config.mode !== "LIVE" || !p.id.startsWith("demo_")))
            )
        : [];

    const candidates =
      requestedMatches.length > 0
        ? requestedMatches
        : Array.from(this.providers.values()).filter(
            (p) => !p.id.startsWith("demo_")
          );

    return candidates.filter(
      (p) =>
        p.isEnabled(config) &&
        (config.mode !== "LIVE" || !p.id.startsWith("demo_"))
    );
  }

  /**
   * Executes a single query against a single provider with caching, timeout, and bounded retries.
   * Preserves original `fetchedAt` when returning cached responses.
   */
  async executeProviderWithGuards(
    provider: SearchProvider,
    options: SearchProviderQueryOptions
  ): Promise<SearchProviderResult> {
    const { queryItem, config, roundNumber } = options;

    // Safeguard: Demo fixture providers are strictly forbidden in LIVE mode
    if (config.mode === "LIVE" && provider.id.startsWith("demo_")) {
      return {
        provider: provider.id,
        opportunities: [],
        queryExecuted: queryItem.query,
        sourcesChecked: [],
        warnings: [
          `NO_MOCK_DATA_POLICY: Blocked demo fixture provider "${provider.id}" from executing in LIVE mode.`,
        ],
        fetchedAt: new Date().toISOString(),
        status: "FAILED",
      };
    }

    const filterMeta = {
      roundNumber: config.mode === "DEMO" ? roundNumber : 1,
      strategy: queryItem.strategy,
      locations: queryItem.locationFilters,
      workModes: queryItem.workModeFilters,
      companies: queryItem.companyTargets,
      mode: config.mode,
    };
    const cacheKey = computeSearchCacheKey(provider.id, queryItem.query, filterMeta);

    // 1. Check in-memory and SQLite cache (if TTL > 0)
    if (config.cacheTtlSeconds > 0) {
      const cached = await this.getFromCache(cacheKey);
      if (cached) {
        return {
          ...cached.result,
          fetchedAt: cached.fetchedAt, // Preserve original fetch timestamp!
          cached: true,
        };
      }
    }

    // 2. Execute with bounded retries and strict per-provider timeout
    const maxAttempts = Math.max(1, (config.maxRetries ?? 1) + 1);
    let lastResult: SearchProviderResult | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (options.signal?.aborted) {
        return {
          provider: provider.id,
          opportunities: [],
          queryExecuted: queryItem.query,
          sourcesChecked: [],
          warnings: ["Search cancelled via AbortSignal."],
          fetchedAt: new Date().toISOString(),
          status: "FAILED",
        };
      }

      const startMs = Date.now();
      const timeoutController = new AbortController();
      const timeoutId = setTimeout(
        () => timeoutController.abort(),
        config.requestTimeoutMs || 6000
      );

      const onParentAbort = () => timeoutController.abort();
      options.signal?.addEventListener("abort", onParentAbort, { once: true });

      try {
        const res = await provider.search({
          ...options,
          signal: timeoutController.signal,
        });
        clearTimeout(timeoutId);
        options.signal?.removeEventListener("abort", onParentAbort);

        const filteredOpportunities =
          config.mode === "LIVE"
            ? res.opportunities.filter(
                (o) =>
                  o.isDemo !== true &&
                  o.verificationStatus !== "DEMO_DATA" &&
                  !String(o.providerId || "").startsWith("demo-")
              )
            : res.opportunities;

        const withDuration: SearchProviderResult = {
          ...res,
          opportunities: filteredOpportunities,
          cached: false,
          durationMs: Date.now() - startMs,
        };

        if (res.status === "SUCCESS" || res.status === "PARTIAL") {
          if (config.cacheTtlSeconds > 0) {
            await this.saveToCache(
              cacheKey,
              provider.id,
              queryItem.query,
              filterMeta,
              withDuration,
              config.cacheTtlSeconds
            );
          }
          return withDuration;
        }

        lastResult = withDuration;
        if (res.status === "RATE_LIMITED") {
          // Do not hammer a rate-limited provider
          break;
        }
      } catch (err) {
        clearTimeout(timeoutId);
        options.signal?.removeEventListener("abort", onParentAbort);
        const isTimeout = timeoutController.signal.aborted && !options.signal?.aborted;
        lastResult = {
          provider: provider.id,
          opportunities: [],
          queryExecuted: queryItem.query,
          sourcesChecked: [],
          warnings: [
            isTimeout
              ? `Provider ${provider.id} timed out after ${config.requestTimeoutMs}ms.`
              : `Provider ${provider.id} error: ${err instanceof Error ? err.message : String(err)}`,
          ],
          fetchedAt: new Date().toISOString(),
          status: "FAILED",
          durationMs: Date.now() - startMs,
        };
      }
    }

    return (
      lastResult || {
        provider: provider.id,
        opportunities: [],
        queryExecuted: queryItem.query,
        sourcesChecked: [],
        warnings: [`Provider ${provider.id} failed after ${maxAttempts} attempt(s).`],
        fetchedAt: new Date().toISOString(),
        status: "FAILED",
      }
    );
  }

  /**
   * Executes multiple query items across active providers in parallel with bounded concurrency
   * and budget enforcement. One provider failure never invalidates other providers.
   */
  async executeRoundQueries(params: {
    queryItems: SearchQueryItem[];
    roundNumber: number;
    config: SearchConfig;
    remainingBudget: number;
    signal?: AbortSignal;
    fetchImpl?: typeof fetch;
  }): Promise<{
    results: SearchProviderResult[];
    callsExecuted: number;
  }> {
    const { queryItems, roundNumber, config, remainingBudget, signal, fetchImpl } = params;

    const tasks: Array<{ provider: SearchProvider; queryItem: SearchQueryItem }> = [];
    for (const queryItem of queryItems) {
      const providersForQuery = this.getActiveProviders(config, queryItem.targetProviders);
      for (const provider of providersForQuery) {
        if (tasks.length < remainingBudget) {
          tasks.push({ provider, queryItem });
        }
      }
    }

    const concurrency = Math.max(1, config.providerConcurrency || 3);
    const results: SearchProviderResult[] = [];
    let cursor = 0;

    const worker = async () => {
      while (cursor < tasks.length) {
        if (signal?.aborted) break;
        const idx = cursor++;
        const task = tasks[idx];
        if (!task) break;
        const result = await this.executeProviderWithGuards(task.provider, {
          queryItem: task.queryItem,
          roundNumber,
          limit: Math.min(task.queryItem.maxResults || config.resultsPerProvider, config.resultsPerProvider),
          config,
          signal,
          fetchImpl,
        });
        results.push(result);
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, () =>
      worker()
    );
    await Promise.all(workers);

    return {
      results,
      callsExecuted: results.length,
    };
  }

  private async getFromCache(cacheKey: string): Promise<CacheEntry | null> {
    const now = Date.now();
    const mem = memoryCache.get(cacheKey);
    if (mem && mem.expiresAtMs > now) {
      return mem;
    }

    try {
      const row = await prisma.searchCache.findUnique({
        where: { cacheKey },
      });
      if (row && row.expiresAt.getTime() > now) {
        const parsed = JSON.parse(row.payloadJson) as SearchProviderResult;
        const entry: CacheEntry = {
          result: parsed,
          fetchedAt: row.fetchedAt.toISOString(),
          expiresAtMs: row.expiresAt.getTime(),
        };
        memoryCache.set(cacheKey, entry);
        return entry;
      }
    } catch {
      // Ignore DB cache errors during standalone unit tests
    }
    return null;
  }

  private async saveToCache(
    cacheKey: string,
    provider: string,
    query: string,
    filters: Record<string, unknown>,
    result: SearchProviderResult,
    ttlSeconds: number
  ): Promise<void> {
    const fetchedAt = result.fetchedAt || new Date().toISOString();
    const expiresAtMs = Date.now() + ttlSeconds * 1000;
    memoryCache.set(cacheKey, {
      result,
      fetchedAt,
      expiresAtMs,
    });

    try {
      await prisma.searchCache.upsert({
        where: { cacheKey },
        update: {
          payloadJson: JSON.stringify(result),
          fetchedAt: new Date(fetchedAt),
          expiresAt: new Date(expiresAtMs),
        },
        create: {
          cacheKey,
          provider,
          query,
          filtersJson: JSON.stringify(filters),
          payloadJson: JSON.stringify(result),
          fetchedAt: new Date(fetchedAt),
          expiresAt: new Date(expiresAtMs),
        },
      });
    } catch {
      // Ignore DB persistence errors if running in pure in-memory unit test
    }
  }

  async checkAllProvidersHealth(): Promise<
    Record<string, { isHealthy: boolean; latencyMs: number; error?: string }>
  > {
    const report: Record<
      string,
      { isHealthy: boolean; latencyMs: number; error?: string }
    > = {};
    for (const [id, provider] of this.providers.entries()) {
      if (typeof (provider as any).healthCheck === "function") {
        try {
          report[id] = await (provider as any).healthCheck();
        } catch (e: any) {
          report[id] = { isHealthy: false, latencyMs: 0, error: e?.message };
        }
      } else {
        report[id] = { isHealthy: true, latencyMs: 0 };
      }
    }
    return report;
  }
}

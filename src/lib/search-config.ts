import { SearchConfig } from "../types";

export const EMPTY_LIVE_OPPORTUNITIES_MESSAGE =
  "No verified opportunities found from the currently available sources.";

export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  mode: "LIVE",
  maxRounds: 3,
  queriesPerRound: 4,
  resultsPerProvider: 15,
  providerConcurrency: 3,
  requestTimeoutMs: 6000,
  maxRetries: 2,
  cacheTtlSeconds: 3600,
  minUniqueNewOpportunities: 2,
  minMarginalYield: 0.15,
  searchBudgetPerRun: 12,
  minEligibleToStopEarly: 6,
  enableLinkedInLocalPersonal: false,
  enableGeneralWebDiscovery: false,
};

/**
 * Resolves the active SearchConfig, merging environment variables and explicit runtime overrides.
 *
 * PERMANENT NO-MOCK-DATA POLICY:
 * - Default mode is strictly "LIVE" across all production and runtime codepaths.
 * - "DEMO" mode is isolated and only activated when explicitly requested (`overrides.mode === "DEMO"`,
 *   `PROSPECT_SEARCH_MODE=DEMO`, or `PROSPECT_OFFLINE_TEST=true`).
 * - LIVE mode never silently falls back to DEMO.
 */
export function resolveSearchConfig(overrides?: Partial<SearchConfig>): SearchConfig {
  const envMode = process.env.PROSPECT_SEARCH_MODE?.toUpperCase();
  const isOfflineFixtureTest = process.env.PROSPECT_OFFLINE_TEST === "true";

  const defaultMode: "DEMO" | "LIVE" = isOfflineFixtureTest
    ? "DEMO"
    : envMode === "DEMO"
      ? "DEMO"
      : "LIVE";

  const config: SearchConfig = {
    ...DEFAULT_SEARCH_CONFIG,
    mode: overrides?.mode ?? defaultMode,
    maxRounds: Math.min(
      Math.max(overrides?.maxRounds ?? DEFAULT_SEARCH_CONFIG.maxRounds, 1),
      5
    ),
    queriesPerRound:
      overrides?.queriesPerRound ?? DEFAULT_SEARCH_CONFIG.queriesPerRound,
    resultsPerProvider:
      overrides?.resultsPerProvider ?? DEFAULT_SEARCH_CONFIG.resultsPerProvider,
    providerConcurrency:
      overrides?.providerConcurrency ?? DEFAULT_SEARCH_CONFIG.providerConcurrency,
    requestTimeoutMs:
      overrides?.requestTimeoutMs ?? DEFAULT_SEARCH_CONFIG.requestTimeoutMs,
    maxRetries: overrides?.maxRetries ?? DEFAULT_SEARCH_CONFIG.maxRetries,
    cacheTtlSeconds:
      overrides?.cacheTtlSeconds ?? DEFAULT_SEARCH_CONFIG.cacheTtlSeconds,
    minUniqueNewOpportunities:
      overrides?.minUniqueNewOpportunities ??
      DEFAULT_SEARCH_CONFIG.minUniqueNewOpportunities,
    minMarginalYield:
      overrides?.minMarginalYield ?? DEFAULT_SEARCH_CONFIG.minMarginalYield,
    searchBudgetPerRun:
      overrides?.searchBudgetPerRun ?? DEFAULT_SEARCH_CONFIG.searchBudgetPerRun,
    minEligibleToStopEarly:
      overrides?.minEligibleToStopEarly ??
      DEFAULT_SEARCH_CONFIG.minEligibleToStopEarly,
    enableLinkedInLocalPersonal:
      overrides?.enableLinkedInLocalPersonal ??
      process.env.LINKEDIN_LOCAL_PERSONAL_ENABLED === "true",
    enableGeneralWebDiscovery:
      overrides?.enableGeneralWebDiscovery ??
      Boolean(
        process.env.TAVILY_API_KEY &&
          process.env.ENABLE_WEB_DISCOVERY !== "false"
      ),
  };

  if (isOfflineFixtureTest && overrides?.mode !== "LIVE") {
    config.mode = "DEMO";
  }

  return config;
}

/**
 * Runtime safeguard: Checks whether an opportunity record is a demo/synthetic fixture.
 */
export function isDemoOrFixtureRecord(record: {
  id?: string;
  isDemo?: boolean;
  verificationStatus?: string;
  provider?: string;
  sourceName?: string;
}): boolean {
  if (record.isDemo === true) return true;
  if (record.verificationStatus === "DEMO_DATA") return true;
  if (typeof record.id === "string" && record.id.startsWith("demo-")) return true;
  if (record.provider === "demo_fixture" || (typeof record.provider === "string" && record.provider.startsWith("demo_"))) {
    return true;
  }
  if (
    typeof record.sourceName === "string" &&
    record.sourceName.toLowerCase().includes("demo fixture")
  ) {
    return true;
  }
  return false;
}

/**
 * Runtime safeguard: Throws an error if any demo/fixture record is present in LIVE mode.
 */
export function assertNoDemoDataInLiveMode(
  mode: "DEMO" | "LIVE",
  records: Array<{
    id?: string;
    isDemo?: boolean;
    verificationStatus?: string;
    provider?: string;
    sourceName?: string;
  }>
): void {
  if (mode !== "LIVE") return;
  const leaked = records.filter((r) => isDemoOrFixtureRecord(r));
  if (leaked.length > 0) {
    throw new Error(
      `NO_MOCK_DATA_POLICY_VIOLATION: Detected ${leaked.length} demo/fixture record(s) in LIVE mode (${leaked
        .map((r) => r.id || r.provider || "unknown")
        .join(", ")}).`
    );
  }
}



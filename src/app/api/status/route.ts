import { NextResponse } from "next/server";
import { getSearchAdapter } from "@/lib/adapters/search-adapter";
import { getLLMAdapter } from "@/lib/adapters/llm-adapter";
import { SOURCE_CATALOG } from "@/lib/providers/source-catalog";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const url = new URL(req.url);
  if (url.searchParams.get("mode")?.toUpperCase() === "DEMO") {
    return NextResponse.json(
      {
        error:
          "NO_MOCK_DATA_POLICY_VIOLATION: Demo/mock mode is disabled. Prospect runs exclusively in LIVE_MODE.",
      },
      { status: 422 }
    );
  }
  const searchAdapter = getSearchAdapter("LIVE");
  const llmAdapter = getLLMAdapter();

  const isDemo = false;
  const tavilyConfigured = Boolean(process.env.TAVILY_API_KEY && process.env.TAVILY_API_KEY.trim().length > 0);
  const braveConfigured = Boolean(process.env.BRAVE_SEARCH_API_KEY && process.env.BRAVE_SEARCH_API_KEY.trim().length > 0);
  const llmConfigured = Boolean(
    (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim().length > 0) ||
      (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0)
  );

  let syncMetrics = null;
  try {
    const latestSync = await prisma.syncLog.findFirst({
      orderBy: { completedAt: "desc" },
    });
    const totalCount = await prisma.opportunity.count({ where: { isDemo: false } });
    const activeCount = await prisma.opportunity.count({ where: { isDemo: false, isExpired: false } });
    const expiredCount = await prisma.opportunity.count({ where: { isDemo: false, isExpired: true } });

    syncMetrics = {
      lastSyncAt: latestSync ? latestSync.completedAt.toISOString() : null,
      lastStatus: latestSync ? latestSync.status : "IDLE",
      totalOpportunities: totalCount,
      activeOpportunities: activeCount,
      expiredOpportunities: expiredCount,
    };
  } catch {
    // Keep status route reliable even if db read fails
  }

  return NextResponse.json({
    appName: "Prospect",
    tagline: "Career Opportunity Discovery Agent",
    version: "1.0.0",
    mode: isDemo ? "DEMO_MODE" : "LIVE_MODE",
    providers: {
      search: {
        name: searchAdapter.name,
        isLive: searchAdapter.isLive,
        configured: true,
        tavilyConfigured,
        braveConfigured,
        publicEmployerFeedsActive: true,
        freehireActive: true,
      },
      llm: {
        name: llmAdapter.name,
        isLive: llmAdapter.isLive,
        configured: llmConfigured,
      },
    },
    sourceCatalog: {
      totalSources: SOURCE_CATALOG.length,
      activeSources: SOURCE_CATALOG.filter((s) => s.enabled).length,
    },
    syncMetrics,
    setupHint: isDemo
      ? "Running in isolated DEMO mode (in-memory fixtures only)."
      : `LIVE mode active with ${searchAdapter.name}.${
          llmConfigured
            ? ` AI model provider connected (${llmAdapter.name}).`
            : " AI LLM provider not configured (set GROQ_API_KEY or GEMINI_API_KEY to enable LLM synthesis)."
        }`,
  });
}

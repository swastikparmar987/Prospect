import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  loadActiveUserProfile,
  runOpportunityDiscoveryAgent,
} from "@/lib/agent/orchestrator";
import { extractCandidateCapabilityMap } from "@/lib/candidate-intelligence";
import { computeFeedbackPersonalization } from "@/lib/feedback-engine";
import { SearchProviderRegistry } from "@/lib/providers/provider-registry";
import { expandCandidateRoleFamilies } from "@/lib/role-expansion";
import { resolveSearchConfig } from "@/lib/search-config";
import { FeedbackSignalType, UserFeedbackRecord } from "@/types";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const modeParam = searchParams.get("mode")?.toUpperCase();
    if (modeParam === "DEMO") {
      return NextResponse.json(
        {
          error:
            "NO_MOCK_DATA_POLICY_VIOLATION: Demo/mock mode is disabled. Live search intelligence only.",
        },
        { status: 422 }
      );
    }
    const config = resolveSearchConfig({ mode: "LIVE" });

    const profile = await loadActiveUserProfile();
    const capabilityMap = profile
      ? extractCandidateCapabilityMap(profile)
      : null;
    const expandedRoles = profile
      ? expandCandidateRoleFamilies(profile, capabilityMap || undefined)
      : [];

    const registry = new SearchProviderRegistry();
    const providers = registry
      .listProviders()
      .filter((p) => !p.id.startsWith("demo_"))
      .map((p) => ({
        id: p.id,
        displayName: p.displayName,
        description: p.description,
        scopeNote: p.scopeNote,
        enabled: p.isEnabled(config),
      }));

    const feedbackRows = prisma.userFeedback
      ? await prisma.userFeedback.findMany({
          orderBy: { createdAt: "asc" },
          take: 100,
        })
      : [];
    const feedbackRecords: UserFeedbackRecord[] = feedbackRows.map((r) => ({
      id: r.id,
      profileId: r.profileId,
      opportunityId: r.opportunityId,
      organization: r.organization,
      roleFamily: r.roleFamily,
      signalType: r.signalType as FeedbackSignalType,
      outcome: (r.outcome as UserFeedbackRecord["outcome"]) ?? null,
      notes: r.notes,
      createdAt: r.createdAt.toISOString(),
    }));

    const personalization = computeFeedbackPersonalization(
      feedbackRecords,
      profile
    );

    return NextResponse.json({
      config,
      profile,
      capabilityMap,
      expandedRoles,
      providers,
      personalization,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to load search intelligence state",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body.mode === "string" && body.mode.toUpperCase() === "DEMO") {
      return NextResponse.json(
        {
          error:
            "NO_MOCK_DATA_POLICY_VIOLATION: Demo/mock mode is disabled. Live search intelligence only.",
        },
        { status: 422 }
      );
    }
    const result = await runOpportunityDiscoveryAgent({
      query: body.query || "",
      mode: "LIVE",
      maxRounds: typeof body.maxRounds === "number" ? body.maxRounds : 3,
      configOverrides: body.configOverrides,
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      {
        error: "Adaptive search execution failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

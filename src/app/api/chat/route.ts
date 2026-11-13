import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/auth";
import { loadActiveUserProfile } from "@/lib/agent/orchestrator";
import { evaluateOpportunity } from "@/lib/scoring-engine";
import {
  doesOpportunityMatchRequestedDestination,
  parseSearchIntent,
} from "@/lib/query-intent-parser";
import {
  enrichOpportunityWithLocationIntelligence,
  filterOpportunitiesByLocationMode,
} from "@/lib/location-intelligence";
import { modelRouter } from "@/lib/ai/model-router";
import { isDemoOrFixtureRecord } from "@/lib/search-config";
import {
  EvaluationResult,
  LocationDiscoveryMode,
  Opportunity,
  UserProfile,
} from "@/types";

const ChatRequestSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      })
    )
    .max(14)
    .optional(),
  activeLocationMode: z
    .enum([
      "VICINITY",
      "ALL",
      "NEAR_ME",
      "REMOTE",
      "HYBRID",
      "ONSITE",
      "IN_MY_CITY",
      "SELECTED_CITY",
    ])
    .optional(),
  activeTab: z.string().optional(),
});

export interface ChatSuggestedAction {
  type: "SEARCH_OPPORTUNITIES" | "SWITCH_LOCATION_MODE" | "OPEN_TAB";
  label: string;
  query?: string;
  platform?: "ALL" | "LINKEDIN" | "NAUKRI" | "BOARDS" | "PUBLIC";
  locationMode?: LocationDiscoveryMode;
  selectedCity?: string;
  tab?: "discover" | "profile" | "projects" | "scheduler" | "agent" | "tracker" | "outlook" | "prep";
}

function hydrateOpportunity(
  item: any,
  profile: UserProfile | null
): Opportunity | null {
  if (item.isDemo) return null;
  const opp: Opportunity = {
    id: item.id,
    title: item.title,
    organization: item.organization,
    category: item.category,
    employmentType: item.employmentType || undefined,
    roleFamily: item.roleFamily || undefined,
    seniority: item.seniority || undefined,
    description: item.description,
    location: item.location,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
    workMode: item.workMode,
    compensation: item.compensation,
    eligibilityRequirements: JSON.parse(item.eligibilityRequirements || "[]"),
    requiredSkills: JSON.parse(item.requiredSkills || "[]"),
    preferredSkills: JSON.parse(item.preferredSkills || "[]"),
    publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
    deadline: item.deadline ? item.deadline.toISOString() : null,
    deadlineRaw: item.deadlineRaw,
    applyUrl: item.applyUrl,
    applicationUrl: item.applyUrl,
    canonicalUrl: item.canonicalUrl || item.applyUrl,
    providerId: item.providerId,
    sourceName: item.sourceName,
    sourceUrl: item.sourceUrl,
    sourceSnippet: item.sourceSnippet || "",
    sourceConfidence: item.sourceConfidence,
    verificationStatus: item.verificationStatus,
    sourceEvidence: JSON.parse(item.sourceEvidence || "[]"),
    multiSourceProvenance: JSON.parse(item.multiSourceProvenance || "[]"),
    guardVerdict: item.guardVerdict || "CLEAN",
    embedding: JSON.parse(item.embeddingJson || "[]"),
    isExpired: Boolean(item.isExpired),
    fetchedAt: item.fetchedAt.toISOString(),
    discoveredAt: item.discoveredAt.toISOString(),
    lastCheckedAt: item.lastCheckedAt.toISOString(),
    isDemo: false,
  };
  if (isDemoOrFixtureRecord(opp)) return null;
  return enrichOpportunityWithLocationIntelligence(
    opp,
    profile?.locationPreference
  );
}

function buildDeterministicChatReply(params: {
  message: string;
  profile: UserProfile | null;
  activeLocationMode: LocationDiscoveryMode;
  intent: ReturnType<typeof parseSearchIntent>;
  topMatches: Array<{ opportunity: Opportunity; evaluation: EvaluationResult }>;
  totalVicinityCount: number;
  totalPoolCount: number;
}): { reply: string; suggestedActions: ChatSuggestedAction[] } {
  const {
    message,
    profile,
    activeLocationMode,
    intent,
    topMatches,
    totalVicinityCount,
    totalPoolCount,
  } = params;
  const resumeCity = profile?.locationPreference?.city || profile?.location || "your resume location";
  const lower = message.toLowerCase();
  const actions: ChatSuggestedAction[] = [];

  if (/\blinkedin\b/i.test(lower)) {
    actions.push({
      type: "SEARCH_OPPORTUNITIES",
      label: "Show LinkedIn Jobs Only",
      query: intent.location ? message : "",
      platform: "LINKEDIN",
      locationMode: intent.location ? "ALL" : activeLocationMode,
    });
  } else if (/\bnaukri\b/i.test(lower)) {
    actions.push({
      type: "SEARCH_OPPORTUNITIES",
      label: "Show Naukri.com Jobs Only",
      query: intent.location ? message : "",
      platform: "NAUKRI",
      locationMode: intent.location ? "ALL" : activeLocationMode,
    });
  } else if (intent.location) {
    if (intent.locationScope === "GLOBAL") {
      actions.push({
        type: "SWITCH_LOCATION_MODE",
        label: "Switch to Global (All Locations)",
        locationMode: "ALL",
      });
    } else {
      const cityShort = intent.location.split(",")[0].trim();
      actions.push({
        type: "SEARCH_OPPORTUNITIES",
        label: `Search ${intent.roleTitle || "Roles"} in ${cityShort}`,
        query: message,
        locationMode: "ALL",
        selectedCity: cityShort,
      });
    }
  } else if (/\b(nearby|vicinity|local|close|around me|resume city)\b/i.test(lower)) {
    actions.push({
      type: "SWITCH_LOCATION_MODE",
      label: `Filter to My Vicinity (${resumeCity})`,
      locationMode: "VICINITY",
    });
  } else if (/\b(remote|wfh)\b/i.test(lower)) {
    actions.push({
      type: "SWITCH_LOCATION_MODE",
      label: "Show Remote Opportunities",
      locationMode: "REMOTE",
    });
  } else if (/\b(schedule|scheduler|reminder|daily sync|automate)\b/i.test(lower)) {
    actions.push({
      type: "OPEN_TAB",
      label: "Open Job & Prep Scheduler",
      tab: "scheduler",
    });
  } else if (/\b(project|github|portfolio|ats|bullet|resume)\b/i.test(lower)) {
    actions.push({
      type: "OPEN_TAB",
      label: "Open AI Project Lab",
      tab: "projects",
    });
  } else {
    actions.push({
      type: "SEARCH_OPPORTUNITIES",
      label: `Apply Search in Discover`,
      query: intent.skills.length > 0 || intent.category ? message : "",
      locationMode: activeLocationMode,
    });
  }

  if (actions.length < 2 && activeLocationMode !== "ALL" && !intent.location) {
    actions.push({
      type: "SWITCH_LOCATION_MODE",
      label: "Explore Global (All Countries)",
      locationMode: "ALL",
    });
  }

  const lines: string[] = [];
  if (intent.location) {
    lines.push(
      `Checked live opportunities for **${intent.location}**${
        intent.workMode ? ` (${intent.workMode})` : ""
      } — your feed is never locked to your resume city when you ask for another state, country, or global search.`
    );
  } else {
    lines.push(
      `Here is what I found based on your profile (${resumeCity}; active mode: **${activeLocationMode}**, ${totalVicinityCount} matches in resume vicinity / ${totalPoolCount} in active recent slice).`
    );
  }

  if (topMatches.length > 0) {
    lines.push("");
    lines.push("**Top live verified matches right now:**");
    for (const { opportunity, evaluation } of topMatches.slice(0, 4)) {
      lines.push(
        `- **${opportunity.title}** at ${opportunity.organization} — ${opportunity.location} (${opportunity.workMode}) · **${Math.round(
          evaluation.overallScore
        )}% fit** (${evaluation.recommendation})`
      );
    }
  } else {
    lines.push("");
    lines.push(
      "No cached jobs in the recent slice matched those exact filters yet — click an action below to open Discover or trigger live multi-source search across 21 company boards + public APIs."
    );
  }

  const missingSkills = Array.from(
    new Set(
      topMatches.flatMap((m) => m.evaluation.missingQualifications || [])
    )
  ).slice(0, 4);

  if (missingSkills.length > 0) {
    lines.push("");
    lines.push(`**Highest-ROI skills/keywords appearing in these matches:** ${missingSkills.join(", ")}.`);
  }

  return {
    reply: lines.join("\n"),
    suggestedActions: actions.slice(0, 3),
  };
}

export async function POST(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const body = await req.json();
    const parsed = ChatRequestSchema.parse(body);

    const profile = await loadActiveUserProfile(user.userId);
    const activeLocationMode = (parsed.activeLocationMode || "VICINITY") as LocationDiscoveryMode;
    const intent = parseSearchIntent(parsed.message);

    // Load recent live opportunities cleanly (no demo records)
    const rawOpps = await prisma.opportunity.findMany({
      where: { isDemo: false, isExpired: false },
      orderBy: { discoveredAt: "desc" },
      take: 250,
    });

    const allOpps = rawOpps
      .map((item) => hydrateOpportunity(item, profile))
      .filter((x): x is Opportunity => Boolean(x));

    const vicinityOpps = filterOpportunitiesByLocationMode(
      allOpps,
      "VICINITY",
      profile?.locationPreference,
      undefined,
      profile?.preferredLocations || []
    );

    // Select candidate slice aligned with user's explicit prompt or current mode
    let pool = allOpps;
    if (intent.location) {
      if (intent.locationScope !== "GLOBAL") {
        pool = allOpps.filter((o) =>
          doesOpportunityMatchRequestedDestination(
            o.location,
            o.workMode,
            intent.location!,
            intent.locationScope
          )
        );
      }
    } else if (activeLocationMode !== "ALL") {
      pool = filterOpportunitiesByLocationMode(
        allOpps,
        activeLocationMode,
        profile?.locationPreference,
        undefined,
        profile?.preferredLocations || []
      );
      if (pool.length === 0) pool = allOpps;
    }

    if (intent.workMode) {
      const modeFiltered = pool.filter((o) => o.workMode === intent.workMode);
      if (modeFiltered.length > 0) pool = modeFiltered;
    }

    const platformHint = /\blinkedin\b/i.test(parsed.message)
      ? "LINKEDIN"
      : /\bnaukri\b/i.test(parsed.message)
      ? "NAUKRI"
      : null;
    if (platformHint === "LINKEDIN") {
      const pFiltered = pool.filter(
        (o) =>
          o.sourceName.toLowerCase().includes("linkedin") ||
          o.applyUrl.toLowerCase().includes("linkedin.com")
      );
      if (pFiltered.length > 0) pool = pFiltered;
    } else if (platformHint === "NAUKRI") {
      const pFiltered = pool.filter(
        (o) =>
          o.sourceName.toLowerCase().includes("naukri") ||
          o.applyUrl.toLowerCase().includes("naukri.com")
      );
      if (pFiltered.length > 0) pool = pFiltered;
    }

    if (intent.skills.length > 0) {
      const skillLower = intent.skills.map((s) => s.toLowerCase());
      const skillMatches = pool.filter((o) => {
        const hay = `${o.title} ${o.description} ${o.requiredSkills.join(" ")}`.toLowerCase();
        return skillLower.some((s) => hay.includes(s));
      });
      if (skillMatches.length > 0) pool = skillMatches;
    }

    const scoredPool = pool
      .slice(0, 120)
      .map((opportunity) => ({
        opportunity,
        evaluation: evaluateOpportunity(opportunity, profile),
      }))
      .sort((a, b) => b.evaluation.overallScore - a.evaluation.overallScore);

    const topMatches = scoredPool.slice(0, 6);

    const candidateSummary = profile
      ? {
          name: profile.fullName,
          resumeLocation: profile.locationPreference?.displayLabel || profile.location || "Not set",
          resumeCity: profile.locationPreference?.city || "Not set",
          skills: (profile.skills || []).slice(0, 14),
          targetRoles: profile.targetRoles || [],
          projectsCount: (profile.projects || []).length,
          degree: profile.degree,
          major: profile.major,
          graduationYear: profile.graduationYear,
        }
      : { note: "No active resume uploaded yet" };

    const topOppContext = topMatches.map(({ opportunity, evaluation }) => ({
      title: opportunity.title,
      organization: opportunity.organization,
      location: opportunity.location,
      workMode: opportunity.workMode,
      category: opportunity.category,
      score: Math.round(evaluation.overallScore),
      recommendation: evaluation.recommendation,
      missingQualifications: (evaluation.missingQualifications || []).slice(0, 3),
    }));

    const historyText = (parsed.history || [])
      .slice(-6)
      .map((h) => `${h.role.toUpperCase()}: ${h.content}`)
      .join("\n");

    const systemPrompt = `You are Prospect AI Career Strategist, a practical, honest career advisor built into Prospect.
Rules:
1. NEVER invent jobs, companies, salaries, or URLs. Refer ONLY to the verified opportunities in the prompt context or advise how to search in Prospect.
2. NEVER lock users to NCR or any single city. By default Prospect uses the candidate's active resume city/country ("Vicinity"), AND users can freely switch to any city, state, country, LinkedIn Only, Naukri Only, Remote Only, or Global (All) anytime.
3. Also note for LinkedIn & Naukri: no LinkedIn/Naukri login or credentialed authenticator is needed in Prospect; Prospect uses authorized real-time web indexing + direct deep-link URL import cleanly within platform rules.
4. Keep replies clear, concise, practical markdown with bullet points where helpful.`;

    const prompt = `Candidate Profile:
${JSON.stringify(candidateSummary, null, 2)}

Active UI Context:
- activeTab: ${parsed.activeTab || "discover"}
- activeLocationMode: ${activeLocationMode}
- resumeVicinityMatchesInSlice: ${vicinityOpps.length}
- totalRecentOpportunitiesSampled: ${allOpps.length}
- parsedDestinationFromPrompt: ${intent.location || "none"} (scope: ${intent.locationScope || "none"})
- requestedPlatform: ${platformHint || "ALL"}

Top Verified Live Matches For This Request:
${JSON.stringify(topOppContext, null, 2)}

${historyText ? `Recent Chat History:\n${historyText}\n` : ""}
User Message:
"${parsed.message}"`;

    const fallbackPlan = buildDeterministicChatReply({
      message: parsed.message,
      profile,
      activeLocationMode,
      intent,
      topMatches,
      totalVicinityCount: vicinityOpps.length,
      totalPoolCount: allOpps.length,
    });

    try {
      const llmRes = await modelRouter.complete("REASONING", prompt, {
        systemPrompt,
        temperature: 0.35,
        maxTokens: 700,
        timeoutMs: 12000,
      });

      if (!llmRes.text || llmRes.text.trim().length < 8) {
        throw new Error("Empty LLM chat completion");
      }

      return NextResponse.json({
        reply: llmRes.text.trim(),
        suggestedActions: fallbackPlan.suggestedActions.slice(0, 3),
        matchedOpportunities: topMatches.slice(0, 3).map(({ opportunity, evaluation }) => ({
          id: opportunity.id,
          title: opportunity.title,
          organization: opportunity.organization,
          location: opportunity.location,
          workMode: opportunity.workMode,
          score: Math.round(evaluation.overallScore),
          recommendation: evaluation.recommendation,
        })),
        modelUsed: llmRes.model,
        fallbackUsed: false,
      });
    } catch {
      return NextResponse.json({
        ...fallbackPlan,
        matchedOpportunities: topMatches.slice(0, 3).map(({ opportunity, evaluation }) => ({
          id: opportunity.id,
          title: opportunity.title,
          organization: opportunity.organization,
          location: opportunity.location,
          workMode: opportunity.workMode,
          score: Math.round(evaluation.overallScore),
          recommendation: evaluation.recommendation,
        })),
        modelUsed: "deterministic-advisor",
        fallbackUsed: true,
      });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid chat message", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      {
        error: "AI chat assistant unavailable",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

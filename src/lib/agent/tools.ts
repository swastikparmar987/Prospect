import { z } from "zod";
import { Opportunity, UserProfile, EvaluationResult, PreparationPlan, ApplicationMaterials } from "@/types";
import { isSafePublicUrl } from "../safe-url";
import { deduplicateOpportunities } from "../dedup";
import { evaluateEligibility } from "../eligibility-engine";
import { evaluateOpportunity } from "../scoring-engine";
import { generatePreparationPlan } from "../gap-action-engine";
import { generateApplicationMaterials } from "../prep-studio";
import { getSearchAdapter } from "../adapters/search-adapter";

// Zod Input Schemas for Strict Boundary Validation
export const SearchOpportunitiesInputSchema = z.object({
  query: z.string().max(200),
  category: z.enum(["Internship", "Fellowship", "Research", "Hackathon", "Entry-level"]).optional(),
  workMode: z.enum(["Remote", "Hybrid", "On-site", "Flexible"]).optional(),
  location: z.string().max(100).optional(),
});

export const InspectPublicSourceInputSchema = z.object({
  url: z.string().url().max(500),
});

export const EvaluateEligibilityInputSchema = z.object({
  opportunityId: z.string(),
});

export const SaveOpportunityInputSchema = z.object({
  opportunityId: z.string(),
  stage: z.enum(["SAVED", "PREPARING", "READY_TO_APPLY", "APPLIED"]).default("SAVED"),
});

/**
 * Tool: search_opportunities
 */
export async function toolSearchOpportunities(input: z.infer<typeof SearchOpportunitiesInputSchema>): Promise<Opportunity[]> {
  const validated = SearchOpportunitiesInputSchema.parse(input);
  const adapter = getSearchAdapter();
  return adapter.search(validated.query, {
    category: validated.category,
    workMode: validated.workMode,
    location: validated.location,
  });
}

/**
 * Tool: inspect_public_source
 * Safe web inspection with SSRF guards and bounded timeouts.
 */
export async function toolInspectPublicSource(input: z.infer<typeof InspectPublicSourceInputSchema>): Promise<{
  url: string;
  isReachable: boolean;
  statusText: string;
  sourceSnippet?: string;
  checkedAt: string;
}> {
  const validated = InspectPublicSourceInputSchema.parse(input);
  const safeCheck = isSafePublicUrl(validated.url);

  if (!safeCheck.isSafe) {
    return {
      url: validated.url,
      isReachable: false,
      statusText: `Security Guard: Inspection blocked (${safeCheck.reason})`,
      checkedAt: new Date().toISOString(),
    };
  }

  // If running in synthetic demo mode, return simulated verified snippet without external network calls
  if (validated.url.includes("test") || validated.url.includes("demo")) {
    return {
      url: validated.url,
      isReachable: true,
      statusText: "Verified public demo route",
      sourceSnippet: "Simulated verified employer portal content with application guidelines and deadline schedule.",
      checkedAt: new Date().toISOString(),
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4 second safety timeout

    const resp = await fetch(validated.url, {
      method: "GET",
      headers: {
        "User-Agent": "Prospect-Career-Agent/1.0 (Public Source Verification)",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    return {
      url: validated.url,
      isReachable: resp.ok,
      statusText: `HTTP ${resp.status} ${resp.statusText}`,
      sourceSnippet: resp.ok ? "Source page is reachable and returned active status code." : "Page returned error code.",
      checkedAt: new Date().toISOString(),
    };
  } catch (err) {
    return {
      url: validated.url,
      isReachable: false,
      statusText: `Connection failed: ${err instanceof Error ? err.message : String(err)}`,
      checkedAt: new Date().toISOString(),
    };
  }
}

/**
 * Tool: deduplicate_opportunities
 */
export function toolDeduplicateOpportunities(opportunities: Opportunity[]) {
  return deduplicateOpportunities(opportunities);
}

/**
 * Tool: evaluate_eligibility
 */
export function toolEvaluateEligibility(opportunity: Opportunity, profile: UserProfile | null) {
  return evaluateEligibility(opportunity, profile);
}

/**
 * Tool: calculate_fit_score
 */
export function toolCalculateFitScore(opportunity: Opportunity, profile: UserProfile | null): EvaluationResult {
  return evaluateOpportunity(opportunity, profile);
}

/**
 * Tool: create_preparation_plan
 */
export function toolCreatePreparationPlan(opportunity: Opportunity, profile: UserProfile | null): PreparationPlan {
  return generatePreparationPlan(opportunity, profile);
}

/**
 * Tool: generate_application_draft
 */
export function toolGenerateApplicationDraft(opportunity: Opportunity, profile: UserProfile | null): ApplicationMaterials {
  return generateApplicationMaterials(opportunity, profile);
}

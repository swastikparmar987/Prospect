import { test } from "node:test";
import assert from "node:assert/strict";
import { applyEmployerDiversity, computeConcentrationMetrics } from "../lib/search-diversity";
import { Opportunity } from "../types";

function createMockItem(id: string, org: string, score: number) {
  const opp: Opportunity = {
    id,
    title: `${org} Software Engineer Intern`,
    organization: org,
    category: "Internship",
    description: `Join ${org} team`,
    location: "San Francisco, CA",
    workMode: "Hybrid",
    compensation: "$55/hour",
    eligibilityRequirements: [],
    requiredSkills: ["Python"],
    preferredSkills: [],
    applyUrl: `https://${org.toLowerCase()}.com/careers/${id}`,
    sourceName: `${org} Careers`,
    sourceUrl: `https://${org.toLowerCase()}.com/careers/${id}`,
    sourceConfidence: 1.0,
    verificationStatus: "VERIFIED_SOURCE",
    sourceEvidence: [],
    discoveredAt: new Date().toISOString(),
    lastCheckedAt: new Date().toISOString(),
    isDemo: false,
  };

  return {
    opportunity: opp,
    evaluation: {
      opportunityId: id,
      overallScore: score,
      recommendation: "APPLY_NOW" as const,
      scoreBreakdown: { eligibility: 30, skills: 25, quality: 15, preferences: 8, deadline: 8 },
      hardBlockers: [],
      rationale: "Good fit",
      nextAction: "Apply",
      uncertainties: [],
      eligibilityChecks: [],
      evaluatedAt: new Date().toISOString(),
    },
    hasPrepPlan: false,
  };
}

test("Priority 4 — Search Diversity & Employer Concentration Caps", async (t) => {
  await t.test("1. Enforces max 3 opportunities per employer in the top 10 results", () => {
    // 10 Stripe opportunities (scores 99 down to 90)
    const stripeItems = Array.from({ length: 10 }, (_, i) =>
      createMockItem(`stripe_${i + 1}`, "Stripe", 99 - i)
    );
    // 5 other company opportunities (scores 85 down to 81)
    const otherItems = [
      createMockItem("google_1", "Google", 85),
      createMockItem("meta_1", "Meta", 84),
      createMockItem("openai_1", "OpenAI", 83),
      createMockItem("anthropic_1", "Anthropic", 82),
      createMockItem("figma_1", "Figma", 81),
      createMockItem("databricks_1", "Databricks", 80),
      createMockItem("notion_1", "Notion", 79),
    ];

    const rawList = [...stripeItems, ...otherItems]; // Raw sorted by score
    assert.equal(rawList[0].opportunity.organization, "Stripe");
    assert.equal(rawList[9].opportunity.organization, "Stripe"); // All 10 top were Stripe!

    const diversified = applyEmployerDiversity(rawList, 3, 10);
    assert.equal(diversified.length, rawList.length, "Must retain all opportunities");

    const top10 = diversified.slice(0, 10);
    const stripeInTop10 = top10.filter((item) => item.opportunity.organization === "Stripe");
    assert.equal(
      stripeInTop10.length,
      3,
      `Expected exactly 3 Stripe opportunities in top 10, got ${stripeInTop10.length}`
    );

    const nonStripeInTop10 = top10.filter((item) => item.opportunity.organization !== "Stripe");
    assert.equal(nonStripeInTop10.length, 7, "Top 10 must contain 7 diverse opportunities");

    // Check deferred items still exist after top 10
    const remainder = diversified.slice(10);
    const remainingStripe = remainder.filter((item) => item.opportunity.organization === "Stripe");
    assert.equal(remainingStripe.length, 7, "Remaining 7 Stripe opportunities must appear after top 10");
  });

  await t.test("2. Fills remaining top 10 slots gracefully if fewer than 7 diverse items exist", () => {
    const stripeItems = Array.from({ length: 8 }, (_, i) =>
      createMockItem(`stripe_${i + 1}`, "Stripe", 95 - i)
    );
    const googleItems = [
      createMockItem("google_1", "Google", 85),
      createMockItem("google_2", "Google", 84),
    ];

    const list = [...stripeItems, ...googleItems];
    const diversified = applyEmployerDiversity(list, 3, 10);

    assert.equal(diversified.length, 10);
    // Because only 2 Google items exist (3 Stripe + 2 Google = 5 items), remaining 5 slots are backfilled from Stripe
    const stripeCount = diversified.filter((i) => i.opportunity.organization === "Stripe").length;
    assert.equal(stripeCount, 8);
  });

  await t.test("3. Calculates accurate concentration metrics", () => {
    const items = [
      createMockItem("1", "Stripe", 90),
      createMockItem("2", "Stripe", 88),
      createMockItem("3", "Google", 86),
      createMockItem("4", "Meta", 84),
    ];

    const metrics = computeConcentrationMetrics(items);
    assert.equal(metrics.totalEmployers, 3);
    assert.equal(metrics.top10EmployerDistribution["Stripe"], 2);
    assert.equal(metrics.top10EmployerDistribution["Google"], 1);
    assert.equal(metrics.maxEmployerShareInTop10, 50); // 2 out of 4 = 50%
  });
});

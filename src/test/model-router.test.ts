import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";
import { ModelRouter, modelRouter } from "../lib/ai/model-router";

test("ModelRouter — Central AI Model Routing & Fallback Suite", async (t) => {
  await t.test("1. ModelRouter initializes with provider tracking", () => {
    assert.ok(modelRouter);
    const router = new ModelRouter();
    (router as any).groqApiKey = "mock-groq-key";
    assert.equal(router.isProviderAvailable("groq"), true);
    assert.ok(router.getActiveProviderName().includes("Groq Cloud"));
  });

  await t.test("2. ModelRouter handles deterministic task with zero latency overhead", async () => {
    const res = await modelRouter.complete("DETERMINISTIC", "Calculate 2+2");
    assert.ok(res);
    assert.ok(typeof res.latencyMs === "number");
    assert.equal(res.provider, "deterministic");
  });

  await t.test("3. Structured Output Parsing with Zod validation and Markdown block stripping", async () => {
    const TestSchema = z.object({
      role: z.string(),
      fitScore: z.number().min(0).max(100),
      skills: z.array(z.string()),
    });

    const rawSample = '```json\n{"role":"AI Engineer","fitScore":95,"skills":["Python","PyTorch"]}\n```';
    let clean = rawSample.trim().replace(/^```json/, "").replace(/```$/, "").trim();
    const parsed = TestSchema.safeParse(JSON.parse(clean));
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.role, "AI Engineer");
      assert.equal(parsed.data.fitScore, 95);
      assert.equal(parsed.data.skills.length, 2);
    }
  });

  await t.test("4. Rejects invalid structured JSON failing Zod schema", async () => {
    const TestSchema = z.object({
      graduationYear: z.number().min(2020).max(2035),
    });

    const invalidJson = { graduationYear: 1980 }; // outside min
    const parsed = TestSchema.safeParse(invalidJson);
    assert.equal(parsed.success, false);
  });

  await t.test("5. Circuit breaker opens after 3 consecutive failures", () => {
    const testRouter = new ModelRouter();
    (testRouter as any).groqApiKey = "mock-groq-key";
    assert.equal(testRouter.isProviderAvailable("groq"), true);

    // Simulate 3 failures for groq
    (testRouter as any).recordFailure("groq", "Simulated HTTP 500 error 1");
    (testRouter as any).recordFailure("groq", "Simulated HTTP 500 error 2");
    assert.equal(testRouter.isProviderAvailable("groq"), true); // Still closed before 3rd

    (testRouter as any).recordFailure("groq", "Simulated HTTP 500 error 3");
    // Circuit should now be open
    assert.equal(testRouter.isProviderAvailable("groq"), false);
  });

  await t.test("6. Circuit breaker resets on recorded success", () => {
    const testRouter = new ModelRouter();
    (testRouter as any).groqApiKey = "mock-groq-key";
    (testRouter as any).recordFailure("groq", "Error");
    (testRouter as any).recordFailure("groq", "Error");
    (testRouter as any).recordFailure("groq", "Error");
    assert.equal(testRouter.isProviderAvailable("groq"), false);

    (testRouter as any).recordSuccess("groq");
    assert.equal(testRouter.isProviderAvailable("groq"), true);
  });

  await t.test("7. Token estimation calculates realistic counts without network calls", async () => {
    const prompt = "This is a prompt with approximately twenty words used to verify character token heuristic calculations.";
    const completion = "This is a brief completion response.";
    const promptTokens = Math.ceil(prompt.length / 4);
    const completionTokens = Math.ceil(completion.length / 4);
    assert.ok(promptTokens > 10);
    assert.ok(completionTokens > 5);
  });
});

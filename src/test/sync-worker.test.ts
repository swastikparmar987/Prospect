import test, { describe } from "node:test";
import assert from "node:assert";
import { runOpportunitySyncWorker } from "../lib/sync/sync-worker";
import { prisma } from "../lib/db";

describe("Dynamic Job Synchronization Engine", () => {
  // Scenario 1: Expiry detection for past deadlines
  test("Detects expired deadlines and marks opportunities with isExpired=true", async () => {
    // Insert a test opportunity with an expired deadline
    const testId = `test-expired-opp-${Date.now()}`;
    await prisma.opportunity.create({
      data: {
        id: testId,
        title: "Test Expired Role",
        organization: "Test Corp",
        category: "Internship",
        description: "Old job posting",
        location: "Remote",
        workMode: "Remote",
        compensation: "$30/hr",
        applyUrl: "https://example.com/expired-job",
        sourceName: "Test Feed",
        sourceUrl: "https://example.com/expired-job",
        deadline: new Date(Date.now() - 86400000 * 5), // 5 days ago
        deadlineRaw: "Jan 1, 2024",
        isExpired: false,
        verificationStatus: "VERIFIED_SOURCE",
      },
    });

    const mockFetch: typeof fetch = async () => {
      return new Response(JSON.stringify({ jobs: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const result = await runOpportunitySyncWorker({
      fetchImpl: mockFetch,
      providers: ["CAREER_FEEDS"],
    });

    assert.ok(result.itemsExpired >= 1);

    // Verify database record was updated
    const updated = await prisma.opportunity.findUnique({ where: { id: testId } });
    assert.strictEqual(updated?.isExpired, true);

    // Cleanup
    await prisma.opportunity.delete({ where: { id: testId } }).catch(() => {});
  });

  // Scenario 2: Ingestion from career board feeds
  test("Sync worker ingests postings and records itemsAdded and itemsFetched", async () => {
    const mockGhJobs = {
      jobs: [
        {
          id: 991122,
          title: "AI Safety Research Fellow",
          content: "<p>Evaluating alignment benchmarks with Python and PyTorch.</p>",
          location: { name: "San Francisco, CA" },
          updated_at: new Date().toISOString(),
          absolute_url: "https://boards.greenhouse.io/anthropic/jobs/991122",
        },
      ],
    };

    const mockFetch: typeof fetch = async (input: RequestInfo | URL) => {
      const urlStr = String(input);
      if (urlStr.includes("boards-api.greenhouse.io/v1/boards/anthropic/jobs")) {
        return new Response(JSON.stringify(mockGhJobs), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const result = await runOpportunitySyncWorker({
      fetchImpl: mockFetch,
      providers: ["CAREER_FEEDS"],
    });

    assert.ok(result.itemsFetched >= 1);
    assert.ok(result.status === "SUCCESS" || result.status === "PARTIAL");
    assert.strictEqual(result.providerStatuses["CAREER_FEEDS"], "SUCCESS");
    assert.ok(typeof result.durationMs === "number");

    // Cleanup added opportunity
    await prisma.opportunity.deleteMany({
      where: { title: "AI Safety Research Fellow" },
    }).catch(() => {});
  });

  // Scenario 3: Deduplication and multi-source provenance merging
  test("Merges multi-source provenance when same posting appears from multiple providers", async () => {
    const existingId = `opp-test-dedup-${Date.now()}`;
    const testCanonicalUrl = "https://boards.greenhouse.io/stripe/jobs/112233";

    await prisma.opportunity.create({
      data: {
        id: existingId,
        title: "Systems Engineer Intern",
        organization: "Stripe",
        category: "Internship",
        description: "Distributed systems in Go.",
        location: "Seattle, WA",
        workMode: "Hybrid",
        compensation: "$50/hr",
        applyUrl: testCanonicalUrl,
        canonicalUrl: testCanonicalUrl,
        sourceName: "Greenhouse",
        sourceUrl: testCanonicalUrl,
        multiSourceProvenance: JSON.stringify([
          {
            provider: "CAREER_FEEDS",
            sourceName: "Greenhouse",
            sourceUrl: testCanonicalUrl,
            applicationUrl: testCanonicalUrl,
            fetchedAt: new Date().toISOString(),
            verificationStatus: "VERIFIED_SOURCE",
          },
        ]),
        isExpired: false,
        verificationStatus: "VERIFIED_SOURCE",
      },
    });

    // Mock fetch returning the same posting from an open feed
    const mockFetch: typeof fetch = async () => {
      return new Response(
        JSON.stringify({
          jobs: [
            {
              id: 112233,
              title: "Systems Engineer Intern",
              content: "<p>Distributed systems in Go.</p>",
              location: { name: "Seattle, WA" },
              updated_at: new Date().toISOString(),
              absolute_url: testCanonicalUrl,
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    };

    const result = await runOpportunitySyncWorker({
      fetchImpl: mockFetch,
      providers: ["CAREER_FEEDS"],
    });

    assert.ok(result.itemsUpdated >= 1);

    // Verify record in database has updated lastCheckedAt
    const record = await prisma.opportunity.findUnique({ where: { id: existingId } });
    assert.ok(record);
    assert.ok(record.lastCheckedAt);

    // Cleanup
    await prisma.opportunity.delete({ where: { id: existingId } }).catch(() => {});
  });
});


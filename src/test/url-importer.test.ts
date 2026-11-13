import test, { describe } from "node:test";
import assert from "node:assert";
import { importJobFromUrl } from "../lib/url-importer";

describe("Direct Job URL Import Engine", () => {
  // Scenario 1: Blocks SSRF and private networks
  test("Blocks malicious SSRF, loopback, and cloud metadata URLs", async () => {
    const localhostResult = await importJobFromUrl("http://localhost:8080/admin/job");
    assert.strictEqual(localhostResult.success, false);
    assert.match(localhostResult.error || "", /localhost/i);

    const metadataResult = await importJobFromUrl("http://169.254.169.254/latest/meta-data/");
    assert.strictEqual(metadataResult.success, false);
    assert.match(metadataResult.error || "", /metadata/i);

    const privateIpResult = await importJobFromUrl("http://192.168.1.100:3000/jobs/1");
    assert.strictEqual(privateIpResult.success, false);
    assert.match(privateIpResult.error || "", /private/i);
  });

  // Scenario 2: Greenhouse API parsing
  test("Extracts job posting from Greenhouse URL via structured API payload", async () => {
    const mockFetch: typeof fetch = async (input: RequestInfo | URL) => {
      const urlStr = String(input);
      if (urlStr.includes("boards-api.greenhouse.io")) {
        return new Response(
          JSON.stringify({
            id: 456789,
            title: "Machine Learning Research Engineer",
            content: "<p>We are seeking an ML engineer experienced in PyTorch and Distributed Training.</p>",
            location: { name: "San Francisco, CA" },
            updated_at: "2026-04-10T12:00:00Z",
            absolute_url: "https://boards.greenhouse.io/anthropic/jobs/456789",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response("Not found", { status: 404 });
    };

    const res = await importJobFromUrl(
      "https://boards.greenhouse.io/anthropic/jobs/456789",
      mockFetch
    );

    assert.strictEqual(res.success, true);
    assert.ok(res.opportunity);
    assert.strictEqual(res.opportunity.title, "Machine Learning Research Engineer");
    assert.strictEqual(res.opportunity.organization, "Anthropic");
    assert.strictEqual(res.opportunity.location, "San Francisco, CA");
    assert.strictEqual(res.opportunity.verificationStatus, "VERIFIED_SOURCE");
    assert.ok(res.evaluation);
    assert.ok(typeof res.evaluation.overallScore === "number");
  });

  // Scenario 3: Lever API parsing
  test("Extracts job posting from Lever URL via structured API payload", async () => {
    const mockFetch: typeof fetch = async (input: RequestInfo | URL) => {
      const urlStr = String(input);
      if (urlStr.includes("api.lever.co")) {
        return new Response(
          JSON.stringify({
            id: "ab12-cd34",
            text: "Backend Systems Intern",
            descriptionPlain: "Build scalable microservices in Go, PostgreSQL, and Docker.",
            categories: {
              location: "Remote - US",
              commitment: "Internship",
              team: "Core Infrastructure",
            },
            hostedUrl: "https://jobs.lever.co/wandb/ab12-cd34",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
      return new Response("Not found", { status: 404 });
    };

    const res = await importJobFromUrl(
      "https://jobs.lever.co/wandb/ab12-cd34",
      mockFetch
    );

    assert.strictEqual(res.success, true);
    assert.ok(res.opportunity);
    assert.strictEqual(res.opportunity.title, "Backend Systems Intern");
    assert.strictEqual(res.opportunity.workMode, "Remote");
    assert.strictEqual(res.opportunity.category, "Internship");
  });

  // Scenario 4: JSON-LD JobPosting schema extraction
  test("Extracts structured Schema.org JobPosting from public career page HTML", async () => {
    const sampleHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Careers at Acme</title>
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "JobPosting",
          "title": "Full Stack Engineer Intern",
          "hiringOrganization": {
            "@type": "Organization",
            "name": "Stripe"
          },
          "jobLocation": {
            "@type": "Place",
            "address": {
              "addressLocality": "Seattle",
              "addressRegion": "WA",
              "addressCountry": "US"
            }
          },
          "description": "<p>Looking for interns with React, TypeScript, and SQL skills.</p>",
          "datePosted": "2026-03-01",
          "validThrough": "2026-06-30",
          "employmentType": "INTERN"
        }
        </script>
      </head>
      <body><h1>Careers</h1></body>
      </html>
    `;

    const mockFetch: typeof fetch = async () => {
      return new Response(sampleHtml, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    };

    const res = await importJobFromUrl(
      "https://stripe.com/jobs/listings/fs-intern-2026",
      mockFetch
    );

    assert.strictEqual(res.success, true);
    assert.ok(res.opportunity);
    assert.strictEqual(res.opportunity.title, "Full Stack Engineer Intern");
    assert.strictEqual(res.opportunity.organization, "Stripe");
    assert.strictEqual(res.opportunity.location, "Seattle, WA, US");
    assert.ok(res.opportunity.requiredSkills.includes("React") || res.opportunity.requiredSkills.includes("TypeScript"));
  });

  // Scenario 5: OpenGraph & HTML fallback
  test("Extracts job metadata from OpenGraph and HTML meta tags when JSON-LD is absent", async () => {
    const sampleHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta property="og:title" content="AI Research Scientist - DeepMind" />
        <meta property="og:description" content="Join our research team to investigate frontier reinforcement learning." />
        <meta property="og:site_name" content="Google DeepMind" />
        <title>AI Research Scientist - DeepMind</title>
      </head>
      <body>
        <main>
          <h1>AI Research Scientist</h1>
          <p>Key requirements: Python, JAX, PyTorch, Deep Learning.</p>
        </main>
      </body>
      </html>
    `;

    const mockFetch: typeof fetch = async () => {
      return new Response(sampleHtml, {
        status: 200,
        headers: { "Content-Type": "text/html" },
      });
    };

    const res = await importJobFromUrl(
      "https://deepmind.google/careers/ai-researcher",
      mockFetch
    );

    assert.strictEqual(res.success, true);
    assert.ok(res.opportunity);
    assert.strictEqual(res.opportunity.title, "AI Research Scientist");
    assert.ok(res.opportunity.organization.includes("DeepMind"));
  });
});

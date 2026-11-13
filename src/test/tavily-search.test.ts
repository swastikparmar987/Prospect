import test, { describe } from "node:test";
import assert from "node:assert";
import {
  TavilySearchProvider,
  isOpportunityListing,
  extractOrganization,
  extractOpportunityTitle,
  extractCompensation,
  extractDeadline,
  extractSkills,
} from "../lib/providers/tavily-provider";
import { parseSearchIntent } from "../lib/query-intent-parser";
import { evaluateOpportunity } from "../lib/scoring-engine";
import { deduplicateOpportunities } from "../lib/dedup";
import { normalizeRawOpportunity } from "../lib/normalizer";
import {
  Opportunity,
  RawOpportunity,
  SearchConfig,
  SearchQueryItem,
  UserProfile,
} from "../types";

const TEST_CONFIG: SearchConfig = {
  mode: "LIVE",
  maxRounds: 1,
  queriesPerRound: 1,
  resultsPerProvider: 10,
  providerConcurrency: 1,
  requestTimeoutMs: 5000,
  maxRetries: 1,
  cacheTtlSeconds: 0,
  minUniqueNewOpportunities: 1,
  minMarginalYield: 0.1,
  searchBudgetPerRun: 5,
  minEligibleToStopEarly: 3,
  enableLinkedInLocalPersonal: false,
  enableGeneralWebDiscovery: true,
};

const DUMMY_QUERY_ITEM: SearchQueryItem = {
  id: "q-test-1",
  query: "software engineering intern Bengaluru",
  strategy: "DIRECT_ROLE",
  roleTitles: ["software engineering intern"],
  skillCombinations: ["Python", "SQL"],
  projectKeywords: [],
  locationFilters: ["Bengaluru, India"],
  workModeFilters: [],
  experienceLevelTerms: ["Intern"],
  companyTargets: [],
  targetProviders: ["tavily"],
  exclusionTerms: [],
  rationale: "Unit test query",
  expectedCategory: "Internship",
  priority: 1,
  maxResults: 10,
};

describe("Tavily Search Engine & Real-Time Discovery", () => {
  const originalKey = process.env.TAVILY_API_KEY;

  test("1. Successfully executes Tavily search and extracts structured opportunity data", async () => {
    process.env.TAVILY_API_KEY = "mock-valid-tavily-key";

    const mockApiResponse = {
      results: [
        {
          url: "https://myinternships.in/groww-software-engineering-intern-bengaluru",
          title: "Groww Software Engineering Intern Hiring Freshers 2026",
          content:
            "Company Name: Groww\nRole: Software Engineering Intern\nEligible Batch: 2025/2026/2027 Graduating Students\nStipend: Rs 50,000 per month\nJob Location: Bengaluru, Karnataka\nEmployment Type: Internship\nSkills: Python, SQL, REST APIs. Apply by Dec 31, 2025.",
          score: 0.94,
        },
      ],
    };

    const mockFetch: typeof fetch = async (url, init) => {
      assert.strictEqual(url, "https://api.tavily.com/search");
      assert.strictEqual(init?.method, "POST");
      const headers = init?.headers as Record<string, string>;
      assert.ok(headers.Authorization.includes("Bearer mock-valid-tavily-key"));

      return new Response(JSON.stringify(mockApiResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const provider = new TavilySearchProvider();
    const result = await provider.search({
      queryItem: DUMMY_QUERY_ITEM,
      roundNumber: 1,
      limit: 10,
      config: TEST_CONFIG,
      fetchImpl: mockFetch,
    });

    assert.strictEqual(result.status, "SUCCESS");
    assert.strictEqual(result.opportunities.length, 1);

    const opp = result.opportunities[0];
    assert.strictEqual(opp.organization, "Groww");
    assert.ok(opp.title.includes("Software Engineering Intern"));
    assert.strictEqual(opp.category, "Internship");
    assert.strictEqual(opp.location, "Bengaluru, India");
    assert.ok(opp.compensation?.includes("50,000"));
    assert.ok(opp.requiredSkills?.includes("Python"));
    assert.ok(opp.requiredSkills?.includes("SQL"));
    assert.strictEqual(opp.isDemo, false);
    assert.ok(opp.sourceSnippet?.includes("Groww"));
  });

  test("2. Detects invalid API key (HTTP 401) and returns descriptive failure", async () => {
    process.env.TAVILY_API_KEY = "mock-invalid-key";

    const mockFetch: typeof fetch = async () => {
      return new Response(JSON.stringify({ detail: "Unauthorized - Invalid API key" }), {
        status: 401,
        statusText: "Unauthorized",
      });
    };

    const provider = new TavilySearchProvider();
    const result = await provider.search({
      queryItem: DUMMY_QUERY_ITEM,
      roundNumber: 1,
      limit: 10,
      config: TEST_CONFIG,
      fetchImpl: mockFetch,
    });

    assert.strictEqual(result.status, "FAILED");
    assert.strictEqual(result.opportunities.length, 0);
    assert.ok(result.warnings.some((w) => w.includes("401")));
  });

  test("3. Handles API quota exhaustion and rate limiting (HTTP 429) gracefully", async () => {
    process.env.TAVILY_API_KEY = "mock-valid-key";

    const mockFetch: typeof fetch = async () => {
      return new Response(JSON.stringify({ detail: "Rate limit exceeded" }), {
        status: 429,
        statusText: "Too Many Requests",
      });
    };

    const provider = new TavilySearchProvider();
    const result = await provider.search({
      queryItem: DUMMY_QUERY_ITEM,
      roundNumber: 1,
      limit: 10,
      config: TEST_CONFIG,
      fetchImpl: mockFetch,
    });

    assert.strictEqual(result.status, "RATE_LIMITED");
    assert.strictEqual(result.opportunities.length, 0);
    assert.ok(result.warnings.some((w) => w.includes("429")));
  });

  test("4. Handles empty search results without throwing exceptions", async () => {
    process.env.TAVILY_API_KEY = "mock-valid-key";

    const mockFetch: typeof fetch = async () => {
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    };

    const provider = new TavilySearchProvider();
    const result = await provider.search({
      queryItem: DUMMY_QUERY_ITEM,
      roundNumber: 1,
      limit: 10,
      config: TEST_CONFIG,
      fetchImpl: mockFetch,
    });

    assert.strictEqual(result.status, "SUCCESS");
    assert.strictEqual(result.opportunities.length, 0);
  });

  test("5. Handles network abort and timeout safely", async () => {
    process.env.TAVILY_API_KEY = "mock-valid-key";

    const mockFetch: typeof fetch = async () => {
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";
      throw abortError;
    };

    const provider = new TavilySearchProvider();
    const result = await provider.search({
      queryItem: DUMMY_QUERY_ITEM,
      roundNumber: 1,
      limit: 10,
      config: TEST_CONFIG,
      fetchImpl: mockFetch,
    });

    assert.strictEqual(result.status, "FAILED");
    assert.ok(result.warnings.some((w) => w.toLowerCase().includes("timed out") || w.toLowerCase().includes("aborted")));
  });

  test("6. Filters out irrelevant non-opportunity articles and tutorials", () => {
    const blogResult = {
      title: "How to get an internship in 2025: Complete Guide with Resume Tips",
      url: "https://medium.com/@dev/how-i-got-into-faang",
      content: "Here are my top 10 interview questions and resume tips for college students.",
    };
    assert.strictEqual(isOpportunityListing(blogResult), false);

    const genuineJobResult = {
      title: "Software Engineering Intern at Terralogic, Bengaluru",
      url: "https://terralogic.com/careers/internship",
      content: "Terralogic is hiring a 6-month software engineering intern in Bengaluru. Apply now.",
    };
    assert.strictEqual(isOpportunityListing(genuineJobResult), true);
  });

  test("7. Extracts explicit compensation without fabricating unmentioned stipends", () => {
    const textWithStipend = "The role pays Rs 50,000 per month with mentorship.";
    const stipend = extractCompensation(textWithStipend);
    assert.ok(stipend && stipend.includes("50,000"));

    const textWithoutStipend = "Work on exciting distributed systems with senior staff engineers.";
    const none = extractCompensation(textWithoutStipend);
    assert.strictEqual(none, undefined);
  });

  test("8. Preserves missing deadlines as null without inventing dates", () => {
    const textWithoutDeadline = "Rolling admissions. Start date immediate.";
    const result = extractDeadline(textWithoutDeadline);
    assert.strictEqual(result.deadline, null);
    assert.strictEqual(result.deadlineRaw, null);

    const textWithDeadline = "Last date to apply: 2025-12-31.";
    const parsed = extractDeadline(textWithDeadline);
    assert.ok(parsed.deadline?.includes("2025-12-31"));
  });

  test("9. Parses all 6 natural-language student search queries into structured intent", () => {
    // Query 1: Remote Python internships in India
    const q1 = parseSearchIntent("Remote Python internships for second-year students in India.");
    assert.strictEqual(q1.workMode, "Remote");
    assert.ok(q1.skills.includes("Python"));
    assert.strictEqual(q1.academicYear, "2nd Year");
    assert.strictEqual(q1.location, "India");

    // Query 2: AI/ML research internships
    const q2 = parseSearchIntent("AI/ML research internships for final-year CSE students.");
    assert.strictEqual(q2.category, "Research");
    assert.ok(q2.skills.includes("AI/ML") || q2.skills.includes("Machine Learning"));
    assert.strictEqual(q2.academicYear, "Final Year");

    // Query 3: Paid SWE in Bengaluru
    const q3 = parseSearchIntent("Paid software engineering internships in Bengaluru.");
    assert.strictEqual(q3.compensationPreference, "PAID_ONLY");
    assert.strictEqual(q3.location, "Bengaluru, India");

    // Query 4: International research fellowships
    const q4 = parseSearchIntent("International research fellowships for undergraduate students.");
    assert.strictEqual(q4.category, "Fellowship");
    assert.strictEqual(q4.academicYear, "Undergraduate");

    // Query 5: Data analyst with no experience
    const q5 = parseSearchIntent("Data analyst internships with no prior experience.");
    assert.strictEqual(q5.experienceLevel, "NO_EXPERIENCE");
    assert.strictEqual(q5.roleTitle, "Data Analyst Intern");

    // Query 6: Student hackathons this month
    const q6 = parseSearchIntent("Student hackathons accepting registrations this month.");
    assert.strictEqual(q6.category, "Hackathon");
    assert.strictEqual(q6.deadlineRequirement, "Active / Closing Soon");
  });

  test("10. Deduplicates opportunities across providers while merging provenance", () => {
    const fetchedAt = new Date().toISOString();
    const rawA: RawOpportunity = {
      provider: "tavily",
      title: "Software Engineering Intern",
      organization: "Google",
      description: "Live web posting from careers.google.com",
      location: "Bengaluru, India",
      workMode: "Hybrid",
      applicationUrl: "https://careers.google.com/jobs/results/123456?src=tavily",
      sourceName: "Tavily Web Search",
      sourceUrl: "https://careers.google.com/jobs/results/123456?src=tavily",
      fetchedAt,
      isDemo: false,
    };

    const rawB: RawOpportunity = {
      provider: "career_feeds",
      title: "Software Engineering Intern",
      organization: "Google",
      description: "Direct board posting",
      location: "Bengaluru, India",
      workMode: "Hybrid",
      applicationUrl: "https://careers.google.com/jobs/results/123456?utm_source=feed",
      sourceName: "Google Direct Board",
      sourceUrl: "https://careers.google.com/jobs/results/123456",
      fetchedAt,
      isDemo: false,
    };

    const normA = normalizeRawOpportunity(rawA, 0);
    const normB = normalizeRawOpportunity(rawB, 1);

    const deduped = deduplicateOpportunities([normA, normB]);
    assert.strictEqual(deduped.unique.length, 1);
    assert.strictEqual(deduped.duplicatesRemoved, 1);
    assert.ok(deduped.unique[0].multiSourceProvenance && deduped.unique[0].multiSourceProvenance.length >= 2);
  });

  test("11. Decision engine correctly scores Tavily opportunity and returns recommendation", () => {
    const studentProfile: UserProfile = {
      id: "candidate-chen",
      fullName: "Alex Chen",
      email: "alex@college.edu",
      headline: "CS Student",
      university: "College",
      degree: "B.Tech",
      major: "Computer Science",
      graduationYear: 2026,
      graduationMonth: "June",
      gpa: 8.6,
      location: "Bengaluru, India",
      targetRoles: ["Software Engineering Intern"],
      preferredWorkModes: ["Hybrid", "On-site"],
      preferredLocations: ["Bengaluru, India"],
      skills: ["Python", "SQL", "Data Structures", "Git"],
      experiences: [],
      projects: [],
      portfolioLinks: [],
      availability: "Summer 2025",
      stipendPreference: "Paid Only",
      constraints: "",
      factProvenance: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const opp: Opportunity = {
      id: "opp-tavily-groww",
      title: "Software Engineering Intern",
      organization: "Groww",
      category: "Internship",
      description: "Develop high-scale backend services in Python and SQL.",
      location: "Bengaluru, India",
      workMode: "Hybrid",
      compensation: "₹50,000 / month",
      eligibilityRequirements: ["Open to 2026 Graduating Students"],
      requiredSkills: ["Python", "SQL"],
      preferredSkills: ["Git"],
      deadline: new Date(Date.now() + 86400000 * 20).toISOString(),
      applyUrl: "https://groww.in/careers/swe-intern",
      sourceName: "Tavily Real-Time Web Index",
      sourceUrl: "https://groww.in/careers/swe-intern",
      sourceConfidence: 0.95,
      verificationStatus: "VERIFIED_SOURCE",
      sourceEvidence: [],
      discoveredAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      isDemo: false,
    };

    const evaluation = evaluateOpportunity(opp, studentProfile);
    assert.ok(evaluation.overallScore >= 75);
    assert.strictEqual(evaluation.recommendation, "APPLY_NOW");
    assert.strictEqual(evaluation.hardBlockers.length, 0);
  });

  // Restore env
  process.env.TAVILY_API_KEY = originalKey;
});

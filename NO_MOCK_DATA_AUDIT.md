# PROSPECT: PERMANENT NO-MOCK-DATA POLICY AUDIT (`NO_MOCK_DATA_AUDIT.md`)

**Audit Date:** November 10, 2026  
**Status:** Enforced & Verified across Backend, Frontend, Database, and Automated Test Suite

---

## 1. Executive Summary

Prospect enforces a permanent project-wide **No-Mock-Data Policy** across all `LIVE` user journeys, API routes, search orchestration, AI intelligence pipelines, frontend views, and the production database (`prisma/dev.db`):

1. **`LIVE` Is the Default Mode Everywhere:** `DEFAULT_SEARCH_CONFIG.mode` and `resolveSearchConfig()` in [`src/lib/search-config.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/lib/search-config.ts) default to `"LIVE"`. `LIVE` mode **never** falls back to `DEMO` fixtures under any condition.
2. **Strict Runtime & Database Isolation of `DEMO` Fixtures:**
   - `DEMO` mode opportunities (`getDemoOpportunities()`) are served **in-memory only** when `?mode=DEMO` or `body.mode === "DEMO"` is explicitly requested.
   - `runOpportunityDiscoveryAgent()` in [`src/lib/agent/orchestrator.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/lib/agent/orchestrator.ts) never writes `DEMO` mode or `isDemo: true` opportunities, evaluations, or preparation plans into SQLite.
   - `POST /api/tracker`, `POST /api/feedback`, and `POST /api/preparation-plans` reject any `isDemo: true` / `DEMO_DATA` / `demo-*` opportunity with **HTTP 422**.
3. **Honest Empty States Over Fabricated Data:**
   - When no `LIVE` opportunities match or all providers fail, the API and UI return and display the exact message:
     > `"No verified opportunities found from the currently available sources."`
4. **No Fake Candidate Profiles, Fake AI, or Simulated Timers:**
   - Removed all hardcoded fallback candidate profiles (`"Alex Chen"`, fake `3.7` / `8.6` GPA, fake `ResNet50` project, and fallback `["Python", "TypeScript"]` skills) when no profile is configured.
   - Removed fake `setInterval` stage progression timers in [`src/components/onboarding/AgentExecutionExperience.tsx`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/components/onboarding/AgentExecutionExperience.tsx).
5. **Production vs. Test Database Separation:**
   - [`src/lib/db.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/lib/db.ts) routes automated tests (`NODE_ENV === "test"` / `VITEST`) to `file:./test.db` (`TEST_DATABASE_URL`) while production/development uses `file:./dev.db` (`DATABASE_URL`).
   - All 41 historical `isDemo: true` / synthetic seed opportunities, 92 `DEMO` agent runs, and 18 test candidate profiles were purged from `prisma/dev.db`.

---

## 2. Files Audited & Mock Data Removed from Production Paths

| File | Mock / Hardcoded Usage Identified | Remediation Applied |
| :--- | :--- | :--- |
| [`src/lib/search-config.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/lib/search-config.ts) | `DEFAULT_SEARCH_CONFIG.mode` was `"DEMO"` and `resolveSearchConfig()` defaulted to `"DEMO"` when `TAVILY_API_KEY` was unset. | Changed default `mode` to `"LIVE"`. Added `isDemoOrFixtureRecord()` and `assertNoDemoDataInLiveMode()` runtime guards. |
| [`src/lib/providers/provider-registry.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/lib/providers/provider-registry.ts) | Registered both live and demo providers without blocking direct `demo_*` execution in `LIVE` mode. | `getActiveProviders()` excludes all `demo_*` providers in `LIVE` mode. `executeProviderWithGuards()` rejects any `demo_*` provider in `LIVE` mode and strips any `isDemoOrFixtureRecord()` item from `LIVE` provider responses. |
| [`src/lib/agent/adaptive-search-loop.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/lib/agent/adaptive-search-loop.ts) | Filtered only `!opp.isDemo` without checking `verificationStatus === "DEMO_DATA"` or `demo-*` IDs. | Enforced `isDemoOrFixtureRecord()` filtering per round and `assertNoDemoDataInLiveMode()` before returning results. |
| [`src/lib/agent/orchestrator.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/lib/agent/orchestrator.ts) | Constructed a fake fallback profile (`gpa: 3.7`, `location: "San Francisco, CA"`, `skills: ["Python", "PyTorch", ...]`, fake `ResNet50` project) when no profile existed; persisted `DEMO` opportunities to SQLite. | Replaced fallback with an honest empty unconfigured profile (`skills: []`, `projects: []`, `gpa: null`). Blocked `DEMO` and `isDemoOrFixtureRecord()` records from being written to `prisma.opportunity`, `prisma.evaluation`, and `prisma.preparationPlan`. |
| [`src/app/api/opportunities/route.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/app/api/opportunities/route.ts) | `GET` returned mixed `DEMO` + `LIVE` DB rows when `mode` was omitted; `personalizationSummary` claimed personalized matching even without a profile. | Defaulted `GET` and `POST` to `LIVE` mode. Served `DEMO` mode exclusively from in-memory `getDemoOpportunities()`. Added `EMPTY_LIVE_OPPORTUNITIES_MESSAGE` (`"No verified opportunities found from the currently available sources."`) when `LIVE` returns 0 items. |
| [`src/app/api/search/intelligence/route.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/app/api/search/intelligence/route.ts) | `POST` defaulted `mode` to `"DEMO"` when `body.mode` was omitted. | Defaulted `POST` `mode` to `"LIVE"` unless `body.mode === "DEMO"`. |
| [`src/app/api/ai/intelligence/route.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/app/api/ai/intelligence/route.ts) | Invented fallback `skills: ["Python", "TypeScript"]` and `graduationYear: 2027` when no profile was loaded. | Replaced with honest empty profile (`skills: []`, `graduationYear: null`) and added `profileConfigured` boolean flag. Defaulted `mode` to `"LIVE"`. |
| [`src/app/api/tracker/route.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/app/api/tracker/route.ts) | Allowed saving `demo-*` or `isDemo: true` opportunities to the application tracker. | `POST /api/tracker` rejects `demo-*` and `isDemoOrFixtureRecord(opp)` with **HTTP 422**. `GET /api/tracker` filters out any demo records. |
| [`src/lib/feedback-engine.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/lib/feedback-engine.ts) & [`src/app/api/feedback/route.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/app/api/feedback/route.ts) | Allowed recording user feedback signals against demo opportunities. | `recordUserFeedbackSignal()` throws `NO_MOCK_DATA_POLICY_VIOLATION` and `POST /api/feedback` returns **HTTP 422** for demo opportunities. |
| [`src/app/api/preparation-plans/route.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/app/api/preparation-plans/route.ts) | Allowed creating preparation plans for demo opportunities in production tables. | `POST /api/preparation-plans` rejects `demo-*` and `isDemoOrFixtureRecord(opp)` with **HTTP 422**. `GET` filters out any demo records. |
| [`src/lib/adapters/search-adapter.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/lib/adapters/search-adapter.ts) & [`src/app/api/status/route.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/app/api/status/route.ts) | `getSearchAdapter()` returned `DemoSearchAdapter` whenever `TAVILY_API_KEY` was unset. | Added `LivePublicFeedsSearchAdapter` (backed by live Greenhouse/Lever/Ashby and FreeHire feeds) so `getSearchAdapter("LIVE")` never returns `DemoSearchAdapter`. Updated `/api/status` to report real provider states and non-demo DB counts. |
| [`src/components/AddApplicationModal.tsx`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/components/AddApplicationModal.tsx) | Custom application creator hardcoded `customCompensation = "$45/hour"`, `requiredSkills: ["Engineering", "Communication"]`, fake URL `https://${org}.com/careers`, `verificationStatus: "VERIFIED_SOURCE"`, and `isDemo: true`. | Replaced with honest user-provided fields (`compensation: "Unlisted"`, `requiredSkills: []`, `verificationStatus: "UNVERIFIED_LINK"`, `isDemo: false`). |
| [`src/components/onboarding/AgentExecutionExperience.tsx`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/components/onboarding/AgentExecutionExperience.tsx) | Used a fake `setInterval(..., 600)` timer to animate stage completion. | Removed fake timer; stage statuses now derive strictly from real `steps` prop and `isCompleted` / `error` state. |
| [`src/components/views/DiscoverView.tsx`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/components/views/DiscoverView.tsx) | Generic empty state text; claimed personalized matching even when candidate had 0 skills. | Displays `"No verified opportunities found from the currently available sources."` when `LIVE` mode returns 0 results, and honestly prompts to upload a resume when 0 skills are configured. |
| [`src/components/views/ProfileView.tsx`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/components/views/ProfileView.tsx) | Initialized `formData` to a hardcoded `"Alex Chen"` profile (`Indian Institute of Science`, `8.6` CGPA, fake internships/projects, `"Updated: Apr 10, 2025"`, `"Transcripts.pdf"`). | Removed all hardcoded `"Alex Chen"` profile data, fallback counts, and fake document rows. Displays real profile fields and honest `"Not configured"` states when empty. |
| [`src/components/views/PreparationPlansView.tsx`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/components/views/PreparationPlansView.tsx) | Hardcoded `skillGaps` (`SQL`, `Python`, `Data Analysis`), hardcoded `upcomingTasks` (`Apr 18`, `Apr 20`, `Apr 22`), and `activeEval?.overallScore || 86`. | Derived `skillGaps` and `upcomingTasks` dynamically from `activeEval.skillGapAnalysis` and `activePlan.items`. Replaced `|| 86` with `?? 0`. |
| [`src/components/views/TrackerView.tsx`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/components/views/TrackerView.tsx) | Fallback stipend `"$8K - $10K"` and fallback skills `["Research", "AI/ML", "Python", "LLM", "Safety"]` / `["Engineering", "Remote"]`. | Replaced with `"Unlisted"` and `[]`. |
| [`src/components/AiIntelligencePanel.tsx`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/components/AiIntelligencePanel.tsx) | Fallback skills `["Python", "TypeScript", "Machine Learning"]` when `userProfile.skills` was empty. | Replaced with an honest empty-state message when 0 skills are present. |
| [`src/components/ConnectedSourcesModal.tsx`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/components/ConnectedSourcesModal.tsx) | Hardcoded `Tavily Web Search` badge as `"Connected"` even when `TAVILY_API_KEY` was not configured. | Queries `/api/status` on open and displays `"Live API Active"` if configured or `"API Key Not Configured"` if unset. |
| [`src/lib/seed.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/lib/seed.ts) & [`scripts/seed-live-tracker.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/scripts/seed-live-tracker.ts) | Seeded `"Alex Chen"`, `getDemoOpportunities()`, and synthetic tracker applications into SQLite. | Guarded both scripts with `NO_MOCK_DATA_POLICY_VIOLATION` so they cannot run against production or without `PROSPECT_ALLOW_DEMO_SEED=true`. |

---

## 3. Fixtures Remaining Exclusively for `DEMO` Mode or Automated Tests

The following files contain labeled synthetic fixtures (`isDemo: true`, `verificationStatus: "DEMO_DATA"`) and are strictly isolated from `LIVE` mode and the production database:

1. [`src/lib/demo-dataset.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/lib/demo-dataset.ts): Used exclusively when `mode === "DEMO"` is explicitly requested in-memory or in unit tests.
2. [`src/lib/providers/demo-providers.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/lib/providers/demo-providers.ts): Registered with IDs `demo_career_feeds` and `demo_freehire`. Strictly disabled (`isEnabled(config)` returns `false`) and blocked by `executeProviderWithGuards()` whenever `config.mode === "LIVE"`.
3. [`src/test/`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/test): Unit and integration test suites executed against `file:./test.db`.

---

## 4. How `LIVE` Isolation Is Enforced

1. **Configuration Layer ([`src/lib/search-config.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/lib/search-config.ts)):**
   - `DEFAULT_SEARCH_CONFIG.mode = "LIVE"`.
   - `isDemoOrFixtureRecord(record)` checks `isDemo === true`, `verificationStatus === "DEMO_DATA"`, `id.startsWith("demo-")`, `id.startsWith("opp-demo_")`, and `providerId?.startsWith("demo_")`.
   - `assertNoDemoDataInLiveMode(mode, records)` throws `NO_MOCK_DATA_POLICY_VIOLATION` if any fixture is detected in `LIVE` mode.
2. **Provider Registry Layer ([`src/lib/providers/provider-registry.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/lib/providers/provider-registry.ts)):**
   - Excludes all `demo_*` providers in `LIVE` mode and strips any record matching `isDemoOrFixtureRecord()` from `LIVE` provider results.
3. **Orchestrator & Persistence Layer ([`src/lib/agent/orchestrator.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/lib/agent/orchestrator.ts)):**
   - Never writes opportunities, evaluations, or preparation plans to SQLite when `loopResult.mode !== "LIVE"` or `isDemoOrFixtureRecord(opp)` is true.
4. **API Route Guards ([`src/app/api/tracker/route.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/app/api/tracker/route.ts), [`src/app/api/feedback/route.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/app/api/feedback/route.ts), [`src/app/api/preparation-plans/route.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/app/api/preparation-plans/route.ts)):**
   - Reject demo opportunities with `HTTP 422` so demo fixtures can never enter user feedback, preparation plans, or application tracking.
5. **Database Separation ([`src/lib/db.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/lib/db.ts)):**
   - Automated tests automatically connect to `file:./test.db` so test fixtures never enter `prisma/dev.db`.

---

## 5. Automated Test & Build Verification Evidence

### A. Policy Enforcement Suite ([`src/test/no-mock-data-policy.test.ts`](file:///Users/pro/Desktop/projects/FRUITWISE/prospect/src/test/no-mock-data-policy.test.ts))
All **11/11** policy enforcement tests pass:
1. `defaults search configuration to LIVE mode and never silently falls back to DEMO`
2. `separates production and test database configurations`
3. `excludes all demo providers in LIVE mode and blocks demo provider execution in LIVE mode`
4. `strips any fixture record leaked by a misbehaving provider in LIVE mode and enforces assertNoDemoDataInLiveMode`
5. `never fabricates results or falls back to DEMO when all LIVE providers fail`
6. `getSearchAdapter never returns DemoSearchAdapter in LIVE mode`
7. `DEMO mode runs are strictly isolated and never insert demo opportunities into SQLite`
8. `blocks demo fixture opportunities from entering Application Tracker, User Feedback, and Preparation Plans`
9. `GET /api/opportunities in LIVE mode never returns demo fixtures and returns the exact honest empty message when no matches exist`
10. `GET /api/ai/intelligence does not invent candidate skills when no profile exists for a user`
11. `GET /api/tracker never returns demo records`

### B. Full Repository Test Suite (`npm test`) & Production Build (`npm run build`)
- **`npm run build`**: Completed with exit code `0` (`✓ Linting and checking validity of types`, `✓ Generating static pages (22/22)`).
- **`npm test`**: Executed all **17 test suites** (**226/226 tests passing**, `0` failures).
- **Post-Test Production Database Audit (`prisma/dev.db`)**:
  - `demoOpps`: `0`
  - `demoRuns`: `0`
  - `totalOpps`: `113` (100% verified live opportunities)
  - `profiles`: `1` (`SWASTIK PARMAR`, `userId: "default"`) — zero test profiles leaked into `prisma/dev.db`.


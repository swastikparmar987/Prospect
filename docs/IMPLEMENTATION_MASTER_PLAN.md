# PROSPECT — Implementation Master Plan

**Product:** Prospect — Career Opportunity Discovery Agent  
**Positioning:** "Understand your strengths. Discover your direction."  
**Architecture:** Next.js 15 App Router, React 19, TypeScript, Tailwind CSS, Prisma, Zod, Groq (Primary LLM), Tavily (Primary Search), Multi-Source ATS & Institutional Feeds, Durable Background Task Engine.

---

## 1. Executive Overview & Mission
Prospect is an evidence-grounded career intelligence and opportunity discovery platform for students and early-career researchers. Rather than relying on naive keyword matching or fabricating qualifications, Prospect builds a verifiable capability graph from candidate-demonstrated projects, education, and skills. It guides students through Career Outlook directions, dynamically plans multi-source searches, verifies opportunities at the source with SSRF/injection protections, strictly enforces hard eligibility blockers, and provides concrete deliverable-based preparation plans.

---

## 2. Core Execution Phases

### Phase 0 — Baseline & Repository Audit
- Audit working tree, dependencies, git state, and environment configuration.
- Establish verified baseline: 100/100 tests passing, clean `next build`.
- Verify live provider keys: `GROQ_API_KEY` (`qwen/qwen3.8-27b`) and `TAVILY_API_KEY` tested and active; `GEMINI_API_KEY` marked optional.
- Initialize persistent task ledger and execution logging.

### Phase 1 — Core Platform Foundation & Central AI Model Router
- Centralized `ModelRouter` in `src/lib/ai/model-router.ts`.
- Task-based routing: Fast extraction, Reasoning & evaluation, Studio materials generation, Deterministic calculations.
- Groq Cloud adapter with active `qwen/qwen3.8-27b` model, fallback to deterministic engine on network error/timeout/rate-limit.
- Safe structured output parsing using Zod schemas with bounded retries.
- Centralized environment configuration and security guards.

### Phase 2 — Candidate Intelligence & Provenance Engine
- Full fact provenance tracking (`RESUME_AI`, `RESUME_DETERMINISTIC`, `USER_INPUT`, `USER_OVERRIDE`, `CALCULATED`, `EXTERNAL_SOURCE`).
- Evidence strength taxonomy (`Strong evidence`, `Some evidence`, `Insufficient evidence`, `User-confirmed`).
- Skill taxonomy normalization and bidirectional alias expansion (JS -> JavaScript, ML -> Machine Learning, CV -> Computer Vision, etc.).
- Candidate capability graph linking skills to projects, coursework, and practical evidence.
- Support manual profile creation/editing with zero resume requirement.
- Preservation of user-confirmed facts against re-extraction overwrites.

### Phase 3 — Career Outlook & Direction Intelligence
- Direction generation engine yielding up to 3 evidence-grounded career pathways.
- Explicit mapping of candidate projects and verified skills to career directions.
- Gap identification without hallucinating unmentioned prerequisites.
- Full student control: add custom role, toggle selection, remove direction, persist to DB.
- Seamless UI discovery integration with view switcher (`All`, `By Career Direction`, `Career Brief`).

### Phase 4 & 5 — Multi-Source Search & Adaptive Planner
- Standardized provider abstraction: `SearchProvider` contract with health tracking, rate limiting, and timeout isolation.
- Active providers:
  - Tavily (Live Web Discovery)
  - Greenhouse, Lever, Ashby (Direct Company ATS integrations)
  - FreeHire (Public tech job index)
  - Institutional & Research Catalog (University research labs, Fellowships, DRDO/ISRO/AICTE programmes)
  - Demo Fixtures (Deterministic offline sandbox)
- Adaptive search planner: 3 bounded rounds (Exact roles -> Adjacent capabilities -> Research & Institutional).
- Query & employer diversity enforcement; preservation of hard candidate constraints across rounds.
- Search cache with TTL and fingerprint-based invalidation.

### Phase 6 — Opportunity Normalization, Deduplication & Verification
- Canonical URL normalization (query tracking stripping, scheme normalization).
- Multi-signal deduplication preserving multi-source provenance.
- Safe verification engine with strict SSRF defense (blocking private IPs, metadata services, non-HTTP schemes).
- Untrusted content isolation (Posting Guard neutralizing hidden prompt injection in job descriptions).
- Distinct lifecycle state management (Public Listing status vs Verification status vs Student Application stage).

### Phase 7 — Eligibility, Scoring & Explainable Recommendations
- Requirement checks: `MET`, `NOT_MET`, `UNKNOWN`, `NOT_APPLICABLE`.
- Hard blocker override system: graduation year mismatch, visa constraints, or closed/expired deadlines unconditionally force `SKIP`.
- Four distinct recommendation actions: `APPLY_NOW`, `PREPARE_FIRST`, `KEEP_WATCHING`, `SKIP`.
- Clear explainability rationale citing matched evidence and specific missing qualifications.
- Separation of compatibility score from verification confidence and selection probability.

### Phase 8 — Skill Bridge & Application Tracker
- Preparation Plan engine generating concrete deliverables, milestones, effort estimates, and acceptance criteria for `PREPARE_FIRST`.
- Preparation Studio: tailored cover letter drafts, resume bullet adaptations, interview checklists, and application answers grounded in real candidate facts.
- Application Tracker: user-controlled stages (`SAVED`, `PREPARING`, `READY_TO_APPLY`, `APPLIED`, `INTERVIEW`, `OFFER`, `REJECTED`, `WITHDRAWN`, `ARCHIVED`).
- Application event timeline and feedback learning loop.

### Phase 9 — Durable Background Execution Engine
- Durable task runner with task lifecycle states: `QUEUED`, `RUNNING`, `RETRY_SCHEDULED`, `COMPLETED`, `FAILED`, `CANCELLED`.
- Task leases, heartbeats, automatic stale recovery, retry with exponential backoff and jitter.
- Incremental checkpointing ensuring zero lost progress across worker restarts.
- Idempotency guards preventing duplicate opportunity insertion.

### Phase 10 — UI Integration & Botanical Polish
- Warm ivory (`#F8F6EF`), deep forest green (`#204A3A`), muted sage (`#DDE6D7`), and butter yellow (`#F6D887`) design tokens.
- Permanent left sidebar with responsive drawer on mobile.
- Discover page with view switchers and real-time execution indicators.
- Opportunity detail modal with eligibility breakdown, verification proof, and preparation triggers.
- Profile editing view with fact provenance badges.

### Phase 11 — Comprehensive Testing & Validation
- Unit tests covering all algorithms, normalization, and scoring logic.
- Provider contract tests with real payloads and fault fixtures.
- Integration tests for profile persistence, search orchestration, and worker recovery.
- End-to-end journey tests for Journeys A through E.
- Security and SSRF validation tests.
- Evaluation test suite using 5 diverse candidate personas.

### Phase 12 — Production Readiness & Deployment Verification
- PostgreSQL configuration and migration script readiness.
- Multi-user authentication & data isolation design.
- Complete documentation and final master handoff report.

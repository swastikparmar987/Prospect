# PROSPECT — Known Limitations & Operational Considerations

This document transparently records technical boundaries, operational limits, credential requirements, and verified infrastructure states for Prospect.

---

## 1. External Credentials & Provider Reality

### 1.1 Large Language Models
- **Groq Cloud (Primary):** Configured and operational (`GROQ_API_KEY` present, model: `qwen/qwen3.8-27b`).
- **Google Gemini (Optional):** Optional alternative provider. Centralized model router gracefully uses Groq or deterministic algorithmic fallbacks with zero crash risk.

### 1.2 Web Search API Quotas (Tavily)
- **Status:** Configured and validated live.
- **Budget Enforcement:** Enforces per-run query budgets (max 3 adaptive rounds, max 12 queries per session) to prevent quota depletion.
- **Production Note:** High-throughput enterprise deployments should configure distributed Redis caching to minimize redundant queries.

### 1.3 ATS Feeds & Institutional Catalogs (Audited in `docs/PROVIDER_AUDIT.md`)
- **Direct ATS (Greenhouse, Lever, Ashby):** Ingests public job listings via official unauthenticated REST APIs per employer board slug. Lever slug `wandb` returns HTTP 404 because Weights & Biases migrated off Lever; active endpoints for Greenhouse (`stripe`, `scaleai`) and Ashby (`linear`) are verified.
- **Institutional & Research Feeds:** Institutional discovery queries are scoped by trusted academic domains (`.edu`, `reus.org`) via live search; offline demo mode uses curated deterministic fixtures.
- **Curated Catalog:** `source_catalog.ts` provides domain and ATS metadata for 25+ trusted organizations; it is a catalog of curated platforms, not 25 individual live scraping microservices.

---

## 2. Multi-User Authentication & Data Isolation

### 2.1 Session Architecture & Impersonation Prevention
- **Cryptographic Tokens:** HMAC-SHA256 session token management with constant-time signature verification (`crypto.timingSafeEqual`) to prevent timing attacks.
- **Impersonation Prevention:** Unauthenticated callers cannot supply arbitrary `userId` to `/api/auth/session` to mint sessions. Claiming a specific `userId` requires the administrative secret key `AUTH_EXCHANGE_SECRET`. Public self-registration mints random, unguessable identifiers (`usr_${uuid}`).
- **Persistent Token Revocation:** Revoked session token IDs are saved to durable storage on disk (`.data/revoked_tokens.json`) with periodic pruning of expired entries. Revocation survives server restarts and multi-process worker reloads.
- **Data Scoping:** All database entities (`UserProfile`, `Application`, `PreparationPlan`, `UserFeedback`, `AgentRun`, `DurableTask`) have indexed `userId` columns. API routes strictly filter by the authenticated user's ID.
- **Local Dev Fallback:** In non-production environments with no session header/cookie provided, defaults to `userId: "default"` to preserve single-user local development matching existing data.
- **Production OAuth:** For Google or GitHub SSO in production, standard OAuth2 client credentials (`AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`) should be connected to exchange tokens for Prospect signed sessions.

---

## 3. Database Infrastructure & PostgreSQL Runtime Client

### 3.1 PostgreSQL Staging & Production
- **PostgreSQL 15 Staging Container:** Configured and running (`prospect-staging-pg` on `localhost:5433`).
- **Dynamic Runtime Client Selection (`src/lib/db.ts`):** Automatically selects `@prisma/client-postgresql` when `DATABASE_URL` starts with `postgresql://` or `postgres://`, and `@prisma/client` when set to `file:./dev.db`.
- **Verified CRUD & API Execution:** Fully exercised and passing 15/15 tests across `postgresql-crud.test.ts` and `postgres-runtime-api.test.ts` covering all core entities and Next.js route handlers.
- **Schema Alignment:** `prisma/schema.prisma` (SQLite) and `prisma/schema.postgresql.prisma` (PostgreSQL) share identical relational models, indexes, and field constraints.

---

## 4. Seniority Classification & Opportunity Relevance

### 4.1 Multi-Factor Seniority Analysis
- **Classification Engine:** Analyzes job titles, required years of experience (`\b([4-9]|1[0-9])\+?\s*years?\b`), and management/leadership clauses ("manage a team of", "budget ownership", "hire and mentor engineers").
- **Seniority Categories:** `STUDENT`, `INTERN`, `EARLY_CAREER`, `NEW_GRAD`, `MID_LEVEL`, `SENIOR`, `STAFF`, `PRINCIPAL`, `MANAGER`, `DIRECTOR`, `UNKNOWN`.
- **Student Hard Blocker:** When candidate is identified as a student or early-career candidate (`experienceLevel: 'Internship / Early-Career'` or graduating class), any opportunity classified as `MANAGER`, `DIRECTOR`, `STAFF`, `PRINCIPAL`, or `SENIOR` triggers a non-negotiable Hard Blocker (`eligibilityScore = 0`, `overallScore <= 35`, recommendation = `SKIP`). High skill match cannot override this blocker.

---

## 5. Search Diversity & Employer Concentration

### 5.1 Dominant Employer Caps
- **Constraint:** In the top 10 search results (`sortBy = "fit"` or `sortBy = "action"`), no single employer can occupy more than 3 positions unless high-quality alternatives are exhausted.
- **Re-ranking Algorithm:** Excess opportunities from saturated employers are deferred behind relevant opportunities from other organizations.
- **Observability:** `diversityMetrics` in `/api/opportunities` tracks top-10 employer distribution, top employer percentage share, and source variety.

---

## 6. Background Worker Durability & Concurrency

### 6.1 Multi-Process Durability
- **Worker Queue:** Backed by persistent database table (`DurableTask`), eliminating lost in-memory state.
- **Lease Concurrency:** Uses transactional task claims (`claimNextTask`), worker ownership leases (`leaseOwner`, `leaseExpiresAt`), and stale lease recovery (`recoverStaleTasks`).
- **Heartbeats & Checkpoints:** Periodic heartbeats record sub-step progress into `checkpointJson`, allowing a restarted worker to resume execution without repeating completed side effects.
- **Tested Across OS Processes:** 3/3 tests pass in `multi-process-worker-recovery.test.ts` where a separate child process is killed with `SIGKILL` and a fresh process recovers expired leases and resumes from step checkpoints.

---

## 7. Candidate Intelligence & Scanned Documents

### 7.1 Scanned / Low-Text Documents
- **Detection:** Flags low-text or scanned PDF conditions and marks extraction confidence accordingly.
- **Fallback:** When OCR is unavailable, prompts the candidate to verify and confirm their academic facts, projects, and skills in the Profile Confirmation view.
- **Provenance Immutability:** User-confirmed edits are stored with provenance `USER_OVERRIDE` or `USER_INPUT` and are never overwritten by automated parsings.

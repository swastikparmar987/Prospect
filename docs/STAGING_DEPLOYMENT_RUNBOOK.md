# PROSPECT — Staging Deployment Runbook

This runbook provides the step-by-step procedures, environment variable configurations, deployment commands, and health verification steps for deploying Prospect to a staging environment backed by PostgreSQL.

---

## 1. System Architecture Overview

```
                                 ┌───────────────────────────────────────────────┐
                                 │              Prospect Web App                 │
                                 │          Next.js 15.1 App Router              │
                                 │   (Tailwind CSS, Plus Jakarta / Playfair)     │
                                 └──────────────────────┬────────────────────────┘
                                                        │
                      ┌─────────────────────────────────┼─────────────────────────────────┐
                      │                                 │                                 │
                      ▼                                 ▼                                 ▼
           ┌──────────────────────┐          ┌──────────────────────┐          ┌──────────────────────┐
           │   Authentication     │          │   Candidate Agent    │          │    Durable Worker    │
           │  HMAC-SHA256 Token   │          │  ModelRouter (Groq)  │          │   PostgreSQL Queue   │
           │  HttpOnly Cookies    │          │  Tavily + Direct ATS │          │   Leases & Retries   │
           └──────────────────────┘          └──────────────────────┘          └──────────────────────┘
                      │                                 │                                 │
                      └─────────────────────────────────┼─────────────────────────────────┘
                                                        │
                                                        ▼
                                         ┌──────────────────────────────┐
                                         │     PostgreSQL Database      │
                                         │     (v15+ with Prisma ORM)   │
                                         └──────────────────────────────┘
```

---

## 2. Infrastructure Prerequisites

| Component | Minimum Specification | Recommended Production/Staging |
| :--- | :--- | :--- |
| **Node.js** | `>= 20.10.0 LTS` | `Node.js 20.x LTS` or `22.x LTS` |
| **npm** | `>= 10.0.0` | `npm 10.x` |
| **Database** | PostgreSQL 15+ | AWS RDS PostgreSQL, Supabase, Neon, or Managed Docker |
| **Memory / CPU**| 1 vCPU, 1 GB RAM | 2 vCPU, 2-4 GB RAM |
| **Network** | Outbound HTTPS (443) | Access to `api.tavily.com`, `api.groq.com`, `boards-api.greenhouse.io` |
| **TLS/SSL** | HTTPS termination required | AWS ALB, Cloudflare, or Nginx with Let's Encrypt |

---

## 3. Required Environment Variables

Configure these variables in your staging secrets manager (e.g. AWS Secrets Manager, Doppler, or Doppler/Vercel Environment Variables). **Never commit credentials to version control.**

```bash
# -----------------------------------------------------------------------------
# DATABASE CONFIGURATION (PostgreSQL)
# -----------------------------------------------------------------------------
# Standard PostgreSQL connection URI format:
# postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>?schema=public&sslmode=prefer
DATABASE_URL="postgresql://prospect_admin:CHANGE_ME_IN_STAGING@pg-staging.internal:5432/prospect_staging?schema=public"

# -----------------------------------------------------------------------------
# AUTHENTICATION & SESSION MANAGEMENT
# -----------------------------------------------------------------------------
# High-entropy secret key for HMAC-SHA256 session token signatures (>= 32 characters)
# Generate with: openssl rand -base64 32
SESSION_SECRET="CHANGE_ME_HIGH_ENTROPY_SESSION_SECRET_AT_LEAST_32_CHARS"

# Secret token required for secure session exchange / identity delegation
AUTH_EXCHANGE_SECRET="CHANGE_ME_HIGH_ENTROPY_EXCHANGE_KEY_32_CHARS"

# Application public base URL (used for CORS and cookie domain scoping)
NEXT_PUBLIC_APP_URL="https://staging.prospect.ai"
NODE_ENV="production"

# -----------------------------------------------------------------------------
# AI ENGINE & MODEL ROUTING (Groq Primary)
# -----------------------------------------------------------------------------
GROQ_API_KEY="gsk_live_staging_api_key_here"
GROQ_MODEL="qwen/qwen3.8-27b"

# Optional secondary provider (Deterministic fallback activates if absent)
GEMINI_API_KEY=""

# -----------------------------------------------------------------------------
# REAL-TIME SEARCH PROVIDERS
# -----------------------------------------------------------------------------
TAVILY_API_KEY="tvly-live_staging_api_key_here"

# -----------------------------------------------------------------------------
# DURABLE WORKER ENGINE
# -----------------------------------------------------------------------------
WORKER_LEASE_MS="60000"
WORKER_MAX_ATTEMPTS="3"
```

---

## 4. Staging Deployment Execution Steps

### Step 1: Clone Repository & Install Dependencies
```bash
git clone https://github.com/organization/prospect.git /var/www/prospect
cd /var/www/prospect
npm ci --omit=dev
```

### Step 2: Apply Database Schema to PostgreSQL
Run Prisma push or migration against the PostgreSQL staging cluster:
```bash
# Generate dedicated PostgreSQL Prisma Client
npx prisma generate --schema=prisma/schema.postgresql.prisma

# Deploy database schema changes
npx prisma db push --schema=prisma/schema.postgresql.prisma
```

### Step 3: Compile Production Next.js Application
```bash
npm run build
```

### Step 4: Start the Application Service
Deploy using process manager (PM2 or Systemd):
```bash
# Start with PM2
pm2 start npm --name "prospect-staging" -- start -- -p 3000

# Or run directly behind reverse proxy:
npm run start
```

### Step 5: Start Background Worker (Optional Independent Daemon)
```bash
pm2 start npx --name "prospect-worker" -- tsx scripts/worker-process.ts --action=worker-daemon
```

---

## 5. Staging Smoke Test & Verification Checklist

Execute these validation commands from the host or deployment pipeline to confirm staging readiness:

### 1. Health & Status Check
```bash
curl -s -f https://staging.prospect.ai/api/status | jq .
```
- **Expected Result:** HTTP 200, `"mode": "LIVE_MODE"`, `"status": "SUCCESS"`.

### 2. Session Issuance & Cookie Verification
```bash
curl -i -X POST https://staging.prospect.ai/api/auth/session \
  -H "Content-Type: application/json" \
  -d '{"userId": "staging_smoke_user", "email": "smoke@prospect.ai"}'
```
- **Expected Result:** HTTP 200, `Set-Cookie: prospect_session=...; Path=/; HttpOnly; SameSite=Lax`.

### 3. Live Search & Opportunity Pipeline Check
```bash
curl -s -f "https://staging.prospect.ai/api/opportunities?mode=LIVE&category=ALL" | jq '{count: (.opportunities | length)}'
```
- **Expected Result:** HTTP 200, returns active array of opportunities.

### 4. Logout & Revocation Test
```bash
curl -i -X POST https://staging.prospect.ai/api/auth/logout
```
- **Expected Result:** HTTP 200, `Set-Cookie: prospect_session=; ... Max-Age=0`.

---

## 6. Disaster Recovery & Rollback Procedure

1. **Application Rollback:** Revert commit hash and re-run `npm run build && pm2 reload prospect-staging`.
2. **Database Backup:** Ensure automated point-in-time recovery (PITR) is enabled on the PostgreSQL cluster with 7-day retention.
3. **Graceful Degrade:** If Groq or Tavily APIs experience upstream rate limits (HTTP 429), the application automatically engages circuit breakers and serves verified cached opportunities with algorithmic heuristics without throwing uncaught exceptions.

<div align="center">

<img src="./public/prospect-banner.jpg" alt="Prospect — Your AI Career Companion" width="100%" />

# Prospect — Career Opportunity Discovery Agent

**"Understand your strengths. Discover your direction."**

*An evidence-backed career opportunity discovery, decision intelligence, and preparation agent for college students, graduates, and aspiring researchers.*

[![Next.js](https://img.shields.io/badge/Next.js-15.1.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-WebGL_3D-049EF4?style=for-the-badge&logo=threedotjs&logoColor=white)](https://threejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.3-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15_Staging-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Tests Passing](https://img.shields.io/badge/Tests-208%20%2F%20208%20Passing-E0FB66?style=for-the-badge&labelColor=080808&color=163824)](./docs/PRODUCTION_READINESS.md)
[![License](https://img.shields.io/badge/License-MIT-FEF189?style=for-the-badge&labelColor=080808&color=080808)](./LICENSE)

---

### [🌐 Live Demo & 3D Tour](http://localhost:3000/landing) • [🚀 Launch Discovery App](http://localhost:3000/?tab=discover) • [📖 Architecture Audit](./docs/PRODUCTION_READINESS.md) • [⚡ Staging Runbook](./docs/STAGING_DEPLOYMENT_RUNBOOK.md)

</div>

---

## 📑 Table of Contents

- [The Dilemma: Why Conventional Job Search is Broken](#-the-dilemma-why-conventional-job-search-is-broken)
- [What Prospect Is](#-what-prospect-is)
- [Key Features](#-key-features)
  - [1. Career Outlook Experience](#1-career-outlook-experience)
  - [2. Explainable 4-Way Decision Intelligence](#2-explainable-4-way-decision-intelligence)
  - [3. Non-Negotiable System Guardrails](#3-non-negotiable-system-guardrails)
  - [4. Interactive 3D WebGL Career Galaxy & Landing Tour](#4-interactive-3d-webgl-career-galaxy--landing-tour)
  - [5. Gap-to-Action Preparation Studio](#5-gap-to-action-preparation-studio)
  - [6. Multi-Source Real-Time Ingestion Engine](#6-multi-source-real-time-ingestion-engine)
  - [7. Application Kanban Tracker](#7-application-kanban-tracker)
  - [8. Durable Autonomous Worker & Crash Recovery](#8-durable-autonomous-worker--crash-recovery)
  - [9. Multi-User Security & SSRF Defense](#9-multi-user-security--ssrf-defense)
  - [10. Dual-Engine Database Architecture (PostgreSQL + SQLite)](#10-dual-engine-database-architecture-postgresql--sqlite)
- [Interactive 3D Landing Page Showcase](#-interactive-3d-landing-page-showcase)
- [System Architecture](#-system-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation & Setup](#installation--setup)
  - [Environment Variables](#environment-variables)
- [Verification & Automated Test Suite (208 / 208 Tests)](#-verification--automated-test-suite-208--208-tests)
- [Production & Staging Deployment](#-production--staging-deployment)
- [Directory Structure](#-directory-structure)
- [License & Acknowledgments](#-license--acknowledgments)

---

## ⚡ The Dilemma: Why Conventional Job Search is Broken

Every recruiting cycle, college students and early-career candidates submit hundreds of blind applications into ATS black holes with a sub-2% response rate. Traditional platforms (LinkedIn, Indeed, Handshake) suffer from fatal structural flaws:

1. **Blind Keyword Spraying:** Opportunities are matched by superficial keyword frequency rather than proven technical capability, matching distributed database roles to candidates who merely wrote "database" in a course summary.
2. **Ghost Jobs & Stale Listings:** Up to 35% of listings on major boards are dead, already filled, or third-party clickbait pipelines.
3. **Mistagged Senior Roles:** Executive and senior roles requiring 6+ years of people management are frequently miscategorized by aggregators as "Entry Level", deceiving students into applying for positions they cannot legally or practically receive.
4. **Zero Actionability & Rejection Silence:** Students receive generic rejections with zero guidance on what specific skills or portfolio deliverables would have turned a rejection into an interview.

---

## 💡 What Prospect Is

**Prospect** is an evidence-first, autonomous career discovery and decision intelligence agent. Instead of parsing vague summaries or spraying applications, Prospect:

- **Extracts Verified Technical Truth:** Isolates direct demonstrated skills from real code repositories, coursework, and projects without inventing unlisted GPA or credentials.
- **Synthesizes a 3D Career Outlook:** Maps student strengths into 3 viable career directions before initiating search.
- **Renders Transparent 4-Way Verdicts:** Categorizes every posting into `APPLY NOW`, `PREPARE FIRST`, `KEEP WATCHING`, or `SKIP` with explicit citations.
- **Enforces Seniority Hard Blockers:** Automatically filters out Manager, Director, Staff, and Senior positions for students, regardless of high skill overlap.
- **Never Hallucinates Deadlines:** Preserves missing dates as `Rolling / Unknown` — zero fabricated dates.
- **Generates Grounded Preparation Roadmaps:** Bridges qualification gaps with estimated hours and verified resume bullets derived strictly from the candidate's authentic projects.

---

## 🚀 Key Features

### 1. Career Outlook Experience
Before initiating opportunity discovery, Prospect evaluates the candidate's verified profile facts and generates up to 3 strategic career pathways:
- **Direction Profile:** Identifies core role families (e.g., *ML Systems / AI Research*, *Distributed Systems / Backend*, *Full-Stack AI Application Engineering*).
- **Supporting Evidence:** Highlights demonstrated technical competencies and relevant student projects.
- **Prerequisite Gaps:** Explicitly catalogs missing tools or coursework required for top-tier competitiveness.
- **Evidence Strength Gauges:** Calibrates directions into `Strong Evidence`, `Moderate Evidence`, or `Exploratory Potential`.

---

### 2. Explainable 4-Way Decision Intelligence

Every indexed opportunity is evaluated against the candidate's background across five weighted dimensions:

$$\text{Fit Score} = 0.35 \times \text{Eligibility} + 0.30 \times \text{Skills} + 0.15 \times \text{Quality} + 0.10 \times \text{Preferences} + 0.10 \times \text{Deadline}$$

| Recommendation | Decision Criteria | Actionable Outcome |
| :--- | :--- | :--- |
| **`APPLY NOW`** | High skill fit ($\ge 75\%$), verified student eligibility, active verified application link, zero hard blockers. | Immediate application prioritized; portal link provided. |
| **`PREPARE FIRST`** | Promising potential ($55–74\%$), but candidate lacks 1–2 specific technical deliverables or portfolio artifacts. | Routed to Preparation Studio with concrete engineering milestones. |
| **`KEEP WATCHING`** | High quality opportunity, but missing live application URL, distant deadline ($>60$ days), or pending cohort confirmation. | Saved to pipeline for autonomous re-verification. |
| **`SKIP`** | Hard blocker triggered: graduation year mismatch, senior/managerial role, or insufficient domain foundation ($<40\%$). | Suppressed with explicit explanation to save candidate time. |

---

### 3. Non-Negotiable System Guardrails

```
                                  [ Incoming Job Posting ]
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             [ Student Candidate ]                       [ Senior Role Detected ]
                       │                           (Manager / Director / Staff / Principal)
                       │                                           │
                       ▼                                           ▼
          [ Eligibility Engine Check ]                   [ HARD BLOCKER TRIGGERED ]
                       │                                           │
         ┌─────────────┴─────────────┐                             ▼
         ▼                           ▼                    Eligibility Score = 0%
[ Grad Year Match ]        [ Active Portal Link ]         Overall Score ≤ 35%
         │                           │                    Verdict: FORCED "SKIP"
         ▼                           ▼                             │
[ Feasible Deadline ]       [ Diversity Cap: Max 3 ]               ▼
         │                           │                    [ Student Protected ]
         └─────────────┬─────────────┘
                       ▼
             [ 4-Way Verdict ]
      (APPLY NOW / PREPARE / WATCH)
```

1. **Seniority Hard Blocker:** A high skill match **never** overrides student seniority limits. Roles classified as `MANAGER`, `DIRECTOR`, `STAFF`, `PRINCIPAL`, or `SENIOR` (>3 yrs exp) automatically trigger `eligibility = 0%`, capping the score at 35 and enforcing `SKIP`.
2. **Zero-Hallucination Deadlines:** If a job description omits an explicit application closing date, it is preserved strictly as `Rolling / Unknown`. The LLM is strictly prohibited from guessing dates.
3. **Search Diversity Capping:** No single employer (e.g., Stripe, Amazon) can exceed **3 slots in the top 10 search results**, guaranteeing broad exposure.

---

### 4. Interactive 3D WebGL Career Galaxy & Landing Tour
Visit **[`http://localhost:3000/landing`](http://localhost:3000/landing)** to experience Prospect’s custom Three.js WebGL visual interface:
- **Interactive 3D Scene:** Faceted obsidian icosahedron with neon-lime wireframe aura, concentric orbital decision rings, and 600+ floating skill constellation particles.
- **Scroll-Bound Camera Physics:** Camera swoops dynamically through the career universe as the user scrolls down the landing page.
- **Embedded Interactive Simulator:** Visitors can test the decision engine live by toggling candidate seniority, adjusting skill match sliders, and watching the real-time hard blocker in action!

<div align="center">
  <img src="./public/landing-page-hero.png" alt="Prospect 3D Landing Page" width="90%" style="border-radius: 16px; border: 2px solid #080808; box-shadow: 6px 6px 0px #080808;" />
</div>

---

### 5. Gap-to-Action Preparation Studio
When an opportunity is marked `PREPARE FIRST`, Prospect converts candidate weaknesses into an achievable engineering action plan:
- **Milestone Breakdown:** Breaks missing skills into time-bounded projects with estimated completion hours (e.g., *"Implement Triton GPU Attention Kernel — ~6 hrs"*).
- **Grounded Resume Bullets:** Synthesizes bullet points derived strictly from the candidate's authentic code and coursework.
- **Interactive Progress Tracking:** Checkbox completion updates the opportunity readiness score in real time, upgrading opportunities from `PREPARE FIRST` to `APPLY NOW` upon completion.

---

### 6. Multi-Source Real-Time Ingestion Engine
Prospect crawls and normalizes opportunities across 11 discrete data providers:
- **Tavily Real-Time Search API:** Live discovery across student job postings and university research portals.
- **Company Career Boards:** Direct ATS feed integration for Greenhouse, Lever, Ashby, and Workable.
- **FreeHire & Open Boards:** Aggregated internship feeds with automatic deduplication.
- **Direct Job URL Importer:** Allows students to paste any job URL (Greenhouse, Lever, public career page) and extract structured opportunities with SSRF validation.

---

### 7. Application Kanban Tracker
Manage your recruitment journey with an interactive Kanban pipeline:
- **Stages:** `Saved` ➔ `Applied` ➔ `Interviewing` ➔ `Offer` ➔ `Archived`.
- **Relational History:** Every stage move records an `ApplicationEvent` in the database with timestamps and notes.
- **Upcoming Deadlines:** Prioritizes active applications approaching critical submission cutoffs.

---

### 8. Durable Autonomous Worker & Crash Recovery
- **Transactional Database Tasks:** Background agent discovery operates through the `DurableTask` table with atomic 60-second lease claims.
- **Multi-Process Crash Resilience:** If an OS process is killed mid-task (`SIGKILL`), a successor worker automatically detects expired leases, claims ownership, and resumes execution from the exact step checkpoint without duplicating applications.

---

### 9. Multi-User Security & SSRF Defense
- **Account Impersonation Prevention:** `/api/auth/session` rejects arbitrary client-supplied `userId`s without the internal `AUTH_EXCHANGE_SECRET`. Public registrations mint unguessable `usr_${randomUUID}` identifiers.
- **Persistent Token Revocation:** Revoked session tokens are written to disk (`.data/revoked_tokens.json`), persisting across container and server reboots.
- **Strict SSRF Hardening:** Blocks IPv4/IPv6 private ranges, AWS/GCP/Azure cloud metadata (`169.254.169.254`), decimal/hex IP evasions, and deceptive open redirects.
- **Prompt Injection Sanitization:** Neutralizes hidden adversarial text inside raw employer postings before LLM processing.

---

### 10. Dual-Engine Database Architecture (PostgreSQL + SQLite)
[`src/lib/db.ts`](./src/lib/db.ts) dynamically resolves the database client based on environment configuration:
- **Local Development:** Instant, zero-config SQLite (`file:./dev.db`) using `@prisma/client`.
- **Staging / Production:** Enterprise PostgreSQL 15 (`postgresql://...`) dynamically instantiating `@prisma/client-postgresql`.

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PROSPECT SYSTEM ARCHITECTURE                       │
└─────────────────────────────────────────────────────────────────────────────┘

  [ Candidate Input ]                     [ Public & Partner Data Feeds ]
   • PDF / DOCX Resume Buffer              • Tavily Search API
   • Transcript / Portfolio GitHub         • Greenhouse / Lever / Ashby ATS Feeds
            │                               • FreeHire Public Board
            ▼                                         │
┌───────────────────────────┐                         │
│ Resume Intelligence AST   │                         ▼
│ • Deterministic parsing   │              ┌──────────────────────────┐
│ • Skill isolation (C, R)  │              │ Zero-Trust Ingestion     │
│ • No GPA hallucination    │              │ • SSRF Protection        │
└───────────┬───────────────┘              │ • Schema.org Extraction  │
            │                              │ • Deduplication Engine   │
            ▼                              └──────────┬───────────────┘
┌───────────────────────────┐                         │
│ Candidate Intelligence    │                         │
│ • Demonstrated Skills     │                         │
│ • Projects & Provenance   │                         │
└───────────┬───────────────┘                         │
            │                                         │
            ▼                                         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ADAPTIVE SEARCH & DECISION CORE                        │
│                                                                             │
│   ┌─────────────────────┐   Adaptive Loop   ┌───────────────────────────┐   │
│   │ Role Expansion      │ ◄───────────────► │ Multi-Round Query Planner │   │
│   │ (Direct / Adjacent) │   (Rounds 1-3)    │ (Anti-Duplicate Traps)    │   │
│   └──────────┬──────────┘                   └─────────────┬─────────────┘   │
│              │                                            │                 │
│              ▼                                            ▼                 │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                  Multi-Factor Seniority Classifier                  │   │
│   │   (STUDENT • INTERN • EARLY_CAREER • SENIOR • STAFF • MANAGER)      │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │              Explainable 4-Way Decision Scoring Model               │   │
│   │        Fit Score = 0.35(Elig) + 0.30(Skill) + 0.15(Qual) + ...      │   │
│   │                                                                     │   │
│   │  [APPLY NOW]      [PREPARE FIRST]      [KEEP WATCHING]      [SKIP]  │   │
│   └──────────────────────────────────┬──────────────────────────────────┘   │
└──────────────────────────────────────┼──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌──────────────────────────────────────┐        ┌─────────────────────────────┐
│ Durable Background Task Worker       │        │ Next.js App Router UI       │
│ • Atomic 60s lease claims            │        │ • Discover Feed             │
│ • Process crash recovery             │        │ • Career Outlook 3D         │
│ • Idempotent state machine           │        │ • Gap-to-Action Prep Studio │
└──────────────────┬───────────────────┘        │ • Application Kanban        │
                   │                            └──────────────┬──────────────┘
                   ▼                                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PERSISTENT DUAL-ENGINE STORAGE LAYER                     │
│                                                                             │
│   Local SQLite (dev.db)   ◄──── src/lib/db.ts ────►   PostgreSQL 15 Staging │
│   Prisma Client                                       Prisma PG Client      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 Getting Started

### Prerequisites
- **Node.js:** `v20.x` or `v22.x` (LTS recommended)
- **Package Manager:** `npm` (v10+)
- **Docker:** *(Optional, only required for PostgreSQL staging verification)*

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/swastikparmar987/Prospect.git
   cd Prospect/prospect
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and insert your live provider keys (Tavily, Groq). For local development, SQLite is enabled out-of-the-box.*

4. **Initialize Database Schemas:**
   ```bash
   # Generate Prisma Client for SQLite:
   npx prisma generate

   # Push schema to local SQLite database:
   npx prisma db push
   ```

5. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🔑 Environment Variables

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Connection URL for SQLite or PostgreSQL | `file:./dev.db` *(SQLite)* or `postgresql://...` *(PostgreSQL)* |
| `SEARCH_PROVIDER` | Web search provider | `tavily` |
| `TAVILY_API_KEY` | API key for Tavily search provider | `tvly-...` |
| `LLM_PROVIDER` | AI reasoning provider | `groq` |
| `GROQ_API_KEY` | API key for Groq Cloud LLM engine | `gsk_...` |
| `GROQ_MODEL` | Active LLM model | `qwen/qwen3.8-27b` |
| `SESSION_SECRET` | 32-character secret for HMAC session signing | `openssl rand -base64 32` |
| `AUTH_EXCHANGE_SECRET` | Secret required for server-side user ID claims | Random high-entropy string |

---

## 🧪 Verification & Automated Test Suite (208 / 208 Tests)

Prospect features an automated test suite verifying every component from unit parsing to multi-process OS crash recovery:

```bash
# Run the entire synchronous test suite:
npm test
```

### Verified Test Suites Breakdown

```text
▶ Adaptive Opportunity Search Engine — 22 Mandatory Scenarios (22/22 passed)
▶ Priority 2 — Authentication Security & Impersonation Prevention (5/5 passed)
▶ Priority 3 — Multi-User Authentication & Data Isolation (5/5 passed)
▶ Priority 4 — Browser-Driven Functional & Visual Verification (11/11 passed)
▶ Priority 6 — Interactive Functional Verification with Backend Persistence (8/8 passed)
▶ Evaluation Dataset — Benchmark Personas & Relevance (5/5 passed)
▶ ModelRouter — Central AI Model Routing & Fallback (8/8 passed)
▶ Process-Restart Durable Worker Recovery (3/3 passed)
▶ Priority 1 — Production Authentication & Session Lifecycle (5/5 passed)
▶ Resume Extraction Engine — 10 Architectural Scenarios (10/10 passed)
▶ Priority 1 — Real Database CRUD & Relational Workflows (8/8 passed)
▶ Prospect — Resume-First Automated Opportunity Discovery (13/13 passed)
▶ Complete Resume Intelligence System (5/5 passed)
▶ Priority 5 — Security & SSRF Hardening Test Suite (8/8 passed)
▶ Priority 3 — Seniority Classification & Student Opportunity Relevance (6/6 passed)
▶ Dynamic Job Synchronization Engine (3/3 passed)
▶ Tavily Search Engine & Real-Time Discovery (11/11 passed)
▶ Direct Job URL Import Engine (5/5 passed)
▶ Multi-Process Durable Worker Recovery Suite (3/3 passed)
▶ PostgreSQL Runtime Client & API Route Integration (7/7 passed)
▶ Diversity & Employer Concentration Suite (4/4 passed)

ℹ tests 208
ℹ suites 16
ℹ pass 208
ℹ fail 0
ℹ duration_ms 17870.5ms
```

---

## 🚢 Production & Staging Deployment

### Running against Real PostgreSQL Staging

1. **Start PostgreSQL 15 Container:**
   ```bash
   docker run -d --name prospect-staging-pg \
     -e POSTGRES_USER=prospect_admin \
     -e POSTGRES_PASSWORD=prospect_staging_pass_2026 \
     -e POSTGRES_DB=prospect_staging_db \
     -p 5433:5432 postgres:15-alpine
   ```

2. **Generate PostgreSQL Prisma Client:**
   ```bash
   npx prisma generate --schema=prisma/schema.postgresql.prisma
   npx prisma db push --schema=prisma/schema.postgresql.prisma
   ```

3. **Set Environment Variable & Build:**
   ```bash
   export DATABASE_URL="postgresql://prospect_admin:prospect_staging_pass_2026@localhost:5433/prospect_staging_db?schema=public"
   npm run build
   npm start
   ```

---

## 📁 Directory Structure

```
prospect/
├── docs/                                # Technical Documentation & Audit Matrices
│   ├── PRODUCTION_READINESS.md          # 8-Gate Release Readiness Matrix
│   ├── KNOWN_LIMITATIONS.md             # Edge Cases & Production Caveats
│   ├── STAGING_DEPLOYMENT_RUNBOOK.md    # Production Staging Deployment Guide
│   └── images/                          # Documentation Assets & Architecture Visuals
├── prisma/
│   ├── schema.prisma                    # SQLite Local Schema
│   └── schema.postgresql.prisma         # PostgreSQL Staging / Production Schema
├── public/                              # Static Assets, Logos & 3D Screenshots
│   ├── prospect-banner.jpg              # Official Prospect Banner
│   └── landing-page-hero.png            # 3D Landing Page Visual Artifact
├── src/
│   ├── app/
│   │   ├── api/                         # Next.js App Router API Handlers
│   │   │   ├── auth/                    # Session issuance, exchange & revocation
│   │   │   ├── career-outlook/          # 3D Career Outlook Generation
│   │   │   ├── opportunities/           # Scored opportunities, stream & URL importer
│   │   │   ├── preparation-plans/       # Gap-to-Action persistence
│   │   │   ├── profile/                 # Candidate facts & resume upload
│   │   │   ├── scheduler/               # Interview & application event scheduler
│   │   │   ├── status/                  # Live system vitals & adapter health
│   │   │   └── tracker/                 # Kanban stage transitions & deletion
│   │   ├── landing/                     # Dedicated 3D Landing Page Route
│   │   ├── globals.css                  # Neo-Brutalist Design Tokens & Utility Classes
│   │   └── page.tsx                     # Main Dashboard Application Container
│   ├── components/
│   │   ├── landing/                     # 3D Three.js Canvas & Landing Components
│   │   │   ├── ThreeCanvas.tsx          # WebGL 3D Career Universe & Particle Field
│   │   │   ├── InteractiveOpportunitySimulator.tsx # Live 4-Way Decision Simulator
│   │   │   ├── InteractivePrepStudioMockup.tsx    # Interactive Gap-to-Action Mockup
│   │   │   ├── SystemArchitecture3DViewer.tsx     # 6-Pillar Architecture Viewer
│   │   │   └── LandingExperience.tsx              # Master Landing Page Shell
│   │   ├── views/                       # Main Dashboard Views (Discover, Tracker, etc.)
│   │   ├── onboarding/                  # Resume Upload, Profile Confirmation & Outlook
│   │   └── Sidebar.tsx                  # Neo-Brutalist Navigation Sidebar
│   ├── lib/
│   │   ├── agent/                       # Durable Worker, Task Queue & Leases
│   │   ├── providers/                   # Tavily, Greenhouse, Lever, Ashby Adapters
│   │   ├── auth.ts                      # Cryptographic HMAC Tokens & Revocation
│   │   ├── career-outlook.ts            # Career Direction Inference Engine
│   │   ├── candidate-intelligence.ts    # Resume AST Extraction & Fact Normalization
│   │   ├── db.ts                        # Dynamic Dual-Engine Database Client (PG/SQLite)
│   │   ├── eligibility-engine.ts        # Seniority Classifier & Hard Blocker Rules
│   │   ├── safe-fetch.ts                # SSRF Hardening & Private IP Blocker
│   │   ├── scoring-engine.ts            # 4-Way Recommendation Scoring Model
│   │   └── search-diversity.ts          # Employer Concentration Capping
│   └── test/                            # Comprehensive Automated Test Suites (208 Tests)
└── package.json
```

---

## 📜 License & Acknowledgments

This project is licensed under the **MIT License**.

- **Built with passion for students, new grads, and aspiring researchers.**
- **Autonomous Architecture:** Powered by Google DeepMind Antigravity agentic workflows.
- **Visual Design System:** Inspired by high-contrast Neo-Brutalist botanical aesthetics.

<div align="center">
  <p><b>Prospect</b> — <i>Opportunities for a brighter you.</i></p>
</div>

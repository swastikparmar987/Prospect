# PROSPECT — System Architecture Document

## 1. High-Level Architectural Diagram

```
+-----------------------------------------------------------------------------------+
|                                PRESENTATION LAYER                                 |
|   Next.js 15 App Router | React 19 | Tailwind CSS | Botanical Design System       |
|   - Discover View (All, By Career Direction, Career Brief)                        |
|   - Career Outlook Experience (Direction Cards, Strengths, Custom Role Input)     |
|   - Preparation Studio & Task View                                                |
|   - Application Kanban Tracker                                                    |
|   - Candidate Profile & Fact Provenance Review                                    |
|   - Agent Activity & Multi-Source Observability                                   |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                               APPLICATION / API LAYER                             |
|   /api/profile & /api/profile/upload-resume  |  /api/career-outlook                |
|   /api/opportunities & /api/search/intel     |  /api/opportunities/[id]/verify    |
|   /api/tracker                               |  /api/preparation-plans             |
|   /api/feedback                              |  /api/agent/runs & /api/sync        |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                             CORE REUSABLE DOMAIN ENGINES                          |
|                                                                                   |
|  +------------------------+   +------------------------+   +--------------------+  |
|  | Candidate Intelligence |-->| Career Outlook Engine  |-->| Search Planner     |  |
|  | - Provenance Engine    |   | - 3 Verified Pathways  |   | - Exact & Adjacent |  |
|  | - Skill Taxonomy Graph |   | - Evidence Labels      |   | - Adaptive Rounds  |  |
|  | - Alias Normalization  |   | - Student Editing      |   | - Budget Controls  |  |
|  +------------------------+   +------------------------+   +--------------------+  |
|                                                                      |            |
|  +------------------------+   +------------------------+             v            |
|  | Scoring & Recommendation|<-| Quality & Verification |<--+--------------------+  |
|  | - Hard Blocker Override|   | - Canonical URL Dedup  |   | Provider Registry  |  |
|  | - 4 Decision Actions   |   | - SSRF-Safe Fetcher    |   | - Tavily Search    |  |
|  | - Explainable Rationale|   | - Posting Guard Shield |   | - Direct ATS Feeds |  |
|  +------------------------+   +------------------------+   | - Research Catalog |  |
|               |                                            +--------------------+  |
|               v                                                                   |
|  +------------------------+   +------------------------+   +--------------------+  |
|  | Skill Bridge Engine    |   | Application Tracker    |   | Durable Worker     |  |
|  | - Concrete Deliverables|   | - User-Controlled Flow |   | - Leases & Retries |  |
|  | - Preparation Studio   |   | - Outcome Reflection   |   | - State Recovery   |  |
|  +------------------------+   +------------------------+   +--------------------+  |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                        CENTRAL AI MODEL ROUTER (src/lib/ai)                       |
|   - Task-to-Model Routing (Fast Extraction, Reasoning, Studio Materials)          |
|   - Primary Provider: Groq Cloud (Qwen 3.8 / Llama 3)                             |
|   - Optional Fallback: Google Gemini API (Configurable)                           |
|   - Guaranteed Fallback: Deterministic Rule Engine                                |
|   - Strict Output Validation via Zod Schemas                                      |
+-----------------------------------------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                 PERSISTENCE LAYER                                 |
|   Prisma ORM | SQLite (Local Development) | PostgreSQL (Production Compatible)    |
|   - UserProfile & FactProvenance             - Opportunity & MultiSourceProvenance|
|   - Evaluation & EligibilityCheck            - PreparationPlan & Items            |
|   - Application & ApplicationEvent           - AgentRun & AgentStep               |
|   - SearchCache & UserFeedback               - SyncLog & TaskLeases               |
+-----------------------------------------------------------------------------------+
```

---

## 2. Core Subsystems & Responsibilities

### 2.1 Candidate Intelligence & Fact Provenance
- Evaluates student input across resume files and manual entry.
- Labels all facts with strict provenance: `USER_INPUT`, `USER_OVERRIDE`, `RESUME_AI`, `RESUME_DETERMINISTIC`, `CALCULATED`, `EXTERNAL_SOURCE`.
- Enforces user primacy: user-confirmed fields are immutable against subsequent automated extractions.
- Normalizes skill tokens using a curated bidirectional synonym taxonomy (e.g., `JS` -> `JavaScript`, `PyTorch` -> `Deep Learning`).

### 2.2 Career Outlook Engine
- Synthesizes up to three realistic career pathways from verified facts without arbitrary statistical confidence claims.
- Assigns evidence strength labels: `Strong evidence`, `Some evidence`, `Insufficient evidence`.
- Maps student technical projects and demonstrated competencies directly to each pathway.
- Permits students to toggle selections, eliminate directions, or add custom career goals.

### 2.3 Central AI Model Router
- Routes LLM tasks based on latency, complexity, and token budget.
- Primary provider: Groq Cloud (`qwen/qwen3.8-27b`) for ultra-fast, cost-effective inference.
- Validates all AI structured responses with Zod schemas.
- On network failure or quota exhaustion, transparently degrades to deterministic algorithms without hallucinated filler data.

### 2.4 Multi-Source Search & Adaptive Planner
- Multi-round adaptive searching:
  - Round 1: High-precision exact target roles.
  - Round 2: Justified adjacent capabilities and emerging specializations.
  - Round 3: Institutional, university research, and fellowship programs.
- Implements employer diversity scoring to prevent monopolization by high-volume job aggregators.
- Enforces strict query budgets and caches query results with time-to-live expirations.

### 2.5 Opportunity Verification & Content Safety
- Normalizes URLs to canonical representations, eliminating affiliate tracking parameters.
- Multi-signal deduplication preserving all source URLs and discovery timestamps.
- SSRF-safe HTTP fetching: blocks private IPv4/IPv6 subnets, link-local addresses, and cloud instance metadata endpoints (e.g. AWS 169.254.169.254).
- Posting Guard: scans incoming descriptions for prompt-injection attacks, invisible characters, and adversarial instructions before passing text to evaluation engines.

### 2.6 Decision & Skill Bridge Engine
- Evaluates eligibility requirements as `MET`, `NOT_MET`, `UNKNOWN`, or `NOT_APPLICABLE`.
- Hard blockers (graduation year mismatch, work authorization constraints, passed deadlines) override all skill affinities and mandate `SKIP`.
- Recommends one of four distinct actions: `APPLY_NOW`, `PREPARE_FIRST`, `KEEP_WATCHING`, `SKIP`.
- For `PREPARE_FIRST`, constructs actionable skill bridge plans featuring concrete deliverables, realistic time estimates, and verifiable completion criteria.

### 2.7 Durable Background Task Engine
- Decouples long-running discovery, batch verification, and sync operations from user browser sessions.
- State machine: `QUEUED` -> `RUNNING` -> `RETRY_SCHEDULED` -> `COMPLETED` / `FAILED`.
- Employs task leases with heartbeat refreshes and automatic recovery of orphaned tasks.
- Exponential backoff with jitter prevents thundering herd issues on downstream APIs.

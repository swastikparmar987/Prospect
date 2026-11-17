"use client";

import React, { useState, useMemo } from "react";
import { UserProfile } from "@/types";
import {
  BookOpen,
  CheckCircle2,
  CircleDashed,
  Code2,
  Terminal,
  Layers,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Flame,
  Trophy,
  Target,
  Shield,
  ArrowRight,
  Zap,
  Cpu,
  Database,
  Globe,
  GitBranch,
  FolderGit2,
  Search,
  ChevronRight,
  BookmarkCheck,
  CheckSquare,
  Square,
  BarChart2,
  Compass,
} from "lucide-react";

interface UpskillViewProps {
  userProfile?: UserProfile | null;
  onNavigateDiscover?: () => void;
  onOpenProjectLab?: () => void;
}

interface SkillRoadmapStage {
  title: string;
  focus: string;
  estimatedHours: number;
  skills: string[];
  tasks: Array<{
    id: string;
    label: string;
    type: "concept" | "implementation" | "verification";
    docUrl?: string;
  }>;
}

interface CodingLabChallenge {
  id: string;
  title: string;
  category: "Systems & Backend" | "Full-Stack & Web" | "AI & Machine Learning" | "Distributed Systems";
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedTime: string;
  starterRepoCmd: string;
  tags: string[];
  description: string;
  engineeringVerification: string[];
  milestones: string[];
}

interface SystemDesignPath {
  id: string;
  title: string;
  complexity: "Intermediate" | "Advanced";
  architectureTags: string[];
  summary: string;
  tradeoffs: string[];
  recommendedReading: Array<{ title: string; url: string; platform: string }>;
}

export function UpskillView({
  userProfile,
  onNavigateDiscover,
  onOpenProjectLab,
}: UpskillViewProps) {
  // Target Role Selection
  const defaultRoles = useMemo(() => {
    if (userProfile?.targetRoles && userProfile.targetRoles.length > 0) {
      return userProfile.targetRoles;
    }
    return [
      "Software Engineering Intern",
      "Full Stack Developer",
      "Backend Systems Engineer",
      "AI/ML Engineer",
    ];
  }, [userProfile]);

  const [selectedRole, setSelectedRole] = useState<string>(defaultRoles[0]);
  const [activeTab, setActiveTab] = useState<"roadmaps" | "labs" | "system_design" | "assessment">("roadmaps");
  const [selectedLabCategory, setSelectedLabCategory] = useState<string>("ALL");
  const [copiedCmdId, setCopiedCmdId] = useState<string | null>(null);

  // Local interactive milestone checklist state
  const [completedMilestones, setCompletedMilestones] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("prospect_upskill_milestones");
        if (saved) return JSON.parse(saved);
      } catch {
        // Fallback to empty
      }
    }
    return {
      "task-c1": true,
      "task-c2": true,
      "lab-m1": true,
    };
  });

  const toggleMilestone = (id: string) => {
    setCompletedMilestones((prev) => {
      const updated = { ...prev, [id]: !prev[id] };
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("prospect_upskill_milestones", JSON.stringify(updated));
        } catch {
          // ignore
        }
      }
      return updated;
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmdId(id);
    setTimeout(() => setCopiedCmdId(null), 2500);
  };

  // Skill Roadmaps Database Mapped to Target Roles
  const roadmapsByRole: Record<string, SkillRoadmapStage[]> = {
    "Software Engineering Intern": [
      {
        title: "Stage 1: Production Concurrency & Memory Hygiene",
        focus: "Asynchronous programming, memory efficiency, and deterministic event loops.",
        estimatedHours: 12,
        skills: ["Async/Await & Promises", "Event Loop Profiling", "Memory Leaks", "Defensive Error Handling"],
        tasks: [
          { id: "swe-1", label: "Implement a bounded worker pool handling 1,000 asynchronous fetch tasks", type: "implementation" },
          { id: "swe-2", label: "Analyze Node.js/Go event loop latency under CPU-bound pressure", type: "concept" },
          { id: "swe-3", label: "Write unit tests guaranteeing zero unhandled promise rejections", type: "verification" },
        ],
      },
      {
        title: "Stage 2: Relational Schema Design & Query Observability",
        focus: "ACID guarantees, indexing strategies, and connection pooling resilience.",
        estimatedHours: 16,
        skills: ["PostgreSQL / SQLite", "B-Tree Indexing", "Transaction Isolation", "Connection Pooling"],
        tasks: [
          { id: "swe-4", label: "Design a relational schema with composite indexes and audit logs", type: "implementation" },
          { id: "swe-5", label: "Inspect query execution plans with EXPLAIN ANALYZE and eliminate sequential scans", type: "verification" },
          { id: "swe-6", label: "Benchmark connection pool saturation under simulated concurrent traffic", type: "concept" },
        ],
      },
      {
        title: "Stage 3: Production API Patterns & Defensive Middleware",
        focus: "Idempotency keys, rate limiting, and structured observability.",
        estimatedHours: 18,
        skills: ["RESTful APIs", "Token Bucket Rate Limiting", "Structured JSON Logging", "OpenAPI Spec"],
        tasks: [
          { id: "swe-7", label: "Implement idempotent POST requests using Redis deduplication locks", type: "implementation" },
          { id: "swe-8", label: "Configure OpenTelemetry distributed trace spans across micro-endpoints", type: "verification" },
          { id: "swe-9", label: "Ship an automated CI pipeline with test coverage thresholds", type: "verification" },
        ],
      },
    ],
    "Full Stack Developer": [
      {
        title: "Stage 1: Server Components & Hydration Optimization",
        focus: "Next.js App Router, React Server Components (RSC), and sub-50ms TTFB.",
        estimatedHours: 14,
        skills: ["React 19 / RSC", "Streaming SSR", "Partial Pre-rendering", "Bundle Tree-Shaking"],
        tasks: [
          { id: "fs-1", label: "Refactor dynamic client components to cached React Server Components", type: "implementation" },
          { id: "fs-2", label: "Audit bundle sizes using @next/bundle-analyzer and eliminate heavy modules", type: "verification" },
          { id: "fs-3", label: "Implement Suspense boundaries with zero cumulative layout shift (CLS)", type: "implementation" },
        ],
      },
      {
        title: "Stage 2: Distributed State & Real-Time Synchronization",
        focus: "Optimistic UI mutations, Server-Sent Events, and resilient offline cache.",
        estimatedHours: 16,
        skills: ["Server-Sent Events", "Zustand / TanStack Query", "Optimistic Mutations", "WebSockets"],
        tasks: [
          { id: "fs-4", label: "Build an SSE feed with automatic reconnect and exponential backoff", type: "implementation" },
          { id: "fs-5", label: "Handle multi-tab state sync using BroadcastChannel API", type: "concept" },
          { id: "fs-6", label: "Write end-to-end Playwright tests verifying optimistic rollback on network failure", type: "verification" },
        ],
      },
      {
        title: "Stage 3: Edge Ingestion & Secure Authentication",
        focus: "JWT rotation, CSRF protection, and edge middleware execution.",
        estimatedHours: 18,
        skills: ["Edge Runtime", "HttpOnly Cookie Auth", "Role-Based Access Control", "Rate Limiting"],
        tasks: [
          { id: "fs-7", label: "Deploy edge middleware validating cryptographically signed session tokens", type: "implementation" },
          { id: "fs-8", label: "Implement strict Content-Security-Policy (CSP) headers without eval unsafe-inline", type: "verification" },
        ],
      },
    ],
    "Backend Systems Engineer": [
      {
        title: "Stage 1: High-Throughput Ingestion & Queues",
        focus: "Message brokers, backpressure handling, and at-least-once delivery.",
        estimatedHours: 20,
        skills: ["Redis / BullMQ", "Kafka / RabbitMQ", "Backpressure", "Dead-Letter Queues"],
        tasks: [
          { id: "be-1", label: "Build an asynchronous job processing worker pool with dead-letter retry logic", type: "implementation" },
          { id: "be-2", label: "Implement backpressure regulation using stream sliding-window counters", type: "concept" },
          { id: "be-3", label: "Run chaos testing simulating worker process crash during job execution", type: "verification" },
        ],
      },
      {
        title: "Stage 2: Database Scalability & Cache Consistency",
        focus: "Cache-aside vs write-through, read replicas, and distributed locks.",
        estimatedHours: 22,
        skills: ["PostgreSQL Replication", "Redis Redlock", "Cache Invalidation", "Partitioning"],
        tasks: [
          { id: "be-4", label: "Implement cache-aside pattern with TTL jitter preventing cache stampede", type: "implementation" },
          { id: "be-5", label: "Benchmark database read replica lag under heavy write bursts", type: "verification" },
        ],
      },
      {
        title: "Stage 3: Distributed Observability & Chaos Engineering",
        focus: "SLOs, p99 latency profiling, and automated circuit breaking.",
        estimatedHours: 16,
        skills: ["Prometheus Metrics", "Grafana", "Circuit Breakers", "P99 Profiling"],
        tasks: [
          { id: "be-6", label: "Implement circuit breaker pattern for external third-party API dependencies", type: "implementation" },
          { id: "be-7", label: "Expose Prometheus scrape endpoints with RED metrics (Rate, Errors, Duration)", type: "verification" },
        ],
      },
    ],
    "AI/ML Engineer": [
      {
        title: "Stage 1: Production Vector Search & Hybrid Embeddings",
        focus: "Embedding models, approximate nearest neighbor (ANN), and hybrid ranking.",
        estimatedHours: 16,
        skills: ["Vector DBs (Qdrant/Chroma)", "Cross-Encoders", "HNSW Indexing", "Reciprocal Rank Fusion"],
        tasks: [
          { id: "ai-1", label: "Index 100k document chunks using HNSW vector indexing and measure recall @ 10", type: "implementation" },
          { id: "ai-2", label: "Implement BM25 lexical + dense vector reciprocal rank fusion (RRF)", type: "concept" },
          { id: "ai-3", label: "Benchmark embedding latency vs quantization accuracy tradeoffs", type: "verification" },
        ],
      },
      {
        title: "Stage 2: LLM Evaluation, Guardrails & Structured Output",
        focus: "Pydantic-AI / instructor, deterministic JSON output, and prompt injection defense.",
        estimatedHours: 18,
        skills: ["Pydantic Validation", "Prompt Injection Defense", "Eval Harnesses", "Streaming Token Parsers"],
        tasks: [
          { id: "ai-4", label: "Build a deterministic output extractor with schema repair on validation fail", type: "implementation" },
          { id: "ai-5", label: "Implement an automated eval harness testing semantic faithfulness on 50 sample cases", type: "verification" },
        ],
      },
    ],
  };

  const activeRoadmap = roadmapsByRole[selectedRole] || roadmapsByRole["Software Engineering Intern"];

  // Verified Coding Challenges & Project Starter Labs
  const codingLabs: CodingLabChallenge[] = [
    {
      id: "lab-1",
      title: "High-Throughput Distributed Rate Limiter",
      category: "Distributed Systems",
      difficulty: "Intermediate",
      estimatedTime: "4-6 hours",
      starterRepoCmd: "git clone https://github.com/prospect-labs/rate-limiter-redis-starter.git",
      tags: ["TypeScript", "Redis", "Docker", "Jest"],
      description: "Implement a sliding-window counter rate limiter with Redis Lua scripts. Must prevent race conditions under 10k concurrent simulated requests and provide graceful HTTP 429 headers.",
      engineeringVerification: [
        "Zero over-limit allocations under Apache Bench 5,000 req/sec benchmark",
        "Atomic sliding window calculation using a single atomic Redis Lua script",
        "Integration test suite with Docker Compose setup included",
      ],
      milestones: [
        "Implement Token Bucket algorithm with local memory fallback",
        "Author Redis EVAL script for atomic sliding window increment",
        "Benchmark with k6 load script and plot latency under saturation",
      ],
    },
    {
      id: "lab-2",
      title: "Real-Time Resilient SSE Job Engine",
      category: "Systems & Backend",
      difficulty: "Intermediate",
      estimatedTime: "3-5 hours",
      starterRepoCmd: "git clone https://github.com/prospect-labs/sse-event-stream-engine.git",
      tags: ["Node.js", "Express", "Server-Sent Events", "Redis Pub/Sub"],
      description: "Design a long-lived Server-Sent Events server capable of multiplexing thousands of client channels with heartbeat keep-alives and backpressure queues.",
      engineeringVerification: [
        "Automatic reconnection without duplicate message delivery",
        "Heartbeat interval guarantees connection liveness through proxies",
        "Memory footprint < 80MB with 2,000 active open SSE streams",
      ],
      milestones: [
        "Setup Express SSE endpoint with text/event-stream headers",
        "Implement Redis PubSub subscriber per client channel",
        "Add client-side exponential backoff reconnect logic",
      ],
    },
    {
      id: "lab-3",
      title: "RAG Evaluation & Ingestion Pipeline",
      category: "AI & Machine Learning",
      difficulty: "Advanced",
      estimatedTime: "6-8 hours",
      starterRepoCmd: "git clone https://github.com/prospect-labs/rag-eval-harness-starter.git",
      tags: ["Python", "Qdrant", "FastAPI", "pytest"],
      description: "Create an autonomous document chunking, semantic vector indexing, and evaluation pipeline that computes faithfulness, answer relevance, and context precision.",
      engineeringVerification: [
        "Includes ground-truth evaluation harness with 40 automated test questions",
        "Reciprocal Rank Fusion hybrid search combining sparse BM25 and dense embeddings",
        "Strict hallucination guardrails rejecting low-confidence retrieval matches",
      ],
      milestones: [
        "Build chunking pipeline with dynamic Markdown header preservation",
        "Implement vector ingestion into embedded Qdrant database",
        "Compute precision/recall metrics and export benchmark report",
      ],
    },
    {
      id: "lab-4",
      title: "Optimistic UI Kanban Board with Conflict Resolution",
      category: "Full-Stack & Web",
      difficulty: "Beginner",
      estimatedTime: "3-4 hours",
      starterRepoCmd: "git clone https://github.com/prospect-labs/optimistic-kanban-starter.git",
      tags: ["React 19", "Next.js", "Tailwind CSS", "Zustand"],
      description: "Build an ultra-responsive Neo-Brutalist Kanban board where card drags and status updates reflect immediately in UI and roll back safely if the server request fails.",
      engineeringVerification: [
        "Zero UI latency on drag-and-drop operations with optimistic store updates",
        "Automatic rollback toast notification if backend returns HTTP 500",
        "Playwright visual regression & user interaction tests passing 100%",
      ],
      milestones: [
        "Build accessible drag-and-drop board with HTML5 drag API or dnd-kit",
        "Wire Zustand store with optimistic update and rollback snapshots",
        "Simulate flakey network latency and verify seamless user feedback",
      ],
    },
  ];

  const filteredLabs = codingLabs.filter(
    (l) => selectedLabCategory === "ALL" || l.category === selectedLabCategory
  );

  // Curated System Design Paths
  const systemDesignPaths: SystemDesignPath[] = [
    {
      id: "sd-1",
      title: "Architecting a Resilient Distributed Rate Limiter",
      complexity: "Intermediate",
      architectureTags: ["Redis", "Sliding Window", "Lua Scripts", "Nginx"],
      summary: "Understand how high-scale infrastructure handles DDoS and abusive traffic while allowing burstable limits for verified enterprise accounts.",
      tradeoffs: [
        "Token Bucket allows controlled burst traffic, while Leaky Bucket strictly smooths outbound request flow.",
        "Local memory caching provides sub-microsecond checks but fails in multi-server horizontal deployments.",
        "Redis Lua scripts eliminate network round-trips but lock the Redis single thread during script execution.",
      ],
      recommendedReading: [
        { title: "Stripe Engineering: How we built scalable rate limiters", url: "https://stripe.com/blog/rate-limiters", platform: "Stripe Engineering" },
        { title: "Cloudflare: How to prevent API abuse without latency spikes", url: "https://blog.cloudflare.com", platform: "Cloudflare Blog" },
      ],
    },
    {
      id: "sd-2",
      title: "Designing a Scalable Real-Time Notification & Ingestion Hub",
      complexity: "Advanced",
      architectureTags: ["Kafka", "WebSockets", "SSE", "Postgres Read Replicas"],
      summary: "Explore how platforms like GitHub, Slack, and Prospect deliver real-time opportunity alerts and sync states across millions of connected sessions.",
      tradeoffs: [
        "Server-Sent Events (SSE) offer simpler unidirectional HTTP/2 multiplexing compared to full-duplex WebSockets.",
        "Fan-out on write guarantees fast feed reads for users with small followings, but explodes for super-users.",
        "Message deduplication via unique event IDs in Redis prevents duplicate notifications during network retries.",
      ],
      recommendedReading: [
        { title: "Slack Architecture: Scaling real-time messaging with WebSockets", url: "https://slack.engineering", platform: "Slack Engineering" },
        { title: "Designing Data-Intensive Applications (DDIA): Chapter 11 - Stream Processing", url: "https://dataintensive.net", platform: "O'Reilly Book" },
      ],
    },
    {
      id: "sd-3",
      title: "Designing a Fast Vector Retrieval & Ranking Pipeline (RAG)",
      complexity: "Advanced",
      architectureTags: ["Vector Index", "HNSW", "Cross-Encoder", "Quantization"],
      summary: "Deep dive into building sub-100ms semantic search pipelines across millions of unstructured job listings and candidate resumes.",
      tradeoffs: [
        "Scalar quantization reduces memory usage by 4x with minimal drop in recall (<2%).",
        "Two-stage retrieval (Vector Search -> Cross-Encoder Re-ranking) optimizes latency vs matching precision.",
        "Metadata pre-filtering restricts vector space early, avoiding wasteful approximate neighbor calculations.",
      ],
      recommendedReading: [
        { title: "Pinecone Systems: Understanding HNSW and Vector Indexes", url: "https://www.pinecone.io/learn/series/faiss/hnsw/", platform: "Vector DB Guide" },
        { title: "Anthropic: Contextual Retrieval and Hybrid Search Best Practices", url: "https://www.anthropic.com/news/contextual-retrieval", platform: "Anthropic Research" },
      ],
    },
  ];

  // Self-Assessment Rubric Questions
  const assessmentQuestions = [
    {
      id: "q-1",
      domain: "Systems Architecture",
      question: "Can you explain the difference between optimistic locking (version timestamps) and pessimistic locking (SELECT FOR UPDATE) in relational databases?",
      impact: "High — Asked in 80% of backend and systems interviews",
    },
    {
      id: "q-2",
      domain: "Concurrency",
      question: "Do you know what happens when a Node.js or Python async event loop is blocked by synchronous CPU computations, and how worker threads or thread pools solve it?",
      impact: "Critical — Fundamental to Node/Python scale",
    },
    {
      id: "q-3",
      domain: "Web Performance",
      question: "Can you identify why Cumulative Layout Shift (CLS) occurs in React applications and how dynamic image dimensions and SSR hydration boundaries mitigate it?",
      impact: "Medium — Frontend & Full-Stack Core",
    },
    {
      id: "q-4",
      domain: "Security & Auth",
      question: "Why should refresh tokens be stored in HttpOnly, SameSite=Strict cookies rather than localStorage, and how do you protect against CSRF?",
      impact: "High — OWASP Standard Interview Topic",
    },
    {
      id: "q-5",
      domain: "Distributed Systems",
      question: "Can you formulate a solution for cache stampede / thundering herd when an expensive cache key expires under 10k concurrent requests?",
      impact: "High — Essential for high-traffic architectures",
    },
  ];

  // Calculate overall completion metric
  const totalChecked = Object.values(completedMilestones).filter(Boolean).length;
  const totalTasks = 20;
  const progressPercent = Math.min(100, Math.round((totalChecked / totalTasks) * 100));

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16">
      {/* ========================================================= */}
      {/* EDITORIAL HERO BANNER                                     */}
      {/* ========================================================= */}
      <div className="bg-white border border-black/[0.07] rounded-[24px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-6 sm:p-8 flex flex-col justify-between">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2">
            <span className="text-[11px] font-heading font-bold tracking-[0.14em] text-[#6B7280] uppercase">
              ENGINEERING UPSKILL & SKILL ACCELERATOR
            </span>
            <span className="rounded-full bg-gradient-to-br from-[#F3FCDA] to-[#E6F9A4]/70 border border-[#C7E938]/55 px-2.5 py-0.5 font-heading text-[10px] font-semibold text-[#101214]">
              Verified Labs
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {onOpenProjectLab && (
              <button
                onClick={onOpenProjectLab}
                className="rounded-full bg-[#101214] text-white font-semibold shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] hover:-translate-y-0.5 transition-all inline-flex items-center space-x-1.5 px-4 py-2 text-xs cursor-pointer"
              >
                <FolderGit2 className="h-3.5 w-3.5" />
                <span>Open Project Evaluator</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 max-w-2xl">
          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#101214] leading-[1.08]">
            Close your{" "}
            <span className="relative inline-block">
              skill gaps.
              <svg
                className="absolute -bottom-1.5 left-0 w-full h-3.5 text-[#CBEF3B] pointer-events-none"
                viewBox="0 0 180 18"
                fill="none"
                preserveAspectRatio="none"
              >
                <path
                  d="M4 13.5C44 9.5 128 5.5 176 4.5"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>
          <p className="mt-2.5 text-xs sm:text-sm text-[#6B7280] font-medium leading-relaxed">
            Turn missing job requirements into demonstrable engineering proof. Master production systems, clone verified starter challenge repos, and build production-grade projects.
          </p>
        </div>

        {/* Quick Stats Bar */}
        <div className="mt-6 pt-5 border-t border-black/[0.06] grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-black/[0.07] bg-[#FAFBF7] p-3.5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
            <div className="text-[11px] font-medium text-[#6B7280]">Target Role</div>
            <div className="font-heading text-sm font-bold text-[#101214] truncate mt-0.5">
              {selectedRole}
            </div>
          </div>
          <div className="rounded-2xl border border-[#F5DFA0] bg-[#FEF9E7] p-3.5">
            <div className="text-[11px] font-medium text-[#715515]">Verified Profile Skills</div>
            <div className="font-heading text-base font-bold text-[#101214] mt-0.5">
              {userProfile?.skills?.length || 8} Active
            </div>
          </div>
          <div className="rounded-2xl border border-[#C7E938]/55 bg-gradient-to-br from-[#F3FCDA] to-[#E6F9A4]/70 p-3.5">
            <div className="text-[11px] font-medium text-[#3F6212]">Milestones Completed</div>
            <div className="font-heading text-base font-bold text-[#101214] mt-0.5">
              {totalChecked} / {totalTasks} ({progressPercent}%)
            </div>
          </div>
          <div className="rounded-2xl border border-black/[0.07] bg-[#FAFBF7] p-3.5 shadow-[0_2px_10px_rgba(15,23,42,0.03)]">
            <div className="text-[11px] font-medium text-[#6B7280]">Verified Lab Starters</div>
            <div className="font-heading text-base font-bold text-[#101214] mt-0.5">
              {codingLabs.length} Available
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SECTION NAVIGATION TABS                                   */}
      {/* ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.06] pb-3">
        <div className="inline-flex flex-wrap items-center gap-1.5 rounded-full border border-black/[0.06] bg-[#F4F5F0] p-1">
          <button
            type="button"
            onClick={() => setActiveTab("roadmaps")}
            className={`rounded-full px-4 py-2 font-heading text-xs transition-all cursor-pointer ${
              activeTab === "roadmaps"
                ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                : "text-[#4B5563] border border-transparent hover:bg-[#EAECE4] hover:text-[#101214] font-medium"
            }`}
          >
            Skill-Gap Roadmaps
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("labs")}
            className={`rounded-full px-4 py-2 font-heading text-xs transition-all cursor-pointer ${
              activeTab === "labs"
                ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                : "text-[#4B5563] border border-transparent hover:bg-[#EAECE4] hover:text-[#101214] font-medium"
            }`}
          >
            Coding Challenge Starter Labs ({codingLabs.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("system_design")}
            className={`rounded-full px-4 py-2 font-heading text-xs transition-all cursor-pointer ${
              activeTab === "system_design"
                ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                : "text-[#4B5563] border border-transparent hover:bg-[#EAECE4] hover:text-[#101214] font-medium"
            }`}
          >
            System Design Accelerators
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("assessment")}
            className={`rounded-full px-4 py-2 font-heading text-xs transition-all cursor-pointer ${
              activeTab === "assessment"
                ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                : "text-[#4B5563] border border-transparent hover:bg-[#EAECE4] hover:text-[#101214] font-medium"
            }`}
          >
            Self-Assessment Checklist
          </button>
        </div>

        {/* Role Switcher Pill */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#6B7280]">Target:</span>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 transition-all px-3 py-1.5 text-xs font-semibold text-[#101214] cursor-pointer focus:outline-none"
          >
            {defaultRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: SKILL-GAP ROADMAPS                                 */}
      {/* ========================================================= */}
      {activeTab === "roadmaps" && (
        <div className="space-y-6">
          <div className="rounded-[22px] border border-[#F5DFA0] bg-[#FEF9E7] p-5 shadow-[0_8px_30px_rgba(15,23,42,0.045)] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[#F5DFA0] text-[#101214]">
                <Compass className="h-4.5 w-4.5" />
              </div>
              <div>
                <h3 className="font-heading text-sm font-bold text-[#101214]">
                  Curated Roadmap for {selectedRole}
                </h3>
                <p className="text-xs text-[#4B5563] font-medium">
                  Sequenced technical stages based on real job requirements from top engineering employers. Check off milestones as you build proof.
                </p>
              </div>
            </div>
            <div className="hidden sm:block text-right shrink-0">
              <span className="text-xs font-medium text-[#715515]">Estimated Journey:</span>
              <div className="font-heading text-sm font-bold text-[#101214]">
                {activeRoadmap.reduce((acc, s) => acc + s.estimatedHours, 0)} Total Hours
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {activeRoadmap.map((stage, idx) => (
              <div
                key={stage.title}
                className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-5 sm:p-6 transition-all"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#101214] text-[#E3FC6D] font-heading font-bold text-xs">
                      0{idx + 1}
                    </span>
                    <h3 className="font-heading text-base sm:text-lg font-bold text-[#101214]">
                      {stage.title}
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F4F5F0] border border-black/[0.06] px-2.5 py-0.5 text-xs font-semibold text-[#101214]">
                    <Zap className="h-3 w-3 text-amber-500" />
                    ~{stage.estimatedHours} hrs
                  </span>
                </div>

                <p className="mt-3 text-xs sm:text-sm font-medium text-[#4B5563]">
                  {stage.focus}
                </p>

                {/* Skills Chips */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-[#6B7280]">Key Competencies:</span>
                  {stage.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-lg border border-black/[0.08] bg-[#FAFBF7] px-2.5 py-0.5 text-[11px] font-semibold text-[#101214]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Checkable Tasks */}
                <div className="mt-4 space-y-2 pt-3 border-t border-black/[0.06]">
                  {stage.tasks.map((task) => {
                    const isDone = Boolean(completedMilestones[task.id]);
                    return (
                      <div
                        key={task.id}
                        onClick={() => toggleMilestone(task.id)}
                        className={`flex items-start gap-3 rounded-xl border p-3 transition-all cursor-pointer ${
                          isDone
                            ? "border-[#C7E938]/55 bg-gradient-to-br from-[#F3FCDA] to-[#E6F9A4]/70"
                            : "border-black/[0.07] bg-[#FAFBF7] hover:bg-white hover:border-black/[0.14]"
                        }`}
                      >
                        <button
                          type="button"
                          className="mt-0.5 shrink-0 text-[#101214]"
                          aria-label={isDone ? "Mark incomplete" : "Mark complete"}
                        >
                          {isDone ? (
                            <CheckSquare className="h-4 w-4 text-[#4D7C0F]" />
                          ) : (
                            <Square className="h-4 w-4 text-[#9CA3AF]" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-xs sm:text-sm font-semibold ${
                              isDone ? "line-through text-[#6B7280]" : "text-[#101214]"
                            }`}
                          >
                            {task.label}
                          </p>
                        </div>
                        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-white border border-black/[0.08] px-2 py-0.5 text-[#4B5563]">
                          {task.type}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CODING CHALLENGE STARTER LABS                      */}
      {/* ========================================================= */}
      {activeTab === "labs" && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {["ALL", "Distributed Systems", "Systems & Backend", "AI & Machine Learning", "Full-Stack & Web"].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedLabCategory(cat)}
                  className={`rounded-full px-3.5 py-1.5 text-xs transition-all cursor-pointer ${
                    selectedLabCategory === cat
                      ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                      : "bg-[#F4F5F0] text-[#4B5563] border border-black/[0.06] hover:bg-[#EAECE4] hover:text-[#101214] font-medium"
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredLabs.map((lab) => (
              <div
                key={lab.id}
                className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-5 sm:p-6 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-full bg-gradient-to-br from-[#F3FCDA] to-[#E6F9A4]/70 border border-[#C7E938]/55 px-2.5 py-0.5 text-[10px] font-semibold text-[#101214]">
                      {lab.category}
                    </span>
                    <span className="text-[11px] font-medium text-[#6B7280]">
                      Est: {lab.estimatedTime}
                    </span>
                  </div>

                  <h3 className="mt-2.5 font-heading text-lg font-bold text-[#101214] leading-snug">
                    {lab.title}
                  </h3>

                  <p className="mt-2 text-xs text-[#4B5563] font-medium leading-relaxed">
                    {lab.description}
                  </p>

                  {/* Tech stack badges */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {lab.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-lg border border-black/[0.08] bg-[#FAFBF7] px-2.5 py-0.5 text-[10px] font-semibold text-[#101214]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* Engineering Verification Criteria */}
                  <div className="mt-4 rounded-2xl border border-black/[0.06] bg-[#FAFBF7] p-3.5 space-y-1.5">
                    <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-[#101214] flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-emerald-600" />
                      Verification Benchmark Criteria:
                    </span>
                    {lab.engineeringVerification.map((crit, cIdx) => (
                      <div key={cIdx} className="flex items-start gap-1.5 text-xs text-[#4B5563]">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span>{crit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 1-Click Starter Repo Clone Command */}
                <div className="pt-3 border-t border-black/[0.06] space-y-2">
                  <div className="text-[11px] font-semibold text-[#6B7280]">
                    Starter Template Repo:
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-[#101214] px-3 py-2 text-white shadow-[0_4px_12px_rgba(16,18,20,0.12)]">
                    <Terminal className="h-3.5 w-3.5 text-[#E3FC6D] shrink-0" />
                    <code className="flex-1 text-[11px] font-mono truncate text-[#E3FC6D]">
                      {lab.starterRepoCmd}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(lab.starterRepoCmd, lab.id)}
                      className="rounded-lg bg-white/10 hover:bg-white/20 p-1 text-white transition-colors cursor-pointer"
                      title="Copy clone command"
                    >
                      {copiedCmdId === lab.id ? (
                        <Check className="h-3.5 w-3.5 text-[#E3FC6D]" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-white" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: SYSTEM DESIGN ACCELERATORS                         */}
      {/* ========================================================= */}
      {activeTab === "system_design" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-5">
            {systemDesignPaths.map((path) => (
              <div key={path.id} className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-black/[0.06] pb-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#101214] text-white">
                      <Cpu className="h-4 w-4 text-[#E3FC6D]" />
                    </div>
                    <h3 className="font-heading text-lg font-bold text-[#101214]">
                      {path.title}
                    </h3>
                  </div>
                  <span className="rounded-full bg-[#FEF9E7] border border-[#F5DFA0] px-2.5 py-0.5 text-xs font-semibold text-[#715515]">
                    {path.complexity}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#4B5563] font-medium leading-relaxed">
                  {path.summary}
                </p>

                {/* Architecture Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {path.architectureTags.map((t) => (
                    <span
                      key={t}
                      className="rounded-lg border border-black/[0.08] bg-[#FAFBF7] px-2.5 py-0.5 text-xs font-semibold text-[#101214]"
                    >
                      {t}
                    </span>
                  ))}
                </div>

                {/* Core Trade-offs Callout */}
                <div className="rounded-2xl border border-black/[0.06] bg-[#FAFBF7] p-4 space-y-2">
                  <div className="font-heading text-xs font-bold uppercase tracking-wider text-[#101214]">
                    Key Architectural Trade-offs & Decisions:
                  </div>
                  {path.tradeoffs.map((item, tIdx) => (
                    <div key={tIdx} className="flex items-start gap-2 text-xs text-[#4B5563]">
                      <span className="font-bold text-[#84CC16]">•</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                {/* Recommended Reading */}
                <div className="pt-3 border-t border-black/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs">
                  <span className="font-semibold text-[#6B7280]">Essential Deep Dives:</span>
                  <div className="flex flex-wrap items-center gap-3">
                    {path.recommendedReading.map((read, rIdx) => (
                      <a
                        key={rIdx}
                        href={read.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-semibold text-[#101214] hover:text-emerald-700 hover:underline"
                      >
                        <span>{read.title}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: SELF-ASSESSMENT CHECKLIST                          */}
      {/* ========================================================= */}
      {activeTab === "assessment" && (
        <div className="space-y-6">
          <div className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="font-heading text-base font-bold text-[#101214]">
                  Production Readiness Checklist
                </h3>
                <p className="text-xs text-[#6B7280] font-medium">
                  High-frequency technical questions you will be evaluated on in senior engineering rounds.
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-gradient-to-br from-[#F3FCDA] to-[#E6F9A4]/70 border border-[#C7E938]/55 px-3 py-1 font-heading text-xs font-semibold text-[#101214]">
                {assessmentQuestions.filter((q) => completedMilestones[q.id]).length} / {assessmentQuestions.length} Mastered
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {assessmentQuestions.map((q) => {
              const isChecked = Boolean(completedMilestones[q.id]);
              return (
                <div
                  key={q.id}
                  onClick={() => toggleMilestone(q.id)}
                  className={`rounded-[20px] border p-4 transition-all cursor-pointer shadow-[0_4px_16px_rgba(15,23,42,0.03)] ${
                    isChecked
                      ? "border-[#C7E938]/55 bg-gradient-to-br from-[#F3FCDA] to-[#E6F9A4]/70"
                      : "border-black/[0.07] bg-white hover:bg-[#FAFBF7] hover:border-black/[0.12]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      className="mt-0.5 text-[#101214]"
                      aria-label={isChecked ? "Uncheck" : "Check"}
                    >
                      {isChecked ? (
                        <CheckSquare className="h-4 w-4 text-[#4D7C0F]" />
                      ) : (
                        <Square className="h-4 w-4 text-[#9CA3AF]" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider rounded-full bg-[#101214] text-white px-2.5 py-0.5">
                          {q.domain}
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-700">
                          {q.impact}
                        </span>
                      </div>
                      <p
                        className={`mt-2 text-xs sm:text-sm font-semibold ${
                          isChecked ? "text-[#4B5563]" : "text-[#101214]"
                        }`}
                      >
                        {q.question}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

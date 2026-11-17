"use client";

import React, { useMemo, useState } from "react";
import { UserProfile } from "@/types";
import { CheckCircle2, Radar, Upload } from "lucide-react";

export interface SkillAxisResult {
  key: "programming" | "ai_ml" | "databases" | "system_design" | "frontend";
  label: string;
  shortLabel: string;
  score: number; // 0 when no domain evidence, 1..98 when real evidence exists
  matchedKeywords: string[];
}

interface SkillRadarChartProps {
  profile: UserProfile | null;
  onUploadResume?: () => void;
  onNavigateProfile?: () => void;
}

interface KeywordConcept {
  label: string;
  exactTokens?: string[];
  substrings?: string[];
}

interface DomainRule {
  key: SkillAxisResult["key"];
  label: string;
  shortLabel: string;
  categorizedKeys: string[];
  concepts: KeywordConcept[];
}

const DOMAIN_RULES: DomainRule[] = [
  {
    key: "programming",
    label: "Programming",
    shortLabel: "Programming",
    categorizedKeys: ["Languages"],
    concepts: [
      { label: "Python", substrings: ["python"] },
      { label: "TypeScript", substrings: ["typescript"] },
      { label: "JavaScript", substrings: ["javascript"] },
      { label: "Java", exactTokens: ["java"] },
      { label: "C++", exactTokens: ["c++", "cpp"] },
      { label: "C#", exactTokens: ["c#"] },
      { label: "C", exactTokens: ["c"] },
      { label: "Go", exactTokens: ["go"], substrings: ["golang"] },
      { label: "Rust", exactTokens: ["rust"] },
      { label: "Swift", exactTokens: ["swift"] },
      { label: "Kotlin", substrings: ["kotlin"] },
      { label: "Scala", exactTokens: ["scala"] },
      { label: "Ruby", exactTokens: ["ruby"] },
      { label: "PHP", exactTokens: ["php"] },
      { label: "R", exactTokens: ["r"] },
      { label: "Bash / Shell", exactTokens: ["bash"], substrings: ["shell scripting", "zsh"] },
      { label: "Algorithms & DS", substrings: ["algorithms", "data structures", "leetcode"] },
      { label: "Testing", exactTokens: ["tdd"], substrings: ["testing", "pytest", "jest", "vitest", "unit test"] },
      { label: "Git & OOP", exactTokens: ["git", "oop"], substrings: ["object-oriented", "functional programming"] },
    ],
  },
  {
    key: "ai_ml",
    label: "AI / ML",
    shortLabel: "AI / ML",
    categorizedKeys: ["ML / AI", "Research & Evaluation"],
    concepts: [
      { label: "PyTorch", substrings: ["pytorch"] },
      { label: "TensorFlow", substrings: ["tensorflow", "keras"] },
      { label: "Scikit-Learn", substrings: ["scikit-learn", "sklearn"] },
      { label: "LLMs & GenAI", exactTokens: ["llm", "llms"], substrings: ["generative ai", "large language"] },
      { label: "RAG", exactTokens: ["rag"], substrings: ["retrieval augmented", "vector search", "embeddings"] },
      { label: "NLP", exactTokens: ["nlp"], substrings: ["natural language"] },
      { label: "Computer Vision", exactTokens: ["cv"], substrings: ["computer vision", "opencv"] },
      { label: "Hugging Face", substrings: ["hugging face", "huggingface", "transformers"] },
      { label: "LangChain", substrings: ["langchain", "langgraph"] },
      { label: "OpenAI / Gemini", substrings: ["openai", "gemini", "anthropic", "claude"] },
      { label: "Machine Learning", exactTokens: ["ml", "ai", "dl"], substrings: ["machine learning", "deep learning", "neural network"] },
      { label: "Data Science", substrings: ["pandas", "numpy", "scipy", "xgboost", "lightgbm"] },
      { label: "MLOps & CUDA", substrings: ["mlops", "fine-tuning", "cuda", "reinforcement learning", "ai agent"] },
    ],
  },
  {
    key: "databases",
    label: "Databases",
    shortLabel: "Databases",
    categorizedKeys: ["Data & Cloud"],
    concepts: [
      { label: "PostgreSQL", substrings: ["postgresql", "postgres"] },
      { label: "SQL", exactTokens: ["sql"] },
      { label: "MySQL", substrings: ["mysql"] },
      { label: "SQLite", substrings: ["sqlite"] },
      { label: "MongoDB", substrings: ["mongodb", "mongo"] },
      { label: "Redis", substrings: ["redis"] },
      { label: "Prisma", substrings: ["prisma"] },
      { label: "Drizzle", substrings: ["drizzle"] },
      { label: "Vector DBs", substrings: ["pgvector", "pinecone", "chromadb", "qdrant", "weaviate"] },
      { label: "NoSQL & DynamoDB", substrings: ["nosql", "dynamodb", "cassandra", "firestore"] },
      { label: "Supabase / Firebase", substrings: ["supabase", "firebase"] },
      { label: "BigQuery / Snowflake", substrings: ["bigquery", "snowflake", "clickhouse", "data warehouse"] },
      { label: "Kafka & Spark", substrings: ["kafka", "spark", "data pipeline", "etl"] },
      { label: "Elasticsearch / Neo4j", substrings: ["elasticsearch", "neo4j"] },
      { label: "ORMs", exactTokens: ["orm", "db"], substrings: ["typeorm", "sequelize", "sqlalchemy", "database", "data modeling"] },
    ],
  },
  {
    key: "system_design",
    label: "System Design",
    shortLabel: "System Design",
    categorizedKeys: ["Backend & Systems"],
    concepts: [
      { label: "System Design", substrings: ["system design", "architecture", "scalability"] },
      { label: "Distributed Systems", substrings: ["distributed systems", "distributed", "microservices"] },
      { label: "Docker", substrings: ["docker", "container"] },
      { label: "Kubernetes", exactTokens: ["k8s"], substrings: ["kubernetes"] },
      { label: "AWS", exactTokens: ["aws"], substrings: ["amazon web services"] },
      { label: "GCP / Azure", exactTokens: ["gcp"], substrings: ["google cloud", "azure"] },
      { label: "FastAPI", substrings: ["fastapi"] },
      { label: "Node.js", substrings: ["node.js", "nodejs", "express"] },
      { label: "Django / Flask", substrings: ["django", "flask", "spring boot"] },
      { label: "APIs & gRPC", exactTokens: ["api", "rpc"], substrings: ["rest api", "graphql", "grpc"] },
      { label: "Caching & Queues", substrings: ["caching", "message queue", "rabbitmq", "load balancing"] },
      { label: "Terraform & CI/CD", exactTokens: ["sre"], substrings: ["terraform", "ci/cd", "devops", "serverless", "nginx"] },
      { label: "Concurrency & Auth", substrings: ["concurrency", "multithreading", "oauth", "authentication", "backend"] },
      { label: "Observability & Linux", substrings: ["observability", "prometheus", "grafana", "linux", "networking"] },
    ],
  },
  {
    key: "frontend",
    label: "Frontend",
    shortLabel: "Frontend",
    categorizedKeys: ["Frontend & Product"],
    concepts: [
      { label: "React", substrings: ["react"] },
      { label: "Next.js", substrings: ["next.js", "nextjs"] },
      { label: "Tailwind CSS", substrings: ["tailwind", "tailwindcss"] },
      { label: "HTML / CSS", exactTokens: ["css", "dom"], substrings: ["html", "sass", "scss"] },
      { label: "Vue / Angular / Svelte", exactTokens: ["vue"], substrings: ["angular", "svelte"] },
      { label: "UI / UX & Figma", exactTokens: ["ui", "ux"], substrings: ["figma", "ui/ux", "design system"] },
      { label: "Three.js / WebGL", substrings: ["three.js", "threejs", "webgl", "gsap", "framer motion"] },
      { label: "State & Bundlers", substrings: ["redux", "zustand", "vite", "webpack"] },
      { label: "Accessibility", exactTokens: ["a11y"], substrings: ["accessibility", "wcag", "responsive design"] },
      { label: "Mobile UI", substrings: ["react native", "flutter", "swiftui"] },
      { label: "Frontend", exactTokens: ["svg", "pwa"], substrings: ["frontend", "front-end", "d3.js", "web app"] },
    ],
  },
];

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function matchesToken(text: string, token: string, exactWordOnly: boolean): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  const needle = token.toLowerCase();
  if (!exactWordOnly) {
    return lower.includes(needle);
  }
  const pattern = new RegExp(`(^|[^a-z0-9_+#])${escapeRegex(needle)}($|[^a-z0-9_+#])`, "i");
  return pattern.test(lower);
}

function matchesConcept(text: string, concept: KeywordConcept): boolean {
  if (!text) return false;
  if (concept.exactTokens?.some((tok) => matchesToken(text, tok, true))) {
    return true;
  }
  if (concept.substrings?.some((sub) => matchesToken(text, sub, false))) {
    return true;
  }
  return false;
}

/**
 * Computes normalized 5-axis skill scores strictly from real candidate profile evidence.
 * Any axis without matched evidence in skills, projects, experiences, or coursework scores 0.
 */
export function computeSkillRadarAxes(profile: UserProfile | null): SkillAxisResult[] {
  if (!profile) {
    return DOMAIN_RULES.map((rule) => ({
      key: rule.key,
      label: rule.label,
      shortLabel: rule.shortLabel,
      score: 0,
      matchedKeywords: [],
    }));
  }

  const skills = profile.skills || [];
  const projects = profile.projects || [];
  const experiences = profile.experiences || [];
  const extraCorpus = [
    ...(profile.coursework || []),
    ...(profile.certifications || []),
  ].join(" ");

  return DOMAIN_RULES.map((rule) => {
    const matchedConcepts = new Set<string>();
    const skillText = skills.join(" | ");
    let points = 0;

    // 1. Direct Skills & Categorized Skills
    let skillConceptHits = 0;
    for (const concept of rule.concepts) {
      if (matchesConcept(skillText, concept)) {
        skillConceptHits += 1;
        matchedConcepts.add(concept.label);
      }
    }

    if (profile.categorizedSkills) {
      for (const catKey of rule.categorizedKeys) {
        const catItems = profile.categorizedSkills[catKey] || [];
        for (const item of catItems) {
          const clean = item.trim();
          if (clean && !matchedConcepts.has(clean)) {
            skillConceptHits += 1;
            matchedConcepts.add(clean);
          }
        }
      }
    }
    points += Math.min(56, skillConceptHits * 20);

    // 2. Project Evidence (tech stack + descriptions)
    let projectHits = 0;
    for (const project of projects) {
      const projText = `${project.name || ""} ${project.description || ""} ${(project.techStack || []).join(" ")}`;
      let projMatched = false;
      for (const concept of rule.concepts) {
        if (matchesConcept(projText, concept)) {
          projMatched = true;
          matchedConcepts.add(concept.label);
        }
      }
      if (projMatched) {
        projectHits += 1;
      }
    }
    points += Math.min(26, projectHits * 16);

    // 3. Experience Evidence (role titles + bullet achievements)
    let expHits = 0;
    for (const exp of experiences) {
      const expText = `${exp.title || ""} ${(exp.bullets || []).join(" ")}`;
      let expMatched = false;
      for (const concept of rule.concepts) {
        if (matchesConcept(expText, concept)) {
          expMatched = true;
          matchedConcepts.add(concept.label);
        }
      }
      if (expMatched) {
        expHits += 1;
      }
    }
    points += Math.min(24, expHits * 16);

    // 4. Coursework / Certifications / Target Roles (strictly additive)
    let extraConceptHits = 0;
    for (const concept of rule.concepts) {
      if (matchesConcept(extraCorpus, concept)) {
        extraConceptHits += 1;
        if (matchedConcepts.size < 4) {
          matchedConcepts.add(concept.label);
        }
      }
    }
    points += Math.min(10, extraConceptHits * 6);

    const finalScore = points > 0 ? Math.min(98, Math.round(points)) : 0;

    return {
      key: rule.key,
      label: rule.label,
      shortLabel: rule.shortLabel,
      score: finalScore,
      matchedKeywords: Array.from(matchedConcepts).slice(0, 4),
    };
  });
}

export function SkillRadarChart({
  profile,
  onUploadResume,
  onNavigateProfile,
}: SkillRadarChartProps) {
  const axes = useMemo(() => computeSkillRadarAxes(profile), [profile]);
  const [hoveredAxis, setHoveredAxis] = useState<SkillAxisResult["key"] | null>(null);

  const hasProfileEvidence = Boolean(
    profile &&
      ((profile.skills?.length || 0) > 0 ||
        (profile.projects?.length || 0) > 0 ||
        (profile.experiences?.length || 0) > 0)
  );

  const evidenceAxesCount = useMemo(
    () => axes.filter((a) => a.score > 0).length,
    [axes]
  );

  // Regular Pentagon SVG Geometry
  const cx = 180;
  const cy = 148;
  const maxRadius = 82;
  const levels = [0.25, 0.5, 0.75, 1];
  const startAngle = -Math.PI / 2;

  const getPoint = (axisIndex: number, ratio: number) => {
    const angle = startAngle + (axisIndex * 2 * Math.PI) / 5;
    return {
      x: cx + maxRadius * ratio * Math.cos(angle),
      y: cy + maxRadius * ratio * Math.sin(angle),
      angle,
    };
  };

  const ringPolygons = levels.map((ratio) =>
    axes
      .map((_, idx) => {
        const pt = getPoint(idx, ratio);
        return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
      })
      .join(" ")
  );

  const dataVertices = axes.map((axis, idx) => {
    const ratio = axis.score / 100;
    return {
      ...axis,
      ...getPoint(idx, ratio),
      outer: getPoint(idx, 1),
    };
  });

  const dataPolygonPoints = dataVertices
    .map((v) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`)
    .join(" ");

  const strongestAxis = useMemo(() => {
    const active = axes.filter((a) => a.score > 0);
    if (active.length === 0) return null;
    return [...active].sort((a, b) => b.score - a.score)[0] || null;
  }, [axes]);

  const activeAxis = useMemo(() => {
    if (hoveredAxis) {
      return axes.find((a) => a.key === hoveredAxis) || null;
    }
    return strongestAxis;
  }, [axes, hoveredAxis, strongestAxis]);

  const labelConfigs = [
    { dx: 0, dy: -16, anchor: "middle" as const }, // Programming (top)
    { dx: 12, dy: -2, anchor: "start" as const },  // AI / ML (top-right)
    { dx: 10, dy: 16, anchor: "start" as const },  // Databases (bottom-right)
    { dx: -10, dy: 16, anchor: "end" as const },   // System Design (bottom-left)
    { dx: -12, dy: -2, anchor: "end" as const },   // Frontend (top-left)
  ];

  return (
    <div className="rounded-[20px] bg-white border border-[#E9E6DF] p-5 shadow-[0_8px_28px_rgba(17,17,17,0.04)]">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <h3 className="font-heading text-[15px] font-bold tracking-tight text-[#111111]">
          Your Skill Profile
        </h3>

        {hasProfileEvidence ? (
          <button
            type="button"
            onClick={onNavigateProfile}
            className="inline-flex items-center gap-1 rounded-full bg-[#F1FFC7] border border-[#D7ED93] px-2.5 py-0.5 text-[11px] font-semibold text-[#111111] hover:bg-[#DFFF43] transition-colors cursor-pointer"
          >
            <CheckCircle2 className="h-3 w-3 text-[#70B93F]" />
            <span>Verified</span>
          </button>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#EAE3FF] border border-[#D7CCF8] px-2.5 py-0.5 text-[11px] font-semibold text-[#111111]">
            Resume Required
          </span>
        )}
      </div>

      {/* Honest Empty State when no profile evidence exists */}
      {!hasProfileEvidence || evidenceAxesCount === 0 ? (
        <div className="mt-2 rounded-[16px] bg-[#FDFBF8] border border-[#E9E6DF] p-5 text-center flex flex-col items-center space-y-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAE3FF] text-[#111111]">
            <Radar className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="font-heading text-sm font-bold text-[#111111]">
              No skill profile analyzed yet
            </div>
            <p className="text-xs text-[#777777] leading-relaxed">
              Upload your resume or add skills to generate your 5-axis engineering profile.
            </p>
          </div>
          {onUploadResume && (
            <button
              type="button"
              onClick={onUploadResume}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-[#111111] text-white px-4 py-2 text-xs font-semibold hover:bg-[#222222] transition-colors cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload Resume</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Responsive 5-Axis SVG Pentagon Chart */}
          <div className="relative w-full flex items-center justify-center">
            <svg
              viewBox="0 0 360 284"
              className="w-full max-w-[330px] h-auto overflow-visible select-none"
              role="img"
              aria-label="5-axis candidate skill profile radar chart"
            >
              <defs>
                <radialGradient id="skillRadarGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#DFFF43" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#DFFF43" stopOpacity="0" />
                </radialGradient>
              </defs>

              <circle cx={cx} cy={cy} r={maxRadius * 0.9} fill="url(#skillRadarGlow)" />

              {/* Concentric Regular Pentagons */}
              {ringPolygons.map((points, idx) => (
                <polygon
                  key={`ring-${idx}`}
                  points={points}
                  fill={idx === levels.length - 1 ? "rgba(253, 251, 248, 0.75)" : "none"}
                  stroke={
                    idx === levels.length - 1
                      ? "rgba(17, 17, 17, 0.13)"
                      : "rgba(17, 17, 17, 0.075)"
                  }
                  strokeWidth={idx === levels.length - 1 ? "1.2" : "1"}
                  strokeLinejoin="round"
                />
              ))}

              {/* Radial Spokes */}
              {dataVertices.map((vertex) => (
                <line
                  key={`spoke-${vertex.key}`}
                  x1={cx}
                  y1={cy}
                  x2={vertex.outer.x}
                  y2={vertex.outer.y}
                  stroke={
                    hoveredAxis === vertex.key
                      ? "rgba(112, 185, 63, 0.55)"
                      : "rgba(17, 17, 17, 0.08)"
                  }
                  strokeWidth={hoveredAxis === vertex.key ? "1.4" : "1"}
                />
              ))}

              {/* Data Filled Polygon from real evidence */}
              <polygon
                points={dataPolygonPoints}
                fill="rgba(223, 255, 67, 0.36)"
                stroke="#70B93F"
                strokeWidth="2"
                strokeLinejoin="round"
                className="transition-all duration-300"
              />

              {/* Vertex Dots & Interactive Hit Targets */}
              {dataVertices.map((vertex, idx) => {
                const cfg = labelConfigs[idx];
                const isActive = hoveredAxis === vertex.key;
                const lx = vertex.outer.x + cfg.dx;
                const ly = vertex.outer.y + cfg.dy;

                return (
                  <g
                    key={`axis-${vertex.key}`}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredAxis(vertex.key)}
                    onMouseLeave={() => setHoveredAxis(null)}
                    onClick={() =>
                      setHoveredAxis((prev) => (prev === vertex.key ? null : vertex.key))
                    }
                  >
                    {vertex.score > 0 && (
                      <>
                        <circle
                          cx={vertex.x}
                          cy={vertex.y}
                          r={isActive ? 8.5 : 6.5}
                          fill="rgba(166, 217, 75, 0.32)"
                          className="transition-all duration-200"
                        />
                        <circle
                          cx={vertex.x}
                          cy={vertex.y}
                          r={isActive ? 4.5 : 3.75}
                          fill="#70B93F"
                          stroke="#FFFFFF"
                          strokeWidth="1.75"
                          className="transition-all duration-200"
                        />
                      </>
                    )}

                    <text
                      x={lx}
                      y={ly}
                      textAnchor={cfg.anchor}
                      dominantBaseline="central"
                      className={`text-[11.5px] font-semibold transition-colors ${
                        isActive
                          ? "fill-[#111111]"
                          : vertex.score > 0
                          ? "fill-[#111111]/80"
                          : "fill-[#777777]"
                      }`}
                      style={{ fontFamily: "var(--font-body)" }}
                    >
                      {vertex.shortLabel}
                    </text>

                    {isActive && (
                      <text
                        x={lx}
                        y={ly + 13}
                        textAnchor={cfg.anchor}
                        dominantBaseline="central"
                        className="text-[10px] font-bold fill-[#70B93F]"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        {vertex.score > 0 ? `${vertex.score}%` : "No evidence"}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Domain Breakdown & Evidence Tags Below SVG */}
          <div className="mt-2 space-y-2.5">
            {/* Compact 5-axis interactive score chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              {axes.map((axis) => {
                const isSelected = activeAxis?.key === axis.key;
                return (
                  <button
                    key={axis.key}
                    type="button"
                    onClick={() =>
                      setHoveredAxis((prev) => (prev === axis.key ? null : axis.key))
                    }
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium border transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-[#F1FFC7] border-[#D7ED93] text-[#111111] font-semibold"
                        : "bg-[#FDFBF8] border-[#E9E6DF] text-[#777777] hover:text-[#111111]"
                    }`}
                  >
                    {axis.shortLabel}:{" "}
                    <span className="font-semibold text-[#111111]">
                      {axis.score > 0 ? `${axis.score}%` : "—"}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Domain Evidence Box */}
            {activeAxis && (
              <div className="rounded-[16px] bg-[#FDFBF8] border border-[#E9E6DF] px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[#111111]">
                    <span
                      className={`h-2 w-2 rounded-full shrink-0 ${
                        activeAxis.score > 0 ? "bg-[#70B93F]" : "bg-[#E9E6DF]"
                      }`}
                    />
                    <span>
                      {hoveredAxis
                        ? activeAxis.label
                        : `Strongest: ${activeAxis.label}`}
                    </span>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#DFFF43] px-2 py-0.5 font-heading text-[11px] font-bold text-[#111111]">
                    {activeAxis.score > 0 ? `${activeAxis.score}%` : "0%"}
                  </span>
                </div>

                {activeAxis.matchedKeywords.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {activeAxis.matchedKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-full bg-white border border-[#E9E6DF] px-2 py-0.5 text-[10.5px] font-medium text-[#111111]"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-[11px] text-[#777777]">
                    No verified skills or projects mapped to {activeAxis.label} yet.
                  </p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

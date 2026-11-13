import {
  ApplicationRecord,
  EvaluationResult,
  Opportunity,
  RankingEvaluationMetrics,
  UserFeedbackRecord,
  UserProfile,
} from "@/types";

export const EMBEDDING_MODEL_ID = "prospect-semantic-embed-v1-128d";
export const EMBEDDING_DIMENSION = 128;
export const EMBEDDING_DIM = EMBEDDING_DIMENSION;

/**
 * 48 curated latent semantic concept clusters covering computer science, AI/ML,
 * data science, systems, product engineering, research, and career readiness domains.
 * Dimensions 0..47 encode concept-level semantic activations so semantically equivalent
 * descriptions (e.g. "neural network training in PyTorch" vs "Deep Learning Intern")
 * produce high cosine similarity even without identical surface wording.
 */
const SEMANTIC_CONCEPT_CLUSTERS: Array<{
  name: string;
  terms: Array<{ token: string; weight: number }>;
}> = [
  {
    name: "deep_learning_neural_nets",
    terms: [
      { token: "pytorch", weight: 1.5 },
      { token: "tensorflow", weight: 1.5 },
      { token: "keras", weight: 1.2 },
      { token: "deep learning", weight: 1.6 },
      { token: "neural network", weight: 1.5 },
      { token: "backpropagation", weight: 1.2 },
      { token: "jax", weight: 1.4 },
      { token: "cuda", weight: 1.3 },
      { token: "gpu", weight: 1.1 },
      { token: "model training", weight: 1.4 },
    ],
  },
  {
    name: "llms_nlp_generative_ai",
    terms: [
      { token: "llm", weight: 1.6 },
      { token: "large language model", weight: 1.6 },
      { token: "nlp", weight: 1.5 },
      { token: "natural language", weight: 1.5 },
      { token: "transformer", weight: 1.5 },
      { token: "hugging face", weight: 1.4 },
      { token: "rag", weight: 1.5 },
      { token: "retrieval augmented", weight: 1.5 },
      { token: "langchain", weight: 1.3 },
      { token: "generative ai", weight: 1.5 },
      { token: "agentic", weight: 1.4 },
      { token: "fine-tuning", weight: 1.4 },
      { token: "prompt", weight: 1.1 },
      { token: "embeddings", weight: 1.4 },
      { token: "bert", weight: 1.3 },
    ],
  },
  {
    name: "computer_vision_multimodal",
    terms: [
      { token: "computer vision", weight: 1.6 },
      { token: "opencv", weight: 1.5 },
      { token: "mediapipe", weight: 1.4 },
      { token: "yolo", weight: 1.5 },
      { token: "resnet", weight: 1.4 },
      { token: "object detection", weight: 1.5 },
      { token: "segmentation", weight: 1.4 },
      { token: "image processing", weight: 1.3 },
      { token: "face recognition", weight: 1.4 },
      { token: "multimodal", weight: 1.4 },
      { token: "video", weight: 1.0 },
    ],
  },
  {
    name: "classical_ml_data_science",
    terms: [
      { token: "machine learning", weight: 1.6 },
      { token: "scikit-learn", weight: 1.5 },
      { token: "sklearn", weight: 1.5 },
      { token: "xgboost", weight: 1.4 },
      { token: "pandas", weight: 1.3 },
      { token: "numpy", weight: 1.3 },
      { token: "classification", weight: 1.2 },
      { token: "regression", weight: 1.2 },
      { token: "clustering", weight: 1.2 },
      { token: "feature engineering", weight: 1.4 },
      { token: "data science", weight: 1.5 },
      { token: "predictive modeling", weight: 1.4 },
    ],
  },
  {
    name: "ml_evaluation_experimentation",
    terms: [
      { token: "model evaluation", weight: 1.5 },
      { token: "benchmark", weight: 1.4 },
      { token: "ablation", weight: 1.4 },
      { token: "a/b testing", weight: 1.4 },
      { token: "experimentation", weight: 1.3 },
      { token: "precision", weight: 1.2 },
      { token: "recall", weight: 1.2 },
      { token: "ndcg", weight: 1.4 },
      { token: "statistical", weight: 1.3 },
      { token: "metrics", weight: 1.1 },
    ],
  },
  {
    name: "python_scientific_stack",
    terms: [
      { token: "python", weight: 1.6 },
      { token: "scipy", weight: 1.3 },
      { token: "jupyter", weight: 1.1 },
      { token: "matplotlib", weight: 1.1 },
      { token: "fastapi", weight: 1.4 },
      { token: "flask", weight: 1.3 },
      { token: "django", weight: 1.3 },
      { token: "asyncio", weight: 1.2 },
    ],
  },
  {
    name: "systems_low_level_programming",
    terms: [
      { token: "c++", weight: 1.6 },
      { token: "rust", weight: 1.6 },
      { token: "golang", weight: 1.5 },
      { token: "go", weight: 1.3 },
      { token: "operating systems", weight: 1.5 },
      { token: "kernel", weight: 1.5 },
      { token: "concurrency", weight: 1.4 },
      { token: "multithreading", weight: 1.4 },
      { token: "memory management", weight: 1.4 },
      { token: "compilers", weight: 1.4 },
      { token: "linux", weight: 1.3 },
      { token: "embedded", weight: 1.3 },
    ],
  },
  {
    name: "distributed_systems_infra",
    terms: [
      { token: "distributed systems", weight: 1.6 },
      { token: "microservices", weight: 1.4 },
      { token: "raft", weight: 1.5 },
      { token: "consensus", weight: 1.5 },
      { token: "grpc", weight: 1.5 },
      { token: "kafka", weight: 1.4 },
      { token: "rabbitmq", weight: 1.3 },
      { token: "high availability", weight: 1.3 },
      { token: "fault tolerance", weight: 1.4 },
      { token: "scalability", weight: 1.3 },
      { token: "throughput", weight: 1.2 },
      { token: "latency", weight: 1.3 },
    ],
  },
  {
    name: "backend_api_engineering",
    terms: [
      { token: "backend", weight: 1.5 },
      { token: "node.js", weight: 1.4 },
      { token: "express", weight: 1.3 },
      { token: "spring boot", weight: 1.4 },
      { token: "java", weight: 1.4 },
      { token: "rest api", weight: 1.4 },
      { token: "graphql", weight: 1.4 },
      { token: "authentication", weight: 1.2 },
      { token: "webhook", weight: 1.2 },
      { token: "server", weight: 1.1 },
    ],
  },
  {
    name: "frontend_modern_web",
    terms: [
      { token: "react", weight: 1.6 },
      { token: "next.js", weight: 1.6 },
      { token: "typescript", weight: 1.6 },
      { token: "javascript", weight: 1.4 },
      { token: "tailwind", weight: 1.3 },
      { token: "frontend", weight: 1.5 },
      { token: "full-stack", weight: 1.5 },
      { token: "fullstack", weight: 1.5 },
      { token: "ui/ux", weight: 1.3 },
      { token: "vue", weight: 1.3 },
      { token: "svelte", weight: 1.3 },
      { token: "accessibility", weight: 1.2 },
    ],
  },
  {
    name: "databases_storage_engines",
    terms: [
      { token: "postgresql", weight: 1.5 },
      { token: "postgres", weight: 1.5 },
      { token: "sql", weight: 1.5 },
      { token: "sqlite", weight: 1.3 },
      { token: "mysql", weight: 1.4 },
      { token: "redis", weight: 1.4 },
      { token: "mongodb", weight: 1.4 },
      { token: "cassandra", weight: 1.4 },
      { token: "vector database", weight: 1.5 },
      { token: "pgvector", weight: 1.5 },
      { token: "indexing", weight: 1.2 },
      { token: "query optimization", weight: 1.3 },
    ],
  },
  {
    name: "cloud_devops_containers",
    terms: [
      { token: "docker", weight: 1.5 },
      { token: "kubernetes", weight: 1.5 },
      { token: "k8s", weight: 1.5 },
      { token: "aws", weight: 1.5 },
      { token: "gcp", weight: 1.5 },
      { token: "google cloud", weight: 1.5 },
      { token: "azure", weight: 1.4 },
      { token: "terraform", weight: 1.5 },
      { token: "ci/cd", weight: 1.4 },
      { token: "github actions", weight: 1.3 },
      { token: "devops", weight: 1.4 },
      { token: "cloud infrastructure", weight: 1.4 },
    ],
  },
  {
    name: "data_engineering_pipelines",
    terms: [
      { token: "spark", weight: 1.5 },
      { token: "databricks", weight: 1.5 },
      { token: "snowflake", weight: 1.5 },
      { token: "airflow", weight: 1.5 },
      { token: "etl", weight: 1.4 },
      { token: "data pipeline", weight: 1.5 },
      { token: "data warehouse", weight: 1.4 },
      { token: "streaming", weight: 1.3 },
      { token: "bigquery", weight: 1.4 },
    ],
  },
  {
    name: "observability_reliability_sre",
    terms: [
      { token: "prometheus", weight: 1.5 },
      { token: "grafana", weight: 1.5 },
      { token: "datadog", weight: 1.4 },
      { token: "opentelemetry", weight: 1.5 },
      { token: "telemetry", weight: 1.4 },
      { token: "sre", weight: 1.5 },
      { token: "site reliability", weight: 1.5 },
      { token: "monitoring", weight: 1.2 },
      { token: "observability", weight: 1.5 },
    ],
  },
  {
    name: "security_cryptography_privacy",
    terms: [
      { token: "security", weight: 1.4 },
      { token: "cybersecurity", weight: 1.5 },
      { token: "cryptography", weight: 1.5 },
      { token: "penetration testing", weight: 1.4 },
      { token: "zero trust", weight: 1.4 },
      { token: "authentication", weight: 1.2 },
      { token: "vulnerability", weight: 1.4 },
      { token: "ssrf", weight: 1.3 },
    ],
  },
  {
    name: "quantitative_finance_algorithms",
    terms: [
      { token: "quantitative", weight: 1.6 },
      { token: "quant", weight: 1.6 },
      { token: "algorithmic trading", weight: 1.6 },
      { token: "low latency", weight: 1.5 },
      { token: "stochastic", weight: 1.5 },
      { token: "probability", weight: 1.3 },
      { token: "market making", weight: 1.5 },
      { token: "time series", weight: 1.4 },
    ],
  },
  {
    name: "mobile_cross_platform",
    terms: [
      { token: "react native", weight: 1.5 },
      { token: "flutter", weight: 1.5 },
      { token: "swift", weight: 1.5 },
      { token: "ios", weight: 1.4 },
      { token: "kotlin", weight: 1.5 },
      { token: "android", weight: 1.4 },
      { token: "mobile", weight: 1.3 },
    ],
  },
  {
    name: "academic_research_publications",
    terms: [
      { token: "research", weight: 1.5 },
      { token: "publication", weight: 1.5 },
      { token: "co-authored", weight: 1.5 },
      { token: "laboratory", weight: 1.3 },
      { token: "fellowship", weight: 1.5 },
      { token: "reu", weight: 1.5 },
      { token: "literature review", weight: 1.4 },
      { token: "arxiv", weight: 1.4 },
      { token: "novel algorithm", weight: 1.4 },
    ],
  },
  {
    name: "early_career_internship_readiness",
    terms: [
      { token: "intern", weight: 1.5 },
      { token: "internship", weight: 1.5 },
      { token: "undergraduate", weight: 1.4 },
      { token: "graduate", weight: 1.2 },
      { token: "new grad", weight: 1.4 },
      { token: "entry-level", weight: 1.4 },
      { token: "early career", weight: 1.4 },
      { token: "summer", weight: 1.2 },
      { token: "bachelor", weight: 1.3 },
      { token: "computer science", weight: 1.4 },
    ],
  },
  {
    name: "product_design_growth",
    terms: [
      { token: "product management", weight: 1.5 },
      { token: "product design", weight: 1.5 },
      { token: "figma", weight: 1.4 },
      { token: "user research", weight: 1.4 },
      { token: "prototyping", weight: 1.4 },
      { token: "design system", weight: 1.4 },
    ],
  },
];

/**
 * Deterministic FNV-1a 32-bit hash for subword/n-gram feature hashing into dimensions 48..127
 */
function fnv1aHash(str: string, seed = 2166136261): number {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "your",
  "will",
  "are",
  "have",
  "has",
  "our",
  "you",
  "not",
  "but",
  "can",
  "all",
  "who",
  "what",
  "when",
  "where",
  "into",
  "more",
  "about",
  "such",
  "their",
  "they",
  "them",
  "work",
  "working",
  "team",
  "role",
  "join",
  "looking",
]);

function tokenizeForEmbedding(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#./_-]+/g, " ")
    .split(/\s+/)
    .map((t) => t.replace(/^[._-]+|[._-]+$/g, ""))
    .filter((t) => t.length >= 2 && !STOP_WORDS.has(t));
}

/**
 * Generates an L2-normalized 128-dimensional semantic embedding vector from text and structured tags.
 * Dimensions 0..47: Latent semantic concept activations (with synonym/domain expansion).
 * Dimensions 48..127: Signed random-projection hashed n-gram & technical token features.
 */
export function generateSemanticEmbedding(
  primaryText: string,
  highWeightKeywords: string[] = []
): number[] {
  const vec = new Array<number>(EMBEDDING_DIMENSION).fill(0);
  const combinedLower = `${primaryText || ""} ${highWeightKeywords.join(" ")}`.toLowerCase();

  if (!combinedLower.trim()) {
    return vec;
  }

  // 1. Activate latent semantic concept axes (0..47)
  for (let i = 0; i < SEMANTIC_CONCEPT_CLUSTERS.length && i < 48; i++) {
    const cluster = SEMANTIC_CONCEPT_CLUSTERS[i];
    let activation = 0;
    for (const { token, weight } of cluster.terms) {
      if (token.length <= 3) {
        const escaped = token.replace(/[+]/g, "\\+");
        if (new RegExp(`\\b${escaped}\\b`, "i").test(combinedLower)) {
          activation += weight;
        }
      } else if (combinedLower.includes(token)) {
        activation += weight;
      }
    }
    // Check explicit high-weight keywords (e.g. candidate skills / job requiredSkills)
    for (const kw of highWeightKeywords) {
      const kwLower = kw.toLowerCase();
      if (cluster.terms.some((t) => t.token === kwLower || kwLower.includes(t.token))) {
        activation += 1.25;
      }
    }
    vec[i] = Math.log1p(activation);
  }

  // 2. Project unigrams and bigrams into hashed semantic dimensions (48..127)
  const hashSpaceSize = EMBEDDING_DIMENSION - 48;
  const tokens = tokenizeForEmbedding(primaryText);
  const keywordTokens = tokenizeForEmbedding(highWeightKeywords.join(" "));

  const addFeature = (feature: string, weight: number) => {
    const h1 = fnv1aHash(feature, 2166136261);
    const h2 = fnv1aHash(feature, 16777619);
    const dimIndex = 48 + (h1 % hashSpaceSize);
    const sign = (h2 & 1) === 0 ? 1 : -1;
    vec[dimIndex] += sign * weight;
  };

  // Unigrams
  const tokenFreq = new Map<string, number>();
  for (const tok of tokens) {
    tokenFreq.set(tok, (tokenFreq.get(tok) || 0) + 1);
  }
  for (const [tok, count] of tokenFreq.entries()) {
    const tfWeight = 1 + Math.log(count);
    addFeature(`u:${tok}`, tfWeight * 0.65);
  }

  // Bigrams (phrases like "distributed systems", "machine learning")
  for (let i = 0; i < Math.min(tokens.length - 1, 250); i++) {
    addFeature(`b:${tokens[i]}_${tokens[i + 1]}`, 0.85);
  }

  // High-priority skill & role keywords receive boosted projection weight
  for (const kw of highWeightKeywords) {
    const cleanKw = kw.trim().toLowerCase();
    if (cleanKw) {
      addFeature(`kw:${cleanKw}`, 2.2);
    }
  }
  for (const kwTok of keywordTokens) {
    addFeature(`u:${kwTok}`, 1.5);
  }

  // 3. L2-normalize the embedding vector
  let normSq = 0;
  for (let i = 0; i < vec.length; i++) {
    normSq += vec[i] * vec[i];
  }
  const norm = Math.sqrt(normSq);
  if (norm > 1e-8) {
    for (let i = 0; i < vec.length; i++) {
      vec[i] = Math.round((vec[i] / norm) * 10000) / 10000;
    }
  }

  return vec;
}

/**
 * Generates a semantic embedding vector specifically for a Candidate Profile.
 */
export function generateCandidateEmbedding(profile: UserProfile): number[] {
  const experienceText = (profile.experiences || [])
    .map((e) => `${e.title} at ${e.company}: ${(e.bullets || []).join(" ")}`)
    .join(" ");
  const projectText = (profile.projects || [])
    .map((p) => `${p.name}: ${p.description} ${(p.techStack || []).join(" ")}`)
    .join(" ");
  const courseworkText = (profile.coursework || []).join(" ");
  const primaryText = [
    profile.headline || "",
    profile.major || "",
    profile.degree || "",
    (profile.targetRoles || []).join(" "),
    experienceText,
    projectText,
    courseworkText,
    (profile.resumeText || "").slice(0, 2000),
  ]
    .filter(Boolean)
    .join("\n");

  const highWeightKeywords = [
    ...(profile.skills || []),
    ...(profile.targetRoles || []),
    ...(profile.projects || []).flatMap((p) => p.techStack || []),
  ];

  return generateSemanticEmbedding(primaryText, highWeightKeywords);
}

/**
 * Generates a semantic embedding vector specifically for an Opportunity.
 */
export function generateOpportunityEmbedding(opp: Opportunity): number[] {
  const primaryText = [
    opp.title,
    opp.organization,
    opp.category,
    opp.roleFamily || "",
    opp.description,
    opp.sourceSnippet || "",
    (opp.eligibilityRequirements || []).join(" "),
  ]
    .filter(Boolean)
    .join("\n");

  const highWeightKeywords = [
    opp.title,
    opp.roleFamily || "",
    ...(opp.requiredSkills || []),
    ...(opp.preferredSkills || []),
  ].filter(Boolean);

  return generateSemanticEmbedding(primaryText, highWeightKeywords);
}

/**
 * Computes exact Cosine Similarity in [0, 1] between two embedding vectors.
 */
export function computeCosineSimilarity(
  vecA?: number[] | null,
  vecB?: number[] | null
): number {
  if (
    !vecA ||
    !vecB ||
    vecA.length === 0 ||
    vecB.length === 0 ||
    vecA.length !== vecB.length
  ) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    const a = vecA[i] || 0;
    const b = vecB[i] || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  if (denom < 1e-8) return 0;

  const rawCos = dot / denom;
  // Map [-1, 1] or [0, 1] into bounded [0, 1]
  return Math.max(0, Math.min(1, Math.round(rawCos * 1000) / 1000));
}

/**
 * Computes BM25-style TF-saturated lexical overlap in [0, 1] between a candidate profile
 * text/keywords and an opportunity description/title. Paired with 128-D cosine similarity
 * for Hybrid RAG retrieval (dense concept + sparse exact token matching).
 */
export function computeLexicalBM25Similarity(
  candidateText: string,
  oppText: string,
  priorityTerms: string[] = []
): number {
  const queryTokens = tokenizeForEmbedding(
    `${candidateText} ${priorityTerms.join(" ")}`
  );
  const docTokens = tokenizeForEmbedding(oppText);

  if (queryTokens.length === 0 || docTokens.length === 0) {
    return 0;
  }

  const docTf = new Map<string, number>();
  for (const t of docTokens) {
    docTf.set(t, (docTf.get(t) || 0) + 1);
  }

  const uniqueQueryTerms = Array.from(new Set(queryTokens));
  const avgDocLen = 140;
  const k1 = 1.5;
  const b = 0.75;
  const docLenRatio = docTokens.length / avgDocLen;

  let weightedHits = 0;
  let maxPossible = 0;

  const prioritySet = new Set(
    priorityTerms.flatMap((t) => tokenizeForEmbedding(t))
  );

  for (const term of uniqueQueryTerms) {
    const termWeight = prioritySet.has(term) ? 2.0 : 1.0;
    maxPossible += termWeight;
    const tf = docTf.get(term) || 0;
    if (tf > 0) {
      const bm25Tf =
        (tf * (k1 + 1)) / (tf + k1 * (1 - b + b * docLenRatio));
      weightedHits += termWeight * Math.min(1, bm25Tf);
    }
  }

  if (maxPossible <= 0) return 0;
  return Math.max(0, Math.min(1, Math.round((weightedHits / maxPossible) * 1000) / 1000));
}

/**
 * Information Retrieval Evaluation Metric: Precision@K
 * Fraction of top-K ranked items that are relevant (label > 0).
 */
export function computePrecisionAtK(
  relevanceLabels: number[],
  k: number
): number {
  if (k <= 0 || relevanceLabels.length === 0) return 0;
  const topK = relevanceLabels.slice(0, k);
  const relevantInTopK = topK.filter((r) => r > 0).length;
  return Math.round((relevantInTopK / k) * 1000) / 1000;
}

/**
 * Information Retrieval Evaluation Metric: Recall@K
 * Fraction of all relevant items retrieved within the top-K results.
 */
export function computeRecallAtK(
  relevanceLabels: number[],
  k: number,
  totalRelevantCount?: number
): number {
  if (k <= 0 || relevanceLabels.length === 0) return 0;
  const totalRel =
    totalRelevantCount !== undefined
      ? totalRelevantCount
      : relevanceLabels.filter((r) => r > 0).length;
  if (totalRel <= 0) return 0;
  const topK = relevanceLabels.slice(0, k);
  const relevantInTopK = topK.filter((r) => r > 0).length;
  return Math.min(1, Math.round((relevantInTopK / totalRel) * 1000) / 1000);
}

/**
 * Information Retrieval Evaluation Metric: NDCG@K (Normalized Discounted Cumulative Gain)
 * Supports graded relevance labels (e.g., 3 = High / Applied / Offer, 2 = Saved / Relevant, 1 = Partial, 0 = Irrelevant).
 */
export function computeNDCGAtK(
  relevanceGrades: number[],
  k: number
): number {
  if (k <= 0 || relevanceGrades.length === 0) return 0;

  const computeDCG = (grades: number[], limit: number) => {
    let dcg = 0;
    const count = Math.min(grades.length, limit);
    for (let i = 0; i < count; i++) {
      const rel = Math.max(0, grades[i] || 0);
      dcg += (Math.pow(2, rel) - 1) / Math.log2(i + 2);
    }
    return dcg;
  };

  const actualDCG = computeDCG(relevanceGrades, k);
  const idealGrades = [...relevanceGrades].sort((a, b) => b - a);
  const idealDCG = computeDCG(idealGrades, k);

  if (idealDCG <= 1e-8) return 0;
  return Math.round((actualDCG / idealDCG) * 1000) / 1000;
}

/**
 * Computes Precision@K, Recall@K, and NDCG@K across K = [3, 5, 10]
 * using persisted UserFeedback & Application tracker signals when available,
 * or evidence-grounded relevance grades when cold-starting.
 */
export function evaluateRankingPerformance(params: {
  rankedOpportunities: Opportunity[];
  evaluationsByOppId: Map<string, EvaluationResult>;
  feedbackRecords?: UserFeedbackRecord[];
  applications?: ApplicationRecord[];
  profile: UserProfile;
}): RankingEvaluationMetrics {
  const {
    rankedOpportunities,
    evaluationsByOppId,
    feedbackRecords = [],
    applications = [],
    profile,
  } = params;

  const kValues = [3, 5, 10];
  const positiveOppIds = new Set<string>();
  const strongPositiveOppIds = new Set<string>();
  const negativeOppIds = new Set<string>();

  for (const fb of feedbackRecords) {
    if (!fb.opportunityId) continue;
    if (
      fb.signalType === "MARK_APPLIED" ||
      fb.outcome === "INTERVIEW" ||
      fb.outcome === "OFFER"
    ) {
      strongPositiveOppIds.add(fb.opportunityId);
      positiveOppIds.add(fb.opportunityId);
    } else if (fb.signalType === "SAVE" || fb.signalType === "MARK_RELEVANT") {
      positiveOppIds.add(fb.opportunityId);
    } else if (
      fb.signalType === "MARK_NOT_RELEVANT" ||
      fb.signalType === "HIDE_EMPLOYER" ||
      fb.signalType === "DISMISS_ROLE_FAMILY"
    ) {
      negativeOppIds.add(fb.opportunityId);
    }
  }

  for (const app of applications) {
    if (!app.opportunityId) continue;
    if (["APPLIED", "INTERVIEW", "OFFER", "READY_TO_APPLY"].includes(app.stage)) {
      strongPositiveOppIds.add(app.opportunityId);
      positiveOppIds.add(app.opportunityId);
    } else if (["SAVED", "PREPARING"].includes(app.stage)) {
      positiveOppIds.add(app.opportunityId);
    }
  }

  const totalExplicitLabels = positiveOppIds.size + negativeOppIds.size;
  const useExplicitFeedback = totalExplicitLabels >= 3;

  const candidateSkillsLower = new Set(
    (profile.skills || []).map((s) => s.toLowerCase())
  );

  // Build relevance grade per opportunity in the ranked list
  const relevanceGrades: number[] = rankedOpportunities.map((opp) => {
    if (negativeOppIds.has(opp.id)) return 0;
    if (strongPositiveOppIds.has(opp.id)) return 3;
    if (positiveOppIds.has(opp.id)) return 2;

    if (useExplicitFeedback) {
      // Also credit high-evidence unlabelled matches with grade 1 if eligible
      const ev = evaluationsByOppId.get(opp.id);
      if (ev && ev.hardBlockers.length === 0 && !opp.isExpired) {
        const matchedCount = (opp.requiredSkills || []).filter((s) =>
          candidateSkillsLower.has(s.toLowerCase())
        ).length;
        if (matchedCount >= 2) return 1;
      }
      return 0;
    }

    // Benchmark ground-truth relevance based on independent skill overlap + non-expired + no hard blockers
    const ev = evaluationsByOppId.get(opp.id);
    if (opp.isExpired || (ev && ev.hardBlockers.length > 0)) {
      return 0;
    }
    const matchedCount = (opp.requiredSkills || []).filter((s) =>
      candidateSkillsLower.has(s.toLowerCase())
    ).length;
    if (matchedCount >= 3) return 3;
    if (matchedCount >= 2) return 2;
    if (matchedCount >= 1) return 1;
    return 0;
  });

  const precisionAtK: Record<number, number> = {};
  const recallAtK: Record<number, number> = {};
  const ndcgAtK: Record<number, number> = {};

  const totalRelevant = relevanceGrades.filter((g) => g > 0).length;

  for (const k of kValues) {
    precisionAtK[k] = computePrecisionAtK(relevanceGrades, k);
    recallAtK[k] = computeRecallAtK(relevanceGrades, k, totalRelevant);
    ndcgAtK[k] = computeNDCGAtK(relevanceGrades, k);
  }

  return {
    kValues,
    precisionAtK,
    recallAtK,
    ndcgAtK,
    labeledFeedbackCount: totalExplicitLabels,
    positiveLabelCount: positiveOppIds.size,
    negativeLabelCount: negativeOppIds.size,
    evaluationMethod: useExplicitFeedback
      ? "USER_FEEDBACK_LABELS"
      : "HYBRID_RELEVANCE_BENCHMARK",
    modelFramingNote:
      "Semantic embedding retrieval (128-D L2-normalized vector space) combined with explainable hybrid scoring. Note: This is not a supervised model trained on historical hiring outcomes; user feedback signals (Save, Relevant, Applied, Dismiss) are persisted in UserFeedback to build labeled training data for future supervised learning-to-rank.",
  };
}

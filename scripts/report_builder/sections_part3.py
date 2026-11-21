import os
from .styles import add_h1, add_h2, add_h3, add_p, add_bullet, add_callout_box, add_figure, add_code, add_table_data, HEX_IVORY, HEX_LIME, HEX_CHARCOAL, HEX_LAVENDER
from docx.shared import Pt, Inches

ASSETS_DIR = "/Users/pro/Desktop/projects/FRUITWISE/prospect/public/report-assets"

def render_resume_parsing(doc, html_builder):
    # Word
    add_h1(doc, "15. Candidate Intelligence and Resume Parsing", page_break=True)
    add_h2(doc, "15.1 Dual-Stream Binary Extraction")
    add_p(doc, "Candidate profiling begins with raw binary ingestion. Prospect implements a dual-stream parsing pipeline capable of ingesting PDF and DOCX files without requiring external cloud document converters:")
    add_bullet(doc, "PDF documents are converted into raw text streams using pdf-parse, extracting characters, whitespace coordinates, and structural line delimiters.", "PDF Ingestion: ")
    add_bullet(doc, "DOCX files are ingested using mammoth to parse semantic XML structures. If mammoth encounters malformed XML or corrupt schemas, Prospect initiates an automated fallback that inflates the document container via node:zlib, parses word/document.xml with regex heuristics, and strips XML markup to preserve candidate text.", "DOCX Resilient Fallback: ")

    add_h2(doc, "15.2 Seven-Section Regular Expression Segmentation")
    add_p(doc, "Once raw text is extracted, Prospect segments the document into seven distinct semantic regions using compiled regex patterns with boundary heuristics:")
    add_bullet(doc, "Summary / Objective: Captures candidate self-positioning and career goals.", "1. ")
    add_bullet(doc, "Work Experience: Isolates company names, titles, date ranges, and bullet achievements.", "2. ")
    add_bullet(doc, "Education: Extracts university names, degrees, majors, GPAs, and graduation years.", "3. ")
    add_bullet(doc, "Technical Skills: Isolates languages, frameworks, cloud tooling, and databases.", "4. ")
    add_bullet(doc, "Projects: Parses personal or open-source software projects with descriptions.", "5. ")
    add_bullet(doc, "Certifications: Isolates professional credentials and licenses.", "6. ")
    add_bullet(doc, "Contact Information: Extracts emails, phone numbers, GitHub, and LinkedIn URLs.", "7. ")

    # Embed Figure 2 immediately after 15.1
    diag_path = os.path.join(ASSETS_DIR, "diagram-resume-pipeline.png")
    add_figure(doc, diag_path, "Figure 2: Hybrid Resume Intelligence & Parsing Pipeline showing dual binary stream extraction, regex segmentation, and provenance verification.")

    add_h2(doc, "15.2 Seven-Section Regular Expression Segmentation")
    add_p(doc, "Once raw text is extracted, Prospect segments the document into seven distinct semantic regions using compiled regex patterns: Summary, Work Experience, Education, Technical Skills, Projects, Certifications, and Contact Information.")

    add_h2(doc, "15.3 Single-Letter Language Disambiguation")
    add_p(doc, "A critical challenge in automated technical resume parsing is distinguishing single-letter programming languages (such as \"C\" or \"R\") or common words (\"Go\") from standard English prose. Naive keyword search generates severe false positives (e.g., matching the \"C\" in \"Grade C\" or \"C++\", or the word \"go\" in \"go to market\").")
    add_p(doc, "Prospect resolves this via a Contextual Word-Window Disambiguation heuristic:")
    add_p(doc, "A match for 'C' is only registered if it occurs within a designated Technical Skills or Languages section, flanked by programming-specific delimiters (commas, pipes, slashes) and proximal to companion systems languages (e.g., 'C, C++, Linux' or 'Python | C | Assembly'). Similar windowing constraints are applied to 'R' (requiring proximity to statistical packages like S-Plus, ggplot, or Pandas) and 'Go' (requiring casing 'Golang' or immediate proximity to Docker/Kubernetes).")

    add_h2(doc, "15.4 AI-Assisted Schema Extraction with Provenance Anchoring")
    add_p(doc, "To generate structured JSON from the segmented sections, Prospect orchestrates high-throughput LLM calls using Groq (Llama-3.3-70B-Versatile) with an automatic failover to Google Gemini 2.5 Flash. To eliminate AI hallucination, every extracted entity (skill, job title, company, project) is anchored to an exact snippet offset in the source document. If an LLM attempts to generate a skill not present in the candidate's raw text, the provenance verification pass flags or drops the entity.")

    code_snip = """// Extract text from DOCX buffer with pure ZIP XML fallback
export async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    if (result.value && result.value.trim().length > 50) {
      return result.value;
    }
  } catch (err) {
    console.warn("[ResumeParser] Mammoth extraction failed, initiating XML inflate fallback...");
  }

  // Pure ZIP XML Inflate Fallback
  const zip = new AdmZip(buffer);
  const zipEntries = zip.getEntries();
  const docEntry = zipEntries.find(e => e.entryName === "word/document.xml");
  if (!docEntry) throw new Error("Invalid DOCX container: word/document.xml missing");

  const xmlContent = docEntry.getData().toString("utf8");
  return xmlContent
    .replace(/<w:p[^>]*>/g, "\\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/\\s+/g, " ")
    .trim();
}"""
    add_code(doc, code_snip, "Dual-Stream DOCX Extraction with XML Inflate Fallback (src/lib/resume-parser.ts)")

    # HTML
    html_builder.add_h1("15. Candidate Intelligence and Resume Parsing", page_break=True)
    html_builder.add_h2("15.1 Dual-Stream Binary Extraction")
    html_builder.add_p("Candidate profiling begins with raw binary ingestion. Prospect implements a dual-stream parsing pipeline capable of ingesting PDF and DOCX files without requiring external cloud document converters:")
    html_builder.start_bullet_list()
    html_builder.add_bullet("PDF documents are converted into raw text streams using pdf-parse, extracting characters, whitespace coordinates, and structural line delimiters.", "PDF Ingestion: ")
    html_builder.add_bullet("DOCX files are ingested using mammoth to parse semantic XML structures, with an automated fallback that inflates word/document.xml with regex heuristics to strip XML tags and preserve raw candidate text.", "DOCX Resilient Fallback: ")
    html_builder.end_bullet_list()

    html_builder.add_figure(diag_path, "Figure 2: Hybrid Resume Intelligence & Parsing Pipeline showing dual binary stream extraction, regex segmentation, and provenance verification.")

    html_builder.add_h2("15.2 Seven-Section Regular Expression Segmentation")
    html_builder.add_p("Once raw text is extracted, Prospect segments the document into seven distinct semantic regions using compiled regex patterns: Summary, Work Experience, Education, Technical Skills, Projects, Certifications, and Contact Information.")

    html_builder.add_h2("15.3 Single-Letter Language Disambiguation")
    html_builder.add_p("Prospect resolves single-letter language ambiguity (such as 'C' or 'R' or 'Go') via Contextual Word-Window Disambiguation, validating that terms appear in technical skill sections proximal to companion systems technologies and delimiters.")

    html_builder.add_h2("15.4 AI-Assisted Schema Extraction with Provenance Anchoring")
    html_builder.add_p("To generate structured JSON from the segmented sections, Prospect orchestrates high-throughput LLM calls using Groq (Llama-3.3-70B-Versatile) with automatic failover to Google Gemini 2.5 Flash, anchoring every extracted entity to verifiable source document snippets.")

    html_builder.add_code(code_snip, "Dual-Stream DOCX Extraction with XML Inflate Fallback (src/lib/resume-parser.ts)")

def render_adaptive_search(doc, html_builder):
    # Word
    add_h1(doc, "16. Adaptive Opportunity Search", page_break=False)
    add_h2(doc, "16.1 Dynamic Query Expansion Engine")
    add_p(doc, "When candidates search for opportunities, they frequently submit compact, conversational search queries (e.g., \"React frontend developer\" or \"ML engineer\"). If these raw strings are passed directly to external search engines, the resulting listings are narrow and miss high-affinity roles that use alternate industry nomenclature.")
    add_p(doc, "Prospect implements an Adaptive Query Expansion Engine that parses the candidate's intent and projects the base query into a constellation of related technical competencies and role synonyms:")
    add_bullet(doc, "Expands to [\"React.js\", \"Next.js\", \"TypeScript\", \"Tailwind CSS\", \"Client-Side State\", \"Web Vitals\", \"Single Page Applications\"].", "Query 'Frontend Engineer': ")
    add_bullet(doc, "Expands to [\"Distributed Systems\", \"REST APIs\", \"gRPC\", \"PostgreSQL\", \"Redis\", \"Docker\", \"Microservices\", \"Database Indexing\"].", "Query 'Backend Engineer': ")
    add_bullet(doc, "Expands to [\"PyTorch\", \"TensorFlow\", \"Hugging Face\", \"LLM Fine-Tuning\", \"Vector Embeddings\", \"CUDA\", \"Model Quantization\"].", "Query 'AI / ML Engineer': ")

    add_h2(doc, "16.2 Contextual Intent Construction")
    add_p(doc, "Prospect marries the candidate's query with their extracted resume profile. If a candidate with 3 years of Kubernetes experience searches for \"DevOps\", the search builder prioritizes \"Cloud Infrastructure, Terraform, CI/CD, and Kubernetes orchestration\" over entry-level sysadmin postings. This contextual alignment ensures that queries reflect the candidate's actual seniority baseline.")

    add_h2(doc, "16.3 Search Result Caching & 24h TTL")
    add_p(doc, "To prevent redundant external API consumption and maintain sub-second response times for recurring queries, Prospect maintains a database-backed SearchCache table. Query fingerprints (generated via normalized lowercase terms + provider ID) are stored with a 24-hour Time-To-Live (TTL). When identical queries are received within the TTL window, results are served instantly from the persistent cache.")

    # HTML
    html_builder.add_h1("16. Adaptive Opportunity Search", page_break=False)
    html_builder.add_h2("16.1 Dynamic Query Expansion Engine")
    html_builder.add_p("When candidates search for opportunities, they frequently submit compact search queries. Prospect implements an Adaptive Query Expansion Engine that parses the candidate's intent and projects the base query into a constellation of related technical competencies and role synonyms, covering related frameworks and architectures.")

    html_builder.add_h2("16.2 Contextual Intent Construction")
    html_builder.add_p("Prospect marries the candidate's query with their extracted resume profile, prioritizing senior infrastructure and framework concepts if the candidate's profile demonstrates corresponding years of experience.")

    html_builder.add_h2("16.3 Search Result Caching & 24h TTL")
    html_builder.add_p("To prevent redundant external API consumption and maintain sub-second response times for recurring queries, Prospect maintains a database-backed SearchCache table with a 24-hour Time-To-Live (TTL).")

def render_multi_source_discovery(doc, html_builder):
    # Word
    add_h1(doc, "17. Multi-source Opportunity Discovery", page_break=True)
    add_h2(doc, "17.1 Supported Live Opportunity Providers")
    add_p(doc, "Prospect connects to multiple live external data providers to discover engineering positions across the software industry:")
    add_bullet(doc, "Executes targeted web-scale queries across corporate career sites, Greenhouse/Lever job boards, and verified employer postings.", "1. Tavily Search API: ")
    add_bullet(doc, "Queries the official Hacker News Algolia search index for monthly 'Ask HN: Who is hiring?' threads, extracting high-growth startup positions.", "2. Hacker News Hiring Feeds: ")
    add_bullet(doc, "Retrieves technical career listings and hiring announcements directly from the developer publishing network.", "3. Dev.to Community API: ")
    add_bullet(doc, "Specialized remote engineering feeds (Jobicy, RemoteOK) providing standardized JSON endpoints for remote software roles.", "4. Remote Developer Feeds: ")

    # Embed Figure 3 immediately after 17.1
    diag_path = os.path.join(ASSETS_DIR, "diagram-discovery-pipeline.png")
    add_figure(doc, diag_path, "Figure 3: Multi-Source Opportunity Discovery & Ingestion Pipeline illustrating parallel provider aggregation, security sanitization, and deduplication.")

    add_h2(doc, "17.2 Resilient Multi-Provider Orchestration")
    add_p(doc, "To guard against provider outages or network throttling, Prospect's discovery orchestrator dispatches asynchronous requests using Promise.allSettled(). Each provider connector is wrapped in an individual timeout boundary (default 8,000ms). If a particular provider times out or returns an HTTP 429 rate-limit error, Prospect logs the provider failure in the database SyncLog entity, degrades gracefully, and aggregates results from all healthy providers without crashing the user session.")

    # HTML
    html_builder.add_h1("17. Multi-source Opportunity Discovery", page_break=True)
    html_builder.add_h2("17.1 Supported Live Opportunity Providers")
    html_builder.add_p("Prospect connects to multiple live external data providers to discover engineering positions across the software industry: Tavily Search API, Hacker News Hiring Feeds, Dev.to Community API, and Remote Developer Feeds (Jobicy, RemoteOK).")

    html_builder.add_figure(diag_path, "Figure 3: Multi-Source Opportunity Discovery & Ingestion Pipeline illustrating parallel provider aggregation, security sanitization, and deduplication.")

    html_builder.add_h2("17.2 Resilient Multi-Provider Orchestration")
    html_builder.add_p("To guard against provider outages or network throttling, Prospect's discovery orchestrator dispatches asynchronous requests using Promise.allSettled() with 8,000ms timeout boundaries, recording failures in the SyncLog table and preserving user session continuity.")

def render_normalization_deduplication(doc, html_builder):
    # Word
    add_h1(doc, "18. Opportunity Normalization and Deduplication", page_break=True)
    add_h2(doc, "18.1 Schema Normalization Pipeline")
    add_p(doc, "Because raw opportunity data originates from disparate providers with contrasting data structures, Prospect processes every ingested listing through a strict schema normalization pipeline:")
    add_bullet(doc, "Standardizes salary representations into annual USD min/max integers, parsing hourly rates, monthly amounts, and currency symbols.", "Salary Normalization: ")
    add_bullet(doc, "Normalizes location fields into standardized City, State, Country structures and categorizes remote status into Remote, Hybrid, or On-site.", "Location & Remote Classification: ")
    add_bullet(doc, "Extracts explicit technical requirements, experience thresholds, and educational qualifications into strongly-typed arrays.", "Requirements Extraction: ")

    add_h2(doc, "18.2 Three-Tier Deduplication Algorithm")
    add_p(doc, "Cross-posted job listings represent a major source of noise. Prospect implements a 3-tier deduplication algorithm:")
    add_bullet(doc, "Strips tracking parameters (utm_*, ref, source) and compares normalized canonical job application URLs.", "Tier 1 (Canonical URL Matching): ")
    add_bullet(doc, "Computes an MD5 hash of lowercased, whitespace-stripped title and company strings: Hash = MD5(normalize(title) + normalize(company)).", "Tier 2 (Cryptographic Fingerprinting): ")
    add_bullet(doc, "Calculates character-level Jaccard similarity across normalized job titles and company names. If Jaccard >= 0.88 and location matches, listings are merged.", "Tier 3 (Fuzzy Jaccard Similarity): ")

    add_h2(doc, "18.3 Freshness Enforcement: The 14-Day Cutoff")
    add_p(doc, "To prevent candidates from applying to inactive jobs, Prospect enforces an effectiveFreshCutoff boundary: any listing whose original publication timestamp is older than 14 days is strictly excluded from live opportunity feeds.")

    headers = ["Normalized Attribute", "Source Provider Raw Variant", "Transformation & Sanitization Rule", "Prospect Unified Representation"]
    rows = [
        ["Title", "\"Sr. React / Frontend Dev - URGENT\"", "Strip promotional tags, lowercase trim", "\"Senior Frontend Engineer\""],
        ["Company", "\"Stripe, Inc. [US Remote]\"", "Strip corporate suffixes & remote tags", "\"Stripe\""],
        ["Location", "\"San Francisco, CA or Remote\"", "Parse location & set remote flag true", "\"San Francisco, CA (Remote)\""],
        ["Salary", "\"$140k - $180,000 / yr\"", "Parse numeric values into integer bounds", "Min: 140000, Max: 180000, Currency: USD"],
        ["Publication Date", "\"3 days ago\" / ISO string", "Convert relative dates to absolute ISO-8601", "\"2026-11-15T10:00:00Z\""],
        ["Description", "Raw HTML markup with scripts", "DOMPurify / sanitizeHtml tag removal", "Clean, sanitized markdown text"]
    ]
    widths = [1.2, 1.6, 1.8, 1.6]
    add_table_data(doc, headers, rows, widths)

    # HTML
    html_builder.add_h1("18. Opportunity Normalization and Deduplication", page_break=True)
    html_builder.add_h2("18.1 Schema Normalization Pipeline")
    html_builder.add_p("Because raw opportunity data originates from disparate providers with contrasting data structures, Prospect processes every ingested listing through a strict schema normalization pipeline, standardizing salaries, locations, and requirements.")

    html_builder.add_h2("18.2 Three-Tier Deduplication Algorithm")
    html_builder.add_p("Prospect executes a 3-tier deduplication process: Tier 1 matches stripped canonical URLs; Tier 2 generates MD5 cryptographic hashes of normalized title+company strings; Tier 3 computes fuzzy Jaccard token similarity with an 0.88 threshold.")

    html_builder.add_h2("18.3 Freshness Enforcement: The 14-Day Cutoff")
    html_builder.add_p("Prospect strictly enforces an effectiveFreshCutoff boundary: listings published earlier than 14 days prior to query execution are filtered out of active recommendation feeds.")
    html_builder.add_table(headers, rows)

def render_matching_ranking(doc, html_builder):
    # Word
    add_h1(doc, "19. Matching, Eligibility and Ranking", page_break=True)
    add_h2(doc, "19.1 Custom Embedding Model: prospect-semantic-embed-v1-128d")
    add_p(doc, "Rather than relying on third-party vector embedding APIs—which introduce network latency, monetary costs, and data leakage risks—Prospect deploys an in-process, deterministic 128-dimensional embedding model (prospect-semantic-embed-v1-128d):")
    add_bullet(doc, "Dimensions 0–47 represent 48 curated software engineering concept clusters (e.g., Cloud Native, State Management, Relational DBs, Distributed Systems, ML Frameworks). Each dimension accumulates sub-linear log-TF term weights: w = ln(1 + count).", "Concept Cluster Projections (48D): ")
    add_bullet(doc, "Dimensions 48–127 represent an 80-dimensional Locality-Sensitive Hash (LSH) that maps character 3-grams and 4-grams to signed hash projections, capturing vocabulary nuances and novel terms.", "Locality-Sensitive Hashing (80D): ")
    add_bullet(doc, "The resulting 128D vector is L2-normalized: v_norm = v / ||v||_2. Cosine similarity between candidate and job vectors is computed via fast dot products in O(D) time.", "L2 Normalization & Cosine Distance: ")

    add_h2(doc, "19.2 Lexical Information Retrieval: Okapi BM25")
    add_p(doc, "To guard against vector drift—where two documents share high semantic similarity but lack critical mandatory qualifications—Prospect computes lexical relevance using Okapi BM25 with term-frequency saturation (k_1 = 1.2) and document length normalization (b = 0.75).")

    # Embed Figure 4 immediately after 19.2
    diag_path = os.path.join(ASSETS_DIR, "diagram-scoring-workflow.png")
    add_figure(doc, diag_path, "Figure 4: Matching, Eligibility & 5-Pillar Scoring Engine Workflow illustrating feature extraction, 128D embedding, BM25 ranking, and linear weighting.")

    add_h2(doc, "19.3 The Explainable 5-Pillar Scoring Formulation")
    add_p(doc, "Prospect's scoring engine calculates overall match relevance as a deterministic linear combination of five distinct evaluation pillars:")
    add_p(doc, "Score_total = 0.25 * E + 0.30 * S + 0.20 * A + 0.15 * R + 0.10 * T", bold_prefix="Mathematical Formula: ")
    add_bullet(doc, "Experience Match (E, 25%): Evaluates candidate years of experience against the requisition's stated minimum and preferred thresholds.", "Pillar 1: ")
    add_bullet(doc, "Technical Skill Overlap (S, 30%): Computes the direct Jaccard and weighted overlap between candidate skills and required job technologies.", "Pillar 2: ")
    add_bullet(doc, "Semantic Alignment (A, 20%): Measures dense vector cosine similarity between candidate resume text and job description using prospect-semantic-embed-v1-128d.", "Pillar 3: ")
    add_bullet(doc, "Role Relevance (R, 15%): Evaluates lexical token overlap between target job title and candidate's historical roles via Okapi BM25.", "Pillar 4: ")
    add_bullet(doc, "Career Trajectory (T, 10%): Evaluates the growth gradient of the candidate's previous projects and technical progression.", "Pillar 5: ")

    code_snip = """// 5-Pillar Linear Combination in Prospect Scoring Engine
export function calculateOverallScore(pillars: {
  experienceMatch: number;   // 0 - 100
  skillOverlap: number;      // 0 - 100
  semanticAlignment: number; // 0 - 100
  roleRelevance: number;     // 0 - 100
  careerTrajectory: number;  // 0 - 100
}): { totalScore: number; breakdown: PillarBreakdown } {
  const WEIGHTS = {
    experience: 0.25,
    skills: 0.30,
    alignment: 0.20,
    role: 0.15,
    trajectory: 0.10,
  };

  const rawScore = 
    pillars.experienceMatch * WEIGHTS.experience +
    pillars.skillOverlap * WEIGHTS.skills +
    pillars.semanticAlignment * WEIGHTS.alignment +
    pillars.roleRelevance * WEIGHTS.role +
    pillars.careerTrajectory * WEIGHTS.trajectory;

  const totalScore = Math.min(100, Math.max(0, Math.round(rawScore)));
  return { totalScore, breakdown: pillars };
}"""
    add_code(doc, code_snip, "5-Pillar Scoring Engine Implementation (src/lib/scoring-engine.ts)")

    # HTML
    html_builder.add_h1("19. Matching, Eligibility and Ranking", page_break=True)
    html_builder.add_h2("19.1 Custom Embedding Model: prospect-semantic-embed-v1-128d")
    html_builder.add_p("Prospect deploys an in-process, deterministic 128-dimensional embedding model (prospect-semantic-embed-v1-128d) comprising 48 curated concept clusters with log-TF term weights and an 80-dimensional Locality-Sensitive Hash (LSH) for sub-word features, normalized via L2 norm.")

    html_builder.add_h2("19.2 Lexical Information Retrieval: Okapi BM25")
    html_builder.add_p("Prospect pairs vector cosine distance with Okapi BM25 lexical token matching (k1 = 1.2, b = 0.75) to prevent semantic drift and verify concrete technical term presence.")

    html_builder.add_figure(diag_path, "Figure 4: Matching, Eligibility & 5-Pillar Scoring Engine Workflow illustrating feature extraction, 128D embedding, BM25 ranking, and linear weighting.")

    html_builder.add_h2("19.3 The Explainable 5-Pillar Scoring Formulation")
    html_builder.add_p("Score_total = 0.25 * E + 0.30 * S + 0.20 * A + 0.15 * R + 0.10 * T", bold_prefix="Mathematical Formula: ")
    html_builder.add_p("Where E = Experience Match (25%), S = Skill Overlap (30%), A = Semantic Alignment (20%), R = Role Relevance (15%), and T = Career Trajectory (10%).")

    html_builder.add_code(code_snip, "5-Pillar Scoring Engine Implementation (src/lib/scoring-engine.ts)")

def render_skill_gap_guidance(doc, html_builder):
    # Word
    add_h1(doc, "20. Skill Gap Analysis and Career Guidance", page_break=True)
    add_h2(doc, "20.1 Three-Stage Set Difference Gap Analysis")
    add_p(doc, "When a candidate targets an opportunity, Prospect's gap engine calculates the precise mathematical set difference between job requirements and candidate profile:")
    add_p(doc, "Delta_req = S_req \\ S_user", bold_prefix="Set Difference: ")
    add_p(doc, "Missing skills are categorized across three priority tiers:")
    add_bullet(doc, "Core technologies mentioned repeatedly in the requisition header and responsibilities.", "Tier 1 (Mandatory Deficits): ")
    add_bullet(doc, "Complementary tools, testing libraries, and secondary frameworks.", "Tier 2 (Secondary Deficits): ")
    add_bullet(doc, "Nice-to-have domain qualifications.", "Tier 3 (Peripheral Enhancements): ")

    add_h2(doc, "20.2 Project-Anchored Deliverables")
    add_p(doc, "Unlike generic career advisors that recommend arbitrary tutorials, Prospect anchors missing competencies to the candidate's verified primary project. If the candidate built an 'E-Commerce Microservices Store' and the target job requires Redis caching and Kafka streaming, Prospect generates a targeted deliverable: 'Extend your E-Commerce Store by adding a Redis write-through cache for catalog queries and publishing checkout events to an Apache Kafka topic.'")

    add_h2(doc, "20.3 What-If Counterfactual Simulator")
    add_p(doc, "Prospect features an interactive What-If Simulator. Candidates can toggle individual missing skills in real time. The scoring engine dynamically recomputes the 5-pillar vector and displays the projected score increase (e.g., 'Acquiring Redis and Kafka increases your score from 68% to 84%').")

    add_h2(doc, "20.4 Voice AI Mock Interview Studio")
    add_p(doc, "The Preparation Studio includes an integrated Voice AI Mock Interview Studio. Built on the Web Speech API (SpeechSynthesis and webkitSpeechRecognition), the studio conducts an audio interview. To ensure probing questions reflect authentic industry practices, the backend queries live developer discussions from Hacker News, technical posts from Dev.to, and StackOverflow in real time. The AI interviewer speaks questions aloud, listens to candidate spoken explanations, and provides structured evaluation rubrics.")

    # HTML
    html_builder.add_h1("20. Skill Gap Analysis and Career Guidance", page_break=True)
    html_builder.add_h2("20.1 Three-Stage Set Difference Gap Analysis")
    html_builder.add_p("When a candidate targets an opportunity, Prospect calculates Delta_req = S_req \\ S_user, categorizing deficiencies into Mandatory, Secondary, and Peripheral tiers.")

    html_builder.add_h2("20.2 Project-Anchored Deliverables")
    html_builder.add_p("Prospect anchors missing competencies to the candidate's existing projects, generating concrete engineering extensions rather than disconnected tutorials.")

    html_builder.add_h2("20.3 What-If Counterfactual Simulator")
    html_builder.add_p("Candidates can toggle missing skills in the What-If Simulator to preview simulated score increases prior to investing study time.")

    html_builder.add_h2("20.4 Voice AI Mock Interview Studio")
    html_builder.add_p("The Voice AI Mock Interview Studio utilizes the Web Speech API and live web queries to Hacker News, Dev.to, and StackOverflow to conduct dynamic, audio-driven technical interview evaluations.")

print("Part 3 sections module updated.")

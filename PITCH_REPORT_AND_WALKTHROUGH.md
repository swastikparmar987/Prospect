# PROSPECT — Complete Technical Architecture Report & Two-Person Live Pitch Walkthrough

> **How to Use This Guide with Your Friend:**
> - **Part 1 (Technical Report):** Read this together so both of you understand every backend API, database table, ML embedding pipeline, mathematical scoring formula, and live web scraper in Prospect.
> - **Part 2 (Two-Person Live Walkthrough & Script):** A step-by-step choreography where **You (Screen Operator)** drive the live application on `http://localhost:3000` and **Your Friend (Presenter)** speaks to your Sir and explains what is happening behind the scenes at every click.
> - **Part 3 (Viva / Teacher Q&A Cheat Sheet):** Exact answers to the toughest technical questions professors ask during project evaluations.

---

# PART 1: Complete Technical & Machine Learning Report

## 1. What Problem Does Prospect Solve?
Traditional job portals (LinkedIn, Internshala, Naukri) operate on **keyword matching** and show the exact same static list of thousands of jobs to every user—even before knowing who the student is. They suffer from three critical flaws:
1. **No Resume-First Grounding:** They show generic listings without understanding a student's actual projects, coursework, GPA, or demonstrated code proof.
2. **Black-Box "Match Percentages":** When a portal says "75% match," it never explains the mathematical formula or proves *which* skills are verified by projects versus merely listed as buzzwords.
3. **No Actionable Bridge from Gap to Readiness:** They tell a student they are missing a skill (e.g., `Kubernetes` or `RAG`), but they do not generate an explainable, project-anchored preparation plan or test the student in a live technical interview.

**Prospect** solves this as a **Resume-First, White-Box AI Career Intelligence Platform**. Until a candidate uploads a resume, Prospect displays **zero pre-saved opportunities and zero mock metrics**. Once a resume is uploaded, Prospect extracts structured facts, computes 128-dimensional semantic embeddings, discovers live opportunities from the web, calculates a white-box 5-pillar match score, synthesizes an explainable preparation plan anchored to the student's own projects, runs counterfactual "What-If" skill simulations, and conducts a live voice-based AI mock interview.

---

## 2. Deep Dive: How Each Backend & ML Subsystem Works

### Subsystem A: Strict Resume-First Gating & Session Isolation
- **Files:** `prospect/src/app/page.tsx`, `prospect/src/components/views/HomeView.tsx`, `prospect/src/app/api/opportunities/route.ts`
- **How It Works Behind the Scenes:**
  1. Every client request attaches the authenticated user's bearer token via `getAuthHeaders()`.
  2. When a new user logs in and has not uploaded a resume (`!hasConfiguredProfile`), `GET /api/opportunities?requireProfile=1` immediately returns `{ opportunities: [], totalCount: 0, profileConfigured: false }`.
  3. Even after uploading a resume, the backend computes an `effectiveFreshCutoff` timestamp (`profile.createdAt - 10s` or `freshSince`) and filters the `Opportunity` table with `discoveredAt >= cutoffDate`. This guarantees that **zero stale or pre-saved database rows from previous sessions ever appear**—every opportunity shown was discovered specifically for the uploaded resume.

### Subsystem B: Hybrid Resume Parsing & Fact Provenance Engine
- **Files:** `prospect/src/lib/resume-parser.ts`, `prospect/src/lib/gemini-resume-extractor.ts`, `prospect/src/app/api/resume/parse/route.ts`
- **How It Works Behind the Scenes:**
  1. **Binary Text Extraction:** Extracts raw text streams from `.pdf` (via `pdf-parse`), `.docx` (via `mammoth` and ZIP XML inflate fallback), `.md`, and `.txt`, normalizing Unicode (`NFKC`) and stripping page footers.
  2. **Semantic Section Segmentation:** `segmentResumeSections()` splits the document into `HEADER`, `SUMMARY`, `EDUCATION`, `SKILLS`, `PROJECTS`, `EXPERIENCE`, and `AWARDS_CERTS` using boundary regexes.
  3. **Contextual Skill Disambiguation:** Scans against a 7-category technical taxonomy (`Languages`, `ML / AI`, `Backend & Systems`, `Frontend & Product`, `Data & Cloud`, `Research & Evaluation`). To prevent false positives on single-letter languages like `C` and `R`, it enforces strict contextual rules (e.g., `R` is matched case-sensitively only inside a `Languages:` line or `R programming`).
  4. **Hybrid AI + Deterministic Merge (`parseResumeWithAi`):** When Groq (`Llama-3.3-70B`) or Gemini (`gemini-2.5-flash`) is available, it runs structured JSON schema extraction and merges the output with the deterministic parser. Every extracted field receives a `FieldConfidenceRecord` (`high` / `medium` / `low` / `none`, score `0.0–1.0`) and an exact `evidenceSnippet` proving where in the resume the fact came from.

### Subsystem C: 128-Dimensional Semantic Embeddings & BM25 Hybrid Ranking
- **Files:** `prospect/src/lib/ai/semantic-embeddings.ts`
- **How We Use Machine Learning & Vector Math:**
  - Keyword matching fails when a resume says *"Trained PyTorch neural networks with CUDA"* and a job description asks for *"Deep Learning Intern."*
  - Prospect implements a deterministic **128-dimensional embedding model (`prospect-semantic-embed-v1-128d`)**:
    - **Dimensions `0..47` (Latent Concept Clusters):** 48 weighted domain concept clusters (`deep_learning_neural_nets`, `llms_nlp_generative_ai`, `computer_vision_multimodal`, `distributed_systems_microservices`, `frontend_modern_web`, etc.). Each term has a domain weight (e.g., `pytorch: 1.5`, `rag: 1.5`) and sublinear TF scaling: `w(t, d) = weight(t) * (1 + ln(count(t, d)))`.
    - **Dimensions `48..127` (Feature Hashing):** 80-dimensional signed token & character-trigram projections for fine-grained lexical specificity, followed by L2 unit-vector normalization.
  - **Hybrid Similarity Calculation:** For every candidate profile vector `u` and opportunity vector `v`, Prospect computes both **Cosine Similarity** (`u · v`) and **Okapi BM25 Lexical Similarity** (`k1 = 1.5, b = 0.75`), plus live Information Retrieval metrics (**NDCG@5**, **Mean Reciprocal Rank (MRR)**, and **Precision@5**).

### Subsystem D: White-Box 5-Pillar Opportunity Scoring Engine
- **Files:** `prospect/src/lib/scoring-engine.ts`, `prospect/src/lib/eligibility-engine.ts`
- **The Exact Mathematical Formula:**
  Every opportunity is scored from `0` to `100` using a transparent, auditable 5-pillar weighted linear combination:
  `Overall Score = 0.25 * E + 0.30 * S + 0.20 * A + 0.15 * R + 0.10 * T`
  1. **`E` — Eligibility Score (25% weight):** Checks degree level (`B.Tech`/`B.E.`/`M.Tech`), graduation year cohort (`2026`/`2027`), GPA threshold, and location/work-mode compatibility.
  2. **`S` — Skill & Project Relevance (30% weight):** Combines required skill overlap, preferred skill overlap, 128D semantic cosine similarity, and project tech-stack alignment.
  3. **`A` — Academic & Domain Alignment (20% weight):** Classifies the job into one of 12 domains (`ML_AI`, `SOFTWARE_ENG`, `DATA_SCIENCE`, `PRODUCT_DESIGN`, etc.) and checks alignment with the candidate's major, coursework, and target roles.
  4. **`R` — Realism & Seniority Gate (15% weight):** Inspects whether the role is a genuine student/entry-level internship vs. a senior role requiring 5+ years of experience (applying hard caps if a role is unrealistic for a student).
  5. **`T` — Timing & Urgency (10% weight):** Evaluates application deadline proximity and recency of discovery.

### Subsystem E: 3-Stage Explainable Preparation Plan Engine
- **Files:** `prospect/src/lib/gap-action-engine.ts`, `prospect/src/components/views/PreparationPlansView.tsx`, `prospect/src/app/api/preparation-plans/route.ts`
- **Why Teachers Love This (No Black-Box Advice):**
  When your Sir asks, *"How is your application generating the preparation plan for the candidate?"*, you can point directly to the **3-Stage Explainable Plan Pipeline** visible at the top of the **Prep Plan** tab:
  1. **Stage 1 — Candidate Baseline Extraction:** Reads the candidate's verified skills set `S_user` and their #1 extracted resume project `P_1` (e.g., *"NeuroRAG: Multi-Agent Enterprise Retrieval & Citation Engine"*).
  2. **Stage 2 — Target Role Skill Diff (Set Difference):** Compares the target company's `requiredSkills` (`S_req`) and `preferredSkills` (`S_pref`) against `S_user`:
     - Matched Skills: `S_req ∩ S_user`
     - Missing Required Gaps (High Priority): `S_req \ S_user`
     - Missing Preferred Gaps (Medium Priority): `S_pref \ S_user`
  3. **Stage 3 — Project-Anchored Task Synthesis:** For every missing skill `g`, `generatePreparationPlan()` synthesizes a concrete task that **extends the student's actual resume project `P_1`** (e.g., *"Bridge Kubernetes gap by implementing a focused module extending your 'ChronosKV' project"*), complete with a verifiable **Deliverable**, **Completion Criteria**, **Portfolio Proof**, and **Estimated Effort**.

### Subsystem F: Counterfactual "What-If" Skill Simulator & Resume Proof Audit
- **Files:** `prospect/src/components/views/CareerIntelligenceCommandCenter.tsx`
- **What Makes Prospect's Intelligence Unique:**
  Inside the **Intelligence** tab, Prospect provides three white-box tools that static job portals do not have:
  1. **Counterfactual "What-If" Skill Simulator:** Lets the student toggle missing market skills (e.g., `+ Kubernetes`, `+ TypeScript`, `+ PyTorch`) and re-runs the 5-pillar scoring engine in real time over the hypothetical skill set `S_user ∪ S_sim`. It immediately shows the exact **Match Score lift (+%)**, **newly unlocked High-Fit roles**, and a **Before vs. After per-role comparison table**.
  2. **Resume Proof & Verification Audit:** Cross-references every skill listed in the candidate's `SKILLS` section against the text and tech stacks of their `PROJECTS` and `EXPERIENCE` bullets. It separates skills into **Verified by Project/Experience (Backed by Proof)** vs. **Declared Only (Unverified Claim)**—teaching students why recruiters reject buzzword-stuffed resumes.
  3. **White-Box 5-Pillar Formula Inspector:** Displays the exact mathematical weights (`25%, 30%, 20%, 15%, 10%`) and live progress bars for any matched opportunity.

### Subsystem G: Live Web + AI Capability Voice Mock Interview Studio
- **Files:** `prospect/src/app/api/ai/mock-interview/route.ts`, `prospect/src/components/views/VoiceMockInterviewStudio.tsx`
- **How It Works Behind the Scenes:**
  1. **Live Multi-Source Web Question Retrieval:** When the candidate starts a mock interview for a target role, `POST /api/ai/mock-interview` queries **4 live web APIs in parallel**:
     - **Tavily Web Search API** (live technical interview reports)
     - **Hacker News Algolia API** (real engineering interview threads)
     - **Dev.to Technical Articles API** (recent domain interview guides)
     - **StackExchange / StackOverflow API** (high-voted real technical problems for those exact tags)
     Every web-sourced question displays a clickable citation link (`sourceUrl`) proving it came from the live web.
  2. **Capability-Grounded AI Question Synthesis:** Simultaneously, Prospect generates 3 tailored questions based on the student's profile:
     - **Project Deep-Dive:** Asks specifically about architectural trade-offs in their extracted resume project.
     - **Skill-Gap Probe:** Tests foundational intuition on a skill required by the target role that is missing from their resume.
     - **System Design & Execution:** Tests end-to-end production problem solving.
  3. **Voice Interaction & 4-Pillar Grading:** Uses the browser's `speechSynthesis` API to speak questions aloud and `SpeechRecognition` (`webkitSpeechRecognition`) to transcribe the student's spoken answer in real time. Submitting the answer grades it across **Technical Depth**, **Project Grounding**, **Clarity & Structure**, and **Role Alignment**, plus provides a model strong answer and a dynamic follow-up question.

---

# PART 2: Two-Person Live Demo Walkthrough & Script

## Scene 1: The Landing Page & Mandatory Authentication (1 Minute)
- **What YOU Do on Screen:** Start on `http://localhost:3000`. Scroll down briefly to show the 3D physics badges and centered PAL mascot bubble, then click **Get Started** and sign in via **1-Click Demo Student Login** (or create a fresh account).
- **What YOUR FRIEND Says to Sir:** *"Good morning Sir. Today we are presenting **Prospect**, an AI-powered Career Discovery, Explainable Preparation, and Voice Mock Interview platform. Unlike traditional job portals that dump thousands of static listings on every visitor, Prospect is strictly authenticated and resume-first."*
- **Behind the Scenes (Friend Explains):** *"When we click Get Started, `/api/auth` issues an isolated session token so no candidate ever sees another user's cached profile or pre-saved jobs."*

## Scene 2: Strict Resume-First Gate — Proving Zero Mock Data (1.5 Minutes)
- **What YOU Do on Screen:** Before uploading a resume, click **Discover** in the left sidebar (`#101010`). Point the cursor at the 4 KPI cards (`0 Opportunities Found`, `— Profile Match`, `0 Skill Gaps`, `0 Saved Roles`) and the empty **Your Skill Profile** radar.
- **What YOUR FRIEND Says to Sir:** *"Sir, last time you asked why the dashboard showed 5,712 opportunities or a 66% match before a resume was uploaded. Look at the dashboard right now before uploading a resume: **Opportunities Found is 0**, **Profile Match is blank (`—`)**, **Skill Gaps is 0**, and the **5-Axis Skill Radar** is locked until a resume is provided."*
- **Behind the Scenes (Friend Explains):** *"Our frontend passes `requireProfile=1` to `GET /api/opportunities` and `GET /api/preparation-plans`. When the backend sees no resume has been parsed for this session, it returns zero records—guaranteeing zero mock data or pre-saved database leakage."*

## Scene 3: Live Resume Upload #1 (AI/ML Role) & Hybrid Extraction (2 Minutes)
- **What YOU Do on Screen:** Click **Upload Resume** and drag-and-drop `sample-resumes/1_Aarav_Sharma_AI_ML_Engineer_Resume.pdf`. On the **Review Extracted Profile** screen, scroll through the extracted name (`Aarav Sharma`), university (`IIT Delhi`), GPA (`9.24`), **37 extracted skills**, and **3 AI/ML projects** (`NeuroRAG`, `VisionGuard`, `EvalBench-LLM`), then click **Confirm & Launch Discovery**.
- **What YOUR FRIEND Says to Sir:** *"Now let's upload our first candidate's PDF resume: **Aarav Sharma**, an AI & Machine Learning student from IIT Delhi. Prospect extracts his 9.24 CGPA, 37 technical skills, his internship at Sarvam AI, and all 3 of his deep learning and RAG projects with 98% confidence. Now we launch live discovery."*
- **Behind the Scenes (Friend Explains):** *"`POST /api/resume/parse` extracts raw PDF streams via `pdf-parse`, segments the document into semantic blocks, and merges our deterministic regex parser with structured LLM extraction. Confirming the profile triggers `POST /api/opportunities`, which synthesizes live web search queries from Aarav's extracted skills."*

## Scene 4: Dynamic Dashboard & 5-Axis Skill Radar Transformation (1.5 Minutes)
- **What YOU Do on Screen:** On **Discover**, point at the live KPI cards, hover over the 5 vertices of **Your Skill Profile** (`Programming`, `AI/ML`, `Databases`, `System Design`, `Frontend`), and scroll through the matched opportunities.
- **What YOUR FRIEND Says to Sir:** *"Now the dashboard updates dynamically! Look at the **Your Skill Profile** radar chart: because Aarav is an AI/ML researcher, his polygon spikes toward **AI / ML** and **Programming**, while **Frontend** is near zero."*
- **Behind the Scenes (Friend Explains):** *"Each match score is computed by projecting both the resume and job description into **128-dimensional semantic vectors** (`prospect-semantic-embed-v1-128d`), calculating Cosine Similarity + Okapi BM25 similarity, and running our **5-Pillar Scoring Engine**."*

## Scene 5: Answering Sir's Question #1 — How the Preparation Plan Works (2 Minutes)
- **What YOU Do on Screen:** Click **Prep Plan** in the left sidebar. Point at the **Explainable Plan Pipeline (1 → 2 → 3)** banner at the top, then expand a task card's **Why This Step Was Generated** trace.
- **What YOUR FRIEND Says to Sir:** *"Sir, earlier you asked how our application understands the candidate and generates their preparation plan. We built this **3-Stage Explainable Plan Pipeline** at the top of the Prep Plan tab to show the exact logic."*
- **Behind the Scenes (Friend Explains):** *"In `src/lib/gap-action-engine.ts`, Stage 1 reads Aarav's verified skills and his #1 anchor project (`NeuroRAG`). Stage 2 performs a mathematical set-difference (`Required Skills \ Candidate Skills`) to isolate missing required and preferred skills. Stage 3 synthesizes concrete coding deliverables that extend his existing `NeuroRAG` project to bridge each missing skill."*

## Scene 6: Answering Sir's Question #2 — Unique White-Box Intelligence & "What-If" Simulator (2 Minutes)
- **What YOU Do on Screen:** Click **Intelligence** in the left sidebar. In the **Counterfactual "What-If" Skill Simulator**, click 2–3 skill chips (e.g. `+ Kubernetes`, `+ TypeScript`). Then scroll down to show the **Resume Proof Audit** and the **White-Box 5-Pillar Formula Inspector**.
- **What YOUR FRIEND Says to Sir:** *"To make our Intelligence module truly unique, we built three white-box tools. First is this **Counterfactual 'What-If' Skill Simulator**—watch how toggling missing skills immediately recalculates Aarav's match percentage and shows a Before-vs-After table across companies."*
- **Behind the Scenes (Friend Explains):** *"Below that, the **Resume Proof Audit** cross-checks every skill in his Skills section against his project descriptions to separate **Project-Verified Skills** from **Declared-Only Claims**, and the **Formula Inspector** exposes the exact 5-pillar linear equation (`0.25 E + 0.30 S + 0.20 A + 0.15 R + 0.10 T`)."*

## Scene 7: Live Web + Capability AI Voice Mock Interview Studio (2 Minutes)
- **What YOU Do on Screen:** In the **AI Voice Mock Interview Studio** (inside **Intelligence** or an opportunity's drawer), click **Start Live Voice Interview**. Let the AI speak the first question aloud, point out the **Live Web Sourced** citation link, record or type an answer, and click **Evaluate My Answer**.
- **What YOUR FRIEND Says to Sir:** *"Finally, Sir, our **AI Voice Mock Interview Studio** conducts a live voice interview tailored to the target role and Aarav's resume."*
- **Behind the Scenes (Friend Explains):** *"`POST /api/ai/mock-interview` fetches real interview questions live from Hacker News Algolia, Dev.to, StackOverflow, and Tavily (with clickable source URLs) alongside AI-synthesized questions probing Aarav's `NeuroRAG` project and skill gaps, using Web Speech TTS/STT and grading answers across 4 rubric pillars."*

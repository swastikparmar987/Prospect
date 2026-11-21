import os
from .styles import add_h1, add_h2, add_h3, add_p, add_bullet, add_callout_box, add_figure, add_table_data, HEX_IVORY, HEX_LIME, HEX_CHARCOAL, HEX_LAVENDER
from docx.shared import Pt, Inches

ASSETS_DIR = "/Users/pro/Desktop/projects/FRUITWISE/prospect/public/report-assets"

def render_existing_system(doc, html_builder):
    # Word
    add_h1(doc, "9. Existing System and Its Limitations", page_break=True)
    add_h2(doc, "9.1 Traditional Commercial Aggregators")
    add_p(doc, "Commercial job aggregators (LinkedIn, Indeed, Monster, Glassdoor) dominate the modern employment marketplace. While these platforms aggregate millions of job postings, their underlying architectures are fundamentally misaligned with candidate interests. Because these platforms generate revenue from corporate recruiters (via paid job promotions and recruiter seats), their search algorithms prioritize sponsored visibility over candidate qualification alignment. Users are routinely presented with irrelevant listings, sponsored positions outside their technical domain, and positions that have been inactive for weeks.")

    add_h2(doc, "9.2 Enterprise Applicant Tracking Systems (ATS)")
    add_p(doc, "Enterprise hiring workflows rely on automated ATS platforms such as Workday, Taleo, Greenhouse, and Lever. These platforms implement deterministic keyword parsers that scan incoming resumes for specific substrings. This architecture has two fatal limitations:")
    add_bullet(doc, "Zero Semantic Understanding: An applicant who writes \"React.js, Next.js, and Redux Toolkit\" may be disqualified by an ATS configured to filter specifically for \"Frontend State Management Architecture\" because the exact lexical tokens do not align.", "False Negatives: ")
    add_bullet(doc, "Exploitation via Keyword Stuffing: Unqualified candidates who paste hidden white-text keyword blocks into their documents routinely bypass early filters, flooding recruiter queues with unqualified applicants.", "False Positives: ")

    add_h2(doc, "9.3 Generic AI Career Coaches & Copilots")
    add_p(doc, "Recent generative AI tools (such as ChatGPT-based resume reviewers or wrapper career extensions) attempt to offer career advice. However, these tools operate in complete isolation from live market demand. They generate superficial, highly generic recommendations (\"Use more action verbs\", \"Highlight leadership\") without understanding the technical nuances of specific job requisitions, and they frequently hallucinate skills or qualifications that the candidate does not possess.")

    add_h2(doc, "9.4 Comparative Evaluation Matrix")
    add_p(doc, "Table 1 presents a systematic architectural comparison between existing systems and the proposed Prospect platform across core technical dimensions:")

    headers = ["Evaluation Dimension", "Commercial Job Portals", "Enterprise ATS Tools", "Generic AI Wrappers", "Prospect Platform"]
    rows = [
        ["Core Orientation", "Employer / Paid Ads", "Recruiter Filtering", "Generic Chatbot", "Candidate Intelligence"],
        ["Resume Parsing", "Basic form autofill", "Strict keyword regex", "Plaintext LLM prompt", "Dual-Stream + Provenance"],
        ["Opportunity Sourcing", "Monetized single silo", "Closed enterprise silo", "None (Static/Fake)", "Live Multi-Source Feeds"],
        ["Scoring Mechanism", "Opaque percentage", "Binary keyword filter", "Vague text review", "Explainable 5-Pillar Score"],
        ["Semantic IR", "Exact substring search", "Exact substring search", "Unstructured chat", "128D Embeddings + BM25"],
        ["Skill Gap Remediation", "None provided", "None (Silent reject)", "Generic advice", "Project-Anchored Deliverables"],
        ["Voice Simulation", "None", "None", "Isolated mock prompts", "Live Web-Augmented Audio"],
        ["Data Integrity Policy", "Stale listings common", "Internal proprietary", "Frequent hallucinations", "Strict No-Mock-Data Rule"]
    ]
    widths = [1.5, 1.2, 1.2, 1.3, 1.6]
    add_table_data(doc, headers, rows, widths)

    # HTML
    html_builder.add_h1("9. Existing System and Its Limitations", page_break=True)
    html_builder.add_h2("9.1 Traditional Commercial Aggregators")
    html_builder.add_p("Commercial job aggregators (LinkedIn, Indeed, Monster, Glassdoor) dominate the modern employment marketplace. While these platforms aggregate millions of job postings, their underlying architectures are fundamentally misaligned with candidate interests. Because these platforms generate revenue from corporate recruiters (via paid job promotions and recruiter seats), their search algorithms prioritize sponsored visibility over candidate qualification alignment. Users are routinely presented with irrelevant listings, sponsored positions outside their technical domain, and positions that have been inactive for weeks.")

    html_builder.add_h2("9.2 Enterprise Applicant Tracking Systems (ATS)")
    html_builder.add_p("Enterprise hiring workflows rely on automated ATS platforms such as Workday, Taleo, Greenhouse, and Lever. These platforms implement deterministic keyword parsers that scan incoming resumes for specific substrings. This architecture has two fatal limitations:")
    html_builder.start_bullet_list()
    html_builder.add_bullet("An applicant who writes \"React.js, Next.js, and Redux Toolkit\" may be disqualified by an ATS configured to filter specifically for \"Frontend State Management Architecture\" because the exact lexical tokens do not align.", "False Negatives: ")
    html_builder.add_bullet("Unqualified candidates who paste hidden white-text keyword blocks into their documents routinely bypass early filters, flooding recruiter queues with unqualified applicants.", "False Positives: ")
    html_builder.end_bullet_list()

    html_builder.add_h2("9.3 Generic AI Career Coaches & Copilots")
    html_builder.add_p("Recent generative AI tools attempt to offer career advice. However, these tools operate in complete isolation from live market demand. They generate superficial, highly generic recommendations without understanding the technical nuances of specific job requisitions, and they frequently hallucinate skills or qualifications that the candidate does not possess.")

    html_builder.add_h2("9.4 Comparative Evaluation Matrix")
    html_builder.add_p("Table 1 presents a systematic architectural comparison between existing systems and the proposed Prospect platform across core technical dimensions:")
    html_builder.add_table(headers, rows)

def render_proposed_system(doc, html_builder):
    # Word
    add_h1(doc, "10. Proposed System", page_break=False)
    add_h2(doc, "10.1 The Candidate-Centric Philosophy")
    add_p(doc, "PROSPECT fundamentally flips the recruitment paradigm by creating a transparent, candidate-owned intelligence layer. Instead of allowing candidates to remain passive consumers of opaque job feeds, Prospect equips applicants with the exact same diagnostic and scoring rigor that advanced recruitment algorithms utilize, while completely eliminating commercial monetization biases.")

    add_h2(doc, "10.2 Deterministic-Semantic Hybrid Architecture")
    add_p(doc, "Prospect resolves the tension between brittle keyword matching and ungrounded LLM hallucinations by enforcing a strict hybrid pipeline. Deterministic parsers extract verifiable text streams, timestamps, and section boundaries directly from PDF/DOCX binaries. Extracted entities are then grounded through bidirectional provenance pointers before being projected into a 128-dimensional locality-sensitive vector space (prospect-semantic-embed-v1-128d) for dense conceptual alignment.")

    add_h2(doc, "10.3 Multi-Source Real-Time Aggregation & Freshness")
    add_p(doc, "Rather than relying on closed employer uploads or static mock datasets, Prospect deploys parallel connectors across live public APIs and developer portals. Real-time deduplication and strict 14-day freshness cutoffs guarantee that opportunities presented to the candidate represent authentic, actively hiring software teams.")

    add_h2(doc, "10.4 The Explainable 5-Pillar Scoring Formulation")
    add_p(doc, "Match relevance is computed through a deterministic, transparent linear combination of five independent evaluation pillars:")
    add_p(doc, "Overall Score = 0.25 * Experience + 0.30 * Skills + 0.20 * Alignment + 0.15 * Role + 0.10 * Trajectory", bold_prefix="Mathematical Formulation: ")
    add_p(doc, "Each pillar is individually inspectable in the user interface, providing candidates with complete clarity regarding their strengths and areas of deficiency.")

    add_h2(doc, "10.5 Project-Anchored Preparation & Voice Probing")
    add_p(doc, "When qualification deficits are diagnosed, Prospect does not issue generic textbook suggestions. It synthesizes targeted software deliverables anchored directly to the candidate's existing projects, simulates the score improvements via counterfactual analysis, and conducts interactive voice mock interviews using live technical queries.")

    # HTML
    html_builder.add_h1("10. Proposed System", page_break=False)
    html_builder.add_h2("10.1 The Candidate-Centric Philosophy")
    html_builder.add_p("PROSPECT fundamentally flips the recruitment paradigm by creating a transparent, candidate-owned intelligence layer. Instead of allowing candidates to remain passive consumers of opaque job feeds, Prospect equips applicants with the exact same diagnostic and scoring rigor that advanced recruitment algorithms utilize, while completely eliminating commercial monetization biases.")

    html_builder.add_h2("10.2 Deterministic-Semantic Hybrid Architecture")
    html_builder.add_p("Prospect resolves the tension between brittle keyword matching and ungrounded LLM hallucinations by enforcing a strict hybrid pipeline. Deterministic parsers extract verifiable text streams, timestamps, and section boundaries directly from PDF/DOCX binaries. Extracted entities are then grounded through bidirectional provenance pointers before being projected into a 128-dimensional locality-sensitive vector space (prospect-semantic-embed-v1-128d) for dense conceptual alignment.")

    html_builder.add_h2("10.3 Multi-Source Real-Time Aggregation & Freshness")
    html_builder.add_p("Rather than relying on closed employer uploads or static mock datasets, Prospect deploys parallel connectors across live public APIs and developer portals. Real-time deduplication and strict 14-day freshness cutoffs guarantee that opportunities presented to the candidate represent authentic, actively hiring software teams.")

    html_builder.add_h2("10.4 The Explainable 5-Pillar Scoring Formulation")
    html_builder.add_p("Match relevance is computed through a deterministic, transparent linear combination of five independent evaluation pillars:")
    html_builder.add_p("Overall Score = 0.25 * Experience + 0.30 * Skills + 0.20 * Alignment + 0.15 * Role + 0.10 * Trajectory", bold_prefix="Mathematical Formulation: ")
    html_builder.add_p("Each pillar is individually inspectable in the user interface, providing candidates with complete clarity regarding their strengths and areas of deficiency.")

    html_builder.add_h2("10.5 Project-Anchored Preparation & Voice Probing")
    html_builder.add_p("When qualification deficits are diagnosed, Prospect does not issue generic textbook suggestions. It synthesizes targeted software deliverables anchored directly to the candidate's existing projects, simulates the score improvements via counterfactual analysis, and conducts interactive voice mock interviews using live technical queries.")

def render_product_overview(doc, html_builder):
    # Word
    add_h1(doc, "11. Product Overview", page_break=False)
    add_h2(doc, "11.1 End-to-End User Journey")
    add_p(doc, "The operational workflow of Prospect is structured into five cohesive phases designed to guide a candidate from initial profile ingestion to application tracking:")
    add_bullet(doc, "The candidate uploads a PDF or DOCX resume. Prospect extracts text streams, parses structured entities (experience, education, skills, projects), anchors provenance, and renders an interactive baseline profile.", "Phase 1 (Resume Ingestion): ")
    add_bullet(doc, "Prospect expands candidate role intent into expanded search concepts, querying live external providers in parallel. Listings are normalized, deduplicated, and filtered for freshness.", "Phase 2 (Opportunity Discovery): ")
    add_bullet(doc, "Each opportunity is evaluated against the candidate's profile using the hybrid 128D embedding and BM25 scoring engine, generating transparent 5-pillar scores.", "Phase 3 (Evaluation & Ranking): ")
    add_bullet(doc, "The candidate selects a target role. Prospect computes the exact set-difference skill gap, suggests project-anchored code deliverables, rescores with What-If simulations, and launches Voice AI mock interviews.", "Phase 4 (Preparation Studio): ")
    add_bullet(doc, "The candidate tracks application lifecycles across a Kanban board with event logs, status updates, and note-taking.", "Phase 5 (Application Tracking): ")

    add_h2(doc, "11.2 The Five Core Functional Pillars")
    add_p(doc, "Prospect's interface is architected around five modular workspaces:")
    add_bullet(doc, "Landing Hub: Marketing overview, architecture diagrams, and quick onboarding.", "1. ")
    add_bullet(doc, "Profile & Resume Intelligence: Document upload, entity verification, and skill clustering.", "2. ")
    add_bullet(doc, "Live Opportunity Discovery: Multi-source real-time search, filters, and 5-pillar score cards.", "3. ")
    add_bullet(doc, "Preparation Studio: Gap remediation roadmaps, What-If simulator, and Voice AI Studio.", "4. ")
    add_bullet(doc, "Application Lifecycle Tracker: Interactive Kanban board tracking status from Wishlist to Offer.", "5. ")

    # HTML
    html_builder.add_h1("11. Product Overview", page_break=False)
    html_builder.add_h2("11.1 End-to-End User Journey")
    html_builder.add_p("The operational workflow of Prospect is structured into five cohesive phases designed to guide a candidate from initial profile ingestion to application tracking:")
    html_builder.start_bullet_list()
    html_builder.add_bullet("The candidate uploads a PDF or DOCX resume. Prospect extracts text streams, parses structured entities, anchors provenance, and renders an interactive baseline profile.", "Phase 1 (Resume Ingestion): ")
    html_builder.add_bullet("Prospect expands candidate role intent into expanded search concepts, querying live external providers in parallel. Listings are normalized, deduplicated, and filtered for freshness.", "Phase 2 (Opportunity Discovery): ")
    html_builder.add_bullet("Each opportunity is evaluated against the candidate's profile using the hybrid 128D embedding and BM25 scoring engine, generating transparent 5-pillar scores.", "Phase 3 (Evaluation & Ranking): ")
    html_builder.add_bullet("The candidate selects a target role. Prospect computes the exact set-difference skill gap, suggests project-anchored code deliverables, rescores with What-If simulations, and launches Voice AI mock interviews.", "Phase 4 (Preparation Studio): ")
    html_builder.add_bullet("The candidate tracks application lifecycles across a Kanban board with event logs, status updates, and note-taking.", "Phase 5 (Application Tracking): ")
    html_builder.end_bullet_list()

    html_builder.add_h2("11.2 The Five Core Functional Pillars")
    html_builder.add_p("Prospect's interface is architected around five modular workspaces: Landing Hub, Profile & Resume Intelligence, Live Opportunity Discovery, Preparation Studio, and Application Lifecycle Tracker.")

def render_target_users(doc, html_builder):
    # Word
    add_h1(doc, "12. Target Users and Use Cases", page_break=False)
    add_h2(doc, "12.1 Primary User Personas")
    add_bullet(doc, "Undergraduate and graduate students seeking internships and new-grad roles who need to identify exact skill gaps in their academic coursework compared to commercial job requirements.", "1. University Computer Science Students: ")
    add_bullet(doc, "Software engineers with 1–3 years of experience seeking to transition from monolithic architectures or legacy frameworks to modern cloud-native (Next.js, Go, Kubernetes) stacks.", "2. Early-Career Engineers: ")
    add_bullet(doc, "Data analysts and backend engineers aiming to transition into Applied Machine Learning and MLOps, requiring concrete project roadmaps to prove domain competence.", "3. Career Transitioners & Stack Pivots: ")

    add_h2(doc, "12.2 Detailed Use Case Walkthroughs")
    add_p(doc, "Use Case A: Full-Stack Engineer Pivoting to Distributed Systems", bold_prefix="Scenario 1: ")
    add_p(doc, "A candidate with 2 years of Node.js experience uploads a resume. Prospect extracts JavaScript, Node.js, and Express. The candidate searches for Backend Distributed Systems roles. Prospect discovers open Go/gRPC roles at high-growth startups, calculating a 64% match score with high Role Relevance (85%) but low Skill Overlap (45%). The Preparation Studio diagnoses missing concepts (Go concurrency, gRPC, Protobuf) and generates a concrete deliverable: \"Refactor your existing Node.js API gateway to a Go-based gRPC proxy using goroutines.\" The candidate runs a What-If simulation: adding Go and gRPC elevates the projected match score to 86%.")

    add_p(doc, "Use Case B: New Graduate Preparing for Voice AI Interviews", bold_prefix="Scenario 2: ")
    add_p(doc, "A student applies for an AI Infrastructure role. In the Preparation Studio, the student opens the Voice AI Mock Interview Studio. Prospect fetches recent discussions from Hacker News and technical articles from Dev.to on LLM latency and quantization. The voice interviewer speaks realistic architectural questions through browser speech synthesis. The student speaks their answer into their microphone; speech recognition captures the response, and Prospect evaluates technical accuracy against live ground-truth documentation.")

    # HTML
    html_builder.add_h1("12. Target Users and Use Cases", page_break=False)
    html_builder.add_h2("12.1 Primary User Personas")
    html_builder.start_bullet_list()
    html_builder.add_bullet("Undergraduate and graduate students seeking internships and new-grad roles who need to identify exact skill gaps in their academic coursework compared to commercial job requirements.", "1. University Computer Science Students: ")
    html_builder.add_bullet("Software engineers with 1–3 years of experience seeking to transition to modern cloud-native stacks.", "2. Early-Career Engineers: ")
    html_builder.add_bullet("Data analysts and backend engineers aiming to transition into Applied Machine Learning and MLOps.", "3. Career Transitioners: ")
    html_builder.end_bullet_list()

    html_builder.add_h2("12.2 Detailed Use Case Walkthroughs")
    html_builder.add_p("A candidate with 2 years of Node.js experience uploads a resume. Prospect extracts JavaScript, Node.js, and Express. The candidate searches for Backend Distributed Systems roles. Prospect discovers open Go/gRPC roles at high-growth startups, calculating a 64% match score with high Role Relevance (85%) but low Skill Overlap (45%). The Preparation Studio diagnoses missing concepts (Go concurrency, gRPC, Protobuf) and generates a concrete deliverable: \"Refactor your existing Node.js API gateway to a Go-based gRPC proxy using goroutines.\" The candidate runs a What-If simulation: adding Go and gRPC elevates the projected match score to 86%.", bold_prefix="Scenario 1 (Stack Pivot): ")
    html_builder.add_p("A student applies for an AI Infrastructure role. In the Preparation Studio, the student opens the Voice AI Mock Interview Studio. Prospect fetches recent discussions from Hacker News and technical articles from Dev.to on LLM latency and quantization. The voice interviewer speaks realistic architectural questions through browser speech synthesis. The student speaks their answer into their microphone; speech recognition captures the response, and Prospect evaluates technical accuracy against live ground-truth documentation.", bold_prefix="Scenario 2 (Voice AI Mock Interview): ")

def render_system_architecture(doc, html_builder):
    # Word
    add_h1(doc, "13. System Architecture", page_break=True)
    add_h2(doc, "13.1 High-Level Architecture Overview")
    add_p(doc, "Prospect is engineered as a modern, decoupled web architecture comprising five primary operational layers: the Presentation Layer (Next.js 15 Client & Server Components), the API Gateway & Route Handler Layer, the Core Intelligence & Information Retrieval Engine, the Multi-Source Discovery Service, and the Relational Persistence Layer (Prisma ORM with SQLite/PostgreSQL).")

    # Embed Figure 1 immediately below 13.1
    diag_path = os.path.join(ASSETS_DIR, "diagram-system-architecture.png")
    add_figure(doc, diag_path, "Figure 1: High-Level System Architecture of Prospect across Presentation, API, Intelligence, Discovery, and Database Layers.")

    add_h2(doc, "13.2 The Five Architectural Layers")
    add_bullet(doc, "Presentation Layer (React 19 / Next.js 15): Implements reactive workspaces for Resume Ingestion, Live Opportunity Discovery, Preparation Studio, and Application Tracking. Built with Tailwind CSS and Lucide icons.", "1. ")
    add_bullet(doc, "API Gateway & Server Route Handlers: Type-safe RESTful API endpoints handling multipart resume uploads, live provider orchestration, scoring requests, preparation plans, and voice interview telemetry.", "2. ")
    add_bullet(doc, "Core Intelligence Engine: Contains deterministic parsers (pdf-parse, mammoth), regex section segmenters, LLM extraction orchestrators (Groq/Gemini), the custom 128D semantic embedding engine, Okapi BM25 ranker, and the 5-pillar scoring calculator.", "3. ")
    add_bullet(doc, "Multi-Source Discovery Service: Dispatches parallel HTTP requests to Tavily Search API, Hacker News Algolia, Dev.to, and remote feeds, followed by normalization, canonical URL deduplication, and 14-day freshness gating.", "4. ")
    add_bullet(doc, "Relational Persistence Layer: Prisma ORM v6 managing 12 relational models supporting SQLite in local development and PostgreSQL in production.", "5. ")

    # HTML
    html_builder.add_h1("13. System Architecture", page_break=True)
    html_builder.add_h2("13.1 High-Level Architecture Overview")
    html_builder.add_p("Prospect is engineered as a modern, decoupled web architecture comprising five primary operational layers: the Presentation Layer (Next.js 15 Client & Server Components), the API Gateway & Route Handler Layer, the Core Intelligence & Information Retrieval Engine, the Multi-Source Discovery Service, and the Relational Persistence Layer (Prisma ORM with SQLite/PostgreSQL).")

    html_builder.add_figure(diag_path, "Figure 1: High-Level System Architecture of Prospect across Presentation, API, Intelligence, Discovery, and Database Layers.")

    html_builder.add_h2("13.2 The Five Architectural Layers")
    html_builder.start_bullet_list()
    html_builder.add_bullet("Presentation Layer (React 19 / Next.js 15): Implements reactive workspaces for Resume Ingestion, Live Opportunity Discovery, Preparation Studio, and Application Tracking.", "1. ")
    html_builder.add_bullet("API Gateway & Server Route Handlers: Type-safe RESTful API endpoints handling multipart resume uploads, live provider orchestration, scoring requests, preparation plans, and voice interview telemetry.", "2. ")
    html_builder.add_bullet("Core Intelligence Engine: Contains deterministic parsers, regex section segmenters, LLM extraction orchestrators, the custom 128D semantic embedding engine, Okapi BM25 ranker, and the 5-pillar scoring calculator.", "3. ")
    html_builder.add_bullet("Multi-Source Discovery Service: Dispatches parallel HTTP requests to live providers, followed by normalization, canonical URL deduplication, and 14-day freshness gating.", "4. ")
    html_builder.add_bullet("Relational Persistence Layer: Prisma ORM v6 managing 12 relational models supporting SQLite in local development and PostgreSQL in production.", "5. ")
    html_builder.end_bullet_list()

def render_tech_stack(doc, html_builder):
    # Word
    add_h1(doc, "14. Technology Stack", page_break=True)
    add_p(doc, "Prospect's technology stack is deliberately curated for high developer velocity, type safety, low latency, and robust offline-first fallback capabilities:")

    headers = ["Component Layer", "Technology / Framework", "Version", "Role & Architectural Justification"]
    rows = [
        ["Frontend Framework", "Next.js (App Router)", "15.0.2", "Hybrid React Server Components and client-side reactive rendering."],
        ["UI Runtime", "React", "19.0.0-rc", "Underlying virtual DOM with concurrent transitions and streaming SSR."],
        ["Styling System", "Tailwind CSS", "3.4.14", "Utility-first CSS framework configured with Prospect's custom color palette."],
        ["Typography & Icons", "Lucide React", "0.454.0", "Tree-shakable SVG icon set for intuitive visual affordances."],
        ["Backend Runtime", "Node.js (Next API)", "20.x LTS", "High-throughput asynchronous non-blocking event loop execution."],
        ["Database Layer", "SQLite / PostgreSQL", "3.x / 16.x", "Zero-configuration local SQLite development with seamless PostgreSQL migration."],
        ["ORM", "Prisma ORM", "6.4.1", "Type-safe database client, declarative schema migrations, and relational joins."],
        ["Document Parsing", "pdf-parse & mammoth", "1.1.1 / 1.8.0", "Binary stream text extraction for PDF and DOCX files with pure ZIP XML fallback."],
        ["Natural Language LLMs", "Groq Llama-3.3-70B / Gemini", "Latest API", "High-throughput structured schema extraction and contextual synthesis."],
        ["Semantic Embeddings", "Custom Local 128D Model", "v1-128d", "Locality-sensitive 128D dense vector space operating at zero API cost."],
        ["Lexical Search", "Custom Okapi BM25", "v1.0", "Probabilistic document relevance scoring with saturation and length norm."],
        ["Web Intelligence", "Tavily Search API", "v1 REST", "Real-time live search queries for engineering job openings."],
        ["Community Feeds", "Hacker News & Dev.to", "Algolia / Public", "Direct API integration for developer-centric hiring posts."],
        ["Voice Interaction", "Web Speech API", "Browser Native", "Native speech synthesis and continuous speech recognition."]
    ]
    widths = [1.2, 1.4, 0.8, 3.2]
    add_table_data(doc, headers, rows, widths)

    # HTML
    html_builder.add_h1("14. Technology Stack", page_break=True)
    html_builder.add_p("Prospect's technology stack is deliberately curated for high developer velocity, type safety, low latency, and robust offline-first fallback capabilities:")
    html_builder.add_table(headers, rows)

print("Part 2 sections module updated.")

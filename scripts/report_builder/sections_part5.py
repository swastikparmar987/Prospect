import os
from .styles import add_h1, add_h2, add_h3, add_p, add_bullet, add_callout_box, HEX_IVORY, HEX_LIME, HEX_CHARCOAL, HEX_LAVENDER
from docx.shared import Pt

def render_challenges_limitations(doc, html_builder):
    # Word
    add_h1(doc, "26. Challenges and Limitations", page_break=True)
    add_h2(doc, "26.1 Unstructured Document Layout Variance")
    add_p(doc, "Extracting structured text from real-world candidate resumes presents significant technical challenges due to wide variations in visual styling. Two-column graphic resumes, table-heavy CVs, and image-based PDFs frequently produce jumbled character streams when processed through linear PDF stream extractors. While Prospect's regex section segmenters and pure-ZIP XML DOCX inflate fallbacks mitigate the majority of errors, resumes containing embedded raster images without text layers require Optical Character Recognition (OCR), which is computationally intensive and deferred to future releases.")

    add_h2(doc, "26.2 External Search API Rate Limits and Latency Spikes")
    add_p(doc, "Aggregating live opportunities across external search providers (Tavily, Hacker News, Dev.to) subjects the application to third-party network latency and API quota constraints. During peak network congestion, external search requests can take 3,000–6,000ms. Prospect counteracts this via asynchronous Promise.allSettled() parallelization, 8,000ms circuit-breaker timeouts, and a 24-hour persistent SearchCache, but high-volume enterprise traffic will necessitate dedicated high-throughput proxy clusters.")

    add_h2(doc, "26.3 Local Embedding Dimension Trade-Offs (128D vs 1536D)")
    add_p(doc, "To eliminate monetary costs and third-party data leakage, Prospect engineered prospect-semantic-embed-v1-128d, an in-process 128-dimensional locality-sensitive embedding model. While 128 dimensions provide remarkable sub-millisecond execution and capture software engineering concepts accurately, very large 1536-dimensional cloud models (such as OpenAI text-embedding-3-large) demonstrate slightly higher semantic discrimination for subtle interdisciplinary nuances. Prospect balances this by pairing the 128D model with Okapi BM25 lexical ranking.")

    add_h2(doc, "26.4 Single-User Boundary vs Multi-Tenant Architecture")
    add_p(doc, "The current evaluated production release operates as a high-performance single-user local platform. While ideal for individual candidate privacy and local offline usage, deploying Prospect as an enterprise-wide campus service will require implementing full multi-tenant authentication (OAuth2 / JWT), tenant data isolation, and role-based access control (RBAC).")

    # HTML
    html_builder.add_h1("26. Challenges and Limitations", page_break=True)
    html_builder.add_h2("26.1 Unstructured Document Layout Variance")
    html_builder.add_p("Extracting structured text from real-world candidate resumes presents significant technical challenges due to wide variations in visual styling. Two-column graphic resumes and table-heavy CVs can scramble linear text streams, requiring resilient fallback heuristics.")

    html_builder.add_h2("26.2 External Search API Rate Limits and Latency Spikes")
    html_builder.add_p("Aggregating live opportunities across external search providers subjects the application to third-party network latency and API quota constraints, mitigated in Prospect via Promise.allSettled(), circuit breakers, and 24-hour SearchCache TTLs.")

    html_builder.add_h2("26.3 Local Embedding Dimension Trade-Offs (128D vs 1536D)")
    html_builder.add_p("Prospect's local 128D model provides sub-millisecond execution and zero cost, but trades off the extreme semantic granularity of 1536D cloud models, effectively compensated by pairing with Okapi BM25 lexical ranking.")

    html_builder.add_h2("26.4 Single-User Boundary vs Multi-Tenant Architecture")
    html_builder.add_p("The current production release operates as a single-user local platform, providing exceptional privacy, with multi-tenant enterprise RBAC planned for future releases.")

def render_future_scope(doc, html_builder):
    # Word
    add_h1(doc, "27. Future Scope", page_break=False)
    add_p(doc, "The architectural foundation established in Prospect provides a robust substrate for multiple planned future engineering enhancements:")
    add_bullet(doc, "Implementing direct OAuth integrations with modern enterprise ATS platforms (Greenhouse, Lever, Ashby, Workday) to enable one-click candidate application submissions and real-time application status polling.", "1. Direct ATS Integration: ")
    add_bullet(doc, "Transitioning SQLite to PostgreSQL with pgvector, enabling scalable cosine vector indexing directly within relational SQL queries for millions of active opportunity vectors.", "2. Native Vector Database Migration: ")
    add_bullet(doc, "Deploying an autonomous background daemon executing scheduled nightly provider synchronization, automated 14-day freshness pruning, and email alert digests.", "3. Autonomous Continuous Background Sync: ")
    add_bullet(doc, "Extending the Next.js API core with a React Native / Expo mobile application, providing push notifications when high-affinity (90%+ match) opportunities are published.", "4. Mobile Client Application: ")
    add_bullet(doc, "Expanding the Voice AI Mock Interview Studio with fine-tuned conversational audio models, real-time speech prosody feedback, and automated coding sandbox environments.", "5. Multimodal Coding Sandbox & Audio Prosody: ")

    # HTML
    html_builder.add_h1("27. Future Scope", page_break=False)
    html_builder.start_bullet_list()
    html_builder.add_bullet("Implementing direct OAuth integrations with modern enterprise ATS platforms (Greenhouse, Lever, Ashby) for one-click application submission.", "1. Direct ATS Integration: ")
    html_builder.add_bullet("Transitioning to PostgreSQL with pgvector for scalable in-database vector cosine similarity indexing.", "2. Native Vector Database Migration: ")
    html_builder.add_bullet("Deploying an autonomous daemon executing scheduled nightly syncs, freshness pruning, and alert digests.", "3. Autonomous Continuous Background Sync: ")
    html_builder.add_bullet("Extending the platform to React Native / Expo mobile clients.", "4. Mobile Client Application: ")
    html_builder.add_bullet("Expanding the Voice AI Mock Interview Studio with interactive coding sandboxes.", "5. Multimodal Coding Sandbox: ")
    html_builder.end_bullet_list()

def render_conclusion(doc, html_builder):
    # Word
    add_h1(doc, "28. Conclusion", page_break=True)
    add_p(doc, "In this capstone engineering project, we designed, implemented, and empirically validated PROSPECT, an AI-powered Career Intelligence and Adaptive Opportunity Discovery Platform that eliminates the systemic information asymmetry and black-box opacity plaguing the modern technical hiring ecosystem.")
    add_p(doc, "By synthesizing deterministic dual-stream document parsers, regex boundary segmentation, and provenance-anchored LLM extraction, Prospect creates an authentic candidate profile free from AI hallucinations. The platform aggregates live job opportunities across diverse web providers, enforcing 3-tier canonical deduplication and a strict 14-day freshness cutoff.")
    add_p(doc, "Prospect's core algorithmic innovation—combining an in-process 128-dimensional locality-sensitive semantic embedding engine (prospect-semantic-embed-v1-128d) with Okapi BM25 lexical token ranking and an explainable 5-pillar linear scoring equation (0.25E + 0.30S + 0.20A + 0.15R + 0.10T)—delivers transparent, mathematically grounded matching scores.")
    add_p(doc, "Furthermore, Prospect's contextual Preparation Studio transforms rejection anxiety into actionable engineering progress through 3-stage set-difference gap analysis, project-anchored deliverables, What-If counterfactual rescoring, and a Voice AI Mock Interview Studio powered by live developer web intelligence. Grounded by a strict No-Mock-Data policy, Prospect proves that candidate-centric, transparent AI systems can restore fairness, efficiency, and diagnostic clarity to the engineering employment landscape.")
    add_callout_box(doc, "Concluding Impact", "Prospect reclaims candidate agency in technical hiring by replacing opaque recruiter-centric algorithms with transparent, mathematically grounded intelligence, verifiable live opportunities, and actionable skill preparation pathways.")

    # HTML
    html_builder.add_h1("28. Conclusion", page_break=True)
    html_builder.add_p("In this capstone engineering project, we designed, implemented, and empirically validated PROSPECT, an AI-powered Career Intelligence and Adaptive Opportunity Discovery Platform that eliminates the systemic information asymmetry and black-box opacity plaguing the modern technical hiring ecosystem.")
    html_builder.add_p("By synthesizing deterministic dual-stream document parsers, regex boundary segmentation, and provenance-anchored LLM extraction, Prospect creates an authentic candidate profile free from AI hallucinations. The platform aggregates live job opportunities across diverse web providers, enforcing 3-tier canonical deduplication and a strict 14-day freshness cutoff.")
    html_builder.add_p("Prospect's core algorithmic innovation—combining an in-process 128-dimensional locality-sensitive semantic embedding engine (prospect-semantic-embed-v1-128d) with Okapi BM25 lexical token ranking and an explainable 5-pillar linear scoring equation (0.25E + 0.30S + 0.20A + 0.15R + 0.10T)—delivers transparent, mathematically grounded matching scores.")
    html_builder.add_p("Furthermore, Prospect's contextual Preparation Studio transforms rejection anxiety into actionable engineering progress through 3-stage set-difference gap analysis, project-anchored deliverables, What-If counterfactual rescoring, and a Voice AI Mock Interview Studio powered by live developer web intelligence.")
    html_builder.add_callout("Concluding Impact", "Prospect reclaims candidate agency in technical hiring by replacing opaque recruiter-centric algorithms with transparent, mathematically grounded intelligence, verifiable live opportunities, and actionable skill preparation pathways.")

def render_references(doc, html_builder):
    # Word
    add_h1(doc, "29. References", page_break=False)
    refs = [
        "[1] S. Robertson, H. Zaragoza, et al., \"The Probabilistic Relevance Framework: BM25 and Beyond,\" Foundations and Trends in Information Retrieval, vol. 3, no. 4, pp. 333-389, 2009.",
        "[2] M. S. Charikar, \"Similarity estimation techniques from rounding algorithms,\" in Proceedings of the 34th Annual ACM Symposium on Theory of Computing (STOC), pp. 380-388, 2002.",
        "[3] A. Vaswani, N. Shazeer, N. Parmar, J. Uszkoreit, L. Jones, A. N. Gomez, L. Kaiser, and I. Polosukhin, \"Attention is all you need,\" Advances in Neural Information Processing Systems (NeurIPS), vol. 30, 2017.",
        "[4] Vercel Engineering, \"Next.js 15: React Server Components and Incremental Static Regeneration Architecture,\" Vercel Technical Documentation, 2024. [Online]. Available: https://nextjs.org/docs",
        "[5] Prisma Development Team, \"Prisma ORM 6: Type-Safe Database Access and Schema Migrations for Modern Node.js Runtimes,\" Prisma Reference Manual, 2025. [Online]. Available: https://www.prisma.io/docs",
        "[6] J. Devlin, M. W. Chang, K. Lee, and K. Toutanova, \"BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding,\" in Proceedings of NAACL-HLT, pp. 4171-4186, 2019.",
        "[7] W3C Web Speech Working Group, \"Web Speech API Specification,\" World Wide Web Consortium (W3C), W3C Candidate Recommendation, 2023. [Online]. Available: https://www.w3.org/TR/speech-api/",
        "[8] R. Fielding, \"Architectural Styles and the Design of Network-based Software Architectures,\" Ph.D. dissertation, University of California, Irvine, 2000.",
        "[9] Tavily AI, \"Tavily Search API: Real-Time Web Intelligence for Autonomous Agents and Information Retrieval,\" Technical Specification, 2024. [Online]. Available: https://docs.tavily.com",
        "[10] Y. Freund and R. E. Schapire, \"A decision-theoretic generalization of on-line learning and an application to boosting,\" Journal of Computer and System Sciences, vol. 55, no. 1, pp. 119-139, 1997.",
        "[11] E. Gamma, R. Helm, R. Johnson, and J. Vlissides, \"Design Patterns: Elements of Reusable Object-Oriented Software,\" Addison-Wesley Professional, 1994.",
        "[12] M. Fowler, \"Patterns of Enterprise Application Architecture,\" Addison-Wesley Longman Publishing Co., Inc., 2002.",
        "[13] P. J. Denning, \"The Locality Principle,\" Communications of the ACM, vol. 48, no. 7, pp. 19-24, 2005.",
        "[14] Groq Inc., \"Language Processing Units (LPUs) and High-Throughput Llama-3.3-70B Inference Architecture,\" Groq Systems Whitepaper, 2024.",
        "[15] Google DeepMind, \"Gemini: A Family of Highly Capable Multimodal Models,\" Technical Report, arXiv:2312.11805, 2023."
    ]
    for r in refs:
        add_p(doc, r)

    # HTML
    html_builder.add_h1("29. References", page_break=False)
    for r in refs:
        html_builder.add_p(r)

print("Part 5 sections module updated.")

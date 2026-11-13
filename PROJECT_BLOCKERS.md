# PROJECT PROSPECT: EXTERNAL DEPENDENCIES & BLOCKERS LOG

**Last Updated:** 2026-11-10  
**Status:** Zero blocking technical impediments for the November 12, 2026 class presentation or local/cloud deployment.

---

## 1. External Platform Access Restrictions & Authorized Mitigations

| Provider / Platform | External Constraint | Prospect Permitted Implementation & Honest UX |
|---|---|---|
| **Browser Geolocation & Reverse Geocoding** | Browser GPS requires user permission (`navigator.geolocation`) and HTTPS/localhost; OpenStreetMap Nominatim may be rate-limited or offline in restricted campus networks. | **Implemented:**<br>1. Clear permission prompt in the Location Intelligence Bar.<br>2. OpenStreetMap Nominatim reverse geocoding with automatic fallback to 36 verified city hub centroids within 35 km.<br>3. Privacy-preserving storage of city centroids (never raw 6-decimal GPS coordinates).<br>4. Honest error banner + 1-click manual city selector when permission is denied, unavailable, or geocoding fails. Never pretends location was detected when it was not. |
| **LinkedIn & Naukri** | Unauthenticated guest HTML scraping violates platform terms and is blocked by anti-bot walls / CAPTCHAs. | **Implemented:**<br>1. Zero unauthenticated scraping.<br>2. Pre-populated authorized deep-search handoff links in the Connected Career Sources Modal.<br>3. SSRF-safe Direct Job URL Import (`/api/opportunities/import-url`) extracting Schema.org `JobPosting` JSON-LD and OpenGraph metadata. |
| **Official Company Career Boards (Greenhouse, Lever, Ashby)** | Public JSON endpoints enforce per-IP rate limits and cover participating employers rather than the entire global web. | **Implemented:**<br>1. Expanded to 16 participating tech/AI boards (Anthropic, Scale AI, Stripe, Linear, Modal, Weights & Biases, Databricks, Figma, Vercel, Cloudflare, Duolingo, Discord, Pinterest, Retool, Together AI, Perplexity).<br>2. Configurable search budgets, concurrency caps, response caching, retry backoff, and round-based board rotation. |
| **LLM API Keys (`GROQ_API_KEY` / `GEMINI_API_KEY`)** | Live LLM calls depend on valid API keys and provider rate limits. | **Implemented:**<br>1. Multi-model fallback chain (`qwen/qwen3.8-27b` -> `openai/gpt-oss-120b` -> `openai/gpt-oss-20b` -> Gemini).<br>2. When no API key is configured, the UI displays an explicit `AI Provider Not Configured` notice while keeping deterministic 128-D semantic embeddings (`prospect-semantic-embed-v1-128d`) and evidence-grounded skill gap plans active. Never fabricates AI output. |
| **Supervised ML Ranking Model vs. Semantic Embedding Retrieval** | No historical labeled hiring-outcome dataset exists prior to user deployment. | **Implemented:**<br>1. Uses a real 128-D L2-normalized semantic embedding engine (`prospect-semantic-embed-v1-128d`) + explainable hybrid scoring.<br>2. Explicitly discloses in the AI Intelligence Lab that this is semantic vector retrieval + hybrid scoring rather than a supervised model trained on hiring outcomes.<br>3. Persists user feedback signals (`SAVE`, `MARK_RELEVANT`, `MARK_NOT_RELEVANT`, `MARK_APPLIED`) and computes live `Precision@K`, `Recall@K`, and `NDCG@K` metrics. |

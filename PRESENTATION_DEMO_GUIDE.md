# PROSPECT: CLASS PRESENTATION & LIVE DEMO GUIDE
**Presentation Date:** November 12, 2026  
**Objective:** Demonstrate Prospect as a Dynamic AI Career Discovery Agent with Location Intelligence, Live Multi-Round Adaptive Search, Semantic Embeddings, and Evidence-Grounded AI Matching.

---

## 1. Pre-Presentation Quick Start (2 Minutes Before Presenting)

1. **Start the Application Server:**
   ```bash
   cd /Users/pro/Desktop/projects/FRUITWISE/prospect
   npm run dev
   ```
   *(Or run `npm start` for the pre-built production server on `http://localhost:3000`.)*

2. **Verify System Readiness:**
   - Open `http://localhost:3000/api/status` in a browser tab or run `curl http://localhost:3000/api/status` to confirm `LIVE_MODE` is active, providers are healthy, and the Persistent Scheduler ledger is online.

---

## 2. Step-by-Step Live Evaluator Walkthrough (16-Point Rubric Flow)

### Step 1 — Resume Intelligence & Fact Provenance (2 mins)
1. Open `http://localhost:3000` and navigate to **Profile** (or upload a PDF/DOCX resume via **Upload Resume**).
2. Point out how Prospect extracts **Skills**, **Experience**, **Academic Projects**, **Education/Graduation Year**, and **Career Directions** with explicit `RESUME_DERIVED` provenance badges and confidence flags—never inventing missing GPA or phone fields.

### Step 2 — Location Intelligence & Permission Flow (2 mins)
1. Navigate to **Discover**. At the top of the page, highlight the **Location Intelligence Bar**.
2. Click **"Detect My Location"**:
   - Grant browser geolocation permission (`navigator.geolocation`).
   - Show how Prospect resolves your coordinates to a city/region (e.g., `Bengaluru, Karnataka, India`) via reverse geocoding and stores only the **city centroid** (never raw 6-decimal GPS coordinates).
3. Click **"Change City"** to demonstrate manual location editing (or show how denied permission / offline geocoding is reported honestly without pretending location was detected).
4. Click through the **7 Location Discovery Mode Pills**:
   - `All Locations`
   - `Jobs Near Me` (uses real Haversine distance `km away` ONLY when both user city coordinates and job coordinates exist)
   - `In My City`
   - `Remote Jobs`
   - `Hybrid Jobs`
   - `Onsite Jobs`
   - `Selected City` (pick any global hub such as `San Francisco`, `London`, `Bengaluru`, `Hyderabad`, or `New York`)

### Step 3 — Live Multi-Round Adaptive Discovery & Activity Panel (3 mins)
1. In the **Live Discovery Activity Panel** on the Discover page, click **"Budget & Limits"** to show the configurable search budget controls:
   - `Max Rounds` (1–5)
   - `Queries / Round` (1–6)
   - `Results / Provider` (5–50)
   - `Stop on Low Marginal Yield` threshold
2. Click **"Run Adaptive Discovery"** (or **"Expand Search"**):
   - Point out the **12 real-time pipeline stages** lighting up from actual backend execution:
     1. `Candidate profile loaded`
     2. `Candidate capabilities extracted`
     3. `Location resolved`
     4. `Role families generated`
     5. `Search queries planned`
     6. `Providers contacted` (16 official Greenhouse, Lever, and Ashby boards + FreeHire + Tavily)
     7. `Results retrieved`
     8. `Duplicates removed`
     9. `Eligibility checked`
     10. `Opportunities ranked`
     11. `Search expanded`
     12. `Search completed`
   - Highlight the live telemetry counters: **Raw Results**, **Unique Evaluated**, **Duplicates Removed**, **Elapsed Time**, **Search Round**, and **Stop Reason** (plus the **Cancel** button wired to `AbortController`).

### Step 4 — Dynamic Personalization & Opportunity Card Controls (2 mins)
1. Point out the **Personalized Discovery Summary Banner** above the feed (e.g., *"Found X relevant opportunities in your preferred locations. Y strongly match your demonstrated Python, PyTorch..."*—computed 100% from actual search results).
2. On any Opportunity Card, highlight:
   - **`NEW` / `UPDATED` Freshness Badge** and retrieval timestamp
   - **Employment Type** (`Internship`, `Entry-level`, `Fellowship`, `Research`)
   - **Coordinate-verified distance badge** (`X km away`) when coordinates exist
   - **`Semantic: X%` Cosine Similarity Badge** + **Hybrid Score** (`APPLY NOW`, `PREPARE FIRST`, `KEEP WATCHING`, `SKIP`)
   - **AI Match Explanation** callout
3. Click the three quick-action buttons on a card:
   - **Inspect Matching** (opens the Match & Eligibility breakdown + **Run Deep AI Matching** button)
   - **View Missing Skills** (opens the Skill Gap Intelligence & Preparation Path tab)
   - **View Evidence** (opens verified source URLs, snippets, and freshness verification)

### Step 5 — AI Intelligence Lab & ML Ranking Evaluation (3 mins)
1. Click **"AI Intelligence Lab"** in the Discover header to expand `AiIntelligencePanel`.
2. Walk through all 4 tabs:
   - **Tab 1 — Candidate Skill Map & Role Expansion:** Shows direct vs. inferred adjacent capabilities and transferable role families with supporting resume evidence.
   - **Tab 2 — Semantic Search Matches:** Shows 128-D vector cosine similarity alongside the 5-component hybrid score breakdown, plus the **"Run Live AI Match"** button that invokes the `ModelRouter` (`qwen/qwen3.8-27b` / fallback chain) for live evidence-grounded reasoning.
   - **Tab 3 — Skill Gap Intelligence:** Shows missing skills across top opportunities, why each skill matters, a concrete preparation deliverable, and clickable learning resources.
   - **Tab 4 — ML Ranking & Methodology:** Shows live **`Precision@K`**, **`Recall@K`**, and **`NDCG@K`** ($K \in \{3, 5, 10\}$) metrics alongside the **Honest ML Disclosure** explaining the difference between our 128-D semantic embedding + hybrid ranker and a supervised model trained on hiring outcomes.

### Step 6 — Persistent Background Sync & Application Tracker (2 mins)
1. Click **"Sync Feeds"** on Discover (or open `GET /api/sync`) to show the **Persistent Database Scheduler** (`PERSISTENT_DATABASE_LEDGER`) recording `SyncLog` runs, new/updated/expired counts, failed provider retries, and next scheduled sync timestamps.
2. Click **"Save"** on an opportunity and switch to the **Tracker** and **Prep Studio** tabs to show the saved opportunity in the Kanban pipeline with a generated preparation blueprint.
3. Toggle between **`LIVE` Mode** and **`DEMO` Mode** in the top navigation bar to demonstrate that `LIVE` mode contains zero synthetic opportunities while `DEMO` mode provides a clearly labeled offline fallback if conference Wi-Fi drops.

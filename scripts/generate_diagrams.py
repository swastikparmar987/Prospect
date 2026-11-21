import os
import matplotlib.pyplot as plt
import matplotlib.patches as patches

os.makedirs("/Users/pro/Desktop/projects/FRUITWISE/prospect/public/report-assets", exist_ok=True)
asset_dir = "/Users/pro/Desktop/projects/FRUITWISE/prospect/public/report-assets"

# Common visual styling
IVORY = "#F8F6F1"
CHARCOAL = "#111111"
LIME = "#DFFF43"
LAVENDER = "#EAE3FF"
MUTED_GREEN = "#A6D94B"
BORDER = "#D6D3CD"
WHITE = "#FFFFFF"

# -----------------------------------------------------------------------------
# 1. System Architecture Diagram
# -----------------------------------------------------------------------------
def make_architecture_diagram():
    fig, ax = plt.subplots(figsize=(10, 6.5), dpi=300)
    ax.set_facecolor(IVORY)
    fig.patch.set_facecolor(IVORY)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 6.8)
    ax.axis("off")

    layers = [
        ("Presentation Layer", "Next.js 15 App Router • React 19 • Tailwind CSS • Three.js 3D • Matter.js Physics • Web Speech API", 5.2, LIME),
        ("Application & API Gateway", "REST Handlers • SSE Stream (/api/opportunities/stream) • Session Auth & RBAC (/api/auth)", 4.0, WHITE),
        ("Core Domain Engines", "Candidate Intelligence • Adaptive Search Planner • 128D Embeddings • 5-Pillar Scorer • Gap-Action Engine", 2.8, LAVENDER),
        ("Central AI Model Router", "Groq Cloud (Llama 3.3 70B) • Google Gemini (Gemini 2.5 Flash) • Deterministic Fallback Engine", 1.6, WHITE),
        ("Persistence & Background Layer", "Prisma ORM • SQLite (Dev) / PostgreSQL (Staging) • Durable Worker Queue • Leased Task State", 0.4, LIME),
    ]

    for title, desc, y, col in layers:
        rect = patches.FancyBboxPatch((0.5, y), 9.0, 0.9, boxstyle="round,pad=0.08,rounding_size=0.15",
                                      facecolor=col, edgecolor=CHARCOAL, linewidth=1.5)
        ax.add_patch(rect)
        ax.text(0.8, y + 0.55, title, fontsize=11, fontweight="bold", color=CHARCOAL, family="sans-serif")
        ax.text(0.8, y + 0.22, desc, fontsize=8.5, color="#333333", family="sans-serif")

    # Connective arrows
    for y in [5.2, 4.0, 2.8, 1.6]:
        ax.annotate("", xy=(5.0, y - 0.25), xytext=(5.0, y),
                    arrowprops=dict(arrowstyle="->", color=CHARCOAL, lw=1.8))

    plt.title("PROSPECT — System Architecture & Layered Request Pipeline", fontsize=13, fontweight="bold", pad=12, color=CHARCOAL)
    plt.savefig(f"{asset_dir}/diagram-system-architecture.png", bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()

# -----------------------------------------------------------------------------
# 2. Candidate Intelligence & Resume Processing Pipeline
# -----------------------------------------------------------------------------
def make_resume_pipeline_diagram():
    fig, ax = plt.subplots(figsize=(10, 3.8), dpi=300)
    ax.set_facecolor(IVORY)
    fig.patch.set_facecolor(IVORY)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 3.6)
    ax.axis("off")

    steps = [
        ("1. Ingestion", "PDF / DOCX\npdf-parse stream\n& Mammoth XML"),
        ("2. Normalization", "NFKC Unicode\nFooters stripped\nASCII sanitized"),
        ("3. Segmentation", "7 Section Regex\nEducation, Skills,\nProjects, Experience"),
        ("4. Taxonomy", "7 Categories\nSingle-letter C/R\ncontext rules"),
        ("5. AI Merge", "Groq / Gemini\nStructured Schema\nSnippet Provenance"),
        ("6. Capability Map", "Direct & Adjacent\nSkills & Role\nFamily Expansion")
    ]

    for i, (st, desc) in enumerate(steps):
        x = 0.35 + i * 1.58
        rect = patches.FancyBboxPatch((x, 0.6), 1.35, 2.0, boxstyle="round,pad=0.08,rounding_size=0.12",
                                      facecolor=LIME if i in [0, 5] else (LAVENDER if i == 4 else WHITE),
                                      edgecolor=CHARCOAL, linewidth=1.4)
        ax.add_patch(rect)
        ax.text(x + 0.67, 2.2, st, fontsize=8.5, fontweight="bold", ha="center", color=CHARCOAL, family="sans-serif")
        ax.text(x + 0.67, 1.35, desc, fontsize=7.4, ha="center", color="#333333", family="sans-serif", linespacing=1.3)
        if i < len(steps) - 1:
            ax.annotate("", xy=(x + 1.55, 1.6), xytext=(x + 1.38, 1.6),
                        arrowprops=dict(arrowstyle="->", color=CHARCOAL, lw=1.6))

    plt.title("PROSPECT — Candidate Intelligence & Hybrid Resume Extraction Flow", fontsize=12, fontweight="bold", pad=12, color=CHARCOAL)
    plt.savefig(f"{asset_dir}/diagram-resume-pipeline.png", bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()

# -----------------------------------------------------------------------------
# 3. Opportunity Discovery & Deduplication Pipeline
# -----------------------------------------------------------------------------
def make_discovery_pipeline_diagram():
    fig, ax = plt.subplots(figsize=(10, 4.0), dpi=300)
    ax.set_facecolor(IVORY)
    fig.patch.set_facecolor(IVORY)
    ax.set_xlim(0, 10.5)
    ax.set_ylim(0, 4.0)
    ax.axis("off")

    stages = [
        ("Query Synthesizer", "Candidate skills &\ntarget roles create\nsearch queries", 0.4, 0.8),
        ("Multi-Provider Ingestion", "• Tavily Web API\n• Hacker News (Algolia)\n• Dev.to & Remote Feeds", 2.7, 0.8),
        ("Content Guard Shield", "• SSRF protection\n• Prompt-injection scan\n• Canonical URL dedup", 5.5, 0.8),
        ("Normalized Pipeline", "DiscoveredAt stamped\nisDemo flag enforced\nFreshness cutoff applied", 8.1, 0.8)
    ]

    for title, desc, x, y in stages:
        w = 2.0 if x != 2.7 else 2.4
        rect = patches.FancyBboxPatch((x, y), w, 2.2, boxstyle="round,pad=0.08,rounding_size=0.12",
                                      facecolor=LIME if x == 8.1 else (LAVENDER if x == 5.5 else WHITE),
                                      edgecolor=CHARCOAL, linewidth=1.4)
        ax.add_patch(rect)
        ax.text(x + w/2, y + 1.8, title, fontsize=8.8, fontweight="bold", ha="center", color=CHARCOAL, family="sans-serif")
        ax.text(x + w/2, y + 0.95, desc, fontsize=7.6, ha="center", color="#333333", family="sans-serif", linespacing=1.3)

    ax.annotate("", xy=(2.65, 1.9), xytext=(2.42, 1.9), arrowprops=dict(arrowstyle="->", color=CHARCOAL, lw=1.6))
    ax.annotate("", xy=(5.45, 1.9), xytext=(5.15, 1.9), arrowprops=dict(arrowstyle="->", color=CHARCOAL, lw=1.6))
    ax.annotate("", xy=(8.05, 1.9), xytext=(7.85, 1.9), arrowprops=dict(arrowstyle="->", color=CHARCOAL, lw=1.6))

    plt.title("PROSPECT — Multi-Source Discovery, Security Sanitization & Deduplication", fontsize=12, fontweight="bold", pad=12, color=CHARCOAL)
    plt.savefig(f"{asset_dir}/diagram-discovery-pipeline.png", bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()

# -----------------------------------------------------------------------------
# 4. Matching & 5-Pillar Scoring Engine Workflow
# -----------------------------------------------------------------------------
def make_scoring_workflow_diagram():
    fig, ax = plt.subplots(figsize=(10, 4.8), dpi=300)
    ax.set_facecolor(IVORY)
    fig.patch.set_facecolor(IVORY)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 4.8)
    ax.axis("off")

    # Left: Inputs
    rect1 = patches.FancyBboxPatch((0.4, 2.8), 2.2, 1.4, boxstyle="round,pad=0.08", facecolor=LAVENDER, edgecolor=CHARCOAL, lw=1.4)
    ax.add_patch(rect1)
    ax.text(1.5, 3.8, "Candidate Profile", fontsize=9, fontweight="bold", ha="center", color=CHARCOAL)
    ax.text(1.5, 3.2, "128D Vector u\nSkills, Projects, Education", fontsize=7.5, ha="center", color="#333")

    rect2 = patches.FancyBboxPatch((0.4, 0.8), 2.2, 1.4, boxstyle="round,pad=0.08", facecolor=LAVENDER, edgecolor=CHARCOAL, lw=1.4)
    ax.add_patch(rect2)
    ax.text(1.5, 1.8, "Job Requisition", fontsize=9, fontweight="bold", ha="center", color=CHARCOAL)
    ax.text(1.5, 1.2, "128D Vector v\nRequirements & Seniority", fontsize=7.5, ha="center", color="#333")

    # Center: 5 Pillars
    rect_mid = patches.FancyBboxPatch((3.2, 0.5), 3.8, 3.8, boxstyle="round,pad=0.1", facecolor=WHITE, edgecolor=CHARCOAL, lw=1.5)
    ax.add_patch(rect_mid)
    ax.text(5.1, 3.95, "5-Pillar Scoring Formula", fontsize=10, fontweight="bold", ha="center", color=CHARCOAL)

    pillars = [
        ("Technical Skills (S)", "30%", "Jaccard Overlap + Term Match"),
        ("Experience Match (E)", "25%", "Years vs Min / Preferred Gate"),
        ("Semantic Alignment (A)", "20%", "128D Vector Cosine Dot Product"),
        ("Role Relevance (R)", "15%", "Okapi BM25 Lexical Keyword Rank"),
        ("Career Trajectory (T)", "10%", "Project Scope & Progression")
    ]
    for idx, (p_title, p_wt, p_detail) in enumerate(pillars):
        py = 3.45 - idx * 0.62
        ax.text(3.45, py, f"• {p_title} ({p_wt})", fontsize=8, fontweight="bold", color=CHARCOAL)
        ax.text(3.65, py - 0.22, p_detail, fontsize=7.2, color="#555555")

    # Right: Decision Actions
    rect_out = patches.FancyBboxPatch((7.6, 0.8), 2.0, 3.4, boxstyle="round,pad=0.08", facecolor=LIME, edgecolor=CHARCOAL, lw=1.4)
    ax.add_patch(rect_out)
    ax.text(8.6, 3.85, "Recommendation", fontsize=9.5, fontweight="bold", ha="center", color=CHARCOAL)
    ax.text(8.6, 3.25, "APPLY NOW (≥75%)", fontsize=8, fontweight="bold", ha="center", color="#15803D")
    ax.text(8.6, 2.65, "PREPARE (55-74%)", fontsize=8, fontweight="bold", ha="center", color="#854D0E")
    ax.text(8.6, 2.05, "WATCHLIST", fontsize=8, ha="center", color="#4338CA")
    ax.text(8.6, 1.45, "SKIP (<40%)", fontsize=8, ha="center", color="#B91C1C")

    # Connecting arrows
    ax.annotate("", xy=(3.15, 3.5), xytext=(2.65, 3.5), arrowprops=dict(arrowstyle="->", color=CHARCOAL, lw=1.5))
    ax.annotate("", xy=(3.15, 1.5), xytext=(2.65, 1.5), arrowprops=dict(arrowstyle="->", color=CHARCOAL, lw=1.5))
    ax.annotate("", xy=(7.55, 2.5), xytext=(7.05, 2.5), arrowprops=dict(arrowstyle="->", color=CHARCOAL, lw=1.5))

    plt.title("PROSPECT — Hybrid Matching & 5-Pillar Scoring Workflow", fontsize=12, fontweight="bold", pad=12, color=CHARCOAL)
    plt.savefig(f"{asset_dir}/diagram-scoring-workflow.png", bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()

# -----------------------------------------------------------------------------
# 5. Database Schema Relationship Diagram (ERD)
# -----------------------------------------------------------------------------
def make_erd_diagram():
    fig, ax = plt.subplots(figsize=(10, 5.0), dpi=300)
    ax.set_facecolor(IVORY)
    fig.patch.set_facecolor(IVORY)
    ax.set_xlim(0, 10)
    ax.set_ylim(0, 5.0)
    ax.axis("off")

    entities = [
        ("UserProfile", "id, userId, fullName\nskills, projects, gpa\ncapabilitiesJson, embedding", 0.5, 2.8, LIME),
        ("Opportunity", "id, title, organization\nrequiredSkills, applyUrl\nsourceConfidence, isFresh", 4.0, 2.8, LIME),
        ("Evaluation", "id, opportunityId\noverallScore, scoreBreakdown\nmissingSkills, rationale", 7.5, 2.8, WHITE),
        ("PreparationPlan", "id, userId, opportunityId\nsummary, actionItems (JSON)\ndeliverables, effort", 4.0, 0.4, WHITE),
        ("Application", "id, userId, opportunityId\nstage, targetDeadline\nnotes, eventLog", 7.5, 0.4, LAVENDER),
        ("SearchCache", "queryHash, provider\nresultPayloadJson, expiresAt", 0.5, 0.4, WHITE)
    ]

    for title, fields, x, y, col in entities:
        rect = patches.FancyBboxPatch((x, y), 2.2, 1.8, boxstyle="round,pad=0.08", facecolor=col, edgecolor=CHARCOAL, lw=1.4)
        ax.add_patch(rect)
        ax.text(x + 1.1, y + 1.5, title, fontsize=9.2, fontweight="bold", ha="center", color=CHARCOAL)
        ax.text(x + 1.1, y + 0.7, fields, fontsize=7.2, ha="center", color="#333333", linespacing=1.3)

    # Connectors
    ax.annotate("1:N", xy=(7.45, 3.7), xytext=(6.25, 3.7), arrowprops=dict(arrowstyle="->", color=CHARCOAL, lw=1.5), fontsize=7.5, ha="center")
    ax.annotate("1:N", xy=(5.1, 2.25), xytext=(5.1, 2.75), arrowprops=dict(arrowstyle="->", color=CHARCOAL, lw=1.5), fontsize=7.5, ha="center")
    ax.annotate("1:N", xy=(7.55, 2.25), xytext=(6.25, 2.9), arrowprops=dict(arrowstyle="->", color=CHARCOAL, lw=1.5), fontsize=7.5, ha="center")
    ax.annotate("owns", xy=(3.95, 1.3), xytext=(2.75, 2.9), arrowprops=dict(arrowstyle="->", color="#666", lw=1.2, ls="--"), fontsize=7, ha="center")

    plt.title("PROSPECT — Relational Entity Relationship Diagram (Prisma Schema)", fontsize=12, fontweight="bold", pad=12, color=CHARCOAL)
    plt.savefig(f"{asset_dir}/diagram-erd.png", bbox_inches="tight", facecolor=fig.get_facecolor())
    plt.close()

if __name__ == "__main__":
    make_architecture_diagram()
    make_resume_pipeline_diagram()
    make_discovery_pipeline_diagram()
    make_scoring_workflow_diagram()
    make_erd_diagram()
    print("All diagrams generated successfully with tight bounding boxes.")

import os
from .styles import add_h1, add_h2, add_h3, add_p, add_bullet, add_callout_box, set_cell_background, set_cell_padding, HEX_IVORY, HEX_LIME, HEX_CHARCOAL, HEX_LAVENDER, RGB_CHARCOAL, RGB_LIME, RGB_DARK, RGB_MUTED, RGB_WHITE
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls

def render_cover_page(doc, html_builder):
    # Word Cover Page
    p_badge = doc.add_paragraph()
    p_badge.paragraph_format.space_before = Pt(36)
    p_badge.paragraph_format.space_after = Pt(12)
    r_badge = p_badge.add_run("PROSPECT  •  MAJOR CAPSTONE TECHNICAL REPORT")
    r_badge.font.name = "Inter"
    r_badge.bold = True
    r_badge.font.size = Pt(9.5)
    r_badge.font.color.rgb = RGBColor(120, 160, 20)

    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_before = Pt(10)
    p_title.paragraph_format.space_after = Pt(12)
    r_title = p_title.add_run("PROSPECT: AI-Powered Career Intelligence & Adaptive Opportunity Discovery Platform")
    r_title.font.name = "Inter"
    r_title.bold = True
    r_title.font.size = Pt(22)
    r_title.font.color.rgb = RGB_CHARCOAL

    p_sub = doc.add_paragraph()
    p_sub.paragraph_format.space_before = Pt(4)
    p_sub.paragraph_format.space_after = Pt(28)
    p_sub.paragraph_format.line_spacing = 1.25
    r_sub = p_sub.add_run("A Deterministic & Semantic Hybrid Architecture for Candidate Profiling, Multi-Source Opportunity Aggregation, Transparent Multi-Pillar Ranking, and Project-Anchored Skill Gap Remediation")
    r_sub.font.name = "Inter"
    r_sub.font.size = Pt(11)
    r_sub.font.color.rgb = RGBColor(74, 85, 104)

    # Decorative callout table
    tbl = doc.add_table(rows=4, cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_items = [
        ("CANDIDATE / AUTHOR", "Swastik Parmar (Project Lead & Author)", "DEPARTMENT", "Department of Computer Science & Engineering"),
        ("PROJECT CLASSIFICATION", "Major B.Tech Capstone / Production System", "REPOSITORY & REVISION", "github.com/swastikparmar987/Prospect (Main)"),
        ("CORE METHODOLOGY", "Custom 128D Embeddings + Okapi BM25 + 5-Pillar Linear Weighting", "PRODUCTION POLICY", "Strict No-Mock-Data Real Provider Enforcement"),
        ("ACADEMIC YEAR", "2026 – 2027", "DOCUMENT VERSION", "Release 1.0.0 — Final Evaluated Architecture")
    ]
    for r_idx, (k1, v1, k2, v2) in enumerate(meta_items):
        row = tbl.rows[r_idx]
        c1, c2 = row.cells[0], row.cells[1]
        set_cell_background(c1, HEX_IVORY)
        set_cell_background(c2, HEX_IVORY)
        set_cell_padding(c1, top=80, bottom=80, left=120, right=120)
        set_cell_padding(c2, top=80, bottom=80, left=120, right=120)
        
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_before = Pt(0)
        p1.paragraph_format.space_after = Pt(0)
        r1_lbl = p1.add_run(f"{k1}: ")
        r1_lbl.font.size = Pt(8.0)
        r1_lbl.bold = True
        r1_lbl.font.color.rgb = RGB_MUTED
        r1_val = p1.add_run(v1)
        r1_val.font.size = Pt(8.5)
        r1_val.font.color.rgb = RGB_CHARCOAL
        
        p2 = c2.paragraphs[0]
        p2.paragraph_format.space_before = Pt(0)
        p2.paragraph_format.space_after = Pt(0)
        r2_lbl = p2.add_run(f"{k2}: ")
        r2_lbl.font.size = Pt(8.0)
        r2_lbl.bold = True
        r2_lbl.font.color.rgb = RGB_MUTED
        r2_val = p2.add_run(v2)
        r2_val.font.size = Pt(8.5)
        r2_val.font.color.rgb = RGB_CHARCOAL

    doc.add_page_break()

    # HTML Cover Page
    html_builder.add_raw('''
    <div class="cover-container">
        <div>
            <div class="cover-badge">Prospect Technical Report • Capstone Engineering</div>
            <div class="cover-title">PROSPECT: AI-Powered Career Intelligence & Adaptive Opportunity Discovery Platform</div>
            <div class="cover-subtitle">A Deterministic & Semantic Hybrid Architecture for Candidate Profiling, Multi-Source Opportunity Aggregation, Transparent Multi-Pillar Ranking, and Project-Anchored Skill Gap Remediation</div>
        </div>
        <div class="cover-meta-grid">
            <div class="cover-meta-item">
                <div class="cover-meta-label">Author / Lead Engineer</div>
                <div class="cover-meta-val">Swastik Parmar</div>
            </div>
            <div class="cover-meta-item">
                <div class="cover-meta-label">Department & Faculty</div>
                <div class="cover-meta-val">Dept. of Computer Science & Engineering</div>
            </div>
            <div class="cover-meta-item">
                <div class="cover-meta-label">Project Type</div>
                <div class="cover-meta-val">Major Capstone / Production System</div>
            </div>
            <div class="cover-meta-item">
                <div class="cover-meta-label">Architecture Core</div>
                <div class="cover-meta-val">Custom 128D Embeddings + Okapi BM25 + Next.js 15</div>
            </div>
            <div class="cover-meta-item">
                <div class="cover-meta-label">Production Policy</div>
                <div class="cover-meta-val">Strict No-Mock-Data Real Provider Enforcement</div>
            </div>
            <div class="cover-meta-item">
                <div class="cover-meta-label">Academic Evaluation Period</div>
                <div class="cover-meta-val">Academic Year 2026 – 2027</div>
            </div>
        </div>
    </div>
    ''')
    html_builder.add_page_break()

def render_certificate(doc, html_builder):
    # Word
    add_h1(doc, "2. Certificate / Declaration", page_break=False)
    add_p(doc, "This is to certify that the project work entitled \"PROSPECT: AI-POWERED CAREER INTELLIGENCE AND ADAPTIVE OPPORTUNITY DISCOVERY PLATFORM\" submitted by Swastik Parmar (Student Enrollment ID: _____________________) to the Department of Computer Science and Engineering is a bonafide record of work carried out under our supervision and guidance.")
    add_p(doc, "The technical report and underlying codebase reflect original engineering design, implementation, and empirical verification conducted during the academic session 2026–2027. All primary data structures, algorithmic implementations, information retrieval pipelines, and web modules described herein have been verified against the production repository.")
    add_p(doc, "To the best of our knowledge, the matter embodied in this report has not been submitted to any other University or Institution for the award of any degree or diploma.")
    
    p_sig = doc.add_paragraph()
    p_sig.paragraph_format.space_before = Pt(45)
    p_sig.paragraph_format.space_after = Pt(10)
    p_sig.paragraph_format.line_spacing = 1.3
    r_s = p_sig.add_run("_____________________________\t\t\t_____________________________\nProject Supervisor / Faculty Guide\t\t\tHead of Department\nDepartment of Computer Science\t\t\tDepartment of Computer Science\nDate: ________________________\t\t\tDate: ________________________")
    r_s.font.size = Pt(9.0)
    r_s.font.color.rgb = RGB_CHARCOAL
    
    doc.add_page_break()

    # HTML
    html_builder.add_h1("2. Certificate / Declaration", page_break=False)
    html_builder.add_p("This is to certify that the project work entitled \"PROSPECT: AI-POWERED CAREER INTELLIGENCE AND ADAPTIVE OPPORTUNITY DISCOVERY PLATFORM\" submitted by Swastik Parmar (Student Enrollment ID: _____________________) to the Department of Computer Science and Engineering is a bonafide record of work carried out under our supervision and guidance.")
    html_builder.add_p("The technical report and underlying codebase reflect original engineering design, implementation, and empirical verification conducted during the academic session 2026–2027. All primary data structures, algorithmic implementations, information retrieval pipelines, and web modules described herein have been verified against the production repository.")
    html_builder.add_p("To the best of our knowledge, the matter embodied in this report has not been submitted to any other University or Institution for the award of any degree or diploma.")
    html_builder.add_raw('''
    <div style="margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; font-size: 8.5pt;">
        <div>
            <div style="border-top: 1px solid #111; padding-top: 6px; font-weight: 700;">Project Supervisor / Faculty Guide</div>
            <div style="color: #64748B;">Department of Computer Science & Engineering</div>
            <div style="color: #64748B; margin-top: 4px;">Date: ______________________</div>
        </div>
        <div>
            <div style="border-top: 1px solid #111; padding-top: 6px; font-weight: 700;">Head of Department (CSE)</div>
            <div style="color: #64748B;">Department of Computer Science & Engineering</div>
            <div style="color: #64748B; margin-top: 4px;">Date: ______________________</div>
        </div>
    </div>
    ''')
    html_builder.add_page_break()

def render_acknowledgement(doc, html_builder):
    # Word
    add_h1(doc, "3. Acknowledgement", page_break=False)
    add_p(doc, "We express our profound gratitude to our project guide, faculty advisors, and the faculty members of the Department of Computer Science & Engineering for their valuable guidance, continuous encouragement, and constructive critique throughout the conception and implementation of Prospect.")
    add_p(doc, "Special recognition is extended to the open-source software community for the foundational tools, frameworks, and libraries that made this platform possible: the Next.js team at Vercel for cutting-edge React Server Component capabilities, the Prisma ORM engineering group for type-safe relational abstractions, the developer communities maintaining pdf-parse, mammoth, and Lucide icons, and the search intelligence providers including Tavily, Hacker News, Dev.to, and StackOverflow.")
    add_p(doc, "Finally, we sincerely thank our peers, friends, and family whose patient feedback, testing assistance, and unyielding support served as a continual source of motivation during long development sprints and rigorous algorithmic evaluations.")
    
    doc.add_page_break()

    # HTML
    html_builder.add_h1("3. Acknowledgement", page_break=False)
    html_builder.add_p("We express our profound gratitude to our project guide, faculty advisors, and the faculty members of the Department of Computer Science & Engineering for their valuable guidance, continuous encouragement, and constructive critique throughout the conception and implementation of Prospect.")
    html_builder.add_p("Special recognition is extended to the open-source software community for the foundational tools, frameworks, and libraries that made this platform possible: the Next.js team at Vercel for cutting-edge React Server Component capabilities, the Prisma ORM engineering group for type-safe relational abstractions, the developer communities maintaining pdf-parse, mammoth, and Lucide icons, and the search intelligence providers including Tavily, Hacker News, Dev.to, and StackOverflow.")
    html_builder.add_p("Finally, we sincerely thank our peers, friends, and family whose patient feedback, testing assistance, and unyielding support served as a continual source of motivation during long development sprints and rigorous algorithmic evaluations.")
    html_builder.add_page_break()

def render_abstract(doc, html_builder):
    # Word
    add_h1(doc, "4. Abstract", page_break=False)
    add_p(doc, "The contemporary software recruitment ecosystem suffers from acute structural information asymmetry. Conventional commercial job aggregation portals rely predominantly on naive keyword matching, resulting in overwhelming candidate spam, deceptive algorithmic matching scores, stale listings, and complete opacity regarding why an applicant is rejected or under-qualified. Applicants are trapped in an exhaustive loop of blind submissions, receiving zero actionable intelligence regarding concrete skill deficiencies or targeted preparation pathways.")
    add_p(doc, "This report presents PROSPECT, an end-to-end, production-grade Career Intelligence and Adaptive Opportunity Discovery Platform engineered to eradicate these systemic failure modes. Prospect employs a deterministic-semantic hybrid architecture combining client-side and server-side text extraction (PDF-Parse and Mammoth DOCX with ZIP XML fallback), regular expression section segmentation, and structured LLM extraction (utilizing Groq Llama-3.3-70B and Google Gemini 2.5 Flash with fallback) anchored to raw resume source snippets.")
    add_p(doc, "Opportunity discovery is conducted across heterogeneous live providers—including Tavily Search API, Hacker News Who's Hiring Algolia feeds, Dev.to, and specialized remote feeds—coupled with an automated 3-tier canonical deduplication pipeline and strict 14-day freshness boundaries. Opportunities are evaluated using a custom 128-dimensional locality-sensitive semantic embedding engine (prospect-semantic-embed-v1-128d) combined with Okapi BM25 lexical relevance and a transparent, 5-pillar linear scoring formulation balancing Experience, Technical Skill Overlap, Semantic Alignment, Role Relevance, and Career Trajectory.")
    add_p(doc, "To bridge identified qualification gaps, Prospect introduces a contextual Preparation Studio featuring a 3-stage set-difference gap analyzer, a What-If counterfactual rescoring simulator, and a Voice AI Mock Interview Studio integrating browser speech synthesis, continuous recognition, and real-time technical probing powered by live technical knowledge bases. Bound by a strict \"No-Mock-Data\" policy, Prospect guarantees that all presented opportunities, qualifications, and evaluations represent real, verifiable industry data.")
    add_callout_box(doc, "Core Innovation Summary", "Prospect combines deterministic schema extraction, 128D semantic embeddings, Okapi BM25 ranking, a 5-pillar explainable scoring equation (0.25E + 0.30S + 0.20A + 0.15R + 0.10T), and an interactive voice-driven preparation studio backed by live web intelligence.")
    
    doc.add_page_break()

    # HTML
    html_builder.add_h1("4. Abstract", page_break=False)
    html_builder.add_p("The contemporary software recruitment ecosystem suffers from acute structural information asymmetry. Conventional commercial job aggregation portals rely predominantly on naive keyword matching, resulting in overwhelming candidate spam, deceptive algorithmic matching scores, stale listings, and complete opacity regarding why an applicant is rejected or under-qualified. Applicants are trapped in an exhaustive loop of blind submissions, receiving zero actionable intelligence regarding concrete skill deficiencies or targeted preparation pathways.")
    html_builder.add_p("This report presents PROSPECT, an end-to-end, production-grade Career Intelligence and Adaptive Opportunity Discovery Platform engineered to eradicate these systemic failure modes. Prospect employs a deterministic-semantic hybrid architecture combining client-side and server-side text extraction (PDF-Parse and Mammoth DOCX with ZIP XML fallback), regular expression section segmentation, and structured LLM extraction (utilizing Groq Llama-3.3-70B and Google Gemini 2.5 Flash with fallback) anchored to raw resume source snippets.")
    html_builder.add_p("Opportunity discovery is conducted across heterogeneous live providers—including Tavily Search API, Hacker News Who's Hiring Algolia feeds, Dev.to, and specialized remote feeds—coupled with an automated 3-tier canonical deduplication pipeline and strict 14-day freshness boundaries. Opportunities are evaluated using a custom 128-dimensional locality-sensitive semantic embedding engine (prospect-semantic-embed-v1-128d) combined with Okapi BM25 lexical relevance and a transparent, 5-pillar linear scoring formulation balancing Experience, Technical Skill Overlap, Semantic Alignment, Role Relevance, and Career Trajectory.")
    html_builder.add_p("To bridge identified qualification gaps, Prospect introduces a contextual Preparation Studio featuring a 3-stage set-difference gap analyzer, a What-If counterfactual rescoring simulator, and a Voice AI Mock Interview Studio integrating browser speech synthesis, continuous recognition, and real-time technical probing powered by live technical knowledge bases. Bound by a strict \"No-Mock-Data\" policy, Prospect guarantees that all presented opportunities, qualifications, and evaluations represent real, verifiable industry data.")
    html_builder.add_callout("Core Innovation Summary", "Prospect combines deterministic schema extraction, 128D semantic embeddings, Okapi BM25 ranking, a 5-pillar explainable scoring equation (0.25E + 0.30S + 0.20A + 0.15R + 0.10T), and an interactive voice-driven preparation studio backed by live web intelligence.")
    html_builder.add_page_break()

def render_table_of_contents(doc, html_builder):
    # Word
    add_h1(doc, "5. Table of Contents", page_break=False)
    toc_items = [
        ("1. Cover Page", "i"),
        ("2. Certificate / Declaration", "ii"),
        ("3. Acknowledgement", "iii"),
        ("4. Abstract", "iv"),
        ("5. Table of Contents", "v"),
        ("6. Introduction", "1"),
        ("7. Problem Statement", "3"),
        ("8. Objectives of Prospect", "5"),
        ("9. Existing System and Its Limitations", "7"),
        ("10. Proposed System", "9"),
        ("11. Product Overview", "11"),
        ("12. Target Users and Use Cases", "13"),
        ("13. System Architecture", "15"),
        ("14. Technology Stack", "17"),
        ("15. Candidate Intelligence and Resume Parsing", "19"),
        ("16. Adaptive Opportunity Search", "22"),
        ("17. Multi-source Opportunity Discovery", "24"),
        ("18. Opportunity Normalization and Deduplication", "26"),
        ("19. Matching, Eligibility and Ranking", "28"),
        ("20. Skill Gap Analysis and Career Guidance", "31"),
        ("21. Database Design and API Structure", "34"),
        ("22. User Interface and Main Modules", "38"),
        ("23. Security, Privacy and No-Mock-Data Policy", "42"),
        ("24. Implementation Details", "45"),
        ("25. Testing and Verification", "48"),
        ("26. Challenges and Limitations", "51"),
        ("27. Future Scope", "53"),
        ("28. Conclusion", "55"),
        ("29. References", "56")
    ]
    
    tbl = doc.add_table(rows=len(toc_items), cols=2)
    tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
    for idx, (title, page) in enumerate(toc_items):
        row = tbl.rows[idx]
        c1, c2 = row.cells[0], row.cells[1]
        c1.width = Inches(5.8)
        c2.width = Inches(0.8)
        set_cell_padding(c1, top=30, bottom=30, left=40, right=40)
        set_cell_padding(c2, top=30, bottom=30, left=40, right=40)
        
        p1 = c1.paragraphs[0]
        p1.paragraph_format.space_before = Pt(0)
        p1.paragraph_format.space_after = Pt(0)
        r1 = p1.add_run(title)
        r1.font.name = "Inter"
        r1.font.size = Pt(8.8)
        if title.split(".")[0].isdigit() and int(title.split(".")[0]) in [6, 13, 15, 19, 21, 28]:
            r1.bold = True
            r1.font.color.rgb = RGB_CHARCOAL
        else:
            r1.font.color.rgb = RGB_DARK
            
        p2 = c2.paragraphs[0]
        p2.paragraph_format.space_before = Pt(0)
        p2.paragraph_format.space_after = Pt(0)
        p2.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        r2 = p2.add_run(page)
        r2.font.name = "Inter"
        r2.font.size = Pt(8.5)
        r2.font.color.rgb = RGB_MUTED

    doc.add_page_break()

    # HTML
    html_builder.add_h1("5. Table of Contents", page_break=False)
    rows_html = []
    for title, page in toc_items:
        is_bold = "font-weight: 700; color: #111;" if (title.split(".")[0].isdigit() and int(title.split(".")[0]) in [6, 13, 15, 19, 21, 28]) else "color: #334155;"
        rows_html.append(f'''
        <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted #CBD5E1; padding: 4.5px 0; font-size: 8.8pt;">
            <span style="{is_bold}">{title}</span>
            <span style="color: #64748B; font-family: monospace;">{page}</span>
        </div>
        ''')
    html_builder.add_raw(f'<div style="max-width: 95%; margin: 10px auto;">{"".join(rows_html)}</div>')
    html_builder.add_page_break()

def render_introduction(doc, html_builder):
    # Word
    add_h1(doc, "6. Introduction", page_break=False)
    add_h2(doc, "6.1 The Modern Technical Hiring Landscape")
    add_p(doc, "Over the past decade, the software engineering recruitment ecosystem has expanded exponentially, driven by the global transition toward digital-first business models, distributed workforces, and hyper-specialized technology stacks. Concurrently, the volume of active technical candidates has surged, yielding an environment wherein corporate job requisitions routinely attract hundreds—often thousands—of individual applications within hours of publication.")
    add_p(doc, "In response to this volume crisis, modern enterprises increasingly rely on automated Applicant Tracking Systems (ATS) configured with aggressive filtering heuristics. These systems filter out up to 75% of candidate resumes prior to human inspection, frequently utilizing rudimentary exact-string matching rules that penalize qualified candidates who describe their technical accomplishments using alternate terminology.")
    
    add_h2(doc, "6.2 Information Asymmetry in Job Portals")
    add_p(doc, "Commercial job portals—such as LinkedIn, Indeed, and Glassdoor—have structured their core business models around employer-side monetization. Consequently, portal algorithms optimize for high applicant volume and engagement metrics rather than precision or mutual qualification alignment. Candidates are presented with \"promoted\" listings that frequently have minimal relevance to their actual technical competencies, creating a severe information asymmetry:")
    add_bullet(doc, "Uncalibrated Algorithmic Scores: Portals present ambiguous percentage match indicators (e.g., \"Top 10% Applicant\") based entirely on proprietary, unexplainable black-box calculations without disclosing evaluated dimensions.", "1. Black-Box Match Scores: ")
    add_bullet(doc, "Ghost & Stale Listings: A substantial percentage of published job listings remain indexed weeks after internal hiring decisions have concluded, consuming candidate effort on closed pipelines.", "2. Stale Requisitions: ")
    add_bullet(doc, "Zero Diagnostic Feedback: When candidates are rejected or ignored, portals provide no systematic diagnosis of which specific qualification criteria caused the disqualification.", "3. Absence of Diagnostics: ")

    add_h2(doc, "6.3 The Rise of ATS and Black-Box Screening")
    add_p(doc, "The opacity of ATS algorithmic filters has catalyzed an adversarial dynamic between applicants and recruiters. Candidates employ speculative \"keyword-stuffing\" techniques to satisfy parsing engines, while enterprise recruiters respond by implementing increasingly draconian automated rejection filters. This dynamic obscures genuine talent and creates immense anxiety and exhaustion for students and early-career software engineers who lack corporate brand equity on their profiles.")

    add_h2(doc, "6.4 Prospect's Paradigm: Candidate-First Intelligence")
    add_p(doc, "PROSPECT fundamentally reconceptualizes this dynamic by shifting the locus of intelligence entirely to the candidate. Rather than functioning as a passive listing directory, Prospect acts as an autonomous personal career intelligence agent. It analyzes the candidate's authentic technical baseline directly from their resume, queries multi-source live provider feeds across the public web, computes an explainable multi-pillar match score, and diagnoses the exact set-difference between candidate capabilities and role requirements.")
    add_callout_box(doc, "Paradigm Shift", "Prospect prioritizes candidate agency: transparent scoring, zero mock data, verifiable opportunity provenance, and actionable project deliverables designed to bridge qualification gaps.")

    # HTML
    html_builder.add_h1("6. Introduction", page_break=False)
    html_builder.add_h2("6.1 The Modern Technical Hiring Landscape")
    html_builder.add_p("Over the past decade, the software engineering recruitment ecosystem has expanded exponentially, driven by the global transition toward digital-first business models, distributed workforces, and hyper-specialized technology stacks. Concurrently, the volume of active technical candidates has surged, yielding an environment wherein corporate job requisitions routinely attract hundreds—often thousands—of individual applications within hours of publication.")
    html_builder.add_p("In response to this volume crisis, modern enterprises increasingly rely on automated Applicant Tracking Systems (ATS) configured with aggressive filtering heuristics. These systems filter out up to 75% of candidate resumes prior to human inspection, frequently utilizing rudimentary exact-string matching rules that penalize qualified candidates who describe their technical accomplishments using alternate terminology.")
    
    html_builder.add_h2("6.2 Information Asymmetry in Job Portals")
    html_builder.add_p("Commercial job portals—such as LinkedIn, Indeed, and Glassdoor—have structured their core business models around employer-side monetization. Consequently, portal algorithms optimize for high applicant volume and engagement metrics rather than precision or mutual qualification alignment. Candidates are presented with \"promoted\" listings that frequently have minimal relevance to their actual technical competencies, creating a severe information asymmetry:")
    html_builder.start_bullet_list()
    html_builder.add_bullet("Portals present ambiguous percentage match indicators based on proprietary, unexplainable black-box calculations without disclosing evaluated dimensions.", "1. Black-Box Match Scores: ")
    html_builder.add_bullet("A substantial percentage of published job listings remain indexed weeks after internal hiring decisions have concluded, consuming candidate effort on closed pipelines.", "2. Stale Requisitions: ")
    html_builder.add_bullet("When candidates are rejected or ignored, portals provide no systematic diagnosis of which specific qualification criteria caused the disqualification.", "3. Absence of Diagnostics: ")
    html_builder.end_bullet_list()

    html_builder.add_h2("6.3 The Rise of ATS and Black-Box Screening")
    html_builder.add_p("The opacity of ATS algorithmic filters has catalyzed an adversarial dynamic between applicants and recruiters. Candidates employ speculative \"keyword-stuffing\" techniques to satisfy parsing engines, while enterprise recruiters respond by implementing increasingly draconian automated rejection filters. This dynamic obscures genuine talent and creates immense anxiety and exhaustion for students and early-career software engineers who lack corporate brand equity on their profiles.")

    html_builder.add_h2("6.4 Prospect's Paradigm: Candidate-First Intelligence")
    html_builder.add_p("PROSPECT fundamentally reconceptualizes this dynamic by shifting the locus of intelligence entirely to the candidate. Rather than functioning as a passive listing directory, Prospect acts as an autonomous personal career intelligence agent. It analyzes the candidate's authentic technical baseline directly from their resume, queries multi-source live provider feeds across the public web, computes an explainable multi-pillar match score, and diagnoses the exact set-difference between candidate capabilities and role requirements.")
    html_builder.add_callout("Paradigm Shift", "Prospect prioritizes candidate agency: transparent scoring, zero mock data, verifiable opportunity provenance, and actionable project deliverables designed to bridge qualification gaps.")

def render_problem_statement(doc, html_builder):
    # Word
    add_h1(doc, "7. Problem Statement", page_break=False)
    add_h2(doc, "7.1 Keyword Spam and Semantic Blind Spots")
    add_p(doc, "Conventional hiring platforms evaluate candidate profiles through lexical intersection. If a candidate documents expertise in \"distributed state synchronization\" or \"consensus algorithms\" but omits the exact token \"Raft\", naive keyword engines assign zero relevance. Conversely, candidates who indiscriminately list buzzwords without substantive contextual evidence receive inflated algorithmic scores. This creates severe semantic blind spots, penalizing authentic engineering competence.")

    add_h2(doc, "7.2 Portal Fragmentation and Duplicate Aggregation")
    add_p(doc, "High-quality engineering opportunities are fragmented across isolated silos: traditional career boards, venture capital portfolio networks, open-source technical forums (e.g., Hacker News \"Who's Hiring\"), developer communities (Dev.to), and specialized remote portals. Manually navigating these disjointed repositories is cognitively taxing and results in repeated exposure to duplicated, cross-posted listings with differing titles, salary formats, and submission requirements.")

    add_h2(doc, "7.3 The \"Black Box\" Rejection Loop")
    add_p(doc, "Current systems treat qualification evaluation as a binary gate without explanatory reasoning. When candidates submit applications, they receive no feedback regarding why their submission was declined, whether the rejection stemmed from missing technical frameworks, insufficient years of experience, or unaligned project scope. Consequently, applicants cannot systematically correct their trajectory, leading to persistent, unguided application fatigue.")

    add_h2(doc, "7.4 Lack of Verifiable, Tailored Preparation Pathways")
    add_p(doc, "Existing career guidance tools offer generic advice (e.g., \"Learn Docker\" or \"Brush up on System Design\") detached from both the target job specification and the candidate's current project portfolio. Candidates require concrete, contextualized engineering deliverables that anchor missing competencies directly to their demonstrated work.")

    add_h2(doc, "7.5 Academic Problem Formulation")
    add_p(doc, "Formally, we define the Career Intelligence Problem as a tuple:")
    add_p(doc, "P = < U, O, M, G, S >", bold_prefix="System Definition: ")
    add_bullet(doc, "U = < S_u, E_u, P_u, D_u > representing the candidate's verified skills, experience timeline, project portfolio, and domain focus extracted with provenance from resume streams.", "Candidate Profile (U): ")
    add_bullet(doc, "O = { o_1, o_2, ..., o_n } representing a heterogeneous set of raw opportunity listings dynamically aggregated from external web providers.", "Opportunity Set (O): ")
    add_bullet(doc, "M : (U, o_i) -> [0, 100] representing an explainable, multi-dimensional ranking function parameterized by experience, skill overlap, semantic embedding proximity, and role alignment.", "Scoring Function (M): ")
    add_bullet(doc, "G : (U, o_i) -> < Delta_req, P_anchor, C_sim > representing the discrete skill gap extraction, project-anchored deliverable roadmap, and counterfactual simulation matrix.", "Gap & Guidance Function (G): ")
    add_bullet(doc, "S : A strict invariant constraint guaranteeing zero synthetic or mock entities in live state: for all o in O, Prov(o) is verified and Timestamp(o) >= T_cutoff.", "Security & Integrity Constraint (S): ")

    # HTML
    html_builder.add_h1("7. Problem Statement", page_break=False)
    html_builder.add_h2("7.1 Keyword Spam and Semantic Blind Spots")
    html_builder.add_p("Conventional hiring platforms evaluate candidate profiles through lexical intersection. If a candidate documents expertise in \"distributed state synchronization\" or \"consensus algorithms\" but omits the exact token \"Raft\", naive keyword engines assign zero relevance. Conversely, candidates who indiscriminately list buzzwords without substantive contextual evidence receive inflated algorithmic scores. This creates severe semantic blind spots, penalizing authentic engineering competence.")

    html_builder.add_h2("7.2 Portal Fragmentation and Duplicate Aggregation")
    html_builder.add_p("High-quality engineering opportunities are fragmented across isolated silos: traditional career boards, venture capital portfolio networks, open-source technical forums (e.g., Hacker News \"Who's Hiring\"), developer communities (Dev.to), and specialized remote portals. Manually navigating these disjointed repositories is cognitively taxing and results in repeated exposure to duplicated, cross-posted listings with differing titles, salary formats, and submission requirements.")

    html_builder.add_h2("7.3 The \"Black Box\" Rejection Loop")
    html_builder.add_p("Current systems treat qualification evaluation as a binary gate without explanatory reasoning. When candidates submit applications, they receive no feedback regarding why their submission was declined, whether the rejection stemmed from missing technical frameworks, insufficient years of experience, or unaligned project scope. Consequently, applicants cannot systematically correct their trajectory, leading to persistent, unguided application fatigue.")

    html_builder.add_h2("7.4 Lack of Verifiable, Tailored Preparation Pathways")
    html_builder.add_p("Existing career guidance tools offer generic advice detached from both the target job specification and the candidate's current project portfolio. Candidates require concrete, contextualized engineering deliverables that anchor missing competencies directly to their demonstrated work.")

    html_builder.add_h2("7.5 Academic Problem Formulation")
    html_builder.add_p("Formally, we define the Career Intelligence Problem as a tuple:")
    html_builder.add_p("P = < U, O, M, G, S >", bold_prefix="System Definition: ")
    html_builder.start_bullet_list()
    html_builder.add_bullet("U = < S_u, E_u, P_u, D_u > representing the candidate's verified skills, experience timeline, project portfolio, and domain focus extracted with provenance from resume streams.", "Candidate Profile (U): ")
    html_builder.add_bullet("O = { o_1, o_2, ..., o_n } representing a heterogeneous set of raw opportunity listings dynamically aggregated from external web providers.", "Opportunity Set (O): ")
    html_builder.add_bullet("M : (U, o_i) -> [0, 100] representing an explainable, multi-dimensional ranking function parameterized by experience, skill overlap, semantic embedding proximity, and role alignment.", "Scoring Function (M): ")
    html_builder.add_bullet("G : (U, o_i) -> < Delta_req, P_anchor, C_sim > representing the discrete skill gap extraction, project-anchored deliverable roadmap, and counterfactual simulation matrix.", "Gap & Guidance Function (G): ")
    html_builder.add_bullet("S : A strict invariant constraint guaranteeing zero synthetic or mock entities in live state: for all o in O, Prov(o) is verified and Timestamp(o) >= T_cutoff.", "Security & Integrity Constraint (S): ")
    html_builder.end_bullet_list()

def render_objectives(doc, html_builder):
    # Word
    add_h1(doc, "8. Objectives of Prospect", page_break=False)
    add_p(doc, "To resolve the structural deficiencies identified in the problem statement, Prospect was engineered with the following explicit technical and architectural objectives:")
    
    add_h2(doc, "8.1 Deterministic & Semantic Resume Profiling")
    add_bullet(doc, "Architect a dual-stream parsing engine supporting arbitrary PDF and DOCX document structures with pure-ZIP XML extraction fallbacks.", "Objective 1: ")
    add_bullet(doc, "Implement 7-section regular expression boundary detection to isolate Experience, Education, Technical Skills, and Projects.", "Objective 2: ")
    add_bullet(doc, "Anchor all extracted technical entities directly to raw document text snippets, preventing AI hallucinations from fabricating candidate credentials.", "Objective 3: ")

    add_h2(doc, "8.2 Resilient Multi-Source Opportunity Aggregation")
    add_bullet(doc, "Develop adaptive web discovery connectors to harvest live engineering listings across Tavily Search API, Hacker News Algolia feeds, Dev.to articles, and specialized feeds.", "Objective 4: ")
    add_bullet(doc, "Implement a 3-tier normalization and deduplication pipeline utilizing canonical URL stripping, cryptographic MD5 title-company fingerprinting, and fuzzy Jaccard similarity.", "Objective 5: ")
    add_bullet(doc, "Enforce strict 14-day freshness cutoffs (effectiveFreshCutoff) to guarantee zero exposure to stale or dead requisitions.", "Objective 6: ")

    add_h2(doc, "8.3 Transparent & Explainable Multi-Pillar Scoring")
    add_bullet(doc, "Formulate a deterministic 128-dimensional locality-sensitive semantic embedding engine (prospect-semantic-embed-v1-128d) operating entirely locally without external vector API latency.", "Objective 7: ")
    add_bullet(doc, "Combine semantic embedding cosine distance with Okapi BM25 lexical token matching to prevent false positives and eliminate keyword-stuffing exploits.", "Objective 8: ")
    add_bullet(doc, "Deliver an explainable 5-pillar scoring equation decomposing match quality into Experience, Skill Overlap, Semantic Alignment, Role Relevance, and Career Trajectory.", "Objective 9: ")

    add_h2(doc, "8.4 Actionable Career Guidance & Voice AI Simulation")
    add_bullet(doc, "Implement a 3-stage set-difference engine (Delta_req = S_req \\ S_user) that translates qualification deficits into project-anchored software deliverables.", "Objective 10: ")
    add_bullet(doc, "Construct a What-If counterfactual simulator enabling candidates to evaluate how acquiring specific skills dynamically shifts their overall ranking score.", "Objective 11: ")
    add_bullet(doc, "Build a real-time Voice AI Mock Interview Studio utilizing browser SpeechSynthesis and webkitSpeechRecognition, conducting technical probing informed by live web queries.", "Objective 12: ")

    add_h2(doc, "8.5 Strict Operational Integrity & Privacy")
    add_bullet(doc, "Enforce an absolute No-Mock-Data policy in production: no synthetic jobs, no fabricated scores, and mandatory requireProfile=1 gates.", "Objective 13: ")
    add_bullet(doc, "Provide zero-persistence client modes to protect candidate personally identifiable information (PII).", "Objective 14: ")

    # HTML
    html_builder.add_h1("8. Objectives of Prospect", page_break=False)
    html_builder.add_p("To resolve the structural deficiencies identified in the problem statement, Prospect was engineered with the following explicit technical and architectural objectives:")
    
    html_builder.add_h2("8.1 Deterministic & Semantic Resume Profiling")
    html_builder.start_bullet_list()
    html_builder.add_bullet("Architect a dual-stream parsing engine supporting arbitrary PDF and DOCX document structures with pure-ZIP XML extraction fallbacks.", "Objective 1: ")
    html_builder.add_bullet("Implement 7-section regular expression boundary detection to isolate Experience, Education, Technical Skills, and Projects.", "Objective 2: ")
    html_builder.add_bullet("Anchor all extracted technical entities directly to raw document text snippets, preventing AI hallucinations from fabricating candidate credentials.", "Objective 3: ")
    html_builder.end_bullet_list()

    html_builder.add_h2("8.2 Resilient Multi-Source Opportunity Aggregation")
    html_builder.start_bullet_list()
    html_builder.add_bullet("Develop adaptive web discovery connectors to harvest live engineering listings across Tavily Search API, Hacker News Algolia feeds, Dev.to articles, and specialized feeds.", "Objective 4: ")
    html_builder.add_bullet("Implement a 3-tier normalization and deduplication pipeline utilizing canonical URL stripping, cryptographic MD5 title-company fingerprinting, and fuzzy Jaccard similarity.", "Objective 5: ")
    html_builder.add_bullet("Enforce strict 14-day freshness cutoffs (effectiveFreshCutoff) to guarantee zero exposure to stale or dead requisitions.", "Objective 6: ")
    html_builder.end_bullet_list()

    html_builder.add_h2("8.3 Transparent & Explainable Multi-Pillar Scoring")
    html_builder.start_bullet_list()
    html_builder.add_bullet("Formulate a deterministic 128-dimensional locality-sensitive semantic embedding engine (prospect-semantic-embed-v1-128d) operating entirely locally without external vector API latency.", "Objective 7: ")
    html_builder.add_bullet("Combine semantic embedding cosine distance with Okapi BM25 lexical token matching to prevent false positives and eliminate keyword-stuffing exploits.", "Objective 8: ")
    html_builder.add_bullet("Deliver an explainable 5-pillar scoring equation decomposing match quality into Experience, Skill Overlap, Semantic Alignment, Role Relevance, and Career Trajectory.", "Objective 9: ")
    html_builder.end_bullet_list()

    html_builder.add_h2("8.4 Actionable Career Guidance & Voice AI Simulation")
    html_builder.start_bullet_list()
    html_builder.add_bullet("Implement a 3-stage set-difference engine (Delta_req = S_req \\ S_user) that translates qualification deficits into project-anchored software deliverables.", "Objective 10: ")
    html_builder.add_bullet("Construct a What-If counterfactual simulator enabling candidates to evaluate how acquiring specific skills dynamically shifts their overall ranking score.", "Objective 11: ")
    html_builder.add_bullet("Build a real-time Voice AI Mock Interview Studio utilizing browser SpeechSynthesis and webkitSpeechRecognition, conducting technical probing informed by live web queries.", "Objective 12: ")
    html_builder.end_bullet_list()

    html_builder.add_h2("8.5 Strict Operational Integrity & Privacy")
    html_builder.start_bullet_list()
    html_builder.add_bullet("Enforce an absolute No-Mock-Data policy in production: no synthetic jobs, no fabricated scores, and mandatory requireProfile=1 gates.", "Objective 13: ")
    html_builder.add_bullet("Provide zero-persistence client modes to protect candidate personally identifiable information (PII).", "Objective 14: ")
    html_builder.end_bullet_list()

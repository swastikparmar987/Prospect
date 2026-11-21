import os
import subprocess
import shutil

ASSETS_DIR = "/Users/pro/Desktop/projects/FRUITWISE/prospect/public/report-assets"
OUT_PDF_1 = "/Users/pro/Desktop/projects/FRUITWISE/PROSPECT_Team_Video_Booklet.pdf"
OUT_PDF_2 = "/Users/pro/Desktop/projects/FRUITWISE/prospect/public/PROSPECT_Team_Video_Booklet.pdf"
HTML_PATH = "/tmp/prospect_team_booklet.html"

# File paths for figures
img_arch = f"file://{ASSETS_DIR}/diagram-system-architecture.png"
img_resume = f"file://{ASSETS_DIR}/diagram-resume-pipeline.png"
img_scoring = f"file://{ASSETS_DIR}/diagram-scoring-workflow.png"
img_landing = f"file://{ASSETS_DIR}/screenshot-landing.png"
img_profile = f"file://{ASSETS_DIR}/screenshot-profile.png"
img_discover = f"file://{ASSETS_DIR}/screenshot-discover.png"
img_prep = f"file://{ASSETS_DIR}/screenshot-prep.png"
img_tracker = f"file://{ASSETS_DIR}/screenshot-tracker.png"

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Prospect — Team Handbook & Video Production Guide</title>
<style>
  @page {{
    size: A4 portrait;
    margin: 16mm 14mm 16mm 14mm;
    @top-left {{
      content: "PROSPECT : TEAM HANDBOOK & VIDEO PRODUCTION GUIDE";
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 7.5pt;
      font-weight: 700;
      color: #94A3B8;
      letter-spacing: 0.06em;
    }}
    @bottom-right {{
      content: "Page " counter(page);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 8pt;
      color: #64748B;
    }}
    @bottom-left {{
      content: "Fruitwise Prospect Project • Internal Team Edition";
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 7.5pt;
      color: #94A3B8;
    }}
  }}

  * {{
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }}

  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    font-size: 9.3pt;
    line-height: 1.5;
    color: #1E293B;
    background: #FFFFFF;
    margin: 0;
    padding: 0;
  }}

  .page-break {{
    page-break-before: always;
    break-before: page;
  }}

  /* Cover Styling */
  .cover {{
    background: #F8F6F1;
    border: 2px solid #111111;
    border-radius: 6px;
    padding: 26px 22px;
    min-height: 245mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }}

  .cover-badge {{
    background: #111111;
    color: #DFFF43;
    display: inline-block;
    padding: 6px 14px;
    border-radius: 4px;
    font-weight: 800;
    font-size: 9pt;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }}

  .cover-title {{
    font-size: 26pt;
    font-weight: 900;
    color: #111111;
    line-height: 1.15;
    margin: 18px 0 10px 0;
    letter-spacing: -0.03em;
  }}

  .cover-sub {{
    font-size: 11pt;
    color: #475569;
    line-height: 1.45;
    border-left: 4px solid #DFFF43;
    padding-left: 14px;
    margin-bottom: 24px;
  }}

  .cover-meta {{
    background: #FFFFFF;
    border: 1px solid #CBD5E1;
    border-radius: 6px;
    padding: 16px 20px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    font-size: 9pt;
  }}

  .cover-meta-item strong {{
    display: block;
    font-size: 7.5pt;
    text-transform: uppercase;
    color: #64748B;
    letter-spacing: 0.05em;
  }}

  /* Headings */
  h1.chapter-title {{
    font-size: 14pt;
    font-weight: 800;
    color: #111111;
    border-bottom: 2.5px solid #111111;
    padding-bottom: 5px;
    margin-top: 10px;
    margin-bottom: 12px;
    page-break-after: avoid;
    break-after: avoid;
  }}

  h2.section-title {{
    font-size: 11pt;
    font-weight: 700;
    color: #111111;
    margin-top: 14px;
    margin-bottom: 6px;
    page-break-after: avoid;
    break-after: avoid;
  }}

  p {{
    margin: 0 0 7px 0;
    color: #334155;
    text-align: justify;
  }}

  /* Cards & Callouts */
  .card-lime {{
    background: #F8F6F1;
    border: 1px solid #E2E8F0;
    border-left: 5px solid #DFFF43;
    border-radius: 4px;
    padding: 11px 14px;
    margin: 10px 0 12px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }}

  .card-lavender {{
    background: #FDFCFE;
    border: 1px solid #EAE3FF;
    border-left: 5px solid #A855F7;
    border-radius: 4px;
    padding: 11px 14px;
    margin: 10px 0 12px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }}

  .card-title {{
    font-weight: 800;
    font-size: 9.3pt;
    color: #111111;
    margin-bottom: 4px;
  }}

  /* Script Box */
  .script-card {{
    background: #111111;
    color: #FFFFFF;
    border-radius: 6px;
    padding: 12px 16px;
    margin: 12px 0;
    border-left: 5px solid #DFFF43;
    page-break-inside: avoid;
    break-inside: avoid;
  }}

  .script-header {{
    display: flex;
    justify-content: space-between;
    font-size: 8.5pt;
    font-weight: 800;
    text-transform: uppercase;
    color: #DFFF43;
    letter-spacing: 0.08em;
    margin-bottom: 5px;
    border-bottom: 1px solid #334155;
    padding-bottom: 3px;
  }}

  .script-action {{
    font-size: 8.3pt;
    color: #94A3B8;
    margin-bottom: 6px;
  }}

  .script-speech {{
    font-size: 9pt;
    line-height: 1.45;
    color: #F8FAFC;
    font-style: italic;
  }}

  /* Tables */
  table {{
    width: 100%;
    border-collapse: collapse;
    font-size: 8.3pt;
    margin: 10px 0 14px 0;
    page-break-inside: avoid;
    break-inside: avoid;
  }}

  th {{
    background: #111111;
    color: #DFFF43;
    font-weight: 700;
    padding: 7px 9px;
    text-align: left;
    border: 1px solid #334155;
  }}

  td {{
    padding: 6px 9px;
    border: 1px solid #CBD5E1;
    color: #1E293B;
    vertical-align: top;
  }}

  tr:nth-child(even) td {{
    background: #F8F6F1;
  }}

  /* Figures - STRICT OVERFLOW GUARDS */
  .fig-container {{
    text-align: center;
    margin: 10px auto;
    page-break-inside: avoid;
    break-inside: avoid;
  }}

  .fig-img {{
    max-width: 92%;
    max-height: 105mm; /* Crucial: Never exceeds page space */
    width: auto;
    height: auto;
    object-fit: contain;
    border: 1px solid #CBD5E1;
    border-radius: 5px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    display: block;
    margin: 0 auto;
  }}

  .fig-caption {{
    font-size: 7.8pt;
    color: #64748B;
    font-style: italic;
    margin-top: 5px;
  }}

  ul {{
    margin: 4px 0 8px 0;
    padding-left: 18px;
  }}

  li {{
    margin-bottom: 3px;
    color: #334155;
  }}
</style>
</head>
<body>

  <!-- ==================== COVER PAGE ==================== -->
  <div class="cover">
    <div>
      <div class="cover-badge">Internal Team Booklet & Video Guide</div>
      <div class="cover-title">PROSPECT: The Simple Layman Handbook for Teammates</div>
      <div class="cover-sub">
        A complete, easy-to-read guide explaining what Prospect does, how every module works under the hood, how the Machine Learning matching operates, and exactly how to film your project demo video for submission.
      </div>
    </div>

    <div>
      <div class="cover-meta">
        <div class="cover-meta-item">
          <strong>Project Name</strong>
          Prospect — AI Career Intelligence Platform
        </div>
        <div class="cover-meta-item">
          <strong>Target Audience</strong>
          Team Members, Video Creators & Evaluators
        </div>
        <div class="cover-meta-item">
          <strong>Key Philosophy</strong>
          100% Layman English • Zero Jargon Confusion
        </div>
        <div class="cover-meta-item">
          <strong>Deliverable Output</strong>
          Video Demonstration & Teacher Q&A Defense
        </div>
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== CHAPTER 1 ==================== -->
  <h1 class="chapter-title">Chapter 1: The Core Story (What is Prospect in 60 Seconds?)</h1>
  
  <div class="card-lime">
    <div class="card-title">💡 The Real-World Problem We Are Solving:</div>
    Every student and junior engineer faces the exact same nightmare with job portals like LinkedIn, Indeed, and Naukri:
    <ul>
      <li><strong>Monetized for Employers:</strong> They promote companies that pay the most ad dollars, not the jobs that best fit your profile.</li>
      <li><strong>Black-Box Mystery Percentages:</strong> You see badges like <em>"You are in top 10% of applicants"</em>, but nobody knows how that was calculated.</li>
      <li><strong>Ghost Jobs:</strong> Up to 30% of postings remain live weeks after hiring closed, wasting candidate effort.</li>
      <li><strong>Silent Rejections:</strong> When you get rejected, you receive a generic template email with zero explanation of what specific skill you lacked.</li>
    </ul>
  </div>

  <h2 class="section-title">The Prospect Paradigm Shift</h2>
  <p>
    <strong>Prospect flips the table:</strong> instead of being an employer-first job directory, Prospect is an <strong>autonomous career intelligence copilot for the candidate</strong>.
  </p>
  <p>
    You upload your resume. Prospect reads your verified technical skills, searches the <strong>live internet</strong> for authentic tech jobs (strictly 0 fake jobs, all posted within the last 14 days), runs an explainable 5-pillar mathematical score, shows you your exact missing skills, generates a real mini-project roadmap to bridge that gap, and lets you practice a voice mock interview based on real developer forum discussions!
  </p>

  <div class="card-lavender">
    <div class="card-title">🎯 The 5 Core Pillars in Prospect:</div>
    <strong>1. Resume Parsing:</strong> Pulls real verified skills without AI making up fake stuff.<br>
    <strong>2. Live Job Hunter:</strong> Real-time web search across Tavily, Hacker News & Dev.to.<br>
    <strong>3. Explainable Math Score:</strong> 30% Skills + 25% Experience + 20% AI Match + 15% Title + 10% Trajectory.<br>
    <strong>4. Prep Studio & Voice AI:</strong> Identifies missing skills and tests you out loud via microphone.<br>
    <strong>5. Application Kanban:</strong> Tracks jobs from Saved &rarr; Applied &rarr; Offer.
  </div>

  <div class="page-break"></div>

  <!-- ==================== CHAPTER 1 CONTINUED (FIGURE 1 ON ITS OWN DEDICATED PAGE) ==================== -->
  <h1 class="chapter-title">System Architecture Blueprint</h1>
  <p>
    Below is the unified 5-layer architecture of Prospect. Notice how request flows from the React 19 / Next.js 15 Presentation Layer, down through API gateways and domain engines, into central AI model routers and persistent storage:
  </p>

  <div class="fig-container">
    <img src="{img_arch}" class="fig-img" alt="Prospect Architecture">
    <div class="fig-caption">Figure 1: High-level 5-layer workflow of Prospect from candidate upload to interview preparation.</div>
  </div>

  <div class="card-lime">
    <div class="card-title">🔑 How to Explain Figure 1 in 15 Seconds:</div>
    <em>"Sir, our architecture separates concerns cleanly into five layers: the top layer is our responsive Next.js 15 UI; underneath are our type-safe API gateways; in the center are our custom domain engines (128D embeddings and scoring); below that is our AI router with fallback logic; and at the bottom is Prisma ORM with SQLite and background workers."</em>
  </div>

  <div class="page-break"></div>

  <!-- ==================== CHAPTER 2 ==================== -->
  <h1 class="chapter-title">Chapter 2: The 5 Screens of Prospect (How It Works)</h1>
  <p>
    When your teammate sits down to record the demo video or talk about the project, here is the exact breakdown of the screens in the application:
  </p>

  <h2 class="section-title">Screen 1: Landing Page (<code>http://localhost:3000</code>)</h2>
  <p>
    The landing page introduces the candidate to the platform. It highlights Prospect's editorial design (Warm Ivory <code>#F8F6F1</code>, Electric Lime <code>#DFFF43</code>, and Ink Black <code>#111111</code>), explains our 5-pillar scoring methodology, and provides a quick onboarding entry point.
  </p>
  <div class="fig-container">
    <img src="{img_landing}" class="fig-img" alt="Landing Page">
    <div class="fig-caption">Figure 2: The Prospect Landing Page showcasing clean design and direct onboarding.</div>
  </div>

  <h2 class="section-title">Screen 2: Profile & Resume Analyzer (<code>/profile</code>)</h2>
  <p>
    <strong>What the user does:</strong> Drops a PDF or Word (<code>.docx</code>) resume file into the upload zone.
  </p>
  <p>
    <strong>What happens behind the scenes (Under the Hood):</strong>
  </p>
  <ul>
    <li><strong>Dual-Stream Binary Extraction:</strong> For PDFs, we read the character stream with <code>pdf-parse</code>. For Word docs, we use <code>mammoth</code>. If a Word file is malformed, our backend automatically inflates the raw <code>.docx</code> ZIP container and reads <code>word/document.xml</code> directly.</li>
    <li><strong>Smart 7-Section Boundary Splitter:</strong> Regular expressions segment the text into Contact Info, Summary, Experience, Education, Skills, Projects, and Certifications.</li>
    <li><strong>Single-Letter Disambiguation:</strong> A common resume flaw is confusing programming languages like <strong>"C"</strong>, <strong>"R"</strong>, or <strong>"Go"</strong> with normal English words. Prospect checks if surrounding words are technical tools before confirming a language match.</li>
    <li><strong>Zero AI Hallucination Guarantee:</strong> When the AI model formats the resume data into JSON, it must anchor every skill to an exact line in your resume. It cannot invent skills!</li>
  </ul>
  <div class="fig-container">
    <img src="{img_profile}" class="fig-img" alt="Profile Screen">
    <div class="fig-caption">Figure 3: Profile Workspace displaying extracted skills and verified experience.</div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== CHAPTER 3 ==================== -->
  <h1 class="chapter-title">Chapter 3: Job Discovery & The Match Score</h1>

  <h2 class="section-title">Screen 3: Live Opportunity Discovery (<code>/opportunities</code>)</h2>
  <p>
    Once your profile is ready, you search for open engineering roles.
  </p>
  <ul>
    <li><strong>Live Web Searching:</strong> Prospect dispatches parallel search requests to <strong>Tavily Search API</strong>, <strong>Hacker News "Who is Hiring"</strong>, and developer community feeds.</li>
    <li><strong>Strict No-Mock-Data Rule:</strong> In live mode, zero dummy or fake listings are shown. If you haven't uploaded a resume, it shows 0 jobs with an explicit empty-state message.</li>
    <li><strong>14-Day Freshness Filter:</strong> Any job published more than 14 days ago is automatically purged. You never waste time on dead or filled jobs.</li>
    <li><strong>3-Tier Deduplication:</strong> We strip URL tracking codes and compute an MD5 hash of title + company so identical cross-posted jobs are merged into one clean card.</li>
  </ul>
  <div class="fig-container">
    <img src="{img_discover}" class="fig-img" alt="Discovery Screen">
    <div class="fig-caption">Figure 4: Live Opportunity Discovery feed with match score badges and verified provider tags.</div>
  </div>

  <h2 class="section-title">The 5-Pillar Match Score (The Math Explained Simply)</h2>
  <div class="card-lavender">
    <div class="card-title">🎯 If your teacher asks: "How do you calculate the match score?"</div>
    Tell them: <em>"Sir, unlike LinkedIn which gives an opaque percentage, Prospect uses an explainable 5-pillar linear combination:"</em>
  </div>

  <table>
    <tr>
      <th style="width: 25%;">Evaluation Pillar</th>
      <th style="width: 15%;">Weight</th>
      <th style="width: 60%;">What It Checks in Plain English</th>
    </tr>
    <tr>
      <td><strong>1. Technical Skills</strong></td>
      <td><strong>30%</strong></td>
      <td>Checks how many of the required tools and frameworks you know (e.g. React, Next.js, Node.js).</td>
    </tr>
    <tr>
      <td><strong>2. Experience Level</strong></td>
      <td><strong>25%</strong></td>
      <td>Compares your years of experience against the company's minimum and preferred threshold.</td>
    </tr>
    <tr>
      <td><strong>3. Semantic Alignment</strong></td>
      <td><strong>20%</strong></td>
      <td>Our custom <strong>128-dimensional embedding model</strong> measures the deep conceptual overlap between your resume text and the job description.</td>
    </tr>
    <tr>
      <td><strong>4. Role Relevance</strong></td>
      <td><strong>15%</strong></td>
      <td>Uses the industry-standard <strong>Okapi BM25</strong> lexical algorithm to match job titles and responsibilities.</td>
    </tr>
    <tr>
      <td><strong>5. Career Trajectory</strong></td>
      <td><strong>10%</strong></td>
      <td>Evaluates the progression and increasing complexity of your past projects.</td>
    </tr>
  </table>

  <div class="page-break"></div>

  <!-- ==================== CHAPTER 4 ==================== -->
  <h1 class="chapter-title">Chapter 4: Preparation Studio & Voice AI Mock Interview</h1>

  <h2 class="section-title">Screen 4: Preparation Studio (<code>/prep</code>)</h2>
  <p>
    When a candidate wants to apply for a role where they only scored 65%, what should they do? Traditional job boards leave you stranded. Prospect gives you an actionable engineering plan:
  </p>
  <ul>
    <li><strong>The Set-Difference Gap Formula:</strong> <code>Missing Skills = Job Requirements − Your Skills</code>.</li>
    <li><strong>Project-Anchored Learning:</strong> It doesn't tell you to read a textbook. It looks at your existing project (e.g. your <em>"Full Stack Store"</em>) and says: <em>"Add Redis caching and Docker containerization to your Full Stack Store."</em></li>
    <li><strong>What-If Counterfactual Simulator:</strong> A dynamic slider where you can check off a missing skill (e.g. Redis) and watch your match score jump live on screen from 65% to 82%!</li>
  </ul>
  <div class="fig-container">
    <img src="{img_prep}" class="fig-img" alt="Prep Screen">
    <div class="fig-caption">Figure 5: Preparation Studio with skill gap checklist, What-If simulator, and audio interview studio.</div>
  </div>

  <h2 class="section-title">The Voice AI Mock Interview Studio</h2>
  <div class="card-lime">
    <div class="card-title">🎙️ How the Voice Interview Works:</div>
    <ul>
      <li>Click <strong>"Start Mock Interview"</strong>.</li>
      <li>The backend pulls real-world interview topics from live Hacker News and Dev.to developer discussions.</li>
      <li>The AI speaks realistic technical questions through your computer speaker using the browser's <strong>SpeechSynthesis</strong>.</li>
      <li>You speak your answer into your microphone. The browser captures your speech via <strong>SpeechRecognition</strong>.</li>
      <li>The AI grades your answer on technical accuracy, structure, and clarity, giving you instant constructive feedback!</li>
    </ul>
  </div>

  <h2 class="section-title">Screen 5: Application Lifecycle Tracker (<code>/tracker</code>)</h2>
  <p>
    Once prepared, the candidate manages their applications across an interactive Kanban board: <strong>Saved &rarr; Applied &rarr; Interviewing &rarr; Offered &rarr; Rejected</strong>, complete with interview dates, notes, and activity logs.
  </p>
  <div class="fig-container">
    <img src="{img_tracker}" class="fig-img" alt="Tracker Screen">
    <div class="fig-caption">Figure 6: Application Kanban Tracker managing candidate application status.</div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== CHAPTER 5 ==================== -->
  <h1 class="chapter-title">Chapter 5: The Exact Video Recording Script</h1>
  <p>
    Follow this scene-by-scene script when recording your project video for Google Drive. One teammate can click and share the screen while the other teammate speaks clearly:
  </p>

  <div class="script-card">
    <div class="script-header">
      <span>Scene 1: Introduction</span>
      <span>Route: / (Homepage)</span>
    </div>
    <div class="script-action">Action: Show the homepage, scroll smoothly through the features.</div>
    <div class="script-speech">
      "Hello Sir. Today we are presenting PROSPECT, an AI-powered Career Intelligence and Opportunity Discovery Platform. While platforms like LinkedIn and Indeed are built for employers who pay for ads, Prospect is engineered 100% for the candidate. It provides complete transparency into how you match with jobs, pulls real live opportunities from across the web, identifies your exact skill gaps, and prepares you with project-based milestones and a voice mock interview."
    </div>
  </div>

  <div class="script-card">
    <div class="script-header">
      <span>Scene 2: Resume Ingestion & Parsing</span>
      <span>Route: /profile</span>
    </div>
    <div class="script-action">Action: Click Profile, drop a PDF or DOCX resume, and show the extracted skills badges.</div>
    <div class="script-speech">
      "Here in the Profile Workspace, the candidate uploads their resume. Our backend extracts text directly using pdf-parse and mammoth, with an automatic XML inflate fallback for malformed Word documents. Notice how the system cleanly isolates work experience, education, and technical skills. Every extracted skill is anchored directly to verifiable text in the resume, completely eliminating AI hallucinations."
    </div>
  </div>

  <div class="script-card">
    <div class="script-header">
      <span>Scene 3: Live Job Discovery & 5-Pillar Score</span>
      <span>Route: /opportunities</span>
    </div>
    <div class="script-action">Action: Click Opportunities, filter for a role (e.g. Full Stack), and click on a job card.</div>
    <div class="script-speech">
      "Next, we move to Opportunity Discovery. Prospect searches live web sources including Tavily Search, Hacker News Who's Hiring, and Dev.to. We enforce a strict No-Mock-Data rule: all listings are verified, deduplicated, and posted within the last 14 days. Instead of an arbitrary percentage, Prospect uses an explainable 5-pillar scoring model combining our custom 128-dimensional semantic embedding engine with Okapi BM25 keyword relevance."
    </div>
  </div>

  <div class="script-card">
    <div class="script-header">
      <span>Scene 4: Skill Gap Analysis & What-If Simulation</span>
      <span>Route: /prep</span>
    </div>
    <div class="script-action">Action: Click Preparation Studio, view the missing skills, and toggle a checkbox on the What-If slider.</div>
    <div class="script-speech">
      "When a candidate targets an opportunity with a lower score, our Preparation Studio calculates the exact mathematical set difference between role requirements and candidate skills. It anchors learning to the candidate's existing projects. In our What-If simulator, if the candidate learns a missing technology like Docker or Redis, they toggle it and the system dynamically rescores them live on screen."
    </div>
  </div>

  <div class="script-card">
    <div class="script-header">
      <span>Scene 5: Voice Mock Interview & Tracker</span>
      <span>Route: /prep & /tracker</span>
    </div>
    <div class="script-action">Action: Click Start Mock Interview, let the AI ask one audio question, speak a short answer, then switch to Tracker.</div>
    <div class="script-speech">
      "Finally, our Voice AI Mock Interview Studio pulls real developer discussion questions and conducts an audio interview using the native Web Speech API—speaking questions aloud and grading the candidate's spoken response. The candidate then tracks their submissions on the interactive Kanban board. That completes the end-to-end Prospect platform!"
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== CHAPTER 6 ==================== -->
  <h1 class="chapter-title">Chapter 6: Teacher Q&A Defense (Top 5 Questions Answered)</h1>
  <p>
    If your teacher asks tough questions during evaluation, here are your bulletproof answers:
  </p>

  <table>
    <tr>
      <th style="width: 35%;">Expected Teacher Question</th>
      <th style="width: 65%;">Your Confident, Bulletproof Answer</th>
    </tr>
    <tr>
      <td><strong>1. "Are the job listings fake or mocked?"</strong></td>
      <td>
        <em>"No Sir, we strictly enforce an architectural No-Mock-Data policy. Our backend connects to live web APIs including Tavily Web Search and Hacker News Algolia. Furthermore, our 14-day freshness filter purges any listing older than two weeks so candidates never see dead jobs."</em>
      </td>
    </tr>
    <tr>
      <td><strong>2. "Which Machine Learning model did you train?"</strong></td>
      <td>
        <em>"We built an in-process 128-dimensional semantic embedding engine (<code>prospect-semantic-embed-v1-128d</code>) that projects text across 48 software concept clusters with sub-linear log-TF weights and an 80-dimensional Locality-Sensitive Hash. We combine this with Okapi BM25 lexical ranking and a 5-pillar linear score."</em>
      </td>
    </tr>
    <tr>
      <td><strong>3. "Why didn't you just use ChatGPT for everything?"</strong></td>
      <td>
        <em>"Because raw LLMs hallucinate skills, invent fake numbers, and introduce latency and high API costs. We use deterministic parsers for text extraction, mathematical formulas for scoring, and only use LLMs for structured schema formatting anchored to source resume text."</em>
      </td>
    </tr>
    <tr>
      <td><strong>4. "How does the voice interview work without expensive cloud audio APIs?"</strong></td>
      <td>
        <em>"We leveraged the browser's native Web Speech API—<code>SpeechSynthesis</code> for audio output and <code>webkitSpeechRecognition</code> for microphone input. It runs entirely inside the browser with zero API latency and zero cost."</em>
      </td>
    </tr>
    <tr>
      <td><strong>5. "What database are you using?"</strong></td>
      <td>
        <em>"We use Prisma ORM managing 12 relational models (UserProfile, Opportunity, Evaluation, PreparationPlan, Application, etc.). It currently runs on SQLite for fast local development and seamlessly migrates to PostgreSQL for production."</em>
      </td>
    </tr>
  </table>

  <div class="card-lime" style="text-align: center; margin-top: 24px;">
    <strong>🎉 Your Team is Ready!</strong><br>
    Read this booklet once, follow the Scene-by-Scene script in Chapter 5, and record your video with total confidence.
  </div>

</body>
</html>
"""

with open(HTML_PATH, "w", encoding="utf-8") as f:
    f.write(html_content)

brave_bin = "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"
cmd = [
    brave_bin,
    "--headless",
    "--disable-gpu",
    "--run-all-compositor-stages-before-draw",
    f"--print-to-pdf={OUT_PDF_1}",
    f"file://{HTML_PATH}"
]
res = subprocess.run(cmd, capture_output=True, text=True)
print("Brave exit code:", res.returncode)

shutil.copyfile(OUT_PDF_1, OUT_PDF_2)
print("Regenerated Team Booklet PDF successfully at:")
print("  -", OUT_PDF_1)
print("  -", OUT_PDF_2)

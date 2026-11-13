import { prisma } from "../src/lib/db";

export async function seedLiveTracker() {
  if (
    process.env.NODE_ENV === "production" ||
    process.env.PROSPECT_ALLOW_DEMO_SEED !== "true"
  ) {
    throw new Error(
      "NO_MOCK_DATA_POLICY_VIOLATION: Seeding synthetic tracker applications into the production database is prohibited."
    );
  }
  console.log("Seeding isolated test tracker applications...");

  const liveApps = [
    {
      opportunityId: "opp-career_feeds-ashby-modal-38888294-6bc7-4dab-b072-6d0f0c2ed79a",
      stage: "SAVED",
      targetDeadline: new Date("2027-01-15T23:59:59.000Z"),
      plannedNextAction: "Complete benchmark demo using Modal GPU containers",
      notes: "Modal Ashby posting for ML Research. Excellent match for Python, PyTorch, and deep learning. Connect SignBridge temporal GRU architecture with Modal's containerized inference.",
      materials: {
        resumeBulletsDraft: "• Developed deep learning models in PyTorch with temporal sequence classification for real-time inference.",
        coverLetterDraft: "Dear Modal Team,\n\nI am thrilled to apply for the ML Research Intern role at Modal. Having built SignBridge using PyTorch and MediaPipe with custom temporal sequence classification, I am inspired by Modal's serverless infrastructure for distributed model training and inference...",
        questionsDraft: "Q: Why Modal? A: Modal's developer ergonomics for GPU computing represent the future of machine learning infrastructure.",
        interviewChecklist: "• Review Modal container execution model\n• Prepare walk-through of SignBridge 3D landmark extraction pipeline\n• Practice PyTorch GPU memory profiling questions"
      },
      reminders: [
        { id: "rem-modal-1", title: "Test Modal serverless container deployment with small PyTorch model", dueDate: "25 Nov", isDone: false },
        { id: "rem-modal-2", title: "Submit tailored application via official Ashby board", dueDate: "05 Dec", isDone: false }
      ],
      events: [
        { fromStage: null, toStage: "SAVED", note: "Saved from live Ashby feed discovery", createdAt: new Date("2026-11-01T10:00:00.000Z") }
      ]
    },
    {
      opportunityId: "opp-CAREER_FEEDS-456789",
      stage: "SAVED",
      targetDeadline: new Date("2027-02-28T23:59:59.000Z"),
      plannedNextAction: "Tailor research portfolio with model evaluation metrics",
      notes: "Anthropic research role on AI alignment and safety. High alignment with PyTorch deep learning, empirical model evaluation, and generative AI research.",
      materials: {
        resumeBulletsDraft: "• Conducted rigorous model evaluation with precision, recall, and F1 benchmarks across multi-class neural networks.",
        coverLetterDraft: "Dear Anthropic Recruiting Team,\n\nI am writing to express my strong enthusiasm for the Machine Learning Research Engineer position. As a student specializing in Artificial Intelligence and Data Science at SRM University, Haryana, I have focused on applied machine learning, computer vision, and model evaluation...",
        questionsDraft: "Q: What excites you about Anthropic? A: The commitment to frontier safety research, mechanistic interpretability, and constitutional AI.",
        interviewChecklist: "• Review Anthropic published papers on mechanistic interpretability\n• Refresh Transformer attention mechanism mathematics\n• Prepare explanation of error analysis on Jal Drishti and SignBridge"
      },
      reminders: [
        { id: "rem-anthropic-1", title: "Document quantitative model evaluation metrics in SignBridge repo", dueDate: "20 Nov", isDone: false },
        { id: "rem-anthropic-2", title: "Draft tailored cover letter focusing on empirical ML experimentation", dueDate: "28 Nov", isDone: false }
      ],
      events: [
        { fromStage: null, toStage: "SAVED", note: "Saved from live Greenhouse feed discovery", createdAt: new Date("2026-10-28T14:30:00.000Z") }
      ]
    },
    {
      opportunityId: "opp-career_feeds-ashby-linear-112233",
      stage: "SAVED",
      targetDeadline: new Date("2027-03-10T23:59:59.000Z"),
      plannedNextAction: "Explore Linear API and GraphQL endpoints",
      notes: "High-quality engineering culture. Distributed client sync, real-time web infrastructure, and clean API design. Relevant to FastAPI and distributed backend systems experience.",
      materials: {
        resumeBulletsDraft: "• Engineered robust backend REST APIs using FastAPI with Pydantic schemas and PostgreSQL persistence.",
        coverLetterDraft: "Dear Linear Team,\n\nI have followed Linear's engineering philosophy for building lightning-fast software. I would love to contribute to your core systems as a Systems Engineer Intern...",
        questionsDraft: "Q: Why Linear? A: Passion for craftsmanship, exceptional performance, and opinionated tools that software builders love.",
        interviewChecklist: "• Review client-side synchronization and conflict resolution\n• Refresh WebSocket architecture and optimistic UI updates"
      },
      reminders: [
        { id: "rem-linear-1", title: "Explore Linear API and test webhook integrations", dueDate: "01 Dec", isDone: false }
      ],
      events: [
        { fromStage: null, toStage: "SAVED", note: "Saved from live Ashby board", createdAt: new Date("2026-11-02T09:15:00.000Z") }
      ]
    },
    {
      opportunityId: "opp-career_feeds-gh-scaleai-4689950005",
      stage: "SAVED",
      targetDeadline: new Date("2027-02-15T23:59:59.000Z"),
      plannedNextAction: "Review Scale AI foundational evaluation and data engine infrastructure",
      notes: "Human Frontier Collective fellowship. Focus on AI systems, evaluation harnesses, and scalable data curation pipelines.",
      materials: {
        resumeBulletsDraft: "• Built data curation and pre-processing pipelines for computer vision model training.",
        coverLetterDraft: "Dear Scale AI Team,\n\nI am writing to apply for the SWE Fellow role with the Human Frontier Collective...",
        questionsDraft: "Q: How do you approach data quality? A: Grounded verification with automated unit tests and continuous evaluation metrics.",
        interviewChecklist: "• Review RLHF and evaluation methodologies\n• Prepare walkthrough of dataset collection for CCTV attendance"
      },
      reminders: [
        { id: "rem-scale-1", title: "Review RLHF evaluation benchmarks", dueDate: "24 Nov", isDone: false }
      ],
      events: [
        { fromStage: null, toStage: "SAVED", note: "Saved from Scale AI Greenhouse board", createdAt: new Date("2026-11-03T16:00:00.000Z") }
      ]
    },
    {
      opportunityId: "opp-google-1",
      stage: "APPLIED",
      targetDeadline: new Date("2026-11-30T23:59:59.000Z"),
      plannedNextAction: "Review Google technical interview topics: graph traversal, dynamic programming, system architecture",
      notes: "Applied for Bengaluru Software Engineering Intern position on official Google Careers portal. Highlighted Jal Drishti water intelligence and AI attendance systems with full Python/C++ codebase.",
      materials: {
        resumeBulletsDraft: "• Designed computer vision prototype integrating face detection, alignment, and 512-dimensional embedding matching using cosine similarity.\n• Developed Jal Drishti water management prototype presented at Viksit Bharat Conclave.",
        coverLetterDraft: "Dear Google University Programs Team,\n\nI am a B.Tech Computer Science and Engineering (AI & DS) student at SRM University, Haryana, writing to express my enthusiasm for the Software Engineering Internship in Bengaluru...",
        questionsDraft: "Q: Why Google? A: Opportunity to learn world-class engineering standards and build planetary-scale software.",
        interviewChecklist: "• Master tree & graph traversals (BFS, DFS, Dijkstra)\n• Practice time & space complexity analysis\n• Review C++ memory management and STL algorithms"
      },
      reminders: [
        { id: "rem-google-1", title: "Review graph algorithms & dynamic programming patterns", dueDate: "18 Nov", isDone: true },
        { id: "rem-google-2", title: "Prepare architecture explanation for CCTV Attendance face embedding pipeline", dueDate: "22 Nov", isDone: false },
        { id: "rem-google-3", title: "Mock technical coding interview practice", dueDate: "26 Nov", isDone: false }
      ],
      events: [
        { fromStage: null, toStage: "SAVED", note: "Saved from Google Careers portal", createdAt: new Date("2026-10-10T11:00:00.000Z") },
        { fromStage: "SAVED", toStage: "APPLIED", note: "Submitted formal application on Google Careers", createdAt: new Date("2026-10-24T15:20:00.000Z") }
      ]
    },
    {
      opportunityId: "opp-CAREER_FEEDS-ab12-cd34",
      stage: "APPLIED",
      targetDeadline: new Date("2026-12-15T23:59:59.000Z"),
      plannedNextAction: "Send follow-up note to W&B recruiter",
      notes: "Applied to W&B ML experiment tracking infrastructure team. Tailored resume around Docker containerization, PostgreSQL queries, and FastAPI endpoints.",
      materials: {
        resumeBulletsDraft: "• Containerized microservices using Docker and orchestrated database schemas in PostgreSQL and MySQL.",
        coverLetterDraft: "Dear Weights & Biases Team,\n\nAs an AI/ML developer who uses experiment tracking tools constantly, I am thrilled to apply for the Backend Systems Intern role...",
        questionsDraft: "Q: What backend systems do you build? A: RESTful microservices with FastAPI, asynchronous task queues, and relational data modeling.",
        interviewChecklist: "• Review Docker container networking and volume mounts\n• Review SQL query optimization and indexes"
      },
      reminders: [
        { id: "rem-wandb-1", title: "Submitted application via Lever board", dueDate: "29 Oct", isDone: true },
        { id: "rem-wandb-2", title: "Send follow-up note to W&B recruiting coordinator", dueDate: "15 Nov", isDone: false }
      ],
      events: [
        { fromStage: null, toStage: "SAVED", note: "Saved from Lever feed", createdAt: new Date("2026-10-25T13:00:00.000Z") },
        { fromStage: "SAVED", toStage: "APPLIED", note: "Completed Lever application form with GitHub links", createdAt: new Date("2026-10-29T17:45:00.000Z") }
      ]
    },
    {
      opportunityId: "opp-career_feeds-gh-scaleai-4730845005",
      stage: "APPLIED",
      targetDeadline: new Date("2026-12-20T23:59:59.000Z"),
      plannedNextAction: "Practice timed coding challenges on LeetCode",
      notes: "Applied via official Greenhouse portal. Submitted portfolio links for SignBridge and AI-Powered CCTV Attendance projects.",
      materials: {
        resumeBulletsDraft: "• Implemented deep learning pipelines utilizing OpenCV and MediaPipe for landmark extraction.",
        coverLetterDraft: "Dear Scale AI Team,\n\nI am applying for the Software Engineering Internship. My hands-on experience in Generative AI, computer vision, and backend APIs matches Scale's core technical focus...",
        questionsDraft: "Q: What is your primary strength? A: Rapid prototype translation from academic research into working software.",
        interviewChecklist: "• Practice medium-level string and array problems\n• Review REST API design patterns"
      },
      reminders: [
        { id: "rem-scale-app-1", title: "Completed Scale AI Greenhouse application", dueDate: "02 Nov", isDone: true },
        { id: "rem-scale-app-2", title: "Practice timed coding challenges on LeetCode", dueDate: "16 Nov", isDone: false }
      ],
      events: [
        { fromStage: null, toStage: "SAVED", note: "Saved from Greenhouse board", createdAt: new Date("2026-10-29T10:00:00.000Z") },
        { fromStage: "SAVED", toStage: "APPLIED", note: "Submitted application via Greenhouse", createdAt: new Date("2026-11-02T14:00:00.000Z") }
      ]
    },
    {
      opportunityId: "opp-career_feeds-ashby-modal-a518f2cd-e0c7-4105-9004-d7971f7b1daf",
      stage: "APPLIED",
      targetDeadline: new Date("2027-01-05T23:59:59.000Z"),
      plannedNextAction: "Review SQL performance query optimization",
      notes: "Applied for Analytics Engineer position on Modal Ashby board. Emphasized SQL queries, Pandas/NumPy data transformations, and Python pipelines.",
      materials: {
        resumeBulletsDraft: "• Processed large-scale numerical datasets with Pandas and NumPy for real-time feature extraction.",
        coverLetterDraft: "Dear Modal Team,\n\nI am excited to apply for the Analytics Engineer role...",
        questionsDraft: "Q: Describe a data pipeline you built. A: In Jal Drishti, processed real-time sensor metrics and generated analytical water flow indicators.",
        interviewChecklist: "• Review SQL window functions, joins, and aggregates\n• Review Pandas vectorized operations vs standard loops"
      },
      reminders: [
        { id: "rem-modal-an-1", title: "Application submitted on Ashby", dueDate: "30 Oct", isDone: true }
      ],
      events: [
        { fromStage: null, toStage: "SAVED", note: "Saved from Ashby feed", createdAt: new Date("2026-10-26T12:00:00.000Z") },
        { fromStage: "SAVED", toStage: "APPLIED", note: "Submitted application on Ashby board", createdAt: new Date("2026-10-30T16:30:00.000Z") }
      ]
    },
    {
      opportunityId: "opp-ms-research-1",
      stage: "INTERVIEW",
      targetDeadline: new Date("2027-05-12T23:59:59.000Z"),
      plannedNextAction: "Round 2 Research Talk with Senior Principal Researcher",
      notes: "Passed Round 1 coding screen (PyTorch & NLP fundamentals). Next interview: 45-minute presentation on gesture recognition and multi-modal computer vision with Microsoft Research team.",
      materials: {
        resumeBulletsDraft: "• Developed deep learning sign language recognition using PyTorch, MediaPipe Hands, and GRU networks.",
        coverLetterDraft: "Dear Microsoft Research Team,\n\nI am thrilled to interview for the Research Intern role. My research interest focuses on multimodal learning and accessible human-computer interfaces...",
        questionsDraft: "Q: Describe the SignBridge architecture. A: 3D hand landmarks are normalized across frames and fed into bidirectional GRUs with attention for temporal gesture classification.",
        interviewChecklist: "• Rehearse 10-slide presentation on SignBridge and CCTV attendance\n• Prepare for deep-dive questions on GRU vs Transformer temporal modeling\n• Review Microsoft Research papers on accessible education tech"
      },
      reminders: [
        { id: "rem-msr-1", title: "Round 1 Technical Screen completed", dueDate: "02 Nov", isDone: true },
        { id: "rem-msr-2", title: "Prepare 10-slide deck on SignBridge & CCTV attendance architecture", dueDate: "14 Nov", isDone: false },
        { id: "rem-msr-3", title: "Review recent Microsoft Research vision papers", dueDate: "19 Nov", isDone: false }
      ],
      events: [
        { fromStage: null, toStage: "SAVED", note: "Saved from Microsoft Careers", createdAt: new Date("2026-10-15T09:00:00.000Z") },
        { fromStage: "SAVED", toStage: "APPLIED", note: "Application submitted", createdAt: new Date("2026-10-20T11:30:00.000Z") },
        { fromStage: "APPLIED", toStage: "INTERVIEW", note: "Recruiter called: Passed Round 1 Technical Screen! Advanced to faculty research interview.", createdAt: new Date("2026-11-04T16:00:00.000Z") }
      ]
    },
    {
      opportunityId: "opp-career_feeds-gh-stripe-8202299",
      stage: "INTERVIEW",
      targetDeadline: new Date("2026-12-18T23:59:59.000Z"),
      plannedNextAction: "Technical Phone Screen on Distributed APIs & Concurrency",
      notes: "Technical Phone Screen scheduled for next week. Review Stripe API architecture and idempotent payment event logging with Python and SQL.",
      materials: {
        resumeBulletsDraft: "• Architected high-throughput backend services using FastAPI with PostgreSQL database models.",
        coverLetterDraft: "Dear Stripe University Programs,\n\nStripe's developer-first infrastructure inspires my software engineering aspirations...",
        questionsDraft: "Q: How do you handle idempotency? A: Using unique client tokens stored in Redis/DB with atomic conditional inserts.",
        interviewChecklist: "• Review Stripe API idempotency guidelines\n• Brush up on system design: distributed rate limiting\n• Practice live coding in Python"
      },
      reminders: [
        { id: "rem-stripe-int-1", title: "Review Stripe API idempotency guidelines", dueDate: "12 Nov", isDone: false },
        { id: "rem-stripe-int-2", title: "Brush up on system design: distributed rate limiting", dueDate: "15 Nov", isDone: false }
      ],
      events: [
        { fromStage: null, toStage: "SAVED", note: "Saved from Stripe Careers", createdAt: new Date("2026-10-18T14:00:00.000Z") },
        { fromStage: "SAVED", toStage: "APPLIED", note: "Application submitted via Greenhouse", createdAt: new Date("2026-10-25T16:30:00.000Z") },
        { fromStage: "APPLIED", toStage: "INTERVIEW", note: "Recruiter invitation: Scheduled 60-min Technical Phone Screen", createdAt: new Date("2026-11-05T10:15:00.000Z") }
      ]
    },
    {
      opportunityId: "opp-iitb-1",
      stage: "INTERVIEW",
      targetDeadline: new Date("2027-04-20T23:59:59.000Z"),
      plannedNextAction: "Faculty Interview with CSE Department Lab",
      notes: "Faculty expressed strong interest in Jal Drishti water intelligence prototype. Interview to discuss research methodology and real-time computer vision deployment.",
      materials: {
        resumeBulletsDraft: "• Developed Jal Drishti, a prototype addressing water management challenges under India's Viksit Bharat vision, presented at the Viksit Bharat Conclave.",
        coverLetterDraft: "Respected Faculty Selection Committee,\n\nI am writing to apply for the Summer Research Program at IIT Bombay. My work on Jal Drishti and real-time computer vision models aligns with your department's ongoing research in embedded vision systems...",
        questionsDraft: "Q: What is the real-world value of Jal Drishti? A: Low-cost sensor and vision-based anomaly detection for scalable water infrastructure.",
        interviewChecklist: "• Prepare summary of Viksit Bharat Conclave presentation\n• Review edge AI deployment principles (YOLOv8 quantization)\n• Rehearse explanation of OpenCV camera calibration"
      },
      reminders: [
        { id: "rem-iitb-1", title: "Submit Statement of Purpose & recommendation", dueDate: "25 Oct", isDone: true },
        { id: "rem-iitb-2", title: "Faculty interview with CSE Department Professor", dueDate: "18 Nov", isDone: false }
      ],
      events: [
        { fromStage: null, toStage: "SAVED", note: "Saved from IIT Bombay Summer Fellowship portal", createdAt: new Date("2026-10-12T11:00:00.000Z") },
        { fromStage: "SAVED", toStage: "APPLIED", note: "Application submitted with academic transcripts", createdAt: new Date("2026-10-22T13:40:00.000Z") },
        { fromStage: "APPLIED", toStage: "INTERVIEW", note: "Faculty shortlisted profile for live technical discussion", createdAt: new Date("2026-11-03T18:00:00.000Z") }
      ]
    },
    {
      opportunityId: "opp-career_feeds-gh-stripe-8243617",
      stage: "OFFER",
      targetDeadline: new Date("2026-11-28T23:59:59.000Z"),
      plannedNextAction: "Review offer compensation package and return signed letter",
      notes: "Official offer received from Stripe Radar Machine Learning team! High-impact work on real-time transaction fraud detection models with Scikit-learn, PyTorch, and distributed inference engines.",
      materials: {
        resumeBulletsDraft: "• Implemented machine learning evaluation harnesses for classification accuracy, false positive rate control, and latency optimization.",
        coverLetterDraft: "Dear Stripe Team,\n\nThank you for the opportunity to join Stripe Radar as a Machine Learning Engineer...",
        questionsDraft: "Q: Why Radar? A: Radar processes hundreds of billions in volume with millisecond ML scoring, where model precision directly protects merchants globally.",
        interviewChecklist: "• Review compensation breakdown\n• Verify start date and relocation/remote stipends\n• Submit signed agreement before deadline"
      },
      outcome: "OFFER",
      outcomeReflection: "Rigorous 4-round interview process. The deep dive on model evaluation metrics, precision-recall trade-offs, and face embedding matching from my CCTV attendance project proved decisive.",
      outcomeLoggedAt: new Date("2026-11-05T19:00:00.000Z"),
      reminders: [
        { id: "rem-stripe-off-1", title: "Review offer letter details and health benefits", dueDate: "10 Nov", isDone: true },
        { id: "rem-stripe-off-2", title: "Sign and accept offer before decision deadline", dueDate: "20 Nov", isDone: false }
      ],
      events: [
        { fromStage: null, toStage: "SAVED", note: "Saved from Stripe Greenhouse board", createdAt: new Date("2026-10-05T09:00:00.000Z") },
        { fromStage: "SAVED", toStage: "APPLIED", note: "Applied via Greenhouse with portfolio link", createdAt: new Date("2026-10-12T14:30:00.000Z") },
        { fromStage: "APPLIED", toStage: "INTERVIEW", note: "Passed preliminary screens, completed 3 technical rounds", createdAt: new Date("2026-10-28T16:00:00.000Z") },
        { fromStage: "INTERVIEW", toStage: "OFFER", note: "OFFER EXTENDED! Received formal written offer from Stripe Radar Engineering leadership.", createdAt: new Date("2026-11-05T19:00:00.000Z") }
      ]
    }
  ];

  // Upsert each application
  for (const appData of liveApps) {
    const opp = await prisma.opportunity.findUnique({
      where: { id: appData.opportunityId }
    });

    if (!opp) {
      console.warn(`Opportunity ${appData.opportunityId} not found, skipping.`);
      continue;
    }

    // Check existing
    const existing = await prisma.application.findFirst({
      where: { opportunityId: appData.opportunityId }
    });

    if (existing) {
      // Update
      await prisma.application.update({
        where: { id: existing.id },
        data: {
          stage: appData.stage,
          targetDeadline: appData.targetDeadline,
          plannedNextAction: appData.plannedNextAction,
          notes: appData.notes,
          materials: JSON.stringify(appData.materials),
          outcome: appData.outcome || null,
          outcomeReflection: appData.outcomeReflection || null,
          outcomeLoggedAt: appData.outcomeLoggedAt || null,
          reminders: JSON.stringify(appData.reminders),
        }
      });
      console.log(`Updated application for ${opp.organization} — ${opp.title} (${appData.stage})`);
    } else {
      // Create with events
      const created = await prisma.application.create({
        data: {
          opportunityId: appData.opportunityId,
          stage: appData.stage,
          targetDeadline: appData.targetDeadline,
          plannedNextAction: appData.plannedNextAction,
          notes: appData.notes,
          materials: JSON.stringify(appData.materials),
          outcome: appData.outcome || null,
          outcomeReflection: appData.outcomeReflection || null,
          outcomeLoggedAt: appData.outcomeLoggedAt || null,
          reminders: JSON.stringify(appData.reminders),
          events: {
            create: appData.events.map(e => ({
              fromStage: e.fromStage,
              toStage: e.toStage,
              note: e.note,
              createdAt: e.createdAt,
            }))
          }
        }
      });
      console.log(`Created application for ${opp.organization} — ${opp.title} (${appData.stage}) [ID: ${created.id}]`);
    }
  }

  console.log("Successfully seeded live tracker applications!");
}

if (require.main === module) {
  seedLiveTracker()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}


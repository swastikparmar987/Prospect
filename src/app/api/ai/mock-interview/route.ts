import { NextResponse } from "next/server";
import { z } from "zod";
import { resolveAuthenticatedUser } from "@/lib/auth";
import { modelRouter } from "@/lib/ai/model-router";
import { Opportunity, UserProfile } from "@/types";

export interface MockInterviewQuestion {
  id: string;
  question: string;
  category: "Technical" | "Project Deep-Dive" | "Gap Probe" | "Behavioral / System Design";
  difficulty: "Core" | "Intermediate" | "Advanced";
  sourceType: "LIVE_WEB" | "AI_CAPABILITY";
  sourceLabel: string;
  sourceUrl?: string;
  targetCapability: string;
  whyAsked: string;
  expectedKeyPoints: string[];
}

const GenerateQuestionsSchema = z.object({
  action: z.literal("GENERATE_QUESTIONS"),
  roleTitle: z.string().optional(),
  organization: z.string().optional(),
  opportunity: z.any().optional(),
  profile: z.any().optional(),
});

const EvaluateAnswerSchema = z.object({
  action: z.literal("EVALUATE_ANSWER"),
  question: z.string().min(3),
  expectedKeyPoints: z.array(z.string()).default([]),
  targetCapability: z.string().optional(),
  sourceType: z.enum(["LIVE_WEB", "AI_CAPABILITY"]).optional(),
  transcript: z.string().default(""),
  roleTitle: z.string().optional(),
  organization: z.string().optional(),
  profile: z.any().optional(),
});

interface LiveWebItem {
  title: string;
  url: string;
  sourceLabel: string;
  snippet?: string;
}

async function fetchLiveWebInterviewTopics(
  roleTitle: string,
  skills: string[]
): Promise<{ items: LiveWebItem[]; sourcesChecked: string[] }> {
  const sourcesChecked: string[] = [];
  const items: LiveWebItem[] = [];
  const primarySkill = skills[0] || "software engineering";
  const cleanTag = primarySkill
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 24) || "programming";

  const fetchWithTimeout = async (url: string, init?: RequestInit) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  };

  const tasks: Promise<void>[] = [];

  // 1. Optional Tavily Web Search when configured
  const tavilyKey = process.env.TAVILY_API_KEY?.trim();
  if (tavilyKey) {
    tasks.push(
      (async () => {
        sourcesChecked.push("Tavily Live Web Search");
        try {
          const resp = await fetchWithTimeout("https://api.tavily.com/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: tavilyKey,
              query: `${roleTitle} ${skills.slice(0, 2).join(" ")} technical interview questions`,
              max_results: 4,
              search_depth: "basic",
            }),
          });
          if (!resp.ok) return;
          const data = await resp.json();
          for (const r of data.results || []) {
            if (r?.title && r?.url) {
              items.push({
                title: String(r.title),
                url: String(r.url),
                sourceLabel: "Tavily Live Web",
                snippet: String(r.content || "").slice(0, 220),
              });
            }
          }
        } catch {
          // Safe timeout fallback
        }
      })()
    );
  }

  // 2. Hacker News Algolia Live Interview Discussions API
  tasks.push(
    (async () => {
      sourcesChecked.push("Hacker News Live Algolia Feed");
      try {
        const q = encodeURIComponent(`${roleTitle} ${primarySkill} interview`);
        const resp = await fetchWithTimeout(
          `https://hn.algolia.com/api/v1/search?query=${q}&tags=story&hitsPerPage=4`
        );
        if (!resp.ok) return;
        const data = await resp.json();
        for (const hit of data.hits || []) {
          if (hit?.title && (hit?.url || hit?.objectID)) {
            items.push({
              title: String(hit.title),
              url: String(
                hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`
              ),
              sourceLabel: "Hacker News Live Web",
              snippet: hit.story_text ? String(hit.story_text).slice(0, 180) : undefined,
            });
          }
        }
      } catch {
        // Safe network fallback
      }
    })()
  );

  // 3. Dev.to Live Technical Articles API
  tasks.push(
    (async () => {
      sourcesChecked.push("Dev.to Engineering Feed");
      try {
        const resp = await fetchWithTimeout(
          `https://dev.to/api/articles?tag=${encodeURIComponent(cleanTag)}&per_page=4`
        );
        if (!resp.ok) return;
        const arr = await resp.json();
        if (Array.isArray(arr)) {
          for (const art of arr) {
            if (art?.title && art?.url) {
              items.push({
                title: String(art.title),
                url: String(art.url),
                sourceLabel: "Dev.to Live Web",
                snippet: String(art.description || "").slice(0, 180),
              });
            }
          }
        }
      } catch {
        // Safe network fallback
      }
    })()
  );

  // 4. StackOverflow Live Top-Voted Questions API
  tasks.push(
    (async () => {
      sourcesChecked.push("StackOverflow Live API");
      try {
        const q = encodeURIComponent(primarySkill);
        const resp = await fetchWithTimeout(
          `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=votes&tagged=${q}&site=stackoverflow&pagesize=3`
        );
        if (!resp.ok) return;
        const data = await resp.json();
        for (const qItem of data.items || []) {
          if (qItem?.title && qItem?.link) {
            items.push({
              title: String(qItem.title).replace(/&#39;|&quot;|&amp;/g, "'"),
              url: String(qItem.link),
              sourceLabel: "StackOverflow Live Web",
            });
          }
        }
      } catch {
        // Safe network fallback
      }
    })()
  );

  await Promise.allSettled(tasks);
  return { items: items.slice(0, 6), sourcesChecked };
}

function buildCapabilityQuestions(
  profile: UserProfile | null,
  opportunity: Opportunity | null,
  roleTitle: string,
  organization: string
): MockInterviewQuestion[] {
  const questions: MockInterviewQuestion[] = [];
  const skills = profile?.skills || [];
  const required = opportunity?.requiredSkills || [];
  const userSet = new Set(skills.map((s) => s.toLowerCase().trim()));
  const missingGaps = required.filter((s) => !userSet.has(s.toLowerCase().trim()));
  const matchedSkills = required.filter((s) => userSet.has(s.toLowerCase().trim()));

  const topProject = profile?.projects?.[0];
  if (topProject) {
    questions.push({
      id: "cap-proj-1",
      question: `Walk me through the architecture of "${topProject.name}" that you built using ${topProject.techStack.slice(0, 3).join(", ") || "your stack"}. What was the hardest technical bottleneck and how did you measure the improvement?`,
      category: "Project Deep-Dive",
      difficulty: "Intermediate",
      sourceType: "AI_CAPABILITY",
      sourceLabel: "AI Resume Capability Engine",
      targetCapability: `Project: ${topProject.name}`,
      whyAsked: `Inspects your real resume project "${topProject.name}" to verify ownership, architectural trade-offs, and measurable impact.`,
      expectedKeyPoints: [
        "Problem statement & system components",
        ...topProject.techStack.slice(0, 2),
        "Concrete bottleneck & trade-off chosen",
        "Measured result or test validation",
      ],
    });
  }

  const verifiedSkill = matchedSkills[0] || skills[0] || "Data Structures & Algorithms";
  questions.push({
    id: "cap-skill-1",
    question: `Your resume highlights proficiency in ${verifiedSkill}. In a ${roleTitle} context at ${organization}, how would you design, debug, and benchmark a production workflow using ${verifiedSkill}?`,
    category: "Technical",
    difficulty: "Core",
    sourceType: "AI_CAPABILITY",
    sourceLabel: "AI Resume Capability Engine",
    targetCapability: `Verified Skill: ${verifiedSkill}`,
    whyAsked: `Cross-validates your strongest resume capability (${verifiedSkill}) directly against ${organization}'s engineering standards.`,
    expectedKeyPoints: [
      `Core internals or best practices of ${verifiedSkill}`,
      "Error handling & edge-case testing",
      "Latency, memory, or throughput benchmarking",
    ],
  });

  const targetGap = missingGaps[0] || required[1] || "Distributed Caching & Scalability";
  questions.push({
    id: "cap-gap-1",
    question: `${organization}'s role calls for ${targetGap}, which isn't prominently evidenced in your resume yet. Drawing from your experience with ${skills.slice(0, 2).join(" & ") || "software fundamentals"}, how would you approach implementing and validating ${targetGap} in your first 30 days?`,
    category: "Gap Probe",
    difficulty: "Advanced",
    sourceType: "AI_CAPABILITY",
    sourceLabel: "AI Capability Gap Detector",
    targetCapability: `Role Gap: ${targetGap}`,
    whyAsked: `Probes whether you can transfer existing fundamentals (${skills[0] || "CS concepts"}) to bridge the "${targetGap}" gap detected between your resume and this job.`,
    expectedKeyPoints: [
      `Honest acknowledgement of current baseline`,
      `Core mental model of ${targetGap}`,
      "Concrete transfer plan from existing project experience",
    ],
  });

  const primaryExp = profile?.experiences?.[0];
  questions.push({
    id: "cap-behav-1",
    question: primaryExp
      ? `Tell me about a time during your role as ${primaryExp.title} at ${primaryExp.company} when requirements changed mid-sprint or an unexpected bug blocked delivery. How did you communicate trade-offs and resolve it?`
      : `Tell me about a high-pressure debugging or team disagreement during a technical build. How did you structure your root-cause analysis and align on a solution using the STAR method?`,
    category: "Behavioral / System Design",
    difficulty: "Intermediate",
    sourceType: "AI_CAPABILITY",
    sourceLabel: "AI STAR Capability Engine",
    targetCapability: primaryExp ? `Experience: ${primaryExp.company}` : "Engineering Collaboration",
    whyAsked: `Evaluates structured STAR storytelling grounded in your real academic or work history.`,
    expectedKeyPoints: [
      "Situation & specific technical constraint",
      "Your direct Action (not just team)",
      "Quantified or verified Result",
    ],
  });

  return questions;
}

function webItemToInterviewQuestion(
  item: LiveWebItem,
  idx: number,
  roleTitle: string,
  skills: string[]
): MockInterviewQuestion {
  const focusSkill = skills[idx % Math.max(1, skills.length)] || roleTitle;
  const cleanTitle = item.title.replace(/\s+/g, " ").trim();
  const isAlreadyQuestion = cleanTitle.endsWith("?");

  const formattedQuestion = isAlreadyQuestion
    ? `${cleanTitle} — Explain your engineering reasoning and how this applies to ${roleTitle}.`
    : `Inspired by live industry discussion "${cleanTitle}" (${item.sourceLabel}): What architectural trade-offs and failure modes would you evaluate when handling this in production?`;

  return {
    id: `web-q-${idx + 1}`,
    question: formattedQuestion,
    category: idx % 2 === 0 ? "Technical" : "Behavioral / System Design",
    difficulty: idx === 0 ? "Core" : "Intermediate",
    sourceType: "LIVE_WEB",
    sourceLabel: item.sourceLabel,
    sourceUrl: item.url,
    targetCapability: focusSkill,
    whyAsked: `Pulled live from ${item.sourceLabel} to test real-world ${focusSkill} scenarios actively discussed by engineers right now.`,
    expectedKeyPoints: [
      `Direct conceptual tie to "${cleanTitle.slice(0, 55)}"`,
      `Practical trade-offs & scalability for ${focusSkill}`,
      "Concrete example from your resume projects",
    ],
  };
}

export async function POST(req: Request) {
  try {
    resolveAuthenticatedUser(req);
    const body = await req.json();

    if (body?.action === "GENERATE_QUESTIONS") {
      const parsed = GenerateQuestionsSchema.parse(body);
      const profile = (parsed.profile || null) as UserProfile | null;
      const opportunity = (parsed.opportunity || null) as Opportunity | null;
      const roleTitle =
        parsed.roleTitle ||
        opportunity?.title ||
        profile?.targetRoles?.[0] ||
        "Software Engineering Intern";
      const organization =
        parsed.organization || opportunity?.organization || "Target Engineering Team";

      const combinedSkills = Array.from(
        new Set([
          ...(opportunity?.requiredSkills || []),
          ...(profile?.skills || []),
        ])
      ).slice(0, 5);

      const [webRes, aiCapabilityQs] = await Promise.all([
        fetchLiveWebInterviewTopics(roleTitle, combinedSkills),
        Promise.resolve(
          buildCapabilityQuestions(profile, opportunity, roleTitle, organization)
        ),
      ]);

      // Convert up to 3 live web items into structured interview questions
      const liveWebQuestions = webRes.items
        .slice(0, 3)
        .map((item, idx) =>
          webItemToInterviewQuestion(item, idx, roleTitle, combinedSkills)
        );

      // Interleave AI capability questions and live web questions
      const mergedQuestions: MockInterviewQuestion[] = [];
      const maxLen = Math.max(aiCapabilityQs.length, liveWebQuestions.length);
      for (let i = 0; i < maxLen; i++) {
        if (aiCapabilityQs[i]) mergedQuestions.push(aiCapabilityQs[i]);
        if (liveWebQuestions[i]) mergedQuestions.push(liveWebQuestions[i]);
      }

      // Optionally enhance via ModelRouter if live LLM key is configured
      let aiProvider = "Prospect Hybrid Web + Capability Engine";
      if (modelRouter.isAnyAiConfigured() && mergedQuestions.length > 0) {
        try {
          const LlmQuestionsSchema = z.object({
            additionalQuestion: z.string().min(15),
            expectedKeyPoints: z.array(z.string()).min(2),
          });
          const aiRes = await modelRouter.completeStructured(
            "REASONING",
            `Candidate skills: ${(profile?.skills || []).join(", ") || "General CS"}. Projects: ${(profile?.projects || []).map((p) => p.name).join(", ") || "None"}. Role: ${roleTitle} at ${organization}. Return strictly a JSON object with exact keys: {"additionalQuestion": string, "expectedKeyPoints": string[]} (write 1 sharp, non-generic technical interview question and 3 expected key points).`,
            LlmQuestionsSchema,
            { timeoutMs: 3500 }
          );
          if (aiRes?.data?.additionalQuestion) {
            aiProvider = `${aiRes.provider.toUpperCase()} (${aiRes.model}) + Live Web Feeds`;
            mergedQuestions.splice(1, 0, {
              id: `ai-llm-${Date.now()}`,
              question: aiRes.data.additionalQuestion,
              category: "Technical",
              difficulty: "Advanced",
              sourceType: "AI_CAPABILITY",
              sourceLabel: `Live AI (${aiRes.provider})`,
              targetCapability: combinedSkills[0] || roleTitle,
              whyAsked: `Dynamically synthesized by ${aiRes.provider} from your uploaded resume profile and ${organization}'s requirements.`,
              expectedKeyPoints: aiRes.data.expectedKeyPoints,
            });
          }
        } catch {
          // Graceful deterministic fallback already included
        }
      }

      return NextResponse.json({
        ok: true,
        roleTitle,
        organization,
        questions: mergedQuestions,
        webSourcesChecked: webRes.sourcesChecked,
        webQuestionsCount: liveWebQuestions.length,
        aiQuestionsCount: mergedQuestions.filter((q) => q.sourceType === "AI_CAPABILITY").length,
        aiProvider,
      });
    }

    if (body?.action === "EVALUATE_ANSWER") {
      const parsed = EvaluateAnswerSchema.parse(body);
      const transcript = parsed.transcript.trim();
      const profile = (parsed.profile || null) as UserProfile | null;

      if (transcript.length < 10) {
        return NextResponse.json(
          {
            error:
              "Please speak or enter at least a sentence (10+ characters) before requesting evaluation.",
          },
          { status: 400 }
        );
      }

      // Deterministic honest rubric analyzer (always grounded in transcript words vs expected points & STAR structure)
      const lower = transcript.toLowerCase();
      const words = transcript.split(/\s+/).filter(Boolean);
      const keyPoints = parsed.expectedKeyPoints || [];
      const matchedKeyPoints = keyPoints.filter((kp) => {
        const tokens = kp
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter((t) => t.length > 3);
        return tokens.some((t) => lower.includes(t));
      });
      const missingConcepts = keyPoints.filter((kp) => !matchedKeyPoints.includes(kp));

      const hasStarIndicators =
        /\b(built|designed|implemented|resolved|measured|reduced|improved|tested|deployed|benchmark|latency|percent|%)\b/i.test(
          transcript
        );
      const referencesResumeEvidence = Boolean(
        profile &&
          ((profile.projects || []).some((p) =>
            lower.includes(p.name.toLowerCase().split(" ")[0] || "___")
          ) ||
            (profile.skills || []).some((s) =>
              lower.includes(s.toLowerCase())
            ))
      );

      // Compute honest transparent metrics
      const technicalAccuracy = Math.min(
        96,
        Math.max(
          28,
          Math.round(
            (keyPoints.length > 0
              ? (matchedKeyPoints.length / keyPoints.length) * 65
              : 45) +
              (referencesResumeEvidence ? 22 : 8) +
              Math.min(12, Math.floor(words.length / 8))
          )
        )
      );
      const evidenceDepth = Math.min(
        96,
        Math.max(
          25,
          Math.round(
            (referencesResumeEvidence ? 48 : 24) +
              (hasStarIndicators ? 28 : 10) +
              Math.min(18, Math.floor(words.length / 6))
          )
        )
      );
      const clarity = Math.min(
        95,
        Math.max(
          35,
          Math.round(
            42 + Math.min(35, words.length * 0.7) + (transcript.includes(",") || transcript.includes(".") ? 14 : 4)
          )
        )
      );
      const starStructure = Math.min(
        95,
        Math.max(30, hasStarIndicators ? 76 + (words.length > 35 ? 12 : 0) : 45)
      );

      const overallScore = Math.round(
        (technicalAccuracy + evidenceDepth + clarity + starStructure) / 4
      );

      const deterministicStrengths = [
        ...(matchedKeyPoints.length > 0
          ? [`Addressed key concepts: ${matchedKeyPoints.slice(0, 2).join("; ")}`]
          : []),
        ...(referencesResumeEvidence
          ? ["Grounded your explanation directly in verified skills/projects from your resume."]
          : []),
        ...(hasStarIndicators
          ? ["Used concrete action verbs and implementation details."]
          : []),
      ];
      if (deterministicStrengths.length === 0) {
        deterministicStrengths.push(
          "Captured the general direction of the question."
        );
      }

      const defaultFeedback = {
        overallScore,
        metrics: {
          technicalAccuracy,
          evidenceDepth,
          clarity,
          starStructure,
        },
        spokenInterviewerResponse: `Thanks for sharing that answer. You scored ${overallScore} out of 100. ${
          deterministicStrengths[0] || ""
        } ${
          missingConcepts.length > 0
            ? `To make it stronger, try explicitly covering ${missingConcepts[0]}.`
            : "Your technical framing was concise and well grounded."
        }`,
        strengths: deterministicStrengths,
        missingConcepts:
          missingConcepts.length > 0
            ? missingConcepts
            : ["Consider quantifying system latency or throughput metrics to elevate senior-level clarity."],
        sampleStrongAnswer: `A standout response anchors with one specific project from your resume (${profile?.projects?.[0]?.name || "your core build"}), walks through the bottleneck diagnosis step-by-step, explains the engineering trade-offs${keyPoints[0] ? ` around ${keyPoints[0]}` : ""}, and closes with measured impact.`,
        followUpQuestion: `Quick follow-up: If traffic or dataset size grew 10x in that scenario, which single component would break first and why?`,
      };

      // Upgrade via live LLM if available
      if (modelRouter.isAnyAiConfigured()) {
        try {
          const EvalSchema = z.object({
            overallScore: z.number().min(0).max(100),
            spokenInterviewerResponse: z.string(),
            strengths: z.array(z.string()),
            missingConcepts: z.array(z.string()),
            sampleStrongAnswer: z.string(),
            followUpQuestion: z.string(),
          });
          const aiEval = await modelRouter.completeStructured(
            "REASONING",
            `Evaluate this candidate's mock interview answer strictly without inventing facts.
Role: ${parsed.roleTitle || "Software Engineer"} at ${parsed.organization || "Tech Team"}
Question: ${parsed.question}
Expected key points: ${keyPoints.join(", ")}
Candidate resume skills: ${(profile?.skills || []).join(", ")}
Candidate answer transcript: "${transcript}"

Return strictly JSON matching:
{"overallScore": number, "spokenInterviewerResponse": string, "strengths": string[], "missingConcepts": string[], "sampleStrongAnswer": string, "followUpQuestion": string}`,
            EvalSchema,
            { timeoutMs: 4000 }
          );
          if (aiEval?.data) {
            return NextResponse.json({
              ok: true,
              ...defaultFeedback,
              overallScore: Math.round(aiEval.data.overallScore),
              spokenInterviewerResponse: aiEval.data.spokenInterviewerResponse,
              strengths:
                aiEval.data.strengths.length > 0
                  ? aiEval.data.strengths
                  : defaultFeedback.strengths,
              missingConcepts:
                aiEval.data.missingConcepts.length > 0
                  ? aiEval.data.missingConcepts
                  : defaultFeedback.missingConcepts,
              sampleStrongAnswer: aiEval.data.sampleStrongAnswer,
              followUpQuestion: aiEval.data.followUpQuestion,
            });
          }
        } catch {
          // Use grounded deterministic rubric response cleanly
        }
      }

      return NextResponse.json({
        ok: true,
        ...defaultFeedback,
      });
    }

    return NextResponse.json(
      { error: "Unsupported mock-interview action" },
      { status: 400 }
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: "Mock interview service error",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

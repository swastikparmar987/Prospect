import { z } from "zod";
import { modelRouter } from "./ai/model-router";

/**
 * Zod Schema for Structured Resume Extraction via AI
 */
export const AiExtractedResumeSchema = z.object({
  fullName: z.string().nullable().optional(),
  headline: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  university: z.string().nullable().optional(),
  degree: z.string().nullable().optional(),
  major: z.string().nullable().optional(),
  graduationYear: z.number().int().min(1990).max(2035).nullable().optional(),
  graduationMonth: z.string().nullable().optional(),
  gpa: z.number().min(0).max(10).nullable().optional(),
  skills: z.array(z.string()).default([]),
  targetRoles: z.array(z.string()).default([]),
  coursework: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  awards: z.array(z.string()).default([]),
  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        techStack: z.array(z.string()).default([]),
        link: z.string().optional(),
      })
    )
    .default([]),
  experiences: z
    .array(
      z.object({
        title: z.string(),
        company: z.string(),
        duration: z.string(),
        bullets: z.array(z.string()).default([]),
        location: z.string().optional(),
      })
    )
    .default([]),
  portfolioLinks: z
    .array(
      z.object({
        label: z.string(),
        url: z.string(),
      })
    )
    .default([]),
});

export type AiExtractedResumeData = z.infer<typeof AiExtractedResumeSchema>;

/**
 * Extracts structured candidate profile facts from resume raw text using the Central Model Router
 * (Primary: Groq Cloud Qwen 3.8 / Llama 3, Secondary: Gemini, Fallback: Deterministic).
 * Returns null if no live LLM is configured or if the extraction / validation fails.
 */
export async function extractWithGemini(
  rawText: string
): Promise<AiExtractedResumeData | null> {
  if (!rawText || rawText.trim().length < 30) {
    return null;
  }

  const prompt = `You are an elite, high-precision resume parsing engine.
Extract structured career facts from the following resume text.

CRITICAL EXTRACTION RULES:
1. ONLY extract facts explicitly stated in the resume. NEVER fabricate or infer unmentioned details.
2. If full name cannot be clearly identified, return null. NEVER return "Candidate" or "User".
3. If location is not stated, return null. NEVER return "Remote / Flexible".
4. For education: prioritize the degree-granting university/college over high school or secondary school.
5. In graduationYear: extract the expected or actual graduation year of the degree program (e.g. 2028), NOT high school.
6. For GPA: extract numeric GPA/CGPA.
7. Skills: Extract individual technical skills. DO NOT match isolated characters like "R" or "C" unless explicitly listed as a programming language or skill.
8. Projects: Group all bullet points and details belonging to each project together under its correct project name. Extract the tech stack from the project description or "Technologies Used" line.
9. Experience: Extract past jobs or formal internships. If the candidate has 0 past jobs/internships, return an empty array [].

RESUME TEXT:
${rawText}

Return valid JSON adhering to this exact schema:
{
  "fullName": string or null,
  "headline": string or null,
  "email": string or null,
  "phone": string or null,
  "location": string or null,
  "university": string or null,
  "degree": string or null,
  "major": string or null,
  "graduationYear": number or null,
  "graduationMonth": string or null,
  "gpa": number or null,
  "skills": string[],
  "targetRoles": string[],
  "coursework": string[],
  "certifications": string[],
  "awards": string[],
  "projects": [
    {
      "name": string,
      "description": string,
      "techStack": string[],
      "link": string (optional)
    }
  ],
  "experiences": [
    {
      "title": string,
      "company": string,
      "duration": string,
      "bullets": string[],
      "location": string (optional)
    }
  ],
  "portfolioLinks": [
    {
      "label": string,
      "url": string
    }
  ]
}`;

  try {
    const result = await modelRouter.completeStructured(
      "FAST_EXTRACTION",
      prompt,
      AiExtractedResumeSchema,
      {
        temperature: 0.1,
        timeoutMs: 15000,
        systemPrompt: "You are a professional resume parser. Ground all facts in the text. Do not invent unmentioned details.",
      }
    );

    if (!result) {
      return null;
    }

    return result.data;
  } catch (err) {
    console.warn("[ModelRouter Resume Extractor] Failed, falling back to deterministic parser:", err);
    return null;
  }
}

import { Opportunity, UserProfile, EvaluationResult, ApplicationMaterials, PreparationPlan } from "@/types";
import { evaluateOpportunity } from "../scoring-engine";
import { generatePreparationPlan } from "../gap-action-engine";
import { generateApplicationMaterials } from "../prep-studio";
import { modelRouter } from "../ai/model-router";

export interface LLMProviderAdapter {
  name: string;
  isLive: boolean;
  evaluateOpportunity(opportunity: Opportunity, profile: UserProfile | null): Promise<EvaluationResult>;
  generatePrepPlan(opportunity: Opportunity, profile: UserProfile | null): Promise<PreparationPlan>;
  generateStudioMaterials(opportunity: Opportunity, profile: UserProfile | null): Promise<ApplicationMaterials>;
}

/**
 * Deterministic Engine Adapter.
 * Provides 100% reliable, reproducible, offline execution.
 * Free of hallucination because decisions and drafts are strictly calculated from typed facts.
 */
export class DeterministicLLMAdapter implements LLMProviderAdapter {
  name = "Deterministic Rule Engine (Offline/Demo Mode)";
  isLive = false;

  async evaluateOpportunity(opportunity: Opportunity, profile: UserProfile | null): Promise<EvaluationResult> {
    return evaluateOpportunity(opportunity, profile);
  }

  async generatePrepPlan(opportunity: Opportunity, profile: UserProfile | null): Promise<PreparationPlan> {
    return generatePreparationPlan(opportunity, profile);
  }

  async generateStudioMaterials(opportunity: Opportunity, profile: UserProfile | null): Promise<ApplicationMaterials> {
    return generateApplicationMaterials(opportunity, profile);
  }
}

/**
 * Live AI Model Router Adapter.
 * Uses the Central Model Router with Groq Cloud (Qwen 3.8 / Llama 3) as primary,
 * optional Gemini, and guaranteed deterministic fallback.
 */
export class CentralModelRouterAdapter implements LLMProviderAdapter {
  name = modelRouter.getActiveProviderName();
  isLive = modelRouter.isProviderAvailable("groq") || modelRouter.isProviderAvailable("gemini");

  async evaluateOpportunity(opportunity: Opportunity, profile: UserProfile | null): Promise<EvaluationResult> {
    // Preserve 100% deterministic rule accuracy for eligibility and score calculations
    return evaluateOpportunity(opportunity, profile);
  }

  async generatePrepPlan(opportunity: Opportunity, profile: UserProfile | null): Promise<PreparationPlan> {
    return generatePreparationPlan(opportunity, profile);
  }

  async generateStudioMaterials(opportunity: Opportunity, profile: UserProfile | null): Promise<ApplicationMaterials> {
    const baseMaterials = generateApplicationMaterials(opportunity, profile);
    if (!profile) return baseMaterials;

    try {
      const prompt = `You are a career materials advisor for university students.
Generate personalized, strictly factual application materials for this candidate and opportunity.

RULES:
1. ONLY reference facts from the candidate profile below. NEVER invent unlisted past employers, metrics, or degrees.
2. Structure your response in 4 distinct sections with exact headers:
### RESUME BULLETS
### COVER LETTER
### INTERVIEW CHECKLIST
### APPLICATION ANSWERS

CANDIDATE FACTS:
- Name: ${profile.fullName || "Candidate"}
- University: ${profile.university || "University"} (${profile.degree || "B.S."} in ${profile.major || "Computer Science"}, Grad Year: ${profile.graduationYear || "2025"})
- GPA: ${profile.gpa ?? "N/A"}
- Verified Skills: ${profile.skills?.join(", ") || "None listed"}
- Verified Experiences: ${JSON.stringify(profile.experiences || [])}
- Technical Projects: ${JSON.stringify(profile.projects || [])}
- Constraints: ${profile.constraints || "None"}

TARGET OPPORTUNITY:
- Role: ${opportunity.title}
- Organization: ${opportunity.organization}
- Category: ${opportunity.category}
- Required Skills: ${opportunity.requiredSkills.join(", ")}
- Preferred Skills: ${opportunity.preferredSkills.join(", ")}
- Description: ${opportunity.description}`;

      const res = await modelRouter.complete("STUDIO_MATERIALS", prompt, {
        temperature: 0.2,
        maxTokens: 1400,
        systemPrompt: "You are an expert career advisor. Ground all output strictly in verified candidate facts without fabricating credentials or metrics.",
      });

      if (!res.text || res.provider === "deterministic") {
        return baseMaterials;
      }

      const content = res.text;
      const bulletsSection = content.split("### RESUME BULLETS")[1]?.split("### COVER LETTER")[0]?.trim();
      const coverLetterSection = content.split("### COVER LETTER")[1]?.split("### INTERVIEW CHECKLIST")[0]?.trim();
      const interviewSection = content.split("### INTERVIEW CHECKLIST")[1]?.split("### APPLICATION ANSWERS")[0]?.trim();
      const answersSection = content.split("### APPLICATION ANSWERS")[1]?.trim();

      return {
        resumeBulletsDraft: bulletsSection || baseMaterials.resumeBulletsDraft,
        coverLetterDraft: coverLetterSection || baseMaterials.coverLetterDraft,
        interviewChecklist: interviewSection || baseMaterials.interviewChecklist,
        questionsDraft: answersSection || baseMaterials.questionsDraft,
      };
    } catch (err) {
      console.warn("[ModelRouterAdapter] Studio generation failed; using deterministic materials:", err);
      return baseMaterials;
    }
  }
}

/**
 * Backward compatibility exports
 */
export const GroqLLMAdapter = CentralModelRouterAdapter;
export const GeminiLLMAdapter = CentralModelRouterAdapter;

export function getLLMAdapter(): LLMProviderAdapter {
  if (modelRouter.isProviderAvailable("groq") || modelRouter.isProviderAvailable("gemini")) {
    return new CentralModelRouterAdapter();
  }
  return new DeterministicLLMAdapter();
}

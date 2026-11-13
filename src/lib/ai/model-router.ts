import { z } from "zod";

/**
 * Task Categories for Central AI Model Router
 */
export type ModelTaskCategory =
  | "FAST_EXTRACTION"
  | "REASONING"
  | "STUDIO_MATERIALS"
  | "DETERMINISTIC";

export interface ModelCompletionOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  timeoutMs?: number;
  jsonMode?: boolean;
}

export interface ModelCompletionResult {
  text: string;
  provider: "groq" | "gemini" | "deterministic";
  model: string;
  latencyMs: number;
  tokensEstimate: {
    prompt: number;
    completion: number;
    total: number;
  };
  cached?: boolean;
}

export interface ProviderHealth {
  consecutiveFailures: number;
  circuitOpenUntil: number | null;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  lastError: string | null;
}

/**
 * Central AI Model Router
 * Directs AI tasks to configured fast or reasoning models with bounded retries,
 * circuit breaking, and guaranteed fallback to deterministic rule engines.
 */
export class ModelRouter {
  private groqApiKey?: string;
  private geminiApiKey?: string;
  private groqModel: string;
  private geminiModel: string;

  private health: Record<"groq" | "gemini", ProviderHealth> = {
    groq: {
      consecutiveFailures: 0,
      circuitOpenUntil: null,
      lastSuccessAt: null,
      lastFailureAt: null,
      lastError: null,
    },
    gemini: {
      consecutiveFailures: 0,
      circuitOpenUntil: null,
      lastSuccessAt: null,
      lastFailureAt: null,
      lastError: null,
    },
  };

  constructor() {
    this.syncEnvKeys();
    this.groqModel = process.env.GROQ_MODEL || "qwen/qwen3.8-27b";
    this.geminiModel = process.env.GEMINI_MODEL || "gemini-1.5-flash";
  }

  private syncEnvKeys(): void {
    if (process.env.GROQ_API_KEY !== undefined) {
      this.groqApiKey = process.env.GROQ_API_KEY.trim() || undefined;
    }
    if (process.env.GEMINI_API_KEY !== undefined) {
      this.geminiApiKey = process.env.GEMINI_API_KEY.trim() || undefined;
    }
    if (process.env.GROQ_MODEL?.trim()) {
      this.groqModel = process.env.GROQ_MODEL.trim();
    }
    if (process.env.GEMINI_MODEL?.trim()) {
      this.geminiModel = process.env.GEMINI_MODEL.trim();
    }
  }

  /**
   * Returns true if at least one live LLM provider key is configured
   */
  public isAnyAiConfigured(): boolean {
    this.syncEnvKeys();
    return Boolean(this.groqApiKey || this.geminiApiKey);
  }

  /**
   * Returns a human-readable unavailable message if no AI API key is configured
   * or if all configured providers have open circuit breakers.
   */
  public getAiUnavailableReason(): string | null {
    this.syncEnvKeys();
    if (!this.groqApiKey && !this.geminiApiKey) {
      return "Live AI API key is not configured (GROQ_API_KEY or GEMINI_API_KEY missing). Showing deterministic evidence-based analysis only; no AI output is fabricated.";
    }
    if (!this.isProviderAvailable("groq") && !this.isProviderAvailable("gemini")) {
      return "Live AI provider circuit breaker is temporarily open due to upstream API errors. Showing deterministic evidence-based analysis only.";
    }
    return null;
  }

  /**
   * Check if a specific provider is configured and circuit is closed
   */
  public isProviderAvailable(provider: "groq" | "gemini"): boolean {
    this.syncEnvKeys();
    const key = provider === "groq" ? this.groqApiKey : this.geminiApiKey;
    if (!key) return false;

    const health = this.health[provider];
    if (health.circuitOpenUntil && Date.now() < health.circuitOpenUntil) {
      return false; // Circuit breaker open
    }
    return true;
  }

  public getActiveProviderName(): string {
    const configuredPref = (process.env.LLM_PROVIDER || "").toLowerCase();
    if (configuredPref === "groq" && this.isProviderAvailable("groq")) {
      return `Groq Cloud (${this.groqModel})`;
    }
    if (configuredPref === "gemini" && this.isProviderAvailable("gemini")) {
      return `Google Gemini (${this.geminiModel})`;
    }
    if (this.isProviderAvailable("groq")) {
      return `Groq Cloud (${this.groqModel})`;
    }
    if (this.isProviderAvailable("gemini")) {
      return `Google Gemini (${this.geminiModel})`;
    }
    return "Deterministic Rule Engine (Offline/Fallback)";
  }

  /**
   * Main completion router with automatic fallback chain
   */
  public async complete(
    task: ModelTaskCategory,
    prompt: string,
    options: ModelCompletionOptions = {}
  ): Promise<ModelCompletionResult> {
    const startTime = Date.now();

    // 1. Try Groq if available (or if preferred)
    if (this.isProviderAvailable("groq")) {
      try {
        const res = await this.callGroq(task, prompt, options);
        this.recordSuccess("groq");
        return {
          text: res,
          provider: "groq",
          model: this.groqModel,
          latencyMs: Date.now() - startTime,
          tokensEstimate: {
            prompt: Math.ceil(prompt.length / 4),
            completion: Math.ceil(res.length / 4),
            total: Math.ceil((prompt.length + res.length) / 4),
          },
        };
      } catch (err: any) {
        this.recordFailure("groq", err?.message || "Groq call failed");
        console.warn(`[ModelRouter] Groq failed for task ${task}:`, err?.message);
      }
    }

    // 2. Try Gemini if configured and Groq was unavailable or failed
    if (this.isProviderAvailable("gemini")) {
      try {
        const res = await this.callGemini(task, prompt, options);
        this.recordSuccess("gemini");
        return {
          text: res,
          provider: "gemini",
          model: this.geminiModel,
          latencyMs: Date.now() - startTime,
          tokensEstimate: {
            prompt: Math.ceil(prompt.length / 4),
            completion: Math.ceil(res.length / 4),
            total: Math.ceil((prompt.length + res.length) / 4),
          },
        };
      } catch (err: any) {
        this.recordFailure("gemini", err?.message || "Gemini call failed");
        console.warn(`[ModelRouter] Gemini failed for task ${task}:`, err?.message);
      }
    }

    // 3. Fallback to deterministic message
    return {
      text: "",
      provider: "deterministic",
      model: "deterministic-engine-v1",
      latencyMs: Date.now() - startTime,
      tokensEstimate: { prompt: 0, completion: 0, total: 0 },
    };
  }

  /**
   * Structured Completion: Guarantees parsed and Zod-validated output
   */
  public async completeStructured<T>(
    task: ModelTaskCategory,
    prompt: string,
    schema: z.ZodType<T>,
    options: ModelCompletionOptions = {}
  ): Promise<{ data: T; provider: string; model: string } | null> {
    const maxRetries = 2;
    let attempt = 0;

    const systemPrompt = `${options.systemPrompt || "You are an accurate, factual assistant."}
You MUST output valid, raw JSON conforming strictly to the required schema. Do not wrap with backticks or markdown fences. Output ONLY the JSON.`;

    while (attempt <= maxRetries) {
      attempt++;
      const result = await this.complete(task, prompt, {
        ...options,
        systemPrompt,
        jsonMode: true,
      });

      if (!result.text || result.provider === "deterministic") {
        return null;
      }

      try {
        // Strip any markdown fences if present
        let cleanText = result.text.trim();
        if (cleanText.startsWith("```json")) {
          cleanText = cleanText.substring(7);
        } else if (cleanText.startsWith("```")) {
          cleanText = cleanText.substring(3);
        }
        if (cleanText.endsWith("```")) {
          cleanText = cleanText.substring(0, cleanText.length - 3);
        }
        cleanText = cleanText.trim();

        const rawJson = JSON.parse(cleanText);
        const parsed = schema.safeParse(rawJson);

        if (parsed.success) {
          return {
            data: parsed.data,
            provider: result.provider,
            model: result.model,
          };
        } else {
          console.warn(`[ModelRouter] Structured schema validation error (attempt ${attempt}):`, parsed.error.issues);
        }
      } catch (parseErr: any) {
        console.warn(`[ModelRouter] JSON parsing error on attempt ${attempt}:`, parseErr?.message);
      }
    }

    return null;
  }

  /**
   * Groq Cloud Implementation with model fallback chain
   */
  private async callGroq(
    task: ModelTaskCategory,
    prompt: string,
    options: ModelCompletionOptions
  ): Promise<string> {
    const timeoutMs = options.timeoutMs || 15000;
    const temperature = options.temperature ?? (task === "FAST_EXTRACTION" ? 0.1 : 0.2);
    const maxTokens = options.maxTokens || (task === "STUDIO_MATERIALS" ? 1400 : 2048);

    const candidateModels = Array.from(
      new Set([this.groqModel, "qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"])
    );

    let lastError: Error | null = null;
    for (const modelName of candidateModels) {
      try {
        const body: Record<string, any> = {
          model: modelName,
          messages: [
            {
              role: "system",
              content:
                options.systemPrompt ||
                "You are an expert career and candidate intelligence engine. Be concise, strictly factual, and grounded in provided facts.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature,
          max_tokens: maxTokens,
        };

        if (options.jsonMode) {
          body.response_format = { type: "json_object" };
        }

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.groqApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs),
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Groq HTTP ${response.status} (${modelName}): ${errText.substring(0, 150)}`);
        }

        const json = await response.json();
        const content = json.choices?.[0]?.message?.content || "";
        if (content) {
          this.groqModel = modelName;
          return content;
        }
      } catch (err: any) {
        lastError = err instanceof Error ? err : new Error(String(err));
      }
    }

    throw lastError || new Error("Groq completion failed across all candidate models");
  }

  /**
   * Google Gemini Implementation (Optional)
   */
  private async callGemini(
    task: ModelTaskCategory,
    prompt: string,
    options: ModelCompletionOptions
  ): Promise<string> {
    const timeoutMs = options.timeoutMs || 15000;
    const temperature = options.temperature ?? (task === "FAST_EXTRACTION" ? 0.1 : 0.2);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModel}:generateContent?key=${this.geminiApiKey}`;

    const body: Record<string, any> = {
      contents: [
        {
          role: "user",
          parts: [
            options.systemPrompt ? { text: `${options.systemPrompt}\n\n${prompt}` } : { text: prompt },
          ],
        },
      ],
      generationConfig: {
        temperature,
      },
    };

    if (options.jsonMode) {
      body.generationConfig.responseMimeType = "application/json";
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini HTTP ${response.status}: ${errText.substring(0, 150)}`);
    }

    const json = await response.json();
    return json.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }

  private recordSuccess(provider: "groq" | "gemini") {
    this.health[provider].consecutiveFailures = 0;
    this.health[provider].circuitOpenUntil = null;
    this.health[provider].lastSuccessAt = new Date();
  }

  private recordFailure(provider: "groq" | "gemini", error: string) {
    const h = this.health[provider];
    h.consecutiveFailures++;
    h.lastFailureAt = new Date();
    h.lastError = error;

    // Open circuit breaker after 3 consecutive failures for 30 seconds
    if (h.consecutiveFailures >= 3) {
      h.circuitOpenUntil = Date.now() + 30000;
      console.warn(`[ModelRouter] Circuit breaker opened for ${provider} for 30s`);
    }
  }
}

// Global Singleton Instance
export const modelRouter = new ModelRouter();

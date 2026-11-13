import crypto from "crypto";
import { PostingGuardResult } from "../types";

// Unicode character sets ported from upstream tools/posting_guard.py
const ZERO_WIDTH_REGEX = /[\u200b\u200c\u200d\u2060\ufeff\u00ad\u034f\u061c\u180e]/g;
const BIDI_REGEX = /[\u202a-\u202e\u2066-\u2069\u200e\u200f]/g;
const FORMAT_MISC_REGEX = /[\u2028\u2029\u2061-\u2064\u206a-\u206f\ufff9-\ufffb]/g;
const VARIATION_SELECTOR_REGEX = /[\ufe00-\ufe0f]|[\udb40][\udd00-\uddef]/g;

// Hidden HTML inline style checks
const HIDDEN_STYLE_PATTERNS: RegExp[] = [
  /display\s*:\s*none/i,
  /visibility\s*:\s*hidden/i,
  /opacity\s*:\s*0(?:\.0+)?(?:\s*;|\s*$)/i,
  /font-size\s*:\s*0(?:px|em|rem|pt|%)?(?:\s*;|\s*$)/i,
  /color\s*:\s*transparent/i,
  /text-indent\s*:\s*-\d{3,}px/i,
  /(?:left|top)\s*:\s*-\d{3,}px/i,
  /(?:width|height|max-width|max-height)\s*:\s*0(?:px)?(?:\s*;|\s*$)/i,
];

// Prompt-injection / instruction-like patterns ported from tools/posting_guard.py
const INJECTION_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /\b(ignore|disregard|forget|override|bypass)\b.{0,40}\b(previous|prior|above|earlier|all|system|initial)\b.{0,30}\b(instructions?|prompts?|rules?|directives?|guidelines?|constraints?)/i,
    reason: "instruction-override phrase",
  },
  {
    pattern: /\b(new|updated|actual|real|true)\s+(instructions?|prompt|directives?|task|system\s+message)\s*:/i,
    reason: "replaces instructions",
  },
  {
    pattern: /\byou\s+are\s+(now|actually|really)\s+(a|an|the)\b/i,
    reason: "role reassignment",
  },
  {
    pattern: /\bact\s+as\s+(if\s+you\s+are|a|an)\s+(?!part\s+of|a\s+bridge|a\s+liaison|a\s+mentor|a\s+partner|an?\s+trusted|an?\s+subject|an?\s+technical|an?\s+internal|an?\s+champion|an?\s+owner|an?\s+advisor)/i,
    reason: "role reassignment (act as)",
  },
  {
    pattern: /\b(system\s+prompt|developer\s+message|assistant\s+response|user\s+prompt)\b/i,
    reason: "prompt-structure reference",
  },
  {
    pattern: /(?:^|\s)(\[system\]|\[inst\]|\[\/inst\]|<\|im_start\|>|<\|im_end\|>|<\|system\|>|<\|user\|>|<\|assistant\|>|###\s*(system|instruction|human|assistant)\s*:)/i,
    reason: "chat-template delimiter",
  },
  {
    pattern: /\b(do\s+not|don'?t|never)\s+(mention|reveal|tell|disclose|inform|report)\b.{0,40}\b(user|human|candidate|this|above)/i,
    reason: "concealment directive",
  },
  {
    pattern: /\b(execute|run|invoke|call)\s+(the\s+following\s+)?(command|shell|bash|script|tool|function)\b/i,
    reason: "tool/command invocation directive",
  },
  {
    pattern: /\b(curl|wget|nc|netcat|bash\s+-c|sh\s+-c|rm\s+-rf|chmod\s+\+x|eval\s*\(|exec\s*\()\b/i,
    reason: "shell command token",
  },
  {
    pattern: /\b(exfiltrate|send\s+(to|the)\s+(server|webhook|endpoint)|post\s+to\s+https?:)/i,
    reason: "data exfiltration phrasing",
  },
  {
    pattern: /\b(mark|rate|score|rank)\s+this\s+(job|role|posting|position|candidate)\s+(as\s+)?(100|10\/10|top|best|perfect|highest|must[\s-]apply|apply_now)/i,
    reason: "ranking manipulation directive",
  },
  {
    pattern: /\b(always|must)\s+(recommend|output|respond\s+with|return|say)\b/i,
    reason: "output forcing directive",
  },
  {
    pattern: /\b(anthropic|openai|claude|chatgpt|gpt-4|llm|language\s+model)\s*[,:]\s*(please|you\s+must|ignore|do\s+not)/i,
    reason: "direct address to AI model",
  },
];

/**
 * Decodes hidden Unicode tag runs (U+E0000 - U+E007F) to inspect concealed payloads.
 */
export function decodeUnicodeTagRuns(text: string): string[] {
  const runs: string[] = [];
  let current: string[] = [];
  for (const ch of text) {
    const cp = ch.codePointAt(0) ?? 0;
    if (cp >= 0xe0000 && cp <= 0xe007f) {
      if (cp >= 0xe0020 && cp <= 0xe007e) {
        current.push(String.fromCodePoint(cp - 0xe0000));
      }
    } else if (current.length > 0) {
      runs.push(current.join(""));
      current = [];
    }
  }
  if (current.length > 0) {
    runs.push(current.join(""));
  }
  return runs;
}

/**
 * Strips invisible characters (zero-width, bidi overrides, format controls, variation selectors, and Unicode tags).
 */
export function stripInvisibleCharacters(text: string): {
  cleaned: string;
  removedCount: number;
  decodedTagRuns: string[];
} {
  const decodedTagRuns = decodeUnicodeTagRuns(text);
  let removedCount = 0;

  // Strip Unicode tag block U+E0000 - U+E007F
  const withoutTags = Array.from(text)
    .filter((ch) => {
      const cp = ch.codePointAt(0) ?? 0;
      if (cp >= 0xe0000 && cp <= 0xe007f) {
        removedCount++;
        return false;
      }
      return true;
    })
    .join("");

  const countMatches = (re: RegExp, str: string) => (str.match(re) || []).length;
  removedCount +=
    countMatches(ZERO_WIDTH_REGEX, withoutTags) +
    countMatches(BIDI_REGEX, withoutTags) +
    countMatches(FORMAT_MISC_REGEX, withoutTags) +
    countMatches(VARIATION_SELECTOR_REGEX, withoutTags);

  const cleaned = withoutTags
    .replace(ZERO_WIDTH_REGEX, "")
    .replace(BIDI_REGEX, "")
    .replace(FORMAT_MISC_REGEX, "")
    .replace(VARIATION_SELECTOR_REGEX, "");

  return { cleaned, removedCount, decodedTagRuns };
}

/**
 * Strips hidden HTML elements (script/style/template/comments and elements with display:none, opacity:0, hidden, aria-hidden)
 * and extracts clean visible text.
 */
export function stripHiddenHtmlAndExtractVisible(raw: string): {
  visibleText: string;
  removedHiddenHtmlCount: number;
} {
  if (!raw) return { visibleText: "", removedHiddenHtmlCount: 0 };

  let removedHiddenHtmlCount = 0;
  let working = raw;

  // Pre-decode escaped HTML entities (e.g., Greenhouse API returns &lt;p&gt;...&lt;/p&gt;)
  if (working.includes("&lt;") || working.includes("&gt;") || working.includes("&amp;")) {
    working = working
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&nbsp;/gi, " ");
  }

  // Remove HTML comments
  working = working.replace(/<!--[\s\S]*?-->/g, () => {
    removedHiddenHtmlCount++;
    return " ";
  });

  // Remove script, style, template, noscript tags and their contents
  working = working.replace(
    /<(script|style|template|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi,
    () => {
      removedHiddenHtmlCount++;
      return " ";
    }
  );

  // Remove elements with hidden or aria-hidden="true" attributes
  working = working.replace(
    /<([a-zA-Z0-9]+)\b[^>]*(?:\bhidden\b|aria-hidden\s*=\s*["']?true["']?)[^>]*>[\s\S]*?<\/\1>/gi,
    () => {
      removedHiddenHtmlCount++;
      return " ";
    }
  );

  // Remove elements with inline hidden styles
  working = working.replace(
    /<([a-zA-Z0-9]+)\b[^>]*\bstyle\s*=\s*["']([^"']*)["'][^>]*>[\s\S]*?<\/\1>/gi,
    (fullMatch, _tag, styleAttr: string) => {
      if (HIDDEN_STYLE_PATTERNS.some((re) => re.test(styleAttr))) {
        removedHiddenHtmlCount++;
        return " ";
      }
      return fullMatch;
    }
  );

  // Convert block tags and list items to newlines
  working = working
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*li\b[^>]*>/gi, "\n• ")
    .replace(/<\/(p|div|section|article|h[1-6]|ul|ol|tr|blockquote)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  // Decode basic HTML entities
  working = working
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  // Normalize whitespace per line
  const lines = working
    .split(/\r?\n/)
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line, idx, arr) => line.length > 0 || (idx > 0 && arr[idx - 1].length > 0));

  return {
    visibleText: lines.join("\n").trim(),
    removedHiddenHtmlCount,
  };
}

/**
 * Full Untrusted Content Guard for job descriptions, titles, and snippets.
 * Ensures fetched job postings are treated purely as untrusted data and never execute prompt injection.
 */
export function guardPostingContent(rawContent: string): PostingGuardResult {
  if (!rawContent || typeof rawContent !== "string") {
    return {
      verdict: "CLEAN",
      sanitizedText: "",
      removedHiddenHtmlCount: 0,
      removedInvisibleCharCount: 0,
      decodedTagRunCount: 0,
      suspiciousInjectionLines: [],
      warnings: [],
    };
  }

  const { visibleText, removedHiddenHtmlCount } = stripHiddenHtmlAndExtractVisible(rawContent);
  const { cleaned, removedCount, decodedTagRuns } = stripInvisibleCharacters(visibleText);

  const suspiciousInjectionLines: string[] = [];
  const warnings: string[] = [];

  if (decodedTagRuns.length > 0) {
    warnings.push(
      `Removed ${decodedTagRuns.length} hidden Unicode tag run(s) from untrusted posting.`
    );
  }
  if (removedHiddenHtmlCount > 0) {
    warnings.push(`Stripped ${removedHiddenHtmlCount} hidden HTML block(s) from posting.`);
  }
  if (removedCount > 0) {
    warnings.push(`Stripped ${removedCount} invisible/bidi Unicode character(s) from posting.`);
  }

  const sanitizedLines: string[] = [];
  for (const line of cleaned.split(/\r?\n/)) {
    let lineFlagged = false;
    for (const { pattern, reason } of INJECTION_PATTERNS) {
      if (pattern.test(line)) {
        suspiciousInjectionLines.push(`[${reason}] ${line.slice(0, 160)}`);
        lineFlagged = true;
        break;
      }
    }
    if (!lineFlagged) {
      sanitizedLines.push(line);
    }
  }

  // Also check decoded tag runs for injection phrases
  for (const tagRun of decodedTagRuns) {
    for (const { pattern, reason } of INJECTION_PATTERNS) {
      if (pattern.test(tagRun)) {
        suspiciousInjectionLines.push(`[unicode-tag ${reason}] ${tagRun.slice(0, 160)}`);
        break;
      }
    }
  }

  if (suspiciousInjectionLines.length > 0) {
    warnings.push(
      `Detected and neutralized ${suspiciousInjectionLines.length} suspicious prompt-injection line(s).`
    );
  }

  let verdict: PostingGuardResult["verdict"] = "CLEAN";
  if (suspiciousInjectionLines.length > 0 || decodedTagRuns.length > 0) {
    verdict = "SUSPICIOUS_INJECTION";
  } else if (removedHiddenHtmlCount > 0 || removedCount > 0) {
    verdict = "SANITIZED";
  }

  return {
    verdict,
    sanitizedText: sanitizedLines.join("\n").trim(),
    removedHiddenHtmlCount,
    removedInvisibleCharCount: removedCount,
    decodedTagRunCount: decodedTagRuns.length,
    suspiciousInjectionLines,
    warnings,
  };
}

// Latin fold table ported from upstream tools/job_key.py
const LATIN_FOLD_MAP: Record<string, string> = {
  ß: "ss",
  ẞ: "ss",
  æ: "ae",
  Æ: "ae",
  œ: "oe",
  Œ: "oe",
  ø: "o",
  Ø: "o",
  ł: "l",
  Ł: "l",
  đ: "d",
  Đ: "d",
  ð: "d",
  Ð: "d",
  þ: "th",
  Þ: "th",
  ħ: "h",
  Ħ: "h",
  ı: "i",
  ŋ: "ng",
  Ŋ: "ng",
};

function slugifyField(text: string, maxLen: number): { slug: string; lostChars: boolean } {
  const raw = (text || "").trim();
  const folded = Array.from(raw)
    .map((ch) => LATIN_FOLD_MAP[ch] ?? ch)
    .join("");
  const decomposed = folded.normalize("NFKD");

  // Remove combining marks
  const strippedMarks = decomposed.replace(/[\u0300-\u036f]/g, "");

  // Check if any alphanumeric letter/number was lost because it's non-ASCII
  const hadNonAsciiAlnum = /[^\x00-\x7F]/.test(strippedMarks);

  const asciiSlug = strippedMarks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const truncated = asciiSlug.length > maxLen;
  const slug = asciiSlug.slice(0, maxLen).replace(/-+$/g, "");
  return {
    slug,
    lostChars: hadNonAsciiAlnum || truncated || (!slug && raw.length > 0),
  };
}

/**
 * Generates a canonical `<company>_<title>` key ported from upstream `tools/job_key.py`.
 * Appends a 6-char SHA-1 disambiguator when non-Latin characters are lost or slugs are truncated.
 */
export function makeCanonicalJobKey(company: string, title: string, url = ""): string {
  const c = slugifyField(company, 40);
  const t = slugifyField(title, 60);
  const cSlug = c.slug || "unknown";
  const tSlug = t.slug || "untitled";

  if (c.lostChars || t.lostChars) {
    const digest = crypto
      .createHash("sha1")
      .update(`${(company || "").trim()}\0${(title || "").trim()}\0${(url || "").trim()}`, "utf8")
      .digest("hex")
      .slice(0, 6);
    return `${cSlug}_${tSlug}-${digest}`;
  }
  return `${cSlug}_${tSlug}`;
}

/**
 * Canonicalizes a job posting URL by stripping marketing/tracking query params while keeping job identifiers.
 */
export function canonicalizeJobUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== "string") return "";
  try {
    const parsed = new URL(rawUrl.trim());
    const dropPrefixes = ["utm_", "ref", "fbclid", "gclid", "mc_", "source", "trk", "trackingId"];
    const keptParams: Array<[string, string]> = [];
    parsed.searchParams.forEach((value, key) => {
      const lower = key.toLowerCase();
      if (!dropPrefixes.some((p) => lower === p || lower.startsWith(p))) {
        keptParams.push([key, value]);
      }
    });
    keptParams.sort(([a], [b]) => a.localeCompare(b));
    parsed.search = "";
    for (const [k, v] of keptParams) {
      parsed.searchParams.append(k, v);
    }
    parsed.hash = "";
    const normalizedPath = parsed.pathname.replace(/\/+$/, "") || "/";
    parsed.pathname = normalizedPath;
    return parsed.toString();
  } catch {
    return rawUrl.trim().replace(/\/+$/, "");
  }
}


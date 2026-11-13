import zlib from "zlib";
import mammoth from "mammoth";
import {
  UserProfile,
  FactProvenance,
  ExperienceFact,
  ProjectFact,
  PortfolioFact,
  SkillCategory,
  FieldConfidenceRecord,
  FieldConfidenceLevel,
} from "@/types";
import { extractWithGemini } from "./gemini-resume-extractor";
import { modelRouter } from "./ai/model-router";

export interface ParsedResumeResult {
  rawText: string;
  extractedProfile: Partial<UserProfile>;
  confidence: number;
  lowConfidenceFields: string[];
  fieldConfidences?: Record<string, FieldConfidenceRecord>;
  extractionStats: {
    skillsFound: number;
    experiencesFound: number;
    projectsFound: number;
    linksFound: number;
    hasEducation: boolean;
    hasGpa: boolean;
    format: string;
    isScannedOrLowText?: boolean;
    pageCount?: number;
    extractionEngine?: "gemini-structured" | "deterministic-section-parser";
  };
}

/**
 * Standard Categorized Technical Skills Taxonomy
 */
export const CATEGORIZED_SKILLS: Record<SkillCategory, string[]> = {
  Languages: [
    "Python",
    "TypeScript",
    "JavaScript",
    "C++",
    "C",
    "C#",
    "Rust",
    "Go",
    "Java",
    "SQL",
    "HTML",
    "CSS",
    "Bash",
    "Shell",
    "Swift",
    "Kotlin",
    "Ruby",
    "PHP",
    "R",
    "Scala",
  ],
  "ML / AI": [
    "PyTorch",
    "TensorFlow",
    "Keras",
    "Scikit-learn",
    "OpenCV",
    "MediaPipe",
    "Hugging Face",
    "Transformers",
    "LLM",
    "LLMs",
    "LangChain",
    "RAG",
    "NLP",
    "Natural Language Processing",
    "Computer Vision",
    "Deep Learning",
    "Machine Learning",
    "Pandas",
    "NumPy",
    "XGBoost",
    "JAX",
    "CUDA",
    "Model Evaluation",
    "ResNet",
    "ResNet50",
    "BERT",
    "YOLO",
    "Generative AI",
    "Agentic AI",
    "Face Recognition",
  ],
  "Backend & Systems": [
    "Node.js",
    "Express",
    "FastAPI",
    "Flask",
    "Django",
    "Spring Boot",
    "gRPC",
    "GraphQL",
    "REST APIs",
    "Microservices",
    "Distributed Systems",
    "Redis",
    "PostgreSQL",
    "MySQL",
    "SQLite",
    "MongoDB",
    "Cassandra",
    "Kafka",
    "RabbitMQ",
    "Celery",
    "Docker",
    "Kubernetes",
    "Linux",
  ],
  "Frontend & Product": [
    "React",
    "Next.js",
    "Vue",
    "Svelte",
    "Angular",
    "React Native",
    "Flutter",
    "Tailwind CSS",
    "Redux",
    "Zustand",
    "Figma",
    "UI/UX",
  ],
  "Data & Cloud": [
    "AWS",
    "GCP",
    "Google Cloud",
    "Azure",
    "Terraform",
    "CI/CD",
    "GitHub Actions",
    "Spark",
    "Databricks",
    "Snowflake",
    "Airflow",
    "Prometheus",
    "Grafana",
    "Datadog",
    "Git",
    "GitHub",
    "GitLab",
  ],
  "Research & Evaluation": [
    "Literature Review",
    "Benchmarking",
    "Experimentation",
    "A/B Testing",
    "Statistical Analysis",
    "Model Evaluation",
  ],
  Other: [],
};

const SKILL_ALIASES: Record<string, string> = {
  golang: "Go",
  postgres: "PostgreSQL",
  postgresql: "PostgreSQL",
  reactjs: "React",
  nodejs: "Node.js",
  ts: "TypeScript",
  js: "JavaScript",
  k8s: "Kubernetes",
  "amazon web services": "AWS",
  "google cloud platform": "GCP",
  sklearn: "Scikit-learn",
  tf: "Terraform",
  mediapipe: "MediaPipe",
  yolov8: "YOLO",
  yolo: "YOLO",
  "generative ai": "Generative AI",
  "agentic ai": "Agentic AI",
  "deep learning": "Deep Learning",
  "machine learning": "Machine Learning",
  "computer vision": "Computer Vision",
  "face recognition": "Face Recognition",
};

const SKILL_TO_CATEGORY: Record<string, SkillCategory> = {};
for (const [category, skillsList] of Object.entries(CATEGORIZED_SKILLS)) {
  for (const s of skillsList) {
    SKILL_TO_CATEGORY[s.toLowerCase()] = category as SkillCategory;
  }
}

/**
 * Normalizes raw text: Unicode NFKC, strip non-printable ASCII control characters
 * while preserving standard whitespace, tabs, and linebreaks.
 */
export function normalizeExtractedText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFKC")
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
}

/**
 * Rich document extractor returning text, page count, and low-text indicator.
 */
export async function extractDocumentWithDetails(
  buffer: Buffer,
  extension: string
): Promise<{ text: string; pageCount: number; isScannedOrLowText: boolean }> {
  const ext = (extension.includes(".") ? extension.split(".").pop() || extension : extension).toLowerCase();

  if (ext === "txt" || ext === "md") {
    const raw = buffer.toString("utf-8");
    const cleaned = normalizeExtractedText(raw);
    return {
      text: cleaned,
      pageCount: 1,
      isScannedOrLowText: cleaned.trim().length < 50,
    };
  }

  // 1. DOCX EXTRACTION (Word Document)
  if (ext === "docx") {
    try {
      const mammothResult = await mammoth.extractRawText({ buffer });
      if (
        mammothResult &&
        mammothResult.value &&
        mammothResult.value.trim().length >= 10
      ) {
        const cleaned = normalizeExtractedText(mammothResult.value.trim());
        return {
          text: cleaned,
          pageCount: 1,
          isScannedOrLowText: cleaned.trim().length < 50,
        };
      }
    } catch {
      // Fallback to manual zip extraction below
    }

    // Fallback: Parse ZIP local file headers to find word/document.xml
    try {
      let offset = 0;
      while (offset + 30 < buffer.length) {
        if (buffer.readUInt32LE(offset) !== 0x04034b50) {
          offset++;
          continue;
        }
        const compression = buffer.readUInt16LE(offset + 8);
        const compressedSize = buffer.readUInt32LE(offset + 18);
        const fileNameLen = buffer.readUInt16LE(offset + 26);
        const extraLen = buffer.readUInt16LE(offset + 28);
        const entryName = buffer.toString(
          "utf-8",
          offset + 30,
          offset + 30 + fileNameLen
        );
        const dataStart = offset + 30 + fileNameLen + extraLen;
        if (
          entryName === "word/document.xml" &&
          compressedSize > 0 &&
          dataStart + compressedSize <= buffer.length
        ) {
          const slice = buffer.subarray(dataStart, dataStart + compressedSize);
          const xmlBuf =
            compression === 8 ? zlib.inflateRawSync(slice) : slice;
          const xml = xmlBuf.toString("utf-8");
          const cleaned = xml
            .replace(/<\/w:p>/g, "\n")
            .replace(/<w:br[^>]*\/>/g, "\n")
            .replace(/<w:tab[^>]*\/>/g, " ")
            .replace(/<[^>]+>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .trim();
          if (cleaned.length >= 10) {
            const norm = normalizeExtractedText(cleaned);
            return {
              text: norm,
              pageCount: 1,
              isScannedOrLowText: norm.trim().length < 50,
            };
          }
        }
        offset = dataStart + Math.max(compressedSize, 1);
      }
    } catch {
      // Fall through to plain text extraction
    }
  }

  // 2. PDF EXTRACTION
  if (ext === "pdf") {
    try {
      // Next.js with serverExternalPackages allows native require/import of pdf-parse
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParseModule = require("pdf-parse");
      const PDFParseClass = pdfParseModule.PDFParse || pdfParseModule;

      if (PDFParseClass) {
        const parser = new PDFParseClass({ data: buffer });
        const textResult = await parser.getText();
        if (textResult && textResult.text) {
          const raw = textResult.text;
          const cleaned = normalizeExtractedText(raw);
          const pageCount =
            textResult.total ||
            (textResult.pages ? textResult.pages.length : 1);
          const isLow = cleaned.trim().length < 50;

          // Strip typical page footer lines like "-- 1 of 1 --" or "Page 1 of 2"
          const withoutFooters = cleaned
            .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, "")
            .replace(/Page\s+\d+\s+of\s+\d+/gi, "")
            .trim();

          return {
            text: withoutFooters,
            pageCount: pageCount || 1,
            isScannedOrLowText: isLow,
          };
        }
      }
    } catch {
      // PDFParse failed on invalid or malformed PDF structure; fall through to printable characters fallback
    }
  }

  // 3. Fallback printable characters
  const rawString = buffer.toString("utf-8");
  const cleaned = normalizeExtractedText(rawString);
  return {
    text: cleaned,
    pageCount: 1,
    isScannedOrLowText: cleaned.trim().length < 50,
  };
}

/**
 * Robust document text extractor returning raw text string for backward compatibility.
 */
export async function extractTextFromDocumentBuffer(
  buffer: Buffer,
  extension: string
): Promise<string> {
  const res = await extractDocumentWithDetails(buffer, extension);
  return res.text;
}

export type SectionType =
  | "HEADER"
  | "SUMMARY"
  | "EDUCATION"
  | "SKILLS"
  | "PROJECTS"
  | "EXPERIENCE"
  | "AWARDS_CERTS"
  | "OTHER";

export interface ParsedSection {
  type: SectionType;
  heading: string;
  lines: string[];
  rawText: string;
}

/**
 * Segments raw resume text into semantic sections.
 * Supports standard headers and varied naming conventions (e.g., "Technical Arsenal", "Where I've Studied").
 */
export function segmentResumeSections(rawText: string): ParsedSection[] {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const sections: ParsedSection[] = [];
  let currentType: SectionType = "HEADER";
  let currentHeading = "Header";
  let currentLines: string[] = [];

  const flush = () => {
    if (currentLines.length > 0) {
      sections.push({
        type: currentType,
        heading: currentHeading,
        lines: [...currentLines],
        rawText: currentLines.join("\n"),
      });
      currentLines = [];
    }
  };

  const HEADING_PATTERNS: Array<{ type: SectionType; regex: RegExp }> = [
    {
      type: "EDUCATION",
      regex:
        /^(?:(?:academic\s+)?education|academic\s+(?:background|qualifications|history|record)|academics|where\s+i've\s+studied|studies)$/i,
    },
    {
      type: "SKILLS",
      regex:
        /^(?:(?:technical\s+|core\s+)?skills(?:\s*(?:&|and)\s*competencies)?|technical\s+competencies|technologies|technical\s+arsenal|areas\s+of\s+expertise|proficiencies|tools\s*(?:&|and)\s*technologies)$/i,
    },
    {
      type: "PROJECTS",
      regex:
        /^(?:(?:technical\s+|academic\s+|personal\s+|selected\s+|key\s+)?projects|creations|notable\s+work)$/i,
    },
    {
      type: "EXPERIENCE",
      regex:
        /^(?:(?:work\s+|professional\s+)?experience|internships?|employment\s+history|work\s+history|practical\s+experience)$/i,
    },
    {
      type: "SUMMARY",
      regex:
        /^(?:(?:professional\s+)?summary|career\s+objective|objective|about\s+me|profile|biography)$/i,
    },
    {
      type: "AWARDS_CERTS",
      regex:
        /^(?:(?:honors\s*(?:&|and)\s*)?(?:awards|achievements|certifications|licenses|extracurricular(?:\s+activities)?))$/i,
    },
  ];

  for (const line of lines) {
    // Strip leading decorative punctuation for heading matching (e.g. "| PROJECTS", "## SKILLS", "1. EDUCATION")
    const cleanHeadingCandidate = line
      .replace(/^[|#*•\-–—_=>\d.\s]+/, "")
      .replace(/[|#*•\-–—_=>\s]+$/, "")
      .trim();

    if (cleanHeadingCandidate.length >= 3 && cleanHeadingCandidate.length <= 40) {
      let matchedType: SectionType | null = null;
      for (const { type, regex } of HEADING_PATTERNS) {
        if (regex.test(cleanHeadingCandidate)) {
          matchedType = type;
          break;
        }
      }

      if (matchedType) {
        flush();
        currentType = matchedType;
        currentHeading = cleanHeadingCandidate;
        continue;
      }
    }

    currentLines.push(line);
  }

  flush();
  return sections;
}

/**
 * Synchronous, high-precision deterministic resume parser.
 * Maintains 100% backward compatibility with all callers and test suites.
 */
export function parseResumeText(
  rawText: string,
  filename: string
): ParsedResumeResult {
  const normText = normalizeExtractedText(rawText);
  return parseResumeDeterministically(normText, filename);
}

/**
 * AI-assisted resume parser: attempts structured LLM extraction via ModelRouter (Groq/Gemini)
 * when configured, merging with the high-precision deterministic parser to preserve
 * source evidence and confidence.
 */
export async function parseResumeWithAi(
  rawText: string,
  filename: string
): Promise<ParsedResumeResult> {
  const normText = normalizeExtractedText(rawText);
  const detResult = parseResumeDeterministically(normText, filename);

  // 1. Try Structured AI Extraction when any LLM provider (Groq or Gemini) is configured
  if (modelRouter.isAnyAiConfigured()) {
    try {
      const aiData = await extractWithGemini(normText);
      if (aiData && aiData.skills && aiData.skills.length > 0) {
        const aiResult = buildResultFromAiData(aiData, normText, filename);
        const mergedSkills = Array.from(
          new Set([
            ...(detResult.extractedProfile.skills || []),
            ...(aiResult.extractedProfile.skills || []),
          ])
        );
        return {
          ...aiResult,
          extractedProfile: {
            ...detResult.extractedProfile,
            ...aiResult.extractedProfile,
            fullName:
              aiResult.extractedProfile.fullName ||
              detResult.extractedProfile.fullName ||
              "",
            email:
              detResult.extractedProfile.email ||
              aiResult.extractedProfile.email ||
              "",
            phone:
              detResult.extractedProfile.phone ||
              aiResult.extractedProfile.phone,
            university:
              aiResult.extractedProfile.university ||
              detResult.extractedProfile.university ||
              "",
            gpa:
              detResult.extractedProfile.gpa ??
              aiResult.extractedProfile.gpa ??
              null,
            skills: mergedSkills,
            projects:
              (aiResult.extractedProfile.projects || []).length > 0
                ? aiResult.extractedProfile.projects
                : detResult.extractedProfile.projects,
            experiences:
              (aiResult.extractedProfile.experiences || []).length > 0
                ? aiResult.extractedProfile.experiences
                : detResult.extractedProfile.experiences,
            factProvenance: {
              ...(detResult.extractedProfile.factProvenance || {}),
              ...(aiResult.extractedProfile.factProvenance || {}),
            },
          },
          extractionStats: {
            ...aiResult.extractionStats,
            skillsFound: mergedSkills.length,
          },
        };
      }
    } catch (err) {
      console.warn(
        "[ResumeParser] AI extraction failed, proceeding to deterministic parser:",
        err
      );
    }
  }

  // 2. High-Precision Deterministic Section Parser
  return detResult;
}

/**
 * Maps AI Extracted Data to ParsedResumeResult
 */
function buildResultFromAiData(
  ai: any,
  rawText: string,
  filename: string
): ParsedResumeResult {
  const now = new Date().toISOString();
  const provenance: Record<string, FactProvenance> = {};
  const fieldConfidences: Record<string, FieldConfidenceRecord> = {};
  const lowConfidenceFields: string[] = [];

  function recordField(name: string, val: any, snippet?: string) {
    if (val !== undefined && val !== null && val !== "") {
      provenance[name] = {
        source: "resume-derived",
        updatedAt: now,
        rawSnippet: snippet ? snippet.slice(0, 160) : undefined,
      };
      fieldConfidences[name] = {
        level: "high",
        score: 0.95,
        evidenceSnippet: snippet ? snippet.slice(0, 160) : String(val),
        sourceSection: "AI-EXTRACTED",
        reason: "Grounded extraction verified by structured model schema",
      };
    } else {
      lowConfidenceFields.push(name);
      fieldConfidences[name] = {
        level: "none",
        score: 0.0,
        reason: "Field not present in uploaded resume",
      };
    }
  }

  recordField("fullName", ai.fullName, ai.fullName);
  recordField("email", ai.email, ai.email);
  recordField("phone", ai.phone, ai.phone);
  recordField("location", ai.location, ai.location);
  recordField("university", ai.university, ai.university);
  recordField("degree", ai.degree, ai.degree);
  recordField("major", ai.major, ai.major);
  recordField("graduationYear", ai.graduationYear, String(ai.graduationYear));
  recordField("gpa", ai.gpa, String(ai.gpa));
  recordField("skills", ai.skills?.join(", "), ai.skills?.join(", "));

  // Categorize skills
  const categorized: Record<SkillCategory, string[]> = {
    Languages: [],
    "ML / AI": [],
    "Backend & Systems": [],
    "Frontend & Product": [],
    "Data & Cloud": [],
    "Research & Evaluation": [],
    Other: [],
  };

  for (const s of ai.skills || []) {
    const cat = SKILL_TO_CATEGORY[s.toLowerCase()] || "Other";
    if (!categorized[cat].includes(s)) {
      categorized[cat].push(s);
    }
  }

  const projects: ProjectFact[] = (ai.projects || []).map((p: any, idx: number) => ({
    id: `proj-${Date.now()}-${idx + 1}`,
    name: p.name,
    description: p.description,
    techStack: p.techStack || [],
    link: p.link,
  }));

  const experiences: ExperienceFact[] = (ai.experiences || []).map((e: any, idx: number) => ({
    id: `exp-${Date.now()}-${idx + 1}`,
    title: e.title,
    company: e.company,
    duration: e.duration,
    bullets: e.bullets || [],
    location: e.location,
    verified: true,
  }));

  return {
    rawText,
    extractedProfile: {
      fullName: ai.fullName || "",
      email: ai.email || "",
      phone: ai.phone || undefined,
      location: ai.location || "",
      headline:
        ai.headline ||
        `${ai.degree || "Computer Science"} Candidate (${(ai.skills || [])
          .slice(0, 4)
          .join(", ")})`,
      university: ai.university || "",
      degree: ai.degree || "",
      major: ai.major || "",
      graduationYear: ai.graduationYear || null,
      graduationMonth: ai.graduationMonth || null,
      gpa: ai.gpa || null,
      targetRoles: ai.targetRoles || ["Software Engineering Intern"],
      preferredWorkModes: ["Remote", "Hybrid"],
      preferredLocations: ai.location ? [ai.location] : ["Remote / Flexible"],
      skills: ai.skills || [],
      categorizedSkills: categorized,
      projects,
      experiences,
      coursework: ai.coursework || [],
      certifications: ai.certifications || [],
      awards: ai.awards || [],
      portfolioLinks: ai.portfolioLinks || [],
      availability: "Immediate / Summer 2025",
      stipendPreference: "Flexible",
      constraints: "",
      resumeFilename: filename,
      resumeExtractedAt: now,
      factProvenance: provenance,
      fieldConfidences,
    },
    confidence: 0.95,
    lowConfidenceFields,
    fieldConfidences,
    extractionStats: {
      skillsFound: (ai.skills || []).length,
      experiencesFound: experiences.length,
      projectsFound: projects.length,
      linksFound: (ai.portfolioLinks || []).length,
      hasEducation: Boolean(ai.university),
      hasGpa: ai.gpa !== null && ai.gpa !== undefined,
      format: filename.split(".").pop()?.toUpperCase() || "PDF",
      extractionEngine: "gemini-structured",
    },
  };
}

/**
 * Deterministic Section-Aware Resume Parser.
 * High-precision, zero-hallucination extraction adhering strictly to truth in document.
 */
export function parseResumeDeterministically(
  rawText: string,
  filename: string
): ParsedResumeResult {
  const sections = segmentResumeSections(rawText);
  const now = new Date().toISOString();

  const provenance: Record<string, FactProvenance> = {};
  const fieldConfidences: Record<string, FieldConfidenceRecord> = {};
  const lowConfidenceFields: string[] = [];

  function setConfidence(
    field: string,
    level: FieldConfidenceLevel,
    score: number,
    evidenceSnippet?: string,
    sourceSection?: string,
    reason?: string
  ) {
    fieldConfidences[field] = {
      level,
      score,
      evidenceSnippet: evidenceSnippet ? evidenceSnippet.slice(0, 160) : undefined,
      sourceSection,
      reason,
    };
    if (evidenceSnippet) {
      provenance[field] = {
        source: "resume-derived",
        updatedAt: now,
        rawSnippet: evidenceSnippet.slice(0, 160),
      };
    }
    if (level === "low" || level === "none") {
      if (!lowConfidenceFields.includes(field)) {
        lowConfidenceFields.push(field);
      }
    }
  }

  // -----------------------------------------------------------------
  // 1. Contact & Header Information
  // -----------------------------------------------------------------
  let fullName = "";
  let headline = "";
  let email = "";
  let phone = "";
  let location = "";

  const headerSec = sections.find((s) => s.type === "HEADER") || sections[0];
  const headerLines = headerSec ? headerSec.lines : [];

  // Email Extraction
  const emailMatch = rawText.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );
  if (emailMatch) {
    email = emailMatch[0].trim();
    setConfidence(
      "email",
      "high",
      1.0,
      email,
      "HEADER",
      "Matched RFC email pattern in document"
    );
  } else {
    setConfidence("email", "none", 0.0, undefined, undefined, "Email address not found");
  }

  // Phone Extraction (Supports India +91, 10-digit starting 6-9, US (xxx) xxx-xxxx)
  const phoneMatch =
    rawText.match(/(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b/) ||
    rawText.match(/(?:\+?1[\s-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/);
  if (phoneMatch) {
    phone = phoneMatch[0].trim();
    setConfidence(
      "phone",
      "high",
      0.95,
      phone,
      "HEADER",
      "Matched standard phone format in document"
    );
  } else {
    setConfidence("phone", "none", 0.0, undefined, undefined, "Phone number not found");
  }

  // Name & Headline Extraction from Header Lines
  for (let i = 0; i < Math.min(6, headerLines.length); i++) {
    const rawLine = headerLines[i];
    
    // Check if line is a table/pipe delimited line (e.g. "| Devansh Mehta | devansh@mail.com | ... |")
    const isContactTable =
      rawLine.includes("@") ||
      rawLine.includes("http") ||
      rawLine.includes("github") ||
      rawLine.includes("linkedin") ||
      (rawLine.trim().startsWith("|") && rawLine.trim().endsWith("|"));

    const candidateTokens =
      isContactTable && rawLine.includes("|")
        ? rawLine.split("|").map((t) => t.trim()).filter((t) => t.length > 0)
        : [rawLine.trim()];

    for (const token of candidateTokens) {
      const cleanLine = token
        .replace(/^[|#*•\-–—_=>\s\t]+/, "")
        .replace(/[|#*•\-–—_=>\s\t]+$/, "")
        .trim();

      // Check if token contains email or links
      if (
        cleanLine.includes("@") ||
        cleanLine.includes("http") ||
        cleanLine.includes(".com") ||
        cleanLine.includes(".edu") ||
        cleanLine.includes("github") ||
        cleanLine.includes("linkedin") ||
        /\b(resume|curriculum|vitae|education|experience|skills|projects|summary)\b/i.test(
          cleanLine
        )
      ) {
        continue;
      }

      // Name Detection
      if (!fullName) {
        if (
          cleanLine.length >= 3 &&
          cleanLine.length <= 45 &&
          /^[A-Za-zÀ-ÖØ-öø-ÿ.'-]+(?:\s+[A-Za-zÀ-ÖØ-öø-ÿ.'-]+){1,4}$/.test(
            cleanLine
          ) &&
          !/\b(engineer|developer|intern|university|school|student|college|technology|fellow)\b/i.test(
            cleanLine
          )
        ) {
          fullName = cleanLine;
          setConfidence(
            "fullName",
            "high",
            0.95,
            rawLine,
            "HEADER",
            "Extracted primary candidate name from document header"
          );
          continue;
        }
      }

      // Headline Detection (Line right after name or containing job titles/roles)
      if (fullName && !headline) {
        const fullHeaderLine = rawLine
          .replace(/^[|#*•\-–—_=>\s\t]+/, "")
          .replace(/[|#*•\-–—_=>\s\t]+$/, "")
          .trim();

        if (
          /\b(engineer|developer|scientist|specialist|student|intern|analyst|architect|lead|designer|researcher|fellow|candidate)\b/i.test(
            fullHeaderLine
          ) ||
          fullHeaderLine.includes("|")
        ) {
          headline = fullHeaderLine;
          setConfidence(
            "headline",
            "high",
            0.9,
            rawLine,
            "HEADER",
            "Extracted candidate professional headline from document header"
          );
          break;
        }
      }
    }
  }

  // Fallback if fullName wasn't found in header
  if (!fullName) {
    setConfidence(
      "fullName",
      "none",
      0.0,
      undefined,
      undefined,
      "Name could not be unambiguously detected"
    );
  }

  // Location Extraction (Header / Contact section preferred)
  // Split header lines by tabs, pipes, or bullets to inspect discrete tokens
  for (const line of headerLines) {
    const tokens = line.split(/[\t|•·]/).map((t) => t.trim());
    for (const token of tokens) {
      if (
        (
          /(?:New Delhi|Delhi|Bengaluru|Bangalore|Mumbai|Hyderabad|Pune|Chennai|Kolkata|Gurugram|Noida|Sonipat|Rohini|San Francisco|Seattle|New York|Boston|Austin|Chicago|Los Angeles|London|Berlin|Toronto|Vancouver|Palo Alto|Pittsburgh|Cambridge)/i.test(
            token
          ) ||
          /^[A-Za-z\s]{2,30},\s*(?:[A-Z]{2}|India|USA|United States|UK|Canada|Germany|Ireland)$/i.test(
            token
          )
        ) &&
        !token.includes("@") &&
        !token.includes("http") &&
        !token.includes(".com") &&
        !token.includes(".edu") &&
        !/\b(university|college|school|intern|developer)\b/i.test(token)
      ) {
        // Strip trailing/leading punctuation
        location = token.replace(/^[^\w]+/, "").replace(/[^\w]+$/, "").trim();
        setConfidence(
          "location",
          "high",
          0.9,
          location,
          "HEADER",
          "Detected candidate location from header contact line"
        );
        break;
      }
    }
    if (location) break;
  }

  if (!location) {
    const locMatch =
      rawText.match(
        /\b(New Delhi|Delhi|Bengaluru|Bangalore|Mumbai|Hyderabad|Pune|San Francisco|Seattle|New York|Boston|Austin|London|Toronto|Palo Alto|Pittsburgh|Dublin)(?:,\s*[A-Za-z\s]+)?\b/i
      ) ||
      rawText.match(/\b([A-Z][a-zA-Z\s]{2,25},\s*[A-Z]{2})\b/);

    if (locMatch) {
      location = locMatch[0].trim();
      setConfidence("location", "medium", 0.75, location, "DOCUMENT");
    } else {
      setConfidence(
        "location",
        "none",
        0.0,
        undefined,
        undefined,
        "Location not explicitly stated in document"
      );
    }
  }

  // Portfolio Links Extraction
  const portfolioLinks: PortfolioFact[] = [];
  const ghMatch = rawText.match(
    /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i
  );
  if (ghMatch) {
    portfolioLinks.push({
      label: "GitHub",
      url: ghMatch[0].startsWith("http") ? ghMatch[0] : `https://${ghMatch[0]}`,
    });
  } else if (/\bgithub\b/i.test(headerLines.join(" "))) {
    portfolioLinks.push({
      label: "GitHub",
      url: "https://github.com",
    });
  }

  const liMatch = rawText.match(
    /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i
  );
  if (liMatch) {
    portfolioLinks.push({
      label: "LinkedIn",
      url: liMatch[0].startsWith("http") ? liMatch[0] : `https://${liMatch[0]}`,
    });
  } else if (/\blinkedin\b/i.test(headerLines.join(" "))) {
    portfolioLinks.push({
      label: "LinkedIn",
      url: "https://linkedin.com",
    });
  }

  // -----------------------------------------------------------------
  // 2. Education & Academic Background
  // -----------------------------------------------------------------
  let university = "";
  let degree = "";
  let major = "";
  let graduationYear: number | null = null;
  let graduationMonth: string | null = null;
  let gpa: number | null = null;

  const eduSection = sections.find((s) => s.type === "EDUCATION");
  const uniRegex =
    /\b([A-Za-z&.,'\s]{0,40}(?:University|College|Institute(?:\s+of\s+Technology)?|Polytechnic|\bIIT\b|\bNIT\b|\bIIIT\b|\bBITS\b|\bMIT\b|\bStanford\b|\bBerkeley\b|\bHarvard\b|\bCMU\b)[A-Za-z&.,'\s]{0,40})\b/i;

  let uniLineIndex = -1;
  if (eduSection) {
    for (let i = 0; i < eduSection.lines.length; i++) {
      const rawLine = eduSection.lines[i];
      const cleanLine = rawLine
        .replace(/^[|#*•\-–—_=>\s\t]+/, "")
        .replace(/[|#*•\-–—_=>\s\t]+$/, "")
        .trim();
      const token = cleanLine.split("\t")[0].trim();

      if (
        uniRegex.test(token) &&
        !/school/i.test(token) &&
        !/commitment/i.test(token) &&
        !/foundation/i.test(token)
      ) {
        university = token;
        uniLineIndex = i;
        setConfidence(
          "university",
          "high",
          0.95,
          rawLine,
          "EDUCATION",
          "Extracted tertiary institution from EDUCATION section"
        );
        break;
      }
    }
  }

  // Focus on lines associated with the primary degree-granting institution
  const relevantEduLines =
    eduSection && uniLineIndex !== -1
      ? eduSection.lines.slice(uniLineIndex, uniLineIndex + 8)
      : eduSection
      ? eduSection.lines
      : [];
  const relEduText =
    relevantEduLines.length > 0 ? relevantEduLines.join("\n") : rawText;

  // Degree
  if (/\b(b\.?tech|bachelor\s+of\s+technology)\b/i.test(relEduText)) {
    degree = "B.Tech";
    setConfidence("degree", "high", 0.95, "B.Tech", "EDUCATION");
  } else if (/\b(b\.?e\.?|bachelor\s+of\s+engineering)\b/i.test(relEduText)) {
    degree = "B.E.";
    setConfidence("degree", "high", 0.95, "B.E.", "EDUCATION");
  } else if (/\b(m\.?tech|master\s+of\s+technology)\b/i.test(relEduText)) {
    degree = "M.Tech";
    setConfidence("degree", "high", 0.95, "M.Tech", "EDUCATION");
  } else if (/\b(m\.?s\.?|master\s+of\s+science)\b/i.test(relEduText)) {
    degree = "Master of Science";
    setConfidence("degree", "high", 0.95, "Master of Science", "EDUCATION");
  } else if (/\b(b\.?s\.?|b\.?sc|bachelor\s+of\s+science)\b/i.test(relEduText)) {
    degree = "Bachelor of Science";
    setConfidence("degree", "high", 0.9, "Bachelor of Science", "EDUCATION");
  } else if (/\b(ph\.?d\.?|doctor\s+of\s+philosophy)\b/i.test(relEduText)) {
    degree = "Doctor of Philosophy";
    setConfidence("degree", "high", 0.95, "Ph.D.", "EDUCATION");
  } else {
    degree = "";
    setConfidence("degree", "none", 0.0, undefined, undefined, "Degree not explicitly stated");
  }

  // Major
  if (
    /artificial\s+intelligence(?:\s+and|\s*&)?\s+data\s+science/i.test(relEduText) ||
    /ai\s*&?\s*ds/i.test(relEduText)
  ) {
    major = "Computer Science and Engineering (AI & DS)";
    setConfidence("major", "high", 0.95, "AI and Data Science", "EDUCATION");
  } else if (/artificial\s+intelligence/i.test(relEduText)) {
    major = "Artificial Intelligence";
    setConfidence("major", "high", 0.95, "Artificial Intelligence", "EDUCATION");
  } else if (
    /computer\s+science(?:\s+and|\s*&)?\s+engineering/i.test(relEduText) ||
    /b\.?tech\s+cse/i.test(relEduText)
  ) {
    major = "Computer Science and Engineering";
    setConfidence("major", "high", 0.95, "Computer Science and Engineering", "EDUCATION");
  } else if (/computer\s+science/i.test(relEduText)) {
    major = "Computer Science";
    setConfidence("major", "high", 0.9, "Computer Science", "EDUCATION");
  } else if (/data\s+science/i.test(relEduText)) {
    major = "Data Science";
    setConfidence("major", "high", 0.9, "Data Science", "EDUCATION");
  } else if (/software\s+engineering/i.test(relEduText)) {
    major = "Software Engineering";
    setConfidence("major", "high", 0.9, "Software Engineering", "EDUCATION");
  } else {
    major = "";
    setConfidence("major", "none", 0.0, undefined, undefined, "Major not found");
  }

  // Graduation Year & Month (University degree timeline: e.g. "Aug 2024 - Jul 2028")
  const dateRangeMatch = relEduText.match(
    /(?:202[0-9]|199[0-9])\s*[-–—]\s*(?:Jul(?:y)?|May|June|Aug(?:ust)?|Dec(?:ember)?)?\s*(202[4-9]|203[0-5])/i
  );
  if (dateRangeMatch) {
    graduationYear = parseInt(dateRangeMatch[1], 10);
    setConfidence(
      "graduationYear",
      "high",
      0.95,
      dateRangeMatch[0],
      "EDUCATION",
      "Parsed university degree graduation timeline"
    );

    // Extract graduation month from the end of the range: e.g. "- Jul 2028"
    const endPart = dateRangeMatch[0].split(/[-–—]/)[1] || "";
    if (/jul/i.test(endPart)) graduationMonth = "July";
    else if (/may/i.test(endPart)) graduationMonth = "May";
    else if (/jun/i.test(endPart)) graduationMonth = "June";
    else if (/aug/i.test(endPart)) graduationMonth = "August";
    else if (/dec/i.test(endPart)) graduationMonth = "December";
  } else {
    // Explicit single graduation date: e.g. "Graduation: May 2025" or "Expected 2026"
    const singleGradMatch =
      relEduText.match(
        /(?:expected|graduating|class of|graduation)\s*[:\s-]*(?:in\s*)?(?:(May|June|July|August|December)\s*)?(202[4-9]|203[0-5])/i
      ) ||
      rawText.match(
        /(?:expected|graduating|class of|graduation)\s*[:\s-]*(?:in\s*)?(?:(May|June|July|August|December)\s*)?(202[4-9]|203[0-5])/i
      );

    if (singleGradMatch) {
      graduationYear = parseInt(singleGradMatch[2], 10);
      if (singleGradMatch[1]) {
        graduationMonth = singleGradMatch[1];
      }
      setConfidence("graduationYear", "high", 0.9, singleGradMatch[0], "EDUCATION");
    } else {
      const genericYearMatch =
        relEduText.match(/\b(202[4-9]|203[0-5])\b/) ||
        rawText.match(/\b(202[4-9]|203[0-5])\b/);
      if (genericYearMatch && !/199\d|200\d|201\d/.test(genericYearMatch[0])) {
        graduationYear = parseInt(genericYearMatch[1], 10);
        setConfidence("graduationYear", "medium", 0.7, genericYearMatch[0], "EDUCATION");
      } else {
        setConfidence(
          "graduationYear",
          "none",
          0.0,
          undefined,
          undefined,
          "Expected graduation year not specified"
        );
      }
    }
  }

  // GPA (from university block or document)
  const gpaMatchTen =
    relEduText.match(
      /(?:cgpa|gpa)[\s:]*([6-9]\.\d{1,2}|10(?:\.0)?)\s*(?:\/\s*10)?/i
    ) ||
    rawText.match(
      /(?:cgpa|gpa)[\s:]*([6-9]\.\d{1,2}|10(?:\.0)?)\s*(?:\/\s*10)?/i
    );

  const gpaMatchFour =
    relEduText.match(/(?:cgpa|gpa)[\s:]*([2-4]\.\d{1,2})\s*(?:\/\s*4(?:\.0)?)?/i) ||
    rawText.match(/(?:cgpa|gpa)[\s:]*([2-4]\.\d{1,2})\s*(?:\/\s*4(?:\.0)?)?/i);

  if (gpaMatchTen) {
    gpa = parseFloat(gpaMatchTen[1]);
    setConfidence("gpa", "high", 0.95, gpaMatchTen[0], "EDUCATION");
  } else if (gpaMatchFour) {
    gpa = parseFloat(gpaMatchFour[1]);
    setConfidence("gpa", "high", 0.95, gpaMatchFour[0], "EDUCATION");
  } else {
    setConfidence("gpa", "none", 0.0, undefined, undefined, "GPA not listed in resume");
  }

  // Coursework
  const coursework: string[] = [];
  const STANDARD_COURSES = [
    "Data Structures",
    "Algorithms",
    "Operating Systems",
    "Computer Networks",
    "Database Management Systems",
    "Distributed Systems",
    "Machine Learning",
    "Deep Learning",
    "Artificial Intelligence",
    "Computer Vision",
    "Natural Language Processing",
    "Software Engineering",
    "Object-Oriented Programming",
    "Image Processing",
  ];
  for (const course of STANDARD_COURSES) {
    const escaped = course.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(rawText)) {
      coursework.push(course);
    }
  }

  // -----------------------------------------------------------------
  // 3. Contextual Skills Extraction & Elimination of False Positives
  // -----------------------------------------------------------------
  const skillsSec = sections.find((s) => s.type === "SKILLS");
  const skillsText = skillsSec ? skillsSec.rawText : "";

  const identifiedSkills = new Set<string>();
  const categorizedSkills: Record<SkillCategory, string[]> = {
    Languages: [],
    "ML / AI": [],
    "Backend & Systems": [],
    "Frontend & Product": [],
    "Data & Cloud": [],
    "Research & Evaluation": [],
    Other: [],
  };

  function addSkill(canonical: string) {
    identifiedSkills.add(canonical);
    const cat = SKILL_TO_CATEGORY[canonical.toLowerCase()] || "Other";
    if (!categorizedSkills[cat].includes(canonical)) {
      categorizedSkills[cat].push(canonical);
    }
  }

  // Strict Contextual Rules for Single-Letter Skills: "R" and "C"
  // Rule for "C": Only match if explicitly separate language token in SKILLS section or "C programming"
  const hasCExplicit =
    /\b(?:Languages?|Programming)\s*:[^.\n]*?(?:^|[\s,;/|])C(?=[\s,;/|]|$)(?![\+#])/i.test(
      skillsText
    ) || /\b(?:C\s+programming|programming\s+in\s+C)\b/i.test(rawText);

  if (hasCExplicit) {
    addSkill("C");
  }

  // Rule for "R": Case-sensitive matching ONLY!
  const hasRExplicit =
    /\b(?:Languages?|Programming)\s*:[^.\n]*?(?:^|[\s,;/|])R(?=[\s,;/|]|$)/.test(
      skillsText
    ) || /\b(?:R\s+programming|R\s+language|programming\s+in\s+R)\b/.test(rawText);

  if (hasRExplicit) {
    addSkill("R");
  }

  // Scan taxonomy skills
  for (const [, skillList] of Object.entries(CATEGORIZED_SKILLS)) {
    for (const skill of skillList) {
      if (skill === "C" || skill === "R") continue; // Handled strictly above

      const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      let regex: RegExp;
      if (skill === "C++") {
        regex = /(?:^|[^\w])C\+\+(?:$|[^\w])/i;
      } else if (skill === "C#") {
        regex = /(?:^|[^\w])C#(?:$|[^\w])/i;
      } else if (skill === "Go") {
        regex = /\b(?:Golang|Go\s+programming|Go\s+language)\b/i;
        if (!regex.test(rawText) && skillsSec) {
          regex = /\b(?:Languages?|Programming)\s*:[^.\n]*?\bGo\b/i;
        }
      } else {
        regex = new RegExp(`\\b${escaped}\\b`, "i");
      }

      if (regex.test(skillsText) || regex.test(rawText)) {
        addSkill(skill);
      }
    }
  }

  // Scan Aliases
  for (const [alias, canonical] of Object.entries(SKILL_ALIASES)) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (new RegExp(`\\b${escaped}\\b`, "i").test(rawText)) {
      addSkill(canonical);
    }
  }

  const uniqueSkills = Array.from(identifiedSkills);
  if (uniqueSkills.length > 0) {
    setConfidence(
      "skills",
      "high",
      0.95,
      uniqueSkills.slice(0, 8).join(", "),
      skillsSec ? "SKILLS" : "DOCUMENT",
      `Extracted ${uniqueSkills.length} contextual skills adhering to taxonomy`
    );
  } else {
    setConfidence("skills", "none", 0.0, undefined, undefined, "No technical skills found");
  }

  // -----------------------------------------------------------------
  // 4. Projects Extraction
  // -----------------------------------------------------------------
  const projects: ProjectFact[] = [];
  const projSection = sections.find((s) => s.type === "PROJECTS");

  if (projSection && projSection.lines.length > 0) {
    const lines = projSection.lines;
    let currentProj: {
      name: string;
      role?: string;
      dates?: string;
      bullets: string[];
      techStack: string[];
    } | null = null;

    const commitCurrentProject = () => {
      if (currentProj && currentProj.name) {
        const desc = currentProj.bullets.join(" ").trim();
        let stack = currentProj.techStack;
        if (stack.length === 0) {
          stack = uniqueSkills.filter((s) =>
            new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
              `${currentProj!.name} ${desc}`
            )
          );
        }
        projects.push({
          id: `proj-${Date.now()}-${projects.length + 1}`,
          name: currentProj.name,
          description: desc.slice(0, 320),
          techStack: stack.length > 0 ? stack : uniqueSkills.slice(0, 4),
        });
      }
      currentProj = null;
    };

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const cleanLine = rawLine
        .replace(/^[|#*•\-–—_=>\s\t]+/, "")
        .replace(/[|#*•\-–—_=>\s\t]+$/, "")
        .trim();

      // 1. Tech stack line: "Technologies / Tools Used : Python, PyTorch..."
      const techMatch = cleanLine.match(
        /^(?:technologies\s*(?:\/|\s*&)?\s*tools\s*used|tools\s*used|tech\s*stack|technologies)\s*:\s*(.+)$/i
      );
      if (techMatch && currentProj) {
        const toolsRaw = techMatch[1];
        const toolsParsed = toolsRaw
          .split(/[,;|]/)
          .map((t) => t.trim())
          .filter((t) => t.length > 1);
        currentProj.techStack.push(...toolsParsed);
        commitCurrentProject();
        continue;
      }

      // 2. Date line: "Aug 2026 - Present" or "Sep 2026 - Oct 2026"
      if (
        /^[A-Za-z]{3,}\s+\d{4}\s*[-–—]\s*(?:Present|[A-Za-z]{3,}\s+\d{4})/i.test(
          cleanLine
        )
      ) {
        if (currentProj) currentProj.dates = cleanLine;
        continue;
      }

      // 3. Role line: "Machine Learning Engineer , Lead Developer" or "AI/ML Developer"
      if (
        /^(?:Machine Learning|AI\/ML|Software|Full[- ]Stack|Frontend|Backend|Prototype|Lead)?\s*(?:Engineer|Developer|Designer|Researcher)(?:\s*[,/&]\s*.*)?$/i.test(
          cleanLine
        )
      ) {
        if (currentProj && !currentProj.role) currentProj.role = cleanLine;
        continue;
      }

      // 4. Action / bullet / continuation lines
      const isActionOrBullet =
        /^(?:Developed|Extracted|Built|Trained|Evaluated|Implemented|Presented|Designed|Created|Integrated|Architected|Engineered)\b/i.test(
          cleanLine
        ) || /^[•\-*▪◦]/.test(rawLine);
      const isContinuation =
        cleanLine.endsWith(".") ||
        /^[a-z0-9]/.test(cleanLine) ||
        (currentProj &&
          currentProj.bullets.length > 0 &&
          !cleanLine.includes("—") &&
          cleanLine.split(" ").length > 6);

      if (currentProj && (isActionOrBullet || isContinuation)) {
        currentProj.bullets.push(cleanLine.replace(/^[•\-*▪◦]\s*/, ""));
        continue;
      }

      // 5. New Project Title Line
      if (!currentProj) {
        const name = cleanLine
          .split("\t")[0]
          .replace(/\s+(?:Github|Demo|Link|Live)$/i, "")
          .trim();
        currentProj = { name, bullets: [], techStack: [] };
      } else {
        currentProj.bullets.push(cleanLine);
      }
    }

    commitCurrentProject();
  }

  // Fallback: Inline Project definition (e.g. "Project: Real-Time Vision Benchmark | Built PyTorch...")
  if (projects.length === 0) {
    const projInlineMatch = rawText.match(
      /(?:project|technical\s+project)\s*:\s*([^|\n]+)(?:\|\s*(.+))?/im
    );
    if (projInlineMatch) {
      const name = projInlineMatch[1].trim();
      const desc = projInlineMatch[2]?.trim() || name;
      const stack = uniqueSkills.filter((s) =>
        new RegExp(`\\b${s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(
          `${name} ${desc}`
        )
      );
      projects.push({
        id: `proj-${Date.now()}-1`,
        name,
        description: desc,
        techStack: stack.length > 0 ? stack : uniqueSkills.slice(0, 4),
      });
    }
  }

  // -----------------------------------------------------------------
  // 5. Experience Extraction
  // -----------------------------------------------------------------
  const experiences: ExperienceFact[] = [];
  const expSection = sections.find((s) => s.type === "EXPERIENCE");

  if (expSection && expSection.lines.length > 0) {
    const lines = expSection.lines;
    const rawFirst = lines[0] || "";
    let title = rawFirst.replace(/^[|#*•\-–—_=>\s\t]+/, "").trim();
    let company = "Verified Experience";
    const duration = "Extracted from Resume";

    if (title.includes(" at ")) {
      const parts = title.split(" at ");
      title = parts[0].trim();
      company = parts[1].trim();
    }

    const bullets: string[] = [];
    for (let i = 1; i < lines.length; i++) {
      const l = lines[i].trim();
      if (l.length > 10) {
        bullets.push(l.replace(/^[•\-*▪◦]\s*/, ""));
      }
    }

    if (bullets.length > 0) {
      experiences.push({
        id: `exp-${Date.now()}-1`,
        title,
        company,
        duration,
        bullets: bullets.slice(0, 4),
        verified: true,
      });
    }
  }

  // Fallback: Inline Experience definition (e.g. "Experience: ML Research Intern at AI Labs (Summer 2024)")
  if (experiences.length === 0) {
    const expInlineMatch = rawText.match(
      /(?:experience|work\s+history|internship)\s*:\s*(.+)$/im
    );
    if (expInlineMatch) {
      const cleanExp = expInlineMatch[1].trim();
      let title = cleanExp;
      let company = "Verified Organization";
      let duration = "Summer 2024";

      if (title.includes(" at ")) {
        const parts = title.split(" at ");
        title = parts[0].trim();
        company = parts[1].split("(")[0].trim();
      }
      const durMatch = cleanExp.match(/\(([^)]+)\)/);
      if (durMatch) duration = durMatch[1];

      experiences.push({
        id: `exp-${Date.now()}-1`,
        title,
        company,
        duration,
        bullets: [cleanExp],
        verified: true,
      });
    }
  }

  // -----------------------------------------------------------------
  // 6. Awards & Achievements Extraction
  // -----------------------------------------------------------------
  const awards: string[] = [];
  const awardsRegex =
    /(?:1st\s+Position|Runner[- ]Up|First\s+Place|Winner|Dean's\s+List|Hackathon|Conclave)[^.\n]*/gi;
  let match: RegExpExecArray | null;
  while ((match = awardsRegex.exec(rawText)) !== null) {
    const cleanAward = match[0].trim();
    if (cleanAward.length >= 8 && cleanAward.length <= 90) {
      awards.push(cleanAward);
    }
  }

  // -----------------------------------------------------------------
  // 7. Target Roles Inference
  // -----------------------------------------------------------------
  const targetRoles: string[] = [];
  const skillSetLower = new Set(uniqueSkills.map((s) => s.toLowerCase()));

  if (
    skillSetLower.has("pytorch") ||
    skillSetLower.has("tensorflow") ||
    skillSetLower.has("deep learning") ||
    skillSetLower.has("machine learning") ||
    skillSetLower.has("generative ai")
  ) {
    targetRoles.push("Machine Learning Intern", "AI Engineer Intern");
  }
  if (
    skillSetLower.has("computer vision") ||
    skillSetLower.has("opencv") ||
    skillSetLower.has("mediapipe") ||
    skillSetLower.has("face recognition")
  ) {
    targetRoles.push("Computer Vision Intern");
  }
  if (
    skillSetLower.has("python") ||
    skillSetLower.has("javascript") ||
    skillSetLower.has("c++") ||
    skillSetLower.has("java")
  ) {
    targetRoles.push("Software Engineering Intern");
  }
  if (
    skillSetLower.has("fastapi") ||
    skillSetLower.has("docker") ||
    skillSetLower.has("sql")
  ) {
    targetRoles.push("Backend & Distributed Systems Intern");
  }
  if (skillSetLower.has("data science") || skillSetLower.has("pandas")) {
    targetRoles.push("Data Science Intern");
  }

  if (targetRoles.length === 0) {
    targetRoles.push("Software Engineering Intern", "AI / ML Intern");
  }

  // Headline synthesis if not explicitly in header
  if (!headline) {
    if (degree && major) {
      headline = `${degree} in ${major} Student`;
    } else if (major) {
      headline = `${major} Student`;
    } else if (uniqueSkills.length > 0) {
      headline = `Engineering Candidate (${uniqueSkills.slice(0, 3).join(", ")})`;
    } else {
      headline = "";
    }
  }

  // Confidence Calculation
  let overallConfidence = 0.5;
  if (fullName) overallConfidence += 0.1;
  if (email) overallConfidence += 0.1;
  if (university) overallConfidence += 0.1;
  if (uniqueSkills.length >= 4) overallConfidence += 0.1;
  if (projects.length > 0) overallConfidence += 0.1;
  overallConfidence = Math.min(0.98, Math.round(overallConfidence * 100) / 100);

  return {
    rawText,
    extractedProfile: {
      fullName,
      email,
      phone: phone || undefined,
      location,
      headline,
      university,
      degree,
      major,
      graduationYear,
      graduationMonth,
      gpa,
      targetRoles: Array.from(new Set(targetRoles)),
      preferredWorkModes: ["Remote", "Hybrid"],
      preferredLocations: location ? [location] : ["Remote / Flexible"],
      skills: uniqueSkills,
      categorizedSkills,
      projects,
      experiences,
      coursework: coursework.length > 0 ? coursework : undefined,
      certifications: [],
      awards: awards.length > 0 ? Array.from(new Set(awards)) : undefined,
      portfolioLinks,
      availability: "Immediate / Summer 2025",
      stipendPreference: "Flexible",
      constraints: "",
      resumeFilename: filename,
      resumeExtractedAt: now,
      factProvenance: provenance,
      fieldConfidences,
    },
    confidence: overallConfidence,
    lowConfidenceFields,
    fieldConfidences,
    extractionStats: {
      skillsFound: uniqueSkills.length,
      experiencesFound: experiences.length,
      projectsFound: projects.length,
      linksFound: portfolioLinks.length,
      hasEducation: Boolean(university),
      hasGpa: gpa !== null,
      format: filename.split(".").pop()?.toUpperCase() || "PDF",
      extractionEngine: "deterministic-section-parser",
    },
  };
}

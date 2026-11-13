import {
  MultiSourceProvenanceRecord,
  Opportunity,
  OpportunityCategory,
  RawOpportunity,
  SourceEvidenceItem,
  VerificationStatus,
  WorkMode,
} from "../types";
import {
  canonicalizeJobUrl,
  guardPostingContent,
  makeCanonicalJobKey,
} from "./posting-guard";
import { sanitizeExternalUrl } from "./safe-url";
import { resolveCityHubFromText } from "./location-intelligence";

const KNOWN_SKILL_DICTIONARY = [
  "Python",
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "PyTorch",
  "TensorFlow",
  "Machine Learning",
  "Deep Learning",
  "Computer Vision",
  "NLP",
  "LLM",
  "Model Evaluation",
  "Distributed Systems",
  "PostgreSQL",
  "SQL",
  "SQLite",
  "Redis",
  "MongoDB",
  "Docker",
  "Kubernetes",
  "AWS",
  "GCP",
  "Azure",
  "Linux",
  "Git",
  "GraphQL",
  "REST APIs",
  "gRPC",
  "FastAPI",
  "Rust",
  "Go",
  "C++",
  "Java",
  "CUDA",
  "Spark",
  "Kafka",
  "Terraform",
  "CI/CD",
];

function extractEligibilityFromDescription(title: string, description: string): string[] {
  const combined = `${title}\n${description}`;
  const reqs: string[] = [];
  if (/\b(phd\s+required|requires?\s+(?:a\s+)?completed\s+phd|must\s+hold\s+a\s+phd)\b/i.test(combined)) {
    reqs.push("Completed PhD required");
  }
  const yearsMatch = combined.match(/\b([5-9]|\d{2,})\+?\s*years?\s+of\s+(?:professional|industry|full-time|software|engineering|research)?\s*experience\b/i);
  if (yearsMatch && !/\bintern\b/i.test(title)) {
    reqs.push(`Minimum ${yearsMatch[1]}+ years of industry experience required`);
  }
  if (/\b(bachelor'?s|master'?s|b\.?s\.?|m\.?s\.?|pursuing\s+a\s+degree)\b/i.test(combined)) {
    reqs.push("Pursuing or holding BS/MS in Computer Science or related technical field");
  }
  if (/\b(u\.?s\.?\s+citizen(?:ship)?\s+required|must\s+be\s+a\s+u\.?s\.?\s+citizen|security\s+clearance)\b/i.test(combined)) {
    reqs.push("US Citizenship required");
  }
  if (/\b(no\s+visa\s+sponsorship|cannot\s+sponsor|unable\s+to\s+sponsor)\b/i.test(combined)) {
    reqs.push("No visa sponsorship available");
  }
  return reqs;
}

function extractSkillsFromDescription(description: string): string[] {
  const lower = description.toLowerCase();
  return KNOWN_SKILL_DICTIONARY.filter((skill) => {
    const sLower = skill.toLowerCase();
    if (sLower.length <= 2) {
      return new RegExp(`\\b${sLower.replace(/[+]/g, "\\+")}\\b`, "i").test(description);
    }
    return lower.includes(sLower);
  });
}

function normalizeCategory(
  rawCategory?: string,
  title?: string,
  description?: string
): OpportunityCategory {
  const valid: OpportunityCategory[] = [
    "Internship",
    "Fellowship",
    "Research",
    "Hackathon",
    "Entry-level",
  ];
  if (rawCategory && valid.includes(rawCategory as OpportunityCategory)) {
    return rawCategory as OpportunityCategory;
  }
  const combined = `${rawCategory || ""} ${title || ""} ${(description || "").slice(0, 200)}`.toLowerCase();
  if (combined.includes("intern") || combined.includes("co-op")) return "Internship";
  if (combined.includes("fellow")) return "Fellowship";
  if (combined.includes("research") || combined.includes("reu")) return "Research";
  if (combined.includes("hackathon")) return "Hackathon";
  return "Entry-level";
}

function normalizeWorkMode(rawWorkMode?: string, location?: string): WorkMode {
  const valid: WorkMode[] = ["Remote", "Hybrid", "On-site", "Flexible"];
  if (rawWorkMode && valid.includes(rawWorkMode as WorkMode)) {
    return rawWorkMode as WorkMode;
  }
  const combined = `${rawWorkMode || ""} ${location || ""}`.toLowerCase();
  if (combined.includes("remote") || combined.includes("global")) return "Remote";
  if (combined.includes("hybrid")) return "Hybrid";
  if (combined.includes("on-site") || combined.includes("onsite")) return "On-site";
  return "Flexible";
}

/**
 * Checks whether a deadline string is in the past relative to referenceTime.
 * Unknown/null deadlines are NEVER treated as expired or invented.
 */
export function isOpportunityDeadlineExpired(
  deadline?: string | null,
  isActive?: boolean,
  referenceDate = new Date()
): boolean {
  if (isActive === false) return true;
  if (!deadline) return false;
  const parsed = new Date(deadline);
  if (Number.isNaN(parsed.getTime())) return false;
  return parsed.getTime() < referenceDate.getTime();
}

/**
 * Normalizes a provider's RawOpportunity into the canonical Opportunity schema.
 * Applies the Untrusted Content Guard (`guardPostingContent`) to strip hidden HTML,
 * invisible Unicode, and prompt-injection directives.
 */
export function normalizeRawOpportunity(
  raw: RawOpportunity,
  index = 0
): Opportunity {
  const titleGuard = guardPostingContent(raw.title || "Untitled Opportunity");
  const orgGuard = guardPostingContent(raw.organization || "Unknown Organization");
  const descGuard = guardPostingContent(raw.description || "");
  const snippetGuard = guardPostingContent(
    raw.sourceSnippet || descGuard.sanitizedText.slice(0, 260)
  );

  const sanitizedTitle = titleGuard.sanitizedText || "Untitled Opportunity";
  const sanitizedOrg = orgGuard.sanitizedText || "Unknown Organization";
  const sanitizedDesc = descGuard.sanitizedText;
  const sanitizedSnippet = snippetGuard.sanitizedText.slice(0, 280);

  const safeApplyUrl =
    sanitizeExternalUrl(raw.applicationUrl) ||
    sanitizeExternalUrl(raw.sourceUrl) ||
    "https://example.com";
  const safeSourceUrl = sanitizeExternalUrl(raw.sourceUrl) || safeApplyUrl;
  const canonicalUrl = canonicalizeJobUrl(raw.canonicalUrl || safeApplyUrl);

  const isExpired = isOpportunityDeadlineExpired(raw.deadline, raw.isActive);

  let verificationStatus: VerificationStatus =
    raw.verificationStatus || "PARTIALLY_CHECKED";
  if (raw.isDemo) {
    verificationStatus = "DEMO_DATA";
  } else if (isExpired) {
    verificationStatus = "STALE";
  } else if (
    !sanitizeExternalUrl(raw.applicationUrl) ||
    safeApplyUrl.includes("example.com")
  ) {
    verificationStatus = "UNVERIFIABLE";
  }

  const requiredSkills =
    raw.requiredSkills && raw.requiredSkills.length > 0
      ? raw.requiredSkills
      : extractSkillsFromDescription(`${sanitizedTitle} ${sanitizedDesc}`);

  const eligibilityRequirements =
    raw.eligibilityRequirements && raw.eligibilityRequirements.length > 0
      ? raw.eligibilityRequirements
      : extractEligibilityFromDescription(sanitizedTitle, sanitizedDesc);

  const fetchedAt = raw.fetchedAt || new Date().toISOString();
  const discoveredAt = raw.discoveredAt || fetchedAt;
  const lastCheckedAt = raw.lastCheckedAt || fetchedAt;

  const jobKey = makeCanonicalJobKey(sanitizedOrg, sanitizedTitle, canonicalUrl);
  const id = raw.providerId
    ? `opp-${raw.provider}-${raw.providerId}`.replace(/[^a-zA-Z0-9_-]/g, "-")
    : `opp-${jobKey}-${index}`;

  const evidenceItem: SourceEvidenceItem = {
    claim: `${sanitizedTitle} at ${sanitizedOrg} (${raw.sourceName})`,
    excerpt: sanitizedSnippet || sanitizedDesc.slice(0, 200),
    url: safeSourceUrl,
    observedAt: fetchedAt,
    verified:
      verificationStatus === "VERIFIED_SOURCE" ||
      verificationStatus === "DEMO_DATA",
  };

  const provenanceRecord: MultiSourceProvenanceRecord = {
    provider: raw.provider,
    sourceName: raw.sourceName,
    sourceUrl: safeSourceUrl,
    applicationUrl: safeApplyUrl,
    fetchedAt,
    verificationStatus,
    snippet: sanitizedSnippet,
  };

  const guardVerdict =
    descGuard.verdict === "SUSPICIOUS_INJECTION" ||
    titleGuard.verdict === "SUSPICIOUS_INJECTION"
      ? "SUSPICIOUS_INJECTION"
      : descGuard.verdict === "SANITIZED" || titleGuard.verdict === "SANITIZED"
        ? "SANITIZED"
        : "CLEAN";

  const normalizedCategory = normalizeCategory(raw.category, sanitizedTitle, sanitizedDesc);
  const resolvedHub = resolveCityHubFromText(raw.location);
  const latitude = raw.latitude ?? (resolvedHub ? resolvedHub.latitude : null);
  const longitude = raw.longitude ?? (resolvedHub ? resolvedHub.longitude : null);
  const employmentType =
    raw.employmentType ||
    (normalizedCategory === "Entry-level" ? "Full-time (Early-Career)" : normalizedCategory);

  return {
    id,
    title: sanitizedTitle,
    organization: sanitizedOrg,
    category: normalizedCategory,
    employmentType,
    roleFamily: raw.roleFamily || "General Technical",
    seniority: raw.seniority || "Intern / Early-Career",
    description: sanitizedDesc,
    location: raw.location || "Unspecified",
    latitude,
    longitude,
    workMode: normalizeWorkMode(raw.workMode, raw.location),
    compensation: raw.compensation?.trim() || "Unknown",
    eligibilityRequirements,
    requiredSkills,
    preferredSkills: raw.preferredSkills || [],
    publishedAt: raw.publishedAt ?? null,
    deadline: raw.deadline ?? null, // Never invent a deadline when unknown!
    deadlineRaw: raw.deadlineRaw ?? (raw.deadline ? null : "Unknown"),
    applyUrl: safeApplyUrl,
    applicationUrl: safeApplyUrl,
    canonicalUrl,
    providerId: raw.providerId ?? null,
    sourceName: raw.sourceName || raw.provider,
    sourceUrl: safeSourceUrl,
    sourceSnippet: sanitizedSnippet,
    sourceConfidence:
      verificationStatus === "VERIFIED_SOURCE"
        ? 0.92
        : verificationStatus === "DEMO_DATA"
          ? 0.9
          : verificationStatus === "PARTIALLY_CHECKED"
            ? 0.72
            : 0.4,
    verificationStatus,
    sourceEvidence: [evidenceItem],
    evidenceRecords: [evidenceItem],
    multiSourceProvenance: [provenanceRecord],
    guardVerdict,
    isExpired,
    fetchedAt,
    discoveredAt,
    lastCheckedAt,
    isDemo: Boolean(raw.isDemo),
  };
}

export const normalizeOpportunity = normalizeRawOpportunity;


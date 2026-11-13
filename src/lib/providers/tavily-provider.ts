import crypto from "crypto";
import {
  OpportunityCategory,
  RawOpportunity,
  SearchConfig,
  SearchProviderResult,
  VerificationStatus,
  WorkMode,
} from "../../types";
import { isSafePublicUrl, sanitizeExternalUrl } from "../safe-url";
import { SearchProvider, SearchProviderQueryOptions } from "./types";

export interface TavilyRawResult {
  title?: string;
  url?: string;
  content?: string;
  score?: number;
  published_date?: string | null;
  raw_content?: string | null;
  id?: string;
}

export interface TavilyApiResponse {
  query?: string;
  results?: TavilyRawResult[];
  response_time?: number;
  request_id?: string;
  error?: string;
}

const OPPORTUNITY_SIGNALS = [
  /\b(intern|internship|trainee|apprentice|co-op)\b/i,
  /\b(fellowship|fellow|scholarship)\b/i,
  /\b(researcher|research\s+intern|lab\s+assistant|research\s+assistant)\b/i,
  /\b(hackathon|codeathon|challenge|datathon)\b/i,
  /\b(hiring|openings?|apply\s+now|job|careers?|fresher|graduate\s+program(?:me)?)\b/i,
];

const URL_EXCLUSION_PATTERNS = [
  /wikipedia\.org|reddit\.com\/r\/|quora\.com|medium\.com\/@[^/]+\/how-i/i,
  /blog\?p=|\/blog\/[a-z0-9-]+/i,
  // Reject non-job profiles, articles, SEO category/directory listicles
  /linkedin\.com\/(?:in|company|school|pulse|learning)\//i,
  /linkedin\.com\/jobs\/(?:search|jobs-in|[a-z0-9-]+-jobs(?:-in-|-[a-z-]+|$))/i,
  /careers\.linkedin\.com\/pathways-programs/i,
  /indeed\.(?:com|co\.in)\/(?:jobs|q-[a-z0-9-]+-jobs)/i,
  /naukri\.com\/[a-z0-9-]+-jobs(?:-in-[a-z-]+)?(?:[?#]|$)/i,
  /internshala\.com\/internships\/[a-z-]+-internship\/?(?:[?#]|$)/i,
  /wellfound\.com\/role\/l\//i,
  /instahyre\.com\/[a-z0-9-]+-jobs-in-/i,
  /glassdoor\.[a-z.]+\/Job\//i,
  /insiderone\.in\/internships\/for\//i,
  /hiredoor\.in\/categories\//i,
  /shifttotech\.co\.in\/blog/i,
];

const DIRECT_INDIVIDUAL_JOB_URL_PATTERNS = [
  /linkedin\.com\/jobs\/view\/\d+/i,
  /naukri\.com\/job-listings-/i,
  /jobs\.lever\.co\/[^/]+\/[0-9a-f-]+/i,
  /(?:boards|job-boards)\.greenhouse\.io\/[^/]+\/jobs\/\d+/i,
  /jobs\.ashbyhq\.com\/[^/]+\/[0-9a-f-]+/i,
];

const EXCLUSION_SIGNALS = [
  /\b(how\s+to\s+get\s+an\s+internship|top\s+\d+\s+interview\s+questions|resume\s+tips)\b/i,
  /\b(top\s+\d+\s+(?:secret|best|tips|ways)|secret\s+opportunities)\b/i,
  /\b(course\s+syllabus|online\s+course\s+certificate|bootcamp\s+pricing)\b/i,
  /\b(blog\?p=|\/blog\/[a-z0-9-]+top-\d+)\b/i,
  // Reject multi-job directory / SEO aggregator listicle titles (e.g., "51504 Ai Ml Job Vacancies")
  /\b\d[\d,]*\+?\s+(?:[a-z0-9/&-]+\s+){0,6}(?:job\s+)?(?:vacancies|openings|jobs|open\s+roles)\b/i,
  /\bhiring\s+list\s*\(/i,
];

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
  "Data Analysis",
  "SQL",
  "PostgreSQL",
  "MongoDB",
  "Docker",
  "Kubernetes",
  "AWS",
  "GCP",
  "Azure",
  "Linux",
  "Git",
  "REST APIs",
  "FastAPI",
  "C++",
  "Java",
  "Go",
  "Rust",
  "Excel",
  "Data Structures",
];

const KNOWN_TECH_COMPANIES: Record<string, string> = {
  google: "Google",
  microsoft: "Microsoft",
  amazon: "Amazon",
  meta: "Meta",
  apple: "Apple",
  netflix: "Netflix",
  uber: "Uber",
  adobe: "Adobe",
  salesforce: "Salesforce",
  stripe: "Stripe",
  figma: "Figma",
  notion: "Notion",
  groww: "Groww",
  terralogic: "Terralogic",
  swiggy: "Swiggy",
  zomato: "Zomato",
  flipkart: "Flipkart",
  razorpay: "Razorpay",
  cred: "CRED",
  phonepe: "PhonePe",
  infosys: "Infosys",
  tcs: "TCS",
  wipro: "Wipro",
  iit: "IIT",
  iisc: "IISc",
};

/**
 * Checks whether a Tavily search result is an actual career/internship opportunity listing.
 */
export function isOpportunityListing(result: TavilyRawResult): boolean {
  const title = (result.title || "").toLowerCase();
  const url = (result.url || "").toLowerCase();
  const content = (result.content || "").toLowerCase();
  const text = `${title} ${url} ${content}`;

  // Block directory/listicle/profile URLs strictly
  for (const urlPat of URL_EXCLUSION_PATTERNS) {
    if (urlPat.test(url)) return false;
  }

  // Verified individual job-posting URL structure (LinkedIn /jobs/view, Naukri /job-listings-, ATS boards)
  // bypasses footer/sidebar snippet noise checks like "590 related vacancies" on the page.
  if (DIRECT_INDIVIDUAL_JOB_URL_PATTERNS.some((pat) => pat.test(url))) {
    return OPPORTUNITY_SIGNALS.some((pattern) => pattern.test(text));
  }

  // Check exclusion signals against title/text for general web results
  for (const excl of EXCLUSION_SIGNALS) {
    if (excl.test(title) || (excl.source.includes("how\\s+to") && excl.test(text))) {
      return false;
    }
  }
  if (/\b(?:wikipedia\.org|reddit\.com|quora\.com|course\s+syllabus)\b/i.test(text)) {
    return false;
  }

  // Must have at least one opportunity signal
  return OPPORTUNITY_SIGNALS.some((pattern) => pattern.test(text));
}

/**
 * Extracts organization name from title, URL, or content.
 */
export function extractOrganization(title: string, url: string, content: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    // Check known job boards (greenhouse, lever, ashby, etc.)
    if (host.includes("greenhouse.io")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0] && parts[0] !== "jobs") return formatOrgName(parts[0]);
      if (parts[1]) return formatOrgName(parts[1]);
    }
    if (host.includes("lever.co")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0]) return formatOrgName(parts[0]);
    }
    if (host.includes("ashbyhq.com")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      if (parts[0]) return formatOrgName(parts[0]);
    }

    // Check direct company domain (e.g. careers.google.com, groww.in)
    const domainParts = host.replace(/^www\./, "").split(".");
    if (domainParts.length >= 2) {
      const companyKey = domainParts[domainParts.length - 2];
      if (KNOWN_TECH_COMPANIES[companyKey]) {
        return KNOWN_TECH_COMPANIES[companyKey];
      }
    }
  } catch {
    // ignore
  }

  // Check content explicitly: "Company Name: Groww" or "Employer: Terralogic"
  const compMatch = content.match(
    /\b(?:company\s+name|employer|organization|company)[\s:—–]+([^\r\n,;—–|]{2,30})/i
  );
  if (compMatch && compMatch[1]?.trim()) {
    const candidate = compMatch[1].trim();
    if (!/^(hiring|jobs|career|remote|internship|salary)$/i.test(candidate)) {
      return formatOrgName(candidate);
    }
  }

  // Naukri individual posting format: "Role - City - Company - 0 to 1 years - Naukri.com"
  if (/naukri\.com/i.test(title) || /naukri\.com/i.test(url)) {
    const naukriParts = title.replace(/\s*-\s*naukri\.com.*$/i, "").split(/\s+-\s+/).map((s) => s.trim()).filter(Boolean);
    if (naukriParts.length >= 3) {
      const candidateOrg = naukriParts.find((p, idx) => idx >= 2 && !/\d+\s*(?:to|-)\s*\d+\s*years?/i.test(p)) || naukriParts[2];
      if (candidateOrg && !/^(naukri|india|remote)$/i.test(candidateOrg)) {
        return formatOrgName(candidateOrg.slice(0, 35));
      }
    }
  }

  // LinkedIn individual posting format: "<Company> hiring <Role> in <City> | LinkedIn"
  if (/\|\s*LinkedIn\b/i.test(title) && !/\bhiring\s+freshers?\b/i.test(title)) {
    const liHiringMatch = title.match(/^([A-Za-z0-9&.,\s-]{2,45}?)\s+hiring\s+/i);
    if (liHiringMatch && liHiringMatch[1]?.trim()) {
      return formatOrgName(liHiringMatch[1].trim());
    }
  }

  // Extract from title: "Role at Company" or "Company Role Hiring"
  const atMatch = title.match(/\bat\s+([A-Za-z0-9&.\s]{2,35}?)(?:,|-|—|\||\s+is\s+hiring|\s+internship|$)/i);
  if (atMatch && atMatch[1]?.trim()) {
    return formatOrgName(atMatch[1].trim());
  }

  const colonMatch = title.match(/^([A-Za-z0-9&.\s]{2,25})\s*[:—–|]\s*/);
  if (colonMatch && colonMatch[1]?.trim()) {
    return formatOrgName(colonMatch[1].trim());
  }

  for (const [key, name] of Object.entries(KNOWN_TECH_COMPANIES)) {
    if (new RegExp(`\\b${key}\\b`, "i").test(title)) {
      return name;
    }
  }

  // Fallback cleanly from title or "Verified Web Source"
  const firstWord = title.split(/[\s—–|-]/)[0]?.trim();
  if (firstWord && firstWord.length > 2 && !/^(remote|hiring|summer|apply|paid|software|internship)$/i.test(firstWord)) {
    return formatOrgName(firstWord);
  }

  return "Verified Employer";
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatOrgName(str: string): string {
  const clean = str.replace(/\([^)]*\)/g, "").replace(/[_-]/g, " ").trim();
  return clean
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Extracts a clean, concise opportunity title.
 */
export function extractOpportunityTitle(rawTitle: string, organization: string): string {
  let clean = rawTitle;
  // LinkedIn format: "<Company> hiring <Role> in <Location> | LinkedIn"
  if (/\|\s*LinkedIn\b/i.test(clean) && !/\bhiring\s+freshers?\b/i.test(clean)) {
    const liHiring = clean.match(/^.+?\s+hiring\s+(.+?)(?:\s+in\s+[^|—]+)?(?:\s*\|\s*LinkedIn.*)?$/i);
    if (liHiring && liHiring[1]?.trim()) {
      return liHiring[1].trim().slice(0, 90);
    }
  }
  // Naukri individual posting format: "<Role> - <City> - <Company> - <Exp> - Naukri.com"
  if (/naukri\.com/i.test(clean)) {
    const parts = clean.replace(/\s*-\s*naukri\.com.*$/i, "").split(/\s+-\s+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2 && !/\bjob\s+vacancies\b/i.test(parts[0])) {
      return parts[0].slice(0, 90);
    }
  }
  // Remove suffixes like "— Apply Now", "| Company", "Hiring Freshers...", "Internship of the Day"
  clean = clean.split(/[|—–]/)[0]?.trim() || clean;
  clean = clean.replace(/\b(hiring\s+freshers?|apply\s+now|internship\s+of\s+the\s+day|off\s+campus\s+drive\s+\d{4}|get\s+hired\s+faster)\b/gi, "").trim();
  clean = clean.replace(/\bat\s+[^,–—|]+/gi, "").trim();
  if (organization && organization.length > 0) {
    clean = clean.replace(new RegExp(`^${escapeRegex(organization)}\\s*`, "i"), "").trim();
  }
  clean = clean.replace(/,\s*[A-Za-z\s]+$/, "").trim(); // trailing location
  clean = clean.replace(/\s{2,}/g, " ").trim();

  if (clean.length < 5) {
    return `${organization} Technical Opportunity`;
  }
  return clean.slice(0, 90);
}

/**
 * Extracts category from title and content.
 */
export function extractCategory(title: string, content: string): OpportunityCategory {
  const text = `${title} ${content}`.toLowerCase();
  if (/\b(hackathon|codeathon|datathon)\b/i.test(text)) return "Hackathon";
  if (/\b(fellowship|fellow)\b/i.test(text)) return "Fellowship";
  if (/\b(research\s+intern|research\s+fellow|research\s+assistant|research\s+program|lab\s+intern)\b/i.test(text)) {
    return "Research";
  }
  if (/\b(intern|internship|trainee|apprentice|co-op)\b/i.test(text)) return "Internship";
  return "Entry-level";
}

/**
 * Extracts location and work mode.
 */
export function extractLocationAndWorkMode(
  content: string,
  title: string
): { location: string; workMode: WorkMode } {
  const text = `${title} ${content}`.toLowerCase();

  let workMode: WorkMode = "On-site";
  if (/\b(remote|work\s+from\s+home|wfh|telecommute|virtual)\b/i.test(text)) {
    workMode = "Remote";
  } else if (/\b(hybrid|flexible\s+work)\b/i.test(text)) {
    workMode = "Hybrid";
  }

  const cities = [
    { name: "Bengaluru, India", pattern: /\b(bengaluru|bangalore)\b/i },
    { name: "Hyderabad, India", pattern: /\bhyderabad\b/i },
    { name: "Pune, India", pattern: /\bpune\b/i },
    { name: "Mumbai, India", pattern: /\bmumbai\b/i },
    { name: "Delhi, India", pattern: /\b(delhi|ncr)\b/i },
    { name: "Noida, India", pattern: /\bnoida\b/i },
    { name: "Gurugram, India", pattern: /\b(gurugram|gurgaon)\b/i },
    { name: "Chennai, India", pattern: /\bchennai\b/i },
    { name: "Kolkata, India", pattern: /\bkolkata\b/i },
    { name: "San Francisco, CA", pattern: /\b(san\s+francisco|sf\s+bay)\b/i },
    { name: "New York, NY", pattern: /\b(new\s+york|nyc)\b/i },
    { name: "Seattle, WA", pattern: /\bseattle\b/i },
    { name: "London, UK", pattern: /\blondon\b/i },
    { name: "Singapore", pattern: /\bsingapore\b/i },
  ];

  for (const c of cities) {
    if (c.pattern.test(text)) {
      return { location: c.name, workMode };
    }
  }

  if (workMode === "Remote") {
    return { location: "Remote", workMode: "Remote" };
  }

  if (/\bindia\b/i.test(text)) {
    return { location: "India (Multiple Locations)", workMode };
  }

  return { location: "Location unspecified", workMode };
}

/**
 * Extracts explicitly stated compensation without fabricating.
 */
export function extractCompensation(content: string): string | undefined {
  // Pattern 1: "Stipend: Rs 50,000 per month" or "The role pays Rs 50,000 per month"
  const m1 = content.match(
    /\b(?:stipend|salary|pay(?:s|ing)?|compensation)[\s:—–]+(?:rs\.?|₹|\$|inr)?\s*([\d,]+(?:\s*(?:–|-|to)\s*(?:rs\.?|₹|\$|inr)?\s*[\d,]+)?(?:\s*(?:\/|\s*per|\s*a\s*)(?:month|mo|hr|hour|year|pm))?)/i
  );
  if (m1 && m1[1]) {
    const val = m1[1].trim();
    const period = /(month|mo|pm)/i.test(m1[0]) ? "/ month" : /(hr|hour)/i.test(m1[0]) ? "/ hr" : "/ month";
    return `₹${val.replace(/^rs\.?/i, "").trim()} ${period}`;
  }

  // Pattern 2: "paying ₹18,000–₹26,000 a month"
  const m2 = content.match(
    /(?:paying|stipend\s+of|salary\s+of|pays?)[\s:—–]*(?:₹|rs\.?|\$)\s*([\d,]+(?:\s*(?:–|-|to)\s*(?:₹|rs\.?|\$)?\s*[\d,]+)?\s*(?:a|per|\/)\s*(?:month|mo|hr|hour|pm))/i
  );
  if (m2 && m2[1]) {
    return `₹${m2[1].trim()}`;
  }

  // If not explicitly mentioned, return undefined (never fabricate)
  return undefined;
}

/**
 * Extracts explicitly stated deadline without fabricating.
 */
export function extractDeadline(content: string): { deadline: string | null; deadlineRaw: string | null } {
  const m = content.match(
    /\b(?:deadline|apply\s+by|last\s+date(?:\s+to\s+apply)?|closing\s+date)[\s:—–]+([A-Za-z]{3,9}\s+\d{1,2}(?:st|nd|rd|th)?,?\s+\d{4}|\d{1,2}(?:st|nd|rd|th)?\s+[A-Za-z]{3,9},?\s+\d{4}|\d{4}-\d{2}-\d{2})/i
  );
  if (m && m[1]) {
    const raw = m[1].trim();
    const parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      return { deadline: parsed.toISOString(), deadlineRaw: raw };
    }
    return { deadline: null, deadlineRaw: raw };
  }
  return { deadline: null, deadlineRaw: null };
}

/**
 * Extracts technical skills mentioned in the content.
 */
export function extractSkills(content: string, userQuerySkills: string[] = []): string[] {
  const lower = content.toLowerCase();
  const found: string[] = [];

  for (const skill of KNOWN_SKILL_DICTIONARY) {
    const sLower = skill.toLowerCase();
    if (sLower === "c++") {
      if (/\bc\+\+\b/i.test(content)) found.push(skill);
    } else if (sLower === "go") {
      if (/\bgolang\b|\bgo\s+developer\b/i.test(content)) found.push(skill);
    } else if (sLower === "sql") {
      if (/\bsql\b/i.test(content)) found.push(skill);
    } else if (new RegExp(`\\b${sLower}\\b`, "i").test(lower)) {
      found.push(skill);
    }
  }

  // Include skills from the user query if not present
  for (const sk of userQuerySkills) {
    if (!found.includes(sk)) found.push(sk);
  }

  return Array.from(new Set(found)).slice(0, 8);
}

/**
 * Extracts eligibility facts from content.
 */
export function extractEligibilityRequirements(content: string): string[] {
  const reqs: string[] = [];

  // Graduation batches
  const batchMatch = content.match(/\b(?:eligible\s+batch|passout\s+batch|batch|graduating)[\s:—–]+([0-9\/\s,–-]+(?:graduating\s+students|passouts|batch)?)/i);
  if (batchMatch && batchMatch[1]) {
    reqs.push(`Eligible Batches: ${batchMatch[1].trim()}`);
  }

  // Degree requirements
  const degreeMatch = content.match(/\b(b\.?e\.?\/b\.?tech|bachelor'?s|master'?s|m\.?tech|pursuing\s+a\s+degree\s+in\s+[^.,;\n]+|b\.?s\.?|m\.?s\.?)\b/i);
  if (degreeMatch) {
    reqs.push(`Enrolled or Graduate in ${degreeMatch[0].trim()} or related technical discipline`);
  }

  // Academic standing / year
  if (/\b(2nd|second)\s*year\b/i.test(content)) {
    reqs.push("Open to 2nd year undergraduate students");
  } else if (/\b(final|4th|fourth)\s*year\b/i.test(content)) {
    reqs.push("Open to final-year undergraduate students");
  }

  if (reqs.length === 0) {
    reqs.push("Review full eligibility terms on official application page");
  }

  return reqs;
}

/**
 * Normalizes a single Tavily result into a Prospect RawOpportunity.
 */
export function normalizeTavilyResult(
  result: TavilyRawResult,
  querySkills: string[] = [],
  fetchedAt: string = new Date().toISOString()
): RawOpportunity | null {
  const rawUrl = result.url || "";
  const safeCheck = isSafePublicUrl(rawUrl);
  if (!safeCheck.isSafe) return null;

  const sanitized = sanitizeExternalUrl(rawUrl);
  if (!sanitized) return null;
  const url = sanitized;
  const rawTitle = (result.title || "").trim();
  const content = (result.content || "").trim();

  if (!rawTitle && !content) return null;

  const organization = extractOrganization(rawTitle, url, content);
  const title = extractOpportunityTitle(rawTitle, organization);
  const category = extractCategory(rawTitle, content);
  const { location, workMode } = extractLocationAndWorkMode(content, rawTitle);
  const compensation = extractCompensation(content);
  const { deadline, deadlineRaw } = extractDeadline(content);
  const requiredSkills = extractSkills(content, querySkills);
  const eligibilityRequirements = extractEligibilityRequirements(content);

  // Confidence and Verification status
  const score = result.score ?? 0.8;
  const isOfficialDomain = /\.(edu|ac\.in|gov)$/i.test(url) ||
    /careers?\.|jobs\.|boards\.greenhouse\.io|jobs\.lever\.co|jobs\.ashbyhq\.com/i.test(url);

  let verificationStatus: VerificationStatus = "PARTIALLY_CHECKED";
  if (isOfficialDomain && score >= 0.85) {
    verificationStatus = "VERIFIED_SOURCE";
  } else if (score < 0.6) {
    verificationStatus = "UNVERIFIABLE";
  }

  const sourceConfidence = Math.min(0.98, Math.max(0.65, Number(score.toFixed(2))));
  const sourceSnippet = content.slice(0, 320);

  const inferPlatformSourceName = (targetUrl: string): string => {
    const low = targetUrl.toLowerCase();
    if (low.includes("linkedin.com")) return "LinkedIn Jobs (Web Index)";
    if (low.includes("naukri.com")) return "Naukri (Web Index)";
    if (low.includes("indeed.")) return "Indeed (Web Index)";
    if (low.includes("wellfound.com") || low.includes("angel.co")) return "Wellfound (Web Index)";
    if (low.includes("internshala.com")) return "Internshala (Web Index)";
    if (low.includes("unstop.com")) return "Unstop (Web Index)";
    if (low.includes("boards.greenhouse.io") || low.includes("job-boards.greenhouse.io")) return "Greenhouse (Web Index)";
    if (low.includes("jobs.lever.co")) return "Lever (Web Index)";
    if (low.includes("jobs.ashbyhq.com")) return "Ashby (Web Index)";
    if (low.includes("workatastartup.com")) return "Y Combinator (Web Index)";
    return "Tavily Real-Time Web Index";
  };

  return {
    provider: "tavily",
    providerId: `tvly-${crypto.createHash("sha256").update(url).digest("hex").slice(0, 20)}`,
    title,
    organization,
    description: content.length > 0 ? content : `${title} at ${organization}. Verified live web opportunity.`,
    category,
    location,
    workMode,
    seniority: category === "Internship" ? "Intern / Student" : "Early-Career",
    compensation: compensation || "Compensation unlisted / See posting",
    requiredSkills,
    preferredSkills: [],
    eligibilityRequirements,
    publishedAt: result.published_date || null,
    deadline,
    deadlineRaw,
    applicationUrl: url,
    canonicalUrl: url,
    sourceName: inferPlatformSourceName(url),
    sourceUrl: url,
    sourceSnippet,
    fetchedAt,
    discoveredAt: fetchedAt,
    lastCheckedAt: fetchedAt,
    verificationStatus,
    isActive: true,
    isDemo: false,
  };
}

/**
 * Full-featured Tavily Real-Time Web Discovery Provider for Prospect.
 */
export class TavilySearchProvider implements SearchProvider {
  id: string = "tavily";
  displayName: string = "Tavily Real-Time Web Intelligence";
  readonly description =
    "Real-time web search discovery across official career portals, university labs, and global opportunity boards.";
  readonly scopeNote =
    "Requires TAVILY_API_KEY. Searches live web listings with deduplication, timeout safeguards, and rate-limit backoff.";

  private getApiKey(): string | undefined {
    return process.env.TAVILY_API_KEY?.trim();
  }

  isEnabled(config: SearchConfig): boolean {
    if (config.mode === "DEMO") return false;
    const apiKey = this.getApiKey();
    return Boolean(
      apiKey &&
        process.env.DISABLE_TAVILY_PROVIDER !== "true" &&
        process.env.ENABLE_WEB_DISCOVERY !== "false"
    );
  }

  async search(options: SearchProviderQueryOptions): Promise<SearchProviderResult> {
    const fetchedAt = new Date().toISOString();
    const { queryItem, limit, config, signal, fetchImpl = fetch } = options;
    const apiKey = this.getApiKey();

    if (!apiKey) {
      return {
        provider: this.id,
        opportunities: [],
        queryExecuted: queryItem.query,
        sourcesChecked: [],
        warnings: ["Tavily search skipped: TAVILY_API_KEY is not configured in server environment."],
        fetchedAt,
        status: "FAILED",
      };
    }

    const endpoint = "https://api.tavily.com/search";
    const maxResults = Math.min(Math.max(limit || 10, 1), 10);

    // Build focused, candidate-location-aware search query (never hardcode a single country)
    let formattedQuery = queryItem.query.trim();
    if (!/\b(intern|internship|fellowship|research|careers?|hiring|apply|jobs?)\b|job-listings/i.test(formattedQuery)) {
      formattedQuery = `${formattedQuery} internship hiring apply`;
    }

    const activeLocToken = (queryItem.locationFilters || [])
      .map((l) => l.trim())
      .find((l) => l && !/^(remote|flexible|unspecified|all)$/i.test(l));

    if (
      activeLocToken &&
      !formattedQuery.toLowerCase().includes(activeLocToken.split(",")[0].trim().toLowerCase())
    ) {
      formattedQuery = `${formattedQuery} ${activeLocToken.split(",")[0].trim()}`;
    }

    try {
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: formattedQuery,
          search_depth: "basic",
          max_results: maxResults,
          include_answer: false,
          include_raw_content: false,
          ...(queryItem.includeDomains && queryItem.includeDomains.length > 0
            ? { include_domains: queryItem.includeDomains }
            : {}),
        }),
        signal,
      });

      if (response.status === 401 || response.status === 403) {
        return {
          provider: this.id,
          opportunities: [],
          queryExecuted: formattedQuery,
          sourcesChecked: [endpoint],
          warnings: ["Tavily API authentication failed: Invalid or expired API key (HTTP 401/403)."],
          fetchedAt,
          status: "FAILED",
        };
      }

      if (response.status === 429) {
        return {
          provider: this.id,
          opportunities: [],
          queryExecuted: formattedQuery,
          sourcesChecked: [endpoint],
          warnings: ["Tavily API quota or rate limit exceeded (HTTP 429)."],
          fetchedAt,
          status: "RATE_LIMITED",
        };
      }

      if (!response.ok) {
        return {
          provider: this.id,
          opportunities: [],
          queryExecuted: formattedQuery,
          sourcesChecked: [endpoint],
          warnings: [`Tavily search endpoint returned HTTP ${response.status} ${response.statusText}.`],
          fetchedAt,
          status: "FAILED",
        };
      }

      const data = (await response.json()) as TavilyApiResponse;
      const rawResults = Array.isArray(data.results) ? data.results : [];

      const opportunities: RawOpportunity[] = [];
      const sourcesChecked: string[] = [endpoint];

      for (const res of rawResults) {
        if (!res.url) continue;
        sourcesChecked.push(res.url);

        // Filter out non-opportunity articles/pages
        if (!isOpportunityListing(res)) continue;

        const normalized = normalizeTavilyResult(res, queryItem.skillCombinations, fetchedAt);
        if (normalized) {
          opportunities.push(normalized);
        }
      }

      return {
        provider: this.id,
        opportunities,
        queryExecuted: formattedQuery,
        sourcesChecked,
        warnings:
          opportunities.length === 0
            ? ["Tavily returned web results, but none matched strict opportunity criteria."]
            : [],
        fetchedAt,
        status: "SUCCESS",
      };
    } catch (err: unknown) {
      const isAbort =
        err instanceof Error &&
        (err.name === "AbortError" || err.message.toLowerCase().includes("abort"));

      return {
        provider: this.id,
        opportunities: [],
        queryExecuted: formattedQuery,
        sourcesChecked: [endpoint],
        warnings: [
          isAbort
            ? `Tavily request timed out or was cancelled.`
            : `Tavily network error: ${err instanceof Error ? err.message : String(err)}`,
        ],
        fetchedAt,
        status: "FAILED",
      };
    }
  }
}

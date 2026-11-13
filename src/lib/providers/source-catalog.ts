/**
 * PROSPECT — Source Catalog & Institutional Source Registry
 * Curated registry of legitimate employers, university research labs,
 * government student initiatives, and fellowship programs.
 */

export type SourceCategory =
  | "UNIVERSITY"
  | "RESEARCH_LAB"
  | "GOVERNMENT_PROGRAMME"
  | "FELLOWSHIP_ORGANIZATION"
  | "STARTUP"
  | "EMPLOYER"
  | "SCHOLARSHIP_PROVIDER"
  | "STUDENT_PROGRAMME";

export type AccessMethod =
  | "OFFICIAL_API"
  | "PUBLIC_JOB_FEED"
  | "RSS"
  | "SITEMAP"
  | "PERMITTED_SEARCH_DISCOVERY";

export interface SourceCatalogEntry {
  id: string;
  name: string;
  category: SourceCategory;
  domain: string;
  careerUrl: string;
  region: "India" | "US" | "Global" | "Remote";
  supportedTypes: Array<
    "Internship" | "Research" | "Fellowship" | "Hackathon" | "Entry-level"
  >;
  accessMethod: AccessMethod;
  enabled: boolean;
  freshnessPolicyHours: number;
  rateLimitPerMinute: number;
  requiresAuth: boolean;
  notes: string;
}

export const SOURCE_CATALOG: SourceCatalogEntry[] = [
  // 1. Direct Tech Employers (ATS Powered)
  {
    id: "stripe-careers",
    name: "Stripe",
    category: "EMPLOYER",
    domain: "stripe.com",
    careerUrl: "https://stripe.com/jobs",
    region: "Global",
    supportedTypes: ["Internship", "Entry-level"],
    accessMethod: "PUBLIC_JOB_FEED", // Greenhouse board API
    enabled: true,
    freshnessPolicyHours: 24,
    rateLimitPerMinute: 60,
    requiresAuth: false,
    notes: "Direct Greenhouse board 'stripe'. Verified active internship programs.",
  },
  {
    id: "figma-careers",
    name: "Figma",
    category: "EMPLOYER",
    domain: "figma.com",
    careerUrl: "https://figma.com/careers",
    region: "Global",
    supportedTypes: ["Internship", "Entry-level"],
    accessMethod: "PUBLIC_JOB_FEED", // Lever / Greenhouse
    enabled: true,
    freshnessPolicyHours: 24,
    rateLimitPerMinute: 60,
    requiresAuth: false,
    notes: "Direct Lever/Greenhouse feed for software, design, and product internships.",
  },
  {
    id: "notion-careers",
    name: "Notion",
    category: "EMPLOYER",
    domain: "notion.so",
    careerUrl: "https://notion.so/careers",
    region: "Global",
    supportedTypes: ["Internship", "Entry-level"],
    accessMethod: "PUBLIC_JOB_FEED", // Ashby API
    enabled: true,
    freshnessPolicyHours: 24,
    rateLimitPerMinute: 60,
    requiresAuth: false,
    notes: "Direct Ashby board for systems, AI, and full-stack engineering internships.",
  },
  {
    id: "openai-careers",
    name: "OpenAI",
    category: "RESEARCH_LAB",
    domain: "openai.com",
    careerUrl: "https://openai.com/careers",
    region: "Global",
    supportedTypes: ["Internship", "Research", "Fellowship"],
    accessMethod: "PUBLIC_JOB_FEED", // Greenhouse board 'openai'
    enabled: true,
    freshnessPolicyHours: 24,
    rateLimitPerMinute: 60,
    requiresAuth: false,
    notes: "Direct Greenhouse feed for Research Engineer and AI Resident programs.",
  },

  // 2. Institutional Research Labs & Universities (India)
  {
    id: "aicte-internships",
    name: "AICTE Internship Enterprise Portal",
    category: "GOVERNMENT_PROGRAMME",
    domain: "internship.aicte-india.org",
    careerUrl: "https://internship.aicte-india.org",
    region: "India",
    supportedTypes: ["Internship", "Student_programme" as any],
    accessMethod: "PERMITTED_SEARCH_DISCOVERY",
    enabled: true,
    freshnessPolicyHours: 48,
    rateLimitPerMinute: 30,
    requiresAuth: false,
    notes: "Official Indian Government national internship portal across engineering disciplines.",
  },
  {
    id: "iisc-research",
    name: "Indian Institute of Science (IISc Bangalore)",
    category: "UNIVERSITY",
    domain: "iisc.ac.in",
    careerUrl: "https://iisc.ac.in",
    region: "India",
    supportedTypes: ["Research", "Fellowship", "Internship"],
    accessMethod: "PERMITTED_SEARCH_DISCOVERY",
    enabled: true,
    freshnessPolicyHours: 72,
    rateLimitPerMinute: 30,
    requiresAuth: false,
    notes: "Summer research fellowships (SRFP), CSA, RBCCPS, and AI lab project assistantships.",
  },
  {
    id: "iit-bombay-research",
    name: "IIT Bombay Summer Research Internship",
    category: "UNIVERSITY",
    domain: "iitb.ac.in",
    careerUrl: "https://www.iitb.ac.in",
    region: "India",
    supportedTypes: ["Research", "Internship"],
    accessMethod: "PERMITTED_SEARCH_DISCOVERY",
    enabled: true,
    freshnessPolicyHours: 72,
    rateLimitPerMinute: 30,
    requiresAuth: false,
    notes: "IITB research internship awards (FOSSEE, CSE, AI research initiatives).",
  },
  {
    id: "drdo-internships",
    name: "DRDO Student Research Apprenticeship & Projects",
    category: "GOVERNMENT_PROGRAMME",
    domain: "drdo.gov.in",
    careerUrl: "https://www.drdo.gov.in",
    region: "India",
    supportedTypes: ["Research", "Internship"],
    accessMethod: "PERMITTED_SEARCH_DISCOVERY",
    enabled: true,
    freshnessPolicyHours: 96,
    rateLimitPerMinute: 20,
    requiresAuth: false,
    notes: "Official research laboratories (CAIR, SAG, DEAL) project trainee positions for B.Tech students.",
  },
  {
    id: "isro-internships",
    name: "ISRO / VSSC / SAC Student Training & Internships",
    category: "GOVERNMENT_PROGRAMME",
    domain: "isro.gov.in",
    careerUrl: "https://www.isro.gov.in",
    region: "India",
    supportedTypes: ["Research", "Internship"],
    accessMethod: "PERMITTED_SEARCH_DISCOVERY",
    enabled: true,
    freshnessPolicyHours: 96,
    rateLimitPerMinute: 20,
    requiresAuth: false,
    notes: "Space applications, satellite AI, and sensor data project work for undergraduate engineering.",
  },

  // 3. International Academic Fellowships & Research
  {
    id: "nsf-reu",
    name: "National Science Foundation — Research Experiences for Undergraduates (REU)",
    category: "FELLOWSHIP_ORGANIZATION",
    domain: "nsf.gov",
    careerUrl: "https://www.nsf.gov/crssprgm/reu/",
    region: "US",
    supportedTypes: ["Research", "Fellowship"],
    accessMethod: "PERMITTED_SEARCH_DISCOVERY",
    enabled: true,
    freshnessPolicyHours: 120,
    rateLimitPerMinute: 30,
    requiresAuth: false,
    notes: "Summer computational and CS research fellowships across US universities.",
  },
  {
    id: "cern-summer-student",
    name: "CERN Summer Student Programme",
    category: "RESEARCH_LAB",
    domain: "careers.cern",
    careerUrl: "https://careers.cern/summer",
    region: "Global",
    supportedTypes: ["Research", "Fellowship", "Internship"],
    accessMethod: "PERMITTED_SEARCH_DISCOVERY",
    enabled: true,
    freshnessPolicyHours: 120,
    rateLimitPerMinute: 30,
    requiresAuth: false,
    notes: "Open to international undergraduate students in IT, physics, and computer science.",
  },
];

/**
 * Filter and query the source catalog
 */
export function getSourceCatalogEntries(options?: {
  category?: SourceCategory;
  region?: string;
  opportunityType?: string;
  enabledOnly?: boolean;
}): SourceCatalogEntry[] {
  let entries = SOURCE_CATALOG;
  if (options?.enabledOnly !== false) {
    entries = entries.filter((e) => e.enabled);
  }
  if (options?.category) {
    entries = entries.filter((e) => e.category === options.category);
  }
  if (options?.region) {
    entries = entries.filter(
      (e) => e.region === options.region || e.region === "Global"
    );
  }
  if (options?.opportunityType) {
    entries = entries.filter((e) =>
      e.supportedTypes.includes(options.opportunityType as any)
    );
  }
  return entries;
}

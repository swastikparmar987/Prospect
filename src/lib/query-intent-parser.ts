import { OpportunityCategory, WorkMode } from "../types";
import { doesOpportunityMatchCity, inferCountryFromLocation } from "./location-intelligence";

export interface ParsedSearchIntent {
  rawQuery: string;
  category?: OpportunityCategory;
  roleTitle?: string;
  skills: string[];
  location?: string;
  locationScope?: "CITY" | "REGION" | "COUNTRY" | "GLOBAL";
  matchedLocationTokens?: string[];
  workMode?: WorkMode;
  academicYear?: string;
  graduationYear?: number;
  compensationPreference?: "PAID_ONLY" | "ANY";
  experienceLevel?: "NO_EXPERIENCE" | "EARLY_CAREER" | "ANY";
  deadlineRequirement?: string;
  isSpecificCompany?: boolean;
  companyTarget?: string;
  tavilySearchQueries: string[];
}

const COMMON_SKILLS = [
  "Python",
  "TypeScript",
  "JavaScript",
  "React",
  "Next.js",
  "Node.js",
  "PyTorch",
  "TensorFlow",
  "Machine Learning",
  "AI/ML",
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
  "C++",
  "Java",
  "Go",
  "Rust",
  "Git",
  "Linux",
  "Excel",
];

const KNOWN_LOCATIONS: Array<{
  pattern: RegExp;
  canonical: string;
  scope: "CITY" | "REGION" | "COUNTRY" | "GLOBAL";
  stripTokens: string[];
}> = [
  // Multi-word cities / metros first
  { pattern: /\bdelhi\s*ncr\b|\bncr\b/i, canonical: "Delhi NCR, India", scope: "REGION", stripTokens: ["delhi", "ncr"] },
  { pattern: /\bnew\s+delhi\b/i, canonical: "New Delhi, India", scope: "CITY", stripTokens: ["new", "delhi"] },
  { pattern: /\b(bengaluru|bangalore)\b/i, canonical: "Bengaluru, India", scope: "CITY", stripTokens: ["bengaluru", "bangalore"] },
  { pattern: /\bhyderabad\b/i, canonical: "Hyderabad, India", scope: "CITY", stripTokens: ["hyderabad"] },
  { pattern: /\bpune\b/i, canonical: "Pune, India", scope: "CITY", stripTokens: ["pune"] },
  { pattern: /\bmumbai\b/i, canonical: "Mumbai, India", scope: "CITY", stripTokens: ["mumbai"] },
  { pattern: /\bdelhi\b/i, canonical: "Delhi, India", scope: "CITY", stripTokens: ["delhi"] },
  { pattern: /\bnoida\b/i, canonical: "Noida, India", scope: "CITY", stripTokens: ["noida"] },
  { pattern: /\b(gurgaon|gurugram)\b/i, canonical: "Gurugram, India", scope: "CITY", stripTokens: ["gurgaon", "gurugram"] },
  { pattern: /\bchennai\b/i, canonical: "Chennai, India", scope: "CITY", stripTokens: ["chennai"] },
  { pattern: /\bkolkata\b/i, canonical: "Kolkata, India", scope: "CITY", stripTokens: ["kolkata"] },
  { pattern: /\bjaipur\b/i, canonical: "Jaipur, India", scope: "CITY", stripTokens: ["jaipur"] },
  { pattern: /\bchandigarh\b/i, canonical: "Chandigarh, India", scope: "CITY", stripTokens: ["chandigarh"] },
  { pattern: /\bahmedabad\b/i, canonical: "Ahmedabad, India", scope: "CITY", stripTokens: ["ahmedabad"] },
  { pattern: /\bkochi\b/i, canonical: "Kochi, India", scope: "CITY", stripTokens: ["kochi"] },
  { pattern: /\bindore\b/i, canonical: "Indore, India", scope: "CITY", stripTokens: ["indore"] },
  { pattern: /\bfaridabad\b/i, canonical: "Faridabad, India", scope: "CITY", stripTokens: ["faridabad"] },
  { pattern: /\bghaziabad\b/i, canonical: "Ghaziabad, India", scope: "CITY", stripTokens: ["ghaziabad"] },
  // Indian states
  { pattern: /\bkarnataka\b/i, canonical: "Karnataka, India", scope: "REGION", stripTokens: ["karnataka"] },
  { pattern: /\bmaharashtra\b/i, canonical: "Maharashtra, India", scope: "REGION", stripTokens: ["maharashtra"] },
  { pattern: /\btelangana\b/i, canonical: "Telangana, India", scope: "REGION", stripTokens: ["telangana"] },
  { pattern: /\btamil\s+nadu\b/i, canonical: "Tamil Nadu, India", scope: "REGION", stripTokens: ["tamil", "nadu"] },
  { pattern: /\bharyana\b/i, canonical: "Haryana, India", scope: "REGION", stripTokens: ["haryana"] },
  { pattern: /\buttar\s+pradesh\b/i, canonical: "Uttar Pradesh, India", scope: "REGION", stripTokens: ["uttar", "pradesh"] },
  { pattern: /\bkerala\b/i, canonical: "Kerala, India", scope: "REGION", stripTokens: ["kerala"] },
  { pattern: /\bgujarat\b/i, canonical: "Gujarat, India", scope: "REGION", stripTokens: ["gujarat"] },
  { pattern: /\brajasthan\b/i, canonical: "Rajasthan, India", scope: "REGION", stripTokens: ["rajasthan"] },
  { pattern: /\bwest\s+bengal\b/i, canonical: "West Bengal, India", scope: "REGION", stripTokens: ["west", "bengal"] },
  // US / International cities & states
  { pattern: /\b(san\s+francisco|bay\s+area|\bsf\b)\b/i, canonical: "San Francisco, United States", scope: "CITY", stripTokens: ["san", "francisco", "bay", "area", "sf"] },
  { pattern: /\b(new\s+york|\bnyc\b)\b/i, canonical: "New York, United States", scope: "CITY", stripTokens: ["new", "york", "nyc"] },
  { pattern: /\bseattle\b/i, canonical: "Seattle, United States", scope: "CITY", stripTokens: ["seattle"] },
  { pattern: /\baustin\b/i, canonical: "Austin, United States", scope: "CITY", stripTokens: ["austin"] },
  { pattern: /\bboston\b/i, canonical: "Boston, United States", scope: "CITY", stripTokens: ["boston"] },
  { pattern: /\bcalifornia\b/i, canonical: "California, United States", scope: "REGION", stripTokens: ["california"] },
  { pattern: /\btexas\b/i, canonical: "Texas, United States", scope: "REGION", stripTokens: ["texas"] },
  { pattern: /\blondon\b/i, canonical: "London, United Kingdom", scope: "CITY", stripTokens: ["london"] },
  { pattern: /\bsingapore\b/i, canonical: "Singapore", scope: "CITY", stripTokens: ["singapore"] },
  { pattern: /\btoronto\b/i, canonical: "Toronto, Canada", scope: "CITY", stripTokens: ["toronto"] },
  { pattern: /\bvancouver\b/i, canonical: "Vancouver, Canada", scope: "CITY", stripTokens: ["vancouver"] },
  { pattern: /\bontario\b/i, canonical: "Ontario, Canada", scope: "REGION", stripTokens: ["ontario"] },
  { pattern: /\bberlin\b/i, canonical: "Berlin, Germany", scope: "CITY", stripTokens: ["berlin"] },
  { pattern: /\bmunich\b/i, canonical: "Munich, Germany", scope: "CITY", stripTokens: ["munich"] },
  { pattern: /\bdublin\b/i, canonical: "Dublin, Ireland", scope: "CITY", stripTokens: ["dublin"] },
  { pattern: /\b(dubai|uae)\b/i, canonical: "Dubai, United Arab Emirates", scope: "CITY", stripTokens: ["dubai", "uae"] },
  { pattern: /\b(doha|qatar)\b/i, canonical: "Doha, Qatar", scope: "CITY", stripTokens: ["doha", "qatar"] },
  { pattern: /\btokyo\b/i, canonical: "Tokyo, Japan", scope: "CITY", stripTokens: ["tokyo"] },
  { pattern: /\bsydney\b/i, canonical: "Sydney, Australia", scope: "CITY", stripTokens: ["sydney"] },
  // Countries & Global scopes
  { pattern: /\bindia\b/i, canonical: "India", scope: "COUNTRY", stripTokens: ["india"] },
  { pattern: /\bunited\s+states\b|\busa\b|\bu\.s\.a?\b|(?:in|remote|for)\s+us\b|\bus\s+remote\b/i, canonical: "United States", scope: "COUNTRY", stripTokens: ["united", "states", "usa", "us"] },
  { pattern: /\bunited\s+kingdom\b|\b(?:in|remote|for)\s+uk\b|\buk\s+remote\b/i, canonical: "United Kingdom", scope: "COUNTRY", stripTokens: ["united", "kingdom", "uk"] },
  { pattern: /\bcanada\b/i, canonical: "Canada", scope: "COUNTRY", stripTokens: ["canada"] },
  { pattern: /\bgermany\b/i, canonical: "Germany", scope: "COUNTRY", stripTokens: ["germany"] },
  { pattern: /\bireland\b/i, canonical: "Ireland", scope: "COUNTRY", stripTokens: ["ireland"] },
  { pattern: /\baustralia\b/i, canonical: "Australia", scope: "COUNTRY", stripTokens: ["australia"] },
  { pattern: /\bpoland\b/i, canonical: "Poland", scope: "COUNTRY", stripTokens: ["poland"] },
  { pattern: /\bjapan\b/i, canonical: "Japan", scope: "COUNTRY", stripTokens: ["japan"] },
  { pattern: /\beurope\b|\bemea\b/i, canonical: "Europe", scope: "REGION", stripTokens: ["europe", "emea"] },
  { pattern: /\b(international|worldwide|global|anywhere)\b/i, canonical: "Global", scope: "GLOBAL", stripTokens: ["international", "worldwide", "global", "anywhere"] },
];

/**
 * Deterministically parses natural-language student search queries into structured intent,
 * extracting category, skills, location, work mode, and generating targeted web search queries.
 * Unspecified parameters remain undefined / unknown.
 */
export function parseSearchIntent(rawQuery: string): ParsedSearchIntent {
  const clean = rawQuery.trim();
  const lower = clean.toLowerCase();

  // 1. Category extraction
  let category: OpportunityCategory | undefined;
  if (/\b(hackathons?|codeathons?|challenges?|datathons?)\b/i.test(lower)) {
    category = "Hackathon";
  } else if (/\b(fellowships?|fellows?|scholarships?)\b/i.test(lower)) {
    category = "Fellowship";
  } else if (/\b(research\s+(?:interns?|internships?|assistants?|lab)|research|lab\s+interns?)\b/i.test(lower)) {
    category = "Research";
  } else if (/\b(intern|internship|trainee|apprentice|co-op)\b/i.test(lower)) {
    category = "Internship";
  } else if (/\b(new\s*grad|entry\s*level|associate|fresher|junior)\b/i.test(lower)) {
    category = "Entry-level";
  }

  // 2. Work Mode extraction
  let workMode: WorkMode | undefined;
  if (/\b(remote|work\s+from\s+home|wfh|telecommute|virtual)\b/i.test(lower)) {
    workMode = "Remote";
  } else if (/\b(hybrid|flexible\s+office)\b/i.test(lower)) {
    workMode = "Hybrid";
  } else if (/\b(on-site|onsite|in-office|in\s+person|work\s+from\s+office)\b/i.test(lower)) {
    workMode = "On-site";
  }

  // 3. Location extraction
  let location: string | undefined;
  let locationScope: "CITY" | "REGION" | "COUNTRY" | "GLOBAL" | undefined;
  let matchedLocationTokens: string[] = [];

  for (const entry of KNOWN_LOCATIONS) {
    if (entry.pattern.test(clean)) {
      location = entry.canonical;
      locationScope = entry.scope;
      matchedLocationTokens = entry.stripTokens;
      break;
    }
  }

  // 4. Skills extraction
  const skills: string[] = [];
  for (const skill of COMMON_SKILLS) {
    const sLower = skill.toLowerCase();
    if (sLower === "c++") {
      if (/\bc\+\+\b/i.test(clean)) skills.push(skill);
    } else if (sLower === "go") {
      if (/\bgolang\b|\bgo\s+developer\b/i.test(clean)) skills.push(skill);
    } else if (sLower === "ai/ml") {
      if (/\b(ai\/ml|ai|ml|machine\s+learning)\b/i.test(lower)) {
        if (!skills.includes("AI/ML")) skills.push("AI/ML");
        if (!skills.includes("Machine Learning")) skills.push("Machine Learning");
      }
    } else if (new RegExp(`\\b${sLower}\\b`, "i").test(lower)) {
      if (!skills.includes(skill)) skills.push(skill);
    }
  }

  // 5. Academic Year / Level extraction
  let academicYear: string | undefined;
  let graduationYear: number | undefined;
  if (/\b(1st|first)[\s-]*(?:year|yr)\b/i.test(lower)) {
    academicYear = "1st Year";
  } else if (/\b(2nd|second)[\s-]*(?:year|yr)\b/i.test(lower)) {
    academicYear = "2nd Year";
  } else if (/\b(3rd|third)[\s-]*(?:year|yr)\b/i.test(lower)) {
    academicYear = "3rd Year";
  } else if (/\b(4th|fourth|final)[\s-]*(?:year|yr)\b/i.test(lower)) {
    academicYear = "Final Year";
  } else if (/\b(undergrad|undergraduate|b\.?tech|b\.?e\.?|b\.?s\.?)\b/i.test(lower)) {
    academicYear = "Undergraduate";
  } else if (/\b(grad|graduate|master'?s|m\.?tech|m\.?s\.?|phd)\b/i.test(lower)) {
    academicYear = "Graduate";
  }

  const gradMatch = lower.match(/\b(202[4-9]|2030)\b/);
  if (gradMatch) {
    graduationYear = parseInt(gradMatch[1], 10);
  }

  // 6. Compensation Preference
  let compensationPreference: "PAID_ONLY" | "ANY" | undefined;
  if (/\b(paid|stipend|high\s+paying|salary)\b/i.test(lower)) {
    compensationPreference = "PAID_ONLY";
  }

  // 7. Experience Level
  let experienceLevel: "NO_EXPERIENCE" | "EARLY_CAREER" | "ANY" | undefined;
  if (/\b(no\s+prior\s+experience|no\s+experience|beginner|fresher)\b/i.test(lower)) {
    experienceLevel = "NO_EXPERIENCE";
  } else if (/\b(early\s*career|entry\s*level|junior)\b/i.test(lower)) {
    experienceLevel = "EARLY_CAREER";
  }

  // 8. Deadline Requirement
  let deadlineRequirement: string | undefined;
  if (/\b(this\s+month|upcoming|closing\s+soon|open\s+now|accepting\s+registrations)\b/i.test(lower)) {
    deadlineRequirement = "Active / Closing Soon";
  }

  // 9. Role Title synthesis
  let roleTitle: string | undefined;
  if (category === "Hackathon") {
    roleTitle = "Student Hackathon";
  } else if (skills.includes("AI/ML") && category === "Research") {
    roleTitle = "AI/ML Research Intern";
  } else if (skills.includes("Python") && (category === "Internship" || !category)) {
    roleTitle = "Python Engineering Intern";
  } else if (lower.includes("data analyst") || lower.includes("data analytics")) {
    roleTitle = "Data Analyst Intern";
  } else if (lower.includes("software engineering") || lower.includes("software engineer")) {
    roleTitle = "Software Engineering Intern";
  } else if (category === "Fellowship") {
    roleTitle = "Research Fellow";
  } else if (category === "Internship") {
    roleTitle = skills.length > 0 ? `${skills[0]} Intern` : "Software Engineering Intern";
  }

  // 10. Generate Tavily search queries (focused, high precision)
  const tavilySearchQueries: string[] = [];

  const rolePart = roleTitle || clean.replace(/\b(for|in|with|of|the|and|a|an)\b/gi, " ").trim();
  const locPart =
    location && location !== "Remote" && location !== "International" && location !== "Global"
      ? location.split(",")[0]
      : "";
  const modePart = workMode === "Remote" ? "remote" : "";
  const categoryPart = category ? category.toLowerCase() : "internship";

  // Query variant A: Target role + location/mode + hiring/apply
  const queryPartsA = [
    skills.slice(0, 2).join(" "),
    rolePart,
    modePart,
    locPart,
    "apply 2025 2026",
  ].filter(Boolean);
  tavilySearchQueries.push(Array.from(new Set(queryPartsA.join(" ").split(/\s+/))).join(" "));

  // Query variant B: Targeted opportunities listing
  const queryPartsB = [
    categoryPart,
    skills.slice(0, 2).join(" "),
    modePart,
    locPart,
    "careers student hiring 2025",
  ].filter(Boolean);
  tavilySearchQueries.push(Array.from(new Set(queryPartsB.join(" ").split(/\s+/))).join(" "));

  return {
    rawQuery: clean,
    category,
    roleTitle,
    skills,
    location,
    locationScope,
    matchedLocationTokens,
    workMode,
    academicYear,
    graduationYear,
    compensationPreference,
    experienceLevel,
    deadlineRequirement,
    tavilySearchQueries: Array.from(new Set(tavilySearchQueries)),
  };
}

const REGION_TO_CITIES: Record<string, string[]> = {
  "delhi ncr, india": ["delhi", "new delhi", "gurugram", "gurgaon", "noida", "faridabad", "ghaziabad", "ncr"],
  "karnataka, india": ["karnataka", "bengaluru", "bangalore", "mysuru", "mysore", "mangalore", "hubli"],
  "maharashtra, india": ["maharashtra", "mumbai", "pune", "nagpur", "thane", "navi mumbai", "nashik"],
  "telangana, india": ["telangana", "hyderabad", "secunderabad", "warangal"],
  "tamil nadu, india": ["tamil nadu", "chennai", "coimbatore", "madurai", "trichy"],
  "haryana, india": ["haryana", "gurugram", "gurgaon", "faridabad", "panchkula", "karnal"],
  "uttar pradesh, india": ["uttar pradesh", "noida", "greater noida", "ghaziabad", "lucknow", "kanpur"],
  "kerala, india": ["kerala", "kochi", "cochin", "trivandrum", "thiruvananthapuram"],
  "gujarat, india": ["gujarat", "ahmedabad", "gandhinagar", "surat", "vadodara"],
  "rajasthan, india": ["rajasthan", "jaipur", "udaipur", "jodhpur"],
  "west bengal, india": ["west bengal", "kolkata", "calcutta"],
  "california, united states": ["california", "san francisco", "sf", "bay area", "palo alto", "mountain view", "san jose", "los angeles", "san diego", "sunnyvale"],
  "texas, united states": ["texas", "austin", "dallas", "houston", "san antonio"],
  "ontario, canada": ["ontario", "toronto", "waterloo", "ottawa", "mississauga"],
  europe: ["europe", "emea", "germany", "berlin", "munich", "united kingdom", "london", "ireland", "dublin", "france", "paris", "netherlands", "amsterdam", "poland", "warsaw", "spain", "madrid", "barcelona", "portugal", "sweden", "stockholm"],
};

/**
 * Checks whether an opportunity matches a user's explicitly prompted city, state, country, or global scope.
 * Never locks a user out when they explicitly ask for another city, state, country, or global remote.
 */
export function doesOpportunityMatchRequestedDestination(
  oppLocation: string,
  workMode: string,
  requestedDest: string,
  scope?: "CITY" | "REGION" | "COUNTRY" | "GLOBAL"
): boolean {
  if (!requestedDest || scope === "GLOBAL" || requestedDest.toLowerCase() === "global" || requestedDest.toLowerCase() === "international") {
    return true;
  }

  const destLower = requestedDest.toLowerCase().trim();
  const oppLower = (oppLocation || "").toLowerCase();

  // Country-level match (e.g., "India", "United States", "United Kingdom", "Canada")
  const destCountry = inferCountryFromLocation(requestedDest);
  const oppCountry = inferCountryFromLocation(oppLocation);

  if (scope === "COUNTRY") {
    if (destCountry && oppCountry && destCountry === oppCountry) return true;
    // Direct token match
    return oppLower.includes(destLower);
  }

  // Region / State match (e.g., "Karnataka, India", "California, United States", "Europe")
  if (scope === "REGION") {
    const regionCities = REGION_TO_CITIES[destLower] || [];
    if (regionCities.some((c) => oppLower.includes(c))) return true;
    const regionHead = destLower.split(",")[0].trim();
    if (oppLower.includes(regionHead)) return true;
    return false;
  }

  // City match (e.g., "Bengaluru, India", "London, United Kingdom")
  const primaryCity = destLower.split(",")[0].trim();
  if (doesOpportunityMatchCity(oppLocation, primaryCity)) return true;
  if (oppLower.includes(primaryCity)) return true;

  // Also allow same-country explicitly remote postings only if user searched e.g. "Remote" + "India"
  // For city searches like "Bengaluru", prioritize exact city / metro match unless none match
  void workMode;
  return false;
}

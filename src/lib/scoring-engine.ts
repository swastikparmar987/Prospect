import { Opportunity, UserProfile, EvaluationResult, ScoreBreakdown, RecommendationAction, SkillGapIntelligenceItem } from "@/types";
import { evaluateEligibility, classifyOpportunitySeniority, SeniorityClassification } from "./eligibility-engine";
import {
  computeCosineSimilarity,
  computeLexicalBM25Similarity,
  generateCandidateEmbedding,
  generateOpportunityEmbedding,
} from "./ai/semantic-embeddings";
import { buildDeterministicSkillGapItem } from "./ai/job-intelligence";
import {
  doesOpportunityMatchCity,
  enrichOpportunityWithLocationIntelligence,
  inferCountryFromLocation,
  isOpportunityWithinUserVicinity,
} from "./location-intelligence";

export { classifyOpportunitySeniority, type SeniorityClassification };

export const SCORING_ENGINE_VERSION = 2;

export type JobDomain =
  | "ML_AI"
  | "DATA_SCIENCE"
  | "SOFTWARE_ENG"
  | "HARDWARE_EMBEDDED"
  | "RESEARCH"
  | "PRODUCT_DESIGN"
  | "FINANCE_ACCOUNTING"
  | "SALES_GTM"
  | "HR_RECRUITING"
  | "LEGAL_POLICY"
  | "OPERATIONS_SUPPORT"
  | "GENERAL";

const NON_TECHNICAL_DOMAINS = new Set<JobDomain>([
  "FINANCE_ACCOUNTING",
  "SALES_GTM",
  "HR_RECRUITING",
  "LEGAL_POLICY",
  "OPERATIONS_SUPPORT",
]);

export function classifyJobDomain(opp: Partial<Opportunity>): JobDomain {
  const title = (opp.title || "").toLowerCase();
  const family = (opp.roleFamily || "").toLowerCase();
  const titleAndFamily = `${title} ${family}`;

  // Technical & research engineering classifications checked against title first so
  // "Quantitative Research Engineer" or "ML Infrastructure Engineer, Stripe Tax" stay engineering!
  if (
    /\b(machine learning|deep learning|\bml\b|\bai\b|artificial intelligence|llm|nlp|computer vision|pre-?training|applied scientist|research scientist|research engineer)\b/i.test(
      title
    )
  ) {
    return "ML_AI";
  }
  if (
    /\b(embedded|firmware|hardware|fpga|asic|silicon|vlsi|robotics|mechatronics|control systems)\b/i.test(
      title
    )
  ) {
    return "HARDWARE_EMBEDDED";
  }
  if (
    /\b(software|backend|frontend|full[\s-]?stack|systems|infrastructure|platform|cloud|devops|sre|mobile|android|ios|web developer|security engineer|kernel|compiler|developer)\b/i.test(
      title
    )
  ) {
    return "SOFTWARE_ENG";
  }
  if (
    /\b(data scientist|data engineer|analytics engineer|business intelligence)\b/i.test(
      title
    )
  ) {
    return "DATA_SCIENCE";
  }
  if (/\b(research fellow|undergraduate research|research assistant|postdoc)\b/i.test(title)) {
    return "RESEARCH";
  }
  if (/\b(product designer|ux designer|ui designer|product design|product manager)\b/i.test(title)) {
    return "PRODUCT_DESIGN";
  }

  // Non-technical business functions
  if (
    /\b(finance|financial|corporate finance|accounting|tax|audit|payroll|treasury|controller|fp&a|billing|collections|investor relations|procurement|sourcing|purchasing|economist|economics)\b/i.test(
      titleAndFamily
    )
  ) {
    return "FINANCE_ACCOUNTING";
  }
  if (
    /\b(account executive|account manager|sales|sdr|bdr|business development|partnerships|customer success|deal desk|solutions consultant|revenue|commercial|marketing|brand manager|copywriter|content strategist|business partner|strategy & operations|gtm strategy)\b/i.test(
      titleAndFamily
    )
  ) {
    return "SALES_GTM";
  }
  if (
    /\b(customer support|product support|technical support|support specialist|operations specialist|trust & safety specialist|community manager|executive assistant|office manager|workplace|facilities|coordinator|logistics)\b/i.test(
      titleAndFamily
    )
  ) {
    return "OPERATIONS_SUPPORT";
  }
  if (
    /\b(recruiter|recruiting|talent acquisition|sourcer|people partner|hr\b|human resources|workplace)\b/i.test(
      titleAndFamily
    )
  ) {
    return "HR_RECRUITING";
  }
  if (
    /\b(legal|counsel|attorney|paralegal|compliance|public policy|government affairs|communications|PR|media relations|risk management|fraud operations)\b/i.test(
      titleAndFamily
    )
  ) {
    return "LEGAL_POLICY";
  }
  if (/\bdata\s+analyst\b/i.test(title)) {
    return "DATA_SCIENCE";
  }

  return "GENERAL";
}

export function classifyCandidateDomains(profile: UserProfile | null): Set<JobDomain> {
  const domains = new Set<JobDomain>();
  if (!profile) return domains;

  const text = [
    profile.headline || "",
    profile.major || "",
    ...(profile.targetRoles || []),
    ...(profile.careerDirections || []),
    ...(profile.skills || []),
  ]
    .join(" ")
    .toLowerCase();

  if (/\b(machine learning|deep learning|\bml\b|\bai\b|pytorch|tensorflow|nlp|llm|computer vision|transformers)\b/i.test(text)) {
    domains.add("ML_AI");
  }
  if (/\b(data scien|data analy|analytics|pandas|scikit|statistics|tableau)\b/i.test(text)) {
    domains.add("DATA_SCIENCE");
  }
  if (/\b(software|computer science|backend|frontend|full[\s-]?stack|systems|typescript|react|node\.js|fastapi|django|go|java)\b/i.test(text)) {
    domains.add("SOFTWARE_ENG");
  }
  if (/\b(embedded|firmware|electronics|ece|verilog|rtos|arm|robotics|hardware)\b/i.test(text)) {
    domains.add("HARDWARE_EMBEDDED");
  }
  if (/\b(research|fellowship|thesis|publications)\b/i.test(text)) {
    domains.add("RESEARCH");
  }
  if (/\b(product design|ux|ui|figma|product management)\b/i.test(text)) {
    domains.add("PRODUCT_DESIGN");
  }
  if (/\b(finance|accounting|audit|tax|fp&a|investment banking)\b/i.test(text)) {
    domains.add("FINANCE_ACCOUNTING");
  }
  if (/\b(sales|marketing|account executive|growth|business development)\b/i.test(text)) {
    domains.add("SALES_GTM");
  }

  return domains;
}

export function computeRoleDomainAlignment(
  opp: Partial<Opportunity>,
  profile: UserProfile | null
): {
  jobDomain: JobDomain;
  verdict: "DIRECT_DOMAIN" | "ADJACENT_DOMAIN" | "DOMAIN_MISMATCH" | "GENERAL";
  factor: number;
  reason?: string;
} {
  const jobDomain = classifyJobDomain(opp);
  const candDomains = classifyCandidateDomains(profile);

  if (!profile || candDomains.size === 0 || jobDomain === "GENERAL") {
    return { jobDomain, verdict: "GENERAL", factor: 0.9 };
  }

  if (candDomains.has(jobDomain)) {
    return { jobDomain, verdict: "DIRECT_DOMAIN", factor: 1.0 };
  }

  // Non-technical role (Finance / Sales / HR / Legal) evaluated against a purely technical/engineering profile
  if (NON_TECHNICAL_DOMAINS.has(jobDomain) && !candDomains.has(jobDomain)) {
    return {
      jobDomain,
      verdict: "DOMAIN_MISMATCH",
      factor: 0.25,
      reason: `Role domain mismatch: "${opp.title}" targets ${jobDomain.replace("_", " / ")}, outside your target career domain.`,
    };
  }

  // Technical cross-specialization adjacency (e.g. ML_AI <-> SOFTWARE_ENG <-> DATA_SCIENCE <-> RESEARCH)
  const techCluster = new Set<JobDomain>(["ML_AI", "DATA_SCIENCE", "SOFTWARE_ENG", "RESEARCH"]);
  const hasTechCandidate = Array.from(candDomains).some((d) => techCluster.has(d));
  if (hasTechCandidate && techCluster.has(jobDomain)) {
    return { jobDomain, verdict: "ADJACENT_DOMAIN", factor: 0.88 };
  }

  // Electronics/Embedded vs Software/Data
  if (candDomains.has("HARDWARE_EMBEDDED") && jobDomain === "SOFTWARE_ENG") {
    return { jobDomain, verdict: "ADJACENT_DOMAIN", factor: 0.72 };
  }

  return { jobDomain, verdict: "ADJACENT_DOMAIN", factor: 0.78 };
}

export interface DecisionConfig {
  weights: {
    eligibility: number;  // Default: 35
    skills: number;       // Default: 30
    quality: number;      // Default: 15
    preferences: number;  // Default: 10
    deadline: number;     // Default: 10
  };
  thresholds: {
    applyNowMinScore: number;     // 75
    prepareFirstMinScore: number; // 50
    skipMaxScore: number;         // 39
    urgentDeadlineDays: number;   // 3 (less than 3 days may require caution or rush)
    futureDeadlineDays: number;   // 60 (keep watching if deadline is far away)
  };
}

export const DEFAULT_CONFIG: DecisionConfig = {
  weights: {
    eligibility: 35,
    skills: 30,
    quality: 15,
    preferences: 10,
    deadline: 10,
  },
  thresholds: {
    applyNowMinScore: 75,
    prepareFirstMinScore: 50,
    skipMaxScore: 39,
    urgentDeadlineDays: 3,
    futureDeadlineDays: 60,
  },
};

/**
 * Calculates a transparent, multi-component fit score (0-100) and produces
 * a structured four-way decision: APPLY_NOW, PREPARE_FIRST, KEEP_WATCHING, or SKIP.
 *
 * CRITICAL PRINCIPLE: Hard blockers ALWAYS override the numeric score!
 */
export function evaluateOpportunity(
  opportunity: Opportunity,
  profile: UserProfile | null,
  config: DecisionConfig = DEFAULT_CONFIG
): EvaluationResult {
  const uncertainties: string[] = [];
  const enrichedOpportunity = profile?.locationPreference
    ? enrichOpportunityWithLocationIntelligence(opportunity, profile.locationPreference)
    : opportunity;
  const { checks, hardBlockers, classifiedSeniority } = evaluateEligibility(enrichedOpportunity, profile);
  const domainInfo = computeRoleDomainAlignment(enrichedOpportunity, profile);
  if (domainInfo.verdict === "DOMAIN_MISMATCH" && domainInfo.reason) {
    uncertainties.push(domainInfo.reason);
  }

  // 1. Eligibility Component (Max 35 points)
  let eligibilityScore = 0;
  if (checks.length === 0) {
    // Realistic baseline when eligibility requirements are omitted — avoids artificial 87% inflation
    eligibilityScore = Math.round(config.weights.eligibility * 0.66 * 10) / 10;
    if (
      classifiedSeniority.level === "INTERN" ||
      classifiedSeniority.level === "NEW_GRAD" ||
      classifiedSeniority.level === "STUDENT"
    ) {
      eligibilityScore = Math.min(config.weights.eligibility, eligibilityScore + 3.5);
    }
    uncertainties.push("Listing does not list strict eligibility requirements; check formal job posting.");
  } else {
    const metCount = checks.filter((c) => c.status === "MET").length;
    const unknownCount = checks.filter((c) => c.status === "UNKNOWN").length;
    const notMetCount = checks.filter((c) => c.status === "NOT MET").length;

    if (notMetCount > 0 && hardBlockers.length > 0) {
      // Direct hard blocker
      eligibilityScore = 0;
    } else if (metCount === 0 && notMetCount === 0 && unknownCount > 0) {
      // Purely unstructured eligibility bullets (e.g. from web scrapers/RSS feeds) without any failed check
      eligibilityScore = Math.round(0.65 * config.weights.eligibility * 10) / 10;
    } else {
      // Fraction of met requirements + partial for unknown
      const effectivePassRate = (metCount + unknownCount * 0.45) / checks.length;
      eligibilityScore = Math.round(effectivePassRate * config.weights.eligibility * 10) / 10;
    }

    if (unknownCount > 0) {
      uncertainties.push(`${unknownCount} eligibility requirement(s) have UNKNOWN status due to missing profile data.`);
    }
  }

  // 2. Hybrid RAG Retrieval (128-D Semantic + BM25 Lexical + Skills & Domain Alignment) (Max 30 points)
  let skillsScore = 0;
  const userSkills = new Set((profile?.skills || []).map((s) => s.toLowerCase().trim()));
  const userExperiences = profile?.experiences || [];
  const userProjects = profile?.projects || [];

  const candVec = profile
    ? profile.embedding && profile.embedding.length > 0
      ? profile.embedding
      : generateCandidateEmbedding(profile)
    : [];
  const oppVec =
    enrichedOpportunity.embedding && enrichedOpportunity.embedding.length > 0
      ? enrichedOpportunity.embedding
      : generateOpportunityEmbedding(enrichedOpportunity);
  const rawCosineSimilarity = profile ? computeCosineSimilarity(candVec, oppVec) : 0;
  const semanticComponent = Math.round(rawCosineSimilarity * 20 * 10) / 10;

  // Combine words and tags from profile experiences & projects
  const profileCorpus = [
    profile?.headline || "",
    ...(profile?.targetRoles || []),
    ...(profile?.skills || []),
    ...userExperiences.flatMap((e) => [e.title, e.company, ...e.bullets]),
    ...userProjects.flatMap((p) => [p.name, p.description, ...(p.techStack || [])]),
  ].join(" ").toLowerCase();

  const oppFullText = `${enrichedOpportunity.title} ${enrichedOpportunity.roleFamily || ""} ${(enrichedOpportunity.requiredSkills || []).join(" ")} ${(enrichedOpportunity.preferredSkills || []).join(" ")} ${enrichedOpportunity.description}`;
  const bm25Score = profile
    ? computeLexicalBM25Similarity(profileCorpus, oppFullText, [
        ...(profile.skills || []),
        ...(profile.targetRoles || []),
      ])
    : 0;

  const allReqSkills = enrichedOpportunity.requiredSkills || [];
  const allPrefSkills = enrichedOpportunity.preferredSkills || [];
  const positiveEvidence: string[] = [];
  const missingQualifications: string[] = [];
  const skillGapAnalysis: SkillGapIntelligenceItem[] = [];

  if (rawCosineSimilarity >= 0.35 && domainInfo.verdict !== "DOMAIN_MISMATCH") {
    positiveEvidence.push(
      `Hybrid RAG similarity: ${Math.round(rawCosineSimilarity * 100)}% semantic • ${Math.round(bm25Score * 100)}% BM25`
    );
  }

  if (allReqSkills.length === 0 && allPrefSkills.length === 0) {
    const oppCorpus = oppFullText.toLowerCase();
    const matchedProfileSkills = (profile?.skills || []).filter((s) => {
      const sLow = s.toLowerCase().trim();
      if (!sLow) return false;
      if (sLow.length <= 2) {
        return new RegExp(`\\b${sLow.replace(/[+]/g, "\\+")}\\b`, "i").test(oppCorpus);
      }
      return oppCorpus.includes(sLow);
    });
    const matchedTargetRoles = (profile?.targetRoles || []).filter((r) =>
      oppCorpus.includes(r.toLowerCase())
    );
    const skillCoverageRatio = Math.min(1, matchedProfileSkills.length / Math.max(4, Math.min(8, (profile?.skills || []).length || 4)));
    const targetBonus = matchedTargetRoles.length > 0 ? 0.2 : 0;

    if (!profile) {
      skillsScore = config.weights.skills * 0.45;
    } else {
      // Granular calibrated blend instead of a flat 85% bucket
      const rawBlend = Math.min(
        0.96,
        skillCoverageRatio * 0.36 +
          rawCosineSimilarity * 0.34 +
          bm25Score * 0.25 +
          targetBonus
      );
      const hasAnySurfaceSignal =
        matchedProfileSkills.length > 0 || matchedTargetRoles.length > 0;
      const surfaceCap = hasAnySurfaceSignal ? 1.0 : 0.45;
      const calibratedFactor = rawBlend * domainInfo.factor * surfaceCap;
      skillsScore = Math.round(config.weights.skills * calibratedFactor * 10) / 10;

      if (domainInfo.verdict === "DOMAIN_MISMATCH") {
        missingQualifications.push(`Role domain (${domainInfo.jobDomain.replace("_", "/")}) does not match your technical target roles`);
      } else if (matchedProfileSkills.length > 0 || matchedTargetRoles.length > 0) {
        positiveEvidence.push(
          `Matched profile skills in listing: ${matchedProfileSkills.slice(0, 4).join(", ") || matchedTargetRoles.join(", ")}`
        );
      } else if (skillsScore < 12) {
        missingQualifications.push("Listing lacks strong overlap with your core technical skills or target roles");
      }
    }
    uncertainties.push("Opportunity does not itemize structured required skills; evaluated via Hybrid RAG (semantic + BM25) and domain classifier.");
  } else {
    let reqMatches = 0;
    const matchedReqNames: string[] = [];
    for (const skill of allReqSkills) {
      const sLower = skill.toLowerCase();
      if (userSkills.has(sLower) || profileCorpus.includes(sLower)) {
        reqMatches++;
        matchedReqNames.push(skill);
      } else {
        missingQualifications.push(skill);
        skillGapAnalysis.push(
          buildDeterministicSkillGapItem(
            skill,
            "CRITICAL",
            opportunity.title,
            opportunity.organization
          )
        );
      }
    }

    let prefMatches = 0;
    const matchedPrefNames: string[] = [];
    for (const skill of allPrefSkills) {
      const sLower = skill.toLowerCase();
      if (userSkills.has(sLower) || profileCorpus.includes(sLower)) {
        prefMatches++;
        matchedPrefNames.push(skill);
      } else if (skillGapAnalysis.length < 5) {
        skillGapAnalysis.push(
          buildDeterministicSkillGapItem(
            skill,
            "PREFERRED",
            opportunity.title,
            opportunity.organization
          )
        );
      }
    }

    if (matchedReqNames.length > 0) {
      positiveEvidence.push(
        `Matched required skills: ${matchedReqNames.join(", ")}`
      );
    }
    if (matchedPrefNames.length > 0) {
      positiveEvidence.push(
        `Matched preferred skills: ${matchedPrefNames.join(", ")}`
      );
    }

    const reqWeight = config.weights.skills * 0.8;
    const prefWeight = config.weights.skills * 0.2;

    const reqFraction = allReqSkills.length > 0 ? reqMatches / allReqSkills.length : 1;
    const prefFraction = allPrefSkills.length > 0 ? prefMatches / allPrefSkills.length : 1;

    const exactSkillScore = reqFraction * reqWeight + prefFraction * prefWeight;
    // Blend semantic tie-breaker while keeping missing-required-skill ceiling (<18 when reqFraction < 0.6) intact
    const semanticTieBreaker =
      reqFraction >= 0.75
        ? Math.min(2.5, (rawCosineSimilarity * 0.65 + bm25Score * 0.35) * 2.5)
        : reqFraction > 0
          ? Math.min(1.5, (rawCosineSimilarity * 0.65 + bm25Score * 0.35) * 1.5)
          : 0;
    const rawSkillsScore = exactSkillScore + semanticTieBreaker;
    const adjustedSkills =
      domainInfo.verdict === "DOMAIN_MISMATCH"
        ? rawSkillsScore * 0.35
        : rawSkillsScore * (0.85 + domainInfo.factor * 0.15);
    skillsScore = Math.min(
      config.weights.skills,
      Math.round(adjustedSkills * 10) / 10
    );
  }

  // Highlight supporting projects in positiveEvidence
  for (const proj of userProjects) {
    const projStackLower = (proj.techStack || []).map((t) => t.toLowerCase());
    const overlap = allReqSkills.filter((rs) =>
      projStackLower.includes(rs.toLowerCase()) ||
      (proj.description || "").toLowerCase().includes(rs.toLowerCase())
    );
    if (overlap.length > 0) {
      positiveEvidence.push(
        `Project "${proj.name}" demonstrates ${overlap.join(", ")}`
      );
    }
  }

  // 3. Opportunity Quality & Source Evidence (Max 15 points)
  let qualityScore = 0;
  switch (opportunity.verificationStatus) {
    case "VERIFIED_SOURCE":
      qualityScore = 15;
      break;
    case "PARTIALLY_CHECKED":
      qualityScore = 11;
      uncertainties.push("Listing is partially checked against public source snippet.");
      break;
    case "DEMO_DATA":
      qualityScore = 12; // Synthetic quality baseline for demo testing
      break;
    case "STALE":
      qualityScore = 4;
      uncertainties.push("Source information has not been updated recently or appears stale.");
      break;
    case "UNVERIFIABLE":
    default:
      qualityScore = 2;
      uncertainties.push("Source URL or origin claims could not be verified.");
      break;
  }
  // Modulate slightly by sourceConfidence (0.0 to 1.0)
  qualityScore = Math.round(qualityScore * Math.max(0.4, opportunity.sourceConfidence) * 10) / 10;

  // 4. User Preference Compatibility, Vicinity Proximity & Freshness
  let preferencesScore = 0;
  let proximityAdjustment = 0;
  let freshnessBoost = 0;

  // Freshness boost (0 to +3 for recently posted/ingested roles)
  const timestampStr = enrichedOpportunity.publishedAt || enrichedOpportunity.discoveredAt;
  if (timestampStr) {
    const parsedTime = new Date(timestampStr).getTime();
    if (!isNaN(parsedTime)) {
      const ageHours = (Date.now() - parsedTime) / (1000 * 60 * 60);
      if (ageHours >= 0 && ageHours <= 48) {
        freshnessBoost = 3;
      } else if (ageHours <= 168) {
        freshnessBoost = 2;
      } else if (ageHours <= 336) {
        freshnessBoost = 1;
      }
    }
  }

  if (!profile) {
    preferencesScore = config.weights.preferences * 0.5;
  } else {
    let prefPoints = 0;

    // Work Mode preference
    if (
      profile.preferredWorkModes.length === 0 ||
      profile.preferredWorkModes.includes(enrichedOpportunity.workMode) ||
      profile.preferredWorkModes.includes("Flexible")
    ) {
      prefPoints += 3;
    }

    // Role category preference
    const targetRolesLower = profile.targetRoles.map((r) => r.toLowerCase());
    const matchesTargetRole =
      targetRolesLower.length === 0 ||
      targetRolesLower.some(
        (tr) =>
          enrichedOpportunity.title.toLowerCase().includes(tr) ||
          enrichedOpportunity.category.toLowerCase().includes(tr) ||
          tr.includes(enrichedOpportunity.category.toLowerCase())
      );
    if (matchesTargetRole && domainInfo.verdict !== "DOMAIN_MISMATCH") {
      prefPoints += 3;
    }

    // Compensation preference
    if (enrichedOpportunity.compensation && enrichedOpportunity.compensation !== "Unpaid") {
      prefPoints += 1;
    } else if (enrichedOpportunity.compensation === "Unpaid") {
      if (profile.stipendPreference === "Paid Only") {
        prefPoints -= 2;
      }
    }

    // Location, Vicinity & Country Compatibility
    const userCity =
      profile.locationPreference?.city ||
      profile.location ||
      "";
    const userCountry =
      profile.locationPreference?.country ||
      inferCountryFromLocation(userCity || profile.location);
    const oppCountry = inferCountryFromLocation(enrichedOpportunity.location);

    const vicinity = isOpportunityWithinUserVicinity(
      enrichedOpportunity,
      profile.locationPreference,
      profile.preferredLocations
    );

    const matchesDetectedCity =
      Boolean(userCity) && doesOpportunityMatchCity(enrichedOpportunity.location, userCity);
    const matchesPreferredLoc = (profile.preferredLocations || []).some((loc) =>
      doesOpportunityMatchCity(enrichedOpportunity.location, loc)
    );

    if (matchesDetectedCity || (vicinity.isLocal && !vicinity.isSameCountryRemote)) {
      prefPoints += 3;
      proximityAdjustment = 4;
      positiveEvidence.push(
        enrichedOpportunity.distanceKm != null
          ? `Nearby vicinity (~${enrichedOpportunity.distanceKm} km from ${userCity || "you"})`
          : `Matches your location (${userCity || enrichedOpportunity.location})`
      );
    } else if (matchesPreferredLoc) {
      prefPoints += 2.5;
      proximityAdjustment = 3;
      positiveEvidence.push(`Matches preferred hub (${enrichedOpportunity.location})`);
    } else if (vicinity.isSameCountryRemote) {
      prefPoints += 2;
      proximityAdjustment = 2;
      positiveEvidence.push(vicinity.reason);
    } else if (
      userCountry &&
      oppCountry &&
      oppCountry.toLowerCase() !== userCountry.toLowerCase() &&
      enrichedOpportunity.workMode !== "Remote"
    ) {
      // International on-site/hybrid role outside candidate's country/vicinity
      proximityAdjustment = -15;
      const distStr =
        enrichedOpportunity.distanceKm != null
          ? ` (~${enrichedOpportunity.distanceKm.toLocaleString()} km away)`
          : "";
      uncertainties.push(
        `Outside your vicinity: on-site/hybrid role in ${oppCountry}${distStr}, while your profile is based in ${userCountry}.`
      );
    } else if (
      enrichedOpportunity.distanceKm != null &&
      enrichedOpportunity.distanceKm > (profile.locationPreference?.nearbyRadiusKm || 80)
    ) {
      proximityAdjustment = -4;
      uncertainties.push(
        `Relocation or long commute (~${enrichedOpportunity.distanceKm} km from ${userCity}).`
      );
    }

    preferencesScore = Math.max(0, Math.min(config.weights.preferences, prefPoints));
  }

  // 5. Deadline Feasibility (Max 10 points)
  let deadlineScore = 0;
  let deadlineDaysLeft: number | null = null;
  let isExpired = Boolean(opportunity.isExpired);

  if (opportunity.deadline) {
    const deadlineDate = new Date(opportunity.deadline);
    const now = new Date();
    const diffMs = deadlineDate.getTime() - now.getTime();
    deadlineDaysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (deadlineDaysLeft < 0) {
      isExpired = true;
      deadlineScore = 0;
      uncertainties.push(`Stated deadline passed on ${deadlineDate.toLocaleDateString()}.`);
    } else if (deadlineDaysLeft <= config.thresholds.urgentDeadlineDays) {
      deadlineScore = 4; // High urgency / tight window
      uncertainties.push(`Deadline is very close (${deadlineDaysLeft} day(s) remaining). Immediate submission required.`);
    } else if (deadlineDaysLeft <= 30) {
      deadlineScore = 10; // Sweet spot for applying
    } else if (deadlineDaysLeft <= config.thresholds.futureDeadlineDays) {
      deadlineScore = 8;
    } else {
      deadlineScore = 5; // Long lead time; application may not yet be open or reviewed soon
    }
  } else if (isExpired) {
    deadlineScore = 0;
    uncertainties.push("Opportunity is marked as closed or expired at source.");
  } else {
    // Rolling or unannounced deadline
    deadlineScore = 6;
    uncertainties.push(
      opportunity.deadlineRaw
        ? `Deadline stated as "${opportunity.deadlineRaw}". Official cutoff date unknown.`
        : "No explicit deadline specified. Rolling applications may close without notice."
    );
  }

  if (opportunity.verificationStatus === "VERIFIED_SOURCE") {
    positiveEvidence.push(`Verified source (${opportunity.sourceName})`);
  }
  if (opportunity.roleFamily) {
    positiveEvidence.push(`Role family alignment: ${opportunity.roleFamily}`);
  }

  // Calculate Overall Score (0-100) integrating Hybrid RAG + Vicinity Proximity + Freshness + Domain Penalty
  const domainPenalty = domainInfo.verdict === "DOMAIN_MISMATCH" ? -18 : 0;
  let overallScore = Math.round(
    Math.min(
      100,
      Math.max(
        0,
        eligibilityScore +
          skillsScore +
          qualityScore +
          preferencesScore +
          deadlineScore +
          proximityAdjustment +
          freshnessBoost +
          domainPenalty
      )
    )
  );

  // CRITICAL PRINCIPLE: Hard blockers ALWAYS cap strictly below SKIP threshold (<= 39).
  if (hardBlockers.length > 0) {
    eligibilityScore = 0;
    overallScore = Math.min(overallScore, config.thresholds.skipMaxScore);
  } else if (domainInfo.verdict === "DOMAIN_MISMATCH") {
    // Non-technical business/finance/sales/HR postings cannot score 75%+ for ML/SWE profiles
    overallScore = Math.min(overallScore, 42);
  }

  const scoreBreakdown: ScoreBreakdown = {
    eligibility: eligibilityScore,
    skills: skillsScore,
    semantic: semanticComponent,
    rawCosineSimilarity,
    bm25Score,
    domainAlignment: domainInfo.factor,
    proximity: proximityAdjustment,
    freshness: freshnessBoost,
    quality: qualityScore,
    preferences: preferencesScore,
    deadline: deadlineScore,
  };

  const scoringBreakdownDetails: string[] = [
    `Eligibility: ${eligibilityScore}/${config.weights.eligibility}`,
    `Hybrid RAG & Skills: ${skillsScore}/${config.weights.skills} (${Math.round(rawCosineSimilarity * 100)}% 128-D vector, ${Math.round(bm25Score * 100)}% BM25)`,
    `Domain Alignment: ${domainInfo.verdict.replace("_", " ")} (${Math.round(domainInfo.factor * 100)}%)`,
    `Vicinity Proximity: ${proximityAdjustment >= 0 ? `+${proximityAdjustment}` : proximityAdjustment} pts`,
    `Preferences & Source Quality: ${(preferencesScore + qualityScore).toFixed(1)}/25 • Freshness: +${freshnessBoost}`,
  ];

  // -------------------------------------------------------------
  // 4-WAY RECOMMENDATION DECISION POLICY
  // -------------------------------------------------------------
  let recommendation: RecommendationAction;
  let rationale = "";
  let nextAction = "";

  const hasValidLink = Boolean(
    (opportunity.applyUrl && opportunity.applyUrl.trim().length > 0) ||
    (opportunity.canonicalUrl && opportunity.canonicalUrl.trim().length > 0)
  );

  // RULE 1: Hard Blockers, Expired Listings, or Stark Domain Mismatches MUST produce SKIP
  if (hardBlockers.length > 0) {
    recommendation = "SKIP";
    rationale = `Incompatible hard requirement detected: ${hardBlockers.join("; ")}. A high technical skill fit cannot override strict seniority or eligibility criteria.`;
    nextAction = "Archive or pass on this listing to focus energy on roles where you meet all hard requirements.";
  } else if (domainInfo.verdict === "DOMAIN_MISMATCH") {
    recommendation = "SKIP";
    rationale =
      domainInfo.reason ||
      `Role domain mismatch (${domainInfo.jobDomain.replace("_", " ")}): listing targets a different discipline than your profile (${overallScore}/100).`;
    nextAction = "Skip off-domain roles and focus on postings matching your technical trajectory.";
  } else if (isExpired) {
    recommendation = "SKIP";
    rationale = `The verified deadline for this opportunity (${opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString() : "closed at source"}) has expired.`;
    nextAction = "Check employer careers site for the next application cycle or remove from active consideration.";
  } else if (opportunity.verificationStatus === "UNVERIFIABLE") {
    recommendation = "KEEP_WATCHING";
    rationale = "The opportunity source could not be verified. Proceeding with caution until official employer listing is confirmed.";
    nextAction = "Search for the direct company careers page to verify this listing exists before submitting data.";
  } else if (!hasValidLink) {
    recommendation = "KEEP_WATCHING";
    rationale = "Listing lacks a confirmed active application URL. Monitor for direct application link.";
    nextAction = "Check employer careers site directly for the active application portal.";
  } else if (deadlineDaysLeft !== null && deadlineDaysLeft > config.thresholds.futureDeadlineDays) {
    // Very distant deadline or future cycle
    recommendation = "KEEP_WATCHING";
    rationale = `Application deadline is over ${config.thresholds.futureDeadlineDays} days away (${deadlineDaysLeft} days remaining). Optimal submission window opens closer to deadline.`;
    nextAction = "Save to your Watchlist with a reminder set for 30 days prior to the deadline.";
  } else if (
    overallScore >= config.thresholds.applyNowMinScore &&
    (eligibilityScore >= 22 ||
      (checks.every((c) => c.status !== "NOT MET") &&
        missingQualifications.length === 0 &&
        skillsScore >= 20)) &&
    (allReqSkills.length === 0 || skillsScore >= 16) &&
    skillsScore >= 12 &&
    positiveEvidence.length > 0 &&
    (opportunity.verificationStatus === "VERIFIED_SOURCE" || opportunity.verificationStatus === "DEMO_DATA")
  ) {
    // APPLY NOW: Strong fit, fully eligible, confirmed evidence, actionable deadline
    recommendation = "APPLY_NOW";
    rationale = `High alignment score (${overallScore}/100) with verified eligibility and relevant profile qualifications. Deadlines are actionable and quality is confirmed.`;
    nextAction = "Open Application Preparation Studio to tailor your resume bullets and generate a tailored application draft.";
  } else if (
    overallScore >= config.thresholds.prepareFirstMinScore ||
    (allReqSkills.length > 0 && skillsScore < 18)
  ) {
    // PREPARE FIRST: Potential fit, but specific actionable gap
    recommendation = "PREPARE_FIRST";
    const missingSkills = allReqSkills.filter((s) => !userSkills.has(s.toLowerCase()));
    rationale = `Promising opportunity (${overallScore}/100), but addressing specific qualification gaps (${missingSkills.slice(0, 3).join(", ") || "targeted project evidence"}) will significantly increase your interview probability.`;
    nextAction = "Generate a Gap-to-Action Plan in the Preparation Studio to build a demonstrable portfolio proof before submitting.";
  } else if (overallScore <= config.thresholds.skipMaxScore) {
    // SKIP: Low alignment
    recommendation = "SKIP";
    rationale = `Low overall alignment (${overallScore}/100). Profile skills and preferences have low overlap with the opportunity requirements.`;
    nextAction = "Skip this opportunity to preserve application bandwidth for better matched roles.";
  } else {
    // Fallback: KEEP WATCHING
    recommendation = "KEEP_WATCHING";
    rationale = `Moderate match (${overallScore}/100) with uncertain requirements or unconfirmed posting details.`;
    nextAction = "Monitor this opportunity for updated details, recruiter outreach, or company information sessions.";
  }

  const aiMatchExplanation = [
    rationale,
    rawCosineSimilarity > 0
      ? `Semantic vector similarity: ${Math.round(rawCosineSimilarity * 100)}%.`
      : "",
    positiveEvidence.length > 0
      ? `Supporting evidence: ${positiveEvidence.slice(0, 3).join(" • ")}.`
      : "",
    missingQualifications.length > 0
      ? `Skills to prepare: ${missingQualifications.slice(0, 4).join(", ")}.`
      : "No missing required skills identified.",
  ]
    .filter(Boolean)
    .join(" ");

  return {
    opportunityId: opportunity.id,
    recommendation,
    overallScore,
    semanticScore: rawCosineSimilarity,
    domainVerdict: domainInfo.verdict,
    scoringBreakdownDetails,
    scoreBreakdown,
    hardBlockers,
    rationale,
    nextAction,
    aiMatchExplanation,
    skillGapAnalysis,
    uncertainties,
    eligibilityChecks: checks,
    positiveEvidence,
    missingQualifications,
    roleFamilyMatch: opportunity.roleFamily || opportunity.category,
    classifiedSeniority: classifiedSeniority.level,
    evaluatedAt: new Date().toISOString(),
  };
}

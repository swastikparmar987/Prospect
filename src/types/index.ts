// Canonical Type Definitions for Prospect: Career Opportunity Discovery Agent

export type OpportunityCategory = 
  | "Internship"
  | "Fellowship"
  | "Research"
  | "Hackathon"
  | "Entry-level";

export type WorkMode = "Remote" | "Hybrid" | "On-site" | "Flexible";

export type VerificationStatus = 
  | "VERIFIED_SOURCE"
  | "PARTIALLY_CHECKED"
  | "STALE"
  | "UNVERIFIABLE"
  | "DEMO_DATA";

export type RecommendationAction = 
  | "APPLY_NOW"
  | "PREPARE_FIRST"
  | "KEEP_WATCHING"
  | "SKIP";

export type SeniorityLevel =
  | "STUDENT"
  | "INTERN"
  | "EARLY_CAREER"
  | "NEW_GRAD"
  | "MID_LEVEL"
  | "SENIOR"
  | "STAFF"
  | "PRINCIPAL"
  | "MANAGER"
  | "DIRECTOR"
  | "UNKNOWN";

export type EligibilityStatus = "MET" | "NOT MET" | "UNKNOWN";

export type ApplicationStage = 
  | "SAVED"
  | "PREPARING"
  | "READY_TO_APPLY"
  | "APPLIED"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "WITHDRAWN"
  | "ARCHIVED";

export interface SourceEvidenceItem {
  claim: string;
  excerpt: string;
  url: string;
  observedAt: string;
  verified: boolean;
}

export type ProvenanceCode =
  | "RESUME_AI"
  | "RESUME_DETERMINISTIC"
  | "USER_INPUT"
  | "USER_OVERRIDE"
  | "CALCULATED"
  | "EXTERNAL_SOURCE"
  | "RESUME_DERIVED"
  | "PROFILE_ENTERED"
  | "USER_CONFIRMED"
  | "EXTERNALLY_VERIFIED";

export interface MultiSourceProvenanceRecord {
  provider: string;
  sourceName: string;
  sourceUrl: string;
  applicationUrl: string;
  fetchedAt: string;
  verificationStatus: VerificationStatus;
  snippet?: string;
}

export interface LocationPreference {
  city: string;
  region: string;
  country: string;
  displayLabel: string;
  source: "BROWSER_GPS" | "MANUAL" | "PROFILE" | "NONE";
  permissionState: "granted" | "denied" | "prompt" | "unavailable";
  cityLatitude?: number | null;
  cityLongitude?: number | null;
  nearbyRadiusKm: number;
  preferredWorkModes: WorkMode[];
  lastResolvedAt?: string | null;
  errorReason?: string | null;
}

export type LocationDiscoveryMode =
  | "ALL"
  | "VICINITY"
  | "NEAR_ME"
  | "IN_MY_CITY"
  | "REMOTE"
  | "HYBRID"
  | "ONSITE"
  | "SELECTED_CITY";

export interface StructuredJobIntelligence {
  requiredSkills: string[];
  preferredSkills: string[];
  experience: string;
  education: string;
  responsibilities: string[];
  location: string;
  employmentType: string;
  eligibility: string[];
  extractedBy: string;
  extractedAt: string;
}

export interface SkillGapIntelligenceItem {
  skill: string;
  importance: "CRITICAL" | "PREFERRED";
  whyItMatters: string;
  preparationPath: string;
  estimatedEffort: string;
  recommendedResources: Array<{
    title: string;
    url: string;
    type: "Documentation" | "Course" | "Project Guide" | "Benchmark";
  }>;
}

export interface AiMatchIntelligence {
  whyCandidateMatches: string;
  matchedSkills: string[];
  missingQualifications: string[];
  eligibilityAssessment: string;
  preparationNeeded: string;
  skillGaps: SkillGapIntelligenceItem[];
  provider: string;
  model: string;
  isAiGenerated: boolean;
  unavailableReason?: string;
}

export interface AiResumeInsights {
  responsibilities: string[];
  achievements: string[];
  careerDirections: string[];
  confidence: number;
  provider: string;
  model: string;
  extractedAt: string;
  unavailableReason?: string;
}

export interface RankingEvaluationMetrics {
  kValues: number[];
  precisionAtK: Record<number, number>;
  recallAtK: Record<number, number>;
  ndcgAtK: Record<number, number>;
  labeledFeedbackCount: number;
  positiveLabelCount: number;
  negativeLabelCount: number;
  evaluationMethod: "USER_FEEDBACK_LABELS" | "HYBRID_RELEVANCE_BENCHMARK";
  modelFramingNote: string;
}

export type LiveDiscoveryEventStage =
  | "PROFILE_LOADED"
  | "CAPABILITIES_EXTRACTED"
  | "LOCATION_RESOLVED"
  | "ROLE_FAMILIES_GENERATED"
  | "QUERIES_PLANNED"
  | "PROVIDERS_CONTACTED"
  | "RESULTS_RETRIEVED"
  | "DUPLICATES_REMOVED"
  | "ELIGIBILITY_CHECKED"
  | "OPPORTUNITIES_RANKED"
  | "SEARCH_EXPANDED"
  | "SEARCH_COMPLETED";

export interface LiveDiscoveryEvent {
  id: string;
  stage: LiveDiscoveryEventStage;
  label: string;
  detail: string;
  provider?: string;
  query?: string;
  round?: number;
  resultsRetrieved?: number;
  uniqueResults?: number;
  duplicatesRemoved?: number;
  failedProviders?: string[];
  elapsedMs: number;
  status: "RUNNING" | "COMPLETED" | "WARNING" | "FAILED";
  timestamp: string;
}

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  category: OpportunityCategory;
  employmentType?: string;
  roleFamily?: string;
  seniority?: string;
  description: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
  workMode: WorkMode;
  compensation: string;
  eligibilityRequirements: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  publishedAt?: string | null;
  deadline?: string | null;
  deadlineRaw?: string | null;
  applyUrl: string;
  applicationUrl?: string; // Canonical alias for applyUrl
  canonicalUrl?: string;
  providerId?: string | null;
  sourceName: string;
  sourceUrl: string;
  sourceSnippet?: string;
  sourceConfidence: number; // 0 to 1
  verificationStatus: VerificationStatus;
  sourceEvidence: SourceEvidenceItem[];
  evidenceRecords?: SourceEvidenceItem[]; // Canonical alias for sourceEvidence
  multiSourceProvenance?: MultiSourceProvenanceRecord[];
  guardVerdict?: "CLEAN" | "SANITIZED" | "SUSPICIOUS_INJECTION";
  embedding?: number[];
  aiStructured?: StructuredJobIntelligence | null;
  isExpired?: boolean;
  fetchedAt?: string;
  discoveredAt: string;
  lastCheckedAt: string;
  isDemo: boolean;
}

export interface FactProvenance {
  source:
    | "resume-derived"
    | "manually-entered"
    | "user-confirmed"
    | "externally-verified"
    | ProvenanceCode;
  provenanceCode?: ProvenanceCode;
  updatedAt: string;
  rawSnippet?: string;
}

export interface ExperienceFact {
  id: string;
  title: string;
  company: string;
  duration: string;
  bullets: string[];
  verified: boolean;
  provenance?: ProvenanceCode;
}

export interface ProjectFact {
  id: string;
  name: string;
  description: string;
  techStack: string[];
  link?: string;
  provenance?: ProvenanceCode;
}

export interface PortfolioFact {
  label: string;
  url: string;
  provenance?: ProvenanceCode;
}

export type FieldConfidenceLevel = "high" | "medium" | "low" | "none";

export interface FieldConfidenceRecord {
  level: FieldConfidenceLevel;
  score: number; // 0 to 1
  evidenceSnippet?: string;
  sourceSection?: string;
  reason?: string;
}

export type SkillCategory =
  | "Languages"
  | "ML / AI"
  | "Backend & Systems"
  | "Frontend & Product"
  | "Data & Cloud"
  | "Research & Evaluation"
  | "Other";

export interface DemonstratedCapability {
  id: string;
  capability: string;
  category: SkillCategory;
  sourceType: "DIRECT" | "INFERRED_ADJACENT";
  evidenceStrength: "HIGH" | "MEDIUM" | "LOW";
  provenance: ProvenanceCode;
  supportingProjects: string[];
  supportingExperiences: string[];
  technologies: string[];
  description: string;
}

export interface ProjectResponsibility {
  projectName: string;
  responsibility: string;
  demonstratedTasks: string[];
  technologiesUsed: string[];
  provenance: ProvenanceCode;
  evidenceStrength: "HIGH" | "MEDIUM" | "LOW";
}

export interface MissingProfileDetailPrompt {
  field: string;
  question: string;
  reason: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
}

export interface CandidateCapabilityMap {
  categorizedSkills: Record<SkillCategory, string[]>;
  demonstratedCapabilities: DemonstratedCapability[];
  inferredAdjacentCapabilities: DemonstratedCapability[];
  projectResponsibilities: ProjectResponsibility[];
  missingDetailsPrompts: MissingProfileDetailPrompt[];
  summary: string;
}

export type RoleFamilyType =
  | "DIRECT"
  | "ADJACENT"
  | "PROJECT_DERIVED"
  | "EMERGING_SPECIALIZED";

export interface ExpandedRole {
  id: string;
  title: string;
  roleFamily: RoleFamilyType;
  familyLabel: string;
  supportingEvidence: string[];
  requiredCapabilities: string[];
  missingSkills: string[];
  expansionRationale: string;
  relevanceEstimate: number; // 0 to 100
  confidence: number; // 0 to 1
  uncertainty: string;
  excludedByUser?: boolean;
}

export type EvidenceStrengthLabel =
  | "Strong evidence"
  | "Some evidence"
  | "Insufficient evidence"
  | "User-confirmed"
  | "Not evaluated";

export interface CareerDirection {
  id: string;
  title: string;
  roleFamily: string;
  familyType: RoleFamilyType;
  supportingSkills: string[];
  relevantProjects: Array<{
    name: string;
    description: string;
    techStack: string[];
    link?: string;
  }>;
  relevantExperiences: Array<{
    title: string;
    company: string;
    duration: string;
    bullets: string[];
  }>;
  missingRequirements: string[];
  relevanceExplanation: string;
  evidenceStrength: EvidenceStrengthLabel;
  isSelected?: boolean;
  isCustom?: boolean;
  userExcluded?: boolean;
}

export interface CareerOutlook {
  profileId: string;
  candidateName: string;
  headline: string;
  summary: string;
  directions: CareerDirection[];
  overallReadinessSummary: string;
  strongestSkills: string[];
  coreEvidenceCount: {
    skills: number;
    projects: number;
    experiences: number;
  };
  generatedAt: string;
}

export interface PersonalizedCareerBrief {
  candidateName: string;
  strongestDirections: CareerDirection[];
  opportunitiesWorthPursuing: Array<{
    opportunity: Opportunity;
    evaluation: EvaluationResult;
    hasPrepPlan?: boolean;
  }>;
  opportunitiesRequiringPrep: Array<{
    opportunity: Opportunity;
    evaluation: EvaluationResult;
    hasPrepPlan?: boolean;
  }>;
  importantSkillGaps: Array<{
    skill: string;
    frequency: number;
    relatedRoles: string[];
  }>;
  recommendedNextActions: Array<{
    title: string;
    description: string;
    priority: "HIGH" | "MEDIUM" | "LOW";
    relatedRole?: string;
  }>;
  upcomingDeadlines: Array<{
    opportunityId: string;
    title: string;
    organization: string;
    deadline: string;
    daysRemaining: number;
  }>;
  sourceReferences: Array<{
    name: string;
    url: string;
    confidence: number;
    claim: string;
  }>;
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  headline: string;
  university: string;
  degree: string;
  major: string;
  graduationYear?: number | null;
  graduationMonth?: string | null;
  gpa?: number | null;
  location: string;
  phone?: string;
  coursework?: string[];
  certifications?: string[];
  awards?: string[];
  categorizedSkills?: Record<string, string[]>;
  lowConfidenceFields?: string[];
  fieldConfidences?: Record<string, FieldConfidenceRecord>;
  isConfirmed?: boolean;
  targetRoles: string[];
  preferredWorkModes: WorkMode[];
  preferredLocations: string[];
  skills: string[];
  experiences: ExperienceFact[];
  projects: ProjectFact[];
  portfolioLinks: PortfolioFact[];
  availability: string;
  stipendPreference: string;
  constraints: string;
  workAuthStatus?: string;
  experienceLevel?: string;
  careerDirections?: string[] | string;
  adjacentRoles?: string[] | string;
  excludedRoleFamilies?: string[] | string;
  hiddenEmployers?: string[] | string;
  capabilityMap?: CandidateCapabilityMap;
  expandedRoles?: ExpandedRole[];
  expandedRoleFamilies?: ExpandedRole[];
  locationPreference?: LocationPreference;
  embedding?: number[];
  embeddingModel?: string;
  aiInsights?: AiResumeInsights;
  resumeText?: string | null;
  resumeFilename?: string | null;
  resumeExtractedAt?: string | Date | null;
  factProvenance: Record<string, FactProvenance>;
  createdAt: string;
  updatedAt: string;
}

export type CandidateProfile = UserProfile;

export interface EligibilityCheck {
  rule: string;
  status: EligibilityStatus;
  reason: string;
  evidence: string;
  isHardBlocker: boolean;
}

export interface ScoreBreakdown {
  eligibility: number;   // Max 35
  skills: number;        // Max 30 (Compatibility: Skills, Projects, Role Family, Semantic Overlap)
  semantic?: number;     // Semantic Embedding Similarity contribution (0 - 20)
  rawCosineSimilarity?: number; // Raw cosine similarity (0 - 1)
  bm25Score?: number;    // Lexical BM25/TF-IDF overlap (0 - 1)
  domainAlignment?: number; // Domain/role-family compatibility factor (0 - 1)
  proximity?: number;    // Vicinity proximity adjustment (-20 to +10)
  freshness?: number;    // Recency signal boost (0 - 5)
  quality: number;       // Max 15 (Quality & Legitimacy)
  preferences: number;   // Max 10 (Preference & Location Fit)
  deadline: number;      // Max 10 (Urgency & Freshness)
}

export interface EvaluationResult {
  id?: string;
  opportunityId: string;
  recommendation: RecommendationAction;
  overallScore: number; // 0 - 100
  semanticScore?: number; // 0 - 1 cosine similarity
  domainVerdict?: "DIRECT_DOMAIN" | "ADJACENT_DOMAIN" | "DOMAIN_MISMATCH" | "GENERAL";
  scoringBreakdownDetails?: string[];
  scoreBreakdown: ScoreBreakdown;
  hardBlockers: string[];
  rationale: string;
  nextAction: string;
  aiMatchExplanation?: string;
  skillGapAnalysis?: SkillGapIntelligenceItem[];
  uncertainties: string[];
  eligibilityChecks: EligibilityCheck[];
  positiveEvidence?: string[];
  missingQualifications?: string[];
  roleFamilyMatch?: string;
  classifiedSeniority?: SeniorityLevel;
  evaluatedAt: string;
}

export interface PreparationPlanItem {
  id: string;
  gap: string;
  requirement: string;
  concreteAction: string;
  deliverable: string;
  completionCriteria: string;
  estimatedEffort: string;
  portfolioProof: string;
  isCompleted: boolean;
  skillTag?: string;
  priority?: "High" | "Medium" | "Low" | string;
  inProgress?: boolean;
  plannedDate?: string;
  instructions?: string[];
  resources?: Array<{ name: string; url: string }>;
}

export interface PreparationPlan {
  id: string;
  opportunityId: string;
  opportunity?: Opportunity;
  title: string;
  summary: string;
  items: PreparationPlanItem[];
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationMaterials {
  resumeBulletsDraft?: string;
  coverLetterDraft?: string;
  questionsDraft?: string;
  interviewChecklist?: string;
}

export interface ReminderItem {
  id: string;
  title: string;
  dueDate: string;
  isDone: boolean;
}

export interface ApplicationRecord {
  id: string;
  opportunityId: string;
  opportunity?: Opportunity;
  stage: ApplicationStage;
  targetDeadline?: string | null;
  plannedNextAction: string;
  notes: string;
  materials: ApplicationMaterials;
  outcome?: "OFFER" | "REJECTED" | "GHOSTED" | "DECLINED" | null;
  outcomeReflection?: string | null;
  outcomeLoggedAt?: string | null;
  reminders: ReminderItem[];
  createdAt: string;
  updatedAt: string;
  events?: Array<{
    id: string;
    fromStage?: string | null;
    toStage: string;
    note: string;
    createdAt: string;
  }>;
}

export type SearchQueryStrategy =
  | "DIRECT_ROLE"
  | "ADJACENT_ROLE"
  | "PROJECT_RESPONSIBILITY"
  | "RESEARCH_ACADEMIC"
  | "EMERGING_SPECIALIZED"
  | "COMPANY_CAREER_BOARD"
  | "BROADENED_FALLBACK";

export interface SearchQueryItem {
  id: string;
  query: string;
  strategy: SearchQueryStrategy;
  roleTitles: string[];
  skillCombinations: string[];
  projectKeywords: string[];
  locationFilters: string[];
  workModeFilters: WorkMode[];
  experienceLevelTerms: string[];
  companyTargets: string[];
  targetProviders: string[];
  exclusionTerms: string[];
  rationale: string;
  expectedCategory: OpportunityCategory;
  priority: number; // 1 (highest) to 10 (lowest)
  maxResults: number;
  includeDomains?: string[];
}

export interface SearchHardConstraints {
  workAuth?: string;
  remoteOnly?: boolean;
  strictLocations?: string[];
  excludedEmployers: string[];
  excludedRoleFamilies: string[];
  internshipOrGradOnly?: boolean;
}

export interface SearchSoftPreferences {
  preferredLocations: string[];
  preferredWorkModes: WorkMode[];
  stipendPreference: string;
  targetCategories: OpportunityCategory[];
}

export interface SearchPlan {
  roundId: string;
  roundNumber: number;
  queryGroups: SearchQueryItem[];
  roleTitles: string[];
  skillCombinations: string[];
  projectResponsibilityKeywords: string[];
  locationFilters: string[];
  workModeFilters: WorkMode[];
  experienceLevelTerms: string[];
  companyCareerTargets: string[];
  relevantSourceProviders: string[];
  exclusionTerms: string[];
  queryRationale: string;
  expectedResultCategory: OpportunityCategory;
  priority: number;
  maxResultLimits: number;
  hardConstraints: SearchHardConstraints;
  softPreferences: SearchSoftPreferences;
  plannerSource: "DETERMINISTIC" | "LLM_VALIDATED";
  expansionReasonsTriggered?: ExpansionCaseCode[];
  createdAt: string;
}

export type ProviderStatus = "SUCCESS" | "PARTIAL" | "FAILED" | "RATE_LIMITED";

export interface PaginationMetadata {
  total?: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface RawOpportunity {
  provider: string;
  providerId?: string;
  title: string;
  organization: string;
  description: string;
  category?: OpportunityCategory;
  employmentType?: string;
  roleFamily?: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  workMode?: WorkMode;
  seniority?: string;
  compensation?: string;
  requiredSkills?: string[];
  preferredSkills?: string[];
  eligibilityRequirements?: string[];
  publishedAt?: string | null;
  deadline?: string | null;
  deadlineRaw?: string | null;
  applicationUrl: string;
  canonicalUrl?: string;
  sourceName: string;
  sourceUrl: string;
  sourceSnippet?: string;
  discoveredAt?: string;
  fetchedAt: string;
  lastCheckedAt?: string;
  verificationStatus?: VerificationStatus;
  isActive?: boolean;
  isDemo?: boolean;
}

export interface SearchProviderResult {
  provider: string;
  opportunities: RawOpportunity[];
  queryExecuted: string;
  sourcesChecked: string[];
  warnings: string[];
  pagination?: PaginationMetadata;
  fetchedAt: string;
  status: ProviderStatus;
  cached?: boolean;
  durationMs?: number;
}

export interface PostingGuardResult {
  verdict: "CLEAN" | "SANITIZED" | "SUSPICIOUS_INJECTION";
  sanitizedText: string;
  removedHiddenHtmlCount: number;
  removedInvisibleCharCount: number;
  decodedTagRunCount: number;
  suspiciousInjectionLines: string[];
  warnings: string[];
}

export type ExpansionCaseCode =
  | "CASE_A_LOW_RESULT_COUNT"
  | "CASE_B_MANY_DUPLICATES"
  | "CASE_C_LOW_SKILL_RELEVANCE"
  | "CASE_D_GEOGRAPHIC_LIMITATION"
  | "CASE_E_MISSING_CATEGORIES"
  | "CASE_F_POOR_SOURCE_COVERAGE"
  | "CASE_G_INSUFFICIENT_CANDIDATE_EVIDENCE";

export type StopReasonCode =
  | "MAX_ROUNDS_REACHED"
  | "SEARCH_BUDGET_EXHAUSTED"
  | "CONSECUTIVE_LOW_YIELD_ROUNDS"
  | "NO_NEW_QUERY_STRATEGY"
  | "SUFFICIENT_ELIGIBLE_RESULTS"
  | "USER_CANCELLED";

export interface AdaptiveRoundMetrics {
  roundId: string;
  roundNumber: number;
  queriesPlanned: string[];
  providersChecked: string[];
  providerStatuses: Record<string, ProviderStatus>;
  totalRawResults: number;
  uniqueNormalizedResults: number;
  duplicateRate: number; // 0 to 1
  eligibleResultCount: number;
  applyNowCount: number;
  prepareFirstCount: number;
  roleFamilyDistribution: Record<string, number>;
  sourceDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  locationWorkModeDistribution: Record<string, number>;
  averageCompatibilityScore: number;
  marginalNewUniqueOpportunities: number;
  marginalYieldRate: number; // 0 to 1
  diagnosticCasesTriggered: ExpansionCaseCode[];
  expansionDecisions: string[];
  warnings: string[];
}

export interface SearchConfig {
  mode: "DEMO" | "LIVE";
  maxRounds: number;
  queriesPerRound: number;
  resultsPerProvider: number;
  providerConcurrency: number;
  requestTimeoutMs: number;
  maxRetries: number;
  cacheTtlSeconds: number;
  minUniqueNewOpportunities: number;
  minMarginalYield: number;
  searchBudgetPerRun: number;
  minEligibleToStopEarly: number;
  enableLinkedInLocalPersonal: boolean;
  enableGeneralWebDiscovery: boolean;
}

export type FeedbackSignalType =
  | "SAVE"
  | "MARK_RELEVANT"
  | "MARK_NOT_RELEVANT"
  | "HIDE_EMPLOYER"
  | "DISMISS_ROLE_FAMILY"
  | "ADJUST_PREFERENCES"
  | "MARK_APPLIED"
  | "RECORD_OUTCOME"
  | "RESET_PERSONALIZATION";

export interface UserFeedbackRecord {
  id: string;
  profileId: string;
  opportunityId?: string | null;
  organization?: string | null;
  roleFamily?: string | null;
  signalType: FeedbackSignalType;
  outcome?: "INTERVIEW" | "OFFER" | "REJECTED" | "GHOSTED" | null;
  notes: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface AgentStepRecord {
  id: string;
  stepNumber: number;
  toolName: string;
  status: "SUCCESS" | "SKIPPED" | "RETRYING" | "FAILED";
  inputSummary: string;
  outputSummary: string;
  sourceReferences: string[];
  errorDetails?: string | null;
  executedAt: string;
}

export interface AgentRunRecord {
  id: string;
  trigger: "SEARCH" | "VERIFY" | "EVALUATE" | "PREPARE" | "ADAPTIVE_SEARCH";
  query: string;
  mode?: "DEMO" | "LIVE";
  status: "RUNNING" | "COMPLETED" | "PARTIAL_FAILURE" | "FAILED";
  summary: string;
  rounds?: AdaptiveRoundMetrics[];
  searchPlans?: SearchPlan[];
  coverageSummary?: {
    sourcesChecked: string[];
    providersFailed: string[];
    providerStatuses: Record<string, ProviderStatus>;
    totalRawFound: number;
    totalUniqueEvaluated: number;
    duplicatesRemoved: number;
    eligibleCount: number;
    applyNowCount: number;
    prepareFirstCount: number;
    keepWatchingCount: number;
    skipCount: number;
    coverageStatement: string;
  };
  stopReason?: StopReasonCode | string;
  budgetUsed?: number;
  budgetLimit?: number;
  startedAt: string;
  completedAt?: string | null;
  steps: AgentStepRecord[];
}

export type ProjectVerdict =
  | "STRONG_RESUME_ASSET"
  | "ADD_WITH_QUANTIFIED_IMPACT"
  | "NEEDS_ENGINEERING_DEPTH"
  | "REPLACE_OR_KEEP_LEARNING";

export interface ProjectEvaluationInput {
  title: string;
  description: string;
  techStack: string[];
  repoUrl?: string;
  liveUrl?: string;
  targetRole?: string;
}

export interface ProjectEvaluationResult {
  title: string;
  overallScore: number; // 0 - 100
  verdict: ProjectVerdict;
  verdictLabel: string;
  shouldIncludeOnResume: boolean;
  summary: string;
  dimensionScores: {
    technicalComplexity: number; // 0 - 25
    engineeringProduction: number; // 0 - 20
    roleRelevance: number; // 0 - 25
    differentiation: number; // 0 - 15
    impactEvidence: number; // 0 - 15
  };
  strengths: string[];
  weaknesses: string[];
  recommendedResumeBullets: string[];
  upgradeSteps: string[];
  extractedCapabilities: string[];
  matchingOpportunitiesCount: number;
  topMatchingOpportunities: Array<{
    opportunity: Opportunity;
    evaluation: EvaluationResult;
    projectSimilarity: number;
  }>;
  repoInspectNote?: string;
  provider: string;
  model: string;
  evaluatedAt: string;
}

export type LiveSystemEventType =
  | "CONNECTED"
  | "HEARTBEAT"
  | "OPPORTUNITY_UPSERTED"
  | "SYNC_COMPLETED"
  | "PROFILE_UPDATED"
  | "PROJECT_ADDED"
  | "SEARCH_COMPLETED";

export interface LiveSystemEvent {
  id: string;
  type: LiveSystemEventType;
  message: string;
  timestamp: string;
  userId?: string;
  payload?: Record<string, unknown>;
}

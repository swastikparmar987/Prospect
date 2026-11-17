"use client";

import React, { useState, useRef, useEffect, useMemo, useId } from "react";
import {
  Opportunity,
  EvaluationResult,
  ExpandedRole,
  CandidateCapabilityMap,
  AgentRunRecord,
  UserProfile,
  CareerOutlook,
  LocationPreference,
  LocationDiscoveryMode,
  LiveDiscoveryEvent,
  RankingEvaluationMetrics,
} from "@/types";
import { OpportunityCard } from "../OpportunityCard";
import { CompanyLogo } from "../CompanyLogo";
import {
  DiscoverDetailPanel,
  formatShortLocation,
} from "../DiscoverDetailPanel";
import { PersonalizedCareerBriefView } from "./PersonalizedCareerBriefView";
import {
  LiveDiscoveryActivityPanel,
  SearchBudgetSettings,
} from "../LiveDiscoveryActivityPanel";
import { AiIntelligencePanel } from "../AiIntelligencePanel";
import {
  generatePersonalizedCareerBrief,
  groupOpportunitiesByCareerDirection,
} from "@/lib/career-outlook";
import {
  Search,
  Sparkles,
  MapPin,
  ChevronDown,
  X,
  RotateCw,
  SlidersHorizontal,
  Compass,
  Layers,
  Radio,
  Upload,
  LayoutGrid,
  FileText,
  ArrowRight,
  Navigation,
  Brain,
  CheckCircle2,
  AlertTriangle,
  Database,
  Briefcase,
  BriefcaseBusiness,
  Globe,
  Building2,
  Target,
  Zap,
  BarChart2,
  Bookmark,
  Loader2,
  Activity,
} from "lucide-react";

interface DiscoverViewProps {
  opportunities: Array<{
    opportunity: Opportunity;
    evaluation: EvaluationResult;
    hasPrepPlan?: boolean;
  }>;
  loading: boolean;
  onSearch: (params: {
    query: string;
    category?: string;
    workMode?: string;
    location?: string;
    platform?: string;
    locationMode?: LocationDiscoveryMode;
    selectedCity?: string;
    deadline?: string;
    action?: string;
    sortBy?: string;
  }) => void;
  onInspectOpportunity: (
    opp: Opportunity,
    evalResult: EvaluationResult,
    initialTab?:
      | "overview"
      | "eligibility"
      | "evidence"
      | "why"
      | "prep_plan"
      | "studio"
  ) => void;
  onSaveToTracker: (opp: Opportunity) => void;
  onRunAgentDiscovery: (
    query: string,
    mode?: "DEMO" | "LIVE",
    options?: {
      budget?: SearchBudgetSettings;
      locationMode?: LocationDiscoveryMode;
      selectedCity?: string;
      expandRoles?: boolean;
    }
  ) => void;
  onCancelAgentDiscovery?: () => void;
  isAgentRunning: boolean;
  liveEvents?: LiveDiscoveryEvent[];
  agentError?: string | null;
  wasSearchCancelled?: boolean;
  personalizationSummary?: string | null;
  rankingMetrics?: RankingEvaluationMetrics | null;
  locationPreference?: LocationPreference | null;
  onUpdateLocationPreference?: (pref: LocationPreference) => void;
  onTriggerBackgroundSync?: () => Promise<void>;
  isSyncing?: boolean;
  lastSyncAt?: string | null;
  searchMode?: "DEMO" | "LIVE";
  onChangeSearchMode?: (mode: "DEMO" | "LIVE") => void;
  expandedRoles?: ExpandedRole[];
  capabilityMap?: CandidateCapabilityMap | null;
  latestRun?: AgentRunRecord | null;
  onDismissRoleFamily?: (roleTitle: string) => void;
  onResetPersonalization?: () => void;
  onFeedback?: (
    opp: Opportunity,
    signalType: "MARK_RELEVANT" | "MARK_NOT_RELEVANT" | "HIDE_EMPLOYER"
  ) => void;
  onOpenAgentTab?: () => void;
  onOpenSourcesModal?: () => void;
  savedOpportunityIds?: string[];
  userProfile?: UserProfile | null;
  onUploadNewResume?: () => void;
  careerOutlook?: CareerOutlook | null;
  onOpenCareerOutlook?: () => void;
  realtimeConnected?: boolean;
  liveUpdatesCount?: number;
  onOpenProjectLab?: () => void;
  externalSearchCommand?: {
    query?: string;
    platform?: string;
    locationMode?: LocationDiscoveryMode;
    selectedCity?: string;
    stamp: number;
  } | null;
}

const VERIFIED_CITY_CHOICES = [
  "New Delhi",
  "Gurugram",
  "Noida",
  "Bengaluru",
  "Mumbai",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Chandigarh",
  "Jaipur",
  "San Francisco",
  "New York",
  "Seattle",
  "Austin",
  "Boston",
  "London",
  "Singapore",
  "Toronto",
  "Berlin",
  "Remote",
];

/** Clean soft-card Obsidian & Lime tilted folder vector illustration matching Discover hero. */
function HeroFolderIllustration() {
  const shadowId = useId();
  const limeGradId = useId();

  return (
    <svg
      width="136"
      height="104"
      viewBox="0 0 136 104"
      fill="none"
      aria-hidden="true"
      className="hidden sm:block shrink-0"
    >
      <defs>
        <filter id={shadowId} x="12" y="20" width="120" height="84" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.08" />
        </filter>
        <linearGradient id={limeGradId} x1="24" y1="26" x2="118" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E9FD82" />
          <stop offset="100%" stopColor="#D5F642" />
        </linearGradient>
      </defs>

      {/* Subtle soft lime ambient ticks */}
      <line x1="18" y1="22" x2="11" y2="13" stroke="#8AD014" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />
      <line x1="28" y1="15" x2="26" y2="5" stroke="#8AD014" strokeWidth="2.2" strokeLinecap="round" opacity="0.55" />
      <line x1="39" y1="17" x2="45" y2="8" stroke="#8AD014" strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />

      {/* Soft violet background document tab */}
      <g transform="rotate(-6 74 52)">
        <rect
          x="30"
          y="20"
          width="84"
          height="58"
          rx="12"
          fill="#F5F2FF"
          stroke="#D9CCF8"
          strokeWidth="1.5"
        />
      </g>

      {/* Soft Electric Lime folder back flap */}
      <g transform="rotate(-3 74 58)">
        <path
          d="M24 34C24 29.58 27.58 26 32 26H58L65 34H110C114.42 34 118 37.58 118 42V82C118 86.42 114.42 90 110 90H32C27.58 90 24 86.42 24 82V34Z"
          fill={`url(#${limeGradId})`}
          stroke="#B5DD23"
          strokeWidth="1.4"
        />
      </g>

      {/* Translucent white front pocket with soft drop shadow */}
      <g filter={`url(#${shadowId})`}>
        <rect
          x="24"
          y="40"
          width="90"
          height="48"
          rx="12"
          fill="#FFFFFF"
          stroke="#E5E7EB"
          strokeWidth="1.4"
        />
      </g>

      {/* Minimalist Obsidian briefcase emblem inside pocket */}
      <rect
        x="58"
        y="57"
        width="22"
        height="16"
        rx="4"
        fill="#FAFBF7"
        stroke="#101214"
        strokeWidth="1.75"
      />
      <path
        d="M65 57V54C65 52.9 65.9 52 67 52H71C72.1 52 73 52.9 73 54V57"
        stroke="#101214"
        strokeWidth="1.75"
      />
      <line x1="58" y1="64" x2="80" y2="64" stroke="#101214" strokeWidth="1.6" />
    </svg>
  );
}

/** Compact circular SVG progress ring for split-feed opportunity cards. */
function CompactMatchRing({ percent }: { percent: number }) {
  const gradId = useId();
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const r = 16;
  const c = 2 * Math.PI * r;
  const offset = c - (clamped / 100) * c;

  return (
    <div
      className="relative inline-flex h-10 w-10 items-center justify-center shrink-0"
      title={`${clamped}% Match`}
    >
      <svg className="h-10 w-10 -rotate-90" viewBox="0 0 40 40" aria-hidden="true">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#9CE21B" />
            <stop offset="100%" stopColor="#65B811" />
          </linearGradient>
        </defs>
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke="#E6E8E2"
          strokeWidth="3.2"
        />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="3.2"
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute font-heading text-[10px] font-extrabold text-[#101214] leading-none">
        {clamped}%
      </span>
    </div>
  );
}

/** Derives the 5 compact pipeline step states strictly from real backend events/runs. */
function deriveCompactPipelineSteps(
  isAgentRunning: boolean,
  liveEvents: LiveDiscoveryEvent[],
  latestRun: AgentRunRecord | null | undefined,
  opportunityCount: number
) {
  const completedStages = new Set(liveEvents.map((e) => e.stage));

  // Real provider progress if present in liveEvents or latestRun coverage
  const contactedEvents = liveEvents.filter(
    (e) => e.stage === "PROVIDERS_CONTACTED" || e.stage === "RESULTS_RETRIEVED"
  );
  const lastProviderEvent = contactedEvents[contactedEvents.length - 1];
  const sourcesCheckedCount =
    latestRun?.coverageSummary?.sourcesChecked?.length || 0;

  let sourceProgressLabel = "";
  if (lastProviderEvent?.detail) {
    const fracMatch = lastProviderEvent.detail.match(/(\d+\s*\/\s*\d+)/);
    if (fracMatch) sourceProgressLabel = fracMatch[1];
  }
  if (!sourceProgressLabel && sourcesCheckedCount > 0) {
    sourceProgressLabel = `${sourcesCheckedCount} feeds`;
  }

  const runCompleted =
    !isAgentRunning &&
    (completedStages.has("SEARCH_COMPLETED") ||
      latestRun?.status === "COMPLETED" ||
      latestRun?.status === "PARTIAL_FAILURE");

  const steps: Array<{
    label: string;
    state: "done" | "active" | "pending";
    badge?: string;
  }> = [
    {
      label: "Analyzing your profile",
      state:
        completedStages.has("PROFILE_LOADED") ||
        completedStages.has("CAPABILITIES_EXTRACTED") ||
        runCompleted ||
        opportunityCount > 0
          ? "done"
          : isAgentRunning
          ? "active"
          : "pending",
    },
    {
      label: "Expanding relevant roles",
      state:
        completedStages.has("ROLE_FAMILIES_GENERATED") ||
        completedStages.has("QUERIES_PLANNED") ||
        runCompleted
          ? "done"
          : isAgentRunning &&
            (completedStages.has("PROFILE_LOADED") ||
              completedStages.has("CAPABILITIES_EXTRACTED"))
          ? "active"
          : opportunityCount > 0
          ? "done"
          : "pending",
    },
    {
      label: isAgentRunning
        ? "Searching trusted sources..."
        : "Searching trusted sources",
      badge: sourceProgressLabel || undefined,
      state:
        completedStages.has("RESULTS_RETRIEVED") || runCompleted
          ? "done"
          : isAgentRunning &&
            (completedStages.has("PROVIDERS_CONTACTED") ||
              completedStages.has("QUERIES_PLANNED"))
          ? "active"
          : opportunityCount > 0
          ? "done"
          : "pending",
    },
    {
      label: "Ranking & matching opportunities",
      state:
        completedStages.has("OPPORTUNITIES_RANKED") || runCompleted
          ? "done"
          : isAgentRunning && completedStages.has("RESULTS_RETRIEVED")
          ? "active"
          : opportunityCount > 0
          ? "done"
          : "pending",
    },
    {
      label: "Preparing personalized results",
      state:
        completedStages.has("SEARCH_COMPLETED") || runCompleted
          ? "done"
          : isAgentRunning && completedStages.has("OPPORTUNITIES_RANKED")
          ? "active"
          : opportunityCount > 0
          ? "done"
          : "pending",
    },
  ];

  return steps;
}

export function DiscoverView({
  opportunities,
  loading,
  onSearch,
  onInspectOpportunity,
  onSaveToTracker,
  onRunAgentDiscovery,
  onCancelAgentDiscovery,
  isAgentRunning,
  liveEvents = [],
  agentError = null,
  wasSearchCancelled = false,
  personalizationSummary = null,
  rankingMetrics = null,
  locationPreference = null,
  onUpdateLocationPreference,
  onTriggerBackgroundSync,
  isSyncing = false,
  lastSyncAt = null,
  searchMode = "LIVE",
  expandedRoles = [],
  capabilityMap,
  latestRun,
  onDismissRoleFamily,
  onResetPersonalization,
  onFeedback,
  onOpenSourcesModal,
  savedOpportunityIds = [],
  userProfile,
  onUploadNewResume,
  careerOutlook,
  onOpenCareerOutlook,
  realtimeConnected = false,
  liveUpdatesCount = 0,
  onOpenProjectLab,
  externalSearchCommand = null,
}: DiscoverViewProps) {
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedLocation, setSelectedLocation] = useState("ALL");
  const [selectedLocationMode, setSelectedLocationMode] =
    useState<LocationDiscoveryMode>("VICINITY");
  const [selectedCityForDiscovery, setSelectedCityForDiscovery] =
    useState(locationPreference?.city || userProfile?.locationPreference?.city || "India");

  useEffect(() => {
    const resumeCity = locationPreference?.city || userProfile?.locationPreference?.city;
    if (resumeCity && (!selectedCityForDiscovery || selectedCityForDiscovery === "India")) {
      setSelectedCityForDiscovery(resumeCity);
    }
  }, [locationPreference?.city, userProfile?.locationPreference?.city]);

  useEffect(() => {
    if (!externalSearchCommand) return;
    if (externalSearchCommand.query !== undefined) {
      setSearchInput(externalSearchCommand.query);
    }
    if (externalSearchCommand.platform) {
      setSelectedPlatform(externalSearchCommand.platform);
    }
    if (externalSearchCommand.locationMode) {
      setSelectedLocationMode(externalSearchCommand.locationMode);
    }
    if (externalSearchCommand.selectedCity) {
      setSelectedCityForDiscovery(externalSearchCommand.selectedCity);
    }
  }, [externalSearchCommand?.stamp]);
  const [selectedWorkMode, setSelectedWorkMode] = useState("ALL");
  const [selectedPlatform, setSelectedPlatform] = useState("ALL");
  const [selectedDeadline, setSelectedDeadline] = useState("ALL");
  const [selectedSort, setSelectedSort] = useState("fit");
  const [viewMode, setViewMode] = useState<"ALL" | "GROUPED" | "BRIEF">("ALL");

  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showLocationPanel, setShowLocationPanel] = useState(false);
  const [showPipelinePanel, setShowPipelinePanel] = useState(false);

  // Master-detail selection & pagination
  const [selectedOppId, setSelectedOppId] = useState<string>("");
  const [visibleLimit, setVisibleLimit] = useState(15);

  // Location Intelligence UI states
  const [detectingGeo, setDetectingGeo] = useState(false);
  const [geoStatusMessage, setGeoStatusMessage] = useState<string | null>(null);
  const [geoErrorState, setGeoErrorState] = useState<string | null>(null);
  const [editingLocation, setEditingLocation] = useState(false);
  const [manualCityInput, setManualCityInput] = useState("");

  // Search budget state
  const [searchBudget, setSearchBudget] = useState<SearchBudgetSettings>({
    maxRounds: 2,
    queriesPerRound: 4,
    resultsPerProvider: 12,
    searchBudgetPerRun: 12,
  });

  const sortDropdownRef = useRef<HTMLDivElement>(null);

  const activeLocationPref: LocationPreference =
    locationPreference ||
    userProfile?.locationPreference || {
      city: "",
      region: "",
      country: "",
      displayLabel: "Location not set",
      cityLatitude: null,
      cityLongitude: null,
      nearbyRadiusKm: 60,
      preferredWorkModes: ["Remote", "Hybrid"],
      source: "NONE",
      permissionState: "prompt",
      lastResolvedAt: null,
    };

  useEffect(() => {
    if (activeLocationPref.city && !manualCityInput) {
      setManualCityInput(activeLocationPref.city);
      setSelectedCityForDiscovery(activeLocationPref.city);
    }
  }, [activeLocationPref.city, manualCityInput]);

  // Keep master-detail selection valid as opportunities change
  useEffect(() => {
    if (opportunities.length > 0) {
      if (
        !selectedOppId ||
        !opportunities.some((item) => item.opportunity.id === selectedOppId)
      ) {
        setSelectedOppId(opportunities[0].opportunity.id);
      }
    } else {
      setSelectedOppId("");
    }
  }, [opportunities, selectedOppId]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(e.target as Node)
      ) {
        setSortDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleApplyFilters = (overrides?: {
    category?: string;
    location?: string;
    platform?: string;
    locationMode?: LocationDiscoveryMode;
    selectedCity?: string;
    workMode?: string;
    deadline?: string;
    sortBy?: string;
    query?: string;
  }) => {
    const modeToUse = overrides?.locationMode ?? selectedLocationMode;
    const cityToUse = overrides?.selectedCity ?? selectedCityForDiscovery;
    onSearch({
      query: overrides?.query !== undefined ? overrides.query : searchInput,
      category: overrides?.category || selectedCategory,
      location: overrides?.location || selectedLocation,
      platform: overrides?.platform || selectedPlatform,
      locationMode: modeToUse,
      selectedCity:
        modeToUse === "SELECTED_CITY"
          ? cityToUse
          : activeLocationPref.city || cityToUse,
      workMode: overrides?.workMode || selectedWorkMode,
      deadline: overrides?.deadline || selectedDeadline,
      sortBy: overrides?.sortBy || selectedSort,
    });
  };

  // Browser Geolocation Detection
  const handleDetectBrowserLocation = async () => {
    setDetectingGeo(true);
    setGeoErrorState(null);
    setGeoStatusMessage(
      "Requesting browser location permission (navigator.geolocation)..."
    );

    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setDetectingGeo(false);
      setGeoStatusMessage(null);
      setGeoErrorState(
        "Geolocation services are unavailable in this browser. Please select or type your city manually."
      );
      try {
        const res = await fetch("/api/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "RECORD_PERMISSION_STATE",
            permissionState: "UNAVAILABLE",
          }),
        });
        const data = await res.json();
        if (data.locationPreference && onUpdateLocationPreference) {
          onUpdateLocationPreference(data.locationPreference);
        }
      } catch {}
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setGeoStatusMessage(
            "Coordinates obtained. Resolving city & region via reverse geocoding..."
          );
          const res = await fetch("/api/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "REVERSE_GEOCODE",
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          });
          const data = await res.json();
          if (!res.ok || !data.resolved) {
            setGeoErrorState(
              data.message ||
                "Reverse geocoding failed to resolve a city. Please enter your city manually."
            );
            setGeoStatusMessage(null);
            if (data.locationPreference && onUpdateLocationPreference) {
              onUpdateLocationPreference(data.locationPreference);
            }
          } else {
            setGeoErrorState(null);
            setGeoStatusMessage(
              `Detected city: ${
                data.locationPreference.displayLabel ||
                data.locationPreference.city
              } (stored city preference).`
            );
            if (onUpdateLocationPreference) {
              onUpdateLocationPreference(data.locationPreference);
            }
            setSelectedLocationMode("NEAR_ME");
            handleApplyFilters({
              locationMode: "NEAR_ME",
              selectedCity: data.locationPreference.city,
            });
          }
        } catch {
          setGeoErrorState(
            "Network error while reverse-geocoding coordinates. Please enter your city manually."
          );
          setGeoStatusMessage(null);
        } finally {
          setDetectingGeo(false);
        }
      },
      async (err) => {
        setDetectingGeo(false);
        setGeoStatusMessage(null);
        const permState = err.code === 1 ? "DENIED" : "UNAVAILABLE";
        const msg =
          err.code === 1
            ? "Location permission denied by browser. Please select or edit your city manually."
            : `Location service unavailable (${
                err.message || "timeout"
              }). Please select a city manually.`;
        setGeoErrorState(msg);
        try {
          const res = await fetch("/api/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "RECORD_PERMISSION_STATE",
              permissionState: permState,
            }),
          });
          const data = await res.json();
          if (data.locationPreference && onUpdateLocationPreference) {
            onUpdateLocationPreference(data.locationPreference);
          }
        } catch {}
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    );
  };

  const handleSaveManualLocation = async (cityToSave: string) => {
    const clean = cityToSave.trim();
    if (!clean) return;
    try {
      const res = await fetch("/api/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "SET_MANUAL_LOCATION", city: clean }),
      });
      const data = await res.json();
      if (res.ok && data.locationPreference) {
        if (onUpdateLocationPreference) {
          onUpdateLocationPreference(data.locationPreference);
        }
        setEditingLocation(false);
        setGeoErrorState(null);
        setGeoStatusMessage(
          `Location updated to ${
            data.locationPreference.displayLabel || data.locationPreference.city
          }.`
        );
        handleApplyFilters({
          locationMode: selectedLocationMode,
          selectedCity: data.locationPreference.city,
        });
      }
    } catch {
      setGeoErrorState("Failed to save manual location preference.");
    }
  };

  const handleSelectLocationDiscoveryMode = (mode: LocationDiscoveryMode) => {
    setSelectedLocationMode(mode);
    if (mode === "REMOTE") {
      setSelectedWorkMode("Remote");
      handleApplyFilters({ locationMode: mode, workMode: "Remote" });
    } else if (mode === "HYBRID") {
      setSelectedWorkMode("Hybrid");
      handleApplyFilters({ locationMode: mode, workMode: "Hybrid" });
    } else if (mode === "ONSITE") {
      setSelectedWorkMode("On-site");
      handleApplyFilters({ locationMode: mode, workMode: "On-site" });
    } else {
      setSelectedWorkMode("ALL");
      handleApplyFilters({ locationMode: mode, workMode: "ALL" });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleApplyFilters();
      if (searchInput.trim()) {
        onRunAgentDiscovery(searchInput, searchMode, {
          budget: searchBudget,
          locationMode: selectedLocationMode,
          selectedCity:
            selectedLocationMode === "SELECTED_CITY"
              ? selectedCityForDiscovery
              : activeLocationPref.city,
        });
      }
    }
  };

  const handleClearAllFilters = () => {
    setSearchInput("");
    setSelectedCategory("ALL");
    setSelectedLocation("ALL");
    setSelectedPlatform("ALL");
    setSelectedLocationMode("ALL");
    setSelectedWorkMode("ALL");
    setSelectedDeadline("ALL");
    setSelectedSort("fit");
    setViewMode("ALL");
    onSearch({
      query: "",
      category: "ALL",
      location: "ALL",
      platform: "ALL",
      locationMode: "ALL",
      workMode: "ALL",
      deadline: "ALL",
      sortBy: "fit",
    });
  };

  const hasActiveFilters =
    Boolean(searchInput.trim()) ||
    selectedCategory !== "ALL" ||
    selectedLocation !== "ALL" ||
    selectedPlatform !== "ALL" ||
    selectedLocationMode !== "ALL" ||
    selectedWorkMode !== "ALL" ||
    selectedDeadline !== "ALL" ||
    selectedSort !== "fit";

  // ------------------------------------------------------------------
  // Real Computed Metrics for Snapshot Cards (No Mock Numbers!)
  // ------------------------------------------------------------------
  const {
    newCount,
    strongMatchesCount,
    profileFitPct,
    skillGapsCount,
  } = useMemo(() => {
    const now = Date.now();
    const recentCount = opportunities.filter(({ opportunity }) => {
      const t = opportunity.discoveredAt
        ? new Date(opportunity.discoveredAt).getTime()
        : 0;
      return t > 0 && (now - t) / (1000 * 60 * 60) <= 48;
    }).length;

    const strongCount = opportunities.filter(
      ({ evaluation }) =>
        evaluation.overallScore >= 75 || evaluation.recommendation === "APPLY_NOW"
    ).length;

    let computedProfilePct = 0;
    if (userProfile) {
      const checks = [
        Boolean(userProfile.degree && userProfile.major),
        Boolean(userProfile.skills && userProfile.skills.length > 0),
        Boolean(userProfile.experiences && userProfile.experiences.length > 0),
        Boolean(userProfile.projects && userProfile.projects.length >= 2),
        Boolean(userProfile.targetRoles && userProfile.targetRoles.length > 0),
      ].filter(Boolean).length;
      computedProfilePct = Math.round((checks / 5) * 100);
    } else if (opportunities.length > 0) {
      computedProfilePct = Math.round(opportunities[0].evaluation.overallScore);
    }

    const gapSet = new Set<string>();
    for (const item of opportunities.slice(0, 10)) {
      for (const gap of item.evaluation.skillGapAnalysis || []) {
        gapSet.add(gap.skill.toLowerCase());
      }
      for (const missing of item.evaluation.missingQualifications || []) {
        gapSet.add(missing.toLowerCase());
      }
    }

    return {
      newCount: recentCount,
      strongMatchesCount: strongCount,
      profileFitPct: computedProfilePct,
      skillGapsCount: gapSet.size,
    };
  }, [opportunities, userProfile]);

  const compactPipelineSteps = useMemo(
    () =>
      deriveCompactPipelineSteps(
        isAgentRunning,
        liveEvents,
        latestRun,
        opportunities.length
      ),
    [isAgentRunning, liveEvents, latestRun, opportunities.length]
  );

  const selectedItem =
    opportunities.find((o) => o.opportunity.id === selectedOppId) ||
    opportunities[0] ||
    null;

  const activeExpandedRoles = expandedRoles.filter((r) => !r.excludedByUser);
  const sortOptions = [
    { label: "Best Match", value: "fit" },
    { label: "Semantic Match", value: "semantic" },
    { label: "Nearest Distance", value: "distance" },
    { label: "Priority Action", value: "action" },
    { label: "Deadline", value: "deadline" },
    { label: "Newest", value: "recency" },
  ];

  const isAllQuickActive =
    selectedCategory === "ALL" &&
    selectedWorkMode === "ALL" &&
    selectedPlatform === "ALL" &&
    selectedLocationMode === "ALL";

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* ===================================================== */}
      {/* 1. HERO + 4 STAT CARDS LEFT | LIVE PIPELINE CARD RIGHT */}
      {/* ===================================================== */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Left: Headline + Folder Graphic + 4 Snapshot Cards */}
        <div className="xl:col-span-8 flex flex-col justify-between gap-4 rounded-[26px] bg-gradient-to-br from-white via-[#FBFDF7] to-[#EFFAD1]/55 border border-black/[0.06] p-5 sm:p-6 shadow-[0_10px_34px_rgba(15,23,42,0.045)]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-[-0.03em] leading-[1.08] text-[#101214]">
                Discover opportunities
                <br />
                <span className="inline-block rounded-xl bg-[#DCFC4E]/80 px-2.5 py-0.5 mt-1">
                  that fit you.
                </span>
              </h1>
              <p className="mt-2.5 text-xs sm:text-sm text-[#6B7280] font-medium">
                AI-powered search, live from trusted sources, personalized to your profile.
              </p>
            </div>

            <HeroFolderIllustration />
          </div>

          {/* 4 Snapshot Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Opportunities Found */}
            <div className="rounded-[20px] bg-gradient-to-br from-[#F3FCDA] to-[#E6F9A4]/70 border border-[#C7E938]/55 p-3.5 shadow-[0_6px_20px_rgba(180,235,30,0.10)]">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#0E1012] shrink-0" />
                  <span className="font-heading text-lg sm:text-xl font-extrabold text-[#0E1012] leading-none">
                    {opportunities.length.toLocaleString()}
                  </span>
                </div>
                {newCount > 0 && (
                  <span className="rounded-full bg-[#E3FC6D] border border-[#C6E832] px-2 py-0.5 font-heading text-[10px] font-semibold text-[#0E1012] leading-none">
                    +{newCount} new
                  </span>
                )}
              </div>
              <div className="mt-1.5 text-[11px] font-semibold text-[#3F6212]">
                Opportunities Found
              </div>
            </div>

            {/* 2. Strong Matches */}
            <div className="rounded-[20px] bg-white border border-black/[0.07] p-3.5 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#65B811] shrink-0" />
                <span className="font-heading text-lg sm:text-xl font-extrabold text-[#101214] leading-none">
                  {strongMatchesCount}
                </span>
              </div>
              <div className="mt-1.5 text-[11px] font-medium text-[#6B7280]">
                Strong Matches
              </div>
            </div>

            {/* 3. Profile Fit */}
            <div className="rounded-[20px] bg-white border border-black/[0.07] p-3.5 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-[#101214] shrink-0" />
                <span className="font-heading text-lg sm:text-xl font-extrabold text-[#101214] leading-none">
                  {profileFitPct}%
                </span>
              </div>
              <div className="mt-1.5 text-[11px] font-medium text-[#6B7280]">
                Profile Fit
              </div>
            </div>

            {/* 4. Skill Gaps */}
            <div className="rounded-[20px] bg-white border border-black/[0.07] p-3.5 shadow-[0_6px_20px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#7C3AED] shrink-0" />
                <span className="font-heading text-lg sm:text-xl font-extrabold text-[#101214] leading-none">
                  {skillGapsCount}
                </span>
              </div>
              <div className="mt-1.5 text-[11px] font-medium text-[#6B7280]">
                Skill Gaps
              </div>
            </div>
          </div>
        </div>

        {/* Right: Soft Violet AI Agent Live Pipeline Card */}
        <div className="xl:col-span-4 rounded-[22px] border border-[#D9CCF8] bg-[#F5F2FF] p-4 sm:p-5 shadow-[0_8px_30px_rgba(109,40,217,0.05)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#D9CCF8]/80">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-[#101214] text-white">
                  <Sparkles className="h-3.5 w-3.5 text-[#E3FC6D]" />
                </div>
                <span className="font-heading text-sm font-bold text-[#101214] truncate">
                  AI Agent: Live Pipeline
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowPipelinePanel((prev) => !prev)}
                title="Expand full 12-stage pipeline telemetry & search budgets"
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-heading text-[11px] font-semibold transition cursor-pointer shrink-0 ${
                  isAgentRunning
                    ? "bg-[#E3FC6D] border-[#C6E832] text-[#0E1012]"
                    : agentError
                    ? "bg-[#FEF9E7] border-[#F5DFA0] text-[#7A5908]"
                    : "bg-white border-black/[0.08] text-[#101214] hover:bg-[#F3FCDA]"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isAgentRunning
                      ? "bg-[#101214] animate-ping"
                      : "bg-[#65B811]"
                  }`}
                />
                <span>
                  {isAgentRunning
                    ? "Running"
                    : agentError
                    ? "Alert"
                    : "Live Ready"}
                </span>
              </button>
            </div>

            {/* 5-Stage Clean Checklist */}
            <ul className="mt-3 space-y-1.5">
              {compactPipelineSteps.map((step, idx) => (
                <li
                  key={idx}
                  className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-colors ${
                    step.state === "active"
                      ? "bg-[#E3FC6D] border border-[#C6E832] font-semibold text-[#0E1012]"
                      : step.state === "done"
                      ? "text-[#101214]"
                      : "text-[#6B7280]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {step.state === "done" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 fill-[#101214] text-[#F5F2FF]" />
                    ) : step.state === "active" ? (
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#0E1012]" />
                    ) : (
                      <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/20 bg-white/70" />
                    )}
                    <span className="truncate">{step.label}</span>
                  </div>

                  {step.badge && (
                    <span className="shrink-0 font-heading text-[11px] font-bold text-[#101214]">
                      {step.badge}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-3 pt-2.5 border-t border-[#D9CCF8]/80 flex items-center justify-between text-[11px] font-semibold text-[#4B5563]">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  realtimeConnected ? "bg-emerald-500 animate-pulse" : "bg-black/25"
                }`}
              />
              {realtimeConnected
                ? liveUpdatesCount > 0
                  ? `SSE Live (${liveUpdatesCount} synced)`
                  : "SSE Live Stream On"
                : lastSyncAt
                ? `Synced ${new Date(lastSyncAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`
                : "Multi-provider engine"}
            </span>
            <button
              type="button"
              onClick={() => setShowPipelinePanel((prev) => !prev)}
              className="inline-flex items-center gap-1 hover:underline text-[#101214] cursor-pointer"
            >
              <Activity className="h-3 w-3" />
              <span>{showPipelinePanel ? "Hide Logs" : "12 Stages & Budgets"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* 2. UNIFIED SEARCH BAR WITH LOCATION CHIP & DARK CTA   */}
      {/* ===================================================== */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 bg-white rounded-2xl border border-black/[0.08] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-2 focus-within:border-[#94D814] focus-within:ring-2 focus-within:ring-[#DDFB4B]/40 transition-all">
        <div className="flex items-center flex-1 px-2.5">
          <Search className="h-4 w-4 text-[#4B5563] stroke-[2] mr-2.5 shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Search roles, skills, or companies... (e.g., "ML Intern", "Data Science")'
            className="w-full bg-transparent text-xs sm:text-sm font-medium text-[#101214] placeholder-[#9CA3AF] outline-none py-1.5"
          />
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 md:border-l border-black/[0.07] md:pl-2.5">
          <button
            type="button"
            onClick={() => setShowLocationPanel((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#C7E938]/60 bg-[#F3FCDA] hover:bg-[#E3FC6D] px-3 py-1.5 font-heading text-xs font-semibold text-[#0E1012] transition cursor-pointer shrink-0"
            title="Configure GPS, City & Work Mode Discovery"
          >
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="max-w-[140px] truncate">
              {selectedLocationMode === "REMOTE"
                ? "Remote Only"
                : selectedLocationMode === "VICINITY"
                ? `Vicinity: ${activeLocationPref.city || "Resume"}`
                : selectedLocationMode === "NEAR_ME"
                ? `Near ${activeLocationPref.city || "Me"}`
                : selectedLocationMode === "IN_MY_CITY"
                ? `City: ${activeLocationPref.city || "My City"}`
                : selectedLocationMode === "SELECTED_CITY"
                ? selectedCityForDiscovery
                : "Global (All)"}
            </span>
            <ChevronDown
              className={`h-3 w-3 transition-transform ${
                showLocationPanel ? "rotate-180" : ""
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => {
              handleApplyFilters();
              onRunAgentDiscovery(searchInput, searchMode, {
                budget: searchBudget,
                locationMode: selectedLocationMode,
                selectedCity:
                  selectedLocationMode === "SELECTED_CITY"
                    ? selectedCityForDiscovery
                    : activeLocationPref.city,
              });
            }}
            disabled={isAgentRunning}
            className="rounded-full bg-[#101214] text-white font-semibold shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] hover:-translate-y-0.5 px-4 py-1.5 flex items-center gap-1.5 font-heading text-xs sm:text-sm transition-all shrink-0 disabled:opacity-60 cursor-pointer"
          >
            <Sparkles
              className={`h-3.5 w-3.5 text-[#E3FC6D] ${
                isAgentRunning ? "animate-spin" : ""
              }`}
            />
            <span>{isAgentRunning ? "Searching..." : "Search"}</span>
          </button>
        </div>
      </div>

      {/* ===================================================== */}
      {/* 3. QUICK-FILTER PILLS + MORE FILTERS + SORT PILL      */}
      {/* ===================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Resume / Local Vicinity Quick Pill */}
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("ALL");
              setSelectedWorkMode("ALL");
              setSelectedLocationMode("VICINITY");
              handleApplyFilters({
                category: "ALL",
                workMode: "ALL",
                locationMode: "VICINITY",
              });
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-heading text-xs transition-all cursor-pointer ${
              selectedLocationMode === "VICINITY" &&
              selectedCategory === "ALL" &&
              selectedWorkMode === "ALL"
                ? "bg-[#E3FC6D] text-[#0E1012] border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                : "bg-white text-[#4B5563] border-black/[0.08] hover:bg-[#F4F5F0] hover:text-[#101214] font-medium"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>
              {activeLocationPref.city
                ? `Vicinity: ${activeLocationPref.city}`
                : "My Vicinity"}
            </span>
          </button>

          {/* All / Global Pill */}
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("ALL");
              setSelectedWorkMode("ALL");
              setSelectedPlatform("ALL");
              setSelectedLocationMode("ALL");
              handleApplyFilters({
                category: "ALL",
                workMode: "ALL",
                platform: "ALL",
                locationMode: "ALL",
              });
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-heading text-xs transition-all cursor-pointer ${
              isAllQuickActive
                ? "bg-[#E3FC6D] text-[#0E1012] border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                : "bg-white text-[#4B5563] border-black/[0.08] hover:bg-[#F4F5F0] hover:text-[#101214] font-medium"
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>All ({opportunities.length.toLocaleString()})</span>
          </button>

          {/* Internship */}
          <button
            type="button"
            onClick={() => {
              const next = selectedCategory === "Internship" ? "ALL" : "Internship";
              setSelectedCategory(next);
              handleApplyFilters({ category: next });
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-heading text-xs transition-all cursor-pointer ${
              selectedCategory === "Internship"
                ? "bg-[#E3FC6D] text-[#0E1012] border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                : "bg-white text-[#4B5563] border-black/[0.08] hover:bg-[#F4F5F0] hover:text-[#101214] font-medium"
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            <span>Internship</span>
          </button>

          {/* Full-time / Entry-level */}
          <button
            type="button"
            onClick={() => {
              const next =
                selectedCategory === "Entry-level" ? "ALL" : "Entry-level";
              setSelectedCategory(next);
              handleApplyFilters({ category: next });
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-heading text-xs transition-all cursor-pointer ${
              selectedCategory === "Entry-level"
                ? "bg-[#E3FC6D] text-[#0E1012] border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                : "bg-white text-[#4B5563] border-black/[0.08] hover:bg-[#F4F5F0] hover:text-[#101214] font-medium"
            }`}
          >
            <BriefcaseBusiness className="h-3.5 w-3.5" />
            <span>Full-time</span>
          </button>

          {/* Remote */}
          <button
            type="button"
            onClick={() => {
              const next = selectedWorkMode === "Remote" ? "ALL" : "Remote";
              setSelectedWorkMode(next);
              handleApplyFilters({ workMode: next });
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-heading text-xs transition-all cursor-pointer ${
              selectedWorkMode === "Remote"
                ? "bg-[#E3FC6D] text-[#0E1012] border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                : "bg-white text-[#4B5563] border-black/[0.08] hover:bg-[#F4F5F0] hover:text-[#101214] font-medium"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Remote</span>
          </button>

          {/* Platform Filters: LinkedIn / Naukri / Company Boards / Public APIs */}
          {[
            { id: "LINKEDIN", label: "LinkedIn" },
            { id: "NAUKRI", label: "Naukri" },
            { id: "BOARDS", label: "Company Boards" },
            { id: "PUBLIC", label: "Public APIs" },
          ].map((plat) => (
            <button
              key={plat.id}
              type="button"
              onClick={() => {
                const next = selectedPlatform === plat.id ? "ALL" : plat.id;
                setSelectedPlatform(next);
                handleApplyFilters({ platform: next });
              }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-heading text-xs transition-all cursor-pointer ${
                selectedPlatform === plat.id
                  ? "bg-[#E3FC6D] text-[#0E1012] border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                  : "bg-white text-[#4B5563] border-black/[0.08] hover:bg-[#F4F5F0] hover:text-[#101214] font-medium"
              }`}
            >
              <Database className="h-3 w-3" />
              <span>{plat.label}</span>
            </button>
          ))}

          {/* Hybrid */}
          <button
            type="button"
            onClick={() => {
              const next = selectedWorkMode === "Hybrid" ? "ALL" : "Hybrid";
              setSelectedWorkMode(next);
              handleApplyFilters({ workMode: next });
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-heading text-xs transition-all cursor-pointer ${
              selectedWorkMode === "Hybrid"
                ? "bg-[#E3FC6D] text-[#0E1012] border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                : "bg-white text-[#4B5563] border-black/[0.08] hover:bg-[#F4F5F0] hover:text-[#101214] font-medium"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Hybrid</span>
          </button>

          {/* Onsite */}
          <button
            type="button"
            onClick={() => {
              const next = selectedWorkMode === "On-site" ? "ALL" : "On-site";
              setSelectedWorkMode(next);
              handleApplyFilters({ workMode: next });
            }}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-heading text-xs transition-all cursor-pointer ${
              selectedWorkMode === "On-site"
                ? "bg-[#E3FC6D] text-[#0E1012] border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                : "bg-white text-[#4B5563] border-black/[0.08] hover:bg-[#F4F5F0] hover:text-[#101214] font-medium"
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Onsite</span>
          </button>

          {/* Test Project Fit Pill */}
          {onOpenProjectLab && (
            <button
              type="button"
              onClick={onOpenProjectLab}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#D9CCF8] bg-[#F5F2FF] hover:bg-[#E3FC6D] hover:border-[#C6E832] px-3 py-1.5 font-heading text-xs font-semibold text-[#101214] transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#7C3AED]" />
              <span>Test Project</span>
            </button>
          )}

          {/* More Filters Drawer Trigger */}
          <button
            type="button"
            onClick={() => setShowMoreFilters((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-heading text-xs transition-all cursor-pointer ${
              showMoreFilters ||
              showAiPanel ||
              selectedDeadline !== "ALL" ||
              selectedLocation !== "ALL" ||
              viewMode !== "ALL"
                ? "bg-[#FEF9E7] text-[#7A5908] border-[#F5DFA0] font-semibold"
                : "bg-white text-[#4B5563] border-black/[0.08] hover:bg-[#F4F5F0] hover:text-[#101214] font-medium"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>More Filters</span>
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                showMoreFilters ? "rotate-180" : ""
              }`}
            />
          </button>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#101214] cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

        {/* Right: Sort Pill */}
        <div className="relative" ref={sortDropdownRef}>
          <button
            type="button"
            onClick={() => setSortDropdownOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] px-3.5 py-1.5 font-heading text-xs font-medium transition-all cursor-pointer"
          >
            <span className="text-[#6B7280] font-medium">Sort:</span>
            <span className="font-semibold">
              {sortOptions.find((s) => s.value === selectedSort)?.label ||
                "Best Match"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-[#4B5563]" />
          </button>

          {sortDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-black/[0.08] bg-white p-1.5 shadow-[0_14px_38px_rgba(15,23,42,0.12)] z-30">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setSelectedSort(opt.value);
                    setSortDropdownOpen(false);
                    handleApplyFilters({ sortBy: opt.value });
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs transition-colors ${
                    selectedSort === opt.value
                      ? "bg-[#E3FC6D] text-[#0E1012] font-semibold"
                      : "text-[#4B5563] hover:bg-[#F4F5F0] hover:text-[#101214] font-medium"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ===================================================== */}
      {/* 4. ON-DEMAND "MORE FILTERS & AGENT TOOLS" DRAWER      */}
      {/* ===================================================== */}
      {showMoreFilters && (
        <section
          aria-label="More Filters and Agent Controls"
          className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-4 sm:p-5 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/[0.07] pb-3.5">
            {/* View Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                View:
              </span>
              <div className="flex items-center rounded-full border border-black/[0.08] bg-[#FAFBF7] p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setViewMode("ALL")}
                  className={`rounded-full px-3 py-1 flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === "ALL"
                      ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_8px_rgba(205,238,54,0.28)] font-semibold"
                      : "text-[#64748B] hover:text-[#101214] border border-transparent"
                  }`}
                >
                  <LayoutGrid className="h-3 w-3" />
                  <span>Split Feed</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("GROUPED")}
                  className={`rounded-full px-3 py-1 flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === "GROUPED"
                      ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_8px_rgba(205,238,54,0.28)] font-semibold"
                      : "text-[#64748B] hover:text-[#101214] border border-transparent"
                  }`}
                >
                  <Layers className="h-3 w-3" />
                  <span>By Direction</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("BRIEF")}
                  className={`rounded-full px-3 py-1 flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === "BRIEF"
                      ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_8px_rgba(205,238,54,0.28)] font-semibold"
                      : "text-[#64748B] hover:text-[#101214] border border-transparent"
                  }`}
                >
                  <FileText className="h-3 w-3" />
                  <span>Career Brief</span>
                </button>
              </div>
            </div>

            {/* Power Tools Shortcut Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAiPanel((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs transition-all cursor-pointer ${
                  showAiPanel
                    ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                    : "bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] font-medium"
                }`}
              >
                <Brain className="h-3.5 w-3.5" />
                <span>AI Semantic Lab</span>
              </button>

              {onTriggerBackgroundSync && (
                <button
                  type="button"
                  onClick={onTriggerBackgroundSync}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
                >
                  <Database className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Syncing..." : "Sync Feeds"}</span>
                </button>
              )}

              {onUploadNewResume && (
                <button
                  type="button"
                  onClick={onUploadNewResume}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] px-3.5 py-1.5 text-xs font-medium transition-all cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Resume</span>
                </button>
              )}

              {onOpenSourcesModal && (
                <button
                  type="button"
                  onClick={onOpenSourcesModal}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#F5DFA0] bg-[#FEF9E7] hover:bg-[#F3FCDA] hover:border-[#C7E938] text-[#101214] px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer"
                >
                  <Radio className="h-3.5 w-3.5" />
                  <span>Sources & URL Import</span>
                </button>
              )}

              {onOpenCareerOutlook && (
                <button
                  type="button"
                  onClick={onOpenCareerOutlook}
                  className="inline-flex items-center gap-1 rounded-full border border-black/[0.09] bg-[#FAFBF7] px-3.5 py-1.5 text-xs font-semibold text-[#101214] hover:bg-[#E3FC6D] hover:border-[#C6E832] transition-all cursor-pointer"
                >
                  <span>Career Outlook</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Specialized Categories */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2">
                Track & Program Type
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["ALL", "Research", "Fellowship", "Hackathon"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(cat);
                      handleApplyFilters({ category: cat });
                    }}
                    className={`rounded-full px-3 py-1 transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                        : "bg-white text-[#4B5563] border border-black/[0.08] hover:bg-[#F4F5F0] hover:text-[#101214] font-medium"
                    }`}
                  >
                    {cat === "ALL" ? "Any Type" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Region / City Filter */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2">
                Region Hub
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["ALL", "India", "Bengaluru", "Hyderabad", "United States", "San Francisco"].map(
                  (loc) => (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => {
                        setSelectedLocation(loc);
                        handleApplyFilters({ location: loc });
                      }}
                      className={`rounded-full px-3 py-1 transition-all cursor-pointer ${
                        selectedLocation === loc
                          ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                          : "bg-white text-[#4B5563] border border-black/[0.08] hover:bg-[#F4F5F0] hover:text-[#101214] font-medium"
                      }`}
                    >
                      {loc === "ALL" ? "Everywhere" : loc}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Deadline Window */}
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mb-2">
                Deadline Window
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: "Any", val: "ALL" },
                  { label: "≤14 Days", val: "14" },
                  { label: "≤30 Days", val: "30" },
                  { label: "≤60 Days", val: "60" },
                ].map((d) => (
                  <button
                    key={d.val}
                    type="button"
                    onClick={() => {
                      setSelectedDeadline(d.val);
                      handleApplyFilters({ deadline: d.val });
                    }}
                    className={`rounded-full px-3 py-1 transition-all cursor-pointer ${
                      selectedDeadline === d.val
                        ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                        : "bg-white text-[#4B5563] border border-black/[0.08] hover:bg-[#F4F5F0] hover:text-[#101214] font-medium"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Personalized Role Filters */}
          {activeExpandedRoles.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-black/[0.07]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] mr-1">
                Role Directions:
              </span>
              {activeExpandedRoles.slice(0, 6).map((role) => (
                <div
                  key={role.id || role.title}
                  className="inline-flex items-center gap-1 rounded-full bg-[#FAFBF7] border border-black/[0.08] px-3 py-1 text-xs font-medium text-[#101214] hover:border-black/[0.15] transition"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput(role.title);
                      handleApplyFilters({ query: role.title });
                    }}
                    className="hover:underline cursor-pointer"
                  >
                    {role.title} ({role.relevanceEstimate || Math.round(role.confidence * 100)}%)
                  </button>
                  {onDismissRoleFamily && (
                    <button
                      type="button"
                      onClick={() => onDismissRoleFamily(role.title)}
                      className="text-[#64748B] hover:text-rose-600 ml-0.5 cursor-pointer"
                      title={`Exclude ${role.title}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              {onResetPersonalization && (
                <button
                  type="button"
                  onClick={onResetPersonalization}
                  className="ml-auto text-xs font-semibold text-[#64748B] hover:text-[#101214] cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* ===================================================== */}
      {/* 5. ON-DEMAND LOCATION, FULL PIPELINE & AI LAB DRAWERS */}
      {/* ===================================================== */}
      {(showLocationPanel ||
        editingLocation ||
        Boolean(geoStatusMessage) ||
        Boolean(geoErrorState)) && (
        <section
          aria-label="Location Intelligence Bar"
          className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] p-4 sm:p-5 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl border border-[#C6E832] bg-[#E3FC6D] text-[#0E1012] shadow-[0_2px_10px_rgba(205,238,54,0.28)] flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-[#101214]">
                    {activeLocationPref.displayLabel ||
                      activeLocationPref.city ||
                      "Location Not Set"}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      activeLocationPref.source === "BROWSER_GPS"
                        ? "bg-[#E3FC6D] border-[#C6E832] text-[#0E1012]"
                        : activeLocationPref.source === "MANUAL"
                        ? "bg-[#FEF9E7] border-[#F5DFA0] text-[#101214]"
                        : "bg-[#FAFBF7] border-black/[0.08] text-[#64748B]"
                    }`}
                  >
                    {activeLocationPref.source === "BROWSER_GPS"
                      ? "Verified Browser Geolocation"
                      : activeLocationPref.source === "MANUAL"
                      ? "Manual City Preference"
                      : activeLocationPref.source === "PROFILE"
                      ? "From Resume Profile"
                      : "Not Detected"}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  {activeLocationPref.cityLatitude !== null &&
                  activeLocationPref.cityLatitude !== undefined &&
                  activeLocationPref.cityLongitude !== null &&
                  activeLocationPref.cityLongitude !== undefined
                    ? `Coordinates active (${activeLocationPref.cityLatitude.toFixed(
                        2
                      )}°, ${activeLocationPref.cityLongitude.toFixed(
                        2
                      )}°) — Haversine distance enabled.`
                    : "Distance badges stay hidden unless candidate & job coordinates are verified."}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDetectBrowserLocation}
                disabled={detectingGeo}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#101214] text-white font-semibold shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] hover:-translate-y-0.5 px-3.5 py-1.5 text-xs transition-all cursor-pointer disabled:opacity-50"
              >
                <Navigation
                  className={`h-3.5 w-3.5 ${detectingGeo ? "animate-spin" : ""}`}
                />
                <span>
                  {detectingGeo ? "Detecting GPS..." : "Use Browser Location"}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedLocationMode("NEAR_ME");
                  const targetCity = activeLocationPref.city || "India";
                  handleApplyFilters({
                    locationMode: "NEAR_ME",
                    selectedCity: targetCity,
                  });
                  onRunAgentDiscovery(
                    `${searchInput || "Software & AI Intern"} ${targetCity}`.trim(),
                    searchMode,
                    {
                      budget: searchBudget,
                      locationMode: "NEAR_ME",
                      selectedCity: targetCity,
                    }
                  );
                }}
                disabled={isAgentRunning}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#C6E832] bg-[#E3FC6D] hover:bg-[#DDFB4B] px-3.5 py-1.5 text-xs font-semibold text-[#0E1012] shadow-[0_2px_10px_rgba(205,238,54,0.28)] transition cursor-pointer disabled:opacity-50"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Search Nearby</span>
              </button>

              <button
                type="button"
                onClick={() => setEditingLocation((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] px-3.5 py-1.5 text-xs font-medium transition cursor-pointer"
              >
                <span>{editingLocation ? "Hide City Input" : "Edit City"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowLocationPanel(false);
                  setEditingLocation(false);
                }}
                className="rounded-full p-1.5 text-[#64748B] hover:text-[#101214] hover:bg-[#F4F5F0] transition cursor-pointer"
                aria-label="Close location panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {geoStatusMessage && (
            <div className="rounded-xl border border-[#C7E938]/55 bg-[#F3FCDA]/80 px-3.5 py-2.5 text-xs text-[#101214] flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#65B811]" />
                {geoStatusMessage}
              </span>
              <button
                type="button"
                onClick={() => setGeoStatusMessage(null)}
                className="font-semibold hover:underline text-[11px] cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {geoErrorState && (
            <div className="rounded-xl border border-[#F5DFA0] bg-[#FEF9E7] px-3.5 py-2.5 text-xs text-[#101214] flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-[#9A7400]" />
                {geoErrorState}
              </span>
              <button
                type="button"
                onClick={() => setEditingLocation(true)}
                className="font-semibold underline ml-2 shrink-0 cursor-pointer"
              >
                Select City Manually
              </button>
            </div>
          )}

          {editingLocation && (
            <div className="rounded-2xl border border-black/[0.07] bg-[#FAFBF7] p-3.5 space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[#101214]">Preferred city:</span>
                <input
                  type="text"
                  value={manualCityInput}
                  onChange={(e) => setManualCityInput(e.target.value)}
                  placeholder="e.g., Bengaluru, San Francisco, Mumbai..."
                  className="rounded-xl border border-black/[0.10] bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 px-3 py-1.5 text-xs text-[#101214] outline-none w-64 transition"
                />
                <button
                  type="button"
                  onClick={() => handleSaveManualLocation(manualCityInput)}
                  className="rounded-full border border-[#C6E832] bg-[#E3FC6D] text-[#0E1012] px-3.5 py-1.5 font-semibold hover:bg-[#DDFB4B] shadow-[0_2px_8px_rgba(205,238,54,0.25)] transition cursor-pointer"
                >
                  Save Location
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-medium text-[#64748B] mr-1">
                  Quick hubs:
                </span>
                {VERIFIED_CITY_CHOICES.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      setManualCityInput(city);
                      handleSaveManualLocation(city);
                    }}
                    className={`rounded-full px-3 py-0.5 text-[11px] transition cursor-pointer ${
                      activeLocationPref.city.toLowerCase() === city.toLowerCase()
                        ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] font-semibold"
                        : "bg-white text-[#4B5563] border border-black/[0.08] hover:bg-[#F4F5F0] hover:text-[#101214] font-medium"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5 pt-2.5 border-t border-black/[0.07]">
            {[
              {
                mode: "VICINITY" as LocationDiscoveryMode,
                label: `Nearby Vicinity${
                  activeLocationPref.city ? ` (${activeLocationPref.city} + Remote)` : ""
                }`,
              },
              { mode: "ALL" as LocationDiscoveryMode, label: "All Locations (Global)" },
              {
                mode: "NEAR_ME" as LocationDiscoveryMode,
                label: `Within Radius Only${
                  activeLocationPref.city ? ` (${activeLocationPref.city})` : ""
                }`,
              },
              {
                mode: "IN_MY_CITY" as LocationDiscoveryMode,
                label: `In my city${
                  activeLocationPref.city ? ` (${activeLocationPref.city})` : ""
                }`,
              },
              {
                mode: "SELECTED_CITY" as LocationDiscoveryMode,
                label: "Selected-city discovery",
              },
            ].map((item) => (
              <button
                key={item.mode}
                type="button"
                onClick={() => handleSelectLocationDiscoveryMode(item.mode)}
                className={`rounded-full px-3 py-1 text-xs transition-all cursor-pointer ${
                  selectedLocationMode === item.mode
                    ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                    : "bg-white text-[#4B5563] border border-black/[0.08] hover:bg-[#F4F5F0] hover:text-[#101214] font-medium"
                }`}
              >
                {item.label}
              </button>
            ))}

            {selectedLocationMode === "SELECTED_CITY" && (
              <div className="flex flex-wrap items-center gap-1.5">
                <select
                  aria-label="Select discovery city"
                  value={
                    VERIFIED_CITY_CHOICES.includes(selectedCityForDiscovery)
                      ? selectedCityForDiscovery
                      : "__CUSTOM__"
                  }
                  onChange={(e) => {
                    if (e.target.value === "__CUSTOM__") return;
                    setSelectedCityForDiscovery(e.target.value);
                    handleApplyFilters({
                      locationMode: "SELECTED_CITY",
                      selectedCity: e.target.value,
                    });
                  }}
                  className="rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 px-3 py-1 text-xs font-semibold text-[#101214] outline-none"
                >
                  {VERIFIED_CITY_CHOICES.filter((c) => c !== "Remote").map((city) => (
                    <option key={city} value={city}>
                      City: {city}
                    </option>
                  ))}
                  {!VERIFIED_CITY_CHOICES.includes(selectedCityForDiscovery) && (
                    <option value="__CUSTOM__">
                      Custom: {selectedCityForDiscovery}
                    </option>
                  )}
                </select>
                <input
                  type="text"
                  aria-label="Or type custom city state country"
                  placeholder="Any city, state or country..."
                  value={selectedCityForDiscovery}
                  onChange={(e) => setSelectedCityForDiscovery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && selectedCityForDiscovery.trim()) {
                      handleApplyFilters({
                        locationMode: "SELECTED_CITY",
                        selectedCity: selectedCityForDiscovery.trim(),
                      });
                    }
                  }}
                  className="rounded-xl border border-black/[0.10] bg-[#FAFBF7] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 px-3 py-1 text-xs font-medium text-[#101214] outline-none w-48 transition"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedCityForDiscovery.trim()) return;
                    handleApplyFilters({
                      locationMode: "SELECTED_CITY",
                      selectedCity: selectedCityForDiscovery.trim(),
                    });
                  }}
                  className="rounded-full border border-[#C6E832] bg-[#E3FC6D] px-3 py-1 text-xs font-semibold text-[#0E1012] cursor-pointer hover:bg-[#DDFB4B] transition"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {(showPipelinePanel ||
        isAgentRunning ||
        Boolean(agentError) ||
        wasSearchCancelled) && (
        <LiveDiscoveryActivityPanel
          isRunning={isAgentRunning}
          liveEvents={liveEvents}
          latestRun={latestRun}
          error={agentError}
          wasCancelled={wasSearchCancelled}
          budget={searchBudget}
          onChangeBudget={setSearchBudget}
          onStartLiveDiscovery={(expandRoles) => {
            onRunAgentDiscovery(searchInput, searchMode, {
              budget: expandRoles
                ? {
                    ...searchBudget,
                    maxRounds: Math.min(4, searchBudget.maxRounds + 1),
                    queriesPerRound: Math.min(8, searchBudget.queriesPerRound + 2),
                  }
                : searchBudget,
              locationMode: selectedLocationMode,
              selectedCity:
                selectedLocationMode === "SELECTED_CITY"
                  ? selectedCityForDiscovery
                  : activeLocationPref.city,
              expandRoles,
            });
          }}
          onCancelDiscovery={() => onCancelAgentDiscovery?.()}
          searchMode={searchMode}
        />
      )}

      <AiIntelligencePanel
        isOpen={showAiPanel}
        onClose={() => setShowAiPanel(false)}
        userProfile={userProfile}
        capabilityMap={capabilityMap}
        expandedRoles={expandedRoles}
        opportunities={opportunities}
        rankingMetrics={rankingMetrics}
        searchMode={searchMode}
        onInspectOpportunity={(opp, evalRes) =>
          onInspectOpportunity(opp, evalRes, "why")
        }
        onDismissRoleFamily={onDismissRoleFamily}
      />

      {/* ===================================================== */}
      {/* 6. MASTER-DETAIL SPLIT WORKSPACE / BRIEF / GROUPED    */}
      {/* ===================================================== */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] animate-pulse p-4 flex items-center gap-3.5"
              >
                <div className="h-11 w-11 rounded-2xl bg-[#EEF0E9] shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 rounded-lg bg-[#EEF0E9]" />
                  <div className="h-3 w-1/2 rounded-lg bg-[#F4F5F0]" />
                  <div className="h-5 w-2/3 rounded-full bg-[#F4F5F0]" />
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-7 bg-white border border-black/[0.07] rounded-[22px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] animate-pulse p-6 h-80" />
        </div>
      ) : opportunities.length === 0 ? (
        <div className="bg-white border border-black/[0.07] rounded-[24px] shadow-[0_8px_30px_rgba(15,23,42,0.045)] flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C6E832] bg-[#E3FC6D] text-[#0E1012] shadow-[0_4px_14px_rgba(205,238,54,0.28)]">
            <Compass className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-[#101214]">
            No verified opportunities found matching those filters.
          </h3>
          <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-[#64748B]">
            Try running an expanded live discovery search or clearing your active
            location/type filters.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="rounded-full bg-[#101214] text-white font-semibold shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] hover:-translate-y-0.5 transition-all px-5 py-2.5 text-xs sm:text-sm cursor-pointer"
            >
              Reset All Filters
            </button>
            <button
              type="button"
              onClick={() =>
                onRunAgentDiscovery("Software Engineering Intern", searchMode, {
                  budget: searchBudget,
                  expandRoles: true,
                })
              }
              className="rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] transition-all px-5 py-2.5 text-xs sm:text-sm font-medium cursor-pointer"
            >
              Expand Live Discovery
            </button>
          </div>
        </div>
      ) : viewMode === "BRIEF" && userProfile ? (
        <PersonalizedCareerBriefView
          brief={generatePersonalizedCareerBrief(
            userProfile,
            opportunities,
            careerOutlook || undefined
          )}
          onInspectOpportunity={onInspectOpportunity}
          onSaveToTracker={onSaveToTracker}
          onViewAllOpportunities={() => setViewMode("ALL")}
          onReopenCareerOutlook={onOpenCareerOutlook}
          savedOpportunityIds={savedOpportunityIds}
        />
      ) : viewMode === "GROUPED" ? (
        <div className="space-y-8">
          {groupOpportunitiesByCareerDirection(
            opportunities,
            careerOutlook?.directions || []
          ).map((group, gIdx) => (
            <div key={gIdx} className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-black/[0.07] pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#94D814] ring-4 ring-[#E3FC6D]/50" />
                  <h3 className="text-lg font-bold text-[#101214]">
                    {group.directionTitle}
                  </h3>
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                      group.evidenceStrength === "Strong evidence"
                        ? "bg-[#E3FC6D] border-[#C6E832] text-[#0E1012]"
                        : "bg-[#FEF9E7] border-[#F5DFA0] text-[#101214]"
                    }`}
                  >
                    {group.evidenceStrength}
                  </span>
                </div>
                <span className="text-xs font-medium text-[#64748B]">
                  {group.opportunities.length}{" "}
                  {group.opportunities.length === 1
                    ? "opportunity"
                    : "opportunities"}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                {group.opportunities.map(
                  ({ opportunity, evaluation, hasPrepPlan }) => (
                    <OpportunityCard
                      key={opportunity.id}
                      opportunity={opportunity}
                      evaluation={evaluation}
                      hasPrepPlan={hasPrepPlan}
                      isSaved={savedOpportunityIds.includes(opportunity.id)}
                      onInspect={onInspectOpportunity}
                      onSaveToTracker={onSaveToTracker}
                      onFeedback={onFeedback}
                    />
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Split Master-Detail Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column: Compact Scannable Opportunity Cards */}
          <div className="lg:col-span-5 space-y-3">
            {opportunities.slice(0, visibleLimit).map(({ opportunity, evaluation }) => {
              const isSelected = selectedItem?.opportunity.id === opportunity.id;
              const isSaved = savedOpportunityIds.includes(opportunity.id);
              const discoveredMs = opportunity.discoveredAt
                ? new Date(opportunity.discoveredAt).getTime()
                : opportunity.fetchedAt
                ? new Date(opportunity.fetchedAt).getTime()
                : 0;
              const isNew =
                discoveredMs > 0 &&
                (Date.now() - discoveredMs) / (1000 * 60 * 60) <= 48;
              const matchPct = Math.max(
                0,
                Math.min(100, Math.round(evaluation.overallScore))
              );
              const topSkills = opportunity.requiredSkills.slice(0, 3);
              const extraSkillsCount = Math.max(
                0,
                opportunity.requiredSkills.length - 3
              );

              return (
                <article
                  key={opportunity.id}
                  onClick={() => setSelectedOppId(opportunity.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedOppId(opportunity.id);
                    }
                  }}
                  className={`group rounded-[22px] p-4 transition-all cursor-pointer border ${
                    isSelected
                      ? "bg-[#F3FCDA]/85 border-[#94D814] shadow-[0_12px_34px_rgba(148,216,20,0.16)] ring-2 ring-[#E3FC6D]/60"
                      : "bg-white border-black/[0.07] shadow-[0_8px_30px_rgba(15,23,42,0.045)] hover:shadow-[0_12px_34px_rgba(15,23,42,0.075)] hover:border-black/[0.12] hover:-translate-y-0.5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <CompanyLogo
                        name={opportunity.organization}
                        size={42}
                        className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-2xl border border-black/[0.08] bg-[#FAFBF7]"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="text-sm sm:text-[15px] font-bold text-[#101214] leading-snug truncate">
                            {opportunity.title}
                          </h3>
                          {isNew && (
                            <span className="shrink-0 rounded-full bg-[#E3FC6D] border border-[#C6E832] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#0E1012]">
                              NEW
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 text-xs font-medium text-[#64748B] truncate">
                          {opportunity.organization} •{" "}
                          {formatShortLocation(opportunity.location)}
                          {opportunity.distanceKm != null
                            ? ` (~${opportunity.distanceKm} km)`
                            : ""}{" "}
                          •{" "}
                          {opportunity.employmentType ||
                            opportunity.workMode ||
                            opportunity.category}
                        </p>

                        {/* Compact Match Ring & Skills Pill Strip */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#F3FCDA]/90 border border-[#C7E938]/60 px-2.5 py-0.5 text-[11px] font-semibold text-[#101214]">
                            <Target className="h-3 w-3 shrink-0 text-[#65B811]" />
                            <span>{matchPct}% Fit</span>
                          </span>

                          {opportunity.sourceName && (
                            <span className="rounded-full bg-[#F5F2FF] border border-[#D9CCF8] px-2.5 py-0.5 text-[10px] font-semibold text-[#4C1D95] max-w-[115px] truncate">
                              {opportunity.sourceName.replace(/\s*\((?:Web Index|Public Feed|Live Feed)\)/i, "")}
                            </span>
                          )}

                          {topSkills.map((sk) => (
                            <span
                              key={sk}
                              className="rounded-full bg-[#FAFBF7] border border-black/[0.07] px-2.5 py-0.5 text-[10.5px] font-medium text-[#4B5563] max-w-[96px] truncate"
                              title={sk}
                            >
                              {sk}
                            </span>
                          ))}

                          {extraSkillsCount > 0 && (
                            <span className="rounded-full bg-white border border-black/[0.08] px-2 py-0.5 text-[11px] font-semibold text-[#64748B]">
                              +{extraSkillsCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <CompactMatchRing percent={matchPct} />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSaveToTracker(opportunity);
                        }}
                        title={isSaved ? "Saved to Tracker" : "Save to Tracker"}
                        aria-label={isSaved ? "Saved to Tracker" : "Save to Tracker"}
                        className={`rounded-full p-1.5 transition-colors cursor-pointer ${
                          isSaved
                            ? "bg-[#101214] text-[#E3FC6D]"
                            : "text-[#64748B] hover:text-[#101214] hover:bg-black/[0.05]"
                        }`}
                      >
                        <Bookmark
                          className={`h-3.5 w-3.5 ${
                            isSaved ? "fill-[#E3FC6D]" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}

            {opportunities.length > visibleLimit && (
              <div className="pt-1 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setVisibleLimit((prev) => prev + 20)}
                  className="flex-1 rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <span>
                    Show More ({(opportunities.length - visibleLimit).toLocaleString()} remaining)
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onTriggerBackgroundSync) onTriggerBackgroundSync();
                  }}
                  title="Refresh feeds"
                  className="rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] p-2.5 transition cursor-pointer"
                >
                  <RotateCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Sticky Interactive Opportunity Detail Card */}
          {selectedItem && (
            <div className="lg:col-span-7 lg:sticky lg:top-16">
              <DiscoverDetailPanel
                opportunity={selectedItem.opportunity}
                evaluation={selectedItem.evaluation}
                hasPrepPlan={selectedItem.hasPrepPlan}
                isSaved={savedOpportunityIds.includes(selectedItem.opportunity.id)}
                candidateSkills={userProfile?.skills || []}
                onInspect={onInspectOpportunity}
                onSaveToTracker={onSaveToTracker}
                onFeedback={onFeedback}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

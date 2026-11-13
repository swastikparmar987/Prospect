"use strict";
"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
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

/** Custom crisp Neo-Brutalist tilted folder vector illustration matching Discover hero. */
function HeroFolderIllustration() {
  return (
    <svg
      width="136"
      height="104"
      viewBox="0 0 136 104"
      fill="none"
      aria-hidden="true"
      className="hidden sm:block shrink-0"
    >
      {/* Top-left playful comic accent ticks */}
      <line x1="18" y1="22" x2="10" y2="12" stroke="#080808" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="28" y1="15" x2="26" y2="4" stroke="#080808" strokeWidth="2.4" strokeLinecap="round" />
      <line x1="39" y1="17" x2="46" y2="7" stroke="#080808" strokeWidth="2.4" strokeLinecap="round" />

      {/* Lilac background document tab */}
      <g transform="rotate(-6 74 52)">
        <rect
          x="30"
          y="20"
          width="84"
          height="58"
          rx="10"
          fill="#EAE2FE"
          stroke="#080808"
          strokeWidth="2.2"
        />
      </g>

      {/* Electric Lime folder back flap */}
      <g transform="rotate(-3 74 58)">
        <path
          d="M24 34C24 29.58 27.58 26 32 26H58L65 34H110C114.42 34 118 37.58 118 42V82C118 86.42 114.42 90 110 90H32C27.58 90 24 86.42 24 82V34Z"
          fill="#E0FB66"
          stroke="#080808"
          strokeWidth="2.2"
        />
      </g>

      {/* Offset hard shadow behind cream front folder */}
      <rect x="29" y="45" width="90" height="47" rx="10" fill="#080808" />

      {/* Warm Cream front pocket */}
      <rect
        x="24"
        y="40"
        width="90"
        height="48"
        rx="10"
        fill="#FDF9F3"
        stroke="#080808"
        strokeWidth="2.2"
      />

      {/* Minimalist briefcase emblem inside pocket */}
      <rect
        x="58"
        y="57"
        width="22"
        height="16"
        rx="3"
        fill="#FFFFFF"
        stroke="#080808"
        strokeWidth="2"
      />
      <path
        d="M65 57V54C65 52.9 65.9 52 67 52H71C72.1 52 73 52.9 73 54V57"
        stroke="#080808"
        strokeWidth="2"
      />
      <line x1="58" y1="64" x2="80" y2="64" stroke="#080808" strokeWidth="1.8" />
    </svg>
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
        <div className="xl:col-span-8 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="font-heading text-3xl sm:text-4xl lg:text-[42px] font-extrabold tracking-[-0.03em] leading-[1.08] text-[#080808]">
                Discover opportunities
                <br />
                <span className="relative inline-block">
                  <span className="relative z-10">that fit you.</span>
                  <span
                    className="absolute left-0 right-0 bottom-0.5 h-3.5 bg-[#E0FB66] -z-0"
                    aria-hidden="true"
                  />
                </span>
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-[#777777] font-medium">
                AI-powered search, live from trusted sources, personalized to your profile.
              </p>
            </div>

            <HeroFolderIllustration />
          </div>

          {/* 4 Snapshot Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* 1. Opportunities Found */}
            <div className="neo-card bg-white p-3 sm:p-3.5">
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-[#080808] shrink-0" />
                  <span className="font-heading text-lg sm:text-xl font-extrabold text-[#080808] leading-none">
                    {opportunities.length.toLocaleString()}
                  </span>
                </div>
                {newCount > 0 && (
                  <span className="rounded-full bg-[#E0FB66] border border-[#080808] px-1.5 py-0.5 font-heading text-[10px] font-extrabold text-[#080808] leading-none">
                    +{newCount} new
                  </span>
                )}
              </div>
              <div className="mt-1.5 text-[11px] font-semibold text-[#777777]">
                Opportunities Found
              </div>
            </div>

            {/* 2. Strong Matches */}
            <div className="neo-card bg-white p-3 sm:p-3.5">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#080808] shrink-0" />
                <span className="font-heading text-lg sm:text-xl font-extrabold text-[#080808] leading-none">
                  {strongMatchesCount}
                </span>
              </div>
              <div className="mt-1.5 text-[11px] font-semibold text-[#777777]">
                Strong Matches
              </div>
            </div>

            {/* 3. Profile Fit */}
            <div className="neo-card bg-white p-3 sm:p-3.5">
              <div className="flex items-center gap-2">
                <BarChart2 className="h-4 w-4 text-[#080808] shrink-0" />
                <span className="font-heading text-lg sm:text-xl font-extrabold text-[#080808] leading-none">
                  {profileFitPct}%
                </span>
              </div>
              <div className="mt-1.5 text-[11px] font-semibold text-[#777777]">
                Profile Fit
              </div>
            </div>

            {/* 4. Skill Gaps */}
            <div className="neo-card bg-white p-3 sm:p-3.5">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#080808] shrink-0" />
                <span className="font-heading text-lg sm:text-xl font-extrabold text-[#080808] leading-none">
                  {skillGapsCount}
                </span>
              </div>
              <div className="mt-1.5 text-[11px] font-semibold text-[#777777]">
                Skill Gaps
              </div>
            </div>
          </div>
        </div>

        {/* Right: Lilac AI Agent Live Pipeline Card */}
        <div className="xl:col-span-4 rounded-2xl border-2 border-[#080808] bg-[#EAE2FE] p-4 shadow-[4px_4px_0px_#080808] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#080808]/15">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#080808] text-white">
                  <Sparkles className="h-3.5 w-3.5 text-[#E0FB66]" />
                </div>
                <span className="font-heading text-sm font-extrabold text-[#080808] truncate">
                  AI Agent: Live Pipeline
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowPipelinePanel((prev) => !prev)}
                title="Expand full 12-stage pipeline telemetry & search budgets"
                className={`inline-flex items-center gap-1.5 rounded-full border border-[#080808] px-2.5 py-0.5 font-heading text-[11px] font-bold transition cursor-pointer shrink-0 ${
                  isAgentRunning
                    ? "bg-[#E0FB66] text-[#080808]"
                    : agentError
                    ? "bg-[#FEF189] text-[#080808]"
                    : "bg-white text-[#080808] hover:bg-[#E0FB66]"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isAgentRunning
                      ? "bg-[#080808] animate-ping"
                      : "bg-[#080808]"
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
            <ul className="mt-2.5 space-y-1.5">
              {compactPipelineSteps.map((step, idx) => (
                <li
                  key={idx}
                  className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                    step.state === "active"
                      ? "bg-[#E0FB66] border border-[#080808] font-bold text-[#080808]"
                      : step.state === "done"
                      ? "text-[#080808]"
                      : "text-[#080808]/55"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {step.state === "done" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 fill-[#080808] text-[#EAE2FE]" />
                    ) : step.state === "active" ? (
                      <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[#080808]" />
                    ) : (
                      <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-[#080808]/35 bg-white/50" />
                    )}
                    <span className="truncate">{step.label}</span>
                  </div>

                  {step.badge && (
                    <span className="shrink-0 font-heading text-[11px] font-extrabold text-[#080808]">
                      {step.badge}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-2.5 pt-2 border-t border-[#080808]/15 flex items-center justify-between text-[11px] font-bold text-[#080808]/80">
            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  realtimeConnected ? "bg-emerald-600 animate-pulse" : "bg-[#080808]/40"
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
              className="inline-flex items-center gap-1 hover:underline text-[#080808] cursor-pointer"
            >
              <Activity className="h-3 w-3" />
              <span>{showPipelinePanel ? "Hide Logs" : "12 Stages & Budgets"}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ===================================================== */}
      {/* 2. UNIFIED SEARCH BAR WITH LOCATION CHIP & BLACK CTA   */}
      {/* ===================================================== */}
      <div className="flex flex-col md:flex-row md:items-center gap-2 bg-white rounded-2xl border-2 border-[#080808] shadow-[4px_4px_0px_#080808] p-2 focus-within:shadow-[4px_4px_0px_#E0FB66] transition-all">
        <div className="flex items-center flex-1 px-2">
          <Search className="h-4.5 w-4.5 text-[#080808] stroke-[2] mr-2.5 shrink-0" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='Search roles, skills, or companies... (e.g., "ML Intern", "Data Science")'
            className="w-full bg-transparent text-sm font-medium text-[#080808] placeholder-[#777777] outline-none py-1.5"
          />
        </div>

        <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 md:border-l-2 border-[#D8D5CE] md:pl-2.5">
          <button
            type="button"
            onClick={() => setShowLocationPanel((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#080808] bg-[#E0FB66] hover:bg-[#FEF189] px-3 py-1.5 font-heading text-xs font-bold text-[#080808] transition cursor-pointer shrink-0"
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
              className={`h-3.5 w-3.5 transition-transform ${
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
            className="rounded-xl bg-[#080808] hover:-translate-y-0.5 text-white px-4 py-2 flex items-center gap-2 font-heading text-xs sm:text-sm font-bold shadow-[2px_2px_0px_#E0FB66] transition-all shrink-0 disabled:opacity-60 cursor-pointer"
          >
            <Sparkles
              className={`h-4 w-4 text-[#E0FB66] ${
                isAgentRunning ? "animate-spin" : ""
              }`}
            />
            <span>{isAgentRunning ? "Searching..." : "Run Adaptive Search"}</span>
          </button>
        </div>
      </div>

      {/* ===================================================== */}
      {/* 3. QUICK-FILTER PILLS + MORE FILTERS + SORT PILL      */}
      {/* ===================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-2">
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
            className={`inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] px-3.5 py-1.5 font-heading text-xs font-bold transition-all cursor-pointer ${
              selectedLocationMode === "VICINITY" &&
              selectedCategory === "ALL" &&
              selectedWorkMode === "ALL"
                ? "bg-[#E0FB66] text-[#080808] shadow-[2px_2px_0px_#080808]"
                : "bg-white text-[#080808] hover:bg-[#FDF9F3]"
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
            className={`inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] px-3.5 py-1.5 font-heading text-xs font-bold transition-all cursor-pointer ${
              isAllQuickActive
                ? "bg-[#E0FB66] text-[#080808] shadow-[2px_2px_0px_#080808]"
                : "bg-white text-[#080808] hover:bg-[#FDF9F3]"
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
            className={`inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] px-3.5 py-1.5 font-heading text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === "Internship"
                ? "bg-[#E0FB66] text-[#080808] shadow-[2px_2px_0px_#080808]"
                : "bg-white text-[#080808] hover:bg-[#FDF9F3]"
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
            className={`inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] px-3.5 py-1.5 font-heading text-xs font-bold transition-all cursor-pointer ${
              selectedCategory === "Entry-level"
                ? "bg-[#E0FB66] text-[#080808] shadow-[2px_2px_0px_#080808]"
                : "bg-white text-[#080808] hover:bg-[#FDF9F3]"
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
            className={`inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] px-3.5 py-1.5 font-heading text-xs font-bold transition-all cursor-pointer ${
              selectedWorkMode === "Remote"
                ? "bg-[#E0FB66] text-[#080808] shadow-[2px_2px_0px_#080808]"
                : "bg-white text-[#080808] hover:bg-[#FDF9F3]"
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Remote</span>
          </button>

          {/* Platform Filters: LinkedIn Only / Naukri Only / Company Boards / Public APIs */}
          {[
            { id: "LINKEDIN", label: "LinkedIn Only" },
            { id: "NAUKRI", label: "Naukri Only" },
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
              className={`inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] px-3 py-1.5 font-heading text-xs font-bold transition-all cursor-pointer ${
                selectedPlatform === plat.id
                  ? "bg-[#E0FB66] text-[#080808] shadow-[2px_2px_0px_#080808]"
                  : "bg-white text-[#080808] hover:bg-[#FDF9F3]"
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
            className={`inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] px-3.5 py-1.5 font-heading text-xs font-bold transition-all cursor-pointer ${
              selectedWorkMode === "Hybrid"
                ? "bg-[#E0FB66] text-[#080808] shadow-[2px_2px_0px_#080808]"
                : "bg-white text-[#080808] hover:bg-[#FDF9F3]"
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
            className={`inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] px-3.5 py-1.5 font-heading text-xs font-bold transition-all cursor-pointer ${
              selectedWorkMode === "On-site"
                ? "bg-[#E0FB66] text-[#080808] shadow-[2px_2px_0px_#080808]"
                : "bg-white text-[#080808] hover:bg-[#FDF9F3]"
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
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-[#EAE2FE] hover:bg-[#E0FB66] px-3.5 py-1.5 font-heading text-xs font-bold text-[#080808] transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Test Project</span>
            </button>
          )}

          {/* More Filters Drawer Trigger */}
          <button
            type="button"
            onClick={() => setShowMoreFilters((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] px-3.5 py-1.5 font-heading text-xs font-bold transition-all cursor-pointer ${
              showMoreFilters ||
              showAiPanel ||
              selectedDeadline !== "ALL" ||
              selectedLocation !== "ALL" ||
              viewMode !== "ALL"
                ? "bg-[#FEF189] text-[#080808] shadow-[2px_2px_0px_#080808]"
                : "bg-white text-[#080808] hover:bg-[#FDF9F3]"
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
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold text-[#777777] hover:text-[#080808] cursor-pointer"
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
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-white px-3.5 py-1.5 font-heading text-xs font-semibold text-[#080808] hover:bg-[#FEF189]/40 transition-colors cursor-pointer"
          >
            <span className="text-[#777777] font-medium">Sort:</span>
            <span className="font-bold">
              {sortOptions.find((s) => s.value === selectedSort)?.label ||
                "Best Match"}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-[#080808]" />
          </button>

          {sortDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-2xl border-2 border-[#080808] bg-white p-1.5 shadow-[4px_4px_0px_#080808] z-30">
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
                      ? "bg-[#E0FB66] text-[#080808] font-bold border border-[#080808]"
                      : "text-[#080808] hover:bg-[#FDF9F3] font-medium"
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
          className="neo-card bg-white p-4 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D8D5CE] pb-3">
            {/* View Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#777777]">
                View:
              </span>
              <div className="flex items-center rounded-full border-2 border-[#080808] bg-[#FDF9F3] p-0.5 text-xs font-heading font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode("ALL")}
                  className={`rounded-full px-3 py-1 flex items-center gap-1 transition cursor-pointer ${
                    viewMode === "ALL"
                      ? "bg-[#E0FB66] text-[#080808] border border-[#080808]"
                      : "text-[#777777] hover:text-[#080808]"
                  }`}
                >
                  <LayoutGrid className="h-3 w-3" />
                  <span>Split Feed</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("GROUPED")}
                  className={`rounded-full px-3 py-1 flex items-center gap-1 transition cursor-pointer ${
                    viewMode === "GROUPED"
                      ? "bg-[#E0FB66] text-[#080808] border border-[#080808]"
                      : "text-[#777777] hover:text-[#080808]"
                  }`}
                >
                  <Layers className="h-3 w-3" />
                  <span>By Direction</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("BRIEF")}
                  className={`rounded-full px-3 py-1 flex items-center gap-1 transition cursor-pointer ${
                    viewMode === "BRIEF"
                      ? "bg-[#E0FB66] text-[#080808] border border-[#080808]"
                      : "text-[#777777] hover:text-[#080808]"
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
                className={`inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] px-3 py-1 font-heading text-xs font-bold transition cursor-pointer ${
                  showAiPanel ? "bg-[#E0FB66]" : "bg-white hover:bg-[#FDF9F3]"
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
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-white hover:bg-[#FDF9F3] px-3 py-1 font-heading text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  <Database className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Syncing..." : "Sync Feeds"}</span>
                </button>
              )}

              {onUploadNewResume && (
                <button
                  type="button"
                  onClick={onUploadNewResume}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-white hover:bg-[#FDF9F3] px-3 py-1 font-heading text-xs font-bold transition cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload Resume</span>
                </button>
              )}

              {onOpenSourcesModal && (
                <button
                  type="button"
                  onClick={onOpenSourcesModal}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-[#FEF189] hover:bg-[#E0FB66] px-3 py-1 font-heading text-xs font-bold transition cursor-pointer"
                >
                  <Radio className="h-3.5 w-3.5" />
                  <span>Sources & URL Import</span>
                </button>
              )}

              {onOpenCareerOutlook && (
                <button
                  type="button"
                  onClick={onOpenCareerOutlook}
                  className="inline-flex items-center gap-1 rounded-full border border-[#080808] bg-[#FDF9F3] px-3 py-1 font-heading text-xs font-bold hover:bg-[#E0FB66] cursor-pointer"
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
              <div className="font-heading text-[11px] font-extrabold uppercase tracking-wider text-[#777777] mb-1.5">
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
                    className={`rounded-full border px-2.5 py-1 font-bold transition cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-[#E0FB66] border-[#080808] text-[#080808]"
                        : "bg-[#FDF9F3] border-[#D8D5CE] hover:border-[#080808]"
                    }`}
                  >
                    {cat === "ALL" ? "Any Type" : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Region / City Filter */}
            <div>
              <div className="font-heading text-[11px] font-extrabold uppercase tracking-wider text-[#777777] mb-1.5">
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
                      className={`rounded-full border px-2.5 py-1 font-bold transition cursor-pointer ${
                        selectedLocation === loc
                          ? "bg-[#E0FB66] border-[#080808] text-[#080808]"
                          : "bg-[#FDF9F3] border-[#D8D5CE] hover:border-[#080808]"
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
              <div className="font-heading text-[11px] font-extrabold uppercase tracking-wider text-[#777777] mb-1.5">
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
                    className={`rounded-full border px-2.5 py-1 font-bold transition cursor-pointer ${
                      selectedDeadline === d.val
                        ? "bg-[#E0FB66] border-[#080808] text-[#080808]"
                        : "bg-[#FDF9F3] border-[#D8D5CE] hover:border-[#080808]"
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
            <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-[#D8D5CE]">
              <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#777777] mr-1">
                Role Directions:
              </span>
              {activeExpandedRoles.slice(0, 6).map((role) => (
                <div
                  key={role.id || role.title}
                  className="inline-flex items-center gap-1 rounded-full bg-white border border-[#080808] px-2.5 py-0.5 text-xs font-bold text-[#080808]"
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
                      className="text-[#777777] hover:text-rose-600 ml-0.5 cursor-pointer"
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
                  className="ml-auto text-xs font-bold text-[#777777] hover:text-[#080808] cursor-pointer"
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
          className="neo-card p-4 space-y-3 bg-white"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl border-2 border-[#080808] bg-[#E0FB66] text-[#080808] flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-heading text-sm font-extrabold text-[#080808]">
                    {activeLocationPref.displayLabel ||
                      activeLocationPref.city ||
                      "Location Not Set"}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#080808] ${
                      activeLocationPref.source === "BROWSER_GPS"
                        ? "bg-[#E0FB66] text-[#080808]"
                        : activeLocationPref.source === "MANUAL"
                        ? "bg-[#FEF189] text-[#080808]"
                        : "bg-[#FDF9F3] text-[#777777]"
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
                <p className="text-[11px] text-[#777777] mt-0.5">
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
                className="inline-flex items-center gap-1.5 rounded-full bg-[#080808] px-3.5 py-1.5 font-heading text-xs font-bold text-white shadow-[2px_2px_0px_#E0FB66] transition cursor-pointer disabled:opacity-50"
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
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-[#E0FB66] hover:bg-[#FEF189] px-3.5 py-1.5 font-heading text-xs font-bold text-[#080808] transition cursor-pointer disabled:opacity-50"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Search Nearby</span>
              </button>

              <button
                type="button"
                onClick={() => setEditingLocation((prev) => !prev)}
                className="inline-flex items-center gap-1 rounded-full border-2 border-[#080808] bg-white hover:bg-[#FDF9F3] px-3 py-1.5 font-heading text-xs font-bold text-[#080808] transition cursor-pointer"
              >
                <span>{editingLocation ? "Hide City Input" : "Edit City"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowLocationPanel(false);
                  setEditingLocation(false);
                }}
                className="rounded-full p-1.5 text-[#777777] hover:text-[#080808] cursor-pointer"
                aria-label="Close location panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {geoStatusMessage && (
            <div className="rounded-xl border-2 border-[#080808] bg-[#E0FB66]/55 px-3 py-2 text-xs text-[#080808] flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                {geoStatusMessage}
              </span>
              <button
                type="button"
                onClick={() => setGeoStatusMessage(null)}
                className="font-bold hover:underline text-[11px] cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {geoErrorState && (
            <div className="rounded-xl border-2 border-[#080808] bg-[#FEF189] px-3 py-2 text-xs text-[#080808] flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {geoErrorState}
              </span>
              <button
                type="button"
                onClick={() => setEditingLocation(true)}
                className="font-bold underline ml-2 shrink-0 cursor-pointer"
              >
                Select City Manually
              </button>
            </div>
          )}

          {editingLocation && (
            <div className="rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-3 space-y-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-[#080808]">Preferred city:</span>
                <input
                  type="text"
                  value={manualCityInput}
                  onChange={(e) => setManualCityInput(e.target.value)}
                  placeholder="e.g., Bengaluru, San Francisco, Mumbai..."
                  className="rounded-lg border-2 border-[#080808] bg-white px-3 py-1.5 text-xs text-[#080808] outline-none w-64"
                />
                <button
                  type="button"
                  onClick={() => handleSaveManualLocation(manualCityInput)}
                  className="rounded-lg border-2 border-[#080808] bg-[#E0FB66] text-[#080808] px-3 py-1.5 font-bold hover:bg-[#FEF189] transition cursor-pointer"
                >
                  Save Location
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-[#777777] mr-1">
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
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold border transition cursor-pointer ${
                      activeLocationPref.city.toLowerCase() === city.toLowerCase()
                        ? "bg-[#E0FB66] text-[#080808] border-[#080808]"
                        : "bg-white text-[#080808] border-[#D8D5CE] hover:border-[#080808]"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#D8D5CE]">
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
                className={`rounded-full px-3 py-1 text-xs font-heading font-bold border transition cursor-pointer ${
                  selectedLocationMode === item.mode
                    ? "bg-[#E0FB66] text-[#080808] border-2 border-[#080808]"
                    : "bg-[#FDF9F3] text-[#080808] border-[#D8D5CE] hover:border-[#080808]"
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
                  className="rounded-full border-2 border-[#080808] bg-white px-3 py-1 font-heading text-xs font-bold text-[#080808] outline-none"
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
                  className="rounded-full border-2 border-[#080808] bg-white px-3 py-1 font-heading text-xs font-bold text-[#080808] outline-none w-48"
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
                  className="rounded-full border-2 border-[#080808] bg-[#E0FB66] px-2.5 py-1 font-heading text-xs font-bold text-[#080808] cursor-pointer hover:bg-[#FEF189]"
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
                className="neo-card animate-pulse p-4 flex items-center gap-3.5"
              >
                <div className="h-11 w-11 rounded-xl bg-[#D8D5CE]/50 shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 rounded bg-[#D8D5CE]/50" />
                  <div className="h-3 w-1/2 rounded bg-[#D8D5CE]/30" />
                  <div className="h-5 w-2/3 rounded-full bg-[#D8D5CE]/30" />
                </div>
              </div>
            ))}
          </div>
          <div className="lg:col-span-7 neo-card animate-pulse p-6 h-80" />
        </div>
      ) : opportunities.length === 0 ? (
        <div className="neo-card bg-white flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#080808] bg-[#E0FB66] text-[#080808]">
            <Compass className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-heading text-lg font-extrabold text-[#080808]">
            No verified opportunities found matching those filters.
          </h3>
          <p className="mt-1.5 max-w-sm text-xs sm:text-sm text-[#777777]">
            Try running an expanded live discovery search or clearing your active
            location/type filters.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleClearAllFilters}
              className="neo-btn-primary px-5 py-2 text-xs sm:text-sm cursor-pointer"
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
              className="neo-btn-outline px-5 py-2 text-xs sm:text-sm cursor-pointer"
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
              <div className="flex items-center justify-between border-b-2 border-[#080808] pb-2">
                <div className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#E0FB66] border border-[#080808]" />
                  <h3 className="font-heading text-lg font-extrabold text-[#080808]">
                    {group.directionTitle}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-[#080808] ${
                      group.evidenceStrength === "Strong evidence"
                        ? "bg-[#E0FB66] text-[#080808]"
                        : "bg-[#FEF189] text-[#080808]"
                    }`}
                  >
                    {group.evidenceStrength}
                  </span>
                </div>
                <span className="text-xs font-bold text-[#777777]">
                  {group.opportunities.length}{" "}
                  {group.opportunities.length === 1
                    ? "opportunity"
                    : "opportunities"}
                </span>
              </div>

              <div className="flex flex-col gap-2">
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
        /* Split Master-Detail Layout matching ChatGPT Neo-Brutalist Discover mockup */
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
                  className={`group rounded-2xl border-2 border-[#080808] p-3.5 sm:p-4 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#F4FED0] shadow-[4px_4px_0px_#080808] ring-2 ring-[#E0FB66]"
                      : "bg-white hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#080808]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <CompanyLogo
                        name={opportunity.organization}
                        size={42}
                        className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 rounded-xl border border-[#D8D5CE]"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h3 className="font-heading text-sm sm:text-[15px] font-extrabold text-[#080808] leading-snug truncate">
                            {opportunity.title}
                          </h3>
                          {isNew && (
                            <span className="shrink-0 rounded-full bg-[#E0FB66] border border-[#080808] px-1.5 py-0.2 font-heading text-[9px] font-extrabold uppercase text-[#080808]">
                              NEW
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 text-xs font-medium text-[#777777] truncate">
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

                        {/* Compact Match & Skills Pill Strip */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#E0FB66] border border-[#080808] px-2.5 py-0.5 font-heading text-[11px] font-extrabold text-[#080808]">
                            <Target className="h-3 w-3 shrink-0" />
                            <span>{matchPct}% Match</span>
                          </span>

                          {opportunity.sourceName && (
                            <span className="rounded-full bg-[#EAE2FE] border border-[#080808]/40 px-2 py-0.5 text-[10px] font-bold text-[#080808] max-w-[115px] truncate">
                              {opportunity.sourceName.replace(/\s*\((?:Web Index|Public Feed|Live Feed)\)/i, "")}
                            </span>
                          )}

                          {topSkills.map((sk) => (
                            <span
                              key={sk}
                              className="rounded-full bg-[#FDF9F3] border border-[#D8D5CE] px-2 py-0.5 text-[10.5px] font-semibold text-[#080808] max-w-[96px] truncate"
                              title={sk}
                            >
                              {sk}
                            </span>
                          ))}

                          {extraSkillsCount > 0 && (
                            <span className="rounded-full bg-white border border-[#D8D5CE] px-2 py-0.5 text-[11px] font-bold text-[#777777]">
                              +{extraSkillsCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSaveToTracker(opportunity);
                      }}
                      title={isSaved ? "Saved to Tracker" : "Save to Tracker"}
                      aria-label={isSaved ? "Saved to Tracker" : "Save to Tracker"}
                      className="rounded-lg p-1.5 text-[#080808] hover:bg-white/70 transition-colors shrink-0 cursor-pointer"
                    >
                      <Bookmark
                        className={`h-4 w-4 ${
                          isSaved ? "fill-[#080808]" : "text-[#080808]"
                        }`}
                      />
                    </button>
                  </div>
                </article>
              );
            })}

            {opportunities.length > visibleLimit && (
              <div className="pt-1 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setVisibleLimit((prev) => prev + 20)}
                  className="flex-1 neo-btn-outline py-2.5 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
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
                  className="neo-btn-outline p-2.5 cursor-pointer"
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

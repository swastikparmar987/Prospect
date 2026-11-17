"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Sidebar, NavTab, SidebarNavKey } from "@/components/Sidebar";
import {
  AiCareerChatDrawer,
  ChatActionPayload,
} from "@/components/AiCareerChatDrawer";
import { ConnectedSourcesModal } from "@/components/ConnectedSourcesModal";
import { OpportunityDetailModal, TabType } from "@/components/OpportunityDetailModal";
import { AddApplicationModal } from "@/components/AddApplicationModal";
import { HomeView } from "@/components/views/HomeView";
import { DiscoverView } from "@/components/views/DiscoverView";
import { TrackerView } from "@/components/views/TrackerView";
import { PreparationPlansView } from "@/components/views/PreparationPlansView";
import { UpskillView } from "@/components/views/UpskillView";
import { ProfileView } from "@/components/views/ProfileView";
import { ProjectEvaluatorView } from "@/components/views/ProjectEvaluatorView";
import { SchedulerView } from "@/components/views/SchedulerView";
import { CareerIntelligenceCommandCenter } from "@/components/views/CareerIntelligenceCommandCenter";
import { LandingExperience } from "@/components/landing/LandingExperience";
import { ResumeUploadExperience } from "@/components/onboarding/ResumeUploadExperience";
import { ProfileConfirmationView } from "@/components/onboarding/ProfileConfirmationView";
import { CareerOutlookExperience } from "@/components/onboarding/CareerOutlookExperience";
import { AgentExecutionExperience } from "@/components/onboarding/AgentExecutionExperience";
import { generateCareerOutlook } from "@/lib/career-outlook";
import {
  Opportunity,
  EvaluationResult,
  UserProfile,
  ApplicationRecord,
  PreparationPlan,
  AgentRunRecord,
  ApplicationStage,
  CandidateCapabilityMap,
  ExpandedRole,
  WorkMode,
  CareerOutlook,
  LiveDiscoveryEvent,
  LocationPreference,
  LocationDiscoveryMode,
  RankingEvaluationMetrics,
} from "@/types";
import {
  Bell,
  Compass,
  Link2,
  LogOut,
  Menu,
  Search,
  Sparkles,
  Upload,
  UserRound,
} from "lucide-react";
import { AuthModal, AuthSessionUser } from "@/components/auth/AuthModal";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<NavTab>("landing");
  const [activeSidebarKey, setActiveSidebarKey] = useState<SidebarNavKey>("home");
  const [prepFocusTab, setPrepFocusTab] = useState<"resume" | "interview" | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sourcesModalOpen, setSourcesModalOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<"DEMO" | "LIVE">("LIVE");
  const [statusData, setStatusData] = useState<any>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalStage, setAddModalStage] = useState<ApplicationStage>("SAVED");

  // Session & Authentication States (Mandatory Security Gate)
  const [sessionUser, setSessionUser] = useState<AuthSessionUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const [authPromptMessage, setAuthPromptMessage] = useState<string | undefined>(undefined);
  const [pendingAuthTargetTab, setPendingAuthTargetTab] = useState<NavTab>("discover");

  // Core Data States
  const [opportunities, setOpportunities] = useState<
    Array<{
      opportunity: Opportunity;
      evaluation: EvaluationResult;
      hasPrepPlan?: boolean;
    }>
  >([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [capabilityMap, setCapabilityMap] =
    useState<CandidateCapabilityMap | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<ExpandedRole[]>([]);
  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState<any[]>([]);
  const [preparationPlans, setPreparationPlans] = useState<PreparationPlan[]>([]);
  const [agentRuns, setAgentRuns] = useState<AgentRunRecord[]>([]);
  const [isAgentRunning, setIsAgentRunning] = useState(false);

  // Live Intelligence Upgrade States (Priorities 1-9)
  const [liveEvents, setLiveEvents] = useState<LiveDiscoveryEvent[]>([]);
  const [wasSearchCancelled, setWasSearchCancelled] = useState(false);
  const [personalizationSummary, setPersonalizationSummary] = useState<string | null>(null);
  const [rankingMetrics, setRankingMetrics] = useState<RankingEvaluationMetrics | null>(null);
  const [locationPreference, setLocationPreference] = useState<LocationPreference | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [liveUpdatesCount, setLiveUpdatesCount] = useState(0);
  const [discoverExternalCommand, setDiscoverExternalCommand] = useState<{
    query?: string;
    platform?: string;
    locationMode?: LocationDiscoveryMode;
    selectedCity?: string;
    stamp: number;
  } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const activeSearchParamsRef = useRef<{
    query?: string;
    category?: string;
    workMode?: string;
    location?: string;
    platform?: string;
    locationMode?: LocationDiscoveryMode;
    selectedCity?: string;
    deadline?: string;
    action?: string;
    sortBy?: string;
    mode?: "DEMO" | "LIVE";
  }>({ locationMode: "VICINITY" });
  const latestOppRequestIdRef = useRef(0);
  const freshSinceRef = useRef<string | null>(null);

  const getAuthHeaders = useCallback(
    (extra: Record<string, string> = {}): Record<string, string> => {
      const token =
        sessionToken ||
        (typeof window !== "undefined"
          ? localStorage.getItem("prospect_session_token")
          : null);
      if (token) {
        return {
          authorization: `Bearer ${token}`,
          "x-prospect-session": token,
          ...extra,
        };
      }
      return extra;
    },
    [sessionToken]
  );

  // Resume-First Onboarding States (Phases 1-10 + Career Outlook)
  const [onboardingStep, setOnboardingStep] = useState<
    "CHECKING" | "UPLOAD" | "CONFIRM" | "OUTLOOK" | "SEARCHING" | "DONE"
  >("CHECKING");
  const [extractedResumeData, setExtractedResumeData] = useState<any>(null);
  const [careerOutlook, setCareerOutlook] = useState<CareerOutlook | null>(null);
  const [pendingPreferences, setPendingPreferences] = useState<any>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [agentExecutionError, setAgentExecutionError] = useState<string | null>(null);

  // Detail Modal States
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailModalTab, setDetailModalTab] = useState<TabType>("overview");
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<EvaluationResult | null>(null);

  // Feedback Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Time-aware workspace greeting (computed client-side to prevent hydration mismatch)
  const [timeGreeting, setTimeGreeting] = useState<string>("Welcome back");
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeGreeting("Good morning");
    else if (hour < 17) setTimeGreeting("Good afternoon");
    else setTimeGreeting("Good evening");
  }, []);

  // Header Notification Popover & Profile Avatar Dropdown States
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const notifMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!notifPopoverOpen && !profileMenuOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        notifPopoverOpen &&
        notifMenuRef.current &&
        !notifMenuRef.current.contains(target)
      ) {
        setNotifPopoverOpen(false);
      }
      if (
        profileMenuOpen &&
        profileMenuRef.current &&
        !profileMenuRef.current.contains(target)
      ) {
        setProfileMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setNotifPopoverOpen(false);
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [notifPopoverOpen, profileMenuOpen]);

  // Session Verification & Lifecycle Handlers
  useEffect(() => {
    const verifySession = async () => {
      try {
        const storedToken =
          typeof window !== "undefined"
            ? localStorage.getItem("prospect_session_token")
            : null;
        const storedName =
          typeof window !== "undefined"
            ? localStorage.getItem("prospect_user_name")
            : null;

        if (storedToken) {
          const res = await fetch("/api/auth/session", {
            headers: {
              authorization: `Bearer ${storedToken}`,
              "x-prospect-session": storedToken,
            },
          });
          const data = await res.json();
          if (data.isAuthenticated) {
            setSessionUser({
              userId: data.user.userId,
              email: data.user.email,
              role: data.user.role || "STUDENT",
              fullName: storedName || undefined,
            });
            setSessionToken(storedToken);
          } else {
            if (typeof window !== "undefined") {
              localStorage.removeItem("prospect_session_token");
              localStorage.removeItem("prospect_user_email");
              localStorage.removeItem("prospect_user_id");
            }
            setSessionUser(null);
            setSessionToken(null);
          }
        }
      } catch (err) {
        console.error("Session check error:", err);
      }
    };

    verifySession();
  }, []);

  const handleAuthSuccess = async (session: {
    user: AuthSessionUser;
    token: string;
  }) => {
    setAuthModalOpen(false);
    setAuthPromptMessage(undefined);
    setSessionUser(session.user);
    setSessionToken(session.token);

    // Clear stale pre-login client state so newly logged-in user strictly sees zero mock/old data
    setProfile(null);
    setCareerOutlook(null);
    setCapabilityMap(null);
    setExpandedRoles([]);
    setOpportunities([]);
    setPreparationPlans([]);
    setApplications([]);
    freshSinceRef.current = null;
    setOnboardingStep("CHECKING");

    // Initialize/load profile & intelligence with the fresh session token
    await Promise.all([
      loadProfileAndIntelligence(undefined, session.token),
      loadStatus(),
    ]);

    const targetTab = pendingAuthTargetTab || "home";
    setActiveTab(targetTab);
    const keyMap: Record<NavTab, SidebarNavKey> = {
      landing: "home",
      home: "home",
      discover: "discover",
      outlook: "outlook",
      tracker: "applications",
      prep: "interview_prep",
      upskill: "upskill",
      profile: "profile",
      projects: "projects",
      scheduler: "scheduler",
      agent: "agent",
    };
    setActiveSidebarKey(keyMap[targetTab] || "home");
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/?tab=${targetTab}`);
    }
    showToast(`Signed in as ${session.user.fullName || session.user.email}`);
  };

  const handleLogout = async () => {
    try {
      const storedToken =
        typeof window !== "undefined"
          ? localStorage.getItem("prospect_session_token")
          : null;
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: storedToken ? { authorization: `Bearer ${storedToken}` } : {},
      });
    } catch (e) {
      console.error("Logout request error:", e);
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("prospect_session_token");
        localStorage.removeItem("prospect_user_email");
        localStorage.removeItem("prospect_user_id");
        localStorage.removeItem("prospect_user_name");
        window.history.pushState(null, "", "/");
      }
      setSessionUser(null);
      setSessionToken(null);
      setProfile(null);
      setCareerOutlook(null);
      setOpportunities([]);
      setPreparationPlans([]);
      setApplications([]);
      freshSinceRef.current = null;
      setOnboardingStep("CHECKING");
      setActiveTab("landing");
      setActiveSidebarKey("home");
      showToast("Signed out successfully. Session invalidated.");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const aliasMap: Record<string, NavTab> = {
        landing: "landing",
        home: "home",
        discover: "discover",
        outlook: "outlook",
        intelligence: "outlook",
        tracker: "tracker",
        applications: "tracker",
        prep: "prep",
        upskill: "upskill",
        agent: "agent",
        profile: "profile",
        projects: "projects",
        scheduler: "scheduler",
      };

      const keyMap: Record<NavTab, SidebarNavKey> = {
        landing: "home",
        home: "home",
        discover: "discover",
        outlook: "outlook",
        tracker: "applications",
        prep: "interview_prep",
        upskill: "upskill",
        profile: "profile",
        projects: "projects",
        scheduler: "scheduler",
        agent: "agent",
      };

      const syncTabFromUrl = () => {
        const rawParam = new URLSearchParams(window.location.search).get("tab");
        if (rawParam && aliasMap[rawParam]) {
          const mappedTab = aliasMap[rawParam];
          setActiveTab(mappedTab);
          if (mappedTab === "prep") {
            setPrepFocusTab("interview");
          }
          setActiveSidebarKey(
            rawParam === "tracker"
              ? "tracker"
              : rawParam === "applications"
              ? "applications"
              : rawParam === "upskill"
              ? "upskill"
              : rawParam === "prep" || rawParam === "interview_prep"
              ? "interview_prep"
              : keyMap[mappedTab] || "home"
          );
        } else {
          // Default to the landing page first when opening root URL
          setActiveTab("landing");
          setActiveSidebarKey("home");
        }
      };

      syncTabFromUrl();

      window.addEventListener("popstate", syncTabFromUrl);
      return () => window.removeEventListener("popstate", syncTabFromUrl);
    }
  }, []);

  // 1. Load Status
  const loadStatus = async () => {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      setStatusData(data);
      if (data.syncMetrics?.lastSyncAt) {
        setLastSyncAt(data.syncMetrics.lastSyncAt);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 2. Load Opportunities
  const loadOpportunities = useCallback(
    async (
      params: {
        query?: string;
        category?: string;
        workMode?: string;
        location?: string;
        platform?: string;
        locationMode?: LocationDiscoveryMode;
        selectedCity?: string;
        deadline?: string;
        action?: string;
        sortBy?: string;
        mode?: "DEMO" | "LIVE";
        tokenOverride?: string;
      } = {}
    ) => {
      setLoadingOpportunities(true);
      activeSearchParamsRef.current = params;
      const reqId = ++latestOppRequestIdRef.current;
      try {
        const searchParams = new URLSearchParams();
        searchParams.set("mode", params.mode || searchMode);
        searchParams.set("requireProfile", "1");
        if (freshSinceRef.current) {
          searchParams.set("freshSince", freshSinceRef.current);
        }
        if (params.query) searchParams.set("q", params.query);
        if (params.category && params.category !== "ALL")
          searchParams.set("category", params.category);
        if (params.workMode && params.workMode !== "ALL")
          searchParams.set("workMode", params.workMode);
        if (params.location && params.location !== "ALL")
          searchParams.set("location", params.location);
        if (params.platform && params.platform !== "ALL")
          searchParams.set("platform", params.platform);
        if (params.locationMode && params.locationMode !== "ALL")
          searchParams.set("locationMode", params.locationMode);
        if (params.selectedCity)
          searchParams.set("selectedCity", params.selectedCity);
        if (params.deadline && params.deadline !== "ALL")
          searchParams.set("deadline", params.deadline);
        if (params.action && params.action !== "ALL")
          searchParams.set("action", params.action);
        if (params.sortBy) searchParams.set("sortBy", params.sortBy);

        const headers = params.tokenOverride
          ? {
              authorization: `Bearer ${params.tokenOverride}`,
              "x-prospect-session": params.tokenOverride,
            }
          : getAuthHeaders();

        const res = await fetch(`/api/opportunities?${searchParams.toString()}`, {
          headers,
        });
        const data = await res.json();
        if (reqId !== latestOppRequestIdRef.current) return;
        if (data.profileConfigured === false) {
          setOpportunities([]);
        } else if (data.opportunities) {
          setOpportunities(data.opportunities);
        }
        if (data.personalizationSummary) {
          setPersonalizationSummary(data.personalizationSummary);
        }
        if (data.rankingMetrics) {
          setRankingMetrics(data.rankingMetrics);
        }
        if (data.locationPreference) {
          setLocationPreference(data.locationPreference);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingOpportunities(false);
      }
    },
    [searchMode, getAuthHeaders]
  );

  // 3. Load Profile & Search Intelligence
  const loadProfileAndIntelligence = useCallback(
    async (modeOverride?: "DEMO" | "LIVE", tokenOverride?: string) => {
      try {
        const activeMode = modeOverride || searchMode;
        const headers = tokenOverride
          ? {
              authorization: `Bearer ${tokenOverride}`,
              "x-prospect-session": tokenOverride,
            }
          : getAuthHeaders();
        const [profRes, intelRes] = await Promise.all([
          fetch("/api/profile", { headers }),
          fetch(`/api/search/intelligence?mode=${activeMode}`, { headers }),
        ]);
        const profData = await profRes.json();
        const hasValidProfile = Boolean(
          profData.profile &&
            ((profData.profile.skills && profData.profile.skills.length > 0) ||
              profData.profile.fullName)
        );
        if (hasValidProfile) {
          setProfile(profData.profile);
          if (profData.profile.locationPreference) {
            setLocationPreference(profData.profile.locationPreference);
          }
          try {
            const outlook = generateCareerOutlook(profData.profile);
            setCareerOutlook(outlook);
          } catch (e) {
            console.error("Failed to generate career outlook:", e);
          }
          setOnboardingStep((prev) => (prev === "CHECKING" ? "DONE" : prev));
        } else {
          setProfile(null);
          setCareerOutlook(null);
          setOpportunities([]);
          setPreparationPlans([]);
          setApplications([]);
          freshSinceRef.current = null;
          setOnboardingStep((prev) => (prev === "CHECKING" ? "UPLOAD" : prev));
        }
        const intelData = await intelRes.json();
        if (intelData.capabilityMap) {
          setCapabilityMap(intelData.capabilityMap);
        }
        if (intelData.expandedRoles) {
          setExpandedRoles(intelData.expandedRoles);
        }
        return hasValidProfile;
      } catch (err) {
        console.error(err);
        setOnboardingStep((prev) => (prev === "CHECKING" ? "UPLOAD" : prev));
        return false;
      }
    },
    [searchMode, getAuthHeaders]
  );

  // 4. Load Tracker Applications
  const loadApplications = useCallback(
    async (modeOverride?: "DEMO" | "LIVE") => {
      try {
        const activeMode = modeOverride || searchMode;
        const res = await fetch(`/api/tracker?mode=${activeMode}`, {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (data.applications) setApplications(data.applications);
        if (data.upcomingDeadlines) setUpcomingDeadlines(data.upcomingDeadlines);
      } catch (err) {
        console.error(err);
      }
    },
    [searchMode, getAuthHeaders]
  );

  // 5. Load Preparation Plans
  const loadPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/preparation-plans?requireProfile=1", {
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (data.plans) setPreparationPlans(data.plans);
    } catch (err) {
      console.error(err);
    }
  }, [getAuthHeaders]);

  // 6. Load Agent Runs Trace
  const loadAgentRuns = useCallback(async () => {
    try {
      const res = await fetch("/api/agent/runs", { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.runs) setAgentRuns(data.runs);
    } catch (err) {
      console.error(err);
    }
  }, [getAuthHeaders]);

  // Initial Data Bootstrap (profile check precedes opportunity & plan fetches)
  useEffect(() => {
    let active = true;
    (async () => {
      await loadStatus();
      const hasValidProfile = await loadProfileAndIntelligence();
      if (!active) return;
      if (hasValidProfile) {
        await Promise.all([
          loadOpportunities({ locationMode: "VICINITY" }),
          loadApplications(),
          loadPlans(),
          loadAgentRuns(),
        ]);
      } else {
        setLoadingOpportunities(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadOpportunities, loadProfileAndIntelligence, loadApplications, loadPlans, loadAgentRuns]);

  // Real-Time Server-Sent Events (SSE) Auto-Sync Subscription
  useEffect(() => {
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      return;
    }

    const evtSource = new EventSource("/api/opportunities/stream");

    const handleSystemEvent = (raw: MessageEvent) => {
      try {
        const evt = JSON.parse(raw.data);
        if (evt.type === "CONNECTED") {
          setRealtimeConnected(true);
          return;
        }
        if (
          evt.type === "OPPORTUNITY_UPSERTED" ||
          evt.type === "SYNC_COMPLETED" ||
          evt.type === "PROFILE_UPDATED" ||
          evt.type === "PROJECT_ADDED" ||
          evt.type === "SEARCH_COMPLETED"
        ) {
          setLiveUpdatesCount((c) => c + 1);
          loadOpportunities(activeSearchParamsRef.current);
          loadProfileAndIntelligence();
          loadStatus();
          if (evt.message && evt.type !== "SYNC_COMPLETED") {
            showToast(`Live Sync: ${evt.message}`);
          }
        }
      } catch {
        // Ignore malformed event chunks
      }
    };

    evtSource.addEventListener("system", handleSystemEvent);
    evtSource.onopen = () => setRealtimeConnected(true);
    evtSource.onerror = () => setRealtimeConnected(false);

    return () => {
      evtSource.removeEventListener("system", handleSystemEvent);
      evtSource.close();
      setRealtimeConnected(false);
    };
  }, [loadOpportunities, loadProfileAndIntelligence]);

  // Save to Tracker Action
  const handleSaveToTracker = async (opp: Opportunity, customNotes?: string) => {
    try {
      const res = await fetch("/api/tracker", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          opportunityId: opp.id,
          stage: addModalStage || "SAVED",
          notes: customNotes || `Saved from discovery on ${new Date().toLocaleDateString()}`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`Saved "${opp.title}" to your Opportunities Tracker.`);
        loadApplications();
      } else {
        showToast(data.error || "Could not save to tracker.");
      }
    } catch {
      showToast("Network error saving to tracker.");
    }
  };

  // Update Tracker Action
  const handleUpdateApplication = async (params: {
    id: string;
    stage?: ApplicationStage;
    notes?: string;
    plannedNextAction?: string;
    outcome?: any;
    outcomeReflection?: string;
    eventNote?: string;
    reminders?: any[];
  }) => {
    try {
      const res = await fetch("/api/tracker", {
        method: "PATCH",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify(params),
      });
      if (res.ok) {
        showToast("Application record updated.");
        loadApplications();
      }
    } catch {
      showToast("Error updating application.");
    }
  };

  // Delete Application from Tracker
  const handleDeleteApplication = async (id: string) => {
    try {
      const res = await fetch(`/api/tracker?id=${id}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        showToast("Application removed from tracker.");
        loadApplications();
      }
    } catch {
      showToast("Error removing application.");
    }
  };

  // Trigger Multi-Step Adaptive Agent Discovery
  const handleRunAgentDiscovery = async (
    query: string,
    modeOverride?: "DEMO" | "LIVE",
    options?: {
      budget?: {
        maxRounds: number;
        queriesPerRound: number;
        resultsPerProvider: number;
        searchBudgetPerRun: number;
      };
      locationMode?: LocationDiscoveryMode;
      selectedCity?: string;
      expandRoles?: boolean;
    }
  ) => {
    const activeMode = modeOverride || searchMode;
    setIsAgentRunning(true);
    setWasSearchCancelled(false);
    setAgentExecutionError(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const runStartIso = new Date(Date.now() - 10000).toISOString();

    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        signal: controller.signal,
        body: JSON.stringify({
          query,
          mode: activeMode,
          maxRounds: options?.budget?.maxRounds ?? 2,
          queriesPerRound: options?.budget?.queriesPerRound ?? 4,
          resultsPerProvider: options?.budget?.resultsPerProvider ?? 12,
          searchBudgetPerRun: options?.budget?.searchBudgetPerRun ?? 12,
          locationMode:
            options?.locationMode ||
            activeSearchParamsRef.current.locationMode ||
            "VICINITY",
          selectedCity: options?.selectedCity,
          location: options?.selectedCity,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAgentExecutionError(data.error || data.details || "Search request failed.");
        showToast(data.error || data.details || "Search request failed.");
      } else {
        freshSinceRef.current = runStartIso;
        if (Array.isArray(data.opportunities)) {
          setOpportunities(data.opportunities);
        }
        if (data.summary) {
          showToast(data.summary);
        }
      }

      if (data.liveEvents && Array.isArray(data.liveEvents)) {
        setLiveEvents(data.liveEvents);
      }
      if (data.personalizationSummary) {
        setPersonalizationSummary(data.personalizationSummary);
      }
      if (data.rankingMetrics) {
        setRankingMetrics(data.rankingMetrics);
      }
      if (data.locationPreference) {
        setLocationPreference(data.locationPreference);
      }

      await loadOpportunities({
        ...activeSearchParamsRef.current,
        query: query || undefined,
        locationMode:
          options?.locationMode ||
          activeSearchParamsRef.current.locationMode ||
          "VICINITY",
        selectedCity: options?.selectedCity,
        mode: activeMode,
      });

      await Promise.all([
        loadAgentRuns(),
        loadPlans(),
        loadProfileAndIntelligence(activeMode),
      ]);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setWasSearchCancelled(true);
        showToast("Live discovery search cancelled.");
      } else {
        setAgentExecutionError(err?.message || "Live opportunity discovery agent failed.");
        showToast("Live opportunity discovery agent failed.");
      }
    } finally {
      setIsAgentRunning(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelAgentDiscovery = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsAgentRunning(false);
    setWasSearchCancelled(true);
  };

  const handleTriggerBackgroundSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setLastSyncAt(data.completedAt || new Date().toISOString());
        showToast(
          `Background sync completed: ${data.itemsFetched || 0} fetched (${data.itemsAdded || 0} new, ${data.itemsUpdated || 0} updated).`
        );
        await Promise.all([loadOpportunities(), loadStatus()]);
      } else {
        showToast(data.error || "Background sync failed.");
      }
    } catch {
      showToast("Background sync encountered a network error.");
    } finally {
      setIsSyncing(false);
    }
  };

  // Inline Relevance Feedback Handler
  const handleFeedback = async (
    opp: Opportunity,
    signalType: "MARK_RELEVANT" | "MARK_NOT_RELEVANT" | "HIDE_EMPLOYER"
  ) => {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          opportunityId: opp.id,
          organization: opp.organization,
          roleFamily: opp.roleFamily || opp.category,
          signalType,
          notes: `Feedback (${signalType}) recorded for ${opp.title} at ${opp.organization}`,
        }),
      });
      if (signalType === "HIDE_EMPLOYER") {
        showToast(`Hidden employer "${opp.organization}" from results.`);
      } else if (signalType === "MARK_RELEVANT") {
        showToast(
          `Marked "${opp.title}" relevant — boosted "${opp.roleFamily || opp.category}" in adaptive search.`
        );
      } else {
        showToast(
          `Marked "${opp.title}" not relevant — downranked "${opp.roleFamily || opp.category}".`
        );
      }
      await Promise.all([
        loadOpportunities(),
        loadProfileAndIntelligence(),
      ]);
    } catch {
      showToast("Could not save feedback signal.");
    }
  };

  const handleDismissRoleFamily = async (roleTitle: string) => {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          signalType: "DISMISS_ROLE_FAMILY",
          roleFamily: roleTitle,
          notes: `User excluded role family "${roleTitle}" from Discover view.`,
        }),
      });
      showToast(`Excluded role family "${roleTitle}" from future adaptive search plans.`);
      await loadProfileAndIntelligence();
    } catch {
      showToast("Failed to exclude role family.");
    }
  };

  const handleResetPersonalization = async () => {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          signalType: "RESET_PERSONALIZATION",
          notes: "User restored excluded role families and hidden employers.",
        }),
      });
      showToast("Restored all excluded role families and hidden employers.");
      await Promise.all([
        loadOpportunities(),
        loadProfileAndIntelligence(),
      ]);
    } catch {
      showToast("Failed to reset exclusions.");
    }
  };

  // Toggle Plan Checklist Item
  const handleTogglePlanItem = async (
    planId: string,
    itemId: string,
    currentStatus: boolean
  ) => {
    try {
      const res = await fetch("/api/preparation-plans", {
        method: "PATCH",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ planId, itemId, isCompleted: !currentStatus }),
      });
      const data = await res.json();
      if (data.message) {
        showToast(data.message);
      }
      loadPlans();
      loadOpportunities();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGeneratePlan = async (opportunityId: string) => {
    try {
      const res = await fetch("/api/preparation-plans", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ opportunityId }),
      });
      const data = await res.json();
      if (res.ok) {
        await loadPlans();
        showToast(data.message || "Synthesized resume-grounded preparation plan!");
      } else {
        showToast(data.error || "Could not generate preparation plan.");
      }
    } catch {
      showToast("Network error generating preparation plan.");
    }
  };

  // Save Profile Facts
  const handleSaveProfile = async (updated: Partial<UserProfile>) => {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: getAuthHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify(updated),
    });
    if (!res.ok) throw new Error("Failed to save profile");
    const data = await res.json();
    setProfile(data.profile);
    if (data.profile?.locationPreference) {
      setLocationPreference(data.profile.locationPreference);
    }
    if (data.capabilityMap) setCapabilityMap(data.capabilityMap);
    if (data.expandedRoles) setExpandedRoles(data.expandedRoles);
    showToast("Profile, capabilities, and role expansion updated.");
    await Promise.all([
      loadOpportunities({
        ...activeSearchParamsRef.current,
        locationMode: activeSearchParamsRef.current.locationMode || "VICINITY",
      }),
      loadProfileAndIntelligence(),
    ]);
  };

  // Delete All Profile Data
  const handleDeleteProfile = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete all profile facts and uploaded resume data? This action cannot be undone."
      )
    ) {
      return;
    }
    const res = await fetch("/api/profile", {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (res.ok) {
      setProfile(null);
      setCapabilityMap(null);
      setExpandedRoles([]);
      setOpportunities([]);
      setPreparationPlans([]);
      freshSinceRef.current = null;
      setOnboardingStep("UPLOAD");
      showToast("All profile data and extracted facts have been deleted.");
    }
  };

  // Resume-First Onboarding Handlers (Phases 1-8)
  const handleResumeParsed = (data: any) => {
    setExtractedResumeData(data);
    setOnboardingStep("CONFIRM");
    showToast(`Extracted facts from ${data.filename}! Review and confirm your profile.`);
  };

  const handleConfirmProfileAndSearch = async (
    confirmedProfile: UserProfile,
    searchPreferences: {
      targetRoles: string[];
      categories: string[];
      workModes: WorkMode[];
      location: string;
      mode: "LIVE" | "DEMO";
    }
  ) => {
    setIsSavingProfile(true);
    setPendingPreferences(searchPreferences);
    setSearchMode(searchPreferences.mode);
    setAgentExecutionError(null);

    try {
      // 1. Persist confirmed profile to Prisma SQLite database
      const saveRes = await fetch("/api/profile", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          ...confirmedProfile,
          targetRoles: searchPreferences.targetRoles,
          preferredWorkModes: searchPreferences.workModes,
          preferredLocations: [searchPreferences.location],
          location: searchPreferences.location,
          factProvenance: {
            ...(confirmedProfile.factProvenance || {}),
            confirmedAt: {
              source: "user-confirmed",
              updatedAt: new Date().toISOString(),
            },
          },
        }),
      });

      if (!saveRes.ok) {
        const errData = await saveRes.json();
        throw new Error(errData.error || "Failed to persist confirmed profile");
      }

      const saveData = await saveRes.json();
      setProfile(saveData.profile);
      if (saveData.profile?.locationPreference) {
        setLocationPreference(saveData.profile.locationPreference);
      }
      if (saveData.capabilityMap) setCapabilityMap(saveData.capabilityMap);
      if (saveData.expandedRoles) setExpandedRoles(saveData.expandedRoles);

      // 2. Generate personalized Career Outlook before launching complete search
      const outlook = generateCareerOutlook(saveData.profile);
      setCareerOutlook(outlook);

      showToast("Profile confirmed! Generating your personalized Career Outlook...");

      // 3. Transition to Career Outlook experience
      setOnboardingStep("OUTLOOK");
    } catch (err: any) {
      showToast(err.message || "Failed to save profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleConfirmCareerOutlookAndSearch = async (
    selectedDirections: string[],
    searchPreferences: {
      targetRoles: string[];
      categories: string[];
      workModes: WorkMode[];
      location: string;
      mode: "LIVE" | "DEMO";
    }
  ) => {
    setIsAgentRunning(true);
    setAgentExecutionError(null);
    setPendingPreferences(searchPreferences);
    setSearchMode(searchPreferences.mode);
    const runStartIso = new Date(Date.now() - 10000).toISOString();

    try {
      // 1. Persist confirmed career directions
      try {
        await fetch("/api/career-outlook", {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            selectedDirections,
            customDirections: searchPreferences.targetRoles.filter(
              (r) => !selectedDirections.includes(r)
            ),
          }),
        });
      } catch (e) {
        console.warn("Non-fatal career outlook persistence issue:", e);
      }

      // 2. Transition immediately to the Agent Execution Experience (Phase 7)
      setOnboardingStep("SEARCHING");

      // 3. Build focused targeted search query across the confirmed career directions
      const primaryDirections =
        selectedDirections.length > 0 ? selectedDirections : searchPreferences.targetRoles;
      const primaryRole = primaryDirections[0] || "Software Engineering Intern";
      const cleanLoc =
        searchPreferences.location && !searchPreferences.location.includes("Flexible")
          ? searchPreferences.location.split(",")[0].trim()
          : "";
      const queryStr = `${primaryRole} ${cleanLoc}`.trim();

      const searchRes = await fetch("/api/opportunities", {
        method: "POST",
        headers: getAuthHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          query: queryStr,
          category: searchPreferences.categories[0] || "Internship",
          workMode: searchPreferences.workModes[0] || undefined,
          locationMode: "VICINITY",
          selectedCity: cleanLoc,
          mode: searchPreferences.mode,
          maxRounds: 2,
        }),
      });

      const searchData = await searchRes.json();
      if (!searchRes.ok) {
        setAgentExecutionError(searchData.error || searchData.details || "Search provider error.");
      } else {
        freshSinceRef.current = runStartIso;
        if (Array.isArray(searchData.opportunities)) {
          setOpportunities(searchData.opportunities);
        }
        await Promise.all([
          loadAgentRuns(),
          loadPlans(),
          loadProfileAndIntelligence(searchPreferences.mode),
        ]);
        showToast(
          `Synced real-time discovery for ${cleanLoc || "your profile"}!`
        );
      }
    } catch (err: any) {
      setAgentExecutionError(err.message || "An unexpected error occurred during discovery.");
    } finally {
      setIsAgentRunning(false);
    }
  };

  // Open Opportunity Detail Drawer
  const handleInspectOpportunity = (
    opp: Opportunity,
    evalResult?: EvaluationResult,
    initialTab: TabType = "overview"
  ) => {
    setSelectedOpportunity(opp);
    setDetailModalTab(initialTab);
    if (evalResult) {
      setSelectedEvaluation(evalResult);
    } else {
      const found = opportunities.find((o) => o.opportunity.id === opp.id);
      setSelectedEvaluation(found ? found.evaluation : null);
    }
    setDetailModalOpen(true);
  };

  // Calculate badges for tabs
  const activePrepItemCount = preparationPlans.reduce(
    (acc, p) => acc + p.items.filter((i) => !i.isCompleted).length,
    0
  );

  const handleExecuteChatAction = useCallback(
    (action: ChatActionPayload) => {
      if (action.type === "OPEN_TAB" && action.tab) {
        setActiveTab(action.tab);
        setActiveSidebarKey(action.tab as SidebarNavKey);
        showToast(`Opened ${action.tab}`);
        return;
      }

      if (action.type === "SWITCH_LOCATION_MODE" && action.locationMode) {
        setActiveTab("discover");
        setActiveSidebarKey("discover");
        setDiscoverExternalCommand({
          locationMode: action.locationMode,
          selectedCity: action.selectedCity,
          stamp: Date.now(),
        });
        loadOpportunities({
          ...activeSearchParamsRef.current,
          locationMode: action.locationMode,
          selectedCity: action.selectedCity,
        });
        showToast(action.label);
        return;
      }

      if (action.type === "SEARCH_OPPORTUNITIES") {
        const nextMode = action.locationMode || "ALL";
        const nextQuery = action.query ?? "";
        setActiveTab("discover");
        setActiveSidebarKey("discover");
        setDiscoverExternalCommand({
          query: nextQuery,
          platform: action.platform || "ALL",
          locationMode: nextMode,
          selectedCity: action.selectedCity,
          stamp: Date.now(),
        });
        loadOpportunities({
          query: nextQuery,
          category: "ALL",
          workMode: "ALL",
          platform: action.platform || "ALL",
          locationMode: nextMode,
          selectedCity: action.selectedCity,
        });
        showToast(action.label);
      }
    },
    [loadOpportunities, showToast]
  );

  const displayFirstName = (() => {
    const full = profile?.fullName?.trim() || sessionUser?.fullName?.trim();
    if (full) {
      const first = full.split(/\s+/)[0]?.replace(/[^a-zA-Z0-9'-]/g, "");
      if (first) return first;
    }
    const email = sessionUser?.email?.trim();
    if (email && email.includes("@")) {
      const prefix = email.split("@")[0]?.split(/[._+-]/)[0]?.trim();
      if (prefix) {
        return prefix.charAt(0).toUpperCase() + prefix.slice(1);
      }
    }
    return null;
  })();

  const greetingText = displayFirstName
    ? `${timeGreeting}, ${displayFirstName} 👋`
    : "Welcome back 👋";

  const userInitial = (
    profile?.fullName?.trim()?.charAt(0) ||
    sessionUser?.fullName?.trim()?.charAt(0) ||
    sessionUser?.email?.trim()?.charAt(0) ||
    "P"
  ).toUpperCase();

  // If activeTab is landing, render the rich 3D animated Landing Experience first!
  if (activeTab === "landing") {
    return (
      <>
        <LandingExperience
          isAuthenticated={!!sessionUser}
          onOpenAuth={(mode = "signin", targetTab = "discover") => {
            setAuthModalMode(mode);
            setPendingAuthTargetTab(targetTab);
            setAuthPromptMessage(undefined);
            setAuthModalOpen(true);
          }}
          onLaunchApp={(targetTab = "discover") => {
            if (!sessionUser) {
              setAuthModalMode("signin");
              setPendingAuthTargetTab(targetTab);
              setAuthPromptMessage("Please sign in or authorize as a demo student to access your workspace.");
              setAuthModalOpen(true);
              return;
            }
            setActiveTab(targetTab);
            const keyMap: Record<NavTab, SidebarNavKey> = {
              landing: "home",
              home: "home",
              discover: "discover",
              outlook: "outlook",
              tracker: "applications",
              prep: "interview_prep",
              upskill: "upskill",
              profile: "profile",
              projects: "projects",
              scheduler: "scheduler",
              agent: "agent",
            };
            setActiveSidebarKey(keyMap[targetTab] || "home");
            if (typeof window !== "undefined") {
              window.history.pushState(null, "", `/?tab=${targetTab}`);
            }
          }}
        />
        <AuthModal
          isOpen={authModalOpen}
          initialMode={authModalMode}
          promptMessage={authPromptMessage}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
        />
      </>
    );
  }

  return (
    <div className="workspace-shell flex min-h-screen bg-[#F8F6F1] text-[#111111]">
      {/* Dark Obsidian Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        activeSidebarKey={activeSidebarKey}
        onSelectNav={(tab, sidebarKey) => {
          setActiveTab(tab);
          setActiveSidebarKey(sidebarKey);
          if (typeof window !== "undefined") {
            const newUrl = tab === "landing" ? "/" : `/?tab=${tab}`;
            window.history.pushState(null, "", newUrl);
          }
          if (sidebarKey === "interview_prep") {
            setPrepFocusTab("interview");
          } else {
            setPrepFocusTab(undefined);
          }
          if (
            onboardingStep === "UPLOAD" ||
            onboardingStep === "CONFIRM" ||
            onboardingStep === "OUTLOOK"
          ) {
            setOnboardingStep("DONE");
          }
        }}
        onOpenSources={() => setSourcesModalOpen(true)}
        trackerCount={applications.length}
        prepCount={activePrepItemCount}
        isAgentRunning={isAgentRunning}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        onLogout={handleLogout}
      />

      {/* Right Main Content Column */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Sleek Top Greeting & Utility Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between bg-[#F8F6F1]/90 backdrop-blur-md border-b border-[#E9E6DF] px-4 sm:px-6 lg:px-8 py-3">
          {/* Desktop Time-Aware Greeting */}
          <div className="hidden md:flex items-center gap-3 min-w-0">
            <h1 className="font-heading text-[17px] font-bold tracking-tight text-[#111111] truncate">
              {greetingText}
            </h1>
          </div>

          {/* Mobile Brand & Hamburger */}
          <div className="flex items-center gap-2.5 md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E9E6DF] bg-white text-[#111111] shadow-[0_2px_10px_rgba(17,17,17,0.04)] hover:bg-[#FDFBF8] transition-all cursor-pointer"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("landing");
                if (typeof window !== "undefined") {
                  window.history.pushState(null, "", "/");
                }
              }}
              aria-label="Prospect Landing Page"
              className="flex items-center gap-2 font-heading text-base font-bold text-[#111111] cursor-pointer"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#101010] text-[#DFFF43] text-sm font-extrabold shadow-[0_2px_8px_rgba(17,17,17,0.2)] ring-1 ring-[#DFFF43]/40">
                P
              </span>
              <span>Prospect</span>
            </button>
          </div>

          {/* Right: Live Status Pill, Notification Popover, Profile Avatar Menu & Desktop Sign Out */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-[#E9E6DF] bg-white px-3.5 py-1.5 text-[11px] font-heading font-bold tracking-wide text-[#111111] shadow-[0_2px_10px_rgba(17,17,17,0.04)]">
              <span className="relative flex h-2 w-2">
                {isAgentRunning && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A6D94B] opacity-75" />
                )}
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#70B93F]" />
              </span>
              <span>DISCOVERY ACTIVE</span>
            </div>

            {/* Notification Bell + Floating Popover */}
            <div className="relative" ref={notifMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setNotifPopoverOpen((prev) => !prev);
                }}
                aria-expanded={notifPopoverOpen}
                aria-haspopup="dialog"
                title="Notifications & Intelligence Status"
                aria-label="Notifications and intelligence updates"
                className={`relative flex h-9 w-9 items-center justify-center rounded-full border shadow-[0_2px_10px_rgba(17,17,17,0.04)] text-[#111111] transition-all cursor-pointer ${
                  notifPopoverOpen
                    ? "bg-[#F1FFC7] border-[#D7ED93]"
                    : "bg-white border-[#E9E6DF] hover:border-[#D5D0C6] hover:-translate-y-0.5"
                }`}
              >
                <Bell className="h-4 w-4 stroke-[2]" />
                {(liveUpdatesCount > 0 || isAgentRunning) && (
                  <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-[#70B93F] ring-2 ring-white" />
                )}
              </button>

              {notifPopoverOpen && (
                <div
                  role="dialog"
                  aria-label="Intelligence notifications"
                  className="absolute right-0 mt-2.5 w-80 max-w-[calc(100vw-2rem)] rounded-[20px] bg-white border border-[#E9E6DF] shadow-[0_18px_48px_rgba(17,17,17,0.12)] p-4 z-40 text-left"
                >
                  <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E9E6DF]">
                    <span className="font-heading text-[13px] font-bold text-[#111111]">
                      Notifications
                    </span>
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isAgentRunning
                          ? "bg-[#DFFF43] text-[#111111]"
                          : liveUpdatesCount > 0
                          ? "bg-[#F1FFC7] text-[#111111] border border-[#D7ED93]"
                          : "bg-[#F8F6F1] text-[#777777] border border-[#E9E6DF]"
                      }`}
                    >
                      {isAgentRunning
                        ? "Scanning"
                        : liveUpdatesCount > 0
                        ? `${liveUpdatesCount} updates`
                        : "Live Feed"}
                    </span>
                  </div>

                  <div className="py-3 space-y-2.5">
                    {isAgentRunning && (
                      <div className="rounded-2xl bg-[#F6FFE0] border border-[#D7ED93] p-3 text-xs text-[#111111]">
                        <div className="font-heading font-bold">
                          Live discovery run in progress
                        </div>
                        <p className="text-[11px] text-[#555555] mt-0.5">
                          Evaluating verified employer feeds against your profile.
                        </p>
                      </div>
                    )}

                    {liveUpdatesCount > 0 && (
                      <div className="rounded-2xl bg-[#FDFBF8] border border-[#E9E6DF] p-3 text-xs text-[#111111]">
                        <div className="font-heading font-semibold">
                          {liveUpdatesCount} real-time sync{" "}
                          {liveUpdatesCount === 1 ? "update" : "updates"} received
                        </div>
                        <p className="text-[11px] text-[#777777] mt-0.5">
                          Workspace opportunities and readiness signals refreshed.
                        </p>
                      </div>
                    )}

                    {agentRuns[0] && (
                      <div className="rounded-2xl bg-[#FDFBF8] border border-[#E9E6DF] p-3 text-xs text-[#111111]">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-heading font-semibold truncate">
                            Latest Run ({agentRuns[0].status.toLowerCase()})
                          </span>
                          {agentRuns[0].coverageSummary && (
                            <span className="shrink-0 text-[10px] font-bold text-[#70B93F]">
                              {agentRuns[0].coverageSummary.totalUniqueEvaluated} evaluated
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#777777] mt-1 line-clamp-2">
                          {agentRuns[0].summary || agentRuns[0].query}
                        </p>
                      </div>
                    )}

                    {lastSyncAt && (
                      <div className="flex items-center justify-between px-1 text-[11px] text-[#777777]">
                        <span>Last background sync</span>
                        <span className="font-medium text-[#111111]">
                          {new Date(lastSyncAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}

                    {!isAgentRunning &&
                      liveUpdatesCount === 0 &&
                      !lastSyncAt &&
                      agentRuns.length === 0 && (
                        <div className="rounded-2xl bg-[#FDFBF8] border border-[#E9E6DF] px-3.5 py-4 text-center text-xs text-[#777777]">
                          All caught up — no unread updates yet.
                        </div>
                      )}
                  </div>

                  <div className="pt-2.5 border-t border-[#E9E6DF] grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNotifPopoverOpen(false);
                        setActiveTab("discover");
                        setActiveSidebarKey("discover");
                        if (typeof window !== "undefined") {
                          window.history.pushState(null, "", "/?tab=discover");
                        }
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E9E6DF] bg-[#FDFBF8] hover:bg-[#F1FFC7]/60 hover:border-[#D7ED93] px-3 py-1.5 text-xs font-heading font-semibold text-[#111111] transition-colors cursor-pointer"
                    >
                      <Search className="h-3.5 w-3.5" />
                      <span>Discover</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNotifPopoverOpen(false);
                        setActiveTab("outlook");
                        setActiveSidebarKey("outlook");
                        if (typeof window !== "undefined") {
                          window.history.pushState(null, "", "/?tab=outlook");
                        }
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E9E6DF] bg-[#FDFBF8] hover:bg-[#EAE3FF]/60 hover:border-[#D9CCF8] px-3 py-1.5 text-xs font-heading font-semibold text-[#111111] transition-colors cursor-pointer"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Intelligence</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar + Accessible Dropdown Menu */}
            <div className="relative" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => {
                  setNotifPopoverOpen(false);
                  setProfileMenuOpen((prev) => !prev);
                }}
                aria-expanded={profileMenuOpen}
                aria-haspopup="menu"
                title={
                  profile?.fullName
                    ? `${profile.fullName} — Account & Profile`
                    : "Account & Profile"
                }
                aria-label="Open Account Menu"
                className={`flex h-9 w-9 items-center justify-center rounded-full font-heading text-sm font-bold transition-all cursor-pointer ${
                  profileMenuOpen || activeTab === "profile"
                    ? "bg-[#DFFF43] text-[#111111] ring-2 ring-[#111111] shadow-[0_4px_12px_rgba(223,255,67,0.35)]"
                    : "bg-[#111111] text-[#DFFF43] ring-2 ring-[#DFFF43]/55 hover:ring-[#DFFF43] hover:-translate-y-0.5 shadow-[0_4px_12px_rgba(17,17,17,0.16)]"
                }`}
              >
                {userInitial}
              </button>

              {profileMenuOpen && (
                <div
                  role="menu"
                  aria-label="Profile actions"
                  className="absolute right-0 mt-2.5 w-64 rounded-[20px] bg-white border border-[#E9E6DF] shadow-[0_18px_48px_rgba(17,17,17,0.12)] p-2 z-40 text-left"
                >
                  <div className="px-3 py-2.5 border-b border-[#E9E6DF] mb-1.5">
                    <div className="font-heading text-xs font-bold text-[#111111] truncate">
                      {profile?.fullName || sessionUser?.fullName || "Prospect Member"}
                    </div>
                    <div className="text-[11px] text-[#777777] truncate mt-0.5">
                      {profile?.email || sessionUser?.email || "Authenticated Session"}
                    </div>
                  </div>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setActiveTab("profile");
                      setActiveSidebarKey("profile");
                      if (typeof window !== "undefined") {
                        window.history.pushState(null, "", "/?tab=profile");
                      }
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-heading font-semibold text-[#111111] hover:bg-[#F8F6F1] transition-colors cursor-pointer"
                  >
                    <UserRound className="h-3.5 w-3.5 text-[#777777]" />
                    <span>My Profile &amp; Resume</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setSourcesModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-heading font-semibold text-[#111111] hover:bg-[#F8F6F1] transition-colors cursor-pointer"
                  >
                    <Link2 className="h-3.5 w-3.5 text-[#777777]" />
                    <span>Opportunity Sources</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setOnboardingStep("UPLOAD");
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-heading font-semibold text-[#111111] hover:bg-[#F8F6F1] transition-colors cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5 text-[#777777]" />
                    <span>Upload New Resume</span>
                  </button>

                  <div className="my-1.5 border-t border-[#E9E6DF]" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      handleLogout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-heading font-semibold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>

            {/* Subtle Desktop Header Logout Pill */}
            <button
              type="button"
              onClick={handleLogout}
              title="Sign out of Prospect"
              aria-label="Sign out"
              className="hidden lg:inline-flex items-center gap-1.5 rounded-full border border-[#E9E6DF] bg-white hover:bg-red-50/80 hover:border-red-200 text-[#111111]/80 hover:text-red-600 px-3 py-1.5 text-[12px] font-heading font-semibold shadow-[0_2px_10px_rgba(17,17,17,0.04)] transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 stroke-[2]" />
              <span>Sign out</span>
            </button>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 px-4 pt-5 pb-8 sm:px-6 lg:px-8 w-full min-w-0">
          {onboardingStep === "UPLOAD" ? (
            <ResumeUploadExperience
              onParsedSuccess={handleResumeParsed}
              onSkipToManual={() => {
                setOnboardingStep("DONE");
                setActiveTab("profile");
              }}
              isReplacingResume={profile !== null}
            />
          ) : onboardingStep === "CONFIRM" && extractedResumeData ? (
            <ProfileConfirmationView
              initialProfile={extractedResumeData.extractedProfile}
              suggestedRoles={extractedResumeData.suggestedRoles}
              suggestedCategories={extractedResumeData.suggestedCategories}
              lowConfidenceFields={extractedResumeData.lowConfidenceFields}
              fieldConfidences={extractedResumeData.fieldConfidences}
              isScannedOrLowText={extractedResumeData.stats?.isScannedOrLowText}
              filename={extractedResumeData.filename}
              onConfirm={handleConfirmProfileAndSearch}
              onReupload={() => setOnboardingStep("UPLOAD")}
              isSaving={isSavingProfile}
            />
          ) : onboardingStep === "OUTLOOK" && (careerOutlook || profile) ? (
            <CareerOutlookExperience
              outlook={
                careerOutlook || (profile ? generateCareerOutlook(profile) : ({} as any))
              }
              userProfile={profile || (extractedResumeData?.extractedProfile as any)}
              initialPreferences={pendingPreferences}
              onConfirm={handleConfirmCareerOutlookAndSearch}
              onBackToProfile={() => setOnboardingStep("CONFIRM")}
              isSearching={isAgentRunning}
            />
          ) : onboardingStep === "SEARCHING" ? (
            <AgentExecutionExperience
              onComplete={() => {
                setOnboardingStep("DONE");
                setActiveTab("discover");
              }}
              targetRoles={
                pendingPreferences?.targetRoles ||
                profile?.targetRoles || [
                  "Software Engineering Intern",
                ]
              }
              searchMode={searchMode}
              isCompleted={!isAgentRunning}
              totalOpportunitiesFound={opportunities.length}
              error={agentExecutionError}
            />
          ) : (
            <>
              {activeTab === "home" && (
                <HomeView
                  profile={profile}
                  opportunities={opportunities}
                  applications={applications}
                  preparationPlans={preparationPlans}
                  careerOutlook={careerOutlook}
                  savedOpportunityIds={applications.map((a) => a.opportunityId)}
                  searchMode={searchMode}
                  loadingOpportunities={loadingOpportunities}
                  onNavigate={(tab) => {
                    setActiveTab(tab);
                    const map: Record<NavTab, SidebarNavKey> = {
                      landing: "home",
                      home: "home",
                      discover: "discover",
                      outlook: "outlook",
                      tracker: "applications",
                      prep: "interview_prep",
                      upskill: "upskill",
                      profile: "profile",
                      projects: "projects",
                      scheduler: "scheduler",
                      agent: "agent",
                    };
                    setActiveSidebarKey(map[tab]);
                  }}
                  onInspectOpportunity={handleInspectOpportunity}
                  onSaveToTracker={(opp) => handleSaveToTracker(opp)}
                  onUploadResume={() => setOnboardingStep("UPLOAD")}
                />
              )}

              {activeTab === "outlook" && (
                profile ? (
                  <CareerIntelligenceCommandCenter
                    profile={profile}
                    opportunities={opportunities}
                    capabilityMap={capabilityMap}
                    expandedRoles={expandedRoles}
                    careerOutlook={
                      careerOutlook || (profile ? generateCareerOutlook(profile) : null)
                    }
                    initialPreferences={pendingPreferences}
                    isSearching={isAgentRunning}
                    onConfirmOutlookAndSearch={async (selectedDirs, prefs) => {
                      await handleConfirmCareerOutlookAndSearch(selectedDirs, prefs);
                      setActiveTab("discover");
                      setActiveSidebarKey("discover");
                    }}
                    onNavigateDiscover={() => {
                      setActiveTab("discover");
                      setActiveSidebarKey("discover");
                    }}
                    onUploadResume={() => setOnboardingStep("UPLOAD")}
                  />
                ) : onboardingStep === "CHECKING" ? (
                  <div className="mx-auto max-w-4xl py-12 px-4 space-y-6 animate-pulse">
                    <div className="ws-card h-44 p-8 space-y-4">
                      <div className="h-5 w-44 rounded-full bg-[#E9E6DF]/80" />
                      <div className="h-8 w-80 max-w-full rounded-xl bg-[#E9E6DF]/80" />
                      <div className="h-4 w-64 max-w-full rounded-full bg-[#E9E6DF]/60" />
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto max-w-xl my-8 text-center space-y-4 ws-card p-10">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F6FFE0] to-[#F1FFC7] border border-[#D7ED93] text-[#111111] shadow-[0_6px_18px_rgba(166,217,75,0.22)]">
                      <Compass className="h-7 w-7" />
                    </div>
                    <h2 className="font-heading text-2xl font-bold tracking-tight text-[#111111]">
                      No Resume Uploaded Yet
                    </h2>
                    <p className="text-sm text-[#777777] leading-relaxed">
                      Upload your resume once to unlock your personalized Career Outlook, verified strengths, and real-time opportunity discovery.
                    </p>
                    <button
                      type="button"
                      onClick={() => setOnboardingStep("UPLOAD")}
                      className="ws-btn-primary mt-2 inline-flex items-center gap-2 px-6 py-3 text-sm cursor-pointer"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload Resume Now</span>
                    </button>
                  </div>
                )
              )}

              {activeTab === "tracker" && (
                <TrackerView
                  applications={applications}
                  upcomingDeadlines={upcomingDeadlines}
                  userProfile={profile}
                  initialTab={activeSidebarKey === "tracker" ? "metrics" : "pipeline"}
                  onUpdateApplication={handleUpdateApplication}
                  onDeleteApplication={handleDeleteApplication}
                  onInspectOpportunity={handleInspectOpportunity}
                  onOpenAddModal={(stage) => {
                    setAddModalStage(stage || "SAVED");
                    setAddModalOpen(true);
                  }}
                />
              )}

              {activeTab === "discover" && (
                <DiscoverView
                  opportunities={opportunities}
                  loading={loadingOpportunities}
                  onSearch={loadOpportunities}
                  onInspectOpportunity={handleInspectOpportunity}
                  onSaveToTracker={(opp) => handleSaveToTracker(opp)}
                  onRunAgentDiscovery={handleRunAgentDiscovery}
                  onCancelAgentDiscovery={handleCancelAgentDiscovery}
                  isAgentRunning={isAgentRunning}
                  liveEvents={liveEvents}
                  agentError={agentExecutionError}
                  wasSearchCancelled={wasSearchCancelled}
                  personalizationSummary={personalizationSummary}
                  rankingMetrics={rankingMetrics}
                  locationPreference={locationPreference || profile?.locationPreference || null}
                  onUpdateLocationPreference={(pref) => {
                    setLocationPreference(pref);
                    if (profile) {
                      setProfile({ ...profile, locationPreference: pref });
                    }
                  }}
                  onTriggerBackgroundSync={handleTriggerBackgroundSync}
                  isSyncing={isSyncing}
                  lastSyncAt={lastSyncAt}
                  searchMode={searchMode}
                  onChangeSearchMode={(m) => {
                    setSearchMode(m);
                    loadOpportunities({ mode: m });
                    loadProfileAndIntelligence(m);
                    loadApplications(m);
                  }}
                  expandedRoles={expandedRoles}
                  capabilityMap={capabilityMap}
                  latestRun={agentRuns.length > 0 ? agentRuns[0] : null}
                  onDismissRoleFamily={handleDismissRoleFamily}
                  onResetPersonalization={handleResetPersonalization}
                  onFeedback={handleFeedback}
                  onOpenAgentTab={() => {
                    setActiveTab("agent");
                    setActiveSidebarKey("agent");
                  }}
                  onOpenSourcesModal={() => setSourcesModalOpen(true)}
                  savedOpportunityIds={applications.map((a) => a.opportunityId)}
                  userProfile={profile}
                  onUploadNewResume={() => setOnboardingStep("UPLOAD")}
                  careerOutlook={careerOutlook}
                  onOpenCareerOutlook={() => {
                    setActiveTab("outlook");
                    setActiveSidebarKey("outlook");
                  }}
                  realtimeConnected={realtimeConnected}
                  liveUpdatesCount={liveUpdatesCount}
                  externalSearchCommand={discoverExternalCommand}
                  onOpenProjectLab={() => {
                    setActiveTab("projects");
                    setActiveSidebarKey("projects");
                  }}
                />
              )}

              {activeTab === "prep" && (
                <PreparationPlansView
                  plans={preparationPlans}
                  opportunities={opportunities.map((o) => o.opportunity)}
                  evaluations={opportunities.map((o) => ({
                    opportunityId: o.opportunity.id,
                    evaluation: o.evaluation,
                  }))}
                  profile={profile}
                  onToggleItem={handleTogglePlanItem}
                  onInspectOpportunity={handleInspectOpportunity}
                  onNavigateDiscover={() => {
                    setActiveTab("discover");
                    setActiveSidebarKey("discover");
                  }}
                  onGeneratePlan={handleGeneratePlan}
                  onUploadResume={() => setOnboardingStep("UPLOAD")}
                  initialStudioTab={prepFocusTab}
                />
              )}

              {activeTab === "upskill" && (
                <UpskillView
                  userProfile={profile}
                  onNavigateDiscover={() => {
                    setActiveTab("discover");
                    setActiveSidebarKey("discover");
                  }}
                  onOpenProjectLab={() => {
                    setActiveTab("projects");
                    setActiveSidebarKey("projects");
                  }}
                />
              )}

              {activeTab === "profile" && (
                <ProfileView
                  profile={profile}
                  onSaveProfile={handleSaveProfile}
                  onDeleteProfile={handleDeleteProfile}
                  onUploadNewResume={() => setOnboardingStep("UPLOAD")}
                />
              )}

              {activeTab === "projects" && (
                <ProjectEvaluatorView
                  profile={profile}
                  onInspectOpportunity={handleInspectOpportunity}
                  onProjectAddedToProfile={() => {
                    loadProfileAndIntelligence();
                    loadOpportunities(activeSearchParamsRef.current);
                  }}
                  onShowToast={showToast}
                />
              )}

              {activeTab === "scheduler" && (
                <SchedulerView
                  onShowToast={showToast}
                  onSyncCompleted={() => {
                    loadOpportunities(activeSearchParamsRef.current);
                    loadStatus();
                  }}
                />
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-[#E9E6DF] bg-[#F8F6F1]/90 py-4 text-xs text-[#777777]">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => {
                setActiveTab("landing");
                if (typeof window !== "undefined") {
                  window.history.pushState(null, "", "/");
                }
              }}
              className="flex items-center space-x-2 text-left hover:opacity-80 transition-opacity cursor-pointer"
            >
              <span className="font-heading font-bold text-[#111111]">PROSPECT</span>
              <span>—</span>
              <span>Adaptive Career Intelligence Engine</span>
            </button>

            <div className="flex items-center space-x-4">
              <span className="font-semibold text-[#111111]">Verified Employer Ingestion Active</span>
              <span>•</span>
              <span>Human In The Loop Verified</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 flex items-center gap-2.5 rounded-2xl border border-white/10 bg-[#101010]/95 backdrop-blur-md px-4 py-3 font-heading text-xs font-semibold text-white shadow-[0_14px_34px_rgba(17,17,17,0.28)] animate-in slide-in-from-bottom-3 duration-200 max-w-md">
          <span className="h-2 w-2 rounded-full bg-[#DFFF43] shrink-0 shadow-[0_0_8px_#DFFF43]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Opportunity Detail Drawer / Contextual Modal */}
      <OpportunityDetailModal
        opportunity={selectedOpportunity}
        initialEvaluation={selectedEvaluation}
        initialTab={detailModalTab}
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        onSaveToTracker={(opp) => handleSaveToTracker(opp)}
        onPlanUpdated={() => {
          loadPlans();
          loadOpportunities();
          loadProfileAndIntelligence();
        }}
      />

      {/* Add Application Modal */}
      <AddApplicationModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        opportunities={opportunities.map((o) => o.opportunity)}
        onSaveToTracker={handleSaveToTracker}
        initialStage={addModalStage}
      />

      {/* Connected Sources & Direct URL Importer Modal */}
      <ConnectedSourcesModal
        isOpen={sourcesModalOpen}
        onClose={() => setSourcesModalOpen(false)}
        userProfile={profile}
        onSaveToTracker={(opp) => handleSaveToTracker(opp)}
        onInspectOpportunity={handleInspectOpportunity}
      />

      {/* AI Career Chat Assistant */}
      <AiCareerChatDrawer
        profile={profile}
        activeTab={activeTab}
        activeLocationMode={
          activeSearchParamsRef.current.locationMode || "VICINITY"
        }
        onExecuteAction={handleExecuteChatAction}
      />

      {/* Workspace Authentication Guard Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        promptMessage={authPromptMessage}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}

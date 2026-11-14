"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Sidebar, NavTab, SidebarNavKey } from "@/components/Sidebar";
import { SetupHintModal } from "@/components/SetupHintModal";
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
import { ProfileView } from "@/components/views/ProfileView";
import { AgentActivityView } from "@/components/views/AgentActivityView";
import { ProjectEvaluatorView } from "@/components/views/ProjectEvaluatorView";
import { SchedulerView } from "@/components/views/SchedulerView";
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
import { Bell, Compass, Menu, Sparkles, Upload } from "lucide-react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<NavTab>("landing");
  const [activeSidebarKey, setActiveSidebarKey] = useState<SidebarNavKey>("home");
  const [prepFocusTab, setPrepFocusTab] = useState<"resume" | "interview" | undefined>(undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sourcesModalOpen, setSourcesModalOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<"DEMO" | "LIVE">("LIVE");
  const [statusData, setStatusData] = useState<any>(null);
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addModalStage, setAddModalStage] = useState<ApplicationStage>("SAVED");

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
          setActiveSidebarKey(
            rawParam === "tracker" ? "tracker" : keyMap[mappedTab] || "home"
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
      } = {}
    ) => {
      setLoadingOpportunities(true);
      activeSearchParamsRef.current = params;
      const reqId = ++latestOppRequestIdRef.current;
      try {
        const searchParams = new URLSearchParams();
        searchParams.set("mode", params.mode || searchMode);
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

        const res = await fetch(`/api/opportunities?${searchParams.toString()}`);
        const data = await res.json();
        if (reqId !== latestOppRequestIdRef.current) return;
        if (data.opportunities) {
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
    [searchMode]
  );

  // 3. Load Profile & Search Intelligence
  const loadProfileAndIntelligence = useCallback(
    async (modeOverride?: "DEMO" | "LIVE") => {
      try {
        const activeMode = modeOverride || searchMode;
        const [profRes, intelRes] = await Promise.all([
          fetch("/api/profile"),
          fetch(`/api/search/intelligence?mode=${activeMode}`),
        ]);
        const profData = await profRes.json();
        if (profData.profile && (profData.profile.skills?.length > 0 || profData.profile.fullName)) {
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
          setOnboardingStep((prev) => (prev === "CHECKING" ? "UPLOAD" : prev));
        }
        const intelData = await intelRes.json();
        if (intelData.capabilityMap) {
          setCapabilityMap(intelData.capabilityMap);
        }
        if (intelData.expandedRoles) {
          setExpandedRoles(intelData.expandedRoles);
        }
      } catch (err) {
        console.error(err);
        setOnboardingStep((prev) => (prev === "CHECKING" ? "UPLOAD" : prev));
      }
    },
    [searchMode]
  );

  // 4. Load Tracker Applications
  const loadApplications = useCallback(
    async (modeOverride?: "DEMO" | "LIVE") => {
      try {
        const activeMode = modeOverride || searchMode;
        const res = await fetch(`/api/tracker?mode=${activeMode}`);
        const data = await res.json();
        if (data.applications) setApplications(data.applications);
        if (data.upcomingDeadlines) setUpcomingDeadlines(data.upcomingDeadlines);
      } catch (err) {
        console.error(err);
      }
    },
    [searchMode]
  );

  // 5. Load Preparation Plans
  const loadPlans = async () => {
    try {
      const res = await fetch("/api/preparation-plans");
      const data = await res.json();
      if (data.plans) setPreparationPlans(data.plans);
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Load Agent Runs Trace
  const loadAgentRuns = async () => {
    try {
      const res = await fetch("/api/agent/runs");
      const data = await res.json();
      if (data.runs) setAgentRuns(data.runs);
    } catch (err) {
      console.error(err);
    }
  };

  // Initial Data Bootstrap
  useEffect(() => {
    loadStatus();
    loadProfileAndIntelligence();
    loadOpportunities({ locationMode: "VICINITY" });
    loadApplications();
    loadPlans();
    loadAgentRuns();
  }, [loadOpportunities, loadProfileAndIntelligence]);

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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
      const res = await fetch(`/api/tracker?id=${id}`, { method: "DELETE" });
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

    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
      } else if (data.summary) {
        showToast(data.summary);
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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

  // Save Profile Facts
  const handleSaveProfile = async (updated: Partial<UserProfile>) => {
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
    const res = await fetch("/api/profile", { method: "DELETE" });
    if (res.ok) {
      setProfile(null);
      setCapabilityMap(null);
      setExpandedRoles([]);
      setOpportunities([]);
      setOnboardingStep("UPLOAD");
      showToast("All profile data and extracted facts have been deleted.");
      loadOpportunities();
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
        headers: { "Content-Type": "application/json" },
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

    try {
      // 1. Persist confirmed career directions
      try {
        await fetch("/api/career-outlook", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
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
        await Promise.all([
          loadOpportunities({
            locationMode: "VICINITY",
            mode: searchPreferences.mode,
          }),
          loadAgentRuns(),
          loadPlans(),
          loadProfileAndIntelligence(searchPreferences.mode),
        ]);
        showToast(
          `Synced local vicinity discovery for ${cleanLoc || "your profile"}!`
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

  const userInitial = (profile?.fullName?.trim()?.charAt(0) || "S").toUpperCase();

  // If activeTab is landing, render the rich 3D animated Landing Experience first!
  if (activeTab === "landing") {
    return (
      <LandingExperience
        onLaunchApp={(targetTab = "discover") => {
          setActiveTab(targetTab);
          const keyMap: Record<NavTab, SidebarNavKey> = {
            landing: "home",
            home: "home",
            discover: "discover",
            outlook: "outlook",
            tracker: "applications",
            prep: "interview_prep",
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
    );
  }

  return (
    <div className="flex min-h-screen bg-[#FDF9F3] text-[#080808]">
      {/* Fixed Neo-Brutalist Left Sidebar */}
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
          } else if (sidebarKey === "upskill") {
            setPrepFocusTab("resume");
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
      />

      {/* Right Main Content Column */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Slim Top-Right Utility Header (Mobile menu + Bell + Avatar) */}
        <header className="sticky top-0 z-20 flex items-center justify-between md:justify-end bg-[#FDF9F3]/95 backdrop-blur-sm px-4 pt-3.5 pb-2 sm:px-6 lg:px-8">
          {/* Mobile Brand & Hamburger */}
          <div className="flex items-center gap-2.5 md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[#080808] bg-white text-[#080808] shadow-[2px_2px_0px_#080808] cursor-pointer"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("home");
                setActiveSidebarKey("home");
              }}
              className="flex items-center gap-2 font-heading text-base font-extrabold text-[#080808] cursor-pointer"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#080808] text-white text-sm font-extrabold">
                P
              </span>
              <span>Prospect</span>
            </button>
          </div>

          {/* Right: Live Pill, Bell & Profile Initial */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/landing"
              title="Explore 3D Landing Page & Architecture Tour"
              className="hidden md:inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-[#E0FB66] px-3 py-1 text-[11px] font-heading font-extrabold shadow-[2px_2px_0px_#080808] hover:-translate-y-0.5 transition-all text-[#080808] cursor-pointer"
            >
              <Sparkles className="h-3 w-3 stroke-[2.5]" />
              <span>3D Tour</span>
            </Link>
            <button
              type="button"
              onClick={() => setSetupModalOpen(true)}
              title="Inspect live search and AI engine status"
              className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] px-3 py-1 text-[11px] font-heading font-bold shadow-[2px_2px_0px_#080808] transition-all cursor-pointer ${
                searchMode === "DEMO"
                  ? "bg-[#FEF189] text-[#080808]"
                  : "bg-white text-[#080808] hover:bg-[#E0FB66]"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full border border-[#080808] ${
                  searchMode === "DEMO"
                    ? "bg-[#FEF189]"
                    : "bg-[#E0FB66] animate-pulse"
                }`}
              />
              <span>{searchMode === "DEMO" ? "DEMO" : realtimeConnected ? "LIVE AUTO-SYNC" : "LIVE"}</span>
            </button>

            <button
              type="button"
              onClick={() => setSetupModalOpen(true)}
              title="Provider & Engine Status"
              aria-label="Notifications and Engine Status"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-transparent hover:border-[#080808] hover:bg-white text-[#080808] transition-all cursor-pointer"
            >
              <Bell className="h-[18px] w-[18px] stroke-[2]" />
              <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-[#080808]" />
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("profile");
                setActiveSidebarKey("profile");
              }}
              title={
                profile?.fullName
                  ? `${profile.fullName} — Profile & Resume`
                  : "Profile & Resume"
              }
              aria-label="Open Candidate Profile"
              className={`flex h-9 w-9 items-center justify-center rounded-full font-heading text-sm font-extrabold transition-all cursor-pointer ${
                activeTab === "profile"
                  ? "bg-[#E0FB66] text-[#080808] border-2 border-[#080808] shadow-[2px_2px_0px_#080808]"
                  : "bg-[#080808] text-white border-2 border-[#080808] hover:-translate-y-0.5 shadow-[2px_2px_0px_#D8D5CE]"
              }`}
            >
              {userInitial}
            </button>
          </div>
        </header>

        {/* View Content */}
        <main className="flex-1 px-4 pt-2 pb-6 sm:px-6 lg:px-8 w-full min-w-0">
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
              {(activeTab === "outlook" || activeTab === "agent") && (
                <div className="mx-auto max-w-6xl mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-full border-2 border-[#080808] bg-white p-1 shadow-[3px_3px_0px_#080808]">
                    <button
                      type="button"
                      onClick={() => setActiveTab("outlook")}
                      className={`rounded-full px-4 py-1.5 font-heading text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "outlook"
                          ? "bg-[#E0FB66] text-[#080808] border border-[#080808]"
                          : "text-[#777777] hover:text-[#080808]"
                      }`}
                    >
                      Career Outlook
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("agent")}
                      className={`rounded-full px-4 py-1.5 font-heading text-xs font-bold transition-all cursor-pointer ${
                        activeTab === "agent"
                          ? "bg-[#E0FB66] text-[#080808] border border-[#080808]"
                          : "text-[#777777] hover:text-[#080808]"
                      }`}
                    >
                      Search & Agent Activity
                    </button>
                  </div>
                </div>
              )}

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
                careerOutlook || profile ? (
                  <CareerOutlookExperience
                    outlook={
                      careerOutlook || (profile ? generateCareerOutlook(profile) : ({} as any))
                    }
                    userProfile={profile || (extractedResumeData?.extractedProfile as any) || ({} as any)}
                    initialPreferences={pendingPreferences}
                    onConfirm={async (selectedDirs, prefs) => {
                      await handleConfirmCareerOutlookAndSearch(selectedDirs, prefs);
                      setActiveTab("discover");
                    }}
                    onBackToProfile={() => setActiveTab("discover")}
                    backButtonLabel="Back to Discover Opportunities"
                    isSearching={isAgentRunning}
                  />
                ) : onboardingStep === "CHECKING" ? (
                  <div className="mx-auto max-w-4xl py-12 px-4 space-y-6 animate-pulse">
                    <div className="neo-card h-40 p-8 space-y-4">
                      <div className="h-6 w-48 rounded bg-[#D8D5CE]/50" />
                      <div className="h-8 w-96 rounded bg-[#D8D5CE]/50" />
                      <div className="h-4 w-72 rounded bg-[#D8D5CE]/30" />
                    </div>
                  </div>
                ) : (
                  <div className="mx-auto max-w-xl py-16 px-4 text-center space-y-4 neo-card p-10">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-[#080808] bg-[#E0FB66] text-[#080808]">
                      <Compass className="h-7 w-7" />
                    </div>
                    <h2 className="font-heading text-2xl font-extrabold text-[#080808]">
                      No Resume Uploaded Yet
                    </h2>
                    <p className="text-sm text-[#777777]">
                      Upload your resume once to unlock your personalized Career Outlook, verified strengths, and real-time opportunity discovery.
                    </p>
                    <button
                      type="button"
                      onClick={() => setOnboardingStep("UPLOAD")}
                      className="neo-btn-primary mt-2 inline-flex items-center gap-2 px-6 py-3 text-sm cursor-pointer"
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
                  initialStudioTab={prepFocusTab}
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

              {activeTab === "agent" && (
                <AgentActivityView
                  runs={agentRuns}
                  onRefresh={() => {
                    loadAgentRuns();
                    loadOpportunities();
                    loadPlans();
                  }}
                  onRunCompleted={(msg) => {
                    showToast(msg);
                    loadOpportunities();
                    loadPlans();
                    loadProfileAndIntelligence();
                  }}
                />
              )}
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t-2 border-[#080808] bg-[#FDF9F3] py-4 text-xs text-[#777777]">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6 lg:px-8">
            <div className="flex items-center space-x-2">
              <span className="font-heading font-extrabold text-[#080808]">PROSPECT</span>
              <span>—</span>
              <span>Adaptive Career Intelligence Engine</span>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSetupModalOpen(true)}
                className="font-bold text-[#080808] hover:underline cursor-pointer"
              >
                Engine Status (Live Multi-Source APIs)
              </button>
              <span>•</span>
              <span>Human In The Loop Verified</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 flex items-center space-x-2 rounded-2xl border-2 border-[#080808] bg-[#E0FB66] px-4 py-3 font-heading text-xs font-extrabold text-[#080808] shadow-[4px_4px_0px_#080808] animate-in slide-in-from-bottom-3 duration-200 max-w-md">
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

      {/* Setup Hint & Engine Settings Modal */}
      <SetupHintModal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        statusData={statusData}
        onUploadNewResume={() => setOnboardingStep("UPLOAD")}
      />
    </div>
  );
}

"use client";

import React from "react";
import {
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  FolderGit2,
  Home,
  Link2,
  LogOut,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";

export type NavTab =
  | "landing"
  | "home"
  | "discover"
  | "outlook"
  | "tracker"
  | "prep"
  | "upskill"
  | "profile"
  | "projects"
  | "scheduler"
  | "agent";

export type SidebarNavKey =
  | "home"
  | "discover"
  | "outlook"
  | "profile"
  | "projects"
  | "scheduler"
  | "applications"
  | "interview_prep"
  | "upskill"
  | "tracker"
  | "agent";

interface SidebarProps {
  activeTab: NavTab;
  activeSidebarKey?: SidebarNavKey;
  onSelectNav: (tab: NavTab, sidebarKey: SidebarNavKey) => void;
  onOpenSources: () => void;
  trackerCount?: number;
  prepCount?: number;
  isAgentRunning?: boolean;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onLogout?: () => void;
}

export function Sidebar({
  activeTab,
  activeSidebarKey,
  onSelectNav,
  onOpenSources,
  trackerCount = 0,
  prepCount = 0,
  isAgentRunning = false,
  mobileOpen = false,
  onCloseMobile,
  onLogout,
}: SidebarProps) {
  // Resolve highlighted item cleanly when deep-linking via ?tab= or programmatic navigation
  const resolvedKey: SidebarNavKey =
    activeSidebarKey &&
    ((activeSidebarKey === "applications" && activeTab === "tracker") ||
      (activeSidebarKey === "tracker" && activeTab === "tracker") ||
      (activeSidebarKey === "interview_prep" && activeTab === "prep") ||
      (activeSidebarKey === "upskill" && activeTab === "upskill") ||
      activeSidebarKey === activeTab)
      ? activeSidebarKey
      : activeTab === "tracker"
      ? (activeSidebarKey === "tracker" ? "tracker" : "applications")
      : activeTab === "prep"
      ? "interview_prep"
      : activeTab === "upskill"
      ? "upskill"
      : activeTab === "landing"
      ? "home"
      : (activeTab as any);

  const primaryItems: Array<{
    key: SidebarNavKey;
    tab: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }> = [
    { key: "home", tab: "home", label: "Home", icon: Home },
    { key: "discover", tab: "discover", label: "Discover", icon: Search },
    { key: "outlook", tab: "outlook", label: "Intelligence", icon: Sparkles },
    { key: "profile", tab: "profile", label: "Profile", icon: UserRound },
    { key: "projects", tab: "projects", label: "Project Lab", icon: FolderGit2 },
    { key: "scheduler", tab: "scheduler", label: "Scheduler", icon: CalendarClock },
    {
      key: "applications",
      tab: "tracker",
      label: "Applications",
      icon: BriefcaseBusiness,
      count: trackerCount,
    },
    {
      key: "interview_prep",
      tab: "prep",
      label: "Interview Prep",
      icon: Target,
      count: prepCount,
    },
    {
      key: "upskill",
      tab: "upskill",
      label: "Upskill",
      icon: BookOpen,
    },
    {
      key: "tracker",
      tab: "tracker",
      label: "Tracker",
      icon: TrendingUp,
    },
  ];

  const handleNavClick = (tab: NavTab, key: SidebarNavKey) => {
    onSelectNav(tab, key);
    onCloseMobile?.();
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#FDF9F3] border-r-2 border-[#080808] select-none">
      {/* Brand Header & Navigation */}
      <div className="px-4 pt-5 pb-3 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-1.5 mb-4">
          <button
            type="button"
            onClick={() => handleNavClick("landing", "home")}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
            aria-label="Prospect Landing Page"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#080808] text-white font-heading font-extrabold text-base shadow-[2px_2px_0px_#E0FB66] group-hover:-translate-y-0.5 transition-transform">
              P
            </div>
            <span className="font-heading text-xl font-extrabold tracking-tight text-[#080808]">
              Prospect
            </span>
          </button>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="rounded-xl border-2 border-[#080808] bg-white p-1 text-[#080808] hover:bg-[#FEF189] md:hidden cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Primary Menu List */}
        <nav className="space-y-1" aria-label="Main Navigation">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = resolvedKey === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavClick(item.tab, item.key)}
                className={`group flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-heading transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#E0FB66] text-[#080808] font-bold border-2 border-[#080808] shadow-[2px_2px_0px_#080808]"
                    : "text-[#080808]/80 font-semibold border-2 border-transparent hover:bg-white hover:text-[#080808]"
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon className="h-4 w-4 shrink-0 stroke-[2]" />
                  <span className="truncate">{item.label}</span>
                </span>

                {typeof item.count === "number" && item.count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-extrabold leading-none ${
                      isActive
                        ? "bg-[#080808] text-[#E0FB66]"
                        : "bg-[#EAE6DC] text-[#080808]"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Secondary Section: Opportunity Sources Hub */}
        <div className="my-3.5 border-t-2 border-[#080808]/10" />
        <div className="px-0.5">
          <button
            type="button"
            onClick={() => {
              onOpenSources();
              onCloseMobile?.();
            }}
            className="group flex w-full items-center justify-between rounded-xl border-2 border-[#080808] bg-white p-2.5 font-heading text-xs font-extrabold text-[#080808] shadow-[2px_2px_0px_#080808] hover:bg-[#FEF189] hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <span className="flex items-center gap-2 min-w-0">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#E0FB66] border border-[#080808]">
                <Link2 className="h-3.5 w-3.5 stroke-[2.5] text-[#080808]" />
              </span>
              <span className="truncate">Opportunity Sources</span>
            </span>
            <span className="rounded-full bg-[#080808] text-[#E0FB66] px-1.5 py-0.5 text-[9px] font-extrabold">
              Hub
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Status Card: Minimalist Neo-Brutalist Engine Status */}
      <div className="p-3.5 pt-2">
        <div className="w-full rounded-2xl border-2 border-[#080808] bg-[#F4EFE6] p-3 shadow-[3px_3px_0px_#080808]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-heading text-xs font-extrabold text-[#080808]">
                Intelligence Engine
              </span>
            </div>
            <span className="rounded-full bg-[#E0FB66] border border-[#080808] px-2 py-0.5 text-[9px] font-extrabold text-[#080808]">
              {isAgentRunning ? "Running" : "Live"}
            </span>
          </div>
          <div className="mt-1 text-[11px] font-semibold text-[#080808]/75">
            Verified Ingestion Active • Ghost-Free
          </div>
        </div>

        {onLogout && (
          <button
            type="button"
            onClick={onLogout}
            title="Sign out and return to landing page"
            className="mt-2.5 w-full flex items-center justify-center gap-2 rounded-xl border-2 border-[#080808] bg-white hover:bg-red-50 text-[#080808] hover:text-red-600 px-3 py-2 text-xs font-heading font-bold shadow-[2px_2px_0px_#080808] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden md:flex md:w-60 md:shrink-0 md:flex-col sticky top-0 h-screen z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-[#080808]/50 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative flex w-64 max-w-[82vw] flex-1 flex-col shadow-2xl">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

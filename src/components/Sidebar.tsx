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

interface SidebarMenuItem {
  key: SidebarNavKey;
  tab: NavTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  count?: number;
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
      ? activeSidebarKey === "tracker"
        ? "tracker"
        : "applications"
      : activeTab === "prep"
      ? "interview_prep"
      : activeTab === "upskill"
      ? "upskill"
      : activeTab === "landing"
      ? "home"
      : (activeTab as SidebarNavKey);

  const primaryItems: SidebarMenuItem[] = [
    { key: "home", tab: "home", label: "Home", icon: Home },
    { key: "discover", tab: "discover", label: "Discover", icon: Search },
    { key: "outlook", tab: "outlook", label: "Intelligence", icon: Sparkles },
    { key: "profile", tab: "profile", label: "Profile", icon: UserRound },
    { key: "projects", tab: "projects", label: "Project Lab", icon: FolderGit2 },
    { key: "scheduler", tab: "scheduler", label: "Scheduler", icon: CalendarClock },
  ];

  const growthItems: SidebarMenuItem[] = [
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

  const renderNavItem = (item: SidebarMenuItem) => {
    const Icon = item.icon;
    const isActive = resolvedKey === item.key;
    return (
      <button
        key={item.key}
        type="button"
        onClick={() => handleNavClick(item.tab, item.key)}
        aria-current={isActive ? "page" : undefined}
        className={`group flex w-full items-center justify-between py-2 px-3.5 text-[13px] rounded-full font-heading transition-all cursor-pointer ${
          isActive
            ? "bg-[#DFFF43] text-[#111111] font-bold shadow-[0_6px_20px_rgba(223,255,67,0.28)]"
            : "text-white/65 hover:text-white hover:bg-white/[0.07] font-medium"
        }`}
      >
        <span className="flex items-center gap-2.5 min-w-0">
          <Icon
            className={`h-4 w-4 shrink-0 ${
              isActive
                ? "stroke-[2.25] text-[#111111]"
                : "stroke-[1.9] text-white/60 group-hover:text-white"
            }`}
          />
          <span className="truncate">{item.label}</span>
        </span>

        {typeof item.count === "number" && item.count > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
              isActive
                ? "bg-[#111111] text-[#DFFF43]"
                : "bg-white/10 text-white/80 group-hover:bg-white/15"
            }`}
          >
            {item.count}
          </span>
        )}
      </button>
    );
  };

  const sidebarContent = (
    <div className="relative flex h-full flex-col justify-between bg-[#101010] text-white border-r border-white/[0.06] select-none overflow-hidden">
      {/* Ambient Liquid Green Wave Texture Behind Bottom Panel */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 overflow-hidden"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/sidebar-wave.webp"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center opacity-50 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#101010] via-[#101010]/65 to-transparent" />
      </div>

      {/* Brand Header & Navigation */}
      <div className="relative z-10 px-3 pt-5 pb-3 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between px-1.5 mb-5">
          <button
            type="button"
            onClick={() => handleNavClick("landing", "home")}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
            aria-label="Prospect Landing Page"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#DFFF43] to-[#A6D94B] text-[#111111] font-heading font-extrabold text-base shadow-[0_0_20px_rgba(223,255,67,0.38)] ring-1 ring-white/20 group-hover:scale-[1.04] transition-transform">
              <svg
                viewBox="0 0 24 24"
                className="h-4.5 w-4.5"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M7.5 19V5.5H13.5C16.2614 5.5 18.5 7.73858 18.5 10.5C18.5 13.2614 16.2614 15.5 13.5 15.5H10.5V19H7.5Z"
                  fill="#111111"
                />
                <circle cx="13.2" cy="10.5" r="1.85" fill="#DFFF43" />
              </svg>
            </div>
            <span className="font-heading text-[18px] font-bold tracking-tight text-white">
              Prospect
            </span>
          </button>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="rounded-full border border-white/15 bg-white/[0.07] p-1.5 text-white/80 hover:bg-white/15 hover:text-white md:hidden transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Primary Menu List */}
        <nav aria-label="Main Navigation" className="space-y-4">
          <div className="space-y-1">{primaryItems.map(renderNavItem)}</div>

          <div className="border-t border-white/[0.06] pt-3">
            <div className="px-3.5 pb-1.5 text-[10px] font-heading font-semibold uppercase tracking-[0.12em] text-white/35">
              Growth &amp; Pipeline
            </div>
            <div className="space-y-1">{growthItems.map(renderNavItem)}</div>
          </div>
        </nav>

        {/* Secondary Section: Opportunity Sources Hub */}
        <div className="my-3.5 border-t border-white/[0.06]" />
        <div>
          <button
            type="button"
            onClick={() => {
              onOpenSources();
              onCloseMobile?.();
            }}
            className="group flex w-full items-center justify-between gap-1.5 rounded-2xl border border-white/[0.10] bg-white/[0.05] hover:bg-white/[0.09] hover:border-[#DFFF43]/45 px-2.5 py-2.5 font-heading text-[11.5px] font-semibold text-white/90 shadow-[0_4px_16px_rgba(0,0,0,0.22)] transition-all cursor-pointer"
          >
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#DFFF43]/15 border border-[#DFFF43]/35 text-[#DFFF43] group-hover:bg-[#DFFF43] group-hover:text-[#111111] transition-colors">
                <Link2 className="h-3 w-3 stroke-[2.2]" />
              </span>
              <span className="truncate tracking-tight">Opportunity Sources</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#70B93F]/20 border border-[#A6D94B]/35 text-[#DFFF43] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-[#DFFF43]" />
              Hub
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Status Card: Frosted Dark Glass Engine Status + Sign Out */}
      <div className="relative z-10 p-3 pt-2">
        <div className="w-full rounded-2xl bg-[#101010]/70 backdrop-blur-md border border-white/12 p-3.5 shadow-[0_10px_28px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DFFF43] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DFFF43]" />
              </span>
              <span className="font-heading text-[11.5px] font-bold text-white truncate">
                Intelligence Engine
              </span>
            </div>
            <span className="shrink-0 rounded-full bg-[#DFFF43]/15 border border-[#DFFF43]/35 px-2 py-0.5 text-[10px] font-bold text-[#DFFF43]">
              {isAgentRunning ? "Running" : "Live"}
            </span>
          </div>
          <div className="mt-1.5 text-[10.5px] font-medium text-white/65 leading-snug">
            Verified Ingestion Active • Ghost-Free
          </div>

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              title="Sign out and return to landing page"
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.06] hover:bg-white/[0.12] hover:border-white/25 text-white/85 hover:text-white px-3 py-1.5 text-[12px] font-heading font-semibold transition-all cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 stroke-[2]" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden md:flex md:w-[232px] md:shrink-0 md:flex-col sticky top-0 h-screen z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Slide-Over Sidebar Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-[#101010]/65 backdrop-blur-sm"
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

"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  FolderGit2,
  Home,
  Link2,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  UserRound,
  X,
} from "lucide-react";

export type NavTab =
  | "home"
  | "discover"
  | "outlook"
  | "tracker"
  | "prep"
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
}: SidebarProps) {
  // Resolve highlighted item cleanly when deep-linking via ?tab= or programmatic navigation
  const resolvedKey: SidebarNavKey =
    activeSidebarKey &&
    ((activeSidebarKey === "applications" && activeTab === "tracker") ||
      (activeSidebarKey === "tracker" && activeTab === "tracker") ||
      (activeSidebarKey === "interview_prep" && activeTab === "prep") ||
      (activeSidebarKey === "upskill" && activeTab === "prep") ||
      activeSidebarKey === activeTab)
      ? activeSidebarKey
      : activeTab === "tracker"
      ? "applications"
      : activeTab === "prep"
      ? "interview_prep"
      : activeTab;

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
      tab: "prep",
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
        <div className="flex items-center justify-between px-1.5 mb-3">
          <button
            type="button"
            onClick={() => handleNavClick("home", "home")}
            className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
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

        {/* Link to 3D Landing Page Showcase */}
        <Link
          href="/landing"
          className="flex items-center justify-between rounded-xl border-2 border-[#080808] bg-white px-3 py-1.5 font-heading text-xs font-extrabold text-[#080808] hover:bg-[#E0FB66] transition-all shadow-[2px_2px_0px_#080808] mb-4 group"
        >
          <span className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[#080808]" />
            <span>Product Showcase</span>
          </span>
          <ArrowUpRight className="h-3.5 w-3.5 text-[#777777] group-hover:text-[#080808] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Link>

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

        {/* Secondary Section: Connected Sources & 3D Tour */}
        <div className="my-4 border-t border-[#D8D5CE]" />
        <div className="space-y-1">
          <Link
            href="/landing"
            onClick={onCloseMobile}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-heading font-semibold text-[#080808]/80 border-2 border-transparent hover:bg-white hover:text-[#080808] transition-all cursor-pointer"
          >
            <Sparkles className="h-4 w-4 shrink-0 stroke-[2] text-[#080808]" />
            <span className="truncate">3D Tour & Landing</span>
          </Link>

          <button
            type="button"
            onClick={() => {
              onOpenSources();
              onCloseMobile?.();
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-heading font-semibold text-[#080808]/80 border-2 border-transparent hover:bg-white hover:text-[#080808] transition-all cursor-pointer"
          >
            <Link2 className="h-4 w-4 shrink-0 stroke-[2]" />
            <span className="truncate">Connected Sources</span>
          </button>
        </div>
      </div>

      {/* Bottom Highlight Card: AI Career Agent */}
      <div className="p-3.5 pt-2">
        <button
          type="button"
          onClick={() => handleNavClick("agent", "agent")}
          className={`w-full rounded-2xl border-2 border-[#080808] bg-[#E0FB66] p-3.5 text-left transition-all cursor-pointer shadow-[3px_3px_0px_#080808] hover:-translate-y-0.5 ${
            resolvedKey === "agent" ? "ring-2 ring-[#080808]" : ""
          }`}
        >
          <div className="flex items-start justify-between">
            {/* Neo-Brutalist Cute Robot Emblem */}
            <svg
              width="34"
              height="34"
              viewBox="0 0 36 36"
              fill="none"
              aria-hidden="true"
              className="shrink-0"
            >
              {/* Antenna */}
              <line
                x1="15"
                y1="9"
                x2="15"
                y2="4"
                stroke="#080808"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle
                cx="15"
                cy="3.5"
                r="2"
                fill="#FFFFFF"
                stroke="#080808"
                strokeWidth="1.8"
              />
              {/* Spark ticks top-right */}
              <line
                x1="25"
                y1="5"
                x2="27"
                y2="2.5"
                stroke="#080808"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <line
                x1="29"
                y1="8"
                x2="32.5"
                y2="7"
                stroke="#080808"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              {/* Bot Head */}
              <rect
                x="6"
                y="9"
                width="18"
                height="16"
                rx="4.5"
                fill="#FFFFFF"
                stroke="#080808"
                strokeWidth="2"
              />
              {/* Ears */}
              <rect
                x="3.5"
                y="14"
                width="2.5"
                height="6"
                rx="1"
                fill="#080808"
              />
              <rect
                x="24"
                y="14"
                width="2.5"
                height="6"
                rx="1"
                fill="#080808"
              />
              {/* Eyes & Smile */}
              <circle cx="11.5" cy="16" r="1.5" fill="#080808" />
              <circle cx="18.5" cy="16" r="1.5" fill="#080808" />
              <path
                d="M11.5 20.2C13 21.6 17 21.6 18.5 20.2"
                stroke="#080808"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>

            {isAgentRunning && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#080808] px-2 py-0.5 font-heading text-[10px] font-bold text-[#E0FB66]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#E0FB66] animate-pulse" />
                Live
              </span>
            )}
          </div>

          <div className="mt-2">
            <div className="font-heading text-sm font-extrabold text-[#080808] leading-tight">
              AI Career Agent
            </div>
            <div className="mt-0.5 text-[10.5px] font-semibold text-[#080808]/80">
              Discover • Match • Prepare • Track
            </div>
          </div>
        </button>
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

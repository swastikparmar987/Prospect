"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  Bell,
  BookOpen,
  BrainCircuit,
  BriefcaseBusiness,
  Compass,
  Home,
  UserRound,
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
  | "agent";

interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  trackerCount: number;
  prepCount: number;
  outlookCount?: number;
  isDemoMode: boolean;
  userInitial?: string;
  userName?: string;
  onOpenSetupHint?: () => void;
}

export function Navbar({
  activeTab,
  onSelectTab,
  trackerCount,
  prepCount,
  isDemoMode,
  userInitial = "S",
  userName,
  onOpenSetupHint,
}: NavbarProps) {
  const isIntelligenceActive = activeTab === "outlook" || activeTab === "agent";

  const primaryTabs = [
    { id: "home" as NavTab, label: "Home", icon: Home, active: activeTab === "home" },
    {
      id: "discover" as NavTab,
      label: "Discover",
      icon: Compass,
      active: activeTab === "discover",
    },
    {
      id: "outlook" as NavTab,
      label: "Intelligence",
      icon: BrainCircuit,
      active: isIntelligenceActive,
    },
    {
      id: "tracker" as NavTab,
      label: "Applications",
      icon: BriefcaseBusiness,
      count: trackerCount,
      active: activeTab === "tracker",
    },
    {
      id: "prep" as NavTab,
      label: "Preparation",
      icon: BookOpen,
      count: prepCount,
      active: activeTab === "prep",
    },
  ];

  const mobileTabs = [
    ...primaryTabs,
    {
      id: "agent" as NavTab,
      label: "Activity",
      icon: Activity,
      active: activeTab === "agent",
    },
    {
      id: "profile" as NavTab,
      label: "Profile",
      icon: UserRound,
      active: activeTab === "profile",
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FDF9F3]/95 backdrop-blur-sm border-b-2 border-[#080808]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        {/* Left: Brand Lockup - Links cleanly to landing page */}
        <Link
          href="/"
          onClick={(e) => {
            if (onSelectTab) {
              e.preventDefault();
              onSelectTab("landing");
            }
          }}
          className="flex items-center gap-2.5 group cursor-pointer focus:outline-none"
          aria-label="Prospect Landing Page"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#080808] text-white font-heading font-extrabold text-base shadow-[2px_2px_0px_#E0FB66] group-hover:-translate-y-0.5 transition-transform">
            P
          </div>
          <span className="font-heading text-lg font-extrabold tracking-tight text-[#080808]">
            Prospect
          </span>
        </Link>

        {/* Center: Clean Editorial Navigation Pills (Desktop) */}
        <nav
          className="hidden md:flex items-center gap-1.5"
          aria-label="Main Navigation"
        >
          {primaryTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-heading transition-all cursor-pointer ${
                tab.active
                  ? "bg-[#E0FB66] text-[#080808] font-bold border-2 border-[#080808] shadow-[2px_2px_0px_#080808]"
                  : "text-[#080808]/80 font-semibold border-2 border-transparent hover:text-[#080808] hover:bg-white/80"
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 && (
                <span
                  className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-[10px] font-extrabold ${
                    tab.active
                      ? "bg-[#080808] text-[#E0FB66]"
                      : "bg-[#D8D5CE]/70 text-[#080808]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Right: Discovery Status Pill, Notifications & User Avatar */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:inline-flex items-center gap-1.5 rounded-full border-2 border-[#080808] bg-white px-3 py-1 text-[11px] font-heading font-extrabold shadow-[2px_2px_0px_#080808] text-[#080808]">
            <span className="h-2 w-2 rounded-full bg-[#E0FB66] border border-[#080808] animate-pulse" />
            <span>DISCOVERY ACTIVE</span>
          </div>

          <div
            title="Intelligence Feeds Active"
            className="relative flex h-9 w-9 items-center justify-center rounded-full border-2 border-transparent hover:border-[#080808] hover:bg-white text-[#080808] transition-all"
          >
            <Bell className="h-[18px] w-[18px] stroke-[2]" />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>

          <button
            type="button"
            onClick={() => onSelectTab("profile")}
            title={userName ? `${userName} — Profile & Resume` : "Profile & Resume"}
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
      </div>

      {/* Mobile Horizontally Scrollable Navigation */}
      <div className="flex overflow-x-auto border-t border-[#D8D5CE] px-3 py-2 gap-1.5 md:hidden bg-[#FDF9F3]">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-heading font-bold transition-all cursor-pointer ${
                tab.active
                  ? "bg-[#E0FB66] text-[#080808] border-2 border-[#080808]"
                  : "bg-white text-[#080808]/80 border border-[#D8D5CE]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
              {"count" in tab && typeof tab.count === "number" && tab.count > 0 && (
                <span className="rounded-full bg-[#080808] px-1.5 text-[10px] text-[#E0FB66]">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}

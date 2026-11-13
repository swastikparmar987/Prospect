"use strict";
"use client";

import React, { useState } from "react";

interface TrackerCard {
  id: string;
  role: string;
  company: string;
  logo: string;
  stage: "saved" | "applied" | "interview" | "offer";
  location: string;
  compensation: string;
  matchScore: number;
  deadlineOrDate: string;
  notes: string;
}

const INITIAL_CARDS: TrackerCard[] = [
  {
    id: "card-1",
    role: "ML Systems Intern",
    company: "OpenAI",
    logo: "/logo_openai.png",
    stage: "interview",
    location: "San Francisco / Hybrid",
    compensation: "$65 / hr",
    matchScore: 92,
    deadlineOrDate: "Final Round: Thursday 2:00 PM",
    notes: "Review Raft consensus & Triton flash-attention project",
  },
  {
    id: "card-2",
    role: "Distributed Systems Intern",
    company: "Databricks",
    logo: "/brand_drawer_openai.png",
    stage: "offer",
    location: "San Francisco, CA",
    compensation: "$68 / hr + Housing",
    matchScore: 88,
    deadlineOrDate: "Decision Due: Dec 1",
    notes: "Team match with Storage Engine & Delta Kernel group",
  },
  {
    id: "card-3",
    role: "Software Engineering Intern",
    company: "Stripe",
    logo: "/logo_stripe.png",
    stage: "applied",
    location: "Seattle / Remote",
    compensation: "$62 / hr",
    matchScore: 84,
    deadlineOrDate: "Submitted Nov 4",
    notes: "Applied via direct Greenhouse verified portal",
  },
  {
    id: "card-4",
    role: "Core Systems Intern",
    company: "Figma",
    logo: "/logo_figma.png",
    stage: "interview",
    location: "San Francisco, CA",
    compensation: "$60 / hr",
    matchScore: 86,
    deadlineOrDate: "Technical Screen Passed",
    notes: "WebAssembly canvas rendering system interview prep",
  },
  {
    id: "card-5",
    role: "AI Research Fellow",
    company: "Google",
    logo: "/logo_google.png",
    stage: "saved",
    location: "Mountain View, CA",
    compensation: "$64 / hr",
    matchScore: 78,
    deadlineOrDate: "Recruiting Opens Dec 15",
    notes: "Gap item: Add 1 arXiv benchmark preprint",
  },
];

const COLUMNS = [
  { id: "saved", title: "Saved & Tracking", color: "bg-[#FEF189]", countColor: "text-[#080808]" },
  { id: "applied", title: "Applied", color: "bg-[#E0FB66]", countColor: "text-[#080808]" },
  { id: "interview", title: "Interviewing", color: "bg-[#080808]", countColor: "text-[#E0FB66]" },
  { id: "offer", title: "Offers & Decisions", color: "bg-[#163824]", countColor: "text-[#E0FB66]" },
] as const;

export function InteractiveTrackerMockup() {
  const [cards, setCards] = useState<TrackerCard[]>(INITIAL_CARDS);
  const [selectedCardId, setSelectedCardId] = useState<string>("card-1");

  const moveCard = (id: string, newStage: TrackerCard["stage"]) => {
    setCards((prev) =>
      prev.map((c) => (c.id === id ? { ...c, stage: newStage } : c))
    );
  };

  const selectedCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  return (
    <div className="w-full rounded-3xl border-3 border-[#080808] bg-[#FDF9F3] p-6 sm:p-8 shadow-[8px_8px_0px_#080808] text-[#080808]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-[#080808] pb-6 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-[#080808] bg-white px-3.5 py-1 text-xs font-heading font-extrabold shadow-[2px_2px_0px_#080808] mb-2">
            <span className="h-2 w-2 rounded-full bg-[#E0FB66] animate-pulse" />
            <span>BUILT-IN PIPELINE MANAGEMENT</span>
          </div>
          <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-[#080808] tracking-tight">
            The Student Kanban Application Tracker
          </h3>
          <p className="text-xs sm:text-sm text-[#777777] mt-1">
            Never lose an interview deadline or forget what project you highlighted. Move applications effortlessly from discovery to final offer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl border-2 border-[#080808] bg-white px-3 py-1.5 font-heading text-xs font-extrabold shadow-[2px_2px_0px_#080808]">
            5 Active Records
          </span>
          <span className="rounded-xl border-2 border-[#080808] bg-[#E0FB66] px-3 py-1.5 font-heading text-xs font-extrabold shadow-[2px_2px_0px_#080808]">
            1 Offer In Hand 🎉
          </span>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colCards = cards.filter((c) => c.stage === col.id);
          return (
            <div
              key={col.id}
              className="rounded-2xl border-2 border-[#080808] bg-white p-3.5 shadow-[4px_4px_0px_#080808] flex flex-col min-h-[340px]"
            >
              {/* Column Title */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D8D5CE]">
                <div className="flex items-center gap-2">
                  <div className={`h-3 w-3 rounded-full border border-[#080808] ${col.color}`} />
                  <span className="font-heading text-xs font-extrabold text-[#080808]">
                    {col.title}
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-[#777777] bg-[#FDF9F3] border border-[#D8D5CE] px-2 py-0.5 rounded-full">
                  {colCards.length}
                </span>
              </div>

              {/* Cards in Column */}
              <div className="space-y-3 flex-1">
                {colCards.map((card) => {
                  const isSelected = card.id === selectedCardId;
                  return (
                    <div
                      key={card.id}
                      onClick={() => setSelectedCardId(card.id)}
                      className={`rounded-xl border-2 border-[#080808] p-3 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#FEF189]/40 shadow-[4px_4px_0px_#080808] -translate-y-0.5"
                          : "bg-white shadow-[2px_2px_0px_#080808] hover:shadow-[3px_3px_0px_#080808] hover:-translate-y-0.5"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-md border border-[#080808] bg-white p-0.5 flex items-center justify-center shrink-0">
                            <span className="font-heading font-extrabold text-[10px]">
                              {card.company.slice(0, 1)}
                            </span>
                          </div>
                          <span className="font-heading text-xs font-bold text-[#080808] truncate">
                            {card.company}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] font-bold rounded-md bg-[#E0FB66] border border-[#080808] px-1.5 py-0.5">
                          {card.matchScore}%
                        </span>
                      </div>

                      <h4 className="font-heading text-xs font-extrabold text-[#080808] line-clamp-1 leading-snug">
                        {card.role}
                      </h4>

                      <div className="mt-2.5 pt-2 border-t border-[#D8D5CE]/60 flex items-center justify-between text-[10px] text-[#777777] font-medium">
                        <span className="truncate">{card.deadlineOrDate}</span>
                      </div>
                    </div>
                  );
                })}

                {colCards.length === 0 && (
                  <div className="h-28 rounded-xl border border-dashed border-[#D8D5CE] flex items-center justify-center text-center p-3 text-[11px] text-[#777777] font-medium">
                    Drag or promote cards here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Opportunity Mini-Drawer Preview */}
      {selectedCard && (
        <div className="mt-6 rounded-2xl border-2 border-[#080808] bg-white p-5 shadow-[4px_4px_0px_#080808] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md border border-[#080808] bg-[#080808] text-[#E0FB66] px-2 py-0.5 font-heading text-[10px] font-extrabold uppercase">
                Active Selection
              </span>
              <span className="font-heading text-sm font-extrabold text-[#080808]">
                {selectedCard.company} — {selectedCard.role}
              </span>
            </div>
            <p className="text-xs text-[#777777]">
              {selectedCard.notes} • <span className="font-bold text-[#080808]">{selectedCard.compensation}</span> • {selectedCard.location}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-heading font-bold text-[#777777] mr-1">Move stage:</span>
            {COLUMNS.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => moveCard(selectedCard.id, col.id)}
                className={`rounded-xl border-2 border-[#080808] px-3 py-1 font-heading text-xs font-extrabold transition-all cursor-pointer ${
                  selectedCard.stage === col.id
                    ? "bg-[#080808] text-[#E0FB66] shadow-[2px_2px_0px_#E0FB66]"
                    : "bg-white text-[#080808] hover:bg-[#FEF189] shadow-[2px_2px_0px_#080808]"
                }`}
              >
                {col.title.split(" ")[0]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

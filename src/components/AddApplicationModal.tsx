"use client";

import React, { useState } from "react";
import { ApplicationStage, Opportunity } from "@/types";
import { X, Search } from "lucide-react";
import { CompanyLogo } from "@/components/CompanyLogo";

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunities: Opportunity[];
  onSaveToTracker: (opp: Opportunity, customNotes?: string) => Promise<void>;
  initialStage?: ApplicationStage;
}

export function AddApplicationModal({
  isOpen,
  onClose,
  opportunities,
  onSaveToTracker,
}: AddApplicationModalProps) {
  const [tab, setTab] = useState<"catalog" | "custom">("catalog");
  const [search, setSearch] = useState("");

  // Custom form state
  const [customTitle, setCustomTitle] = useState("");
  const [customOrg, setCustomOrg] = useState("");
  const [customLocation] = useState("Remote");
  const [customWorkMode, setCustomWorkMode] = useState<"Remote" | "Hybrid" | "On-site">("Remote");
  const [customCompensation] = useState("Unlisted");
  const [customDeadline, setCustomDeadline] = useState("");
  const [customUrl, setCustomUrl] = useState("");
  const [customNotes, setCustomNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const filteredCatalog = opportunities.filter((o) => {
    const q = search.toLowerCase();
    return (
      !o.isDemo &&
      (o.title.toLowerCase().includes(q) ||
        o.organization.toLowerCase().includes(q) ||
        (o.requiredSkills || []).some((s) => s.toLowerCase().includes(q)))
    );
  });

  const handleSelectOpp = async (opp: Opportunity) => {
    setSubmitting(true);
    try {
      await onSaveToTracker(opp);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customOrg.trim()) return;
    setSubmitting(true);
    try {
      const userAddedOpp: Opportunity = {
        id: `user-added-${Date.now()}`,
        title: customTitle.trim(),
        organization: customOrg.trim(),
        category: "Internship",
        description: customNotes.trim() || `User-tracked position at ${customOrg.trim()}`,
        location: customLocation.trim() || "Unspecified",
        workMode: customWorkMode,
        compensation: customCompensation.trim() || "Unlisted",
        eligibilityRequirements: [],
        requiredSkills: [],
        preferredSkills: [],
        publishedAt: new Date().toISOString(),
        deadline: customDeadline ? new Date(customDeadline).toISOString() : null,
        deadlineRaw: customDeadline || null,
        applyUrl: customUrl.trim(),
        sourceName: "User Added",
        sourceUrl: customUrl.trim(),
        sourceConfidence: 0.5,
        verificationStatus: "UNVERIFIABLE",
        sourceEvidence: [],
        discoveredAt: new Date().toISOString(),
        lastCheckedAt: new Date().toISOString(),
        isDemo: false,
      };
      await onSaveToTracker(userAddedOpp, customNotes);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0F1113]/55 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl rounded-[26px] bg-white border border-black/[0.08] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.16)] z-10 max-h-[90vh] flex flex-col text-[#101214]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.07]">
          <div>
            <h3 className="font-heading text-xl font-bold tracking-tight text-[#101214]">
              Add Application
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Add a new job or fellowship to your career pipeline
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full border border-black/[0.08] bg-[#F7F7F3] p-2 text-[#4B5563] hover:bg-[#EAECE4] hover:text-[#101214] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="mt-4 flex rounded-full border border-black/[0.06] bg-[#F4F5F0] p-1 text-xs gap-1">
          <button
            type="button"
            onClick={() => setTab("catalog")}
            className={`flex-1 rounded-full py-2 px-3 transition-all cursor-pointer ${
              tab === "catalog"
                ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                : "text-[#4B5563] hover:text-[#101214] font-medium"
            }`}
          >
            Select from Discovered Opportunities
          </button>
          <button
            type="button"
            onClick={() => setTab("custom")}
            className={`flex-1 rounded-full py-2 px-3 transition-all cursor-pointer ${
              tab === "custom"
                ? "bg-[#E3FC6D] text-[#0E1012] border border-[#C6E832] shadow-[0_2px_10px_rgba(205,238,54,0.28)] font-semibold"
                : "text-[#4B5563] hover:text-[#101214] font-medium"
            }`}
          >
            Create Custom Application
          </button>
        </div>

        {/* Catalog Tab */}
        {tab === "catalog" && (
          <div className="mt-4 flex-1 overflow-y-auto space-y-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B7280]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search catalog by title, company, or skills..."
                className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] pl-10 pr-4 py-2.5 text-xs text-[#101214] placeholder-[#9CA3AF] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filteredCatalog.map((opp) => (
                <div
                  key={opp.id}
                  className="flex items-center justify-between rounded-2xl border border-black/[0.07] bg-[#FAFBF7] p-3.5 hover:bg-white hover:border-black/[0.12] hover:shadow-[0_6px_20px_rgba(15,23,42,0.05)] transition-all gap-3"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <CompanyLogo
                      name={opp.organization}
                      size={36}
                      className="h-9 w-9 shrink-0 rounded-xl border border-black/[0.06]"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-semibold text-[#101214] truncate">{opp.title}</h4>
                      <p className="text-[11px] text-[#6B7280] truncate">
                        {opp.organization} • {opp.location} ({opp.workMode})
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => handleSelectOpp(opp)}
                    className="rounded-full bg-[#101214] text-white font-semibold px-4 py-1.5 text-xs shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] hover:-translate-y-0.5 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    Track
                  </button>
                </div>
              ))}
              {filteredCatalog.length === 0 && (
                <div className="py-10 text-center text-xs text-[#6B7280]">
                  No matching opportunities found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Custom Tab */}
        {tab === "custom" && (
          <form onSubmit={handleCreateCustom} className="mt-4 flex-1 overflow-y-auto space-y-3.5 pr-1 text-xs">
            <div>
              <label className="font-semibold text-[#101214] block mb-1.5">
                Company / Organization *
              </label>
              <input
                type="text"
                required
                value={customOrg}
                onChange={(e) => setCustomOrg(e.target.value)}
                placeholder="e.g. Anthropic, Scale AI, Stripe"
                className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] px-3.5 py-2.5 text-xs text-[#101214] placeholder-[#9CA3AF] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="font-semibold text-[#101214] block mb-1.5">
                Role Title *
              </label>
              <input
                type="text"
                required
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Machine Learning Engineer Intern"
                className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] px-3.5 py-2.5 text-xs text-[#101214] placeholder-[#9CA3AF] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-[#101214] block mb-1.5">
                  Work Mode
                </label>
                <select
                  value={customWorkMode}
                  onChange={(e) => setCustomWorkMode(e.target.value as any)}
                  className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] px-3.5 py-2.5 text-xs text-[#101214] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 focus:outline-none transition-all"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#101214] block mb-1.5">
                  Deadline
                </label>
                <input
                  type="date"
                  value={customDeadline}
                  onChange={(e) => setCustomDeadline(e.target.value)}
                  className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] px-3.5 py-2.5 text-xs text-[#101214] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 focus:outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-[#101214] block mb-1.5">
                Application URL
              </label>
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://company.com/careers/job-id"
                className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] px-3.5 py-2.5 text-xs text-[#101214] placeholder-[#9CA3AF] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="font-semibold text-[#101214] block mb-1.5">
                Initial Notes
              </label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                rows={2}
                placeholder="Why are you interested in this role? Who is the contact or recruiter?"
                className="w-full rounded-xl border border-black/[0.10] bg-[#FAFBF7] px-3.5 py-2.5 text-xs text-[#101214] placeholder-[#9CA3AF] focus:bg-white focus:border-[#94D814] focus:ring-2 focus:ring-[#DDFB4B]/40 focus:outline-none transition-all"
              />
            </div>

            <div className="pt-3 border-t border-black/[0.06] flex justify-end space-x-2.5">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full bg-white text-[#101214] border border-black/[0.09] shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:bg-[#F7F7F3] px-4 py-2 text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-[#101214] text-white font-semibold shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] hover:-translate-y-0.5 transition-all px-5 py-2 text-xs disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Adding..." : "Add to Tracker"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

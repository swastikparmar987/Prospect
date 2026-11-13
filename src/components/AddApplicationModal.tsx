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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-[#080808]/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl rounded-2xl bg-white border-2 border-[#080808] p-6 shadow-[6px_6px_0px_#080808] z-10 max-h-[90vh] flex flex-col text-[#080808]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b-2 border-[#080808]">
          <div>
            <h3 className="text-xl font-extrabold text-[#080808]">Add Application</h3>
            <p className="text-xs text-[#777777] mt-0.5">
              Add a new job or fellowship to your career pipeline
            </p>
          </div>
          <button onClick={onClose} className="rounded-xl border-2 border-[#080808] p-1.5 text-[#080808] hover:bg-[#FEF189] cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="mt-4 flex rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-1 text-xs font-bold gap-1">
          <button
            onClick={() => setTab("catalog")}
            className={`flex-1 rounded-lg py-2 transition-all cursor-pointer ${
              tab === "catalog" ? "bg-[#E0FB66] text-[#080808] border border-[#080808]" : "text-[#777777] hover:text-[#080808]"
            }`}
          >
            Select from Discovered Opportunities
          </button>
          <button
            onClick={() => setTab("custom")}
            className={`flex-1 rounded-lg py-2 transition-all cursor-pointer ${
              tab === "custom" ? "bg-[#E0FB66] text-[#080808] border border-[#080808]" : "text-[#777777] hover:text-[#080808]"
            }`}
          >
            Create Custom Application
          </button>
        </div>

        {/* Catalog Tab */}
        {tab === "catalog" && (
          <div className="mt-4 flex-1 overflow-y-auto space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#777777]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search catalog by title, company, or skills..."
                className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] pl-9 pr-4 py-2 text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {filteredCatalog.map((opp) => (
                <div
                  key={opp.id}
                  className="flex items-center justify-between rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-3 hover:bg-[#FEF189]/40 transition-all gap-3"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <CompanyLogo
                      name={opp.organization}
                      size={34}
                      className="h-[34px] w-[34px] shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-[#080808] truncate">{opp.title}</h4>
                      <p className="text-[11px] text-[#777777] truncate">
                        {opp.organization} • {opp.location} ({opp.workMode})
                      </p>
                    </div>
                  </div>
                  <button
                    disabled={submitting}
                    onClick={() => handleSelectOpp(opp)}
                    className="rounded-lg border-2 border-[#080808] bg-[#E0FB66] px-3 py-1.5 text-xs font-bold text-[#080808] hover:bg-[#FEF189] disabled:opacity-50 shrink-0 cursor-pointer"
                  >
                    Track
                  </button>
                </div>
              ))}
              {filteredCatalog.length === 0 && (
                <div className="py-8 text-center text-xs text-[#777777]">
                  No matching opportunities found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Custom Tab */}
        {tab === "custom" && (
          <form onSubmit={handleCreateCustom} className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
            <div>
              <label className="font-bold text-[#080808] block mb-1">Company / Organization *</label>
              <input
                type="text"
                required
                value={customOrg}
                onChange={(e) => setCustomOrg(e.target.value)}
                placeholder="e.g. Anthropic, Scale AI, Stripe"
                className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-2 text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-[#080808] block mb-1">Role Title *</label>
              <input
                type="text"
                required
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g. Machine Learning Engineer Intern"
                className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-2 text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-[#080808] block mb-1">Work Mode</label>
                <select
                  value={customWorkMode}
                  onChange={(e) => setCustomWorkMode(e.target.value as any)}
                  className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-2 text-xs focus:bg-white focus:outline-none"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#080808] block mb-1">Deadline</label>
                <input
                  type="date"
                  value={customDeadline}
                  onChange={(e) => setCustomDeadline(e.target.value)}
                  className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-2 text-xs focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-[#080808] block mb-1">Application URL</label>
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://company.com/careers/job-id"
                className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-2 text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-[#080808] block mb-1">Initial Notes</label>
              <textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                rows={2}
                placeholder="Why are you interested in this role? Who is the contact or recruiter?"
                className="w-full rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-2 text-xs focus:bg-white focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="neo-btn-outline px-4 py-2 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="neo-btn-primary px-5 py-2 text-xs disabled:opacity-50 cursor-pointer"
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

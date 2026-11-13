"use strict";
"use client";

import React from "react";
import { X, AlertCircle, Copy, Check, Upload } from "lucide-react";

interface SetupHintModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusData: any;
  onUploadNewResume?: () => void;
}

export function SetupHintModal({
  isOpen,
  onClose,
  statusData,
  onUploadNewResume,
}: SetupHintModalProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const envSnippet = `# Prospect Provider Configuration
DATABASE_URL="file:./dev.db"

# Real-Time Web Search Provider (Tavily or Brave)
SEARCH_PROVIDER="tavily"
TAVILY_API_KEY="YOUR_TAVILY_API_KEY"

# Live Fast LLM Reasoner (Groq Cloud or Gemini)
LLM_PROVIDER="groq"
GROQ_API_KEY="YOUR_GROQ_API_KEY"`;

  const handleCopy = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080808]/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl border-2 border-[#080808] bg-white shadow-[6px_6px_0px_#080808] text-[#080808]">
        <div className="flex items-center justify-between border-b-2 border-[#080808] bg-[#FDF9F3] px-6 py-4 rounded-t-2xl">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-extrabold text-[#080808]">Provider Status & Setup</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border-2 border-[#080808] bg-white p-1 text-[#080808] hover:bg-[#FEF189] cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-sm text-[#080808]">
          <div className="rounded-xl border-2 border-[#080808] bg-[#FEF189] p-3 text-[#080808]">
            <div className="flex items-start space-x-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#080808]" />
              <div>
                <p className="font-extrabold text-[#080808]">
                  Current Mode: {statusData?.mode || "LIVE_MODE"}
                </p>
                <p className="mt-1 text-xs text-[#080808]/85">
                  {statusData?.setupHint ||
                    "Operating strictly on verified live employer feeds and public search APIs."}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-extrabold text-[#080808]">Active Adapters:</h3>
            <ul className="mt-2 space-y-2 text-xs">
              <li className="flex items-center justify-between rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-2.5">
                <span className="font-bold text-[#080808]">Search Provider:</span>
                <span className="font-mono text-[#080808]">
                  {statusData?.providers?.search?.name || "Live Multi-Source Public Feeds"}
                </span>
              </li>
              <li className="flex items-center justify-between rounded-xl border-2 border-[#080808] bg-[#FDF9F3] p-2.5">
                <span className="font-bold text-[#080808]">LLM Reasoner:</span>
                <span className="font-mono text-[#080808]">
                  {statusData?.providers?.llm?.name || "Deterministic Rule Engine"}
                </span>
              </li>
            </ul>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-[#080808]">How to Enable Live Integrations:</h3>
              <button
                onClick={handleCopy}
                className="inline-flex items-center space-x-1 text-xs text-[#080808] font-bold hover:underline cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-[#080808]" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? "Copied!" : "Copy .env snippet"}</span>
              </button>
            </div>
            <pre className="mt-2 overflow-x-auto rounded-xl border-2 border-[#080808] bg-[#080808] p-3 text-[11px] font-mono text-[#E0FB66] leading-relaxed">
              {envSnippet}
            </pre>
            <p className="mt-2 text-xs text-[#777777]">
              Paste into your <code className="rounded bg-[#FDF9F3] border border-[#080808] px-1 py-0.5 font-mono text-[#080808]">.env</code> file in the prospect root directory and restart the application.
            </p>
          </div>
        </div>

        <div className="border-t-2 border-[#080808] px-6 py-3 flex flex-wrap items-center justify-between gap-2 bg-[#FDF9F3] rounded-b-2xl">
          {onUploadNewResume ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onUploadNewResume();
              }}
              className="neo-btn-outline inline-flex items-center gap-1.5 px-3.5 py-2 text-xs cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Upload New Resume</span>
            </button>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="neo-btn-primary px-4 py-2 text-xs cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

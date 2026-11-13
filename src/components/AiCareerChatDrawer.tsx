"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Sparkles,
  X,
  ArrowUpRight,
  Trash2,
  MapPin,
  Loader2,
} from "lucide-react";
import { LocationDiscoveryMode, UserProfile } from "@/types";

export interface ChatActionPayload {
  type: "SEARCH_OPPORTUNITIES" | "SWITCH_LOCATION_MODE" | "OPEN_TAB";
  label: string;
  query?: string;
  platform?: string;
  locationMode?: LocationDiscoveryMode;
  selectedCity?: string;
  tab?:
    | "discover"
    | "profile"
    | "projects"
    | "agent"
    | "scheduler"
    | "tracker"
    | "outlook"
    | "prep";
}

interface ChatMatchPreview {
  id: string;
  title: string;
  organization: string;
  location: string;
  workMode: string;
  score: number;
  recommendation: string;
}

interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
  suggestedActions?: ChatActionPayload[];
  matchedOpportunities?: ChatMatchPreview[];
}

interface AiCareerChatDrawerProps {
  profile: UserProfile | null;
  activeTab: string;
  activeLocationMode: LocationDiscoveryMode;
  onExecuteAction: (action: ChatActionPayload) => void;
}

function renderFormattedLines(text: string) {
  return text.split("\n").map((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={idx} className="h-1.5" />;

    // Render **bold** spans safely without dangerouslySetInnerHTML
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <p key={idx} className="leading-relaxed">
        {parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pIdx} className="font-bold text-[#080808]">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return <React.Fragment key={pIdx}>{part}</React.Fragment>;
        })}
      </p>
    );
  });
}

export function AiCareerChatDrawer({
  profile,
  activeTab,
  activeLocationMode,
  onExecuteAction,
}: AiCareerChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const resumeCity =
    profile?.locationPreference?.city || profile?.location || "Resume Location";

  const starterPrompts = [
    `What top roles fit my resume near ${resumeCity}?`,
    "Show AI/ML jobs in Bengaluru or Hyderabad",
    "Find Remote jobs in US, UK, or Europe",
    "Which skills or projects would raise my match score?",
  ];

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isSending]);

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isSending) return;

    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    if (!overrideText) setInput("");
    setIsSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: nextMessages.slice(-8).map((m) => ({
            role: m.role,
            content: m.content,
          })),
          activeLocationMode,
          activeTab,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Chat request failed");
      }

      const assistantMsg: ChatMessageItem = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.reply || "No response returned.",
        suggestedActions: Array.isArray(data.suggestedActions)
          ? data.suggestedActions
          : [],
        matchedOpportunities: Array.isArray(data.matchedOpportunities)
          ? data.matchedOpportunities
          : [],
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content:
            err instanceof Error
              ? `Could not reach AI Career Chat (${err.message}). Make sure the local server is running.`
              : "Could not reach AI Career Chat.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {isOpen && (
        <div
          role="dialog"
          aria-label="Prospect AI Career Chat"
          className="mb-3 flex h-[540px] max-h-[75vh] w-[92vw] max-w-[420px] flex-col overflow-hidden rounded-2xl border-2 border-[#080808] bg-[#FDF9F3] shadow-[6px_6px_0px_#080808]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-[#080808] bg-[#E0FB66] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg border-2 border-[#080808] bg-white">
                <Sparkles className="h-4 w-4 text-[#080808]" />
              </div>
              <div>
                <p className="font-heading text-xs font-extrabold text-[#080808]">
                  Ask Prospect AI
                </p>
                <p className="flex items-center gap-1 text-[10px] font-bold text-[#080808]/75">
                  <MapPin className="h-2.5 w-2.5" />
                  <span>
                    {resumeCity} · Prompt any city, state, or country
                  </span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMessages([])}
                  title="Clear conversation"
                  className="rounded-lg border border-[#080808] bg-white p-1.5 text-[#080808] hover:bg-[#FDF9F3] cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close AI Career Chat"
                className="rounded-lg border-2 border-[#080808] bg-white p-1 text-[#080808] hover:bg-[#FEF189] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto p-3.5 text-xs text-[#080808]"
          >
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="rounded-xl border-2 border-[#080808] bg-white p-3 shadow-[2px_2px_0px_#080808]">
                  <p className="font-heading text-xs font-extrabold text-[#080808]">
                    Ask anything about jobs, locations, or your resume
                  </p>
                  <p className="mt-1 text-[11px] text-[#555555] leading-relaxed">
                    Default vicinity adapts to your resume ({resumeCity}), and
                    you can switch states, explore other countries, search global
                    remote, or get upskilling advice anytime.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <p className="font-heading text-[10px] font-extrabold uppercase tracking-wider text-[#666666]">
                    Try prompting:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {starterPrompts.map((promptText) => (
                      <button
                        key={promptText}
                        type="button"
                        onClick={() => handleSend(promptText)}
                        className="rounded-xl border border-[#080808] bg-white px-2.5 py-1.5 text-left text-[11px] font-semibold text-[#080808] hover:bg-[#FEF189] transition cursor-pointer"
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl border-2 border-[#080808] px-3 py-2.5 text-xs ${
                    msg.role === "user"
                      ? "bg-[#FEF189] font-semibold text-[#080808] shadow-[2px_2px_0px_#080808]"
                      : "bg-white text-[#080808] shadow-[2px_2px_0px_#080808]"
                  }`}
                >
                  {renderFormattedLines(msg.content)}

                  {msg.matchedOpportunities &&
                    msg.matchedOpportunities.length > 0 && (
                      <div className="mt-2.5 space-y-1.5 border-t border-[#D8D5CE] pt-2">
                        {msg.matchedOpportunities.map((opp) => (
                          <div
                            key={opp.id}
                            className="rounded-lg border border-[#D8D5CE] bg-[#FDF9F3] px-2.5 py-1.5 text-[11px]"
                          >
                            <div className="flex items-center justify-between gap-2 font-bold">
                              <span className="truncate">{opp.title}</span>
                              <span className="shrink-0 rounded bg-[#E0FB66] border border-[#080808] px-1.5 py-0.5 text-[10px]">
                                {opp.score}%
                              </span>
                            </div>
                            <p className="truncate text-[10px] text-[#555555]">
                              {opp.organization} · {opp.location} ({opp.workMode})
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                  {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {msg.suggestedActions.map((act, idx) => (
                        <button
                          key={`${act.label}-${idx}`}
                          type="button"
                          onClick={() => onExecuteAction(act)}
                          className="inline-flex items-center gap-1 rounded-full border-2 border-[#080808] bg-[#E0FB66] hover:bg-[#FEF189] px-2.5 py-1 font-heading text-[10px] font-extrabold text-[#080808] transition cursor-pointer"
                        >
                          <span>{act.label}</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isSending && (
              <div className="flex items-center gap-2 rounded-xl border border-[#080808] bg-white px-3 py-2 text-[11px] font-bold text-[#080808] w-fit">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Analyzing live opportunities & your profile...</span>
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 border-t-2 border-[#080808] bg-white p-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for any city, country, role, or skill advice..."
              aria-label="Ask AI Career Assistant"
              className="flex-1 rounded-xl border-2 border-[#080808] bg-[#FDF9F3] px-3 py-2 text-xs font-medium text-[#080808] outline-none focus:bg-white"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              aria-label="Send chat message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border-2 border-[#080808] bg-[#E0FB66] text-[#080808] shadow-[2px_2px_0px_#080808] hover:bg-[#FEF189] disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Persistent Launcher Button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Toggle AI Career Chat"
        className="inline-flex items-center gap-2 rounded-full border-2 border-[#080808] bg-[#E0FB66] hover:bg-[#FEF189] px-4 py-2.5 font-heading text-xs font-extrabold text-[#080808] shadow-[4px_4px_0px_#080808] transition-transform hover:-translate-y-0.5 cursor-pointer"
      >
        <MessageSquare className="h-4 w-4" />
        <span>{isOpen ? "Close AI Chat" : "Ask AI Assistant"}</span>
      </button>
    </div>
  );
}

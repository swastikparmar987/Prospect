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
              <strong key={pIdx} className="font-bold text-[#111111]">
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
  const inputRef = useRef<HTMLInputElement | null>(null);
  const launcherRef = useRef<HTMLButtonElement | null>(null);

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

  useEffect(() => {
    if (!isOpen) return;
    const focusId = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 20);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        launcherRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusId);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

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
          aria-modal="false"
          aria-label="Prospect AI Career Chat"
          className="mb-3 flex h-[540px] max-h-[75vh] w-[92vw] max-w-[420px] flex-col overflow-hidden rounded-[22px] border border-[#E9E6DF] bg-[#FDFBF8] shadow-[0_18px_48px_rgba(17,17,17,0.12)]"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#E9E6DF] bg-gradient-to-r from-[#FFFFFF] via-[#FDFBF8] to-[#F1FFC7]/60 px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-[12px] border border-[#DDD4FA] bg-[#EAE3FF] text-[#111111] shadow-[0_2px_8px_rgba(17,17,17,0.04)]">
                <Sparkles className="h-4 w-4 text-[#111111]" />
              </div>
              <div>
                <p className="font-heading text-xs font-bold text-[#111111]">
                  Ask Prospect AI
                </p>
                <p className="flex items-center gap-1 text-[10px] font-medium text-[#777777]">
                  <MapPin className="h-2.5 w-2.5 shrink-0 text-[#777777]" />
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
                  aria-label="Clear conversation"
                  className="rounded-xl border border-[#E9E6DF] bg-[#FFFFFF] p-1.5 text-[#777777] hover:text-[#111111] hover:bg-[#FDFBF8] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DFFF43]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Close AI Career Chat"
                className="rounded-xl border border-[#E9E6DF] bg-[#FFFFFF] p-1.5 text-[#777777] hover:text-[#111111] hover:bg-[#F1FFC7] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DFFF43]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto bg-[#FDFBF8] p-4 text-xs text-[#111111]"
          >
            {messages.length === 0 && (
              <div className="space-y-3.5">
                <div className="rounded-[20px] border border-[#E9E6DF] bg-gradient-to-br from-[#FFFFFF] via-[#FFFFFF] to-[#EAE3FF]/45 p-3.5 shadow-[0_6px_20px_rgba(17,17,17,0.04)]">
                  <p className="font-heading text-xs font-bold text-[#111111]">
                    Ask anything about jobs, locations, or your resume
                  </p>
                  <p className="mt-1 text-[11px] text-[#777777] leading-relaxed">
                    Default vicinity adapts to your resume ({resumeCity}), and
                    you can switch states, explore other countries, search global
                    remote, or get upskilling advice anytime.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="font-heading text-[10px] font-semibold uppercase tracking-wider text-[#777777]">
                    Try prompting:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {starterPrompts.map((promptText) => (
                      <button
                        key={promptText}
                        type="button"
                        onClick={() => handleSend(promptText)}
                        className="rounded-[18px] border border-[#E9E6DF] bg-[#FFFFFF] px-3 py-1.5 text-left text-[11px] font-medium text-[#111111] shadow-[0_2px_8px_rgba(17,17,17,0.03)] hover:bg-[#F1FFC7] hover:border-[#D4ED88] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DFFF43]"
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
                  className={
                    msg.role === "user"
                      ? "max-w-[88%] rounded-[18px] border border-[#DDF493] bg-[#F1FFC7] px-3.5 py-2.5 text-xs font-medium text-[#111111] shadow-[0_4px_14px_rgba(17,17,17,0.04)]"
                      : "max-w-[90%] rounded-[20px] border border-[#E9E6DF] bg-[#FFFFFF] px-3.5 py-2.5 text-xs text-[#111111] shadow-[0_6px_20px_rgba(17,17,17,0.05)]"
                  }
                >
                  {msg.role === "assistant" && (
                    <div className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-[#EAE3FF] px-2 py-0.5 text-[10px] font-semibold text-[#111111]">
                      <Sparkles className="h-2.5 w-2.5" />
                      <span>Prospect AI</span>
                    </div>
                  )}

                  {renderFormattedLines(msg.content)}

                  {msg.matchedOpportunities &&
                    msg.matchedOpportunities.length > 0 && (
                      <div className="mt-2.5 space-y-1.5 border-t border-[#E9E6DF] pt-2.5">
                        {msg.matchedOpportunities.map((opp) => (
                          <div
                            key={opp.id}
                            className="rounded-[14px] border border-[#E9E6DF] bg-[#FDFBF8] px-3 py-2 text-[11px]"
                          >
                            <div className="flex items-center justify-between gap-2 font-semibold text-[#111111]">
                              <span className="truncate">{opp.title}</span>
                              <span className="shrink-0 rounded-full border border-[#CDE946] bg-[#DFFF43] px-2 py-0.5 text-[10px] font-bold text-[#111111]">
                                {opp.score}%
                              </span>
                            </div>
                            <p className="mt-0.5 truncate text-[10px] text-[#777777]">
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
                          className="inline-flex items-center gap-1 rounded-full border border-[#DDD4FA] bg-[#EAE3FF] hover:bg-[#DFFF43] hover:border-[#CDE946] px-3 py-1 font-heading text-[10px] font-semibold text-[#111111] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DFFF43]"
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
              <div className="flex items-center gap-2 rounded-[18px] border border-[#DDD4FA] bg-[#EAE3FF]/75 px-3.5 py-2 text-[11px] font-medium text-[#111111] w-fit shadow-[0_4px_12px_rgba(17,17,17,0.04)]">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#111111]" />
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
            className="flex items-center gap-2 border-t border-[#E9E6DF] bg-[#FFFFFF] p-3"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for any city, country, role, or skill advice..."
              aria-label="Ask AI Career Assistant"
              className="flex-1 rounded-[18px] border border-[#E9E6DF] bg-[#FDFBF8] px-3.5 py-2 text-xs font-medium text-[#111111] placeholder:text-[#777777] outline-none transition-colors focus:bg-[#FFFFFF] focus:border-[#A6D94B] focus:ring-2 focus:ring-[#F1FFC7]"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              aria-label="Send chat message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] border border-[#111111] bg-[#111111] text-[#DFFF43] shadow-[0_6px_16px_rgba(17,17,17,0.12)] hover:bg-[#222222] disabled:opacity-45 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DFFF43]"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      )}

      {/* Persistent Launcher Button */}
      <button
        ref={launcherRef}
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Toggle AI Career Chat"
        aria-expanded={isOpen}
        className="inline-flex items-center gap-2 rounded-full border border-[#CFE949] bg-[#DFFF43] hover:bg-[#F1FFC7] px-4 py-2.5 font-heading text-xs font-bold text-[#111111] shadow-[0_18px_48px_rgba(17,17,17,0.12)] transition-all hover:-translate-y-0.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111]"
      >
        <MessageSquare className="h-4 w-4" />
        <span>{isOpen ? "Close AI Chat" : "Ask AI Assistant"}</span>
      </button>
    </div>
  );
}

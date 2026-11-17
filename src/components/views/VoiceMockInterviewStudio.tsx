"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Opportunity, UserProfile } from "@/types";
import type { MockInterviewQuestion } from "@/app/api/ai/mock-interview/route";
import {
  ArrowRight,
  Award,
  BrainCircuit,
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2,
  Mic,
  MicOff,
  Play,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";

interface EvaluationFeedback {
  overallScore: number;
  metrics: {
    technicalAccuracy: number;
    evidenceDepth: number;
    clarity: number;
    starStructure: number;
  };
  spokenInterviewerResponse: string;
  strengths: string[];
  missingConcepts: string[];
  sampleStrongAnswer: string;
  followUpQuestion: string;
}

export interface VoiceMockInterviewStudioProps {
  profile: UserProfile | null;
  opportunities?: Opportunity[];
  selectedOpportunity?: Opportunity | null;
  onUploadResume?: () => void;
}

export function VoiceMockInterviewStudio({
  profile,
  opportunities = [],
  selectedOpportunity = null,
  onUploadResume,
}: VoiceMockInterviewStudioProps) {
  const [selectedOppId, setSelectedOppId] = useState<string>(
    selectedOpportunity?.id || opportunities[0]?.id || ""
  );
  const [questions, setQuestions] = useState<MockInterviewQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [webSourcesChecked, setWebSourcesChecked] = useState<string[]>([]);
  const [aiProviderLabel, setAiProviderLabel] = useState<string>("");
  const [loadError, setLoadError] = useState<string | null>(null);

  // Voice Output (AI SpeechSynthesis)
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);

  // Voice Input (Candidate SpeechRecognition Mic)
  const [micSupported, setMicSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<any>(null);

  // Evaluation State
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedbackByQuestion, setFeedbackByQuestion] = useState<
    Record<string, EvaluationFeedback>
  >({});

  const activeOpp = useMemo(
    () =>
      opportunities.find((o) => o.id === selectedOppId) ||
      selectedOpportunity ||
      opportunities[0] ||
      null,
    [opportunities, selectedOppId, selectedOpportunity]
  );

  useEffect(() => {
    if (selectedOpportunity?.id) {
      setSelectedOppId(selectedOpportunity.id);
    } else if (!selectedOppId && opportunities[0]?.id) {
      setSelectedOppId(opportunities[0].id);
    }
  }, [selectedOpportunity?.id, opportunities, selectedOppId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setTtsSupported("speechSynthesis" in window);
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    setMicSupported(Boolean(SpeechRec));

    return () => {
      try {
        window.speechSynthesis?.cancel();
      } catch {
        // Ignore cleanup errors
      }
      try {
        recognitionRef.current?.stop();
      } catch {
        // Ignore cleanup errors
      }
    };
  }, []);

  const stopAiSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore
    }
    setIsAiSpeaking(false);
  };

  const speakText = (text: string) => {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      !text.trim()
    ) {
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.02;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferred =
        voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            /(natural|samantha|daniel|google|alex|aria)/i.test(v.name)
        ) || voices.find((v) => v.lang.startsWith("en"));
      if (preferred) {
        utterance.voice = preferred;
      }

      utterance.onstart = () => setIsAiSpeaking(true);
      utterance.onend = () => setIsAiSpeaking(false);
      utterance.onerror = () => setIsAiSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsAiSpeaking(false);
    }
  };

  const stopListening = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore
    }
    setIsListening(false);
    setInterimTranscript("");
  };

  const startListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    stopAiSpeech();
    try {
      const recognition = new SpeechRec();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let finalChunk = "";
        let interimChunk = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0]?.transcript || "";
          if (event.results[i].isFinal) {
            finalChunk += piece + " ";
          } else {
            interimChunk += piece;
          }
        }
        if (finalChunk.trim()) {
          setTranscript((prev) =>
            prev ? `${prev.trim()} ${finalChunk.trim()}` : finalChunk.trim()
          );
        }
        setInterimTranscript(interimChunk);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setInterimTranscript("");
      };

      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript("");
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  const startVoiceInterviewSession = async () => {
    stopAiSpeech();
    stopListening();
    setIsLoadingQuestions(true);
    setLoadError(null);
    setFeedbackByQuestion({});
    setTranscript("");
    setCurrentIdx(0);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("prospect_session_token")
          : null;
      const res = await fetch("/api/ai/mock-interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? {
                authorization: `Bearer ${token}`,
                "x-prospect-session": token,
              }
            : {}),
        },
        body: JSON.stringify({
          action: "GENERATE_QUESTIONS",
          roleTitle:
            activeOpp?.title ||
            profile?.targetRoles?.[0] ||
            "Software Engineering Intern",
          organization: activeOpp?.organization || "Target Engineering Team",
          opportunity: activeOpp,
          profile,
        }),
      });

      const data = await res.json();
      if (!res.ok || !Array.isArray(data.questions)) {
        throw new Error(data.error || "Unable to fetch interview questions");
      }

      setQuestions(data.questions);
      setWebSourcesChecked(data.webSourcesChecked || []);
      setAiProviderLabel(
        data.aiProvider || "Prospect Hybrid Web + Capability Engine"
      );

      const firstQ = data.questions[0];
      if (firstQ && autoSpeak) {
        speakText(
          `Welcome to your Prospect AI Mock Interview for ${data.roleTitle} at ${data.organization}. Question 1: ${firstQ.question}`
        );
      }
    } catch (err: any) {
      setLoadError(err?.message || "Failed to initialize interview session.");
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const currentQuestion = questions[currentIdx] || null;
  const currentFeedback = currentQuestion
    ? feedbackByQuestion[currentQuestion.id]
    : undefined;

  const handleSelectQuestionIndex = (idx: number) => {
    stopAiSpeech();
    stopListening();
    setCurrentIdx(idx);
    setTranscript("");
    const q = questions[idx];
    if (q && autoSpeak) {
      speakText(`Question ${idx + 1}: ${q.question}`);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!currentQuestion) return;
    stopListening();
    const answerText = `${transcript} ${interimTranscript}`.trim();
    if (answerText.length < 10) {
      setLoadError(
        "Please speak into your microphone or type at least a sentence before evaluating."
      );
      return;
    }

    setLoadError(null);
    setIsEvaluating(true);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("prospect_session_token")
          : null;
      const res = await fetch("/api/ai/mock-interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token
            ? {
                authorization: `Bearer ${token}`,
                "x-prospect-session": token,
              }
            : {}),
        },
        body: JSON.stringify({
          action: "EVALUATE_ANSWER",
          question: currentQuestion.question,
          expectedKeyPoints: currentQuestion.expectedKeyPoints,
          targetCapability: currentQuestion.targetCapability,
          sourceType: currentQuestion.sourceType,
          transcript: answerText,
          roleTitle: activeOpp?.title || profile?.targetRoles?.[0],
          organization: activeOpp?.organization,
          profile,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Evaluation failed");
      }

      const evalData: EvaluationFeedback = {
        overallScore: data.overallScore,
        metrics: data.metrics,
        spokenInterviewerResponse: data.spokenInterviewerResponse,
        strengths: data.strengths || [],
        missingConcepts: data.missingConcepts || [],
        sampleStrongAnswer: data.sampleStrongAnswer,
        followUpQuestion: data.followUpQuestion,
      };
      setFeedbackByQuestion((prev) => ({
        ...prev,
        [currentQuestion.id]: evalData,
      }));

      if (autoSpeak && evalData.spokenInterviewerResponse) {
        speakText(evalData.spokenInterviewerResponse);
      }
    } catch (err: any) {
      setLoadError(err?.message || "Failed to evaluate answer.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const evaluatedCount = Object.keys(feedbackByQuestion).length;
  const sessionAverageScore = useMemo(() => {
    const vals = Object.values(feedbackByQuestion);
    if (vals.length === 0) return null;
    return Math.round(
      vals.reduce((sum, item) => sum + item.overallScore, 0) / vals.length
    );
  }, [feedbackByQuestion]);

  if (!profile) {
    return (
      <div className="rounded-[22px] bg-white border border-[#E9E6DF] p-8 sm:p-10 text-center space-y-4 shadow-[0_8px_28px_rgba(17,17,17,0.04)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1FFC7] border border-[#D7ED93] text-[#111111]">
          <Mic className="h-6 w-6" />
        </div>
        <h3 className="font-heading text-xl font-bold text-[#111111]">
          Upload Your Resume Before Starting Voice Interview
        </h3>
        <p className="text-xs sm:text-sm text-[#777777] max-w-md mx-auto leading-relaxed">
          Our AI Voice Interviewer inspects your real projects, demonstrated skills, and role gaps alongside live web engineering discussions to ask tailored questions.
        </p>
        {onUploadResume && (
          <button
            type="button"
            onClick={onUploadResume}
            className="inline-flex items-center gap-2 rounded-2xl bg-[#111111] text-white px-5 py-2.5 text-xs sm:text-sm font-semibold cursor-pointer"
          >
            <span>Upload Resume First</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Studio Control Header */}
      <section className="rounded-[22px] bg-[#101010] text-white p-6 sm:p-7 border border-white/10 shadow-[0_14px_38px_rgba(17,17,17,0.14)] relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-[#DFFF43]/15 blur-3xl"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] border border-white/15 px-3 py-1 text-[11px] font-heading font-bold text-[#DFFF43]">
              <Mic className="h-3.5 w-3.5" />
              <span>AI VOICE MOCK INTERVIEW STUDIO • LIVE WEB + RESUME CAPABILITIES</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-extrabold tracking-tight">
              Practice Out Loud with Adaptive Voice Feedback
            </h2>
            <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
              Every interview mixes live questions sourced from engineering communities on the web with dynamic capability &amp; skill-gap probes synthesized from{" "}
              <span className="text-[#DFFF43] font-semibold">
                {profile.fullName || "your uploaded resume"}
              </span>
              .
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            {opportunities.length > 0 && (
              <select
                value={selectedOppId}
                onChange={(e) => setSelectedOppId(e.target.value)}
                aria-label="Target role for voice mock interview"
                className="rounded-xl border border-white/20 bg-white/10 text-white px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#DFFF43] max-w-[260px]"
              >
                {opportunities.slice(0, 15).map((opp) => (
                  <option
                    key={opp.id}
                    value={opp.id}
                    className="bg-[#101010] text-white"
                  >
                    {opp.title} • {opp.organization}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={startVoiceInterviewSession}
              disabled={isLoadingQuestions}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#DFFF43] text-[#111111] font-heading font-bold px-5 py-2.5 text-xs sm:text-sm shadow-[0_6px_22px_rgba(223,255,67,0.3)] hover:bg-[#e9ff73] disabled:opacity-60 transition-all cursor-pointer"
            >
              {isLoadingQuestions ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Fetching Web + AI Questions...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-[#111111]" />
                  <span>
                    {questions.length > 0
                      ? "Refresh Live Session"
                      : "Start Voice Interview"}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Web Sources + Audio Settings Strip */}
        <div className="relative z-10 mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <div className="flex flex-wrap items-center gap-2 text-white/75">
            <span className="font-semibold text-white">Sources:</span>
            {(webSourcesChecked.length > 0
              ? webSourcesChecked
              : [
                  "Hacker News Live Web",
                  "Dev.to Engineering",
                  "StackOverflow API",
                  "Prospect Resume Capability Engine",
                ]
            ).map((src) => (
              <span
                key={src}
                className="rounded-full bg-white/[0.07] border border-white/10 px-2.5 py-0.5 text-[10.5px]"
              >
                {src}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (autoSpeak) stopAiSpeech();
                setAutoSpeak(!autoSpeak);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 border text-[11px] font-semibold transition-all cursor-pointer ${
                autoSpeak
                  ? "bg-[#DFFF43]/15 border-[#DFFF43]/40 text-[#DFFF43]"
                  : "bg-white/[0.06] border-white/15 text-white/60"
              }`}
            >
              {autoSpeak ? (
                <Volume2 className="h-3.5 w-3.5" />
              ) : (
                <VolumeX className="h-3.5 w-3.5" />
              )}
              <span>AI Auto-Speak: {autoSpeak ? "ON" : "OFF"}</span>
            </button>

            {sessionAverageScore !== null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#F1FFC7] text-[#111111] px-3 py-1 font-bold">
                <Award className="h-3.5 w-3.5 text-[#70B93F]" />
                <span>
                  Session Avg: {sessionAverageScore}% ({evaluatedCount}/
                  {questions.length})
                </span>
              </span>
            )}
          </div>
        </div>
      </section>

      {loadError && (
        <div className="rounded-2xl border border-amber-300 bg-[#FEF9E7] px-4 py-3 text-xs font-medium text-[#715515]">
          {loadError}
        </div>
      )}

      {/* Pre-Start State */}
      {questions.length === 0 ? (
        <div className="rounded-[22px] bg-white border border-[#E9E6DF] p-8 sm:p-10 text-center space-y-4 shadow-[0_8px_28px_rgba(17,17,17,0.04)]">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#F1FFC7] to-[#DFFF43] border border-[#C6E832] text-[#111111] shadow-[0_10px_28px_rgba(223,255,67,0.28)]">
            <Sparkles className="h-7 w-7" />
          </div>
          <div className="space-y-1.5 max-w-lg mx-auto">
            <h3 className="font-heading text-xl font-bold text-[#111111]">
              Ready for Your Live Voice Mock Interview
            </h3>
            <p className="text-xs sm:text-sm text-[#777777] leading-relaxed">
              Click <strong className="text-[#111111]">&quot;Start Voice Interview&quot;</strong> above to fetch live technical interview topics from the web and dynamically generate deep probes targeting your{" "}
              <strong className="text-[#111111]">
                {profile.skills.slice(0, 4).join(", ") || "resume capabilities"}
              </strong>{" "}
              and{" "}
              <strong className="text-[#111111]">
                {activeOpp?.title || profile.targetRoles?.[0] || "target role"}
              </strong>
              .
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-3 pt-2 text-[11px] font-medium text-[#777777]">
            <span className="rounded-full bg-[#FDFBF8] border border-[#E9E6DF] px-3 py-1">
              ✓ {ttsSupported ? "Browser AI Voice Ready" : "Visual Prompt Ready"}
            </span>
            <span className="rounded-full bg-[#FDFBF8] border border-[#E9E6DF] px-3 py-1">
              ✓{" "}
              {micSupported
                ? "Microphone Speech-to-Text Ready"
                : "Text Transcript Mode Active"}
            </span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Question Queue */}
          <div className="lg:col-span-4 space-y-2.5">
            <div className="flex items-center justify-between px-1">
              <span className="font-heading text-xs font-bold uppercase tracking-wider text-[#777777]">
                Interview Queue ({questions.length})
              </span>
              {aiProviderLabel && (
                <span className="text-[10px] font-medium text-[#70B93F] truncate max-w-[160px]">
                  {aiProviderLabel}
                </span>
              )}
            </div>

            {questions.map((q, idx) => {
              const isActive = idx === currentIdx;
              const done = Boolean(feedbackByQuestion[q.id]);
              const isWeb = q.sourceType === "LIVE_WEB";
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleSelectQuestionIndex(idx)}
                  className={`w-full rounded-[18px] border p-3.5 text-left transition-all cursor-pointer space-y-1.5 ${
                    isActive
                      ? "bg-[#F1FFC7]/75 border-[#C6E832] shadow-[0_6px_20px_rgba(223,255,67,0.2)]"
                      : "bg-white border-[#E9E6DF] hover:bg-[#FDFBF8]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isWeb
                          ? "bg-[#EAE3FF] text-[#111111] border border-[#D7CCF8]"
                          : "bg-[#111111] text-[#DFFF43]"
                      }`}
                    >
                      {isWeb ? (
                        <Globe className="h-2.5 w-2.5" />
                      ) : (
                        <BrainCircuit className="h-2.5 w-2.5" />
                      )}
                      <span>{isWeb ? "Live Web" : "AI Capability"}</span>
                    </span>

                    {done ? (
                      <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#70B93F]">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>{feedbackByQuestion[q.id].overallScore}%</span>
                      </span>
                    ) : (
                      <span className="text-[10.5px] font-mono text-[#777777]">
                        Q{idx + 1}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[#111111] line-clamp-2 leading-snug">
                    {q.question}
                  </p>
                  <div className="text-[10.5px] text-[#777777] truncate">
                    Target: {q.targetCapability}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Voice Interviewer Stage */}
          {currentQuestion && (
            <div className="lg:col-span-8 space-y-5">
              {/* Spoken Question Card with Voice Avatar + Source Link */}
              <div className="rounded-[22px] bg-white border border-[#E9E6DF] p-6 shadow-[0_8px_28px_rgba(17,17,17,0.04)] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E9E6DF]">
                  <div className="flex items-center gap-3">
                    {/* Animated Voice Pulse Orb */}
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all ${
                        isAiSpeaking
                          ? "bg-[#DFFF43] border-[#70B93F] scale-105 shadow-[0_0_24px_rgba(223,255,67,0.65)]"
                          : "bg-[#101010] border-[#101010] text-[#DFFF43]"
                      }`}
                    >
                      <Volume2
                        className={`h-5 w-5 ${
                          isAiSpeaking ? "text-[#111111] animate-pulse" : "text-[#DFFF43]"
                        }`}
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-heading text-xs font-bold text-[#111111]">
                          Question {currentIdx + 1} of {questions.length}
                        </span>
                        <span className="rounded-full bg-[#FDFBF8] border border-[#E9E6DF] px-2 py-0.5 text-[10px] font-semibold text-[#777777]">
                          {currentQuestion.category}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            currentQuestion.sourceType === "LIVE_WEB"
                              ? "bg-[#EAE3FF] text-[#111111]"
                              : "bg-[#F1FFC7] text-[#111111]"
                          }`}
                        >
                          {currentQuestion.sourceLabel}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#777777] mt-0.5">
                        Capability Probe: <strong className="text-[#111111]">{currentQuestion.targetCapability}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {ttsSupported && (
                      <button
                        type="button"
                        onClick={() =>
                          isAiSpeaking
                            ? stopAiSpeech()
                            : speakText(currentQuestion.question)
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#E9E6DF] bg-[#FDFBF8] hover:bg-[#F1FFC7] px-3 py-1.5 text-xs font-semibold text-[#111111] cursor-pointer"
                      >
                        {isAiSpeaking ? (
                          <>
                            <VolumeX className="h-3.5 w-3.5" />
                            <span>Stop Voice</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="h-3.5 w-3.5" />
                            <span>Speak Aloud</span>
                          </>
                        )}
                      </button>
                    )}

                    {currentQuestion.sourceUrl && (
                      <a
                        href={currentQuestion.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-xl border border-[#E9E6DF] bg-white px-3 py-1.5 text-xs font-semibold text-[#111111] hover:bg-[#F8F6F1]"
                      >
                        <span>Web Source</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Question Prompt */}
                <h3 className="font-heading text-lg sm:text-xl font-bold text-[#111111] leading-snug">
                  &ldquo;{currentQuestion.question}&rdquo;
                </h3>

                {/* Explainability Trace for Question */}
                <div className="rounded-2xl bg-[#FDFBF8] border border-[#E9E6DF] p-3.5 text-xs text-[#555555]">
                  <strong className="text-[#111111]">
                    Why Prospect is asking this:{" "}
                  </strong>
                  {currentQuestion.whyAsked}
                </div>

                {/* Voice Mic Capture + Transcript Area */}
                <div className="space-y-3 pt-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-heading text-xs font-bold text-[#111111]">
                      Your Spoken Answer Transcript
                    </span>

                    <div className="flex items-center gap-2">
                      {micSupported && (
                        <button
                          type="button"
                          onClick={() =>
                            isListening ? stopListening() : startListening()
                          }
                          className={`inline-flex items-center gap-1.5 rounded-2xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                            isListening
                              ? "bg-red-600 text-white shadow-[0_4px_16px_rgba(220,38,38,0.3)] animate-pulse"
                              : "bg-[#DFFF43] text-[#111111] border border-[#C6E832] hover:bg-[#e7ff70]"
                          }`}
                        >
                          {isListening ? (
                            <>
                              <MicOff className="h-3.5 w-3.5" />
                              <span>Stop Listening</span>
                            </>
                          ) : (
                            <>
                              <Mic className="h-3.5 w-3.5" />
                              <span>Answer by Voice (Mic)</span>
                            </>
                          )}
                        </button>
                      )}

                      {transcript && (
                        <button
                          type="button"
                          onClick={() => setTranscript("")}
                          className="rounded-xl border border-[#E9E6DF] bg-white px-2.5 py-2 text-xs text-[#777777] hover:text-[#111111] cursor-pointer"
                          title="Clear answer"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <textarea
                    rows={5}
                    value={
                      interimTranscript
                        ? `${transcript}${transcript ? " " : ""}${interimTranscript}`
                        : transcript
                    }
                    onChange={(e) => {
                      setInterimTranscript("");
                      setTranscript(e.target.value);
                    }}
                    placeholder={
                      micSupported
                        ? 'Click "Answer by Voice (Mic)" and speak naturally, or type/edit your response here...'
                        : "Type your structured interview response here..."
                    }
                    className="w-full rounded-2xl border border-[#E9E6DF] bg-[#FDFBF8] focus:bg-white focus:border-[#A6D94B] focus:ring-2 focus:ring-[#DFFF43]/40 p-4 text-xs sm:text-sm text-[#111111] leading-relaxed focus:outline-none transition-all"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-[11px] text-[#777777]">
                      Expected signals: {currentQuestion.expectedKeyPoints.slice(0, 2).join(" • ")}
                    </div>

                    <button
                      type="button"
                      onClick={handleEvaluateAnswer}
                      disabled={isEvaluating}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#111111] text-white px-5 py-2.5 text-xs font-semibold shadow-[0_6px_18px_rgba(17,17,17,0.16)] hover:bg-[#222222] disabled:opacity-50 transition-all cursor-pointer"
                    >
                      {isEvaluating ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Evaluating Answer...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5 text-[#DFFF43]" />
                          <span>Evaluate My Answer</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Evaluation Scorecard */}
              {currentFeedback && (
                <div className="rounded-[22px] bg-white border border-[#D7ED93] p-6 shadow-[0_10px_30px_rgba(166,217,75,0.12)] space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#E9E6DF]">
                    <div>
                      <div className="text-[11px] font-heading font-bold uppercase tracking-wider text-[#70B93F]">
                        AI Interviewer Scorecard &amp; Voice Critique
                      </div>
                      <p className="mt-1 text-xs sm:text-sm font-semibold text-[#111111]">
                        {currentFeedback.spokenInterviewerResponse}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-2xl bg-[#F1FFC7] border border-[#D7ED93] px-4 py-2 text-center">
                      <div className="font-heading text-2xl font-extrabold text-[#111111]">
                        {currentFeedback.overallScore}%
                      </div>
                      <div className="text-[10px] font-semibold text-[#777777]">
                        Overall Fit
                      </div>
                    </div>
                  </div>

                  {/* 4 Metric Pillars */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    {[
                      {
                        label: "Technical Accuracy",
                        val: currentFeedback.metrics.technicalAccuracy,
                      },
                      {
                        label: "Evidence Depth",
                        val: currentFeedback.metrics.evidenceDepth,
                      },
                      {
                        label: "Clarity",
                        val: currentFeedback.metrics.clarity,
                      },
                      {
                        label: "STAR Structure",
                        val: currentFeedback.metrics.starStructure,
                      },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className="rounded-xl bg-[#FDFBF8] border border-[#E9E6DF] p-3"
                      >
                        <div className="text-[10.5px] text-[#777777]">
                          {m.label}
                        </div>
                        <div className="mt-1 font-heading text-base font-extrabold text-[#111111]">
                          {m.val}%
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="rounded-2xl bg-[#F1FFC7]/45 border border-[#D7ED93] p-4 space-y-1.5">
                      <div className="font-heading font-bold text-[#111111]">
                        ✓ What You Covered Well
                      </div>
                      <ul className="space-y-1 text-[#111111]/85 list-disc pl-4">
                        {currentFeedback.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl bg-[#EAE3FF]/45 border border-[#D7CCF8] p-4 space-y-1.5">
                      <div className="font-heading font-bold text-[#111111]">
                        ↑ Concepts to Mention Next Time
                      </div>
                      <ul className="space-y-1 text-[#111111]/85 list-disc pl-4">
                        {currentFeedback.missingConcepts.map((m, i) => (
                          <li key={i}>{m}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-[#FDFBF8] border border-[#E9E6DF] p-4 text-xs space-y-1">
                    <div className="font-heading font-bold text-[#111111]">
                      Grounded Reference Architecture Answer
                    </div>
                    <p className="text-[#555555] leading-relaxed">
                      {currentFeedback.sampleStrongAnswer}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <div className="text-xs text-[#555555]">
                      <strong className="text-[#111111]">AI Follow-up: </strong>
                      {currentFeedback.followUpQuestion}
                    </div>

                    {currentIdx < questions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => handleSelectQuestionIndex(currentIdx + 1)}
                        className="inline-flex items-center gap-1.5 rounded-2xl bg-[#DFFF43] text-[#111111] border border-[#C6E832] px-4 py-2 text-xs font-bold cursor-pointer"
                      >
                        <span>Next Question</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startVoiceInterviewSession}
                        className="inline-flex items-center gap-1.5 rounded-2xl bg-[#111111] text-white px-4 py-2 text-xs font-bold cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>New Question Set</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

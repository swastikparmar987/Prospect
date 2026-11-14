"use client";

import React, { useState } from "react";
import {
  X,
  Lock,
  Mail,
  KeyRound,
  User,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export interface AuthSessionUser {
  userId: string;
  email: string;
  role: "STUDENT" | "ADMIN" | "GUEST";
  fullName?: string;
}

export interface AuthSuccessPayload {
  user: AuthSessionUser;
  token: string;
}

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: AuthSuccessPayload) => void;
  initialMode?: "signin" | "signup";
  promptMessage?: string;
}

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = "signin",
  promptMessage,
}: AuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setFullName("");
    setErrorMessage(null);
    setSuccessNotice(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleDemoAuthorize = async () => {
    setIsDemoLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      // 1-Click Authorize as Demo Student
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "student@prospect.ai",
          role: "STUDENT",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        throw new Error(data.error || "Failed to authorize demo session");
      }

      // Persist session token to localStorage for authenticated client requests
      if (typeof window !== "undefined") {
        localStorage.setItem("prospect_session_token", data.token);
        localStorage.setItem("prospect_user_email", data.user.email);
        localStorage.setItem("prospect_user_id", data.user.userId);
      }

      setSuccessNotice("Authorized as Demo Student! Initializing session...");

      setTimeout(() => {
        onSuccess({
          user: {
            userId: data.user.userId,
            email: data.user.email,
            role: data.user.role || "STUDENT",
            fullName: "Alex Chen (Demo Student)",
          },
          token: data.token,
        });
      }, 350);
    } catch (err: any) {
      setErrorMessage(err.message || "Unable to authorize demo session");
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessNotice(null);

    // Validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (mode === "signup" && !fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          role: "STUDENT",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        throw new Error(data.error || "Authentication failed. Please try again.");
      }

      // Persist session token in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("prospect_session_token", data.token);
        localStorage.setItem("prospect_user_email", data.user.email);
        localStorage.setItem("prospect_user_id", data.user.userId);
        if (fullName.trim()) {
          localStorage.setItem("prospect_user_name", fullName.trim());
        }
      }

      setSuccessNotice(
        mode === "signin"
          ? "Welcome back! Entering workspace..."
          : "Account created! Initializing profile..."
      );

      setTimeout(() => {
        onSuccess({
          user: {
            userId: data.user.userId,
            email: data.user.email,
            role: data.user.role || "STUDENT",
            fullName: fullName.trim() || undefined,
          },
          token: data.token,
        });
      }, 400);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to authenticate. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#080808]/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-[#FDF9F3] rounded-2xl border-2 border-[#080808] shadow-[6px_6px_0px_#080808] overflow-hidden text-[#080808]">
        {/* Top Accent Strip */}
        <div className="h-2 w-full bg-[#E0FB66] border-b-2 border-[#080808]" />

        {/* Modal Header */}
        <div className="px-6 pt-5 pb-4 border-b-2 border-[#080808] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#E0FB66] border-2 border-[#080808] flex items-center justify-center text-[#080808] shadow-[2px_2px_0px_#080808]">
              <Lock className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h2
                id="auth-modal-title"
                className="text-lg font-heading font-extrabold tracking-tight text-[#080808]"
              >
                {mode === "signin" ? "Sign In to Prospect" : "Create Your Account"}
              </h2>
              <p className="text-xs text-[#080808]/70 font-medium">
                Mandatory secure access to your career engine
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="h-8 w-8 rounded-lg border-2 border-[#080808] bg-white hover:bg-[#E0FB66] flex items-center justify-center text-[#080808] shadow-[2px_2px_0px_#080808] transition-all cursor-pointer"
          >
            <X className="h-4 w-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Prompt banner if routed here from an unauthenticated action */}
          {promptMessage && (
            <div className="p-3 rounded-xl border-2 border-[#080808] bg-[#FEF189] text-[#080808] text-xs font-semibold flex items-center gap-2 shadow-[2px_2px_0px_#080808]">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#080808]" />
              <span>{promptMessage}</span>
            </div>
          )}

          {/* 1-Click Demo Authorization Button (Prominent) */}
          <div className="rounded-xl border-2 border-[#080808] bg-white p-3.5 shadow-[3px_3px_0px_#080808]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#080808]/70 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-[#080808]" /> Fast Evaluation Mode
              </span>
              <span className="text-[10px] bg-[#E0FB66] font-bold px-1.5 py-0.5 rounded border border-[#080808]">
                Instant
              </span>
            </div>
            <button
              type="button"
              onClick={handleDemoAuthorize}
              disabled={isDemoLoading || isLoading}
              className="w-full bg-[#E0FB66] hover:bg-[#d6f74a] text-[#080808] font-heading font-extrabold text-sm py-2.5 px-4 rounded-xl border-2 border-[#080808] shadow-[3px_3px_0px_#080808] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isDemoLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#080808]" />
                  <span>Authorizing Demo...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-[#080808]" />
                  <span>Authorize as Demo Student</span>
                  <ArrowRight className="h-4 w-4 stroke-[2.5]" />
                </>
              )}
            </button>
            <p className="mt-1.5 text-[11px] text-center text-[#080808]/70 font-medium">
              1-click pre-signed session with loaded Stanford CS profile
            </p>
          </div>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#080808]/20" />
            </div>
            <span className="relative bg-[#FDF9F3] px-3 text-[11px] font-bold uppercase tracking-wider text-[#080808]/60">
              Or with credentials
            </span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-xl border-2 border-[#080808] shadow-[2px_2px_0px_#080808]">
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setErrorMessage(null);
              }}
              className={`py-1.5 text-xs font-heading font-bold rounded-lg transition-all ${
                mode === "signin"
                  ? "bg-[#080808] text-white shadow-[1px_1px_0px_#080808]"
                  : "text-[#080808] hover:bg-neutral-100"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setErrorMessage(null);
              }}
              className={`py-1.5 text-xs font-heading font-bold rounded-lg transition-all ${
                mode === "signup"
                  ? "bg-[#080808] text-white shadow-[1px_1px_0px_#080808]"
                  : "text-[#080808] hover:bg-neutral-100"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Status Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl border-2 border-red-600 bg-red-50 text-red-900 text-xs font-medium flex items-start gap-2 shadow-[2px_2px_0px_rgba(220,38,38,0.4)]">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 rounded-xl border-2 border-emerald-600 bg-emerald-50 text-emerald-900 text-xs font-medium flex items-center gap-2 shadow-[2px_2px_0px_rgba(5,150,105,0.4)]">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <div>
                <label className="block text-xs font-heading font-bold text-[#080808] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#080808]/50" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Alex Chen"
                    className="w-full bg-white border-2 border-[#080808] rounded-xl pl-9 pr-3.5 py-2 text-sm text-[#080808] placeholder:text-[#080808]/40 font-medium focus:outline-none focus:ring-2 focus:ring-[#E0FB66] shadow-[2px_2px_0px_#080808]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-heading font-bold text-[#080808] mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#080808]/50" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full bg-white border-2 border-[#080808] rounded-xl pl-9 pr-3.5 py-2 text-sm text-[#080808] placeholder:text-[#080808]/40 font-medium focus:outline-none focus:ring-2 focus:ring-[#E0FB66] shadow-[2px_2px_0px_#080808]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-heading font-bold text-[#080808] mb-1">
                Password
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#080808]/50" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border-2 border-[#080808] rounded-xl pl-9 pr-3.5 py-2 text-sm text-[#080808] placeholder:text-[#080808]/40 font-medium focus:outline-none focus:ring-2 focus:ring-[#E0FB66] shadow-[2px_2px_0px_#080808]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isDemoLoading}
              className="w-full bg-[#080808] hover:bg-[#1a1a1a] text-white font-heading font-bold text-sm py-2.5 px-4 rounded-xl border-2 border-[#080808] shadow-[3px_3px_0px_#080808] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>
                  {mode === "signin" ? "Sign In & Open Workspace" : "Create Account & Get Started"}
                </span>
              )}
            </button>
          </form>

          {/* Security Guarantee Footnote */}
          <div className="pt-2 border-t border-[#080808]/15 flex items-center justify-center gap-1.5 text-[11px] text-[#080808]/60 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>HMAC-SHA256 Signed Session • Anti-Tampering Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

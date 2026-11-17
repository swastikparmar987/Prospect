"use client";

import React, { useState, useRef, DragEvent } from "react";
import {
  Upload,
  FileText,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  FileCheck2,
  Lock,
} from "lucide-react";

interface ResumeUploadExperienceProps {
  onParsedSuccess: (parseData: any) => void;
  onSkipToManual?: () => void;
  isReplacingResume?: boolean;
}

export function ResumeUploadExperience({
  onParsedSuccess,
  onSkipToManual,
  isReplacingResume = false,
}: ResumeUploadExperienceProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: number;
    extension: string;
  } | null>(null);
  const [parsingProgress, setParsingProgress] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = async (file: File) => {
    setError(null);

    // Validate size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setError("File exceeds the 5MB size limit. Please upload a smaller resume.");
      return;
    }

    // Validate format
    const extension = file.name.split(".").pop()?.toLowerCase();
    const validExts = ["pdf", "docx", "txt", "md"];
    if (!extension || !validExts.includes(extension)) {
      setError(
        `Unsupported file type (.${extension || "unknown"}). Please upload a PDF or Word document (.docx).`
      );
      return;
    }

    setSelectedFile({
      name: file.name,
      size: file.size,
      extension: extension.toUpperCase(),
    });

    setUploading(true);
    setParsingProgress("Reading document structure...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      setParsingProgress("Extracting academic background, skills, and projects...");

      const res = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process resume.");
      }

      setParsingProgress("Mapping demonstrated capabilities and target roles...");

      // Short delay for visual polish before transitioning
      setTimeout(() => {
        onParsedSuccess(data);
      }, 400);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while parsing your resume.");
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Editorial Header */}
      <div className="mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#C6E832] bg-[#E3FC6D] px-3.5 py-1 text-xs font-semibold text-[#0E1012] shadow-[0_2px_10px_rgba(205,238,54,0.28)] mb-4">
          <Sparkles className="h-3.5 w-3.5 text-[#0E1012]" />
          <span>Resume-First Opportunity Discovery</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#101214]">
          Let&apos;s find opportunities that fit you.
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-base sm:text-lg text-[#64748B]">
          Upload your resume. We&apos;ll understand your profile and find opportunities worth pursuing.
        </p>
      </div>

      {/* Main Upload Card */}
      <div className="overflow-hidden bg-white border border-black/[0.07] rounded-[26px] shadow-[0_12px_38px_rgba(15,23,42,0.06)]">
        <div className="p-6 sm:p-10">
          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer ${
              isDragging
                ? "border-[#94D814] bg-[#F3FCDA]/80"
                : "border-black/[0.14] bg-[#FAFBF7]/60 hover:border-[#94D814] hover:bg-[#F3FCDA]/45"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />

            {/* Visual Icon */}
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#C6E832] bg-[#E3FC6D] text-[#0E1012] shadow-[0_4px_14px_rgba(205,238,54,0.32)]">
              {uploading ? (
                <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#0E1012] border-t-transparent" />
              ) : selectedFile ? (
                <FileCheck2 className="h-8 w-8 text-[#0E1012]" />
              ) : (
                <Upload className="h-8 w-8 text-[#0E1012]" />
              )}
            </div>

            {uploading ? (
              <div className="space-y-2">
                <p className="text-lg font-extrabold text-[#101214]">
                  {parsingProgress || "Processing your resume..."}
                </p>
                <p className="text-xs text-[#64748B]">
                  Extracting education, skills, projects, and work experiences...
                </p>
              </div>
            ) : selectedFile ? (
              <div className="space-y-1">
                <p className="text-base font-extrabold text-[#101214]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-[#64748B]">
                  {selectedFile.extension} • {formatFileSize(selectedFile.size)}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xl font-extrabold text-[#101214]">
                  Drop your resume here, or{" "}
                  <span className="underline underline-offset-4 decoration-[#C6E832] decoration-4">
                    browse files
                  </span>
                </p>
                <p className="text-xs sm:text-sm text-[#64748B]">
                  Supports PDF or Word Document (.docx) up to 5 MB
                </p>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#101214] text-white font-semibold shadow-[0_6px_18px_rgba(16,18,20,0.16)] hover:bg-[#1E2226] transition-all px-5 py-2.5 text-xs">
                    <FileText className="h-3.5 w-3.5" />
                    Select Resume File
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs sm:text-sm text-rose-800">
              <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">Unable to process file</p>
                <p className="mt-0.5 text-rose-700">{error}</p>
              </div>
            </div>
          )}

          {/* What We Extract Preview Grid */}
          <div className="mt-8 border-t border-black/[0.07] pt-8">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
              What Prospect understands from your resume
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-black/[0.07] bg-[#FAFBF7] p-3.5 text-left">
                <span className="text-[11px] font-bold text-[#64748B] uppercase">Academic</span>
                <p className="text-xs font-semibold text-[#101214] mt-0.5">Degree, Major, Grad Year & GPA</p>
              </div>
              <div className="rounded-2xl border border-black/[0.07] bg-[#FAFBF7] p-3.5 text-left">
                <span className="text-[11px] font-bold text-[#64748B] uppercase">Skills</span>
                <p className="text-xs font-semibold text-[#101214] mt-0.5">Languages, Frameworks & Tools</p>
              </div>
              <div className="rounded-2xl border border-black/[0.07] bg-[#FAFBF7] p-3.5 text-left">
                <span className="text-[11px] font-bold text-[#64748B] uppercase">Projects</span>
                <p className="text-xs font-semibold text-[#101214] mt-0.5">Demonstrated Technical Proof</p>
              </div>
              <div className="rounded-2xl border border-black/[0.07] bg-[#FAFBF7] p-3.5 text-left">
                <span className="text-[11px] font-bold text-[#64748B] uppercase">Experience</span>
                <p className="text-xs font-semibold text-[#101214] mt-0.5">Internships, Research & Roles</p>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Notice Footer */}
        <div className="border-t border-[#F5DFA0] bg-[#FEF9E7] px-6 py-4 sm:px-10">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 shrink-0 text-[#856404] mt-0.5" />
            <p className="text-xs leading-relaxed text-[#423A20]">
              <strong className="text-[#101214]">Privacy First:</strong> Your resume is processed safely to build your candidate profile. We never send your name, email, phone, or raw resume to external search engines or AI training sets. You review and confirm all extracted facts before anything is saved.
            </p>
          </div>
        </div>
      </div>

      {/* Manual Fallback Option if student prefers */}
      {onSkipToManual && !isReplacingResume && (
        <div className="mt-6 text-center">
          <button
            onClick={onSkipToManual}
            className="text-xs font-semibold text-[#4B5563] hover:text-[#101214] hover:underline underline-offset-4 transition cursor-pointer"
          >
            Prefer to fill your profile manually without a resume? Continue here →
          </button>
        </div>
      )}
    </div>
  );
}


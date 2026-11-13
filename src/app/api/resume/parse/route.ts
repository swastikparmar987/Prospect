import { NextResponse } from "next/server";
import { extractDocumentWithDetails, parseResumeWithAi } from "@/lib/resume-parser";
import { extractCandidateCapabilityMap } from "@/lib/candidate-intelligence";
import { expandCandidateRoleFamilies } from "@/lib/role-expansion";
import { UserProfile } from "@/types";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Dedicated Resume Parsing & Information Extraction API.
 * 
 * Extracts facts, capabilities, and suggested career paths WITHOUT persisting
 * to the database until the student reviews and confirms them.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file was provided in the upload request." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 5MB limit. Please upload a smaller resume." },
        { status: 400 }
      );
    }

    const filename = file.name || "resume.pdf";
    const extension = filename.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["pdf", "docx", "txt", "md"];

    if (!extension || !allowedExtensions.includes(extension)) {
      return NextResponse.json(
        {
          error: `Unsupported file type (.${extension}). Prospect supports PDF, DOCX, TXT, and Markdown files.`,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extractionResult = await extractDocumentWithDetails(buffer, extension);
    const extractedText = extractionResult.text;
    const isScannedOrLowText = extractionResult.isScannedOrLowText;

    if (!extractedText || extractedText.trim().length < 15) {
      return NextResponse.json(
        {
          error:
            "Could not extract readable text from the uploaded document. Please check the file formatting or ensure it is not a scanned image/password-protected file.",
          isScannedOrLowText: true,
        },
        { status: 422 }
      );
    }

    // Parse resume text using deterministic heuristics and pattern matchers (or Gemini if configured)
    const parseResult = await parseResumeWithAi(extractedText, filename);
    const facts = parseResult.extractedProfile;

    // Build tentative profile object for capability mapping and role expansion
    // Zero placeholder fabrication: leave missing fields empty and flagged in lowConfidenceFields
    const tentativeProfile: UserProfile = {
      id: "preview-candidate",
      fullName: facts.fullName || "",
      email: facts.email || "",
      phone: facts.phone || undefined,
      headline: facts.headline || "",
      university: facts.university || "",
      degree: facts.degree || "",
      major: facts.major || "",
      graduationYear: facts.graduationYear ?? null,
      graduationMonth: facts.graduationMonth || null,
      gpa: facts.gpa ?? null,
      location: facts.location || "",
      targetRoles: facts.targetRoles || ["Software Engineering Intern"],
      preferredWorkModes: ["Remote", "Hybrid"],
      preferredLocations: facts.location ? [facts.location] : ["Remote / Flexible"],
      skills: facts.skills || [],
      coursework: facts.coursework || [],
      certifications: facts.certifications || [],
      awards: facts.awards || [],
      categorizedSkills: facts.categorizedSkills || {},
      lowConfidenceFields: parseResult.lowConfidenceFields,
      fieldConfidences: parseResult.fieldConfidences,
      experiences: facts.experiences || [],
      projects: facts.projects || [],
      portfolioLinks: facts.portfolioLinks || [],
      availability: "Immediate / Summer 2025",
      stipendPreference: "Flexible",
      constraints: "",
      resumeText: extractedText.slice(0, 10000),
      resumeFilename: filename,
      resumeExtractedAt: new Date().toISOString(),
      factProvenance: facts.factProvenance || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Extract demonstrated capabilities
    const capabilityMap = extractCandidateCapabilityMap(tentativeProfile);
    
    // Expand into suggested role families
    const expandedRoles = expandCandidateRoleFamilies(tentativeProfile, capabilityMap);

    // Derive suggested target roles from expanded roles and top skills
    const suggestedRoles = Array.from(
      new Set([
        ...expandedRoles.map((r) => r.title),
        ...(tentativeProfile.targetRoles || []),
        "Software Engineering Intern",
      ])
    ).slice(0, 5);

    // Derive suggested opportunity categories
    const suggestedCategories = [
      "Internship",
      ...(expandedRoles.some((r) => r.title.toLowerCase().includes("research")) ? ["Research"] : []),
      "Entry-level",
      "Hackathon",
      "Fellowship",
    ];

    // Return complete extracted facts and suggestions WITHOUT saving to DB
    return NextResponse.json({
      success: true,
      filename,
      fileSize: file.size,
      rawSnippet: extractedText.slice(0, 400),
      extractedProfile: tentativeProfile,
      capabilityMap,
      expandedRoles,
      suggestedRoles,
      suggestedCategories,
      lowConfidenceFields: parseResult.lowConfidenceFields,
      fieldConfidences: parseResult.fieldConfidences,
      confidence: parseResult.confidence,
      stats: {
        ...parseResult.extractionStats,
        pageCount: extractionResult.pageCount,
        isScannedOrLowText,
      },
      message: `Extracted ${tentativeProfile.skills.length} skills, ${tentativeProfile.projects.length} projects, and ${tentativeProfile.experiences.length} experiences from ${filename}.`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Resume parsing failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

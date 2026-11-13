import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractTextFromDocumentBuffer, parseResumeWithAi } from "@/lib/resume-parser";
import { extractCandidateCapabilityMap } from "@/lib/candidate-intelligence";
import { expandCandidateRoleFamilies } from "@/lib/role-expansion";
import { resolveAuthenticatedUser } from "@/lib/auth";
import { UserProfile } from "@/types";
import {
  EMBEDDING_MODEL_ID,
  generateCandidateEmbedding,
} from "@/lib/ai/semantic-embeddings";
import { extractAiResumeInsights } from "@/lib/ai/job-intelligence";
import { deriveLocationPreferenceFromProfile } from "@/lib/location-intelligence";
import { publishRealtimeEvent } from "@/lib/realtime/opportunity-events";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

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
        { error: "File size exceeds 5MB limit. Please upload a smaller file." },
        { status: 400 }
      );
    }

    const filename = file.name || "resume.txt";
    const extension = filename.split(".").pop()?.toLowerCase();
    const allowedExtensions = ["pdf", "txt", "docx", "md"];

    if (!extension || !allowedExtensions.includes(extension)) {
      return NextResponse.json(
        {
          error: `Unsupported file type (.${extension}). Only PDF, DOCX, TXT, and MD files are permitted.`,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extractedText = await extractTextFromDocumentBuffer(buffer, extension);

    if (!extractedText || extractedText.trim().length < 10) {
      return NextResponse.json(
        {
          error:
            "Could not extract meaningful text from the uploaded document. Please check the file formatting or upload a .txt / .md / text-based .pdf resume.",
        },
        { status: 422 }
      );
    }

    const parseResult = await parseResumeWithAi(extractedText, filename);
    const facts = parseResult.extractedProfile;

    const user = resolveAuthenticatedUser(req);
    // Persist directly to database scoped to authenticated user
    const existing = await prisma.userProfile.findFirst({
      where: { userId: user.userId },
      orderBy: { updatedAt: "desc" },
    });
    const mergedProfileInput: UserProfile = {
      id: existing?.id || "uploaded-profile",
      fullName: facts.fullName || existing?.fullName || "Candidate",
      email: facts.email || existing?.email || "",
      phone: facts.phone || undefined,
      headline: facts.headline || existing?.headline || "Student Candidate",
      university: facts.university || existing?.university || "",
      degree: facts.degree || existing?.degree || "Bachelor of Science",
      major: facts.major || existing?.major || "Computer Science",
      graduationYear: facts.graduationYear || existing?.graduationYear || 2026,
      graduationMonth: facts.graduationMonth || existing?.graduationMonth || "May",
      gpa: facts.gpa ?? existing?.gpa ?? null,
      location: facts.location || existing?.location || "Remote / Flexible",
      targetRoles:
        facts.targetRoles && facts.targetRoles.length > 0
          ? facts.targetRoles
          : JSON.parse(existing?.targetRoles || '["Software Engineering Intern"]'),
      preferredWorkModes: JSON.parse(
        existing?.preferredWorkModes || '["Remote","Hybrid","On-site"]'
      ),
      preferredLocations: (() => {
        const detectedLoc = (facts.location || "").trim();
        if (detectedLoc && !/^remote/i.test(detectedLoc)) {
          const derivedCity =
            deriveLocationPreferenceFromProfile(detectedLoc).city || detectedLoc;
          return Array.from(new Set([derivedCity, "Remote"]));
        }
        return JSON.parse(existing?.preferredLocations || '["Remote"]');
      })(),
      skills:
        facts.skills && facts.skills.length > 0
          ? facts.skills
          : JSON.parse(existing?.skills || "[]"),
      coursework: facts.coursework || undefined,
      certifications: facts.certifications || undefined,
      awards: facts.awards || undefined,
      categorizedSkills: facts.categorizedSkills || undefined,
      lowConfidenceFields: parseResult.lowConfidenceFields,
      experiences:
        facts.experiences && facts.experiences.length > 0
          ? facts.experiences
          : JSON.parse(existing?.experiences || "[]"),
      projects:
        facts.projects && facts.projects.length > 0
          ? facts.projects
          : JSON.parse(existing?.projects || "[]"),
      portfolioLinks:
        facts.portfolioLinks && facts.portfolioLinks.length > 0
          ? facts.portfolioLinks
          : JSON.parse(existing?.portfolioLinks || "[]"),
      availability: existing?.availability || "Immediate / Summer 2025",
      stipendPreference: existing?.stipendPreference || "Paid Only",
      constraints: existing?.constraints || "",
      resumeText: extractedText.slice(0, 10000),
      resumeFilename: filename,
      resumeExtractedAt: new Date().toISOString(),
      factProvenance: {
        ...JSON.parse(existing?.factProvenance || "{}"),
        ...(facts.factProvenance || {}),
      },
      createdAt: existing?.createdAt.toISOString() || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const capabilityMap = extractCandidateCapabilityMap(mergedProfileInput);
    const expandedRoles = expandCandidateRoleFamilies(
      mergedProfileInput,
      capabilityMap
    );
    const candidateEmbedding = generateCandidateEmbedding(mergedProfileInput);
    const aiInsights = await extractAiResumeInsights(
      mergedProfileInput,
      extractedText
    );
    const derivedLocPref = deriveLocationPreferenceFromProfile(
      mergedProfileInput.location,
      mergedProfileInput.preferredWorkModes,
      80
    );

    const payload = {
      fullName: mergedProfileInput.fullName,
      email: mergedProfileInput.email,
      headline: mergedProfileInput.headline,
      university: mergedProfileInput.university,
      degree: mergedProfileInput.degree,
      major: mergedProfileInput.major,
      graduationYear: mergedProfileInput.graduationYear,
      graduationMonth: mergedProfileInput.graduationMonth,
      gpa: mergedProfileInput.gpa,
      location: mergedProfileInput.location,
      targetRoles: JSON.stringify(mergedProfileInput.targetRoles),
      preferredWorkModes: JSON.stringify(mergedProfileInput.preferredWorkModes),
      preferredLocations: JSON.stringify(mergedProfileInput.preferredLocations),
      locationPreferenceJson: JSON.stringify(derivedLocPref),
      skills: JSON.stringify(mergedProfileInput.skills),
      experiences: JSON.stringify(mergedProfileInput.experiences),
      projects: JSON.stringify(mergedProfileInput.projects),
      portfolioLinks: JSON.stringify(mergedProfileInput.portfolioLinks),
      availability: mergedProfileInput.availability,
      stipendPreference: mergedProfileInput.stipendPreference,
      constraints: mergedProfileInput.constraints,
      resumeText: mergedProfileInput.resumeText,
      resumeFilename: filename,
      resumeExtractedAt: mergedProfileInput.resumeExtractedAt,
      factProvenance: JSON.stringify(mergedProfileInput.factProvenance),
      capabilitiesJson: JSON.stringify({
        ...capabilityMap,
        categorizedSkills: mergedProfileInput.categorizedSkills,
        coursework: mergedProfileInput.coursework,
        certifications: mergedProfileInput.certifications,
        awards: mergedProfileInput.awards,
        phone: mergedProfileInput.phone,
        lowConfidenceFields: mergedProfileInput.lowConfidenceFields,
      }),
      roleFamiliesJson: JSON.stringify(expandedRoles),
      embeddingJson: JSON.stringify(candidateEmbedding),
      embeddingModel: EMBEDDING_MODEL_ID,
      aiInsightsJson: JSON.stringify(aiInsights),
    };

    const savedDb = existing
      ? await prisma.userProfile.update({
          where: { id: existing.id },
          data: payload,
        })
      : await prisma.userProfile.create({
          data: {
            ...payload,
            userId: user.userId,
          },
        });

    const savedProfile: UserProfile = {
      ...mergedProfileInput,
      id: savedDb.id,
      capabilityMap,
      expandedRoleFamilies: expandedRoles,
      locationPreference: derivedLocPref.source !== "NONE" ? derivedLocPref : undefined,
      embedding: candidateEmbedding,
      embeddingModel: EMBEDDING_MODEL_ID,
      aiInsights,
    };

    publishRealtimeEvent(
      "PROFILE_UPDATED",
      `Resume parsed for ${savedProfile.fullName} (${savedProfile.location}) — re-anchoring vicinity and re-scoring opportunities.`,
      {
        profileId: savedDb.id,
        location: savedProfile.location,
        city: derivedLocPref.city,
        skillsCount: savedProfile.skills.length,
      },
      user.userId
    );

    return NextResponse.json({
      success: true,
      filename,
      extractedFacts: savedProfile,
      profile: savedProfile,
      capabilityMap,
      expandedRoles,
      aiInsights,
      embeddingModel: EMBEDDING_MODEL_ID,
      rawSnippet: extractedText.slice(0, 500),
      confidence: parseResult.confidence,
      provenanceLabel: "RESUME_DERIVED",
      message: `Extracted ${mergedProfileInput.skills.length} skills, ${capabilityMap.demonstratedCapabilities.length} capabilities, and ${expandedRoles.length} role families from ${filename} and updated your profile.`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Resume processing failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

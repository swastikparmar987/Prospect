import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractCandidateCapabilityMap } from "@/lib/candidate-intelligence";
import { expandCandidateRoleFamilies } from "@/lib/role-expansion";
import {
  EMBEDDING_MODEL_ID,
  generateCandidateEmbedding,
} from "@/lib/ai/semantic-embeddings";
import { deriveLocationPreferenceFromProfile } from "@/lib/location-intelligence";
import { publishRealtimeEvent } from "@/lib/realtime/opportunity-events";
import { UserProfile } from "@/types";
import { resolveAuthenticatedUser } from "@/lib/auth";
import { z } from "zod";

const ProfileSchema = z.object({
  fullName: z.string().max(100),
  email: z.string().email().or(z.literal("")),
  headline: z.string().max(200).optional(),
  university: z.string().max(150),
  degree: z.string().max(100),
  major: z.string().max(100),
  graduationYear: z.number().int().min(2020).max(2035).nullable().optional(),
  graduationMonth: z.string().max(20).nullable().optional(),
  gpa: z.number().min(0).max(10.0).nullable().optional(),
  location: z.string().max(100),
  targetRoles: z.array(z.string()).default([]),
  preferredWorkModes: z.array(z.string()).default([]),
  preferredLocations: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  experiences: z.array(z.any()).default([]),
  projects: z.array(z.any()).default([]),
  portfolioLinks: z.array(z.any()).default([]),
  availability: z.string().max(100).default("Immediate / Summer 2025"),
  stipendPreference: z.string().max(100).default("Flexible"),
  constraints: z.string().max(500).default(""),
  workAuthStatus: z.string().max(200).optional(),
  experienceLevel: z.string().max(100).optional(),
  careerDirections: z.array(z.string()).optional(),
  adjacentRoles: z.array(z.string()).optional(),
  excludedRoleFamilies: z.array(z.string()).optional(),
  hiddenEmployers: z.array(z.string()).optional(),
  factProvenance: z.record(z.string(), z.any()).default({}),
});

function hydrateProfileWithIntelligence(raw: any): UserProfile {
  const baseProfile: UserProfile = {
    ...raw,
    targetRoles: JSON.parse(raw.targetRoles || "[]"),
    preferredWorkModes: JSON.parse(raw.preferredWorkModes || "[]"),
    preferredLocations: JSON.parse(raw.preferredLocations || "[]"),
    skills: JSON.parse(raw.skills || "[]"),
    experiences: JSON.parse(raw.experiences || "[]"),
    projects: JSON.parse(raw.projects || "[]"),
    portfolioLinks: JSON.parse(raw.portfolioLinks || "[]"),
    factProvenance: JSON.parse(raw.factProvenance || "{}"),
    careerDirections: JSON.parse(raw.careerDirections || "[]"),
    adjacentRoles: JSON.parse(raw.adjacentRoles || "[]"),
    excludedRoleFamilies: JSON.parse(raw.excludedRoleFamilies || "[]"),
    hiddenEmployers: JSON.parse(raw.hiddenEmployers || "[]"),
    createdAt:
      raw.createdAt instanceof Date
        ? raw.createdAt.toISOString()
        : String(raw.createdAt),
    updatedAt:
      raw.updatedAt instanceof Date
        ? raw.updatedAt.toISOString()
        : String(raw.updatedAt),
  };

  const capabilityMap = extractCandidateCapabilityMap(baseProfile);
  const expandedRoles = expandCandidateRoleFamilies(baseProfile, capabilityMap);
  const parsedEmbedding: number[] = (() => {
    try {
      const arr = JSON.parse(raw.embeddingJson || "[]");
      return Array.isArray(arr) && arr.length > 0
        ? arr
        : generateCandidateEmbedding(baseProfile);
    } catch {
      return generateCandidateEmbedding(baseProfile);
    }
  })();
  const locationPreference = (() => {
    try {
      const obj = JSON.parse(raw.locationPreferenceJson || "{}");
      return obj && typeof obj === "object" && obj.source ? obj : undefined;
    } catch {
      return undefined;
    }
  })();
  const aiInsights = (() => {
    try {
      const obj = JSON.parse(raw.aiInsightsJson || "{}");
      return obj && typeof obj === "object" && obj.extractedAt ? obj : undefined;
    } catch {
      return undefined;
    }
  })();

  return {
    ...baseProfile,
    capabilityMap,
    expandedRoles,
    expandedRoleFamilies: expandedRoles,
    embedding: parsedEmbedding,
    embeddingModel: raw.embeddingModel || EMBEDDING_MODEL_ID,
    locationPreference,
    aiInsights,
  };
}

export async function GET(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    let profile = await prisma.userProfile.findFirst({
      where: { userId: user.userId },
      orderBy: { updatedAt: "desc" },
    });

    if (!profile) {
      // Look for verified baseline candidate profile
      const baseline =
        (await prisma.userProfile.findFirst({
          where: { userId: { in: ["default", "anonymous"] } },
          orderBy: { updatedAt: "desc" },
        })) ||
        (await prisma.userProfile.findFirst({
          orderBy: { updatedAt: "desc" },
        }));

      if (baseline) {
        if (user.userId && user.userId !== "anonymous" && user.userId !== "default") {
          try {
            profile = await prisma.userProfile.create({
              data: {
                userId: user.userId,
                fullName: baseline.fullName,
                email:
                  user.email && user.email.includes("@")
                    ? user.email
                    : baseline.email,
                headline: baseline.headline,
                university: baseline.university,
                degree: baseline.degree,
                major: baseline.major,
                graduationYear: baseline.graduationYear,
                graduationMonth: baseline.graduationMonth,
                gpa: baseline.gpa,
                location: baseline.location,
                targetRoles: baseline.targetRoles,
                preferredWorkModes: baseline.preferredWorkModes,
                preferredLocations: baseline.preferredLocations,
                skills: baseline.skills,
                experiences: baseline.experiences,
                projects: baseline.projects,
                portfolioLinks: baseline.portfolioLinks,
                availability: baseline.availability,
                stipendPreference: baseline.stipendPreference,
                constraints: baseline.constraints,
                workAuthStatus: baseline.workAuthStatus,
                experienceLevel: baseline.experienceLevel,
                careerDirections: baseline.careerDirections,
                adjacentRoles: baseline.adjacentRoles,
                excludedRoleFamilies: baseline.excludedRoleFamilies,
                hiddenEmployers: baseline.hiddenEmployers,
                factProvenance: baseline.factProvenance,
                embeddingJson: baseline.embeddingJson,
                embeddingModel: baseline.embeddingModel,
                locationPreferenceJson: baseline.locationPreferenceJson,
                aiInsightsJson: baseline.aiInsightsJson,
              },
            });
          } catch {
            profile = baseline;
          }
        } else {
          profile = baseline;
        }
      }
    }

    if (!profile) {
      return NextResponse.json({ profile: null });
    }

    return NextResponse.json({
      profile: hydrateProfileWithIntelligence(profile),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to fetch profile",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const body = await req.json();
    const validated = ProfileSchema.parse(body);

    const existing = await prisma.userProfile.findFirst({
      where: { userId: user.userId },
      orderBy: { updatedAt: "desc" },
    });

    const tempProfile: UserProfile = {
      id: existing?.id || "temp",
      fullName: validated.fullName,
      email: validated.email,
      headline: validated.headline || "",
      university: validated.university,
      degree: validated.degree,
      major: validated.major,
      graduationYear: validated.graduationYear || null,
      graduationMonth: validated.graduationMonth || null,
      gpa: validated.gpa !== undefined ? validated.gpa : null,
      location: validated.location,
      targetRoles: validated.targetRoles,
      preferredWorkModes: validated.preferredWorkModes as any,
      preferredLocations: validated.preferredLocations,
      skills: validated.skills,
      experiences: validated.experiences,
      projects: validated.projects,
      portfolioLinks: validated.portfolioLinks,
      availability: validated.availability,
      stipendPreference: validated.stipendPreference,
      constraints: validated.constraints,
      workAuthStatus: validated.workAuthStatus ?? existing?.workAuthStatus ?? "",
      experienceLevel:
        validated.experienceLevel ??
        existing?.experienceLevel ??
        "Internship / Early-Career",
      careerDirections:
        validated.careerDirections ??
        (existing ? JSON.parse(existing.careerDirections || "[]") : []),
      adjacentRoles:
        validated.adjacentRoles ??
        (existing ? JSON.parse(existing.adjacentRoles || "[]") : []),
      excludedRoleFamilies:
        validated.excludedRoleFamilies ??
        (existing ? JSON.parse(existing.excludedRoleFamilies || "[]") : []),
      hiddenEmployers:
        validated.hiddenEmployers ??
        (existing ? JSON.parse(existing.hiddenEmployers || "[]") : []),
      factProvenance: {
        ...(existing?.factProvenance ? JSON.parse(existing.factProvenance) : {}),
        ...validated.factProvenance,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const capabilityMap = extractCandidateCapabilityMap(tempProfile);
    const expandedRoles = expandCandidateRoleFamilies(tempProfile, capabilityMap);
    const candidateEmbedding = generateCandidateEmbedding(tempProfile);

    const derivedLocPref = deriveLocationPreferenceFromProfile(
      validated.location,
      validated.preferredWorkModes as any,
      (() => {
        try {
          const prev = JSON.parse(existing?.locationPreferenceJson || "{}");
          return typeof prev.nearbyRadiusKm === "number" ? prev.nearbyRadiusKm : 80;
        } catch {
          return 80;
        }
      })()
    );
    const existingLocPref = (() => {
      try {
        return JSON.parse(existing?.locationPreferenceJson || "{}");
      } catch {
        return {};
      }
    })();
    const shouldRefreshLocPref =
      !existingLocPref?.source ||
      existingLocPref.source === "NONE" ||
      existingLocPref.source === "PROFILE" ||
      (existing?.location || "").trim().toLowerCase() !==
        validated.location.trim().toLowerCase();
    const nextLocPref = shouldRefreshLocPref ? derivedLocPref : existingLocPref;

    const mergedPreferredLocations =
      validated.preferredLocations && validated.preferredLocations.length > 0
        ? validated.preferredLocations
        : nextLocPref?.city
          ? Array.from(new Set([nextLocPref.city, "Remote"]))
          : validated.preferredLocations;

    const dataToSave = {
      fullName: validated.fullName,
      email: validated.email,
      headline: validated.headline || "",
      university: validated.university,
      degree: validated.degree,
      major: validated.major,
      graduationYear: validated.graduationYear || null,
      graduationMonth: validated.graduationMonth || null,
      gpa: validated.gpa !== undefined ? validated.gpa : null,
      location: validated.location,
      targetRoles: JSON.stringify(validated.targetRoles),
      preferredWorkModes: JSON.stringify(validated.preferredWorkModes),
      preferredLocations: JSON.stringify(mergedPreferredLocations),
      locationPreferenceJson: JSON.stringify(nextLocPref),
      skills: JSON.stringify(validated.skills),
      experiences: JSON.stringify(validated.experiences),
      projects: JSON.stringify(validated.projects),
      portfolioLinks: JSON.stringify(validated.portfolioLinks),
      availability: validated.availability,
      stipendPreference: validated.stipendPreference,
      constraints: validated.constraints,
      workAuthStatus: tempProfile.workAuthStatus || "",
      experienceLevel: tempProfile.experienceLevel || "Internship / Early-Career",
      careerDirections: JSON.stringify(tempProfile.careerDirections || []),
      adjacentRoles: JSON.stringify(tempProfile.adjacentRoles || []),
      excludedRoleFamilies: JSON.stringify(tempProfile.excludedRoleFamilies || []),
      hiddenEmployers: JSON.stringify(tempProfile.hiddenEmployers || []),
      capabilitiesJson: JSON.stringify(capabilityMap),
      roleFamiliesJson: JSON.stringify(expandedRoles),
      embeddingJson: JSON.stringify(candidateEmbedding),
      embeddingModel: EMBEDDING_MODEL_ID,
      factProvenance: JSON.stringify(tempProfile.factProvenance),
    };

    let saved;
    if (existing) {
      saved = await prisma.userProfile.update({
        where: { id: existing.id },
        data: dataToSave,
      });
    } else {
      saved = await prisma.userProfile.create({
        data: {
          ...dataToSave,
          userId: user.userId,
        },
      });
    }

    const hydrated = hydrateProfileWithIntelligence(saved);
    publishRealtimeEvent(
      "PROFILE_UPDATED",
      `Profile updated for ${hydrated.fullName} (${hydrated.location}) — live feed re-scored.`,
      {
        profileId: saved.id,
        location: hydrated.location,
        city: hydrated.locationPreference?.city || "",
      },
      user.userId
    );

    return NextResponse.json({
      profile: hydrated,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to save profile",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  try {
    await prisma.userProfile.deleteMany({});
    return NextResponse.json({
      message: "Profile and personal data successfully deleted.",
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to delete profile",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}

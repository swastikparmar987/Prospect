import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { UserProfile } from "@/types";
import { extractCandidateCapabilityMap } from "@/lib/candidate-intelligence";
import { expandCandidateRoleFamilies } from "@/lib/role-expansion";
import { resolveAuthenticatedUser } from "@/lib/auth";
import {
  generateCareerOutlook,
  generatePersonalizedCareerBrief,
} from "@/lib/career-outlook";

function hydrateProfile(raw: any): UserProfile {
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

  return {
    ...baseProfile,
    capabilityMap,
    expandedRoles,
  };
}

export async function GET(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const raw = await prisma.userProfile.findFirst({
      where: { userId: user.userId },
      orderBy: { updatedAt: "desc" },
    });
    if (!raw) {
      return NextResponse.json({
        success: false,
        error: "No student profile found. Please upload a resume first.",
      }, { status: 404 });
    }

    const profile = hydrateProfile(raw);
    const outlook = generateCareerOutlook(profile);

    const url = new URL(req.url);
    const includeBrief = url.searchParams.get("includeBrief") === "true";

    let brief = null;
    if (includeBrief) {
      // Query recent opportunities & evaluations
      const rawOpps = await prisma.opportunity.findMany({
        where: { isExpired: false },
        include: {
          evaluations: { orderBy: { evaluatedAt: "desc" }, take: 1 },
          preparationPlans: { take: 1 },
        },
        orderBy: { discoveredAt: "desc" },
        take: 30,
      });

      const evaluatedOpps = rawOpps
        .filter((o) => o.evaluations.length > 0)
        .map((o) => {
          const evalRaw = o.evaluations[0];
          return {
            opportunity: {
              ...o,
              publishedAt: o.publishedAt ? o.publishedAt.toISOString() : null,
              deadline: o.deadline ? o.deadline.toISOString() : null,
              discoveredAt: o.discoveredAt.toISOString(),
              lastCheckedAt: o.lastCheckedAt.toISOString(),
              fetchedAt: o.fetchedAt ? o.fetchedAt.toISOString() : undefined,
              eligibilityRequirements: JSON.parse(o.eligibilityRequirements || "[]"),
              requiredSkills: JSON.parse(o.requiredSkills || "[]"),
              preferredSkills: JSON.parse(o.preferredSkills || "[]"),
              sourceEvidence: JSON.parse(o.sourceEvidence || "[]"),
              multiSourceProvenance: JSON.parse(o.multiSourceProvenance || "[]"),
            } as any,
            evaluation: {
              ...evalRaw,
              scoreBreakdown: JSON.parse(evalRaw.scoreBreakdown || "{}"),
              hardBlockers: JSON.parse(evalRaw.hardBlockers || "[]"),
              uncertainties: JSON.parse(evalRaw.uncertainties || "[]"),
              eligibilityChecks: JSON.parse(evalRaw.eligibilityChecks || "[]"),
              evaluatedAt: evalRaw.evaluatedAt.toISOString(),
            } as any,
            hasPrepPlan: o.preparationPlans.length > 0,
          };
        });

      brief = generatePersonalizedCareerBrief(profile, evaluatedOpps, outlook);
    }

    return NextResponse.json({
      success: true,
      outlook,
      brief,
    });
  } catch (err: any) {
    console.error("GET /api/career-outlook error:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Failed to generate Career Outlook",
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { selectedDirections, customDirections, excludedDirections } = body;

    const user = resolveAuthenticatedUser(req);
    const raw = await prisma.userProfile.findFirst({
      where: { userId: user.userId },
      orderBy: { updatedAt: "desc" },
    });
    if (!raw) {
      return NextResponse.json({
        success: false,
        error: "No student profile found.",
      }, { status: 404 });
    }

    const currentTargetRoles = JSON.parse(raw.targetRoles || "[]") as string[];
    const currentExcluded = JSON.parse(raw.excludedRoleFamilies || "[]") as string[];

    // Merge selected and custom directions
    const newTargetRoles = Array.from(
      new Set([
        ...(selectedDirections || []),
        ...(customDirections || []),
        ...currentTargetRoles,
      ])
    ).filter(Boolean);

    // Merge excluded directions if any
    const newExcluded = Array.from(
      new Set([
        ...currentExcluded,
        ...(excludedDirections || []),
      ])
    ).filter(Boolean);

    // Filter out excluded from target roles
    const filteredTargetRoles = newTargetRoles.filter(
      (role) => !newExcluded.some((ex) => ex.toLowerCase() === role.toLowerCase())
    );

    const updated = await prisma.userProfile.update({
      where: { id: raw.id },
      data: {
        targetRoles: JSON.stringify(filteredTargetRoles),
        careerDirections: JSON.stringify(selectedDirections || []),
        excludedRoleFamilies: JSON.stringify(newExcluded),
      },
    });

    const updatedProfile = hydrateProfile(updated);
    const newOutlook = generateCareerOutlook(updatedProfile);

    // Record agent step if active agent run exists
    try {
      const latestRun = await prisma.agentRun.findFirst({
        orderBy: { startedAt: "desc" },
      });
      if (latestRun) {
        await prisma.agentStep.create({
          data: {
            runId: latestRun.id,
            stepNumber: 99,
            toolName: "toolConfirmCareerOutlook",
            status: "SUCCESS",
            inputSummary: `Confirmed ${selectedDirections?.length || 0} career directions: ${(selectedDirections || []).join(", ")}`,
            outputSummary: `Updated target roles to ${filteredTargetRoles.join(", ")}. Excluded: ${newExcluded.join(", ") || "None"}.`,
            sourceReferences: JSON.stringify(selectedDirections || []),
          },
        });
      }
    } catch {
      // Non-fatal if agent step log fails
    }

    return NextResponse.json({
      success: true,
      message: "Career directions confirmed.",
      outlook: newOutlook,
      targetRoles: filteredTargetRoles,
    });
  } catch (err: any) {
    console.error("POST /api/career-outlook error:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Failed to update career directions",
    }, { status: 500 });
  }
}

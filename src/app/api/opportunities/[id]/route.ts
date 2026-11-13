import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { evaluateOpportunity } from "@/lib/scoring-engine";
import { Opportunity, UserProfile } from "@/types";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const oppRaw = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        evaluations: {
          orderBy: { evaluatedAt: "desc" },
          take: 1,
        },
        preparationPlans: {
          take: 1,
        },
      },
    });

    if (!oppRaw) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    const opportunity: Opportunity = {
      id: oppRaw.id,
      title: oppRaw.title,
      organization: oppRaw.organization,
      category: oppRaw.category as any,
      description: oppRaw.description,
      location: oppRaw.location,
      workMode: oppRaw.workMode as any,
      compensation: oppRaw.compensation,
      eligibilityRequirements: JSON.parse(oppRaw.eligibilityRequirements || "[]"),
      requiredSkills: JSON.parse(oppRaw.requiredSkills || "[]"),
      preferredSkills: JSON.parse(oppRaw.preferredSkills || "[]"),
      publishedAt: oppRaw.publishedAt ? oppRaw.publishedAt.toISOString() : null,
      deadline: oppRaw.deadline ? oppRaw.deadline.toISOString() : null,
      deadlineRaw: oppRaw.deadlineRaw,
      applyUrl: oppRaw.applyUrl,
      sourceName: oppRaw.sourceName,
      sourceUrl: oppRaw.sourceUrl,
      sourceConfidence: oppRaw.sourceConfidence,
      verificationStatus: oppRaw.verificationStatus as any,
      sourceEvidence: JSON.parse(oppRaw.sourceEvidence || "[]"),
      discoveredAt: oppRaw.discoveredAt.toISOString(),
      lastCheckedAt: oppRaw.lastCheckedAt.toISOString(),
      isDemo: oppRaw.isDemo,
    };

    // Load active profile
    const dbProfile = await prisma.userProfile.findFirst();
    let profile: UserProfile | null = null;
    if (dbProfile) {
      profile = {
        ...dbProfile,
        targetRoles: JSON.parse(dbProfile.targetRoles || "[]"),
        preferredWorkModes: JSON.parse(dbProfile.preferredWorkModes || "[]"),
        preferredLocations: JSON.parse(dbProfile.preferredLocations || "[]"),
        skills: JSON.parse(dbProfile.skills || "[]"),
        experiences: JSON.parse(dbProfile.experiences || "[]"),
        projects: JSON.parse(dbProfile.projects || "[]"),
        portfolioLinks: JSON.parse(dbProfile.portfolioLinks || "[]"),
        factProvenance: JSON.parse(dbProfile.factProvenance || "{}"),
        createdAt: dbProfile.createdAt.toISOString(),
        updatedAt: dbProfile.updatedAt.toISOString(),
      };
    }

    const evaluation = evaluateOpportunity(opportunity, profile);

    const prepPlanRaw = oppRaw.preparationPlans[0];
    const preparationPlan = prepPlanRaw
      ? {
          id: prepPlanRaw.id,
          opportunityId: prepPlanRaw.opportunityId,
          title: prepPlanRaw.title,
          summary: prepPlanRaw.summary,
          items: JSON.parse(prepPlanRaw.items || "[]"),
          createdAt: prepPlanRaw.createdAt.toISOString(),
          updatedAt: prepPlanRaw.updatedAt.toISOString(),
        }
      : null;

    return NextResponse.json({
      opportunity,
      evaluation,
      preparationPlan,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load opportunity", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

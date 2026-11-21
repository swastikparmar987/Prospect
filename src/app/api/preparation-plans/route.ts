import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/auth";
import { isDemoOrFixtureRecord } from "@/lib/search-config";
import { evaluateOpportunity } from "@/lib/scoring-engine";
import { generatePreparationPlan } from "@/lib/gap-action-engine";
import { Opportunity, UserProfile, PreparationPlanItem } from "@/types";

export async function GET(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const requireProfile = searchParams.get("requireProfile") === "1";

    if (requireProfile) {
      if (!user.isAuthenticated || user.userId === "anonymous") {
        return NextResponse.json({ plans: [] });
      }
      const profile = await prisma.userProfile.findFirst({
        where: { userId: user.userId },
        select: { id: true, skills: true, fullName: true },
      });
      const parsedSkills = (() => {
        try {
          const arr = JSON.parse(profile?.skills || "[]");
          return Array.isArray(arr) ? arr : [];
        } catch {
          return [];
        }
      })();
      if (!profile || (!profile.fullName && parsedSkills.length === 0)) {
        return NextResponse.json({ plans: [] });
      }
    }

    const rawPlans = await prisma.preparationPlan.findMany({
      where: {
        userId: user.userId,
        opportunity: { isDemo: false },
      },
      include: {
        opportunity: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const plans = rawPlans
      .filter((p) => !isDemoOrFixtureRecord(p.opportunity))
      .map((p) => {
      const opp = p.opportunity;
      const formattedOpp: Opportunity = {
        id: opp.id,
        title: opp.title,
        organization: opp.organization,
        category: opp.category as any,
        description: opp.description,
        location: opp.location,
        workMode: opp.workMode as any,
        compensation: opp.compensation,
        eligibilityRequirements: JSON.parse(opp.eligibilityRequirements || "[]"),
        requiredSkills: JSON.parse(opp.requiredSkills || "[]"),
        preferredSkills: JSON.parse(opp.preferredSkills || "[]"),
        publishedAt: opp.publishedAt ? opp.publishedAt.toISOString() : null,
        deadline: opp.deadline ? opp.deadline.toISOString() : null,
        deadlineRaw: opp.deadlineRaw,
        applyUrl: opp.applyUrl,
        sourceName: opp.sourceName,
        sourceUrl: opp.sourceUrl,
        sourceConfidence: opp.sourceConfidence,
        verificationStatus: opp.verificationStatus as any,
        sourceEvidence: JSON.parse(opp.sourceEvidence || "[]"),
        discoveredAt: opp.discoveredAt.toISOString(),
        lastCheckedAt: opp.lastCheckedAt.toISOString(),
        isDemo: opp.isDemo,
      };

      return {
        id: p.id,
        opportunityId: p.opportunityId,
        opportunity: formattedOpp,
        title: p.title,
        summary: p.summary,
        items: JSON.parse(p.items || "[]") as PreparationPlanItem[],
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    });

    return NextResponse.json({ plans });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load preparation plans", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const body = await req.json();
    const { opportunityId } = body;
    if (!opportunityId) {
      return NextResponse.json({ error: "opportunityId is required" }, { status: 400 });
    }

    if (String(opportunityId).startsWith("demo-") || String(opportunityId).startsWith("mock-")) {
      return NextResponse.json(
        { error: "Demo fixture opportunities cannot be saved to production preparation plans." },
        { status: 422 }
      );
    }

    const oppRaw = await prisma.opportunity.findUnique({
      where: { id: opportunityId },
      include: { preparationPlans: true },
    });

    if (!oppRaw) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 });
    }

    if (isDemoOrFixtureRecord(oppRaw)) {
      return NextResponse.json(
        { error: "Demo fixture opportunities cannot be saved to production preparation plans." },
        { status: 422 }
      );
    }

    const formattedOpp: Opportunity = {
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

    // Load active student profile
    const dbProfile = await prisma.userProfile.findFirst({
      where: { userId: user.userId },
      orderBy: { updatedAt: "desc" },
    });
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

    // Generate action plan
    const generated = generatePreparationPlan(formattedOpp, profile);

    // If an existing plan was already created, delete it or update it cleanly
    await prisma.preparationPlan.deleteMany({
      where: { opportunityId: formattedOpp.id, userId: user.userId },
    });

    const savedPlan = await prisma.preparationPlan.create({
      data: {
        userId: user.userId,
        opportunityId: formattedOpp.id,
        title: generated.title,
        summary: generated.summary,
        items: JSON.stringify(generated.items),
      },
    });

    return NextResponse.json({
      success: true,
      preparationPlan: {
        id: savedPlan.id,
        opportunityId: savedPlan.opportunityId,
        opportunity: formattedOpp,
        title: savedPlan.title,
        summary: savedPlan.summary,
        items: generated.items,
        createdAt: savedPlan.createdAt.toISOString(),
        updatedAt: savedPlan.updatedAt.toISOString(),
      },
      message: "Preparation plan generated successfully.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to generate preparation plan", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const body = await req.json();
    const { planId, itemId, isCompleted } = body;

    const plan = await prisma.preparationPlan.findFirst({
      where: { id: planId, userId: user.userId },
      include: { opportunity: true },
    });

    if (!plan) {
      return NextResponse.json({ error: "Plan not found or unauthorized" }, { status: 404 });
    }

    const items: PreparationPlanItem[] = JSON.parse(plan.items || "[]");
    const targetItem = items.find((i) => i.id === itemId);

    if (targetItem) {
      targetItem.isCompleted = isCompleted;
    }

    // Save updated items
    await prisma.preparationPlan.update({
      where: { id: planId },
      data: {
        items: JSON.stringify(items),
        updatedAt: new Date(),
      },
    });

    // Re-evaluate opportunity with the new preparation progress!
    const dbProfile = await prisma.userProfile.findFirst({
      where: { userId: user.userId },
      orderBy: { updatedAt: "desc" },
    });
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

    const opp = plan.opportunity;
    const formattedOpp: Opportunity = {
      id: opp.id,
      title: opp.title,
      organization: opp.organization,
      category: opp.category as any,
      description: opp.description,
      location: opp.location,
      workMode: opp.workMode as any,
      compensation: opp.compensation,
      eligibilityRequirements: JSON.parse(opp.eligibilityRequirements || "[]"),
      requiredSkills: JSON.parse(opp.requiredSkills || "[]"),
      preferredSkills: JSON.parse(opp.preferredSkills || "[]"),
      publishedAt: opp.publishedAt ? opp.publishedAt.toISOString() : null,
      deadline: opp.deadline ? opp.deadline.toISOString() : null,
      deadlineRaw: opp.deadlineRaw,
      applyUrl: opp.applyUrl,
      sourceName: opp.sourceName,
      sourceUrl: opp.sourceUrl,
      sourceConfidence: opp.sourceConfidence,
      verificationStatus: opp.verificationStatus as any,
      sourceEvidence: JSON.parse(opp.sourceEvidence || "[]"),
      discoveredAt: opp.discoveredAt.toISOString(),
      lastCheckedAt: opp.lastCheckedAt.toISOString(),
      isDemo: opp.isDemo,
    };

    // If item was completed, add skill credit to profile skills in calculation
    let modifiedProfile = profile;
    const completedItems = items.filter((i) => i.isCompleted);
    if (modifiedProfile && completedItems.length > 0) {
      const addedSkills = completedItems.map((i) => {
        const match = i.gap.match(/Missing verified skill:\s*(.+)/);
        return match ? match[1] : "";
      }).filter(Boolean);

      modifiedProfile = {
        ...modifiedProfile,
        skills: [...new Set([...modifiedProfile.skills, ...addedSkills])],
      };
    }

    const newEvaluation = evaluateOpportunity(formattedOpp, modifiedProfile);

    // Update stored evaluation in DB
    await prisma.evaluation.upsert({
      where: { id: `eval-${opp.id}` },
      create: {
        id: `eval-${opp.id}`,
        opportunityId: opp.id,
        recommendation: newEvaluation.recommendation,
        overallScore: newEvaluation.overallScore,
        scoreBreakdown: JSON.stringify(newEvaluation.scoreBreakdown),
        hardBlockers: JSON.stringify(newEvaluation.hardBlockers),
        rationale: newEvaluation.rationale,
        nextAction: newEvaluation.nextAction,
        uncertainties: JSON.stringify(newEvaluation.uncertainties),
        eligibilityChecks: JSON.stringify(newEvaluation.eligibilityChecks),
      },
      update: {
        recommendation: newEvaluation.recommendation,
        overallScore: newEvaluation.overallScore,
        scoreBreakdown: JSON.stringify(newEvaluation.scoreBreakdown),
        hardBlockers: JSON.stringify(newEvaluation.hardBlockers),
        rationale: newEvaluation.rationale,
        nextAction: newEvaluation.nextAction,
        uncertainties: JSON.stringify(newEvaluation.uncertainties),
        eligibilityChecks: JSON.stringify(newEvaluation.eligibilityChecks),
        evaluatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      items,
      newEvaluation,
      message: `Progress updated! Re-evaluated fit score: ${newEvaluation.overallScore}/100. Recommendation: ${newEvaluation.recommendation}.`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update plan progress", details: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}

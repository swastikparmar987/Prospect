import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/auth";
import { isDemoOrFixtureRecord } from "@/lib/search-config";
import { z } from "zod";
import { ApplicationRecord, Opportunity } from "@/types";

const SaveApplicationSchema = z.object({
  opportunityId: z.string(),
  stage: z.enum([
    "SAVED",
    "PREPARING",
    "READY_TO_APPLY",
    "APPLIED",
    "INTERVIEW",
    "OFFER",
    "REJECTED",
    "WITHDRAWN",
    "ARCHIVED",
  ]).default("SAVED"),
  plannedNextAction: z.string().optional(),
  targetDeadline: z.string().optional().nullable(),
  notes: z.string().optional(),
});

const UpdateApplicationSchema = z.object({
  id: z.string(),
  stage: z.enum([
    "SAVED",
    "PREPARING",
    "READY_TO_APPLY",
    "APPLIED",
    "INTERVIEW",
    "OFFER",
    "REJECTED",
    "WITHDRAWN",
    "ARCHIVED",
  ]).optional(),
  plannedNextAction: z.string().optional(),
  targetDeadline: z.string().optional().nullable(),
  notes: z.string().optional(),
  materials: z.record(z.string(), z.any()).optional(),
  outcome: z.enum(["OFFER", "REJECTED", "GHOSTED", "DECLINED"]).optional().nullable(),
  outcomeReflection: z.string().optional().nullable(),
  reminders: z.array(z.any()).optional(),
  eventNote: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode");

    const where: any = {
      userId: user.userId,
      opportunity: { isDemo: false },
    };
    if (mode === "DEMO") {
      return NextResponse.json({
        applications: [],
        upcomingDeadlines: [],
      });
    }

    const rawApps = await prisma.application.findMany({
      where,
      include: {
        opportunity: true,
        events: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const applications: ApplicationRecord[] = rawApps
      .filter((a) => !isDemoOrFixtureRecord(a.opportunity))
      .map((a) => {
      const opp = a.opportunity;
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
        id: a.id,
        opportunityId: a.opportunityId,
        opportunity: formattedOpp,
        stage: a.stage as any,
        targetDeadline: a.targetDeadline ? a.targetDeadline.toISOString() : null,
        plannedNextAction: a.plannedNextAction,
        notes: a.notes,
        materials: JSON.parse(a.materials || "{}"),
        outcome: a.outcome as any,
        outcomeReflection: a.outcomeReflection,
        outcomeLoggedAt: a.outcomeLoggedAt ? a.outcomeLoggedAt.toISOString() : null,
        reminders: JSON.parse(a.reminders || "[]"),
        createdAt: a.createdAt.toISOString(),
        updatedAt: a.updatedAt.toISOString(),
        events: a.events.map((e) => ({
          id: e.id,
          fromStage: e.fromStage,
          toStage: e.toStage,
          note: e.note,
          createdAt: e.createdAt.toISOString(),
        })),
      };
    });

    // Compute upcoming deadlines summary
    const now = new Date();
    const upcomingDeadlines = applications
      .filter((a) => a.targetDeadline && new Date(a.targetDeadline) > now && a.stage !== "OFFER" && a.stage !== "REJECTED" && a.stage !== "ARCHIVED")
      .map((a) => ({
        id: a.id,
        title: a.opportunity?.title,
        organization: a.opportunity?.organization,
        deadline: a.targetDeadline,
        daysRemaining: Math.ceil((new Date(a.targetDeadline!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
        stage: a.stage,
      }))
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    return NextResponse.json({
      applications,
      upcomingDeadlines,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to load applications", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const body = await req.json();
    const validated = SaveApplicationSchema.parse(body);

    // PERMANENT NO-MOCK-DATA POLICY: Never allow demo data to enter application tracking as genuine opportunities.
    if (validated.opportunityId.startsWith("demo-") || validated.opportunityId.startsWith("mock-")) {
      return NextResponse.json(
        {
          error:
            "Demo fixture opportunities cannot be saved to production application tracking.",
        },
        { status: 422 }
      );
    }

    // Prevent accidental duplicate tracker records for this user
    const existing = await prisma.application.findFirst({
      where: { opportunityId: validated.opportunityId, userId: user.userId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This opportunity is already saved in your Tracker.", existingId: existing.id },
        { status: 409 }
      );
    }

    const opp = await prisma.opportunity.findUnique({
      where: { id: validated.opportunityId },
    });

    if (!opp) {
      return NextResponse.json(
        { error: "Verified opportunity not found in database." },
        { status: 404 }
      );
    }

    if (isDemoOrFixtureRecord(opp)) {
      return NextResponse.json(
        {
          error:
            "Demo fixture opportunities cannot be saved to production application tracking.",
        },
        { status: 422 }
      );
    }

    const targetDeadline = validated.targetDeadline ? new Date(validated.targetDeadline) : opp?.deadline || null;

    const created = await prisma.application.create({
      data: {
        userId: user.userId,
        opportunityId: validated.opportunityId,
        stage: validated.stage,
        targetDeadline,
        plannedNextAction: validated.plannedNextAction || "Review eligibility and prepare customized application materials.",
        notes: validated.notes || "",
        materials: JSON.stringify({}),
        reminders: JSON.stringify([]),
        events: {
          create: [
            {
              fromStage: null,
              toStage: validated.stage,
              note: "Opportunity added to tracker.",
            },
          ],
        },
      },
      include: {
        opportunity: true,
        events: true,
      },
    });

    return NextResponse.json({
      success: true,
      application: created,
      message: "Opportunity successfully added to Tracker.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to save application to tracker", details: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const body = await req.json();
    const validated = UpdateApplicationSchema.parse(body);

    const existing = await prisma.application.findFirst({
      where: { id: validated.id, userId: user.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Application not found or unauthorized" }, { status: 404 });
    }

    const dataToUpdate: any = {};
    let shouldLogEvent = false;
    const oldStage = existing.stage;

    if (validated.stage && validated.stage !== existing.stage) {
      dataToUpdate.stage = validated.stage;
      shouldLogEvent = true;
    }
    if (validated.plannedNextAction !== undefined) {
      dataToUpdate.plannedNextAction = validated.plannedNextAction;
    }
    if (validated.targetDeadline !== undefined) {
      dataToUpdate.targetDeadline = validated.targetDeadline ? new Date(validated.targetDeadline) : null;
    }
    if (validated.notes !== undefined) {
      dataToUpdate.notes = validated.notes;
    }
    if (validated.materials !== undefined) {
      dataToUpdate.materials = JSON.stringify(validated.materials);
    }
    if (validated.reminders !== undefined) {
      dataToUpdate.reminders = JSON.stringify(validated.reminders);
    }
    if (validated.outcome !== undefined) {
      dataToUpdate.outcome = validated.outcome;
      dataToUpdate.outcomeLoggedAt = new Date();
    }
    if (validated.outcomeReflection !== undefined) {
      dataToUpdate.outcomeReflection = validated.outcomeReflection;
    }

    const updated = await prisma.application.update({
      where: { id: validated.id },
      data: dataToUpdate,
      include: { opportunity: true, events: true },
    });

    if (shouldLogEvent) {
      await prisma.applicationEvent.create({
        data: {
          applicationId: validated.id,
          fromStage: oldStage,
          toStage: validated.stage!,
          note: validated.eventNote || `Stage progressed from ${oldStage} to ${validated.stage}.`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      application: updated,
      message: "Application tracker record updated.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update application", details: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Application ID required" }, { status: 400 });
    }

    const existing = await prisma.application.findFirst({
      where: { id, userId: user.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Application not found or unauthorized" }, { status: 404 });
    }

    await prisma.applicationEvent.deleteMany({ where: { applicationId: id } });
    await prisma.application.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Application removed from tracker." });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to delete application", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

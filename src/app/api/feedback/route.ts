import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/auth";
import { loadActiveUserProfile } from "@/lib/agent/orchestrator";
import {
  computeFeedbackPersonalization,
  recordUserFeedbackSignal,
} from "@/lib/feedback-engine";
import { FeedbackSignalType, UserFeedbackRecord } from "@/types";
import { z } from "zod";

const FeedbackRequestSchema = z.object({
  opportunityId: z.string().optional(),
  organization: z.string().optional(),
  roleFamily: z.string().optional(),
  signalType: z.enum([
    "SAVE",
    "MARK_RELEVANT",
    "MARK_NOT_RELEVANT",
    "HIDE_EMPLOYER",
    "DISMISS_ROLE_FAMILY",
    "ADJUST_PREFERENCES",
    "MARK_APPLIED",
    "RECORD_OUTCOME",
    "RESET_PERSONALIZATION",
  ]),
  outcome: z
    .enum(["INTERVIEW", "OFFER", "REJECTED", "GHOSTED"])
    .nullable()
    .optional(),
  notes: z.string().max(1000).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const profile = await prisma.userProfile.findFirst({
      where: { userId: user.userId },
      orderBy: { updatedAt: "desc" },
    });
    const rows = await prisma.userFeedback.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const records: UserFeedbackRecord[] = rows.map((r) => ({
      id: r.id,
      profileId: r.profileId,
      opportunityId: r.opportunityId,
      organization: r.organization,
      roleFamily: r.roleFamily,
      signalType: r.signalType as FeedbackSignalType,
      outcome: (r.outcome as UserFeedbackRecord["outcome"]) ?? null,
      notes: r.notes,
      metadata: JSON.parse(r.metadataJson || "{}"),
      createdAt: r.createdAt.toISOString(),
    }));

    const personalization = computeFeedbackPersonalization(records, profile as any);

    return NextResponse.json({
      records,
      personalization,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Failed to fetch feedback signals",
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
    const parsed = FeedbackRequestSchema.parse(body);

    const result = await recordUserFeedbackSignal({
      userId: user.userId,
      opportunityId: parsed.opportunityId,
      organization: parsed.organization,
      roleFamily: parsed.roleFamily,
      signalType: parsed.signalType,
      outcome: parsed.outcome ?? null,
      notes: parsed.notes,
      metadata: parsed.metadata,
    });

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("NO_MOCK_DATA_POLICY_VIOLATION") ? 422 : 400;
    return NextResponse.json(
      {
        error: "Failed to record feedback signal",
        details: message,
      },
      { status }
    );
  }
}


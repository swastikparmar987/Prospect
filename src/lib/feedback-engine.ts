import { prisma } from "./db";
import { isDemoOrFixtureRecord } from "./search-config";
import {
  FeedbackSignalType,
  UserFeedbackRecord,
  UserProfile,
} from "../types";

export interface FeedbackPersonalizationSummary {
  boostedRoleFamilies: string[];
  penalizedRoleFamilies: string[];
  excludedRoleFamilies: string[];
  hiddenEmployers: string[];
  outcomeInsights: string[];
  totalSignalsRecorded: number;
}

/**
 * Computes search personalization weights from explicit user feedback signals.
 *
 * CRITICAL ANTI-HALLUCINATION RULE (Phase 8):
 * Never infer rejection reasons or penalize role families from a REJECTED/GHOSTED
 * outcome status alone! Only explicit user signals (MARK_NOT_RELEVANT, DISMISS_ROLE_FAMILY,
 * HIDE_EMPLOYER) or explicit user reflection notes are used.
 */
export function computeFeedbackPersonalization(
  feedbackRecords: UserFeedbackRecord[],
  profile?: UserProfile | null
): FeedbackPersonalizationSummary {
  const familyScores = new Map<string, number>();
  const initExcluded = Array.isArray(profile?.excludedRoleFamilies)
    ? profile.excludedRoleFamilies
    : typeof profile?.excludedRoleFamilies === "string"
      ? (JSON.parse(profile.excludedRoleFamilies || "[]") as string[])
      : [];
  const initHidden = Array.isArray(profile?.hiddenEmployers)
    ? profile.hiddenEmployers
    : typeof profile?.hiddenEmployers === "string"
      ? (JSON.parse(profile.hiddenEmployers || "[]") as string[])
      : [];
  const excludedFamilies = new Set<string>(initExcluded);
  const hiddenEmployers = new Set<string>(initHidden);
  const outcomeInsights: string[] = [];

  // Process signals in chronological order so RESET_PERSONALIZATION clears prior weights
  const sorted = [...feedbackRecords].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  for (const rec of sorted) {
    if (rec.signalType === "RESET_PERSONALIZATION") {
      familyScores.clear();
      excludedFamilies.clear();
      hiddenEmployers.clear();
      outcomeInsights.length = 0;
      continue;
    }

    const family = rec.roleFamily?.trim();
    const org = rec.organization?.trim();

    switch (rec.signalType) {
      case "SAVE":
      case "MARK_RELEVANT":
        if (family) {
          familyScores.set(family, (familyScores.get(family) || 0) + 2);
        }
        break;
      case "MARK_APPLIED":
        if (family) {
          familyScores.set(family, (familyScores.get(family) || 0) + 3);
        }
        break;
      case "MARK_NOT_RELEVANT":
        if (family) {
          familyScores.set(family, (familyScores.get(family) || 0) - 2);
        }
        break;
      case "DISMISS_ROLE_FAMILY":
        if (family) {
          excludedFamilies.add(family);
          familyScores.set(family, -10);
        }
        break;
      case "HIDE_EMPLOYER":
        if (org) {
          hiddenEmployers.add(org);
        }
        break;
      case "RECORD_OUTCOME":
        if (rec.outcome === "INTERVIEW" || rec.outcome === "OFFER") {
          if (family) {
            familyScores.set(family, (familyScores.get(family) || 0) + 4);
          }
          outcomeInsights.push(
            `Positive outcome (${rec.outcome}) recorded${org ? ` at ${org}` : ""}${
              family ? ` for ${family}` : ""
            }.`
          );
        } else if (rec.outcome === "REJECTED" || rec.outcome === "GHOSTED") {
          // Do NOT infer rejection reasons from rejection status alone!
          if (rec.notes && rec.notes.trim().length > 0) {
            outcomeInsights.push(
              `User-provided reflection on ${rec.outcome}${org ? ` (${org})` : ""}: "${rec.notes.trim()}"`
            );
          } else {
            outcomeInsights.push(
              `Recorded ${rec.outcome}${org ? ` at ${org}` : ""}; no rejection cause inferred without explicit feedback.`
            );
          }
        }
        break;
      default:
        break;
    }
  }

  const boostedRoleFamilies: string[] = [];
  const penalizedRoleFamilies: string[] = [];

  familyScores.forEach((score, family) => {
    if (excludedFamilies.has(family)) return;
    if (score >= 2) boostedRoleFamilies.push(family);
    else if (score <= -2) penalizedRoleFamilies.push(family);
  });

  return {
    boostedRoleFamilies,
    penalizedRoleFamilies,
    excludedRoleFamilies: Array.from(excludedFamilies),
    hiddenEmployers: Array.from(hiddenEmployers),
    outcomeInsights,
    totalSignalsRecorded: sorted.length,
  };
}

/**
 * Records a user feedback signal in the database and updates profile exclusions when applicable.
 */
export async function recordUserFeedbackSignal(input: {
  userId?: string;
  profileId?: string;
  opportunityId?: string;
  organization?: string;
  roleFamily?: string;
  signalType: FeedbackSignalType;
  outcome?: "INTERVIEW" | "OFFER" | "REJECTED" | "GHOSTED" | null;
  notes?: string;
  metadata?: Record<string, unknown>;
}): Promise<{
  record: UserFeedbackRecord;
  summary: FeedbackPersonalizationSummary;
}> {
  if (input.opportunityId) {
    if (
      input.opportunityId.startsWith("demo-") ||
      input.opportunityId.startsWith("mock-")
    ) {
      throw new Error(
        "NO_MOCK_DATA_POLICY_VIOLATION: Demo fixture opportunities cannot enter user feedback records."
      );
    }
    const existingOpp = await prisma.opportunity.findUnique({
      where: { id: input.opportunityId },
    });
    if (existingOpp && isDemoOrFixtureRecord(existingOpp)) {
      throw new Error(
        "NO_MOCK_DATA_POLICY_VIOLATION: Demo fixture opportunities cannot enter user feedback records."
      );
    }
  }

  const profileRow = await prisma.userProfile.findFirst({
    where: input.userId ? { userId: input.userId } : {},
    orderBy: { updatedAt: "desc" },
  });
  const profileId = input.profileId || profileRow?.id || "default";

  if (input.signalType === "RESET_PERSONALIZATION" && profileRow) {
    await prisma.userProfile.update({
      where: { id: profileRow.id },
      data: {
        excludedRoleFamilies: "[]",
        hiddenEmployers: "[]",
      },
    });
  } else if (input.signalType === "DISMISS_ROLE_FAMILY" && input.roleFamily && profileRow) {
    const existing: string[] = JSON.parse(profileRow.excludedRoleFamilies || "[]");
    if (!existing.includes(input.roleFamily)) {
      existing.push(input.roleFamily);
      await prisma.userProfile.update({
        where: { id: profileRow.id },
        data: { excludedRoleFamilies: JSON.stringify(existing) },
      });
    }
  } else if (input.signalType === "HIDE_EMPLOYER" && input.organization && profileRow) {
    const existing: string[] = JSON.parse(profileRow.hiddenEmployers || "[]");
    if (!existing.includes(input.organization)) {
      existing.push(input.organization);
      await prisma.userProfile.update({
        where: { id: profileRow.id },
        data: { hiddenEmployers: JSON.stringify(existing) },
      });
    }
  }

  await prisma.userFeedback.create({
    data: {
      userId: input.userId || "default",
      profileId,
      opportunityId: input.opportunityId ?? null,
      organization: input.organization ?? null,
      roleFamily: input.roleFamily ?? null,
      signalType: input.signalType,
      outcome: input.outcome ?? null,
      notes: input.notes ?? "",
      metadataJson: JSON.stringify(input.metadata || {}),
    },
  });

  const allRows = await prisma.userFeedback.findMany({
    where: { profileId },
    orderBy: { createdAt: "asc" },
  });

  const mapped: UserFeedbackRecord[] = allRows.map((r) => ({
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

  const updatedProfileRow = await prisma.userProfile.findFirst();
  const excludedRoleFamilies = updatedProfileRow
    ? (JSON.parse(updatedProfileRow.excludedRoleFamilies || "[]") as string[])
    : [];
  const hiddenEmployers = updatedProfileRow
    ? (JSON.parse(updatedProfileRow.hiddenEmployers || "[]") as string[])
    : [];

  const summary = computeFeedbackPersonalization(mapped, {
    excludedRoleFamilies,
    hiddenEmployers,
  } as UserProfile);

  return {
    record: mapped[mapped.length - 1]!,
    summary,
  };
}

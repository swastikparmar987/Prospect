import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { resolveAuthenticatedUser } from "@/lib/auth";
import { loadActiveUserProfile } from "@/lib/agent/orchestrator";
import { evaluateProjectForResumeAndJobs } from "@/lib/project-evaluator";
import { enrichOpportunityWithLocationIntelligence } from "@/lib/location-intelligence";
import { extractCandidateCapabilityMap } from "@/lib/candidate-intelligence";
import { expandCandidateRoleFamilies } from "@/lib/role-expansion";
import { EMBEDDING_MODEL_ID, generateCandidateEmbedding } from "@/lib/ai/semantic-embeddings";
import { publishRealtimeEvent } from "@/lib/realtime/opportunity-events";
import { Opportunity, ProjectFact, UserProfile } from "@/types";

const ProjectEvalRequestSchema = z.object({
  title: z.string().min(2).max(160),
  description: z.string().min(10).max(4000),
  techStack: z.array(z.string()).default([]),
  repoUrl: z.string().optional(),
  liveUrl: z.string().optional(),
  targetRole: z.string().optional(),
  addToProfile: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const body = await req.json();
    const parsed = ProjectEvalRequestSchema.parse(body);

    const profile = await loadActiveUserProfile(user.userId);

    const rawOpps = await prisma.opportunity.findMany({
      where: { isDemo: false, isExpired: false },
      orderBy: { discoveredAt: "desc" },
      take: 350,
    });

    const activeOpportunities: Opportunity[] = rawOpps.map((item) => {
      const baseOpp: Opportunity = {
        id: item.id,
        title: item.title,
        organization: item.organization,
        category: item.category as any,
        employmentType: item.employmentType || undefined,
        roleFamily: item.roleFamily || undefined,
        seniority: item.seniority || undefined,
        description: item.description,
        location: item.location,
        latitude: item.latitude ?? null,
        longitude: item.longitude ?? null,
        workMode: item.workMode as any,
        compensation: item.compensation,
        eligibilityRequirements: JSON.parse(item.eligibilityRequirements || "[]"),
        requiredSkills: JSON.parse(item.requiredSkills || "[]"),
        preferredSkills: JSON.parse(item.preferredSkills || "[]"),
        publishedAt: item.publishedAt ? item.publishedAt.toISOString() : null,
        deadline: item.deadline ? item.deadline.toISOString() : null,
        deadlineRaw: item.deadlineRaw,
        applyUrl: item.applyUrl,
        applicationUrl: item.applyUrl,
        canonicalUrl: item.canonicalUrl || item.applyUrl,
        providerId: item.providerId,
        sourceName: item.sourceName,
        sourceUrl: item.sourceUrl,
        sourceSnippet: item.sourceSnippet || "",
        sourceConfidence: item.sourceConfidence,
        verificationStatus: item.verificationStatus as any,
        sourceEvidence: JSON.parse(item.sourceEvidence || "[]"),
        multiSourceProvenance: JSON.parse(item.multiSourceProvenance || "[]"),
        guardVerdict: (item.guardVerdict as any) || "CLEAN",
        embedding: JSON.parse(item.embeddingJson || "[]"),
        isExpired: Boolean(item.isExpired),
        fetchedAt: item.fetchedAt.toISOString(),
        discoveredAt: item.discoveredAt.toISOString(),
        lastCheckedAt: item.lastCheckedAt.toISOString(),
        isDemo: false,
      };
      return enrichOpportunityWithLocationIntelligence(
        baseOpp,
        profile?.locationPreference
      );
    });

    const result = await evaluateProjectForResumeAndJobs(
      {
        title: parsed.title,
        description: parsed.description,
        techStack: parsed.techStack,
        repoUrl: parsed.repoUrl,
        liveUrl: parsed.liveUrl,
        targetRole: parsed.targetRole,
      },
      profile,
      activeOpportunities
    );

    let addedToProfile = false;
    if (parsed.addToProfile) {
      const dbProfile = await prisma.userProfile.findFirst({
        where: { userId: user.userId },
        orderBy: { updatedAt: "desc" },
      });

      const newProj: ProjectFact = {
        id: `proj-${Date.now()}`,
        name: parsed.title.trim(),
        description: parsed.description.trim(),
        techStack: parsed.techStack,
        link: parsed.repoUrl?.trim() || parsed.liveUrl?.trim() || undefined,
        provenance: "USER_INPUT",
      };

      if (dbProfile) {
        const currentProjects: ProjectFact[] = JSON.parse(dbProfile.projects || "[]");
        const filtered = currentProjects.filter(
          (p) => p.name.trim().toLowerCase() !== newProj.name.toLowerCase()
        );
        const updatedProjects = [newProj, ...filtered];
        const currentSkills: string[] = JSON.parse(dbProfile.skills || "[]");
        const updatedSkills = Array.from(
          new Set([...currentSkills, ...parsed.techStack])
        );

        const nextProfile: UserProfile = {
          ...(profile || ({} as UserProfile)),
          id: dbProfile.id,
          skills: updatedSkills,
          projects: updatedProjects,
        };
        const capabilityMap = extractCandidateCapabilityMap(nextProfile);
        const expandedRoles = expandCandidateRoleFamilies(nextProfile, capabilityMap);
        const embedding = generateCandidateEmbedding(nextProfile);

        await prisma.userProfile.update({
          where: { id: dbProfile.id },
          data: {
            projects: JSON.stringify(updatedProjects),
            skills: JSON.stringify(updatedSkills),
            capabilitiesJson: JSON.stringify(capabilityMap),
            roleFamiliesJson: JSON.stringify(expandedRoles),
            embeddingJson: JSON.stringify(embedding),
            embeddingModel: EMBEDDING_MODEL_ID,
          },
        });
        addedToProfile = true;
      }

      publishRealtimeEvent(
        "PROJECT_ADDED",
        `Added "${parsed.title}" (${result.overallScore}/100) to your profile & re-indexed live job matches.`,
        {
          title: parsed.title,
          score: result.overallScore,
          matchingCount: result.matchingOpportunitiesCount,
        },
        user.userId
      );
    }

    return NextResponse.json({
      success: true,
      evaluation: result,
      addedToProfile,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: "Project evaluation failed",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 400 }
    );
  }
}

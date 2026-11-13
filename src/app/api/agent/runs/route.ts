import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { AgentRunRecord } from "@/types";
import { durableWorker } from "@/lib/agent/durable-worker";
import { resolveAuthenticatedUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const rawRuns = await prisma.agentRun.findMany({
      where: { userId: user.userId },
      include: {
        steps: {
          orderBy: { stepNumber: "asc" },
        },
      },
      orderBy: { startedAt: "desc" },
      take: 20,
    });

    const runs: AgentRunRecord[] = rawRuns.map((r) => {
      let rounds = undefined;
      let searchPlans = undefined;
      let coverageSummary = undefined;
      try {
        rounds = r.roundsJson ? JSON.parse(r.roundsJson) : undefined;
      } catch {
        rounds = undefined;
      }
      try {
        searchPlans = r.searchPlanJson ? JSON.parse(r.searchPlanJson) : undefined;
      } catch {
        searchPlans = undefined;
      }
      try {
        const parsedCov = r.coverageSummaryJson ? JSON.parse(r.coverageSummaryJson) : undefined;
        if (parsedCov && Object.keys(parsedCov).length > 0) {
          coverageSummary = parsedCov;
        }
      } catch {
        coverageSummary = undefined;
      }

      return {
        id: r.id,
        trigger: r.trigger as any,
        query: r.query,
        mode: (r.mode as "DEMO" | "LIVE") || "LIVE",
        status: r.status as any,
        summary: r.summary,
        rounds,
        searchPlans,
        coverageSummary,
        stopReason: r.stopReason || undefined,
        budgetUsed: r.budgetUsed,
        budgetLimit: r.budgetLimit,
        startedAt: r.startedAt.toISOString(),
        completedAt: r.completedAt ? r.completedAt.toISOString() : null,
        steps: r.steps.map((s) => ({
          id: s.id,
          stepNumber: s.stepNumber,
          toolName: s.toolName,
          status: s.status as any,
          inputSummary: s.inputSummary,
          outputSummary: s.outputSummary,
          sourceReferences: JSON.parse(s.sourceReferences || "[]"),
          errorDetails: s.errorDetails,
          executedAt: s.executedAt.toISOString(),
        })),
      };
    });

    return NextResponse.json({ runs });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to fetch agent activity trace", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const user = resolveAuthenticatedUser(req);
    const body = await req.json().catch(() => ({}));
    const query = typeof body.query === "string" && body.query.trim() ? body.query.trim() : "Software Engineering Intern";
    if (typeof body.mode === "string" && body.mode.toUpperCase() === "DEMO") {
      return NextResponse.json(
        {
          error:
            "NO_MOCK_DATA_POLICY_VIOLATION: Demo/mock mode is disabled. Agent runs execute in LIVE mode only.",
        },
        { status: 422 }
      );
    }
    const mode = "LIVE" as const;
    const careerDirections = Array.isArray(body.careerDirections) ? body.careerDirections : undefined;

    const task = await durableWorker.enqueue(
      "ADAPTIVE_SEARCH",
      user.userId,
      { query, mode, careerDirections }
    );

    // Trigger execution asynchronously in background
    durableWorker.executeTaskDirectly(task.id).catch((err) => {
      console.warn(`[AgentRuns API] Background task ${task.id} execution error:`, err);
    });

    return NextResponse.json({
      success: true,
      taskId: task.id,
      runId: task.runId,
      status: task.status,
      message: `Durable background search task enqueued for "${query}".`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to start durable background search", details: err?.message || String(err) },
      { status: 500 }
    );
  }
}

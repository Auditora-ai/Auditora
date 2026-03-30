import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { getAuthContext } from "@/lib/auth-helpers";

const RISK_LEVEL_MAP: Record<string, number> = {
  LOW: 10,
  MEDIUM: 40,
  HIGH: 70,
  CRITICAL: 100,
};

export async function POST(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ templateId: string; runId: string }> },
) {
  try {
    const authCtx = await getAuthContext();
    if (!authCtx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { runId } = await params;

    // Verify run belongs to this user and is IN_PROGRESS
    const run = await db.simulationRun.findUnique({
      where: { id: runId },
      select: { userId: true, status: true, createdAt: true },
    });

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    if (run.userId !== authCtx.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (run.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Run is not in progress" },
        { status: 400 },
      );
    }

    // Fetch all responses with their decisions
    const responses = await db.decisionResponse.findMany({
      where: { runId },
      include: {
        decision: {
          select: { riskLevelByOption: true },
        },
      },
    });

    if (responses.length === 0) {
      return NextResponse.json(
        { error: "No responses recorded" },
        { status: 400 },
      );
    }

    // Calculate scores
    const riskValues = responses.map((r) => {
      const riskLevels = r.decision.riskLevelByOption as Array<{ level: string; reason: string } | string>;
      const entry = riskLevels[r.chosenOption];
      const chosenRisk = typeof entry === "object" && entry !== null ? entry.level : (entry ?? "MEDIUM");
      return RISK_LEVEL_MAP[chosenRisk] ?? 40;
    });

    const riskLevel = Math.round(
      riskValues.reduce((sum, v) => sum + v, 0) / riskValues.length,
    );
    const alignment = 100 - riskLevel;
    const criterio = 60; // Placeholder — will be replaced by AI eval
    const overallScore = Math.round(
      0.3 * alignment + 0.3 * (100 - riskLevel) + 0.4 * criterio,
    );

    const now = new Date();
    const duration = Math.round(
      (now.getTime() - run.createdAt.getTime()) / 1000,
    );

    const updated = await db.simulationRun.update({
      where: { id: runId },
      data: {
        status: "COMPLETED",
        alignment,
        riskLevel,
        criterio,
        overallScore,
        duration,
        completedAt: now,
      },
    });

    return NextResponse.json({
      alignment,
      riskLevel,
      criterio,
      overallScore,
      duration,
    });
  } catch (error) {
    console.error(
      "[POST /api/simulations/[templateId]/run/[runId]/complete]",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

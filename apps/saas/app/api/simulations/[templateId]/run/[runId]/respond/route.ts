import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { getAuthContext } from "@/lib/auth-helpers";

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
    const { decisionId, chosenOption, timeToDecide } = await request.json();

    if (!decisionId || chosenOption === undefined) {
      return NextResponse.json(
        { error: "decisionId and chosenOption are required" },
        { status: 400 },
      );
    }

    // Verify run belongs to this user and is IN_PROGRESS
    const run = await db.simulationRun.findUnique({
      where: { id: runId },
      select: { userId: true, status: true },
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

    await db.decisionResponse.create({
      data: {
        runId,
        decisionId,
        chosenOption,
        timeToDecide: timeToDecide ?? null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "[POST /api/simulations/[templateId]/run/[runId]/respond]",
      error,
    );
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

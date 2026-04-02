/**
 * Simulation Run Evaluation API
 *
 * POST — Evaluate a completed simulation run with AI scoring
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-helpers";
import { evaluateSimulationRun } from "@repo/ai";
import { db } from "@repo/database";

type Params = { params: Promise<{ templateId: string; runId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const authCtx = await getAuthContext();
    if (!authCtx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId, runId } = await params;

    // Verify run exists and belongs to this org
    const run = await db.simulationRun.findUnique({
      where: { id: runId },
      include: {
        scenario: {
          include: {
            template: { select: { id: true, organizationId: true } },
          },
        },
      },
    });

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    if (run.scenario.template.id !== templateId) {
      return NextResponse.json({ error: "Run does not belong to this template" }, { status: 400 });
    }

    if (run.scenario.template.organizationId !== authCtx.org.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (run.status === "COMPLETED") {
      return NextResponse.json({
        alignment: run.alignment,
        riskLevel: run.riskLevel,
        criterio: run.criterio,
        overallScore: run.overallScore,
        errorPatterns: run.errorPatterns,
        feedback: run.aiFeedback,
      });
    }

    const result = await evaluateSimulationRun(runId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Evaluate POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

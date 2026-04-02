import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { getAuthContext, isAuthError } from "@/lib/auth-helpers";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  try {
    const authCtx = await getAuthContext();
    if (!authCtx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = await params;
    const { scenarioId } = await request.json();

    if (!scenarioId) {
      return NextResponse.json(
        { error: "scenarioId is required" },
        { status: 400 },
      );
    }

    // Verify the scenario belongs to this template and the template belongs to the user's org
    const scenario = await db.simulationScenario.findUnique({
      where: { id: scenarioId },
      include: {
        template: { select: { id: true, organizationId: true, status: true } },
      },
    });

    if (!scenario || scenario.template.id !== templateId) {
      return NextResponse.json(
        { error: "Scenario not found" },
        { status: 404 },
      );
    }

    if (scenario.template.organizationId !== authCtx.org.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (scenario.template.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Template is not published" },
        { status: 400 },
      );
    }

    const run = await db.simulationRun.create({
      data: {
        scenarioId,
        userId: authCtx.user.id,
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json({ runId: run.id });
  } catch (error) {
    console.error("[POST /api/evaluaciones/[templateId]/run]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

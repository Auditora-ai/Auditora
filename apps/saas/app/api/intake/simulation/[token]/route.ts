import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";

/**
 * Public endpoint — no auth required.
 * Token = runId. Fetches run with scenario + decisions for the employee simulation intake.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;

    const run = await db.simulationRun.findUnique({
      where: { id: token },
      include: {
        scenario: {
          include: {
            template: {
              select: { id: true, title: true, narrative: true },
            },
            decisions: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                order: true,
                prompt: true,
                options: true,
                consequences: true,
                proceduralReference: true,
              },
            },
          },
        },
      },
    });

    if (!run) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (run.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Simulation already completed or abandoned" },
        { status: 410 },
      );
    }

    const decisions = run.scenario.decisions.map((d) => ({
      id: d.id,
      order: d.order,
      prompt: d.prompt,
      options: d.options as Array<{ label: string; description: string }>,
      consequences: d.consequences as string[],
      proceduralReference: d.proceduralReference,
    }));

    return NextResponse.json({
      runId: run.id,
      templateId: run.scenario.template.id,
      templateTitle: run.scenario.template.title,
      narrative: run.scenario.template.narrative,
      decisions,
    });
  } catch (error) {
    console.error("[GET /api/intake/simulation/[token]]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

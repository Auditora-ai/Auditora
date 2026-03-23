import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { calculateResidualRisk } from "@repo/ai";

async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });
}

async function recalculateResidualRisk(riskId: string) {
  const controls = await db.riskControl.findMany({ where: { riskId } });
  const risk = await db.processRisk.findUnique({ where: { id: riskId } });

  if (!risk) return;

  const residual = calculateResidualRisk(risk.severity, risk.probability, controls);
  await db.processRisk.update({
    where: { id: riskId },
    data: residual
      ? {
          residualSeverity: residual.residualSeverity,
          residualProbability: residual.residualProbability,
          residualScore: residual.residualScore,
        }
      : {
          residualSeverity: null,
          residualProbability: null,
          residualScore: null,
        },
  });
}

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      processId: string;
      riskId: string;
      controlId: string;
    }>;
  },
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { riskId, controlId } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.description !== undefined) data.description = body.description;
    if (body.controlType !== undefined) data.controlType = body.controlType;
    if (body.effectiveness !== undefined) data.effectiveness = body.effectiveness;
    if (body.automated !== undefined) data.automated = body.automated;
    if (body.system !== undefined) data.system = body.system;

    const control = await db.riskControl.update({
      where: { id: controlId },
      data,
    });

    // Recalculate residual risk after control change
    await recalculateResidualRisk(riskId);

    return NextResponse.json(control);
  } catch (error) {
    console.error("[Control] PATCH Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      processId: string;
      riskId: string;
      controlId: string;
    }>;
  },
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { riskId, controlId } = await params;

    await db.riskControl.delete({
      where: { id: controlId },
    });

    // Recalculate residual risk (if no controls remain, sets to null)
    await recalculateResidualRisk(riskId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Control] DELETE Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

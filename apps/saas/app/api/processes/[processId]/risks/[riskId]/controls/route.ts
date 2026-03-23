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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ processId: string; riskId: string }> },
) {
  try {
    const { riskId } = await params;

    const controls = await db.riskControl.findMany({
      where: { riskId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ controls });
  } catch (error) {
    console.error("[Controls] GET Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ processId: string; riskId: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { riskId } = await params;
    const body = await request.json();

    if (!body.name || !body.controlType) {
      return NextResponse.json(
        { error: "name and controlType are required" },
        { status: 400 },
      );
    }

    // Verify risk exists
    const risk = await db.processRisk.findUnique({
      where: { id: riskId },
    });

    if (!risk) {
      return NextResponse.json({ error: "Risk not found" }, { status: 404 });
    }

    const control = await db.riskControl.create({
      data: {
        riskId,
        name: body.name,
        description: body.description || null,
        controlType: body.controlType,
        effectiveness: body.effectiveness || "UNKNOWN",
        automated: body.automated || false,
        system: body.system || null,
      },
    });

    // Recalculate residual risk
    const controls = await db.riskControl.findMany({ where: { riskId } });
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

    return NextResponse.json(control, { status: 201 });
  } catch (error) {
    console.error("[Controls] POST Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

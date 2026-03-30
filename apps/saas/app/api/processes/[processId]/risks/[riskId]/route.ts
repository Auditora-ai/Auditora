import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireProcessAuth, isAuthError } from "@/lib/auth-helpers";
import { calculateResidualRisk } from "@repo/ai";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ processId: string; riskId: string }> },
) {
  try {
    const { processId, riskId } = await params;

    const authResult = await requireProcessAuth(processId);
    if (isAuthError(authResult)) return authResult;

    const risk = await db.processRisk.findUnique({
      where: { id: riskId },
      include: {
        mitigations: { orderBy: { createdAt: "desc" } },
        controls: { orderBy: { createdAt: "desc" } },
        affectedNode: { select: { id: true, label: true, nodeType: true } },
      },
    });

    if (!risk) {
      return NextResponse.json({ error: "Risk not found" }, { status: 404 });
    }

    return NextResponse.json(risk);
  } catch (error) {
    console.error("[Risk] GET Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ processId: string; riskId: string }> },
) {
  try {
    const { processId, riskId } = await params;

    const authResult = await requireProcessAuth(processId);
    if (isAuthError(authResult)) return authResult;

    const body = await request.json();

    const existing = await db.processRisk.findUnique({
      where: { id: riskId },
      include: { controls: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Risk not found" }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.riskType !== undefined) data.riskType = body.riskType;
    if (body.status !== undefined) data.status = body.status;
    if (body.affectedStep !== undefined) data.affectedStep = body.affectedStep;
    if (body.affectedNodeId !== undefined) data.affectedNodeId = body.affectedNodeId || null;
    if (body.linkedProcedureId !== undefined) data.linkedProcedureId = body.linkedProcedureId || null;
    if (body.affectedNodeId && body.affectedStep === undefined) {
      const node = await db.diagramNode.findUnique({ where: { id: body.affectedNodeId }, select: { label: true } });
      if (node) data.affectedStep = node.label;
    }
    if (body.affectedRole !== undefined) data.affectedRole = body.affectedRole;
    if (body.isOpportunity !== undefined) data.isOpportunity = body.isOpportunity;
    if (body.opportunityValue !== undefined) data.opportunityValue = body.opportunityValue;
    if (body.shareVisible !== undefined) data.shareVisible = body.shareVisible;
    if (body.failureMode !== undefined) data.failureMode = body.failureMode;
    if (body.failureEffect !== undefined) data.failureEffect = body.failureEffect;
    if (body.detectionDifficulty !== undefined) {
      data.detectionDifficulty = Math.min(5, Math.max(1, Number(body.detectionDifficulty)));
    }

    // Recalculate riskScore if severity or probability changed
    const newSeverity = body.severity !== undefined
      ? Math.min(5, Math.max(1, Number(body.severity)))
      : existing.severity;
    const newProbability = body.probability !== undefined
      ? Math.min(5, Math.max(1, Number(body.probability)))
      : existing.probability;

    if (body.severity !== undefined) data.severity = newSeverity;
    if (body.probability !== undefined) data.probability = newProbability;

    if (body.severity !== undefined || body.probability !== undefined) {
      data.riskScore = newSeverity * newProbability;

      // Recalculate RPN if detectionDifficulty exists
      const dd = (data.detectionDifficulty as number) ?? existing.detectionDifficulty;
      if (dd) {
        data.rpn = newSeverity * newProbability * dd;
      }

      // Recalculate residual risk if controls exist
      if (existing.controls.length > 0) {
        const residual = calculateResidualRisk(newSeverity, newProbability, existing.controls);
        if (residual) {
          data.residualSeverity = residual.residualSeverity;
          data.residualProbability = residual.residualProbability;
          data.residualScore = residual.residualScore;
        }
      }
    }

    const risk = await db.processRisk.update({
      where: { id: riskId },
      data,
      include: {
        mitigations: { orderBy: { createdAt: "desc" } },
        controls: true,
        affectedNode: { select: { id: true, label: true, nodeType: true } },
      },
    });

    // Log the update
    await db.riskAuditLog.create({
      data: {
        riskId,
        action: "updated",
        delta: body,
        userId: authResult.authCtx.user.id,
      },
    });

    return NextResponse.json(risk);
  } catch (error) {
    console.error("[Risk] PATCH Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ processId: string; riskId: string }> },
) {
  try {
    const { processId, riskId } = await params;

    const authResult = await requireProcessAuth(processId);
    if (isAuthError(authResult)) return authResult;

    await db.processRisk.delete({
      where: { id: riskId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Risk] DELETE Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

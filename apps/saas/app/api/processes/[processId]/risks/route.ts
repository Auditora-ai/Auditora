import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import type { RiskType, RiskSource } from "@repo/database";
import { requireProcessAuth, isAuthError } from "@/lib/auth-helpers";
import {
  auditRisks,
  calculateResidualRisk,
  type RiskAuditInput,
  type KnowledgeSnapshot,
} from "@repo/ai";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ processId: string }> },
) {
  try {
    const { processId } = await params;

    const authResult = await requireProcessAuth(processId);
    if (isAuthError(authResult)) return authResult;

    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const type = url.searchParams.get("type");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "50");

    const where: Record<string, unknown> = { processDefinitionId: processId };
    if (status) where.status = status;
    if (type) where.riskType = type;

    const [risks, total] = await Promise.all([
      db.processRisk.findMany({
        where,
        include: {
          mitigations: { orderBy: { createdAt: "desc" } },
          controls: true,
          affectedNode: { select: { id: true, label: true, nodeType: true } },
        },
        orderBy: { riskScore: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.processRisk.count({ where }),
    ]);

    // Compute summary
    const allRisks = await db.processRisk.findMany({
      where: { processDefinitionId: processId },
      select: { riskScore: true, isOpportunity: true, riskType: true },
    });

    const summary = {
      totalRisks: allRisks.length,
      criticalCount: allRisks.filter((r) => r.riskScore >= 20).length,
      highCount: allRisks.filter((r) => r.riskScore >= 12 && r.riskScore < 20).length,
      mediumCount: allRisks.filter((r) => r.riskScore >= 6 && r.riskScore < 12).length,
      lowCount: allRisks.filter((r) => r.riskScore < 6).length,
      opportunities: allRisks.filter((r) => r.isOpportunity).length,
      avgRiskScore:
        allRisks.length > 0
          ? Math.round(
              allRisks.reduce((sum, r) => sum + r.riskScore, 0) / allRisks.length,
            )
          : 0,
    };

    return NextResponse.json({ risks, total, summary });
  } catch (error) {
    console.error("[Risks] GET Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ processId: string }> },
) {
  try {
    const { processId } = await params;

    const authResult = await requireProcessAuth(processId);
    if (isAuthError(authResult)) return authResult;

    const body = await request.json();
    const { action } = body as {
      action: "audit" | "fmea" | "full" | "create";
    };

    if (action === "create") {
      return handleCreateRisk(processId, body, authResult.authCtx.user.id);
    }

    // Audit/FMEA/Full — trigger AI pipeline
    return handleAuditRisks(processId, action, authResult.authCtx.user.id);
  } catch (error) {
    console.error("[Risks] POST Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function handleCreateRisk(
  processId: string,
  body: Record<string, unknown>,
  userId: string,
) {
  const severity = Math.min(5, Math.max(1, Number(body.severity) || 3));
  const probability = Math.min(5, Math.max(1, Number(body.probability) || 3));
  const affectedNodeId = body.affectedNodeId ? String(body.affectedNodeId) : null;
  const linkedProcedureId = body.linkedProcedureId ? String(body.linkedProcedureId) : null;

  // Auto-resolve affectedStep from node label if node is linked
  let resolvedAffectedStep = body.affectedStep ? String(body.affectedStep) : null;
  if (affectedNodeId && !resolvedAffectedStep) {
    const node = await db.diagramNode.findUnique({ where: { id: affectedNodeId }, select: { label: true } });
    if (node) resolvedAffectedStep = node.label;
  }

  const risk = await db.processRisk.create({
    data: {
      processDefinitionId: processId,
      title: String(body.title || ""),
      description: String(body.description || ""),
      riskType: ((body.riskType as string) || "OPERATIONAL") as RiskType,
      source: "MANUAL" as RiskSource,
      severity,
      probability,
      riskScore: severity * probability,
      isOpportunity: Boolean(body.isOpportunity),
      opportunityValue: body.opportunityValue ? String(body.opportunityValue) : null,
      affectedStep: resolvedAffectedStep,
      affectedNodeId,
      linkedProcedureId,
      affectedRole: body.affectedRole ? String(body.affectedRole) : null,
      createdBy: userId,
    },
  });

  return NextResponse.json({ success: true, risk });
}

async function handleAuditRisks(
  processId: string,
  mode: "audit" | "fmea" | "full",
  userId: string,
) {
  // Fetch process definition with intelligence data
  const processDef = await db.processDefinition.findUnique({
    where: { id: processId },
    include: {
      architecture: {
        include: {
          organization: { select: { industry: true } },
          definitions: { select: { name: true } },
        },
      },
      intelligence: {
        include: {
          items: {
            where: { status: "OPEN" },
            orderBy: { priority: "desc" },
            take: 30,
          },
        },
      },
      risks: {
        where: { status: { not: "CLOSED" } },
        select: {
          id: true,
          title: true,
          riskType: true,
          severity: true,
          probability: true,
          status: true,
          affectedStep: true,
        },
      },
      sessions: {
        where: { status: "ENDED" },
        include: { sessionSummary: true },
        orderBy: { endedAt: "desc" },
        take: 3,
      },
    },
  });

  if (!processDef) {
    return NextResponse.json({ error: "Process not found" }, { status: 404 });
  }

  if (!processDef.intelligence) {
    return NextResponse.json(
      { error: "Run intelligence audit first" },
      { status: 400 },
    );
  }

  const snapshot = processDef.intelligence.knowledgeSnapshot as KnowledgeSnapshot;

  const auditMode = mode === "audit" ? "risk" : mode === "fmea" ? "fmea" : "full";

  const input: RiskAuditInput = {
    organizationId: processDef.architecture?.organizationId || "",
    mode: auditMode,
    processDefinition: {
      name: processDef.name,
      description: processDef.description || undefined,
      level: processDef.level,
      goals: processDef.goals,
    },
    knowledgeSnapshot: snapshot,
    intelligenceItems: processDef.intelligence.items.map((item) => ({
      id: item.id,
      category: item.category,
      question: item.question,
      priority: item.priority,
      status: item.status,
    })),
    existingRisks: processDef.risks.map((r) => ({
      id: r.id,
      title: r.title,
      riskType: r.riskType,
      severity: r.severity,
      probability: r.probability,
      status: r.status,
      affectedStep: r.affectedStep || undefined,
    })),
    organizationContext: processDef.architecture?.organization?.industry
      ? {
          industry: processDef.architecture.organization.industry,
          siblingProcessNames:
            processDef.architecture.definitions
              .filter((d) => d.name !== processDef.name)
              .map((d) => d.name) || [],
        }
      : undefined,
    transcriptExcerpts: processDef.sessions
      .filter((s) => s.sessionSummary)
      .map((s) => ({ text: s.sessionSummary!.summary })),
  };

  const result = await auditRisks(input);

  // Fetch BPMN nodes for fuzzy matching
  const processNodes = await db.diagramNode.findMany({
    where: { session: { processDefinitionId: processId } },
    select: { id: true, label: true },
  });

  function matchNodeId(stepName: string | null | undefined): string | null {
    if (!stepName || processNodes.length === 0) return null;
    const normalized = stepName.toLowerCase().trim();
    const exact = processNodes.find((n) => n.label.toLowerCase().trim() === normalized);
    if (exact) return exact.id;
    const partial = processNodes.find(
      (n) => n.label.toLowerCase().includes(normalized) || normalized.includes(n.label.toLowerCase()),
    );
    return partial?.id ?? null;
  }

  // Create new risk records
  let newRisksCount = 0;
  for (const newRisk of result.newRisks) {
    const severity = Math.min(5, Math.max(1, newRisk.severity));
    const probability = Math.min(5, Math.max(1, newRisk.probability));
    const riskScore = severity * probability;
    const detectionDifficulty = newRisk.detectionDifficulty
      ? Math.min(5, Math.max(1, newRisk.detectionDifficulty))
      : null;
    const rpn = detectionDifficulty ? severity * probability * detectionDifficulty : null;

    const created = await db.processRisk.create({
      data: {
        processDefinitionId: processId,
        title: newRisk.title,
        description: newRisk.description,
        riskType: newRisk.riskType as RiskType,
        source: newRisk.source as RiskSource,
        severity,
        probability,
        riskScore,
        affectedStep: newRisk.affectedStep || null,
        affectedNodeId: matchNodeId(newRisk.affectedStep),
        affectedRole: newRisk.affectedRole || null,
        relatedItemId: newRisk.relatedItemId,
        isOpportunity: newRisk.isOpportunity,
        opportunityValue: newRisk.opportunityValue || null,
        failureMode: newRisk.failureMode || null,
        failureEffect: newRisk.failureEffect || null,
        detectionDifficulty,
        rpn,
        createdBy: userId,
      },
    });

    // Create suggested mitigations
    for (const mitAction of newRisk.suggestedMitigations) {
      await db.riskMitigation.create({
        data: { riskId: created.id, action: mitAction },
      });
    }

    // Create suggested controls
    for (const ctrl of newRisk.suggestedControls) {
      await db.riskControl.create({
        data: {
          riskId: created.id,
          name: ctrl.name,
          controlType: ctrl.controlType as never,
          automated: ctrl.automated,
        },
      });
    }

    // Create audit log
    await db.riskAuditLog.create({
      data: {
        riskId: created.id,
        action: "created",
        delta: { source: newRisk.source, riskScore },
        userId,
      },
    });

    newRisksCount++;
  }

  // Update existing risks
  let updatedCount = 0;
  for (const update of result.updatedRisks) {
    const data: Record<string, unknown> = {};
    if (update.severity) data.severity = Math.min(5, Math.max(1, update.severity));
    if (update.probability) data.probability = Math.min(5, Math.max(1, update.probability));
    if (update.severity || update.probability) {
      const s = (data.severity as number) || update.severity || 3;
      const p = (data.probability as number) || update.probability || 3;
      data.riskScore = s * p;
    }

    if (Object.keys(data).length > 0) {
      await db.processRisk.update({
        where: { id: update.id },
        data,
      });
      updatedCount++;
    }
  }

  return NextResponse.json({
    success: true,
    newRisksCount,
    updatedCount,
    riskSummary: result.riskSummary,
  });
}

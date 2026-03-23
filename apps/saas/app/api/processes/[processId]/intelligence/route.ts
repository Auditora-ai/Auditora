import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import {
  auditProcess,
  mergeSnapshotPatch,
  KnowledgeSnapshotSchema,
  type KnowledgeSnapshot,
} from "@repo/ai";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ processId: string }> },
) {
  try {
    const { processId } = await params;

    const intelligence = await db.processIntelligence.findFirst({
      where: {
        processDefinition: { id: processId },
      },
      include: {
        items: {
          where: { status: "OPEN" },
          orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
          take: 50,
        },
        _count: {
          select: {
            items: true,
            auditLogs: true,
          },
        },
      },
    });

    if (!intelligence) {
      return NextResponse.json({
        exists: false,
        processId,
      });
    }

    return NextResponse.json({
      exists: true,
      ...intelligence,
    });
  } catch (error) {
    console.error("[Intelligence] GET Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ processId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
      query: { disableCookieCache: true },
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { processId } = await params;
    const body = await request.json();
    const { action } = body as { action: "initialize" | "audit" };

    // Fetch process definition with all related data
    const processDef = await db.processDefinition.findUnique({
      where: { id: processId },
      include: {
        architecture: {
          include: {
            organization: { select: { industry: true } },
            definitions: {
              select: { id: true, name: true },
              where: { id: { not: processId } },
              take: 10,
            },
          },
        },
        sessions: {
          include: {
            sessionSummary: true,
            diagramNodes: {
              where: { state: "CONFIRMED" },
              select: { label: true, nodeType: true, lane: true, state: true },
            },
            transcriptEntries: {
              select: { text: true, speaker: true },
              take: 50,
              orderBy: { timestamp: "desc" },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        raciEntries: true,
        conflicts: true,
        intelligence: true,
      },
    });

    if (!processDef) {
      return NextResponse.json(
        { error: "Process not found" },
        { status: 404 },
      );
    }

    // Create or fetch intelligence record
    let intelligence = processDef.intelligence;
    if (!intelligence) {
      intelligence = await db.processIntelligence.create({
        data: {
          processDefinitionId: processId,
        },
      });
    }

    const isInitial =
      action === "initialize" || !intelligence.lastAuditAt;

    // Gather data for audit
    const existingSnapshot = KnowledgeSnapshotSchema.parse(
      intelligence.knowledgeSnapshot,
    );

    // Build new data from sessions, RACI, conflicts
    const newData: Record<string, unknown> = {};

    if (processDef.sessions.length > 0) {
      newData.sessionSummaries = processDef.sessions
        .filter((s) => s.sessionSummary)
        .map((s) => ({
          sessionId: s.id,
          summary: s.sessionSummary!.summary,
          actionItems: s.sessionSummary!.actionItems,
        }));

      newData.diagramNodes = processDef.sessions.flatMap((s) =>
        s.diagramNodes.map((n) => ({
          label: n.label,
          type: n.nodeType,
          lane: n.lane,
          state: n.state,
        })),
      );

      newData.transcriptExcerpts = processDef.sessions.map((s) => ({
        sessionId: s.id,
        text: s.transcriptEntries
          .map((t) => `${t.speaker}: ${t.text}`)
          .join("\n")
          .substring(0, 2000),
      }));
    }

    if (processDef.raciEntries.length > 0) {
      newData.raciEntries = processDef.raciEntries.map((r) => ({
        activityName: r.activityName,
        role: r.role,
        assignment: r.assignment,
      }));
    }

    if (processDef.conflicts.length > 0) {
      newData.conflicts = processDef.conflicts.map((c) => ({
        nodeLabel: c.nodeLabel,
        conflictType: c.conflictType,
      }));
    }

    // Organization context
    const orgContext = processDef.architecture
      ? {
          industry: processDef.architecture.organization?.industry ?? undefined,
          siblingProcessNames: processDef.architecture.definitions.map(
            (d) => d.name,
          ),
        }
      : undefined;

    // Existing open items
    const openItems = await db.intelligenceItem.findMany({
      where: {
        intelligenceId: intelligence.id,
        status: "OPEN",
      },
      select: { id: true, question: true, category: true },
    });

    // Run audit
    const result = await auditProcess({
      mode: isInitial ? "initial" : "incremental",
      knowledgeSnapshot: existingSnapshot,
      confidenceScores:
        (intelligence.confidenceScores as Record<string, number>) ?? {},
      processDefinition: {
        name: processDef.name,
        description: processDef.description ?? undefined,
        level: processDef.level,
        goals: processDef.goals,
        triggers: processDef.triggers,
        outputs: processDef.outputs,
        owner: processDef.owner ?? undefined,
        bpmnXml: processDef.bpmnXml ?? undefined,
        bpmnNodeCount: processDef.sessions.reduce(
          (sum, s) => sum + s.diagramNodes.length,
          0,
        ),
        confirmedNodeCount: processDef.sessions.reduce(
          (sum, s) =>
            sum +
            s.diagramNodes.filter((n) => n.state === "CONFIRMED").length,
          0,
        ),
      },
      newData: newData as Parameters<typeof auditProcess>[0]["newData"],
      organizationContext: orgContext,
      existingOpenItems: openItems,
    });

    // Apply delta
    const mergedSnapshot = mergeSnapshotPatch(
      existingSnapshot,
      result.snapshotPatch,
    );

    // Update intelligence record
    await db.processIntelligence.update({
      where: { id: intelligence.id, version: intelligence.version },
      data: {
        knowledgeSnapshot: mergedSnapshot as any,
        confidenceScores: result.updatedScores,
        completenessScore: result.completenessScore,
        lastAuditAt: new Date(),
        version: { increment: 1 },
      },
    });

    // Create new intelligence items for gaps
    if (result.newGaps.length > 0) {
      await db.intelligenceItem.createMany({
        data: result.newGaps.map((gap) => ({
          intelligenceId: intelligence!.id,
          category: gap.category as Parameters<
            typeof db.intelligenceItem.create
          >[0]["data"]["category"],
          question: gap.question,
          context: gap.context || null,
          priority: gap.priority,
          dependsOn: gap.dependsOn,
          sourceType: "audit",
          status: "OPEN" as const,
          elementRef: (gap as any).elementRef || null,
          insightType: (gap as any).insightType || null,
        })),
      });
    }

    // Create intelligence items from starter questions (sparse/empty processes)
    if (result.initialDesign?.starterQuestions?.length) {
      const VALID_CATEGORIES = new Set([
        "MISSING_PATH", "MISSING_ROLE", "MISSING_EXCEPTION", "MISSING_DECISION",
        "MISSING_TRIGGER", "MISSING_OUTPUT", "CONTRADICTION", "UNCLEAR_HANDOFF",
        "MISSING_SLA", "MISSING_SYSTEM", "GENERAL_GAP",
      ]);
      await db.intelligenceItem.createMany({
        data: result.initialDesign.starterQuestions.map((sq) => ({
          intelligenceId: intelligence!.id,
          category: (VALID_CATEGORIES.has(sq.category)
            ? sq.category
            : "GENERAL_GAP") as Parameters<
            typeof db.intelligenceItem.create
          >[0]["data"]["category"],
          question: sq.question,
          context: "Pregunta inicial — auditoría de proceso escaso",
          priority: sq.priority,
          dependsOn: [],
          sourceType: "audit_starter",
          status: "OPEN" as const,
        })),
      });
    }

    // Mark resolved items
    if (result.resolvedGapIds.length > 0) {
      await db.intelligenceItem.updateMany({
        where: {
          id: { in: result.resolvedGapIds },
          intelligenceId: intelligence.id,
        },
        data: {
          status: "RESOLVED",
          resolvedAt: new Date(),
          resolvedBy: `audit:${action}`,
        },
      });
    }

    // Create contradiction items
    if (result.contradictions.length > 0) {
      await db.intelligenceItem.createMany({
        data: result.contradictions.map((c) => ({
          intelligenceId: intelligence!.id,
          category: "CONTRADICTION" as const,
          question: `Contradicción: ${c.topic}`,
          context: `${c.existingClaim} vs ${c.newClaim} (fuente: ${c.source})`,
          priority: 80,
          dependsOn: [],
          sourceType: "audit",
          status: "OPEN" as const,
        })),
      });
    }

    // Log the audit
    await db.intelligenceAuditLog.create({
      data: {
        intelligenceId: intelligence.id,
        triggerType: action === "initialize" ? "initial" : "manual",
        delta: {
          newGaps: result.newGaps.length,
          starterQuestions: result.initialDesign?.starterQuestions?.length ?? 0,
          resolved: result.resolvedGapIds.length,
          contradictions: result.contradictions.length,
          crossProcessGaps: result.crossProcessGaps.length,
        },
        completenessScore: result.completenessScore,
      },
    });

    return NextResponse.json({
      success: true,
      completenessScore: result.completenessScore,
      newGapsCount: result.newGaps.length,
      resolvedCount: result.resolvedGapIds.length,
      contradictionsCount: result.contradictions.length,
      crossProcessGaps: result.crossProcessGaps,
      initialDesign: result.initialDesign,
      followUpSuggestion: result.followUpSuggestion,
    });
  } catch (error) {
    console.error("[Intelligence] POST Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * Organization Deliverables API
 *
 * POST: Generate a deliverable of the specified type
 * GET: Retrieve an existing deliverable
 *
 * Types: mission_vision, value_chain, landscape, horizontal_view, procedure
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import {
  generateMissionVision,
  generateValueChain,
  generateProcessLandscape,
  generateHorizontalView,
  generateProcedure,
} from "@repo/ai";

const VALID_TYPES = [
  "mission_vision",
  "value_chain",
  "landscape",
  "horizontal_view",
  "procedure",
] as const;

type DeliverableType = (typeof VALID_TYPES)[number];

/**
 * GET /api/deliverables/[type]?organizationId=xxx&processDefinitionId=xxx
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const { type } = await params;
    const organizationId = request.nextUrl.searchParams.get("organizationId");

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 },
      );
    }

    if (!VALID_TYPES.includes(type as DeliverableType)) {
      return NextResponse.json(
        { error: `Invalid type: ${type}. Valid: ${VALID_TYPES.join(", ")}` },
        { status: 400 },
      );
    }

    const processDefinitionId =
      request.nextUrl.searchParams.get("processDefinitionId");

    const where: Record<string, unknown> = {
      organizationId,
      type,
    };
    if (processDefinitionId) {
      where.processDefinitionId = processDefinitionId;
    }

    const deliverable = await db.orgDeliverable.findFirst({
      where,
      orderBy: { updatedAt: "desc" },
    });

    if (!deliverable) {
      return NextResponse.json(
        { error: "Deliverable not found", type, organizationId },
        { status: 404 },
      );
    }

    return NextResponse.json(deliverable);
  } catch (error) {
    console.error("[Deliverables GET] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/deliverables/[type]
 * Body: { organizationId, processDefinitionId? (for procedure type), targetFlow? (for horizontal_view) }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> },
) {
  try {
    const { type } = await params;
    const body = await request.json();
    const { organizationId, processDefinitionId, targetFlow } = body;

    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 },
      );
    }

    if (!VALID_TYPES.includes(type as DeliverableType)) {
      return NextResponse.json(
        { error: `Invalid type: ${type}` },
        { status: 400 },
      );
    }

    // Create or update deliverable record as "running"
    const deliverable = await db.orgDeliverable.upsert({
      where: {
        id:
          (
            await db.orgDeliverable.findFirst({
              where: {
                organizationId,
                type,
                ...(processDefinitionId ? { processDefinitionId } : {}),
              },
              select: { id: true },
            })
          )?.id ?? "new",
      },
      create: {
        organizationId,
        type,
        status: "running",
        processDefinitionId: processDefinitionId ?? null,
        startedAt: new Date(),
      },
      update: {
        status: "running",
        error: null,
        startedAt: new Date(),
        completedAt: null,
      },
    });

    // Gather context data
    const org = await db.organization.findUnique({
      where: { id: organizationId },
      select: {
        name: true,
        industry: true,
        businessModel: true,
      },
    });

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const brain = await db.companyBrain.findUnique({
      where: { organizationId },
      include: {
        orgContext: true,
        valueChainActivities: { orderBy: { orderIndex: "asc" } },
        processLinks: true,
        globalRoles: true,
        globalSystems: true,
      },
    });

    const processDefinitions = await db.processDefinition.findMany({
      where: { architecture: { organizationId } },
      include: {
        sessions: { select: { id: true } },
      },
    });

    // Run the appropriate pipeline
    try {
      let result: unknown;

      switch (type as DeliverableType) {
        case "mission_vision":
          result = await generateMissionVision({
            orgName: org.name,
            industry: org.industry ?? undefined,
            businessModel: org.businessModel ?? undefined,
            existingMission: brain?.orgContext?.mission ?? undefined,
            existingVision: brain?.orgContext?.vision ?? undefined,
            existingValues: (brain?.orgContext?.values as Array<{ name: string; description?: string }>) ?? undefined,
            departments: brain?.orgContext?.orgStructure
              ? ((brain.orgContext.orgStructure as { departments?: Array<{ name: string; head?: string }> }).departments ?? undefined)
              : undefined,
            processNames: processDefinitions.map((p) => p.name),
          });
          break;

        case "value_chain":
          result = await generateValueChain({
            orgName: org.name,
            industry: org.industry ?? undefined,
            businessModel: org.businessModel ?? undefined,
            processNames: processDefinitions.map((p) => ({
              name: p.name,
              category: p.category ?? undefined,
              description: p.description ?? undefined,
            })),
            valueChainActivities: brain?.valueChainActivities.map((a) => ({
              name: a.name,
              type: a.type,
              description: a.description ?? undefined,
            })),
            roles: brain?.globalRoles.map((r) => ({
              name: r.name,
              department: r.department ?? undefined,
            })),
            systems: brain?.globalSystems.map((s) => ({
              name: s.name,
              description: s.description ?? undefined,
            })),
          });
          break;

        case "landscape":
          result = await generateProcessLandscape({
            orgName: org.name,
            industry: org.industry ?? undefined,
            processDefinitions: processDefinitions.map((p) => ({
              name: p.name,
              category: p.category ?? undefined,
              level: p.level,
              description: p.description ?? undefined,
              hasBpmn: !!p.bpmnXml,
              sessionsCount: p.sessions.length,
            })),
            valueChainActivities: brain?.valueChainActivities.map((a) => ({
              name: a.name,
              type: a.type,
            })),
            departments: brain?.orgContext?.orgStructure
              ? ((brain.orgContext.orgStructure as { departments?: Array<{ name: string }> }).departments ?? undefined)
              : undefined,
          });
          break;

        case "horizontal_view":
          result = await generateHorizontalView({
            orgName: org.name,
            targetFlow: targetFlow ?? undefined,
            processLinks: (brain?.processLinks ?? []).map((l) => {
              const fromProcess = processDefinitions.find((p) => p.id === l.fromProcessId);
              const toProcess = processDefinitions.find((p) => p.id === l.toProcessId);
              return {
                fromProcess: fromProcess?.name ?? l.fromProcessId,
                toProcess: toProcess?.name ?? l.toProcessId,
                linkType: l.linkType,
                description: l.description ?? undefined,
              };
            }),
            processDefinitions: processDefinitions.map((p) => ({
              name: p.name,
              description: p.description ?? undefined,
              owner: p.owner ?? undefined,
              triggers: p.triggers,
              outputs: p.outputs,
            })),
            roles: brain?.globalRoles.map((r) => ({
              name: r.name,
              department: r.department ?? undefined,
            })),
            systems: brain?.globalSystems.map((s) => ({
              name: s.name,
              description: s.description ?? undefined,
            })),
          });
          break;

        case "procedure": {
          if (!processDefinitionId) {
            await db.orgDeliverable.update({
              where: { id: deliverable.id },
              data: { status: "failed", error: "processDefinitionId required for procedure generation" },
            });
            return NextResponse.json(
              { error: "processDefinitionId is required for procedure type" },
              { status: 400 },
            );
          }
          const process = processDefinitions.find((p) => p.id === processDefinitionId);
          if (!process) {
            await db.orgDeliverable.update({
              where: { id: deliverable.id },
              data: { status: "failed", error: "Process not found" },
            });
            return NextResponse.json({ error: "Process not found" }, { status: 404 });
          }

          // Get BPMN nodes for context
          const nodes = await db.diagramNode.findMany({
            where: {
              session: { processDefinitionId },
              state: "CONFIRMED",
              nodeType: "TASK",
            },
            select: { label: true, lane: true },
            take: 20,
          });

          result = await generateProcedure({
            processName: process.name,
            activityName: process.name,
            processDescription: process.description ?? undefined,
            bpmnContext: nodes.map((n) => `- ${n.label}${n.lane ? ` (${n.lane})` : ""}`).join("\n"),
            systems: brain?.globalSystems.map((s) => s.name),
            roles: brain?.globalRoles.map((r) => r.name),
          });
          break;
        }
      }

      // Persist result
      const confidence = (result as { overallConfidence?: number })?.overallConfidence;
      await db.orgDeliverable.update({
        where: { id: deliverable.id },
        data: {
          status: confidence !== undefined && confidence < 0.3 ? "draft" : "completed",
          data: result as object,
          confidence,
          completedAt: new Date(),
        },
      });

      return NextResponse.json({
        id: deliverable.id,
        type,
        status: confidence !== undefined && confidence < 0.3 ? "draft" : "completed",
        data: result,
        confidence,
      });
    } catch (pipelineError) {
      const errorMsg =
        pipelineError instanceof Error
          ? pipelineError.message
          : "Unknown pipeline error";

      await db.orgDeliverable.update({
        where: { id: deliverable.id },
        data: {
          status: "failed",
          error: errorMsg,
          completedAt: new Date(),
        },
      });

      console.error(`[Deliverables] ${type} pipeline failed:`, pipelineError);
      return NextResponse.json(
        { error: `Pipeline failed: ${errorMsg}`, type },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("[Deliverables POST] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

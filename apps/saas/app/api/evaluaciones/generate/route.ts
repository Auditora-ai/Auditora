import { NextRequest, NextResponse } from "next/server";
import { requireProcessAuth, isAuthError } from "@/lib/auth-helpers";
import { generateSimulationTemplate } from "@repo/ai";
import { db } from "@repo/database";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { processDefinitionId, targetRole, riskIds, customRoleName } =
      body as {
        processDefinitionId: string;
        targetRole: string;
        riskIds: string[];
        customRoleName?: string;
      };

    if (!processDefinitionId || !targetRole || !riskIds?.length) {
      return NextResponse.json(
        { error: "processDefinitionId, targetRole, and riskIds are required" },
        { status: 400 },
      );
    }

    // Auth: verify the user has access to this process
    const authResult = await requireProcessAuth(processDefinitionId);
    if (isAuthError(authResult)) return authResult;

    const { user } = authResult.authCtx;

    // Resolve organizationId from the process
    const processDef = await db.processDefinition.findUnique({
      where: { id: processDefinitionId },
      select: {
        architecture: {
          select: { organizationId: true },
        },
      },
    });

    if (!processDef?.architecture?.organizationId) {
      return NextResponse.json(
        { error: "Process not found or not linked to an organization" },
        { status: 404 },
      );
    }

    const organizationId = processDef.architecture.organizationId;

    // Create template with GENERATING status first
    const template = await db.simulationTemplate.create({
      data: {
        organizationId,
        processDefinitionId,
        title: "Generando...",
        narrative: "",
        targetRole: targetRole as never,
        customRoleName: customRoleName || null,
        status: "GENERATING",
        riskIds,
        createdBy: user.id,
      },
    });

    // Fire-and-forget: generation happens in background
    // The pipeline will update status to PUBLISHED or GENERATION_FAILED
    generateSimulationTemplate({
      processDefinitionId,
      organizationId,
      targetRole,
      customRoleName,
      riskIds,
      userId: user.id,
      existingTemplateId: template.id,
    }).catch((error) => {
      console.error("[Simulations] Background generation failed:", error);
    });

    return NextResponse.json({ success: true, templateId: template.id });
  } catch (error) {
    console.error("[Simulations] Generate Error:", error);
    return NextResponse.json(
      { error: "Failed to generate simulation template" },
      { status: 500 },
    );
  }
}

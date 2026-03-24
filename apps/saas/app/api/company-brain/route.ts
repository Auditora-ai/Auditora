/**
 * Company Brain API
 *
 * GET: Retrieve the Company Brain for an organization (with all relations)
 * POST: Trigger enrichment from a session or document
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { enrichCompanyBrain } from "@repo/ai/src/pipelines/company-brain-enrichment";

/**
 * GET /api/company-brain?organizationId=xxx
 *
 * Returns the full Company Brain with all sub-entities.
 */
export async function GET(request: NextRequest) {
  try {
    const organizationId = request.nextUrl.searchParams.get("organizationId");
    if (!organizationId) {
      return NextResponse.json(
        { error: "organizationId is required" },
        { status: 400 },
      );
    }

    const brain = await db.companyBrain.findUnique({
      where: { organizationId },
      include: {
        orgContext: true,
        valueChainActivities: { orderBy: { orderIndex: "asc" } },
        processLinks: true,
        globalRoles: { orderBy: { name: "asc" } },
        globalSystems: { orderBy: { name: "asc" } },
      },
    });

    if (!brain) {
      return NextResponse.json(
        { error: "Company Brain not found", organizationId },
        { status: 404 },
      );
    }

    return NextResponse.json(brain);
  } catch (error) {
    console.error("[CompanyBrain GET] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/company-brain
 *
 * Trigger enrichment from a transcript or document.
 * Body: { organizationId, text, sourceType, sourceId }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { organizationId, text, sourceType, sourceId } = body;

    if (!organizationId || !text || !sourceType || !sourceId) {
      return NextResponse.json(
        {
          error:
            "organizationId, text, sourceType, and sourceId are required",
        },
        { status: 400 },
      );
    }

    // Ensure Company Brain exists (create if first time)
    let brain = await db.companyBrain.findUnique({
      where: { organizationId },
      include: {
        orgContext: true,
        globalRoles: true,
        globalSystems: true,
      },
    });

    if (!brain) {
      brain = await db.companyBrain.create({
        data: { organizationId },
        include: {
          orgContext: true,
          globalRoles: true,
          globalSystems: true,
        },
      });
    }

    // Get existing context for dedup
    const org = await db.organization.findUnique({
      where: { id: organizationId },
      select: { name: true, industry: true },
    });

    const processes = await db.processDefinition.findMany({
      where: {
        architecture: { organizationId },
      },
      select: { id: true, name: true },
    });

    // Run enrichment
    const enrichmentResult = await enrichCompanyBrain({
      text,
      sourceType: sourceType as "transcript" | "document",
      existingContext: {
        orgName: org?.name,
        industry: org?.industry ?? undefined,
        existingProcesses: processes.map((p) => p.name),
        existingRoles: brain.globalRoles?.map((r) => r.name) ?? [],
        existingSystems: brain.globalSystems?.map((s) => s.name) ?? [],
      },
    });

    if (enrichmentResult.overallConfidence === 0) {
      return NextResponse.json({
        status: "no_data",
        message: "No organizational knowledge found in the provided text",
        tokensUsed: enrichmentResult.tokensUsed,
      });
    }

    const { data } = enrichmentResult;
    const enrichmentSourceType =
      sourceType === "transcript" ? "SESSION" : "DOCUMENT";

    // Persist to normalized tables within a transaction
    await db.$transaction(async (tx) => {
      // 1. Org Context (upsert)
      if (data.orgContext) {
        const ctx = data.orgContext;
        const existingCtx = await tx.orgContext.findUnique({
          where: { companyBrainId: brain.id },
        });

        if (existingCtx) {
          // Only update fields with higher confidence
          const updates: Record<string, unknown> = {};

          if (
            ctx.mission &&
            (!existingCtx.missionConfidence ||
              (ctx.mission.confidence || 0) > existingCtx.missionConfidence)
          ) {
            // Log old value
            await tx.enrichmentHistory.create({
              data: {
                companyBrainId: brain.id,
                sourceType: enrichmentSourceType,
                sourceId,
                field: "orgContext.mission",
                oldValue: existingCtx.mission,
                newValue: ctx.mission.text,
                confidence: ctx.mission.confidence,
                action: existingCtx.mission ? "update" : "create",
              },
            });
            updates.mission = ctx.mission.text;
            updates.missionConfidence = ctx.mission.confidence;
            updates.missionSources = [
              { sessionId: sourceType === "transcript" ? sourceId : undefined, documentId: sourceType === "document" ? sourceId : undefined },
            ];
          }

          if (
            ctx.vision &&
            (!existingCtx.visionConfidence ||
              (ctx.vision.confidence || 0) > existingCtx.visionConfidence)
          ) {
            await tx.enrichmentHistory.create({
              data: {
                companyBrainId: brain.id,
                sourceType: enrichmentSourceType,
                sourceId,
                field: "orgContext.vision",
                oldValue: existingCtx.vision,
                newValue: ctx.vision.text,
                confidence: ctx.vision.confidence,
                action: existingCtx.vision ? "update" : "create",
              },
            });
            updates.vision = ctx.vision.text;
            updates.visionConfidence = ctx.vision.confidence;
            updates.visionSources = [
              { sessionId: sourceType === "transcript" ? sourceId : undefined, documentId: sourceType === "document" ? sourceId : undefined },
            ];
          }

          if (ctx.values && ctx.valuesConfidence) {
            if (
              !existingCtx.valuesConfidence ||
              ctx.valuesConfidence > existingCtx.valuesConfidence
            ) {
              updates.values = ctx.values;
              updates.valuesConfidence = ctx.valuesConfidence;
              updates.valuesSources = [
                { sessionId: sourceType === "transcript" ? sourceId : undefined, documentId: sourceType === "document" ? sourceId : undefined },
              ];
            }
          }

          if (ctx.industry) {
            updates.industrySector = ctx.industry.sector;
            if (ctx.industry.subsector)
              updates.industrySubsector = ctx.industry.subsector;
          }
          if (ctx.companySize) updates.companySize = ctx.companySize;
          if (ctx.geography) updates.geography = ctx.geography;
          if (ctx.departments)
            updates.orgStructure = { departments: ctx.departments };
          if (ctx.businessModel) updates.businessModel = ctx.businessModel;

          if (Object.keys(updates).length > 0) {
            await tx.orgContext.update({
              where: { companyBrainId: brain.id },
              data: updates,
            });
          }
        } else {
          // Create new OrgContext
          await tx.orgContext.create({
            data: {
              companyBrainId: brain.id,
              mission: ctx.mission?.text,
              missionConfidence: ctx.mission?.confidence,
              missionSources: ctx.mission
                ? [{ sessionId: sourceType === "transcript" ? sourceId : undefined, documentId: sourceType === "document" ? sourceId : undefined }]
                : undefined,
              vision: ctx.vision?.text,
              visionConfidence: ctx.vision?.confidence,
              visionSources: ctx.vision
                ? [{ sessionId: sourceType === "transcript" ? sourceId : undefined, documentId: sourceType === "document" ? sourceId : undefined }]
                : undefined,
              values: ctx.values ?? undefined,
              valuesConfidence: ctx.valuesConfidence,
              valuesSources: ctx.values
                ? [{ sessionId: sourceType === "transcript" ? sourceId : undefined, documentId: sourceType === "document" ? sourceId : undefined }]
                : undefined,
              industrySector: ctx.industry?.sector,
              industrySubsector: ctx.industry?.subsector,
              companySize: ctx.companySize,
              geography: ctx.geography,
              orgStructure: ctx.departments
                ? { departments: ctx.departments }
                : undefined,
              businessModel: ctx.businessModel,
            },
          });
        }
      }

      // 2. Value Chain Activities (upsert by name)
      for (const activity of data.valueChainActivities) {
        await tx.valueChainActivity.upsert({
          where: {
            // Use a composite approach — find existing by brain + name
            id: (
              await tx.valueChainActivity.findFirst({
                where: {
                  companyBrainId: brain.id,
                  name: activity.name,
                },
                select: { id: true },
              })
            )?.id ?? "new",
          },
          create: {
            companyBrainId: brain.id,
            name: activity.name,
            type: activity.type,
            description: activity.description,
          },
          update: {
            description: activity.description,
          },
        });
      }

      // 3. Process Links (match process names to IDs)
      const processMap = new Map(
        processes.map((p) => [p.name.toLowerCase(), p.id]),
      );

      for (const link of data.processLinks) {
        const fromId = processMap.get(link.fromProcess.toLowerCase());
        const toId = processMap.get(link.toProcess.toLowerCase());
        if (!fromId || !toId) continue;

        await tx.processLink.upsert({
          where: {
            companyBrainId_fromProcessId_toProcessId_linkType: {
              companyBrainId: brain.id,
              fromProcessId: fromId,
              toProcessId: toId,
              linkType: link.linkType,
            },
          },
          create: {
            companyBrainId: brain.id,
            fromProcessId: fromId,
            toProcessId: toId,
            linkType: link.linkType,
            description: link.description,
            confidence: link.confidence,
          },
          update: {
            description: link.description,
            confidence: Math.max(link.confidence, 0), // Keep higher confidence
          },
        });
      }

      // 4. Global Roles (upsert by name)
      for (const role of data.roles) {
        await tx.globalRole.upsert({
          where: {
            companyBrainId_name: {
              companyBrainId: brain.id,
              name: role.name,
            },
          },
          create: {
            companyBrainId: brain.id,
            name: role.name,
            department: role.department,
            title: role.title,
          },
          update: {
            department: role.department ?? undefined,
            title: role.title ?? undefined,
          },
        });
      }

      // 5. Global Systems (upsert by name)
      for (const system of data.systems) {
        await tx.globalSystem.upsert({
          where: {
            companyBrainId_name: {
              companyBrainId: brain.id,
              name: system.name,
            },
          },
          create: {
            companyBrainId: brain.id,
            name: system.name,
            vendor: system.vendor,
            description: system.description,
          },
          update: {
            vendor: system.vendor ?? undefined,
            description: system.description ?? undefined,
          },
        });
      }

      // 6. Process Categories (update ProcessDefinition.category)
      for (const cat of data.processCategories) {
        const processId = processMap.get(cat.processName.toLowerCase());
        if (!processId) continue;

        await tx.processDefinition.update({
          where: { id: processId },
          data: { category: cat.category },
        });
      }

      // Update lastEnrichedAt
      await tx.companyBrain.update({
        where: { id: brain.id },
        data: { lastEnrichedAt: new Date() },
      });
    });

    return NextResponse.json({
      status: "enriched",
      confidence: enrichmentResult.overallConfidence,
      tokensUsed: enrichmentResult.tokensUsed,
      extracted: {
        orgContext: !!data.orgContext,
        valueChainActivities: data.valueChainActivities.length,
        processLinks: data.processLinks.length,
        roles: data.roles.length,
        systems: data.systems.length,
        processCategories: data.processCategories.length,
      },
    });
  } catch (error) {
    console.error("[CompanyBrain POST] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

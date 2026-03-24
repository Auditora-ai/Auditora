/**
 * Company Brain Enrichment History API
 *
 * GET: Retrieve the enrichment history (audit trail) for a Company Brain.
 * Shows what changed, when, and from which source.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";

/**
 * GET /api/company-brain/history?organizationId=xxx&limit=50&field=orgContext.mission
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

    const limit = parseInt(
      request.nextUrl.searchParams.get("limit") ?? "50",
      10,
    );
    const field = request.nextUrl.searchParams.get("field");

    const brain = await db.companyBrain.findUnique({
      where: { organizationId },
      select: { id: true },
    });

    if (!brain) {
      return NextResponse.json(
        { error: "Company Brain not found" },
        { status: 404 },
      );
    }

    const where: Record<string, unknown> = {
      companyBrainId: brain.id,
    };
    if (field) {
      where.field = field;
    }

    const history = await db.enrichmentHistory.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 200),
    });

    return NextResponse.json({
      history,
      total: await db.enrichmentHistory.count({
        where: { companyBrainId: brain.id },
      }),
    });
  } catch (error) {
    console.error("[CompanyBrain History GET] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

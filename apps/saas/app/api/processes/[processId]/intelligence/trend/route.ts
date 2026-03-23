import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ processId: string }> },
) {
  try {
    const { processId } = await params;

    const intelligence = await db.processIntelligence.findFirst({
      where: { processDefinition: { id: processId } },
      select: { id: true },
    });

    if (!intelligence) {
      return NextResponse.json({ trend: [] });
    }

    const logs = await db.intelligenceAuditLog.findMany({
      where: { intelligenceId: intelligence.id },
      select: {
        completenessScore: true,
        triggerType: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      trend: logs.map((l) => ({
        score: l.completenessScore,
        trigger: l.triggerType,
        date: l.createdAt,
      })),
    });
  } catch (error) {
    console.error("[IntelligenceTrend] GET Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

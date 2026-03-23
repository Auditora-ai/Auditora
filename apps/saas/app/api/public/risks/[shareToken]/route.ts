import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> },
) {
  try {
    const { shareToken } = await params;

    const intelligence = await db.processIntelligence.findFirst({
      where: { riskShareToken: shareToken },
      include: {
        processDefinition: {
          select: {
            name: true,
            description: true,
            risks: {
              where: { shareVisible: true },
              include: {
                mitigations: {
                  orderBy: { createdAt: "desc" },
                },
                controls: {
                  orderBy: { createdAt: "desc" },
                },
              },
              orderBy: { riskScore: "desc" },
            },
            architecture: {
              select: {
                organization: {
                  select: { name: true, logo: true },
                },
              },
            },
          },
        },
      },
    });

    if (!intelligence) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check expiry
    if (
      intelligence.riskShareExpiresAt &&
      intelligence.riskShareExpiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: "This link has expired" },
        { status: 410 },
      );
    }

    const processDef = intelligence.processDefinition;

    return NextResponse.json({
      processName: processDef.name,
      processDescription: processDef.description,
      organizationName: processDef.architecture?.organization?.name,
      organizationLogo: processDef.architecture?.organization?.logo,
      risks: processDef.risks,
    });
  } catch (error) {
    console.error("[PublicRisks] GET Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

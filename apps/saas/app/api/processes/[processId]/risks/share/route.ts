import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireProcessAuth, isAuthError } from "@/lib/auth-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ processId: string }> },
) {
  try {
    const { processId } = await params;

    const authResult = await requireProcessAuth(processId);
    if (isAuthError(authResult)) return authResult;

    const intelligence = await db.processIntelligence.findFirst({
      where: { processDefinition: { id: processId } },
      select: { riskShareToken: true, riskShareExpiresAt: true },
    });

    if (!intelligence || !intelligence.riskShareToken) {
      return NextResponse.json({ shareUrl: null });
    }

    // Check expiry
    if (
      intelligence.riskShareExpiresAt &&
      intelligence.riskShareExpiresAt < new Date()
    ) {
      return NextResponse.json({ shareUrl: null, expired: true });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const shareUrl = `${baseUrl}/risks/${intelligence.riskShareToken}`;

    return NextResponse.json({
      shareUrl,
      shareToken: intelligence.riskShareToken,
      expiresAt: intelligence.riskShareExpiresAt,
    });
  } catch (error) {
    console.error("[RiskShare] GET Error:", error);
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

    // 7-day expiry
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    let intelligence = await db.processIntelligence.findFirst({
      where: { processDefinition: { id: processId } },
    });

    if (!intelligence) {
      intelligence = await db.processIntelligence.create({
        data: {
          processDefinitionId: processId,
          riskShareExpiresAt: expiresAt,
        },
      });
    } else {
      intelligence = await db.processIntelligence.update({
        where: { id: intelligence.id },
        data: { riskShareExpiresAt: expiresAt },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const shareUrl = `${baseUrl}/risks/${intelligence.riskShareToken}`;

    return NextResponse.json({
      shareUrl,
      shareToken: intelligence.riskShareToken,
      expiresAt: intelligence.riskShareExpiresAt,
    });
  } catch (error) {
    console.error("[RiskShare] POST Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

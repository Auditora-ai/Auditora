import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ processId: string }> },
) {
  try {
    const { processId } = await params;

    const intelligence = await db.processIntelligence.findFirst({
      where: { processDefinition: { id: processId } },
      select: { shareToken: true, shareExpiresAt: true },
    });

    if (!intelligence || !intelligence.shareToken) {
      return NextResponse.json({ shareUrl: null });
    }

    // Check expiry
    if (
      intelligence.shareExpiresAt &&
      intelligence.shareExpiresAt < new Date()
    ) {
      return NextResponse.json({ shareUrl: null, expired: true });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const shareUrl = `${baseUrl}/prepare/${intelligence.shareToken}`;

    return NextResponse.json({
      shareUrl,
      shareToken: intelligence.shareToken,
      expiresAt: intelligence.shareExpiresAt,
    });
  } catch (error) {
    console.error("[IntelligenceShare] GET Error:", error);
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
          shareExpiresAt: expiresAt,
        },
      });
    } else {
      intelligence = await db.processIntelligence.update({
        where: { id: intelligence.id },
        data: { shareExpiresAt: expiresAt },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const shareUrl = `${baseUrl}/prepare/${intelligence.shareToken}`;

    return NextResponse.json({
      shareUrl,
      shareToken: intelligence.shareToken,
      expiresAt: intelligence.shareExpiresAt,
    });
  } catch (error) {
    console.error("[IntelligenceShare] POST Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

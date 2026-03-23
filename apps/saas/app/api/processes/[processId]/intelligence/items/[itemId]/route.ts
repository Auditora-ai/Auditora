import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ processId: string; itemId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
      query: { disableCookieCache: true },
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await params;
    const body = await request.json();
    const { resolution, status } = body;

    const item = await db.intelligenceItem.update({
      where: { id: itemId },
      data: {
        ...(resolution !== undefined && { resolution }),
        ...(status !== undefined && { status }),
        ...(status === "RESOLVED" && {
          resolvedAt: new Date(),
          resolvedBy: `manual:${session.user.id}`,
        }),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error("[IntelligenceItem] PATCH Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ processId: string; itemId: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
      query: { disableCookieCache: true },
    });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { itemId } = await params;

    await db.intelligenceItem.update({
      where: { id: itemId },
      data: { status: "SUPERSEDED" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[IntelligenceItem] DELETE Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

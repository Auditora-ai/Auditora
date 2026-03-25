import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireProcessAuth, isAuthError } from "@/lib/auth-helpers";

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ processId: string; itemId: string }> },
) {
  try {
    const { processId, itemId } = await params;

    const authResult = await requireProcessAuth(processId);
    if (isAuthError(authResult)) return authResult;

    const body = await request.json();
    const { resolution, status } = body;

    const item = await db.intelligenceItem.update({
      where: { id: itemId },
      data: {
        ...(resolution !== undefined && { resolution }),
        ...(status !== undefined && { status }),
        ...(status === "RESOLVED" && {
          resolvedAt: new Date(),
          resolvedBy: `manual:${authResult.authCtx.user.id}`,
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
    const { processId, itemId } = await params;

    const authResult = await requireProcessAuth(processId);
    if (isAuthError(authResult)) return authResult;

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

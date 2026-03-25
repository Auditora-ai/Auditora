import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireProcessAuth, isAuthError } from "@/lib/auth-helpers";

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      processId: string;
      riskId: string;
      mitigationId: string;
    }>;
  },
) {
  try {
    const { processId, mitigationId } = await params;

    const authResult = await requireProcessAuth(processId);
    if (isAuthError(authResult)) return authResult;

    const body = await request.json();

    const data: Record<string, unknown> = {};

    if (body.status !== undefined) data.status = body.status;
    if (body.notes !== undefined) data.notes = body.notes;
    if (body.owner !== undefined) data.owner = body.owner;
    if (body.action !== undefined) data.action = body.action;
    if (body.deadline !== undefined) {
      data.deadline = body.deadline ? new Date(body.deadline) : null;
    }
    if (body.completedAt !== undefined) {
      data.completedAt = body.completedAt ? new Date(body.completedAt) : null;
    }

    // Auto-set completedAt when status changes to COMPLETED
    if (body.status === "COMPLETED" && !body.completedAt) {
      data.completedAt = new Date();
    }

    const mitigation = await db.riskMitigation.update({
      where: { id: mitigationId },
      data,
    });

    return NextResponse.json(mitigation);
  } catch (error) {
    console.error("[Mitigation] PATCH Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      processId: string;
      riskId: string;
      mitigationId: string;
    }>;
  },
) {
  try {
    const { processId, mitigationId } = await params;

    const authResult = await requireProcessAuth(processId);
    if (isAuthError(authResult)) return authResult;

    await db.riskMitigation.delete({
      where: { id: mitigationId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Mitigation] DELETE Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

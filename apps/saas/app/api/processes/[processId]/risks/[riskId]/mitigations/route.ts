import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";

async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
    query: { disableCookieCache: true },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ processId: string; riskId: string }> },
) {
  try {
    const { riskId } = await params;

    const mitigations = await db.riskMitigation.findMany({
      where: { riskId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ mitigations });
  } catch (error) {
    console.error("[Mitigations] GET Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ processId: string; riskId: string }> },
) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { riskId } = await params;
    const body = await request.json();

    if (!body.action) {
      return NextResponse.json(
        { error: "action is required" },
        { status: 400 },
      );
    }

    // Verify risk exists
    const risk = await db.processRisk.findUnique({
      where: { id: riskId },
      select: { id: true },
    });

    if (!risk) {
      return NextResponse.json({ error: "Risk not found" }, { status: 404 });
    }

    const mitigation = await db.riskMitigation.create({
      data: {
        riskId,
        action: body.action,
        owner: body.owner || null,
        deadline: body.deadline ? new Date(body.deadline) : null,
        status: body.status || "PLANNED",
        notes: body.notes || null,
      },
    });

    return NextResponse.json(mitigation, { status: 201 });
  } catch (error) {
    console.error("[Mitigations] POST Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

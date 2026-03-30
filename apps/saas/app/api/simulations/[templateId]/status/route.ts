import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { getAuthContext } from "@/lib/auth-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> },
) {
  try {
    const authCtx = await getAuthContext();
    if (!authCtx) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { templateId } = await params;

    const template = await db.simulationTemplate.findUnique({
      where: { id: templateId },
      select: {
        status: true,
        title: true,
        organizationId: true,
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (template.organizationId !== authCtx.org.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      status: template.status,
      title: template.title,
    });
  } catch (error) {
    console.error("[GET /api/simulations/[templateId]/status]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

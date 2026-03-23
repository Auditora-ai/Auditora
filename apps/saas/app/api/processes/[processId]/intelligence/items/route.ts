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
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "OPEN";
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const intelligence = await db.processIntelligence.findFirst({
      where: { processDefinition: { id: processId } },
      select: { id: true },
    });

    if (!intelligence) {
      return NextResponse.json({ items: [], total: 0 });
    }

    const where = {
      intelligenceId: intelligence.id,
      ...(status && { status: status as "OPEN" | "RESOLVED" | "SUPERSEDED" }),
      ...(category && { category: category as Parameters<typeof db.intelligenceItem.findMany>[0] extends { where?: infer W } ? W extends { category?: infer C } ? C : never : never }),
    };

    const [items, total] = await Promise.all([
      db.intelligenceItem.findMany({
        where,
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.intelligenceItem.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, limit });
  } catch (error) {
    console.error("[IntelligenceItems] GET Error:", error);
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
    const body = await request.json();
    const { question, category, context, priority } = body;

    if (!question || !category) {
      return NextResponse.json(
        { error: "question and category are required" },
        { status: 400 },
      );
    }

    // Find or create intelligence record
    let intelligence = await db.processIntelligence.findFirst({
      where: { processDefinition: { id: processId } },
    });

    if (!intelligence) {
      intelligence = await db.processIntelligence.create({
        data: { processDefinitionId: processId },
      });
    }

    const item = await db.intelligenceItem.create({
      data: {
        intelligenceId: intelligence.id,
        category,
        question,
        context: context || null,
        priority: priority || 50,
        dependsOn: [],
        sourceType: "manual",
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("[IntelligenceItems] POST Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

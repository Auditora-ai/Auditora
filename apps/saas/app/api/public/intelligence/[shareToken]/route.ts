import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> },
) {
  try {
    const { shareToken } = await params;

    const intelligence = await db.processIntelligence.findUnique({
      where: { shareToken },
      include: {
        processDefinition: {
          select: {
            name: true,
            description: true,
            architecture: {
              select: {
                organization: {
                  select: { name: true, logo: true },
                },
              },
            },
          },
        },
        items: {
          where: { status: "OPEN" },
          select: {
            id: true,
            category: true,
            question: true,
            context: true,
            priority: true,
          },
          orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        },
      },
    });

    if (!intelligence) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check expiry
    if (
      intelligence.shareExpiresAt &&
      intelligence.shareExpiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: "This link has expired" },
        { status: 410 },
      );
    }

    return NextResponse.json({
      processName: intelligence.processDefinition.name,
      processDescription: intelligence.processDefinition.description,
      organizationName:
        intelligence.processDefinition.architecture?.organization?.name,
      organizationLogo:
        intelligence.processDefinition.architecture?.organization?.logo,
      questions: intelligence.items,
      completenessScore: intelligence.completenessScore,
    });
  } catch (error) {
    console.error("[PublicIntelligence] GET Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ shareToken: string }> },
) {
  try {
    const { shareToken } = await params;

    const intelligence = await db.processIntelligence.findUnique({
      where: { shareToken },
      select: { id: true, shareExpiresAt: true },
    });

    if (!intelligence) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Check expiry
    if (
      intelligence.shareExpiresAt &&
      intelligence.shareExpiresAt < new Date()
    ) {
      return NextResponse.json(
        { error: "This link has expired" },
        { status: 410 },
      );
    }

    const body = await request.json();
    const { answers } = body as {
      answers: Array<{
        itemId: string;
        answer: string;
        respondentName?: string;
      }>;
    };

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: "answers array is required" },
        { status: 400 },
      );
    }

    // Rate limit: max 30 answers per hour per token
    if (answers.length > 30) {
      return NextResponse.json(
        { error: "Maximum 30 answers per request" },
        { status: 429 },
      );
    }

    // Sanitize and save answers
    const results = [];
    for (const { itemId, answer, respondentName } of answers) {
      // Basic XSS sanitization
      const sanitizedAnswer = answer
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .substring(0, 5000);

      const sanitizedName = respondentName
        ? respondentName
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .substring(0, 100)
        : "Client";

      try {
        const updated = await db.intelligenceItem.update({
          where: {
            id: itemId,
            intelligenceId: intelligence.id,
            status: "OPEN",
          },
          data: {
            resolution: sanitizedAnswer,
            status: "RESOLVED",
            resolvedAt: new Date(),
            resolvedBy: `client_answer:${sanitizedName}`,
          },
        });
        results.push({ itemId, success: true });
      } catch {
        // Item not found or already resolved
        results.push({ itemId, success: false, reason: "not_found_or_resolved" });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("[PublicIntelligence] POST Error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

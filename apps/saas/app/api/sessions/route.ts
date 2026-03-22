/**
 * Session Management API
 *
 * POST /api/sessions — Create a new meeting session and join the call
 * GET  /api/sessions — List sessions for the current user's organization
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { createCallBotProvider } from "@repo/ai/src/providers/call-bot";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { meetingUrl, projectId, sessionType, processDefinitionId } = body;

    if (!meetingUrl || !projectId || !sessionType) {
      return NextResponse.json(
        { error: "meetingUrl, projectId, and sessionType are required" },
        { status: 400 },
      );
    }

    // TODO: Get authenticated user from better-auth session
    // For now, use a placeholder
    const userId = "placeholder-user-id";

    // Create session in DB
    const session = await db.meetingSession.create({
      data: {
        type: sessionType,
        status: "CONNECTING",
        meetingUrl,
        projectId,
        processDefinitionId: processDefinitionId || null,
        userId,
      },
    });

    // Join the meeting via call bot
    try {
      const callBot = createCallBotProvider();
      const { botId } = await callBot.joinMeeting(meetingUrl);

      await db.meetingSession.update({
        where: { id: session.id },
        data: {
          recallBotId: botId,
          recallBotStatus: "joining",
          status: "CONNECTING",
        },
      });

      return NextResponse.json({
        sessionId: session.id,
        botId,
        shareToken: session.shareToken,
        status: "connecting",
      });
    } catch (botError) {
      // Bot failed to join — update session status
      await db.meetingSession.update({
        where: { id: session.id },
        data: {
          status: "FAILED",
          recallBotStatus: `error: ${botError instanceof Error ? botError.message : "unknown"}`,
        },
      });

      return NextResponse.json(
        {
          error: "Failed to join meeting",
          detail: botError instanceof Error ? botError.message : "Unknown error",
          sessionId: session.id,
        },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("[Sessions API] Error creating session:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // TODO: Get authenticated user's organization
    const searchParams = request.nextUrl.searchParams;
    const projectId = searchParams.get("projectId");

    const where: any = {};
    if (projectId) where.projectId = projectId;

    const sessions = await db.meetingSession.findMany({
      where,
      include: {
        project: { include: { client: true } },
        processDefinition: true,
        _count: { select: { diagramNodes: true, transcriptEntries: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("[Sessions API] Error listing sessions:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

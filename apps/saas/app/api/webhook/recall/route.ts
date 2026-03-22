/**
 * Recall.ai Webhook Handler
 *
 * Receives real-time transcription events from Recall.ai and:
 * 1. Parses the transcription event
 * 2. Stores the transcript entry in the database
 * 3. Triggers the AI process extraction pipeline
 * 4. Broadcasts diagram updates via Supabase Realtime
 *
 * Pipeline:
 *   Recall.ai → [This Webhook] → DB + AI Pipeline → Supabase Broadcast → Browser
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { RecallTranscriptionProvider } from "@repo/ai/src/providers/stt";
import { extractProcessUpdates } from "@repo/ai/src/pipelines/process-extraction";
import type { BpmnNode } from "@repo/ai/src/pipelines/process-extraction";
import { generateNextQuestion } from "@repo/ai/src/pipelines/teleprompter";

const sttProvider = new RecallTranscriptionProvider();

// Track last extraction time per session to avoid calling LLM too frequently
const lastExtractionTime = new Map<string, number>();
const EXTRACTION_INTERVAL_MS = 10_000; // Run extraction every 10 seconds max

// Track last teleprompter time per session
const lastTeleprompterTime = new Map<string, number>();
const TELEPROMPTER_INTERVAL_MS = 25_000; // Run teleprompter every 25 seconds max

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    // Parse transcription event
    const event = sttProvider.parseWebhookEvent(payload);
    if (!event || !event.text.trim()) {
      return NextResponse.json({ ok: true });
    }

    // Find the session by recall bot ID
    const botId = (payload as any)?.data?.bot_id;
    if (!botId) {
      return NextResponse.json({ error: "Missing bot_id" }, { status: 400 });
    }

    const session = await db.meetingSession.findFirst({
      where: { recallBotId: botId, status: "ACTIVE" },
      select: { id: true, type: true, processDefinition: { select: { name: true } } },
    });

    if (!session) {
      console.warn(`[Webhook] No active session for bot ${botId}`);
      return NextResponse.json({ ok: true });
    }

    // Store transcript entry
    await db.transcriptEntry.create({
      data: {
        sessionId: session.id,
        speaker: event.speaker,
        text: event.text,
        timestamp: event.timestamp,
        confidence: event.confidence,
      },
    });

    // Check if we should run extraction (throttled)
    const now = Date.now();
    const lastExtraction = lastExtractionTime.get(session.id) || 0;

    if (now - lastExtraction >= EXTRACTION_INTERVAL_MS) {
      lastExtractionTime.set(session.id, now);

      // Run extraction in background (don't block webhook response)
      runExtractionPipeline(session.id).catch((err) =>
        console.error("[Webhook] Extraction pipeline error:", err)
      );
    }

    // Check if we should run teleprompter (throttled, less frequent)
    const lastTeleprompter = lastTeleprompterTime.get(session.id) || 0;

    if (now - lastTeleprompter >= TELEPROMPTER_INTERVAL_MS) {
      lastTeleprompterTime.set(session.id, now);

      runTeleprompterPipeline(
        session.id,
        session.type as "DISCOVERY" | "DEEP_DIVE",
        session.processDefinition?.name,
      ).catch((err) =>
        console.error("[Webhook] Teleprompter pipeline error:", err)
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[Webhook] Error processing recall event:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

/**
 * Run the process extraction pipeline for a session.
 * Fetches recent transcript, current nodes, calls LLM, stores results.
 */
async function runExtractionPipeline(sessionId: string) {
  // Fetch recent transcript (last 5 minutes)
  const recentTranscript = await db.transcriptEntry.findMany({
    where: { sessionId },
    orderBy: { timestamp: "desc" },
    take: 100, // Last 100 entries ~= 5 min of conversation
  });

  // Fetch current diagram nodes
  const currentNodes = await db.diagramNode.findMany({
    where: { sessionId, state: { not: "REJECTED" } },
  });

  const bpmnNodes: BpmnNode[] = currentNodes.map((n) => ({
    id: n.id,
    type: n.nodeType.toLowerCase().replace(/_/g, "") as any,
    label: n.label,
    state: n.state.toLowerCase() as any,
    lane: n.lane || undefined,
    connections: n.connections,
    positionX: n.positionX,
    positionY: n.positionY,
  }));

  const transcriptEntries = recentTranscript.reverse().map((t) => ({
    speaker: t.speaker,
    text: t.text,
    timestamp: t.timestamp,
  }));

  // Call LLM for extraction
  const result = await extractProcessUpdates(bpmnNodes, transcriptEntries);

  // Store new nodes
  for (const newNode of result.newNodes) {
    const nodeType = newNode.type.toUpperCase().replace(/([A-Z])/g, "_$1").replace(/^_/, "") as any;

    // Auto-position: stack vertically with offset
    const posX = 200 + currentNodes.length * 180;
    const posY = 200;

    await db.diagramNode.create({
      data: {
        sessionId,
        nodeType: nodeType in ["START_EVENT", "END_EVENT", "TASK", "EXCLUSIVE_GATEWAY", "PARALLEL_GATEWAY"]
          ? nodeType
          : "TASK",
        label: newNode.label,
        state: "FORMING",
        lane: newNode.lane,
        positionX: posX,
        positionY: posY,
        connections: newNode.connectTo ? [newNode.connectTo] : [],
      },
    });
  }

  // TODO: Broadcast updates via Supabase Realtime
  // supabase.channel(`session:${sessionId}`).send({ type: 'broadcast', event: 'diagram_update', payload: result })
}

/**
 * Run the teleprompter pipeline for a session.
 */
async function runTeleprompterPipeline(
  sessionId: string,
  sessionType: "DISCOVERY" | "DEEP_DIVE",
  processName?: string,
) {
  const recentTranscript = await db.transcriptEntry.findMany({
    where: { sessionId },
    orderBy: { timestamp: "desc" },
    take: 100,
  });

  const currentNodes = await db.diagramNode.findMany({
    where: { sessionId, state: { not: "REJECTED" } },
  });

  const result = await generateNextQuestion(
    sessionType,
    currentNodes.map((n) => ({
      id: n.id,
      type: n.nodeType.toLowerCase(),
      label: n.label,
      lane: n.lane || undefined,
      connections: n.connections,
    })),
    recentTranscript.reverse().map((t) => ({
      speaker: t.speaker,
      text: t.text,
      timestamp: t.timestamp,
    })),
    processName,
  );

  // Log the question
  await db.teleprompterLog.create({
    data: {
      sessionId,
      question: result.nextQuestion,
    },
  });

  // TODO: Broadcast via Supabase Realtime
  // supabase.channel(`session:${sessionId}`).send({ type: 'broadcast', event: 'teleprompter_update', payload: result })
}

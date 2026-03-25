import { NextRequest, NextResponse } from "next/server";
import { extractFromChat } from "@repo/ai";

// In-memory rate limiting
const ipRequests = new Map<string, { count: number; resetAt: number }>();
const MAX_MESSAGES_PER_SESSION = 3;
const MAX_REQUESTS_PER_HOUR = 10;

// Daily cost tracking
let dailyCost = 0;
let dailyCostResetAt = Date.now() + 86400000;
const DAILY_COST_CAP = 10;
const COST_PER_CALL = 0.01;

// Kill switch
const isDisabled = process.env.DISABLE_PUBLIC_EXTRACTION === "true";

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequests.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + 3600000 });
    return true;
  }
  if (entry.count >= MAX_REQUESTS_PER_HOUR) return false;
  entry.count++;
  return true;
}

function checkDailyCost(): boolean {
  const now = Date.now();
  if (now > dailyCostResetAt) {
    dailyCost = 0;
    dailyCostResetAt = now + 86400000;
  }
  return dailyCost < DAILY_COST_CAP;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/**
 * Minimal BPMN 2.0 XML generator — creates a simple left-to-right flow
 * from extracted process steps. Valid XML that bpmn-js Viewer can render.
 */
function buildMinimalBpmnXml(
  processes: Array<{ name: string; description?: string; category?: string }>,
): string {
  if (processes.length === 0) return "";

  const TASK_W = 120;
  const TASK_H = 60;
  const EVENT_SIZE = 36;
  const X_GAP = 60;
  const Y = 150;
  const START_X = 50;

  const elements: string[] = [];
  const flows: string[] = [];
  const shapes: string[] = [];
  const edges: string[] = [];

  let x = START_X;
  const nodeIds: string[] = [];

  // Start Event
  const startId = "StartEvent_1";
  elements.push(`      <bpmn:startEvent id="${startId}" name="Start" />`);
  shapes.push(`      <bpmndi:BPMNShape id="${startId}_di" bpmnElement="${startId}">
        <dc:Bounds x="${x}" y="${Y - EVENT_SIZE / 2}" width="${EVENT_SIZE}" height="${EVENT_SIZE}" />
      </bpmndi:BPMNShape>`);
  nodeIds.push(startId);
  x += EVENT_SIZE + X_GAP;

  // Task nodes for each process
  processes.forEach((p, i) => {
    const id = `Task_${i + 1}`;
    elements.push(`      <bpmn:task id="${id}" name="${esc(p.name)}" />`);
    shapes.push(`      <bpmndi:BPMNShape id="${id}_di" bpmnElement="${id}">
        <dc:Bounds x="${x}" y="${Y - TASK_H / 2}" width="${TASK_W}" height="${TASK_H}" />
      </bpmndi:BPMNShape>`);
    nodeIds.push(id);
    x += TASK_W + X_GAP;
  });

  // End Event
  const endId = "EndEvent_1";
  elements.push(`      <bpmn:endEvent id="${endId}" name="End" />`);
  shapes.push(`      <bpmndi:BPMNShape id="${endId}_di" bpmnElement="${endId}">
        <dc:Bounds x="${x}" y="${Y - EVENT_SIZE / 2}" width="${EVENT_SIZE}" height="${EVENT_SIZE}" />
      </bpmndi:BPMNShape>`);
  nodeIds.push(endId);

  // Sequence flows connecting all nodes
  for (let i = 0; i < nodeIds.length - 1; i++) {
    const flowId = `Flow_${i + 1}`;
    const srcId = nodeIds[i];
    const tgtId = nodeIds[i + 1];
    flows.push(`      <bpmn:sequenceFlow id="${flowId}" sourceRef="${srcId}" targetRef="${tgtId}" />`);

    // Calculate edge waypoints
    const srcIsEvent = srcId.includes("Event");
    const tgtIsEvent = tgtId.includes("Event");
    const srcRight = START_X + (srcIsEvent ? EVENT_SIZE : 0) + i * (TASK_W + X_GAP) + (srcIsEvent ? 0 : TASK_W);
    const tgtLeft = START_X + (i + 1) * (TASK_W + X_GAP) - (i === 0 ? TASK_W + X_GAP - EVENT_SIZE : 0);
    // Simplified: use nodeIds index to calculate x
    let sx = START_X;
    for (let j = 0; j <= i; j++) {
      if (j === 0) sx += EVENT_SIZE;
      else sx += TASK_W;
      if (j < i) sx += X_GAP;
    }
    let tx = sx + X_GAP;
    if (i === nodeIds.length - 2 && tgtIsEvent) {
      // tx already correct
    }

    edges.push(`      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${sx}" y="${Y}" />
        <di:waypoint x="${tx}" y="${Y}" />
      </bpmndi:BPMNEdge>`);
  }

  // Add outgoing/incoming refs to elements
  const elementLines = elements.map((el, i) => {
    const id = nodeIds[i];
    const outgoing = i < nodeIds.length - 1 ? `\n        <bpmn:outgoing>Flow_${i + 1}</bpmn:outgoing>` : "";
    const incoming = i > 0 ? `\n        <bpmn:incoming>Flow_${i}</bpmn:incoming>` : "";
    return el.replace(" />", `>${incoming}${outgoing}\n      ${el.includes("task") ? "</bpmn:task>" : el.includes("startEvent") ? "</bpmn:startEvent>" : "</bpmn:endEvent>"}`);
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
${elementLines.join("\n")}
${flows.join("\n")}
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
${shapes.join("\n")}
${edges.join("\n")}
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

export async function POST(request: NextRequest) {
  if (isDisabled) {
    return NextResponse.json(
      { error: "This feature is temporarily unavailable." },
      { status: 503 },
    );
  }

  if (!checkDailyCost()) {
    return NextResponse.json(
      { error: "Service temporarily unavailable. Try again tomorrow." },
      { status: 503 },
    );
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait." },
      { status: 429 },
    );
  }

  const userAgent = request.headers.get("user-agent");
  if (!userAgent) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const messages: Array<{ role: string; content: string }> =
      body.messages || [];

    if (messages.length === 0) {
      return NextResponse.json(
        { error: "No messages provided." },
        { status: 400 },
      );
    }

    if (messages.length > MAX_MESSAGES_PER_SESSION) {
      return NextResponse.json({
        requiresSignup: true,
        summary: "Sign up to continue extracting processes.",
      });
    }

    const lastMessage = messages[messages.length - 1];
    if (
      !lastMessage?.content ||
      lastMessage.content.length < 10 ||
      lastMessage.content.length > 500
    ) {
      return NextResponse.json(
        { error: "Message must be between 10 and 500 characters." },
        { status: 400 },
      );
    }

    const sanitized = messages.map((m) => ({
      role: m.role || "user",
      content: m.content.replace(/<[^>]*>/g, "").trim(),
    }));

    const result = await extractFromChat("public", sanitized, []);
    dailyCost += COST_PER_CALL;

    const processes = result.extractedProcesses.map((p) => ({
      name: p.name,
      description: p.description || "",
      category: p.suggestedCategory,
    }));

    // Generate BPMN XML from extracted processes
    const bpmnXml = buildMinimalBpmnXml(processes);

    return NextResponse.json(
      {
        processes,
        bpmnXml,
        followUpQuestion: result.followUpQuestion || null,
        response: result.conversationalResponse,
        messagesRemaining: MAX_MESSAGES_PER_SESSION - messages.length,
      },
      {
        headers: { "Access-Control-Allow-Origin": "*" },
      },
    );
  } catch {
    return NextResponse.json(
      {
        processes: [],
        bpmnXml: "",
        response: "Could not extract processes. Try rephrasing your description.",
        followUpQuestion: null,
        messagesRemaining: MAX_MESSAGES_PER_SESSION,
      },
      { status: 200 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

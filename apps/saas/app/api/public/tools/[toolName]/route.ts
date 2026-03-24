import { NextRequest, NextResponse } from "next/server";
import {
  extractFromChat,
  extractSipoc,
  scoreComplexity,
  convertBpmnToText,
  generateRaci,
} from "@repo/ai";

// ── Rate limiting ──────────────────────────────────────────────
const ipRequests = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_HOUR = 5;

let dailyCost = 0;
let dailyCostResetAt = Date.now() + 86400000;
const DAILY_COST_CAP = 20;

const TOOL_COSTS: Record<string, number> = {
  "bpmn-generator": 0.03,
  "sipoc-generator": 0.02,
  "raci-generator": 0.05,
  "process-audit": 0.07,
  "meeting-to-process": 0.04,
  "process-complexity": 0.01,
  "bpmn-to-text": 0.02,
};

const isDisabled = process.env.DISABLE_PUBLIC_TOOLS === "true";
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_MARKETING_URL || "*";

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

function sanitize(s: string): string {
  return s.replace(/<[^>]*>/g, "").trim();
}

// ── BPMN XML builder (reused from try-extraction) ──────────────
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildMinimalBpmnXml(
  processes: Array<{ name: string }>,
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

  const startId = "StartEvent_1";
  elements.push(`      <bpmn:startEvent id="${startId}" name="Start" />`);
  shapes.push(`      <bpmndi:BPMNShape id="${startId}_di" bpmnElement="${startId}">
        <dc:Bounds x="${x}" y="${Y - EVENT_SIZE / 2}" width="${EVENT_SIZE}" height="${EVENT_SIZE}" />
      </bpmndi:BPMNShape>`);
  nodeIds.push(startId);
  x += EVENT_SIZE + X_GAP;

  processes.forEach((p, i) => {
    const id = `Task_${i + 1}`;
    elements.push(
      `      <bpmn:task id="${id}" name="${esc(p.name)}" />`,
    );
    shapes.push(`      <bpmndi:BPMNShape id="${id}_di" bpmnElement="${id}">
        <dc:Bounds x="${x}" y="${Y - TASK_H / 2}" width="${TASK_W}" height="${TASK_H}" />
      </bpmndi:BPMNShape>`);
    nodeIds.push(id);
    x += TASK_W + X_GAP;
  });

  const endId = "EndEvent_1";
  elements.push(`      <bpmn:endEvent id="${endId}" name="End" />`);
  shapes.push(`      <bpmndi:BPMNShape id="${endId}_di" bpmnElement="${endId}">
        <dc:Bounds x="${x}" y="${Y - EVENT_SIZE / 2}" width="${EVENT_SIZE}" height="${EVENT_SIZE}" />
      </bpmndi:BPMNShape>`);
  nodeIds.push(endId);

  for (let i = 0; i < nodeIds.length - 1; i++) {
    const flowId = `Flow_${i + 1}`;
    flows.push(
      `      <bpmn:sequenceFlow id="${flowId}" sourceRef="${nodeIds[i]}" targetRef="${nodeIds[i + 1]}" />`,
    );
    let sx = START_X;
    for (let j = 0; j <= i; j++) {
      sx += j === 0 ? EVENT_SIZE : TASK_W;
      if (j < i) sx += X_GAP;
    }
    const tx = sx + X_GAP;
    edges.push(`      <bpmndi:BPMNEdge id="${flowId}_di" bpmnElement="${flowId}">
        <di:waypoint x="${sx}" y="${Y}" />
        <di:waypoint x="${tx}" y="${Y}" />
      </bpmndi:BPMNEdge>`);
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_1"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
${elements.join("\n")}
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

// ── Tool handlers ──────────────────────────────────────────────

const VALID_TOOLS = [
  "bpmn-generator",
  "sipoc-generator",
  "raci-generator",
  "process-audit",
  "meeting-to-process",
  "process-complexity",
  "bpmn-to-text",
] as const;

type ToolName = (typeof VALID_TOOLS)[number];

async function handleBpmnGenerator(input: string) {
  const result = await extractFromChat(
    [{ role: "user", content: input }],
    [],
  );
  const processes = result.extractedProcesses.map((p) => ({
    name: p.name,
    description: p.description || "",
    category: p.suggestedCategory,
    owner: p.owner || "",
    triggers: p.triggers,
    outputs: p.outputs,
  }));
  const bpmnXml = buildMinimalBpmnXml(processes);
  return { type: "bpmn" as const, processes, bpmnXml };
}

async function handleSipocGenerator(input: string) {
  const result = await extractSipoc(input);
  return { type: "sipoc" as const, ...result };
}

async function handleRaciGenerator(input: string) {
  // Step 1: Extract structure from text
  const extraction = await extractFromChat(
    [{ role: "user", content: input }],
    [],
  );
  const lanes = extraction.extractedProcesses
    .map((p) => p.owner)
    .filter((o): o is string => !!o);
  const tasks = extraction.extractedProcesses.map((p) => p.name);

  if (lanes.length === 0 || tasks.length === 0) {
    // Fallback: generate RACI directly from text
    const directResult = await generateRaci(
      ["Process Owner", "Executor", "Reviewer"],
      tasks.length > 0
        ? tasks
        : ["Step 1", "Step 2", "Step 3"],
      input,
    );
    return { type: "raci" as const, ...directResult, processes: extraction.extractedProcesses };
  }

  // Step 2: Feed to RACI pipeline
  const result = await generateRaci(lanes, tasks, input);
  return { type: "raci" as const, ...result, processes: extraction.extractedProcesses };
}

async function handleProcessAudit(input: string) {
  // Use complexity score as a lightweight audit alternative for the free tool
  const complexity = await scoreComplexity(input);
  // Extract processes for additional context
  const extraction = await extractFromChat(
    [{ role: "user", content: input }],
    [],
  );
  return {
    type: "audit" as const,
    complexity,
    processes: extraction.extractedProcesses,
    processCount: extraction.extractedProcesses.length,
  };
}

async function handleMeetingToProcess(input: string) {
  // Same as BPMN generator but optimized for transcript-style input
  const result = await extractFromChat(
    [{ role: "user", content: input }],
    [],
  );
  const processes = result.extractedProcesses.map((p) => ({
    name: p.name,
    description: p.description || "",
    category: p.suggestedCategory,
    owner: p.owner || "",
    triggers: p.triggers,
    outputs: p.outputs,
  }));
  const bpmnXml = buildMinimalBpmnXml(processes);
  return { type: "bpmn" as const, processes, bpmnXml };
}

async function handleComplexity(input: string) {
  const result = await scoreComplexity(input);
  return { type: "complexity" as const, ...result };
}

async function handleBpmnToText(input: string) {
  const result = await convertBpmnToText(input);
  return { type: "bpmn-to-text" as const, ...result };
}

// ── Route handler ──────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ toolName: string }> },
) {
  if (isDisabled) {
    return NextResponse.json(
      { error: "Tools are temporarily unavailable." },
      { status: 503 },
    );
  }

  if (!checkDailyCost()) {
    return NextResponse.json(
      { error: "High demand — tools temporarily unavailable. Try again later." },
      { status: 503 },
    );
  }

  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        error: "You've reached the limit. Sign up for unlimited access.",
        requiresSignup: true,
      },
      { status: 429 },
    );
  }

  const userAgent = request.headers.get("user-agent");
  if (!userAgent) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { toolName } = await params;

  if (!VALID_TOOLS.includes(toolName as ToolName)) {
    return NextResponse.json({ error: "Unknown tool." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const rawInput: string = body.input || body.text || "";

    if (toolName !== "bpmn-to-text" && (rawInput.length < 20 || rawInput.length > 3000)) {
      return NextResponse.json(
        { error: "Input must be between 20 and 3000 characters." },
        { status: 400 },
      );
    }

    if (toolName === "bpmn-to-text" && (rawInput.length < 50 || rawInput.length > 50000)) {
      return NextResponse.json(
        { error: "BPMN XML must be between 50 and 50000 characters." },
        { status: 400 },
      );
    }

    const input = sanitize(rawInput);

    let result;
    switch (toolName as ToolName) {
      case "bpmn-generator":
        result = await handleBpmnGenerator(input);
        break;
      case "sipoc-generator":
        result = await handleSipocGenerator(input);
        break;
      case "raci-generator":
        result = await handleRaciGenerator(input);
        break;
      case "process-audit":
        result = await handleProcessAudit(input);
        break;
      case "meeting-to-process":
        result = await handleMeetingToProcess(input);
        break;
      case "process-complexity":
        result = await handleComplexity(input);
        break;
      case "bpmn-to-text":
        result = await handleBpmnToText(input);
        break;
    }

    dailyCost += TOOL_COSTS[toolName] || 0.03;

    return NextResponse.json(result, {
      headers: { "Access-Control-Allow-Origin": ALLOWED_ORIGIN },
    });
  } catch (err) {
    console.error(`[tools/${toolName}] Error:`, err);
    return NextResponse.json(
      { error: "Processing failed. Try rephrasing or simplifying your input." },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

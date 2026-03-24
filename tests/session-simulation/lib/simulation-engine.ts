/**
 * Simulation Engine
 *
 * Core replay loop that feeds transcript chunks through the real AI pipelines,
 * respecting the production 15s/30s throttle intervals.
 *
 * Runs sequentially by default (no real-time delays) for reproducible timing.
 * Use --realtime for production-like parallel execution with actual delays.
 */

import type { TranscriptChunk } from "./transcript-parser";
import { TimingRecorder, type TimingEvent, type TimingSummary } from "./timing-recorder";
import type { SessionContext } from "../../../packages/ai/src/context/session-context";
import type {
  BpmnNode,
  ExtractionResult,
} from "../../../packages/ai/src/pipelines/process-extraction";
import type { TeleprompterResult } from "../../../packages/ai/src/pipelines/teleprompter";

export interface SimulationConfig {
  transcriptChunks: TranscriptChunk[];
  context: SessionContext;
  sessionType: "DISCOVERY" | "DEEP_DIVE" | "CONTINUATION";
  processName?: string;
  extractionIntervalSec: number;
  teleprompterIntervalSec: number;
  realTimeMode: boolean;
}

export interface CycleResult {
  cycle: number;
  timestampSec: number;
  extraction?: {
    durationMs: number;
    newNodes: number;
    updatedNodes: number;
    outOfScope: number;
    inputTokens: number;
    outputTokens: number;
  };
  teleprompter?: {
    durationMs: number;
    question: string;
    gapType: string;
    confidence: number;
    inputTokens: number;
    outputTokens: number;
  };
}

export interface SimulationResult {
  cycles: CycleResult[];
  timingEvents: TimingEvent[];
  summaries: TimingSummary[];
  finalNodes: BpmnNode[];
  totalCost: number;
  totalDurationMs: number;
  transcriptDurationSec: number;
}

// Token usage captured via generateText monkey-patch
let lastUsage: { promptTokens: number; completionTokens: number } | null = null;

export function setLastUsage(usage: { promptTokens: number; completionTokens: number } | null) {
  lastUsage = usage;
}

function consumeUsage(): { inputTokens: number; outputTokens: number } {
  if (!lastUsage) return { inputTokens: 0, outputTokens: 0 };
  const result = {
    inputTokens: lastUsage.promptTokens,
    outputTokens: lastUsage.completionTokens,
  };
  lastUsage = null;
  return result;
}

/**
 * Run the full session simulation.
 *
 * @param config - Simulation configuration
 * @param extractFn - The extractProcessUpdates function (injected to avoid import issues)
 * @param teleprompterFn - The generateNextQuestion function (injected)
 */
export async function runSimulation(
  config: SimulationConfig,
  extractFn: (
    currentNodes: BpmnNode[],
    transcript: TranscriptChunk[],
    context?: SessionContext
  ) => Promise<ExtractionResult>,
  teleprompterFn: (
    sessionType: "DISCOVERY" | "DEEP_DIVE" | "CONTINUATION",
    currentNodes: Array<{ id: string; type: string; label: string; lane?: string; connections: string[] }>,
    transcript: TranscriptChunk[],
    processName?: string,
    context?: SessionContext
  ) => Promise<TeleprompterResult>
): Promise<SimulationResult> {
  const recorder = new TimingRecorder();
  const cycles: CycleResult[] = [];
  const currentNodes: BpmnNode[] = [];
  let nodeIdCounter = 0;

  const { transcriptChunks, context, extractionIntervalSec, teleprompterIntervalSec } = config;

  if (transcriptChunks.length === 0) {
    return {
      cycles: [],
      timingEvents: [],
      summaries: [],
      finalNodes: [],
      totalCost: 0,
      totalDurationMs: 0,
      transcriptDurationSec: 0,
    };
  }

  // Determine transcript time range
  const startTime = transcriptChunks[0].timestamp;
  const endTime = transcriptChunks[transcriptChunks.length - 1].timestamp;
  const transcriptDurationSec = endTime - startTime;

  // Generate extraction cycle boundaries
  const extractionBoundaries: number[] = [];
  for (
    let t = startTime + extractionIntervalSec;
    t <= endTime + extractionIntervalSec;
    t += extractionIntervalSec
  ) {
    extractionBoundaries.push(t);
  }

  const simulationStart = performance.now();
  let cycleIndex = 0;

  for (const boundary of extractionBoundaries) {
    // Accumulate transcript up to this boundary
    const accumulatedTranscript = transcriptChunks.filter(
      (c) => c.timestamp <= boundary
    );

    if (accumulatedTranscript.length === 0) continue;

    const cycleResult: CycleResult = {
      cycle: cycleIndex,
      timestampSec: boundary,
    };

    // --- Extraction ---
    const extractionLabel = `extraction (cycle ${cycleIndex}, t=${formatTime(boundary)})`;
    console.log(`\n[Cycle ${cycleIndex}] ${formatTime(boundary)} — Running extraction...`);

    const stopExtraction = recorder.startTimer("extraction", cycleIndex);
    try {
      const result = await extractFn(currentNodes, accumulatedTranscript, context);
      const usage = consumeUsage();

      const event = stopExtraction({
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        nodeCount: currentNodes.length,
        newNodesExtracted: result.newNodes.length,
        transcriptChars: accumulatedTranscript.reduce((sum, c) => sum + c.text.length, 0),
      });

      // Merge new nodes into current state
      for (const newNode of result.newNodes) {
        currentNodes.push({
          id: newNode.id || `sim_node_${nodeIdCounter++}`,
          type: newNode.type,
          label: newNode.label,
          state: "forming",
          lane: newNode.lane,
          connections: newNode.connectTo ? [newNode.connectTo] : [],
          positionX: 200 + currentNodes.length * 200,
          positionY: 200,
        });
      }

      cycleResult.extraction = {
        durationMs: event.durationMs,
        newNodes: result.newNodes.length,
        updatedNodes: result.updatedNodes.length,
        outOfScope: result.outOfScope?.length || 0,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      };

      console.log(
        `  Extraction: ${event.durationMs.toFixed(0)}ms — ` +
          `${result.newNodes.length} new nodes, ` +
          `${usage.inputTokens} in / ${usage.outputTokens} out tokens`
      );

      if (result.newNodes.length > 0) {
        for (const n of result.newNodes) {
          console.log(`    + [${n.type}] "${n.label}"${n.lane ? ` (${n.lane})` : ""}`);
        }
      }
    } catch (err) {
      stopExtraction();
      console.error(`  Extraction ERROR: ${err instanceof Error ? err.message : err}`);
    }

    // --- Teleprompter (at 30s boundaries) ---
    const isTeleprompterCycle =
      Math.floor(boundary / teleprompterIntervalSec) !==
      Math.floor((boundary - extractionIntervalSec) / teleprompterIntervalSec);

    if (isTeleprompterCycle) {
      if (config.realTimeMode) {
        // In real-time mode, run in parallel (don't await yet)
        // For simplicity in this version, still run sequentially
      }

      console.log(`  Running teleprompter...`);
      const stopTeleprompter = recorder.startTimer("teleprompter", cycleIndex);

      try {
        const nodesForTeleprompter = currentNodes.map((n) => ({
          id: n.id,
          type: n.type,
          label: n.label,
          lane: n.lane,
          connections: n.connections,
        }));

        const result = await teleprompterFn(
          config.sessionType,
          nodesForTeleprompter,
          accumulatedTranscript,
          config.processName || context.targetProcess?.name,
          context
        );
        const usage = consumeUsage();

        const event = stopTeleprompter({
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
        });

        cycleResult.teleprompter = {
          durationMs: event.durationMs,
          question: result.nextQuestion,
          gapType: result.gapType,
          confidence: result.confidence,
          inputTokens: usage.inputTokens,
          outputTokens: usage.outputTokens,
        };

        console.log(
          `  Teleprompter: ${event.durationMs.toFixed(0)}ms — ` +
            `"${result.nextQuestion.substring(0, 60)}..."`
        );
      } catch (err) {
        stopTeleprompter();
        console.error(
          `  Teleprompter ERROR: ${err instanceof Error ? err.message : err}`
        );
      }
    }

    cycles.push(cycleResult);
    cycleIndex++;

    // Real-time mode: wait for the actual interval
    if (config.realTimeMode && cycleIndex < extractionBoundaries.length) {
      const waitMs = extractionIntervalSec * 1000;
      console.log(`  [realtime] Waiting ${extractionIntervalSec}s...`);
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }

  const totalDurationMs = performance.now() - simulationStart;

  return {
    cycles,
    timingEvents: recorder.getEvents(),
    summaries: recorder.getSummaries(),
    finalNodes: currentNodes,
    totalCost: calculateCost(recorder.getEvents()),
    totalDurationMs: Math.round(totalDurationMs),
    transcriptDurationSec,
  };
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Calculate total API cost from timing events.
 * Anthropic Sonnet pricing: $3/M input, $15/M output
 */
function calculateCost(events: TimingEvent[]): number {
  let totalIn = 0;
  let totalOut = 0;
  for (const e of events) {
    totalIn += e.metadata.inputTokens || 0;
    totalOut += e.metadata.outputTokens || 0;
  }
  return (totalIn * 3 + totalOut * 15) / 1_000_000;
}

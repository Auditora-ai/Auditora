#!/usr/bin/env tsx
/**
 * Session Simulation — AI Pipeline Latency Auditor
 *
 * Replays a real meeting transcript through the aiprocess.me AI pipelines
 * (process extraction + teleprompter) using the REAL Claude API,
 * measuring latency at every stage.
 *
 * Usage:
 *   pnpm tsx tests/session-simulation/run.ts <transcript-file> [options]
 *
 * Options:
 *   --session-type    DISCOVERY | DEEP_DIVE | CONTINUATION  (default: DEEP_DIVE)
 *   --process-name    Target process name (default: from fixture)
 *   --context         Path to custom SessionContext JSON
 *   --realtime        Use real-time delays between cycles
 *   --extraction-interval   Seconds between extractions (default: 15)
 *   --teleprompter-interval Seconds between teleprompter (default: 30)
 *   --output          Directory for JSON report
 *
 * Requirements:
 *   ANTHROPIC_API_KEY environment variable
 *
 * Example:
 *   npx tsx tests/session-simulation/run.ts tests/session-simulation/transcripts/sample-order-fulfillment.srt
 *   npx tsx tests/session-simulation/run.ts my-meeting.srt --session-type DISCOVERY --realtime
 */

// Load .env.local from project root before anything else
import { readFileSync } from "fs";
import { resolve } from "path";
try {
  const envPath = resolve(__dirname, "../../.env.local");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

import { parseTranscriptFile } from "./lib/transcript-parser";
import { loadContext } from "./lib/fixtures";
import { setLastUsage, runSimulation } from "./lib/simulation-engine";
import { printConsoleReport, saveJsonReport } from "./lib/report-generator";

// --- Parse CLI args ---
const args = process.argv.slice(2);

if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
  console.log(`
Session Simulation — AI Pipeline Latency Auditor

Usage:
  npx tsx tests/session-simulation/run.ts <transcript-file> [options]

Options:
  --session-type    DISCOVERY | DEEP_DIVE | CONTINUATION  (default: DEEP_DIVE)
  --process-name    Target process name (default: from fixture)
  --context         Path to custom SessionContext JSON
  --realtime        Use real-time delays between cycles
  --extraction-interval   Seconds between extractions (default: 15)
  --teleprompter-interval Seconds between teleprompter (default: 30)
  --output          Directory for JSON report

Requirements:
  ANTHROPIC_API_KEY environment variable
`);
  process.exit(0);
}

function getArg(name: string, defaultValue: string): string {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1 || idx + 1 >= args.length) return defaultValue;
  return args[idx + 1];
}

function hasFlag(name: string): boolean {
  return args.includes(`--${name}`);
}

const transcriptFile = args[0];
const sessionType = getArg("session-type", "DEEP_DIVE") as
  | "DISCOVERY"
  | "DEEP_DIVE"
  | "CONTINUATION";
const processName = getArg("process-name", "");
const contextPath = getArg("context", "");
const extractionInterval = parseInt(getArg("extraction-interval", "15"), 10);
const teleprompterInterval = parseInt(getArg("teleprompter-interval", "30"), 10);
const outputDir = getArg("output", "");
const realTimeMode = hasFlag("realtime");

// --- Validate ---
if (!process.env.ANTHROPIC_API_KEY) {
  console.error("ERROR: Set ANTHROPIC_API_KEY environment variable");
  process.exit(1);
}

async function main() {
  console.log("=== Session Simulation — AI Pipeline Latency Auditor ===\n");

  // 1. Parse transcript
  console.log(`Loading transcript: ${transcriptFile}`);
  const chunks = parseTranscriptFile(transcriptFile);
  console.log(`Parsed ${chunks.length} transcript chunks`);

  if (chunks.length === 0) {
    console.error("ERROR: No transcript chunks found in file");
    process.exit(1);
  }

  const duration = chunks[chunks.length - 1].timestamp - chunks[0].timestamp;
  console.log(
    `Duration: ${Math.floor(duration / 60)}m${Math.floor(duration % 60)}s`
  );
  console.log(`Extraction interval: ${extractionInterval}s`);
  console.log(`Teleprompter interval: ${teleprompterInterval}s`);
  console.log(`Mode: ${realTimeMode ? "real-time" : "sequential (fast)"}`);
  console.log(`Session type: ${sessionType}`);

  // 2. Load context
  const context = loadContext(contextPath || undefined);
  console.log(`Context: ${context.company.name} — ${context.targetProcess?.name || "no target"}`);

  // 3. Monkey-patch generateText to capture token usage
  console.log("\nPatching generateText for token tracking...");
  const ai = await import("ai");
  const originalGenerateText = ai.generateText;

  (ai as any).generateText = async (...fnArgs: any[]) => {
    const result = await (originalGenerateText as any)(...fnArgs);
    if (result.usage) {
      setLastUsage({
        promptTokens: result.usage.promptTokens || 0,
        completionTokens: result.usage.completionTokens || 0,
      });
    }
    return result;
  };

  // 4. Dynamically import pipeline functions (AFTER patching)
  const { extractProcessUpdates } = await import(
    "../../packages/ai/src/pipelines/process-extraction"
  );
  const { generateNextQuestion } = await import(
    "../../packages/ai/src/pipelines/teleprompter"
  );

  console.log("Pipeline functions loaded. Starting simulation...\n");

  // 5. Run simulation
  const result = await runSimulation(
    {
      transcriptChunks: chunks,
      context,
      sessionType,
      processName: processName || undefined,
      extractionIntervalSec: extractionInterval,
      teleprompterIntervalSec: teleprompterInterval,
      realTimeMode,
    },
    extractProcessUpdates,
    generateNextQuestion
  );

  // 6. Generate reports
  printConsoleReport(result, { transcriptFile, outputPath: outputDir || undefined });
  saveJsonReport(result, { transcriptFile, outputPath: outputDir || undefined });
}

main().catch((err) => {
  console.error("\nFATAL:", err);
  process.exit(1);
});

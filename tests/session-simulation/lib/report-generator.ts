/**
 * Report Generator
 *
 * Produces console and JSON reports from simulation results.
 */

import { writeFileSync, mkdirSync } from "fs";
import { join, basename } from "path";
import type { SimulationResult, CycleResult } from "./simulation-engine";
import type { TimingSummary } from "./timing-recorder";

export interface ReportOptions {
  transcriptFile: string;
  outputPath?: string;
}

export function printConsoleReport(
  result: SimulationResult,
  options: ReportOptions
): void {
  const { cycles, summaries, finalNodes, totalCost, totalDurationMs, transcriptDurationSec } =
    result;

  const transcriptName = basename(options.transcriptFile);
  const mins = Math.floor(transcriptDurationSec / 60);
  const secs = Math.floor(transcriptDurationSec % 60);

  console.log("\n" + "=".repeat(60));
  console.log("  SESSION SIMULATION REPORT");
  console.log("=".repeat(60));
  console.log(`Transcript:  ${transcriptName} (${mins}m${secs}s)`);
  console.log(`Total time:  ${(totalDurationMs / 1000).toFixed(1)}s (simulation wall clock)`);
  console.log(`Total cost:  $${totalCost.toFixed(4)}`);
  console.log(`Cycles:      ${cycles.length} extraction, ${cycles.filter((c) => c.teleprompter).length} teleprompter`);

  // --- Timing Summary ---
  console.log("\n--- Timing Summary ---");
  console.log(
    padRight("Stage", 22) +
      padRight("Avg", 10) +
      padRight("P50", 10) +
      padRight("P95", 10) +
      padRight("Max", 10) +
      padRight("Min", 10)
  );

  for (const s of summaries) {
    console.log(
      padRight(s.stage, 22) +
        padRight(`${s.avgMs}ms`, 10) +
        padRight(`${s.p50Ms}ms`, 10) +
        padRight(`${s.p95Ms}ms`, 10) +
        padRight(`${s.maxMs}ms`, 10) +
        padRight(`${s.minMs}ms`, 10)
    );
  }

  // --- Token Usage ---
  console.log("\n--- Token Usage ---");
  for (const s of summaries) {
    const costIn = (s.totalTokensIn * 3) / 1_000_000;
    const costOut = (s.totalTokensOut * 15) / 1_000_000;
    console.log(
      `${padRight(s.stage, 22)} ` +
        `${s.totalTokensIn.toLocaleString()} in (~$${costIn.toFixed(4)}) / ` +
        `${s.totalTokensOut.toLocaleString()} out (~$${costOut.toFixed(4)})`
    );
  }

  // --- Extraction Timeline ---
  console.log("\n--- Extraction Timeline ---");
  console.log(
    padRight("Cycle", 7) +
      padRight("Time", 8) +
      padRight("Duration", 12) +
      padRight("Nodes", 7) +
      padRight("New", 5) +
      "Tokens (in/out)"
  );

  for (const c of cycles) {
    if (!c.extraction) continue;
    const time = formatTime(c.timestampSec);
    console.log(
      padRight(`${c.cycle}`, 7) +
        padRight(time, 8) +
        padRight(`${c.extraction.durationMs.toFixed(0)}ms`, 12) +
        padRight(`${c.extraction.newNodes + (c.extraction.updatedNodes || 0)}`, 7) +
        padRight(`${c.extraction.newNodes}`, 5) +
        `${c.extraction.inputTokens}/${c.extraction.outputTokens}`
    );
  }

  // --- Teleprompter Timeline ---
  const teleprompterCycles = cycles.filter((c) => c.teleprompter);
  if (teleprompterCycles.length > 0) {
    console.log("\n--- Teleprompter Timeline ---");
    console.log(
      padRight("Cycle", 7) +
        padRight("Time", 8) +
        padRight("Duration", 12) +
        padRight("Gap Type", 22) +
        "Question"
    );

    for (const c of teleprompterCycles) {
      if (!c.teleprompter) continue;
      const time = formatTime(c.timestampSec);
      console.log(
        padRight(`${c.cycle}`, 7) +
          padRight(time, 8) +
          padRight(`${c.teleprompter.durationMs.toFixed(0)}ms`, 12) +
          padRight(c.teleprompter.gapType, 22) +
          `"${c.teleprompter.question.substring(0, 50)}..."`
      );
    }
  }

  // --- Final BPMN Nodes ---
  console.log("\n--- Final BPMN Nodes ---");
  console.log(`Total: ${finalNodes.length}`);

  const typeCounts: Record<string, number> = {};
  const lanes = new Set<string>();
  for (const n of finalNodes) {
    typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
    if (n.lane) lanes.add(n.lane);
  }

  console.log(
    "Types: " +
      Object.entries(typeCounts)
        .map(([t, c]) => `${t}: ${c}`)
        .join(", ")
  );
  if (lanes.size > 0) {
    console.log(`Lanes: [${[...lanes].join(", ")}]`);
  }

  for (const n of finalNodes) {
    const lane = n.lane ? ` [${n.lane}]` : "";
    console.log(`  ${padRight(n.type, 20)} | "${n.label}"${lane}`);
  }

  // --- Slowest Calls ---
  console.log("\n--- Slowest Calls (Top 5) ---");
  const allEvents = result.timingEvents
    .slice()
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 5);

  for (let i = 0; i < allEvents.length; i++) {
    const e = allEvents[i];
    console.log(
      `${i + 1}. ${e.stage} cycle ${e.cycle}: ${e.durationMs.toFixed(0)}ms` +
        (e.metadata.inputTokens
          ? ` — ${e.metadata.inputTokens} input tokens`
          : "")
    );
  }

  // --- Latency vs Token Correlation ---
  const extractionEvents = result.timingEvents.filter(
    (e) => e.stage === "extraction" && e.metadata.inputTokens
  );
  if (extractionEvents.length >= 3) {
    const tokenDurations = extractionEvents.map((e) => ({
      tokens: e.metadata.inputTokens!,
      ms: e.durationMs,
    }));
    const correlation = pearsonCorrelation(
      tokenDurations.map((t) => t.tokens),
      tokenDurations.map((t) => t.ms)
    );
    console.log(
      `\nToken-Latency correlation (extraction): r=${correlation.toFixed(3)}` +
        (Math.abs(correlation) > 0.5
          ? " — STRONG: more tokens = slower calls"
          : " — WEAK: latency driven by other factors")
    );
  }

  console.log("\n" + "=".repeat(60));
}

/**
 * Save full simulation results as JSON.
 */
export function saveJsonReport(
  result: SimulationResult,
  options: ReportOptions
): string {
  const outputDir = options.outputPath
    ? options.outputPath
    : join(__dirname, "..", "results");

  mkdirSync(outputDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const fileName = `simulation-${timestamp}.json`;
  const filePath = join(outputDir, fileName);

  const report = {
    metadata: {
      transcriptFile: options.transcriptFile,
      timestamp: new Date().toISOString(),
      totalDurationMs: result.totalDurationMs,
      transcriptDurationSec: result.transcriptDurationSec,
      totalCost: result.totalCost,
    },
    summaries: result.summaries,
    cycles: result.cycles,
    finalNodes: result.finalNodes,
    timingEvents: result.timingEvents,
  };

  writeFileSync(filePath, JSON.stringify(report, null, 2));
  console.log(`\nJSON report saved: ${filePath}`);
  return filePath;
}

// --- Helpers ---

function padRight(str: string, len: number): string {
  return str.padEnd(len);
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Simple Pearson correlation coefficient.
 */
function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, xi, i) => a + xi * y[i], 0);
  const sumX2 = x.reduce((a, xi) => a + xi * xi, 0);
  const sumY2 = y.reduce((a, yi) => a + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY)
  );

  return denominator === 0 ? 0 : numerator / denominator;
}

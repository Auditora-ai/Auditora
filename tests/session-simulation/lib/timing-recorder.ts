/**
 * Timing Recorder
 *
 * High-resolution timing instrumentation for AI pipeline profiling.
 * Uses performance.now() for sub-millisecond precision.
 */

import { performance } from "perf_hooks";

export interface TimingMetadata {
  inputTokens?: number;
  outputTokens?: number;
  nodeCount?: number;
  newNodesExtracted?: number;
  transcriptChars?: number;
}

export interface TimingEvent {
  id: string;
  stage: string;
  cycle: number;
  startMs: number;
  endMs: number;
  durationMs: number;
  metadata: TimingMetadata;
}

export interface TimingSummary {
  stage: string;
  count: number;
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  maxMs: number;
  minMs: number;
  totalTokensIn: number;
  totalTokensOut: number;
}

export class TimingRecorder {
  private events: TimingEvent[] = [];
  private counter = 0;

  /**
   * Start a timer for a given stage and cycle.
   * Returns a stop function that finalizes the event.
   */
  startTimer(
    stage: string,
    cycle: number
  ): (metadata?: TimingMetadata) => TimingEvent {
    const id = `${stage}_${this.counter++}`;
    const startMs = performance.now();

    return (metadata?: TimingMetadata) => {
      const endMs = performance.now();
      const event: TimingEvent = {
        id,
        stage,
        cycle,
        startMs,
        endMs,
        durationMs: Math.round((endMs - startMs) * 100) / 100,
        metadata: metadata || {},
      };
      this.events.push(event);
      return event;
    };
  }

  getEvents(): TimingEvent[] {
    return [...this.events];
  }

  getEventsByStage(stage: string): TimingEvent[] {
    return this.events.filter((e) => e.stage === stage);
  }

  getSummaries(): TimingSummary[] {
    const stages = [...new Set(this.events.map((e) => e.stage))];
    return stages.map((stage) => this.getSummary(stage));
  }

  getSummary(stage: string): TimingSummary {
    const events = this.getEventsByStage(stage);
    if (events.length === 0) {
      return {
        stage,
        count: 0,
        avgMs: 0,
        p50Ms: 0,
        p95Ms: 0,
        maxMs: 0,
        minMs: 0,
        totalTokensIn: 0,
        totalTokensOut: 0,
      };
    }

    const durations = events.map((e) => e.durationMs).sort((a, b) => a - b);
    const totalTokensIn = events.reduce(
      (sum, e) => sum + (e.metadata.inputTokens || 0),
      0
    );
    const totalTokensOut = events.reduce(
      (sum, e) => sum + (e.metadata.outputTokens || 0),
      0
    );

    return {
      stage,
      count: events.length,
      avgMs: Math.round(durations.reduce((a, b) => a + b, 0) / durations.length),
      p50Ms: percentile(durations, 50),
      p95Ms: percentile(durations, 95),
      maxMs: durations[durations.length - 1],
      minMs: durations[0],
      totalTokensIn,
      totalTokensOut,
    };
  }
}

/**
 * Calculate percentile from a sorted array of numbers.
 */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower];

  const fraction = index - lower;
  return Math.round(
    (sorted[lower] * (1 - fraction) + sorted[upper] * fraction) * 100
  ) / 100;
}

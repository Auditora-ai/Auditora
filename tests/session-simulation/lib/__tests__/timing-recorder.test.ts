import { describe, it, expect } from "vitest";
import { TimingRecorder, percentile } from "../timing-recorder";

describe("percentile", () => {
  it("returns 0 for empty array", () => {
    expect(percentile([], 50)).toBe(0);
  });

  it("returns the single value for single-element array", () => {
    expect(percentile([42], 50)).toBe(42);
    expect(percentile([42], 95)).toBe(42);
  });

  it("calculates p50 (median) correctly for odd count", () => {
    expect(percentile([10, 20, 30], 50)).toBe(20);
  });

  it("calculates p50 (median) correctly for even count", () => {
    expect(percentile([10, 20, 30, 40], 50)).toBe(25);
  });

  it("calculates p95 correctly", () => {
    // 10 elements, p95 index = 0.95 * 9 = 8.55
    const sorted = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
    const result = percentile(sorted, 95);
    // lower=8 (900), upper=9 (1000), fraction=0.55
    // 900 * 0.45 + 1000 * 0.55 = 405 + 550 = 955
    expect(result).toBe(955);
  });

  it("returns max for p100", () => {
    expect(percentile([10, 20, 30], 100)).toBe(30);
  });

  it("returns min for p0", () => {
    expect(percentile([10, 20, 30], 0)).toBe(10);
  });
});

describe("TimingRecorder", () => {
  it("records events via startTimer/stop", () => {
    const recorder = new TimingRecorder();
    const stop = recorder.startTimer("extraction", 0);

    // Simulate some work
    let sum = 0;
    for (let i = 0; i < 10000; i++) sum += i;

    const event = stop({ inputTokens: 100, outputTokens: 50 });

    expect(event.stage).toBe("extraction");
    expect(event.cycle).toBe(0);
    expect(event.durationMs).toBeGreaterThan(0);
    expect(event.metadata.inputTokens).toBe(100);
    expect(event.metadata.outputTokens).toBe(50);
  });

  it("returns all events", () => {
    const recorder = new TimingRecorder();

    const stop1 = recorder.startTimer("extraction", 0);
    stop1();
    const stop2 = recorder.startTimer("teleprompter", 0);
    stop2();

    expect(recorder.getEvents()).toHaveLength(2);
  });

  it("filters events by stage", () => {
    const recorder = new TimingRecorder();

    const s1 = recorder.startTimer("extraction", 0);
    s1();
    const s2 = recorder.startTimer("teleprompter", 0);
    s2();
    const s3 = recorder.startTimer("extraction", 1);
    s3();

    expect(recorder.getEventsByStage("extraction")).toHaveLength(2);
    expect(recorder.getEventsByStage("teleprompter")).toHaveLength(1);
    expect(recorder.getEventsByStage("unknown")).toHaveLength(0);
  });

  it("computes summary for a stage", () => {
    const recorder = new TimingRecorder();

    // Record 3 extraction events
    for (let i = 0; i < 3; i++) {
      const stop = recorder.startTimer("extraction", i);
      // Tiny delay to get non-zero durations
      let sum = 0;
      for (let j = 0; j < 1000; j++) sum += j;
      stop({ inputTokens: 100 * (i + 1), outputTokens: 10 * (i + 1) });
    }

    const summary = recorder.getSummary("extraction");
    expect(summary.stage).toBe("extraction");
    expect(summary.count).toBe(3);
    expect(summary.avgMs).toBeGreaterThanOrEqual(0);
    expect(summary.maxMs).toBeGreaterThanOrEqual(summary.minMs);
    expect(summary.totalTokensIn).toBe(600); // 100 + 200 + 300
    expect(summary.totalTokensOut).toBe(60); // 10 + 20 + 30
  });

  it("returns zero summary for unknown stage", () => {
    const recorder = new TimingRecorder();
    const summary = recorder.getSummary("nonexistent");
    expect(summary.count).toBe(0);
    expect(summary.avgMs).toBe(0);
  });

  it("computes summaries for all stages", () => {
    const recorder = new TimingRecorder();

    const s1 = recorder.startTimer("extraction", 0);
    s1();
    const s2 = recorder.startTimer("teleprompter", 0);
    s2();

    const summaries = recorder.getSummaries();
    expect(summaries).toHaveLength(2);
    expect(summaries.map((s) => s.stage).sort()).toEqual([
      "extraction",
      "teleprompter",
    ]);
  });

  it("assigns unique IDs to events", () => {
    const recorder = new TimingRecorder();

    const s1 = recorder.startTimer("extraction", 0);
    s1();
    const s2 = recorder.startTimer("extraction", 1);
    s2();

    const events = recorder.getEvents();
    expect(events[0].id).not.toBe(events[1].id);
  });

  it("stop with no metadata defaults to empty object", () => {
    const recorder = new TimingRecorder();
    const stop = recorder.startTimer("extraction", 0);
    const event = stop();
    expect(event.metadata).toEqual({});
  });
});

import { describe, it, expect } from "vitest";
import {
  parseSRT,
  parseSRTTimestamp,
  extractSpeaker,
  parseJSON,
} from "../transcript-parser";

describe("parseSRTTimestamp", () => {
  it("parses standard SRT timestamp", () => {
    expect(parseSRTTimestamp("00:01:30,500 --> 00:01:35,000")).toBe(90.5);
  });

  it("parses hours correctly", () => {
    expect(parseSRTTimestamp("01:00:00,000 --> 01:00:05,000")).toBe(3600);
  });

  it("handles period instead of comma as millisecond separator", () => {
    expect(parseSRTTimestamp("00:00:05.200 --> 00:00:10.000")).toBe(5.2);
  });

  it("handles single-digit hours", () => {
    expect(parseSRTTimestamp("0:05:30,000 --> 0:05:35,000")).toBe(330);
  });

  it("returns null for malformed timestamps", () => {
    expect(parseSRTTimestamp("not a timestamp")).toBeNull();
    expect(parseSRTTimestamp("")).toBeNull();
    expect(parseSRTTimestamp("00:00 --> 00:05")).toBeNull();
  });
});

describe("extractSpeaker", () => {
  it("extracts speaker from 'Name: text' pattern", () => {
    const result = extractSpeaker("Maria Garcia: Hello, how are you?");
    expect(result.speaker).toBe("Maria Garcia");
    expect(result.text).toBe("Hello, how are you?");
  });

  it("handles accented names", () => {
    const result = extractSpeaker("José María: Hola, buenos días");
    expect(result.speaker).toBe("José María");
    expect(result.text).toBe("Hola, buenos días");
  });

  it("falls back to Unknown when no speaker prefix", () => {
    const result = extractSpeaker("Just some text without a speaker");
    expect(result.speaker).toBe("Unknown");
    expect(result.text).toBe("Just some text without a speaker");
  });

  it("falls back for very long names (likely not a speaker)", () => {
    const longName = "A".repeat(61);
    const result = extractSpeaker(`${longName}: some text`);
    expect(result.speaker).toBe("Unknown");
  });

  it("handles Consultant as speaker", () => {
    const result = extractSpeaker("Consultant: What happens next?");
    expect(result.speaker).toBe("Consultant");
    expect(result.text).toBe("What happens next?");
  });
});

describe("parseSRT", () => {
  it("parses valid SRT content with speakers", () => {
    const srt = `1
00:00:01,000 --> 00:00:05,000
Maria: Hello there

2
00:00:06,000 --> 00:00:10,000
Consultant: How does it work?`;

    const chunks = parseSRT(srt);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toEqual({
      speaker: "Maria",
      text: "Hello there",
      timestamp: 1,
    });
    expect(chunks[1]).toEqual({
      speaker: "Consultant",
      text: "How does it work?",
      timestamp: 6,
    });
  });

  it("handles multi-line text in SRT blocks", () => {
    const srt = `1
00:00:01,000 --> 00:00:05,000
Maria: This is the first line
and this continues on the second line`;

    const chunks = parseSRT(srt);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe(
      "This is the first line and this continues on the second line"
    );
  });

  it("skips blocks with too few lines", () => {
    const srt = `1
00:00:01,000 --> 00:00:05,000
Maria: Valid block

2
invalid`;

    const chunks = parseSRT(srt);
    expect(chunks).toHaveLength(1);
  });

  it("handles empty content", () => {
    expect(parseSRT("")).toHaveLength(0);
    expect(parseSRT("   ")).toHaveLength(0);
  });

  it("handles SRT without speaker prefixes", () => {
    const srt = `1
00:00:01,000 --> 00:00:05,000
Just some spoken text without a name`;

    const chunks = parseSRT(srt);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].speaker).toBe("Unknown");
  });
});

describe("parseJSON", () => {
  it("parses valid JSON transcript array", () => {
    const json = JSON.stringify([
      { speaker: "Maria", text: "Hello", startTime: 1.0 },
      { speaker: "Oscar", text: "Hi there", startTime: 5.0 },
    ]);

    const chunks = parseJSON(json);
    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toEqual({
      speaker: "Maria",
      text: "Hello",
      timestamp: 1.0,
    });
  });

  it("supports 'timestamp' field as alternative to 'startTime'", () => {
    const json = JSON.stringify([
      { speaker: "Maria", text: "Hello", timestamp: 3.5 },
    ]);

    const chunks = parseJSON(json);
    expect(chunks[0].timestamp).toBe(3.5);
  });

  it("falls back to Unknown speaker when missing", () => {
    const json = JSON.stringify([{ text: "No speaker here", startTime: 0 }]);

    const chunks = parseJSON(json);
    expect(chunks[0].speaker).toBe("Unknown");
  });

  it("throws on invalid JSON", () => {
    expect(() => parseJSON("not json")).toThrow("Invalid JSON");
  });

  it("throws when JSON is not an array", () => {
    expect(() => parseJSON('{"key": "value"}')).toThrow("must be an array");
  });

  it("skips entries without text field", () => {
    const json = JSON.stringify([
      { speaker: "Maria", text: "Valid", startTime: 1 },
      { speaker: "Oscar", noText: true, startTime: 2 },
      { speaker: "Ana", text: "Also valid", startTime: 3 },
    ]);

    const chunks = parseJSON(json);
    expect(chunks).toHaveLength(2);
  });
});

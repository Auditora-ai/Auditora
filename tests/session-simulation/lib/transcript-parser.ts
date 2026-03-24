/**
 * Transcript Parser
 *
 * Parses SRT (Google Meet) and JSON transcript files into a common format
 * for the session simulation engine.
 *
 * SRT format (Google Meet export):
 *   1
 *   00:00:01,000 --> 00:00:05,000
 *   Maria Garcia: So first the customer places an order.
 *
 * JSON format (Recall.ai export or hand-crafted):
 *   [{ "speaker": "Maria", "text": "...", "startTime": 1.0 }]
 */

import { readFileSync } from "fs";
import { extname } from "path";

export interface TranscriptChunk {
  speaker: string;
  text: string;
  timestamp: number; // seconds from start
}

/**
 * Parse a transcript file, auto-detecting format from extension.
 */
export function parseTranscriptFile(filePath: string): TranscriptChunk[] {
  const ext = extname(filePath).toLowerCase();
  const content = readFileSync(filePath, "utf-8");

  if (ext === ".srt") {
    return parseSRT(content);
  }
  if (ext === ".json") {
    return parseJSON(content);
  }

  throw new Error(`Unsupported transcript format: ${ext}. Use .srt or .json`);
}

/**
 * Parse SRT content into transcript chunks.
 *
 * Expected format per block:
 *   <sequence number>
 *   <start> --> <end>
 *   <Speaker Name>: <text>
 *   (blank line)
 */
export function parseSRT(content: string): TranscriptChunk[] {
  const chunks: TranscriptChunk[] = [];
  const blocks = content.trim().split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 3) continue;

    // Line 0: sequence number (ignored)
    // Line 1: timestamps
    const timestampLine = lines[1];
    const timestamp = parseSRTTimestamp(timestampLine);
    if (timestamp === null) continue;

    // Lines 2+: text content (may span multiple lines)
    const textContent = lines.slice(2).join(" ").trim();
    if (!textContent) continue;

    const { speaker, text } = extractSpeaker(textContent);

    chunks.push({ speaker, text, timestamp });
  }

  return chunks;
}

/**
 * Parse SRT timestamp line "HH:MM:SS,mmm --> HH:MM:SS,mmm"
 * Returns the START timestamp in seconds.
 */
export function parseSRTTimestamp(line: string): number | null {
  const match = line.match(
    /(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})\s*-->/
  );
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);
  const millis = parseInt(match[4].padEnd(3, "0"), 10);

  return hours * 3600 + minutes * 60 + seconds + millis / 1000;
}

/**
 * Extract speaker name from "Speaker Name: text" pattern.
 * Falls back to "Unknown" if no colon-separated prefix found.
 */
export function extractSpeaker(text: string): {
  speaker: string;
  text: string;
} {
  // Match "Name:" or "Name Name:" at the start
  const match = text.match(/^([A-Za-zÀ-ÿ\s.'-]+?):\s*(.+)$/s);
  if (match && match[1].trim().length > 0 && match[1].trim().length < 60) {
    return {
      speaker: match[1].trim(),
      text: match[2].trim(),
    };
  }
  return { speaker: "Unknown", text: text.trim() };
}

/**
 * Parse JSON transcript format.
 *
 * Expected: Array of objects with speaker, text, and startTime (seconds).
 */
export function parseJSON(content: string): TranscriptChunk[] {
  let data: unknown;
  try {
    data = JSON.parse(content);
  } catch {
    throw new Error("Invalid JSON transcript file");
  }

  if (!Array.isArray(data)) {
    throw new Error(
      "JSON transcript must be an array of { speaker, text, startTime }"
    );
  }

  const chunks: TranscriptChunk[] = [];

  for (const entry of data) {
    if (
      typeof entry !== "object" ||
      entry === null ||
      typeof entry.text !== "string"
    ) {
      continue;
    }

    chunks.push({
      speaker:
        typeof entry.speaker === "string" ? entry.speaker : "Unknown",
      text: entry.text,
      timestamp:
        typeof entry.startTime === "number"
          ? entry.startTime
          : typeof entry.timestamp === "number"
            ? entry.timestamp
            : 0,
    });
  }

  return chunks;
}

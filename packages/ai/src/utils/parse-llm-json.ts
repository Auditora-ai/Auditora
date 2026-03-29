import type { ZodType } from "zod";

/**
 * Robustly parse JSON from LLM output.
 *
 * Handles common LLM quirks:
 * - Markdown code fences (```json ... ```) anywhere in the text
 * - Leading/trailing prose around the JSON object
 * - Truncated JSON from hitting token limits (attempts bracket repair)
 * - Control characters inside strings
 */
export function parseLlmJson<T>(
  text: string,
  schema: ZodType<T>,
  label: string,
): T | null {
  try {
    const cleaned = extractJsonString(text);
    const raw = JSON.parse(cleaned);
    return schema.parse(raw);
  } catch (firstError) {
    // Attempt to repair truncated JSON
    try {
      const cleaned = extractJsonString(text);
      const repaired = repairTruncatedJson(cleaned);
      if (repaired !== cleaned) {
        const raw = JSON.parse(repaired);
        return schema.parse(raw);
      }
    } catch {
      // repair also failed — fall through to log
    }

    console.error(
      `[${label}] Invalid LLM output:`,
      text.substring(0, 500),
      firstError instanceof Error ? firstError.message : "",
    );
    return null;
  }
}

/**
 * Extract the JSON body from LLM text, stripping markdown fences and prose.
 */
function extractJsonString(text: string): string {
  // Strip markdown code fences (greedy across full text)
  let cleaned = text.replace(/```(?:json)?\s*/gi, "").trim();

  // Remove control characters that break JSON (except \n \r \t)
  cleaned = cleaned.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "");

  // If the text still has leading prose before the first { or [, strip it
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");
  const starts: number[] = [];
  if (firstBrace !== -1) starts.push(firstBrace);
  if (firstBracket !== -1) starts.push(firstBracket);

  if (starts.length > 0) {
    cleaned = cleaned.substring(Math.min(...starts));
  }

  return cleaned.trim();
}

/**
 * Attempt to close unclosed brackets/braces in truncated JSON.
 *
 * Uses a character-by-character state machine so it correctly handles:
 * - Escaped quotes inside strings
 * - Brackets/braces inside string values (ignored)
 * - Truncation mid-string, mid-array, or mid-object at any nesting depth
 */
function repairTruncatedJson(text: string): string {
  let inString = false;
  let escaped = false;
  const stack: string[] = []; // tracks open { and [
  let lastSafePos = 0; // position after the last complete value

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (inString) {
      if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
        // A closed string is a potential safe cut point
        lastSafePos = i + 1;
      }
      continue;
    }

    // Outside a string
    switch (ch) {
      case '"':
        inString = true;
        break;
      case "{":
        stack.push("}");
        break;
      case "[":
        stack.push("]");
        break;
      case "}":
      case "]":
        stack.pop();
        lastSafePos = i + 1;
        break;
      default:
        // After digits, booleans, null — mark safe at word boundaries
        if (/[\d\w]/.test(ch) && (i + 1 === text.length || /[,\]\}\s]/.test(text[i + 1]))) {
          lastSafePos = i + 1;
        }
        break;
    }
  }

  // If we're not inside a string and the stack is empty, JSON may already be complete
  if (!inString && stack.length === 0) {
    return text;
  }

  // Truncate to last safe position and close open structures
  let repaired = text.substring(0, lastSafePos);
  repaired = repaired.replace(/,\s*$/, "");

  // Close all open brackets/braces in reverse order
  for (let i = stack.length - 1; i >= 0; i--) {
    repaired += stack[i];
  }

  return repaired;
}

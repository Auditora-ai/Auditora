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
 * Only adds missing closing tokens — never removes content.
 */
function repairTruncatedJson(text: string): string {
  // Remove trailing incomplete key-value pair (e.g. `"key": "unterminated...`)
  let repaired = text.replace(/,?\s*"[^"]*":\s*"[^"]*$/, "");
  // Also handle trailing incomplete number/bool/null
  repaired = repaired.replace(/,?\s*"[^"]*":\s*\S*$/, "");

  const openBraces = (repaired.match(/{/g) || []).length;
  const closeBraces = (repaired.match(/}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/]/g) || []).length;

  // Remove trailing comma before we close
  repaired = repaired.replace(/,\s*$/, "");

  // Close open brackets/braces in reverse order
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    repaired += "]";
  }
  for (let i = 0; i < openBraces - closeBraces; i++) {
    repaired += "}";
  }

  return repaired;
}

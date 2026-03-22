/**
 * STTProvider — Abstract interface for Speech-to-Text services
 *
 * Constitution Principle V: Provider Abstraction
 * Switching from Deepgram to AssemblyAI must be a config change.
 *
 * Note: For the MVP, we use Recall.ai's built-in transcription
 * which uses Deepgram under the hood. The real-time transcription
 * events come via webhook from Recall.ai, not directly from Deepgram.
 *
 * This provider interface is for future use if we need to:
 * - Process audio directly (browser mic mode, no bot)
 * - Use a different STT provider
 * - Add custom diarization logic
 */

export interface TranscriptionEvent {
  speaker: string;
  text: string;
  timestamp: number;
  isFinal: boolean;
  confidence?: number;
  language?: string;
}

export interface STTProvider {
  readonly providerName: string;

  /** Process an incoming transcription webhook event from the call bot */
  parseWebhookEvent(payload: unknown): TranscriptionEvent | null;
}

/**
 * Recall.ai Transcription Provider
 *
 * Recall.ai sends real-time transcription events via webhook.
 * The payload format depends on the transcription provider configured
 * in the bot settings (default is Deepgram).
 */
export class RecallTranscriptionProvider implements STTProvider {
  readonly providerName = "recall.ai-transcription";

  parseWebhookEvent(payload: unknown): TranscriptionEvent | null {
    const data = payload as any;

    if (!data?.data?.transcript) {
      return null;
    }

    const transcript = data.data.transcript;

    return {
      speaker: transcript.speaker || "Unknown",
      text: transcript.words?.map((w: any) => w.text).join(" ") || transcript.text || "",
      timestamp: transcript.original_transcript_id
        ? Number.parseFloat(transcript.words?.[0]?.start_time || "0")
        : 0,
      isFinal: transcript.is_final ?? true,
      confidence: transcript.words?.[0]?.confidence,
    };
  }
}

export function createSTTProvider(): STTProvider {
  // For MVP, we always use Recall.ai's built-in transcription
  return new RecallTranscriptionProvider();
}

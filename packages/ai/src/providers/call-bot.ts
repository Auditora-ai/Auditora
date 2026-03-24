/**
 * CallBotProvider — Abstract interface for call bot services
 *
 * Constitution Principle V: Provider Abstraction
 * Switching from Recall.ai to Meeting BaaS must be a config change, not a rewrite.
 *
 * Architecture:
 *   CallBotProvider
 *   ├── RecallAiProvider (MVP)
 *   └── MeetingBaasProvider (fallback)
 */

export interface CallBotProvider {
  /** Join a video call. Returns a bot ID for tracking. */
  joinMeeting(meetingUrl: string): Promise<{ botId: string }>;

  /** Leave the current meeting */
  leaveMeeting(botId: string): Promise<void>;

  /** Get the current status of the bot */
  getBotStatus(botId: string): Promise<BotStatus>;

  /** Register a webhook handler for audio/events */
  readonly providerName: string;
}

export interface BotStatus {
  status: "joining" | "in_meeting" | "leaving" | "ended" | "error";
  rawStatus?: string;
  meetingUrl?: string;
  participants?: number;
  error?: string;
}

/**
 * Recall.ai Provider — MVP call bot integration
 *
 * API docs: https://docs.recall.ai
 * Pricing: $1K/mo platform + $0.30-0.70/hr per bot
 */
export class RecallAiProvider implements CallBotProvider {
  readonly providerName = "recall.ai";
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, region?: string) {
    if (!apiKey) throw new Error("RECALL_API_KEY is required");
    this.apiKey = apiKey;
    const r = region || process.env.RECALL_REGION || "us-west-2";
    this.baseUrl = `https://${r}.recall.ai/api/v1`;
  }

  async joinMeeting(meetingUrl: string): Promise<{ botId: string }> {
    const response = await fetch(`${this.baseUrl}/bot/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${this.apiKey}`,
      },
      body: JSON.stringify({
        meeting_url: meetingUrl,
        bot_name: "Prozea",
        recording_config: {
          transcript: {
            provider: {
              recallai_streaming: {
                language_code: "es",
                partial_results: true,
              },
            },
          },
          realtime_endpoints: [
            {
              type: "webhook",
              url: `${process.env.NEXT_PUBLIC_TUNNEL_URL || process.env.NEXT_PUBLIC_SAAS_URL}/api/webhook/recall`,
              events: [
                "transcript.data",
                "transcript.partial_data",
                "participant_events.join",
                "participant_events.leave",
                "participant_events.speech_on",
                "participant_events.speech_off",
                "participant_events.chat_message",
              ],
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Recall.ai joinMeeting failed (${response.status}): ${error}`);
    }

    const data = await response.json();
    return { botId: data.id };
  }

  async leaveMeeting(botId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/bot/${botId}/leave_call/`, {
      method: "POST",
      headers: {
        Authorization: `Token ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Recall.ai leaveMeeting failed (${response.status}): ${error}`);
    }
  }

  async getBotStatus(botId: string): Promise<BotStatus> {
    const response = await fetch(`${this.baseUrl}/bot/${botId}/`, {
      headers: {
        Authorization: `Token ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      return { status: "error", error: `HTTP ${response.status}` };
    }

    const data = await response.json();

    const statusMap: Record<string, BotStatus["status"]> = {
      ready: "joining",
      joining_call: "joining",
      in_waiting_room: "joining",
      in_call_not_recording: "in_meeting",
      in_call_recording: "in_meeting",
      call_ended: "ended",
      done: "ended",
      fatal: "error",
    };

    const rawCode = data.status_changes?.at(-1)?.code;

    return {
      status: statusMap[rawCode] || "error",
      rawStatus: rawCode,
      meetingUrl: data.meeting_url,
      participants: data.meeting_participants?.length,
    };
  }

  /**
   * Get the video recording URL for a completed bot session.
   * Returns null if the recording is not yet available (bot still processing).
   */
  async getVideoUrl(botId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/bot/${botId}/`, {
        headers: {
          Authorization: `Token ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        console.warn(`[RecallAi] getVideoUrl failed (${response.status}) for bot ${botId}`);
        return null;
      }

      const data = await response.json();
      // Recall.ai stores recordings in recordings[].media_shortcuts.video_mixed.data.download_url
      // The download_url is a pre-signed S3 URL that expires in 5 hours
      const videoUrl = data.recordings?.[0]?.media_shortcuts?.video_mixed?.data?.download_url
        || data.video_url
        || null;
      return videoUrl;
    } catch (err) {
      console.warn(`[RecallAi] getVideoUrl error for bot ${botId}:`, err);
      return null;
    }
  }

  /**
   * Get the audio recording URL for a completed bot session.
   * Returns null if the recording is not yet available (bot still processing).
   * Note: Recall.ai S3 URLs expire after 5 hours — fetch fresh on each access.
   */
  async getAudioUrl(botId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/bot/${botId}/`, {
        headers: {
          Authorization: `Token ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        console.warn(`[RecallAi] getAudioUrl failed (${response.status}) for bot ${botId}`);
        return null;
      }

      const data = await response.json();
      // Try recordings structure first, fallback to direct field
      const audioUrl = data.recordings?.[0]?.media_shortcuts?.audio_mixed?.data?.download_url
        || data.audio_url
        || null;
      return audioUrl;
    } catch (err) {
      console.warn(`[RecallAi] getAudioUrl error for bot ${botId}:`, err);
      return null;
    }
  }

  /**
   * Get the list of meeting participants from a bot session.
   * Returns empty array if not available yet.
   */
  async getParticipants(botId: string): Promise<Array<{ name: string; email?: string }>> {
    try {
      const response = await fetch(`${this.baseUrl}/bot/${botId}/`, {
        headers: {
          Authorization: `Token ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        console.warn(`[RecallAi] getParticipants failed (${response.status}) for bot ${botId}`);
        return [];
      }

      const data = await response.json();
      const participants = data.meeting_participants;
      if (!Array.isArray(participants)) return [];

      return participants.map((p: any) => ({
        name: p.name || "Unknown",
        ...(p.email ? { email: p.email } : {}),
      }));
    } catch (err) {
      console.warn(`[RecallAi] getParticipants error for bot ${botId}:`, err);
      return [];
    }
  }
}

/** Factory function — reads provider from env */
export function createCallBotProvider(): CallBotProvider {
  const recallKey = process.env.RECALL_API_KEY;
  if (recallKey) {
    return new RecallAiProvider(recallKey);
  }
  throw new Error("No call bot provider configured. Set RECALL_API_KEY.");
}

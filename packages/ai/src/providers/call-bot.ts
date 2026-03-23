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
              },
            },
          },
          realtime_endpoints: [
            {
              type: "webhook",
              url: `${process.env.NEXT_PUBLIC_TUNNEL_URL || process.env.NEXT_PUBLIC_SAAS_URL}/api/webhook/recall`,
              events: ["transcript.data"],
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
}

/** Factory function — reads provider from env */
export function createCallBotProvider(): CallBotProvider {
  const recallKey = process.env.RECALL_API_KEY;
  if (recallKey) {
    return new RecallAiProvider(recallKey);
  }
  throw new Error("No call bot provider configured. Set RECALL_API_KEY.");
}

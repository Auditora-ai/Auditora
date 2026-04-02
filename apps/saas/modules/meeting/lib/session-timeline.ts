/**
 * Session Timeline — Diagnostic instrumentation for transcription pipeline latency
 *
 * Records timestamped events at every stage of the pipeline.
 * In-memory only, same single-process constraint as sessionActivity.
 *
 * Remove this file after diagnosis is complete.
 * Cleanup: grep for `recordEvent`, `session-timeline`, `[DIAG`
 */

interface TimelineEvent {
	stage: string;
	timestamp: number;
	isoTime: string;
	detail?: string;
}

const timelines = new Map<string, TimelineEvent[]>();

export function recordEvent(
	sessionId: string,
	stage: string,
	detail?: string,
) {
	const now = Date.now();
	const event: TimelineEvent = {
		stage,
		timestamp: now,
		isoTime: new Date(now).toISOString(),
		detail,
	};

	const events = timelines.get(sessionId) || [];
	events.push(event);
	timelines.set(sessionId, events);

}

export function getTimeline(sessionId: string) {
	const events = timelines.get(sessionId) || [];
	if (events.length === 0) return null;

	const first = events[0].timestamp;
	return {
		sessionId,
		events: events.map((e) => ({
			...e,
			offsetMs: e.timestamp - first,
			offsetSec: ((e.timestamp - first) / 1000).toFixed(1) + "s",
		})),
		totalDurationMs:
			events.length > 1
				? events[events.length - 1].timestamp - first
				: 0,
	};
}

export function getAllTimelines() {
	const result: Record<string, ReturnType<typeof getTimeline>> = {};
	for (const [id] of timelines) {
		result[id] = getTimeline(id);
	}
	return result;
}

// Cleanup old timelines every hour
setInterval(
	() => {
		const cutoff = Date.now() - 6 * 60 * 60 * 1000;
		for (const [id, events] of timelines) {
			if (events.length > 0 && events[events.length - 1].timestamp < cutoff) {
				timelines.delete(id);
			}
		}
	},
	60 * 60 * 1000,
);

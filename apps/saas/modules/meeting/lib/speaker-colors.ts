/**
 * Speaker color assignment for transcript entries.
 * Colors from DESIGN.md speaker palette.
 */

const SPEAKER_COLORS = [
	"#00E5C0", // Consultant — primary teal
	"#7C3AED", // Client 1 — purple
	"#059669", // Client 2 — teal
	"#D97706", // Client 3+ — amber
	"#DC2626", // Client 4 — red
	"#0EA5E9", // Client 5 — sky
];

const speakerMap = new Map<string, string>();

export function getSpeakerColor(speaker: string): string {
	if (speakerMap.has(speaker)) {
		return speakerMap.get(speaker)!;
	}
	const idx = Math.min(speakerMap.size, SPEAKER_COLORS.length - 1);
	const color = SPEAKER_COLORS[idx];
	speakerMap.set(speaker, color);
	return color;
}

export function resetSpeakerColors() {
	speakerMap.clear();
}

"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { SearchIcon, XIcon } from "lucide-react";

interface TranscriptEntry {
	id: string;
	speaker: string;
	text: string;
	timestamp: number;
}

interface ReviewTranscriptProps {
	entries: TranscriptEntry[];
	highlightedEntryId?: string | null;
	onEntryClick?: (entryId: string) => void;
}

const SPEAKER_COLORS = [
	"text-primary",
	"text-purple-500",
	"text-emerald-500",
	"text-amber-500",
	"text-rose-500",
];

function getSpeakerColor(speaker: string, speakerMap: Map<string, number>): string {
	if (
		speaker.toLowerCase().includes("you") ||
		speaker.toLowerCase().includes("consultant")
	) {
		return "text-primary";
	}
	const idx = speakerMap.get(speaker) ?? 0;
	return SPEAKER_COLORS[idx % SPEAKER_COLORS.length] || "text-purple-500";
}

export function ReviewTranscript({
	entries,
	highlightedEntryId,
	onEntryClick,
}: ReviewTranscriptProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
	const scrollRef = useRef<HTMLDivElement>(null);
	const highlightRef = useRef<HTMLDivElement>(null);

	// Build speaker index
	const speakerMap = useMemo(() => {
		const map = new Map<string, number>();
		let idx = 0;
		for (const entry of entries) {
			if (!map.has(entry.speaker)) {
				map.set(entry.speaker, idx++);
			}
		}
		return map;
	}, [entries]);

	const speakers = useMemo(() => Array.from(speakerMap.keys()), [speakerMap]);

	// Filter entries
	const filteredEntries = useMemo(() => {
		return entries.filter((entry) => {
			if (selectedSpeaker && entry.speaker !== selectedSpeaker) return false;
			if (searchQuery) {
				return entry.text.toLowerCase().includes(searchQuery.toLowerCase());
			}
			return true;
		});
	}, [entries, searchQuery, selectedSpeaker]);

	// Scroll to highlighted entry
	useEffect(() => {
		if (highlightedEntryId && highlightRef.current) {
			highlightRef.current.scrollIntoView({
				behavior: "smooth",
				block: "center",
			});
		}
	}, [highlightedEntryId]);

	function highlightText(text: string, query: string) {
		if (!query) return text;
		const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
		return parts.map((part, i) =>
			part.toLowerCase() === query.toLowerCase() ? (
				<mark key={i} className="rounded bg-yellow-200/80 px-0.5 dark:bg-yellow-500/30">
					{part}
				</mark>
			) : (
				part
			),
		);
	}

	return (
		<div className="flex h-full flex-col">
			{/* Search + Filter bar */}
			<div className="space-y-2 border-b border-border p-3">
				<div className="relative">
					<SearchIcon className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
					<input
						type="text"
						placeholder="Search transcript..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-8 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
					/>
					{searchQuery && (
						<button
							type="button"
							onClick={() => setSearchQuery("")}
							className="absolute right-2 top-2 text-muted-foreground hover:text-foreground"
						>
							<XIcon className="h-3.5 w-3.5" />
						</button>
					)}
				</div>

				{/* Speaker filter chips */}
				<div className="flex flex-wrap gap-1">
					<button
						type="button"
						onClick={() => setSelectedSpeaker(null)}
						className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
							!selectedSpeaker
								? "bg-primary/10 text-primary"
								: "bg-accent text-muted-foreground hover:bg-accent/80"
						}`}
					>
						All
					</button>
					{speakers.map((speaker) => (
						<button
							key={speaker}
							type="button"
							onClick={() =>
								setSelectedSpeaker(
									selectedSpeaker === speaker ? null : speaker,
								)
							}
							className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
								selectedSpeaker === speaker
									? "bg-primary/10 text-primary"
									: "bg-accent text-muted-foreground hover:bg-accent/80"
							}`}
						>
							{speaker}
						</button>
					))}
				</div>

				{searchQuery && (
					<p className="text-[10px] text-muted-foreground">
						{filteredEntries.length} result
						{filteredEntries.length !== 1 ? "s" : ""}
					</p>
				)}
			</div>

			{/* Transcript entries */}
			<div ref={scrollRef} className="flex-1 overflow-y-auto">
				{filteredEntries.length === 0 ? (
					<div className="px-4 py-8 text-center text-sm text-muted-foreground">
						{searchQuery
							? "No results found"
							: "No transcript entries"}
					</div>
				) : (
					filteredEntries.map((entry) => {
						const isHighlighted = entry.id === highlightedEntryId;
						return (
							<div
								key={entry.id}
								ref={isHighlighted ? highlightRef : undefined}
								onClick={() => onEntryClick?.(entry.id)}
								className={`cursor-pointer border-b border-border/30 px-3 py-2 transition-colors hover:bg-accent/30 ${
									isHighlighted
										? "bg-primary/10 ring-1 ring-primary/30"
										: ""
								}`}
							>
								<div className="flex items-baseline justify-between">
									<span
										className={`text-[11px] font-semibold ${getSpeakerColor(entry.speaker, speakerMap)}`}
									>
										{entry.speaker}
									</span>
									<span className="text-[10px] text-muted-foreground">
										{Math.floor(entry.timestamp / 60)}:
										{Math.floor(entry.timestamp % 60)
											.toString()
											.padStart(2, "0")}
									</span>
								</div>
								<p className="mt-0.5 text-sm leading-relaxed text-foreground">
									{highlightText(entry.text, searchQuery)}
								</p>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
}

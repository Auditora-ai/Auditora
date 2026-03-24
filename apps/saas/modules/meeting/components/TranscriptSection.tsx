"use client";

import { useEffect, useRef } from "react";
import { MessageSquareIcon } from "lucide-react";
import type { TranscriptEntry } from "../types";
import { getSpeakerColor } from "../lib/speaker-colors";

interface TranscriptSectionProps {
	transcript: TranscriptEntry[];
}

export function TranscriptSection({ transcript }: TranscriptSectionProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const prevCountRef = useRef(0);

	// Auto-scroll on new entries
	useEffect(() => {
		if (transcript.length > prevCountRef.current && scrollRef.current) {
			requestAnimationFrame(() => {
				scrollRef.current?.scrollTo({
					top: scrollRef.current.scrollHeight,
					behavior: "smooth",
				});
			});
		}
		prevCountRef.current = transcript.length;
	}, [transcript.length]);

	return (
		<div className="flex flex-col overflow-hidden">
			{/* Header */}
			<div className="flex items-center gap-2 border-b border-[#334155] px-3 py-2">
				<MessageSquareIcon className="h-3.5 w-3.5 text-[#64748B]" />
				<span className="text-xs font-medium text-[#94A3B8]">
					Transcripcion en vivo
				</span>
				{transcript.length > 0 && (
					<span className="ml-auto text-[10px] tabular-nums text-[#64748B]">
						{transcript.length}
					</span>
				)}
			</div>

			{/* Transcript list */}
			<div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar">
				{transcript.length === 0 ? (
					<div className="flex h-full items-center justify-center p-4">
						<p className="text-center text-xs text-[#64748B]">
							Esperando transcripcion...
						</p>
					</div>
				) : (
					<div className="space-y-0.5 p-2">
						{transcript.map((entry) => (
							<TranscriptLine key={entry.id} entry={entry} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function TranscriptLine({ entry }: { entry: TranscriptEntry }) {
	const color = getSpeakerColor(entry.speaker);
	const time = formatTimestamp(entry.timestamp);

	return (
		<div className="group rounded-lg px-2 py-1.5 transition-colors duration-75 hover:bg-[#1E293B]">
			<div className="flex items-baseline gap-2">
				<span
					className="text-[10px] font-medium"
					style={{ color }}
				>
					{entry.speaker}
				</span>
				<span className="text-[10px] tabular-nums text-[#64748B]">{time}</span>
			</div>
			<p className="mt-0.5 text-xs leading-relaxed text-[#E2E8F0]">
				{entry.text}
			</p>
		</div>
	);
}

function formatTimestamp(ts: number): string {
	if (!ts) return "";
	const date = new Date(ts);
	const h = date.getHours().toString().padStart(2, "0");
	const m = date.getMinutes().toString().padStart(2, "0");
	const s = date.getSeconds().toString().padStart(2, "0");
	return `${h}:${m}:${s}`;
}

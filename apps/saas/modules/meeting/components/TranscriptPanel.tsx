"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface TranscriptEntry {
	id: string;
	speaker: string;
	text: string;
	correctedText?: string | null;
	timestamp: number;
	source?: string;
}

interface TranscriptPanelProps {
	entries: TranscriptEntry[];
	sessionId: string;
	sessionStatus?: "ACTIVE" | "ENDED";
	/** IDs of transcript entries to highlight (from diagram selection) */
	highlightedEntryIds?: Set<string>;
	/** Called when a transcript entry is clicked (for diagram navigation) */
	onEntryClick?: (entry: TranscriptEntry) => void;
}

function formatTimestamp(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function getSpeakerColor(speaker: string): string {
	const lower = speaker.toLowerCase();
	if (
		lower.includes("you") ||
		lower.includes("consultant") ||
		lower.includes("consultor")
	) {
		return "#3B82F6";
	}
	return "#F97316";
}

// ── Pencil icon SVG ──
function PencilIcon({ className }: { className?: string }) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 16 16"
			fill="currentColor"
			className={className}
			width={12}
			height={12}
		>
			<path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25a1.75 1.75 0 0 1 .445-.758l8.61-8.61Zm1.414 1.06a.25.25 0 0 0-.354 0L3.463 11.1a.25.25 0 0 0-.064.108l-.631 2.21 2.21-.631a.25.25 0 0 0 .108-.064l8.61-8.61a.25.25 0 0 0 0-.354L12.427 2.487Z" />
		</svg>
	);
}

// ── Send icon SVG ──
function SendIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 16 16"
			fill="currentColor"
			width={14}
			height={14}
		>
			<path d="M.989 8 .064 2.68a1.342 1.342 0 0 1 1.85-1.462l13.402 5.744a1.13 1.13 0 0 1 0 2.076L1.913 14.782a1.343 1.343 0 0 1-1.85-1.463L.99 8Zm.603-5.288L2.38 7.25h4.87a.75.75 0 0 1 0 1.5H2.38l-.788 4.538L13.929 8 1.592 2.712Z" />
		</svg>
	);
}

export function TranscriptPanel({
	entries,
	sessionId,
	sessionStatus = "ACTIVE",
	highlightedEntryIds,
	onEntryClick,
}: TranscriptPanelProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editText, setEditText] = useState("");
	const [noteText, setNoteText] = useState("");
	const [isSending, setIsSending] = useState(false);
	const editInputRef = useRef<HTMLInputElement>(null);

	// Auto-scroll on new entries
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTo({
				top: scrollRef.current.scrollHeight,
				behavior: "smooth",
			});
		}
	}, [entries.length]);

	// Focus edit input when entering edit mode
	useEffect(() => {
		if (editingId && editInputRef.current) {
			editInputRef.current.focus();
			editInputRef.current.select();
		}
	}, [editingId]);

	// ── Edit handlers ──
	const startEdit = useCallback((entry: TranscriptEntry) => {
		setEditingId(entry.id);
		setEditText(entry.correctedText ?? entry.text);
	}, []);

	const cancelEdit = useCallback(() => {
		setEditingId(null);
		setEditText("");
	}, []);

	const saveEdit = useCallback(
		async (entryId: string) => {
			if (!editText.trim()) {
				cancelEdit();
				return;
			}

			try {
				await fetch(`/api/sessions/${sessionId}/transcript`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						entryId,
						correctedText: editText.trim(),
					}),
				});
			} catch {
				// Silent fail — the UI will revert on next poll
			}
			setEditingId(null);
			setEditText("");
		},
		[editText, sessionId, cancelEdit],
	);

	// ── Manual note handler ──
	const sendNote = useCallback(async () => {
		if (!noteText.trim() || isSending) return;

		setIsSending(true);
		try {
			await fetch(`/api/sessions/${sessionId}/transcript`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					text: noteText.trim(),
					source: "manual",
				}),
			});
			setNoteText("");
		} catch {
			// Silent fail
		} finally {
			setIsSending(false);
		}
	}, [noteText, isSending, sessionId]);

	return (
		<div className="flex h-full flex-col" style={{ background: "#0F172A" }}>
			{/* Panel header */}
			<div
				className="border-b px-4 py-3"
				style={{ borderColor: "#1E293B" }}
			>
				<span
					className="text-xs font-medium uppercase tracking-wider"
					style={{ color: "#F1F5F9" }}
				>
					Transcripción en Vivo
				</span>
			</div>

			{/* Transcript entries */}
			<div ref={scrollRef} className="flex-1 overflow-y-auto">
				{entries.length === 0 ? (
					<div className="flex flex-col items-center justify-center px-4 py-12 text-center">
						<div
							className="mb-3 flex h-8 w-8 items-center justify-center rounded-full border-2"
							style={{ borderColor: "#334155" }}
						>
							<div
								className="h-3 w-3 rounded-full"
								style={{ background: "#334155" }}
							/>
						</div>
						<p className="text-sm" style={{ color: "#64748B" }}>
							Escuchando...
						</p>
						<p className="mt-1 text-xs" style={{ color: "#94A3B8" }}>
							Aún no se detecta voz
						</p>
					</div>
				) : (
					entries.map((entry) => {
						const isManualNote = entry.source === "manual";
						const hasCorrectedText =
							entry.correctedText &&
							entry.correctedText !== entry.text;
						const isEditing = editingId === entry.id;
						const speakerColor = getSpeakerColor(entry.speaker);
						const isHighlighted = highlightedEntryIds?.has(entry.id);

						return (
							<div
								key={entry.id}
								className={`group relative border-b px-4 py-2.5 transition-colors duration-150 hover:bg-[#1E293B]/50 ${onEntryClick ? "cursor-pointer" : ""}`}
								style={{
									borderColor: "rgba(30, 41, 59, 0.5)",
									borderLeftWidth: isHighlighted ? 3 : undefined,
									borderLeftColor: isHighlighted ? "#3B82F6" : undefined,
									backgroundColor: isHighlighted ? "rgba(59, 130, 246, 0.08)" : undefined,
								}}
								onClick={() => onEntryClick?.(entry)}
							>
								{/* Speaker line + edit button */}
								<div className="flex items-baseline justify-between">
									<div className="flex items-center gap-1.5">
										<span
											className="text-sm font-semibold"
											style={{ color: speakerColor }}
										>
											{entry.speaker}
										</span>
										{isManualNote && (
											<span
												className="rounded px-1 py-0.5 text-[9px] font-bold uppercase leading-none tracking-wider"
												style={{
													background: "rgba(124, 58, 237, 0.2)",
													color: "#A78BFA",
												}}
											>
												NOTA
											</span>
										)}
									</div>
									<div className="flex items-center gap-1.5">
										{/* Edit icon — visible on hover */}
										{!isEditing && (
											<button
												type="button"
												onClick={() => startEdit(entry)}
												className="opacity-40 transition-opacity duration-300 group-hover:opacity-100"
												style={{ color: "#94A3B8" }}
												title="Editar entrada"
											>
												<PencilIcon />
											</button>
										)}
										<span
											className="text-[10px]"
											style={{ color: "#94A3B8" }}
										>
											{formatTimestamp(entry.timestamp)}
										</span>
									</div>
								</div>

								{/* Text content */}
								{isEditing ? (
									<div className="mt-1">
										<input
											ref={editInputRef}
											type="text"
											value={editText}
											onChange={(e) =>
												setEditText(e.target.value)
											}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													saveEdit(entry.id);
												} else if (e.key === "Escape") {
													cancelEdit();
												}
											}}
											onBlur={() => cancelEdit()}
											className="w-full rounded px-2 py-1 text-sm leading-relaxed outline-none transition-all duration-300"
											style={{
												background: "#1E293B",
												border: "1px solid #334155",
												color: "#F1F5F9",
											}}
										/>
										<p
											className="mt-0.5 text-[10px]"
											style={{ color: "#94A3B8" }}
										>
											Enter para guardar, Esc para
											cancelar
										</p>
									</div>
								) : (
									<div className="mt-0.5">
										{hasCorrectedText ? (
											<>
												<p
													className="text-sm leading-relaxed line-through"
													style={{
														color: "#64748B",
													}}
												>
													{entry.text}
												</p>
												<p
													className="text-sm leading-relaxed"
													style={{
														color: "#F1F5F9",
													}}
												>
													{entry.correctedText}
												</p>
											</>
										) : (
											<p
												className="text-sm leading-relaxed"
												style={{ color: "#F1F5F9" }}
											>
												{entry.text}
											</p>
										)}
									</div>
								)}
							</div>
						);
					})
				)}
			</div>

			{/* Manual note input */}
			{sessionStatus === "ACTIVE" && (
				<div
					className="border-t px-4 py-3"
					style={{ borderColor: "#1E293B" }}
				>
					<div className="flex items-center gap-2">
						<input
							type="text"
							value={noteText}
							onChange={(e) => setNoteText(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter" && !e.shiftKey) {
									e.preventDefault();
									sendNote();
								}
							}}
							placeholder="Agregar nota..."
							className="flex-1 rounded px-2.5 py-1.5 text-sm outline-none transition-colors duration-300 focus:ring-2 focus:ring-[#2563EB]/50 placeholder:text-[#64748B]"
							style={{
								background: "#1E293B",
								border: "1px solid #334155",
								color: "#F1F5F9",
							}}
							disabled={isSending}
						/>
						<button
							type="button"
							onClick={sendNote}
							disabled={!noteText.trim() || isSending}
							className="flex items-center gap-1 rounded px-2.5 py-1.5 text-xs font-medium transition-all duration-300 hover:bg-[#2563EB]/80 active:scale-[0.97] disabled:opacity-40"
							style={{
								background: noteText.trim()
									? "#3B82F6"
									: "#1E293B",
								color: noteText.trim()
									? "#FFFFFF"
									: "#64748B",
							}}
						>
							<SendIcon />
							<span>Enviar</span>
						</button>
					</div>
				</div>
			)}
		</div>
	);
}

"use client";

import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { useEffect, useRef, useState } from "react";
import { useDiscoveryChat } from "@discovery/hooks/use-discovery-chat";
import { ChatMessage, TypingIndicator } from "@discovery/components/ChatMessage";
import { ArchitectureReview } from "@discovery/components/ArchitectureReview";

// ────────────────────────────────────────────────────────────────────────────
// Keyframe injection (done once, avoids global CSS dependency)
// ────────────────────────────────────────────────────────────────────────────

const KEYFRAMES = `
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes pulse-ring {
  0% { transform: scale(0.8); opacity: 0.5; }
  50% { transform: scale(1.2); opacity: 0; }
  100% { transform: scale(0.8); opacity: 0; }
}
`;

// ────────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────────

function ProgressBar({ percent }: { percent: number }) {
	return (
		<div className="flex items-center gap-3">
			<div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
				<div
					className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
					style={{ width: `${percent}%` }}
				/>
			</div>
			<span className="text-[11px] font-medium tabular-nums text-muted-foreground">
				{percent}%
			</span>
		</div>
	);
}

function GeneratingOverlay() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 animate-[fadeSlideIn_0.3s_ease-out]">
			{/* Animated ring */}
			<div className="relative flex h-20 w-20 items-center justify-center">
				<div className="absolute inset-0 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
				<div
					className="absolute inset-2 rounded-full border-2 border-primary/10 border-b-primary/40"
					style={{ animation: "spin 1.5s linear infinite reverse" }}
				/>
				<svg
					className="h-8 w-8 text-primary"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<rect width="18" height="18" x="3" y="3" rx="2" />
					<path d="M3 9h18" />
					<path d="M9 21V9" />
				</svg>
			</div>
			<div className="text-center">
				<p className="text-sm font-semibold text-foreground">
					Generando arquitectura...
				</p>
				<p className="mt-1 text-xs text-muted-foreground">
					Analizando tus respuestas para diseñar un mapa de procesos
					personalizado
				</p>
			</div>
		</div>
	);
}

// ────────────────────────────────────────────────────────────────────────────
// Main component
// ────────────────────────────────────────────────────────────────────────────

interface DiscoveryChatProps {
	organizationSlug: string;
}

export function DiscoveryChat({ organizationSlug }: DiscoveryChatProps) {
	const {
		messages,
		phase,
		progressPercent,
		isTyping,
		suggestedProcesses,
		initialize,
		sendMessage,
		generateArchitecture,
		toggleConfirm,
		toggleCritical,
		removeProcess,
		restoreProcess,
		confirmArchitecture,
	} = useDiscoveryChat();

	const [inputValue, setInputValue] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const chatContainerRef = useRef<HTMLDivElement>(null);

	// Initialize on mount
	useEffect(() => {
		initialize();
	}, [initialize]);

	// Auto-scroll to bottom on new messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages, isTyping]);

	// Trigger architecture generation when phase transitions
	useEffect(() => {
		if (phase === "generating" && suggestedProcesses.length === 0) {
			generateArchitecture();
		}
	}, [phase, suggestedProcesses.length, generateArchitecture]);

	const handleSend = () => {
		const trimmed = inputValue.trim();
		if (!trimmed || isTyping) return;
		sendMessage(trimmed);
		setInputValue("");
		// Keep focus on mobile
		inputRef.current?.focus();
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleConfirm = () => {
		const confirmed = confirmArchitecture();
		// In production, navigate to the next step
		console.log(
			`[${organizationSlug}] Architecture confirmed:`,
			confirmed,
		);
	};

	// ── Review phase ────────────────────────────────────────────────────
	if (phase === "review") {
		return (
			<>
				<style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
				<div className="flex h-[100dvh] flex-col bg-background">
					<ArchitectureReview
						processes={suggestedProcesses}
						onToggleConfirm={toggleConfirm}
						onToggleCritical={toggleCritical}
						onRemove={removeProcess}
						onRestore={restoreProcess}
						onConfirmArchitecture={handleConfirm}
					/>
				</div>
			</>
		);
	}

	// ── Chat / Generating phase ─────────────────────────────────────────
	return (
		<>
			<style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
			<div className="flex h-[100dvh] flex-col bg-background">
				{/* Top bar */}
				<header className="shrink-0 border-b border-border/50 bg-background/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-sm">
					<div className="flex items-center gap-3">
						{/* Back button */}
						<a
							href={`/${organizationSlug}/descubrir`}
							className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted active:bg-muted"
						>
							<svg
								className="h-5 w-5"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<path d="M15 18l-6-6 6-6" />
							</svg>
						</a>

						{/* Title */}
						<div className="flex-1">
							<h1 className="text-sm font-semibold text-foreground">
								Discovery Organizacional
							</h1>
							<p className="text-[11px] text-muted-foreground">
								Consultor BPM • Entrevista
							</p>
						</div>

						{/* Online indicator */}
						<div className="flex items-center gap-1.5">
							<span className="relative flex h-2.5 w-2.5">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
								<span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
							</span>
							<span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
								En línea
							</span>
						</div>
					</div>

					{/* Progress */}
					{phase === "interview" && (
						<div className="mt-3">
							<ProgressBar percent={progressPercent} />
						</div>
					)}
				</header>

				{/* Messages area */}
				{phase === "generating" && suggestedProcesses.length === 0 ? (
					<GeneratingOverlay />
				) : (
					<div
						ref={chatContainerRef}
						className="flex-1 overflow-y-auto overscroll-contain px-4 py-4"
					>
						<div className="mx-auto flex max-w-2xl flex-col gap-3">
							{messages.map((msg) => (
								<ChatMessage key={msg.id} message={msg} />
							))}
							{isTyping && <TypingIndicator />}
							<div ref={messagesEndRef} />
						</div>
					</div>
				)}

				{/* Input area */}
				{phase === "interview" && (
					<div className="shrink-0 border-t border-border/50 bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
						<div className="mx-auto flex max-w-2xl items-end gap-2">
							<div className="relative flex-1">
								<input
									ref={inputRef}
									type="text"
									value={inputValue}
									onChange={(e) =>
										setInputValue(e.target.value)
									}
									onKeyDown={handleKeyDown}
									placeholder="Escribe tu respuesta..."
									disabled={isTyping}
									className={cn(
										"w-full rounded-2xl bg-muted/50 border border-border/50 px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground",
										"focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20",
										"disabled:opacity-50 disabled:cursor-not-allowed",
										"transition-all duration-200",
									)}
								/>
							</div>

							{/* Send button */}
							<button
								type="button"
								onClick={handleSend}
								disabled={!inputValue.trim() || isTyping}
								className={cn(
									"flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full transition-all duration-200 active:scale-95",
									inputValue.trim() && !isTyping
										? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
										: "bg-muted text-muted-foreground",
								)}
							>
								<svg
									className="h-5 w-5"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<line x1="22" y1="2" x2="11" y2="13" />
									<polygon points="22 2 15 22 11 13 2 9 22 2" />
								</svg>
							</button>
						</div>
					</div>
				)}
			</div>
		</>
	);
}

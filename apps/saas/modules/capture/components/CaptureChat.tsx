"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
	SendIcon,
	SparklesIcon,
	CheckIcon,
	LoaderIcon,
	CheckCircle2Icon,
	ArrowLeftIcon,
} from "lucide-react";
import { cn } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	useCaptureChat,
	type SipocPhase,
	type CaptureStatus,
	type GeneratingStep,
	type CaptureResult,
} from "@capture/hooks/use-capture-chat";
import Link from "next/link";

// ─── SIPOC phase definitions ─────────────────────────────────────────────────

const SIPOC_PHASES: Array<{ key: SipocPhase; label: string; fullLabel: string }> = [
	{ key: "S", label: "S", fullLabel: "Suppliers" },
	{ key: "I", label: "I", fullLabel: "Inputs" },
	{ key: "P", label: "P", fullLabel: "Process" },
	{ key: "O", label: "O", fullLabel: "Outputs" },
	{ key: "C", label: "C", fullLabel: "Customers" },
];

// ─── Keyframes ───────────────────────────────────────────────────────────────

const KEYFRAMES = `
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes captureSpinner {
  to { transform: rotate(360deg); }
}
`;

// ─── Phase indicator ─────────────────────────────────────────────────────────

function PhaseIndicator({
	currentPhase,
	completedPhases,
}: {
	currentPhase: SipocPhase;
	completedPhases: SipocPhase[];
}) {
	return (
		<div className="flex items-center gap-1.5">
			{SIPOC_PHASES.map((phase) => {
				const isCompleted = completedPhases.includes(phase.key);
				const isCurrent = phase.key === currentPhase && !isCompleted;

				return (
					<div
						key={phase.key}
						className={cn(
							"flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300",
							isCompleted && "text-white",
							isCurrent && "text-white shadow-md",
							!isCompleted && !isCurrent && "text-white/60",
						)}
						style={{
							backgroundColor: isCompleted
								? "#16A34A"
								: isCurrent
									? "#3B8FE8"
									: "rgba(148, 163, 184, 0.3)",
						}}
						title={phase.fullLabel}
					>
						{isCompleted ? <CheckIcon className="size-3.5" /> : phase.label}
					</div>
				);
			})}
		</div>
	);
}

// ─── Generating overlay ──────────────────────────────────────────────────────

function GeneratingOverlay({ steps }: { steps: GeneratingStep[] }) {
	return (
		<div
			className="flex flex-1 flex-col items-center justify-center gap-6 px-8"
			style={{ animation: "fadeSlideIn 0.3s ease-out" }}
		>
			{/* Spinner */}
			<div className="relative flex h-20 w-20 items-center justify-center">
				<div
					className="absolute inset-0 rounded-full border-4 border-t-transparent"
					style={{
						borderColor: "#E2E8F0",
						borderTopColor: "#3B8FE8",
						animation: "captureSpinner 1s linear infinite",
					}}
				/>
				<SparklesIcon className="size-8" style={{ color: "#3B8FE8" }} />
			</div>

			{/* Steps */}
			<div className="flex flex-col gap-3 w-full max-w-xs">
				{steps.map((step, i) => (
					<div key={i} className="flex items-center gap-3">
						{step.done ? (
							<CheckCircle2Icon className="size-5 shrink-0" style={{ color: "#16A34A" }} />
						) : (
							<LoaderIcon
								className="size-5 shrink-0"
								style={{
									color: "#94A3B8",
									animation: "captureSpinner 1.5s linear infinite",
								}}
							/>
						)}
						<span
							className="text-sm font-medium"
							style={{ color: step.done ? "#16A34A" : "#64748B" }}
						>
							{step.label}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

// ─── Complete card ───────────────────────────────────────────────────────────

function CompleteCard({
	result,
	organizationSlug,
	processId,
}: {
	result: CaptureResult;
	organizationSlug: string;
	processId: string;
}) {
	return (
		<div
			className="flex flex-1 flex-col items-center justify-center gap-6 px-6"
			style={{ animation: "fadeSlideIn 0.4s ease-out" }}
		>
			{/* Success icon */}
			<div
				className="flex h-16 w-16 items-center justify-center rounded-full"
				style={{ backgroundColor: "#F0FDF4" }}
			>
				<CheckCircle2Icon className="size-8" style={{ color: "#16A34A" }} />
			</div>

			{/* Summary card */}
			<div
				className="w-full max-w-sm rounded-2xl border p-6"
				style={{
					backgroundColor: "#FFFFFF",
					borderColor: "#E2E8F0",
					boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
				}}
			>
				<h3
					className="text-lg font-semibold text-center mb-4"
					style={{ color: "#0A1428" }}
				>
					{result.processName}
				</h3>

				<div className="grid grid-cols-2 gap-3 mb-4">
					<div
						className="rounded-xl px-4 py-3 text-center"
						style={{ backgroundColor: "#EFF6FF" }}
					>
						<p className="text-2xl font-bold" style={{ color: "#3B8FE8" }}>
							{result.stepsCount}
						</p>
						<p className="text-xs" style={{ color: "#64748B" }}>
							Pasos BPMN
						</p>
					</div>
					<div
						className="rounded-xl px-4 py-3 text-center"
						style={{ backgroundColor: "#FEF3C7" }}
					>
						<p className="text-2xl font-bold" style={{ color: "#D97706" }}>
							{result.risksCount}
						</p>
						<p className="text-xs" style={{ color: "#64748B" }}>
							Riesgos FMEA
						</p>
					</div>
				</div>

				{/* SIPOC summary chips */}
				<div className="flex flex-wrap gap-1.5 justify-center mb-5">
					{SIPOC_PHASES.map((phase) => (
						<span
							key={phase.key}
							className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
							style={{ backgroundColor: "#F0FDF4", color: "#16A34A" }}
						>
							{phase.label} ✓
						</span>
					))}
				</div>

				<Link
					href={`/${organizationSlug}/procesos/${processId}`}
					className="flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors hover:opacity-90 active:scale-[0.98]"
					style={{ backgroundColor: "#3B8FE8", minHeight: "48px" }}
				>
					Ver proceso completo
				</Link>
			</div>
		</div>
	);
}

// ─── Main component ──────────────────────────────────────────────────────────

interface CaptureChatProps {
	processId: string;
	processName: string;
	organizationSlug: string;
}

export function CaptureChat({ processId, processName, organizationSlug }: CaptureChatProps) {
	const {
		messages,
		currentPhase,
		completedPhases,
		status,
		generatingSteps,
		result,
		sending,
		sendMessage,
	} = useCaptureChat(processName);

	const [input, setInput] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	function handleSend() {
		if (!input.trim() || sending) return;
		sendMessage(input.trim());
		setInput("");
		inputRef.current?.focus();
	}

	function handleKeyDown(e: React.KeyboardEvent) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	}

	return (
		<div className="flex h-dvh flex-col" style={{ backgroundColor: "#F8FAFC" }}>
			{/* Inject keyframes */}
			<style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />

			{/* ── Header ────────────────────────────────────────────────── */}
			<div
				className="shrink-0 border-b px-4 py-3"
				style={{ backgroundColor: "#FFFFFF", borderColor: "#E2E8F0" }}
			>
				<div className="flex items-center gap-3">
					<Link
						href={`/${organizationSlug}/capture/new`}
						className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
						style={{ color: "#64748B" }}
					>
						<ArrowLeftIcon className="size-5" />
					</Link>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2">
							<h1
								className="text-sm font-semibold truncate"
								style={{ color: "#0A1428" }}
							>
								{processName}
							</h1>
							{status === "chatting" && (
								<span
									className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
									style={{ backgroundColor: "#EFF6FF", color: "#3B8FE8" }}
								>
									Capturando
								</span>
							)}
						</div>
					</div>
				</div>

				{/* SIPOC phase indicator */}
				{status === "chatting" && (
					<div className="mt-2.5 flex justify-center">
						<PhaseIndicator currentPhase={currentPhase} completedPhases={completedPhases} />
					</div>
				)}
			</div>

			{/* ── Content ───────────────────────────────────────────────── */}
			{status === "chatting" && (
				<>
					{/* Messages */}
					<div className="flex-1 overflow-y-auto px-3 py-4">
						<div className="mx-auto max-w-2xl space-y-3">
							{messages.map((msg, i) => (
								<div
									key={i}
									className={cn(
										"flex",
										msg.role === "user" ? "justify-end" : "justify-start",
									)}
									style={{ animation: "fadeSlideIn 0.3s ease-out" }}
								>
									{msg.role === "assistant" && (
										<div
											className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
											style={{ backgroundColor: "#EFF6FF" }}
										>
											<SparklesIcon className="size-3.5" style={{ color: "#3B8FE8" }} />
										</div>
									)}
									<div
										className={cn(
											"rounded-2xl px-4 py-3 text-sm leading-relaxed",
											msg.role === "user"
												? "max-w-[80%] rounded-br-md"
												: "max-w-[85%] rounded-bl-md",
										)}
										style={
											msg.role === "user"
												? { backgroundColor: "#3B8FE8", color: "#FFFFFF" }
												: {
														backgroundColor: "#FFFFFF",
														border: "1px solid #E2E8F0",
														color: "#0A1428",
														boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
													}
										}
									>
										{msg.content}
									</div>
								</div>
							))}

							{/* Typing indicator */}
							{sending && (
								<div className="flex justify-start">
									<div
										className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
										style={{ backgroundColor: "#EFF6FF" }}
									>
										<SparklesIcon className="size-3.5" style={{ color: "#3B8FE8" }} />
									</div>
									<div
										className="flex items-center gap-1.5 rounded-2xl rounded-bl-md px-4 py-3"
										style={{
											backgroundColor: "#FFFFFF",
											border: "1px solid #E2E8F0",
										}}
									>
										<span
											className="animate-bounce text-lg leading-none"
											style={{ color: "#94A3B8", animationDelay: "0ms" }}
										>
											·
										</span>
										<span
											className="animate-bounce text-lg leading-none"
											style={{ color: "#94A3B8", animationDelay: "150ms" }}
										>
											·
										</span>
										<span
											className="animate-bounce text-lg leading-none"
											style={{ color: "#94A3B8", animationDelay: "300ms" }}
										>
											·
										</span>
									</div>
								</div>
							)}

							<div ref={messagesEndRef} />
						</div>
					</div>

					{/* ── Input bar ────────────────────────────────────────── */}
					<div
						className="shrink-0 border-t px-3 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
						style={{ borderColor: "#E2E8F0", backgroundColor: "#FFFFFF" }}
					>
						<div className="mx-auto flex max-w-2xl items-center gap-2">
							<input
								ref={inputRef}
								type="text"
								enterKeyHint="send"
								value={input}
								onChange={(e) => setInput(e.target.value)}
								onKeyDown={handleKeyDown}
								placeholder="Escribe tu respuesta..."
								disabled={sending}
								className="h-12 flex-1 rounded-full border px-5 text-[16px] outline-none transition-colors focus:border-[#3B8FE8] focus:ring-1 focus:ring-[#3B8FE8]/30"
								style={{
									backgroundColor: "#F8FAFC",
									borderColor: "#E2E8F0",
									color: "#0A1428",
									boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
								}}
							/>
							<button
								onClick={handleSend}
								disabled={!input.trim() || sending}
								className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white transition-all disabled:opacity-40 active:scale-95"
								style={{ backgroundColor: "#3B8FE8" }}
							>
								<SendIcon className="size-5" />
							</button>
						</div>
					</div>
				</>
			)}

			{status === "generating" && <GeneratingOverlay steps={generatingSteps} />}

			{status === "complete" && result && (
				<CompleteCard
					result={result}
					organizationSlug={organizationSlug}
					processId={processId}
				/>
			)}
		</div>
	);
}

"use client";

import { useState, useRef, useEffect } from "react";
import { SendIcon, SparklesIcon, Zap } from "lucide-react";
import { TopicChips } from "./TopicChips";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { Input } from "@repo/ui/components/input";
import { Progress } from "@repo/ui/components/progress";
import { Avatar, AvatarFallback } from "@repo/ui/components/avatar";
import { Skeleton } from "@repo/ui/components/skeleton";
import { cn } from "@repo/ui";

interface ChatMessage {
	role: "user" | "assistant";
	content: string;
	timestamp: string;
}

interface SipocCoverage {
	suppliers: number;
	inputs: number;
	process: number;
	outputs: number;
	customers: number;
}

interface InterviewChatProps {
	messages: ChatMessage[];
	sending: boolean;
	error: string | null;
	completenessScore: number;
	sipocCoverage: SipocCoverage | null;
	readyForReveal: boolean;
	onSendMessage: (content: string) => void;
	onReveal: () => void;
	processName: string;
}

const SIPOC_DIMS = [
	{ key: "suppliers" as const, label: "S", fullLabel: "Proveedores" },
	{ key: "inputs" as const, label: "I", fullLabel: "Entradas" },
	{ key: "process" as const, label: "P", fullLabel: "Proceso" },
	{ key: "outputs" as const, label: "O", fullLabel: "Salidas" },
	{ key: "customers" as const, label: "C", fullLabel: "Clientes" },
] as const;

export function InterviewChat({
	messages,
	sending,
	error,
	completenessScore,
	sipocCoverage,
	readyForReveal,
	onSendMessage,
	onReveal,
	processName,
}: InterviewChatProps) {
	const [input, setInput] = useState("");
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	function handleSend() {
		if (!input.trim() || sending) return;
		onSendMessage(input.trim());
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
		<div className="flex h-full flex-col bg-background">
			{/* Header */}
			<div className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2 min-w-0">
						<SparklesIcon className="size-4 sm:size-5 shrink-0 text-primary" />
						<h2 className="text-sm sm:text-lg font-semibold truncate text-foreground">
							{processName}
						</h2>
					</div>
					<div className="flex items-center gap-2 shrink-0">
						{/* Completeness badge */}
						<Badge
							variant="outline"
							className={cn(
								"rounded-full border-transparent",
								completenessScore >= 70
									? "bg-primary/10 text-primary"
									: "bg-amber-500/10 text-amber-500",
							)}
						>
							<span className="text-[10px] sm:text-xs font-medium">
								{completenessScore}%
							</span>
						</Badge>
						{readyForReveal && (
							<Button
								variant="default"
								size="sm"
								onClick={onReveal}
								className="min-h-[36px] sm:min-h-[48px]"
							>
								Ver BPMN
							</Button>
						)}
					</div>
				</div>

				{/* SIPOC coverage bar — uses Progress component */}
				{sipocCoverage && (
					<div className="mt-2 sm:mt-3">
						<div className="flex items-center gap-1 mb-1">
							<Zap className="size-2.5 text-muted-foreground" />
							<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								Cobertura SIPOC
							</span>
						</div>
						<div className="flex items-center gap-2 sm:gap-3">
							{SIPOC_DIMS.map((dim) => {
								const val = sipocCoverage[dim.key];
								return (
									<div key={dim.key} className="flex items-center gap-1" title={dim.fullLabel}>
										<Badge
											variant="outline"
											className={cn(
												"flex h-5 w-5 items-center justify-center rounded px-0 text-[10px] font-bold",
												val >= 70
													? "bg-primary/10 text-primary border-primary/20"
													: val > 30
														? "bg-amber-500/10 text-amber-500 border-amber-500/20"
														: "bg-muted text-muted-foreground border-border",
											)}
										>
											{dim.label}
										</Badge>
										<Progress
											value={val}
											className="h-1.5 w-8 sm:w-12"
										/>
										<span className="hidden sm:inline text-[9px] font-medium text-muted-foreground">
											{dim.fullLabel}
										</span>
									</div>
								);
							})}
						</div>
					</div>
				)}
			</div>

			{/* Messages — full width on mobile */}
			<div className="flex-1 overflow-y-auto px-3 py-3 sm:px-6 sm:py-4">
				<div className="mx-auto max-w-2xl space-y-3 sm:space-y-4">
					{messages.map((msg, i) => (
						<div
							key={i}
							className={cn("flex gap-2", msg.role === "user" ? "justify-end" : "justify-start")}
						>
							{msg.role === "assistant" && (
								<Avatar size="sm" className="mt-1 shrink-0">
									<AvatarFallback>AI</AvatarFallback>
								</Avatar>
							)}
							<div
								className={cn(
									"rounded-2xl px-4 py-3 text-sm leading-relaxed",
									msg.role === "user"
										? "max-w-[85%] sm:max-w-[75%] bg-primary text-primary-foreground"
										: "max-w-[90%] sm:max-w-[80%] bg-muted text-foreground",
								)}
							>
								{msg.content}
							</div>
						</div>
					))}

					{/* Topic chips — shown when no user messages yet */}
					{messages.filter((m) => m.role === "user").length === 0 && !sending && (
						<TopicChips
							onSelect={(topic) => {
								const msg = topic.type === "new"
									? "Quiero explorar un proceso nuevo en mi empresa."
									: `Quiero profundizar en el proceso de ${topic.label}.`;
								onSendMessage(msg);
							}}
						/>
					)}

					{sending && (
						<div className="flex justify-start gap-2">
							<Avatar size="sm" className="mt-1 shrink-0">
								<AvatarFallback>AI</AvatarFallback>
							</Avatar>
							<div className="flex items-center gap-1.5 rounded-2xl bg-muted px-4 py-3">
								<Skeleton className="h-2 w-2 rounded-full" />
								<Skeleton className="h-2 w-2 rounded-full" />
								<Skeleton className="h-2 w-2 rounded-full" />
							</div>
						</div>
					)}

					{error && (
						<div className="flex justify-center">
							<Badge variant="destructive" className="rounded-md px-3 py-1.5 text-xs">
								{error}
							</Badge>
						</div>
					)}

					<div ref={messagesEndRef} />
				</div>
			</div>

			{/* Input — sticky bottom with safe area */}
			<div className="border-t border-border bg-background px-3 py-3 sm:px-6 sm:py-4 pb-safe">
				<div className="mx-auto flex max-w-2xl items-center gap-2 sm:gap-3">
					<Input
						ref={inputRef}
						type="text"
						enterKeyHint="send"
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder="Escribe tu respuesta..."
						disabled={sending}
						className="flex-1 rounded-xl border-border bg-muted text-foreground px-4 py-3 text-[16px] sm:text-sm min-h-[48px]"
					/>
					<Button
						variant="default"
						size="icon-lg"
						onClick={handleSend}
						disabled={!input.trim() || sending}
						className="rounded-xl min-h-[48px] min-w-[48px]"
					>
						<SendIcon className="size-5" />
					</Button>
				</div>
			</div>
		</div>
	);
}

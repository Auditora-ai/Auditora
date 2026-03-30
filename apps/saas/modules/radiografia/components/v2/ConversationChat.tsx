"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { SendIcon, AlertTriangleIcon } from "lucide-react";
import { Textarea } from "@repo/ui/components/textarea";
import { Button } from "@repo/ui/components/button";

export interface ChatMessage {
	role: "user" | "assistant";
	content: string;
	processCards?: CriticalProcess[];
}

export interface CriticalProcess {
	name: string;
	description: string;
	riskLevel: string;
}

interface ConversationChatProps {
	messages: ChatMessage[];
	input: string;
	onInputChange: (value: string) => void;
	onSendMessage: () => void;
	loading: boolean;
	selectedProcess: string;
	onSelectProcess: (name: string) => void;
}

export function ConversationChat({
	messages,
	input,
	onInputChange,
	onSendMessage,
	loading,
	selectedProcess,
	onSelectProcess,
}: ConversationChatProps) {
	const t = useTranslations("scan");
	const messagesEndRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			onSendMessage();
		}
	}

	return (
		<div className="flex flex-1 flex-col">
			{/* Messages */}
			<div className="flex-1 overflow-y-auto px-4 py-4 md:px-6">
				<div className="mx-auto max-w-2xl space-y-4">
					{messages.map((msg, i) => (
						<div key={i}>
							{/* Chat bubble */}
							<div className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
								<div
									className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
										msg.role === "user"
											? "bg-primary text-primary-foreground"
											: "border border-border bg-secondary text-foreground"
									}`}
								>
									{msg.content}
								</div>
							</div>

							{/* Process selection cards (inline in chat) */}
							{msg.processCards && msg.processCards.length > 0 && (
								<div className="mt-3 space-y-2 pl-0 md:pl-2">
									{msg.processCards.map((proc) => {
										const isSelected = selectedProcess === proc.name;
										return (
											<button
												key={proc.name}
												type="button"
												onClick={() => onSelectProcess(proc.name)}
												className={`w-full rounded-xl border p-4 text-left transition-all duration-200 ${
													isSelected
														? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
														: "border-border bg-background hover:border-primary/30 hover:bg-accent/50"
												}`}
											>
												<div className="flex items-start gap-3">
													<div
														className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
															isSelected ? "border-primary bg-primary" : "border-border"
														}`}
													>
														{isSelected && <div className="size-1.5 rounded-full bg-white" />}
													</div>
													<div className="flex-1 min-w-0">
														<div className="flex items-center gap-2">
															<h4 className="text-sm font-semibold text-foreground truncate">
																{proc.name}
															</h4>
															<span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive">
																<AlertTriangleIcon className="size-2.5" />
																{proc.riskLevel}
															</span>
														</div>
														<p className="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
															{proc.description}
														</p>
													</div>
												</div>
											</button>
										);
									})}
								</div>
							)}
						</div>
					))}

					{/* Loading dots */}
					{loading && (
						<div className="flex justify-start">
							<div className="rounded-2xl border border-border bg-secondary px-4 py-3">
								<span className="flex gap-1">
									<span className="size-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
									<span className="size-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "150ms" }} />
									<span className="size-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: "300ms" }} />
								</span>
							</div>
						</div>
					)}
					<div ref={messagesEndRef} />
				</div>
			</div>

			{/* Input */}
			<div className="border-t border-border bg-background/80 px-4 py-3 backdrop-blur-sm md:px-6">
				<div className="mx-auto flex max-w-2xl gap-2">
					<Textarea
						value={input}
						onChange={(e) => onInputChange(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder={t("v2.chatPlaceholder")}
						disabled={loading || !selectedProcess}
						rows={1}
						className="min-h-[44px] max-h-32 resize-none"
					/>
					<Button
						onClick={onSendMessage}
						disabled={!input.trim() || loading || !selectedProcess}
						size="icon"
						className="size-11 shrink-0"
					>
						<SendIcon className="size-4" />
					</Button>
				</div>
			</div>
		</div>
	);
}

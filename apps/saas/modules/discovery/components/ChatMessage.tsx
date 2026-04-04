"use client";

import { cn } from "@repo/ui";
import type { ChatMessage as ChatMessageType } from "@discovery/hooks/use-discovery-chat";

interface ChatMessageProps {
	message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
	const isAi = message.role === "ai";

	return (
		<div
			className={cn(
				"flex w-full animate-[fadeSlideIn_0.3s_ease-out]",
				isAi ? "justify-start" : "justify-end",
			)}
		>
			{/* Avatar for AI */}
			{isAi && (
				<div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
					<svg
						className="h-4 w-4 text-primary"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M12 8V4H8" />
						<rect width="16" height="12" x="4" y="8" rx="2" />
						<path d="M2 14h2" />
						<path d="M20 14h2" />
						<path d="M15 13v2" />
						<path d="M9 13v2" />
					</svg>
				</div>
			)}

			{/* Bubble */}
			<div
				className={cn(
					"relative max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
					isAi
						? "bg-muted/70 text-foreground dark:bg-muted/50"
						: "bg-primary text-primary-foreground",
				)}
			>
				{/* Tail nub */}
				<div
					className={cn(
						"absolute top-3 h-3 w-3 rotate-45",
						isAi
							? "-left-1.5 bg-muted/70 dark:bg-muted/50"
							: "-right-1.5 bg-primary",
					)}
				/>
				<p className="relative z-10 whitespace-pre-wrap">{message.content}</p>
				<span
					className={cn(
						"mt-1 block text-right text-[10px]",
						isAi
							? "text-muted-foreground/60"
							: "text-primary-foreground/70",
					)}
				>
					{message.timestamp.toLocaleTimeString([], {
						hour: "2-digit",
						minute: "2-digit",
					})}
				</span>
			</div>
		</div>
	);
}

// Typing indicator
export function TypingIndicator() {
	return (
		<div className="flex justify-start animate-[fadeSlideIn_0.2s_ease-out]">
			<div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
				<svg
					className="h-4 w-4 text-primary"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M12 8V4H8" />
					<rect width="16" height="12" x="4" y="8" rx="2" />
					<path d="M2 14h2" />
					<path d="M20 14h2" />
					<path d="M15 13v2" />
					<path d="M9 13v2" />
				</svg>
			</div>
			<div className="rounded-2xl bg-muted/70 px-4 py-3 dark:bg-muted/50">
				<div className="flex items-center gap-1">
					<span className="inline-block h-2 w-2 animate-[bounce_1.4s_ease-in-out_infinite] rounded-full bg-muted-foreground/40" />
					<span className="inline-block h-2 w-2 animate-[bounce_1.4s_ease-in-out_0.2s_infinite] rounded-full bg-muted-foreground/40" />
					<span className="inline-block h-2 w-2 animate-[bounce_1.4s_ease-in-out_0.4s_infinite] rounded-full bg-muted-foreground/40" />
				</div>
			</div>
		</div>
	);
}

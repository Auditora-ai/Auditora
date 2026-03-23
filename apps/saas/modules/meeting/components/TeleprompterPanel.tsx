"use client";

import { usePanelFlash } from "../hooks/usePanelFlash";

interface TeleprompterPanelProps {
	currentQuestion: string;
	questionQueue: string[];
	aiSuggestion: string | null;
	sessionType: "DISCOVERY" | "DEEP_DIVE";
	isFlashing?: boolean;
}

export function TeleprompterPanel({
	currentQuestion,
	questionQueue,
	aiSuggestion,
	sessionType,
	isFlashing = false,
}: TeleprompterPanelProps) {
	const flashStyle = usePanelFlash(isFlashing, {
		color: "rgba(14, 165, 233, 0.4)",
	});

	return (
		<div className="flex h-full flex-col" style={flashStyle}>
			{/* Panel header */}
			<div className="border-b border-border px-3 py-2.5">
				<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					Teleprompter
				</span>
				<span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[10px] text-muted-foreground">
					{sessionType === "DISCOVERY" ? "Discovery" : "Deep Dive"}
				</span>
			</div>

			{/* Current question — large, prominent */}
			<div className="border-b border-border bg-primary/10 px-4 py-4">
				<div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
					Ask Now
				</div>
				<p className="text-lg leading-relaxed text-foreground">
					{currentQuestion}
				</p>
			</div>

			{/* Question queue */}
			<div className="flex-1 overflow-y-auto">
				{questionQueue.map((question, index) => (
					<div
						key={index}
						className="border-b border-border/50 px-4 py-3"
					>
						<span className="mr-2 text-xs font-semibold text-muted-foreground">
							{index + 1}.
						</span>
						<span className="text-sm leading-relaxed text-muted-foreground">
							{question}
						</span>
					</div>
				))}
				{questionQueue.length === 0 && (
					<div className="px-4 py-8 text-center">
						<p className="text-sm text-muted-foreground">
							Start speaking to activate guided questions
						</p>
					</div>
				)}
			</div>

			{/* AI suggestion */}
			{aiSuggestion && (
				<div className="border-t border-border bg-accent px-4 py-3">
					<div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
						AI Suggestion
					</div>
					<p className="text-xs leading-relaxed text-foreground/70">
						{aiSuggestion}
					</p>
				</div>
			)}
		</div>
	);
}

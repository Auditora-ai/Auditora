"use client";

import { BotActivityIndicator } from "./BotActivityIndicator";
import type { BotActivity, ActivityLogEntry } from "../types";

type LayoutPreset = "balanced" | "diagram-focus" | "transcript-focus" | "fullscreen";
type ConnectionStatus = "connected" | "degraded" | "disconnected";

interface StatusBarProps {
	connectionStatus: ConnectionStatus;
	isRecording: boolean;
	nodeCount: number;
	confirmedCount: number;
	formingCount: number;
	elapsedTime: number;
	layout: LayoutPreset;
	onLayoutChange: (layout: LayoutPreset) => void;
	sessionId: string;
	onEndSession: () => void;
	botActivity: BotActivity;
	activityLog: ActivityLogEntry[];
	onNewNodes?: boolean;
}

const STATUS_COLORS: Record<ConnectionStatus, string> = {
	connected: "bg-success",
	degraded: "bg-amber-500",
	disconnected: "bg-destructive",
};

const STATUS_LABELS: Record<ConnectionStatus, string> = {
	connected: "Connected",
	degraded: "Degraded",
	disconnected: "Disconnected",
};

function formatElapsedTime(seconds: number): string {
	const hrs = Math.floor(seconds / 3600);
	const mins = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;
	if (hrs > 0) {
		return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	}
	return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function StatusBar({
	connectionStatus,
	isRecording,
	nodeCount,
	confirmedCount,
	formingCount,
	elapsedTime,
	layout,
	onLayoutChange,
	onEndSession,
	botActivity,
	activityLog,
	onNewNodes,
}: StatusBarProps) {
	return (
		<div className="flex items-center gap-4 border-t border-border bg-background px-4 py-2 text-[11px] text-muted-foreground">
			{/* Connection status */}
			<div className="flex items-center gap-1.5">
				<span
					className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[connectionStatus]} ${
						connectionStatus === "connected" ? "animate-pulse" : ""
					}`}
				/>
				<span className="text-[#F1F5F9]">{STATUS_LABELS[connectionStatus]}</span>
			</div>

			{/* Recording indicator */}
			{isRecording && (
				<div className="flex items-center gap-1.5 text-destructive">
					<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#EF4444]" />
					<span className="font-medium">REC</span>
				</div>
			)}

			<span className="text-border">|</span>

			{/* Elapsed time */}
			<span className="text-[#F1F5F9] tabular-nums" style={{ fontVariantNumeric: "tabular-nums" }}>
				{formatElapsedTime(elapsedTime)}
			</span>

			<span className="text-border">|</span>

			{/* Node stats */}
			<span aria-live="polite">
				<span className="text-[#F1F5F9]">{nodeCount}</span> <span className="text-[#94A3B8]">nodes</span> &middot; <span className="text-[#F1F5F9]">{confirmedCount}</span> <span className="text-[#94A3B8]">confirmed</span>
				{formingCount > 0 && (
					<span className="text-amber-500">
						{" "}
						&middot; {formingCount} forming
					</span>
				)}
			</span>

			<span className="text-border">|</span>

			{/* Bot activity indicator */}
			<div role="status" aria-live="polite">
				<BotActivityIndicator
					activity={botActivity}
					activityLog={activityLog}
					onNewNodes={onNewNodes}
				/>
			</div>

			{/* Layout presets — right aligned */}
			<div className="ml-auto flex items-center gap-1">
				<span className="mr-1 text-muted-foreground/60">Layout:</span>
				{(
					[
						"balanced",
						"diagram-focus",
						"transcript-focus",
					] as LayoutPreset[]
				).map((preset) => (
					<button
						key={preset}
						type="button"
						onClick={() => onLayoutChange(preset)}
						className={`rounded px-1.5 py-0.5 text-[10px] transition-all duration-150 ${
							layout === preset
								? "bg-[#2563EB] text-white"
								: "text-[#94A3B8] hover:bg-[#334155] hover:text-[#F1F5F9]"
						}`}
					>
						{preset === "balanced"
							? "Balanced"
							: preset === "diagram-focus"
								? "Diagram"
								: "Transcript"}
					</button>
				))}
			</div>

			{/* End Session button */}
			<button
				type="button"
				onClick={onEndSession}
				className="ml-2 rounded border border-red-500 bg-red-600 px-2 py-0.5 text-[10px] font-medium text-white transition-colors hover:bg-red-500 active:scale-[0.97]"
			>
				End Session
			</button>
		</div>
	);
}

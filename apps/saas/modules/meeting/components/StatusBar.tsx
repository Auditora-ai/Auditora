"use client";

type LayoutPreset = "balanced" | "diagram-focus" | "transcript-focus";
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
}: StatusBarProps) {
	return (
		<div className="flex items-center gap-4 border-t border-border bg-background px-4 py-1.5 text-[11px] text-muted-foreground">
			{/* Connection status */}
			<div className="flex items-center gap-1.5">
				<span
					className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[connectionStatus]} ${
						connectionStatus === "connected" ? "animate-pulse" : ""
					}`}
				/>
				<span>{STATUS_LABELS[connectionStatus]}</span>
			</div>

			{/* Recording indicator */}
			{isRecording && (
				<div className="flex items-center gap-1.5 text-destructive">
					<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-destructive" />
					<span className="font-medium">REC</span>
				</div>
			)}

			<span className="text-border">|</span>

			{/* Elapsed time */}
			<span className="tabular-nums">
				{formatElapsedTime(elapsedTime)}
			</span>

			<span className="text-border">|</span>

			{/* Node stats */}
			<span>
				{nodeCount} nodes &middot; {confirmedCount} confirmed
				{formingCount > 0 && (
					<span className="text-amber-500">
						{" "}
						&middot; {formingCount} forming
					</span>
				)}
			</span>

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
						className={`rounded px-1.5 py-0.5 text-[10px] transition-colors ${
							layout === preset
								? "bg-accent text-foreground"
								: "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
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
				className="ml-2 rounded bg-destructive px-2 py-0.5 text-[10px] font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
			>
				End Session
			</button>
		</div>
	);
}

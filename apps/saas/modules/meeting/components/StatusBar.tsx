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
}

const STATUS_COLORS: Record<ConnectionStatus, string> = {
  connected: "bg-emerald-500",
  degraded: "bg-amber-500",
  disconnected: "bg-red-500",
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
  sessionId,
}: StatusBarProps) {
  return (
    <div className="flex items-center gap-4 border-t border-slate-800 bg-slate-950 px-4 py-1.5 text-[11px] text-slate-400">
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
        <div className="flex items-center gap-1.5 text-red-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          <span className="font-medium">REC</span>
        </div>
      )}

      <span className="text-slate-700">|</span>

      {/* Elapsed time */}
      <span className="tabular-nums">{formatElapsedTime(elapsedTime)}</span>

      <span className="text-slate-700">|</span>

      {/* Node stats */}
      <span>
        {nodeCount} nodes &middot; {confirmedCount} confirmed
        {formingCount > 0 && (
          <span className="text-amber-400"> &middot; {formingCount} forming</span>
        )}
      </span>

      {/* Layout presets — right aligned */}
      <div className="ml-auto flex items-center gap-1">
        <span className="mr-1 text-slate-600">Layout:</span>
        {(["balanced", "diagram-focus", "transcript-focus"] as LayoutPreset[]).map(
          (preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onLayoutChange(preset)}
              className={`rounded px-1.5 py-0.5 text-[10px] transition-colors ${
                layout === preset
                  ? "bg-slate-700 text-slate-200"
                  : "text-slate-500 hover:bg-slate-800 hover:text-slate-300"
              }`}
            >
              {preset === "balanced"
                ? "Balanced"
                : preset === "diagram-focus"
                  ? "Diagram"
                  : "Transcript"}
            </button>
          )
        )}
      </div>
    </div>
  );
}

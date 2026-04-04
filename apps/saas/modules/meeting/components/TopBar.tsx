"use client";

import { useState, useRef, useCallback, useImperativeHandle, forwardRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useLiveSessionContext } from "../context/LiveSessionContext";
import { CompletenessRing } from "./CompletenessRing";
import {
	DownloadIcon,
	LinkIcon,
	PowerIcon,
	SparklesIcon,
	RefreshCwIcon,
	PhoneCallIcon,
	XIcon,
	ImageIcon,
	FileCodeIcon,
	FileTextIcon,
	ClipboardListIcon,
	FileIcon,
	ChevronDownIcon,
	Trash2Icon,
} from "lucide-react";

interface TopBarProps {
	processName?: string;
	clientName?: string;
}

export function TopBar({ processName: initialName, clientName }: TopBarProps) {
	const t = useTranslations("meeting");
	const {
		botActivity,
		completenessScore,
		aiEnabled,
		toggleAi,
		exportDiagram,
		endSession,
		sessionId,
		sessionStatus,
		connectionStatus,
		processId,
		shareToken,
		modelerApi,
		setProcessId,
	} = useLiveSessionContext();

	const isInCall = connectionStatus === "connected" && !botActivity.stale && sessionStatus !== "FAILED";
	const liveIndicatorRef = useRef<{ flash: () => void }>(null);

	const handleAiClick = useCallback(() => {
		if (!isInCall) {
			liveIndicatorRef.current?.flash();
			return;
		}
		toggleAi();
	}, [isInCall, toggleAi]);

	const [processName, setProcessName] = useState(initialName || "");
	const [editing, setEditing] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const saveProcessName = async (name: string) => {
		const trimmed = name.trim();
		if (!trimmed || trimmed === processName) {
			setEditing(false);
			return;
		}
		setProcessName(trimmed);
		setEditing(false);

		// Update pool name in bpmn-js
		try {
			const modeler = modelerApi?.getModeler();
			if (modeler) {
				const elementRegistry = modeler.get("elementRegistry");
				const modeling = modeler.get("modeling");
				const participants = elementRegistry.filter((e: any) => e.type === "bpmn:Participant");
				if (participants.length > 0) {
					modeling.updateProperties(participants[0], { name: trimmed });
				}
			}
		} catch { /* ok */ }

		// Save to DB — creates process if none exists, updates name if it does
		try {
			const res = await fetch(`/api/sessions/${sessionId}/ensure-process`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: trimmed }),
			});
			if (res.ok) {
				const data = await res.json();
				if (data.created && data.processId) {
					setProcessId(data.processId);
				}
			}
		} catch { /* non-critical */ }
	};

	return (
		<div
			className="flex items-center justify-between border-b border-chrome-border bg-chrome-base px-4"
			style={{ gridArea: "top", height: 48 }}
		>
			{/* Left: Logo */}
			<div className="flex items-center gap-3">
				<span className="flex items-center">
					<svg className="h-6 w-6 text-primary" viewBox="0 0 32 32" fill="none">
						<circle cx="8" cy="16" r="3" fill="currentColor" />
						<circle cx="24" cy="8" r="3" fill="currentColor" />
						<circle cx="24" cy="24" r="3" fill="currentColor" />
						<path d="M11 16L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
						<path d="M11 16L21 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
						<rect x="15" y="14" width="4" height="4" rx="1" fill="currentColor" opacity="0.4" transform="rotate(45 17 16)" />
					</svg>
					<span className="ml-1.5 text-sm tracking-tight">
						<span className="font-bold text-white">AI</span>
						<span className="font-light text-chrome-text-secondary">process.me</span>
					</span>
				</span>
				<div className="h-4 w-px bg-chrome-hover" />
				{editing ? (
					<input
						ref={inputRef}
						defaultValue={processName}
						onBlur={(e) => saveProcessName(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") saveProcessName(e.currentTarget.value);
							if (e.key === "Escape") setEditing(false);
						}}
						autoFocus
						className="max-w-[280px] rounded bg-chrome-raised px-2 py-0.5 text-sm text-chrome-text outline-none ring-1 ring-primary"
					/>
				) : (
					<button
						type="button"
						onClick={() => setEditing(true)}
						className="max-w-[280px] truncate rounded px-1 py-0.5 text-sm font-medium text-chrome-text transition-colors hover:bg-chrome-raised"
						title={t("topBar.processNameTitle")}
					>
						{processName || t("topBar.newSession")}
					</button>
				)}
				{clientName && (
					<span className="text-xs text-chrome-text-muted">
						— {clientName}
					</span>
				)}
			</div>

			{/* Center: Live indicator + Completeness */}
			<div className="flex items-center gap-4">
				<LiveIndicator ref={liveIndicatorRef} stale={botActivity.stale} activity={botActivity} />
				<CompletenessRing score={completenessScore} />
			</div>

			{/* Right: Actions */}
			<div className="flex items-center gap-2">
				<ExportDropdown />
				<ShareButton />
				<TopBarButton
					icon={<PowerIcon className="h-3.5 w-3.5" />}
					label={t("topBar.endButton")}
					onClick={endSession}
					variant="danger"
				/>
				<div className="ml-2 h-4 w-px bg-chrome-hover" />
				<button
					type="button"
					onClick={handleAiClick}
					className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors duration-75 ${
						!isInCall
							? "bg-chrome-raised/60 text-chrome-subtle"
							: aiEnabled
								? "bg-primary text-white"
								: "bg-chrome-raised text-chrome-text-muted"
					}`}
				>
					<SparklesIcon className="h-3.5 w-3.5" />
					{!isInCall ? t("topBar.aiNotInCall") : aiEnabled ? t("topBar.aiAnalyzing") : t("topBar.aiPaused")}
				</button>
				<FontScaleControl />
			</div>
		</div>
	);
}

const FONT_SCALES = [0.9, 1, 1.15, 1.3];

function FontScaleControl() {
	const t = useTranslations("meeting");
	const [scaleIndex, setScaleIndex] = useState(1);

	// Sync from localStorage after mount (avoids hydration mismatch)
	useEffect(() => {
		const saved = localStorage.getItem("fontScale");
		if (saved) {
			const idx = FONT_SCALES.indexOf(Number(saved));
			if (idx >= 0 && idx !== 1) setScaleIndex(idx);
		}
	}, []);

	const applyScale = useCallback((idx: number) => {
		const clamped = Math.max(0, Math.min(FONT_SCALES.length - 1, idx));
		setScaleIndex(clamped);
		const value = String(FONT_SCALES[clamped]);
		document.documentElement.style.setProperty("--font-scale", value);
		localStorage.setItem("fontScale", value);
	}, []);

	return (
		<div className="ml-1 flex items-center rounded-lg bg-chrome-raised p-0.5">
			<button
				type="button"
				onClick={() => applyScale(scaleIndex - 1)}
				disabled={scaleIndex === 0}
				className="rounded px-1.5 py-0.5 text-[10px] font-medium text-chrome-text-muted transition-colors hover:text-white disabled:opacity-30"
				title={t("topBar.fontDecrease")}
			>
				A-
			</button>
			<button
				type="button"
				onClick={() => applyScale(1)}
				className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${scaleIndex === 1 ? "text-primary" : "text-chrome-text-muted hover:text-white"}`}
				title={t("topBar.fontNormal")}
			>
				A
			</button>
			<button
				type="button"
				onClick={() => applyScale(scaleIndex + 1)}
				disabled={scaleIndex === FONT_SCALES.length - 1}
				className="rounded px-1.5 py-0.5 text-[10px] font-medium text-chrome-text-muted transition-colors hover:text-white disabled:opacity-30"
				title={t("topBar.fontIncrease")}
			>
				A+
			</button>
		</div>
	);
}

const LiveIndicator = forwardRef<{ flash: () => void }, { stale: boolean; activity: { type: string; detail: string | null } }>(
	function LiveIndicator({ stale, activity }, ref) {
	const t = useTranslations("meeting");
	const { sessionId, sessionStatus, connectionStatus } = useLiveSessionContext();
	const [showPanel, setShowPanel] = useState(false);
	const [newUrl, setNewUrl] = useState("");
	const [reconnecting, setReconnecting] = useState(false);
	const [flashing, setFlashing] = useState(false);

	useImperativeHandle(ref, () => ({
		flash: () => {
			setFlashing(true);
			setShowPanel(true);
			setTimeout(() => setFlashing(false), 1000);
		},
	}));

	// Determine visual state — "Local" is the calm default
	const getIndicatorState = (): { color: string; textColor: string; text: string; animation: "pulse" | "ping" | "" } => {
		// Error states — red, something is wrong
		if (sessionStatus === "FAILED")
			return { color: "bg-red-500", textColor: "text-red-400", text: t("topBar.botDisconnected"), animation: "pulse" };
		if (connectionStatus === "disconnected" && !stale)
			return { color: "bg-red-500", textColor: "text-red-400", text: t("topBar.disconnected"), animation: "pulse" };
		// In-progress states — blue, working on it
		if (sessionStatus === "CONNECTING")
			return { color: "bg-blue-500", textColor: "text-blue-400", text: t("topBar.connecting"), animation: "pulse" };
		if (connectionStatus === "reconnecting")
			return { color: "bg-blue-500", textColor: "text-blue-400", text: t("topBar.reconnecting"), animation: "pulse" };
		// Connected — activity states with bot
		if (connectionStatus === "connected" && !stale) {
			const activityMap: Record<string, { color: string; textColor: string; text: string; animation: "ping" | "" }> = {
				listening:   { color: "bg-green-500",  textColor: "text-chrome-text-secondary", text: t("topBar.inCall"),      animation: "" },
				extracting:  { color: "bg-blue-500",   textColor: "text-chrome-text-secondary", text: t("topBar.analyzing"),   animation: "ping" },
				diagramming: { color: "bg-purple-500", textColor: "text-chrome-text-secondary", text: t("topBar.diagramming"), animation: "ping" },
				suggesting:  { color: "bg-amber-500",  textColor: "text-chrome-text-secondary", text: t("topBar.suggesting"),  animation: "" },
			};
			return activityMap[activity.type] || activityMap.listening;
		}
		// Default — Local mode, calm blue
		return { color: "bg-blue-500", textColor: "text-blue-400", text: t("topBar.local"), animation: "" };
	};

	const state = getIndicatorState();
	const isError = sessionStatus === "FAILED" || (connectionStatus === "disconnected" && !stale);
	const isLocal = state.text === t("topBar.local");
	const isConnectedToCall = connectionStatus === "connected" && !stale && sessionStatus !== "FAILED";

	const handleDisconnectBot = async () => {
		setReconnecting(true);
		try {
			const res = await fetch(`/api/sessions/${sessionId}/disconnect-bot`, { method: "POST" });
			if (res.ok) {
				toast.success(t("toast.botDisconnected"));
				setShowPanel(false);
			} else {
				const data = await res.json();
				toast.error(data.error || t("toast.disconnectError"));
			}
		} catch {
			toast.error(t("toast.connectionError"));
		} finally {
			setReconnecting(false);
		}
	};

	const handleReconnect = async (url?: string) => {
		setReconnecting(true);
		try {
			const res = await fetch(`/api/sessions/${sessionId}/reconnect`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(url ? { meetingUrl: url } : {}),
			});
			const data = await res.json();
			if (res.ok) {
				toast.success(url ? t("toast.reconnectNew") : t("toast.reconnecting"));
				setShowPanel(false);
				setNewUrl("");
			} else {
				toast.error(data.error || t("toast.reconnectError"));
			}
		} catch {
			toast.error(t("toast.connectionError"));
		} finally {
			setReconnecting(false);
		}
	};

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setShowPanel(!showPanel)}
				className={`flex items-center gap-2 rounded-lg px-2 py-1 transition-all hover:bg-chrome-raised ${flashing ? "ring-2 ring-blue-500/70 shadow-[0_0_12px_rgba(59,130,246,0.5)]" : ""}`}
				style={{ transitionDuration: flashing ? "150ms" : "500ms" }}
			>
				<div className="relative flex h-2 w-2">
					{state.animation === "ping" && (
						<span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${state.color} opacity-75`} />
					)}
					<span className={`relative inline-flex h-2 w-2 rounded-full ${state.color} ${state.animation === "pulse" ? "animate-pulse" : ""}`} />
				</div>
				<span className={`text-xs ${state.textColor}`}>
					{state.text}
					{activity.detail && state.animation !== "pulse" && <span className="ml-1 text-chrome-text-muted">· {activity.detail}</span>}
				</span>
			</button>

			{/* Connection management panel */}
			{showPanel && (
				<div className="absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 rounded-xl bg-chrome-base p-4 shadow-xl ring-1 ring-chrome-border">
					<div className="mb-3 flex items-center justify-between">
						<span className="text-xs font-medium text-chrome-text">
							{isConnectedToCall ? t("topBar.activeConnection") : t("topBar.connectToCall")}
						</span>
						<button type="button" onClick={() => setShowPanel(false)} className="text-chrome-text-muted hover:text-white">
							<XIcon className="h-3.5 w-3.5" />
						</button>
					</div>

					{/* Status */}
					<div className="mb-3 rounded-lg bg-chrome-raised px-3 py-2">
						<div className="flex items-center gap-2">
							<span className={`h-2 w-2 rounded-full ${state.color}`} />
							<span className="text-xs text-chrome-text-secondary">
								{sessionStatus === "FAILED" ? t("topBar.statusFailed")
									: isError ? t("topBar.statusLostConnection")
									: isConnectedToCall ? t("topBar.statusConnected")
									: connectionStatus === "reconnecting" ? t("topBar.statusReconnecting")
									: t("topBar.statusLocal")}
							</span>
						</div>
					</div>

					{/* Reconnect same link — only show if there was a prior connection */}
					{!isLocal && (
						<button
							type="button"
							onClick={() => handleReconnect()}
							disabled={reconnecting}
							className="mb-2 flex w-full items-center gap-2 rounded-lg bg-chrome-raised px-3 py-2 text-xs text-chrome-text-secondary transition-colors hover:bg-chrome-hover hover:text-white disabled:opacity-50"
						>
							<RefreshCwIcon className={`h-3.5 w-3.5 ${reconnecting ? "animate-spin" : ""}`} />
							{t("topBar.reconnectSameLink")}
						</button>
					)}

					{/* Connect / Change meeting link */}
					<div className="rounded-lg bg-chrome-raised p-2">
						<label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-chrome-text-muted">
							{isLocal ? t("topBar.pasteCallLink") : t("topBar.changeCallLink")}
						</label>
						<div className="flex gap-1.5">
							<input
								type="url"
								value={newUrl}
								onChange={(e) => setNewUrl(e.target.value)}
								placeholder="https://meet.google.com/..."
								className="flex-1 rounded-lg bg-chrome-base px-2.5 py-1.5 text-xs text-white placeholder-chrome-subtle outline-none ring-1 ring-chrome-border focus:ring-primary"
							/>
							<button
								type="button"
								onClick={() => newUrl && handleReconnect(newUrl)}
								disabled={reconnecting || !newUrl}
								className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-action-hover disabled:opacity-50"
							>
								<PhoneCallIcon className="h-3.5 w-3.5" />
							</button>
						</div>
					</div>

					{/* Info */}
					<p className="mt-2 text-[10px] text-chrome-subtle">
						{isLocal
							? t("topBar.infoLocal")
							: t("topBar.infoConnected")}
					</p>

					{/* Disconnect / cancel — return to local mode */}
					{!isLocal && (
						<button
							type="button"
							onClick={handleDisconnectBot}
							disabled={reconnecting}
							className="mt-2 w-full rounded-lg px-3 py-1.5 text-[10px] text-chrome-text-muted transition-colors hover:bg-chrome-raised hover:text-red-400 disabled:opacity-50"
						>
							{sessionStatus === "CONNECTING" || connectionStatus === "reconnecting"
								? t("topBar.cancelLocalMode")
								: t("topBar.disconnectBot")}
						</button>
					)}
				</div>
			)}
		</div>
	);
});

function ShareButton() {
	const t = useTranslations("meeting");
	const { sessionId, shareToken } = useLiveSessionContext();
	const [open, setOpen] = useState(false);
	const [shared, setShared] = useState(!!shareToken);
	const [token, setToken] = useState(shareToken || "");
	const [loading, setLoading] = useState(false);

	const toggleShare = async () => {
		setLoading(true);
		try {
			if (shared) {
				// Revoke share
				await fetch(`/api/sessions/${sessionId}/share`, { method: "DELETE" });
				setShared(false);
				setToken("");
				toast.success(t("toast.shareDisabled"), { duration: 2000 });
			} else {
				// Enable share
				const res = await fetch(`/api/sessions/${sessionId}/share`, { method: "POST" });
				const data = await res.json();
				if (data.shareToken) {
					setShared(true);
					setToken(data.shareToken);
					const url = `${window.location.origin}/share/${data.shareToken}`;
					navigator.clipboard.writeText(url);
					toast.success(t("toast.linkCopied"), { duration: 3000 });
				}
			}
		} catch {
			toast.error(t("toast.shareError"));
		} finally {
			setLoading(false);
		}
	};

	const copyLink = () => {
		if (!token) return;
		const url = `${window.location.origin}/share/${token}`;
		navigator.clipboard.writeText(url);
		toast.success(t("toast.linkCopiedShort"), { duration: 2000 });
	};

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors duration-75 ${
					shared ? "text-primary hover:bg-primary/10" : "text-chrome-text-secondary hover:bg-chrome-raised hover:text-white"
				}`}
			>
				<LinkIcon className="h-3.5 w-3.5" />
				<span className="hidden lg:inline">{shared ? t("topBar.sharing") : t("topBar.share")}</span>
			</button>

			{open && (
				<div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl bg-chrome-base p-3 shadow-xl ring-1 ring-chrome-border">
					<div className="mb-2 flex items-center justify-between">
						<span className="text-xs font-medium text-chrome-text">{t("topBar.viewLink")}</span>
						<button type="button" onClick={() => setOpen(false)} className="text-chrome-text-muted hover:text-white">
							<XIcon className="h-3.5 w-3.5" />
						</button>
					</div>

					{shared ? (
						<>
							<div className="mb-2 flex items-center gap-1.5 rounded-lg bg-chrome-raised px-2.5 py-2">
								<span className="h-2 w-2 rounded-full bg-green-500" />
								<span className="flex-1 truncate text-[11px] text-chrome-text-secondary">
									/share/{token.slice(0, 12)}...
								</span>
								<button
									type="button"
									onClick={copyLink}
									className="rounded px-1.5 py-0.5 text-[10px] font-medium text-primary hover:bg-primary/10"
								>
									{t("topBar.copy")}
								</button>
							</div>
							<button
								type="button"
								onClick={toggleShare}
								disabled={loading}
								className="w-full rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
							>
								{loading ? t("topBar.disabling") : t("topBar.stopSharing")}
							</button>
							<p className="mt-1.5 text-[10px] text-chrome-subtle">
								{t("topBar.shareInfoActive")}
							</p>
						</>
					) : (
						<>
							<button
								type="button"
								onClick={toggleShare}
								disabled={loading}
								className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-action-hover disabled:opacity-50"
							>
								{loading ? t("topBar.enabling") : t("topBar.enableShareLink")}
							</button>
							<p className="mt-1.5 text-[10px] text-chrome-subtle">
								{t("topBar.shareInfoInactive")}
							</p>
						</>
					)}
				</div>
			)}
		</div>
	);
}

function TopBarButton({
	icon,
	label,
	onClick,
	variant,
}: {
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
	variant?: "danger";
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors duration-75 ${
				variant === "danger"
					? "text-red-400 hover:bg-red-500/10"
					: "text-chrome-text-secondary hover:bg-chrome-raised hover:text-white"
			}`}
		>
			{icon}
			<span className="hidden lg:inline">{label}</span>
		</button>
	);
}

function ExportDropdown() {
	const t = useTranslations("meeting");
	const { exportDiagram, transcript, nodes, sessionId, processId } = useLiveSessionContext();
	const [open, setOpen] = useState(false);
	const [resetting, setResetting] = useState(false);

	const handleReset = useCallback(async (scope: "diagram" | "transcript" | "all") => {
		const labels = { diagram: t("topBar.confirmCleanDiagram"), transcript: t("topBar.confirmCleanTranscript"), all: t("topBar.confirmCleanAll") };
		if (!confirm(t("topBar.confirmCleanPrompt", { label: labels[scope] }))) return;
		setResetting(true);
		try {
			const res = await fetch(`/api/sessions/${sessionId}/reset`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ scope }),
			});
			if (!res.ok) throw new Error("Error");
			toast.success(t("toast.cleaned", { label: labels[scope] }));
			if (scope === "diagram" || scope === "all") {
				// Reload page to reset modeler state
				window.location.reload();
			}
		} catch {
			toast.error(t("toast.cleanError"));
		} finally {
			setResetting(false);
			setOpen(false);
		}
	}, [sessionId, t]);

	const exportTranscript = useCallback(() => {
		if (transcript.length === 0) { toast.error(t("toast.noTranscription")); return; }
		const lines = transcript.map((tr) => {
			const ts = tr.timestamp ? new Date(tr.timestamp).toLocaleTimeString("es", { hour12: false }) : "??:??:??";
			return `[${ts}] ${tr.speaker || "?"}: ${tr.text}`;
		});
		const blob = new Blob([lines.join("\n")], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "transcripcion.txt";
		a.click();
		URL.revokeObjectURL(url);
		toast.success(t("toast.transcriptionDownloaded"));
		setOpen(false);
	}, [transcript, t]);

	const exportAllSops = useCallback(() => {
		const nodesWithSop = nodes.filter((n) => n.procedure);
		if (nodesWithSop.length === 0) { toast.error(t("toast.noProcedures")); return; }

		const lines: string[] = [];
		lines.push("═══════════════════════════════════════════════");
		lines.push(`  ${t("topBar.exportSopHeader")}`);
		lines.push("═══════════════════════════════════════════════");
		lines.push("");

		for (const node of nodesWithSop) {
			const proc = node.procedure as any;
			lines.push("───────────────────────────────────────────────");
			lines.push(`${t("topBar.exportProcedure")}: ${proc.activityName || node.label}`);
			lines.push(`${t("topBar.exportCode")}: ${proc.procedureCode || "—"}`);
			lines.push(`${t("topBar.exportResponsible")}: ${proc.responsible || "—"}`);
			lines.push(`${t("topBar.exportFrequency")}: ${proc.frequency || "—"}`);
			lines.push("");
			if (proc.objective) { lines.push(t("topBar.exportObjective")); lines.push(proc.objective); lines.push(""); }
			if (proc.scope) { lines.push(t("topBar.exportScope")); lines.push(proc.scope); lines.push(""); }
			if (proc.prerequisites?.length > 0) {
				lines.push(t("topBar.exportPrerequisites"));
				proc.prerequisites.forEach((p: string) => lines.push(`  • ${p}`));
				lines.push("");
			}
			if (proc.steps?.length > 0) {
				lines.push(t("topBar.exportSteps"));
				proc.steps.forEach((s: any) => {
					lines.push(`  ${s.stepNumber}. ${s.action}`);
					lines.push(`     ${s.description}`);
					if (s.systems?.length > 0) lines.push(`     ${t("topBar.exportSystems")}: ${s.systems.join(", ")}`);
					if (s.inputs?.length > 0) lines.push(`     ${t("topBar.exportInputs")}: ${s.inputs.join(", ")}`);
					if (s.outputs?.length > 0) lines.push(`     ${t("topBar.exportOutputs")}: ${s.outputs.join(", ")}`);
					s.exceptions?.forEach((ex: any) => lines.push(`     ⚠ Si ${ex.condition} → ${ex.action}`));
					lines.push("");
				});
			}
			if (proc.gaps?.length > 0) {
				lines.push(t("topBar.exportPendingInfo"));
				proc.gaps.forEach((g: string) => lines.push(`  ⚠ ${g}`));
				lines.push("");
			}
			lines.push("");
		}

		const blob = new Blob([lines.join("\n")], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "procedimientos-sop.txt";
		a.click();
		URL.revokeObjectURL(url);
		toast.success(t("toast.sopsDownloaded", { count: nodesWithSop.length }));
		setOpen(false);
	}, [nodes, t]);

	const openReport = useCallback(() => {
		window.open(`/api/sessions/${sessionId}/export/review`, "_blank");
		setOpen(false);
	}, [sessionId]);

	const handleExport = useCallback((format: "svg" | "png" | "bpmn") => {
		exportDiagram(format);
		setOpen(false);
	}, [exportDiagram]);

	const sopCount = nodes.filter((n) => n.procedure).length;

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-chrome-text-secondary transition-colors duration-75 hover:bg-chrome-raised hover:text-white"
			>
				<DownloadIcon className="h-3.5 w-3.5" />
				<span className="hidden lg:inline">{t("topBar.export")}</span>
				<ChevronDownIcon className="h-3.5 w-3.5" />
			</button>

			{open && (
				<>
					<div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
					<div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-xl bg-chrome-base p-1.5 shadow-xl ring-1 ring-chrome-border">
						{/* Diagrama */}
						<p className="px-2.5 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-wider text-chrome-subtle">{t("topBar.diagramSection")}</p>
						<ExportItem icon={<ImageIcon className="h-3.5 w-3.5" />} label={t("topBar.pngLabel")} onClick={() => handleExport("png")} />
						<ExportItem icon={<FileCodeIcon className="h-3.5 w-3.5" />} label={t("topBar.svgLabel")} onClick={() => handleExport("svg")} />
						<ExportItem icon={<FileIcon className="h-3.5 w-3.5" />} label={t("topBar.bpmnLabel")} onClick={() => handleExport("bpmn")} />

						<div className="my-1.5 h-px bg-chrome-raised" />

						{/* Documentación */}
						<p className="px-2.5 pb-1 pt-1 text-[9px] font-semibold uppercase tracking-wider text-chrome-subtle">{t("topBar.documentationSection")}</p>
						<ExportItem
							icon={<FileTextIcon className="h-3.5 w-3.5" />}
							label={t("topBar.transcription")}
							badge={transcript.length > 0 ? `${transcript.length}` : undefined}
							onClick={exportTranscript}
							disabled={transcript.length === 0}
						/>
						<ExportItem
							icon={<ClipboardListIcon className="h-3.5 w-3.5" />}
							label={t("topBar.proceduresSops")}
							badge={sopCount > 0 ? `${sopCount}` : undefined}
							onClick={exportAllSops}
							disabled={sopCount === 0}
						/>

						<div className="my-1.5 h-px bg-chrome-raised" />

						{/* Reporte */}
						<p className="px-2.5 pb-1 pt-1 text-[9px] font-semibold uppercase tracking-wider text-chrome-subtle">{t("topBar.reportSection")}</p>
						<ExportItem icon={<FileTextIcon className="h-3.5 w-3.5" />} label={t("topBar.sessionReport")} onClick={openReport} />

						<div className="my-1.5 h-px bg-chrome-raised" />

						{/* Reset */}
						<p className="px-2.5 pb-1 pt-1 text-[9px] font-semibold uppercase tracking-wider text-chrome-subtle">{t("topBar.cleanSection")}</p>
						<ExportItem icon={<Trash2Icon className="h-3.5 w-3.5" />} label={t("topBar.cleanDiagram")} onClick={() => handleReset("diagram")} disabled={resetting} />
						<ExportItem icon={<Trash2Icon className="h-3.5 w-3.5" />} label={t("topBar.cleanTranscription")} onClick={() => handleReset("transcript")} disabled={resetting} />
						<ExportItem icon={<Trash2Icon className="h-3.5 w-3.5" />} label={t("topBar.cleanAll")} onClick={() => handleReset("all")} disabled={resetting} />
					</div>
				</>
			)}
		</div>
	);
}

function ExportItem({ icon, label, badge, onClick, disabled }: {
	icon: React.ReactNode; label: string; badge?: string; onClick: () => void; disabled?: boolean;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={disabled}
			className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[11px] transition-colors ${
				disabled
					? "cursor-not-allowed text-chrome-subtle opacity-50"
					: "text-chrome-text-secondary hover:bg-chrome-raised hover:text-white"
			}`}
		>
			{icon}
			<span className="flex-1">{label}</span>
			{badge && (
				<span className="rounded-full bg-chrome-raised px-1.5 py-0.5 text-[9px] tabular-nums text-chrome-text-muted">{badge}</span>
			)}
		</button>
	);
}

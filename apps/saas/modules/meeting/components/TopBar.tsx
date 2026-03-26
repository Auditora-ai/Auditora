"use client";

import { useState, useRef, useCallback, useImperativeHandle, forwardRef } from "react";
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
} from "lucide-react";

interface TopBarProps {
	processName?: string;
	clientName?: string;
}

export function TopBar({ processName: initialName, clientName }: TopBarProps) {
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

		// Save to DB
		if (processId) {
			fetch(`/api/processes/${processId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: trimmed }),
			}).catch(() => {});
		}
	};

	return (
		<div
			className="flex items-center justify-between border-b border-[#334155] bg-[#0F172A] px-4"
			style={{ gridArea: "top", height: 48, fontFamily: "Inter, system-ui, sans-serif" }}
		>
			{/* Left: Logo */}
			<div className="flex items-center gap-3">
				<span className="flex items-center">
					<svg className="h-6 w-6 text-[#2563EB]" viewBox="0 0 32 32" fill="none">
						<circle cx="8" cy="16" r="3" fill="currentColor" />
						<circle cx="24" cy="8" r="3" fill="currentColor" />
						<circle cx="24" cy="24" r="3" fill="currentColor" />
						<path d="M11 16L21 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
						<path d="M11 16L21 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
						<rect x="15" y="14" width="4" height="4" rx="1" fill="currentColor" opacity="0.4" transform="rotate(45 17 16)" />
					</svg>
					<span className="ml-1.5 text-sm tracking-tight">
						<span className="font-bold text-white">AI</span>
						<span className="font-light text-[#94A3B8]">process.me</span>
					</span>
				</span>
				<div className="h-4 w-px bg-[#334155]" />
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
						className="max-w-[280px] rounded bg-[#1E293B] px-2 py-0.5 text-sm text-[#F1F5F9] outline-none ring-1 ring-[#2563EB]"
					/>
				) : (
					<button
						type="button"
						onClick={() => setEditing(true)}
						className="max-w-[280px] truncate rounded px-1 py-0.5 text-sm text-[#F1F5F9] transition-colors hover:bg-[#1E293B]"
						title="Click para editar nombre del proceso"
					>
						{processName || "Nueva sesion"}
					</button>
				)}
				{clientName && (
					<span className="text-xs text-[#64748B]">
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
					label="Finalizar"
					onClick={endSession}
					variant="danger"
				/>
				<div className="ml-2 h-4 w-px bg-[#334155]" />
				<button
					type="button"
					onClick={handleAiClick}
					className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors duration-75 ${
						!isInCall
							? "bg-[#1E293B]/60 text-[#475569]"
							: aiEnabled
								? "bg-[#2563EB] text-white"
								: "bg-[#1E293B] text-[#64748B]"
					}`}
				>
					<SparklesIcon className="h-3 w-3" />
					{!isInCall ? "Activar IA en vivo" : aiEnabled ? "IA Analizando" : "IA Pausada"}
				</button>
				<FontScaleControl />
			</div>
		</div>
	);
}

const FONT_SCALES = [0.9, 1, 1.15, 1.3];

function FontScaleControl() {
	const [scaleIndex, setScaleIndex] = useState(() => {
		if (typeof window === "undefined") return 1;
		const saved = localStorage.getItem("fontScale");
		if (!saved) return 1;
		const idx = FONT_SCALES.indexOf(Number(saved));
		return idx >= 0 ? idx : 1;
	});

	const applyScale = useCallback((idx: number) => {
		const clamped = Math.max(0, Math.min(FONT_SCALES.length - 1, idx));
		setScaleIndex(clamped);
		const value = String(FONT_SCALES[clamped]);
		document.documentElement.style.setProperty("--font-scale", value);
		localStorage.setItem("fontScale", value);
	}, []);

	return (
		<div className="ml-1 flex items-center rounded-lg bg-[#1E293B] p-0.5">
			<button
				type="button"
				onClick={() => applyScale(scaleIndex - 1)}
				disabled={scaleIndex === 0}
				className="rounded px-1.5 py-0.5 text-[10px] font-medium text-[#64748B] transition-colors hover:text-white disabled:opacity-30"
				title="Reducir texto"
			>
				A-
			</button>
			<button
				type="button"
				onClick={() => applyScale(1)}
				className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${scaleIndex === 1 ? "text-[#3B82F6]" : "text-[#64748B] hover:text-white"}`}
				title="Tamaño normal"
			>
				A
			</button>
			<button
				type="button"
				onClick={() => applyScale(scaleIndex + 1)}
				disabled={scaleIndex === FONT_SCALES.length - 1}
				className="rounded px-1.5 py-0.5 text-[10px] font-medium text-[#64748B] transition-colors hover:text-white disabled:opacity-30"
				title="Aumentar texto"
			>
				A+
			</button>
		</div>
	);
}

const LiveIndicator = forwardRef<{ flash: () => void }, { stale: boolean; activity: { type: string; detail: string | null } }>(
	function LiveIndicator({ stale, activity }, ref) {
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
			return { color: "bg-red-500", textColor: "text-red-400", text: "Bot desconectado", animation: "pulse" };
		if (connectionStatus === "disconnected" && !stale)
			return { color: "bg-red-500", textColor: "text-red-400", text: "Desconectado", animation: "pulse" };
		// In-progress states — blue, working on it
		if (sessionStatus === "CONNECTING")
			return { color: "bg-blue-500", textColor: "text-blue-400", text: "Conectando...", animation: "pulse" };
		if (connectionStatus === "reconnecting")
			return { color: "bg-blue-500", textColor: "text-blue-400", text: "Reconectando...", animation: "pulse" };
		// Connected — activity states with bot
		if (connectionStatus === "connected" && !stale) {
			const activityMap: Record<string, { color: string; textColor: string; text: string; animation: "ping" | "" }> = {
				listening:   { color: "bg-green-500",  textColor: "text-[#94A3B8]", text: "En llamada",     animation: "" },
				extracting:  { color: "bg-blue-500",   textColor: "text-[#94A3B8]", text: "Analizando...",  animation: "ping" },
				diagramming: { color: "bg-purple-500", textColor: "text-[#94A3B8]", text: "Diagramando...", animation: "ping" },
				suggesting:  { color: "bg-amber-500",  textColor: "text-[#94A3B8]", text: "Sugiriendo...",  animation: "" },
			};
			return activityMap[activity.type] || activityMap.listening;
		}
		// Default — Local mode, calm blue
		return { color: "bg-blue-500", textColor: "text-blue-400", text: "Local", animation: "" };
	};

	const state = getIndicatorState();
	const isError = sessionStatus === "FAILED" || (connectionStatus === "disconnected" && !stale);
	const isLocal = state.text === "Local";
	const isConnectedToCall = connectionStatus === "connected" && !stale && sessionStatus !== "FAILED";

	const handleDisconnectBot = async () => {
		setReconnecting(true);
		try {
			const res = await fetch(`/api/sessions/${sessionId}/disconnect-bot`, { method: "POST" });
			if (res.ok) {
				toast.success("Bot desconectado — modo local");
				setShowPanel(false);
			} else {
				const data = await res.json();
				toast.error(data.error || "Error al desconectar");
			}
		} catch {
			toast.error("Error de conexión");
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
				toast.success(url ? "Bot uniendose a nueva llamada..." : "Reconectando bot...");
				setShowPanel(false);
				setNewUrl("");
			} else {
				toast.error(data.error || "Error al reconectar");
			}
		} catch {
			toast.error("Error de conexion");
		} finally {
			setReconnecting(false);
		}
	};

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setShowPanel(!showPanel)}
				className={`flex items-center gap-2 rounded-lg px-2 py-1 transition-all hover:bg-[#1E293B] ${flashing ? "ring-2 ring-blue-500/70 shadow-[0_0_12px_rgba(59,130,246,0.5)]" : ""}`}
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
					{activity.detail && state.animation !== "pulse" && <span className="ml-1 text-[#64748B]">· {activity.detail}</span>}
				</span>
			</button>

			{/* Connection management panel */}
			{showPanel && (
				<div className="absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 rounded-xl bg-[#0F172A] p-4 shadow-xl ring-1 ring-[#334155]">
					<div className="mb-3 flex items-center justify-between">
						<span className="text-xs font-medium text-[#F1F5F9]">
							{isConnectedToCall ? "Conexión activa" : "Conectar a llamada"}
						</span>
						<button type="button" onClick={() => setShowPanel(false)} className="text-[#64748B] hover:text-white">
							<XIcon className="h-3.5 w-3.5" />
						</button>
					</div>

					{/* Status */}
					<div className="mb-3 rounded-lg bg-[#1E293B] px-3 py-2">
						<div className="flex items-center gap-2">
							<span className={`h-2 w-2 rounded-full ${state.color}`} />
							<span className="text-xs text-[#94A3B8]">
								{sessionStatus === "FAILED" ? "Bot no pudo unirse a la llamada"
									: isError ? "Se perdió la conexión al bot"
									: isConnectedToCall ? "Bot conectado y escuchando"
									: connectionStatus === "reconnecting" ? "Reconectando al bot..."
									: "Modo local — puedes conectar a una llamada"}
							</span>
						</div>
					</div>

					{/* Reconnect same link — only show if there was a prior connection */}
					{!isLocal && (
						<button
							type="button"
							onClick={() => handleReconnect()}
							disabled={reconnecting}
							className="mb-2 flex w-full items-center gap-2 rounded-lg bg-[#1E293B] px-3 py-2 text-xs text-[#94A3B8] transition-colors hover:bg-[#334155] hover:text-white disabled:opacity-50"
						>
							<RefreshCwIcon className={`h-3.5 w-3.5 ${reconnecting ? "animate-spin" : ""}`} />
							Reconectar al mismo link
						</button>
					)}

					{/* Connect / Change meeting link */}
					<div className="rounded-lg bg-[#1E293B] p-2">
						<label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-[#64748B]">
							{isLocal ? "Pegar link de llamada" : "Cambiar link de llamada"}
						</label>
						<div className="flex gap-1.5">
							<input
								type="url"
								value={newUrl}
								onChange={(e) => setNewUrl(e.target.value)}
								placeholder="https://meet.google.com/..."
								className="flex-1 rounded-lg bg-[#0F172A] px-2.5 py-1.5 text-xs text-white placeholder-[#475569] outline-none ring-1 ring-[#334155] focus:ring-[#2563EB]"
							/>
							<button
								type="button"
								onClick={() => newUrl && handleReconnect(newUrl)}
								disabled={reconnecting || !newUrl}
								className="rounded-lg bg-[#2563EB] px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50"
							>
								<PhoneCallIcon className="h-3.5 w-3.5" />
							</button>
						</div>
					</div>

					{/* Info */}
					<p className="mt-2 text-[10px] text-[#475569]">
						{isLocal
							? "Pega el link de tu videollamada para que el bot se una y transcriba en tiempo real."
							: "Puedes seguir trabajando en el diagrama sin conexión. El bot se reconecta al link que pegues."}
					</p>

					{/* Disconnect / cancel — return to local mode */}
					{!isLocal && (
						<button
							type="button"
							onClick={handleDisconnectBot}
							disabled={reconnecting}
							className="mt-2 w-full rounded-lg px-3 py-1.5 text-[10px] text-[#64748B] transition-colors hover:bg-[#1E293B] hover:text-red-400 disabled:opacity-50"
						>
							{sessionStatus === "CONNECTING" || connectionStatus === "reconnecting"
								? "Cancelar y volver a modo local"
								: "Desconectar bot"}
						</button>
					)}
				</div>
			)}
		</div>
	);
});

function ShareButton() {
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
				toast.success("Link de compartir desactivado", { duration: 2000 });
			} else {
				// Enable share
				const res = await fetch(`/api/sessions/${sessionId}/share`, { method: "POST" });
				const data = await res.json();
				if (data.shareToken) {
					setShared(true);
					setToken(data.shareToken);
					const url = `${window.location.origin}/share/${data.shareToken}`;
					navigator.clipboard.writeText(url);
					toast.success("Link copiado al portapapeles", { duration: 3000 });
				}
			}
		} catch {
			toast.error("Error al cambiar estado de compartir");
		} finally {
			setLoading(false);
		}
	};

	const copyLink = () => {
		if (!token) return;
		const url = `${window.location.origin}/share/${token}`;
		navigator.clipboard.writeText(url);
		toast.success("Link copiado", { duration: 2000 });
	};

	return (
		<div className="relative">
			<button
				type="button"
				onClick={() => setOpen(!open)}
				className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors duration-75 ${
					shared ? "text-[#2563EB] hover:bg-[#2563EB]/10" : "text-[#94A3B8] hover:bg-[#1E293B] hover:text-white"
				}`}
			>
				<LinkIcon className="h-3.5 w-3.5" />
				<span className="hidden lg:inline">{shared ? "Compartiendo" : "Compartir"}</span>
			</button>

			{open && (
				<div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl bg-[#0F172A] p-3 shadow-xl ring-1 ring-[#334155]">
					<div className="mb-2 flex items-center justify-between">
						<span className="text-xs font-medium text-[#F1F5F9]">Link de visualizacion</span>
						<button type="button" onClick={() => setOpen(false)} className="text-[#64748B] hover:text-white">
							<XIcon className="h-3.5 w-3.5" />
						</button>
					</div>

					{shared ? (
						<>
							<div className="mb-2 flex items-center gap-1.5 rounded-lg bg-[#1E293B] px-2.5 py-2">
								<span className="h-2 w-2 rounded-full bg-green-500" />
								<span className="flex-1 truncate text-[11px] text-[#94A3B8]">
									/share/{token.slice(0, 12)}...
								</span>
								<button
									type="button"
									onClick={copyLink}
									className="rounded px-1.5 py-0.5 text-[10px] font-medium text-[#2563EB] hover:bg-[#2563EB]/10"
								>
									Copiar
								</button>
							</div>
							<button
								type="button"
								onClick={toggleShare}
								disabled={loading}
								className="w-full rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20 disabled:opacity-50"
							>
								{loading ? "Desactivando..." : "Dejar de compartir"}
							</button>
							<p className="mt-1.5 text-[10px] text-[#475569]">
								El link se desactiva al dejar de compartir o al finalizar la sesion.
							</p>
						</>
					) : (
						<>
							<button
								type="button"
								onClick={toggleShare}
								disabled={loading}
								className="w-full rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#1D4ED8] disabled:opacity-50"
							>
								{loading ? "Activando..." : "Activar link de compartir"}
							</button>
							<p className="mt-1.5 text-[10px] text-[#475569]">
								Genera un link de solo lectura para que otros vean el diagrama en vivo.
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
					: "text-[#94A3B8] hover:bg-[#1E293B] hover:text-white"
			}`}
		>
			{icon}
			<span className="hidden lg:inline">{label}</span>
		</button>
	);
}

function ExportDropdown() {
	const { exportDiagram, transcript, nodes, sessionId, processId } = useLiveSessionContext();
	const [open, setOpen] = useState(false);

	const exportTranscript = useCallback(() => {
		if (transcript.length === 0) { toast.error("No hay transcripción"); return; }
		const lines = transcript.map((t) => {
			const ts = t.timestamp ? new Date(t.timestamp).toLocaleTimeString("es", { hour12: false }) : "??:??:??";
			return `[${ts}] ${t.speaker || "?"}: ${t.text}`;
		});
		const blob = new Blob([lines.join("\n")], { type: "text/plain" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "transcripcion.txt";
		a.click();
		URL.revokeObjectURL(url);
		toast.success("Transcripción descargada");
		setOpen(false);
	}, [transcript]);

	const exportAllSops = useCallback(() => {
		const nodesWithSop = nodes.filter((n) => n.procedure);
		if (nodesWithSop.length === 0) { toast.error("No hay procedimientos generados"); return; }

		const lines: string[] = [];
		lines.push("═══════════════════════════════════════════════");
		lines.push("  PROCEDIMIENTOS DE TRABAJO (SOPs)");
		lines.push("═══════════════════════════════════════════════");
		lines.push("");

		for (const node of nodesWithSop) {
			const proc = node.procedure as any;
			lines.push("───────────────────────────────────────────────");
			lines.push(`PROCEDIMIENTO: ${proc.activityName || node.label}`);
			lines.push(`Código: ${proc.procedureCode || "—"}`);
			lines.push(`Responsable: ${proc.responsible || "—"}`);
			lines.push(`Frecuencia: ${proc.frequency || "—"}`);
			lines.push("");
			if (proc.objective) { lines.push("OBJETIVO"); lines.push(proc.objective); lines.push(""); }
			if (proc.scope) { lines.push("ALCANCE"); lines.push(proc.scope); lines.push(""); }
			if (proc.prerequisites?.length > 0) {
				lines.push("PRERREQUISITOS");
				proc.prerequisites.forEach((p: string) => lines.push(`  • ${p}`));
				lines.push("");
			}
			if (proc.steps?.length > 0) {
				lines.push("PASOS");
				proc.steps.forEach((s: any) => {
					lines.push(`  ${s.stepNumber}. ${s.action}`);
					lines.push(`     ${s.description}`);
					if (s.systems?.length > 0) lines.push(`     Sistemas: ${s.systems.join(", ")}`);
					if (s.inputs?.length > 0) lines.push(`     Entradas: ${s.inputs.join(", ")}`);
					if (s.outputs?.length > 0) lines.push(`     Salidas: ${s.outputs.join(", ")}`);
					s.exceptions?.forEach((ex: any) => lines.push(`     ⚠ Si ${ex.condition} → ${ex.action}`));
					lines.push("");
				});
			}
			if (proc.gaps?.length > 0) {
				lines.push("INFORMACIÓN PENDIENTE");
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
		toast.success(`${nodesWithSop.length} procedimiento(s) descargados`);
		setOpen(false);
	}, [nodes]);

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
				className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#94A3B8] transition-colors duration-75 hover:bg-[#1E293B] hover:text-white"
			>
				<DownloadIcon className="h-3.5 w-3.5" />
				<span className="hidden lg:inline">Exportar</span>
				<ChevronDownIcon className="h-3 w-3" />
			</button>

			{open && (
				<>
					<div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
					<div className="absolute right-0 top-full z-50 mt-1.5 w-56 rounded-xl bg-[#0F172A] p-1.5 shadow-xl ring-1 ring-[#334155]">
						{/* Diagrama */}
						<p className="px-2.5 pb-1 pt-2 text-[9px] font-semibold uppercase tracking-wider text-[#475569]">Diagrama</p>
						<ExportItem icon={<ImageIcon className="h-3.5 w-3.5" />} label="PNG (imagen)" onClick={() => handleExport("png")} />
						<ExportItem icon={<FileCodeIcon className="h-3.5 w-3.5" />} label="SVG (vectorial)" onClick={() => handleExport("svg")} />
						<ExportItem icon={<FileIcon className="h-3.5 w-3.5" />} label="BPMN (XML)" onClick={() => handleExport("bpmn")} />

						<div className="my-1.5 h-px bg-[#1E293B]" />

						{/* Documentación */}
						<p className="px-2.5 pb-1 pt-1 text-[9px] font-semibold uppercase tracking-wider text-[#475569]">Documentación</p>
						<ExportItem
							icon={<FileTextIcon className="h-3.5 w-3.5" />}
							label="Transcripción"
							badge={transcript.length > 0 ? `${transcript.length}` : undefined}
							onClick={exportTranscript}
							disabled={transcript.length === 0}
						/>
						<ExportItem
							icon={<ClipboardListIcon className="h-3.5 w-3.5" />}
							label="Procedimientos (SOPs)"
							badge={sopCount > 0 ? `${sopCount}` : undefined}
							onClick={exportAllSops}
							disabled={sopCount === 0}
						/>

						<div className="my-1.5 h-px bg-[#1E293B]" />

						{/* Reporte */}
						<p className="px-2.5 pb-1 pt-1 text-[9px] font-semibold uppercase tracking-wider text-[#475569]">Reporte</p>
						<ExportItem icon={<FileTextIcon className="h-3.5 w-3.5" />} label="Reporte de sesión (PDF)" onClick={openReport} />
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
					? "cursor-not-allowed text-[#475569] opacity-50"
					: "text-[#94A3B8] hover:bg-[#1E293B] hover:text-white"
			}`}
		>
			{icon}
			<span className="flex-1">{label}</span>
			{badge && (
				<span className="rounded-full bg-[#1E293B] px-1.5 py-0.5 text-[9px] tabular-nums text-[#64748B]">{badge}</span>
			)}
		</button>
	);
}

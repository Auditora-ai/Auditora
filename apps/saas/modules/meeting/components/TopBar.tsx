"use client";

import { useState, useRef } from "react";
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
		processId,
		shareToken,
		modelerApi,
	} = useLiveSessionContext();

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
				<LiveIndicator stale={botActivity.stale} activity={botActivity} />
				<CompletenessRing score={completenessScore} />
			</div>

			{/* Right: Actions */}
			<div className="flex items-center gap-2">
				<TopBarButton
					icon={<DownloadIcon className="h-3.5 w-3.5" />}
					label="Exportar BPMN"
					onClick={() => exportDiagram("bpmn")}
				/>
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
					onClick={toggleAi}
					className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors duration-75 ${
						aiEnabled
							? "bg-[#2563EB] text-white"
							: "bg-[#1E293B] text-[#64748B]"
					}`}
				>
					<SparklesIcon className="h-3 w-3" />
					IA {aiEnabled ? "Activado" : "Desactivado"}
				</button>
			</div>
		</div>
	);
}

function LiveIndicator({ stale, activity }: { stale: boolean; activity: { type: string; detail: string | null } }) {
	const { sessionId, sessionStatus, connectionStatus } = useLiveSessionContext();
	const [showPanel, setShowPanel] = useState(false);
	const [newUrl, setNewUrl] = useState("");
	const [reconnecting, setReconnecting] = useState(false);

	const labels: Record<string, { text: string; color: string }> = {
		listening: { text: "Escuchando", color: "bg-green-500" },
		extracting: { text: "Analizando...", color: "bg-blue-500" },
		diagramming: { text: "Diagramando...", color: "bg-purple-500" },
		suggesting: { text: "Sugiriendo...", color: "bg-amber-500" },
	};
	const state = labels[activity.type] || labels.listening;

	const isDisconnected = stale || sessionStatus === "FAILED" || connectionStatus === "disconnected";

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
				className="flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-[#1E293B]"
			>
				{isDisconnected ? (
					<>
						<span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-amber-400" />
						<span className="text-xs text-amber-400">
							{sessionStatus === "FAILED" ? "Bot desconectado" : "Reconectando..."}
						</span>
					</>
				) : (
					<>
						<div className="relative flex h-2 w-2">
							{(activity.type === "extracting" || activity.type === "diagramming") && (
								<span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${state.color} opacity-75`} />
							)}
							<span className={`relative inline-flex h-2 w-2 rounded-full ${state.color}`} />
						</div>
						<span className="text-xs text-[#94A3B8]">
							{state.text}
							{activity.detail && <span className="ml-1 text-[#64748B]">· {activity.detail}</span>}
						</span>
					</>
				)}
			</button>

			{/* Connection management panel */}
			{showPanel && (
				<div className="absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 rounded-xl bg-[#0F172A] p-4 shadow-xl ring-1 ring-[#334155]">
					<div className="mb-3 flex items-center justify-between">
						<span className="text-xs font-medium text-[#F1F5F9]">Conexion de llamada</span>
						<button type="button" onClick={() => setShowPanel(false)} className="text-[#64748B] hover:text-white">
							<XIcon className="h-3.5 w-3.5" />
						</button>
					</div>

					{/* Status */}
					<div className="mb-3 rounded-lg bg-[#1E293B] px-3 py-2">
						<div className="flex items-center gap-2">
							<span className={`h-2 w-2 rounded-full ${isDisconnected ? "bg-amber-400" : "bg-green-500"}`} />
							<span className="text-xs text-[#94A3B8]">
								{sessionStatus === "FAILED" ? "Bot no pudo unirse a la llamada"
									: isDisconnected ? "Sin conexion al bot — la sesion sigue activa para trabajo manual"
									: "Bot conectado y escuchando"}
							</span>
						</div>
					</div>

					{/* Reconnect same link */}
					<button
						type="button"
						onClick={() => handleReconnect()}
						disabled={reconnecting}
						className="mb-2 flex w-full items-center gap-2 rounded-lg bg-[#1E293B] px-3 py-2 text-xs text-[#94A3B8] transition-colors hover:bg-[#334155] hover:text-white disabled:opacity-50"
					>
						<RefreshCwIcon className={`h-3.5 w-3.5 ${reconnecting ? "animate-spin" : ""}`} />
						Reconectar al mismo link
					</button>

					{/* Change meeting link */}
					<div className="rounded-lg bg-[#1E293B] p-2">
						<label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wider text-[#64748B]">
							Cambiar link de llamada
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
						Puedes seguir trabajando en el diagrama sin conexion. El bot se reconecta al link que pegues.
					</p>
				</div>
			)}
		</div>
	);
}

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

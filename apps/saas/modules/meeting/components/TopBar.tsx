"use client";

import { useLiveSessionContext } from "../context/LiveSessionContext";
import { CompletenessRing } from "./CompletenessRing";
import {
	DownloadIcon,
	LinkIcon,
	PowerIcon,
	SparklesIcon,
} from "lucide-react";

interface TopBarProps {
	processName?: string;
	clientName?: string;
}

export function TopBar({ processName, clientName }: TopBarProps) {
	const {
		botActivity,
		completenessScore,
		aiEnabled,
		toggleAi,
		exportDiagram,
		endSession,
	} = useLiveSessionContext();

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
				<span className="max-w-[280px] truncate text-sm text-[#F1F5F9]">
					{processName || "Nueva sesion"}
				</span>
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
				<TopBarButton
					icon={<LinkIcon className="h-3.5 w-3.5" />}
					label="Compartir"
					onClick={() => {
						navigator.clipboard.writeText(window.location.href);
					}}
				/>
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
	const labels: Record<string, { text: string; color: string }> = {
		listening: { text: "Escuchando", color: "bg-green-500" },
		extracting: { text: "Analizando...", color: "bg-blue-500" },
		diagramming: { text: "Diagramando...", color: "bg-purple-500" },
		suggesting: { text: "Sugiriendo...", color: "bg-amber-500" },
	};
	const state = labels[activity.type] || labels.listening;

	if (stale) {
		return (
			<div className="flex items-center gap-2">
				<span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
				<span className="text-xs text-[#94A3B8]">Reconectando...</span>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2">
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

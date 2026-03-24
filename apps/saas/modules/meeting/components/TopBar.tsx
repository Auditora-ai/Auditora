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
				<span className="text-sm font-semibold tracking-tight text-white">
					BPMN Live AI
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
				<LiveIndicator stale={botActivity.stale} />
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

function LiveIndicator({ stale }: { stale: boolean }) {
	return (
		<div className="flex items-center gap-2">
			<div className="relative flex h-2 w-2">
				{!stale && (
					<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
				)}
				<span
					className={`relative inline-flex h-2 w-2 rounded-full ${
						stale ? "bg-amber-400" : "bg-green-500"
					}`}
				/>
			</div>
			<span className="text-xs text-[#94A3B8]">
				{stale ? "Reconectando..." : "En vivo \u00B7 Recall conectado"}
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

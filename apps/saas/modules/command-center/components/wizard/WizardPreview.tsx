"use client";

import {
	GitBranchIcon,
	UsersIcon,
	FileTextIcon,
	CalendarIcon,
	InfoIcon,
} from "lucide-react";
import type { WizardData } from "../SessionWizard";

const SESSION_TYPE_LABELS: Record<string, string> = {
	DISCOVERY: "Discovery",
	DEEP_DIVE: "Deep Dive",
	CONTINUATION: "Continuación",
};

export function WizardPreview({ data }: { data: WizardData }) {
	const hasProcess = data.processName.trim().length > 0;
	const hasParticipants = data.participants.length > 0;
	const hasContext = data.contextText.trim().length > 0 || data.contextFiles.length > 0;
	const hasSchedule = data.scheduledFor.length > 0;

	return (
		<div className="flex h-full flex-col border-l border-[#334155] bg-[#0F172A] p-6">
			<h3 className="mb-6 text-xs font-semibold uppercase tracking-wider text-[#64748B]">
				Resumen
			</h3>

			<div className="flex-1 space-y-5">
				{/* Process */}
				<div className="flex items-start gap-3">
					<GitBranchIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#64748B]" />
					<div>
						<p className="text-xs font-medium text-[#94A3B8]">Proceso</p>
						{hasProcess ? (
							<>
								<p className="text-sm font-medium text-[#F1F5F9]">{data.processName}</p>
								{data.sessionType && (
									<span className="mt-1 inline-block rounded-full bg-[#1E293B] px-2 py-0.5 text-[11px] font-medium text-[#94A3B8]">
										{SESSION_TYPE_LABELS[data.sessionType] ?? data.sessionType}
									</span>
								)}
							</>
						) : (
							<p className="text-sm text-[#64748B]">Sin seleccionar</p>
						)}
					</div>
				</div>

				{/* Participants */}
				<div className="flex items-start gap-3">
					<UsersIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#64748B]" />
					<div>
						<p className="text-xs font-medium text-[#94A3B8]">Participantes</p>
						{hasParticipants ? (
							<>
								<p className="text-sm font-medium text-[#F1F5F9]">
									{data.participants.length} persona{data.participants.length !== 1 ? "s" : ""}
								</p>
								<p className="mt-0.5 text-xs text-[#64748B]">
									{data.participants
										.slice(0, 3)
										.map((p) => p.name || p.email)
										.join(", ")}
									{data.participants.length > 3 && ` +${data.participants.length - 3}`}
								</p>
							</>
						) : (
							<p className="text-sm text-[#64748B]">Sin agregar</p>
						)}
					</div>
				</div>

				{/* Context */}
				<div className="flex items-start gap-3">
					<FileTextIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#64748B]" />
					<div>
						<p className="text-xs font-medium text-[#94A3B8]">Contexto</p>
						{hasContext ? (
							<>
								{data.contextText.trim() && (
									<p className="text-sm text-[#F1F5F9] line-clamp-2">
										{data.contextText.slice(0, 120)}
										{data.contextText.length > 120 ? "..." : ""}
									</p>
								)}
								{data.contextFiles.length > 0 && (
									<p className="mt-0.5 text-xs text-[#64748B]">
										{data.contextFiles.length} archivo{data.contextFiles.length !== 1 ? "s" : ""}
									</p>
								)}
							</>
						) : (
							<p className="text-sm text-[#64748B]">Sin contexto</p>
						)}
					</div>
				</div>

				{/* Schedule */}
				<div className="flex items-start gap-3">
					<CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#64748B]" />
					<div>
						<p className="text-xs font-medium text-[#94A3B8]">Fecha</p>
						{hasSchedule ? (
							<>
								<p className="text-sm font-medium text-[#F1F5F9]">
									{new Date(data.scheduledFor).toLocaleDateString("es-MX", {
										weekday: "short",
										day: "numeric",
										month: "short",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
								{data.duration && (
									<p className="mt-0.5 text-xs text-[#64748B]">{data.duration} min</p>
								)}
								{data.isNoCall && (
									<span className="mt-1 inline-block rounded-full bg-[#1E293B] px-2 py-0.5 text-[11px] font-medium text-[#D97706]">
										Sin llamada
									</span>
								)}
							</>
						) : (
							<p className="text-sm text-[#64748B]">Sin agendar</p>
						)}
					</div>
				</div>
			</div>

			{/* Info box */}
			<div className="mt-6 flex items-start gap-2.5 rounded-lg border border-[#1E3A5F] bg-[#0C1E36] p-3">
				<InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-[#2563EB]" />
				<p className="text-xs leading-relaxed text-[#94A3B8]">
					Completa los pasos para generar invitaciones inteligentes con IA.
				</p>
			</div>
		</div>
	);
}

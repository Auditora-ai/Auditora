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
		<div className="flex h-full flex-col border-l border-chrome-border bg-chrome-base p-6">
			<h3 className="mb-6 text-xs font-semibold uppercase tracking-wider text-chrome-text-muted">
				Resumen
			</h3>

			<div className="flex-1 space-y-5">
				{/* Process */}
				<div className="flex items-start gap-3">
					<GitBranchIcon className="mt-0.5 h-4 w-4 shrink-0 text-chrome-text-muted" />
					<div>
						<p className="text-xs font-medium text-chrome-text-secondary">Proceso</p>
						{hasProcess ? (
							<>
								<p className="text-sm font-medium text-chrome-text">{data.processName}</p>
								{data.sessionType && (
									<span className="mt-1 inline-block rounded-full bg-chrome-raised px-2 py-0.5 text-[11px] font-medium text-chrome-text-secondary">
										{SESSION_TYPE_LABELS[data.sessionType] ?? data.sessionType}
									</span>
								)}
							</>
						) : (
							<p className="text-sm text-chrome-text-muted">Sin seleccionar</p>
						)}
					</div>
				</div>

				{/* Participants */}
				<div className="flex items-start gap-3">
					<UsersIcon className="mt-0.5 h-4 w-4 shrink-0 text-chrome-text-muted" />
					<div>
						<p className="text-xs font-medium text-chrome-text-secondary">Participantes</p>
						{hasParticipants ? (
							<>
								<p className="text-sm font-medium text-chrome-text">
									{data.participants.length} persona{data.participants.length !== 1 ? "s" : ""}
								</p>
								<p className="mt-0.5 text-xs text-chrome-text-muted">
									{data.participants
										.slice(0, 3)
										.map((p) => p.name || p.email)
										.join(", ")}
									{data.participants.length > 3 && ` +${data.participants.length - 3}`}
								</p>
							</>
						) : (
							<p className="text-sm text-chrome-text-muted">Sin agregar</p>
						)}
					</div>
				</div>

				{/* Context */}
				<div className="flex items-start gap-3">
					<FileTextIcon className="mt-0.5 h-4 w-4 shrink-0 text-chrome-text-muted" />
					<div>
						<p className="text-xs font-medium text-chrome-text-secondary">Contexto</p>
						{hasContext ? (
							<>
								{data.contextText.trim() && (
									<p className="text-sm text-chrome-text line-clamp-2">
										{data.contextText.slice(0, 120)}
										{data.contextText.length > 120 ? "..." : ""}
									</p>
								)}
								{data.contextFiles.length > 0 && (
									<p className="mt-0.5 text-xs text-chrome-text-muted">
										{data.contextFiles.length} archivo{data.contextFiles.length !== 1 ? "s" : ""}
									</p>
								)}
							</>
						) : (
							<p className="text-sm text-chrome-text-muted">Sin contexto</p>
						)}
					</div>
				</div>

				{/* Schedule */}
				<div className="flex items-start gap-3">
					<CalendarIcon className="mt-0.5 h-4 w-4 shrink-0 text-chrome-text-muted" />
					<div>
						<p className="text-xs font-medium text-chrome-text-secondary">Fecha</p>
						{hasSchedule ? (
							<>
								<p className="text-sm font-medium text-chrome-text">
									{new Date(data.scheduledFor).toLocaleDateString("es-MX", {
										weekday: "short",
										day: "numeric",
										month: "short",
										hour: "2-digit",
										minute: "2-digit",
									})}
								</p>
								{data.duration && (
									<p className="mt-0.5 text-xs text-chrome-text-muted">{data.duration} min</p>
								)}
								{data.isNoCall && (
									<span className="mt-1 inline-block rounded-full bg-chrome-raised px-2 py-0.5 text-[11px] font-medium text-orientation">
										Sin llamada
									</span>
								)}
							</>
						) : (
							<p className="text-sm text-chrome-text-muted">Sin agendar</p>
						)}
					</div>
				</div>
			</div>

			{/* Info box */}
			<div className="mt-6 flex items-start gap-2.5 rounded-lg border border-chrome-border bg-chrome-base p-3">
				<InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
				<p className="text-xs leading-relaxed text-chrome-text-secondary">
					Completa los pasos para generar invitaciones inteligentes con IA.
				</p>
			</div>
		</div>
	);
}

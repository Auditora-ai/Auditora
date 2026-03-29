"use client";

import { useState } from "react";
import {
	PlusIcon,
	TrashIcon,
	UsersIcon,
	DownloadIcon,
	Loader2Icon,
} from "lucide-react";
import { toast } from "sonner";
import type { WizardData } from "../SessionWizard";

const ROLES = [
	{ value: "owner", label: "Dueno" },
	{ value: "executor", label: "Ejecutor" },
	{ value: "expert", label: "Experto" },
	{ value: "observer", label: "Observador" },
] as const;

const ROLE_LABELS: Record<string, string> = {
	owner: "Dueno",
	executor: "Ejecutor",
	expert: "Experto",
	observer: "Observador",
};

interface Participant {
	name: string;
	email: string;
	role: string;
}

export function StepParticipants({
	data,
	onChange,
}: {
	data: WizardData;
	onChange: (patch: Partial<WizardData>) => void;
}) {
	const [loadingRaci, setLoadingRaci] = useState(false);

	const participants = data.participants;

	const updateParticipant = (index: number, patch: Partial<Participant>) => {
		const updated = [...participants];
		updated[index] = { ...updated[index], ...patch };
		onChange({ participants: updated });
	};

	const addParticipant = () => {
		onChange({
			participants: [...participants, { name: "", email: "", role: "executor" }],
		});
	};

	const removeParticipant = (index: number) => {
		const updated = participants.filter((_, i) => i !== index);
		onChange({ participants: updated });
	};

	const importFromRaci = async () => {
		if (!data.processId) {
			toast.error("Selecciona un proceso existente primero");
			return;
		}

		setLoadingRaci(true);
		try {
			const res = await fetch(`/api/processes/${data.processId}/raci`);
			if (!res.ok) throw new Error("Error al obtener RACI");

			const raciData = await res.json();

			// Extract unique people from RACI data
			const imported: Participant[] = [];
			const seen = new Set<string>();

			if (raciData.entries && Array.isArray(raciData.entries)) {
				for (const entry of raciData.entries) {
					for (const assignment of entry.assignments ?? []) {
						const key = (assignment.name ?? assignment.email ?? "").toLowerCase();
						if (key && !seen.has(key)) {
							seen.add(key);
							let role = "executor";
							if (assignment.type === "R") role = "executor";
							else if (assignment.type === "A") role = "owner";
							else if (assignment.type === "C") role = "expert";
							else if (assignment.type === "I") role = "observer";

							imported.push({
								name: assignment.name ?? "",
								email: assignment.email ?? "",
								role,
							});
						}
					}
				}
			}

			if (imported.length === 0) {
				toast.info("No se encontraron participantes en el RACI");
				return;
			}

			// Merge with existing, avoid duplicates by email
			const existingEmails = new Set(
				participants.filter((p) => p.email).map((p) => p.email.toLowerCase()),
			);
			const newParticipants = imported.filter(
				(p) => !p.email || !existingEmails.has(p.email.toLowerCase()),
			);

			onChange({
				participants: [...participants, ...newParticipants],
			});

			toast.success(`${newParticipants.length} participantes importados del RACI`);
		} catch {
			toast.error("No se pudo importar desde RACI");
		} finally {
			setLoadingRaci(false);
		}
	};

	return (
		<div className="flex h-full flex-col">
			<h2 className="mb-1 text-xl font-semibold text-chrome-text">Participantes</h2>
			<p className="mb-6 text-sm text-chrome-text-muted">
				Agrega las personas que participaran en la sesion.
			</p>

			{/* Actions */}
			<div className="mb-4 flex items-center gap-2">
				<button
					type="button"
					onClick={addParticipant}
					className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-action-hover"
				>
					<PlusIcon className="h-4 w-4" />
					Agregar
				</button>

				{data.processId && (
					<button
						type="button"
						onClick={importFromRaci}
						disabled={loadingRaci}
						className="inline-flex items-center gap-1.5 rounded-lg border border-chrome-border px-3 py-2 text-sm font-medium text-chrome-text-secondary transition-colors hover:border-chrome-text-muted hover:text-chrome-text disabled:opacity-50"
					>
						{loadingRaci ? (
							<Loader2Icon className="h-4 w-4 animate-spin" />
						) : (
							<DownloadIcon className="h-4 w-4" />
						)}
						Importar desde RACI
					</button>
				)}
			</div>

			{/* Participants list */}
			<div className="flex-1 space-y-3 overflow-y-auto">
				{participants.length === 0 ? (
					<div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-chrome-border py-12 text-center">
						<UsersIcon className="mb-3 h-8 w-8 text-foreground" />
						<p className="text-sm font-medium text-chrome-text-muted">Sin participantes</p>
						<p className="mt-1 text-xs text-chrome-text-muted">
							Agrega al menos un participante para la sesion
						</p>
					</div>
				) : (
					participants.map((participant, index) => (
						<div
							key={index}
							className="flex items-start gap-3 rounded-lg border border-chrome-border bg-chrome-raised p-3"
						>
							<div className="grid flex-1 grid-cols-3 gap-2">
								{/* Name */}
								<input
									type="text"
									value={participant.name}
									onChange={(e) => updateParticipant(index, { name: e.target.value })}
									placeholder="Nombre"
									className="rounded-md border border-chrome-border bg-chrome-base px-3 py-2 text-sm text-chrome-text placeholder:text-chrome-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
								/>

								{/* Email */}
								<input
									type="email"
									value={participant.email}
									onChange={(e) => updateParticipant(index, { email: e.target.value })}
									placeholder="email@empresa.com"
									className="rounded-md border border-chrome-border bg-chrome-base px-3 py-2 text-sm text-chrome-text placeholder:text-chrome-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
								/>

								{/* Role */}
								<select
									value={participant.role}
									onChange={(e) => updateParticipant(index, { role: e.target.value })}
									className="rounded-md border border-chrome-border bg-chrome-base px-3 py-2 text-sm text-chrome-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
								>
									{ROLES.map((r) => (
										<option key={r.value} value={r.value}>
											{r.label}
										</option>
									))}
								</select>
							</div>

							{/* Delete */}
							<button
								type="button"
								onClick={() => removeParticipant(index)}
								className="mt-1 rounded-md p-1.5 text-chrome-text-muted transition-colors hover:bg-chrome-hover hover:text-destructive"
							>
								<TrashIcon className="h-4 w-4" />
							</button>
						</div>
					))
				)}
			</div>
		</div>
	);
}

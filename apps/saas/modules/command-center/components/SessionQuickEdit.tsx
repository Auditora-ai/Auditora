"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import type { SessionData } from "./CommandCenter";

export function SessionQuickEdit({
	session,
	onSave,
	onClose,
}: {
	session: SessionData;
	onSave: (data: Record<string, unknown>) => void;
	onClose: () => void;
}) {
	const [scheduledFor, setScheduledFor] = useState(
		session.scheduledFor ? new Date(session.scheduledFor).toISOString().slice(0, 16) : "",
	);
	const [sessionGoals, setSessionGoals] = useState(session.sessionGoals ?? "");
	const [sessionType, setSessionType] = useState(session.type);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		const data: Record<string, unknown> = {};
		if (scheduledFor) data.scheduledFor = new Date(scheduledFor).toISOString();
		if (sessionGoals !== (session.sessionGoals ?? "")) data.sessionGoals = sessionGoals;
		if (sessionType !== session.type) data.type = sessionType;
		if (Object.keys(data).length > 0) onSave(data);
		else onClose();
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
			<div className="mx-4 w-full max-w-sm rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-sm font-semibold text-[#0F172A]">
						Editar: {session.processDefinition?.name ?? "Sesión"}
					</h3>
					<button type="button" onClick={onClose} className="text-[#94A3B8] hover:text-[#334155]">
						<XIcon className="h-4 w-4" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-3">
					<div>
						<label className="mb-1 block text-xs font-medium text-[#64748B]">Fecha y hora</label>
						<input
							type="datetime-local"
							value={scheduledFor}
							onChange={(e) => setScheduledFor(e.target.value)}
							className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-sm"
						/>
					</div>

					<div>
						<label className="mb-1 block text-xs font-medium text-[#64748B]">Tipo</label>
						<select
							value={sessionType}
							onChange={(e) => setSessionType(e.target.value)}
							className="w-full rounded-md border border-[#E2E8F0] px-3 py-2 text-sm"
						>
							<option value="DISCOVERY">Discovery</option>
							<option value="DEEP_DIVE">Deep Dive</option>
							<option value="CONTINUATION">Continuation</option>
						</select>
					</div>

					<div>
						<label className="mb-1 block text-xs font-medium text-[#64748B]">Objetivos</label>
						<textarea
							value={sessionGoals}
							onChange={(e) => setSessionGoals(e.target.value)}
							rows={2}
							placeholder="Qué cubrir en esta sesión..."
							className="w-full resize-none rounded-md border border-[#E2E8F0] px-3 py-2 text-sm"
						/>
					</div>

					<div className="flex justify-end gap-2 pt-1">
						<button type="button" onClick={onClose} className="rounded-md border border-[#E2E8F0] px-3 py-1.5 text-xs text-[#64748B] hover:bg-[#F8FAFC]">
							Cancelar
						</button>
						<button type="submit" className="rounded-md bg-[#2563EB] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1D4ED8]">
							Guardar
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

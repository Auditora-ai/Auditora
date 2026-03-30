"use client";

import { useState } from "react";
import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
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
	const t = useTranslations("commandCenter");
	const tw = useTranslations("commandCenter.wizard");
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
			<div className="mx-4 w-full max-w-sm rounded-xl bg-background p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-sm font-semibold text-foreground">
						Editar: {session.processDefinition?.name ?? t("defaultProcess")}
					</h3>
					<button type="button" onClick={onClose} className="text-chrome-text-secondary hover:text-foreground">
						<XIcon className="h-4 w-4" />
					</button>
				</div>

				<form onSubmit={handleSubmit} className="space-y-3">
					<div>
						<label className="mb-1 block text-xs font-medium text-chrome-text-muted">Fecha y hora</label>
						<input
							type="datetime-local"
							value={scheduledFor}
							onChange={(e) => setScheduledFor(e.target.value)}
							className="w-full rounded-md border border-border px-3 py-2 text-sm"
						/>
					</div>

					<div>
						<label className="mb-1 block text-xs font-medium text-chrome-text-muted">Tipo</label>
						<select
							value={sessionType}
							onChange={(e) => setSessionType(e.target.value)}
							className="w-full rounded-md border border-border px-3 py-2 text-sm"
						>
							<option value="DISCOVERY">Discovery</option>
							<option value="DEEP_DIVE">Deep Dive</option>
							<option value="CONTINUATION">Continuation</option>
						</select>
					</div>

					<div>
						<label className="mb-1 block text-xs font-medium text-chrome-text-muted">Objetivos</label>
						<textarea
							value={sessionGoals}
							onChange={(e) => setSessionGoals(e.target.value)}
							rows={2}
							placeholder={tw("coverPlaceholder")}
							className="w-full resize-none rounded-md border border-border px-3 py-2 text-sm"
						/>
					</div>

					<div className="flex justify-end gap-2 pt-1">
						<button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-1.5 text-xs text-chrome-text-muted hover:bg-secondary">
							Cancelar
						</button>
						<button type="submit" className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-action-hover">
							Guardar
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

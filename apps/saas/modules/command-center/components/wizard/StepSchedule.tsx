"use client";

import { useEffect } from "react";
import {
	CalendarIcon,
	ClockIcon,
	LinkIcon,
	PhoneOffIcon,
	DownloadIcon,
} from "lucide-react";
import type { WizardData } from "../SessionWizard";

const DURATIONS = [
	{ value: "30", label: "30 min" },
	{ value: "60", label: "1 hora" },
	{ value: "90", label: "1.5 hrs" },
	{ value: "120", label: "2 hrs" },
] as const;

export function StepSchedule({
	data,
	onChange,
}: {
	data: WizardData;
	onChange: (patch: Partial<WizardData>) => void;
}) {
	// Default date to tomorrow at 10am if not set
	useEffect(() => {
		if (!data.scheduledFor) {
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			tomorrow.setHours(10, 0, 0, 0);
			onChange({ scheduledFor: tomorrow.toISOString().slice(0, 16) });
		}
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const handleIcsDownload = () => {
		// Phase 2: Generate .ics file
		// For now this is a placeholder
		if (!data.scheduledFor) return;

		const start = new Date(data.scheduledFor);
		const durationMin = parseInt(data.duration || "60", 10);
		const end = new Date(start.getTime() + durationMin * 60 * 1000);

		const formatIcsDate = (d: Date) =>
			d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

		const icsContent = [
			"BEGIN:VCALENDAR",
			"VERSION:2.0",
			"PRODID:-//Auditora.ai//Session//ES",
			"BEGIN:VEVENT",
			`DTSTART:${formatIcsDate(start)}`,
			`DTEND:${formatIcsDate(end)}`,
			`SUMMARY:Sesion de Proceso`,
			data.meetingUrl ? `LOCATION:${data.meetingUrl}` : "",
			"END:VEVENT",
			"END:VCALENDAR",
		]
			.filter(Boolean)
			.join("\r\n");

		const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "sesion.ics";
		a.click();
		URL.revokeObjectURL(url);
	};

	return (
		<div className="flex h-full flex-col">
			<h2 className="mb-1 text-xl font-semibold text-chrome-text">Agendar</h2>
			<p className="mb-6 text-sm text-chrome-text-muted">
				Define cuando sera la sesion y como se conectaran.
			</p>

			{/* Date/time */}
			<div className="mb-5">
				<label className="mb-2 flex items-center gap-2 text-xs font-medium text-chrome-text-secondary">
					<CalendarIcon className="h-3.5 w-3.5" />
					Fecha y hora
				</label>
				<input
					type="datetime-local"
					value={data.scheduledFor}
					onChange={(e) => onChange({ scheduledFor: e.target.value })}
					className="w-full rounded-lg border border-chrome-border bg-chrome-raised px-4 py-3 text-sm text-chrome-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary [color-scheme:dark]"
				/>
			</div>

			{/* Duration pills */}
			<div className="mb-5">
				<label className="mb-2 flex items-center gap-2 text-xs font-medium text-chrome-text-secondary">
					<ClockIcon className="h-3.5 w-3.5" />
					Duracion
				</label>
				<div className="flex gap-2">
					{DURATIONS.map((d) => (
						<button
							key={d.value}
							type="button"
							onClick={() => onChange({ duration: d.value })}
							className={`flex-1 rounded-lg border px-3 py-3 text-center text-sm font-medium transition-all ${
								data.duration === d.value
									? "border-primary bg-primary/10 text-chrome-text"
									: "border-chrome-border bg-chrome-raised text-chrome-text-muted hover:border-chrome-text-muted"
							}`}
						>
							{d.label}
						</button>
					))}
				</div>
			</div>

			{/* No-call toggle */}
			<div className="mb-5">
				<button
					type="button"
					onClick={() => onChange({ isNoCall: !data.isNoCall })}
					className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
						data.isNoCall
							? "border-orientation bg-orientation/10"
							: "border-chrome-border bg-chrome-raised hover:border-chrome-text-muted"
					}`}
				>
					<PhoneOffIcon
						className={`h-5 w-5 ${data.isNoCall ? "text-orientation" : "text-chrome-text-muted"}`}
					/>
					<div className="flex-1 text-left">
						<p
							className={`text-sm font-medium ${
								data.isNoCall ? "text-chrome-text" : "text-chrome-text-secondary"
							}`}
						>
							Sesion sin llamada
						</p>
						<p className="text-xs text-chrome-text-muted">
							El cliente completa el intake de forma asincrona
						</p>
					</div>
					{/* Toggle switch */}
					<div
						className={`relative h-6 w-11 rounded-full transition-colors ${
							data.isNoCall ? "bg-orientation" : "bg-chrome-hover"
						}`}
					>
						<div
							className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-transform ${
								data.isNoCall ? "translate-x-[22px]" : "translate-x-0.5"
							}`}
						/>
					</div>
				</button>
			</div>

			{/* Meeting link */}
			{!data.isNoCall && (
				<div className="mb-5">
					<label className="mb-2 flex items-center gap-2 text-xs font-medium text-chrome-text-secondary">
						<LinkIcon className="h-3.5 w-3.5" />
						Link de la reunion
					</label>
					<input
						type="url"
						value={data.meetingUrl}
						onChange={(e) => onChange({ meetingUrl: e.target.value })}
						placeholder="Pega aqui tu link de Zoom, Meet o Teams"
						className="w-full rounded-lg border border-chrome-border bg-chrome-raised px-4 py-3 text-sm text-chrome-text placeholder:text-chrome-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
					/>
				</div>
			)}

			{/* .ics download */}
			<div className="mt-auto">
				<button
					type="button"
					onClick={handleIcsDownload}
					disabled={!data.scheduledFor}
					className="inline-flex items-center gap-1.5 rounded-lg border border-chrome-border px-3 py-2 text-sm font-medium text-chrome-text-secondary transition-colors hover:border-chrome-text-muted hover:text-chrome-text disabled:opacity-50"
				>
					<DownloadIcon className="h-4 w-4" />
					Descargar .ics
				</button>
			</div>
		</div>
	);
}

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
			"PRODID:-//aiprocess.me//Session//ES",
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
			<h2 className="mb-1 text-xl font-semibold text-[#F1F5F9]">Agendar</h2>
			<p className="mb-6 text-sm text-[#64748B]">
				Define cuando sera la sesion y como se conectaran.
			</p>

			{/* Date/time */}
			<div className="mb-5">
				<label className="mb-2 flex items-center gap-2 text-xs font-medium text-[#94A3B8]">
					<CalendarIcon className="h-3.5 w-3.5" />
					Fecha y hora
				</label>
				<input
					type="datetime-local"
					value={data.scheduledFor}
					onChange={(e) => onChange({ scheduledFor: e.target.value })}
					className="w-full rounded-lg border border-[#334155] bg-[#1E293B] px-4 py-3 text-sm text-[#F1F5F9] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB] [color-scheme:dark]"
				/>
			</div>

			{/* Duration pills */}
			<div className="mb-5">
				<label className="mb-2 flex items-center gap-2 text-xs font-medium text-[#94A3B8]">
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
									? "border-[#2563EB] bg-[#2563EB]/10 text-[#F1F5F9]"
									: "border-[#334155] bg-[#1E293B] text-[#64748B] hover:border-[#64748B]"
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
							? "border-[#D97706] bg-[#D97706]/10"
							: "border-[#334155] bg-[#1E293B] hover:border-[#64748B]"
					}`}
				>
					<PhoneOffIcon
						className={`h-5 w-5 ${data.isNoCall ? "text-[#D97706]" : "text-[#64748B]"}`}
					/>
					<div className="flex-1 text-left">
						<p
							className={`text-sm font-medium ${
								data.isNoCall ? "text-[#F1F5F9]" : "text-[#94A3B8]"
							}`}
						>
							Sesion sin llamada
						</p>
						<p className="text-xs text-[#64748B]">
							El cliente completa el intake de forma asincrona
						</p>
					</div>
					{/* Toggle switch */}
					<div
						className={`relative h-6 w-11 rounded-full transition-colors ${
							data.isNoCall ? "bg-[#D97706]" : "bg-[#334155]"
						}`}
					>
						<div
							className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
								data.isNoCall ? "translate-x-[22px]" : "translate-x-0.5"
							}`}
						/>
					</div>
				</button>
			</div>

			{/* Meeting link */}
			{!data.isNoCall && (
				<div className="mb-5">
					<label className="mb-2 flex items-center gap-2 text-xs font-medium text-[#94A3B8]">
						<LinkIcon className="h-3.5 w-3.5" />
						Link de la reunion
					</label>
					<input
						type="url"
						value={data.meetingUrl}
						onChange={(e) => onChange({ meetingUrl: e.target.value })}
						placeholder="Pega aqui tu link de Zoom, Meet o Teams"
						className="w-full rounded-lg border border-[#334155] bg-[#1E293B] px-4 py-3 text-sm text-[#F1F5F9] placeholder:text-[#64748B] focus:border-[#2563EB] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
					/>
				</div>
			)}

			{/* .ics download */}
			<div className="mt-auto">
				<button
					type="button"
					onClick={handleIcsDownload}
					disabled={!data.scheduledFor}
					className="inline-flex items-center gap-1.5 rounded-lg border border-[#334155] px-3 py-2 text-sm font-medium text-[#94A3B8] transition-colors hover:border-[#64748B] hover:text-[#F1F5F9] disabled:opacity-50"
				>
					<DownloadIcon className="h-4 w-4" />
					Descargar .ics
				</button>
			</div>
		</div>
	);
}

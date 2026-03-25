"use client";

import { useRouter } from "next/navigation";
import { CalendarIcon, PlayIcon, LinkIcon, PlusIcon } from "lucide-react";
import type { SessionData } from "./CommandCenter";

const sessionTypeLabels: Record<string, string> = {
	DISCOVERY: "Discovery",
	DEEP_DIVE: "Deep Dive",
	CONTINUATION: "Continuation",
};

export function NextSessionHero({
	session,
	organizationSlug,
	onGenerateIntake,
	onSchedule,
}: {
	session: SessionData | null;
	organizationSlug: string;
	onGenerateIntake: (intakeToken: string) => void;
	onSchedule: () => void;
}) {
	const router = useRouter();

	if (!session) {
		return (
			<div className="flex flex-col items-center justify-center rounded-xl bg-[#0F172A] p-8 text-center">
				<CalendarIcon className="mb-3 h-8 w-8 text-[#64748B]" />
				<p className="mb-1 text-sm font-medium text-[#F1F5F9]">Sin sesiones programadas</p>
				<p className="mb-4 text-xs text-[#64748B]">Programa una sesión para comenzar</p>
				<button
					type="button"
					onClick={onSchedule}
					className="flex items-center gap-1.5 rounded-md bg-[#2563EB] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#1D4ED8]"
				>
					<PlusIcon className="h-3.5 w-3.5" />
					Programar Sesión
				</button>
			</div>
		);
	}

	const isActive = session.status === "ACTIVE" || session.status === "CONNECTING";
	const date = session.scheduledFor
		? new Date(session.scheduledFor).toLocaleDateString("es-MX", {
				weekday: "short",
				day: "numeric",
				month: "short",
				hour: "2-digit",
				minute: "2-digit",
			})
		: isActive
			? "En curso"
			: "Sin programar";

	const clientParticipant = session.participants.find((p) => p.participantType === "CLIENT");

	return (
		<div className="rounded-xl bg-[#0F172A] p-6 text-[#F1F5F9]">
			<div className="mb-1 flex items-center gap-2">
				<span className="text-[10px] uppercase tracking-wider text-[#64748B]">
					{isActive ? "Sesión en curso" : "Próxima sesión"}
				</span>
				{isActive && (
					<span className="relative flex h-2 w-2">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#16A34A] opacity-75" />
						<span className="relative inline-flex h-2 w-2 rounded-full bg-[#16A34A]" />
					</span>
				)}
			</div>

			<div className="mb-1 text-xs text-[#94A3B8]">{date}</div>

			<h2 className="mb-1 text-xl font-semibold">
				{session.processDefinition?.name ?? "Sesión general"}
			</h2>

			<div className="mb-4 text-sm text-[#94A3B8]">
				{clientParticipant?.name && `${clientParticipant.name}`}
				{clientParticipant?.role && ` · ${clientParticipant.role}`}
				{(clientParticipant?.name ? " · " : "")}
				{sessionTypeLabels[session.type] ?? session.type}
			</div>

			{session.sessionGoals && (
				<div className="mb-4 rounded-lg bg-[#1E293B] px-3 py-2 text-xs text-[#94A3B8]">
					{session.sessionGoals}
				</div>
			)}

			<div className="flex flex-wrap gap-2">
				{isActive ? (
					<button
						type="button"
						onClick={() => router.push(`/${organizationSlug}/session/${session.id}/live`)}
						className="flex items-center gap-1.5 rounded-md bg-[#16A34A] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#15803D]"
					>
						<PlayIcon className="h-3.5 w-3.5" />
						Retomar
					</button>
				) : (
					<button
						type="button"
						onClick={() => router.push(`/${organizationSlug}/session/${session.id}/live`)}
						className="flex items-center gap-1.5 rounded-md bg-[#2563EB] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#1D4ED8]"
					>
						<PlayIcon className="h-3.5 w-3.5" />
						Iniciar Sesión
					</button>
				)}

				{session.intakeToken && (
					<button
						type="button"
						onClick={() => onGenerateIntake(session.intakeToken!)}
						className="flex items-center gap-1.5 rounded-md border border-[#334155] bg-[#1E293B] px-4 py-2 text-xs font-medium text-[#F1F5F9] transition-colors hover:bg-[#334155]"
					>
						<LinkIcon className="h-3.5 w-3.5" />
						{session._count.intakeResponses > 0 ? "Link del Cliente" : "Generar Link"}
					</button>
				)}

				{session.processDefinition && (
					<button
						type="button"
						onClick={() => router.push(`/${organizationSlug}/procesos/${session.processDefinition!.id}`)}
						className="rounded-md border border-[#334155] bg-[#1E293B] px-4 py-2 text-xs font-medium text-[#F1F5F9] transition-colors hover:bg-[#334155]"
					>
						Ver Proceso
					</button>
				)}
			</div>
		</div>
	);
}

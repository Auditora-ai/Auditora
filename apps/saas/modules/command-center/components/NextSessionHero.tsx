"use client";

import { useRouter } from "next/navigation";
import { CalendarIcon, PlayIcon, LinkIcon, PlusIcon, ArrowRightIcon } from "lucide-react";
import type { SessionData } from "./CommandCenter";

const sessionTypeLabels: Record<string, string> = {
	DISCOVERY: "Discovery",
	DEEP_DIVE: "Deep Dive",
	CONTINUATION: "Continuación",
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

	// Empty state
	if (!session) {
		return (
			<div className="rounded-xl border border-dashed border-[#E2E8F0] bg-[#FAFBFC] px-6 py-10 text-center">
				<p className="mb-1 text-sm font-medium text-[#334155]">Sin sesiones programadas</p>
				<p className="mb-5 text-xs text-[#94A3B8]">Programa tu primera sesión para comenzar</p>
				<button
					type="button"
					onClick={onSchedule}
					className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F172A] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1E293B]"
				>
					<PlusIcon className="h-4 w-4" />
					Programar Sesión
				</button>
			</div>
		);
	}

	const isActive = session.status === "ACTIVE" || session.status === "CONNECTING";

	const date = session.scheduledFor
		? new Date(session.scheduledFor).toLocaleDateString("es-MX", {
				weekday: "long",
				day: "numeric",
				month: "long",
				hour: "2-digit",
				minute: "2-digit",
			})
		: isActive
			? "En curso ahora"
			: null;

	const clientParticipant = session.participants.find((p) => p.participantType === "CLIENT");

	return (
		<div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
			{/* Label */}
			<div className="mb-3 flex items-center gap-2">
				{isActive ? (
					<>
						<span className="relative flex h-2 w-2">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#16A34A] opacity-75" />
							<span className="relative inline-flex h-2 w-2 rounded-full bg-[#16A34A]" />
						</span>
						<span className="text-xs font-medium text-[#16A34A]">Sesión en curso</span>
					</>
				) : (
					<span className="text-[11px] font-medium uppercase tracking-wider text-[#94A3B8]">Próxima sesión</span>
				)}
			</div>

			{/* Process name */}
			<h2 className="mb-0.5 text-lg font-semibold text-[#0F172A]">
				{session.processDefinition?.name ?? "Sesión general"}
			</h2>

			{/* Meta line */}
			<div className="mb-4 text-sm text-[#64748B]">
				{date && <span>{date}</span>}
				{clientParticipant?.name && <span> · {clientParticipant.name}</span>}
				{clientParticipant?.role && <span className="text-[#94A3B8]"> ({clientParticipant.role})</span>}
				<span className="ml-1 rounded bg-[#F1F5F9] px-1.5 py-0.5 text-[11px] font-medium text-[#64748B]">
					{sessionTypeLabels[session.type] ?? session.type}
				</span>
			</div>

			{/* Goals */}
			{session.sessionGoals && (
				<p className="mb-4 text-xs leading-relaxed text-[#64748B]">
					{session.sessionGoals}
				</p>
			)}

			{/* Actions */}
			<div className="flex flex-wrap gap-2">
				{isActive ? (
					<button
						type="button"
						onClick={() => router.push(`/${organizationSlug}/session/${session.id}/live`)}
						className="inline-flex items-center gap-1.5 rounded-lg bg-[#16A34A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#15803D]"
					>
						<PlayIcon className="h-3.5 w-3.5" />
						Retomar
					</button>
				) : (
					<button
						type="button"
						onClick={() => router.push(`/${organizationSlug}/session/${session.id}/live`)}
						className="inline-flex items-center gap-1.5 rounded-lg bg-[#0F172A] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1E293B]"
					>
						<ArrowRightIcon className="h-3.5 w-3.5" />
						Iniciar
					</button>
				)}

				{session.intakeToken && (
					<button
						type="button"
						onClick={() => onGenerateIntake(session.intakeToken!)}
						className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-medium text-[#334155] transition-colors hover:bg-[#F8FAFC]"
					>
						<LinkIcon className="h-3.5 w-3.5" />
						{session._count.intakeResponses > 0 ? "Link del Cliente" : "Generar Link"}
					</button>
				)}
			</div>
		</div>
	);
}

"use client";

import { useRouter } from "next/navigation";
import { CalendarIcon, PlayIcon, LinkIcon, PlusIcon, ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
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
	const t = useTranslations("commandCenter");

	// Empty state
	if (!session) {
		return (
			<div className="rounded-xl border border-dashed border-border bg-secondary px-6 py-10 text-center">
				<p className="mb-1 text-sm font-medium text-foreground">{t("noSessionsScheduled")}</p>
				<p className="mb-5 text-xs text-chrome-text-secondary">Programa tu primera sesión para comenzar</p>
				<button
					type="button"
					onClick={onSchedule}
					className="inline-flex items-center gap-1.5 rounded-lg bg-chrome-base px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-chrome-raised"
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
		<div className="rounded-xl border border-border bg-background p-5">
			{/* Label */}
			<div className="mb-3 flex items-center gap-2">
				{isActive ? (
					<>
						<span className="relative flex h-2 w-2">
							<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
							<span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
						</span>
						<span className="text-xs font-medium text-success">Sesión en curso</span>
					</>
				) : (
					<span className="text-[11px] font-medium uppercase tracking-wider text-chrome-text-secondary">Próxima sesión</span>
				)}
			</div>

			{/* Process name */}
			<h2 className="mb-0.5 font-display text-xl text-foreground">
				{session.processDefinition?.name ?? "Sesión general"}
			</h2>

			{/* Meta line */}
			<div className="mb-4 text-sm text-chrome-text-muted">
				{date && <span>{date}</span>}
				{clientParticipant?.name && <span> · {clientParticipant.name}</span>}
				{clientParticipant?.role && <span className="text-chrome-text-secondary"> ({clientParticipant.role})</span>}
				<span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-chrome-text-muted">
					{sessionTypeLabels[session.type] ?? session.type}
				</span>
			</div>

			{/* Goals */}
			{session.sessionGoals && (
				<p className="mb-4 text-xs leading-relaxed text-chrome-text-muted">
					{session.sessionGoals}
				</p>
			)}

			{/* Actions */}
			<div className="flex flex-wrap gap-2">
				{isActive ? (
					<button
						type="button"
						onClick={() => router.push(`/${organizationSlug}/session/${session.id}/live`)}
						className="inline-flex items-center gap-1.5 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
					>
						<PlayIcon className="h-3.5 w-3.5" />
						Retomar
					</button>
				) : (
					<button
						type="button"
						onClick={() => router.push(`/${organizationSlug}/session/${session.id}/live`)}
						className="inline-flex items-center gap-1.5 rounded-lg bg-chrome-base px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-chrome-raised"
					>
						<ArrowRightIcon className="h-3.5 w-3.5" />
						Iniciar
					</button>
				)}

				{session.intakeToken && (
					<button
						type="button"
						onClick={() => onGenerateIntake(session.intakeToken!)}
						className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
					>
						<LinkIcon className="h-3.5 w-3.5" />
						{session._count.intakeResponses > 0 ? "Link del Cliente" : "Generar Link"}
					</button>
				)}
			</div>
		</div>
	);
}

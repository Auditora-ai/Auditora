"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, PencilIcon } from "lucide-react";
import { toast } from "sonner";
import { ScheduleSessionDialog } from "./ScheduleSessionDialog";
import { ActiveSessionBanner } from "./ActiveSessionBanner";
import { StatsBar } from "./StatsBar";
import { NextSessionHero } from "./NextSessionHero";
import { PreparationPanel } from "./PreparationPanel";
import { SessionAgenda } from "./SessionAgenda";
import { ClientIntakeCard } from "./ClientIntakeCard";
import { SessionSuggestions } from "./SessionSuggestions";
import { CompactTimeline } from "./CompactTimeline";
import type { SessionSuggestion } from "./SessionSuggestions";

export interface SessionData {
	id: string;
	type: string;
	status: string;
	scheduledFor: string | null;
	scheduledEnd: string | null;
	startedAt: string | null;
	endedAt: string | null;
	createdAt: string;
	intakeToken: string | null;
	intakeStatus: string | null;
	sessionGoals: string | null;
	processDefinition: { id: string; name: string } | null;
	participants: { name: string; email: string | null; role: string | null; participantType: string | null }[];
	_count: { diagramNodes: number; transcriptEntries: number; intakeResponses: number };
}

export interface ProcessData {
	id: string;
	name: string;
	bpmnXml: string | null;
	intelligence: { id: string } | null;
	_count: { sessions: number; children: number; raciEntries: number; risks: number };
}

interface CommandCenterProps {
	sessions: SessionData[];
	organizationId: string;
	organizationName: string;
	organizationSlug: string;
	processCount: number;
	coveragePercent: number;
	processes: ProcessData[];
	suggestions: SessionSuggestion[];
}

export function CommandCenter({
	sessions: initialSessions,
	organizationId,
	organizationName,
	organizationSlug,
	processCount,
	coveragePercent,
	processes,
	suggestions,
}: CommandCenterProps) {
	const router = useRouter();
	const [sessions, setSessions] = useState(initialSessions);
	const [showSchedule, setShowSchedule] = useState(false);

	const refreshSessions = useCallback(async () => {
		try {
			const res = await fetch("/api/sessions");
			if (res.ok) {
				setSessions(await res.json());
				router.refresh();
			}
		} catch { /* ignore */ }
	}, [router]);

	// Sort sessions: active first, then scheduled (by date), then ended
	const sortedSessions = useMemo(() => {
		return [...sessions].sort((a, b) => {
			const statusOrder: Record<string, number> = { ACTIVE: 0, CONNECTING: 1, SCHEDULED: 2, ENDED: 3, FAILED: 4 };
			const oa = statusOrder[a.status] ?? 5;
			const ob = statusOrder[b.status] ?? 5;
			if (oa !== ob) return oa - ob;
			if (a.status === "SCHEDULED" && b.status === "SCHEDULED") {
				return new Date(a.scheduledFor!).getTime() - new Date(b.scheduledFor!).getTime();
			}
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});
	}, [sessions]);

	// Active sessions (for banner)
	const activeSessions = useMemo(
		() => sortedSessions.filter((s) => s.status === "ACTIVE" || s.status === "CONNECTING"),
		[sortedSessions],
	);

	// Next scheduled session (for hero)
	const nextSession = useMemo(() => {
		const now = new Date();
		// Prioritize ACTIVE/CONNECTING sessions
		if (activeSessions.length > 0) return activeSessions[0];
		// Then next scheduled
		return sortedSessions.find(
			(s) => s.status === "SCHEDULED" && s.scheduledFor && new Date(s.scheduledFor) > now,
		) ?? null;
	}, [sortedSessions, activeSessions]);

	// Scheduled sessions for agenda
	const scheduledSessions = useMemo(
		() => sortedSessions.filter((s) => s.status === "SCHEDULED"),
		[sortedSessions],
	);

	// Stats
	const now = new Date();
	const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
	const sessionsThisWeek = sessions.filter((s) => {
		if (s.status !== "SCHEDULED" || !s.scheduledFor) return false;
		const d = new Date(s.scheduledFor);
		return d >= now && d <= weekFromNow;
	}).length;

	const pendingIntake = sessions.filter(
		(s) => s.status === "SCHEDULED" && s.intakeStatus && s.intakeStatus !== "complete",
	).length;

	// Handle session reschedule (drag-reorder)
	const handleReschedule = useCallback(async (sessionId: string, newDate: string) => {
		try {
			const res = await fetch(`/api/sessions/${sessionId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ scheduledFor: newDate }),
			});
			if (!res.ok) throw new Error("Failed to reschedule");
			await refreshSessions();
		} catch {
			toast.error("Error al reprogramar la sesión");
		}
	}, [refreshSessions]);

	// Handle session quick-edit
	const handleQuickEdit = useCallback(async (sessionId: string, data: Record<string, unknown>) => {
		try {
			const res = await fetch(`/api/sessions/${sessionId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			});
			if (!res.ok) throw new Error("Failed to update");
			await refreshSessions();
			toast.success("Sesión actualizada");
		} catch {
			toast.error("Error al actualizar la sesión");
		}
	}, [refreshSessions]);

	// Handle intake generation
	const handleGenerateIntake = useCallback(async (intakeToken: string) => {
		try {
			const res = await fetch(`/api/intake/${intakeToken}`, { method: "POST" });
			if (!res.ok) throw new Error("Failed to generate intake");
			toast.success("Link de intake generado");
			await refreshSessions();
		} catch {
			toast.error("Error generando link de intake");
		}
	}, [refreshSessions]);

	// Handle edit mode (no-call session)
	const handleEditMode = useCallback(async (processId?: string) => {
		try {
			const res = await fetch("/api/sessions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					sessionType: "DEEP_DIVE",
					editMode: true,
					processDefinitionId: processId || undefined,
				}),
			});
			if (!res.ok) throw new Error("Failed to create edit session");
			const data = await res.json();
			router.push(`/${organizationSlug}/session/${data.sessionId}/live`);
		} catch {
			toast.error("Error al iniciar sesión de edición");
		}
	}, [organizationSlug, router]);

	// Empty state — no sessions at all
	if (sessions.length === 0 && processes.length === 0) {
		return (
			<div className="flex h-full flex-col items-center justify-center px-4 text-center" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
				<div className="mb-6 text-6xl opacity-20">📋</div>
				<h2 className="mb-2 text-xl font-semibold text-[#0F172A]">Centro de Comando</h2>
				<p className="mb-6 max-w-md text-sm text-[#64748B]">
					Programa tu primera sesión de levantamiento para comenzar a mapear procesos con IA.
				</p>
				<button
					type="button"
					onClick={() => setShowSchedule(true)}
					className="rounded-lg bg-[#2563EB] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#1D4ED8]"
				>
					Programar Primera Sesión
				</button>
				<ScheduleSessionDialog open={showSchedule} onClose={() => setShowSchedule(false)} onCreated={refreshSessions} />
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col overflow-auto" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
			{/* Active Session Banner */}
			{activeSessions.length > 0 && (
				<ActiveSessionBanner
					session={activeSessions[0]}
					organizationSlug={organizationSlug}
				/>
			)}

			{/* Header + Actions */}
			<div className="border-b border-[#E2E8F0] px-6 py-4">
				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-lg font-bold text-[#0F172A]">Centro de Comando</h1>
						<p className="text-xs text-[#64748B]">{organizationName}</p>
					</div>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={() => handleEditMode(nextSession?.processDefinition?.id)}
							className="flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-xs font-medium text-[#334155] transition-colors hover:bg-[#F8FAFC]"
						>
							<PencilIcon className="h-3.5 w-3.5" />
							Editar en Vivo
						</button>
						<button
							type="button"
							onClick={() => setShowSchedule(true)}
							className="flex items-center gap-1.5 rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[#1D4ED8]"
						>
							<PlusIcon className="h-3.5 w-3.5" />
							Nueva Sesión
						</button>
					</div>
				</div>

				{/* Stats */}
				<StatsBar
					sessionsThisWeek={sessionsThisWeek}
					processCount={processCount}
					coveragePercent={coveragePercent}
					pendingIntake={pendingIntake}
				/>
			</div>

			{/* Main content — 2-column responsive */}
			<div className="flex-1 overflow-auto p-6">
				<div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
					{/* Left column: Hero + Agenda */}
					<div className="space-y-5">
						<NextSessionHero
							session={nextSession}
							organizationSlug={organizationSlug}
							onGenerateIntake={handleGenerateIntake}
							onSchedule={() => setShowSchedule(true)}
						/>
						<SessionAgenda
							sessions={scheduledSessions}
							organizationSlug={organizationSlug}
							onReschedule={handleReschedule}
							onQuickEdit={handleQuickEdit}
							onRefresh={refreshSessions}
						/>
					</div>

					{/* Right column: Preparation + Intake + Suggestions */}
					<div className="space-y-5">
						{nextSession && (
							<PreparationPanel
								sessionId={nextSession.id}
								processName={nextSession.processDefinition?.name ?? "Sesión general"}
							/>
						)}
						{nextSession && (
							<ClientIntakeCard
								intakeToken={nextSession.intakeToken}
								intakeStatus={nextSession.intakeStatus}
								intakeResponseCount={nextSession._count.intakeResponses}
								onGenerate={() => nextSession.intakeToken && handleGenerateIntake(nextSession.intakeToken)}
							/>
						)}
						{suggestions.length > 0 && (
							<SessionSuggestions
								suggestions={suggestions}
								onSchedule={() => setShowSchedule(true)}
							/>
						)}
					</div>
				</div>

				{/* Timeline — full width below */}
				{scheduledSessions.length > 0 && (
					<div className="mt-5">
						<CompactTimeline sessions={scheduledSessions} />
					</div>
				)}
			</div>

			{/* Schedule Dialog */}
			<ScheduleSessionDialog
				open={showSchedule}
				onClose={() => setShowSchedule(false)}
				onCreated={refreshSessions}
			/>
		</div>
	);
}

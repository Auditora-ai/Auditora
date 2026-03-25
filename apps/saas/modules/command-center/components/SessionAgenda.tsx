"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
	DndContext,
	closestCenter,
	PointerSensor,
	useSensor,
	useSensors,
	type DragEndEvent,
} from "@dnd-kit/core";
import {
	SortableContext,
	verticalListSortingStrategy,
	useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVerticalIcon, MoreVerticalIcon, PlayIcon, EyeIcon } from "lucide-react";
import { SessionQuickEdit } from "./SessionQuickEdit";
import type { SessionData } from "./CommandCenter";

const sessionTypeLabels: Record<string, string> = {
	DISCOVERY: "Discovery",
	DEEP_DIVE: "Deep Dive",
	CONTINUATION: "Continuation",
};

function getPreparationBadge(session: SessionData) {
	if (session.intakeStatus === "complete") return { label: "Listo", bg: "bg-[#F0FDF4]", text: "text-[#16A34A]" };
	if (session.intakeStatus === "partial") return { label: "Preparando", bg: "bg-[#FEF9C3]", text: "text-[#D97706]" };
	if (session._count.intakeResponses > 0) return { label: "Pendiente", bg: "bg-[#FEF9C3]", text: "text-[#D97706]" };
	return { label: "Nuevo", bg: "bg-[#EFF6FF]", text: "text-[#2563EB]" };
}

function SortableSessionItem({
	session,
	organizationSlug,
	onQuickEdit,
}: {
	session: SessionData;
	organizationSlug: string;
	onQuickEdit: (session: SessionData) => void;
}) {
	const router = useRouter();
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: session.id });

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : 1,
	};

	const date = session.scheduledFor ? new Date(session.scheduledFor) : null;
	const badge = getPreparationBadge(session);

	const handleAction = () => {
		if (session.status === "ACTIVE" || session.status === "CONNECTING") {
			router.push(`/${organizationSlug}/session/${session.id}/live`);
		} else if (session.status === "ENDED") {
			router.push(`/${organizationSlug}/session/${session.id}/review`);
		} else {
			router.push(`/${organizationSlug}/session/${session.id}/live`);
		}
	};

	return (
		<div ref={setNodeRef} style={style} className="group flex items-center gap-2 rounded-lg px-2 py-2.5 transition-colors hover:bg-[#F8FAFC]">
			{/* Drag handle */}
			<button type="button" {...attributes} {...listeners} className="cursor-grab touch-none text-[#CBD5E1] opacity-0 transition-opacity group-hover:opacity-100">
				<GripVerticalIcon className="h-4 w-4" />
			</button>

			{/* Date */}
			<div className="w-10 shrink-0 text-center">
				{date ? (
					<>
						<div className="text-sm font-bold text-[#0F172A]">{date.getDate()}</div>
						<div className="text-[9px] uppercase text-[#94A3B8]">
							{date.toLocaleDateString("es-MX", { month: "short" })}
						</div>
					</>
				) : (
					<div className="text-xs text-[#CBD5E1]">—</div>
				)}
			</div>

			{/* Info */}
			<div className="min-w-0 flex-1">
				<div className="truncate text-xs font-medium text-[#0F172A]">
					{session.processDefinition?.name ?? "Sesión general"}
				</div>
				<div className="truncate text-[10px] text-[#94A3B8]">
					{sessionTypeLabels[session.type] ?? session.type}
					{date && ` · ${date.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`}
				</div>
			</div>

			{/* Badge */}
			<span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.bg} ${badge.text}`}>
				{badge.label}
			</span>

			{/* Actions */}
			<div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
				<button
					type="button"
					onClick={handleAction}
					className="rounded p-1 text-[#94A3B8] transition-colors hover:bg-[#E2E8F0] hover:text-[#334155]"
					title={session.status === "ENDED" ? "Ver" : "Iniciar"}
				>
					{session.status === "ENDED" ? <EyeIcon className="h-3.5 w-3.5" /> : <PlayIcon className="h-3.5 w-3.5" />}
				</button>
				<button
					type="button"
					onClick={() => onQuickEdit(session)}
					className="rounded p-1 text-[#94A3B8] transition-colors hover:bg-[#E2E8F0] hover:text-[#334155]"
					title="Editar"
				>
					<MoreVerticalIcon className="h-3.5 w-3.5" />
				</button>
			</div>
		</div>
	);
}

export function SessionAgenda({
	sessions,
	organizationSlug,
	onReschedule,
	onQuickEdit,
	onRefresh,
}: {
	sessions: SessionData[];
	organizationSlug: string;
	onReschedule: (sessionId: string, newDate: string) => void;
	onQuickEdit: (sessionId: string, data: Record<string, unknown>) => void;
	onRefresh: () => void;
}) {
	const [editingSession, setEditingSession] = useState<SessionData | null>(null);
	const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

	const handleDragEnd = useCallback((event: DragEndEvent) => {
		const { active, over } = event;
		if (!over || active.id === over.id) return;

		// Find the target session to get its date
		const targetSession = sessions.find((s) => s.id === over.id);
		if (!targetSession?.scheduledFor) return;

		onReschedule(active.id as string, targetSession.scheduledFor);
	}, [sessions, onReschedule]);

	if (sessions.length === 0) {
		return (
			<div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
				<h3 className="mb-2 text-sm font-semibold text-[#0F172A]">Agenda</h3>
				<p className="text-xs text-[#94A3B8]">
					Sin sesiones programadas.
				</p>
			</div>
		);
	}

	return (
		<div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
			<div className="mb-3 flex items-center justify-between px-2">
				<h3 className="text-sm font-semibold text-[#0F172A]">Agenda</h3>
				<span className="text-[10px] text-[#94A3B8]">{sessions.length} sesiones</span>
			</div>

			<DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
				<SortableContext items={sessions.map((s) => s.id)} strategy={verticalListSortingStrategy}>
					<div className="divide-y divide-[#F1F5F9]">
						{sessions.map((session) => (
							<SortableSessionItem
								key={session.id}
								session={session}
								organizationSlug={organizationSlug}
								onQuickEdit={setEditingSession}
							/>
						))}
					</div>
				</SortableContext>
			</DndContext>

			{/* Quick-edit popover */}
			{editingSession && (
				<SessionQuickEdit
					session={editingSession}
					onSave={(data) => {
						onQuickEdit(editingSession.id, data);
						setEditingSession(null);
					}}
					onClose={() => setEditingSession(null)}
				/>
			)}
		</div>
	);
}

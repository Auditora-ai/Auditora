"use client";

import { cn } from "@repo/ui";
import type { RaciAssignment } from "../data/mock-process";

interface RaciTabProps {
	assignments: RaciAssignment[];
}

function RoleBadge({
	name,
	type,
}: {
	name: string;
	type: "R" | "A" | "C" | "I";
}) {
	const colors = {
		R: "bg-blue-100 text-blue-700 border-blue-200",
		A: "bg-red-100 text-red-700 border-red-200",
		C: "bg-amber-100 text-amber-700 border-amber-200",
		I: "bg-slate-100 text-slate-600 border-slate-200",
	};

	return (
		<span
			className={cn(
				"inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
				colors[type],
			)}
		>
			{name}
		</span>
	);
}

function RaciLabel({ letter, label }: { letter: string; label: string }) {
	const colors: Record<string, string> = {
		R: "bg-blue-500",
		A: "bg-red-500",
		C: "bg-amber-500",
		I: "bg-slate-400",
	};

	return (
		<div className="flex items-center gap-1.5 mb-1">
			<span
				className={cn(
					"flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold text-white",
					colors[letter],
				)}
			>
				{letter}
			</span>
			<span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
				{label}
			</span>
		</div>
	);
}

export function RaciTab({ assignments }: RaciTabProps) {
	return (
		<div className="space-y-4 px-4 py-4">
			{/* Header */}
			<div>
				<h3 className="text-sm font-semibold text-slate-900">
					Matriz RACI
				</h3>
				<p className="text-xs text-slate-500 mt-0.5">
					Responsabilidades por paso del proceso
				</p>
			</div>

			{/* Legend */}
			<div className="flex flex-wrap gap-3 rounded-lg bg-slate-50 p-3">
				<div className="flex items-center gap-1.5">
					<span className="flex h-5 w-5 items-center justify-center rounded bg-blue-500 text-[10px] font-bold text-white">
						R
					</span>
					<span className="text-xs text-slate-600">Responsable</span>
				</div>
				<div className="flex items-center gap-1.5">
					<span className="flex h-5 w-5 items-center justify-center rounded bg-red-500 text-[10px] font-bold text-white">
						A
					</span>
					<span className="text-xs text-slate-600">Aprobador</span>
				</div>
				<div className="flex items-center gap-1.5">
					<span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500 text-[10px] font-bold text-white">
						C
					</span>
					<span className="text-xs text-slate-600">Consultado</span>
				</div>
				<div className="flex items-center gap-1.5">
					<span className="flex h-5 w-5 items-center justify-center rounded bg-slate-400 text-[10px] font-bold text-white">
						I
					</span>
					<span className="text-xs text-slate-600">Informado</span>
				</div>
			</div>

			{/* Steps with RACI */}
			{assignments.map((assignment, index) => (
				<div key={assignment.stepId} className="rounded-xl bg-white p-4 shadow-sm">
					{/* Step header */}
					<div className="flex items-center gap-2 mb-3">
						<span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-600">
							{index + 1}
						</span>
						<p className="text-sm font-semibold text-slate-900 leading-tight">
							{assignment.stepName}
						</p>
					</div>

					{/* RACI assignments */}
					<div className="space-y-2.5">
						{/* Responsible */}
						<div>
							<RaciLabel letter="R" label="Responsable" />
							<div className="ml-6">
								<RoleBadge name={assignment.responsible} type="R" />
							</div>
						</div>

						{/* Accountable */}
						<div>
							<RaciLabel letter="A" label="Aprobador" />
							<div className="ml-6">
								<RoleBadge name={assignment.accountable} type="A" />
							</div>
						</div>

						{/* Consulted */}
						{assignment.consulted.length > 0 && (
							<div>
								<RaciLabel letter="C" label="Consultado" />
								<div className="ml-6 flex flex-wrap gap-1">
									{assignment.consulted.map((name) => (
										<RoleBadge key={name} name={name} type="C" />
									))}
								</div>
							</div>
						)}

						{/* Informed */}
						{assignment.informed.length > 0 && (
							<div>
								<RaciLabel letter="I" label="Informado" />
								<div className="ml-6 flex flex-wrap gap-1">
									{assignment.informed.map((name) => (
										<RoleBadge key={name} name={name} type="I" />
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			))}
		</div>
	);
}

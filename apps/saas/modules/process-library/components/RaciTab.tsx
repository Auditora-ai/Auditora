"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Skeleton } from "@repo/ui/components/skeleton";
import { RefreshCw, Table2, AlertCircle, TrashIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useConfirmationAlert } from "@shared/components/ConfirmationAlertProvider";

interface RaciEntry {
	id: string;
	activityName: string;
	role: string;
	assignment: string;
	source?: string;
}

interface RaciTabProps {
	processId: string;
}

const ASSIGNMENT_COLORS: Record<string, string> = {
	RESPONSIBLE: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
	ACCOUNTABLE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
	CONSULTED: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
	INFORMED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
};

const ASSIGNMENT_LABELS: Record<string, string> = {
	RESPONSIBLE: "R",
	ACCOUNTABLE: "A",
	CONSULTED: "C",
	INFORMED: "I",
};

const ASSIGNMENT_CYCLE = ["RESPONSIBLE", "ACCOUNTABLE", "CONSULTED", "INFORMED", ""] as const;

export function RaciTab({ processId }: RaciTabProps) {
	const [entries, setEntries] = useState<RaciEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [generating, setGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [newActivity, setNewActivity] = useState("");
	const [newRole, setNewRole] = useState("");
	const tc = useTranslations("common");
	const { confirm } = useConfirmationAlert();

	const fetchRaci = async () => {
		setLoading(true);
		try {
			const res = await fetch(`/api/processes/${processId}/raci`);
			const data = await res.json();
			setEntries(data.entries || []);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchRaci();
	}, [processId]);

	const handleGenerate = async () => {
		const hasManual = entries.some((e) => e.source === "manual-edit");
		const doGenerate = async () => {
			setGenerating(true);
			setError(null);
			try {
				const res = await fetch(`/api/processes/${processId}/raci`, {
					method: "POST",
				});
				if (!res.ok) {
					const data = await res.json();
					setError(data.error || "Failed to generate RACI");
					return;
				}
				const data = await res.json();
				setEntries(data.entries || []);
			} catch {
				setError("Network error");
			} finally {
				setGenerating(false);
			}
		};

		if (hasManual) {
			confirm({
				title: "Regenerar RACI",
				message: "Hay entradas editadas manualmente que se perderán al regenerar. ¿Continuar?",
				confirmLabel: "Regenerar",
				destructive: true,
				onConfirm: doGenerate,
			});
		} else {
			await doGenerate();
		}
	};

	// Build matrix data
	const activities = useMemo(
		() => [...new Set(entries.map((e) => e.activityName))],
		[entries],
	);
	const roles = useMemo(
		() => [...new Set(entries.map((e) => e.role))],
		[entries],
	);

	const entryMap = useMemo(() => {
		const map = new Map<string, RaciEntry>();
		for (const e of entries) {
			map.set(`${e.activityName}::${e.role}`, e);
		}
		return map;
	}, [entries]);

	const handleCellClick = async (activityName: string, role: string) => {
		const key = `${activityName}::${role}`;
		const current = entryMap.get(key);
		const currentAssignment = current?.assignment || "";
		const currentIndex = ASSIGNMENT_CYCLE.indexOf(
			currentAssignment as (typeof ASSIGNMENT_CYCLE)[number],
		);
		const nextAssignment = ASSIGNMENT_CYCLE[(currentIndex + 1) % ASSIGNMENT_CYCLE.length];

		// Optimistic update
		if (nextAssignment === "") {
			// Remove entry
			setEntries((prev) =>
				prev.filter((e) => !(e.activityName === activityName && e.role === role)),
			);
			if (current?.id) {
				const res = await fetch(`/api/processes/${processId}/raci`, {
					method: "DELETE",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ entryId: current.id }),
				});
				if (!res.ok) await fetchRaci(); // rollback
			}
		} else {
			// Update or create
			setEntries((prev) => {
				const exists = prev.find(
					(e) => e.activityName === activityName && e.role === role,
				);
				if (exists) {
					return prev.map((e) =>
						e.activityName === activityName && e.role === role
							? { ...e, assignment: nextAssignment, source: "manual-edit" }
							: e,
					);
				}
				return [
					...prev,
					{
						id: `temp-${Date.now()}`,
						activityName,
						role,
						assignment: nextAssignment,
						source: "manual-edit",
					},
				];
			});

			const body = current?.id
				? { entryId: current.id, assignment: nextAssignment }
				: { activityName, role, assignment: nextAssignment };

			const res = await fetch(`/api/processes/${processId}/raci`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body),
			});

			if (res.ok) {
				const data = await res.json();
				// Replace temp entry with real one
				setEntries((prev) =>
					prev.map((e) =>
						e.activityName === activityName && e.role === role
							? data.entry
							: e,
					),
				);
			} else {
				await fetchRaci(); // rollback
			}
		}
	};

	const handleDeleteRow = (activityName: string) => {
		confirm({
			title: "Eliminar actividad",
			message: `Se eliminará "${activityName}" y todas sus asignaciones RACI.`,
			confirmLabel: tc("delete"),
			destructive: true,
			onConfirm: async () => {
				setEntries((prev) => prev.filter((e) => e.activityName !== activityName));
				const res = await fetch(`/api/processes/${processId}/raci`, {
					method: "DELETE",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ activityName }),
				});
				if (!res.ok) await fetchRaci();
			},
		});
	};

	const handleAddRow = async () => {
		const activity = newActivity.trim();
		const role = newRole.trim();
		if (!activity || !role) return;

		const tempEntry: RaciEntry = {
			id: `temp-${Date.now()}`,
			activityName: activity,
			role,
			assignment: "RESPONSIBLE",
			source: "manual-edit",
		};
		setEntries((prev) => [...prev, tempEntry]);
		setNewActivity("");
		setNewRole("");

		const res = await fetch(`/api/processes/${processId}/raci`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				activityName: activity,
				role,
				assignment: "RESPONSIBLE",
			}),
		});

		if (res.ok) {
			const data = await res.json();
			setEntries((prev) =>
				prev.map((e) => (e.id === tempEntry.id ? data.entry : e)),
			);
		} else {
			await fetchRaci();
		}
	};

	if (loading) {
		return (
			<div className="space-y-3">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-48 w-full" />
				<Skeleton className="h-24 w-full" />
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Table2 className="h-5 w-5 text-primary" />
					<h3 className="font-semibold">RACI Matrix</h3>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={handleGenerate}
					loading={generating}
				>
					<RefreshCw className="mr-1.5 h-3.5 w-3.5" />
					{entries.length > 0 ? "Regenerate" : "Generate RACI"}
				</Button>
			</div>

			{error && (
				<div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-destructive">
					<AlertCircle className="h-4 w-4 shrink-0" />
					{error}
				</div>
			)}

			{entries.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
					<Table2 className="mb-3 h-10 w-10 text-muted-foreground" />
					<p className="text-sm font-medium text-chrome-text-secondary">
						No RACI matrix yet
					</p>
					<p className="mt-1 text-xs text-chrome-text-secondary">
						Run a session first, then generate the RACI matrix
					</p>
				</div>
			) : (
				<div className="space-y-3">
					<div className="overflow-x-auto rounded-lg border">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b bg-secondary">
									<th className="px-3 py-2 text-left font-medium">
										Activity
									</th>
									{roles.map((r) => (
										<th
											key={r}
											className="px-3 py-2 text-center font-medium"
										>
											{r}
										</th>
									))}
									<th className="w-10 px-2 py-2" />
								</tr>
							</thead>
							<tbody>
								{activities.map((a) => (
									<tr key={a} className="group border-b last:border-0">
										<td className="px-3 py-2 font-medium">
											{a}
										</td>
										{roles.map((r) => {
											const entry = entryMap.get(`${a}::${r}`);
											const val = entry?.assignment;
											return (
												<td
													key={r}
													className="cursor-pointer px-3 py-2 text-center transition-colors hover:bg-muted"
													onClick={() => handleCellClick(a, r)}
													title="Click para cambiar asignación"
												>
													{val && (
														<span
															className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-xs font-bold sm:h-7 sm:w-7 ${ASSIGNMENT_COLORS[val] || ""}`}
														>
															{ASSIGNMENT_LABELS[val] || val}
														</span>
													)}
												</td>
											);
										})}
										<td className="px-2 py-2 text-center">
											<button
												type="button"
												onClick={() => handleDeleteRow(a)}
												className="rounded p-1 text-chrome-text-secondary opacity-0 transition-all group-hover:opacity-100 hover:bg-red-50 hover:text-destructive"
												title="Eliminar actividad"
											>
												<TrashIcon className="h-3.5 w-3.5" />
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>

						<div className="flex items-center gap-4 border-t bg-secondary px-3 py-2">
							{Object.entries(ASSIGNMENT_LABELS).map(([key, label]) => (
								<div key={key} className="flex items-center gap-1.5 text-xs">
									<span
										className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${ASSIGNMENT_COLORS[key]}`}
									>
										{label}
									</span>
									<span className="text-chrome-text-secondary capitalize">
										{key.toLowerCase()}
									</span>
								</div>
							))}
							<span className="ml-auto text-xs text-chrome-text-secondary">
								Click en celda para editar
							</span>
						</div>
					</div>

					{/* Add row */}
					<div className="flex items-center gap-2">
						<Input
							placeholder="Nueva actividad"
							value={newActivity}
							onChange={(e) => setNewActivity(e.target.value)}
							className="max-w-[200px]"
							onKeyDown={(e) => e.key === "Enter" && handleAddRow()}
						/>
						<Input
							placeholder="Rol"
							value={newRole}
							onChange={(e) => setNewRole(e.target.value)}
							className="max-w-[150px]"
							onKeyDown={(e) => e.key === "Enter" && handleAddRow()}
						/>
						<Button
							variant="outline"
							size="sm"
							onClick={handleAddRow}
							disabled={!newActivity.trim() || !newRole.trim()}
						>
							<PlusIcon className="mr-1 h-3.5 w-3.5" />
							Agregar
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}

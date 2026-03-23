"use client";

import { useState, useEffect } from "react";
import { Button } from "@repo/ui/components/button";
import { Skeleton } from "@repo/ui/components/skeleton";
import { RefreshCw, Table2, AlertCircle } from "lucide-react";

interface RaciEntry {
	id: string;
	activityName: string;
	role: string;
	assignment: string;
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

export function RaciTab({ processId }: RaciTabProps) {
	const [entries, setEntries] = useState<RaciEntry[]>([]);
	const [loading, setLoading] = useState(true);
	const [generating, setGenerating] = useState(false);
	const [error, setError] = useState<string | null>(null);

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

	if (loading) {
		return (
			<div className="space-y-3">
				<Skeleton className="h-10 w-full" />
				<Skeleton className="h-48 w-full" />
				<Skeleton className="h-24 w-full" />
			</div>
		);
	}

	// Build matrix
	const activities = [...new Set(entries.map((e) => e.activityName))];
	const roles = [...new Set(entries.map((e) => e.role))];
	const matrix = new Map<string, string>();
	for (const e of entries) {
		matrix.set(`${e.activityName}::${e.role}`, e.assignment);
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
				<div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
					<AlertCircle className="h-4 w-4 shrink-0" />
					{error}
				</div>
			)}

			{entries.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
					<Table2 className="mb-3 h-10 w-10 text-muted-foreground/50" />
					<p className="text-sm font-medium text-muted-foreground">
						No RACI matrix yet
					</p>
					<p className="mt-1 text-xs text-muted-foreground">
						Run a session first, then generate the RACI matrix
					</p>
				</div>
			) : (
				<div className="overflow-x-auto rounded-lg border">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b bg-muted/50">
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
							</tr>
						</thead>
						<tbody>
							{activities.map((a) => (
								<tr key={a} className="border-b last:border-0">
									<td className="px-3 py-2 font-medium">
										{a}
									</td>
									{roles.map((r) => {
										const val = matrix.get(`${a}::${r}`);
										return (
											<td
												key={r}
												className="px-3 py-2 text-center"
											>
												{val && (
													<span
														className={`inline-flex h-7 w-7 items-center justify-center rounded-md text-xs font-bold ${ASSIGNMENT_COLORS[val] || ""}`}
													>
														{ASSIGNMENT_LABELS[
															val
														] || val}
													</span>
												)}
											</td>
										);
									})}
								</tr>
							))}
						</tbody>
					</table>

					<div className="flex items-center gap-4 border-t bg-muted/30 px-3 py-2">
						{Object.entries(ASSIGNMENT_LABELS).map(([key, label]) => (
							<div key={key} className="flex items-center gap-1.5 text-xs">
								<span
									className={`inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-bold ${ASSIGNMENT_COLORS[key]}`}
								>
									{label}
								</span>
								<span className="text-muted-foreground capitalize">
									{key.toLowerCase()}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

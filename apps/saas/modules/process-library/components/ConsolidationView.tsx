"use client";

import { useState, useEffect } from "react";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";
import { Textarea } from "@repo/ui/components/textarea";
import {
	GitMerge,
	AlertTriangle,
	CheckCircle,
	MessageSquare,
} from "lucide-react";

interface Conflict {
	id: string;
	nodeLabel: string;
	conflictType: string;
	perspectives: Array<{
		sessionId: string;
		stakeholder: string;
		claim: string;
	}>;
	resolved: boolean;
	resolution: string | null;
}

interface ConsolidationViewProps {
	processId: string;
	sessionCount: number;
}

const CONFLICT_TYPE_LABELS: Record<string, string> = {
	sequence_order: "Order Conflict",
	duration: "Duration Conflict",
	naming: "Naming Conflict",
	existence: "Step Existence",
	responsibility: "Responsibility Conflict",
};

const CONFLICT_TYPE_COLORS: Record<string, string> = {
	sequence_order: "warning",
	duration: "info",
	naming: "info",
	existence: "error",
	responsibility: "warning",
};

export function ConsolidationView({
	processId,
	sessionCount,
}: ConsolidationViewProps) {
	const [conflicts, setConflicts] = useState<Conflict[]>([]);
	const [loading, setLoading] = useState(false);
	const [consolidating, setConsolidating] = useState(false);
	const [resolvingId, setResolvingId] = useState<string | null>(null);
	const [resolutionText, setResolutionText] = useState("");

	useEffect(() => {
		// Load existing conflicts on mount
		fetch(`/api/processes/${processId}/consolidate`, { method: "GET" })
			.catch(() => null); // GET might not exist yet, that's ok
	}, [processId]);

	const handleConsolidate = async () => {
		setConsolidating(true);

		try {
			const res = await fetch(
				`/api/processes/${processId}/consolidate`,
				{ method: "POST" },
			);

			if (res.ok) {
				const data = await res.json();
				setConflicts(data.conflicts || []);
			}
		} finally {
			setConsolidating(false);
		}
	};

	const handleResolve = async (conflictId: string) => {
		if (!resolutionText.trim()) return;

		try {
			const res = await fetch(
				`/api/processes/${processId}/consolidate`,
				{
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						conflictId,
						resolution: resolutionText.trim(),
					}),
				},
			);

			if (res.ok) {
				setConflicts((prev) =>
					prev.map((c) =>
						c.id === conflictId
							? {
									...c,
									resolved: true,
									resolution: resolutionText.trim(),
								}
							: c,
					),
				);
				setResolvingId(null);
				setResolutionText("");
			}
		} catch {
			// ignore
		}
	};

	if (sessionCount < 2) {
		return null; // Don't show if less than 2 sessions
	}

	const unresolvedCount = conflicts.filter((c) => !c.resolved).length;

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<GitMerge className="h-5 w-5 text-primary" />
					<h3 className="font-semibold">
						Multi-Stakeholder Consolidation
					</h3>
					{unresolvedCount > 0 && (
						<Badge status="warning">
							{unresolvedCount} unresolved
						</Badge>
					)}
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={handleConsolidate}
					loading={consolidating}
				>
					<GitMerge className="mr-1.5 h-3.5 w-3.5" />
					{conflicts.length > 0 ? "Re-analyze" : "Consolidate"}
				</Button>
			</div>

			{conflicts.length === 0 && !consolidating ? (
				<div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-8 text-center">
					<GitMerge className="mb-3 h-8 w-8 text-muted-foreground/50" />
					<p className="text-sm text-muted-foreground">
						{sessionCount} sessions available for consolidation
					</p>
					<p className="mt-1 text-xs text-muted-foreground">
						Click "Consolidate" to compare stakeholder perspectives
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{conflicts.map((c) => (
						<Card
							key={c.id}
							className={
								c.resolved
									? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20"
									: ""
							}
						>
							<CardContent className="p-4">
								<div className="flex items-start justify-between mb-2">
									<div className="flex items-center gap-2">
										{c.resolved ? (
											<CheckCircle className="h-4 w-4 text-emerald-500" />
										) : (
											<AlertTriangle className="h-4 w-4 text-amber-500" />
										)}
										<span className="font-medium text-sm">
											{c.nodeLabel}
										</span>
									</div>
									<Badge
										status={
											(CONFLICT_TYPE_COLORS[
												c.conflictType
											] as "warning" | "info" | "error") || "info"
										}
									>
										{CONFLICT_TYPE_LABELS[
											c.conflictType
										] || c.conflictType}
									</Badge>
								</div>

								<div className="space-y-2 ml-6">
									{c.perspectives.map((p, i) => (
										<div
											key={i}
											className="flex items-start gap-2 text-xs"
										>
											<MessageSquare className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
											<div>
												<span className="font-medium">
													{p.stakeholder}:
												</span>{" "}
												<span className="text-muted-foreground">
													{p.claim}
												</span>
											</div>
										</div>
									))}
								</div>

								{c.resolved && c.resolution && (
									<div className="mt-3 ml-6 rounded-md bg-emerald-100/50 p-2 text-xs dark:bg-emerald-900/20">
										<span className="font-medium">
											Resolution:
										</span>{" "}
										{c.resolution}
									</div>
								)}

								{!c.resolved && (
									<div className="mt-3 ml-6">
										{resolvingId === c.id ? (
											<div className="space-y-2">
												<Textarea
													value={resolutionText}
													onChange={(e) =>
														setResolutionText(
															e.target.value,
														)
													}
													placeholder="Describe how you resolved this conflict..."
													className="min-h-[60px] text-xs"
												/>
												<div className="flex gap-2">
													<Button
														size="sm"
														onClick={() =>
															handleResolve(c.id)
														}
														disabled={
															!resolutionText.trim()
														}
													>
														Save Resolution
													</Button>
													<Button
														size="sm"
														variant="ghost"
														onClick={() => {
															setResolvingId(
																null,
															);
															setResolutionText(
																"",
															);
														}}
													>
														Cancel
													</Button>
												</div>
											</div>
										) : (
											<Button
												size="sm"
												variant="outline"
												onClick={() =>
													setResolvingId(c.id)
												}
											>
												Resolve
											</Button>
										)}
									</div>
								)}
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	);
}

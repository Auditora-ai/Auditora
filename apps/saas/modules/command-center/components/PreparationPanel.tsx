"use client";

import { useEffect, useState } from "react";
import { CheckCircle2Icon, AlertTriangleIcon, XCircleIcon, Loader2Icon } from "lucide-react";

interface PreparationItem {
	key: string;
	status: "done" | "partial" | "missing";
	label: string;
	detail: string;
	count?: number;
}

interface PreparationBrief {
	items: PreparationItem[];
	completenessScore: number | null;
	raciGapCount: number;
	uncontrolledRiskCount: number;
	intakeProgress: { answered: number; total: number };
}

function StatusIcon({ status }: { status: PreparationItem["status"] }) {
	if (status === "done") return <CheckCircle2Icon className="h-4 w-4 shrink-0 text-[#16A34A]" />;
	if (status === "partial") return <AlertTriangleIcon className="h-4 w-4 shrink-0 text-[#D97706]" />;
	return <XCircleIcon className="h-4 w-4 shrink-0 text-[#DC2626]" />;
}

export function PreparationPanel({
	sessionId,
	processName,
}: {
	sessionId: string;
	processName: string;
}) {
	const [brief, setBrief] = useState<PreparationBrief | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(false);

		fetch(`/api/sessions/${sessionId}/preparation`)
			.then((res) => {
				if (!res.ok) throw new Error("Failed to fetch");
				return res.json();
			})
			.then((data) => {
				if (!cancelled) setBrief(data);
			})
			.catch(() => {
				if (!cancelled) setError(true);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});

		return () => { cancelled = true; };
	}, [sessionId]);

	if (loading) {
		return (
			<div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
				<h3 className="mb-4 text-sm font-semibold text-[#0F172A]">Preparación: {processName}</h3>
				<div className="flex items-center justify-center py-6">
					<Loader2Icon className="h-5 w-5 animate-spin text-[#94A3B8]" />
				</div>
			</div>
		);
	}

	if (error || !brief) {
		return (
			<div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
				<h3 className="mb-2 text-sm font-semibold text-[#0F172A]">Preparación: {processName}</h3>
				<p className="text-xs text-[#DC2626]">Error cargando preparación</p>
			</div>
		);
	}

	const doneCount = brief.items.filter((i) => i.status === "done").length;

	return (
		<div className="rounded-xl border border-[#E2E8F0] bg-white p-5">
			<div className="mb-4 flex items-center justify-between">
				<h3 className="text-sm font-semibold text-[#0F172A]">Preparación</h3>
				<span className="text-xs text-[#94A3B8]">
					{doneCount}/{brief.items.length} listos
				</span>
			</div>

			{/* Progress dots */}
			<div className="mb-4 flex gap-1">
				{brief.items.map((item) => (
					<div
						key={item.key}
						className={`h-1.5 flex-1 rounded-full ${
							item.status === "done"
								? "bg-[#16A34A]"
								: item.status === "partial"
									? "bg-[#D97706]"
									: "bg-[#E2E8F0]"
						}`}
					/>
				))}
			</div>

			<div className="space-y-2">
				{brief.items.map((item) => (
					<div key={item.key} className="flex items-start gap-2.5">
						<StatusIcon status={item.status} />
						<div className="min-w-0">
							<div className="text-xs font-medium text-[#334155]">{item.label}</div>
							<div className="text-[11px] text-[#94A3B8]">{item.detail}</div>
						</div>
					</div>
				))}
			</div>

			{/* Key metrics */}
			{(brief.completenessScore !== null || brief.raciGapCount > 0 || brief.uncontrolledRiskCount > 0) && (
				<div className="mt-4 flex gap-4 border-t border-[#E2E8F0] pt-3">
					{brief.completenessScore !== null && (
						<div>
							<div className="text-sm font-bold text-[#0F172A]">{brief.completenessScore}%</div>
							<div className="text-[9px] text-[#94A3B8]">Completeness</div>
						</div>
					)}
					{brief.raciGapCount > 0 && (
						<div>
							<div className="text-sm font-bold text-[#D97706]">{brief.raciGapCount}</div>
							<div className="text-[9px] text-[#94A3B8]">RACI gaps</div>
						</div>
					)}
					{brief.uncontrolledRiskCount > 0 && (
						<div>
							<div className="text-sm font-bold text-[#DC2626]">{brief.uncontrolledRiskCount}</div>
							<div className="text-[9px] text-[#94A3B8]">Riesgos sin ctrl</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

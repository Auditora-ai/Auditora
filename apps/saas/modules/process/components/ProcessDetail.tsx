"use client";

import { useState, useRef, useEffect } from "react";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui";
import {
	ArrowLeftIcon,
	GaugeIcon,
	UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { FlowTab } from "./FlowTab";
import { ProcedureTab } from "./ProcedureTab";
import { RisksTab } from "./RisksTab";
import { RaciTab } from "./RaciTab";
import { HistoryTab } from "./HistoryTab";
import type { ProcessDetail as ProcessDetailType } from "../data/mock-process";

interface ProcessDetailProps {
	process: ProcessDetailType;
	organizationSlug: string;
}

const STATUS_LABELS: Record<string, string> = {
	DRAFT: "Borrador",
	MAPPED: "Mapeado",
	DOCUMENTED: "Documentado",
	VALIDATED: "Validado",
	APPROVED: "Aprobado",
};

const STATUS_VARIANTS: Record<string, string> = {
	DRAFT: "bg-slate-100 text-slate-600",
	MAPPED: "bg-blue-100 text-blue-700",
	DOCUMENTED: "bg-amber-100 text-amber-700",
	VALIDATED: "bg-green-100 text-green-700",
	APPROVED: "bg-green-100 text-green-800",
};

const TABS = [
	{ id: "flujo", label: "FLUJO" },
	{ id: "procedimiento", label: "PROCEDIMIENTO" },
	{ id: "riesgos", label: "RIESGOS" },
	{ id: "raci", label: "RACI" },
	{ id: "historial", label: "HISTORIAL" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const CAN_EVALUATE_STATUSES = ["DOCUMENTED", "VALIDATED", "APPROVED"];

function getMaturityColor(score: number) {
	if (score >= 80) return "text-green-600";
	if (score >= 50) return "text-amber-600";
	return "text-red-600";
}

export function ProcessDetail({
	process,
	organizationSlug,
}: ProcessDetailProps) {
	const [activeTab, setActiveTab] = useState<TabId>("flujo");
	const tabsRef = useRef<HTMLDivElement>(null);

	// Scroll active tab into view
	useEffect(() => {
		if (!tabsRef.current) return;
		const activeEl = tabsRef.current.querySelector(
			`[data-tab="${activeTab}"]`,
		);
		if (activeEl) {
			activeEl.scrollIntoView({
				behavior: "smooth",
				block: "nearest",
				inline: "center",
			});
		}
	}, [activeTab]);

	const canEvaluate = CAN_EVALUATE_STATUSES.includes(process.status);

	return (
		<div className="min-h-screen bg-slate-50">
			{/* Header */}
			<div className="sticky top-0 z-20 bg-white border-b border-slate-200">
				<div className="px-4 py-3">
					{/* Back + Title */}
					<div className="flex items-center gap-3 mb-2">
						<Link
							href={`/${organizationSlug}`}
							className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
						>
							<ArrowLeftIcon className="h-4 w-4" />
						</Link>
						<div className="min-w-0 flex-1">
							<h1 className="text-base font-bold text-slate-900 truncate">
								{process.name}
							</h1>
						</div>
					</div>

					{/* Status + Maturity */}
					<div className="flex items-center gap-2 ml-11">
						<span
							className={cn(
								"inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
								STATUS_VARIANTS[process.status] ?? STATUS_VARIANTS.DRAFT,
							)}
						>
							{STATUS_LABELS[process.status] ?? process.status}
						</span>
						<div className="flex items-center gap-1">
							<GaugeIcon
								className={cn(
									"h-3.5 w-3.5",
									getMaturityColor(process.maturityScore),
								)}
							/>
							<span
								className={cn(
									"text-xs font-semibold",
									getMaturityColor(process.maturityScore),
								)}
							>
								{process.maturityScore}%
							</span>
							<span className="text-[10px] text-slate-400">madurez</span>
						</div>
					</div>
				</div>

				{/* Tab bar - horizontal scroll */}
				<div
					ref={tabsRef}
					className="flex gap-1.5 overflow-x-auto px-4 pb-3 scrollbar-none"
					style={{ WebkitOverflowScrolling: "touch" }}
				>
					{TABS.map((tab) => (
						<button
							key={tab.id}
							data-tab={tab.id}
							onClick={() => setActiveTab(tab.id)}
							className={cn(
								"shrink-0 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap",
								activeTab === tab.id
									? "bg-action text-white shadow-sm"
									: "bg-slate-100 text-slate-600 hover:bg-slate-200",
							)}
						>
							{tab.label}
						</button>
					))}
				</div>
			</div>

			{/* Tab content */}
			<div className="pb-24">
				{activeTab === "flujo" && <FlowTab steps={process.steps} />}
				{activeTab === "procedimiento" && (
					<ProcedureTab steps={process.steps} />
				)}
				{activeTab === "riesgos" && <RisksTab risks={process.risks} />}
				{activeTab === "raci" && (
					<RaciTab assignments={process.raciAssignments} />
				)}
				{activeTab === "historial" && (
					<HistoryTab history={process.history} />
				)}
			</div>

			{/* Bottom CTA */}
			{canEvaluate && (
				<div className="fixed bottom-0 left-0 right-0 z-20 bg-background border-t border-border p-4 safe-area-inset-bottom">
					<Link href={`/${organizationSlug}/evaluate/${process.id}`}>
						<Button className="w-full h-12 text-sm font-semibold gap-2">
							<UsersIcon className="h-4 w-4" />
							Evaluar equipo
						</Button>
					</Link>
				</div>
			)}
		</div>
	);
}

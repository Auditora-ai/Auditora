"use client";

import { cn } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent } from "@repo/ui/components/card";
import { Progress } from "@repo/ui/components/progress";
import {
	AlertTriangleIcon,
	FileTextIcon,
	PlusIcon,
	SearchIcon,
	ShieldAlertIcon,
} from "lucide-react";
import Link from "next/link";
import type { HomePageProps, ProcessItem } from "../types";

const STATUS_CONFIG = {
	DRAFT: { label: "Borrador", variant: "secondary" as const, color: "text-muted-foreground" },
	CAPTURED: { label: "Capturado", variant: "outline" as const, color: "text-amber-500" },
	DOCUMENTED: { label: "Documentado", variant: "default" as const, color: "text-primary" },
	EVALUATED: { label: "Evaluado", variant: "default" as const, color: "text-emerald-500" },
} as const;

const CATEGORY_LABELS: Record<string, string> = {
	strategic: "Estratégicos",
	operative: "Operativos",
	support: "Soporte",
};

const CATEGORY_ORDER = ["strategic", "operative", "support"] as const;

function ProcessCard({ process, basePath }: { process: ProcessItem; basePath: string }) {
	const config = STATUS_CONFIG[process.status];
	const hasScore = process.alignmentScore !== null;
	const scoreColor =
		hasScore && process.alignmentScore! >= 80
			? "text-emerald-500"
			: hasScore && process.alignmentScore! >= 60
				? "text-amber-500"
				: "text-destructive";

	return (
		<Link href={`${basePath}/process/${process.id}`}>
			<Card className="active:scale-[0.98] transition-transform">
				<CardContent className="p-4">
					<div className="flex items-start justify-between gap-2">
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-foreground truncate">
								{process.name}
							</p>
							<div className="flex items-center gap-2 mt-1.5">
								<Badge variant={config.variant} className="text-[10px] h-5">
									{config.label}
								</Badge>
								{process.riskCount > 0 && (
									<span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
										<ShieldAlertIcon className="size-3" />
										{process.riskCount}
									</span>
								)}
								{process.evalCount > 0 && (
									<span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
										<FileTextIcon className="size-3" />
										{process.evalCount}
									</span>
								)}
							</div>
						</div>
						{hasScore && (
							<div className="text-right shrink-0">
								<span className={cn("text-lg font-bold", scoreColor)}>
									{Math.round(process.alignmentScore!)}
								</span>
								<p className="text-[10px] text-muted-foreground">Score</p>
							</div>
						)}
					</div>
					{hasScore && (
						<Progress
							value={process.alignmentScore!}
							className="mt-2 h-1.5"
						/>
					)}
				</CardContent>
			</Card>
		</Link>
	);
}

function EmptyState({ basePath }: { basePath: string }) {
	return (
		<div className="flex flex-col items-center justify-center px-6 py-16 text-center">
			<div className="flex size-16 items-center justify-center rounded-2xl bg-muted mb-4">
				<SearchIcon className="size-8 text-muted-foreground" />
			</div>
			<h2 className="text-lg font-semibold text-foreground mb-1">
				Tu mapa de procesos está vacío
			</h2>
			<p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
				Empieza por entender tu empresa. La IA te ayudará a mapear tus procesos críticos.
			</p>
			<Button asChild size="lg" className="min-h-[48px]">
				<Link href={`${basePath}/discovery`}>Iniciar Discovery</Link>
			</Button>
		</div>
	);
}

export function HomeMobile(props: HomePageProps) {
	const { processes, basePath, organizationName, maturityScore } = props;

	if (processes.length === 0) {
		return <EmptyState basePath={basePath} />;
	}

	const grouped = CATEGORY_ORDER.map((cat) => ({
		key: cat,
		label: CATEGORY_LABELS[cat],
		items: processes.filter((p) => p.category === cat),
	})).filter((g) => g.items.length > 0);

	const documented = processes.filter((p) => p.status !== "DRAFT").length;
	const evaluated = processes.filter((p) => p.status === "EVALUATED").length;

	return (
		<div className="pb-24 space-y-5">
			{/* Header summary */}
			<div className="px-1">
				<h1 className="text-lg font-bold text-foreground">{organizationName}</h1>
				<p className="text-xs text-muted-foreground mt-0.5">
					{processes.length} procesos · {documented} documentados · {evaluated} evaluados
					{maturityScore > 0 && ` · Madurez ${maturityScore}%`}
				</p>
			</div>

			{/* Process map by category */}
			{grouped.map((group) => (
				<div key={group.key}>
					<h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1 mb-2">
						{group.label}
					</h2>
					<div className="space-y-2">
						{group.items.map((process) => (
							<ProcessCard
								key={process.id}
								process={process}
								basePath={basePath}
							/>
						))}
					</div>
				</div>
			))}

			{/* Top risks summary if any */}
			{props.topRisks.length > 0 && (
				<div>
					<h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1 mb-2">
						Riesgos principales
					</h2>
					<Card>
						<CardContent className="p-3 space-y-2">
							{props.topRisks.slice(0, 3).map((risk) => (
								<div key={risk.id} className="flex items-center gap-2">
									<AlertTriangleIcon
										className={cn(
											"size-4 shrink-0",
											risk.riskScore >= 16
												? "text-destructive"
												: risk.riskScore >= 12
													? "text-amber-500"
													: "text-primary",
										)}
									/>
									<div className="flex-1 min-w-0">
										<p className="text-xs font-medium text-foreground truncate">
											{risk.title}
										</p>
										<p className="text-[10px] text-muted-foreground truncate">
											{risk.processName}
										</p>
									</div>
									<Badge variant="outline" className="text-[10px] shrink-0">
										RPN {risk.riskScore}
									</Badge>
								</div>
							))}
						</CardContent>
					</Card>
				</div>
			)}

			{/* FAB — new process */}
			<Link
				href={`${basePath}/capture/new`}
				className="fixed bottom-20 right-4 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform md:hidden"
				style={{ marginBottom: "var(--safe-area-inset-bottom)" }}
			>
				<PlusIcon className="size-6" />
			</Link>
		</div>
	);
}

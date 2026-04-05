"use client";

import { cn } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
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
	DRAFT: { label: "Borrador", variant: "secondary" as const },
	CAPTURED: { label: "Capturado", variant: "outline" as const },
	DOCUMENTED: { label: "Documentado", variant: "default" as const },
	EVALUATED: { label: "Evaluado", variant: "default" as const },
} as const;

const CATEGORY_LABELS: Record<string, string> = {
	strategic: "Procesos Estratégicos",
	operative: "Procesos Operativos",
	support: "Procesos de Soporte",
};

const CATEGORY_ORDER = ["strategic", "operative", "support"] as const;

function ProcessCardDesktop({ process, basePath }: { process: ProcessItem; basePath: string }) {
	const config = STATUS_CONFIG[process.status];
	const hasScore = process.alignmentScore !== null;
	const scoreColor =
		hasScore && process.alignmentScore! >= 80
			? "text-emerald-500"
			: hasScore && process.alignmentScore! >= 60
				? "text-amber-500"
				: "text-destructive";

	return (
		<Link href={`${basePath}/process/${process.id}`} className="block group">
			<Card className="h-full transition-colors group-hover:border-primary/40">
				<CardContent className="p-5">
					<div className="flex items-start justify-between gap-3 mb-3">
						<h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
							{process.name}
						</h3>
						{hasScore && (
							<span className={cn("text-2xl font-bold shrink-0", scoreColor)}>
								{Math.round(process.alignmentScore!)}
							</span>
						)}
					</div>

					{hasScore && (
						<Progress value={process.alignmentScore!} className="mb-3 h-1.5" />
					)}

					<div className="flex items-center gap-2 flex-wrap">
						<Badge variant={config.variant} className="text-[10px]">
							{config.label}
						</Badge>
						{process.criticalRiskCount > 0 && (
							<Badge variant="destructive" className="text-[10px]">
								<AlertTriangleIcon className="size-3 mr-0.5" />
								{process.criticalRiskCount} críticos
							</Badge>
						)}
						{process.riskCount > 0 && (
							<span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
								<ShieldAlertIcon className="size-3" />
								{process.riskCount} riesgos
							</span>
						)}
						{process.evalCount > 0 && (
							<span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
								<FileTextIcon className="size-3" />
								{process.evalCount} eval
							</span>
						)}
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}

function StatsBar({ processes, maturityScore }: { processes: ProcessItem[]; maturityScore: number }) {
	const total = processes.length;
	const documented = processes.filter((p) => p.status !== "DRAFT").length;
	const evaluated = processes.filter((p) => p.status === "EVALUATED").length;
	const docPercent = total > 0 ? Math.round((documented / total) * 100) : 0;
	const evalPercent = total > 0 ? Math.round((evaluated / total) * 100) : 0;

	const stats = [
		{ label: "Procesos", value: total },
		{ label: "Documentados", value: `${docPercent}%` },
		{ label: "Evaluados", value: `${evalPercent}%` },
		{ label: "Madurez", value: `${maturityScore}%` },
	];

	return (
		<div className="grid grid-cols-4 gap-3">
			{stats.map((stat) => (
				<Card key={stat.label}>
					<CardContent className="p-4 text-center">
						<p className="text-2xl font-bold text-foreground">{stat.value}</p>
						<p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}

function EmptyState({ basePath }: { basePath: string }) {
	return (
		<div className="flex flex-col items-center justify-center px-6 py-24 text-center">
			<div className="flex size-20 items-center justify-center rounded-2xl bg-muted mb-6">
				<SearchIcon className="size-10 text-muted-foreground" />
			</div>
			<h2 className="text-xl font-semibold text-foreground mb-2">
				Tu mapa de procesos está vacío
			</h2>
			<p className="text-sm text-muted-foreground mb-8 max-w-md">
				Empieza por entender tu empresa. La IA actuará como consultor BPM y te ayudará a mapear
				la cadena de valor y los procesos críticos de tu organización.
			</p>
			<Button asChild size="lg">
				<Link href={`${basePath}/discovery`}>Iniciar Discovery Organizacional</Link>
			</Button>
		</div>
	);
}

export function HomeDesktop(props: HomePageProps) {
	const { processes, basePath, organizationName, maturityScore, topRisks } = props;

	if (processes.length === 0) {
		return <EmptyState basePath={basePath} />;
	}

	const grouped = CATEGORY_ORDER.map((cat) => ({
		key: cat,
		label: CATEGORY_LABELS[cat],
		items: processes.filter((p) => p.category === cat),
	})).filter((g) => g.items.length > 0);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-foreground">{organizationName}</h1>
					<p className="text-sm text-muted-foreground mt-0.5">Mapa de procesos</p>
				</div>
				<Button asChild>
					<Link href={`${basePath}/capture/new`}>
						<PlusIcon className="size-4 mr-1.5" />
						Nuevo Proceso
					</Link>
				</Button>
			</div>

			{/* Stats */}
			<StatsBar processes={processes} maturityScore={maturityScore} />

			{/* Process map by category */}
			{grouped.map((group) => (
				<div key={group.key}>
					<h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
						{group.label}
					</h2>
					<div className="grid grid-cols-3 gap-3">
						{group.items.map((process) => (
							<ProcessCardDesktop
								key={process.id}
								process={process}
								basePath={basePath}
							/>
						))}
					</div>
				</div>
			))}

			{/* Top risks sidebar-style summary */}
			{topRisks.length > 0 && (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm">Riesgos Principales</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						{topRisks.slice(0, 5).map((risk) => (
							<div key={risk.id} className="flex items-center gap-3">
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
									<p className="text-sm font-medium text-foreground truncate">
										{risk.title}
									</p>
									<p className="text-xs text-muted-foreground">
										{risk.processName} · RPN {risk.riskScore}
									</p>
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			)}
		</div>
	);
}

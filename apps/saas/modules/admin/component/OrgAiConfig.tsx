"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { orpcClient } from "@shared/lib/orpc-client";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, SaveIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const TIERS = [
	{ value: "budget", label: "Budget (DeepSeek)", description: "Costo bajo, ideal para pruebas y educacion" },
	{ value: "standard", label: "Standard (Sonnet)", description: "Balance costo/calidad para negocios" },
	{ value: "premium", label: "Premium (Opus)", description: "Maximo rendimiento para clientes Pro" },
] as const;

function formatTokens(tokens: number): string {
	if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
	if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
	return String(tokens);
}

export function OrgAiConfig({ organizationId }: { organizationId: string }) {
	const queryClient = useQueryClient();

	const { data: usageData, isLoading: usageLoading } = useQuery(
		orpc.admin.organizations.usage.queryOptions({
			input: { id: organizationId, days: 30 },
		}),
	);

	const [tier, setTier] = useState<string | null>(null);
	const [budget, setBudget] = useState<string>("");
	const [saved, setSaved] = useState(false);

	// Initialize form from data
	const org = usageData?.organization;
	if (org && tier === null) {
		setTier(org.aiTier ?? "standard");
		setBudget(org.aiTokenBudget?.toString() ?? "");
	}

	const saveMutation = useMutation({
		mutationFn: async () => {
			const aiTier = (tier ?? "standard") as "budget" | "standard" | "premium";
			return orpcClient.admin.organizations.updateAiConfig({
				id: organizationId,
				aiTier,
				aiTokenBudget: budget ? Number.parseInt(budget, 10) : null,
			});
		},
		onSuccess: () => {
			setSaved(true);
			setTimeout(() => setSaved(false), 2000);
			queryClient.invalidateQueries({
				queryKey: orpc.admin.organizations.usage.key(),
			});
			queryClient.invalidateQueries({
				queryKey: orpc.admin.overview.key(),
			});
		},
	});

	return (
		<div className="space-y-6">
			{/* Back link */}
			<Link
				href="/admin/overview"
				className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
			>
				<ArrowLeftIcon className="size-3" />
				Volver al overview
			</Link>

			{/* Org header */}
			{org ? (
				<div>
					<h2 className="text-xl font-semibold">{org.name}</h2>
					<p className="text-sm text-slate-500">Configuracion AI y consumo de tokens</p>
				</div>
			) : (
				<Skeleton className="h-8 w-64" />
			)}

			<div className="grid grid-cols-2 gap-6">
				{/* AI Config Form */}
				<Card className="p-6 space-y-4">
					<h3 className="font-medium">Configuracion de Modelo AI</h3>

					<div className="space-y-2">
						<Label>Tier AI</Label>
						<Select
							value={tier ?? "standard"}
							onValueChange={setTier}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{TIERS.map((t) => (
									<SelectItem key={t.value} value={t.value}>
										<div>
											<div className="font-medium">{t.label}</div>
											<div className="text-xs text-slate-400">{t.description}</div>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-2">
						<Label>Budget mensual (tokens)</Label>
						<Input
							type="number"
							placeholder="Sin limite"
							value={budget}
							onChange={(e) => setBudget(e.target.value)}
						/>
						<p className="text-xs text-slate-400">
							Dejar vacio para sin limite. Limite soft: alerta en dashboard, no bloquea.
						</p>
					</div>

					<Button
						onClick={() => saveMutation.mutate()}
						disabled={saveMutation.isPending}
						className="w-full"
					>
						<SaveIcon className="size-4 mr-2" />
						{saved ? "Guardado!" : saveMutation.isPending ? "Guardando..." : "Guardar configuracion"}
					</Button>
				</Card>

				{/* Usage Summary */}
				<Card className="p-6 space-y-4">
					<h3 className="font-medium">Consumo ultimos 30 dias</h3>

					{usageLoading ? (
						<div className="space-y-2">
							{Array.from({ length: 4 }).map((_, i) => (
								<Skeleton key={i} className="h-4 w-full" />
							))}
						</div>
					) : usageData?.totals ? (
						<div className="grid grid-cols-2 gap-4">
							<div>
								<p className="text-2xl font-semibold tabular-nums">
									{formatTokens(usageData.totals.totalTokens)}
								</p>
								<p className="text-sm text-slate-500">Tokens totales</p>
							</div>
							<div>
								<p className="text-2xl font-semibold tabular-nums">
									{usageData.totals.calls}
								</p>
								<p className="text-sm text-slate-500">Llamadas AI</p>
							</div>
							<div>
								<p className="text-2xl font-semibold tabular-nums">
									{formatTokens(usageData.totals.inputTokens)}
								</p>
								<p className="text-sm text-slate-500">Input tokens</p>
							</div>
							<div>
								<p className="text-2xl font-semibold tabular-nums text-red-500">
									{usageData.totals.errors}
								</p>
								<p className="text-sm text-slate-500">Errores</p>
							</div>
						</div>
					) : (
						<p className="text-sm text-slate-400">Sin datos de consumo</p>
					)}
				</Card>
			</div>

			{/* Pipeline Breakdown */}
			{usageData?.byPipeline && usageData.byPipeline.length > 0 && (
				<Card>
					<div className="p-4 border-b">
						<h3 className="font-medium">Consumo por pipeline</h3>
					</div>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Pipeline</TableHead>
								<TableHead className="text-right">Llamadas</TableHead>
								<TableHead className="text-right">Input Tokens</TableHead>
								<TableHead className="text-right">Output Tokens</TableHead>
								<TableHead className="text-right">Total Tokens</TableHead>
								<TableHead className="text-right">Avg Duracion</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{usageData.byPipeline
								.sort((a, b) => b.totalTokens - a.totalTokens)
								.map((p) => (
									<TableRow key={p.pipeline}>
										<TableCell>
											<Badge status="info" className="font-mono text-xs">
												{p.pipeline}
											</Badge>
										</TableCell>
										<TableCell className="text-right tabular-nums">
											{p.calls}
										</TableCell>
										<TableCell className="text-right tabular-nums">
											{formatTokens(p.inputTokens)}
										</TableCell>
										<TableCell className="text-right tabular-nums">
											{formatTokens(p.outputTokens)}
										</TableCell>
										<TableCell className="text-right tabular-nums font-medium">
											{formatTokens(p.totalTokens)}
										</TableCell>
										<TableCell className="text-right tabular-nums">
											{p.avgDurationMs > 0
												? `${(p.avgDurationMs / 1000).toFixed(1)}s`
												: "---"}
										</TableCell>
									</TableRow>
								))}
						</TableBody>
					</Table>
				</Card>
			)}

			{/* Daily Usage Chart (simple bar representation) */}
			{usageData?.byDay && usageData.byDay.length > 0 && (
				<Card className="p-6">
					<h3 className="font-medium mb-4">Consumo diario</h3>
					<div className="flex items-end gap-1 h-32">
						{usageData.byDay.map((day) => {
							const maxTokens = Math.max(
								...usageData.byDay.map((d) => d.totalTokens),
							);
							const height = maxTokens > 0
								? Math.max(4, (day.totalTokens / maxTokens) * 100)
								: 4;

							return (
								<div
									key={day.date}
									className="flex-1 flex flex-col items-center gap-1"
									title={`${day.date}: ${formatTokens(day.totalTokens)} tokens, ${day.calls} calls`}
								>
									<div
										className="w-full bg-blue-500 rounded-t"
										style={{ height: `${height}%` }}
									/>
									{usageData.byDay.length <= 15 && (
										<span className="text-[9px] text-slate-400 tabular-nums">
											{day.date.slice(5)}
										</span>
									)}
								</div>
							);
						})}
					</div>
				</Card>
			)}
		</div>
	);
}

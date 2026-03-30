"use client";

import { Badge } from "@repo/ui/components/badge";
import { Card } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Skeleton } from "@repo/ui/components/skeleton";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@repo/ui/components/table";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
	ActivityIcon,
	BrainIcon,
	Building2Icon,
	SettingsIcon,
	UsersIcon,
	ZapIcon,
} from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { useDebounceValue } from "usehooks-ts";

const TIER_LABELS: Record<string, { label: string; status: "info" | "warning" | "success" }> = {
	budget: { label: "Budget", status: "warning" },
	standard: { label: "Standard", status: "info" },
	premium: { label: "Premium", status: "success" },
};

const BUDGET_STATUS_COLORS: Record<string, string> = {
	ok: "text-emerald-600",
	warning: "text-amber-500",
	exceeded: "text-red-500",
	unlimited: "text-muted-foreground",
};

function formatTokens(tokens: number): string {
	if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
	if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(1)}K`;
	return String(tokens);
}

export function OverviewDashboard() {
	const [query, setQuery] = useQueryState("q", parseAsString.withDefault(""));
	const [debouncedQuery] = useDebounceValue(query, 300);

	const { data, isLoading } = useQuery(
		orpc.admin.overview.queryOptions({
			input: debouncedQuery ? { query: debouncedQuery } : undefined,
		}),
	);

	return (
		<div className="space-y-6">
			{/* Platform Stats */}
			{data?.platform && (
				<div className="grid grid-cols-4 gap-4">
					<Card className="p-4">
						<div className="flex items-center gap-3">
							<Building2Icon className="size-5 text-muted-foreground" />
							<div>
								<p className="text-2xl font-semibold tabular-nums">{data.platform.totalOrgs}</p>
								<p className="text-sm text-muted-foreground">Organizaciones</p>
							</div>
						</div>
					</Card>
					<Card className="p-4">
						<div className="flex items-center gap-3">
							<UsersIcon className="size-5 text-muted-foreground" />
							<div>
								<p className="text-2xl font-semibold tabular-nums">{data.platform.totalMembers}</p>
								<p className="text-sm text-muted-foreground">Usuarios</p>
							</div>
						</div>
					</Card>
					<Card className="p-4">
						<div className="flex items-center gap-3">
							<ActivityIcon className="size-5 text-muted-foreground" />
							<div>
								<p className="text-2xl font-semibold tabular-nums">{data.platform.totalSessions}</p>
								<p className="text-sm text-muted-foreground">Sesiones</p>
							</div>
						</div>
					</Card>
					<Card className="p-4">
						<div className="flex items-center gap-3">
							<BrainIcon className="size-5 text-muted-foreground" />
							<div>
								<p className="text-2xl font-semibold tabular-nums">{formatTokens(data.platform.totalTokens30d)}</p>
								<p className="text-sm text-muted-foreground">Tokens (30d)</p>
							</div>
						</div>
					</Card>
				</div>
			)}

			{/* Search */}
			<Input
				placeholder="Buscar organizaciones..."
				value={query}
				onChange={(e) => setQuery(e.target.value || null)}
				className="max-w-sm"
			/>

			{/* Org Table */}
			<Card>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Organizacion</TableHead>
							<TableHead>Tier AI</TableHead>
							<TableHead className="text-right">Miembros</TableHead>
							<TableHead className="text-right">Sesiones</TableHead>
							<TableHead className="text-right">Créditos</TableHead>
							<TableHead className="text-right">Tokens (30d)</TableHead>
							<TableHead className="text-right">Budget</TableHead>
							<TableHead className="text-right">Llamadas AI</TableHead>
							<TableHead />
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading && (
							<>
								{Array.from({ length: 5 }).map((_, i) => (
									<TableRow key={`skeleton-${i}`}>
										{Array.from({ length: 8 }).map((_, j) => (
											<TableCell key={`cell-${i}-${j}`}>
												<Skeleton className="h-4 w-20" />
											</TableCell>
										))}
									</TableRow>
								))}
							</>
						)}
						{data?.organizations?.map((org) => {
							const tierInfo = TIER_LABELS[org.aiTier] ?? TIER_LABELS.standard!;
							const budgetColor = BUDGET_STATUS_COLORS[org.budgetStatus] ?? "";

							return (
								<TableRow key={org.id}>
									<TableCell className="font-medium">
										<Link
											href={`/admin/organizations/${org.id}`}
											className="hover:underline"
										>
											{org.name}
										</Link>
										{org.slug && (
											<span className="ml-2 text-xs text-muted-foreground">
												/{org.slug}
											</span>
										)}
									</TableCell>
									<TableCell>
										<Badge status={tierInfo.status}>
											{tierInfo.label}
										</Badge>
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{org.membersCount}
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{org.sessionsCount}
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{org.sessionCreditsUsed !== undefined && org.sessionCreditsLimit
											? `${org.sessionCreditsUsed}/${org.sessionCreditsLimit}`
											: org.sessionCreditsUsed !== undefined
												? `${org.sessionCreditsUsed}`
												: "---"}
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{formatTokens(org.tokens30d)}
									</TableCell>
									<TableCell className={`text-right tabular-nums ${budgetColor}`}>
										{org.budgetPct !== null
											? `${org.budgetPct}%`
											: "---"}
									</TableCell>
									<TableCell className="text-right tabular-nums">
										{org.calls30d}
									</TableCell>
									<TableCell className="text-right">
										<Link
											href={`/admin/organizations/${org.id}/ai`}
											className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
										>
											<SettingsIcon className="size-3" />
											AI Config
										</Link>
									</TableCell>
								</TableRow>
							);
						})}
						{data?.organizations?.length === 0 && (
							<TableRow>
								<TableCell colSpan={8} className="text-center text-muted-foreground py-8">
									No se encontraron organizaciones
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</Card>
		</div>
	);
}

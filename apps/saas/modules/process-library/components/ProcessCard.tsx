"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
} from "@repo/ui/components/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import {
	DownloadIcon,
	EyeIcon,
	GitBranchIcon,
	LayersIcon,
	MoreHorizontalIcon,
	ShieldAlertIcon,
	TrashIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

export type ProcessCardData = {
	id: string;
	name: string;
	description?: string | null;
	level: string;
	processStatus: string;
	category?: string | null;
	nodesCount: number;
	versionsCount: number;
	sessionsCount: number;
	hasBpmn: boolean;
	riskCount?: number;
	criticalRiskCount?: number;
};

const statusBadge: Record<string, "info" | "success" | "warning"> = {
	DRAFT: "info",
	MAPPED: "info",
	VALIDATED: "warning",
	APPROVED: "success",
};

export function ProcessCard({
	process,
	basePath,
	onExport,
	onDelete,
}: {
	process: ProcessCardData;
	basePath: string;
	onExport?: (processId: string) => void;
	onDelete?: (processId: string) => void;
}) {
	const t = useTranslations("processLibrary");
	const tc = useTranslations("common");

	return (
		<Card className="transition-colors hover:bg-accent/30">
			<CardContent className="p-4">
				<div className="flex items-start justify-between">
					<div className="min-w-0 flex-1">
						<a
							href={`${basePath}/processes/${process.id}`}
							className="truncate font-semibold text-sm hover:underline"
						>
							{process.name}
						</a>
					</div>
					<div className="flex items-center gap-1.5">
						<Badge status={statusBadge[process.processStatus] ?? "info"}>
							{process.processStatus}
						</Badge>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="ghost" size="sm" className="h-7 w-7 p-0">
									<MoreHorizontalIcon className="size-4" />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem asChild>
									<a href={`${basePath}/processes/${process.id}`}>
										<EyeIcon className="mr-2 size-4" />
										{t("view")}
									</a>
								</DropdownMenuItem>
								{process.hasBpmn && (
									<DropdownMenuItem onClick={() => onExport?.(process.id)}>
										<DownloadIcon className="mr-2 size-4" />
										{t("export")}
									</DropdownMenuItem>
								)}
								{onDelete && (
									<>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											className="text-destructive focus:text-destructive"
											onClick={() => onDelete(process.id)}
										>
											<TrashIcon className="mr-2 size-4" />
											{tc("delete")}
										</DropdownMenuItem>
									</>
								)}
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>

				{process.description && (
					<p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
						{process.description}
					</p>
				)}

				<div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
					{(process.riskCount ?? 0) > 0 && (
						<span className={`flex items-center gap-1 ${
							(process.criticalRiskCount ?? 0) > 0 ? "text-red-400 font-medium" : "text-amber-400"
						}`}>
							<ShieldAlertIcon className="size-3" />
							{process.riskCount} {process.riskCount === 1 ? "riesgo" : "riesgos"}
						</span>
					)}
					<span className="flex items-center gap-1">
						<LayersIcon className="size-3" />
						{t("nodes", { count: process.nodesCount })}
					</span>
					<span className="flex items-center gap-1">
						<GitBranchIcon className="size-3" />
						{t("versions", { count: process.versionsCount })}
					</span>
				</div>
			</CardContent>
		</Card>
	);
}

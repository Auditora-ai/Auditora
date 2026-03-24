"use client";

import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
	Card,
	CardContent,
} from "@repo/ui/components/card";
import {
	DownloadIcon,
	EyeIcon,
	ShareIcon,
	GitBranchIcon,
	LayersIcon,
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

	return (
		<Card className="transition-colors hover:bg-accent/30">
			<CardContent className="p-4">
				<div className="flex items-start justify-between">
					<div className="min-w-0 flex-1">
						<h3 className="truncate font-semibold text-sm">
							{process.name}
						</h3>
					</div>
					<Badge status={statusBadge[process.processStatus] ?? "info"}>
						{process.processStatus}
					</Badge>
				</div>

				{process.description && (
					<p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
						{process.description}
					</p>
				)}

				<div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
					<span className="flex items-center gap-1">
						<LayersIcon className="size-3" />
						{t("nodes", { count: process.nodesCount })}
					</span>
					<span className="flex items-center gap-1">
						<GitBranchIcon className="size-3" />
						{t("versions", { count: process.versionsCount })}
					</span>
				</div>

				<div className="mt-3 flex items-center gap-1">
					<Button
						variant="ghost"
						size="sm"
						className="h-7 text-xs"
						asChild
					>
						<a href={`${basePath}/procesos/${process.id}`}>
							<EyeIcon className="mr-1 size-3" />
							{t("view")}
						</a>
					</Button>
					{process.hasBpmn && (
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-xs"
							onClick={() => onExport?.(process.id)}
						>
							<DownloadIcon className="mr-1 size-3" />
							{t("export")}
						</Button>
					)}
					{onDelete && (
						<Button
							variant="ghost"
							size="sm"
							className="h-7 text-xs text-destructive hover:text-destructive"
							onClick={(e) => {
								e.preventDefault();
								onDelete(process.id);
							}}
						>
							<TrashIcon className="mr-1 size-3" />
							Eliminar
						</Button>
					)}
				</div>
			</CardContent>
		</Card>
	);
}

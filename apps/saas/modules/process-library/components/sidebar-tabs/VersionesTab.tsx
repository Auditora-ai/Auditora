"use client";

import { Badge } from "@repo/ui/components/badge";
import { ClockIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { VersionDiff } from "../VersionDiff";
import type { ProcessVersionEntry } from "../../types";

interface VersionesTabProps {
	processId: string;
	versions?: ProcessVersionEntry[];
}

export function VersionesTab({ processId, versions }: VersionesTabProps) {
	const t = useTranslations("processLibrary.sidebar");
	const tc = useTranslations("common");

	if (!versions || versions.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-8 text-center">
				<ClockIcon className="mb-2 h-6 w-6 text-muted-foreground/40" />
				<p className="text-sm font-medium text-muted-foreground mb-1">
					{t("noVersions")}
				</p>
				<p className="text-xs text-muted-foreground/70 max-w-[220px]">
					Las versiones se crean automáticamente al guardar cambios en el diagrama.
				</p>
			</div>
		);
	}

	return (
		<div className="space-y-3">
			{versions.length >= 2 && (
				<VersionDiff processId={processId} versions={versions} />
			)}

			<div className="space-y-1.5">
				{versions.map((v) => (
					<div
						key={v.version}
						className="flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs"
					>
						<div className="flex items-center gap-2">
							<Badge status="info" className="text-[10px]">v{v.version}</Badge>
							<span className="text-muted-foreground truncate max-w-[160px]">
								{v.changeNote || tc("noNote")}
							</span>
						</div>
						<span className="text-[10px] text-muted-foreground shrink-0">
							{new Date(v.createdAt).toLocaleDateString()}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}

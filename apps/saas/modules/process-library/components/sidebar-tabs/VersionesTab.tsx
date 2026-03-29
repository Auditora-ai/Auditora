"use client";

import { Badge } from "@repo/ui/components/badge";
import { VersionDiff } from "../VersionDiff";
import type { ProcessVersionEntry } from "../../types";

interface VersionesTabProps {
	processId: string;
	versions?: ProcessVersionEntry[];
}

export function VersionesTab({ processId, versions }: VersionesTabProps) {
	if (!versions || versions.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center py-8 text-center">
				<p className="text-xs text-muted-foreground">
					Sin versiones. Las versiones se crean al guardar el diagrama o terminar una sesión.
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
								{v.changeNote || "Sin nota"}
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

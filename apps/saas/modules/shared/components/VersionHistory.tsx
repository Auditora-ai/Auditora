"use client";

import { Button } from "@repo/ui";
import { RotateCcwIcon } from "lucide-react";

type Version = {
	version: number;
	changeNote?: string;
	createdBy: string;
	createdAt: Date;
};

export function VersionHistory({
	versions,
	onRollback,
}: {
	versions: Version[];
	onRollback: (version: number) => void;
}) {
	if (versions.length === 0) {
		return (
			<p className="p-4 text-center text-sm text-muted-foreground">
				No version history.
			</p>
		);
	}

	return (
		<div className="relative ml-4 border-l-2 border-border pl-6">
			{versions.map((version, index) => (
				<div key={version.version} className="relative mb-6 last:mb-0">
					{/* Timeline dot */}
					<div className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-border bg-card">
						<div
							className={`h-2 w-2 rounded-full ${
								index === 0
									? "bg-primary"
									: "bg-muted-foreground"
							}`}
						/>
					</div>

					<div className="flex items-start justify-between">
						<div>
							<div className="flex items-center gap-2">
								<span className="text-sm font-semibold text-foreground">
									v{version.version}
								</span>
								<span className="text-xs text-muted-foreground">
									{new Date(
										version.createdAt,
									).toLocaleDateString()}{" "}
									{new Date(
										version.createdAt,
									).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
									})}
								</span>
							</div>
							{version.changeNote && (
								<p className="mt-1 text-sm text-muted-foreground">
									{version.changeNote}
								</p>
							)}
							<p className="mt-0.5 text-xs text-muted-foreground">
								by {version.createdBy}
							</p>
						</div>

						{index > 0 && (
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onRollback(version.version)}
								className="text-xs"
							>
								<RotateCcwIcon className="mr-1 h-3 w-3" />
								Rollback
							</Button>
						)}
					</div>
				</div>
			))}
		</div>
	);
}

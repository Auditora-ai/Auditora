"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Badge } from "@repo/ui/components/badge";
import { FolderIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";

export type ProjectCardData = {
	id: string;
	name: string;
	status: string;
	sessionsCount: number;
	processesCount: number;
};

export function ProjectsGrid({
	projects,
	basePath,
}: {
	projects: ProjectCardData[];
	basePath: string;
}) {
	const t = useTranslations("dashboard");

	if (projects.length === 0) {
		return (
			<div>
				<h3 className="mb-3 text-sm font-semibold">{t("projects")}</h3>
				<div className="flex items-center gap-3 rounded-md border border-dashed border-border p-6">
					<FolderIcon className="size-5 text-muted-foreground" />
					<p className="text-sm text-muted-foreground">
						{t("emptyProjects")}
					</p>
				</div>
			</div>
		);
	}

	return (
		<div>
			<h3 className="mb-3 text-sm font-semibold">{t("projects")}</h3>
			<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{projects.map((project) => (
					<Card key={project.id} className="transition-colors hover:bg-accent/50">
						<CardContent className="p-4">
							<div className="flex items-start gap-3">
								<FolderIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">
										{project.name}
									</p>
									<div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
										<span>
											{project.processesCount}{" "}
											{project.processesCount === 1
												? "proceso"
												: "procesos"}
										</span>
										<span>
											{project.sessionsCount}{" "}
											{project.sessionsCount === 1
												? "sesión"
												: "sesiones"}
										</span>
									</div>
								</div>
								<Badge
									status={
										project.status === "ACTIVE"
											? "success"
											: "info"
									}
								>
									{project.status}
								</Badge>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}

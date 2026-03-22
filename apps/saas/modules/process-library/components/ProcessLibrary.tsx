"use client";

import { Button } from "@repo/ui/components/button";
import { FileTextIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ProcessCard, type ProcessCardData } from "./ProcessCard";
import { ProcessFilters, type FilterState } from "./ProcessFilters";

export function ProcessLibrary({
	processes,
	projects,
	basePath,
}: {
	processes: ProcessCardData[];
	projects: { id: string; name: string }[];
	basePath: string;
}) {
	const t = useTranslations("processLibrary");
	const [filters, setFilters] = useState<FilterState>({
		search: "",
		status: "all",
		level: "all",
		projectId: "all",
	});

	const filteredProcesses = useMemo(() => {
		return processes.filter((p) => {
			if (
				filters.search &&
				!p.name.toLowerCase().includes(filters.search.toLowerCase())
			) {
				return false;
			}
			if (filters.status !== "all" && p.processStatus !== filters.status) {
				return false;
			}
			if (filters.level !== "all" && p.level !== filters.level) {
				return false;
			}
			if (
				filters.projectId !== "all" &&
				p.projectId !== filters.projectId
			) {
				return false;
			}
			return true;
		});
	}, [processes, filters]);

	if (processes.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
				<FileTextIcon className="mb-4 size-12 text-muted-foreground/50" />
				<h3 className="text-lg font-semibold">
					{t("empty.title")}
				</h3>
				<p className="mt-2 max-w-sm text-sm text-muted-foreground">
					{t("empty.description")}
				</p>
				<Button asChild className="mt-6">
					<Link href={`${basePath}/sessions/new`}>
						<PlusIcon className="mr-2 size-4" />
						{t("empty.cta")}
					</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="space-y-4">
			<ProcessFilters
				filters={filters}
				onFiltersChange={setFilters}
				projects={projects}
			/>

			{filteredProcesses.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
					<p className="text-sm text-muted-foreground">
						{t("empty.title")}
					</p>
				</div>
			) : (
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{filteredProcesses.map((process) => (
						<ProcessCard
							key={process.id}
							process={process}
							basePath={basePath}
						/>
					))}
				</div>
			)}
		</div>
	);
}

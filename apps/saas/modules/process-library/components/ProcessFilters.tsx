"use client";

import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";

export type FilterState = {
	search: string;
	status: string;
	level: string;
	projectId: string;
};

export function ProcessFilters({
	filters,
	onFiltersChange,
	projects,
}: {
	filters: FilterState;
	onFiltersChange: (filters: FilterState) => void;
	projects: { id: string; name: string }[];
}) {
	const t = useTranslations("processLibrary");

	return (
		<div className="flex flex-col gap-3 sm:flex-row">
			<div className="relative flex-1">
				<SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					placeholder={t("search")}
					value={filters.search}
					onChange={(e) =>
						onFiltersChange({
							...filters,
							search: e.target.value,
						})
					}
					className="pl-9"
				/>
			</div>

			<Select
				value={filters.status}
				onValueChange={(value) =>
					onFiltersChange({ ...filters, status: value })
				}
			>
				<SelectTrigger className="w-full sm:w-[160px]">
					<SelectValue placeholder={t("filterByStatus")} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">{t("allStatuses")}</SelectItem>
					<SelectItem value="DRAFT">Draft</SelectItem>
					<SelectItem value="MAPPED">Mapped</SelectItem>
					<SelectItem value="VALIDATED">Validated</SelectItem>
					<SelectItem value="APPROVED">Approved</SelectItem>
				</SelectContent>
			</Select>

			<Select
				value={filters.level}
				onValueChange={(value) =>
					onFiltersChange({ ...filters, level: value })
				}
			>
				<SelectTrigger className="w-full sm:w-[160px]">
					<SelectValue placeholder={t("filterByLevel")} />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="all">{t("allLevels")}</SelectItem>
					<SelectItem value="PROCESS">Process</SelectItem>
					<SelectItem value="SUBPROCESS">Subprocess</SelectItem>
					<SelectItem value="TASK">Task</SelectItem>
				</SelectContent>
			</Select>

			{projects.length > 1 && (
				<Select
					value={filters.projectId}
					onValueChange={(value) =>
						onFiltersChange({ ...filters, projectId: value })
					}
				>
					<SelectTrigger className="w-full sm:w-[180px]">
						<SelectValue placeholder={t("filterByProject")} />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">
							{t("allProjects")}
						</SelectItem>
						{projects.map((project) => (
							<SelectItem key={project.id} value={project.id}>
								{project.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			)}
		</div>
	);
}

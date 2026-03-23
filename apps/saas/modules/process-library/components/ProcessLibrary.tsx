"use client";

import { Button } from "@repo/ui/components/button";
import { FileTextIcon, PlusIcon, SparklesIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState, useCallback } from "react";
import { ProcessCard, type ProcessCardData } from "./ProcessCard";
import { ProcessFilters, type FilterState } from "./ProcessFilters";
import { DiscoveryPanel } from "@discovery/components/DiscoveryPanel";
import { AddProcessModal } from "./AddProcessModal";

const CATEGORY_TABS = [
	{ key: "all", label: "Todos" },
	{ key: "core", label: "Core" },
	{ key: "strategic", label: "Estratégicos" },
	{ key: "support", label: "Soporte" },
] as const;

export function ProcessLibrary({
	processes,
	projects,
	basePath,
	activeProjectId,
	clientName,
}: {
	processes: ProcessCardData[];
	projects: { id: string; name: string }[];
	basePath: string;
	activeProjectId?: string;
	clientName?: string;
}) {
	const t = useTranslations("processLibrary");
	const router = useRouter();
	const [filters, setFilters] = useState<FilterState>({
		search: "",
		status: "all",
		level: "all",
		projectId: "all",
	});
	const [categoryTab, setCategoryTab] = useState<string>("all");
	const [showDiscovery, setShowDiscovery] = useState(false);
	const [showAddModal, setShowAddModal] = useState(false);

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
			if (categoryTab !== "all" && p.category !== categoryTab) {
				return false;
			}
			return true;
		});
	}, [processes, filters, categoryTab]);

	const categoryCounts = useMemo(() => {
		const counts: Record<string, number> = { all: processes.length };
		for (const p of processes) {
			if (p.category) {
				counts[p.category] = (counts[p.category] ?? 0) + 1;
			}
		}
		return counts;
	}, [processes]);

	const handleProcessAccepted = useCallback(() => {
		router.refresh();
	}, [router]);

	return (
		<div className="space-y-4">
			{/* Category tabs */}
			<div className="flex items-center justify-between">
				<div className="flex border-b">
					{CATEGORY_TABS.map((tab) => (
						<button
							key={tab.key}
							type="button"
							onClick={() => setCategoryTab(tab.key)}
							className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
								categoryTab === tab.key
									? "border-primary text-primary"
									: "border-transparent text-muted-foreground hover:text-foreground"
							}`}
						>
							{tab.label}
							{categoryCounts[tab.key] !== undefined && (
								<span className="ml-1.5 text-xs text-muted-foreground">
									({categoryCounts[tab.key]})
								</span>
							)}
						</button>
					))}
				</div>

				<div className="flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowAddModal(true)}
					>
						<PlusIcon className="mr-1.5 size-4" />
						Manual
					</Button>
					{activeProjectId && (
						<Button
							size="sm"
							onClick={() => setShowDiscovery(true)}
						>
							<SparklesIcon className="mr-1.5 size-4" />
							Discovery con IA
						</Button>
					)}
				</div>
			</div>

			<ProcessFilters
				filters={filters}
				onFiltersChange={setFilters}
				projects={projects}
			/>

			{filteredProcesses.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
					<FileTextIcon className="mb-4 size-12 text-muted-foreground/50" />
					<h3 className="text-lg font-semibold">
						{processes.length === 0
							? t("empty.title")
							: "No hay procesos en esta categoría"}
					</h3>
					<p className="mt-2 max-w-sm text-sm text-muted-foreground">
						{processes.length === 0
							? t("empty.description")
							: "Agrega procesos manualmente o usa Discovery con IA"}
					</p>
					<div className="mt-6 flex gap-2">
						<Button
							variant="outline"
							onClick={() => setShowAddModal(true)}
						>
							<PlusIcon className="mr-2 size-4" />
							Agregar manual
						</Button>
						{activeProjectId && (
							<Button
								onClick={() => setShowDiscovery(true)}
							>
								<SparklesIcon className="mr-2 size-4" />
								Discovery con IA
							</Button>
						)}
					</div>
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

					{/* Add process card */}
					<button
						type="button"
						onClick={() => setShowAddModal(true)}
						className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-5 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
					>
						<PlusIcon className="size-7" />
						<span className="text-sm font-medium">
							Agregar Proceso
						</span>
						<span className="text-xs">
							Manual o con Discovery IA
						</span>
					</button>
				</div>
			)}

			{/* Discovery panel */}
			{showDiscovery && activeProjectId && (
				<DiscoveryPanel
					projectId={activeProjectId}
					clientName={clientName}
					onClose={() => setShowDiscovery(false)}
					onProcessAccepted={handleProcessAccepted}
				/>
			)}

			{/* Add process modal */}
			{showAddModal && activeProjectId && (
				<AddProcessModal
					projectId={activeProjectId}
					onClose={() => setShowAddModal(false)}
					onCreated={handleProcessAccepted}
				/>
			)}
		</div>
	);
}

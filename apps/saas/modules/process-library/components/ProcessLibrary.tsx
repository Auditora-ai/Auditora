"use client";

import { Button } from "@repo/ui/components/button";
import Link from "next/link";
import { FileTextIcon, PlusIcon, MessageSquareIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState, useCallback } from "react";
import { useConfirmationAlert } from "@shared/components/ConfirmationAlertProvider";
import { ProcessCard, type ProcessCardData } from "./ProcessCard";
import { ProcessFilters, type FilterState } from "./ProcessFilters";
import { AddProcessModal } from "./AddProcessModal";
import { ImportBpmnDialog } from "./ImportBpmnDialog";
import { TemplatePicker } from "./TemplatePicker";
import { ExportReportButton } from "./ExportReportButton";
import { Upload, Layers } from "lucide-react";

const CATEGORY_TABS = [
	{ key: "all", label: "Todos" },
	{ key: "core", label: "Core" },
	{ key: "strategic", label: "Estratégicos" },
	{ key: "support", label: "Soporte" },
] as const;

export function ProcessLibrary({
	processes,
	basePath,
	organizationId,
}: {
	processes: ProcessCardData[];
	basePath: string;
	organizationId: string;
}) {
	const t = useTranslations("processLibrary");
	const tc = useTranslations("common");
	const td = useTranslations("processDetail");
	const router = useRouter();
	const { confirm } = useConfirmationAlert();
	const [filters, setFilters] = useState<FilterState>({
		search: "",
		status: "all",
		level: "all",
	});
	const [categoryTab, setCategoryTab] = useState<string>("all");
	const [showAddModal, setShowAddModal] = useState(false);
	const [showImport, setShowImport] = useState(false);
	const [showTemplates, setShowTemplates] = useState(false);

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

	const handleDeleteProcess = useCallback(
		(processId: string) => {
			const process = processes.find((p) => p.id === processId);
			confirm({
				title: td("deleteConfirm"),
				message: td("deleteMessage"),
				confirmLabel: tc("delete"),
				destructive: true,
				onConfirm: async () => {
					const { orpcClient } = await import(
						"@shared/lib/orpc-client"
					);
					await orpcClient.processes.delete({ processId });
					router.refresh();
				},
			});
		},
		[processes, confirm, router],
	);

	return (
		<div className="space-y-4">
			{/* Category tabs + action buttons */}
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				{/* Horizontally scrollable category tabs */}
				<div className="flex overflow-x-auto no-scrollbar border-b -mx-1 px-1">
					{CATEGORY_TABS.map((tab) => (
						<button
							key={tab.key}
							type="button"
							onClick={() => setCategoryTab(tab.key)}
							className={`border-b-2 px-3 md:px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap min-h-[44px] ${
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

				{/* Action buttons — horizontal scroll on mobile */}
				<div className="flex gap-2 overflow-x-auto no-scrollbar shrink-0">
					<ExportReportButton />
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowImport(true)}
						className="shrink-0 min-h-[40px]"
					>
						<Upload className="mr-1.5 size-4" />
						Importar
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowTemplates(true)}
						className="shrink-0 min-h-[40px]"
					>
						<Layers className="mr-1.5 size-4" />
						Templates
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={() => setShowAddModal(true)}
						className="shrink-0 min-h-[40px]"
					>
						<PlusIcon className="mr-1.5 size-4" />
						Manual
					</Button>
				</div>
			</div>

			<ProcessFilters
				filters={filters}
				onFiltersChange={setFilters}
			/>

			{filteredProcesses.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 md:p-12 text-center">
					<FileTextIcon className="mb-4 size-10 md:size-12 text-muted-foreground/50" />
					<h3 className="text-base md:text-lg font-semibold">
						{processes.length === 0
							? t("empty.title")
							: td("noCategoryFilter")}
					</h3>
					<p className="mt-2 max-w-sm text-sm text-muted-foreground">
						{processes.length === 0
							? t("empty.description")
							: td("noCategoryFilterDesc")}
					</p>
					<div className="mt-6 flex flex-col sm:flex-row gap-2">
						{processes.length === 0 && (
							<Button asChild className="min-h-[44px]">
								<Link href={`${basePath}/descubrir/new`}>
									<MessageSquareIcon className="mr-2 size-4" />
									{t("empty.ctaInterview")}
								</Link>
							</Button>
						)}
						<Button
							variant="outline"
							onClick={() => setShowAddModal(true)}
							className="min-h-[44px]"
						>
							<PlusIcon className="mr-2 size-4" />
							{t("empty.ctaManual")}
						</Button>
					</div>
				</div>
			) : (
				<div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
					{filteredProcesses.map((process) => (
						<ProcessCard
							key={process.id}
							process={process}
							basePath={basePath}
							onDelete={handleDeleteProcess}
						/>
					))}

					{/* Add process card */}
					<button
						type="button"
						onClick={() => setShowAddModal(true)}
						className="flex min-h-[140px] md:min-h-[160px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-5 text-muted-foreground transition-colors hover:border-primary hover:text-primary active:bg-accent/30"
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

			{/* Add process modal */}
			<AddProcessModal
				organizationId={organizationId}
				open={showAddModal}
				onOpenChange={setShowAddModal}
				onCreated={handleProcessAccepted}
			/>

			{/* Import BPMN dialog */}
			<ImportBpmnDialog
				open={showImport}
				onOpenChange={setShowImport}
				architectureId={organizationId}
				onImported={handleProcessAccepted}
			/>

			{/* Template picker */}
			<TemplatePicker
				open={showTemplates}
				onOpenChange={setShowTemplates}
				onApplied={handleProcessAccepted}
			/>
		</div>
	);
}

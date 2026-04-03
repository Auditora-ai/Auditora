"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@repo/ui/components/tabs";
import {
	ArrowLeftIcon,
	DownloadIcon,
	MonitorIcon,
	PlusIcon,
	PlayIcon,
	XIcon,
	LayoutDashboardIcon,
	FileTextIcon,
	Table2Icon,
	ShieldAlertIcon,
	BarChart3Icon,
	VideoIcon,
} from "lucide-react";
import { ProcessWorkspaceProvider } from "../context/ProcessWorkspaceContext";
import { CollaborationProvider } from "@collaboration/components/CollaborationProvider";
import { ResumenTab } from "./sidebar-tabs/ResumenTab";
import { ContextoTab } from "./sidebar-tabs/ContextoTab";
import { SidebarRaciTab } from "./sidebar-tabs/SidebarRaciTab";
import { SidebarRiskTab } from "./sidebar-tabs/SidebarRiskTab";
import { EvalFeedbackTab } from "./sidebar-tabs/EvalFeedbackTab";
import { SessionesTab } from "./sidebar-tabs/SessionesTab";
import { GenerateEvaluationDialog } from "./GenerateEvaluationDialog";
import { STATUS_MAP } from "../types";
import type { ProcessData } from "../types";

interface ProcessWorkspaceMobileProps {
	process: ProcessData;
	organizationSlug: string;
	basePath: string;
}

export function ProcessWorkspaceMobile(props: ProcessWorkspaceMobileProps) {
	return (
		<ProcessWorkspaceProvider>
			<CollaborationProvider processId={props.process.id}>
				<MobileWorkspaceInner {...props} />
			</CollaborationProvider>
		</ProcessWorkspaceProvider>
	);
}

function MobileWorkspaceInner({
	process: initialProcess,
	organizationSlug,
	basePath,
}: ProcessWorkspaceMobileProps) {
	const [process, setProcess] = useState(initialProcess);
	const [fabOpen, setFabOpen] = useState(false);
	const [downloading, setDownloading] = useState(false);

	const processesPath = `${basePath}/processes`;

	const handleProcessUpdate = (updated: Partial<ProcessData>) => {
		setProcess((prev) => ({ ...prev, ...updated }));
	};

	const statusVariant = STATUS_MAP[process.processStatus] ?? "info";
	const statusColors: Record<string, string> = {
		success: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30",
		info: "bg-sky-600/20 text-sky-400 border-sky-500/30",
		warning: "bg-amber-600/20 text-amber-400 border-amber-500/30",
		error: "bg-red-600/20 text-red-400 border-red-500/30",
	};

	const handleDownloadPng = async () => {
		setDownloading(true);
		try {
			const res = await fetch(`/api/processes/${process.id}/export-png`, {
				method: "POST",
			});
			if (res.ok) {
				const blob = await res.blob();
				const url = URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `${process.name.replace(/\s+/g, "_")}.png`;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				setTimeout(() => URL.revokeObjectURL(url), 5000);
			}
		} catch {
			// Silently fail — user can try again
		} finally {
			setDownloading(false);
		}
	};

	return (
		<div className="flex min-h-screen flex-col bg-slate-950 text-slate-50">
			{/* ── Header ── */}
			<header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-800 bg-slate-950/95 backdrop-blur px-4 py-3">
				<Link href={processesPath}>
					<Button
						variant="ghost"
						size="icon"
						className="h-9 w-9 shrink-0 text-slate-400 hover:text-slate-50"
					>
						<ArrowLeftIcon className="h-5 w-5" />
					</Button>
				</Link>
				<div className="min-w-0 flex-1">
					<h1 className="truncate text-base font-semibold text-slate-50">
						{process.name}
					</h1>
					{process.category && (
						<span className="text-xs text-slate-400">{process.category}</span>
					)}
				</div>
				<Badge
					className={`shrink-0 border text-[10px] font-medium uppercase ${statusColors[statusVariant]}`}
				>
					{process.processStatus}
				</Badge>
			</header>

			{/* ── Scrollable content ── */}
			<main className="flex-1 overflow-y-auto pb-24">
				{/* ── Diagram Preview Card ── */}
				<section className="mx-4 mt-4">
					<div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
						{process.bpmnXml ? (
							<div className="flex h-48 items-center justify-center bg-slate-900/50 p-4">
								<div className="text-center">
									<div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-sky-600/15">
										<MonitorIcon className="h-7 w-7 text-sky-400" />
									</div>
									<p className="text-sm font-medium text-slate-200">
										Diagrama BPMN
									</p>
									<p className="mt-1 text-xs text-slate-400">
										Abre en escritorio para editar
									</p>
								</div>
							</div>
						) : (
							<div className="flex h-48 items-center justify-center p-4">
								<div className="text-center">
									<div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-slate-800">
										<MonitorIcon className="h-7 w-7 text-slate-500" />
									</div>
									<p className="text-sm font-medium text-slate-400">
										No hay diagrama aún
									</p>
									<p className="mt-1 text-xs text-slate-500">
										Crea una sesión para generar el diagrama
									</p>
								</div>
							</div>
						)}

						{/* Action buttons */}
						<div className="flex gap-2 border-t border-slate-800 p-3">
							{process.bpmnXml && (
								<>
									<Button
										variant="outline"
										size="sm"
										className="flex-1 border-slate-700 bg-slate-800/50 text-slate-200 hover:bg-slate-800 hover:text-slate-50"
										onClick={() =>
											window.open(
												`${processesPath}/${process.id}?view=diagram`,
												"_blank",
											)
										}
									>
										<MonitorIcon className="mr-1.5 h-3.5 w-3.5" />
										Ver diagrama
									</Button>
									<Button
										variant="outline"
										size="sm"
										className="flex-1 border-slate-700 bg-slate-800/50 text-slate-200 hover:bg-slate-800 hover:text-slate-50"
										onClick={handleDownloadPng}
										disabled={downloading}
									>
										<DownloadIcon className="mr-1.5 h-3.5 w-3.5" />
										{downloading ? "Descargando…" : "Descargar PNG"}
									</Button>
								</>
							)}
							{!process.bpmnXml && (
								<Button
									size="sm"
									className="flex-1"
									asChild
								>
									<Link
										href={`/${organizationSlug}/sessions/new?processId=${process.id}&type=DEEP_DIVE`}
									>
										<PlayIcon className="mr-1.5 h-3.5 w-3.5" />
										Iniciar sesión
									</Link>
								</Button>
							)}
						</div>
					</div>
				</section>

				{/* ── Tab sections ── */}
				<section className="mx-4 mt-4">
					<Tabs defaultValue="resumen" className="w-full">
						<TabsList className="w-full overflow-x-auto border border-slate-800 bg-slate-900 p-1">
							<TabsTrigger
								value="resumen"
								className="flex items-center gap-1 text-xs data-[state=active]:bg-slate-800 data-[state=active]:text-slate-50"
							>
								<LayoutDashboardIcon className="h-3 w-3" />
								Resumen
							</TabsTrigger>
							<TabsTrigger
								value="contexto"
								className="flex items-center gap-1 text-xs data-[state=active]:bg-slate-800 data-[state=active]:text-slate-50"
							>
								<FileTextIcon className="h-3 w-3" />
								Contexto
							</TabsTrigger>
							<TabsTrigger
								value="raci"
								className="flex items-center gap-1 text-xs data-[state=active]:bg-slate-800 data-[state=active]:text-slate-50"
							>
								<Table2Icon className="h-3 w-3" />
								RACI
							</TabsTrigger>
							<TabsTrigger
								value="riesgos"
								className="flex items-center gap-1 text-xs data-[state=active]:bg-slate-800 data-[state=active]:text-slate-50"
							>
								<ShieldAlertIcon className="h-3 w-3" />
								Riesgos
							</TabsTrigger>
							<TabsTrigger
								value="evaluacion"
								className="flex items-center gap-1 text-xs data-[state=active]:bg-slate-800 data-[state=active]:text-slate-50"
							>
								<BarChart3Icon className="h-3 w-3" />
								Evaluación
							</TabsTrigger>
							<TabsTrigger
								value="sesiones"
								className="flex items-center gap-1 text-xs data-[state=active]:bg-slate-800 data-[state=active]:text-slate-50"
							>
								<VideoIcon className="h-3 w-3" />
								Sesiones
							</TabsTrigger>
						</TabsList>

						<div className="mt-3 rounded-xl border border-slate-800 bg-slate-900 p-3">
							<TabsContent value="resumen" className="mt-0">
								<ResumenTab process={process} />
							</TabsContent>

							<TabsContent value="contexto" className="mt-0">
								<ContextoTab
									process={process}
									organizationSlug={organizationSlug}
									processesPath={processesPath}
									onUpdate={handleProcessUpdate}
								/>
							</TabsContent>

							<TabsContent value="raci" className="mt-0">
								<SidebarRaciTab processId={process.id} />
							</TabsContent>

							<TabsContent value="riesgos" className="mt-0">
								<SidebarRiskTab processId={process.id} />
							</TabsContent>

							<TabsContent value="evaluacion" className="mt-0">
								<EvalFeedbackTab evalFeedback={process.evalFeedback} />
							</TabsContent>

							<TabsContent value="sesiones" className="mt-0">
								<SessionesTab
									sessions={process.sessions}
									organizationSlug={organizationSlug}
									processId={process.id}
								/>
							</TabsContent>
						</div>
					</Tabs>
				</section>
			</main>

			{/* ── Floating Action Button ── */}
			<div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
				{/* FAB options (shown when open) */}
				{fabOpen && (
					<div className="mb-2 flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
						{/* Start Interview */}
						<Link
							href={`/${organizationSlug}/sessions/new?processId=${process.id}&type=DEEP_DIVE`}
							className="flex items-center gap-2"
							onClick={() => setFabOpen(false)}
						>
							<span className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-lg border border-slate-700">
								Iniciar entrevista
							</span>
							<div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-600 shadow-lg shadow-sky-600/25">
								<PlayIcon className="h-4 w-4 text-white" />
							</div>
						</Link>

						{/* Generate Evaluation */}
						{(process.risksCount ?? 0) > 0 && (
							<div className="flex items-center gap-2">
								<span className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 shadow-lg border border-slate-700">
									Generar evaluación
								</span>
								<GenerateEvaluationDialog
									processId={process.id}
									processName={process.name}
									organizationSlug={organizationSlug}
								/>
							</div>
						)}
					</div>
				)}

				{/* Main FAB toggle */}
				<button
					type="button"
					onClick={() => setFabOpen((prev) => !prev)}
					className={`flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-200 ${
						fabOpen
							? "bg-slate-700 rotate-45 shadow-slate-700/25"
							: "bg-sky-600 shadow-sky-600/30"
					}`}
				>
					{fabOpen ? (
						<XIcon className="h-6 w-6 text-white" />
					) : (
						<PlusIcon className="h-6 w-6 text-white" />
					)}
				</button>
			</div>

			{/* Backdrop when FAB is open */}
			{fabOpen && (
				<div
					className="fixed inset-0 z-30 bg-black/40"
					onClick={() => setFabOpen(false)}
					onKeyDown={(e) => e.key === "Escape" && setFabOpen(false)}
					role="button"
					tabIndex={0}
					aria-label="Close menu"
				/>
			)}
		</div>
	);
}

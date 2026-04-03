"use client";

import { useState } from "react";
import {
	LayoutDashboardIcon,
	FileTextIcon,
	Table2Icon,
	ShieldAlertIcon,
	ClockIcon,
	VideoIcon,
	BarChart3Icon,
	ActivityIcon,
	ClipboardListIcon,
} from "lucide-react";
import { useProcessWorkspace } from "../../context/ProcessWorkspaceContext";
import { NodeContextPanel } from "./NodeContextPanel";
import { ResumenTab } from "../sidebar-tabs/ResumenTab";
import { ContextoTab } from "../sidebar-tabs/ContextoTab";
import { SidebarRaciTab } from "../sidebar-tabs/SidebarRaciTab";
import { SidebarRiskTab } from "../sidebar-tabs/SidebarRiskTab";
import { EvalFeedbackTab } from "../sidebar-tabs/EvalFeedbackTab";
import { VersionesTab } from "../sidebar-tabs/VersionesTab";
import { SessionesTab } from "../sidebar-tabs/SessionesTab";
import { SidebarProceduresTab } from "../sidebar-tabs/SidebarProceduresTab";
import { ActivityTimeline } from "@collaboration/components/ActivityTimeline";
import type { ProcessData } from "../../types";

const TABS = [
	{ key: "resumen", label: "Resumen", icon: LayoutDashboardIcon },
	{ key: "contexto", label: "Contexto", icon: FileTextIcon },
	{ key: "procedimientos", label: "SOPs", icon: ClipboardListIcon },
	{ key: "raci", label: "RACI", icon: Table2Icon },
	{ key: "riesgos", label: "Riesgos", icon: ShieldAlertIcon },
	{ key: "evalFeedback", label: "Eval", icon: BarChart3Icon },
	{ key: "versiones", label: "Versiones", icon: ClockIcon },
	{ key: "sesiones", label: "Sesiones", icon: VideoIcon },
	{ key: "actividad", label: "Actividad", icon: ActivityIcon },
] as const;

type TabKey = (typeof TABS)[number]["key"];

interface ContextSidebarProps {
	process: ProcessData;
	organizationSlug: string;
	processesPath: string;
	onUpdate: (data: Partial<ProcessData>) => void;
}

export function ContextSidebar({ process, organizationSlug, processesPath, onUpdate }: ContextSidebarProps) {
	const { selectedElement } = useProcessWorkspace();
	const [activeTab, setActiveTab] = useState<TabKey>("resumen");

	if (selectedElement) {
		return (
			<NodeContextPanel
				element={selectedElement}
				processId={process.id}
				raciEntries={process.raciEntries}
				evalFeedback={process.evalFeedback}
			/>
		);
	}

	return (
		<div className="flex h-full flex-col">
			{/* Tab bar — horizontally scrollable */}
			<div className="shrink-0 overflow-x-auto border-b border-border">
				<div className="flex min-w-max">
					{TABS.map((tab) => {
						const Icon = tab.icon;
						const isActive = activeTab === tab.key;
						return (
							<button
								key={tab.key}
								type="button"
								onClick={() => setActiveTab(tab.key)}
								className={`flex items-center gap-1 whitespace-nowrap border-b-2 px-2.5 py-2 text-xs font-medium transition-colors ${
									isActive
										? "border-primary text-primary"
										: "border-transparent text-muted-foreground hover:text-foreground"
								}`}
							>
								<Icon className="h-3.5 w-3.5" />
								{tab.label}
							</button>
						);
					})}
				</div>
			</div>

			{/* Tab content — scrollable */}
			<div className="flex-1 overflow-y-auto p-3">
				{activeTab === "resumen" && <ResumenTab process={process} />}
				{activeTab === "contexto" && (
					<ContextoTab
						process={process}
						organizationSlug={organizationSlug}
						processesPath={processesPath}
						onUpdate={onUpdate}
					/>
				)}
				{activeTab === "procedimientos" && (
					<SidebarProceduresTab
						processId={process.id}
						processName={process.name}
						organizationSlug={organizationSlug}
					/>
				)}
				{activeTab === "raci" && <SidebarRaciTab processId={process.id} />}
				{activeTab === "riesgos" && <SidebarRiskTab processId={process.id} />}
				{activeTab === "evalFeedback" && <EvalFeedbackTab evalFeedback={process.evalFeedback} />}
				{activeTab === "versiones" && <VersionesTab processId={process.id} versions={process.versions} />}
				{activeTab === "sesiones" && (
					<SessionesTab
						sessions={process.sessions}
						organizationSlug={organizationSlug}
						processId={process.id}
					/>
				)}
				{activeTab === "actividad" && <ActivityTimeline processId={process.id} />}
			</div>
		</div>
	);
}

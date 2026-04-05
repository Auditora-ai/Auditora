"use client";

import { useState } from "react";
import { ProcessWorkspaceProvider, useProcessWorkspace } from "../context/ProcessWorkspaceContext";
import { WorkspaceHeader } from "./workspace/WorkspaceHeader";
import { DiagramCanvas } from "./workspace/DiagramCanvas";
import { ContextSidebar } from "./workspace/ContextSidebar";
import { CollaborationProvider } from "@collaboration/components/CollaborationProvider";
import { useIsMobile } from "@shared/hooks/use-media-query";
import { ProcessWorkspaceMobile } from "./ProcessWorkspaceMobile";
import type { ProcessData } from "../types";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "@repo/process-engine/styles/bpmn-editor.css";

interface ProcessWorkspaceProps {
	process: ProcessData;
	organizationSlug: string;
	basePath: string;
}

export function ProcessWorkspace(props: ProcessWorkspaceProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return <ProcessWorkspaceMobile {...props} />;
	}

	return (
		<ProcessWorkspaceProvider>
			<CollaborationProvider processId={props.process.id}>
				<WorkspaceInner {...props} />
			</CollaborationProvider>
		</ProcessWorkspaceProvider>
	);
}

function WorkspaceInner({ process: initialProcess, organizationSlug, basePath }: ProcessWorkspaceProps) {
	const [process, setProcess] = useState(initialProcess);
	const { sidebarCollapsed } = useProcessWorkspace();

	const processesPath = `${basePath}/`;

	const handleProcessUpdate = (updated: Partial<ProcessData>) => {
		setProcess((prev) => ({ ...prev, ...updated }));
	};

	return (
		<div className="flex h-[calc(100vh-64px)] flex-col">
			<WorkspaceHeader
				process={process}
				organizationSlug={organizationSlug}
				processesPath={processesPath}
				onUpdate={handleProcessUpdate}
			/>

			<div className="flex flex-1 overflow-hidden">
				{/* Diagram Canvas — main area */}
				<div className={`flex-1 overflow-hidden transition-all ${sidebarCollapsed ? "" : "mr-0"}`}>
				<DiagramCanvas
					processId={process.id}
					bpmnXml={process.bpmnXml}
					raciEntries={process.raciEntries}
					evalFeedback={process.evalFeedback}
				/>
				</div>

				{/* Context Sidebar */}
				<div
					className={`flex flex-col border-l border-border bg-background transition-all duration-200 ${
						sidebarCollapsed ? "w-0 overflow-hidden" : "w-[380px] min-w-[320px]"
					}`}
				>
					{!sidebarCollapsed && (
						<ContextSidebar
							process={process}
							organizationSlug={organizationSlug}
							processesPath={processesPath}
							onUpdate={handleProcessUpdate}
						/>
					)}
				</div>
			</div>
		</div>
	);
}

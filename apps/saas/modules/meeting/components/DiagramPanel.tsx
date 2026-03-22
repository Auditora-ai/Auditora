"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@repo/ui";

interface DiagramNode {
	id: string;
	type: "startEvent" | "endEvent" | "task" | "exclusiveGateway" | "parallelGateway";
	label: string;
	state: "forming" | "confirmed" | "rejected";
	lane?: string;
	connections: string[];
}

interface DiagramPanelProps {
	nodes: DiagramNode[];
	onConfirmNode: (nodeId: string) => void;
	onRejectNode: (nodeId: string) => void;
	sessionType: "DISCOVERY" | "DEEP_DIVE";
}

export function DiagramPanel({
	nodes,
	onConfirmNode,
	onRejectNode,
	sessionType,
}: DiagramPanelProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const [bpmnModeler, setBpmnModeler] = useState<any>(null);

	// Initialize bpmn-js Modeler
	useEffect(() => {
		let modeler: any;

		async function initModeler() {
			const BpmnModeler = (await import("bpmn-js/lib/Modeler")).default;

			if (!containerRef.current) return;

			modeler = new BpmnModeler({
				container: containerRef.current,
			});

			const emptyDiagram = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  id="Definitions_1"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

			try {
				await modeler.importXML(emptyDiagram);
				setBpmnModeler(modeler);
			} catch (err) {
				console.error("Failed to init BPMN modeler:", err);
			}
		}

		initModeler();

		return () => {
			modeler?.destroy();
		};
	}, []);

	return (
		<div className="flex h-full flex-col">
			{/* Panel header */}
			<div className="flex items-center justify-between border-b border-border px-3 py-2.5">
				<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
					{sessionType === "DISCOVERY"
						? "Process Architecture"
						: "Live Process Diagram"}
				</span>
				{nodes.length > 0 && (
					<span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
						{nodes.filter((n) => n.state === "confirmed").length}{" "}
						confirmed
					</span>
				)}
			</div>

			{/* BPMN Canvas */}
			<div className="relative flex-1">
				<div ref={containerRef} className="h-full w-full bg-card" />

				{/* Empty state overlay */}
				{nodes.length === 0 && (
					<div className="absolute inset-0 flex items-center justify-center bg-card">
						<div className="text-center">
							<p className="text-lg text-muted-foreground">
								{sessionType === "DISCOVERY"
									? "Describe your business to begin mapping"
									: "Describe the process to begin diagramming"}
							</p>
							<p className="mt-2 text-sm text-muted-foreground/60">
								Nodes will appear as process steps are discussed
							</p>
						</div>
					</div>
				)}

				{/* Node action overlay */}
				{nodes
					.filter((n) => n.state === "forming")
					.map((node) => (
						<div
							key={node.id}
							className="absolute flex gap-1"
							style={{ top: "50%", left: "50%" }}
						>
							<Button
								size="sm"
								variant="default"
								onClick={() => onConfirmNode(node.id)}
								className="h-6 bg-success px-2 text-[10px] text-success-foreground hover:bg-success/90"
							>
								Confirm
							</Button>
							<Button
								size="sm"
								variant="destructive"
								onClick={() => onRejectNode(node.id)}
								className="h-6 px-2 text-[10px]"
							>
								Reject
							</Button>
						</div>
					))}
			</div>
		</div>
	);
}

"use client";

import { useEffect, useRef } from "react";
import { buildBpmnXml } from "../lib/bpmn-builder";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";

interface DiagramNode {
	id: string;
	type: string;
	label: string;
	state: "forming" | "confirmed" | "rejected";
	lane?: string;
	connections: string[];
}

/** Read-only BPMN diagram for session review */
export function SessionDiagram({ nodes }: { nodes: DiagramNode[] }) {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		let viewer: any;

		async function render() {
			if (!containerRef.current || nodes.length === 0) return;

			const BpmnViewer = (await import("bpmn-js/lib/NavigatedViewer")).default;
			viewer = new BpmnViewer({ container: containerRef.current });

			const xml = buildBpmnXml(nodes);
			try {
				await viewer.importXML(xml);
				viewer.get("canvas").zoom("fit-viewport", "auto");
			} catch (err) {
				console.error("[SessionDiagram] Render error:", err);
			}
		}

		render();
		return () => viewer?.destroy();
	}, [nodes]);

	if (nodes.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-muted-foreground">
				No diagram nodes in this session
			</div>
		);
	}

	return <div ref={containerRef} className="h-full w-full bg-card" />;
}

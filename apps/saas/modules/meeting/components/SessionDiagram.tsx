"use client";

import { useEffect, useRef, useCallback } from "react";
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

interface SessionDiagramProps {
	nodes: DiagramNode[];
	/** Pre-built BPMN XML (from manual editing). Takes priority over nodes. */
	bpmnXml?: string | null;
	/** Callback when a node is clicked */
	onNodeClick?: (nodeId: string) => void;
	/** ID of the node to highlight */
	highlightedNodeId?: string | null;
	/** Callback to expose the viewer instance for exports */
	onViewerReady?: (viewer: any) => void;
}

/** Read-only BPMN diagram for session review */
export function SessionDiagram({
	nodes,
	bpmnXml,
	onNodeClick,
	highlightedNodeId,
	onViewerReady,
}: SessionDiagramProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const viewerRef = useRef<any>(null);

	useEffect(() => {
		let cancelled = false;
		let viewer: any;

		async function render() {
			if (!containerRef.current) return;

			const xml = bpmnXml || (nodes.length > 0 ? await buildBpmnXml(nodes) : null);
			if (!xml) return;

			const BpmnViewer = (
				await import("bpmn-js/lib/NavigatedViewer")
			).default;
			if (cancelled) return;

			viewer = new BpmnViewer({ container: containerRef.current });
			viewerRef.current = viewer;

			try {
				await viewer.importXML(xml);
				if (cancelled) {
					viewer.destroy();
					return;
				}
				viewer.get("canvas").zoom("fit-viewport", "auto");

				// Set up click handler for node linking
				if (onNodeClick) {
					const eventBus = viewer.get("eventBus");
					eventBus.on("element.click", (e: any) => {
						if (e.element?.type !== "label" && e.element?.id) {
							onNodeClick(e.element.id);
						}
					});
				}

				onViewerReady?.(viewer);
			} catch (err) {
				console.error("[SessionDiagram] Render error:", err);
			}
		}

		render();
		return () => {
			cancelled = true;
			viewer?.destroy();
			viewerRef.current = null;
		};
	}, [nodes, bpmnXml, onNodeClick, onViewerReady]);

	// Highlight a specific node
	useEffect(() => {
		const viewer = viewerRef.current;
		if (!viewer) return;

		try {
			const canvas = viewer.get("canvas");
			const elementRegistry = viewer.get("elementRegistry");

			// Clear all highlights
			elementRegistry.forEach((element: any) => {
				try {
					canvas.removeMarker(element.id, "highlight");
				} catch {
					// ignore
				}
			});

			// Apply highlight to target node
			if (highlightedNodeId) {
				const element = elementRegistry.get(highlightedNodeId);
				if (element) {
					canvas.addMarker(highlightedNodeId, "highlight");
					canvas.scrollToElement(element);
				}
			}
		} catch {
			// viewer may not be ready
		}
	}, [highlightedNodeId]);

	if (!bpmnXml && nodes.length === 0) {
		return (
			<div className="flex h-full items-center justify-center text-muted-foreground">
				No diagram nodes in this session
			</div>
		);
	}

	return <div ref={containerRef} className="h-full w-full bg-white" />;
}

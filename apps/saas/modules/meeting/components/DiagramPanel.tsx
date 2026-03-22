"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { buildBpmnXml } from "../lib/bpmn-builder";

// bpmn-js requires these CSS files for proper rendering
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
	const viewerRef = useRef<any>(null);
	const [isReady, setIsReady] = useState(false);
	const lastXmlRef = useRef<string>("");

	// Initialize bpmn-js Viewer
	useEffect(() => {
		let viewer: any;

		async function init() {
			if (!containerRef.current) return;

			// Use NavigatedViewer for pan/zoom without editing tools
			const BpmnViewer = (await import("bpmn-js/lib/NavigatedViewer")).default;

			viewer = new BpmnViewer({
				container: containerRef.current,
			});

			viewerRef.current = viewer;
			setIsReady(true);
		}

		init();

		return () => {
			viewer?.destroy();
			viewerRef.current = null;
		};
	}, []);

	// Update diagram when nodes change
	const updateDiagram = useCallback(async () => {
		const viewer = viewerRef.current;
		if (!viewer || !isReady) return;

		const visibleNodes = nodes.filter((n) => n.state !== "rejected");
		const xml = buildBpmnXml(visibleNodes);

		// Skip if XML hasn't changed
		if (xml === lastXmlRef.current) return;
		lastXmlRef.current = xml;

		try {
			await viewer.importXML(xml);

			// Fit diagram to viewport
			const canvas = viewer.get("canvas");
			canvas.zoom("fit-viewport", "auto");

			// Apply visual styling per node state
			const elementRegistry = viewer.get("elementRegistry");
			const overlays = viewer.get("overlays");

			// Clear existing overlays
			overlays.clear();

			for (const node of nodes) {
				const element = elementRegistry.get(node.id);
				if (!element) continue;

				const gfx = elementRegistry.getGraphics(node.id);
				if (!gfx) continue;

				if (node.state === "forming") {
					// Dashed border + amber tint for forming nodes
					const visual = gfx.querySelector(".djs-visual rect, .djs-visual polygon, .djs-visual circle");
					if (visual) {
						visual.setAttribute("stroke", "#d97706");
						visual.setAttribute("stroke-dasharray", "5,5");
						visual.setAttribute("fill", "#fffbeb");
					}

					// Add confirm/reject overlay
					const html = document.createElement("div");
					html.innerHTML = `
						<div style="display:flex;gap:4px;padding:4px;background:white;border-radius:6px;border:1px solid #e5e5e5;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
							<button data-action="confirm" data-node-id="${node.id}" style="padding:2px 8px;font-size:11px;background:#39a561;color:white;border:none;border-radius:4px;cursor:pointer;">✓ Confirm</button>
							<button data-action="reject" data-node-id="${node.id}" style="padding:2px 8px;font-size:11px;background:#ef4444;color:white;border:none;border-radius:4px;cursor:pointer;">✗ Reject</button>
						</div>
					`;

					html.addEventListener("click", (e) => {
						const target = e.target as HTMLElement;
						const action = target.getAttribute("data-action");
						const nodeId = target.getAttribute("data-node-id");
						if (action === "confirm" && nodeId) onConfirmNode(nodeId);
						if (action === "reject" && nodeId) onRejectNode(nodeId);
					});

					overlays.add(node.id, "node-actions", {
						position: { bottom: -8, left: 0 },
						html,
					});
				} else if (node.state === "confirmed") {
					// Solid green border for confirmed
					const visual = gfx.querySelector(".djs-visual rect, .djs-visual polygon, .djs-visual circle");
					if (visual) {
						visual.setAttribute("stroke", "#39a561");
						visual.setAttribute("stroke-width", "2");
						visual.setAttribute("fill", "#f0fdf4");
					}
				}
			}
		} catch (err) {
			console.error("[DiagramPanel] Failed to render BPMN:", err);
		}
	}, [nodes, isReady, onConfirmNode, onRejectNode]);

	useEffect(() => {
		updateDiagram();
	}, [updateDiagram]);

	const visibleNodes = nodes.filter((n) => n.state !== "rejected");

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
					<div className="flex items-center gap-2">
						<span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
							{nodes.filter((n) => n.state === "confirmed").length} confirmed
						</span>
						{nodes.filter((n) => n.state === "forming").length > 0 && (
							<span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">
								{nodes.filter((n) => n.state === "forming").length} forming
							</span>
						)}
					</div>
				)}
			</div>

			{/* BPMN Canvas */}
			<div className="relative flex-1">
				<div ref={containerRef} className="h-full w-full bg-card" />

				{/* Empty state — shown when no nodes */}
				{visibleNodes.length === 0 && (
					<div className="absolute inset-0 flex items-center justify-center bg-card">
						<div className="text-center">
							<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/5">
								<svg className="h-8 w-8 text-primary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
									<path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
								</svg>
							</div>
							<p className="text-lg text-muted-foreground">
								{sessionType === "DISCOVERY"
									? "Describe your business to begin mapping"
									: "Describe the process to begin diagramming"}
							</p>
							<p className="mt-2 text-sm text-muted-foreground/60">
								BPMN diagram will build as process steps are discussed
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

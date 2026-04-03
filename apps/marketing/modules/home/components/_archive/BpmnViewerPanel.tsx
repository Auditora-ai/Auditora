"use client";

import { config } from "@config";
import { ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";

interface BpmnViewerPanelProps {
	bpmnXml: string | null;
}

export function BpmnViewerPanel({ bpmnXml }: BpmnViewerPanelProps) {
	const t = useTranslations();
	const containerRef = useRef<HTMLDivElement>(null);
	const viewerRef = useRef<InstanceType<typeof import("bpmn-js/lib/Viewer").default> | null>(null);
	const [isLoaded, setIsLoaded] = useState(false);
	const [showEditOverlay, setShowEditOverlay] = useState(false);

	// Lazy-load bpmn-js Viewer
	useEffect(() => {
		if (!containerRef.current || viewerRef.current) return;

		let cancelled = false;

		async function initViewer() {
			try {
				const { default: BpmnViewer } = await import("bpmn-js/lib/Viewer");
				if (cancelled || !containerRef.current) return;

				const viewer = new BpmnViewer({
					container: containerRef.current,
				});

				viewerRef.current = viewer;
				setIsLoaded(true);
			} catch {
				// bpmn-js failed to load — fallback to empty state
			}
		}

		initViewer();
		return () => {
			cancelled = true;
			viewerRef.current?.destroy();
			viewerRef.current = null;
		};
	}, []);

	// Import XML when it changes
	useEffect(() => {
		if (!viewerRef.current || !bpmnXml) return;

		async function renderDiagram() {
			try {
				await viewerRef.current!.importXML(bpmnXml!);
				const canvas = viewerRef.current!.get("canvas") as { zoom: (type: string) => void };
				canvas.zoom("fit-viewport");
				setShowEditOverlay(true);
			} catch (err) {
				console.error("[BpmnViewer] Failed to render:", err);
			}
		}

		renderDiagram();
	}, [bpmnXml]);

	const handleEditClick = useCallback(() => {
		// Save diagram to localStorage for post-signup recovery
		if (bpmnXml) {
			try {
				localStorage.setItem(
					"prozea_tryit_diagram",
					JSON.stringify({
						bpmnXml,
						timestamp: Date.now(),
					}),
				);
			} catch {
				// localStorage full — proceed without persistence
			}
		}
		window.location.href = `${config.saasUrl}/signup?from=tryit`;
	}, [bpmnXml]);

	return (
		<div className="relative w-full h-full min-h-[300px] bg-white rounded-xl overflow-hidden">
			{/* BPMN viewer container */}
			<div ref={containerRef} className="w-full h-full min-h-[300px]" />

			{/* Custom CSS for DESIGN.md colors */}
			<style jsx global>{`
				/* Task nodes: blue */
				.djs-shape .djs-visual > rect { stroke: #3B8FE8 !important; fill: #ECFDF5 !important; }
				/* Start event: green */
				.djs-shape[data-element-id^="StartEvent"] .djs-visual > circle { stroke: #16A34A !important; fill: #F0FDF4 !important; }
				/* End event: red */
				.djs-shape[data-element-id^="EndEvent"] .djs-visual > circle { stroke: #DC2626 !important; fill: #FEF2F2 !important; }
				/* Gateway: amber */
				.djs-shape[data-element-id^="Gateway"] .djs-visual > polygon,
				.djs-shape[data-element-id^="ExclusiveGateway"] .djs-visual > polygon { stroke: #EF4444 !important; fill: #FEF2F2 !important; }
				/* Connections */
				.djs-connection .djs-visual > path { stroke: #64748B !important; }
				/* Labels */
				.djs-label text { fill: #0F172A !important; font-family: 'Geist', system-ui, sans-serif !important; font-size: 12px !important; }
				/* Hide bpmn-js watermark */
				.bjs-powered-by { display: none !important; }
			`}</style>

			{/* Empty state */}
			{!bpmnXml && isLoaded && (
				<div className="absolute inset-0 flex items-center justify-center bg-white">
					<div className="text-center text-muted-foreground">
						<svg viewBox="0 0 120 60" className="w-24 mx-auto mb-3 opacity-20" fill="none">
							<circle cx="20" cy="30" r="10" stroke="#64748B" strokeWidth="1.5" />
							<line x1="30" y1="30" x2="45" y2="30" stroke="#64748B" strokeWidth="1.5" />
							<rect x="45" y="18" width="30" height="24" rx="3" stroke="#64748B" strokeWidth="1.5" />
							<line x1="75" y1="30" x2="90" y2="30" stroke="#64748B" strokeWidth="1.5" />
							<circle cx="100" cy="30" r="10" stroke="#64748B" strokeWidth="2" />
						</svg>
						<p className="text-sm">{t("home.tryIt.diagramEmpty")}</p>
					</div>
				</div>
			)}

			{/* Edit overlay */}
			{showEditOverlay && bpmnXml && (
				<div className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 via-transparent to-transparent">
					<div className="text-center pb-6">
						<p className="text-white font-semibold text-base mb-1">
							{t("home.tryIt.editOverlayTitle")}
						</p>
						<p className="text-white/70 text-sm mb-4 max-w-[280px]">
							{t("home.tryIt.editOverlaySubtitle")}
						</p>
						<button
							type="button"
							onClick={handleEditClick}
							className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors shadow-lg"
						>
							{t("home.tryIt.editOverlayButton")}
							<ArrowRightIcon className="size-4" />
						</button>
						<p className="text-white/50 text-xs mt-2">
							{t("home.tryIt.editOverlayNote")}
						</p>
					</div>
				</div>
			)}
		</div>
	);
}

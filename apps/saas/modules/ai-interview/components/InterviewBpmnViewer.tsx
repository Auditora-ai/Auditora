"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2Icon } from "lucide-react";

interface InterviewBpmnViewerProps {
	bpmnXml: string;
	className?: string;
}

export function InterviewBpmnViewer({ bpmnXml, className }: InterviewBpmnViewerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const viewerRef = useRef<any>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!containerRef.current || !bpmnXml) return;

		let disposed = false;

		async function init() {
			try {
				const BpmnViewer = (await import("bpmn-js/lib/NavigatedViewer")).default;
				if (disposed || !containerRef.current) return;

				const viewer = new BpmnViewer({
					container: containerRef.current,
				});
				viewerRef.current = viewer;

				await viewer.importXML(bpmnXml);
				const canvas = viewer.get("canvas") as any;
				canvas.zoom("fit-viewport", "auto");

				// Apply Bizagi-style colors
				try {
					const { applyBizagiColors } = await import("@meeting/lib/bpmn-colors");
					applyBizagiColors(viewer);
				} catch {
					// Colors are optional — diagram still shows without them
				}

				setLoading(false);
			} catch (err) {
				console.error("[InterviewBpmnViewer] Failed to render BPMN:", err);
				setError("No se pudo renderizar el diagrama");
				setLoading(false);
			}
		}

		init();

		return () => {
			disposed = true;
			if (viewerRef.current) {
				viewerRef.current.destroy();
				viewerRef.current = null;
			}
		};
	}, [bpmnXml]);

	if (error) {
		return (
			<div
				className={`flex items-center justify-center rounded-lg border ${className || ""}`}
				style={{ borderColor: "#E2E8F0", backgroundColor: "#F1F5F9" }}
			>
				<span className="text-sm" style={{ color: "#DC2626" }}>{error}</span>
			</div>
		);
	}

	return (
		<div className={`relative ${className || ""}`}>
			{loading && (
				<div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg" style={{ backgroundColor: "#F1F5F9" }}>
					<Loader2Icon className="size-6 animate-spin" style={{ color: "#D97706" }} />
				</div>
			)}
			<div
				ref={containerRef}
				className="h-full w-full rounded-lg border"
				style={{ borderColor: "#E2E8F0", backgroundColor: "#F8FAFC" }}
			/>
		</div>
	);
}

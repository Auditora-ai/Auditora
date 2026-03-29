"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

interface DiagramRevealProps {
	bpmnXml: string;
	onRevealed: () => void;
}

export function DiagramReveal({ bpmnXml, onRevealed }: DiagramRevealProps) {
	const t = useTranslations("scan");
	const containerRef = useRef<HTMLDivElement>(null);
	const modelerRef = useRef<any>(null);
	const [revealed, setRevealed] = useState(false);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		if (!containerRef.current || !bpmnXml) return;

		let disposed = false;

		async function initModeler() {
			const BpmnViewer = (await import("bpmn-js/lib/NavigatedViewer")).default;
			if (disposed || !containerRef.current) return;

			const viewer = new BpmnViewer({ container: containerRef.current });
			modelerRef.current = viewer;

			try {
				await viewer.importXML(bpmnXml);
				const canvas = viewer.get("canvas") as any;
				canvas.zoom("fit-viewport", "auto");

				try {
					const { applyBizagiColors } = await import("@meeting/lib/bpmn-colors");
					applyBizagiColors(viewer);
				} catch {
					// Coloring is optional
				}

				setLoading(false);
				setTimeout(() => {
					setRevealed(true);
					onRevealed();
				}, 300);
			} catch (err) {
				console.error("Failed to render BPMN:", err);
				setLoading(false);
				setRevealed(true);
				onRevealed();
			}
		}

		initModeler();
		return () => {
			disposed = true;
			modelerRef.current?.destroy();
		};
	}, [bpmnXml, onRevealed]);

	return (
		<div
			className="relative overflow-hidden rounded-xl border border-border bg-background"
			style={{ minHeight: 400 }}
		>
			{loading && (
				<div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
					<div className="text-center">
						<div className="mb-3 mx-auto h-6 w-6 animate-spin rounded-full border-2 border-[#D97706] border-t-transparent" />
						<p className="text-sm text-muted-foreground">{t("buildingDiagram")}</p>
					</div>
				</div>
			)}

			<div
				ref={containerRef}
				className="h-[400px] w-full transition-all duration-700"
				style={{
					opacity: revealed ? 1 : 0,
					transform: revealed ? "scale(1)" : "scale(0.98)",
				}}
			/>

			{/* Amber glow edges per DESIGN.md */}
			<div
				className="pointer-events-none absolute inset-0 rounded-xl"
				style={{
					border: "1px solid rgba(217, 119, 6, 0.08)",
					boxShadow: "inset 0 0 4px rgba(217, 119, 6, 0.08)",
				}}
			/>
		</div>
	);
}

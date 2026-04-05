"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2Icon } from "lucide-react";
import { Card, CardContent } from "@repo/ui/components/card";
import { Skeleton } from "@repo/ui/components/skeleton";
import { cn } from "@repo/ui";

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
					const { applyBizagiColors } = await import("@repo/process-engine");
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
			<Card
				size="sm"
				className={cn(
					"flex items-center justify-center shadow-none",
					className,
				)}
			>
				<CardContent className="flex items-center justify-center py-8">
					<span className="text-sm text-destructive">{error}</span>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card size="sm" className={cn("relative shadow-none overflow-hidden", className)}>
			{loading && (
				<div className="absolute inset-0 z-10 flex items-center justify-center">
					<Skeleton className="absolute inset-0 rounded-none" />
					<Loader2Icon className="relative z-20 size-6 animate-spin text-primary" />
				</div>
			)}
			<div
				ref={containerRef}
				className="h-full w-full bg-background"
			/>
		</Card>
	);
}

"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { SessionDiagram } from "@meeting/components/SessionDiagram";

interface DiagramNode {
	id: string;
	type: string;
	label: string;
	state: "forming" | "confirmed" | "rejected";
	lane?: string;
	connections: string[];
}

interface LiveShareViewerProps {
	sessionId: string;
	initialNodes: DiagramNode[];
	initialXml?: string | null;
	isActive: boolean;
}

/**
 * Live share viewer — polls for diagram updates every 5s while session is active.
 * Read-only viewer that shows the latest BPMN diagram state.
 */
export function LiveShareViewer({ sessionId, initialNodes, initialXml, isActive }: LiveShareViewerProps) {
	const [nodes, setNodes] = useState(initialNodes);
	const [xml, setXml] = useState(initialXml);
	const [live, setLive] = useState(isActive);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	const poll = useCallback(async () => {
		try {
			const res = await fetch(`/api/share/${sessionId}/live`);
			if (!res.ok) return;
			const data = await res.json();

			if (data.ended) {
				setLive(false);
				return;
			}

			if (data.bpmnXml) {
				setXml(data.bpmnXml);
			}
			if (data.nodes?.length > 0) {
				setNodes(data.nodes);
			}
		} catch {
			// Network error — retry next poll
		}
	}, [sessionId]);

	useEffect(() => {
		if (!live) return;
		// Poll every 5 seconds
		intervalRef.current = setInterval(poll, 5000);
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [live, poll]);

	return (
		<div className="relative h-full w-full">
			<SessionDiagram nodes={nodes} bpmnXml={xml} />
			{live && (
				<div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1 backdrop-blur-sm">
					<span className="relative flex h-2 w-2">
						<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
						<span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
					</span>
					<span className="text-xs font-medium text-green-700">En vivo</span>
				</div>
			)}
		</div>
	);
}

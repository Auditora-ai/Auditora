"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@repo/ui/components/card";
import {
	PencilIcon,
	FileTextIcon,
	ImageIcon,
	SparklesIcon,
	CheckCircleIcon,
	AlertTriangleIcon,
	ListChecksIcon,
} from "lucide-react";
import { SessionDiagram } from "./SessionDiagram";
import { ReviewTranscript } from "./ReviewTranscript";
import { DiagramEditor } from "./DiagramEditor";

interface DiagramNode {
	id: string;
	type: string;
	label: string;
	state: "forming" | "confirmed" | "rejected";
	lane?: string;
	connections: string[];
	formedAt?: string;
}

interface TranscriptEntry {
	id: string;
	speaker: string;
	text: string;
	timestamp: number;
}

interface SessionSummary {
	summary: string;
	actionItems: string[];
}

interface SessionReviewClientProps {
	sessionId: string;
	nodes: DiagramNode[];
	transcriptEntries: TranscriptEntry[];
	bpmnXml?: string | null;
	totalNodeCount: number;
	confirmedCount: number;
	rejectedCount: number;
}

export function SessionReviewClient({
	sessionId,
	nodes,
	transcriptEntries,
	bpmnXml: initialBpmnXml,
	totalNodeCount,
	confirmedCount,
	rejectedCount,
}: SessionReviewClientProps) {
	const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(
		null,
	);
	const [highlightedEntryId, setHighlightedEntryId] = useState<string | null>(
		null,
	);
	const [editorOpen, setEditorOpen] = useState(false);
	const [bpmnXml, setBpmnXml] = useState(initialBpmnXml);
	const [summary, setSummary] = useState<SessionSummary | null>(null);
	const [summaryLoading, setSummaryLoading] = useState(true);
	const [viewerRef, setViewerRef] = useState<any>(null);

	// Fetch session summary
	useEffect(() => {
		async function fetchSummary() {
			try {
				const res = await fetch(
					`/api/sessions/${sessionId}/summary`,
				);
				if (!res.ok) return;
				const data = await res.json();
				if (data.summary) {
					setSummary(data);
				}
			} catch {
				// Summary not available yet
			} finally {
				setSummaryLoading(false);
			}
		}
		fetchSummary();
	}, [sessionId]);

	// Build node → transcript mapping by timestamp proximity
	const nodeTranscriptMap = useMemo(() => {
		const map = new Map<string, string>();
		for (const node of nodes) {
			if (!node.formedAt) continue;
			const nodeTime = new Date(node.formedAt).getTime() / 1000;
			let closestEntry: TranscriptEntry | null = null;
			let closestDiff = Infinity;

			for (const entry of transcriptEntries) {
				const diff = Math.abs(entry.timestamp - nodeTime);
				if (diff < closestDiff) {
					closestDiff = diff;
					closestEntry = entry;
				}
			}
			if (closestEntry && closestDiff < 60) {
				map.set(node.id, closestEntry.id);
			}
		}
		return map;
	}, [nodes, transcriptEntries]);

	const transcriptNodeMap = useMemo(() => {
		const map = new Map<string, string>();
		for (const [nodeId, entryId] of nodeTranscriptMap) {
			map.set(entryId, nodeId);
		}
		return map;
	}, [nodeTranscriptMap]);

	const handleNodeClick = useCallback(
		(nodeId: string) => {
			setHighlightedNodeId(nodeId);
			const entryId = nodeTranscriptMap.get(nodeId);
			setHighlightedEntryId(entryId || null);
		},
		[nodeTranscriptMap],
	);

	const handleEntryClick = useCallback(
		(entryId: string) => {
			setHighlightedEntryId(entryId);
			const nodeId = transcriptNodeMap.get(entryId);
			setHighlightedNodeId(nodeId || null);
		},
		[transcriptNodeMap],
	);

	const handleSaveDiagram = useCallback(
		async (xml: string) => {
			try {
				await fetch(`/api/sessions/${sessionId}/diagram`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ bpmnXml: xml }),
				});
				setBpmnXml(xml);
				setEditorOpen(false);
			} catch (err) {
				console.error("[SessionReview] Save failed:", err);
			}
		},
		[sessionId],
	);

	const handleExportPNG = useCallback(async () => {
		if (!viewerRef) return;
		try {
			const { svg } = await viewerRef.saveSVG();
			// Convert SVG to PNG via canvas
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			if (!ctx) return;

			const img = new Image();
			const svgBlob = new Blob([svg], { type: "image/svg+xml" });
			const url = URL.createObjectURL(svgBlob);

			img.onload = () => {
				const scale = 2;
				canvas.width = img.width * scale;
				canvas.height = img.height * scale;
				ctx.fillStyle = "white";
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
				URL.revokeObjectURL(url);

				canvas.toBlob((blob) => {
					if (!blob) return;
					const a = document.createElement("a");
					a.href = URL.createObjectURL(blob);
					a.download = `diagram-${sessionId}.png`;
					a.click();
					URL.revokeObjectURL(a.href);
				}, "image/png");
			};
			img.src = url;
		} catch (err) {
			console.error("[Export PNG] Error:", err);
		}
	}, [viewerRef, sessionId]);

	// Quality score
	const qualityScore =
		totalNodeCount > 0
			? Math.round((confirmedCount / totalNodeCount) * 100)
			: 0;

	return (
		<>
			{/* Session Quality Score */}
			<div className="mt-2 flex items-center gap-3">
				<div className="flex items-center gap-1.5">
					{qualityScore >= 70 ? (
						<CheckCircleIcon className="h-3.5 w-3.5 text-success" />
					) : (
						<AlertTriangleIcon className="h-3.5 w-3.5 text-amber-500" />
					)}
					<span className="text-sm font-medium text-foreground">
						{qualityScore}% confirmed
					</span>
				</div>
				{qualityScore < 70 && totalNodeCount > 0 && (
					<span className="text-xs text-amber-600">
						Consider a follow-up session
					</span>
				)}
			</div>

			{/* AI Summary */}
			{summaryLoading ? (
				<Card className="mt-4 p-6">
					<div className="flex items-center gap-2">
						<SparklesIcon className="h-4 w-4 animate-pulse text-primary" />
						<span className="text-sm text-muted-foreground">
							Loading summary...
						</span>
					</div>
				</Card>
			) : summary ? (
				<Card className="mt-4 p-6">
					<div className="mb-3 flex items-center gap-2">
						<SparklesIcon className="h-4 w-4 text-primary" />
						<h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
							Session Summary
						</h3>
					</div>
					<p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
						{summary.summary}
					</p>
					{summary.actionItems.length > 0 && (
						<div className="mt-4">
							<div className="mb-2 flex items-center gap-1.5">
								<ListChecksIcon className="h-3.5 w-3.5 text-muted-foreground" />
								<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
									Action Items
								</span>
							</div>
							<ul className="space-y-1.5">
								{summary.actionItems.map((item, i) => (
									<li
										key={i}
										className="flex items-start gap-2 text-sm text-foreground"
									>
										<span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
										{item}
									</li>
								))}
							</ul>
						</div>
					)}
				</Card>
			) : null}

			{/* Diagram with actions */}
			<Card className="mt-6">
				<div className="flex items-center justify-between border-b border-border px-4 py-2">
					<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Process Diagram
					</span>
					<div className="flex items-center gap-1">
						<button
							type="button"
							onClick={() => setEditorOpen(true)}
							className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
						>
							<PencilIcon className="h-3 w-3" />
							Edit
						</button>
						<button
							type="button"
							onClick={handleExportPNG}
							className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
						>
							<ImageIcon className="h-3 w-3" />
							PNG
						</button>
					</div>
				</div>
				<div className="h-[500px]">
					<SessionDiagram
						nodes={nodes}
						bpmnXml={bpmnXml}
						onNodeClick={handleNodeClick}
						highlightedNodeId={highlightedNodeId}
						onViewerReady={setViewerRef}
					/>
				</div>
			</Card>

			{/* Transcript with search + filter + linking */}
			<Card className="mt-6">
				<div className="border-b border-border px-4 py-2">
					<span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
						Transcript
					</span>
				</div>
				<div className="h-[500px]">
					<ReviewTranscript
						entries={transcriptEntries}
						highlightedEntryId={highlightedEntryId}
						onEntryClick={handleEntryClick}
					/>
				</div>
			</Card>

			{/* Full-screen diagram editor */}
			{editorOpen && (
				<DiagramEditor
					sessionId={sessionId}
					nodes={nodes}
					bpmnXml={bpmnXml}
					onClose={() => setEditorOpen(false)}
					onSave={handleSaveDiagram}
				/>
			)}
		</>
	);
}

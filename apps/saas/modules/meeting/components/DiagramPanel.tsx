"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@repo/ui";
import { CheckIcon, XIcon } from "lucide-react";

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

/**
 * DiagramPanel — Renders BPMN nodes as a simple flow diagram
 *
 * Uses a clean card-based layout instead of raw bpmn-js embed
 * to feel native to the supastarter design system.
 * Each node is a card with confirm/reject actions.
 *
 * bpmn-js will be used for export (XML/PNG) but the live view
 * uses this custom renderer for better UX integration.
 */
export function DiagramPanel({
	nodes,
	onConfirmNode,
	onRejectNode,
	sessionType,
}: DiagramPanelProps) {
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

			{/* Diagram canvas */}
			<div className="flex-1 overflow-y-auto bg-card p-6">
				{visibleNodes.length === 0 ? (
					<div className="flex h-full items-center justify-center">
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
								Nodes will appear as process steps are discussed
							</p>
						</div>
					</div>
				) : (
					<div className="mx-auto max-w-lg space-y-3">
						{/* Start indicator */}
						<div className="flex justify-center">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-success text-success-foreground">
								<svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
									<circle cx="12" cy="12" r="8" />
								</svg>
							</div>
						</div>

						{visibleNodes.map((node, index) => (
							<div key={node.id}>
								{/* Connector line */}
								<div className="flex justify-center py-1">
									<div className="h-6 w-px bg-border" />
								</div>

								{/* Node card */}
								<div
									className={`relative rounded-lg border p-4 transition-all ${
										node.state === "forming"
											? "border-dashed border-amber-500/50 bg-amber-500/5 animate-pulse"
											: "border-border bg-card shadow-sm"
									}`}
								>
									{/* Node type badge */}
									<div className="mb-2 flex items-center justify-between">
										<span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground uppercase">
											{node.type === "exclusivegateway" || node.type === "exclusive_gateway"
												? "Decision"
												: node.type === "startevent" || node.type === "start_event"
													? "Start"
													: node.type === "endevent" || node.type === "end_event"
														? "End"
														: "Task"}
										</span>
										{node.lane && (
											<span className="text-[10px] text-muted-foreground">
												{node.lane}
											</span>
										)}
									</div>

									{/* Node label */}
									<p className="text-sm font-medium text-foreground">
										{node.label}
									</p>

									{/* Actions for forming nodes */}
									{node.state === "forming" && (
										<div className="mt-3 flex items-center gap-2">
											<Button
												size="sm"
												variant="default"
												onClick={() => onConfirmNode(node.id)}
												className="h-7 bg-success px-3 text-xs text-success-foreground hover:bg-success/90"
											>
												<CheckIcon className="mr-1 h-3 w-3" />
												Confirm
											</Button>
											<Button
												size="sm"
												variant="destructive"
												onClick={() => onRejectNode(node.id)}
												className="h-7 px-3 text-xs"
											>
												<XIcon className="mr-1 h-3 w-3" />
												Reject
											</Button>
											<span className="ml-auto text-[10px] text-muted-foreground">
												Auto-confirms in 10s
											</span>
										</div>
									)}

									{/* Confirmed indicator */}
									{node.state === "confirmed" && (
										<div className="mt-2 flex items-center gap-1 text-[10px] text-success">
											<CheckIcon className="h-3 w-3" />
											Confirmed
										</div>
									)}
								</div>
							</div>
						))}

						{/* End indicator (only if we have confirmed nodes) */}
						{nodes.some((n) => n.state === "confirmed") && (
							<>
								<div className="flex justify-center py-1">
									<div className="h-6 w-px bg-border" />
								</div>
								<div className="flex justify-center">
									<div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-foreground/20">
										<div className="h-4 w-4 rounded-full border-2 border-foreground/20" />
									</div>
								</div>
							</>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

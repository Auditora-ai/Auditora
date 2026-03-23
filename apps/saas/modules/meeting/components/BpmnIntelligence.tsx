"use client";

import { useEffect, useState, useCallback } from "react";
import {
	AlertTriangle,
	Lightbulb,
	AlertCircle,
	HelpCircle,
	X,
	RefreshCw,
} from "lucide-react";

interface IntelligenceItem {
	id: string;
	category: string;
	question: string;
	context: string | null;
	priority: number;
	status: string;
	elementRef?: string; // "name|type|lane" stable reference
}

interface BpmnIntelligenceProps {
	processId: string;
	modeler: any;
	isReady: boolean;
	visible: boolean;
	/** Map of stable element refs to BPMN element IDs for current diagram */
	elementRefMap?: Map<string, string>;
}

/** Category → icon + color mapping */
const CATEGORY_STYLES: Record<
	string,
	{ icon: typeof AlertTriangle; color: string; bg: string }
> = {
	MISSING_EXCEPTION: {
		icon: AlertTriangle,
		color: "#EAB308",
		bg: "#FEF9C3",
	},
	MISSING_PATH: { icon: AlertTriangle, color: "#EAB308", bg: "#FEF9C3" },
	MISSING_DECISION: {
		icon: AlertTriangle,
		color: "#EAB308",
		bg: "#FEF9C3",
	},
	CONTRADICTION: { icon: AlertCircle, color: "#DC2626", bg: "#FEF2F2" },
	UNCLEAR_HANDOFF: { icon: AlertCircle, color: "#DC2626", bg: "#FEF2F2" },
	MISSING_ROLE: { icon: HelpCircle, color: "#64748B", bg: "#F1F5F9" },
	MISSING_SLA: { icon: HelpCircle, color: "#64748B", bg: "#F1F5F9" },
	MISSING_SYSTEM: { icon: HelpCircle, color: "#64748B", bg: "#F1F5F9" },
	MISSING_TRIGGER: { icon: Lightbulb, color: "#3B82F6", bg: "#EFF6FF" },
	MISSING_OUTPUT: { icon: Lightbulb, color: "#3B82F6", bg: "#EFF6FF" },
	GENERAL_GAP: { icon: HelpCircle, color: "#64748B", bg: "#F1F5F9" },
};

function getStyle(category: string) {
	return (
		CATEGORY_STYLES[category] || {
			icon: HelpCircle,
			color: "#64748B",
			bg: "#F1F5F9",
		}
	);
}

/**
 * BpmnIntelligence — Renders AI intelligence overlays on BPMN elements
 *
 * Fetches IntelligenceItem records from the API, maps them to BPMN elements
 * using stable references (name|type|lane), and renders badge overlays.
 * Click a badge to see the full insight detail.
 */
export function BpmnIntelligence({
	processId,
	modeler,
	isReady,
	visible,
	elementRefMap,
}: BpmnIntelligenceProps) {
	const [items, setItems] = useState<IntelligenceItem[]>([]);
	const [selectedItem, setSelectedItem] = useState<IntelligenceItem | null>(
		null,
	);
	const [loading, setLoading] = useState(false);

	// Fetch intelligence items
	const fetchItems = useCallback(async () => {
		if (!processId) return;
		try {
			const res = await fetch(
				`/api/processes/${processId}/intelligence`,
			);
			if (res.ok) {
				const data = await res.json();
				setItems(data.items || []);
			}
		} catch {
			// Silently fail — intelligence is optional
		}
	}, [processId]);

	useEffect(() => {
		fetchItems();
	}, [fetchItems]);

	// Render overlays on BPMN elements
	useEffect(() => {
		if (!modeler || !isReady || !visible || items.length === 0) return;

		const overlays = modeler.get("overlays");
		const elementRegistry = modeler.get("elementRegistry");
		const overlayIds: string[] = [];

		// Group items by element
		const itemsByElement = new Map<string, IntelligenceItem[]>();
		for (const item of items.filter((i) => i.status === "OPEN")) {
			const ref = item.elementRef;
			if (!ref) continue;

			// Resolve stable ref to current element ID
			const elementId = elementRefMap?.get(ref);
			if (!elementId) continue;

			const el = elementRegistry.get(elementId);
			if (!el) continue;

			const existing = itemsByElement.get(elementId) || [];
			existing.push(item);
			itemsByElement.set(elementId, existing);
		}

		// Add overlays
		for (const [elementId, elItems] of itemsByElement) {
			const topItem = elItems.sort(
				(a, b) => b.priority - a.priority,
			)[0];
			const style = getStyle(topItem.category);

			const badge = document.createElement("div");
			badge.className = "bpmn-intelligence-badge";
			badge.style.cssText = `
				display: flex; align-items: center; justify-content: center;
				width: 20px; height: 20px; border-radius: 50%;
				background: ${style.bg}; border: 1.5px solid ${style.color};
				cursor: pointer; font-size: 10px; font-weight: 600;
				color: ${style.color}; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
			`;
			badge.textContent = elItems.length > 1 ? `${elItems.length}` : "!";
			badge.title = topItem.question;

			badge.addEventListener("click", (e) => {
				e.stopPropagation();
				setSelectedItem(topItem);
			});

			try {
				const id = overlays.add(elementId, "intelligence", {
					position: { top: -12, right: -12 },
					html: badge,
				});
				overlayIds.push(id);
			} catch {
				// Element may not support overlays
			}
		}

		return () => {
			for (const id of overlayIds) {
				try {
					overlays.remove(id);
				} catch {
					// Already removed
				}
			}
		};
	}, [modeler, isReady, visible, items, elementRefMap]);

	// Trigger new analysis
	const runAnalysis = useCallback(async () => {
		if (!processId || loading) return;
		setLoading(true);
		try {
			await fetch(`/api/processes/${processId}/intelligence`, {
				method: "POST",
			});
			await fetchItems();
		} finally {
			setLoading(false);
		}
	}, [processId, loading, fetchItems]);

	if (!visible) return null;

	// Insight detail popover
	if (selectedItem) {
		const style = getStyle(selectedItem.category);
		const Icon = style.icon;

		return (
			<div className="absolute right-4 top-4 z-50 w-72 rounded-lg border border-border bg-card shadow-xl">
				<div className="flex items-center justify-between border-b p-3">
					<div className="flex items-center gap-2">
						<Icon
							className="h-4 w-4"
							style={{ color: style.color }}
						/>
						<span className="text-xs font-medium text-muted-foreground">
							{selectedItem.category.replace(/_/g, " ")}
						</span>
					</div>
					<button
						type="button"
						onClick={() => setSelectedItem(null)}
						className="text-muted-foreground hover:text-foreground"
					>
						<X className="h-4 w-4" />
					</button>
				</div>
				<div className="p-3">
					<p className="text-sm font-medium">{selectedItem.question}</p>
					{selectedItem.context && (
						<p className="mt-2 text-xs text-muted-foreground">
							{selectedItem.context}
						</p>
					)}
					<div className="mt-2 flex items-center gap-2">
						<span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium">
							Prioridad: {selectedItem.priority}
						</span>
					</div>
				</div>
			</div>
		);
	}

	return null;
}

/** Floating button to trigger AI analysis */
export function IntelligenceButton({
	loading,
	onRun,
	itemCount,
}: {
	loading: boolean;
	onRun: () => void;
	itemCount: number;
}) {
	return (
		<button
			type="button"
			onClick={onRun}
			disabled={loading}
			className="flex items-center gap-1.5 rounded-md border border-[#334155] bg-[#0F172A] px-2.5 py-1.5 text-xs text-[#F1F5F9] shadow-sm transition-colors hover:bg-[#1E293B] disabled:opacity-50"
			title="Run AI process analysis"
		>
			<RefreshCw
				className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
			/>
			{loading ? "Analyzing..." : `AI Analysis${itemCount > 0 ? ` (${itemCount})` : ""}`}
		</button>
	);
}

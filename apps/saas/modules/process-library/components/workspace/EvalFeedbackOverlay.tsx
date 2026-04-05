"use client";

import { useEffect, useRef } from "react";
import type { ProcessEvalFeedbackData } from "../../types";

interface EvalFeedbackOverlayProps {
	getModeler: () => any;
	isReady: boolean;
	evalFeedback: ProcessEvalFeedbackData;
}

const TASK_TYPES = new Set([
	"bpmn:Task",
	"bpmn:UserTask",
	"bpmn:ServiceTask",
	"bpmn:ScriptTask",
	"bpmn:ManualTask",
	"bpmn:BusinessRuleTask",
	"bpmn:SendTask",
	"bpmn:ReceiveTask",
	"bpmn:SubProcess",
	"bpmn:CallActivity",
]);

/**
 * Fuzzy-match a BPMN node name against procedural references from evaluation decisions.
 * Returns the failure rate (0-100) if matched, or null if no match.
 */
function matchNodeToFailureRate(
	nodeName: string,
	stepFailureMap: Record<string, number>,
): number | null {
	const normalizedName = nodeName.toLowerCase().trim();

	// Direct match
	if (stepFailureMap[normalizedName] !== undefined) {
		return stepFailureMap[normalizedName]!;
	}

	// Fuzzy match: check if the BPMN node name is contained in a procedural reference
	// or if key words from the procedural reference appear in the node name
	for (const [refText, rate] of Object.entries(stepFailureMap)) {
		// Reference contains the node name
		if (refText.includes(normalizedName) && normalizedName.length > 3) {
			return rate;
		}
		// Node name contains the reference (when ref is short)
		if (normalizedName.includes(refText) && refText.length > 3) {
			return rate;
		}
		// Keyword matching: split into words ≥ 4 chars and check overlap
		const refWords = refText.split(/\s+/).filter((w) => w.length >= 4);
		const nameWords = normalizedName.split(/\s+/).filter((w) => w.length >= 4);
		if (refWords.length > 0 && nameWords.length > 0) {
			const matchCount = nameWords.filter((w) => refWords.includes(w)).length;
			const overlapRatio = matchCount / Math.min(refWords.length, nameWords.length);
			if (overlapRatio >= 0.5 && matchCount >= 2) {
				return rate;
			}
		}
	}

	return null;
}

/**
 * Get badge color based on failure rate.
 * Green (0-20%) → Yellow (20-50%) → Orange (50-70%) → Red (70-100%)
 * Dynamic runtime color for DOM overlays — must remain as inline hex values
 */
function getFailureColor(rate: number): string {
	if (rate <= 20) return "#16A34A"; // green
	if (rate <= 50) return "#EAB308"; // yellow
	if (rate <= 70) return "#F97316"; // orange
	return "#DC2626"; // red
}

/**
 * Overlays failure rate badges on BPMN nodes.
 * Shows a colored circle (green-to-red) with the failure percentage on each matched step.
 */
export function EvalFeedbackOverlay({
	getModeler,
	isReady,
	evalFeedback,
}: EvalFeedbackOverlayProps) {
	const overlayIdsRef = useRef<string[]>([]);

	const { stepFailureMap, hasData } = evalFeedback;

	useEffect(() => {
		const modeler = getModeler();
		if (!modeler || !isReady || !hasData) return;

		const overlays = modeler.get("overlays");
		const elementRegistry = modeler.get("elementRegistry");

		// Clean up previous overlays
		for (const id of overlayIdsRef.current) {
			try {
				overlays.remove(id);
			} catch {
				/* overlay may already be gone */
			}
		}
		overlayIdsRef.current = [];

		const allElements = elementRegistry.getAll();

		for (const element of allElements) {
			if (!TASK_TYPES.has(element.type)) continue;

			const name = element.businessObject?.name;
			if (!name) continue;

			const failureRate = matchNodeToFailureRate(name, stepFailureMap);
			if (failureRate === null) continue;

			const color = getFailureColor(failureRate);

			// Create badge with failure rate number
			const badge = document.createElement("div");
			badge.style.cssText = `
				display: flex;
				align-items: center;
				justify-content: center;
				min-width: 28px;
				height: 16px;
				padding: 0 4px;
				border-radius: 8px;
				background: ${color};
				color: white;
				font-size: 9px;
				font-weight: 700;
				font-family: system-ui, sans-serif;
				border: 1.5px solid white;
				box-shadow: 0 1px 3px rgba(0,0,0,0.25);
				pointer-events: auto;
				cursor: help;
				line-height: 1;
			`;
			badge.textContent = `${failureRate}%`;
			badge.title = `${failureRate}% of evaluees chose high-risk options for this step (${evalFeedback.totalRuns} evaluations)`;

			try {
				const overlayId = overlays.add(element.id, "eval-feedback", {
					position: { bottom: -2, left: -4 },
					html: badge,
				});
				overlayIdsRef.current.push(overlayId);
			} catch {
				// Element might not support overlays
			}
		}

		return () => {
			for (const id of overlayIdsRef.current) {
				try {
					overlays.remove(id);
				} catch {
					/* cleanup */
				}
			}
			overlayIdsRef.current = [];
		};
	}, [getModeler, isReady, stepFailureMap, hasData, evalFeedback.totalRuns]);

	return null;
}

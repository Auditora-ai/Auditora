"use client";

import { useEffect, useRef, useMemo } from "react";
import type { RaciEntry } from "../../types";

interface HealthBadgeOverlayProps {
	getModeler: () => any;
	isReady: boolean;
	raciEntries: RaciEntry[];
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

export function HealthBadgeOverlay({ getModeler, isReady, raciEntries }: HealthBadgeOverlayProps) {
	const overlayIdsRef = useRef<string[]>([]);

	// Build a set of activity names that have RACI entries
	const raciNames = useMemo(() => {
		const names = new Set<string>();
		for (const entry of raciEntries) {
			names.add(entry.activityName.toLowerCase().trim());
		}
		return names;
	}, [raciEntries]);

	useEffect(() => {
		const modeler = getModeler();
		if (!modeler || !isReady) return;

		const overlays = modeler.get("overlays");
		const elementRegistry = modeler.get("elementRegistry");

		// Clean up previous overlays
		for (const id of overlayIdsRef.current) {
			try { overlays.remove(id); } catch { /* overlay may already be gone */ }
		}
		overlayIdsRef.current = [];

		// Get all elements
		const allElements = elementRegistry.getAll();

		for (const element of allElements) {
			if (!TASK_TYPES.has(element.type)) continue;

			const name = element.businessObject?.name;
			if (!name) continue;

			const hasRaci = raciNames.has(name.toLowerCase().trim());
			// Dynamic runtime color for DOM overlays — must remain as inline hex values
			const color = hasRaci ? "#16A34A" : "#DC2626";

			const badge = document.createElement("div");
			badge.style.cssText = `
				width: 8px;
				height: 8px;
				border-radius: 50%;
				background: ${color};
				border: 1.5px solid white;
				box-shadow: 0 1px 2px rgba(0,0,0,0.15);
				pointer-events: none;
			`;

			try {
				const overlayId = overlays.add(element.id, "health-badge", {
					position: { top: -4, right: -4 },
					html: badge,
				});
				overlayIdsRef.current.push(overlayId);
			} catch {
				// Element might not support overlays
			}
		}

		return () => {
			for (const id of overlayIdsRef.current) {
				try { overlays.remove(id); } catch { /* cleanup */ }
			}
			overlayIdsRef.current = [];
		};
	}, [getModeler, isReady, raciNames]);

	return null;
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { GitCompare, X } from "lucide-react";

interface ProcessVersion {
	id: string;
	version: number;
	bpmnXml: string | null;
	createdAt: string;
	sessionId?: string;
}

interface DiffResult {
	added: string[]; // element IDs added in v2
	removed: string[]; // element IDs removed from v1
	changed: string[]; // element IDs changed between versions
	layoutChanged: string[]; // elements with only layout changes
}

interface BpmnVersionDiffProps {
	versions: ProcessVersion[];
	modeler: any;
	isReady: boolean;
	visible: boolean;
}

/**
 * BpmnVersionDiff — Visual diff overlay between process versions
 *
 * Uses CSS markers to highlight:
 * - Green: added elements
 * - Red: removed elements (shown as overlay text)
 * - Amber: changed elements
 */
export function BpmnVersionDiff({
	versions,
	modeler,
	isReady,
	visible,
}: BpmnVersionDiffProps) {
	const [v1, setV1] = useState<string>("");
	const [v2, setV2] = useState<string>("");
	const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
	const [diffing, setDiffing] = useState(false);

	// Compute diff between two XML strings
	const computeDiff = useCallback(
		async (xml1: string, xml2: string) => {
			if (!modeler || !xml1 || !xml2) return;

			setDiffing(true);
			try {
				// Parse both XMLs to extract element lists
				const parser = new DOMParser();
				const doc1 = parser.parseFromString(xml1, "text/xml");
				const doc2 = parser.parseFromString(xml2, "text/xml");

				const getElements = (doc: Document) => {
					const elements = new Map<
						string,
						{ type: string; name: string }
					>();
					const nodes = doc.querySelectorAll(
						"[id]:not(definitions):not(process):not(collaboration):not(participant):not(BPMNDiagram):not(BPMNPlane):not(BPMNShape):not(BPMNEdge):not(Bounds):not(waypoint):not(laneSet):not(lane)",
					);
					for (const node of nodes) {
						const id = node.getAttribute("id");
						if (id) {
							elements.set(id, {
								type: node.tagName,
								name: node.getAttribute("name") || "",
							});
						}
					}
					return elements;
				};

				const els1 = getElements(doc1);
				const els2 = getElements(doc2);

				const added: string[] = [];
				const removed: string[] = [];
				const changed: string[] = [];

				// Find added and changed
				for (const [id, el2] of els2) {
					const el1 = els1.get(id);
					if (!el1) {
						added.push(id);
					} else if (el1.name !== el2.name || el1.type !== el2.type) {
						changed.push(id);
					}
				}

				// Find removed
				for (const id of els1.keys()) {
					if (!els2.has(id)) {
						removed.push(id);
					}
				}

				setDiffResult({ added, removed, changed, layoutChanged: [] });

				// Apply visual markers
				if (modeler && isReady) {
					const canvas = modeler.get("canvas");
					const elementRegistry = modeler.get("elementRegistry");

					for (const id of added) {
						const el = elementRegistry.get(id);
						if (el) {
							try {
								canvas.addMarker(id, "diff-added");
							} catch {}
						}
					}
					for (const id of changed) {
						const el = elementRegistry.get(id);
						if (el) {
							try {
								canvas.addMarker(id, "diff-changed");
							} catch {}
						}
					}
				}
			} catch (err) {
				console.error("[BpmnVersionDiff] Diff failed:", err);
			} finally {
				setDiffing(false);
			}
		},
		[modeler, isReady],
	);

	// Clear diff markers
	const clearDiff = useCallback(() => {
		if (!modeler || !isReady || !diffResult) return;

		const canvas = modeler.get("canvas");
		const elementRegistry = modeler.get("elementRegistry");

		for (const id of [
			...diffResult.added,
			...diffResult.changed,
		]) {
			try {
				canvas.removeMarker(id, "diff-added");
				canvas.removeMarker(id, "diff-changed");
			} catch {}
		}
		setDiffResult(null);
	}, [modeler, isReady, diffResult]);

	// Trigger diff when versions change
	useEffect(() => {
		if (!v1 || !v2 || v1 === v2) {
			clearDiff();
			return;
		}

		const ver1 = versions.find((v) => v.id === v1);
		const ver2 = versions.find((v) => v.id === v2);

		if (ver1?.bpmnXml && ver2?.bpmnXml) {
			computeDiff(ver1.bpmnXml, ver2.bpmnXml);
		}
	}, [v1, v2, versions]);

	// Cleanup on unmount
	useEffect(() => {
		return () => clearDiff();
	}, []);

	if (!visible || versions.length < 2) return null;

	return (
		<div className="absolute right-4 top-4 z-20 w-64 rounded-lg border border-border bg-card shadow-lg">
			<div className="flex items-center justify-between border-b px-3 py-2">
				<div className="flex items-center gap-2">
					<GitCompare className="h-4 w-4 text-primary" />
					<span className="text-xs font-semibold">
						Comparar versiones
					</span>
				</div>
			</div>

			<div className="px-3 py-2 space-y-2">
				<div>
					<label className="text-[10px] text-muted-foreground">
						Versión anterior
					</label>
					<select
						value={v1}
						onChange={(e) => setV1(e.target.value)}
						className="mt-0.5 w-full rounded border border-border bg-background px-2 py-1 text-xs"
					>
						<option value="">Seleccionar...</option>
						{versions.map((v) => (
							<option key={v.id} value={v.id}>
								v{v.version} —{" "}
								{new Date(v.createdAt).toLocaleDateString(
									"es-ES",
								)}
							</option>
						))}
					</select>
				</div>

				<div>
					<label className="text-[10px] text-muted-foreground">
						Versión actual
					</label>
					<select
						value={v2}
						onChange={(e) => setV2(e.target.value)}
						className="mt-0.5 w-full rounded border border-border bg-background px-2 py-1 text-xs"
					>
						<option value="">Seleccionar...</option>
						{versions.map((v) => (
							<option key={v.id} value={v.id}>
								v{v.version} —{" "}
								{new Date(v.createdAt).toLocaleDateString(
									"es-ES",
								)}
							</option>
						))}
					</select>
				</div>

				{diffing && (
					<p className="text-[10px] text-muted-foreground text-center">
						Comparando...
					</p>
				)}

				{diffResult && (
					<div className="rounded border border-border p-2 space-y-1">
						<div className="flex items-center gap-2 text-[10px]">
							<span className="h-2 w-2 rounded-full bg-green-500" />
							<span>{diffResult.added.length} agregados</span>
						</div>
						<div className="flex items-center gap-2 text-[10px]">
							<span className="h-2 w-2 rounded-full bg-amber-500" />
							<span>
								{diffResult.changed.length} modificados
							</span>
						</div>
						<div className="flex items-center gap-2 text-[10px]">
							<span className="h-2 w-2 rounded-full bg-red-500" />
							<span>
								{diffResult.removed.length} eliminados
							</span>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

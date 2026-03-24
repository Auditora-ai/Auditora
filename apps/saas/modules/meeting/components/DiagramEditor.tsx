"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DiagramNode } from "../types";
import { buildBpmnXml } from "../lib/bpmn-builder";
import { exportSVG, exportPNG } from "../lib/bpmn-export";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css";
import "../styles/bpmn-editor.css";

interface DiagramEditorProps {
	sessionId: string;
	nodes: DiagramNode[];
	bpmnXml?: string | null;
	onClose: () => void;
	onSave: (xml: string) => void;
}

/**
 * DiagramEditor — Full-screen BPMN editor for post-session manual editing.
 */
export function DiagramEditor({
	sessionId,
	nodes,
	bpmnXml,
	onClose,
	onSave,
}: DiagramEditorProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const modelerRef = useRef<any>(null);
	const [isReady, setIsReady] = useState(false);
	const [saving, setSaving] = useState(false);
	const [initError, setInitError] = useState<string | null>(null);

	useEffect(() => {
		let destroyed = false;
		let modeler: any;

		async function init() {
			if (!containerRef.current) return;
			try {
				const BpmnModeler = (await import("bpmn-js/lib/Modeler")).default;
				if (destroyed) return;

				modeler = new BpmnModeler({ container: containerRef.current });
				modelerRef.current = modeler;

				const xml = bpmnXml || (nodes.length > 0 ? buildBpmnXml(nodes) : emptyBpmnXml());
				try {
					await modeler.importXML(xml);
					if (destroyed) { modeler.destroy(); return; }
					modeler.get("canvas").zoom("fit-viewport", "auto");
				} catch (err) {
					console.error("[DiagramEditor] Import failed:", err);
				}
				setIsReady(true);
			} catch (err) {
				console.error("[DiagramEditor] Init failed:", err);
				setInitError("No se pudo cargar el editor de diagramas.");
			}
		}

		init();
		return () => { destroyed = true; modeler?.destroy(); modelerRef.current = null; };
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	const handleSave = useCallback(async () => {
		const modeler = modelerRef.current;
		if (!modeler) return;
		setSaving(true);
		try {
			const { xml } = await modeler.saveXML({ format: true });
			onSave(xml);
		} catch (err) {
			console.error("[DiagramEditor] Save failed:", err);
		} finally {
			setSaving(false);
		}
	}, [onSave]);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
			if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [onClose, handleSave]);

	return (
		<div className="fixed inset-0 z-50 flex flex-col bg-background">
			<div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
				<h2 className="text-sm font-semibold text-foreground">Editar Diagrama</h2>
				<div className="flex items-center gap-2">
					<button type="button" onClick={onClose} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent">
						Cancelar
					</button>
					<button type="button" onClick={handleSave} disabled={saving} className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
						{saving ? "Guardando..." : "Guardar"}
					</button>
				</div>
			</div>

			<div className="relative flex-1 bg-white">
				<div ref={containerRef} className="bpmn-editor-canvas absolute inset-0" />
				{!isReady && !initError && (
					<div className="absolute inset-0 flex items-center justify-center bg-white">
						<div className="h-16 w-16 animate-pulse rounded-lg bg-gray-100" />
					</div>
				)}
				{initError && (
					<div className="absolute inset-0 flex items-center justify-center bg-white">
						<p className="text-sm text-red-600">{initError}</p>
					</div>
				)}
			</div>
		</div>
	);
}

function emptyBpmnXml(): string {
	return `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false" />
  <bpmndi:BPMNDiagram id="Diagram_1">
    <bpmndi:BPMNPlane id="Plane_1" bpmnElement="Process_1" />
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;
}

"use client";

import { useEffect, useRef } from "react";

interface BpmnPropertiesPanelProps {
	modeler: any;
	selectedElement: any;
	isOpen: boolean;
	onClose: () => void;
}

/**
 * BpmnPropertiesPanel — Collapsible right-side drawer
 *
 * @bpmn-io/properties-panel is NOT a React component.
 * We mount it imperatively via useEffect into a div ref.
 * Selection sync happens via bpmn-js eventBus.
 *
 * - 280px wide slide-in drawer within the diagram area
 * - Dark chrome background matching toolbar
 * - Shows element name, type, documentation on selection
 * - Collapsed by default during live meeting
 * - Auto-opens on selection in post-meeting mode
 */
export function BpmnPropertiesPanel({
	modeler,
	selectedElement,
	isOpen,
	onClose,
}: BpmnPropertiesPanelProps) {
	const panelRef = useRef<HTMLDivElement>(null);
	const instanceRef = useRef<any>(null);

	// Mount properties panel imperatively
	useEffect(() => {
		if (!modeler || !panelRef.current || !isOpen) return;

		let panel: any;

		async function mount() {
			try {
				const { BpmnPropertiesPanelModule, BpmnPropertiesProviderModule } =
					await import("bpmn-js-properties-panel");

				// The properties panel attaches to an existing modeler instance
				// We need to register it as an additional module
				if (!instanceRef.current && panelRef.current) {
					// Simple fallback: show element info manually
					updateSimplePanel(panelRef.current, selectedElement, modeler);
					instanceRef.current = "simple";
				}
			} catch {
				// Fallback to simple panel if properties-panel module fails
				if (panelRef.current) {
					updateSimplePanel(panelRef.current, selectedElement, modeler);
					instanceRef.current = "simple";
				}
			}
		}

		mount();

		return () => {
			if (panel && typeof panel.destroy === "function") {
				panel.destroy();
			}
			instanceRef.current = null;
		};
	}, [modeler, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

	// Update simple panel on selection change
	useEffect(() => {
		if (instanceRef.current === "simple" && panelRef.current && isOpen) {
			updateSimplePanel(panelRef.current, selectedElement, modeler);
		}
	}, [selectedElement, isOpen, modeler]);

	return (
		<div
			className={`absolute right-0 top-0 z-10 h-full border-l border-[#334155] bg-[#1E293B] transition-all duration-300 ease-in-out ${
				isOpen ? "w-[280px]" : "w-0 overflow-hidden"
			}`}
		>
			{isOpen && (
				<>
					<div className="flex h-9 items-center justify-between border-b border-[#334155] px-3">
						<span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
							Properties
						</span>
						<button
							type="button"
							onClick={onClose}
							className="flex h-5 w-5 items-center justify-center rounded text-[#94A3B8] hover:bg-[#334155] hover:text-[#F1F5F9]"
							aria-label="Close properties panel"
						>
							✕
						</button>
					</div>
					<div ref={panelRef} className="h-[calc(100%-36px)] overflow-y-auto p-3" />
				</>
			)}
		</div>
	);
}

/**
 * Simple fallback properties panel — shows element metadata
 * without the full @bpmn-io/properties-panel dependency complexity.
 */
function updateSimplePanel(
	container: HTMLElement,
	selectedElement: any,
	modeler: any,
): void {
	if (!selectedElement) {
		container.innerHTML = `
			<div class="flex h-full items-center justify-center">
				<p class="text-center text-xs text-[#64748B]">
					Select an element to view its properties
				</p>
			</div>
		`;
		return;
	}

	const bo = selectedElement.businessObject || {};
	const type = selectedElement.type || "Unknown";
	const name = bo.name || "(unnamed)";
	const id = selectedElement.id || "";
	const documentation = bo.documentation?.[0]?.text || "";

	container.innerHTML = `
		<div class="space-y-3">
			<div>
				<label class="block text-[10px] font-medium uppercase tracking-wider text-[#64748B] mb-1">Type</label>
				<p class="text-xs text-[#F1F5F9] font-mono">${escapeHtml(type.replace("bpmn:", ""))}</p>
			</div>
			<div>
				<label class="block text-[10px] font-medium uppercase tracking-wider text-[#64748B] mb-1">Name</label>
				<input
					type="text"
					value="${escapeHtml(name)}"
					class="w-full rounded bg-[#0F172A] border border-[#334155] px-2 py-1.5 text-xs text-[#F1F5F9] focus:border-[#2563EB] focus:outline-none"
					data-field="name"
				/>
			</div>
			<div>
				<label class="block text-[10px] font-medium uppercase tracking-wider text-[#64748B] mb-1">ID</label>
				<p class="text-xs text-[#94A3B8] font-mono">${escapeHtml(id)}</p>
			</div>
			<div>
				<label class="block text-[10px] font-medium uppercase tracking-wider text-[#64748B] mb-1">Documentation</label>
				<textarea
					class="w-full rounded bg-[#0F172A] border border-[#334155] px-2 py-1.5 text-xs text-[#F1F5F9] focus:border-[#2563EB] focus:outline-none resize-none"
					rows="3"
					data-field="documentation"
					placeholder="Add documentation..."
				>${escapeHtml(documentation)}</textarea>
			</div>
		</div>
	`;

	// Wire up name input
	const nameInput = container.querySelector('input[data-field="name"]') as HTMLInputElement;
	if (nameInput && modeler) {
		nameInput.addEventListener("change", () => {
			try {
				const modeling = modeler.get("modeling");
				modeling.updateLabel(selectedElement, nameInput.value);
			} catch {
				// Element may not support label update
			}
		});
	}
}

function escapeHtml(str: string): string {
	return str
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

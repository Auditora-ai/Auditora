/**
 * Shared HTML/XML escaping utility
 *
 * Used by bpmn-builder.ts (XML generation) and BpmnPropertiesPanel.tsx (UI rendering).
 */
export function escapeHtml(s: string): string {
	return s
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

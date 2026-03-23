"use client";

import { useEffect } from "react";

interface KeyboardShortcutsModalProps {
	isOpen: boolean;
	onClose: () => void;
}

const SHORTCUTS = [
	{ category: "Edit", shortcuts: [
		{ keys: "Ctrl+Z", action: "Undo" },
		{ keys: "Ctrl+Y", action: "Redo" },
		{ keys: "Del", action: "Delete selected" },
		{ keys: "Ctrl+C", action: "Copy" },
		{ keys: "Ctrl+V", action: "Paste" },
		{ keys: "Ctrl+A", action: "Select all" },
	]},
	{ category: "Tools", shortcuts: [
		{ keys: "Space", action: "Hand tool (pan)" },
		{ keys: "L", action: "Lasso tool" },
		{ keys: "E", action: "Direct editing" },
	]},
	{ category: "View", shortcuts: [
		{ keys: "+", action: "Zoom in" },
		{ keys: "-", action: "Zoom out" },
		{ keys: "F", action: "Toggle fullscreen" },
		{ keys: "?", action: "Show shortcuts" },
	]},
	{ category: "Workspace", shortcuts: [
		{ keys: "Ctrl+1", action: "Transcripcion" },
		{ keys: "Ctrl+2", action: "Chat IA" },
		{ keys: "Ctrl+3", action: "Documentos" },
		{ keys: "Ctrl+4", action: "Proceso" },
	]},
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
	// Close on Escape
	useEffect(() => {
		if (!isOpen) return;
		const handler = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [isOpen, onClose]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black/50"
				onClick={onClose}
				onKeyDown={() => {}}
				role="presentation"
			/>

			{/* Modal */}
			<div className="relative w-[400px] rounded-lg border border-[#334155] bg-[#0F172A] shadow-2xl">
				<div className="flex items-center justify-between border-b border-[#334155] px-4 py-3">
					<h2 className="text-sm font-semibold text-[#F1F5F9]">Keyboard Shortcuts</h2>
					<button
						type="button"
						onClick={onClose}
						className="flex h-6 w-6 items-center justify-center rounded text-[#94A3B8] hover:bg-[#334155] hover:text-[#F1F5F9]"
						aria-label="Close"
					>
						✕
					</button>
				</div>

				<div className="max-h-[60vh] overflow-y-auto p-4">
					{SHORTCUTS.map((group) => (
						<div key={group.category} className="mb-4 last:mb-0">
							<h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
								{group.category}
							</h3>
							<div className="space-y-1.5">
								{group.shortcuts.map((s) => (
									<div key={s.keys} className="flex items-center justify-between">
										<span className="text-xs text-[#94A3B8]">{s.action}</span>
										<kbd className="rounded bg-[#1E293B] px-1.5 py-0.5 font-mono text-[10px] text-[#F1F5F9] border border-[#334155]">
											{s.keys}
										</kbd>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

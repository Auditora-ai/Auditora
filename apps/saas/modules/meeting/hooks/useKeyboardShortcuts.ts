"use client";

import { useEffect } from "react";

export type ShortcutDef = {
	key: string;
	ctrl?: boolean;
	shift?: boolean;
	handler: () => void;
	description: string;
};

/**
 * Registers global keyboard shortcuts.
 * Guards against firing inside inputs, textareas, contenteditable,
 * and bpmn-js direct-editing sessions.
 */
export function useKeyboardShortcuts(shortcuts: ShortcutDef[]) {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't fire inside inputs / textareas / contenteditable
			const target = e.target as HTMLElement;
			if (
				target.tagName === "INPUT" ||
				target.tagName === "TEXTAREA" ||
				target.isContentEditable
			) {
				// Still allow Ctrl+S even in inputs (save should always work)
				const isSave =
					(e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === "s";
				if (!isSave) return;
			}

			// Don't fire during bpmn-js direct label editing
			if (document.querySelector(".djs-direct-editing-active")) return;

			const mod = e.ctrlKey || e.metaKey;

			for (const shortcut of shortcuts) {
				if (shortcut.ctrl && !mod) continue;
				if (shortcut.shift && !e.shiftKey) continue;
				if (!shortcut.shift && e.shiftKey && shortcut.ctrl) continue;

				if (e.key === shortcut.key || e.key.toLowerCase() === shortcut.key) {
					e.preventDefault();
					shortcut.handler();
					return;
				}
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [shortcuts]);
}

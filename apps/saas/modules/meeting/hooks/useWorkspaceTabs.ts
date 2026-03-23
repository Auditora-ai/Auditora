"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type TabId = "transcript" | "chat" | "documents" | "process";

const TAB_ORDER: TabId[] = ["transcript", "chat", "documents", "process"];

interface UseWorkspaceTabsReturn {
	activeTab: TabId;
	setActiveTab: (tab: TabId) => void;
	unreadCounts: Record<TabId, number>;
	incrementUnread: (tab: TabId, count?: number) => void;
	clearUnread: (tab: TabId) => void;
}

export function useWorkspaceTabs(): UseWorkspaceTabsReturn {
	const [activeTab, setActiveTabState] = useState<TabId>("transcript");
	const [unreadCounts, setUnreadCounts] = useState<Record<TabId, number>>({
		transcript: 0,
		chat: 0,
		documents: 0,
		process: 0,
	});

	const activeTabRef = useRef(activeTab);
	activeTabRef.current = activeTab;

	const setActiveTab = useCallback((tab: TabId) => {
		setActiveTabState(tab);
		// Clear unread when switching to a tab
		setUnreadCounts((prev) => ({ ...prev, [tab]: 0 }));
	}, []);

	const incrementUnread = useCallback((tab: TabId, count = 1) => {
		// Only increment if the tab is not currently active
		if (activeTabRef.current !== tab) {
			setUnreadCounts((prev) => ({
				...prev,
				[tab]: prev[tab] + count,
			}));
		}
	}, []);

	const clearUnread = useCallback((tab: TabId) => {
		setUnreadCounts((prev) => ({ ...prev, [tab]: 0 }));
	}, []);

	// Keyboard shortcuts: Ctrl+1/2/3/4
	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (!e.ctrlKey && !e.metaKey) return;

			const num = Number.parseInt(e.key, 10);
			if (num < 1 || num > 4) return;

			// Suppress when typing in inputs
			const el = document.activeElement;
			if (
				el instanceof HTMLInputElement ||
				el instanceof HTMLTextAreaElement ||
				(el as HTMLElement)?.isContentEditable
			) {
				return;
			}

			e.preventDefault();
			const tab = TAB_ORDER[num - 1];
			if (tab) {
				setActiveTab(tab);
			}
		};

		document.addEventListener("keydown", handler);
		return () => document.removeEventListener("keydown", handler);
	}, [setActiveTab]);

	return {
		activeTab,
		setActiveTab,
		unreadCounts,
		incrementUnread,
		clearUnread,
	};
}

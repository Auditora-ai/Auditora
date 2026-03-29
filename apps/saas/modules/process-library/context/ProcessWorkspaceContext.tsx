"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface SelectedElement {
	id: string;
	type: string;
	name: string;
}

interface ProcessWorkspaceContextValue {
	selectedElement: SelectedElement | null;
	setSelectedElement: (el: SelectedElement) => void;
	clearSelection: () => void;
	sidebarCollapsed: boolean;
	toggleSidebar: () => void;
}

const ProcessWorkspaceContext = createContext<ProcessWorkspaceContextValue | null>(null);

export function ProcessWorkspaceProvider({ children }: { children: ReactNode }) {
	const [selectedElement, setSelectedElementState] = useState<SelectedElement | null>(null);
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

	const setSelectedElement = useCallback((el: SelectedElement) => {
		setSelectedElementState(el);
		// Auto-expand sidebar when element is selected
		setSidebarCollapsed(false);
	}, []);

	const clearSelection = useCallback(() => {
		setSelectedElementState(null);
	}, []);

	const toggleSidebar = useCallback(() => {
		setSidebarCollapsed((prev) => !prev);
	}, []);

	return (
		<ProcessWorkspaceContext.Provider
			value={{ selectedElement, setSelectedElement, clearSelection, sidebarCollapsed, toggleSidebar }}
		>
			{children}
		</ProcessWorkspaceContext.Provider>
	);
}

export function useProcessWorkspace() {
	const ctx = useContext(ProcessWorkspaceContext);
	if (!ctx) throw new Error("useProcessWorkspace must be used within ProcessWorkspaceProvider");
	return ctx;
}

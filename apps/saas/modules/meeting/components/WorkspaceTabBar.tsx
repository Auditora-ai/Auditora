"use client";

import {
	ScrollTextIcon,
	BotMessageSquareIcon,
	FileTextIcon,
	NetworkIcon,
} from "lucide-react";
import type { TabId } from "../hooks/useWorkspaceTabs";

const TABS: {
	id: TabId;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	shortcut: string;
}[] = [
	{ id: "transcript", label: "Transcripcion", icon: ScrollTextIcon, shortcut: "Ctrl+1" },
	{ id: "chat", label: "Chat IA", icon: BotMessageSquareIcon, shortcut: "Ctrl+2" },
	{ id: "documents", label: "Docs", icon: FileTextIcon, shortcut: "Ctrl+3" },
	{ id: "process", label: "Proceso", icon: NetworkIcon, shortcut: "Ctrl+4" },
];

interface WorkspaceTabBarProps {
	activeTab: TabId;
	onTabChange: (tab: TabId) => void;
	unreadCounts: Record<TabId, number>;
	compact?: boolean;
}

export function WorkspaceTabBar({
	activeTab,
	onTabChange,
	unreadCounts,
	compact = false,
}: WorkspaceTabBarProps) {
	return (
		<div className="flex items-center border-b border-border bg-card px-1">
			{TABS.map((tab) => {
				const Icon = tab.icon;
				const isActive = activeTab === tab.id;
				const unread = unreadCounts[tab.id];

				return (
					<button
						key={tab.id}
						type="button"
						onClick={() => onTabChange(tab.id)}
						title={`${tab.label} (${tab.shortcut})`}
						className={`
							relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors
							${isActive
								? "border-b-2 border-primary text-primary"
								: "text-muted-foreground hover:text-foreground"
							}
						`}
					>
						<Icon className="h-3.5 w-3.5 flex-shrink-0" />
						{!compact && <span>{tab.label}</span>}
						{unread > 0 && (
							<span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
								{unread > 99 ? "99+" : unread}
							</span>
						)}
					</button>
				);
			})}
		</div>
	);
}

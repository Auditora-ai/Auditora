"use client";

import { BellIcon } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@repo/ui";
import { useUnreadCount } from "@notifications/hooks/use-unread-count";
import { NotificationDropdown } from "./NotificationDropdown";

interface NotificationBellProps {
	organizationId: string | undefined;
	collapsed?: boolean;
}

export function NotificationBell({
	organizationId,
	collapsed = false,
}: NotificationBellProps) {
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const { data } = useUnreadCount(organizationId);
	const unreadCount = data?.count ?? 0;

	// Close on click outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsOpen(false);
			}
		}

		if (isOpen) {
			document.addEventListener("mousedown", handleClickOutside);
		}
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [isOpen]);

	if (!organizationId) return null;

	return (
		<div ref={containerRef} className="relative">
			{/* Bell button */}
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={cn(
					"relative flex min-h-[48px] items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-chrome-hover hover:text-foreground",
					isOpen && "bg-chrome-hover text-foreground",
					collapsed && "justify-center px-2",
				)}
				aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ""}`}
			>
				<div className="relative">
					<BellIcon className="size-4" />
					{unreadCount > 0 && (
						<span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
							{unreadCount > 9 ? "9+" : unreadCount}
						</span>
					)}
				</div>
				{!collapsed && <span>Notificaciones</span>}
			</button>

			{/* Dropdown */}
			{isOpen && (
				<div
					className={cn(
						"absolute z-50 w-96 rounded-xl border border-chrome-border bg-chrome-raised shadow-2xl",
						collapsed
							? "bottom-0 left-full ml-2"
							: "bottom-full left-0 mb-2",
					)}
				>
					<NotificationDropdown organizationId={organizationId} />
				</div>
			)}
		</div>
	);
}

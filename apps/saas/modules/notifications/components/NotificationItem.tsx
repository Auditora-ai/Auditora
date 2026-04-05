"use client";

import { cn } from "@repo/ui";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { XIcon } from "lucide-react";
import {
	getNotificationColor,
	getNotificationIcon,
} from "@notifications/lib/notification-icons";

interface NotificationItemProps {
	notification: {
		id: string;
		type: string;
		title: string;
		body: string;
		url: string;
		read: boolean;
		createdAt: string;
		actor?: {
			id: string;
			name: string;
			image: string | null;
		} | null;
	};
	onRead: (id: string) => void;
	onArchive: (id: string) => void;
}

export function NotificationItem({
	notification,
	onRead,
	onArchive,
}: NotificationItemProps) {
	const Icon = getNotificationIcon(notification.type);
	const iconColor = getNotificationColor(notification.type);
	const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
		addSuffix: true,
		locale: es,
	});

	function handleClick() {
		if (!notification.read) {
			onRead(notification.id);
		}
	}

	return (
		<div
			className={cn(
				"group flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-chrome-hover/50",
				!notification.read && "bg-chrome-hover/30 border-l-2 border-primary",
			)}
			onClick={handleClick}
			onKeyDown={(e) => e.key === "Enter" && handleClick()}
			role="button"
			tabIndex={0}
		>
			{/* Icon */}
			<div
				className={cn(
					"mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-chrome-hover",
					iconColor,
				)}
			>
				<Icon className="size-4" />
			</div>

			{/* Content */}
			<div className="min-w-0 flex-1">
			<p className="text-sm font-medium text-foreground line-clamp-1">
				{notification.title}
			</p>
			<p className="mt-0.5 text-xs text-chrome-text-secondary line-clamp-2">
				{notification.body}
				</p>
				<div className="mt-1 flex items-center gap-2">
				{notification.actor && (
					<span className="text-xs text-muted-foreground">
						{notification.actor.name}
					</span>
				)}
				<span className="text-xs text-chrome-text-muted">{timeAgo}</span>
				</div>
			</div>

			{/* Archive button */}
			<button
				type="button"
				onClick={(e) => {
					e.stopPropagation();
					onArchive(notification.id);
				}}
				className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
				aria-label="Archivar notificación"
			>
				<XIcon className="size-3.5" />
			</button>
		</div>
	);
}

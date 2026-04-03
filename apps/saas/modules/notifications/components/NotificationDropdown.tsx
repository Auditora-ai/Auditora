"use client";

import { BellIcon, CheckCheckIcon, InboxIcon } from "lucide-react";
import { useNotifications } from "@notifications/hooks/use-notifications";
import { NotificationItem } from "./NotificationItem";

interface NotificationDropdownProps {
	organizationId: string;
}

export function NotificationDropdown({
	organizationId,
}: NotificationDropdownProps) {
	const {
		notifications,
		isLoading,
		markRead,
		markAllRead,
		archive,
	} = useNotifications(organizationId);

	const hasUnread = notifications.some((n) => !n.read);

	return (
		<div className="flex flex-col max-h-[480px]">
			{/* Header */}
			<div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50">
				<h3 className="text-sm font-semibold text-slate-200">
					Notificaciones
				</h3>
				{hasUnread && (
					<button
						type="button"
						onClick={() => markAllRead()}
						className="flex items-center gap-1 text-xs text-[#00E5C0] hover:text-[#00E5C0]/80 transition-colors"
					>
						<CheckCheckIcon className="size-3.5" />
						Marcar todo como leído
					</button>
				)}
			</div>

			{/* List */}
			<div className="flex-1 overflow-y-auto">
				{isLoading ? (
					<div className="flex items-center justify-center py-12">
						<div className="size-5 animate-spin rounded-full border-2 border-slate-600 border-t-[#00E5C0]" />
					</div>
				) : notifications.length === 0 ? (
					<div className="flex flex-col items-center justify-center py-12 text-slate-500">
						<InboxIcon className="size-8 mb-2" />
						<p className="text-sm">No hay notificaciones</p>
					</div>
				) : (
					<div className="divide-y divide-slate-800/50">
						{notifications.map((notification) => (
							<NotificationItem
								key={notification.id}
								notification={{
									...notification,
									createdAt: notification.createdAt instanceof Date
										? notification.createdAt.toISOString()
										: String(notification.createdAt),
								}}
								onRead={markRead}
								onArchive={archive}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

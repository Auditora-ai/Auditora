import { archiveNotification } from "./procedures/archive";
import { countUnread } from "./procedures/count-unread";
import { listNotifications } from "./procedures/list";
import { markAllRead } from "./procedures/mark-all-read";
import { markRead } from "./procedures/mark-read";
import { getPreferences, updatePreferences } from "./procedures/preferences";

export const notificationsRouter = {
	list: listNotifications,
	countUnread,
	markRead,
	markAllRead,
	archive: archiveNotification,
	getPreferences,
	updatePreferences,
};

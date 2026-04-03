import { presenceHeartbeat } from "./procedures/presence-heartbeat";
import { getPresence } from "./procedures/get-presence";
import { acquireLock } from "./procedures/acquire-lock";
import { releaseLock } from "./procedures/release-lock";
import { addComment } from "./procedures/add-comment";
import { listComments } from "./procedures/list-comments";
import { resolveComment } from "./procedures/resolve-comment";
import { getActivityLog } from "./procedures/activity-log";

export const collaborationRouter = {
	presenceHeartbeat,
	getPresence,
	acquireLock,
	releaseLock,
	addComment,
	listComments,
	resolveComment,
	getActivityLog,
};

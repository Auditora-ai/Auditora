import { confirmChange } from "./procedures/confirm";
import { createChangeConfirmation } from "./procedures/create";
import { getChangeStatus } from "./procedures/get-status";
import { listPendingChanges } from "./procedures/list-pending";

export const changeManagementRouter = {
	create: createChangeConfirmation,
	listPending: listPendingChanges,
	confirm: confirmChange,
	getStatus: getChangeStatus,
};

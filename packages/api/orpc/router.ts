import type { RouterClient } from "@orpc/server";
import { adminRouter } from "../modules/admin/router";
import { aiRouter } from "../modules/ai/router";
import { changeManagementRouter } from "../modules/change-management/router";
import { documentsRouter } from "../modules/documents/router";
import { notificationsRouter } from "../modules/notifications/router";
import { organizationsRouter } from "../modules/organizations/router";
import { paymentsRouter } from "../modules/payments/router";
import { processesRouter } from "../modules/processes/router";
import { usersRouter } from "../modules/users/router";
import { publicProcedure } from "./procedures";

export const router = publicProcedure.router({
	admin: adminRouter,
	organizations: organizationsRouter,
	users: usersRouter,
	payments: paymentsRouter,
	ai: aiRouter,
	documents: documentsRouter,
	processes: processesRouter,
	notifications: notificationsRouter,
	changes: changeManagementRouter,
});

export type ApiRouterClient = RouterClient<typeof router>;

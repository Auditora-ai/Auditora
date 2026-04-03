import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const markAllRead = protectedProcedure
	.route({
		method: "POST",
		path: "/notifications/read-all",
		tags: ["Notifications"],
		summary: "Mark all notifications as read",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		await db.notification.updateMany({
			where: {
				recipientId: user.id,
				organizationId: input.organizationId,
				read: false,
			},
			data: { read: true, readAt: new Date() },
		});

		return { success: true };
	});

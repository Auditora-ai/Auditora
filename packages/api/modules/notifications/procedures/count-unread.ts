import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const countUnread = protectedProcedure
	.route({
		method: "GET",
		path: "/notifications/unread-count",
		tags: ["Notifications"],
		summary: "Count unread notifications",
		description: "Get count of unread notifications for badge display",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		const count = await db.notification.count({
			where: {
				recipientId: user.id,
				organizationId: input.organizationId,
				read: false,
				archived: false,
			},
		});

		return { count };
	});

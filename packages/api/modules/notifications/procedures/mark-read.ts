import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const markRead = protectedProcedure
	.route({
		method: "POST",
		path: "/notifications/{id}/read",
		tags: ["Notifications"],
		summary: "Mark notification as read",
	})
	.input(
		z.object({
			id: z.string(),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		const notification = await db.notification.findUnique({
			where: { id: input.id },
		});

		if (!notification) {
			throw new ORPCError("NOT_FOUND", { message: "Notification not found" });
		}

		if (notification.recipientId !== user.id) {
			throw new ORPCError("FORBIDDEN");
		}

		await db.notification.update({
			where: { id: input.id },
			data: { read: true, readAt: new Date() },
		});

		return { success: true };
	});

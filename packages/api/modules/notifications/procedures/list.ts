import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const listNotifications = protectedProcedure
	.route({
		method: "GET",
		path: "/notifications",
		tags: ["Notifications"],
		summary: "List notifications",
		description: "Get paginated notifications for the current user",
	})
	.input(
		z.object({
			organizationId: z.string(),
			cursor: z.string().optional(),
			limit: z.number().min(1).max(50).default(20),
			unreadOnly: z.boolean().default(false),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		const notifications = await db.notification.findMany({
			where: {
				recipientId: user.id,
				organizationId: input.organizationId,
				archived: false,
				...(input.unreadOnly ? { read: false } : {}),
				...(input.cursor ? { createdAt: { lt: new Date(input.cursor) } } : {}),
			},
			include: {
				actor: {
					select: { id: true, name: true, image: true },
				},
			},
			orderBy: { createdAt: "desc" },
			take: input.limit + 1,
		});

		const hasMore = notifications.length > input.limit;
		const items = hasMore ? notifications.slice(0, input.limit) : notifications;
		const nextCursor = hasMore
			? items[items.length - 1]?.createdAt.toISOString()
			: undefined;

		return { items, nextCursor, hasMore };
	});

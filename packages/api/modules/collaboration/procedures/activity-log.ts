import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const getActivityLog = protectedProcedure
	.route({
		method: "GET",
		path: "/collaboration/activity/{processId}",
		tags: ["Collaboration"],
		summary: "Get recent activity for a process",
	})
	.input(
		z.object({
			processId: z.string(),
			limit: z.number().min(1).max(50).default(20),
			cursor: z.string().optional(),
		}),
	)
	.handler(async ({ input }) => {
		const activities = await db.processActivityLog.findMany({
			where: {
				processId: input.processId,
				...(input.cursor ? { createdAt: { lt: new Date(input.cursor) } } : {}),
			},
			include: {
				user: {
					select: { id: true, name: true, image: true },
				},
			},
			orderBy: { createdAt: "desc" },
			take: input.limit + 1,
		});

		const hasMore = activities.length > input.limit;
		const items = hasMore ? activities.slice(0, input.limit) : activities;
		const nextCursor = hasMore
			? items[items.length - 1]?.createdAt.toISOString()
			: undefined;

		return { items, nextCursor, hasMore };
	});

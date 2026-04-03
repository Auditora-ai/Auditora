import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const getPresence = protectedProcedure
	.route({
		method: "GET",
		path: "/collaboration/presence/{processId}",
		tags: ["Collaboration"],
		summary: "Get who's currently viewing a process",
	})
	.input(
		z.object({
			processId: z.string(),
		}),
	)
	.handler(async ({ input }) => {
		const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

		// Clean up stale presence records
		await db.processPresence.deleteMany({
			where: { lastSeen: { lt: twoMinutesAgo } },
		});

		const onlineUsers = await db.processPresence.findMany({
			where: {
				processId: input.processId,
				lastSeen: { gte: twoMinutesAgo },
			},
			include: {
				user: {
					select: { id: true, name: true, image: true },
				},
			},
			orderBy: { lastSeen: "desc" },
		});

		return { onlineUsers };
	});

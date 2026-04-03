import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const presenceHeartbeat = protectedProcedure
	.route({
		method: "POST",
		path: "/collaboration/presence/heartbeat",
		tags: ["Collaboration"],
		summary: "Update user presence on a process",
	})
	.input(
		z.object({
			processId: z.string(),
			activeSection: z.string().optional(),
			activeNodeId: z.string().optional(),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		const now = new Date();

		await db.processPresence.upsert({
			where: {
				processId_userId: {
					processId: input.processId,
					userId: user.id,
				},
			},
			create: {
				processId: input.processId,
				userId: user.id,
				activeSection: input.activeSection,
				activeNodeId: input.activeNodeId,
				lastSeen: now,
			},
			update: {
				activeSection: input.activeSection,
				activeNodeId: input.activeNodeId,
				lastSeen: now,
			},
		});

		// Return current online users (seen within last 2 minutes)
		const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
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

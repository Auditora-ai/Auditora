import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const releaseLock = protectedProcedure
	.route({
		method: "POST",
		path: "/collaboration/lock/release",
		tags: ["Collaboration"],
		summary: "Release an edit lock on a process section",
	})
	.input(
		z.object({
			processId: z.string(),
			section: z.string(),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		await db.processLock.deleteMany({
			where: {
				processId: input.processId,
				section: input.section,
				lockedById: user.id,
			},
		});

		return { success: true };
	});

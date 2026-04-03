import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const acquireLock = protectedProcedure
	.route({
		method: "POST",
		path: "/collaboration/lock/acquire",
		tags: ["Collaboration"],
		summary: "Try to acquire an edit lock on a process section",
	})
	.input(
		z.object({
			processId: z.string(),
			section: z.string(),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		const now = new Date();
		const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

		// Release any expired locks first
		await db.processLock.deleteMany({
			where: { expiresAt: { lt: now } },
		});

		// Check if already locked by someone else
		const existing = await db.processLock.findUnique({
			where: {
				processId_section: {
					processId: input.processId,
					section: input.section,
				},
			},
			include: {
				lockedBy: { select: { id: true, name: true, image: true } },
			},
		});

		if (existing && existing.lockedById !== user.id) {
			throw new ORPCError("CONFLICT", {
				message: `Section "${input.section}" is locked by ${existing.lockedBy.name}`,
				data: { lockedBy: existing.lockedBy, expiresAt: existing.expiresAt },
			});
		}

		// Upsert the lock
		const lock = await db.processLock.upsert({
			where: {
				processId_section: {
					processId: input.processId,
					section: input.section,
				},
			},
			create: {
				processId: input.processId,
				section: input.section,
				lockedById: user.id,
				lockedAt: now,
				expiresAt,
			},
			update: {
				lockedById: user.id,
				lockedAt: now,
				expiresAt,
			},
		});

		return { lock: { id: lock.id, expiresAt: lock.expiresAt } };
	});

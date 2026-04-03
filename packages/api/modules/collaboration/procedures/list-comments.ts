import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const listComments = protectedProcedure
	.route({
		method: "GET",
		path: "/collaboration/comments/{processId}",
		tags: ["Collaboration"],
		summary: "List comments for a process section",
	})
	.input(
		z.object({
			processId: z.string(),
			section: z.string().optional(),
			resolved: z.boolean().optional(),
		}),
	)
	.handler(async ({ input }) => {
		const comments = await db.processComment.findMany({
			where: {
				processId: input.processId,
				...(input.section ? { section: input.section } : {}),
				...(input.resolved !== undefined ? { resolved: input.resolved } : {}),
				parentId: null, // Only top-level comments
			},
			include: {
				author: {
					select: { id: true, name: true, image: true },
				},
				replies: {
					include: {
						author: {
							select: { id: true, name: true, image: true },
						},
					},
					orderBy: { createdAt: "asc" },
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return { comments };
	});

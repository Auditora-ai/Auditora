import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const addComment = protectedProcedure
	.route({
		method: "POST",
		path: "/collaboration/comments",
		tags: ["Collaboration"],
		summary: "Add a comment to a process",
	})
	.input(
		z.object({
			processId: z.string(),
			section: z.string(),
			body: z.string().min(1).max(5000),
			nodeId: z.string().optional(),
			procedureStepId: z.string().optional(),
			parentId: z.string().optional(),
			mentions: z.array(z.string()).default([]),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		const comment = await db.processComment.create({
			data: {
				processId: input.processId,
				authorId: user.id,
				section: input.section,
				body: input.body,
				nodeId: input.nodeId,
				procedureStepId: input.procedureStepId,
				parentId: input.parentId,
				mentions: input.mentions,
			},
			include: {
				author: {
					select: { id: true, name: true, image: true },
				},
			},
		});

		// Log the activity
		await db.processActivityLog.create({
			data: {
				processId: input.processId,
				userId: user.id,
				action: "commented",
				section: input.section,
				details: { commentId: comment.id },
			},
		});

		return { comment };
	});

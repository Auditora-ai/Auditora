import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const resolveComment = protectedProcedure
	.route({
		method: "POST",
		path: "/collaboration/comments/resolve",
		tags: ["Collaboration"],
		summary: "Resolve a comment thread",
	})
	.input(
		z.object({
			commentId: z.string(),
			processId: z.string(),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		const comment = await db.processComment.update({
			where: { id: input.commentId },
			data: {
				resolved: true,
				resolvedById: user.id,
				resolvedAt: new Date(),
			},
		});

		// Log the activity
		await db.processActivityLog.create({
			data: {
				processId: input.processId,
				userId: user.id,
				action: "resolved_comment",
				section: comment.section,
				details: { commentId: comment.id },
			},
		});

		return { success: true };
	});

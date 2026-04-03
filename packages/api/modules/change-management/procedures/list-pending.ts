import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const listPendingChanges = protectedProcedure
	.route({
		method: "GET",
		path: "/changes/pending",
		tags: ["Change Management"],
		summary: "List pending change confirmations",
		description: "Get changes that the current user hasn't confirmed yet",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		const pendingResponses = await db.changeConfirmationResponse.findMany({
			where: {
				userId: user.id,
				confirmed: false,
				changeConfirmation: {
					organizationId: input.organizationId,
					status: "PENDING",
				},
			},
			include: {
				changeConfirmation: {
					include: {
						changedBy: {
							select: { id: true, name: true, image: true },
						},
						process: {
							select: { id: true, name: true },
						},
						procedure: {
							select: { id: true, title: true },
						},
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return pendingResponses.map((r) => ({
			responseId: r.id,
			...r.changeConfirmation,
		}));
	});

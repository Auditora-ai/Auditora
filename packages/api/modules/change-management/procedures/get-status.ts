import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const getChangeStatus = protectedProcedure
	.route({
		method: "GET",
		path: "/changes/{id}/status",
		tags: ["Change Management"],
		summary: "Get change confirmation status",
		description: "Get the confirmation progress for a specific change",
	})
	.input(
		z.object({
			id: z.string(),
		}),
	)
	.handler(async ({ context: { session }, input }) => {
		const change = await db.changeConfirmation.findUnique({
			where: { id: input.id },
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
				confirmations: {
					include: {
						user: {
							select: { id: true, name: true, image: true },
						},
					},
					orderBy: { createdAt: "asc" },
				},
			},
		});

		if (!change) {
			throw new ORPCError("NOT_FOUND", { message: "Change not found" });
		}

		if (change.organizationId !== session.activeOrganizationId) {
			throw new ORPCError("FORBIDDEN");
		}

		return change;
	});

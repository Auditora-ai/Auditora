import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { createNotification } from "../../notifications/lib/create-notification";

export const confirmChange = protectedProcedure
	.route({
		method: "POST",
		path: "/changes/{id}/confirm",
		tags: ["Change Management"],
		summary: "Confirm a change",
		description: "Confirm that you have reviewed the change",
	})
	.input(
		z.object({
			changeConfirmationId: z.string(),
			comment: z.string().optional(),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		// Find the response record for this user
		const response = await db.changeConfirmationResponse.findUnique({
			where: {
				changeConfirmationId_userId: {
					changeConfirmationId: input.changeConfirmationId,
					userId: user.id,
				},
			},
			include: {
				changeConfirmation: true,
			},
		});

		if (!response) {
			throw new ORPCError("NOT_FOUND", {
				message: "Change confirmation not found for this user",
			});
		}

		if (response.confirmed) {
			return { alreadyConfirmed: true };
		}

		// Update the response
		await db.changeConfirmationResponse.update({
			where: { id: response.id },
			data: {
				confirmed: true,
				confirmedAt: new Date(),
				comment: input.comment,
			},
		});

		// Increment the confirmation count
		const updated = await db.changeConfirmation.update({
			where: { id: input.changeConfirmationId },
			data: {
				totalConfirmed: { increment: 1 },
			},
		});

		// Check if all confirmations are complete
		if (updated.totalConfirmed >= updated.totalRequired) {
			await db.changeConfirmation.update({
				where: { id: input.changeConfirmationId },
				data: { status: "COMPLETED" },
			});
		}

		// Notify the change initiator that someone confirmed
		await createNotification({
			organizationId: response.changeConfirmation.organizationId,
			recipientId: response.changeConfirmation.changedById,
			actorId: user.id,
			type: "CHANGE_CONFIRMED",
			entityType: "change_request",
			entityId: input.changeConfirmationId,
			title: "Cambio confirmado",
			body: `${user.name} confirmó los cambios (${updated.totalConfirmed}/${updated.totalRequired})`,
			url: `/changes/${input.changeConfirmationId}`,
		});

		return {
			confirmed: true,
			totalConfirmed: updated.totalConfirmed,
			totalRequired: updated.totalRequired,
			isComplete: updated.totalConfirmed >= updated.totalRequired,
		};
	});

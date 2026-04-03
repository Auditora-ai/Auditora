import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";
import { createNotificationBatch } from "../../notifications/lib/create-notification";

export const createChangeConfirmation = protectedProcedure
	.route({
		method: "POST",
		path: "/changes",
		tags: ["Change Management"],
		summary: "Create a change confirmation request",
		description:
			"Trigger change confirmation flow for a process or procedure update",
	})
	.input(
		z.object({
			organizationId: z.string(),
			processId: z.string().optional(),
			procedureId: z.string().optional(),
			changeSummary: z.string(),
			changeType: z.enum([
				"PROCESS_STRUCTURE",
				"PROCEDURE_CONTENT",
				"RISK_LEVEL_CHANGE",
				"RACI_CHANGE",
			]),
			deadline: z.string().datetime().optional(),
		}),
	)
	.handler(async ({ context: { session, user }, input }) => {
		if (input.organizationId !== session.activeOrganizationId) {
			throw new ORPCError("FORBIDDEN");
		}

		// Find all organization members who need to confirm
		const members = await db.member.findMany({
			where: {
				organizationId: input.organizationId,
			},
			select: { userId: true },
		});

		// Exclude the person who made the change
		const recipientIds = members
			.map((m) => m.userId)
			.filter((id) => id !== user.id);

		if (recipientIds.length === 0) {
			return { id: null, message: "No other members to notify" };
		}

		// Create the change confirmation
		const change = await db.changeConfirmation.create({
			data: {
				organizationId: input.organizationId,
				processId: input.processId,
				procedureId: input.procedureId,
				changedById: user.id,
				changeSummary: input.changeSummary,
				changeType: input.changeType,
				totalRequired: recipientIds.length,
				deadline: input.deadline ? new Date(input.deadline) : undefined,
			},
		});

		// Create ChangeConfirmationResponse entries for each member
		await db.changeConfirmationResponse.createMany({
			data: recipientIds.map((userId) => ({
				changeConfirmationId: change.id,
				userId,
			})),
		});

		// Get entity name for notification title
		let entityName = "un proceso";
		if (input.processId) {
			const process = await db.processDefinition.findUnique({
				where: { id: input.processId },
				select: { name: true },
			});
			if (process) entityName = process.name;
		}
		if (input.procedureId) {
			const procedure = await db.procedure.findUnique({
				where: { id: input.procedureId },
				select: { title: true },
			});
			if (procedure) entityName = procedure.title;
		}

		// Create notifications for all recipients
		const orgSlug = session.activeOrganizationId;
		await createNotificationBatch(
			recipientIds.map((recipientId) => ({
				organizationId: input.organizationId,
				recipientId,
				actorId: user.id,
				type: "CHANGE_CONFIRMATION_REQUESTED" as const,
				entityType: input.processId ? "process" : "procedure",
				entityId: input.processId ?? input.procedureId ?? change.id,
				title: `Cambios en "${entityName}"`,
				body: input.changeSummary,
				url: `/changes/${change.id}`,
			})),
		);

		return change;
	});

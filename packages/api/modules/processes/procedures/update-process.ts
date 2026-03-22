import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const updateProcess = protectedProcedure
	.route({
		method: "POST",
		path: "/processes/update",
		tags: ["Processes"],
		summary: "Update process definition",
		description: "Update fields on an existing process definition",
	})
	.input(
		z.object({
			processId: z.string(),
			name: z.string().optional(),
			description: z.string().optional(),
			owner: z.string().optional(),
			goals: z.array(z.string()).optional(),
			triggers: z.array(z.string()).optional(),
			outputs: z.array(z.string()).optional(),
			processStatus: z.string().optional(),
			bpmnXml: z.string().optional(),
		}),
	)
	.handler(async ({ context: { session }, input: { processId, ...data } }) => {
		// Verify org ownership: processDefinition → architecture → project → client → organizationId
		const process = await db.processDefinition.findUnique({
			where: { id: processId },
			include: {
				architecture: {
					include: {
						project: {
							include: { client: true },
						},
					},
				},
			},
		});

		if (!process) {
			throw new ORPCError("NOT_FOUND", {
				message: "Process not found",
			});
		}

		if (
			process.architecture.project.client.organizationId !==
			session.activeOrganizationId
		) {
			throw new ORPCError("FORBIDDEN");
		}

		const updated = await db.processDefinition.update({
			where: { id: processId },
			data,
		});

		return updated;
	});

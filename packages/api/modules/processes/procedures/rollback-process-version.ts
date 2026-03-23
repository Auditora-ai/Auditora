import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const rollbackProcessVersion = protectedProcedure
	.route({
		method: "POST",
		path: "/processes/versions/rollback",
		tags: ["Processes"],
		summary: "Rollback process version",
		description:
			"Restore a process definition to the state of a specific version",
	})
	.input(
		z.object({
			processId: z.string(),
			version: z.number(),
		}),
	)
	.handler(
		async ({
			context: { session },
			input: { processId, version },
		}) => {
			// Verify org ownership
			const process = await db.processDefinition.findUnique({
				where: { id: processId },
				include: {
					architecture: {
						select: { organizationId: true },
					},
				},
			});

			if (!process) {
				throw new ORPCError("NOT_FOUND", {
					message: "Process not found",
				});
			}

			if (
				process.architecture.organizationId !==
				session.activeOrganizationId
			) {
				throw new ORPCError("FORBIDDEN");
			}

			const processVersion = await db.processVersion.findUnique({
				where: {
					processDefinitionId_version: {
						processDefinitionId: processId,
						version,
					},
				},
			});

			if (!processVersion) {
				throw new ORPCError("NOT_FOUND", {
					message: "Version not found",
				});
			}

			const updated = await db.processDefinition.update({
				where: { id: processId },
				data: {
					name: processVersion.name,
					description: processVersion.description,
					bpmnXml: processVersion.bpmnXml,
					goals: processVersion.goals,
					triggers: processVersion.triggers,
					outputs: processVersion.outputs,
				},
			});

			return updated;
		},
	);

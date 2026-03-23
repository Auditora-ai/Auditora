import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const createProcessVersion = protectedProcedure
	.route({
		method: "POST",
		path: "/processes/versions/create",
		tags: ["Processes"],
		summary: "Create process version",
		description:
			"Snapshot the current state of a process definition as a new version",
	})
	.input(
		z.object({
			processId: z.string(),
			changeNote: z.string().optional(),
		}),
	)
	.handler(
		async ({
			context: { session, user },
			input: { processId, changeNote },
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

			// Get the latest version number
			const latestVersion = await db.processVersion.findFirst({
				where: { processDefinitionId: processId },
				orderBy: { version: "desc" },
				select: { version: true },
			});

			const nextVersion = (latestVersion?.version ?? 0) + 1;

			const version = await db.processVersion.create({
				data: {
					processDefinitionId: processId,
					version: nextVersion,
					name: process.name,
					description: process.description,
					bpmnXml: process.bpmnXml,
					goals: process.goals,
					triggers: process.triggers,
					outputs: process.outputs,
					changeNote,
					createdBy: user.id,
				},
			});

			return version;
		},
	);

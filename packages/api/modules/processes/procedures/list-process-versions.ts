import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const listProcessVersions = protectedProcedure
	.route({
		method: "GET",
		path: "/processes/versions",
		tags: ["Processes"],
		summary: "List process versions",
		description:
			"List all versions of a process definition, ordered by version descending",
	})
	.input(
		z.object({
			processId: z.string(),
		}),
	)
	.handler(async ({ context: { session }, input: { processId } }) => {
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

		const versions = await db.processVersion.findMany({
			where: { processDefinitionId: processId },
			orderBy: { version: "desc" },
		});

		return versions;
	});

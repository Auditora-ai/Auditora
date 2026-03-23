import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const createProcess = protectedProcedure
	.route({
		method: "POST",
		path: "/processes",
		tags: ["Processes"],
		summary: "Create process definition",
		description: "Create a new process definition within an architecture",
	})
	.input(
		z.object({
			architectureId: z.string(),
			name: z.string(),
			level: z.enum(["PROCESS", "SUBPROCESS", "TASK", "PROCEDURE"]),
			parentId: z.string().optional(),
			description: z.string().optional(),
			owner: z.string().optional(),
			goals: z.array(z.string()).optional(),
			triggers: z.array(z.string()).optional(),
			outputs: z.array(z.string()).optional(),
		}),
	)
	.handler(async ({ context: { session }, input }) => {
		// Verify org ownership
		const architecture = await db.processArchitecture.findUnique({
			where: { id: input.architectureId },
			select: { id: true, organizationId: true },
		});

		if (!architecture) {
			throw new ORPCError("NOT_FOUND", {
				message: "Architecture not found",
			});
		}

		if (
			architecture.organizationId !==
			session.activeOrganizationId
		) {
			throw new ORPCError("FORBIDDEN");
		}

		const process = await db.processDefinition.create({
			data: {
				architectureId: input.architectureId,
				name: input.name,
				level: input.level,
				parentId: input.parentId,
				description: input.description,
				owner: input.owner,
				goals: input.goals ?? [],
				triggers: input.triggers ?? [],
				outputs: input.outputs ?? [],
			},
		});

		return process;
	});

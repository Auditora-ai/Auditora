import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const createArchitectureVersion = protectedProcedure
	.route({
		method: "POST",
		path: "/processes/architecture-versions/create",
		tags: ["Processes"],
		summary: "Create architecture version",
		description:
			"Snapshot the entire architecture tree as a new version",
	})
	.input(
		z.object({
			architectureId: z.string(),
			changeNote: z.string().optional(),
		}),
	)
	.handler(
		async ({
			context: { session, user },
			input: { architectureId, changeNote },
		}) => {
			// Verify org ownership: architecture → project → client → organizationId
			const architecture = await db.processArchitecture.findUnique({
				where: { id: architectureId },
				include: {
					project: {
						include: { client: true },
					},
					definitions: {
						include: {
							children: {
								include: {
									children: {
										include: {
											children: true,
										},
									},
								},
							},
						},
					},
				},
			});

			if (!architecture) {
				throw new ORPCError("NOT_FOUND", {
					message: "Architecture not found",
				});
			}

			if (
				architecture.project.client.organizationId !==
				session.activeOrganizationId
			) {
				throw new ORPCError("FORBIDDEN");
			}

			// Get the latest version number
			const latestVersion = await db.architectureVersion.findFirst({
				where: { architectureId },
				orderBy: { version: "desc" },
				select: { version: true },
			});

			const nextVersion = (latestVersion?.version ?? 0) + 1;

			const version = await db.architectureVersion.create({
				data: {
					architectureId,
					version: nextVersion,
					snapshot: JSON.parse(
						JSON.stringify(architecture.definitions),
					),
					changeNote,
					createdBy: user.id,
				},
			});

			return version;
		},
	);

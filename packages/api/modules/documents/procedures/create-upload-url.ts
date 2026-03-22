import { ORPCError } from "@orpc/server";
import { db } from "@repo/database";
import { getSignedUploadUrl } from "@repo/storage";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const createUploadUrl = protectedProcedure
	.route({
		method: "POST",
		path: "/documents/upload-url",
		tags: ["Documents"],
		summary: "Create document upload URL",
		description:
			"Create a signed upload URL and a Document record for uploading a file",
	})
	.input(
		z.object({
			fileName: z.string(),
			mimeType: z.string(),
			clientId: z.string().optional(),
			projectId: z.string().optional(),
		}),
	)
	.handler(
		async ({
			context: { session, user },
			input: { fileName, mimeType, clientId, projectId },
		}) => {
			// Verify org ownership through client
			if (clientId) {
				const client = await db.client.findUnique({
					where: { id: clientId },
				});

				if (!client) {
					throw new ORPCError("NOT_FOUND", {
						message: "Client not found",
					});
				}

				if (client.organizationId !== session.activeOrganizationId) {
					throw new ORPCError("FORBIDDEN");
				}
			}

			// Verify org ownership through project → client
			if (projectId) {
				const project = await db.project.findUnique({
					where: { id: projectId },
					include: { client: true },
				});

				if (!project) {
					throw new ORPCError("NOT_FOUND", {
						message: "Project not found",
					});
				}

				if (
					project.client.organizationId !==
					session.activeOrganizationId
				) {
					throw new ORPCError("FORBIDDEN");
				}
			}

			const document = await db.document.create({
				data: {
					name: fileName,
					mimeType,
					filePath: "",
					fileSize: 0,
					clientId,
					projectId,
					createdBy: user.id,
				},
			});

			const path = `${session.activeOrganizationId}/${document.id}/${fileName}`;

			const signedUploadUrl = await getSignedUploadUrl(path, {
				bucket: "documents",
			});

			await db.document.update({
				where: { id: document.id },
				data: { filePath: path },
			});

			return { signedUploadUrl, documentId: document.id };
		},
	);

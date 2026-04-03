import { db } from "@repo/database";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

export const getPreferences = protectedProcedure
	.route({
		method: "GET",
		path: "/notifications/preferences",
		tags: ["Notifications"],
		summary: "Get notification preferences",
	})
	.input(
		z.object({
			organizationId: z.string(),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		const preference = await db.notificationPreference.findUnique({
			where: {
				userId_organizationId: {
					userId: user.id,
					organizationId: input.organizationId,
				},
			},
		});

		// Return defaults if no preference exists
		if (!preference) {
			return {
				inApp: true,
				email: true,
				digestFrequency: "DAILY" as const,
				mutedTypes: [] as string[],
			};
		}

		return {
			inApp: preference.inApp,
			email: preference.email,
			digestFrequency: preference.digestFrequency,
			mutedTypes: preference.mutedTypes,
		};
	});

export const updatePreferences = protectedProcedure
	.route({
		method: "PUT",
		path: "/notifications/preferences",
		tags: ["Notifications"],
		summary: "Update notification preferences",
	})
	.input(
		z.object({
			organizationId: z.string(),
			inApp: z.boolean().optional(),
			email: z.boolean().optional(),
			digestFrequency: z
				.enum(["REALTIME", "DAILY", "WEEKLY", "NONE"])
				.optional(),
			mutedTypes: z.array(z.string()).optional(),
		}),
	)
	.handler(async ({ context: { user }, input }) => {
		const { organizationId, ...data } = input;

		const preference = await db.notificationPreference.upsert({
			where: {
				userId_organizationId: {
					userId: user.id,
					organizationId,
				},
			},
			create: {
				userId: user.id,
				organizationId,
				inApp: data.inApp ?? true,
				email: data.email ?? true,
				digestFrequency: data.digestFrequency ?? "DAILY",
				mutedTypes: data.mutedTypes ?? [],
			},
			update: {
				...(data.inApp !== undefined ? { inApp: data.inApp } : {}),
				...(data.email !== undefined ? { email: data.email } : {}),
				...(data.digestFrequency !== undefined
					? { digestFrequency: data.digestFrequency }
					: {}),
				...(data.mutedTypes !== undefined
					? { mutedTypes: data.mutedTypes }
					: {}),
			},
		});

		return preference;
	});

import { db } from "@repo/database";

interface CreateNotificationInput {
	organizationId: string;
	recipientId: string;
	actorId?: string;
	type: string;
	entityType: string;
	entityId: string;
	title: string;
	body: string;
	url: string;
}

/**
 * Core notification creation service.
 * Creates an in-app notification and respects user preferences.
 */
export async function createNotification(
	input: CreateNotificationInput,
): Promise<void> {
	// Check if recipient has muted this notification type
	const preference = await db.notificationPreference.findUnique({
		where: {
			userId_organizationId: {
				userId: input.recipientId,
				organizationId: input.organizationId,
			},
		},
	});

	// Skip if user has muted this type
	if (preference?.mutedTypes.includes(input.type)) {
		return;
	}

	// Skip if user disabled in-app notifications
	if (preference && !preference.inApp) {
		return;
	}

	// Don't notify the actor about their own action
	if (input.actorId && input.actorId === input.recipientId) {
		return;
	}

	await db.notification.create({
		data: {
			organizationId: input.organizationId,
			recipientId: input.recipientId,
			actorId: input.actorId,
			type: input.type as never,
			entityType: input.entityType,
			entityId: input.entityId,
			title: input.title,
			body: input.body,
			url: input.url,
		},
	});
}

/**
 * Create notifications for multiple recipients at once.
 */
export async function createNotificationBatch(
	inputs: CreateNotificationInput[],
): Promise<void> {
	for (const input of inputs) {
		await createNotification(input);
	}
}

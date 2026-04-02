import { getOrganizationMembership } from "@repo/database";

export class OrganizationAccessDeniedError extends Error {
	constructor(organizationId: string) {
		super(`Access denied: user is not a member of organization ${organizationId}`);
		this.name = "OrganizationAccessDeniedError";
	}
}

export async function verifyOrganizationMembership(
	organizationId: string,
	userId: string,
) {
	const membership = await getOrganizationMembership(organizationId, userId);

	if (!membership) {
		throw new OrganizationAccessDeniedError(organizationId);
	}

	return {
		organization: membership.organization,
		role: membership.role,
	};
}

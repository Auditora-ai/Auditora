/**
 * Shared auth helpers for API routes.
 *
 * Centralizes auth + org verification so every route uses the same pattern.
 */

import { NextResponse } from "next/server";
import { auth } from "@repo/auth";
import { db } from "@repo/database";
import { headers } from "next/headers";

export type AuthContext = {
	user: { id: string; name?: string | null; email?: string | null };
	org: { id: string; name?: string | null };
};

/**
 * Get the authenticated user and their active organization.
 * Returns null if not authenticated or no org found.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
	const session = await auth.api.getSession({
		headers: await headers(),
		query: { disableCookieCache: true },
	});
	if (!session?.user) return null;

	const orgs = await auth.api.listOrganizations({
		headers: await headers(),
	});
	const activeOrg = orgs?.[0];
	if (!activeOrg) return null;

	return { user: session.user, org: activeOrg };
}

/**
 * Require auth + verify session belongs to the user's org.
 * Returns { session, authCtx } or a NextResponse error.
 */
export async function requireSessionAuth(sessionId: string) {
	const authCtx = await getAuthContext();
	if (!authCtx) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const session = await db.meetingSession.findUnique({
		where: { id: sessionId },
		include: { processDefinition: true },
	});

	if (!session) {
		return NextResponse.json({ error: "Session not found" }, { status: 404 });
	}

	if (session.organizationId !== authCtx.org.id) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	return { session, authCtx };
}

/**
 * Require auth + verify process belongs to the user's org.
 * Returns { process, authCtx } or a NextResponse error.
 */
export async function requireProcessAuth(processId: string) {
	const authCtx = await getAuthContext();
	if (!authCtx) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const process = await db.processDefinition.findUnique({
		where: { id: processId },
		include: {
			architecture: { select: { organizationId: true } },
		},
	});

	if (!process) {
		return NextResponse.json({ error: "Process not found" }, { status: 404 });
	}

	if (process.architecture?.organizationId !== authCtx.org.id) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	return { process, authCtx };
}

/** Type guard: check if result is an error response */
export function isAuthError(result: unknown): result is NextResponse {
	return result instanceof NextResponse;
}

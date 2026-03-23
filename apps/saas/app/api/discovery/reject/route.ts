/**
 * Discovery Reject API
 *
 * POST /api/discovery/reject — Reject an extracted process suggestion
 * Adds the process name to the thread's rejectedProcessNames list
 * so the AI won't re-suggest it.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { auth } from "@repo/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
			query: { disableCookieCache: true },
		});
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { threadId, processName } = body;

		if (!threadId || !processName) {
			return NextResponse.json(
				{ error: "threadId and processName are required" },
				{ status: 400 },
			);
		}

		const thread = await db.discoveryThread.findUnique({
			where: { id: threadId },
			select: { rejectedProcessNames: true },
		});

		if (!thread) {
			return NextResponse.json(
				{ error: "Thread not found" },
				{ status: 404 },
			);
		}

		// Avoid duplicates
		if (!thread.rejectedProcessNames.includes(processName)) {
			await db.discoveryThread.update({
				where: { id: threadId },
				data: {
					rejectedProcessNames: {
						push: processName,
					},
				},
			});
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[Discovery Reject POST]", error);
		return NextResponse.json(
			{ error: "Failed to reject process" },
			{ status: 500 },
		);
	}
}

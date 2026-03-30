/**
 * Cron: Reset Session Credits
 *
 * Runs daily at 00:00 UTC. Resets sessionCreditsUsed to 0 for all
 * organizations whose billingCycleAnchor matches today's day-of-month.
 *
 * Secured via CRON_SECRET header to prevent unauthorized access.
 *
 * Schedule: Railway cron or external scheduler → POST /api/cron/reset-credits
 * Header: Authorization: Bearer <CRON_SECRET>
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";

export async function POST(request: NextRequest) {
	// Verify cron secret
	const authHeader = request.headers.get("authorization");
	const expectedSecret = process.env.CRON_SECRET;

	if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const now = new Date();
		const todayDay = now.getUTCDate();

		// Find all orgs whose billing cycle anchor matches today's day
		// Also include orgs with no anchor (reset on 1st of month as default)
		const orgsToReset = await db.organization.findMany({
			where: {
				sessionCreditsUsed: { gt: 0 },
			},
			select: {
				id: true,
				billingCycleAnchor: true,
			},
		});

		const resetIds: string[] = [];
		for (const org of orgsToReset) {
			const anchorDay = org.billingCycleAnchor
				? new Date(org.billingCycleAnchor).getUTCDate()
				: 1; // Default: reset on 1st of month

			if (anchorDay === todayDay) {
				resetIds.push(org.id);
			}
		}

		if (resetIds.length === 0) {
			return NextResponse.json({
				message: "No organizations to reset today",
				checked: orgsToReset.length,
				reset: 0,
			});
		}

		// Atomic batch reset
		const result = await db.organization.updateMany({
			where: { id: { in: resetIds } },
			data: { sessionCreditsUsed: 0 },
		});

		console.log(
			`[Credit Reset] Reset ${result.count} organizations on day ${todayDay}`,
		);

		return NextResponse.json({
			message: `Reset ${result.count} organizations`,
			checked: orgsToReset.length,
			reset: result.count,
		});
	} catch (error) {
		console.error("[Credit Reset] Failed:", error);
		return NextResponse.json(
			{ error: "Credit reset failed" },
			{ status: 500 },
		);
	}
}

/**
 * Web Crawl Endpoint for Radiografia
 *
 * POST — Crawl a company website, extract business context, update anonymous session
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { crawlWebsite } from "@radiografia/lib/web-crawler";
import { verifyAnonymousSession } from "@radiografia/lib/session-verify";
import {
	getClientIp,
	checkRateLimit,
	isKillSwitchActive,
} from "@radiografia/lib/rate-limit";

export async function POST(request: NextRequest) {
	if (isKillSwitchActive()) {
		return NextResponse.json(
			{ error: "Servicio temporalmente no disponible" },
			{ status: 503 },
		);
	}

	const ip = getClientIp(request);
	if (!(await checkRateLimit(ip, 3, "crawl"))) {
		return NextResponse.json(
			{
				error:
					"Has alcanzado el limite de crawls por hora. Intenta mas tarde o describe tu empresa manualmente.",
			},
			{ status: 429 },
		);
	}

	const sessionResult = await verifyAnonymousSession(request);
	if (sessionResult.error) return sessionResult.error;
	const session = sessionResult.session;

	const body = await request.json();
	const { url, description } = body as {
		url?: string;
		description?: string;
	};

	// Either URL crawl or manual description
	if (url) {
		const result = await crawlWebsite(url);

		if (!result.success) {
			return NextResponse.json(
				{
					success: false,
					error: result.error,
					fallbackNeeded: true,
				},
				{ status: 200 },
			);
		}

		await db.anonymousSession.update({
			where: { id: session.id },
			data: {
				phase: "crawl",
				sourceUrl: url,
				businessContext: result.businessContext,
			},
		});

		return NextResponse.json({
			success: true,
			pagesFound: result.pagesFound,
			contextLength: result.businessContext.split(/\s+/).length,
			summary: result.businessContext.slice(0, 200) + "...",
		});
	}

	if (description) {
		await db.anonymousSession.update({
			where: { id: session.id },
			data: {
				phase: "crawl",
				businessDescription: description,
				businessContext: description,
			},
		});

		return NextResponse.json({
			success: true,
			pagesFound: 0,
			contextLength: description.split(/\s+/).length,
			summary: description.slice(0, 200) + "...",
		});
	}

	return NextResponse.json(
		{ error: "Provide either url or description" },
		{ status: 400 },
	);
}

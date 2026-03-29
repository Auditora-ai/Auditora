/**
 * Web Crawl Endpoint for Radiografia
 *
 * POST — Crawl a company website, extract business context, update anonymous session
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { crawlWebsite } from "@radiografia/lib/web-crawler";
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
	if (!checkRateLimit(ip, 3)) {
		return NextResponse.json(
			{
				error:
					"Has alcanzado el limite de crawls por hora. Intenta mas tarde o describe tu empresa manualmente.",
			},
			{ status: 429 },
		);
	}

	const sessionToken = request.cookies.get("scan_session")?.value;
	if (!sessionToken) {
		return NextResponse.json(
			{ error: "No session found. Create one first." },
			{ status: 401 },
		);
	}

	const session = await db.anonymousSession.findUnique({
		where: { id: sessionToken },
	});

	if (!session || session.expiresAt < new Date()) {
		return NextResponse.json(
			{ error: "Session expired or not found" },
			{ status: 410 },
		);
	}

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
			where: { id: sessionToken },
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
			where: { id: sessionToken },
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

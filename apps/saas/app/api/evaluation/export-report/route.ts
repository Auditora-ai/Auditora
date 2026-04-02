import { NextResponse } from "next/server";
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { fetchHumanRiskDashboardData, fetchProgressData } from "@evaluaciones/lib/dashboard-queries";
import { generateHumanRiskReportHtml } from "../../../../lib/export/human-risk-report-generator";

async function getSession() {
	return auth.api.getSession({
		headers: await headers(),
		query: { disableCookieCache: true },
	});
}

export async function GET() {
	const session = await getSession();
	if (!session?.user)
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

	const orgs = await auth.api.listOrganizations({
		headers: await headers(),
	});
	const org = orgs?.[0];
	if (!org)
		return NextResponse.json({ error: "No organization" }, { status: 400 });

	const [data, progressData] = await Promise.all([
		fetchHumanRiskDashboardData(org.id),
		fetchProgressData(org.id),
	]);

	if (data.insufficientData) {
		return NextResponse.json(
			{ error: "Datos insuficientes para generar el reporte" },
			{ status: 400 },
		);
	}

	const html = generateHumanRiskReportHtml({
		organizationName: org.name,
		date: new Date().toLocaleDateString("es-MX", {
			year: "numeric",
			month: "long",
			day: "numeric",
		}),
		data,
		progressData,
	});

	return new NextResponse(html, {
		status: 200,
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Content-Disposition": `inline; filename="${org.name}-Riesgo-Humano.html"`,
		},
	});
}

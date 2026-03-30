import { type NextRequest, NextResponse } from "next/server";
import { verifyAnonymousSession } from "@radiografia/lib/session-verify";
import {
	generateRadiografiaReportHtml,
	type RadiografiaReportData,
} from "@radiografia/lib/radiografia-report";

export async function GET(request: NextRequest) {
	const result = await verifyAnonymousSession(request);
	if (result.error) return result.error;

	const { session } = result;

	// Parse stored data from session
	const riskResults = session.riskResults
		? (JSON.parse(session.riskResults as string) as {
				newRisks: Array<{
					title: string;
					description: string;
					riskType: string;
					severity: number;
					probability: number;
					affectedStep?: string;
					suggestedMitigations: string[];
					isOpportunity: boolean;
				}>;
				riskSummary: {
					totalRiskScore: number;
					criticalCount: number;
					highCount: number;
					topRiskArea: string;
				};
			})
		: null;

	const sipocData = session.sipocData
		? (JSON.parse(session.sipocData as string) as {
				suppliers?: string[];
				inputs?: string[];
				processSteps?: string[];
				outputs?: string[];
				customers?: string[];
			})
		: null;

	const industryData = session.industry
		? (typeof session.industry === "string"
				? JSON.parse(session.industry)
				: session.industry) as {
				industry?: string;
				selectedProcess?: { name?: string; description?: string };
			}
		: null;

	if (!riskResults) {
		return NextResponse.json(
			{ error: "No risk data available. Complete the scan first." },
			{ status: 400 },
		);
	}

	const data: RadiografiaReportData = {
		companyName: (session.businessContext as string)?.slice(0, 80) || "Empresa",
		industry: industryData?.industry || "—",
		processName: industryData?.selectedProcess?.name || "Proceso principal",
		processDescription: industryData?.selectedProcess?.description || "",
		date: new Date().toLocaleDateString("es-MX", {
			year: "numeric",
			month: "long",
			day: "numeric",
		}),
		riskScore: riskResults.riskSummary.totalRiskScore,
		criticalCount: riskResults.riskSummary.criticalCount,
		highCount: riskResults.riskSummary.highCount,
		mediumLowCount:
			riskResults.newRisks.length -
			riskResults.riskSummary.criticalCount -
			riskResults.riskSummary.highCount,
		topRiskArea: riskResults.riskSummary.topRiskArea,
		sipoc: {
			suppliers: sipocData?.suppliers || [],
			inputs: sipocData?.inputs || [],
			processSteps: sipocData?.processSteps || [],
			outputs: sipocData?.outputs || [],
			customers: sipocData?.customers || [],
		},
		risks: riskResults.newRisks,
	};

	const html = generateRadiografiaReportHtml(data);

	return new NextResponse(html, {
		headers: {
			"Content-Type": "text/html; charset=utf-8",
			"Cache-Control": "no-store",
		},
	});
}

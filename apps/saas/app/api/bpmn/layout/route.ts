/**
 * BPMN Auto-Layout API
 *
 * POST /api/bpmn/layout
 * Body: { xml: string }
 * Returns: { xml: string } with professional DI layout
 *
 * Runs bpmn-auto-layout server-side (it requires bpmn-moddle
 * which only works in Node.js, not in the browser).
 */

import { NextRequest, NextResponse } from "next/server";
import { layoutProcess } from "bpmn-auto-layout";

export async function POST(request: NextRequest) {
	try {
		const { xml } = await request.json();

		if (!xml || typeof xml !== "string") {
			return NextResponse.json(
				{ error: "xml is required" },
				{ status: 400 },
			);
		}

		let layoutedXml: string;
		try {
			layoutedXml = await layoutProcess(xml);
		} catch (err) {
			// Fallback: try without lanes
			console.warn("[BPMN Layout] Failed with lanes, retrying without:", err);
			const xmlNoLanes = xml.replace(
				/<bpmn:laneSet>[\s\S]*?<\/bpmn:laneSet>\n?/g,
				"",
			);
			try {
				layoutedXml = await layoutProcess(xmlNoLanes);
			} catch (err2) {
				console.error("[BPMN Layout] Also failed without lanes:", err2);
				return NextResponse.json(
					{ error: "Layout failed", xml },
					{ status: 422 },
				);
			}
		}

		return NextResponse.json({ xml: layoutedXml });
	} catch (error) {
		console.error("[BPMN Layout] Error:", error);
		return NextResponse.json(
			{ error: "Internal error" },
			{ status: 500 },
		);
	}
}

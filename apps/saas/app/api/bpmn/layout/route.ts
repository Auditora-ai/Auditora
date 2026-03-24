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
			// Dynamic import to avoid Turbopack bundling issues
			const mod = await import("bpmn-auto-layout");
			const layout = mod.layoutProcess || mod.default?.layoutProcess || mod.default;
			layoutedXml = await layout(xml);
		} catch (err) {
			console.warn("[BPMN Layout] Failed. XML length:", xml.length, "Error:", (err as Error).message);
			const xmlNoLanes = xml.replace(
				/<bpmn:laneSet>[\s\S]*?<\/bpmn:laneSet>\n?/g,
				"",
			);
			try {
				const mod2 = await import("bpmn-auto-layout");
				const layout2 = mod2.layoutProcess || mod2.default?.layoutProcess || mod2.default;
				layoutedXml = await layout2(xmlNoLanes);
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

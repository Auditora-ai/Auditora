/**
 * BPMN Auto-Layout API
 *
 * Runs bpmn-auto-layout via a standalone script to avoid
 * Turbopack bundling issues with bpmn-moddle.
 */

import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
	try {
		const { xml } = await request.json();

		if (!xml || typeof xml !== "string") {
			return NextResponse.json({ error: "xml is required" }, { status: 400 });
		}

		const layoutedXml = await runLayout(xml);
		return NextResponse.json({ xml: layoutedXml });
	} catch (error) {
		console.error("[BPMN Layout] Error:", (error as Error).message);
		return NextResponse.json({ error: "Layout failed" }, { status: 422 });
	}
}

async function runLayout(xml: string): Promise<string> {
	const id = randomUUID();
	const inputPath = join(tmpdir(), `bpmn-in-${id}.xml`);
	const outputPath = join(tmpdir(), `bpmn-out-${id}.xml`);

	writeFileSync(inputPath, xml, "utf-8");

	// Find the script relative to the saas app
	const scriptPath = join(process.cwd(), "scripts/bpmn-layout.mjs");

	return new Promise((resolve, reject) => {
		execFile(
			"node",
			[scriptPath, inputPath, outputPath],
			{ timeout: 10000 },
			(error, stdout, stderr) => {
				// Clean up input
				try { unlinkSync(inputPath); } catch {}

				if (error) {
					console.error("[BPMN Layout] Script error:", stderr || error.message);
					try { unlinkSync(outputPath); } catch {}
					reject(new Error(stderr || error.message));
					return;
				}

				try {
					const result = readFileSync(outputPath, "utf-8");
					unlinkSync(outputPath);
					resolve(result);
				} catch (e) {
					reject(new Error("Failed to read layout output"));
				}
			},
		);
	});
}

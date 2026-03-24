/**
 * BPMN Auto-Layout API
 *
 * Runs bpmn-auto-layout in a child process to avoid Turbopack
 * bundling issues with bpmn-moddle.
 */

import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { writeFileSync, readFileSync, unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
	try {
		const { xml } = await request.json();

		if (!xml || typeof xml !== "string") {
			return NextResponse.json({ error: "xml is required" }, { status: 400 });
		}

		const layoutedXml = await runLayoutInChildProcess(xml);
		return NextResponse.json({ xml: layoutedXml });
	} catch (error) {
		console.error("[BPMN Layout] Error:", error);
		return NextResponse.json({ error: "Layout failed", xml: "" }, { status: 422 });
	}
}

async function runLayoutInChildProcess(xml: string): Promise<string> {
	const id = randomUUID();
	const inputPath = join(tmpdir(), `bpmn-input-${id}.xml`);
	const outputPath = join(tmpdir(), `bpmn-output-${id}.xml`);

	writeFileSync(inputPath, xml, "utf-8");

	const script = `
		import { layoutProcess } from 'bpmn-auto-layout';
		import { readFileSync, writeFileSync } from 'fs';
		const xml = readFileSync('${inputPath}', 'utf-8');
		try {
			const result = await layoutProcess(xml);
			writeFileSync('${outputPath}', result, 'utf-8');
		} catch (e) {
			// Try without lanes
			const xmlNoLanes = xml.replace(/<bpmn:laneSet>[\\s\\S]*?<\\/bpmn:laneSet>\\n?/g, '');
			const result = await layoutProcess(xmlNoLanes);
			writeFileSync('${outputPath}', result, 'utf-8');
		}
	`;

	return new Promise((resolve, reject) => {
		const child = execFile(
			"node",
			["--input-type=module", "-e", script],
			{
				cwd: join(process.cwd(), "../../"), // project root for node_modules
				timeout: 10000,
			},
			(error) => {
				try {
					if (error) {
						unlinkSync(inputPath);
						reject(new Error(`Layout process failed: ${error.message}`));
						return;
					}
					const result = readFileSync(outputPath, "utf-8");
					unlinkSync(inputPath);
					unlinkSync(outputPath);
					resolve(result);
				} catch (e) {
					reject(e);
				}
			},
		);
	});
}

#!/usr/bin/env node
/**
 * BPMN Auto-Layout Script
 *
 * Usage: node scripts/bpmn-layout.mjs <input.xml> <output.xml>
 *
 * Reads BPMN XML without DI, writes XML with professional layout.
 * Runs as standalone script to avoid Turbopack/bundler issues.
 */

import { readFileSync, writeFileSync } from "fs";
import { layoutProcess } from "bpmn-auto-layout";

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
	console.error("Usage: node scripts/bpmn-layout.mjs <input.xml> <output.xml>");
	process.exit(1);
}

const xml = readFileSync(inputPath, "utf-8");

try {
	const result = await layoutProcess(xml);
	writeFileSync(outputPath, result, "utf-8");
} catch (e) {
	// Retry without lanes
	const xmlNoLanes = xml.replace(/<bpmn:laneSet>[\s\S]*?<\/bpmn:laneSet>\n?/g, "");
	try {
		const result = await layoutProcess(xmlNoLanes);
		writeFileSync(outputPath, result, "utf-8");
	} catch (e2) {
		console.error("Layout failed:", e2.message);
		// Write raw XML as fallback
		writeFileSync(outputPath, xml, "utf-8");
		process.exit(1);
	}
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { requireProcessAuth, isAuthError } from "@/lib/auth-helpers";

/**
 * Parse BPMN XML and extract elements (tasks, gateways, events)
 * with their IDs, names, and connections.
 *
 * ┌──────────────────────────────────────────────────┐
 * │ BPMN XML                                         │
 * │   ├── bpmn:task (id, name)                       │
 * │   ├── bpmn:startEvent (id, name)                 │
 * │   ├── bpmn:endEvent (id, name)                   │
 * │   ├── bpmn:exclusiveGateway (id, name)           │
 * │   ├── bpmn:parallelGateway (id, name)            │
 * │   └── bpmn:sequenceFlow (sourceRef → targetRef)  │
 * └──────────────────────────────────────────────────┘
 *              ↓ parseBpmnElements()
 * ┌──────────────────────────────────────────────────┐
 * │ ParsedElement[]                                   │
 * │   { bpmnId, type, label, connections[] }          │
 * └──────────────────────────────────────────────────┘
 */
interface ParsedElement {
	bpmnId: string;
	type: string;
	label: string;
	connections: string[];
}

function parseBpmnElements(xml: string): ParsedElement[] {
	const elements: ParsedElement[] = [];

	// Extract BPMN elements (task, gateway, event)
	const elementRegex = /<bpmn:(task|startEvent|endEvent|exclusiveGateway|parallelGateway|userTask|serviceTask|sendTask|receiveTask|manualTask|scriptTask|subProcess)\s+([^>]*?)(?:\/>|>)/g;
	let match;

	while ((match = elementRegex.exec(xml)) !== null) {
		const tag = match[1];
		const attrs = match[2];

		const idMatch = attrs.match(/id="([^"]+)"/);
		const nameMatch = attrs.match(/name="([^"]+)"/);

		if (idMatch) {
			const typeMap: Record<string, string> = {
				task: "TASK",
				userTask: "TASK",
				serviceTask: "TASK",
				sendTask: "TASK",
				receiveTask: "TASK",
				manualTask: "TASK",
				scriptTask: "TASK",
				subProcess: "TASK",
				startEvent: "START_EVENT",
				endEvent: "END_EVENT",
				exclusiveGateway: "EXCLUSIVE_GATEWAY",
				parallelGateway: "PARALLEL_GATEWAY",
			};

			elements.push({
				bpmnId: idMatch[1],
				type: typeMap[tag] || "TASK",
				label: nameMatch ? decodeXmlEntities(nameMatch[1]) : "",
				connections: [],
			});
		}
	}

	// Extract sequence flows to build connections
	const flowRegex = /<bpmn:sequenceFlow\s+[^>]*?sourceRef="([^"]+)"[^>]*?targetRef="([^"]+)"/g;
	while ((match = flowRegex.exec(xml)) !== null) {
		const sourceId = match[1];
		const targetId = match[2];
		const source = elements.find((e) => e.bpmnId === sourceId);
		if (source) {
			source.connections.push(targetId);
		}
	}

	// Also try reverse attr order (targetRef before sourceRef)
	const flowRegex2 = /<bpmn:sequenceFlow\s+[^>]*?targetRef="([^"]+)"[^>]*?sourceRef="([^"]+)"/g;
	while ((match = flowRegex2.exec(xml)) !== null) {
		const targetId = match[1];
		const sourceId = match[2];
		const source = elements.find((e) => e.bpmnId === sourceId);
		if (source && !source.connections.includes(targetId)) {
			source.connections.push(targetId);
		}
	}

	return elements;
}

function decodeXmlEntities(str: string): string {
	return str
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#10;/g, "\n")
		.replace(/&#13;/g, "\r")
		.replace(/&apos;/g, "'");
}

/**
 * Sync DiagramNode table with BPMN XML elements.
 *
 * ┌─────────────────────────────────────────────────────┐
 * │ SYNC LOGIC:                                         │
 * │                                                     │
 * │ For each element in XML:                            │
 * │   ├── Exists in DiagramNode? → update label/type    │
 * │   └── New in XML? → create as CONFIRMED             │
 * │                                                     │
 * │ For each DiagramNode in DB:                         │
 * │   ├── Still in XML? → keep                          │
 * │   ├── State=FORMING? → keep (AI suggestion pending) │
 * │   └── Not in XML + CONFIRMED? → mark REJECTED       │
 * └─────────────────────────────────────────────────────┘
 */
async function syncDiagramNodesFromXml(
	sessionId: string,
	bpmnXml: string,
) {
	const xmlElements = parseBpmnElements(bpmnXml);
	if (xmlElements.length === 0) return;

	// Get existing DiagramNodes for this session
	const existingNodes = await db.diagramNode.findMany({
		where: { sessionId },
	});

	const existingByLabel = new Map(
		existingNodes
			.filter((n) => n.label)
			.map((n) => [n.label.toLowerCase().trim(), n]),
	);

	const xmlBpmnIds = new Set(xmlElements.map((e) => e.bpmnId));

	// Process XML elements → create or update DiagramNodes
	for (const element of xmlElements) {
		if (!element.label) continue; // Skip unlabeled elements

		const labelKey = element.label.toLowerCase().trim();
		const existing = existingByLabel.get(labelKey);

		if (existing) {
			// Update existing node if type or connections changed
			if (
				existing.nodeType !== element.type ||
				existing.state === "FORMING"
			) {
				await db.diagramNode.update({
					where: { id: existing.id },
					data: {
						nodeType: element.type as any,
						label: element.label,
						state: "CONFIRMED",
						confirmedAt: existing.state === "FORMING" ? new Date() : existing.confirmedAt,
						connections: element.connections,
					},
				});
			}
			existingByLabel.delete(labelKey); // Mark as processed
		} else {
			// New element in XML that doesn't exist in DB → create as CONFIRMED
			await db.diagramNode.create({
				data: {
					sessionId,
					nodeType: element.type as any,
					label: element.label,
					state: "CONFIRMED",
					confirmedAt: new Date(),
					connections: element.connections,
					positionX: 0,
					positionY: 0,
				},
			});
		}
	}

	// DiagramNodes that were CONFIRMED but are no longer in XML → mark REJECTED
	// (user deleted them from the diagram)
	// FORMING nodes are kept — they are AI suggestions not yet added to the diagram
	for (const [, node] of existingByLabel) {
		if (node.state === "CONFIRMED") {
			await db.diagramNode.update({
				where: { id: node.id },
				data: { state: "REJECTED", rejectedAt: new Date() },
			});
		}
	}
}

/**
 * GET /api/processes/[processId]/diagram
 * Returns DiagramNodes for rebuilding the diagram from structured data.
 */
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ processId: string }> },
) {
	try {
		const { processId } = await params;

		const authResult = await requireProcessAuth(processId);
		if (isAuthError(authResult)) return authResult;

		// Find the most recent session for this process that has diagram nodes
		const meetingSession = await db.meetingSession.findFirst({
			where: { processDefinitionId: processId },
			orderBy: { createdAt: "desc" },
			select: { id: true },
		});

		if (!meetingSession) {
			return NextResponse.json({ nodes: [] });
		}

		const dbNodes = await db.diagramNode.findMany({
			where: { sessionId: meetingSession.id },
			orderBy: { confirmedAt: "asc" },
		});

		const nodes = dbNodes.map((n) => ({
			id: n.id,
			type: n.nodeType.toLowerCase(),
			label: n.label,
			state: n.state.toLowerCase() as "forming" | "confirmed" | "rejected",
			lane: n.lane || undefined,
			connections: n.connections || [],
			confidence: n.confidence,
		}));

		return NextResponse.json({ nodes });
	} catch (error) {
		console.error("[DiagramGET] Error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ processId: string }> },
) {
	try {
		const { processId } = await params;

		const authResult = await requireProcessAuth(processId);
		if (isAuthError(authResult)) return authResult;

		const { bpmnXml, sessionId } = await request.json();

		if (!bpmnXml || typeof bpmnXml !== "string") {
			return NextResponse.json(
				{ error: "bpmnXml is required" },
				{ status: 400 },
			);
		}

		// Save BPMN XML
		await db.processDefinition.update({
			where: { id: processId },
			data: { bpmnXml },
		});

		// Sync DiagramNode table from XML (bidirectional sync)
		// Only run during live sessions (when sessionId is provided)
		if (sessionId) {
			try {
				await syncDiagramNodesFromXml(sessionId, bpmnXml);
			} catch (err) {
				// Sync failure should not block the save
				console.error("[SaveProcessDiagram] Sync error (non-blocking):", err);
			}
		}

		// Auto-create version (skip during live auto-save to avoid version spam)
		if (!sessionId) {
			const process = authResult.process!;
			const lastVersion = await db.processVersion.findFirst({
				where: { processDefinitionId: processId },
				orderBy: { version: "desc" },
			});
			const nextVersion = (lastVersion?.version ?? 0) + 1;

			await db.processVersion.create({
				data: {
					processDefinitionId: processId,
					version: nextVersion,
					name: process.name,
					description: process.description,
					bpmnXml,
					goals: process.goals,
					triggers: process.triggers,
					outputs: process.outputs,
					changeNote: "Manual diagram edit",
					createdBy: authResult.authCtx.user.id,
				},
			});

			return NextResponse.json({ ok: true, version: nextVersion });
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[SaveProcessDiagram] Error:", error);
		return NextResponse.json(
			{ error: "Internal error" },
			{ status: 500 },
		);
	}
}

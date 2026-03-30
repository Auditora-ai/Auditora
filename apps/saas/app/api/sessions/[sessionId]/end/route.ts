import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import {
	createCallBotProvider,
	generateSessionSummary,
	auditProcess,
	mergeSnapshotPatch,
	KnowledgeSnapshotSchema,
} from "@repo/ai";
import { deleteSessionActivity, runPostSessionPipelines } from "../../../webhook/recall/route";
import { buildBpmnXml, layoutBpmnXml } from "@meeting/lib/bpmn-builder";
import type { DiagramNode } from "@meeting/types";
import { requireSessionAuth, isAuthError } from "@/lib/auth-helpers";
import { EXTERNAL_COST_RATES } from "@repo/ai";

type EndMode = "full" | "save_only" | "discard";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const { sessionId } = await params;

		const authResult = await requireSessionAuth(sessionId);
		if (isAuthError(authResult)) return authResult;

		// Parse body — endMode defaults to "full" for backwards compatibility
		let endMode: EndMode = "full";
		let newProcessName: string | undefined;
		try {
			const body = await request.json();
			if (body.endMode && ["full", "save_only", "discard"].includes(body.endMode)) {
				endMode = body.endMode;
			}
			if (body.newProcessName && typeof body.newProcessName === "string") {
				newProcessName = body.newProcessName.trim();
			}
		} catch {
			// No body or invalid JSON — use defaults (backwards compatible)
		}

		const session = await db.meetingSession.findUnique({
			where: { id: sessionId },
			include: {
				diagramNodes: { where: { state: { not: "REJECTED" } } },
			},
		});

		if (!session) {
			return NextResponse.json({ error: "Session not found" }, { status: 404 });
		}

		// Leave the call if bot is active (always, regardless of mode)
		if (session.recallBotId) {
			try {
				const callBot = createCallBotProvider();
				await callBot.leaveMeeting(session.recallBotId);
			} catch {
				// Bot may already have left
			}
		}

		// Clean up activity state (Redis-backed) — always
		await deleteSessionActivity(sessionId);

		// --- DISCARD MODE: cancel session, don't save anything ---
		if (endMode === "discard") {
			await db.meetingSession.update({
				where: { id: sessionId },
				data: { status: "CANCELLED", endedAt: new Date() },
			});
			return NextResponse.json({ ok: true, sessionId, endMode });
		}

		// --- FULL & SAVE_ONLY: auto-confirm forming nodes with sufficient quality ---
		// NULL confidence = human-placed node (trusted), confidence >= 0.4 = AI-generated with reasonable quality
		await db.diagramNode.updateMany({
			where: {
				sessionId,
				state: "FORMING",
				label: { not: "" },
				OR: [
					{ confidence: { gte: 0.4 } },
					{ confidence: null },
				],
			},
			data: { state: "CONFIRMED", confirmedAt: new Date() },
		});
		// Reject low-quality leftover forming nodes to prevent contamination in next session
		await db.diagramNode.updateMany({
			where: { sessionId, state: "FORMING" },
			data: { state: "REJECTED", rejectedAt: new Date() },
		});

		await db.meetingSession.update({
			where: { id: sessionId },
			data: { status: "ENDED", endedAt: new Date() },
		});

		// Log external service costs (Deepgram STT + Recall.ai) — fire-and-forget
		logExternalCosts(session).catch((err) =>
			console.error("[EndSession] External cost logging failed:", err),
		);

		// Auto-version process and architecture (blocking — critical for session continuity)
		try {
			await autoVersionOnSessionEnd(sessionId, session, newProcessName);
		} catch (err) {
			console.error("[EndSession] Auto-versioning failed:", err);
		}

		// --- FULL MODE ONLY: generate deliverables ---
		if (endMode === "full") {
			// Generate session summary async (non-blocking)
			generateSummaryInBackground(sessionId, session.type, session.organizationId).catch((err) =>
				console.error("[EndSession] Summary generation failed:", err),
			);

			// Trigger Process Intelligence audit (non-blocking)
			if (session.processDefinitionId) {
				triggerIntelligenceAudit(session.processDefinitionId, sessionId).catch(
					(err) =>
						console.error("[EndSession] Intelligence audit failed:", err),
				);
			}

			// Generate session deliverables (summary, process audit, RACI, risk audit) — non-blocking
			runPostSessionPipelines(sessionId, session.diagramNodes).catch((err) =>
				console.error("[EndSession] Post-session pipelines failed:", err),
			);
		}

		return NextResponse.json({ ok: true, sessionId, endMode });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		console.error("[EndSession] Error:", message, error);
		return NextResponse.json({ error: "Internal error", detail: message }, { status: 500 });
	}
}

async function autoVersionOnSessionEnd(
	sessionId: string,
	session: any,
	newProcessName?: string,
) {
	// If targeting a specific process, create a ProcessVersion
	if (session.processDefinitionId) {
		await versionExistingProcess(sessionId, session);
	} else {
		// No process linked — create a new ProcessDefinition from session data
		await createProcessFromSession(sessionId, session, newProcessName);
	}

	// For DISCOVERY sessions: create an ArchitectureVersion snapshot
	if (session.type === "DISCOVERY") {
		const architecture = await db.processArchitecture.findUnique({
			where: { organizationId: session.organizationId },
			include: { definitions: true },
		});

		if (architecture) {
			const lastArchVersion = await db.architectureVersion.findFirst({
				where: { architectureId: architecture.id },
				orderBy: { version: "desc" },
			});
			const nextVersion = (lastArchVersion?.version ?? 0) + 1;

			await db.architectureVersion.create({
				data: {
					architectureId: architecture.id,
					version: nextVersion,
					snapshot: architecture.definitions as any,
					changeNote: `Auto-saved after discovery session ${sessionId}`,
					createdBy: session.userId,
				},
			});

			console.log(`[EndSession] Created ArchitectureVersion v${nextVersion}`);
		}
	}
}

async function versionExistingProcess(sessionId: string, session: any) {
	const processDef = await db.processDefinition.findUnique({
		where: { id: session.processDefinitionId },
	});
	if (!processDef) return;

	const confirmedNodes = await db.diagramNode.findMany({
		where: { sessionId, state: "CONFIRMED" },
	});

	const finalBpmnXml = await resolveBpmnXml(sessionId, confirmedNodes, processDef.bpmnXml);

	// Save BPMN XML to ProcessDefinition
	await db.processDefinition.update({
		where: { id: processDef.id },
		data: {
			bpmnXml: finalBpmnXml,
			processStatus: "MAPPED",
		},
	});

	// Get next version number
	const lastVersion = await db.processVersion.findFirst({
		where: { processDefinitionId: processDef.id },
		orderBy: { version: "desc" },
	});
	const nextVersion = (lastVersion?.version ?? 0) + 1;

	await db.processVersion.create({
		data: {
			processDefinitionId: processDef.id,
			version: nextVersion,
			name: processDef.name,
			description: processDef.description,
			bpmnXml: finalBpmnXml,
			goals: processDef.goals,
			triggers: processDef.triggers,
			outputs: processDef.outputs,
			changeNote: `Auto-saved after session ${sessionId}`,
			createdBy: session.userId,
		},
	});

	console.log(`[EndSession] Saved BPMN XML (${confirmedNodes.length} nodes) to process "${processDef.name}" v${nextVersion}`);
}

async function createProcessFromSession(
	sessionId: string,
	session: any,
	newProcessName?: string,
) {
	const confirmedNodes = await db.diagramNode.findMany({
		where: { sessionId, state: "CONFIRMED" },
	});

	// Need at least some nodes to create a process
	if (confirmedNodes.length === 0) {
		console.log(`[EndSession] No confirmed nodes for session ${sessionId}, skipping process creation`);
		return;
	}

	const finalBpmnXml = await resolveBpmnXml(sessionId, confirmedNodes, null);

	// Get or create ProcessArchitecture for the organization
	let architecture = await db.processArchitecture.findUnique({
		where: { organizationId: session.organizationId },
	});

	if (!architecture) {
		architecture = await db.processArchitecture.create({
			data: { organizationId: session.organizationId },
		});
	}

	const processName = newProcessName || session.title || "Proceso sin nombre";

	// Create the ProcessDefinition
	const newProcess = await db.processDefinition.create({
		data: {
			architectureId: architecture.id,
			name: processName,
			processStatus: "MAPPED",
			bpmnXml: finalBpmnXml,
			category: "core",
			level: "PROCESS",
		},
	});

	// Create first ProcessVersion
	await db.processVersion.create({
		data: {
			processDefinitionId: newProcess.id,
			version: 1,
			name: processName,
			bpmnXml: finalBpmnXml,
			changeNote: `Created from session ${sessionId}`,
			createdBy: session.userId,
		},
	});

	// Link session to the new process
	await db.meetingSession.update({
		where: { id: sessionId },
		data: { processDefinitionId: newProcess.id },
	});

	console.log(`[EndSession] Created new process "${processName}" from session ${sessionId}`);
}

/** Resolve the best BPMN XML: session's saved XML > generated from nodes > fallback */
async function resolveBpmnXml(
	sessionId: string,
	confirmedNodes: any[],
	fallbackXml: string | null,
): Promise<string | null> {
	// Priority 1: Session's rendered XML (from bpmn-js modeler)
	const sessionData = await db.meetingSession.findUnique({
		where: { id: sessionId },
		select: { bpmnXml: true },
	});

	if (sessionData?.bpmnXml) {
		console.log(`[EndSession] Using session's saved BPMN XML (from modeler)`);
		return sessionData.bpmnXml;
	}

	// Priority 2: Generate from confirmed nodes
	if (confirmedNodes.length > 0) {
		try {
			const diagramNodes: DiagramNode[] = confirmedNodes.map((n) => ({
				id: n.id,
				type: n.nodeType.toLowerCase(),
				label: n.label,
				state: "confirmed" as const,
				lane: n.lane || undefined,
				connections: n.connections || [],
				confidence: n.confidence,
			}));
			const xml = await buildBpmnXml(diagramNodes);
			console.log(`[EndSession] Generated BPMN XML from ${confirmedNodes.length} nodes`);
			return xml;
		} catch (err) {
			console.error("[EndSession] Failed to build BPMN XML:", err);
		}
	}

	// Priority 3: fallback
	return fallbackXml;
}

async function generateSummaryInBackground(
	sessionId: string,
	sessionType: string,
	organizationId: string,
) {
	const [nodes, transcriptEntries] = await Promise.all([
		db.diagramNode.findMany({
			where: { sessionId, state: "CONFIRMED" },
		}),
		db.transcriptEntry.findMany({
			where: { sessionId },
			orderBy: { timestamp: "asc" },
		}),
	]);

	const result = await generateSessionSummary(
		organizationId,
		sessionType,
		nodes.map((n) => ({
			id: n.id,
			type: n.nodeType,
			label: n.label,
			lane: n.lane || undefined,
		})),
		transcriptEntries.map((e) => ({
			speaker: e.speaker,
			text: e.text,
			timestamp: e.timestamp,
		})),
	);

	await db.sessionSummary.upsert({
		where: { sessionId },
		create: {
			sessionId,
			summary: result.summary,
			actionItems: result.actionItems,
		},
		update: {
			summary: result.summary,
			actionItems: result.actionItems,
		},
	});
}

async function triggerIntelligenceAudit(
	processDefinitionId: string,
	sessionId: string,
) {
	// Fetch or create intelligence record
	let intelligence = await db.processIntelligence.findFirst({
		where: { processDefinitionId },
	});

	if (!intelligence) {
		intelligence = await db.processIntelligence.create({
			data: { processDefinitionId },
		});
	}

	const isInitial = !intelligence.lastAuditAt;

	// Fetch process + session data
	const processDef = await db.processDefinition.findUnique({
		where: { id: processDefinitionId },
		include: {
			architecture: {
				include: {
					organization: { select: { industry: true } },
					definitions: {
						select: { name: true },
						where: { id: { not: processDefinitionId } },
						take: 10,
					},
				},
			},
		},
	});

	if (!processDef) return;

	// Fetch session-specific data
	const [summary, confirmedNodes, transcriptEntries] = await Promise.all([
		db.sessionSummary.findUnique({ where: { sessionId } }),
		db.diagramNode.findMany({
			where: { sessionId, state: "CONFIRMED" },
			select: { label: true, nodeType: true, lane: true, state: true },
		}),
		db.transcriptEntry.findMany({
			where: { sessionId },
			orderBy: { timestamp: "desc" },
			take: 50,
		}),
	]);

	// Fetch existing open items
	const openItems = await db.intelligenceItem.findMany({
		where: { intelligenceId: intelligence.id, status: "OPEN" },
		select: { id: true, question: true, category: true },
	});

	const existingSnapshot = KnowledgeSnapshotSchema.parse(
		intelligence.knowledgeSnapshot,
	);

	const result = await auditProcess({
		organizationId: processDef.architecture?.organizationId || "",
		mode: isInitial ? "initial" : "incremental",
		knowledgeSnapshot: existingSnapshot,
		confidenceScores:
			(intelligence.confidenceScores as Record<string, number>) ?? {},
		processDefinition: {
			name: processDef.name,
			description: processDef.description ?? undefined,
			level: processDef.level,
			goals: processDef.goals,
			triggers: processDef.triggers,
			outputs: processDef.outputs,
			owner: processDef.owner ?? undefined,
			bpmnNodeCount: confirmedNodes.length,
			confirmedNodeCount: confirmedNodes.length,
		},
		newData: {
			sessionSummaries: summary
				? [
						{
							sessionId,
							summary: summary.summary,
							actionItems: summary.actionItems,
						},
					]
				: undefined,
			diagramNodes: confirmedNodes.map((n) => ({
				label: n.label,
				type: n.nodeType,
				lane: n.lane ?? undefined,
				state: n.state,
			})),
			transcriptExcerpts: [
				{
					sessionId,
					text: transcriptEntries
						.map((t) => `${t.speaker}: ${t.text}`)
						.join("\n")
						.substring(0, 2000),
				},
			],
		},
		organizationContext: processDef.architecture
			? {
					industry:
						processDef.architecture.organization?.industry ?? undefined,
					siblingProcessNames: processDef.architecture.definitions.map(
						(d) => d.name,
					),
				}
			: undefined,
		existingOpenItems: openItems,
	});

	// Apply delta
	const mergedSnapshot = mergeSnapshotPatch(
		existingSnapshot,
		result.snapshotPatch,
	);

	await db.processIntelligence.update({
		where: { id: intelligence.id },
		data: {
			knowledgeSnapshot: mergedSnapshot as any,
			confidenceScores: result.updatedScores,
			completenessScore: result.completenessScore,
			lastAuditAt: new Date(),
			version: { increment: 1 },
		},
	});

	// Create new items
	const VALID_CATEGORIES = new Set([
		"MISSING_PATH", "MISSING_ROLE", "MISSING_EXCEPTION", "MISSING_DECISION",
		"MISSING_TRIGGER", "MISSING_OUTPUT", "CONTRADICTION", "UNCLEAR_HANDOFF",
		"MISSING_SLA", "MISSING_SYSTEM", "GENERAL_GAP",
	]);

	if (result.newGaps.length > 0) {
		await db.intelligenceItem.createMany({
			data: result.newGaps.map((gap) => ({
				intelligenceId: intelligence!.id,
				category: (VALID_CATEGORIES.has(gap.category) ? gap.category : "GENERAL_GAP") as any,
				question: gap.question,
				context: gap.context || null,
				priority: gap.priority,
				dependsOn: gap.dependsOn,
				sourceType: "session_end",
				sourceId: sessionId,
				status: "OPEN" as const,
			})),
		});
	}

	// Resolve items
	if (result.resolvedGapIds.length > 0) {
		await db.intelligenceItem.updateMany({
			where: {
				id: { in: result.resolvedGapIds },
				intelligenceId: intelligence.id,
			},
			data: {
				status: "RESOLVED",
				resolvedAt: new Date(),
				resolvedBy: `session:${sessionId}`,
			},
		});
	}

	// Log audit
	await db.intelligenceAuditLog.create({
		data: {
			intelligenceId: intelligence.id,
			triggerType: "session_end",
			triggerId: sessionId,
			delta: {
				newGaps: result.newGaps.length,
				resolved: result.resolvedGapIds.length,
			},
			completenessScore: result.completenessScore,
		},
	});

	console.log(
		`[Intelligence] Audit complete for process "${processDef.name}": ${result.completenessScore}% complete, ${result.newGaps.length} new gaps, ${result.resolvedGapIds.length} resolved`,
	);
}

async function logExternalCosts(session: {
	id: string;
	organizationId: string;
	startedAt: Date | null;
	endedAt: Date | null;
	recallBotId: string | null;
}) {
	const startedAt = session.startedAt ?? session.endedAt;
	const endedAt = session.endedAt ?? new Date();
	if (!startedAt) return;

	const durationMinutes = (endedAt.getTime() - startedAt.getTime()) / 60_000;
	if (durationMinutes <= 0) return;

	const costs = [
		{
			service: "deepgram-stt",
			unitType: "audio_minutes",
			units: durationMinutes,
			estimatedCostUsd: durationMinutes * EXTERNAL_COST_RATES["deepgram-stt"],
		},
		...(session.recallBotId
			? [
					{
						service: "recall-bot",
						unitType: "bot_minutes",
						units: durationMinutes,
						estimatedCostUsd:
							durationMinutes * EXTERNAL_COST_RATES["recall-bot"],
					},
				]
			: []),
	];

	await db.externalCostLog.createMany({
		data: costs.map((c) => ({
			organizationId: session.organizationId,
			service: c.service,
			unitType: c.unitType,
			units: c.units,
			estimatedCostUsd: c.estimatedCostUsd,
			metadata: { sessionId: session.id },
		})),
	});

	console.log(
		`[EndSession] Logged external costs: ${costs.map((c) => `${c.service}=${c.units.toFixed(1)}min/$${c.estimatedCostUsd.toFixed(3)}`).join(", ")}`,
	);
}

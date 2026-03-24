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
import { buildBpmnXml } from "@meeting/lib/bpmn-builder";
import type { DiagramNode } from "@meeting/types";

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const { sessionId } = await params;

		const session = await db.meetingSession.findUnique({
			where: { id: sessionId },
			include: {
				diagramNodes: { where: { state: { not: "REJECTED" } } },
			},
		});

		if (!session) {
			return NextResponse.json({ error: "Session not found" }, { status: 404 });
		}

		// Auto-confirm all forming nodes
		await db.diagramNode.updateMany({
			where: { sessionId, state: "FORMING" },
			data: { state: "CONFIRMED", confirmedAt: new Date() },
		});

		// Leave the call if bot is active
		if (session.recallBotId) {
			try {
				const callBot = createCallBotProvider();
				await callBot.leaveMeeting(session.recallBotId);
			} catch {
				// Bot may already have left
			}
		}

		// Mark session as ended
		await db.meetingSession.update({
			where: { id: sessionId },
			data: { status: "ENDED", endedAt: new Date() },
		});

		// Clean up activity state (Redis-backed)
		await deleteSessionActivity(sessionId);

		// Auto-version process and architecture (non-blocking)
		autoVersionOnSessionEnd(sessionId, session).catch((err) =>
			console.error("[EndSession] Auto-versioning failed:", err),
		);

		// Generate session summary async (non-blocking)
		generateSummaryInBackground(sessionId, session.type).catch((err) =>
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

		return NextResponse.json({ ok: true, sessionId });
	} catch (error) {
		console.error("[EndSession] Error:", error);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}

async function autoVersionOnSessionEnd(
	sessionId: string,
	session: any,
) {
	// If targeting a specific process, create a ProcessVersion
	if (session.processDefinitionId) {
		const processDef = await db.processDefinition.findUnique({
			where: { id: session.processDefinitionId },
		});
		if (processDef) {
			// Generate BPMN XML from the session's confirmed nodes
			const confirmedNodes = await db.diagramNode.findMany({
				where: { sessionId, state: "CONFIRMED" },
			});

			let finalBpmnXml = processDef.bpmnXml; // fallback to existing

			if (confirmedNodes.length > 0) {
				const diagramNodes: DiagramNode[] = confirmedNodes.map((n) => ({
					id: n.id,
					type: n.nodeType.toLowerCase(),
					label: n.label,
					state: "confirmed" as const,
					lane: n.lane || undefined,
					connections: n.connections || [],
					confidence: n.confidence,
				}));

				try {
					finalBpmnXml = buildBpmnXml(diagramNodes);
				} catch (err) {
					console.error("[EndSession] Failed to build BPMN XML from nodes:", err);
				}
			}

			// Also check if session has saved XML (from manual editing)
			const sessionData = await db.meetingSession.findUnique({
				where: { id: sessionId },
				select: { bpmnXml: true },
			});
			if (sessionData?.bpmnXml) {
				finalBpmnXml = sessionData.bpmnXml;
			}

			// Save BPMN XML to ProcessDefinition (this is the critical missing step)
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

async function generateSummaryInBackground(
	sessionId: string,
	sessionType: string,
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

/**
 * AI Interview Complete Endpoint
 *
 * POST /api/sessions/interview/[sessionId]/complete
 *
 * Triggers the batch pipeline: auditProcess → extractProcess → buildBpmn → auditRisks
 * Runs asynchronously with progress tracked via Redis.
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import {
	auditProcess,
	auditRisks,
	extractProcessUpdates,
	buildSessionContext,
	KnowledgeSnapshotSchema,
} from "@repo/ai";
import type { KnowledgeSnapshot } from "@repo/ai";
import { auth } from "@repo/auth";
import { sendEmail } from "@repo/mail";
import { headers } from "next/headers";
import { buildBpmnXml } from "@meeting/lib/bpmn-builder";
import type { DiagramNode } from "@meeting/types";
import type { ChatMessage } from "@ai-interview/lib/interview-types";
import { setInterviewProgress, type InterviewProgress } from "./progress";

async function getAuthContext() {
	const session = await auth.api.getSession({
		headers: await headers(),
		query: { disableCookieCache: true },
	});
	if (!session?.user) return null;

	const orgs = await auth.api.listOrganizations({
		headers: await headers(),
	});
	const activeOrg = orgs?.[0];
	if (!activeOrg) return null;

	return { user: session.user, org: activeOrg };
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ sessionId: string }> },
) {
	try {
		const authCtx = await getAuthContext();
		if (!authCtx) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { sessionId } = await params;

		// Fetch session and verify ownership
		const session = await db.meetingSession.findUnique({
			where: { id: sessionId },
			include: {
				processDefinition: true,
				organization: {
					select: { id: true, name: true, industry: true },
				},
				diagramNodes: true,
			},
		});

		if (!session) {
			return NextResponse.json({ error: "Session not found" }, { status: 404 });
		}

		if (session.organizationId !== authCtx.org.id) {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}

		if (session.type !== "AI_INTERVIEW") {
			return NextResponse.json(
				{ error: "This endpoint is only for AI Interview sessions" },
				{ status: 400 },
			);
		}

		const conversationLog = (session.conversationLog as unknown as ChatMessage[]) || [];
		if (conversationLog.length < 2) {
			return NextResponse.json(
				{ error: "At least one exchange is required before generating results" },
				{ status: 400 },
			);
		}

		// Set initial progress
		await setInterviewProgress(sessionId, { status: "processing", step: "knowledge", progress: 0 });

		// Fire and forget the batch pipeline
		runBatchPipeline(sessionId, session, conversationLog, authCtx.user.id).catch((err) => {
			console.error("[AI Interview Complete] Pipeline error:", err);
			setInterviewProgress(sessionId, {
				status: "error",
				error: err instanceof Error ? err.message : "Pipeline failed",
			}).catch(() => {});
		});

		return NextResponse.json({ status: "processing" });
	} catch (error) {
		console.error("[AI Interview Complete] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

async function runBatchPipeline(
	sessionId: string,
	session: any,
	conversationLog: ChatMessage[],
	userId: string,
) {
	const processName = session.processDefinition?.name || "Proceso";
	const processLevel = session.processDefinition?.level || "L2";

	// Convert conversation to transcript format (full, no window)
	const fullTranscript = conversationLog.map((msg, i) => ({
		speaker: msg.role === "user" ? "Director" : "Consultor IA",
		text: msg.content,
		timestamp: i * 30,
	}));

	// Step 1: Build KnowledgeSnapshot
	await setInterviewProgress(sessionId, { status: "processing", step: "knowledge", progress: 20 });

	const emptySnapshot: KnowledgeSnapshot = KnowledgeSnapshotSchema.parse({});
	let knowledgeSnapshot = emptySnapshot;

	try {
		const auditResult = await auditProcess({
			organizationId: session.organizationId,
			mode: "initial",
			knowledgeSnapshot: emptySnapshot,
			confidenceScores: {},
			processDefinition: {
				name: processName,
				level: processLevel,
				goals: session.sessionGoals ? [session.sessionGoals] : [],
				triggers: [],
				outputs: [],
				bpmnNodeCount: 0,
				confirmedNodeCount: 0,
			},
			newData: {
				chatMessages: conversationLog.map((m) => ({
					threadId: sessionId,
					content: `${m.role === "user" ? "Director" : "Consultor IA"}: ${m.content}`,
				})),
			},
		});

		knowledgeSnapshot = KnowledgeSnapshotSchema.parse({
			...emptySnapshot,
			...auditResult.snapshotPatch,
		});

		// Persist knowledge snapshot to session
		await db.meetingSession.update({
			where: { id: sessionId },
			data: { knowledgeSnapshot: knowledgeSnapshot as any },
		});
	} catch (err) {
		console.warn("[AI Interview] Knowledge audit failed (continuing):", err);
	}

	// Step 2: Extract BPMN nodes from full conversation
	await setInterviewProgress(sessionId, { status: "processing", step: "diagram", progress: 40 });

	const context = await buildSessionContext(sessionId);

	const extraction = await extractProcessUpdates(
		session.organizationId,
		[], // Empty — fresh diagram
		fullTranscript,
		context,
	);

	if (!extraction.newNodes || extraction.newNodes.length === 0) {
		await setInterviewProgress(sessionId, {
			status: "error",
			error: "No se pudieron extraer nodos del diagrama. Intenta de nuevo.",
		});
		return;
	}

	// Persist diagram nodes
	const typeMap: Record<string, string> = {
		startEvent: "START_EVENT",
		endEvent: "END_EVENT",
		task: "TASK",
		userTask: "USER_TASK",
		serviceTask: "SERVICE_TASK",
		manualTask: "MANUAL_TASK",
		exclusiveGateway: "EXCLUSIVE_GATEWAY",
		parallelGateway: "PARALLEL_GATEWAY",
		subProcess: "SUBPROCESS",
		timerEvent: "TIMER_EVENT",
		messageEvent: "MESSAGE_EVENT",
		textAnnotation: "TEXT_ANNOTATION",
		dataObject: "DATA_OBJECT",
		businessRuleTask: "BUSINESS_RULE_TASK",
		signalEvent: "SIGNAL_EVENT",
		conditionalEvent: "CONDITIONAL_EVENT",
	};

	type NodeTypeEnum = "START_EVENT" | "END_EVENT" | "TASK" | "USER_TASK" | "SERVICE_TASK" | "MANUAL_TASK" | "EXCLUSIVE_GATEWAY" | "PARALLEL_GATEWAY" | "SUBPROCESS" | "TIMER_EVENT" | "MESSAGE_EVENT" | "TEXT_ANNOTATION" | "DATA_OBJECT" | "BUSINESS_RULE_TASK" | "SIGNAL_EVENT" | "CONDITIONAL_EVENT";

	// Create a mapping from AI node IDs to DB node IDs
	const aiToDbIdMap = new Map<string, string>();

	const dbNodes = await Promise.all(
		extraction.newNodes.map(async (node, i) => {
			const created = await db.diagramNode.create({
				data: {
					sessionId,
					nodeType: (typeMap[node.type] ?? "TASK") as NodeTypeEnum,
					label: node.label,
					lane: node.lane || undefined,
					state: "CONFIRMED",
					confidence: node.confidence || 0.8,
					positionX: 250 * (i % 5),
					positionY: 150 * Math.floor(i / 5),
					connections: [],
					properties: node.properties ? (node.properties as any) : undefined,
				},
			});
			aiToDbIdMap.set(node.id, created.id);
			return created;
		}),
	);

	// Wire connections using the ID mapping
	for (const node of extraction.newNodes) {
		const dbId = aiToDbIdMap.get(node.id);
		if (!dbId) continue;

		const connections: string[] = [];
		if (node.connectTo) {
			const targetDbId = aiToDbIdMap.get(node.connectTo);
			if (targetDbId) connections.push(targetDbId);
		}
		if (node.connectFrom) {
			// connectFrom means another node connects TO this one
			const sourceDbId = aiToDbIdMap.get(node.connectFrom);
			if (sourceDbId) {
				await db.diagramNode.update({
					where: { id: sourceDbId },
					data: {
						connections: {
							push: dbId,
						},
					},
				});
			}
		}
		if (connections.length > 0) {
			await db.diagramNode.update({
				where: { id: dbId },
				data: { connections },
			});
		}
	}

	// Step 3: Build BPMN XML
	await setInterviewProgress(sessionId, { status: "processing", step: "layout", progress: 60 });

	const allNodes = await db.diagramNode.findMany({
		where: { sessionId },
	});

	const diagramNodes: DiagramNode[] = allNodes.map((n) => ({
		id: n.id,
		type: n.nodeType.toLowerCase(),
		label: n.label,
		state: "confirmed" as const,
		lane: n.lane || undefined,
		connections: n.connections || [],
		connectionLabels: n.connectionLabels || [],
		confidence: n.confidence,
	}));

	let bpmnXml: string;
	try {
		bpmnXml = await buildBpmnXml(diagramNodes);
	} catch (err) {
		console.warn("[AI Interview] BPMN XML build failed:", err);
		bpmnXml = "";
	}

	await db.meetingSession.update({
		where: { id: sessionId },
		data: { bpmnXml },
	});

	// Step 4: Risk Audit
	await setInterviewProgress(sessionId, { status: "processing", step: "risks", progress: 80 });

	let riskSummary = { totalRiskScore: 0, criticalCount: 0, highCount: 0, topRiskArea: "" };
	let newRisks: any[] = [];

	try {
		const riskResult = await auditRisks({
			organizationId: session.organizationId,
			mode: "full",
			processDefinition: {
				name: processName,
				level: processLevel,
				goals: session.sessionGoals ? [session.sessionGoals] : [],
			},
			knowledgeSnapshot,
			intelligenceItems: [],
			existingRisks: [],
			transcriptExcerpts: conversationLog
				.filter((m) => m.role === "user")
				.map((m) => ({ text: m.content })),
		});

		riskSummary = riskResult.riskSummary;
		newRisks = riskResult.newRisks;

		// Persist risks to ProcessRisk if processDefinition exists
		if (session.processDefinitionId && newRisks.length > 0) {
			await db.processRisk.createMany({
				data: newRisks.map((risk) => ({
					processDefinitionId: session.processDefinitionId!,
					title: risk.title,
					description: risk.description || "",
					riskType: risk.riskType || "OPERATIONAL",
					severity: risk.severity || 3,
					probability: risk.probability || 3,
					riskScore: (risk.severity || 3) * (risk.probability || 3),
					source: risk.source || "AI_AUDIT",
					createdBy: userId,
				})),
			});
		}
	} catch (err) {
		console.warn("[AI Interview] Risk audit failed (continuing without risks):", err);
	}

	// Step 5: Cross-session memory — persist KnowledgeSnapshot to ProcessIntelligence
	if (session.processDefinitionId) {
		try {
			await db.processIntelligence.upsert({
				where: { processDefinitionId: session.processDefinitionId },
				create: {
					processDefinitionId: session.processDefinitionId,
					knowledgeSnapshot: knowledgeSnapshot as any,
					completenessScore: Math.round(
						((knowledgeSnapshot.steps?.length || 0) > 0 ? 30 : 0) +
						((knowledgeSnapshot.roles?.length || 0) > 0 ? 15 : 0) +
						((knowledgeSnapshot.triggers?.length || 0) > 0 ? 15 : 0) +
						((knowledgeSnapshot.outputs?.length || 0) > 0 ? 20 : 0) +
						((knowledgeSnapshot.systems?.length || 0) > 0 ? 20 : 0),
					),
					lastAuditAt: new Date(),
				},
				update: {
					knowledgeSnapshot: knowledgeSnapshot as any,
					lastAuditAt: new Date(),
					version: { increment: 1 },
				},
			});
		} catch (err) {
			console.warn("[AI Interview] Failed to persist KnowledgeSnapshot to ProcessIntelligence:", err);
		}
	}

	// Step 6: Mark session as ended
	await db.meetingSession.update({
		where: { id: sessionId },
		data: {
			status: "ENDED",
			endedAt: new Date(),
		},
	});

	// Set final progress
	await setInterviewProgress(sessionId, {
		status: "done",
		step: "complete",
		progress: 100,
		bpmnXml,
		riskSummary,
		risks: newRisks.map((r) => ({
			title: r.title,
			description: r.description,
			riskType: r.riskType,
			severity: r.severity,
			probability: r.probability,
			source: r.source,
		})),
	});

	// Step 7: Send summary email (fire-and-forget)
	try {
		const user = await db.user.findUnique({
			where: { id: userId },
			select: { email: true },
		});
		const org = await db.organization.findUnique({
			where: { id: session.organizationId },
			select: { slug: true },
		});

		if (user?.email && org?.slug) {
			const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.auditora.ai";
			const resultUrl = `${baseUrl}/${org.slug}/sessions/interview/${sessionId}`;

			const lastScore = conversationLog
				.filter((m) => m.role === "assistant" && m.metadata?.completenessScore)
				.pop()?.metadata?.completenessScore || 0;

			await sendEmail({
				to: user.email,
				templateId: "interviewSummary",
				context: {
					processName,
					completenessScore: lastScore,
					riskCount: newRisks.length,
					topRisks: newRisks.slice(0, 3).map((r) => ({
						title: r.title,
						severity: r.severity || 3,
						probability: r.probability || 3,
					})),
					resultUrl,
				},
			});
		}
	} catch (err) {
		console.warn("[AI Interview] Summary email failed (non-critical):", err);
	}
}

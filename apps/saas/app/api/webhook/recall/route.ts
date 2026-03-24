/**
 * Recall.ai Webhook Handler
 *
 * Receives transcript events -> stores in DB -> triggers AI pipelines:
 * 1. Process Extraction (every 15s): transcript -> BPMN nodes
 * 2. Teleprompter (every 30s): transcript + diagram -> next question
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import {
	extractProcessUpdates,
	generateNextQuestion,
	buildSessionContext,
	generateSessionSummary,
	auditProcess,
	generateRaci,
	auditRisks,
	enrichCompanyBrain,
	createCallBotProvider,
	RecallAiProvider,
	setActivity as setRedisActivity,
	getActivity as getRedisActivity,
	deleteActivity as deleteRedisActivity,
} from "@repo/ai";
import type { SessionContext, ActivityState } from "@repo/ai";
import crypto from "crypto";
import { recordEvent } from "@meeting/lib/session-timeline";

// Throttle AI calls per session
const lastExtractionTime = new Map<string, number>();
const lastTeleprompterTime = new Map<string, number>();
const EXTRACTION_INTERVAL = 15_000;
const TELEPROMPTER_INTERVAL = 30_000;

// Bot activity state — backed by Redis (with in-memory fallback)
// See packages/ai/src/utils/redis.ts for implementation.
type BotActivityType = "listening" | "extracting" | "diagramming" | "suggesting";

function setActivity(sessionId: string, type: BotActivityType, detail?: string) {
	setRedisActivity(sessionId, type, detail).catch((err) =>
		console.warn("[Activity] Redis setActivity error:", err),
	);
	console.log(`[Activity] ${sessionId.substring(0, 8)}: ${type}${detail ? ` — ${detail}` : ""}`);
}

/** Get activity state for a session (used by live-data endpoint) */
export async function getSessionActivity(sessionId: string): Promise<ActivityState | null> {
	return getRedisActivity(sessionId);
}

/** Delete activity state for a session (used by end-session endpoint) */
export async function deleteSessionActivity(sessionId: string): Promise<void> {
	return deleteRedisActivity(sessionId);
}

function verifyWebhookSignature(body: string, signature: string | null): boolean {
	const secret = process.env.RECALL_WEBHOOK_SECRET;
	if (!secret) return true; // Skip verification if secret not configured
	if (!signature) return false;

	const expected = crypto
		.createHmac("sha256", secret)
		.update(body)
		.digest("hex");
	return crypto.timingSafeEqual(
		Buffer.from(signature),
		Buffer.from(expected),
	);
}

export async function POST(request: NextRequest) {
	try {
		const bodyText = await request.text();

		// Verify webhook signature if secret is configured
		const signature = request.headers.get("x-recall-signature");
		if (process.env.RECALL_WEBHOOK_SECRET && !verifyWebhookSignature(bodyText, signature)) {
			console.warn("[Webhook] Invalid signature — rejecting request");
			return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
		}

		const payload = JSON.parse(bodyText);

		// Handle bot status change events
		if (payload?.event === "bot.status_change") {
			const botId = payload?.data?.bot?.id || payload?.data?.bot_id || payload?.bot_id;
			const newStatus = payload?.data?.status?.code;
			if (botId && newStatus) {
				const session = await db.meetingSession.findFirst({
					where: { recallBotId: botId },
					include: { diagramNodes: true },
				});
				if (session) {
					recordEvent(session.id, "bot_status_webhook", `status=${newStatus}`);
					console.log(`[Webhook] Bot status change: ${newStatus} for session ${session.id.substring(0, 8)}`);

					// Session ended — mark as ENDED and trigger post-session pipelines
					if (newStatus === "done" || newStatus === "call_ended") {
						await db.meetingSession.update({
							where: { id: session.id },
							data: { status: "ENDED", endedAt: new Date() },
						});
						recordEvent(session.id, "session_ended", "Bot left call — triggering post-session pipelines");
						console.log(`[Webhook] Session ${session.id.substring(0, 8)} ENDED — triggering deliverable pipelines`);

						// Best-effort: fetch media URLs and participants from Recall.ai
						// Media may not be available immediately — the review page can retry on load.
						fetchRecallMediaAndParticipants(session.id, botId).catch((err) => {
							console.warn(`[Webhook] Media/participants fetch failed for ${session.id.substring(0, 8)} (will retry on review page):`, err);
						});

						// Fire-and-forget: run all 4 post-session pipelines
						runPostSessionPipelines(session.id, session.diagramNodes).catch((err) => {
							console.error(`[Webhook] Post-session pipeline error for ${session.id.substring(0, 8)}:`, err);
						});
					}
				}
			}
			return NextResponse.json({ ok: true });
		}

		// Handle chat messages — store as transcript entries with source="chat"
		if (payload?.event === "participant_events.chat_message" || payload?.event === "chat.message") {
			const botId = payload?.data?.bot?.id || payload?.data?.bot_id || payload?.bot_id;
			const chatText = payload?.data?.message?.text || payload?.data?.text;
			const participantName = payload?.data?.participant?.name || payload?.data?.sender?.name || "Unknown";

			if (botId && chatText) {
				const session = await db.meetingSession.findFirst({
					where: { recallBotId: botId },
				});
				if (session) {
					await db.transcriptEntry.create({
						data: {
							sessionId: session.id,
							speaker: `Chat: ${participantName}`,
							text: chatText,
							timestamp: Date.now() / 1000,
							source: "chat",
						},
					});
					recordEvent(session.id, "chat_message", `from=${participantName}`);
					console.log(`[Webhook] Chat message from ${participantName}: "${chatText.substring(0, 60)}"`);
				}
			}
			return NextResponse.json({ ok: true });
		}

		// Handle participant joined/left — create or update MeetingParticipant records
		if (payload?.event === "participant_events.join" || payload?.event === "participant.joined") {
			const botId = payload?.data?.bot?.id || payload?.data?.bot_id || payload?.bot_id;
			const participantName = payload?.data?.participant?.name || "Unknown";
			const participantEmail = payload?.data?.participant?.email || null;

			if (botId) {
				const session = await db.meetingSession.findFirst({
					where: { recallBotId: botId },
				});
				if (session) {
					// Upsert: if participant with same name exists, update joinedAt
					const existing = await db.meetingParticipant.findFirst({
						where: { sessionId: session.id, name: participantName },
					});
					if (existing) {
						await db.meetingParticipant.update({
							where: { id: existing.id },
							data: { joinedAt: new Date() },
						});
					} else {
						await db.meetingParticipant.create({
							data: {
								sessionId: session.id,
								name: participantName,
								email: participantEmail,
								joinedAt: new Date(),
							},
						});
					}
					recordEvent(session.id, "participant_joined", `name=${participantName}`);
					console.log(`[Webhook] Participant joined: ${participantName} in session ${session.id.substring(0, 8)}`);
				}
			}
			return NextResponse.json({ ok: true });
		}

		if (payload?.event === "participant_events.leave" || payload?.event === "participant.left") {
			const botId = payload?.data?.bot?.id || payload?.data?.bot_id || payload?.bot_id;
			const participantName = payload?.data?.participant?.name || "Unknown";

			if (botId) {
				const session = await db.meetingSession.findFirst({
					where: { recallBotId: botId },
				});
				if (session) {
					const existing = await db.meetingParticipant.findFirst({
						where: { sessionId: session.id, name: participantName },
					});
					if (existing) {
						await db.meetingParticipant.update({
							where: { id: existing.id },
							data: { leftAt: new Date() },
						});
					}
					recordEvent(session.id, "participant_left", `name=${participantName}`);
					console.log(`[Webhook] Participant left: ${participantName} from session ${session.id.substring(0, 8)}`);
				}
			}
			return NextResponse.json({ ok: true });
		}

		if (payload?.event !== "transcript.data") {
			return NextResponse.json({ ok: true });
		}

		// Track webhook delivery latency
		const webhookTimestamp = payload?.data?.timestamp || payload?.timestamp;
		if (webhookTimestamp) {
			const deltaMs = Date.now() - new Date(webhookTimestamp).getTime();
			if (deltaMs > 0 && deltaMs < 600_000) { // sanity check: < 10 min
				console.log(`[Webhook] Delivery latency: ${deltaMs}ms`);
			}
		}

		// Extract text from Recall.ai payload
		const wordsData = payload?.data?.data?.words;
		const participant = payload?.data?.data?.participant;

		if (!wordsData || wordsData.length === 0) {
			return NextResponse.json({ ok: true });
		}

		const text = wordsData
			.map((w: any) => w.text || "")
			.filter((t: string) => t.trim())
			.join(" ")
			.trim();

		if (!text) return NextResponse.json({ ok: true });

		const speaker = participant?.name || "Unknown";
		const timestamp = wordsData[0]?.start_timestamp?.relative || 0;

		// Find session
		const botId =
			payload?.data?.bot?.id ||
			payload?.data?.bot_id ||
			payload?.bot_id;

		let session;
		if (botId) {
			session = await db.meetingSession.findFirst({
				where: { recallBotId: botId },
			});
		}
		if (!session) {
			session = await db.meetingSession.findFirst({
				where: { status: { in: ["ACTIVE", "CONNECTING"] } },
				orderBy: { createdAt: "desc" },
			});
		}
		if (!session) return NextResponse.json({ ok: true });

		recordEvent(session.id, "webhook_received", `speaker=${speaker}, chars=${text.length}`);

		// Activate session on first transcript
		if (session.status === "CONNECTING") {
			await db.meetingSession.update({
				where: { id: session.id },
				data: { status: "ACTIVE", startedAt: new Date() },
			});
			recordEvent(session.id, "session_activated", "CONNECTING -> ACTIVE");
		}

		// Store transcript
		await db.transcriptEntry.create({
			data: { sessionId: session.id, speaker, text, timestamp },
		});
		recordEvent(session.id, "transcript_stored", `speaker=${speaker}`);

		console.log(`[Webhook] ${speaker}: "${text.substring(0, 60)}"`);

		// --- AI PIPELINES (throttled, run in background) ---
		const now = Date.now();

		// Process Extraction — every 15s
		const lastExtraction = lastExtractionTime.get(session.id) || 0;
		if (now - lastExtraction >= EXTRACTION_INTERVAL) {
			lastExtractionTime.set(session.id, now);
			recordEvent(session.id, "extraction_triggered");
			runExtraction(session.id).catch((err) =>
				console.error("[Webhook] Extraction error:", err),
			);
		}

		// Teleprompter — every 30s
		const lastTeleprompter = lastTeleprompterTime.get(session.id) || 0;
		if (now - lastTeleprompter >= TELEPROMPTER_INTERVAL) {
			lastTeleprompterTime.set(session.id, now);
			recordEvent(session.id, "teleprompter_triggered");
			runTeleprompter(session.id).catch((err) =>
				console.error("[Webhook] Teleprompter error:", err),
			);
		}

		return NextResponse.json({ ok: true });
	} catch (error) {
		console.error("[Webhook] Error:", error);
		return NextResponse.json({ ok: true });
	}
}

/** Extract BPMN nodes from recent transcript */
async function runExtraction(sessionId: string) {
	setActivity(sessionId, "extracting");

	try {
		// Build business context for context-aware extraction
		let context: SessionContext | undefined;
		try {
			context = await buildSessionContext(sessionId);
		} catch (err) {
			console.warn("[Extraction] Could not build session context:", err instanceof Error ? err.message : err);
		}

		const transcript = await db.transcriptEntry.findMany({
			where: { sessionId },
			orderBy: { timestamp: "desc" },
			take: 50,
		});

		const currentNodes = await db.diagramNode.findMany({
			where: { sessionId, state: { not: "REJECTED" } },
		});

		const result = await extractProcessUpdates(
			currentNodes.map((n) => ({
				id: n.id,
				type: n.nodeType.toLowerCase().replace(/_([a-z])/g, (_, c) =>
					c.toUpperCase(),
				) as any,
				label: n.label,
				state: n.state.toLowerCase() as any,
				lane: n.lane || undefined,
				connections: n.connections,
				positionX: n.positionX,
				positionY: n.positionY,
			})),
			transcript.reverse().map((t) => ({
				speaker: t.speaker,
				text: t.text,
				timestamp: t.timestamp,
			})),
			context,
		);

		// Store new nodes
		for (const newNode of result.newNodes) {
			const posX = 200 + currentNodes.length * 200;
			const posY = 200;

			// Map LLM node type to Prisma enum
			const typeMap: Record<string, string> = {
				startEvent: "START_EVENT",
				endEvent: "END_EVENT",
				task: "TASK",
				exclusiveGateway: "EXCLUSIVE_GATEWAY",
				parallelGateway: "PARALLEL_GATEWAY",
			};

			await db.diagramNode.create({
				data: {
					sessionId,
					nodeType: (typeMap[newNode.type] || "TASK") as any,
					label: newNode.label,
					state: "FORMING",
					lane: newNode.lane || null,
					confidence: newNode.confidence,
					positionX: posX,
					positionY: posY,
					connections: newNode.connectTo ? [newNode.connectTo] : [],
				},
			});

			console.log(`[Extraction] New node: "${newNode.label}"`);
		}

		// Log out-of-scope topics
		if (result.outOfScope && result.outOfScope.length > 0) {
			for (const item of result.outOfScope) {
				console.log(
					`[Extraction] Out of scope: "${item.topic}" -> likely belongs to "${item.likelyProcess}"`,
				);
			}
			// Store out-of-scope items in teleprompter log for consultant awareness
			await db.teleprompterLog.create({
				data: {
					sessionId,
					question: `[Scope notice] Topic "${result.outOfScope[0].topic}" may belong to the "${result.outOfScope[0].likelyProcess}" process instead.`,
				},
			});
		}

		if (result.newNodes.length > 0) {
			console.log(
				`[Extraction] Added ${result.newNodes.length} nodes for session ${sessionId}`,
			);
			setActivity(sessionId, "diagramming", `${result.newNodes.length} nodos nuevos`);
			// Hold "diagramming" for 3s so UI catches it on next poll
			setTimeout(() => setActivity(sessionId, "listening"), 3000);
		} else {
			setActivity(sessionId, "listening");
		}
	} catch (err) {
		setActivity(sessionId, "listening");
		throw err;
	}
}

/** Generate next teleprompter question */
async function runTeleprompter(sessionId: string) {
	setActivity(sessionId, "suggesting");

	try {
		const session = await db.meetingSession.findUnique({
			where: { id: sessionId },
			include: { processDefinition: true },
		});
		if (!session) {
			setActivity(sessionId, "listening");
			return;
		}

		// Build business context for context-aware question generation
		let context: SessionContext | undefined;
		try {
			context = await buildSessionContext(sessionId);
		} catch (err) {
			console.warn("[Teleprompter] Could not build session context:", err instanceof Error ? err.message : err);
		}

		const transcript = await db.transcriptEntry.findMany({
			where: { sessionId },
			orderBy: { timestamp: "desc" },
			take: 50,
		});

		const currentNodes = await db.diagramNode.findMany({
			where: { sessionId, state: { not: "REJECTED" } },
		});

		const result = await generateNextQuestion(
			session.type as "DISCOVERY" | "DEEP_DIVE" | "CONTINUATION",
			currentNodes.map((n) => ({
				id: n.id,
				type: n.nodeType.toLowerCase(),
				label: n.label,
				lane: n.lane || undefined,
				connections: n.connections,
			})),
			transcript.reverse().map((t) => ({
				speaker: t.speaker,
				text: t.text,
				timestamp: t.timestamp,
			})),
			session.processDefinition?.name,
			context,
		);

		await db.teleprompterLog.create({
			data: {
				sessionId,
				question: result.nextQuestion,
				completenessScore: result.completenessScore ?? null,
				gapType: result.gapType ?? null,
				sipocCoverage: result.sipocCoverage ? JSON.parse(JSON.stringify(result.sipocCoverage)) : undefined,
			},
		});

		console.log(`[Teleprompter] "${result.nextQuestion.substring(0, 60)}"`);
		// Hold "suggesting" for 3s so UI catches it, then return to listening
		setTimeout(() => setActivity(sessionId, "listening"), 3000);
	} catch (err) {
		setActivity(sessionId, "listening");
		throw err;
	}
}

/**
 * Run all 4 post-session pipelines and persist results as SessionDeliverables.
 * Each pipeline runs independently — one failure doesn't block the others.
 */
async function runPostSessionPipelines(sessionId: string, _diagramNodes: any[]) {
	const pipelineTypes = ["summary", "process_audit", "raci", "risk_audit"] as const;

	// Create all deliverable records as "pending"
	for (const type of pipelineTypes) {
		await db.sessionDeliverable.upsert({
			where: { sessionId_type: { sessionId, type } },
			create: { sessionId, type, status: "pending" },
			update: { status: "pending", error: null, data: undefined },
		});
	}

	// Get session data
	const session = await db.meetingSession.findUnique({
		where: { id: sessionId },
		include: {
			transcriptEntries: { orderBy: { timestamp: "asc" } },
			diagramNodes: { where: { state: { not: "REJECTED" } } },
			processDefinition: true,
		},
	});
	if (!session) return;

	const transcript = session.transcriptEntries.map((t) => ({
		speaker: t.speaker,
		text: (t as any).correctedText ?? t.text,
		timestamp: t.timestamp,
	}));

	const nodes = session.diagramNodes.map((n) => ({
		id: n.id,
		type: n.nodeType.toLowerCase(),
		label: n.label,
		lane: n.lane || undefined,
		connections: n.connections,
		state: n.state.toLowerCase(),
	}));

	const lanes = [...new Set(nodes.map((n) => n.lane).filter(Boolean))] as string[];

	// Helper to run a pipeline with deliverable status tracking, 120s timeout, and up to 2 retries
	const PIPELINE_TIMEOUT_MS = 120_000;
	const MAX_RETRIES = 2;

	const runPipeline = async (type: string, fn: () => Promise<any>) => {
		await db.sessionDeliverable.update({
			where: { sessionId_type: { sessionId, type } },
			data: { status: "running", startedAt: new Date() },
		});

		let lastError: string = "Unknown error";

		for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
			try {
				const result = await Promise.race([
					fn(),
					new Promise<never>((_, reject) =>
						setTimeout(() => reject(new Error("Pipeline timeout (120s)")), PIPELINE_TIMEOUT_MS),
					),
				]);

				await db.sessionDeliverable.update({
					where: { sessionId_type: { sessionId, type } },
					data: { status: "completed", data: result as any, completedAt: new Date() },
				});
				console.log(`[PostSession] ${type} completed for ${sessionId.substring(0, 8)} (attempt ${attempt + 1})`);
				return;
			} catch (err) {
				lastError = err instanceof Error ? err.message : "Unknown error";
				if (attempt < MAX_RETRIES) {
					console.warn(`[PostSession] ${type} attempt ${attempt + 1} failed for ${sessionId.substring(0, 8)}: ${lastError} — retrying...`);
				}
			}
		}

		// All retries exhausted
		await db.sessionDeliverable.update({
			where: { sessionId_type: { sessionId, type } },
			data: { status: "failed", error: lastError, completedAt: new Date() },
		});
		console.error(`[PostSession] ${type} failed after ${MAX_RETRIES + 1} attempts for ${sessionId.substring(0, 8)}: ${lastError}`);
	};

	const confirmedNodes = nodes.filter((n) => n.state === "confirmed");
	const transcriptText = transcript.map((t) => `${t.speaker}: ${t.text}`).join("\n");

	// Run all 4 in parallel
	await Promise.allSettled([
		// 1. Session Summary
		runPipeline("summary", () =>
			generateSessionSummary(
				session.type,
				confirmedNodes.map((n) => ({ id: n.id, type: n.type, label: n.label, lane: n.lane })),
				transcript,
			),
		),

		// 2. Process Audit
		runPipeline("process_audit", () =>
			auditProcess({
				mode: "initial",
				knowledgeSnapshot: {
					roles: lanes.map((l) => ({ name: l, responsibilities: [], confirmed: true })),
					triggers: [],
					steps: confirmedNodes.map((n) => ({ label: n.label, hasExceptionPath: false, hasDecisionCriteria: false, confirmed: true, role: n.lane })),
					decisions: nodes.filter((n) => n.type.includes("gateway")).map((n) => ({ label: n.label, outcomes: [], confirmed: true })),
					exceptions: [],
					outputs: [],
					systems: [],
					formats: [],
					slas: [],
					volumetrics: [],
					costs: [],
					interProcessLinks: [],
					contradictions: [],
				},
				confidenceScores: {},
				processDefinition: {
					name: session.processDefinition?.name || "Proceso",
					level: "PROCESS",
					goals: [],
					triggers: [],
					outputs: [],
					bpmnNodeCount: nodes.length,
					confirmedNodeCount: confirmedNodes.length,
				},
				newData: {
					transcriptExcerpts: [{ sessionId, text: transcriptText }],
					diagramNodes: nodes.map((n) => ({ label: n.label, type: n.type, lane: n.lane, state: n.state })),
				},
			}),
		),

		// 3. RACI (skip if <2 lanes)
		runPipeline("raci", async () => {
			if (lanes.length < 2) {
				await db.sessionDeliverable.update({
					where: { sessionId_type: { sessionId, type: "raci" } },
					data: { status: "skipped", error: "Se necesitan al menos 2 roles para generar RACI", completedAt: new Date() },
				});
				return { assignments: [] };
			}
			return generateRaci(
				lanes,
				confirmedNodes.filter((n) => n.type === "task" || n.type === "usertask").map((n) => n.label),
				transcriptText,
			);
		}),

		// 4. Risk Audit
		runPipeline("risk_audit", () =>
			auditRisks({
				mode: "risk",
				processDefinition: {
					name: session.processDefinition?.name || "Proceso",
					description: session.processDefinition?.description || "",
					level: "PROCESS",
					goals: [],
				},
				knowledgeSnapshot: {
					roles: lanes.map((l) => ({ name: l, responsibilities: [], confirmed: true })),
					triggers: [],
					steps: confirmedNodes.map((n) => ({ label: n.label, hasExceptionPath: false, hasDecisionCriteria: false, confirmed: true })),
					decisions: nodes.filter((n) => n.type.includes("gateway")).map((n) => ({ label: n.label, outcomes: [], confirmed: true })),
					exceptions: [],
					outputs: [],
					systems: [],
					formats: [],
					slas: [],
					volumetrics: [],
					costs: [],
					interProcessLinks: [],
					contradictions: [],
				},
				intelligenceItems: [],
				existingRisks: [],
				transcriptExcerpts: [{ text: transcriptText }],
			}),
		),
	]);

	console.log(`[PostSession] All pipelines finished for ${sessionId.substring(0, 8)}`);

	// Enrich Company Brain with transcript data (fire-and-forget)
	if (session.organizationId && transcriptText.length > 100) {
		enrichCompanyBrainFromSession(session.organizationId, sessionId, transcriptText).catch((err) => {
			console.error(`[PostSession] Company Brain enrichment failed for ${sessionId.substring(0, 8)}:`, err);
		});
	}

	// Send recap email to the session creator
	try {
		const sessionWithUser = await db.meetingSession.findUnique({
			where: { id: sessionId },
			include: { user: { select: { email: true, name: true } }, organization: { select: { name: true, slug: true } } },
		});
		if (sessionWithUser?.user?.email) {
			const { sendEmail } = await import("@repo/mail");
			const reviewUrl = `${process.env.NEXT_PUBLIC_SAAS_URL}/${sessionWithUser.organization.slug}/session/${sessionId}/review`;
			const processName = session.processDefinition?.name || "Proceso";
			await sendEmail({
				to: sessionWithUser.user.email,
				subject: `Entregables listos: ${processName}`,
				html: `
					<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
						<h2 style="color: #0F172A;">Sesion finalizada</h2>
						<p style="color: #475569;">Los entregables de tu sesion de <strong>${processName}</strong> estan listos para revision.</p>
						<p style="color: #475569;">Incluye: resumen ejecutivo, auditoria de proceso, matriz RACI, y analisis de riesgos.</p>
						<a href="${reviewUrl}" style="display: inline-block; background: #2563EB; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; margin-top: 16px;">
							Revisar entregables
						</a>
						<p style="color: #94A3B8; font-size: 12px; margin-top: 24px;">— aiprocess.me</p>
					</div>
				`,
			});
			console.log(`[PostSession] Recap email sent to ${sessionWithUser.user.email} for ${sessionId.substring(0, 8)}`);
		}
	} catch (err) {
		console.warn(`[PostSession] Recap email failed for ${sessionId.substring(0, 8)}:`, err);
	}
}

/**
 * Fetch video/audio URLs and participants from Recall.ai and persist them.
 *
 * Media URLs are often not available immediately after the call ends —
 * the bot needs time to process the recording. This function tries once;
 * if the URLs come back null, that's fine — the review page should retry
 * on load via a separate API endpoint.
 */
async function fetchRecallMediaAndParticipants(sessionId: string, botId: string) {
	const callBot = createCallBotProvider();

	// Only RecallAiProvider has these methods — guard just in case
	if (!("getVideoUrl" in callBot)) {
		console.warn("[Webhook] Call bot provider does not support media URL retrieval");
		return;
	}

	const provider = callBot as RecallAiProvider;

	// Fetch media URLs (may return null if still processing)
	const [videoUrl, audioUrl, participants] = await Promise.all([
		provider.getVideoUrl(botId),
		provider.getAudioUrl(botId),
		provider.getParticipants(botId),
	]);

	// Update session with whatever URLs are available
	if (videoUrl || audioUrl) {
		await db.meetingSession.update({
			where: { id: sessionId },
			data: {
				...(videoUrl ? { videoUrl } : {}),
				...(audioUrl ? { audioUrl } : {}),
			},
		});
		console.log(`[Webhook] Media URLs saved for ${sessionId.substring(0, 8)} — video: ${!!videoUrl}, audio: ${!!audioUrl}`);
		recordEvent(sessionId, "media_urls_saved", `video=${!!videoUrl} audio=${!!audioUrl}`);
	} else {
		console.log(`[Webhook] Media URLs not yet available for ${sessionId.substring(0, 8)} — will retry on review page`);
	}

	// Create participant records (skip if already populated from a previous attempt)
	if (participants.length > 0) {
		const existingCount = await db.meetingParticipant.count({ where: { sessionId } });
		if (existingCount === 0) {
			await db.meetingParticipant.createMany({
				data: participants.map((p) => ({
					sessionId,
					name: p.name,
					email: p.email || null,
				})),
			});
			console.log(`[Webhook] ${participants.length} participants saved for ${sessionId.substring(0, 8)}`);
			recordEvent(sessionId, "participants_saved", `count=${participants.length}`);
		} else {
			console.log(`[Webhook] Participants already exist for ${sessionId.substring(0, 8)} — skipping`);
		}
	}
}

/**
 * Enrich the Company Brain from a completed session's transcript.
 *
 * Runs after post-session pipelines. Extracts organizational knowledge
 * (mission, vision, value chain, roles, systems, process links) and
 * persists to the normalized Company Brain tables.
 */
async function enrichCompanyBrainFromSession(
	organizationId: string,
	sessionId: string,
	transcriptText: string,
) {
	console.log(`[CompanyBrain] Enriching from session ${sessionId.substring(0, 8)}`);

	// Ensure Company Brain exists
	let brain = await db.companyBrain.findUnique({
		where: { organizationId },
		include: { globalRoles: true, globalSystems: true },
	});

	if (!brain) {
		brain = await db.companyBrain.create({
			data: { organizationId },
			include: { globalRoles: true, globalSystems: true },
		});
	}

	// Get existing context
	const org = await db.organization.findUnique({
		where: { id: organizationId },
		select: { name: true, industry: true },
	});

	const processes = await db.processDefinition.findMany({
		where: { architecture: { organizationId } },
		select: { id: true, name: true },
	});

	const result = await enrichCompanyBrain({
		text: transcriptText,
		sourceType: "transcript",
		existingContext: {
			orgName: org?.name,
			industry: org?.industry ?? undefined,
			existingProcesses: processes.map((p) => p.name),
			existingRoles: brain.globalRoles?.map((r) => r.name) ?? [],
			existingSystems: brain.globalSystems?.map((s) => s.name) ?? [],
		},
	});

	if (result.overallConfidence === 0) {
		console.log(`[CompanyBrain] No organizational knowledge found in session ${sessionId.substring(0, 8)}`);
		return;
	}

	// Persist via the Company Brain API (reuse the same logic)
	const apiUrl = `${process.env.NEXT_PUBLIC_SAAS_URL || "http://localhost:3000"}/api/company-brain`;
	const response = await fetch(apiUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			organizationId,
			text: transcriptText,
			sourceType: "transcript",
			sourceId: sessionId,
		}),
	});

	if (!response.ok) {
		console.error(`[CompanyBrain] API enrichment failed: ${response.status} ${response.statusText}`);
		return;
	}

	const apiResult = await response.json();
	console.log(`[CompanyBrain] Enriched from session ${sessionId.substring(0, 8)}: confidence=${apiResult.confidence}, extracted=${JSON.stringify(apiResult.extracted)}`);
}

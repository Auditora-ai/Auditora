/**
 * Session Context Builder
 *
 * Builds a rich business context for AI pipelines by fetching
 * all relevant data about the company, project, process architecture,
 * and target process from the database.
 *
 * Used by both process extraction and teleprompter pipelines to
 * make context-aware AI calls.
 */

import { db } from "@repo/database";

export interface SessionContext {
  company: {
    name: string;
    industry?: string;
    operationsProfile?: string;
    businessModel?: string;
    documentContext?: string;
  };
  project: {
    name: string;
    description?: string;
    goals: string[];
    documentContext?: string;
  };
  architecture: {
    processes: Array<{
      name: string;
      level: string;
      status: string;
      description?: string;
    }>;
  };
  targetProcess: {
    name: string;
    level: string;
    description?: string;
    goals: string[];
    triggers: string[];
    outputs: string[];
    parentProcess?: string;
    siblings: string[];
    previousBpmn?: string;
    previousTranscriptSummary?: string;
  } | null;
  sessionType: "DISCOVERY" | "DEEP_DIVE" | "CONTINUATION";
}

// Cache to avoid refetching mid-session
const contextCache = new Map<string, SessionContext>();

/**
 * Build full session context from the database.
 * Results are cached per session to avoid repeated queries
 * during the same meeting.
 */
export async function buildSessionContext(
  sessionId: string,
): Promise<SessionContext> {
  const cached = contextCache.get(sessionId);
  if (cached) return cached;

  const session = await db.meetingSession.findUnique({
    where: { id: sessionId },
    include: {
      project: {
        include: {
          client: {
            include: {
              documents: {
                where: { isProcessed: true },
                select: { extractedText: true },
              },
            },
          },
          architecture: {
            include: { definitions: true },
          },
          documents: {
            where: { isProcessed: true },
            select: { extractedText: true },
          },
        },
      },
      processDefinition: {
        include: {
          architecture: { include: { definitions: true } },
          parent: { select: { name: true } },
        },
      },
      previousSession: {
        select: {
          bpmnXml: true,
          transcriptEntries: {
            take: 50,
            orderBy: { timestamp: "desc" },
          },
        },
      },
    },
  });

  if (!session) throw new Error(`Session ${sessionId} not found`);

  const client = session.project.client;
  const project = session.project;
  const architecture = project.architecture;
  const allProcesses = architecture?.definitions ?? [];
  const target = session.processDefinition;

  // Build document context (concatenated extracted text, truncated)
  const clientDocs = client.documents
    .map((d) => d.extractedText)
    .filter(Boolean)
    .join("\n\n");
  const projectDocs = project.documents
    .map((d) => d.extractedText)
    .filter(Boolean)
    .join("\n\n");

  // Build sibling list for target process
  let siblings: string[] = [];
  if (target) {
    siblings = allProcesses
      .filter((p) => p.parentId === target.parentId && p.id !== target.id)
      .map((p) => p.name);
  }

  // For continuation: get previous session data
  let previousBpmn: string | undefined;
  let previousTranscriptSummary: string | undefined;
  if (session.previousSession) {
    previousBpmn = session.previousSession.bpmnXml ?? undefined;
    if (session.previousSession.transcriptEntries?.length) {
      previousTranscriptSummary = session.previousSession.transcriptEntries
        .reverse()
        .map((t) => `${t.speaker}: ${t.text}`)
        .join("\n")
        .substring(0, 2000);
    }
  }

  const context: SessionContext = {
    company: {
      name: client.name,
      industry: client.industry ?? undefined,
      operationsProfile: client.operationsProfile ?? undefined,
      businessModel: client.businessModel ?? undefined,
      documentContext: clientDocs.substring(0, 4000) || undefined,
    },
    project: {
      name: project.name,
      description: project.description ?? undefined,
      goals: project.goals,
      documentContext: projectDocs.substring(0, 2000) || undefined,
    },
    architecture: {
      processes: allProcesses.map((p) => ({
        name: p.name,
        level: p.level,
        status: p.processStatus,
        description: p.description ?? undefined,
      })),
    },
    targetProcess: target
      ? {
          name: target.name,
          level: target.level,
          description: target.description ?? undefined,
          goals: target.goals,
          triggers: target.triggers,
          outputs: target.outputs,
          parentProcess: target.parent?.name ?? undefined,
          siblings,
          previousBpmn,
          previousTranscriptSummary,
        }
      : null,
    sessionType: session.type as SessionContext["sessionType"],
  };

  contextCache.set(sessionId, context);
  return context;
}

/**
 * Clear cached context for a session.
 * Call this when session data changes (e.g., manual edits to process definitions).
 */
export function clearSessionContextCache(sessionId: string) {
  contextCache.delete(sessionId);
}

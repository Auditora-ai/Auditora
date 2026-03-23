/**
 * Session Context Builder
 *
 * Builds a rich business context for AI pipelines by fetching
 * all relevant data about the organization, process architecture,
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
  intelligence?: {
    openItems: Array<{
      question: string;
      category: string;
      priority: number;
    }>;
    completenessScore: number;
  };
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
      organization: {
        include: {
          documents: {
            where: { isProcessed: true },
            select: { extractedText: true },
          },
          architecture: {
            include: { definitions: true },
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

  const org = session.organization;
  const architecture = org.architecture;
  const allProcesses = architecture?.definitions ?? [];
  const target = session.processDefinition;

  // Build document context (concatenated extracted text, truncated)
  const orgDocs = org.documents
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

  // Fetch intelligence data for target process (top 5 open items)
  let intelligence: SessionContext["intelligence"] = undefined;
  if (target) {
    const intel = await db.processIntelligence.findFirst({
      where: { processDefinitionId: target.id },
      select: {
        completenessScore: true,
        items: {
          where: { status: "OPEN" },
          select: { question: true, category: true, priority: true },
          orderBy: { priority: "desc" },
          take: 5,
        },
      },
    });
    if (intel && intel.items.length > 0) {
      intelligence = {
        openItems: intel.items,
        completenessScore: intel.completenessScore,
      };
    }
  }

  const context: SessionContext = {
    company: {
      name: org.name,
      industry: org.industry ?? undefined,
      operationsProfile: org.operationsProfile ?? undefined,
      businessModel: org.businessModel ?? undefined,
      documentContext: orgDocs.substring(0, 4000) || undefined,
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
    intelligence,
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

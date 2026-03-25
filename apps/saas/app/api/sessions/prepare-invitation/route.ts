import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-helpers";
import { prepareSessionInvitation } from "@repo/ai";
import type { SessionPrepInput } from "@repo/ai";
import { db } from "@repo/database";

export async function POST(request: Request) {
  const authCtx = await getAuthContext();
  if (!authCtx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as SessionPrepInput;

  if (!body.processName || !body.sessionType || !body.participants) {
    return NextResponse.json(
      { error: "processName, sessionType, and participants are required" },
      { status: 400 },
    );
  }

  // Fetch existing diagram info if a process exists
  let existingDiagramInfo: string | undefined;
  if (body.processName) {
    const process = await db.processDefinition.findFirst({
      where: {
        name: body.processName,
        architecture: { organizationId: authCtx.org.id },
      },
    });

    if (process) {
      // Find the most recent ended session for this process with diagram nodes
      const lastSession = await db.meetingSession.findFirst({
        where: {
          processDefinitionId: process.id,
          status: "ENDED",
        },
        orderBy: { endedAt: "desc" },
        include: {
          diagramNodes: {
            select: { label: true, nodeType: true, lane: true },
          },
        },
      });

      if (lastSession && lastSession.diagramNodes.length > 0) {
        const nodes = lastSession.diagramNodes;
        const lanes = [...new Set(nodes.map((n) => n.lane).filter(Boolean))];
        existingDiagramInfo = `El proceso tiene ${nodes.length} nodos documentados. Lanes: ${lanes.join(", ") || "Sin lanes"}`;
      }
    }
  }

  const result = await prepareSessionInvitation(authCtx.org.id, {
    ...body,
    existingDiagramInfo,
    organizationName: authCtx.org.name ?? undefined,
  });

  return NextResponse.json(result);
}

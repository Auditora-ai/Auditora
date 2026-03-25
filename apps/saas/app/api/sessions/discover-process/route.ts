import { NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth-helpers";
import { discoverProcess } from "@repo/ai";
import { db } from "@repo/database";

export async function POST(request: Request) {
  const authCtx = await getAuthContext();
  if (!authCtx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { messages, organizationContext } = body as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
    organizationContext?: string;
  };

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json(
      { error: "messages array is required" },
      { status: 400 },
    );
  }

  // Fetch existing processes for the organization
  const architecture = await db.processArchitecture.findUnique({
    where: { organizationId: authCtx.org.id },
    include: {
      definitions: {
        select: { name: true },
        where: { parentId: null },
      },
    },
  });

  const existingProcesses = architecture?.definitions.map((d) => d.name) ?? [];

  const result = await discoverProcess({
    organizationId: authCtx.org.id,
    messages,
    existingProcesses,
    organizationContext,
  });

  return NextResponse.json(result);
}

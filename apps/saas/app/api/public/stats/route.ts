import { NextResponse } from "next/server";
import { db } from "@repo/database";

export async function GET() {
  try {
    const [processSteps, sessionsCompleted] = await Promise.all([
      db.diagramNode.count({
        where: { state: "CONFIRMED" },
      }),
      db.meetingSession.count({
        where: { status: "ENDED" },
      }),
    ]);

    return NextResponse.json(
      { processSteps, sessionsCompleted },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  } catch {
    return NextResponse.json(
      { processSteps: 0, sessionsCompleted: 0 },
      { status: 500 },
    );
  }
}

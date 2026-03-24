import { NextRequest, NextResponse } from "next/server";
import { db } from "@repo/database";
import { sendEmail } from "@repo/mail";

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  "bpmn-generator": "BPMN Diagram Generator",
  "sipoc-generator": "SIPOC Generator",
  "raci-generator": "RACI Matrix Generator",
  "process-audit": "Process Health Check",
  "meeting-to-process": "Meeting Notes to Process Map",
  "process-complexity": "Process Complexity Score",
  "bpmn-to-text": "BPMN to Plain Language",
  "roi-calculator": "ROI Calculator",
  "contact-form": "Contact Form",
};

const ipRequests = new Map<string, { count: number; resetAt: number }>();
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_MARKETING_URL || "*";

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequests.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + 3600000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many requests." },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const { email, toolUsed, outputData, source } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email required." },
        { status: 400 },
      );
    }

    if (!toolUsed || typeof toolUsed !== "string") {
      return NextResponse.json(
        { error: "Tool name required." },
        { status: 400 },
      );
    }

    const lead = await db.toolLead.create({
      data: {
        email: email.trim().toLowerCase(),
        toolUsed,
        outputData: outputData || undefined,
        ipAddress: ip,
        source: source || "tool",
      },
    });

    // Send immediate result email (fire-and-forget)
    const displayName = TOOL_DISPLAY_NAMES[toolUsed] || toolUsed;
    const toolUrl = `https://prozea.com/tools/${toolUsed}`;
    sendEmail({
      to: email.trim().toLowerCase(),
      subject: `Your ${displayName} result is ready — Prozea`,
      html: `
        <div style="font-family: 'Geist', system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 20px;">
          <h2 style="color: #0F172A; font-size: 20px;">Your ${displayName} result is ready</h2>
          <p style="color: #334155; line-height: 1.6;">Thanks for using Prozea's free ${displayName}. Your result has been generated and is ready to view.</p>
          <a href="${toolUrl}" style="display: inline-block; background: #2563EB; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin: 16px 0;">View your result &rarr;</a>
          <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 24px 0;" />
          <p style="color: #64748B; font-size: 14px;"><strong>Did you know?</strong> Prozea can generate BPMN diagrams, SIPOC, RACI matrices, and process audits <em>live during your meetings</em>. The AI joins your video call and does everything automatically.</p>
          <a href="https://prozea.com" style="color: #2563EB; font-size: 14px;">Learn more about Prozea &rarr;</a>
        </div>
      `,
      text: `Your ${displayName} result is ready. View it at: ${toolUrl}`,
    }).catch(() => {});

    return NextResponse.json(
      { success: true, id: lead.id },
      { headers: { "Access-Control-Allow-Origin": ALLOWED_ORIGIN } },
    );
  } catch (err) {
    console.error("[lead-capture] Error:", err);
    return NextResponse.json(
      { error: "Failed to save. Try again." },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

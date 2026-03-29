import { TOOLS } from "@tools/tools-config";
import type { Metadata } from "next";
import { ToolsHubClient } from "./client";

export const metadata: Metadata = {
  title: "Free Process Tools | Auditora.ai",
  description:
    "Free AI-powered tools for BPM professionals: BPMN generator, SIPOC generator, RACI matrix maker, process audit, and more.",
  keywords: [
    "free BPM tools",
    "BPMN generator",
    "SIPOC generator",
    "RACI matrix maker",
    "process documentation tools",
  ],
};

export default async function ToolsHubPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <ToolsHubClient tools={TOOLS} locale={locale} />;
}

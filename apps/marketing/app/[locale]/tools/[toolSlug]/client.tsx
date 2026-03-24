"use client";

import { ToolPage } from "@tools/components/ToolPage";
import {
  BpmnOutput,
  SipocOutput,
  RaciOutput,
  AuditOutput,
  ComplexityOutput,
  NarrativeOutput,
} from "@tools/components/ToolOutputs";
import { RoiCalculator } from "@tools/components/RoiCalculator";
import type { ToolConfig } from "@tools/tools-config";

const OUTPUT_RENDERERS: Record<
  string,
  (data: Record<string, unknown>) => React.ReactNode
> = {
  bpmn: (data) => <BpmnOutput data={data} />,
  sipoc: (data) => <SipocOutput data={data} />,
  raci: (data) => <RaciOutput data={data} />,
  audit: (data) => <AuditOutput data={data} />,
  complexity: (data) => <ComplexityOutput data={data} />,
  narrative: (data) => <NarrativeOutput data={data} />,
};

interface ToolPageClientProps {
  tool: ToolConfig;
  locale: string;
}

export function ToolPageClient({ tool, locale }: ToolPageClientProps) {
  if (tool.outputType === "calculator") {
    return <RoiCalculator locale={locale} />;
  }

  const renderer = OUTPUT_RENDERERS[tool.outputType];

  return (
    <ToolPage tool={tool} locale={locale}>
      {(result) => renderer ? renderer(result) : null}
    </ToolPage>
  );
}

"use client";

import { Button } from "@repo/ui/components/button";
import {
  ArrowRightIcon,
  BookOpenIcon,
  CalculatorIcon,
  FileTextIcon,
  GaugeIcon,
  GitBranchIcon,
  Grid3X3Icon,
  ShieldCheckIcon,
  SparklesIcon,
  TableIcon,
} from "lucide-react";
import Link from "next/link";
import type { ToolConfig } from "@tools/tools-config";

const ICON_MAP: Record<string, React.ReactNode> = {
  GitBranch: <GitBranchIcon className="h-6 w-6" />,
  Table: <TableIcon className="h-6 w-6" />,
  Grid3X3: <Grid3X3Icon className="h-6 w-6" />,
  ShieldCheck: <ShieldCheckIcon className="h-6 w-6" />,
  FileText: <FileTextIcon className="h-6 w-6" />,
  Gauge: <GaugeIcon className="h-6 w-6" />,
  BookOpen: <BookOpenIcon className="h-6 w-6" />,
  Calculator: <CalculatorIcon className="h-6 w-6" />,
};

interface ToolsHubClientProps {
  tools: ToolConfig[];
  locale: string;
}

export function ToolsHubClient({ tools, locale }: ToolsHubClientProps) {
  const isEs = locale === "es";

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border bg-surface px-4 pb-12 pt-24 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <SparklesIcon className="h-4 w-4" />
            {isEs ? "100% Gratis" : "100% Free"}
          </div>
          <h1 className="font-display mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {isEs
              ? "Herramientas Gratuitas para Profesionales BPM"
              : "Free Tools for BPM Professionals"}
          </h1>
          <p className="text-lg text-muted-foreground">
            {isEs
              ? "Genera diagramas BPMN, SIPOC, RACI y mas con inteligencia artificial. Sin registro requerido."
              : "Generate BPMN diagrams, SIPOC, RACI and more with AI. No signup required."}
          </p>
        </div>
      </section>

      {/* Tool Grid */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/${locale}/tools/${tool.slug}`}
              className="group rounded-xl border border-border bg-surface p-6 transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                {ICON_MAP[tool.icon] || <SparklesIcon className="h-6 w-6" />}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {isEs ? tool.nameEs : tool.name}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                {isEs ? tool.descriptionEs : tool.description}
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                {isEs ? "Usar gratis" : "Use free"}
                <ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-[#0F172A] px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display mb-4 text-3xl font-bold text-[#F1F5F9]">
            {isEs
              ? "Quieres esto en VIVO durante tus reuniones?"
              : "Want this LIVE during your meetings?"}
          </h2>
          <p className="mb-8 text-[#94A3B8]">
            {isEs
              ? "aiprocess.me se une a tu videollamada y genera todo automaticamente."
              : "aiprocess.me joins your video call and generates everything automatically."}
          </p>
          <Button size="lg" className="gap-2" asChild>
            <a href="/signup">
              {isEs ? "Probar aiprocess.me Gratis" : "Try aiprocess.me Free"}
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}

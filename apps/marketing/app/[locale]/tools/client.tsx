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
  GitBranch: <GitBranchIcon className="h-5 w-5" />,
  Table: <TableIcon className="h-5 w-5" />,
  Grid3X3: <Grid3X3Icon className="h-5 w-5" />,
  ShieldCheck: <ShieldCheckIcon className="h-5 w-5" />,
  FileText: <FileTextIcon className="h-5 w-5" />,
  Gauge: <GaugeIcon className="h-5 w-5" />,
  BookOpen: <BookOpenIcon className="h-5 w-5" />,
  Calculator: <CalculatorIcon className="h-5 w-5" />,
};

interface ToolsHubClientProps {
  tools: ToolConfig[];
  locale: string;
}

export function ToolsHubClient({ tools, locale }: ToolsHubClientProps) {
  const isEs = locale === "es";

  return (
    <div className="min-h-screen bg-[#0F172A]">
      {/* Hero */}
      <section className="px-4 pb-12 pt-24 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <SparklesIcon className="h-4 w-4" />
            {isEs ? "100% Gratis" : "100% Free"}
          </div>
          <h1 className="font-display mb-4 text-4xl font-bold tracking-tight text-[#F1F5F9] md:text-5xl">
            {isEs
              ? "Herramientas IA para Profesionales BPM"
              : "AI Tools for BPM Professionals"}
          </h1>
          <p className="text-lg text-[#94A3B8]">
            {isEs
              ? "El mismo AI que diagrama en reuniones, ahora en tus manos. Sin registro."
              : "The same AI that diagrams in meetings, now in your hands. No signup required."}
          </p>
        </div>
      </section>

      {/* Tool Grid */}
      <section className="mx-auto max-w-5xl px-4 pb-16">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/${locale}/tools/${tool.slug}`}
              className="group flex items-start gap-4 rounded-xl border border-[#334155] bg-[#1E293B] p-5 transition-all duration-200 hover:border-primary/50 hover:bg-[#1E293B]/80"
            >
              <div className="mt-0.5 flex-shrink-0 text-primary">
                {ICON_MAP[tool.icon] || <SparklesIcon className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-semibold text-[#F1F5F9]">
                  {isEs ? tool.nameEs : tool.name}
                </h3>
                <p className="mt-1 text-sm text-[#64748B] line-clamp-2">
                  {isEs ? tool.descriptionEs : tool.description}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  {isEs ? "Usar gratis" : "Use free"}
                  <ArrowRightIcon className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#334155] px-4 py-16 text-center">
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

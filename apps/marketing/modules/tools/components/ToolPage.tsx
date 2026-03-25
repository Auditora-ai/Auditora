"use client";

import { config } from "@config";
import { Button } from "@repo/ui/components/button";
import {
  ArrowRightIcon,
  DownloadIcon,
  Loader2Icon,
  SparklesIcon,
} from "lucide-react";
import { useCallback, useState } from "react";
import { useAnalytics } from "@analytics";
import type { ToolConfig } from "../tools-config";
import { EmailGate } from "./EmailGate";

interface ToolPageProps {
  tool: ToolConfig;
  locale: string;
  children: (result: Record<string, unknown>) => React.ReactNode;
}

export function ToolPage({ tool, locale, children }: ToolPageProps) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmailGate, setShowEmailGate] = useState(false);
  const { trackEvent } = useAnalytics();

  const isEs = locale === "es";
  const name = isEs ? tool.nameEs : tool.name;
  const description = isEs ? tool.descriptionEs : tool.description;
  const inputLabel = isEs ? tool.inputLabelEs : tool.inputLabel;
  const placeholder = isEs ? tool.inputPlaceholderEs : tool.inputPlaceholder;

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(
        `${config.saasUrl}/api/public/tools/${tool.apiEndpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ input: input.trim() }),
        },
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(
          data.error ||
            (isEs
              ? "Error procesando. Intenta de nuevo."
              : "Processing failed. Try again."),
        );
      }

      const data = await res.json();
      setResult(data);
      trackEvent("tool_generated", { tool: tool.slug, inputLength: input.trim().length });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isEs
            ? "Error inesperado."
            : "Unexpected error.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, tool.apiEndpoint, isEs]);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-[#334155] bg-[#0F172A] px-4 pb-12 pt-24 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <SparklesIcon className="h-4 w-4" />
            {isEs ? "Herramienta Gratuita" : "Free Tool"}
          </div>
          <h1 className="font-display mb-4 text-4xl font-bold tracking-tight text-[#F1F5F9] md:text-5xl">
            {name}
          </h1>
          <p className="text-lg text-[#94A3B8]">{description}</p>
        </div>
      </section>

      {/* Input + Output */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input Panel */}
          <div>
            {inputLabel && (
              <label className="mb-2 block text-sm font-medium text-foreground">
                {inputLabel}
              </label>
            )}

            {/* File upload for bpmn-to-text */}
            {tool.slug === "bpmn-to-text" && (
              <div className="mb-3">
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface p-4 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-surface/80">
                  <input
                    type="file"
                    accept=".bpmn,.xml"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const text = ev.target?.result;
                        if (typeof text === "string") setInput(text);
                      };
                      reader.readAsText(file);
                    }}
                  />
                  {isEs ? "Sube un archivo .bpmn o .xml" : "Upload a .bpmn or .xml file"}
                </label>
                <p className="mt-1 text-center text-xs text-muted-foreground">
                  {isEs ? "o pega el XML abajo" : "or paste XML below"}
                </p>
              </div>
            )}

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={placeholder}
              className="h-64 w-full resize-none rounded-lg border border-border bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={isLoading}
            />
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {input.length} / 3000
              </span>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || input.trim().length < 20}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                    {isEs ? "Procesando..." : "Processing..."}
                  </>
                ) : (
                  <>
                    <SparklesIcon className="h-4 w-4" />
                    {isEs ? "Generar" : "Generate"}
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
                {error}
              </div>
            )}
          </div>

          {/* Output Panel */}
          <div className="min-h-[300px] rounded-lg border border-border bg-[#1E293B] p-4">
            {isLoading && (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Loader2Icon className="mx-auto h-8 w-8 animate-spin text-primary" />
                  <p className="mt-3 text-sm text-[#94A3B8]">
                    {isEs
                      ? "La IA esta analizando tu proceso..."
                      : "AI is analyzing your process..."}
                  </p>
                </div>
              </div>
            )}

            {!isLoading && !result && (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-[#64748B]">
                  {isEs
                    ? "Tu resultado aparecera aqui"
                    : "Your result will appear here"}
                </p>
              </div>
            )}

            {!isLoading && result && (
              <div className="h-full overflow-auto">
                {children(result)}
              </div>
            )}
          </div>
        </div>

        {/* Action bar below output */}
        {result && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-muted p-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEmailGate(true);
                trackEvent("tool_download_clicked", { tool: tool.slug });
              }}
              className="gap-2"
            >
              <DownloadIcon className="h-4 w-4" />
              {isEs ? "Descargar resultado" : "Download result"}
            </Button>
            <a
              href={config.saasUrl}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              {isEs
                ? "Imagina esto DURANTE tu reunion"
                : "Imagine this DURING your meeting"}
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="border-t border-border bg-[#0F172A] px-4 py-16 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display mb-4 text-3xl font-bold text-[#F1F5F9]">
            {isEs
              ? "Ahora imagina esto en VIVO durante tu reunion"
              : "Now imagine this LIVE during your meeting"}
          </h2>
          <p className="mb-8 text-[#94A3B8]">
            {isEs
              ? "aiprocess.me se une a tu videollamada, guia tus preguntas con un teleprompter, y genera el diagrama BPMN en tiempo real."
              : "aiprocess.me joins your video call, guides your questions with a teleprompter, and generates the BPMN diagram in real-time."}
          </p>
          <a href={config.saasUrl}>
            <Button size="lg" className="gap-2">
              {isEs ? "Probar aiprocess.me Gratis" : "Try aiprocess.me Free"}
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </section>

      {/* Email Gate Modal */}
      {showEmailGate && (
        <EmailGate
          toolSlug={tool.slug}
          result={result}
          locale={locale}
          onClose={() => setShowEmailGate(false)}
        />
      )}
    </div>
  );
}

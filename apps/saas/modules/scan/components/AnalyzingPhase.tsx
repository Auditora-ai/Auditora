"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  FileText,
  Building2,
  ShieldAlert,
  Check,
  Loader2,
} from "lucide-react";
import type { ScanResult, ScanSSEEvent } from "../types";

const STEPS = [
  { label: "Conectando al sitio web", icon: Globe },
  { label: "Leyendo contexto de negocio", icon: FileText },
  { label: "Identificando industria y procesos", icon: Building2 },
  { label: "Analizando riesgos operativos", icon: ShieldAlert },
];

const stepVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      delay: i * 0.1,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

interface AnalyzingPhaseProps {
  url: string;
  turnstileToken: string | null;
  onComplete: (result: ScanResult, sessionId: string) => void;
  onError: (message: string) => void;
}

export function AnalyzingPhase({
  url,
  turnstileToken,
  onComplete,
  onError,
}: AnalyzingPhaseProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const abortRef = useRef<AbortController | null>(null);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    const controller = new AbortController();
    abortRef.current = controller;

    async function startAnalysis() {
      try {
        const res = await fetch("/api/public/scan/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, turnstileToken: turnstileToken || "" }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          onError(
            (body as { message?: string }).message ??
              `Analysis failed (${res.status})`
          );
          return;
        }

        if (!res.body) {
          onError("No response stream received");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (!raw || raw === "[DONE]") continue;

            try {
              const event = JSON.parse(raw) as ScanSSEEvent;

              if (event.type === "progress") {
                setCurrentStep(event.step);
                // Mark previous steps as completed
                setCompletedSteps((prev) => {
                  const next = new Set(prev);
                  for (let i = 0; i < event.step; i++) {
                    next.add(i);
                  }
                  return next;
                });
              } else if (event.type === "result") {
                // Mark all steps complete then transition
                setCompletedSteps(new Set([0, 1, 2, 3]));
                setCurrentStep(4);
                // Brief pause to show all checkmarks
                setTimeout(() => onComplete(event.data, (event as any).sessionId ?? ""), 800);
                return;
              } else if (event.type === "error") {
                onError(event.message);
                return;
              }
            } catch {
              // Ignore malformed JSON
            }
          }
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        onError("Connection lost. Please try again.");
      }
    }

    startAnalysis();

    return () => {
      controller.abort();
    };
  }, [url, turnstileToken, onComplete, onError]);

  return (
    <div className="space-y-6" role="status" aria-live="polite">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Analizando...
        </h2>
        <p className="mt-2 text-[#94A3B8] text-sm truncate max-w-xs mx-auto">
          {url}
        </p>
        {/* Screen reader progress announcement */}
        <span className="sr-only">
          {currentStep < 4
            ? `Paso ${currentStep + 1} de 4: ${STEPS[currentStep]?.label}`
            : "Análisis completo"}
        </span>
      </div>

      {/* Progress card */}
      <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 shadow-[0_0_30px_rgba(59,143,232,0.05)]">
        <div className="space-y-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            const isActive = i === currentStep;
            const isCompleted = completedSteps.has(i);
            const isPending = i > currentStep;

            return (
              <motion.div
                key={i}
                custom={i}
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                className={`flex items-center gap-4 rounded-xl px-4 py-3 transition-colors duration-500 ${
                  isActive
                    ? "bg-[#3B8FE8]/5 border border-[#3B8FE8]/20"
                    : isCompleted
                      ? "bg-white/[0.02] border border-white/5"
                      : "border border-transparent"
                }`}
              >
                {/* Status icon */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-500 ${
                    isCompleted
                      ? "bg-[#3B8FE8]/15"
                      : isActive
                        ? "bg-[#3B8FE8]/10"
                        : "bg-white/[0.03]"
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {isCompleted ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 15,
                        }}
                      >
                        <Check className="h-5 w-5 text-[#3B8FE8]" />
                      </motion.div>
                    ) : isActive ? (
                      <motion.div
                        key="spinner"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Loader2 className="h-5 w-5 text-[#3B8FE8] animate-spin" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="icon"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <Icon
                          className={`h-5 w-5 ${isPending ? "text-white/20" : "text-white/40"}`}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Label */}
                <span
                  className={`text-sm font-medium transition-colors duration-500 ${
                    isCompleted
                      ? "text-[#3B8FE8]"
                      : isActive
                        ? "text-white"
                        : "text-white/30"
                  }`}
                >
                  {step.label}
                </span>

                {/* Completion indicator */}
                {isCompleted && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-auto text-xs text-[#3B8FE8]/60"
                  >
                    Listo
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="mt-6">
          <div className="h-1 w-full rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#3B8FE8] to-cyan-400"
              initial={{ width: "0%" }}
              animate={{
                width: `${Math.min(((completedSteps.size + (currentStep < 4 ? 0.5 : 0)) / 4) * 100, 100)}%`,
              }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

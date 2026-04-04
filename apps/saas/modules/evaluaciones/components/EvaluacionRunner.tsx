"use client";

import { useState, useRef, useCallback } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { AlertCircleIcon, RotateCcwIcon } from "lucide-react";
import { useTranslations } from 'next-intl';

interface DecisionOption {
  label: string;
  description: string;
}

interface DecisionItem {
  id: string;
  order: number;
  prompt: string;
  options: DecisionOption[];
  consequences: string[];
  proceduralReference: string | null;
}

interface EvaluacionRunnerProps {
  decisions: DecisionItem[];
  respondEndpoint: string;
  onComplete: (scores: {
    alignment: number;
    riskLevel: number;
    criterio: number;
    overallScore: number;
  }) => void;
}

type Phase = "decision" | "consequence" | "exiting";

export function EvaluacionRunner({
  decisions,
  respondEndpoint,
  onComplete,
}: EvaluacionRunnerProps) {
  const t = useTranslations('evaluaciones.runner');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("decision");
  const [consequenceText, setConsequenceText] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const decisionRef = useRef<HTMLDivElement>(null);
  const consequenceRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const decisionStartRef = useRef<number>(Date.now());

  const total = decisions.length;
  const current = decisions[currentIndex];

  // Animate decision entrance
  useGSAP(
    () => {
      if (phase !== "decision" || !decisionRef.current) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReducedMotion) {
        gsap.set(".sim-decision-content, .sim-option-card", {
          opacity: 1,
          y: 0,
        });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      tl.from(".sim-decision-content", {
        opacity: 0,
        y: 30,
        duration: 0.5,
      });

      tl.from(
        ".sim-option-card",
        {
          opacity: 0,
          y: 20,
          stagger: 0.1,
          duration: 0.4,
        },
        0.2,
      );

      // Animate progress bar
      if (progressRef.current) {
        const targetWidth = ((currentIndex + 1) / total) * 100;
        gsap.to(progressRef.current, {
          width: `${targetWidth}%`,
          duration: 0.5,
          ease: "power2.inOut",
        });
      }

      decisionStartRef.current = Date.now();
    },
    { scope: containerRef, dependencies: [currentIndex, phase] },
  );

  // Animate consequence entrance
  useGSAP(
    () => {
      if (phase !== "consequence" || !consequenceRef.current) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReducedMotion) {
        gsap.set(".sim-consequence-text", { opacity: 1 });
        return;
      }

      const tl = gsap.timeline();

      tl.from(".sim-consequence-text", {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
      });

      tl.to(".sim-consequence-text", {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        delay: 1.5,
        onComplete: () => {
          setCurrentIndex((prev) => prev + 1);
          setPhase("decision");
        },
      });
    },
    { scope: containerRef, dependencies: [phase, consequenceText] },
  );

  const handleOptionClick = useCallback(
    async (optionIndex: number) => {
      if (submitting || phase !== "decision" || !current) return;

      setError(null);
      setSubmitting(true);
      const timeToDecide = Math.round(
        (Date.now() - decisionStartRef.current) / 1000,
      );

      try {
        const res = await fetch(`${respondEndpoint}/respond`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decisionId: current.id,
            chosenOption: optionIndex,
            timeToDecide,
          }),
        });

        if (!res.ok) throw new Error("Failed to submit response");

        const consequences = current.consequences as string[];
        const consequence = consequences[optionIndex] ?? null;
        const isLast = currentIndex >= total - 1;

        // Animate selected card pulse
        const prefersReducedMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;

        if (!prefersReducedMotion && containerRef.current) {
          const selectedCard = containerRef.current.querySelectorAll(
            ".sim-option-card",
          )[optionIndex];

          if (selectedCard) {
            gsap.to(selectedCard, {
              scale: 1.03,
              duration: 0.15,
              yoyo: true,
              repeat: 1,
            });
          }

          // Animate everything out
          await gsap
            .to(".sim-decision-content, .sim-option-card", {
              opacity: 0,
              y: -20,
              duration: 0.3,
              stagger: 0.03,
              ease: "power2.in",
              delay: 0.2,
            })
            .then();
        }

        if (isLast) {
          // Complete the run
          setPhase("exiting");
          try {
            const completeRes = await fetch(`${respondEndpoint}/complete`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
            });
            const scores = await completeRes.json();
            onComplete(scores);
          } catch {
            onComplete({
              alignment: 0,
              riskLevel: 0,
              criterio: 0,
              overallScore: 0,
            });
          }
        } else if (consequence) {
          // Show consequence interstitial
          setConsequenceText(consequence);
          setPhase("consequence");
        } else {
          // No consequence text, go directly to next decision
          setCurrentIndex((prev) => prev + 1);
          setPhase("decision");
        }
      } catch (err) {
        setError(t('submitError'));
      } finally {
        setSubmitting(false);
      }
    },
    [
      current,
      currentIndex,
      total,
      respondEndpoint,
      submitting,
      phase,
      onComplete,
    ],
  );

  if (!current || phase === "exiting") return null;

  const options = current.options as DecisionOption[];
  const progressPercent = (currentIndex / total) * 100;

  return (
    <div ref={containerRef} className="mx-auto max-w-3xl px-4">
      {/* Progress bar — visible on mobile */}
      <div className="mb-6 md:mb-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-medium" style={{ color: "#94A3B8" }}>
            {t('decisionOf', { current: currentIndex + 1, total })}
          </span>
          <span className="text-xs font-medium tabular-nums" style={{ color: "#64748B" }}>
            {Math.round(((currentIndex + 1) / total) * 100)}%
          </span>
        </div>
        <div
          className="h-1.5 md:h-1 w-full overflow-hidden rounded-full"
          style={{ backgroundColor: "#1E293B" }}
        >
          <div
            ref={progressRef}
            className="h-full rounded-full"
            style={{
              width: `${progressPercent}%`,
              background:
                "linear-gradient(90deg, #3B8FE8, rgba(59,143,232,0.8))",
            }}
          />
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-950/30 px-4 py-3">
          <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-400" />
          <p className="flex-1 text-sm text-red-300">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-red-400 transition-colors hover:bg-red-950/50 hover:text-red-300"
          >
            <RotateCcwIcon className="h-3 w-3" />
            {t('retry')}
          </button>
        </div>
      )}

      {/* Decision phase */}
      {phase === "decision" && (
        <div ref={decisionRef}>
          {/* Prompt */}
          <div className="sim-decision-content mb-8">
            <h2
              className="text-xl font-semibold leading-relaxed md:text-2xl"
              style={{ color: "#F1F5F9" }}
            >
              {current.prompt}
            </h2>
            {current.proceduralReference && (
              <div
                className="mt-4 rounded-lg border px-4 py-3"
                style={{
                  borderColor: "rgba(59,143,232,0.15)",
                  backgroundColor: "rgba(59,143,232,0.05)",
                }}
              >
                <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: "#3B8FE8" }}>
                  {t('proceduralReference')}
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: "#94A3B8" }}>
                  {current.proceduralReference}
                </p>
              </div>
            )}
          </div>

          {/* Option cards — large touch targets for mobile */}
          <div className="grid grid-cols-1 gap-3 md:gap-4">
            {options.map((option, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => handleOptionClick(idx)}
                disabled={submitting}
                className="sim-option-card group rounded-xl min-h-[56px] p-4 md:p-6 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A1428] disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]"
                style={{
                  backgroundColor: "#111827",
                  borderWidth: "1.5px",
                  borderStyle: "solid",
                  borderColor: "#1E293B",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(59,143,232,0.5)";
                  e.currentTarget.style.boxShadow =
                    "0 0 20px rgba(59,143,232,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1E293B";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <div className="mb-2 md:mb-3 flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 md:h-7 md:w-7 shrink-0 items-center justify-center rounded-full text-sm md:text-xs font-bold transition-colors"
                    style={{
                      borderWidth: "2px",
                      borderStyle: "solid",
                      borderColor: "#334155",
                      color: "#94A3B8",
                    }}
                  >
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span
                    className="text-base md:text-base font-semibold"
                    style={{ color: "#F1F5F9" }}
                  >
                    {option.label}
                  </span>
                </div>
                <p
                  className="text-sm md:text-sm leading-relaxed pl-11 md:pl-10"
                  style={{ color: "#94A3B8" }}
                >
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Consequence interstitial */}
      {phase === "consequence" && consequenceText && (
        <div
          ref={consequenceRef}
          className="flex min-h-[40vh] items-center justify-center"
        >
          <p
            className="sim-consequence-text max-w-xl text-center text-lg italic leading-relaxed"
            style={{ color: "#94A3B8" }}
          >
            {consequenceText}
          </p>
        </div>
      )}
    </div>
  );
}

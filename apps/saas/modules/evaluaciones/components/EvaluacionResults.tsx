"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowLeftIcon, ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { launchConfetti } from "../utils/confetti";

interface EvaluacionResultsProps {
  scores: {
    alignment: number;
    riskLevel: number;
    criterio: number;
    overallScore: number;
  };
  errorPatterns?: string[];
  aiFeedback?: string;
  backHref: string;
}

function scoreColor(score: number): string {
  if (score >= 75) return "#16A34A";
  if (score >= 50) return "#D97706";
  return "#DC2626";
}

function scoreBorderColor(score: number): string {
  if (score >= 75) return "rgba(22,163,74,0.5)";
  if (score >= 50) return "rgba(217,119,6,0.5)";
  return "rgba(220,38,38,0.5)";
}

function scoreBarGradient(score: number): string {
  if (score >= 75) return "linear-gradient(90deg, #16A34A, #22C55E)";
  if (score >= 50) return "linear-gradient(90deg, #D97706, #F59E0B)";
  return "linear-gradient(90deg, #DC2626, #EF4444)";
}

export function EvaluacionResults({
  scores,
  errorPatterns,
  aiFeedback,
  backHref,
}: EvaluacionResultsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreCounterRef = useRef<{ value: number }>({ value: 0 });
  const [displayedScore, setDisplayedScore] = useState(0);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const feedbackContentRef = useRef<HTMLDivElement>(null);

  const dimensions = [
    {
      label: "Alineamiento con procedimiento",
      value: scores.alignment,
      key: "alignment",
    },
    {
      label: "Gestión de riesgo",
      value: 100 - scores.riskLevel,
      key: "riskLevel",
    },
    {
      label: "Criterio de decisión",
      value: scores.criterio,
      key: "criterio",
    },
  ];

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReducedMotion) {
        setDisplayedScore(scores.overallScore);
        gsap.set(
          ".sim-result-circle, .sim-result-dim, .sim-result-pattern, .sim-result-actions",
          { opacity: 1, scale: 1, y: 0, x: 0 },
        );
        gsap.set(".sim-result-bar-fill", { width: "var(--target-width)" });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      // 1. Score circle entrance
      tl.from(".sim-result-circle", {
        scale: 0.8,
        opacity: 0,
        duration: 0.6,
      });

      // 2. Animated score counter
      scoreCounterRef.current.value = 0;
      tl.to(
        scoreCounterRef.current,
        {
          value: scores.overallScore,
          duration: 1.5,
          ease: "power2.out",
          onUpdate: () => {
            setDisplayedScore(
              Math.round(scoreCounterRef.current.value),
            );
          },
        },
        0.3,
      );

      // 3. Dimension bars staggered
      tl.from(
        ".sim-result-dim",
        {
          opacity: 0,
          y: 15,
          stagger: 0.2,
          duration: 0.4,
        },
        1.0,
      );

      // Animate bar fills
      dimensions.forEach((dim, i) => {
        tl.fromTo(
          `.sim-result-bar-${dim.key}`,
          { width: "0%" },
          {
            width: `${dim.value}%`,
            duration: 0.8,
            ease: "power2.out",
          },
          1.2 + i * 0.2,
        );
      });

      // 4. Error patterns
      tl.from(
        ".sim-result-pattern",
        {
          opacity: 0,
          x: -10,
          stagger: 0.05,
          duration: 0.3,
        },
        2.0,
      );

      // 5. Actions
      tl.from(
        ".sim-result-actions",
        {
          opacity: 0,
          y: 10,
          duration: 0.4,
        },
        2.2,
      );

      // 6. Confetti if good score
      if (scores.overallScore >= 70) {
        tl.call(() => launchConfetti(), [], 1.8);
      }
    },
    { scope: containerRef },
  );

  const toggleFeedback = () => {
    if (!feedbackContentRef.current) return;

    if (feedbackOpen) {
      gsap.to(feedbackContentRef.current, {
        height: 0,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => setFeedbackOpen(false),
      });
    } else {
      setFeedbackOpen(true);
      const el = feedbackContentRef.current;
      gsap.set(el, { height: "auto", opacity: 1 });
      const fullHeight = el.scrollHeight;
      gsap.fromTo(
        el,
        { height: 0, opacity: 0 },
        { height: fullHeight, opacity: 1, duration: 0.4, ease: "power2.out" },
      );
    }
  };

  return (
    <div ref={containerRef} className="mx-auto max-w-2xl px-4">
      {/* Overall score circle */}
      <div className="sim-result-circle mb-12 flex flex-col items-center">
        <div
          className="flex h-40 w-40 items-center justify-center rounded-full"
          style={{
            borderWidth: "3px",
            borderStyle: "solid",
            borderColor: scoreBorderColor(scores.overallScore),
          }}
        >
          <div className="text-center">
            <span
              className="text-6xl font-bold tabular-nums"
              style={{ color: scoreColor(scores.overallScore) }}
            >
              {displayedScore}
            </span>
            <p
              className="mt-1 text-xs font-medium uppercase tracking-wider"
              style={{ color: "#64748B" }}
            >
              Score general
            </p>
          </div>
        </div>
      </div>

      {/* Dimension bars */}
      <div className="mb-10 space-y-6">
        {dimensions.map((dim) => (
          <div key={dim.key} className="sim-result-dim">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm" style={{ color: "#94A3B8" }}>
                {dim.label}
              </span>
              <span
                className="text-sm font-semibold tabular-nums"
                style={{ color: scoreColor(dim.value) }}
              >
                {dim.value}
              </span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: "#1E293B" }}
            >
              <div
                className={`sim-result-bar-fill sim-result-bar-${dim.key} h-full rounded-full`}
                style={{
                  width: "0%",
                  background: scoreBarGradient(dim.value),
                  "--target-width": `${dim.value}%`,
                } as React.CSSProperties}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Error patterns */}
      {errorPatterns && errorPatterns.length > 0 && (
        <div className="mb-8">
          <h3
            className="mb-3 text-xs font-medium uppercase tracking-wider"
            style={{ color: "#64748B" }}
          >
            Patrones de error detectados
          </h3>
          <div className="flex flex-wrap gap-2">
            {errorPatterns.map((pattern, idx) => (
              <span
                key={idx}
                className="sim-result-pattern rounded-full px-3 py-1.5 text-xs font-medium"
                style={{
                  backgroundColor: "rgba(220,38,38,0.1)",
                  color: "#EF4444",
                }}
              >
                {pattern}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* AI Feedback (expandable) */}
      {aiFeedback && (
        <div
          className="mb-10 overflow-hidden rounded-xl"
          style={{
            backgroundColor: "#111827",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "#1E293B",
          }}
        >
          <button
            onClick={toggleFeedback}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors"
            style={{ color: "#F1F5F9" }}
          >
            <span className="text-sm font-medium">
              {feedbackOpen
                ? "Ocultar retroalimentación"
                : "Ver retroalimentación detallada"}
            </span>
            <ChevronDownIcon
              className="h-4 w-4 transition-transform"
              style={{
                color: "#64748B",
                transform: feedbackOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </button>
          <div
            ref={feedbackContentRef}
            className="overflow-hidden"
            style={{ height: feedbackOpen ? "auto" : 0 }}
          >
            <div className="px-5 pb-5">
              <p
                className="text-sm leading-relaxed"
                style={{ color: "#94A3B8" }}
              >
                {aiFeedback}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="sim-result-actions flex justify-center">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all"
          style={{
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "#1E293B",
            color: "#94A3B8",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "rgba(59,143,232,0.3)";
            e.currentTarget.style.color = "#F1F5F9";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "#1E293B";
            e.currentTarget.style.color = "#94A3B8";
          }}
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver al catálogo
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitWords } from "@shared/components/SplitWords";
import { useTranslations } from 'next-intl';
import { ShieldAlertIcon, UserCircle2Icon, TargetIcon } from "lucide-react";

interface EvaluacionIntroProps {
  templateTitle: string;
  narrative: string;
  roleName?: string;
  processName?: string;
  scenarioCount?: number;
  onStart: () => void;
}

export function EvaluacionIntro({
  templateTitle,
  narrative,
  roleName,
  processName,
  scenarioCount,
  onStart,
}: EvaluacionIntroProps) {
  const t = useTranslations('evaluaciones.intro');
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReducedMotion) {
        gsap.set(
          ".sim-intro-word, .sim-intro-narrative, .sim-intro-label, .sim-intro-btn, .sim-intro-meta, .sim-intro-stakes",
          { opacity: 1, y: 0, clipPath: "none" },
        );
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: "power2.out" } });

      // 1. Label fade in
      tl.from(".sim-intro-label", {
        opacity: 0,
        y: 10,
        duration: 0.5,
      });

      // 2. Title word-reveal
      tl.from(
        ".sim-intro-word .split-word-inner",
        {
          y: "110%",
          stagger: 0.06,
          duration: 1.0,
          ease: "power4.out",
        },
        0.3,
      );

      // 3. Meta badges
      tl.from(
        ".sim-intro-meta",
        {
          opacity: 0,
          y: 15,
          stagger: 0.1,
          duration: 0.5,
        },
        0.8,
      );

      // 4. Narrative fade in
      tl.from(
        ".sim-intro-narrative",
        {
          opacity: 0,
          y: 20,
          duration: 0.8,
        },
        1.0,
      );

      // 5. Stakes bar
      tl.from(
        ".sim-intro-stakes",
        {
          opacity: 0,
          y: 15,
          duration: 0.5,
        },
        1.3,
      );

      // 6. Button appears
      tl.from(
        ".sim-intro-btn",
        {
          opacity: 0,
          y: 10,
          duration: 0.5,
        },
        1.5,
      );
    },
    { scope: containerRef },
  );

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-screen flex-col items-center justify-center px-5 md:px-6 py-12"
      style={{ backgroundColor: "#0A1428" }}
    >
      {/* Gradient overlays */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(59,143,232,0.08), transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at bottom left, rgba(217,119,6,0.04), transparent 60%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        {/* Label */}
        <p
          className="sim-intro-label mb-4 md:mb-6 text-xs font-medium uppercase tracking-[0.2em]"
          style={{ color: "#3B8FE8" }}
        >
          {t('label')}
        </p>

        {/* Title */}
        <h1
          className="sim-intro-word mb-6 md:mb-10 text-2xl md:text-5xl font-semibold leading-tight tracking-tight"
          style={{ color: "#F1F5F9" }}
        >
          <SplitWords>{templateTitle}</SplitWords>
        </h1>

        {/* Role & Process badges — cinematic context */}
        {(roleName || processName || scenarioCount) && (
          <div className="mb-6 md:mb-8 flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {roleName && (
              <div
                className="sim-intro-meta inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                style={{
                  backgroundColor: "rgba(59,143,232,0.1)",
                  color: "#93C5FD",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "rgba(59,143,232,0.2)",
                }}
              >
                <UserCircle2Icon className="size-3.5" />
                {t('yourRole', { role: roleName })}
              </div>
            )}
            {processName && (
              <div
                className="sim-intro-meta inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                style={{
                  backgroundColor: "rgba(217,119,6,0.1)",
                  color: "#FCD34D",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "rgba(217,119,6,0.2)",
                }}
              >
                <TargetIcon className="size-3.5" />
                {processName}
              </div>
            )}
            {scenarioCount && scenarioCount > 0 && (
              <div
                className="sim-intro-meta inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium"
                style={{
                  backgroundColor: "rgba(16,185,129,0.1)",
                  color: "#6EE7B7",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderColor: "rgba(16,185,129,0.2)",
                }}
              >
                <ShieldAlertIcon className="size-3.5" />
                {t('decisionCount', { count: scenarioCount })}
              </div>
            )}
          </div>
        )}

        {/* Narrative */}
        <div
          className="sim-intro-narrative mb-8 md:mb-10 space-y-4 text-left text-base md:text-lg italic leading-relaxed"
          style={{ color: "#94A3B8" }}
        >
          {narrative.split("\n").filter(Boolean).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        {/* Stakes callout */}
        <div
          className="sim-intro-stakes mb-8 md:mb-10 mx-auto max-w-md rounded-lg px-4 py-3 text-center"
          style={{
            backgroundColor: "rgba(220,38,38,0.06)",
            borderWidth: "1px",
            borderStyle: "solid",
            borderColor: "rgba(220,38,38,0.15)",
          }}
        >
          <p className="text-xs md:text-sm font-medium" style={{ color: "#FCA5A5" }}>
            {t('stakesMessage')}
          </p>
        </div>

        {/* Start button */}
        <button
          type="button"
          onClick={onStart}
          className="sim-intro-btn inline-flex min-h-[52px] md:min-h-[48px] items-center rounded-full px-10 py-3.5 text-base font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
          style={{
            backgroundColor: "#3B8FE8",
            color: "#0A1428",
          }}
        >
          {t('startButton')}
        </button>
      </div>
    </div>
  );
}

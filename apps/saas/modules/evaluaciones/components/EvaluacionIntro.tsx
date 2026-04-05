"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitWords } from "@shared/components/SplitWords";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
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
      className="relative flex min-h-screen flex-col items-center justify-center px-5 md:px-6 py-12 bg-background"
    >
      {/* Gradient overlays */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top right, hsl(var(--primary) / 0.08), transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at bottom left, hsl(var(--chart-4) / 0.04), transparent 60%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        {/* Label */}
        <p className="sim-intro-label mb-4 md:mb-6 text-xs font-medium uppercase tracking-[0.2em] text-primary">
          {t('label')}
        </p>

        {/* Title */}
        <h1 className="sim-intro-word mb-6 md:mb-10 text-2xl md:text-5xl font-semibold leading-tight tracking-tight text-foreground">
          <SplitWords>{templateTitle}</SplitWords>
        </h1>

        {/* Role & Process badges — cinematic context */}
        {(roleName || processName || scenarioCount) && (
          <div className="mb-6 md:mb-8 flex flex-wrap items-center justify-center gap-2 md:gap-3">
            {roleName && (
              <Badge
                status="info"
                className="sim-intro-meta gap-1.5 rounded-full px-3 py-1.5 text-xs"
              >
                <UserCircle2Icon className="size-3.5" />
                {t('yourRole', { role: roleName })}
              </Badge>
            )}
            {processName && (
              <Badge
                status="warning"
                className="sim-intro-meta gap-1.5 rounded-full px-3 py-1.5 text-xs"
              >
                <TargetIcon className="size-3.5" />
                {processName}
              </Badge>
            )}
            {scenarioCount && scenarioCount > 0 && (
              <Badge
                status="success"
                className="sim-intro-meta gap-1.5 rounded-full px-3 py-1.5 text-xs"
              >
                <ShieldAlertIcon className="size-3.5" />
                {t('decisionCount', { count: scenarioCount })}
              </Badge>
            )}
          </div>
        )}

        {/* Narrative */}
        <div className="sim-intro-narrative mb-8 md:mb-10 space-y-4 text-left text-base md:text-lg italic leading-relaxed text-muted-foreground">
          {narrative.split("\n").filter(Boolean).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        {/* Stakes callout */}
        <div className="sim-intro-stakes mb-8 md:mb-10 mx-auto max-w-md rounded-lg border border-destructive/15 bg-destructive/5 px-4 py-3 text-center">
          <p className="text-xs md:text-sm font-medium text-destructive">
            {t('stakesMessage')}
          </p>
        </div>

        {/* Start button */}
        <Button
          onClick={onStart}
          size="lg"
          className="sim-intro-btn rounded-full px-10 min-h-[52px] md:min-h-[48px] text-base font-semibold"
        >
          {t('startButton')}
        </Button>
      </div>
    </div>
  );
}

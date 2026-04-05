"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowLeftIcon, ChevronDownIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@repo/ui";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { useTranslations } from "next-intl";
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

function scoreColorClass(score: number): string {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-destructive";
}

function scoreBorderClass(score: number): string {
  if (score >= 80) return "border-emerald-500/50";
  if (score >= 60) return "border-amber-500/50";
  return "border-destructive/50";
}

function scoreBarClass(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-destructive";
}

export function EvaluacionResults({
  scores,
  errorPatterns,
  aiFeedback,
  backHref,
}: EvaluacionResultsProps) {
  const t = useTranslations('evaluaciones.results');
  const containerRef = useRef<HTMLDivElement>(null);
  const scoreCounterRef = useRef<{ value: number }>({ value: 0 });
  const [displayedScore, setDisplayedScore] = useState(0);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const feedbackContentRef = useRef<HTMLDivElement>(null);

  const dimensions = [
    {
      label: t('alignmentLabel'),
      value: scores.alignment,
      key: "alignment",
    },
    {
      label: t('riskManagementLabel'),
      value: 100 - scores.riskLevel,
      key: "riskLevel",
    },
    {
      label: t('criterioLabel'),
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
          className={cn(
            "flex h-40 w-40 items-center justify-center rounded-full border-[3px]",
            scoreBorderClass(scores.overallScore),
          )}
        >
          <div className="text-center">
            <span
              className={cn(
                "text-6xl font-bold tabular-nums",
                scoreColorClass(scores.overallScore),
              )}
            >
              {displayedScore}
            </span>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('overallScore')}
            </p>
          </div>
        </div>
      </div>

      {/* Dimension bars */}
      <div className="mb-10 space-y-6">
        {dimensions.map((dim) => (
          <div key={dim.key} className="sim-result-dim">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {dim.label}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums",
                  scoreColorClass(dim.value),
                )}
              >
                {dim.value}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  `sim-result-bar-fill sim-result-bar-${dim.key} h-full rounded-full`,
                  scoreBarClass(dim.value),
                )}
                style={{
                  width: "0%",
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
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t('errorPatterns')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {errorPatterns.map((pattern, idx) => (
              <Badge
                key={idx}
                status="error"
                className="sim-result-pattern"
              >
                {pattern}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* AI Feedback (expandable) */}
      {aiFeedback && (
        <div className="mb-10 overflow-hidden rounded-xl border border-border bg-card">
          <button
            type="button"
            onClick={toggleFeedback}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors text-foreground min-h-[48px]"
          >
            <span className="text-sm font-medium">
              {feedbackOpen
                ? t('hideFeedback')
                : t('showFeedback')}
            </span>
            <ChevronDownIcon
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                feedbackOpen && "rotate-180",
              )}
            />
          </button>
          <div
            ref={feedbackContentRef}
            className="overflow-hidden"
            style={{ height: feedbackOpen ? "auto" : 0 }}
          >
            <div className="px-5 pb-5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {aiFeedback}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="sim-result-actions flex justify-center">
        <Button variant="outline" asChild className="rounded-full min-h-[48px]">
          <Link href={backHref}>
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            {t('backToCatalog')}
          </Link>
        </Button>
      </div>
    </div>
  );
}

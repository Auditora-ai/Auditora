"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { SplitWords } from "@shared/components/SplitWords";

interface SimulationIntroProps {
  templateTitle: string;
  narrative: string;
  onStart: () => void;
}

export function SimulationIntro({
  templateTitle,
  narrative,
  onStart,
}: SimulationIntroProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (prefersReducedMotion) {
        gsap.set(
          ".sim-intro-word, .sim-intro-narrative, .sim-intro-label, .sim-intro-btn",
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

      // 3. Narrative fade in
      tl.from(
        ".sim-intro-narrative",
        {
          opacity: 0,
          y: 20,
          duration: 0.8,
        },
        1.0,
      );

      // 4. Button appears
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
      className="relative flex min-h-screen flex-col items-center justify-center px-6"
      style={{ backgroundColor: "#0A1428" }}
    >
      {/* Gradient overlays */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(0,229,192,0.08), transparent 60%)",
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
          className="sim-intro-label mb-6 text-xs font-medium uppercase tracking-[0.2em]"
          style={{ color: "#00E5C0" }}
        >
          Simulación
        </p>

        {/* Title */}
        <h1
          className="sim-intro-word mb-10 font-display text-3xl font-normal leading-tight md:text-5xl"
          style={{ color: "#F1F5F9" }}
        >
          <SplitWords>{templateTitle}</SplitWords>
        </h1>

        {/* Narrative */}
        <div
          className="sim-intro-narrative mb-12 space-y-4 text-left font-display text-lg italic leading-relaxed"
          style={{ color: "#94A3B8" }}
        >
          {narrative.split("\n").filter(Boolean).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>

        {/* Start button */}
        <button
          onClick={onStart}
          className="sim-intro-btn inline-flex min-h-[48px] items-center rounded-full px-10 py-3.5 text-base font-semibold transition-colors hover:opacity-90"
          style={{
            backgroundColor: "#00E5C0",
            color: "#0A1428",
          }}
        >
          Comenzar Simulación
        </button>
      </div>
    </div>
  );
}

"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import { SplitWords } from "@shared/components/SplitWords";
import { cn } from "@repo/ui";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const steps = [
  {
    number: 1,
    titleKey: "step1.title",
    descriptionKey: "step1.description",
  },
  {
    number: 2,
    titleKey: "step2.title",
    descriptionKey: "step2.description",
  },
  {
    number: 3,
    titleKey: "step3.title",
    descriptionKey: "step3.description",
  },
] as const;

export function HowItWorks() {
  const t = useTranslations("home.howItWorks");
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",
        once: true,
      },
    });

    tl.from(".hiw-step", {
      y: 40,
      opacity: 0,
      duration: 0.8,
      stagger: 0.2,
      delay: 0.1,
      ease: "power3.out",
    });

    tl.from(
      ".hiw-line",
      {
        scaleY: 0,
        opacity: 0,
        duration: 0.6,
        stagger: 0.2,
        delay: 0.3,
        ease: "power3.out",
      },
      "-=0.6",
    );
  }, { scope: containerRef });

  return (
    <section
      ref={containerRef}
      className="relative py-24 px-6"
      id="how-it-works"
    >
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-[#00E5C0]/20 bg-[#00E5C0]/5 px-4 py-1.5 text-xs font-medium text-[#00E5C0]">
            {t("badge")}
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            <SplitWords>{t("title")}</SplitWords>
          </h2>
        </div>

        {/* Steps */}
        <div className="flex flex-col items-center gap-12 md:flex-row md:gap-0">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center md:flex-1">
              {/* Step card */}
              <div className="hiw-step flex flex-col items-center text-center md:w-full">
                {/* Number circle */}
                <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#00E5C0]/30 bg-[#00E5C0]/10 text-lg font-bold text-[#00E5C0]">
                  {step.number}
                </div>

                {/* Title */}
                <h3 className="mt-5 text-lg font-semibold text-white">
                  {t(step.titleKey)}
                </h3>

                {/* Description */}
                <p className="mt-2 max-w-[220px] text-sm leading-relaxed text-white/50">
                  {t(step.descriptionKey)}
                </p>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "hiw-line mx-6 hidden flex-shrink-0 md:block",
                    "relative h-px w-16 bg-white/10",
                    "after:absolute after:right-0 after:top-1/2 after:h-0 after:w-0",
                    "after:-translate-y-1/2 after:border-l-[6px] after:border-l-white/20",
                    "after:border-t-[5px] after:border-t-transparent",
                    "after:border-b-[5px] after:border-b-transparent"
                  )}
                />
              )}

              {/* Mobile connector */}
              {index < steps.length - 1 && (
                <div className="hiw-line flex flex-col items-center md:hidden">
                  <div className="h-8 w-px bg-white/10" />
                  <div className="h-0 w-0 border-l-[5px] border-l-white/20 border-t-[6px] border-t-transparent border-r-[5px] border-r-transparent" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

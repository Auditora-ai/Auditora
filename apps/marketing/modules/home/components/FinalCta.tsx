"use client";

import { useRef, useState } from "react";
import { config } from "@config";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import { SplitWords } from "@shared/components/SplitWords";
import { Button, cn } from "@repo/ui";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function FinalCta() {
  const t = useTranslations("home.finalCta");
  const containerRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState("");

  useGSAP(() => {
    if (!containerRef.current) return;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top 80%",
        once: true,
      },
    });

    tl.from(".final-cta-inner", {
      y: 50,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
    });

    tl.from(
      ".final-cta-card",
      {
        y: 30,
        opacity: 0,
        duration: 0.7,
        ease: "power3.out",
      },
      "-=0.5",
    );
  }, { scope: containerRef });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUrl = url.trim() ? `${config.saasUrl}/scan?url=${encodeURIComponent(url.trim())}` : config.saasUrl;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden py-24 px-6"
      id="cta"
    >
      {/* Radial teal glow background */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_60%,rgba(0,229,192,0.06),transparent_70%)]" />

      <div className="relative mx-auto max-w-2xl text-center">
        {/* Title */}
        <div className="final-cta-inner">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            <SplitWords>{t("title")}</SplitWords>
          </h2>

          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/50">
            {t("subtitle")}
          </p>
        </div>

        {/* Glass card with input */}
        <div className="final-cta-card mt-10">
          <form
            onSubmit={handleSubmit}
            className={cn(
              "mx-auto flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md",
              "sm:flex-row sm:gap-0 sm:p-2"
            )}
          >
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("inputPlaceholder")}
              className={cn(
                "w-full rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-white placeholder:text-white/30",
                "outline-none transition-colors focus:border-[#00E5C0]/40 sm:flex-1"
              )}
            />
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
            >
              {t("button")}
            </Button>
          </form>

          {/* Note text */}
          <p className="mt-5 text-xs leading-relaxed text-white/30">
            {t("note")}
          </p>
        </div>
      </div>
    </section>
  );
}

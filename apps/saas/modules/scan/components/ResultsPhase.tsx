"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Share2,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import type { ScanResult, ScanRisk } from "../types";

const SIGNUP_URL = process.env.NEXT_PUBLIC_SAAS_URL
  ? `${process.env.NEXT_PUBLIC_SAAS_URL}/signup`
  : "/signup";

/* ------------------------------------------------------------------ */
/*  Animation variants                                                  */
/* ------------------------------------------------------------------ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function scoreColor(score: number): string {
  if (score > 60) return "#EF4444"; // red
  if (score > 30) return "#F59E0B"; // yellow
  return "#22C55E"; // green
}

function scoreLabel(score: number): string {
  if (score > 60) return "Riesgo Alto";
  if (score > 30) return "Riesgo Medio";
  return "Riesgo Bajo";
}

function severityBadge(severity: ScanRisk["severity"]) {
  const map = {
    critical: "bg-red-500/15 text-red-400 border-red-500/20",
    high: "bg-orange-500/15 text-orange-400 border-orange-500/20",
    medium: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
    low: "bg-green-500/15 text-green-400 border-green-500/20",
  };
  return map[severity];
}

function riskLevelBorder(level: string) {
  const map: Record<string, string> = {
    critical: "border-l-red-500",
    high: "border-l-orange-500",
    medium: "border-l-yellow-500",
    low: "border-l-[#3B8FE8]",
  };
  return map[level] ?? "border-l-[#3B8FE8]";
}

/* ------------------------------------------------------------------ */
/*  Animated counter hook                                               */
/* ------------------------------------------------------------------ */

function useAnimatedCounter(target: number, duration = 1500) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const startTime = Date.now();

    function tick() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setValue(current);

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }, [target, duration]);

  return value;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

interface ResultsPhaseProps {
  url: string;
  result: ScanResult;
  sessionId: string | null;
  onReset: () => void;
}

export function ResultsPhase({ url, result, sessionId, onReset }: ResultsPhaseProps) {
  const animatedScore = useAnimatedCounter(result.vulnerabilityScore);
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);

  const color = scoreColor(result.vulnerabilityScore);
  const label = scoreLabel(result.vulnerabilityScore);

  const handleShare = useCallback(async () => {
    setSharing(true);
    try {
      // Get or create a persistent share link via the API
      let finalUrl = shareUrl;
      if (!finalUrl && sessionId) {
        const res = await fetch("/api/public/scan/share", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        });
        if (res.ok) {
          const data = await res.json();
          finalUrl = data.shareUrl;
          setShareUrl(finalUrl);
        }
      }

      if (!finalUrl) {
        // Fallback: share the scan URL
        finalUrl = `${window.location.origin}/scan?url=${encodeURIComponent(url)}`;
      }

      if (navigator.share) {
        try {
          await navigator.share({
            title: `${result.companyName} — Análisis Operativo`,
            text: `Mira el análisis de riesgo operativo de ${result.companyName}`,
            url: finalUrl,
          });
          return;
        } catch {
          // Fallback to clipboard
        }
      }

      await navigator.clipboard.writeText(finalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setSharing(false);
    }
  }, [url, result.companyName, sessionId, shareUrl]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* ---- Header: Company + Industry ---- */}
      <motion.div variants={fadeUp} className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {result.companyName}
        </h1>
        <div className="mt-3 flex items-center justify-center gap-3">
          <span className="bg-[#3B8FE8]/15 text-[#3B8FE8] rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest">
            {result.industry}
          </span>
        </div>
      </motion.div>

      {/* Divider */}
      <motion.div
        variants={fadeUp}
        className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />

      {/* ---- Executive Summary ---- */}
      {result.summary && (
        <motion.div
          variants={fadeUp}
          className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8"
        >
          <h2 className="text-sm font-semibold uppercase tracking-widest text-[#94A3B8] mb-3">
            Resumen Ejecutivo
          </h2>
          <p className="text-sm text-white/70 leading-relaxed">
            {result.summary}
          </p>
        </motion.div>
      )}

      {/* ---- Vulnerability Score Card ---- */}
      <motion.div
        variants={fadeUp}
        className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center shadow-[0_0_30px_rgba(59,143,232,0.05)]"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-[#94A3B8] mb-4">
          Puntuación de Vulnerabilidad
        </p>

        {/* Score gauge */}
        <div className="relative mx-auto mb-4 flex items-center justify-center">
          {/* Background ring */}
          <svg
            width="160"
            height="160"
            viewBox="0 0 160 160"
            className="transform -rotate-90"
          >
            <circle
              cx="80"
              cy="80"
              r="68"
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="10"
            />
            <motion.circle
              cx="80"
              cy="80"
              r="68"
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 68}`}
              initial={{ strokeDashoffset: 2 * Math.PI * 68 }}
              animate={{
                strokeDashoffset:
                  2 * Math.PI * 68 * (1 - result.vulnerabilityScore / 100),
              }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ filter: `drop-shadow(0 0 8px ${color}40)` }}
            />
          </svg>

          {/* Center number */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="text-5xl font-bold tabular-nums"
              style={{ color }}
            >
              {animatedScore}
            </span>
            <span className="text-xs text-white/40 mt-1">/ 100</span>
          </div>
        </div>

        <span
          className="inline-block rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest"
          style={{
            backgroundColor: `${color}15`,
            color,
          }}
        >
          {label}
        </span>
      </motion.div>

      {/* ---- Critical Processes Detected ---- */}
      <motion.div variants={fadeUp}>
        <h2 className="text-xl font-bold tracking-tight text-white mb-4">
          Procesos Críticos Detectados
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {result.processes.map((process, i) => (
            <motion.div
              key={process.id}
              variants={fadeUp}
              custom={i}
              className={`bg-white/[0.03] backdrop-blur-sm border border-white/10 border-l-4 ${riskLevelBorder(process.riskLevel)} rounded-2xl p-5 transition-colors hover:border-white/20`}
            >
              <h3 className="text-sm font-semibold text-white mb-1">
                {process.name}
              </h3>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {process.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ---- Highest Risk Process ---- */}
      <motion.div variants={fadeUp}>
        <h2 className="text-xl font-bold tracking-tight text-white mb-4">
          Proceso de Mayor Riesgo
        </h2>
        <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 shadow-[0_0_30px_rgba(59,143,232,0.05)]">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <ShieldAlert className="h-5 w-5 text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {result.highestRiskProcess.name}
            </h3>
          </div>

          <div className="space-y-4">
            {result.highestRiskProcess.risks.map((risk, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="flex items-start gap-3 rounded-xl bg-white/[0.02] border border-white/5 p-4"
              >
                <div className="mt-0.5">
                  {risk.severity === "critical" || risk.severity === "high" ? (
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  ) : (
                    <Info className="h-4 w-4 text-yellow-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-white">
                      {risk.title}
                    </span>
                    <span
                      className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${severityBadge(risk.severity)}`}
                    >
                      {risk.severity}
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] leading-relaxed">
                    {risk.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ---- Disclaimer ---- */}
      <motion.div
        variants={fadeUp}
        className="flex items-start gap-3 rounded-xl bg-white/[0.02] border border-white/5 p-4"
      >
        <Info className="h-4 w-4 mt-0.5 shrink-0 text-white/30" />
        <p className="text-xs text-white/40 leading-relaxed">
          Este es un análisis superficial basado en información pública.
          Para una evaluación completa que incluya procesos internos, matrices
          de riesgo y recomendaciones accionables, crea un diagnóstico completo.
        </p>
      </motion.div>

      {/* ---- CTAs ---- */}
      <motion.div
        variants={fadeUp}
        className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center pt-2"
      >
        {/* Primary CTA — deep analysis via interview */}
        <Link
          href={SIGNUP_URL}
          className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-[#3B8FE8] px-7 py-3.5 text-sm font-bold text-white shadow-[0_0_30px_rgba(59,143,232,0.15)] transition-all duration-300 hover:bg-[#2E7FD6] hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(59,143,232,0.25)] min-h-[44px]"
        >
          Regístrate para diagnóstico completo
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>

        {/* Share CTA */}
        <button
          onClick={handleShare}
          disabled={sharing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-white/80 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed min-h-[44px]"
        >
          {sharing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : copied ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <Share2 className="h-4 w-4" />
          )}
          {copied ? "¡Link copiado!" : sharing ? "Compartiendo..." : "Compartir"}
        </button>

        {/* Scan again */}
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-medium text-white/40 transition-all duration-300 hover:text-white/70 min-h-[44px]"
        >
          <RotateCcw className="h-4 w-4" />
          Escanear otro
        </button>
      </motion.div>

      {/* Bottom spacer */}
      <div className="h-8" />
    </motion.div>
  );
}

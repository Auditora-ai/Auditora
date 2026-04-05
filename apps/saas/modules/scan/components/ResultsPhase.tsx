"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  ArrowRightCircle,
  Users,
  Package,
  Cog,
  PackageCheck,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import type { ScanResult, ScanRisk, ScanSipoc } from "../types";

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
    low: "border-l-primary",
  };
  return map[level] ?? "border-l-primary";
}

/* ------------------------------------------------------------------ */
/*  SIPOC Visual Map Component                                         */
/* ------------------------------------------------------------------ */

const SIPOC_COLUMNS = [
  { key: "suppliers" as const, label: "Proveedores", abbr: "S", icon: Users, color: "#8B5CF6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.2)" },
  { key: "inputs" as const, label: "Entradas", abbr: "I", icon: Package, color: "#3B82F6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)" },
  { key: "processSteps" as const, label: "Proceso", abbr: "P", icon: Cog, color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)" },
  { key: "outputs" as const, label: "Salidas", abbr: "O", icon: PackageCheck, color: "#22C55E", bg: "rgba(34,197,94,0.08)", border: "rgba(34,197,94,0.2)" },
  { key: "customers" as const, label: "Clientes", abbr: "C", icon: UserCheck, color: "#EC4899", bg: "rgba(236,72,153,0.08)", border: "rgba(236,72,153,0.2)" },
] as const;

function SipocMap({ sipoc }: { sipoc: ScanSipoc }) {
  return (
    <div className="space-y-3">
      {/* SIPOC header row — always visible */}
      <div className="flex items-center justify-between gap-1 px-1">
        {SIPOC_COLUMNS.map((col, i) => (
          <div key={col.key} className="flex items-center gap-1">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold"
              style={{ backgroundColor: col.bg, color: col.color, border: `1px solid ${col.border}` }}
            >
              {col.abbr}
            </span>
            <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wider text-white/50">
              {col.label}
            </span>
            {i < SIPOC_COLUMNS.length - 1 && (
              <ArrowRightCircle className="ml-1 h-3 w-3 shrink-0 text-white/15 hidden sm:block" />
            )}
          </div>
        ))}
      </div>

      {/* Flow arrows on mobile (between abbreviation boxes) */}
      <div className="flex items-center justify-between gap-1 sm:hidden px-1">
        {SIPOC_COLUMNS.map((col, i) => (
          <div key={col.key} className="flex items-center gap-0.5">
            <span className="text-[9px] font-semibold uppercase tracking-wider text-white/40">
              {col.label}
            </span>
            {i < SIPOC_COLUMNS.length - 1 && (
              <ArrowRight className="h-2.5 w-2.5 shrink-0 text-white/15" />
            )}
          </div>
        ))}
      </div>

      {/* SIPOC data grid */}
      <div className="grid grid-cols-5 gap-2">
        {SIPOC_COLUMNS.map((col) => {
          const items = sipoc[col.key] || [];
          const ColIcon = col.icon;
          return (
            <div
              key={col.key}
              className="rounded-xl p-2 sm:p-3 min-h-[80px]"
              style={{ backgroundColor: col.bg, border: `1px solid ${col.border}` }}
            >
              <ColIcon className="h-3.5 w-3.5 mb-2 sm:hidden" style={{ color: col.color }} />
              <div className="space-y-1.5">
                {items.length > 0 ? (
                  items.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-md px-1.5 py-1 text-[10px] sm:text-xs leading-tight font-medium text-white/80 bg-white/[0.06]"
                    >
                      {item}
                    </div>
                  ))
                ) : (
                  <span className="text-[10px] text-white/25 italic">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FMEA Risk Matrix Component                                         */
/* ------------------------------------------------------------------ */

function FmeaRiskBadge({ severity }: { severity: ScanRisk["severity"] }) {
  const configs = {
    critical: { label: "Crítico", rpn: "16-25", color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
    high: { label: "Alto", rpn: "10-15", color: "#F97316", bg: "rgba(249,115,22,0.12)" },
    medium: { label: "Medio", rpn: "5-9", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
    low: { label: "Bajo", rpn: "1-4", color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  };
  const c = configs[severity];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ backgroundColor: c.bg, color: c.color }}
    >
      FMEA {c.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated counter hook                                               */
/* ------------------------------------------------------------------ */

function useAnimatedCounter(target: number, duration = 1500) {
  const [value, setValue] = useState(0);

  useEffect(() => {
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
/*  Build SIPOC from processes if API didn't provide one                */
/* ------------------------------------------------------------------ */

function buildFallbackSipoc(result: ScanResult): ScanSipoc {
  const processNames = result.processes.map((p) => p.name);
  return {
    suppliers: ["Clientes internos", "Proveedores externos"],
    inputs: ["Solicitudes", "Documentación", "Datos operativos"],
    processSteps: processNames.length > 0 ? processNames.slice(0, 5) : ["Proceso principal"],
    outputs: ["Productos / Servicios", "Reportes", "Entregables"],
    customers: ["Clientes finales", "Stakeholders internos"],
  };
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

  // Use API SIPOC data or build a fallback from detected processes
  const sipoc = useMemo(
    () => result.sipoc ?? buildFallbackSipoc(result),
    [result],
  );

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
        <div className="mt-3 flex items-center justify-center gap-3 flex-wrap">
          <span className="bg-primary/15 text-primary rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest">
            {result.industry}
          </span>
          <span className="bg-white/[0.04] text-white/50 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest border border-white/10">
            Metodología SIPOC + FMEA
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
          <h2 className="text-sm font-semibold uppercase tracking-widest text-chrome-text-secondary mb-3">
            Resumen Ejecutivo
          </h2>
          <p className="text-sm text-white/70 leading-relaxed">
            {result.summary}
          </p>
        </motion.div>
      )}

      {/* ---- SIPOC Process Map ---- */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Mapa SIPOC
          </h2>
          <span className="bg-amber-500/10 text-amber-400 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest border border-amber-500/15">
            Suppliers → Inputs → Process → Outputs → Customers
          </span>
        </div>
        <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-4 sm:p-6 shadow-[0_0_30px_rgba(59,143,232,0.05)]">
          <SipocMap sipoc={sipoc} />
        </div>
      </motion.div>

      {/* ---- Vulnerability Score Card ---- */}
      <motion.div
        variants={fadeUp}
        className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center shadow-[0_0_30px_rgba(59,143,232,0.05)]"
      >
        <p className="text-sm font-semibold uppercase tracking-widest text-chrome-text-secondary mb-1">
          Puntuación de Vulnerabilidad
        </p>
        <p className="text-[10px] font-medium uppercase tracking-wider text-white/30 mb-4">
          Evaluación de riesgos FMEA
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
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-sm font-semibold text-white">
                  {process.name}
                </h3>
                <span
                  className={`shrink-0 inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${severityBadge(process.riskLevel as ScanRisk["severity"])}`}
                >
                  {process.riskLevel}
                </span>
              </div>
              <p className="text-xs text-chrome-text-secondary leading-relaxed">
                {process.description}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ---- Highest Risk Process — FMEA Analysis ---- */}
      <motion.div variants={fadeUp}>
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <h2 className="text-xl font-bold tracking-tight text-white">
            Análisis FMEA — Proceso de Mayor Riesgo
          </h2>
        </div>
        <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl p-6 sm:p-8 shadow-[0_0_30px_rgba(59,143,232,0.05)]">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10">
              <ShieldAlert className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                {result.highestRiskProcess.name}
              </h3>
              <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">
                Failure Mode & Effects Analysis
              </p>
            </div>
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
                    <FmeaRiskBadge severity={risk.severity} />
                  </div>
                  <p className="text-xs text-chrome-text-secondary leading-relaxed">
                    {risk.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* FMEA legend */}
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-white/25 mr-1">Escala FMEA:</span>
            {(["low", "medium", "high", "critical"] as const).map((s) => (
              <FmeaRiskBadge key={s} severity={s} />
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
          Este es un análisis superficial basado en información pública (SIPOC + FMEA inferido).
          Para una evaluación completa con procesos internos, matrices FMEA detalladas,
          diagramas BPMN 2.0 y recomendaciones accionables, crea un diagnóstico completo.
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
          className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-bold text-white shadow-[0_0_30px_rgba(59,143,232,0.15)] transition-all duration-300 hover:bg-action-hover hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(59,143,232,0.25)] min-h-[48px]"
        >
          Regístrate para diagnóstico completo
          <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>

        {/* Share CTA */}
        <button
          onClick={handleShare}
          disabled={sharing}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-white/80 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed min-h-[48px]"
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
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-medium text-white/40 transition-all duration-300 hover:text-white/70 min-h-[48px]"
        >
          <RotateCcw className="h-4 w-4" />
          Escanear otro
        </button>
      </motion.div>

      {/* Bottom spacer for safe area on mobile */}
      <div className="h-8 pb-safe" />
    </motion.div>
  );
}

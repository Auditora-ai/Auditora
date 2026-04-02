"use client";

import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import Link from "next/link";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const orbFloat = {
  y: [0, -18, 0],
  x: [0, 10, 0],
  scale: [1, 1.08, 1],
};

/* ------------------------------------------------------------------ */
/*  Animated BPMN Diagram SVG                                          */
/* ------------------------------------------------------------------ */

function BpmnDiagram() {
  const lineDraw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: (i: number) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 1.2, delay: 0.6 + i * 0.3, ease: "easeInOut" as const },
        opacity: { duration: 0.3, delay: 0.6 + i * 0.3 },
      },
    }),
  };

  const nodeFade = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, delay: 0.3 + i * 0.2, ease: [0.22, 1, 0.36, 1] as const },
    }),
  };

  const pulseGlow = {
    scale: [1, 1.06, 1],
    opacity: [0.25, 0.45, 0.25],
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full max-w-xl mx-auto lg:mx-0"
    >
      {/* Soft glow behind the diagram */}
      <div className="absolute inset-0 -z-10 blur-3xl bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent rounded-full scale-110" />

      <svg viewBox="0 0 520 380" fill="none" className="w-full h-auto" aria-hidden="true">
        {/* ---- Connecting Lines ---- */}
        {/* Line: Start → Node 1 */}
        <motion.path
          d="M 40 190 L 110 190"
          stroke="url(#lineGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          custom={0}
          variants={lineDraw}
          initial="hidden"
          animate="visible"
        />
        {/* Line: Node 1 → Diamond */}
        <motion.path
          d="M 210 190 L 260 190"
          stroke="url(#lineGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          custom={1}
          variants={lineDraw}
          initial="hidden"
          animate="visible"
        />
        {/* Line: Diamond → Node 2 (yes branch) */}
        <motion.path
          d="M 310 170 L 370 110"
          stroke="url(#lineGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          custom={2}
          variants={lineDraw}
          initial="hidden"
          animate="visible"
        />
        {/* Line: Diamond → Node 3 (no branch) */}
        <motion.path
          d="M 310 210 L 370 270"
          stroke="url(#lineGrad)"
          strokeWidth="2"
          strokeLinecap="round"
          custom={2}
          variants={lineDraw}
          initial="hidden"
          animate="visible"
        />

        {/* ---- Start Circle ---- */}
        <motion.circle
          cx="30"
          cy="190"
          r="12"
          custom={0}
          variants={nodeFade}
          initial="hidden"
          animate="visible"
        >
          <animate attributeName="r" values="12;14;12" dur="3s" repeatCount="indefinite" />
        </motion.circle>
        <circle cx="30" cy="190" r="8" fill="#22d3ee" />

        {/* ---- Process Node 1: "Identify" ---- */}
        <motion.rect
          x="110"
          y="162"
          width="100"
          height="56"
          rx="10"
          custom={0}
          variants={nodeFade}
          initial="hidden"
          animate="visible"
          className="fill-white/[0.04] stroke-cyan-400/40"
          strokeWidth="1.5"
        />
        <motion.g custom={0} variants={nodeFade} initial="hidden" animate="visible">
          <rect x="110" y="162" width="100" height="56" rx="10" fill="#030712" stroke="url(#nodeGrad)" strokeWidth="1.5" />
          <text x="160" y="186" textAnchor="middle" fill="white" fontSize="11" fontWeight="600" fontFamily="system-ui, sans-serif">Identify</text>
          <text x="160" y="202" textAnchor="middle" fill="white" fontSize="9" opacity="0.5" fontFamily="system-ui, sans-serif">Process Owner</text>
        </motion.g>

        {/* ---- Decision Diamond: "Risk?" ---- */}
        <motion.g custom={1} variants={nodeFade} initial="hidden" animate="visible">
          <motion.polygon
            points="285,145 310,190 285,235 260,190"
            fill="#030712"
            stroke="url(#diamondGrad)"
            strokeWidth="1.5"
          />
          <text x="285" y="194" textAnchor="middle" fill="#22d3ee" fontSize="10" fontWeight="600" fontFamily="system-ui, sans-serif">Risk?</text>
          {/* Pulse glow behind diamond */}
          <motion.polygon
            points="285,145 310,190 285,235 260,190"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="6"
            animate={pulseGlow}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" as const }}
            style={{ filter: "blur(6px)", opacity: 0.2 }}
          />
        </motion.g>

        {/* ---- Process Node 2: "Assess FMEA" ---- */}
        <motion.g custom={2} variants={nodeFade} initial="hidden" animate="visible">
          <rect x="370" y="82" width="120" height="56" rx="10" fill="#030712" stroke="url(#nodeGrad)" strokeWidth="1.5" />
          <text x="430" y="106" textAnchor="middle" fill="white" fontSize="11" fontWeight="600" fontFamily="system-ui, sans-serif">Assess FMEA</text>
          <text x="430" y="122" textAnchor="middle" fill="white" fontSize="9" opacity="0.5" fontFamily="system-ui, sans-serif">Risk Analysis</text>
        </motion.g>

        {/* ---- Process Node 3: "Auto-Map BPMN" ---- */}
        <motion.g custom={3} variants={nodeFade} initial="hidden" animate="visible">
          <rect x="370" y="242" width="120" height="56" rx="10" fill="#030712" stroke="url(#nodeGrad)" strokeWidth="1.5" />
          <text x="430" y="266" textAnchor="middle" fill="white" fontSize="11" fontWeight="600" fontFamily="system-ui, sans-serif">Auto-Map</text>
          <text x="430" y="282" textAnchor="middle" fill="white" fontSize="9" opacity="0.5" fontFamily="system-ui, sans-serif">BPMN Diagram</text>
        </motion.g>

        {/* ---- End circles ---- */}
        <motion.g custom={4} variants={nodeFade} initial="hidden" animate="visible">
          <circle cx="505" cy="110" r="10" fill="none" stroke="#22d3ee" strokeWidth="2" opacity="0.6" />
          <circle cx="505" cy="110" r="6" fill="#22d3ee" opacity="0.8" />
        </motion.g>
        <motion.g custom={4} variants={nodeFade} initial="hidden" animate="visible">
          <circle cx="505" cy="270" r="10" fill="none" stroke="#22d3ee" strokeWidth="2" opacity="0.6" />
          <circle cx="505" cy="270" r="6" fill="#22d3ee" opacity="0.8" />
        </motion.g>

        {/* ---- Branch labels ---- */}
        <motion.text
          x="330"
          y="150"
          fill="#22d3ee"
          fontSize="9"
          opacity="0.7"
          custom={3}
          variants={nodeFade}
          initial="hidden"
          animate="visible"
          fontFamily="system-ui, sans-serif"
        >
          Yes
        </motion.text>
        <motion.text
          x="335"
          y="228"
          fill="white"
          fontSize="9"
          opacity="0.5"
          custom={3}
          variants={nodeFade}
          initial="hidden"
          animate="visible"
          fontFamily="system-ui, sans-serif"
        >
          No
        </motion.text>

        {/* ---- Arrowheads ---- */}
        <defs>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="nodeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.25" />
          </linearGradient>
          <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
          </linearGradient>
          <marker id="arrow" viewBox="0 0 10 6" refX="10" refY="3" markerWidth="8" markerHeight="6" orient="auto">
            <path d="M 0 0 L 10 3 L 0 6 z" fill="#22d3ee" opacity="0.7" />
          </marker>
        </defs>
      </svg>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Hero Component                                                     */
/* ------------------------------------------------------------------ */

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#030712]">
      {/* ---- Floating Gradient Orbs ---- */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* Orb 1 — cyan */}
        <motion.div
          className="absolute -top-24 -left-32 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]"
          animate={{
            ...orbFloat,
            transition: { duration: 8, repeat: Infinity, ease: "easeInOut" as const },
          }}
        />
        {/* Orb 2 — blue */}
        <motion.div
          className="absolute top-1/3 right-0 h-[400px] w-[400px] rounded-full bg-blue-600/8 blur-[100px]"
          animate={{
            y: [0, 22, 0],
            x: [0, -14, 0],
            scale: [1, 1.12, 1],
            transition: { duration: 10, repeat: Infinity, ease: "easeInOut" as const, delay: 1 },
          }}
        />
        {/* Orb 3 — purple */}
        <motion.div
          className="absolute bottom-0 left-1/3 h-[350px] w-[350px] rounded-full bg-violet-500/6 blur-[100px]"
          animate={{
            y: [0, -14, 0],
            x: [0, 18, 0],
            scale: [1, 1.06, 1],
            transition: { duration: 12, repeat: Infinity, ease: "easeInOut" as const, delay: 2 },
          }}
        />
      </div>

      {/* ---- Content ---- */}
      <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-16 sm:pt-28 sm:pb-20 lg:flex lg:items-center lg:gap-16 lg:pt-32 lg:pb-20">
        {/* Left — Copy */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 max-w-2xl"
        >
          {/* Badge */}
          <motion.div variants={itemVariants} className="mb-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-xs font-medium text-white/50 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
              </span>
              Trusted by process consultants at top firms
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Turn any organization into a{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              living process map
            </span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="mt-6 max-w-xl text-lg leading-relaxed text-white/70 sm:text-xl"
          >
            Scan any company in 60 seconds. Generate SIPOC maps, BPMN diagrams, FMEA
            assessments, and Harvard-style decision simulations.{" "}
            <span className="text-cyan-400 font-semibold">8x faster</span> than
            traditional methods.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={itemVariants}
            className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center"
          >
            {/* Primary CTA */}
            <Link
              href="/scan"
              className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:shadow-cyan-500/30"
            >
              {/* Glow ring on hover */}
              <span className="pointer-events-none absolute -inset-0.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 blur transition-opacity duration-300 group-hover:opacity-40" />
              <span className="relative flex items-center gap-2">
                Scan any company free
                <span className="hidden sm:inline text-white/60 font-normal">— No signup required</span>
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </Link>

            {/* Secondary CTA */}
            <Link
              href="#pricing"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-white/80 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
            >
              <Play className="h-4 w-4" />
              Book a demo
            </Link>
          </motion.div>
        </motion.div>

        {/* Right — BPMN Diagram Visual */}
        <div className="flex-1 mt-16 lg:mt-0">
          <BpmnDiagram />
        </div>
      </div>
    </section>
  );
}

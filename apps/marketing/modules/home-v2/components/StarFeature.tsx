"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Target,
  BarChart3,
  ArrowRight,
  Zap,
  CheckCircle2,
} from "lucide-react";

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const leftSideVariants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const optionVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      delay: 0.4 + i * 0.15,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  }),
};

const rightSideVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  },
};

const options = [
  {
    label: "A",
    text: "Quarantine the batch and recall products already in production",
    border: "border-l-red-500/70",
    hoverGlow: "hover:border-red-400/60 hover:shadow-red-500/5",
    selected: false,
  },
  {
    label: "B",
    text: "Work with the supplier on corrective action while monitoring stock",
    border: "border-l-amber-500/70",
    hoverGlow: "hover:border-amber-400/60 hover:shadow-amber-500/5",
    selected: false,
  },
  {
    label: "C",
    text: "Reject the shipment and switch to backup supplier immediately",
    border: "border-l-emerald-500/70",
    hoverGlow: "hover:border-emerald-400/60 hover:shadow-emerald-500/5",
    selected: false,
  },
] as const;

const features = [
  {
    title: "Based on your real processes",
    description:
      "Scenarios are generated from your actual documented SOPs and process maps",
  },
  {
    title: "Role-specific evaluations",
    description:
      "Each team member faces scenarios tailored to their responsibilities",
  },
  {
    title: "Measurable human risk scores",
    description:
      "Get per-person, per-process alignment scores that identify gaps",
  },
] as const;

export function StarFeature() {
  return (
    <section className="relative py-24 lg:py-32 bg-gradient-to-b from-transparent via-cyan-950/10 to-transparent overflow-hidden">
      {/* Ambient glow accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        className="max-w-7xl mx-auto px-6"
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* LEFT — Interactive Scenario Mockup */}
          <motion.div variants={leftSideVariants} className="relative">
            {/* Subtle glow behind the card */}
            <div className="absolute -inset-4 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent rounded-3xl blur-2xl" />

            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl shadow-black/20">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-2 bg-cyan-500/15 border border-cyan-500/25 rounded-full px-3.5 py-1.5">
                    <Brain className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-xs font-semibold text-cyan-300 tracking-wide uppercase">
                      Decision Simulation
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-white/40">
                  <Target className="w-3.5 h-3.5" />
                  <span className="text-xs font-medium">
                    Process: Supplier Quality Control
                  </span>
                </div>
              </div>

              {/* Scenario prompt */}
              <div className="relative bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 mb-6">
                <div className="absolute top-0 left-5 w-px h-3 bg-cyan-500/50" />
                <p className="text-sm leading-relaxed text-white/80">
                  A supplier delivers{" "}
                  <span className="text-red-400/90 font-medium">
                    contaminated raw materials
                  </span>{" "}
                  that passed incoming inspection. As{" "}
                  <span className="text-cyan-400 font-medium">COO</span>, you:
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {options.map((option, i) => (
                  <motion.button
                    key={option.label}
                    custom={i}
                    variants={optionVariants}
                    whileHover={{ scale: 1.015, y: -1 }}
                    className={`group w-full text-left rounded-xl border border-white/[0.08] ${option.border} border-l-[3px] bg-white/[0.02] hover:bg-white/[0.06] ${option.hoverGlow} hover:shadow-lg transition-all duration-200 cursor-pointer`}
                  >
                    <div className="flex items-start gap-3.5 p-4">
                      <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.06] text-xs font-bold text-white/50 group-hover:text-white/80 group-hover:bg-white/10 transition-colors">
                        {option.label}
                      </span>
                      <span className="text-[13px] leading-relaxed text-white/60 group-hover:text-white/85 transition-colors pt-1">
                        {option.text}
                      </span>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Footer hint */}
              <div className="flex items-center gap-2 text-white/30">
                <Zap className="w-3.5 h-3.5" />
                <span className="text-xs">
                  Select the best response based on your quality management SOPs
                </span>
              </div>
            </div>
          </motion.div>

          {/* RIGHT — Feature Highlights */}
          <motion.div
            variants={rightSideVariants}
            className="flex flex-col gap-8"
          >
            <div className="flex flex-col gap-5">
              <motion.h2
                variants={itemVariants}
                className="text-3xl sm:text-4xl lg:text-[2.75rem] font-display font-bold text-white leading-[1.1] tracking-tight"
              >
                Test your team before a crisis tests them
              </motion.h2>
              <motion.p
                variants={itemVariants}
                className="text-lg text-white/60 leading-relaxed max-w-lg"
              >
                AI generates Harvard-style decision scenarios from YOUR real
                processes. Measure how your team performs under pressure.
              </motion.p>
            </div>

            {/* Feature bullets */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-5"
            >
              {features.map((feature) => (
                <div key={feature.title} className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-semibold text-white">
                      {feature.title}
                    </span>
                    <span className="text-sm text-white/50 leading-relaxed">
                      {feature.description}
                    </span>
                  </div>
                </div>
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div variants={itemVariants}>
              <button className="group inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 font-semibold transition-colors duration-200">
                Try a sample scenario
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

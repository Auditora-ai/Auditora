"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight, Sparkles } from "lucide-react";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut" as const,
    },
  },
};

const growthFeatures = [
  "15 process maps",
  "50 evaluations per month",
  "30 team evaluators",
  "BPMN 2.0 export",
  "Risk assessment dashboards",
  "SOP auto-generation",
];

const enterpriseFeatures = [
  "Unlimited process maps",
  "Unlimited evaluations",
  "150+ evaluators",
  "SSO & SAML",
  "API access",
  "Dedicated support & training",
];

export function PricingTeaser() {
  return (
    <section id="pricing" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Floating gradient orbs */}
      <div
        className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-cyan-700/8 blur-[120px]"
        aria-hidden="true"
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="relative mx-auto max-w-7xl px-6"
      >
        {/* Heading */}
        <motion.div variants={itemVariants} className="text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Start free. Scale when ready.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
            No credit card required. Start with the free scan, upgrade when you
            need the full platform.
          </p>
        </motion.div>

        {/* Plan cards */}
        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
          {/* Growth card */}
          <motion.div
            variants={itemVariants}
            className="relative rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-8 shadow-[0_0_60px_-12px_rgba(6,182,212,0.2)]"
          >
            {/* Most Popular badge */}
            <span className="absolute -top-3 right-6 rounded-full bg-cyan-500 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-cyan-500/30">
              Most Popular
            </span>

            <h3 className="text-xl font-semibold text-white">Growth</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-bold text-white">$199</span>
              <span className="text-white/50">/month</span>
            </div>
            <p className="mt-2 text-sm text-white/60">
              For teams covering a full department
            </p>

            <ul className="mt-8 space-y-3">
              {growthFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <Check className="h-4 w-4 shrink-0 text-cyan-400" />
                  <span className="text-sm text-white/70">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-400 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all hover:shadow-cyan-500/40 hover:brightness-110"
            >
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>

          {/* Enterprise card */}
          <motion.div
            variants={itemVariants}
            className="relative rounded-2xl border border-white/10 bg-white/5 p-8"
          >
            <h3 className="text-xl font-semibold text-white">Enterprise</h3>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-5xl font-bold text-white">Custom</span>
            </div>
            <p className="mt-2 text-sm text-white/60">
              Full organizational transformation
            </p>

            <ul className="mt-8 space-y-3">
              {enterpriseFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <Check className="h-4 w-4 shrink-0 text-cyan-400" />
                  <span className="text-sm text-white/70">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-transparent px-6 py-3 text-sm font-semibold text-white transition-all hover:border-white/40 hover:bg-white/5"
            >
              <Sparkles className="h-4 w-4" />
              Contact sales
            </button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

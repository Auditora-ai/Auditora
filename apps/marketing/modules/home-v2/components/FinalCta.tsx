"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { useState } from "react";

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

export function FinalCta() {
  const [url, setUrl] = useState("");

  return (
    <section className="relative overflow-hidden py-24 lg:py-32">
      {/* Radial gradient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.15),transparent_70%)]" />
      </div>

      {/* Floating gradient orbs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* Orb 1 — left */}
        <motion.div
          className="absolute top-1/4 -left-32 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[120px]"
          animate={{
            y: [0, -18, 0],
            x: [0, 10, 0],
            scale: [1, 1.08, 1],
            transition: { duration: 8, repeat: Infinity, ease: "easeInOut" as const },
          }}
        />
        {/* Orb 2 — right */}
        <motion.div
          className="absolute bottom-1/4 -right-32 h-[350px] w-[350px] rounded-full bg-blue-600/8 blur-[100px]"
          animate={{
            y: [0, 22, 0],
            x: [0, -14, 0],
            scale: [1, 1.12, 1],
            transition: {
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut" as const,
              delay: 1,
            },
          }}
        />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
        >
          {/* Zap icon accent */}
          <motion.div variants={itemVariants} className="mb-6 flex justify-center">
            <span className="inline-flex items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/[0.07] p-3">
              <Zap className="h-5 w-5 text-cyan-400" />
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            variants={itemVariants}
            className="font-display text-4xl leading-tight tracking-tight text-white lg:text-5xl"
          >
            Your first process map is{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              2 minutes away
            </span>
          </motion.h2>

          {/* Subtitle */}
          <motion.p
            variants={itemVariants}
            className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-white/60"
          >
            No signup. No credit card. Just paste a URL.
          </motion.p>

          {/* URL Input + Button */}
          <motion.div
            variants={itemVariants}
            className="mx-auto mt-10 flex max-w-lg flex-col gap-3 sm:flex-row sm:items-center sm:justify-center"
          >
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="flex-1 max-w-md rounded-xl border border-white/10 bg-white/5 px-6 py-4 text-white placeholder:text-white/30 outline-none backdrop-blur-sm transition-colors duration-200 focus:border-cyan-400/40 focus:bg-white/[0.07]"
            />
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
              className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/30"
            >
              {/* Glow ring on hover */}
              <span className="pointer-events-none absolute -inset-0.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 opacity-0 blur transition-opacity duration-300 group-hover:opacity-40" />
              <span className="relative flex items-center gap-2">
                Scan now
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </motion.button>
          </motion.div>

          {/* Microcopy */}
          <motion.p
            variants={itemVariants}
            className="mx-auto mt-5 max-w-md text-sm text-white/30"
          >
            Free scan generates a preview. Sign up for the full diagnostic.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

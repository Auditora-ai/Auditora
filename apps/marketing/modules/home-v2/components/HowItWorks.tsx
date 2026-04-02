"use client";

import { motion } from "framer-motion";
import {
  Globe,
  GitBranch,
  ShieldCheck,
  FileText,
  Brain,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const steps: {
  number: string;
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    number: "01",
    icon: Globe,
    title: "Discover",
    description: "Scan any company URL or chat with AI to capture processes",
  },
  {
    number: "02",
    icon: GitBranch,
    title: "Map",
    description: "Auto-generate BPMN 2.0 diagrams from discovered processes",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "Assess",
    description: "Run FMEA risk analysis with ISO 31000 compliance",
  },
  {
    number: "04",
    icon: FileText,
    title: "Document",
    description: "Generate SOPs and process documentation automatically",
  },
  {
    number: "05",
    icon: Brain,
    title: "Simulate",
    description: "Create Harvard-style decision scenarios from real processes",
  },
  {
    number: "06",
    icon: Users,
    title: "Evaluate",
    description: "Measure human risk with per-person alignment scores",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

export function HowItWorks() {
  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-[family-name:var(--font-display)] mb-4">
            From URL to living process map in 6 steps
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Six capabilities. One seamless workflow. From discovery to
            decision-ready intelligence.
          </p>
        </motion.div>

        {/* Steps Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === steps.length - 1;

            return (
              <motion.div
                key={step.number}
                variants={cardVariants}
                whileHover={{ scale: 1.02 }}
                className="relative group"
              >
                {/* Glass Card */}
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 transition-colors duration-300 group-hover:border-cyan-500/30 h-full">
                  {/* Top row: number + icon */}
                  <div className="flex items-center gap-4 mb-4">
                    {/* Numbered circle */}
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center"
                        style={{
                          background:
                            "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(6,182,212,0.05))",
                          border: "2px solid transparent",
                          backgroundClip: "padding-box",
                          position: "relative",
                        }}
                      >
                        {/* Cyan gradient border ring */}
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{
                            background:
                              "linear-gradient(135deg, #06b6d4, #22d3ee)",
                            WebkitMask:
                              "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                            WebkitMaskComposite: "xor",
                            maskComposite: "exclude",
                            padding: "2px",
                          }}
                        />
                        <span className="text-sm font-bold text-white relative z-10">
                          {step.number}
                        </span>
                      </div>

                      {/* Connector arrow to next step */}
                      {!isLast && (
                        <div className="hidden lg:flex absolute top-1/2 -right-5 -translate-y-1/2 z-20 items-center text-cyan-500/40">
                          <svg
                            width="20"
                            height="10"
                            viewBox="0 0 20 10"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <line
                              x1="0"
                              y1="5"
                              x2="15"
                              y2="5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeDasharray="3 3"
                            />
                            <path
                              d="M14 2L18 5L14 8"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Icon */}
                    <div className="w-11 h-11 rounded-xl bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-white/50">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

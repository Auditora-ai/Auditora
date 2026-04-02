"use client";

import { motion } from "framer-motion";
import {
  Scan,
  GitBranch,
  Shield,
  MessageSquare,
  FileText,
  Play,
  type LucideIcon,
} from "lucide-react";

interface Capability {
  icon: LucideIcon;
  title: string;
  description: string;
  highlighted?: boolean;
  span?: boolean;
}

const capabilities: Capability[] = [
  {
    icon: Scan,
    title: "AI Process Discovery",
    description:
      "Scan any company URL or chat with AI to discover and map processes in minutes, not weeks.",
  },
  {
    icon: GitBranch,
    title: "BPMN 2.0 Diagrams",
    description:
      "Generate professional, standards-compliant process diagrams. Export and share instantly.",
  },
  {
    icon: Shield,
    title: "Risk Assessment (FMEA)",
    description:
      "Automated failure mode analysis with severity, occurrence, and detection scoring.",
  },
  {
    icon: MessageSquare,
    title: "AI Elicitation",
    description:
      "Conversational interviews that capture tribal knowledge from your team.",
  },
  {
    icon: FileText,
    title: "SOP Generation",
    description:
      "Auto-generate standard operating procedures from your process documentation.",
  },
  {
    icon: Play,
    title: "Decision Simulations",
    description:
      "Harvard-style scenarios that test how your team performs under real-world pressure. The feature that sets Auditora apart.",
    highlighted: true,
    span: true,
  },
];

const containerVariants = {
  hidden: {},
  visible: {
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

export function CapabilitiesGrid() {
  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-white tracking-tight">
            Everything a consulting engagement needs. One platform.
          </h2>
          <p className="mt-4 text-lg text-white/60 max-w-2xl mx-auto">
            Replace 6 tools with one. From AI discovery to compliance-ready
            documentation.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {capabilities.map((cap) => {
            const Icon = cap.icon;
            return (
              <motion.div
                key={cap.title}
                variants={cardVariants}
                whileHover={{ scale: 1.02 }}
                className={`
                  group relative rounded-2xl p-8 backdrop-blur transition-colors duration-300
                  ${
                    cap.highlighted
                      ? "bg-cyan-500/5 border border-cyan-500/20 md:col-span-2 shadow-[0_0_40px_-12px_rgba(6,182,212,0.15)]"
                      : "bg-white/5 border border-white/10"
                  }
                  hover:border-cyan-500/30
                  hover:shadow-[0_0_30px_-8px_rgba(6,182,212,0.12)]
                `}
              >
                {/* Star Feature Badge */}
                {cap.highlighted && (
                  <span className="absolute top-6 right-6 inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-400 border border-cyan-500/20">
                    <Play className="h-3 w-3 fill-cyan-400" />
                    Star Feature
                  </span>
                )}

                {/* Icon */}
                <div className="mb-5 inline-flex rounded-xl bg-cyan-500/10 p-3">
                  <Icon className="h-6 w-6 text-cyan-400" />
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {cap.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-white/50 leading-relaxed">
                  {cap.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

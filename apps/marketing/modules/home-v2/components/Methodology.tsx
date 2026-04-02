"use client";

import { motion } from "framer-motion";
import { Layers, Network, Shield, BookOpen } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface MethodologyItem {
  icon: LucideIcon;
  name: string;
  standard: string;
  description: string;
}

const methodologies: MethodologyItem[] = [
  {
    icon: Layers,
    name: "SIPOC",
    standard: "Six Sigma",
    description:
      "Structured process discovery through Suppliers, Inputs, Process, Outputs, Customers framework.",
  },
  {
    icon: Network,
    name: "BPMN 2.0",
    standard: "OMG Standard",
    description:
      "Industry-standard notation for business process modeling and diagramming.",
  },
  {
    icon: Shield,
    name: "FMEA",
    standard: "ISO 17359",
    description:
      "Systematic failure mode analysis with severity, occurrence, and detection scoring.",
  },
  {
    icon: BookOpen,
    name: "ISO 31000",
    standard: "Risk Management",
    description:
      "International standard for risk management principles and guidelines.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

export function Methodology() {
  return (
    <section className="relative py-24 lg:py-32 bg-gradient-to-b from-transparent via-blue-950/10 to-transparent">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display text-white font-bold mb-4">
            Built on recognized standards
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Not reinventing the wheel — amplifying established methodologies
            with AI.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {methodologies.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.name}
                variants={cardVariants}
                whileHover={{ scale: 1.03 }}
                className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 text-center hover:border-blue-500/30 transition-colors duration-300"
              >
                <div className="rounded-xl bg-blue-500/10 p-3 w-fit mx-auto mb-4">
                  <Icon className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-white font-bold text-xl">{item.name}</h3>
                <p className="text-cyan-400 text-sm font-medium mt-1">
                  {item.standard}
                </p>
                <p className="text-white/50 text-sm mt-2">
                  {item.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

"use client";

import { useRef } from "react";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { Clock, FileX, AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

function AnimatedStat() {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => `${Math.round(v)}%`);

  if (isInView && count.get() === 0) {
    animate(count, 73, { duration: 2, ease: "easeOut" as const });
  }

  return (
    <motion.span
      ref={ref}
      className="text-7xl lg:text-8xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent"
    >
      {rounded}
    </motion.span>
  );
}

interface PainCardProps {
  icon: LucideIcon;
  iconColor: string;
  title: string;
  description: string;
  index: number;
}

function PainCard({ icon: Icon, iconColor, title, description, index }: PainCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.15, ease: "easeOut" as const }}
      whileHover={{ scale: 1.05 }}
      className="group relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 transition-colors duration-300 hover:border-red-500/20"
    >
      <div className={`mb-6 inline-flex items-center justify-center w-12 h-12 rounded-full bg-${iconColor}/10`}>
        <Icon className={`w-6 h-6 text-${iconColor}`} />
      </div>
      <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="text-white/50 leading-relaxed text-sm">{description}</p>
    </motion.div>
  );
}

const painPoints: PainCardProps[] = [
  {
    icon: Clock,
    iconColor: "red-500",
    title: "Weeks lost in interviews",
    description:
      "Traditional process discovery requires 3-6 weeks of stakeholder interviews, workshops, and documentation reviews.",
    index: 0,
  },
  {
    icon: FileX,
    iconColor: "amber-500",
    title: "Diagrams that die on day one",
    description:
      "Visio and PowerPoint documents become obsolete the moment operations change. Static docs can't keep up.",
    index: 1,
  },
  {
    icon: AlertTriangle,
    iconColor: "orange-500",
    title: "Hidden risks in plain sight",
    description:
      "Without structured FMEA analysis, critical failure modes go unnoticed until it's too late.",
    index: 2,
  },
];

export function ProblemSection() {
  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" as const }}
          className="text-center mb-16"
        >
          <h2 className="font-[family-name:var(--font-display)] text-4xl lg:text-5xl font-bold text-white mb-6">
            Your competitors map processes{" "}
            <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
              8x faster
            </span>
          </h2>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            While your team wrestles with spreadsheets and whiteboard sessions, competitors are
            already optimizing — and stealing your market share.
          </p>
        </motion.div>

        {/* Animated Stat */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: "easeOut" as const }}
          className="text-center mb-20"
        >
          <AnimatedStat />
          <p className="text-white/50 text-sm mt-4 max-w-md mx-auto">
            of organizations lack documented processes for critical operations
          </p>
          <p className="text-white/30 text-xs mt-2">— Gartner, 2024</p>
        </motion.div>

        {/* Pain Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {painPoints.map((point) => (
            <PainCard key={point.title} {...point} />
          ))}
        </div>
      </div>
    </section>
  );
}

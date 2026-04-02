"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Briefcase, ClipboardCheck, Factory } from "lucide-react";

const tabs = [
  { id: "consultants", label: "Consultants", icon: Briefcase },
  { id: "auditors", label: "Auditors", icon: ClipboardCheck },
  { id: "operations", label: "Operations", icon: Factory },
] as const;

type TabId = (typeof tabs)[number]["id"];

const tabContent: Record<
  TabId,
  {
    heading: string;
    bullets: string[];
    cta: string;
  }
> = {
  consultants: {
    heading: "Deliver faster, win more projects",
    bullets: [
      "Complete process discovery in days instead of weeks",
      "Impress clients with interactive BPMN diagrams they can explore",
      "Add decision simulations as a premium service offering",
    ],
    cta: "Start your first project →",
  },
  auditors: {
    heading: "Structured compliance, real evidence",
    bullets: [
      "FMEA analysis with full ISO 31000 traceability",
      "Timestamped audit trails for every process change",
      "Generate compliance-ready reports from process data",
    ],
    cta: "See compliance features →",
  },
  operations: {
    heading: "Turn procedures into living systems",
    bullets: [
      "Auto-generate SOPs that stay current as processes evolve",
      "Test your team's readiness with decision simulations",
      "Identify risk hotspots before they become incidents",
    ],
    cta: "Optimize your operations →",
  },
};

const headerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const contentVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.2, ease: "easeIn" as const },
  },
};

export function WhoItsFor() {
  const [activeTab, setActiveTab] = useState<TabId>("consultants");

  const current = tabContent[activeTab];

  return (
    <section className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="text-center mb-12"
        >
          <motion.h2
            variants={fadeUp}
            className="text-3xl md:text-4xl lg:text-5xl font-display text-white"
          >
            Built for the people who map the world&apos;s processes
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mt-4 text-lg text-white/60 max-w-2xl mx-auto"
          >
            Whether you&apos;re a consultant, auditor, or operations leader —
            Auditora adapts to your workflow.
          </motion.p>
        </motion.div>

        {/* Tab bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex bg-white/5 rounded-xl p-1 border border-white/10">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "text-cyan-400"
                      : "text-white/50 hover:text-white/70"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="who-its-for-tab"
                      className="absolute inset-0 bg-cyan-500/20 rounded-lg"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 30,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Content area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 lg:p-12"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <h3 className="text-2xl md:text-3xl font-display text-white mb-6">
                {current.heading}
              </h3>
              <ul className="space-y-4 mb-8">
                {current.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3">
                    <span className="mt-1 flex-shrink-0 text-cyan-400">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 20 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M10 0C4.477 0 0 4.477 0 10C0 15.523 4.477 20 10 20C15.523 20 20 15.523 20 10C20 4.477 15.523 0 10 0ZM14.293 7.293L9.293 12.293C9.105 12.48 8.851 12.586 8.586 12.586C8.321 12.586 8.067 12.48 7.879 12.293L5.879 10.293C5.488 9.902 5.488 9.269 5.879 8.879C6.269 8.488 6.902 8.488 7.293 8.879L8.586 10.172L12.879 5.879C13.269 5.488 13.902 5.488 14.293 5.879C14.683 6.269 14.683 6.902 14.293 7.293Z"
                          fill="currentColor"
                        />
                      </svg>
                    </span>
                    <span className="text-white/80 text-lg">{bullet}</span>
                  </li>
                ))}
              </ul>
              <button className="inline-flex items-center text-cyan-400 font-medium text-lg hover:text-cyan-300 transition-colors">
                {current.cta}
              </button>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}

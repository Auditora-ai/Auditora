"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  animate,
} from "framer-motion";
import { useRef, useEffect } from "react";

/* ------------------------------------------------------------------ */
/*  Animated Counter                                                   */
/* ------------------------------------------------------------------ */

function AnimatedCounter({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const count = useMotionValue(0);
  const display = useTransform(count, (latest) => {
    const formatted = Math.round(latest).toLocaleString();
    return suffix ? `${formatted}${suffix}` : formatted;
  });

  useEffect(() => {
    if (isInView) {
      animate(count, value, { duration: 2, ease: "easeOut" as const });
    }
  }, [isInView, count, value]);

  return <motion.span ref={ref}>{display}</motion.span>;
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const counters = [
  { value: 6, label: "Industries Served", suffix: "+" },
  { value: 100, label: "Processes Documented", suffix: "+" },
  { value: 99, label: "Uptime", suffix: ".9%" },
];

const counterContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 },
  },
};

const counterItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

/* ------------------------------------------------------------------ */
/*  TrustBar Component                                                 */
/* ------------------------------------------------------------------ */

export function TrustBar() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      className="py-16 border-t border-b border-white/5"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* ---- Logo Row ---- */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <p className="text-xs uppercase tracking-widest text-white/30">
            Manufacturing{" "}
            <span className="text-white/15 mx-1">·</span> SaaS{" "}
            <span className="text-white/15 mx-1">·</span> Healthcare{" "}
            <span className="text-white/15 mx-1">·</span> Consulting{" "}
            <span className="text-white/15 mx-1">·</span> Logistics{" "}
            <span className="text-white/15 mx-1">·</span> Finance
          </p>
        </motion.div>

        {/* ---- Subtitle ---- */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-6 text-center text-sm text-white/60"
        >
          Trusted by process teams across industries
        </motion.p>

        {/* ---- Counters ---- */}
        <motion.div
          variants={counterContainerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="mt-12 flex justify-between max-w-3xl mx-auto"
        >
          {counters.map((counter) => (
            <motion.div
              key={counter.label}
              variants={counterItemVariants}
              className="text-center"
            >
              <div className="text-3xl font-semibold text-white/60 tabular-nums">
                <AnimatedCounter
                  value={counter.value}
                  suffix={counter.suffix}
                />
              </div>
              <p className="mt-1 text-xs uppercase tracking-wider text-white/40">
                {counter.label}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

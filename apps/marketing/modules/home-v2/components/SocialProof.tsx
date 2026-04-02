"use client";

import { useRef } from "react";
import { motion, useInView, useMotionValue, animate, useTransform } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    quote:
      "Reduced our process mapping from 6 weeks to 2 days. The AI discovery alone saved us hundreds of hours.",
    name: "María García",
    title: "Senior Consultant, Deloitte",
    stars: 5,
  },
  {
    quote:
      "Finally, a tool that makes FMEA accessible to my entire team. Our risk assessments went from quarterly to continuous.",
    name: "Carlos Ruiz",
    title: "Quality Director, Manufactura MX",
    stars: 5,
  },
  {
    quote:
      "The decision simulations revealed gaps we didn't know existed. We found 3 critical blind spots in our first week.",
    name: "Ana Torres",
    title: "COO, LogiTrack",
    stars: 5,
  },
];

function Counter({
  value,
  suffix = "",
  format = false,
}: {
  value: number;
  suffix?: string;
  format?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const isInView = useInView(ref, { once: true });

  const formatted = useTransform(motionVal, (latest: number) => {
    const rounded = Math.round(latest);
    const numStr = format ? rounded.toLocaleString() : rounded.toString();
    return `${numStr}${suffix}`;
  });

  if (isInView) {
    animate(motionVal, value, { duration: 2, ease: "easeOut" as const });
  }

  return (
    <motion.span ref={ref} className="text-4xl font-bold text-cyan-400">
      {isInView ? formatted : `0${suffix}`}
    </motion.span>
  );
}

export function SocialProof() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-24 lg:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl lg:text-5xl font-display text-white text-center mb-16"
        >
          Process consultants are 8x faster with Auditora
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.15 }}
              whileHover={{ scale: 1.02 }}
              className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 relative overflow-hidden transition-shadow hover:shadow-lg hover:shadow-cyan-500/5"
            >
              <span className="absolute top-4 left-6 text-5xl text-cyan-500/30 select-none leading-none font-serif">
                &ldquo;
              </span>
              <p className="text-white/80 text-base leading-relaxed mt-8">
                {t.quote}
              </p>
              <div className="border-t border-white/10 my-6" />
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, s) => (
                  <Star
                    key={s}
                    className="w-4 h-4 fill-amber-400 text-amber-400"
                  />
                ))}
              </div>
              <p className="text-white font-semibold">{t.name}</p>
              <p className="text-white/50 text-sm">{t.title}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row justify-between max-w-4xl mx-auto pt-16 gap-8 sm:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center"
          >
            <Counter value={8} suffix="x" />
            <p className="text-white/50 text-sm mt-2">faster process mapping</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="text-center"
          >
            <Counter value={2847} suffix="+" format />
            <p className="text-white/50 text-sm mt-2">processes documented</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-center"
          >
            <Counter value={12000} suffix="+" format />
            <p className="text-white/50 text-sm mt-2">
              risk assessments completed
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

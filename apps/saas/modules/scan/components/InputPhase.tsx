"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Globe, AlertCircle } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  },
};

interface InputPhaseProps {
  defaultUrl: string;
  error: string | null;
  onSubmit: (url: string, turnstileToken: string | null) => void;
}

export function InputPhase({ defaultUrl, error, onSubmit }: InputPhaseProps) {
  const [url, setUrl] = useState(defaultUrl);
  const [focused, setFocused] = useState(false);
  const turnstileToken = useRef<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    // Ensure https:// prefix
    let finalUrl = trimmed;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    onSubmit(finalUrl, turnstileToken.current);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="text-center"
    >
      {/* Badge */}
      <motion.div variants={itemVariants} className="mb-6 flex justify-center">
        <span className="inline-flex items-center gap-2 bg-[#3B8FE8]/15 text-[#3B8FE8] rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest">
          <Globe className="h-3.5 w-3.5" />
          Free scan
        </span>
      </motion.div>

      {/* Heading */}
      <motion.h1
        variants={itemVariants}
        className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
      >
        Scan your{" "}
        <span className="bg-gradient-to-r from-[#3B8FE8] to-cyan-400 bg-clip-text text-transparent">
          operations
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        variants={itemVariants}
        className="mx-auto mt-4 max-w-md text-lg text-[#94A3B8]"
      >
        Paste any company website. We'll identify critical processes and
        operational vulnerabilities in 60 seconds.
      </motion.p>

      {/* Error message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-4 flex max-w-md items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Input area */}
      <motion.form
        variants={itemVariants}
        onSubmit={handleSubmit}
        className="mx-auto mt-10 max-w-lg"
      >
        {/* Gradient border wrapper with conic glow */}
        <div className="relative group">
          {/* Conic glow effect (visible on focus) */}
          <div
            className={`absolute -inset-[1px] rounded-2xl transition-opacity duration-500 ${
              focused ? "opacity-100" : "opacity-0"
            }`}
            style={{
              background:
                "conic-gradient(from 0deg, #3B8FE8, #06B6D4, #3B82F6, #8B5CF6, #3B8FE8)",
              filter: "blur(8px)",
            }}
          />

          {/* Gradient border */}
          <div
            className={`absolute -inset-[1px] rounded-2xl transition-opacity duration-300 ${
              focused ? "opacity-100" : "opacity-40"
            }`}
            style={{
              background:
                "conic-gradient(from 0deg, #3B8FE8, #06B6D4, #3B82F6, #8B5CF6, #3B8FE8)",
            }}
          />

          {/* Inner container */}
          <div className="relative flex items-center gap-3 rounded-2xl bg-[#0A1428] p-2">
            <div className="flex flex-1 items-center gap-3 rounded-xl bg-white/[0.04] px-4 py-3">
              <Globe className="h-5 w-5 shrink-0 text-white/30" />
              <input
                type="url"
                inputMode="url"
                autoComplete="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="https://company.com"
                className="flex-1 bg-transparent text-white placeholder:text-white/30 outline-none text-base"
                autoFocus
              />
            </div>

            <motion.button
              type="submit"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[#3B8FE8] px-5 py-3 text-sm font-bold text-[#0A1428] shadow-[0_0_30px_rgba(59,143,232,0.15)] transition-colors hover:bg-[#2E7FD6] min-h-[44px]"
            >
              Scan
              <ArrowRight className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </motion.form>

      {/* Microcopy */}
      <motion.p
        variants={itemVariants}
        className="mt-5 text-sm text-white/40"
      >
        No signup required. Free surface-level analysis.
      </motion.p>

      {/* Hidden Turnstile */}
      {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
        <div className="hidden">
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            onSuccess={(token) => {
              turnstileToken.current = token;
            }}
          />
        </div>
      )}
    </motion.div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { ScanPhase, ScanResult } from "../types";
import { InputPhase } from "./InputPhase";
import { AnalyzingPhase } from "./AnalyzingPhase";
import { ResultsPhase } from "./ResultsPhase";

interface ScanResultWithSession {
  result: ScanResult;
  sessionId: string;
}

interface ScanPageProps {
  initialUrl: string | null;
  refSource: string | null;
}

export function ScanPage({ initialUrl, refSource }: ScanPageProps) {
  const [phase, setPhase] = useState<ScanPhase>(initialUrl ? "analyzing" : "input");
  const [url, setUrl] = useState(initialUrl ?? "");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const handleStartScan = useCallback((submittedUrl: string, token: string | null) => {
    setUrl(submittedUrl);
    setError(null);
    setTurnstileToken(token);
    setPhase("analyzing");
  }, []);

  const handleAnalysisComplete = useCallback((data: ScanResult, sid: string) => {
    setResult(data);
    setSessionId(sid);
    setPhase("results");
  }, []);

  const handleAnalysisError = useCallback((message: string) => {
    setError(message);
    setPhase("input");
  }, []);

  const handleReset = useCallback(() => {
    setUrl("");
    setResult(null);
    setError(null);
    setSessionId(null);
    setPhase("input");
  }, []);

  return (
    <div className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-8 sm:px-6">
      <AnimatePresence mode="wait">
        {phase === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl"
          >
            <InputPhase
              defaultUrl={url}
              error={error}
              onSubmit={handleStartScan}
            />
          </motion.div>
        )}

        {phase === "analyzing" && (
          <motion.div
            key="analyzing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-xl"
          >
            <AnalyzingPhase
              url={url}
              turnstileToken={turnstileToken}
              onComplete={handleAnalysisComplete}
              onError={handleAnalysisError}
            />
          </motion.div>
        )}

        {phase === "results" && result && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-4xl"
          >
            <ResultsPhase
              url={url}
              result={result}
              sessionId={sessionId}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

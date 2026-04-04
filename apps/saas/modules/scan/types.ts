/** Types for the public scan feature (SSE streaming + results). */

export type ScanPhase = "input" | "analyzing" | "results";

/** SSE event types sent from POST /api/public/scan/analyze */
export type ScanSSEEvent =
  | { type: "progress"; step: number; message: string }
  | { type: "result"; data: ScanResult; sessionId: string }
  | { type: "error"; message: string };

export interface ScanResult {
  companyName: string;
  industry: string;
  vulnerabilityScore: number;
  summary: string;
  processes: ScanProcess[];
  highestRiskProcess: ScanHighRiskProcess;
  /** SIPOC map inferred from the scan — may be absent on older results */
  sipoc?: ScanSipoc;
}

export interface ScanProcess {
  id: string;
  name: string;
  description: string;
  riskLevel: "low" | "medium" | "high" | "critical";
}

export interface ScanRisk {
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
}

export interface ScanHighRiskProcess {
  name: string;
  risks: ScanRisk[];
}

/** SIPOC map data for the highest-risk process */
export interface ScanSipoc {
  suppliers: string[];
  inputs: string[];
  processSteps: string[];
  outputs: string[];
  customers: string[];
}

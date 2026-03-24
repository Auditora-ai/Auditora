/**
 * Default Fixtures
 *
 * Static SessionContext that bypasses the database entirely.
 * Used when no --context flag is provided.
 */

import type { SessionContext } from "../../../packages/ai/src/context/session-context";

export const DEFAULT_CONTEXT: SessionContext = {
  company: {
    name: "Acme Corp",
    industry: "Manufacturing",
    operationsProfile:
      "Mid-size manufacturer with 200 employees across 3 plants. " +
      "Produces custom industrial components with make-to-order workflow.",
    businessModel:
      "B2B custom manufacturing. Revenue from project-based orders " +
      "with average ticket of $15K-50K.",
  },
  architecture: {
    processes: [
      {
        name: "Order Fulfillment",
        level: "PROCESS",
        status: "IN_PROGRESS",
        description: "End-to-end order processing from customer order to delivery",
      },
      {
        name: "Procurement",
        level: "PROCESS",
        status: "IDENTIFIED",
        description: "Sourcing and purchasing raw materials and components",
      },
      {
        name: "Production Planning",
        level: "PROCESS",
        status: "IDENTIFIED",
      },
      {
        name: "Quality Control",
        level: "PROCESS",
        status: "IDENTIFIED",
      },
      {
        name: "Returns Management",
        level: "PROCESS",
        status: "IDENTIFIED",
      },
    ],
  },
  targetProcess: {
    name: "Order Fulfillment",
    level: "PROCESS",
    description: "End-to-end order processing from customer order to delivery",
    goals: [
      "Reduce fulfillment time from 5 days to 3 days",
      "Improve order accuracy to 99%",
    ],
    triggers: ["Customer places order via web or phone"],
    outputs: ["Order delivered to customer", "Invoice sent"],
    parentProcess: "Operations",
    siblings: ["Procurement", "Production Planning", "Quality Control"],
  },
  sessionType: "DEEP_DIVE",
};

export function loadContext(contextPath?: string): SessionContext {
  if (!contextPath) return DEFAULT_CONTEXT;

  const { readFileSync } = require("fs");
  const raw = readFileSync(contextPath, "utf-8");
  return JSON.parse(raw) as SessionContext;
}

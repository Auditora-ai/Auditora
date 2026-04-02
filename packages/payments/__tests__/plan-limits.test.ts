import { describe, expect, it } from "vitest";
import { config } from "../config";
import { getPlanLimits } from "../lib/plans";
import type { PlanLimits } from "../types";

describe("PlanLimits", () => {
  it("PlanLimits type has all required fields", () => {
    const starterLimits = getPlanLimits("starter");
    expect(starterLimits).not.toBeNull();
    const limits = starterLimits as PlanLimits;
    expect(typeof limits.processes).toBe("number");
    expect(typeof limits.evaluations).toBe("number");
    expect(typeof limits.evaluators).toBe("number");
    expect(typeof limits.sessions).toBe("number");
    expect(typeof limits.reports).toBe("number");
    expect(typeof limits.adminUsers).toBe("number");
  });

  it("Starter plan has correct limits", () => {
    const limits = getPlanLimits("starter")!;
    expect(limits.processes).toBe(3);
    expect(limits.evaluations).toBe(10);
    expect(limits.evaluators).toBe(5);
    expect(limits.sessions).toBe(3);
    expect(limits.reports).toBe(1);
    expect(limits.adminUsers).toBe(2);
  });

  it("Growth plan has correct limits", () => {
    const limits = getPlanLimits("growth")!;
    expect(limits.processes).toBe(15);
    expect(limits.evaluations).toBe(50);
    expect(limits.evaluators).toBe(30);
    expect(limits.sessions).toBe(10);
    expect(limits.reports).toBe(10);
    expect(limits.adminUsers).toBe(5);
  });

  it("Scale plan has correct limits (unlimited for some)", () => {
    const limits = getPlanLimits("scale")!;
    expect(limits.processes).toBeNull();
    expect(limits.evaluations).toBe(250);
    expect(limits.evaluators).toBe(150);
    expect(limits.sessions).toBeNull();
    expect(limits.reports).toBeNull();
    expect(limits.adminUsers).toBe(15);
  });

  it("Enterprise plan has no limits (isEnterprise)", () => {
    const plan = config.plans.enterprise;
    expect("isEnterprise" in plan).toBe(true);
    expect(getPlanLimits("enterprise")).toBeNull();
  });

  it("PlanLimits does NOT have overagePerSession", () => {
    const starterLimits = getPlanLimits("starter")!;
    expect("overagePerSession" in starterLimits).toBe(false);
  });

  it("Process limit check: Starter with 3 processes cannot create 4th", () => {
    const limits = getPlanLimits("starter")!;
    const currentProcesses = 3;
    const canCreate = limits.processes === null || currentProcesses < limits.processes;
    expect(canCreate).toBe(false);
  });

  it("Evaluation limit check: Starter with 10 evaluations cannot create 11th", () => {
    const limits = getPlanLimits("starter")!;
    const currentEvaluations = 10;
    const canCreate = limits.evaluations === null || currentEvaluations < limits.evaluations;
    expect(canCreate).toBe(false);
  });

  it("Evaluator limit check: Starter with 5 evaluators cannot add 6th", () => {
    const limits = getPlanLimits("starter")!;
    const currentEvaluators = 5;
    const canAdd = limits.evaluators === null || currentEvaluators < limits.evaluators;
    expect(canAdd).toBe(false);
  });

  it("Scale plan can have unlimited processes", () => {
    const limits = getPlanLimits("scale")!;
    const currentProcesses = 999;
    const canCreate = limits.processes === null || currentProcesses < limits.processes;
    expect(canCreate).toBe(true);
  });
});

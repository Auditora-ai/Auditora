"use client";

import { config } from "@config";
import { Button } from "@repo/ui/components/button";
import { ArrowRightIcon } from "lucide-react";
import { useState } from "react";

interface RoiCalculatorProps {
  locale: string;
}

export function RoiCalculator({ locale }: RoiCalculatorProps) {
  const isEs = locale === "es";

  const [sessions, setSessions] = useState(4);
  const [hoursPost, setHoursPost] = useState(6);
  const [hourlyRate, setHourlyRate] = useState(150);

  // Auditora.ai reduces post-session work by ~75%
  const savedHoursPerSession = hoursPost * 0.75;
  const savedHoursPerMonth = savedHoursPerSession * sessions;
  const savedMoneyPerMonth = savedHoursPerMonth * hourlyRate;
  const savedHoursPerYear = savedHoursPerMonth * 12;
  const savedMoneyPerYear = savedMoneyPerMonth * 12;

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-surface px-4 pb-12 pt-24 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            {isEs ? "Herramienta Gratuita" : "Free Tool"}
          </div>
          <h1 className="font-display mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            {isEs
              ? "Calculadora de Ahorro en Documentacion"
              : "Process Documentation ROI Calculator"}
          </h1>
          <p className="text-lg text-muted-foreground">
            {isEs
              ? "Calcula cuanto tiempo y dinero ahorras con Auditora.ai."
              : "Calculate how much time and money you save with Auditora.ai."}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                {isEs
                  ? "Sesiones de levantamiento por mes"
                  : "Elicitation sessions per month"}
              </label>
              <input
                type="range"
                min={1}
                max={20}
                value={sessions}
                onChange={(e) => setSessions(Number(e.target.value))}
                className="w-full"
              />
              <div className="mt-1 text-right text-2xl font-bold text-foreground">
                {sessions}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                {isEs
                  ? "Horas de trabajo post-sesion (por sesion)"
                  : "Post-session work hours (per session)"}
              </label>
              <input
                type="range"
                min={1}
                max={16}
                value={hoursPost}
                onChange={(e) => setHoursPost(Number(e.target.value))}
                className="w-full"
              />
              <div className="mt-1 text-right text-2xl font-bold text-foreground">
                {hoursPost}h
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                {isEs ? "Tarifa por hora (USD)" : "Hourly rate (USD)"}
              </label>
              <input
                type="range"
                min={50}
                max={500}
                step={10}
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full"
              />
              <div className="mt-1 text-right text-2xl font-bold text-foreground">
                ${hourlyRate}
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="rounded-xl border border-border bg-[#0F172A] p-6">
            <h3 className="mb-6 text-sm font-medium uppercase tracking-wider text-[#94A3B8]">
              {isEs ? "Tu ahorro con Auditora.ai" : "Your savings with Auditora.ai"}
            </h3>

            <div className="space-y-6">
              <div>
                <p className="text-sm text-[#94A3B8]">
                  {isEs ? "Horas ahorradas / mes" : "Hours saved / month"}
                </p>
                <p className="text-4xl font-bold text-[#F1F5F9]">
                  {savedHoursPerMonth.toFixed(0)}h
                </p>
              </div>

              <div>
                <p className="text-sm text-[#94A3B8]">
                  {isEs ? "Dinero ahorrado / mes" : "Money saved / month"}
                </p>
                <p className="text-4xl font-bold text-green-400">
                  ${savedMoneyPerMonth.toLocaleString()}
                </p>
              </div>

              <div className="border-t border-[#334155] pt-6">
                <p className="text-sm text-[#94A3B8]">
                  {isEs ? "Ahorro anual" : "Annual savings"}
                </p>
                <p className="text-5xl font-bold text-green-400">
                  ${savedMoneyPerYear.toLocaleString()}
                </p>
                <p className="mt-1 text-sm text-[#94A3B8]">
                  {savedHoursPerYear.toFixed(0)}{" "}
                  {isEs ? "horas al ano" : "hours per year"}
                </p>
              </div>
            </div>

            <div className="mt-8">
              <a href={config.saasUrl}>
                <Button className="w-full gap-2" size="lg">
                  {isEs ? "Probar Auditora.ai Gratis" : "Try Auditora.ai Free"}
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

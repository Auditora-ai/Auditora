import { getActiveOrganization } from "@auth/lib/server";
import { db } from "@repo/database";
import { notFound } from "next/navigation";
import Link from "next/link";
import { cn } from "@repo/ui";
import {
  GraduationCapIcon,
  PlayIcon,
  ClockIcon,
  UserIcon,
} from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const template = await db.simulationTemplate.findUnique({
    where: { id: templateId },
    select: { title: true },
  });
  return { title: template?.title ?? "Evaluación" };
}

function scoreColor(score: number | null): string {
  if (score === null) return "text-muted-foreground";
  if (score >= 75) return "text-emerald-400";
  if (score >= 50) return "text-amber-400";
  return "text-red-400";
}

export default async function SimulationTemplatePage({
  params,
}: {
  params: Promise<{ organizationSlug: string; templateId: string }>;
}) {
  const { organizationSlug, templateId } = await params;

  const activeOrganization = await getActiveOrganization(organizationSlug);
  if (!activeOrganization) return notFound();

  const template = await db.simulationTemplate.findUnique({
    where: { id: templateId },
    include: {
      processDefinition: { select: { name: true } },
      scenarios: {
        include: {
          decisions: {
            orderBy: { order: "asc" },
            select: { id: true, order: true },
          },
          runs: {
            include: {
              user: { select: { name: true, image: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
        },
      },
    },
  });

  if (!template || template.organizationId !== activeOrganization.id) {
    return notFound();
  }

  const roleLabels: Record<string, string> = {
    DIRECTOR_OPERACIONES: "Dir. Operaciones",
    DIRECTOR_COMPRAS: "Dir. Compras",
    DIRECTOR_CALIDAD: "Dir. Calidad",
    DIRECTOR_FINANZAS: "Dir. Finanzas",
    DIRECTOR_LOGISTICA: "Dir. Logistica",
    GERENTE_PLANTA: "Ger. Planta",
    CONTROLLER: "Controller",
    CEO: "CEO",
    CUSTOM: "Personalizado",
  };

  const roleName =
    template.targetRole === "CUSTOM"
      ? template.customRoleName ?? "Personalizado"
      : roleLabels[template.targetRole] ?? template.targetRole;

  const totalRuns = template.scenarios.reduce(
    (acc, s) => acc + s.runs.length,
    0,
  );
  const completedRuns = template.scenarios.reduce(
    (acc, s) => acc + s.runs.filter((r) => r.status === "COMPLETED").length,
    0,
  );

  return (
    <div className="flex flex-col gap-5 px-4 py-5 md:gap-6 md:p-6">
      {/* Header */}
      <div>
        <Link
          href={`/${organizationSlug}/evaluaciones`}
          className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          &larr; Evaluaciones
        </Link>
        <h1 className="text-xl font-semibold text-foreground md:text-2xl">
          {template.title}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground md:gap-x-3 md:text-sm">
          <span className="truncate max-w-[180px] md:max-w-none">{template.processDefinition.name}</span>
          <span className="hidden md:inline">&middot;</span>
          <span>{roleName}</span>
          <span>&middot;</span>
          <span className="whitespace-nowrap">
            {template.scenarios.reduce(
              (acc, s) => acc + s.decisions.length,
              0,
            )}{" "}
            decisiones
          </span>
        </div>
      </div>

      {/* Narrative */}
      <div className="rounded-lg border border-border/50 bg-card p-4 md:p-5">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground md:text-sm">
          Contexto narrativo
        </h2>
        <p className="text-sm leading-relaxed text-foreground">
          {template.narrative}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="rounded-lg border border-border/50 bg-card p-3 md:p-4">
          <p className="text-[10px] text-muted-foreground md:text-xs">Escenarios</p>
          <p className="mt-0.5 text-xl font-semibold text-foreground md:mt-1 md:text-2xl" style={{ fontVariantNumeric: "tabular-nums" }}>
            {template.scenarios.length}
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-card p-3 md:p-4">
          <p className="text-[10px] text-muted-foreground md:text-xs">Evaluaciones</p>
          <p className="mt-0.5 text-xl font-semibold text-foreground md:mt-1 md:text-2xl" style={{ fontVariantNumeric: "tabular-nums" }}>
            {totalRuns}
          </p>
        </div>
        <div className="rounded-lg border border-border/50 bg-card p-3 md:p-4">
          <p className="text-[10px] text-muted-foreground md:text-xs">Completadas</p>
          <p className="mt-0.5 text-xl font-semibold text-foreground md:mt-1 md:text-2xl" style={{ fontVariantNumeric: "tabular-nums" }}>
            {completedRuns}
          </p>
        </div>
      </div>

      {/* Scenarios with start buttons */}
      <div>
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:text-sm">
          Escenarios disponibles
        </h2>
        <div className="grid gap-3">
          {template.scenarios.map((scenario, idx) => (
            <div
              key={scenario.id}
              className="flex flex-col gap-3 rounded-lg border border-border/50 bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4"
            >
              <div className="flex items-start gap-2.5 md:gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50">
                  <GraduationCapIcon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">
                    Escenario {idx + 1}
                  </span>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {scenario.decisions.length} decisiones &middot;{" "}
                    {scenario.runs.length} evaluaciones
                  </div>
                </div>
              </div>
              {template.status === "PUBLISHED" && (
                <Link
                  href={`/${organizationSlug}/evaluaciones/${template.id}/run/${scenario.id}`}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 active:scale-[0.98] sm:self-auto"
                >
                  <PlayIcon className="h-3.5 w-3.5" />
                  Iniciar Evaluación
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent runs */}
      {totalRuns > 0 && (
        <div>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground md:text-sm">
            Evaluaciones recientes
          </h2>
          <div className="grid gap-2">
            {template.scenarios.flatMap((s) =>
              s.runs.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between rounded-lg border border-border/50 bg-card px-3 py-2.5 md:px-4 md:py-3 min-h-[52px]"
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted/50 shrink-0">
                      <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm text-foreground truncate block">
                        {run.user.name}
                      </span>
                      {run.duration && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground md:text-xs">
                          <ClockIcon className="h-3 w-3" />
                          {Math.floor(run.duration / 60)}m {run.duration % 60}s
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3 shrink-0 ml-2">
                    <span
                      className={cn(
                        "text-sm font-medium tabular-nums",
                        scoreColor(run.overallScore),
                      )}
                    >
                      {run.overallScore !== null ? run.overallScore : "\u2014"}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                        run.status === "COMPLETED"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : run.status === "IN_PROGRESS"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-slate-500/20 text-slate-400",
                      )}
                    >
                      {run.status === "COMPLETED"
                        ? "Completada"
                        : run.status === "IN_PROGRESS"
                          ? "En curso"
                          : "Abandonada"}
                    </span>
                  </div>
                </div>
              )),
            )}
          </div>
        </div>
      )}
    </div>
  );
}

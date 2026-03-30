"use client";

import { cn } from "@repo/ui";
import { scoreColor, scoreBg } from "@simulations/lib/score-utils";
import type { ProfileItem } from "@simulations/lib/dashboard-queries";

interface TeamTableProps {
  profiles: ProfileItem[];
}

export function TeamTable({ profiles }: TeamTableProps) {
  if (profiles.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
      <div className="px-5 py-4">
        <h3 className="text-sm font-medium text-slate-400">
          Detalle por Miembro
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-t border-slate-800 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
              <th className="px-5 py-3">Miembro</th>
              <th className="px-5 py-3">Puntaje</th>
              <th className="px-5 py-3">Simulaciones</th>
              <th className="hidden px-5 py-3 md:table-cell">Fortalezas</th>
              <th className="hidden px-5 py-3 md:table-cell">
                Áreas de riesgo
              </th>
              <th className="px-5 py-3">Actualizado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {profiles.map((profile) => (
              <tr
                key={profile.id}
                className="transition-colors hover:bg-slate-800/50"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    {profile.user.image ? (
                      <img
                        src={profile.user.image}
                        alt=""
                        className="h-8 w-8 rounded-full"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-medium text-slate-300">
                        {(profile.user.name || profile.user.email)
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {profile.user.name || profile.user.email}
                      </p>
                      {profile.user.name && (
                        <p className="text-xs text-slate-500">
                          {profile.user.email}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-md px-2.5 py-1 text-sm font-semibold",
                      scoreBg(profile.overallScore),
                      scoreColor(profile.overallScore),
                    )}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {profile.overallScore ?? "—"}
                  </span>
                </td>
                <td
                  className="px-5 py-4 text-sm text-slate-400"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {profile.totalSimulations}
                </td>
                <td className="hidden px-5 py-4 md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {((profile.strengthAreas as string[]) || [])
                      .slice(0, 2)
                      .map((area) => (
                        <span
                          key={area}
                          className="inline-block rounded bg-emerald-950/40 px-2 py-0.5 text-xs text-emerald-400"
                        >
                          {area}
                        </span>
                      ))}
                  </div>
                </td>
                <td className="hidden px-5 py-4 md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {((profile.riskAreas as string[]) || [])
                      .slice(0, 2)
                      .map((area) => (
                        <span
                          key={area}
                          className="inline-block rounded bg-red-950/40 px-2 py-0.5 text-xs text-red-400"
                        >
                          {area}
                        </span>
                      ))}
                  </div>
                </td>
                <td className="px-5 py-4 text-xs text-slate-500">
                  {new Date(profile.lastUpdatedAt).toLocaleDateString("es-MX", {
                    day: "numeric",
                    month: "short",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

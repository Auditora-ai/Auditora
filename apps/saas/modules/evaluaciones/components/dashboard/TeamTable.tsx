"use client";

import { cn } from "@repo/ui";
import { scoreColor, scoreBg } from "@evaluaciones/lib/score-utils";
import type { ProfileItem } from "@evaluaciones/lib/dashboard-queries";
import { useTranslations } from "next-intl";

interface TeamTableProps {
  profiles: ProfileItem[];
}

export function TeamTable({ profiles }: TeamTableProps) {
  const t = useTranslations("evaluaciones.dashboard");

  if (profiles.length === 0) return null;

  return (
    <div>
      <div className="px-1 py-3 md:px-5 md:py-4">
        <h3 className="text-sm font-medium text-slate-400">
          {t("teamDetail")}
        </h3>
      </div>

      {/* Mobile: Card layout */}
      <div className="grid grid-cols-1 gap-3 md:hidden">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="rounded-2xl border border-slate-800 bg-slate-900 p-4"
          >
            {/* Header: Avatar + Name + Score */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {profile.user.image ? (
                  <img
                    src={profile.user.image}
                    alt=""
                    className="h-9 w-9 rounded-full shrink-0"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-medium text-slate-300 shrink-0">
                    {(profile.user.name || profile.user.email)
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {profile.user.name || profile.user.email}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {profile.totalSimulations} {t("evaluations")}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex items-center rounded-md px-2.5 py-1 text-base font-bold shrink-0",
                  scoreBg(profile.overallScore),
                  scoreColor(profile.overallScore),
                )}
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {profile.overallScore ?? "—"}
              </span>
            </div>

            {/* Strengths & Risk Areas */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {((profile.strengthAreas as string[]) || [])
                .slice(0, 2)
                .map((area) => (
                  <span
                    key={area}
                    className="inline-block rounded bg-emerald-950/40 px-2 py-0.5 text-[10px] text-emerald-400"
                  >
                    {area}
                  </span>
                ))}
              {((profile.riskAreas as string[]) || [])
                .slice(0, 2)
                .map((area) => (
                  <span
                    key={area}
                    className="inline-block rounded bg-red-950/40 px-2 py-0.5 text-[10px] text-red-400"
                  >
                    {area}
                  </span>
                ))}
            </div>

            {/* Updated */}
            <p className="mt-2 text-[10px] text-slate-500">
              {t("updated")}: {new Date(profile.lastUpdatedAt).toLocaleDateString(undefined, {
                day: "numeric",
                month: "short",
              })}
            </p>
          </div>
        ))}
      </div>

      {/* Desktop: Table layout */}
      <div className="hidden md:block overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-slate-800 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">{t("member")}</th>
                <th className="px-5 py-3">{t("score")}</th>
                <th className="px-5 py-3">{t("evaluations")}</th>
                <th className="px-5 py-3">{t("strengths")}</th>
                <th className="px-5 py-3">{t("riskAreas")}</th>
                <th className="px-5 py-3">{t("updated")}</th>
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
                  <td className="px-5 py-4">
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
                  <td className="px-5 py-4">
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
                    {new Date(profile.lastUpdatedAt).toLocaleDateString(undefined, {
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
    </div>
  );
}

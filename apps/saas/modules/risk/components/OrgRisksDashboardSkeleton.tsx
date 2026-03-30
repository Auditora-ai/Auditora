"use client";

import { Skeleton } from "@repo/ui/components/skeleton";

export function OrgRisksDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="rounded-xl border border-chrome-border bg-chrome-raised p-4"
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-8 w-12" />
          </div>
        ))}
      </div>

      {/* Main layout */}
      <div className="flex gap-6">
        {/* Sidebar skeleton */}
        <aside className="hidden w-[240px] shrink-0 lg:block">
          <Skeleton className="mb-3 h-4 w-20" />
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </aside>

        {/* Content skeleton */}
        <div className="min-w-0 flex-1 space-y-6">
          {/* Heat map placeholder */}
          <div className="rounded-xl border border-chrome-border bg-chrome-raised p-4">
            <Skeleton className="mb-3 h-4 w-32" />
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </div>

          {/* Toolbar */}
          <div className="flex gap-2">
            <Skeleton className="h-9 flex-1" />
            <Skeleton className="h-9 w-[150px]" />
            <Skeleton className="h-9 w-[150px]" />
          </div>

          {/* Tabs */}
          <div className="flex gap-4 border-b border-chrome-border pb-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-24" />
          </div>

          {/* Risk cards */}
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <div
                key={i}
                className="rounded-xl border border-chrome-border bg-chrome-raised p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-20 rounded-full" />
                      <Skeleton className="h-5 w-24 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-10 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

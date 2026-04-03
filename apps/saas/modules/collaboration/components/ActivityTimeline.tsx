"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import {
  GitBranch,
  MessageSquare,
  CheckCircle,
  AlertTriangle,
  Edit3,
  User,
  Activity,
} from "lucide-react";

interface ActivityEntry {
  id: string;
  action: string;
  section: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
}

interface ActivityTimelineProps {
  processId: string;
  limit?: number;
}

const ACTION_CONFIG: Record<string, { icon: typeof Activity; label: string; color: string }> = {
  edited_bpmn: { icon: GitBranch, label: "edited the diagram", color: "text-[#3B8FE8]" },
  edited_procedure: { icon: Edit3, label: "edited the procedure", color: "text-purple-400" },
  added_risk: { icon: AlertTriangle, label: "added a risk", color: "text-amber-400" },
  updated_raci: { icon: User, label: "updated RACI matrix", color: "text-emerald-400" },
  commented: { icon: MessageSquare, label: "left a comment", color: "text-[#3B8FE8]" },
  resolved_comment: { icon: CheckCircle, label: "resolved a comment", color: "text-emerald-400" },
};

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString();
}

export function ActivityTimeline({ processId, limit = 10 }: ActivityTimelineProps) {
  const { data, isLoading } = useQuery({
    ...orpc.collaboration.getActivityLog.queryOptions({
      input: { processId, limit },
    }),
    enabled: !!processId,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const activities = (data?.items ?? []) as ActivityEntry[];

  if (isLoading) {
    return (
      <div className="space-y-3 p-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 rounded-lg bg-white/[0.02] animate-pulse" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="py-6 text-center">
        <Activity className="h-6 w-6 text-white/20 mx-auto mb-2" />
        <p className="text-xs text-white/30">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) => {
        const config = ACTION_CONFIG[activity.action] ?? {
          icon: Activity,
          label: activity.action,
          color: "text-white/50",
        };
        const Icon = config.icon;

        return (
          <div
            key={activity.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.02] transition-colors"
          >
            <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${config.color}`} />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-white/70">
                <strong className="text-white/90">{activity.user.name}</strong>{" "}
                <span className="text-white/50">{config.label}</span>
              </span>
            </div>
            <span className="text-[10px] text-white/25 flex-shrink-0">
              {formatTimeAgo(activity.createdAt)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

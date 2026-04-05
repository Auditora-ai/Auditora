"use client";

import { getUserColor } from "../lib/presence-colors";
import type { OnlineUser } from "../hooks/use-presence";

interface PresenceAvatarsProps {
  users: OnlineUser[];
  max?: number;
}

export function PresenceAvatars({ users, max = 5 }: PresenceAvatarsProps) {
  if (users.length === 0) return null;

  const visible = users.slice(0, max);
  const overflow = users.length - max;

  return (
    <div className="flex items-center -space-x-2">
      {visible.map((user) => {
        const color = getUserColor(user.id);
        return (
          <div
            key={user.id}
            className="relative h-8 w-8 min-h-8 min-w-8 rounded-full border-2 border-chrome-base overflow-hidden flex items-center justify-center text-xs font-medium"
            style={{ borderColor: color, backgroundColor: `${color}20` }}
            title={`${user.name} — ${user.activeSection ?? "viewing"}`}
          >
            {user.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="h-full w-full object-cover rounded-full"
              />
            ) : (
              <span style={{ color }}>{user.name.charAt(0).toUpperCase()}</span>
            )}
            {/* Online indicator */}
            <span
              className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-chrome-base"
              style={{ backgroundColor: color }}
            />
          </div>
        );
      })}
      {overflow > 0 && (
        <div className="h-8 w-8 min-h-8 min-w-8 rounded-full bg-chrome-raised/50 border-2 border-chrome-base flex items-center justify-center text-xs text-chrome-text-secondary font-medium">
          +{overflow}
        </div>
      )}
    </div>
  );
}

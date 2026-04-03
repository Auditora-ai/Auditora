"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { useState, useCallback } from "react";

interface LockInfo {
  id: string;
  expiresAt: string;
  lockedBy?: {
    id: string;
    name: string;
    image: string | null;
  };
}

export function useLock(processId: string | undefined) {
  const [activeLocks, setActiveLocks] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const acquireLock = useCallback(
    async (section: string) => {
      if (!processId) return false;
      try {
        const result = await orpcClient.collaboration.acquireLock({
          processId,
          section,
        });
        setActiveLocks((prev) => new Set([...prev, section]));
        setError(null);
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to acquire lock";
        setError(message);
        return false;
      }
    },
    [processId],
  );

  const releaseLock = useCallback(
    async (section: string) => {
      if (!processId) return;
      try {
        await orpcClient.collaboration.releaseLock({ processId, section });
        setActiveLocks((prev) => {
          const next = new Set(prev);
          next.delete(section);
          return next;
        });
      } catch {
        // Silently fail on release
      }
    },
    [processId],
  );

  const isLockedByMe = useCallback(
    (section: string) => activeLocks.has(section),
    [activeLocks],
  );

  return {
    activeLocks,
    error,
    acquireLock,
    releaseLock,
    isLockedByMe,
  };
}

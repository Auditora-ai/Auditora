"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { orpcClient } from "@shared/lib/orpc-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useEffect } from "react";

interface OnlineUser {
  id: string;
  name: string;
  image: string | null;
  activeSection: string | null;
  activeNodeId: string | null;
  lastSeen: string;
}

export function usePresence(processId: string | undefined) {
  const queryClient = useQueryClient();
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const presenceQuery = useQuery({
    ...orpc.collaboration.getPresence.queryOptions({
      input: { processId: processId ?? "" },
    }),
    enabled: !!processId,
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  const heartbeatMutation = useMutation({
    mutationFn: (data: {
      processId: string;
      activeSection?: string;
      activeNodeId?: string;
    }) => orpcClient.collaboration.presenceHeartbeat(data),
    onSuccess: (data) => {
      queryClient.setQueryData(
        orpc.collaboration.getPresence.queryOptions({
          input: { processId: processId ?? "" },
        }).queryKey,
        data,
      );
    },
  });

  const startHeartbeat = useCallback(
    (section?: string) => {
      if (!processId) return;
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);

      heartbeatMutation.mutate({
        processId,
        activeSection: section,
      });

      heartbeatRef.current = setInterval(() => {
        heartbeatMutation.mutate({
          processId,
          activeSection: section,
        });
      }, 15_000);
    },
    [processId, heartbeatMutation],
  );

  const stopHeartbeat = useCallback(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => stopHeartbeat();
  }, [stopHeartbeat]);

  return {
    onlineUsers: (presenceQuery.data?.onlineUsers ?? []) as OnlineUser[],
    isLoading: presenceQuery.isLoading,
    startHeartbeat,
    stopHeartbeat,
  };
}

"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import { usePresence } from "../hooks/use-presence";
import { useLock } from "../hooks/use-lock";
import { useComments } from "../hooks/use-comments";

interface CollaborationContextValue {
  processId: string;
  onlineUsers: ReturnType<typeof usePresence>["onlineUsers"];
  isLoadingPresence: boolean;
  startHeartbeat: (section?: string) => void;
  stopHeartbeat: () => void;
  acquireLock: (section: string) => Promise<boolean>;
  releaseLock: (section: string) => Promise<void>;
  isLockedByMe: (section: string) => boolean;
  lockError: string | null;
  comments: ReturnType<typeof useComments>["comments"];
  isLoadingComments: boolean;
  addComment: ReturnType<typeof useComments>["addComment"];
  isAddingComment: boolean;
  resolveComment: ReturnType<typeof useComments>["resolveComment"];
  isResolvingComment: boolean;
  currentSection: string | null;
  setCurrentSection: (section: string | null) => void;
}

const CollaborationContext = createContext<CollaborationContextValue | null>(null);

export function useCollaboration() {
  const ctx = useContext(CollaborationContext);
  if (!ctx) {
    throw new Error("useCollaboration must be used within a CollaborationProvider");
  }
  return ctx;
}

interface CollaborationProviderProps {
  processId: string;
  children: ReactNode;
}

export function CollaborationProvider({ processId, children }: CollaborationProviderProps) {
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const sectionRef = useRef<string | null>(null);

  const {
    onlineUsers,
    isLoading: isLoadingPresence,
    startHeartbeat,
    stopHeartbeat,
  } = usePresence(processId);

  const {
    acquireLock,
    releaseLock,
    isLockedByMe,
    error: lockError,
  } = useLock(processId);

  const {
    comments,
    isLoading: isLoadingComments,
    addComment,
    isPending: isAddingComment,
    resolveComment,
    isPending: isResolvingComment,
  } = useComments(processId, currentSection ?? undefined);

  // Start heartbeat when mounted, stop on unmount
  useEffect(() => {
    startHeartbeat(sectionRef.current ?? undefined);
    return () => {
      stopHeartbeat();
    };
  }, [startHeartbeat, stopHeartbeat]);

  // Update heartbeat section when section changes
  const handleSetCurrentSection = useCallback(
    (section: string | null) => {
      sectionRef.current = section;
      setCurrentSection(section);
      startHeartbeat(section ?? undefined);
    },
    [startHeartbeat],
  );

  const value: CollaborationContextValue = {
    processId,
    onlineUsers,
    isLoadingPresence,
    startHeartbeat,
    stopHeartbeat,
    acquireLock,
    releaseLock,
    isLockedByMe,
    lockError,
    comments,
    isLoadingComments,
    addComment,
    isAddingComment,
    resolveComment,
    isResolvingComment,
    currentSection,
    setCurrentSection: handleSetCurrentSection,
  };

  return (
    <CollaborationContext.Provider value={value}>
      {children}
    </CollaborationContext.Provider>
  );
}

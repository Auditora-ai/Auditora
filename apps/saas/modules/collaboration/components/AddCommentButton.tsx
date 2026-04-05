"use client";

import { MessageSquare } from "lucide-react";

interface AddCommentButtonProps {
  onClick: () => void;
  count?: number;
  className?: string;
}

export function AddCommentButton({ onClick, count, className = "" }: AddCommentButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex items-center gap-1.5 rounded-full bg-chrome-raised/30 border border-chrome-border px-3 py-1.5 min-h-[48px] text-xs text-chrome-text-muted hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all ${className}`}
      title="Add comment"
    >
      <MessageSquare className="h-3.5 w-3.5" />
      {count !== undefined && count > 0 && (
        <span className="text-[10px] tabular-nums">{count}</span>
      )}
    </button>
  );
}

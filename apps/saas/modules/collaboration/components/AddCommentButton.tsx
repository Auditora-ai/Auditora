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
      className={`group flex items-center gap-1.5 rounded-full bg-white/[0.04] border border-white/10 px-3 py-1.5 min-h-[32px] text-xs text-white/50 hover:text-[#3B8FE8] hover:border-[#3B8FE8]/30 hover:bg-[#3B8FE8]/5 transition-all ${className}`}
      title="Add comment"
    >
      <MessageSquare className="h-3.5 w-3.5" />
      {count !== undefined && count > 0 && (
        <span className="text-[10px] tabular-nums">{count}</span>
      )}
    </button>
  );
}

"use client";

import { Check, MessageSquare, Reply } from "lucide-react";
import type { ProcessCommentType } from "../hooks/use-comments";

interface CommentBubbleProps {
  comment: ProcessCommentType;
  onReply?: (parentId: string) => void;
  onResolve?: (commentId: string) => void;
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function CommentBubble({ comment, onReply, onResolve }: CommentBubbleProps) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 min-h-7 min-w-7 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center text-[11px] font-medium text-white/70">
          {comment.author.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-white/90">{comment.author.name}</span>
          <span className="text-[11px] text-white/40 ml-2">{formatTimeAgo(comment.createdAt)}</span>
        </div>
        {comment.resolved && (
          <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
            <Check className="h-3 w-3" />
            Resolved
          </span>
        )}
      </div>

      {/* Body */}
      <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap break-words">
        {comment.body}
      </p>

      {/* Actions */}
      {!comment.resolved && (
        <div className="flex items-center gap-3 pt-1">
          {onReply && (
            <button
              type="button"
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 text-[11px] text-white/40 hover:text-white/70 transition-colors min-h-[28px]"
            >
              <Reply className="h-3 w-3" />
              Reply
            </button>
          )}
          {onResolve && (
            <button
              type="button"
              onClick={() => onResolve(comment.id)}
              className="flex items-center gap-1 text-[11px] text-white/40 hover:text-emerald-400 transition-colors min-h-[28px]"
            >
              <Check className="h-3 w-3" />
              Resolve
            </button>
          )}
        </div>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-4 pl-3 border-l border-white/10 space-y-2 mt-2">
          {comment.replies.map((reply) => (
            <div key={reply.id} className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 min-h-5 min-w-5 rounded-full bg-white/[0.06] flex items-center justify-center text-[9px] font-medium text-white/50">
                  {reply.author.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-white/70">{reply.author.name}</span>
                <span className="text-[10px] text-white/30">{formatTimeAgo(reply.createdAt)}</span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed whitespace-pre-wrap break-words">
                {reply.body}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

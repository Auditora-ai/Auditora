"use client";

import { useState, useRef, useEffect } from "react";
import { Send, X, MessageSquare } from "lucide-react";
import { useCollaboration } from "./CollaborationProvider";
import { CommentBubble } from "./CommentBubble";

interface CommentSidebarProps {
  section: string;
  onClose?: () => void;
}

export function CommentSidebar({ section, onClose }: CommentSidebarProps) {
  const {
    comments,
    isLoadingComments,
    addComment,
    isAddingComment,
    resolveComment,
    isResolvingComment,
  } = useCollaboration();

  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  const handleSubmit = () => {
    const body = newComment.trim();
    if (!body) return;

    addComment({
      body,
      section,
      parentId: replyingTo ?? undefined,
    });
    setNewComment("");
    setReplyingTo(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === "Escape") {
      setReplyingTo(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0A1428]/80 backdrop-blur-sm border-l border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#3B8FE8]" />
          <span className="text-sm font-semibold text-white/90">Comments</span>
          {comments.length > 0 && (
            <span className="text-[11px] text-white/40 bg-white/[0.06] px-1.5 py-0.5 rounded-full">
              {comments.length}
            </span>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 min-h-8 min-w-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <X className="h-4 w-4 text-white/50" />
          </button>
        )}
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoadingComments ? (
          <div className="flex flex-col gap-3 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-white/[0.02] animate-pulse" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-8 w-8 text-white/20 mb-2" />
            <p className="text-sm text-white/40">No comments yet</p>
            <p className="text-[11px] text-white/25 mt-1">Be the first to comment on this section</p>
          </div>
        ) : (
          comments.map((comment) => (
            <CommentBubble
              key={comment.id}
              comment={comment}
              onReply={(parentId) => setReplyingTo(parentId)}
              onResolve={resolveComment}
            />
          ))
        )}
      </div>

      {/* Compose */}
      <div className="border-t border-white/10 p-3">
        {replyingTo && (
          <div className="flex items-center justify-between mb-2 px-2 py-1 bg-white/[0.03] rounded-lg">
            <span className="text-[11px] text-white/40">Replying to thread</span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-[11px] text-white/40 hover:text-white/70"
            >
              Cancel
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Add a comment..."
            rows={2}
            className="flex-1 rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:border-[#3B8FE8]/50 focus:outline-none resize-none min-h-[44px]"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!newComment.trim() || isAddingComment}
            className="h-11 w-11 min-h-11 min-w-11 flex items-center justify-center rounded-lg bg-[#3B8FE8] text-white hover:bg-[#2E7FD6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] text-white/25 mt-1.5">Ctrl+Enter to send</p>
      </div>
    </div>
  );
}

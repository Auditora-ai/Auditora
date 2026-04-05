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
    <div className="flex flex-col h-full bg-chrome-base/80 backdrop-blur-sm border-l border-chrome-border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-chrome-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-chrome-text">Comments</span>
          {comments.length > 0 && (
            <span className="text-[11px] text-chrome-text-muted bg-chrome-raised/50 px-1.5 py-0.5 rounded-full">
              {comments.length}
            </span>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 min-h-[48px] min-w-8 flex items-center justify-center rounded-lg hover:bg-chrome-hover transition-colors"
          >
            <X className="h-4 w-4 text-chrome-text-muted" />
          </button>
        )}
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoadingComments ? (
          <div className="flex flex-col gap-3 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-chrome-raised/50 animate-pulse" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-8 w-8 text-chrome-text-muted/40 mb-2" />
            <p className="text-sm text-chrome-text-muted">No comments yet</p>
            <p className="text-[11px] text-chrome-text-muted/50 mt-1">Be the first to comment on this section</p>
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
      <div className="border-t border-chrome-border p-3">
        {replyingTo && (
          <div className="flex items-center justify-between mb-2 px-2 py-1 bg-chrome-raised/30 rounded-lg">
            <span className="text-[11px] text-chrome-text-muted">Replying to thread</span>
            <button
              type="button"
              onClick={() => setReplyingTo(null)}
              className="text-[11px] text-chrome-text-muted hover:text-chrome-text-secondary"
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
            className="flex-1 rounded-lg bg-chrome-raised/30 border border-chrome-border px-3 py-2 text-sm text-chrome-text placeholder:text-chrome-text-muted/60 focus:border-primary/50 focus:outline-none resize-none min-h-[44px]"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!newComment.trim() || isAddingComment}
            className="h-11 w-11 min-h-[48px] min-w-11 flex items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-action-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="text-[10px] text-chrome-text-muted/50 mt-1.5">Ctrl+Enter to send</p>
      </div>
    </div>
  );
}

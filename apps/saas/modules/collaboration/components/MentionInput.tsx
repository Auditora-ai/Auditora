"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { atSign } from "lucide-react";

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentions: string[]) => void;
  placeholder?: string;
  rows?: number;
  members: Array<{ id: string; name: string }>;
  onSubmit?: () => void;
}

/** Extract @mentions from text: finds @Name patterns and resolves to user IDs */
function extractMentions(text: string, members: Array<{ id: string; name: string }>): string[] {
  const mentions: string[] = [];
  const regex = /@(\w+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const name = match[1].toLowerCase();
    const member = members.find((m) => m.name.toLowerCase().startsWith(name));
    if (member && !mentions.includes(member.id)) {
      mentions.push(member.id);
    }
  }
  return mentions;
}

export function MentionInput({
  value,
  onChange,
  placeholder = "Add a comment...",
  rows = 2,
  members,
  onSubmit,
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const filteredMembers = members.filter((m) =>
    m.name.toLowerCase().includes(mentionQuery.toLowerCase()),
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      const cursor = e.target.selectionStart ?? newValue.length;
      setCursorPosition(cursor);

      // Check if user is typing a mention
      const textBeforeCursor = newValue.slice(0, cursor);
      const atIdx = textBeforeCursor.lastIndexOf("@");
      if (atIdx !== -1 && (atIdx === 0 || textBeforeCursor[atIdx - 1] === " ")) {
        const query = textBeforeCursor.slice(atIdx + 1);
        if (!query.includes(" ")) {
          setMentionQuery(query);
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
      }

      const mentions = extractMentions(newValue, members);
      onChange(newValue, mentions);
    },
    [members, onChange],
  );

  const insertMention = useCallback(
    (member: { id: string; name: string }) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const textBeforeCursor = value.slice(0, cursorPosition);
      const atIdx = textBeforeCursor.lastIndexOf("@");
      if (atIdx === -1) return;

      const before = value.slice(0, atIdx);
      const after = value.slice(cursorPosition);
      const newValue = `${before}@${member.name} ${after}`;

      const mentions = extractMentions(newValue, members);
      onChange(newValue, mentions);
      setShowSuggestions(false);

      // Move cursor after the inserted name
      requestAnimationFrame(() => {
        const newCursor = atIdx + member.name.length + 2;
        textarea.setSelectionRange(newCursor, newCursor);
        textarea.focus();
      });
    },
    [value, cursorPosition, members, onChange],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onSubmit?.();
      }
      if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    },
    [onSubmit],
  );

  // Close suggestions on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2 text-sm text-white/90 placeholder:text-white/30 focus:border-[#3B8FE8]/50 focus:outline-none resize-none min-h-[44px]"
      />
      {showSuggestions && filteredMembers.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute bottom-full left-0 mb-1 w-56 max-h-40 overflow-y-auto rounded-lg bg-[#0F2847] border border-white/10 shadow-xl z-50"
        >
          <div className="p-1">
            <div className="px-2 py-1 text-[10px] text-white/30 uppercase tracking-wider">Members</div>
            {filteredMembers.map((member) => (
              <button
                key={member.id}
                type="button"
                onClick={() => insertMention(member)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/[0.06] transition-colors text-left min-h-[36px]"
              >
                <div className="h-6 w-6 min-h-6 min-w-6 rounded-full bg-[#3B8FE8]/20 flex items-center justify-center text-[10px] text-[#3B8FE8]">
                  {member.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-white/80">{member.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

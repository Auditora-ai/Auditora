"use client";

import { useEffect, useRef } from "react";

interface TranscriptEntry {
  id: string;
  speaker: string;
  text: string;
  timestamp: number;
}

const SPEAKER_COLORS: Record<string, string> = {
  consultant: "text-blue-400",
  default: "text-purple-400",
};

function getSpeakerColor(speaker: string, index: number): string {
  if (speaker.toLowerCase().includes("you") || speaker.toLowerCase().includes("consultant")) {
    return "text-blue-400";
  }
  const colors = ["text-purple-400", "text-emerald-400", "text-amber-400", "text-rose-400"];
  return colors[index % colors.length] || "text-purple-400";
}

function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface TranscriptPanelProps {
  entries: TranscriptEntry[];
}

export function TranscriptPanel({ entries }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const speakerIndexMap = useRef(new Map<string, number>());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [entries.length]);

  const getSpeakerIndex = (speaker: string): number => {
    if (!speakerIndexMap.current.has(speaker)) {
      speakerIndexMap.current.set(speaker, speakerIndexMap.current.size);
    }
    return speakerIndexMap.current.get(speaker)!;
  };

  return (
    <div className="flex h-full flex-col">
      {/* Panel header */}
      <div className="border-b border-slate-800 px-3 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Live Transcript
        </span>
      </div>

      {/* Transcript entries */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <div className="mb-3 h-8 w-8 rounded-full border-2 border-slate-700 flex items-center justify-center">
              <div className="h-3 w-3 rounded-full bg-slate-600" />
            </div>
            <p className="text-sm text-slate-500">Listening...</p>
            <p className="mt-1 text-xs text-slate-600">
              No speech detected yet
            </p>
          </div>
        ) : (
          entries.map((entry) => {
            const speakerIdx = getSpeakerIndex(entry.speaker);
            const colorClass = getSpeakerColor(entry.speaker, speakerIdx);

            return (
              <div
                key={entry.id}
                className="border-b border-slate-800/30 px-3 py-2"
              >
                <div className="flex items-baseline justify-between">
                  <span className={`text-[11px] font-semibold ${colorClass}`}>
                    {entry.speaker}
                  </span>
                  <span className="text-[10px] text-slate-600">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-300">
                  {entry.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

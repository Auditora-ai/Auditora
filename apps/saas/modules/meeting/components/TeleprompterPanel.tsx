"use client";

interface TeleprompterPanelProps {
  currentQuestion: string;
  questionQueue: string[];
  aiSuggestion: string | null;
  sessionType: "DISCOVERY" | "DEEP_DIVE";
}

export function TeleprompterPanel({
  currentQuestion,
  questionQueue,
  aiSuggestion,
  sessionType,
}: TeleprompterPanelProps) {
  return (
    <div className="flex h-full flex-col">
      {/* Panel header */}
      <div className="border-b border-slate-800 px-3 py-2.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Teleprompter
        </span>
        <span className="ml-2 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
          {sessionType === "DISCOVERY" ? "Discovery" : "Deep Dive"}
        </span>
      </div>

      {/* Current question — large, prominent */}
      <div className="border-b border-blue-900/30 bg-blue-950/30 px-4 py-4">
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-400">
          Ask Now
        </div>
        <p className="font-serif text-lg leading-relaxed text-slate-100">
          {currentQuestion}
        </p>
      </div>

      {/* Question queue */}
      <div className="flex-1 overflow-y-auto">
        {questionQueue.map((question, index) => (
          <div
            key={index}
            className="border-b border-slate-800/50 px-4 py-3"
          >
            <span className="mr-2 text-xs font-semibold text-slate-600">
              {index + 1}.
            </span>
            <span className="text-sm leading-relaxed text-slate-400">
              {question}
            </span>
          </div>
        ))}
        {questionQueue.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-slate-600">
              Start speaking to activate guided questions
            </p>
          </div>
        )}
      </div>

      {/* AI suggestion */}
      {aiSuggestion && (
        <div className="border-t border-amber-900/30 bg-amber-950/20 px-4 py-3">
          <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-amber-500">
            AI Suggestion
          </div>
          <p className="text-xs leading-relaxed text-amber-200/70">
            {aiSuggestion}
          </p>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Code2,
} from 'lucide-react';

export default function EditorPanel({
  inputText,
  setInputText,
  onAnalyze,
  isLoading,
  examples,
  onSelectExample,
  selectedExampleId,
  statements,
  selectedStatementIndex,
  onSelectStatement,
  detectedVariables,
}) {
  const lineCount = inputText.split('\n').length;
  const charCount = inputText.length;

  return (
    <div className="flex flex-col h-full bg-slate-950/70 border-r border-white/10 overflow-hidden">
      {/* Preset Selector Bar */}
      <div className="p-3 border-b border-white/10 bg-slate-900/60 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <BookOpen size={15} className="text-indigo-400 shrink-0" />
          <select
            value={selectedExampleId || ''}
            onChange={(e) => onSelectExample(e.target.value)}
            className="w-full bg-slate-800/90 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 border border-white/10 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="" disabled>
              Select Example Algorithm...
            </option>
            {examples.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title} ({ex.category})
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setInputText('')}
          title="Clear text editor"
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-white/10 transition-colors cursor-pointer"
        >
          <RotateCcw size={14} />
        </button>
      </div>

      {/* Editor Main Textarea */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Code2 size={14} className="text-cyan-400" />
            <span>Natural Language Algorithm</span>
          </label>
          <span className="text-[11px] font-mono text-slate-500">
            {lineCount} lines · {charCount} chars
          </span>
        </div>

        <div className="relative flex-1 flex flex-col rounded-xl border border-white/10 bg-slate-900/80 overflow-hidden focus-within:border-indigo-500/60 transition-colors">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste your natural language algorithm here...
e.g.
Start.
Read a number.
If it is even, print Even; otherwise, print Odd.
End."
            className="w-full flex-1 p-3.5 bg-transparent text-slate-200 font-mono text-xs leading-relaxed resize-none focus:outline-none"
            spellCheck={false}
          />
        </div>

        {/* Detected Variables Pill Bar */}
        {detectedVariables && detectedVariables.length > 0 && (
          <div className="mt-2.5 flex items-center gap-1.5 overflow-x-auto py-1">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider shrink-0">
              Variables:
            </span>
            <div className="flex items-center gap-1">
              {detectedVariables.map((v, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-cyan-950/70 text-cyan-300 border border-cyan-800/50 shadow-sm"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Convert CTA Button */}
        <button
          onClick={onAnalyze}
          disabled={isLoading || !inputText.trim()}
          className="mt-3.5 w-full py-2.5 px-4 rounded-xl font-semibold text-xs tracking-wide uppercase flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing NLP & Building Graph...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Convert to Flowchart</span>
            </>
          )}
        </button>
      </div>

      {/* Traceability: Segmented Statements List */}
      {statements && statements.length > 0 && (
        <div className="h-60 border-t border-white/10 bg-slate-900/40 flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-white/5 bg-slate-950/60 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Source Statements & Classification
            </span>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              {statements.length} steps
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {statements.map((stmt) => {
              const isSelected = selectedStatementIndex === stmt.index;
              const badgeClass = `badge-${stmt.statement_type}`;

              return (
                <div
                  key={stmt.index}
                  onClick={() => onSelectStatement(stmt.index)}
                  className={`statement-row px-4 py-2.5 cursor-pointer flex items-start gap-2.5 ${
                    isSelected ? 'active' : ''
                  }`}
                >
                  <span className="text-[10px] font-mono text-slate-500 w-4 pt-0.5 text-right shrink-0">
                    {stmt.index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${badgeClass}`}>
                        {stmt.statement_type}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {Math.round(stmt.confidence * 100)}% conf
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 break-words font-sans">
                      {stmt.cleaned_text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

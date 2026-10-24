import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export default function ValidationPanel({ validation, onSelectNode, onSelectStatement }) {
  if (!validation) return null;

  const { is_valid, errors_count, warnings_count, issues } = validation;
  const hasIssues = issues && issues.length > 0;

  return (
    <div className="glass-panel rounded-xl border border-white/10 p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className={is_valid ? 'text-emerald-400' : 'text-rose-400'} />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Structural & Semantic Validation
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {errors_count > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
              <XCircle size={11} /> {errors_count} {errors_count === 1 ? 'Error' : 'Errors'}
            </span>
          )}
          {warnings_count > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1">
              <AlertTriangle size={11} /> {warnings_count} {warnings_count === 1 ? 'Warning' : 'Warnings'}
            </span>
          )}
          {is_valid && warnings_count === 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 size={11} /> All Checks Passed
            </span>
          )}
        </div>
      </div>

      {!hasIssues ? (
        <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>Graph structure is well-formed: connected terminals, reachable nodes, and valid branches.</span>
        </div>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {issues.map((issue, idx) => {
            const isError = issue.level === 'error';
            const isWarning = issue.level === 'warning';

            return (
              <div
                key={idx}
                onClick={() => {
                  if (issue.node_id) onSelectNode(issue.node_id);
                  else if (issue.statement_index !== null && issue.statement_index !== undefined)
                    onSelectStatement(issue.statement_index);
                }}
                className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                  isError
                    ? 'bg-rose-950/30 border-rose-800/40 hover:bg-rose-950/50 text-rose-200'
                    : isWarning
                    ? 'bg-amber-950/30 border-amber-800/40 hover:bg-amber-950/50 text-amber-200'
                    : 'bg-blue-950/30 border-blue-800/40 hover:bg-blue-950/50 text-blue-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {isError ? (
                    <XCircle size={14} className="text-rose-400 shrink-0 mt-0.5" />
                  ) : isWarning ? (
                    <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{issue.message}</div>
                    {issue.suggestion && (
                      <div className="mt-1 text-[11px] opacity-80 flex items-center gap-1 text-slate-300">
                        <ChevronRight size={12} className="shrink-0" />
                        <span>Suggestion: {issue.suggestion}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

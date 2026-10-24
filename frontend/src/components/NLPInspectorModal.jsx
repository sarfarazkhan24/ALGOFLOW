import React from 'react';
import { X, Search, Sparkles, CheckCircle2, Cpu } from 'lucide-react';

export default function NLPInspectorModal({ isOpen, onClose, statements }) {
  if (!isOpen || !statements) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[85vh] rounded-2xl glass-panel bg-slate-900/95 border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-display">
                NLP Linguistic Analysis & Classification Pipeline
              </h2>
              <p className="text-xs text-slate-400">
                Detailed tokenization, POS tagging, action verbs, and semantic reasoning for each statement
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 divide-y divide-white/5">
          {statements.map((stmt, idx) => (
            <div key={idx} className="pt-4 first:pt-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-md bg-slate-800 text-slate-400 font-mono text-xs flex items-center justify-center font-bold">
                    {idx + 1}
                  </span>
                  <span className={`badge badge-${stmt.statement_type}`}>
                    {stmt.statement_type}
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    "{stmt.original_text}"
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">Confidence:</span>
                  <div className="w-24 h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${
                        stmt.confidence >= 0.9
                          ? 'bg-emerald-500'
                          : stmt.confidence >= 0.7
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${Math.round(stmt.confidence * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono font-semibold text-slate-300">
                    {Math.round(stmt.confidence * 100)}%
                  </span>
                </div>
              </div>

              {/* Rationale Banner */}
              <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5 text-xs text-slate-300 mb-2.5">
                <span className="text-slate-500 font-semibold mr-1.5">Reasoning:</span>
                {stmt.reason}
              </div>

              {/* Extraction Chips: Verb, Condition, Variables */}
              <div className="flex flex-wrap items-center gap-3 text-xs mb-3">
                {stmt.action_verb && (
                  <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-white/5">
                    <span className="text-slate-500">Action Verb:</span>
                    <span className="font-mono text-indigo-300 font-semibold">{stmt.action_verb}</span>
                  </div>
                )}
                {stmt.condition_expr && (
                  <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-white/5">
                    <span className="text-slate-500">Condition:</span>
                    <span className="font-mono text-amber-300 font-semibold">{stmt.condition_expr}</span>
                  </div>
                )}
                {stmt.variables && stmt.variables.length > 0 && (
                  <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-md border border-white/5">
                    <span className="text-slate-500">Variables:</span>
                    <span className="font-mono text-cyan-300">{stmt.variables.join(', ')}</span>
                  </div>
                )}
              </div>

              {/* Token-Level POS Tags */}
              {stmt.tokens && stmt.tokens.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-slate-500 mb-1.5 tracking-wider">
                    Tokens & POS Tags
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {stmt.tokens.map((t, tIdx) => (
                      <div
                        key={tIdx}
                        className={`px-2 py-1 rounded-md text-xs font-mono flex items-center gap-1.5 border ${
                          t.is_control
                            ? 'bg-purple-950/60 border-purple-800/50 text-purple-200'
                            : t.is_verb
                            ? 'bg-indigo-950/60 border-indigo-800/50 text-indigo-200'
                            : t.is_variable
                            ? 'bg-cyan-950/60 border-cyan-800/50 text-cyan-200'
                            : 'bg-slate-800/60 border-slate-700/50 text-slate-300'
                        }`}
                      >
                        <span className="font-semibold">{t.text}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-900/80 px-1 rounded">
                          {t.pos}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-white/10 bg-slate-900/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

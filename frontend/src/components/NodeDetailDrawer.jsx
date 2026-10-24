import React, { useState, useEffect } from 'react';
import { X, Edit3, Check, Sparkles, Link2, Tag } from 'lucide-react';

export default function NodeDetailDrawer({
  selectedNode,
  onClose,
  onUpdateNodeLabel,
}) {
  const [editingLabel, setEditingLabel] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (selectedNode) {
      setEditingLabel(selectedNode.data?.label || '');
      setIsEditing(false);
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const data = selectedNode.data || {};
  const nodeType = data.type || 'process';

  const handleSaveLabel = () => {
    if (editingLabel.trim()) {
      onUpdateNodeLabel(selectedNode.id, editingLabel.trim());
      setIsEditing(false);
    }
  };

  return (
    <div className="absolute right-4 top-4 w-80 glass-panel bg-slate-900/95 border border-white/10 rounded-2xl p-4 shadow-2xl z-30 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className={`badge badge-${nodeType}`}>{nodeType}</span>
          <span className="text-[11px] font-mono text-slate-400">#{selectedNode.id}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Label Edit Section */}
      <div className="my-3">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
          <span>Flowchart Node Label</span>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <Edit3 size={11} /> <span>Edit</span>
            </button>
          )}
        </label>

        {isEditing ? (
          <div className="flex items-center gap-1.5 mt-1">
            <input
              type="text"
              value={editingLabel}
              onChange={(e) => setEditingLabel(e.target.value)}
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-indigo-500 text-xs text-slate-100 font-medium focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveLabel();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <button
              onClick={handleSaveLabel}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
            >
              <Check size={14} />
            </button>
          </div>
        ) : (
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5 font-semibold text-xs text-slate-200 break-words">
            {data.label}
          </div>
        )}
      </div>

      {/* Source-to-Node Traceability */}
      <div className="mb-3">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1">
          <Link2 size={12} className="text-cyan-400" />
          <span>Source Statement (Traceability)</span>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-950/60 border border-white/5 text-xs text-slate-300 italic font-sans leading-relaxed">
          "{data.original_text || data.label}"
        </div>
      </div>

      {/* NLP Confidence & Provenance */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-white/5">
          <span className="text-slate-400">Classification Confidence:</span>
          <span className="font-mono font-semibold text-emerald-400">
            {Math.round((data.confidence || 1.0) * 100)}%
          </span>
        </div>

        {data.variables && data.variables.length > 0 && (
          <div className="p-2 rounded-lg bg-slate-950/40 border border-white/5">
            <div className="text-slate-400 mb-1 text-[11px]">Detected Variables:</div>
            <div className="flex flex-wrap gap-1">
              {data.variables.map((v, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}

        {data.condition && (
          <div className="p-2 rounded-lg bg-slate-950/40 border border-white/5">
            <div className="text-slate-400 mb-0.5 text-[11px]">Evaluated Predicate:</div>
            <div className="font-mono text-amber-300 font-semibold text-xs">
              {data.condition}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

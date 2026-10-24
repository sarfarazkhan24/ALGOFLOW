import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { AlertTriangle } from 'lucide-react';

const AmbiguousNode = ({ data, selected }) => {
  return (
    <div
      className={`relative min-w-[200px] max-w-[250px] p-3.5 rounded-lg border-2 border-dashed transition-all duration-200 cursor-pointer ${
        selected ? 'node-selected' : 'hover:scale-[1.02]'
      }`}
      style={{
        background: 'linear-gradient(135deg, rgba(69, 10, 10, 0.85), rgba(88, 28, 28, 0.75))',
        borderColor: '#f87171',
        boxShadow: selected
          ? '0 0 20px rgba(248, 113, 113, 0.6)'
          : '0 4px 15px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-rose-400 !w-3 !h-3 !border-2 !border-slate-900 !-top-1.5"
      />

      <div className="flex items-start gap-2.5">
        <div className="w-6 h-6 rounded bg-rose-500/20 text-rose-300 flex items-center justify-center shrink-0 mt-0.5">
          <AlertTriangle size={14} />
        </div>
        <div className="text-left overflow-hidden">
          <div className="text-[10px] font-bold uppercase tracking-wider text-rose-300/90 mb-0.5 flex items-center gap-1">
            <span>Ambiguous</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950/80 text-rose-400 border border-rose-800">
              Needs Clarification
            </span>
          </div>
          <div className="font-semibold text-xs text-rose-100 break-words leading-tight">
            {data.label}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-rose-400 !w-3 !h-3 !border-2 !border-slate-900 !-bottom-1.5"
      />
    </div>
  );
};

export default memo(AmbiguousNode);

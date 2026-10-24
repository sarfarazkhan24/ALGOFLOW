import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Play, Square } from 'lucide-react';

const TerminatorNode = ({ data, selected }) => {
  const isStart = data.type === 'start';
  const isEnd = data.type === 'end';

  return (
    <div
      className={`relative px-6 py-3 rounded-full flex items-center justify-center gap-2 min-w-[140px] text-center shadow-lg transition-all duration-200 cursor-pointer ${
        isStart
          ? 'bg-gradient-to-r from-emerald-950/80 to-teal-900/80 border-2 border-emerald-500/80 text-emerald-100 shadow-emerald-950/40'
          : 'bg-gradient-to-r from-rose-950/80 to-red-900/80 border-2 border-rose-500/80 text-rose-100 shadow-rose-950/40'
      } ${selected ? 'node-selected' : 'hover:scale-[1.02]'}`}
      style={{
        backdropFilter: 'blur(8px)',
        boxShadow: selected
          ? isStart
            ? '0 0 20px rgba(16, 185, 129, 0.6)'
            : '0 0 20px rgba(244, 63, 94, 0.6)'
          : undefined,
      }}
    >
      {/* Target handle on top (only for End or intermediate terminators) */}
      {!isStart && (
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-rose-400 !w-3 !h-3 !border-2 !border-slate-900 !-top-1.5"
        />
      )}

      {isStart ? (
        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Play size={12} fill="currentColor" />
        </div>
      ) : (
        <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">
          <Square size={10} fill="currentColor" />
        </div>
      )}

      <div className="font-semibold text-sm tracking-wide">
        {data.label || (isStart ? 'Start' : 'End')}
      </div>

      {/* Source handle on bottom (only for Start) */}
      {!isEnd && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!bg-emerald-400 !w-3 !h-3 !border-2 !border-slate-900 !-bottom-1.5"
        />
      )}
    </div>
  );
};

export default memo(TerminatorNode);

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { RefreshCw } from 'lucide-react';

const LoopNode = ({ data, selected }) => {
  return (
    <div
      className={`relative min-w-[200px] max-w-[240px] px-5 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${
        selected ? 'node-selected' : 'hover:scale-[1.02]'
      }`}
      style={{
        background: 'linear-gradient(135deg, rgba(59, 7, 100, 0.9), rgba(88, 28, 135, 0.85))',
        borderColor: selected ? '#c084fc' : '#a855f7',
        boxShadow: selected
          ? '0 0 20px rgba(168, 85, 247, 0.6)'
          : '0 4px 15px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Top Handle - Incoming execution */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-purple-400 !w-3 !h-3 !border-2 !border-slate-900 !-top-1.5"
      />

      {/* Left Handle - Loop Repeat Back-edge target */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!bg-purple-400 !w-3 !h-3 !border-2 !border-slate-900 !-left-1.5"
      />

      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-full bg-purple-500/25 text-purple-300 flex items-center justify-center shrink-0">
          <RefreshCw size={13} className="animate-spin-slow" />
        </div>
        <div className="text-left overflow-hidden">
          <div className="text-[10px] font-bold uppercase tracking-wider text-purple-300 mb-0.5">
            Loop Condition
          </div>
          <div className="font-semibold text-xs text-purple-50 break-words leading-tight">
            {data.label}
          </div>
        </div>
      </div>

      {/* Bottom Handle - Loop Body Entry */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!bg-purple-400 !w-3 !h-3 !border-2 !border-slate-900 !-bottom-1.5"
      />

      {/* Right Handle - Loop Exit */}
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-purple-400 !w-3 !h-3 !border-2 !border-slate-900 !-right-1.5"
      />
    </div>
  );
};

export default memo(LoopNode);

import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { HelpCircle } from 'lucide-react';

const DecisionNode = ({ data, selected }) => {
  return (
    <div
      className={`relative flex items-center justify-center transition-all duration-200 cursor-pointer ${
        selected ? 'node-selected' : 'hover:scale-[1.03]'
      }`}
      style={{
        width: '160px',
        height: '110px',
      }}
    >
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-amber-400 !w-3 !h-3 !border-2 !border-slate-900 !-top-1 z-20"
      />

      {/* SVG Diamond geometry with gradient and glow */}
      <svg
        viewBox="0 0 160 110"
        className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-lg"
      >
        <defs>
          <linearGradient id="decisionGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#451a03" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#78350f" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <polygon
          points="80,2 158,55 80,108 2,55"
          fill="url(#decisionGrad)"
          stroke={selected ? '#f59e0b' : '#d97706'}
          strokeWidth={selected ? 2.5 : 1.5}
        />
      </svg>

      {/* Internal Content */}
      <div className="relative z-10 px-4 text-center flex flex-col items-center justify-center max-w-[125px]">
        <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center mb-0.5">
          <HelpCircle size={12} />
        </div>
        <div className="text-[9px] font-bold uppercase tracking-wider text-amber-300/90 mb-0.5">
          Decision
        </div>
        <div className="font-semibold text-xs text-amber-50 leading-tight break-words line-clamp-3">
          {data.label}
        </div>
      </div>

      {/* Outgoing handles for branching paths */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!bg-amber-400 !w-3 !h-3 !border-2 !border-slate-900 !-bottom-1 z-20"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-amber-400 !w-3 !h-3 !border-2 !border-slate-900 !-right-1 z-20"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!bg-amber-400 !w-3 !h-3 !border-2 !border-slate-900 !-left-1 z-20"
      />
    </div>
  );
};

export default memo(DecisionNode);

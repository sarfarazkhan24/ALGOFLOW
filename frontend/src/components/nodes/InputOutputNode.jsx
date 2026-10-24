import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { LogIn, LogOut } from 'lucide-react';

const InputOutputNode = ({ data, selected }) => {
  const isInput = data.type === 'input';

  return (
    <div
      className={`relative min-w-[190px] py-3.5 px-6 transition-all duration-200 cursor-pointer ${
        selected ? 'node-selected' : 'hover:scale-[1.02]'
      }`}
      style={{
        transform: 'skewX(-14deg)',
        background: isInput
          ? 'linear-gradient(135deg, rgba(8, 51, 68, 0.9), rgba(12, 74, 96, 0.85))'
          : 'linear-gradient(135deg, rgba(12, 74, 96, 0.9), rgba(7, 89, 133, 0.85))',
        border: isInput ? '1.5px solid #06b6d4' : '1.5px solid #38bdf8',
        borderRadius: '8px',
        boxShadow: selected
          ? '0 0 20px rgba(6, 182, 212, 0.6)'
          : '0 4px 15px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Handles must be unskewed or placed properly */}
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-cyan-400 !w-3 !h-3 !border-2 !border-slate-900 !-top-1.5"
        style={{ transform: 'skewX(14deg)' }}
      />

      {/* Un-skew the internal content so text remains upright */}
      <div
        className="flex items-center gap-2.5 justify-center"
        style={{ transform: 'skewX(14deg)' }}
      >
        <div
          className={`w-6 h-6 rounded flex items-center justify-center shrink-0 ${
            isInput ? 'bg-cyan-500/20 text-cyan-300' : 'bg-sky-500/20 text-sky-300'
          }`}
        >
          {isInput ? <LogIn size={14} /> : <LogOut size={14} />}
        </div>
        <div className="text-left">
          <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-300/80">
            {isInput ? 'Input / Read' : 'Output / Print'}
          </div>
          <div className="font-semibold text-xs text-slate-100 max-w-[160px] truncate">
            {data.label}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-cyan-400 !w-3 !h-3 !border-2 !border-slate-900 !-bottom-1.5"
        style={{ transform: 'skewX(14deg)' }}
      />
    </div>
  );
};

export default memo(InputOutputNode);

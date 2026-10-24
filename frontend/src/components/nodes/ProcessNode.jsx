import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Cpu } from 'lucide-react';

const ProcessNode = ({ data, selected }) => {
  return (
    <div
      className={`relative min-w-[200px] max-w-[260px] p-3.5 rounded-lg border transition-all duration-200 cursor-pointer ${
        selected ? 'node-selected' : 'hover:scale-[1.02]'
      }`}
      style={{
        background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.85), rgba(49, 46, 129, 0.75))',
        borderColor: selected ? '#818cf8' : 'rgba(99, 102, 241, 0.4)',
        boxShadow: selected
          ? '0 0 20px rgba(99, 102, 241, 0.6)'
          : '0 4px 15px rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-indigo-400 !w-3 !h-3 !border-2 !border-slate-900 !-top-1.5"
      />

      <div className="flex items-start gap-2.5">
        <div className="w-6 h-6 rounded bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
          <Cpu size={14} />
        </div>
        <div className="text-left overflow-hidden">
          <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-300/80 mb-0.5">
            Process
          </div>
          <div className="font-semibold text-xs text-slate-100 break-words leading-tight">
            {data.label}
          </div>
          {data.variables && data.variables.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {data.variables.slice(0, 3).map((v, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-950/60 text-indigo-200 border border-indigo-700/40"
                >
                  {v}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-indigo-400 !w-3 !h-3 !border-2 !border-slate-900 !-bottom-1.5"
      />
    </div>
  );
};

export default memo(ProcessNode);

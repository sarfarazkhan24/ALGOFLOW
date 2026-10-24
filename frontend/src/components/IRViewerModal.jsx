import React, { useState } from 'react';
import { X, Copy, Check, Download, FileCode } from 'lucide-react';
import { copyToClipboard, downloadJsonIR } from '../utils/export';

export default function IRViewerModal({ isOpen, onClose, irData }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !irData) return null;

  const handleCopy = async () => {
    const jsonStr = JSON.stringify(irData, null, 2);
    const success = await copyToClipboard(jsonStr);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadJsonIR(irData, `${irData.title.toLowerCase().replace(/\s+/g, '-')}-ir.json`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl max-h-[85vh] rounded-2xl glass-panel bg-slate-900/95 border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <FileCode size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-display">
                Intermediate Representation (IR Schema)
              </h2>
              <p className="text-xs text-slate-400">
                Machine-readable structured control-flow graph (Nodes, Edges, Validation)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* JSON Preview Content */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-950 font-mono text-xs text-emerald-400 leading-relaxed selection:bg-emerald-500/20">
          <pre>{JSON.stringify(irData, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

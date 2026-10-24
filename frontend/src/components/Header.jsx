import React, { useState } from 'react';
import {
  Layers,
  Download,
  Share2,
  Sparkles,
  ArrowDownUp,
  ArrowLeftRight,
  FileCode,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';

export default function Header({
  stats,
  validation,
  direction,
  onToggleDirection,
  onExportPng,
  onExportSvg,
  onExportJson,
  onOpenIR,
}) {
  const [exportOpen, setExportOpen] = useState(false);

  const hasErrors = validation && validation.errors_count > 0;
  const hasWarnings = validation && validation.warnings_count > 0;

  return (
    <header className="h-16 px-6 glass-panel border-b border-white/10 flex items-center justify-between z-30 shrink-0">
      {/* Brand & Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-500/25">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Layers className="text-cyan-400" size={20} />
          </div>
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight font-display bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              AlgoFlow
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-mono font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              v1.0 PRD
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            NLP-Based Algorithm Understanding & Flowchart Generator
          </p>
        </div>
      </div>

      {/* Center Metrics / Status */}
      {stats && (
        <div className="hidden md:flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-white/5 text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Nodes:</span>
            <span className="font-semibold text-slate-100">{stats.total_nodes}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Edges:</span>
            <span className="font-semibold text-slate-100">{stats.total_edges}</span>
          </div>
          <span className="text-slate-700">|</span>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Latency:</span>
            <span className="font-mono text-cyan-400">{stats.processing_time_ms}ms</span>
          </div>

          {validation && (
            <>
              <span className="text-slate-700">|</span>
              <div className="flex items-center gap-1">
                {hasErrors ? (
                  <span className="flex items-center gap-1 text-rose-400 font-semibold">
                    <XCircle size={13} /> {validation.errors_count} errors
                  </span>
                ) : hasWarnings ? (
                  <span className="flex items-center gap-1 text-amber-400 font-semibold">
                    <AlertTriangle size={13} /> {validation.warnings_count} warnings
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    <CheckCircle2 size={13} /> Valid Flowchart
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Layout Orientation Toggle */}
        <button
          onClick={onToggleDirection}
          title={`Switch to ${direction === 'TB' ? 'Left-to-Right' : 'Top-to-Bottom'} Layout`}
          className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          {direction === 'TB' ? (
            <>
              <ArrowDownUp size={14} className="text-indigo-400" />
              <span className="hidden sm:inline">Vertical (TB)</span>
            </>
          ) : (
            <>
              <ArrowLeftRight size={14} className="text-cyan-400" />
              <span className="hidden sm:inline">Horizontal (LR)</span>
            </>
          )}
        </button>

        {/* View JSON IR */}
        <button
          onClick={onOpenIR}
          title="View Intermediate Representation (JSON)"
          className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <FileCode size={14} className="text-amber-400" />
          <span className="hidden sm:inline">IR Schema</span>
        </button>

        {/* Export Dropdown */}
        <div className="relative">
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Export</span>
          </button>

          {exportOpen && (
            <div
              className="absolute right-0 mt-2 w-48 rounded-xl glass-panel bg-slate-900/95 border border-white/10 p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150"
              onMouseLeave={() => setExportOpen(false)}
            >
              <button
                onClick={() => {
                  onExportPng();
                  setExportOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-indigo-600/20 hover:text-indigo-300 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <ImageIcon size={14} className="text-emerald-400" />
                <span>Export as PNG Image</span>
              </button>
              <button
                onClick={() => {
                  onExportSvg();
                  setExportOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-indigo-600/20 hover:text-indigo-300 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Layers size={14} className="text-cyan-400" />
                <span>Export as SVG Vector</span>
              </button>
              <div className="my-1 border-t border-white/10"></div>
              <button
                onClick={() => {
                  onExportJson();
                  setExportOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-indigo-600/20 hover:text-indigo-300 flex items-center gap-2 transition-colors cursor-pointer"
              >
                <FileCode size={14} className="text-amber-400" />
                <span>Download IR JSON</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

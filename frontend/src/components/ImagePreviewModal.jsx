import React, { useState } from 'react';
import { X, Download, Copy, Check, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { copyToClipboard } from '../utils/export';

export default function ImagePreviewModal({ isOpen, onClose, imageDataUrl, format = 'png', filename = 'algoflow-diagram.png' }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !imageDataUrl) return null;

  const handleDownload = async () => {
    try {
      // Trigger download via server endpoint for guaranteed filename
      const res = await fetch('/api/export-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data_url: imageDataUrl, format, filename }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 500);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleCopy = async () => {
    try {
      if (format === 'png') {
        const res = await fetch(imageDataUrl);
        const blob = await res.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (e) {
      console.warn('Clipboard write failed:', e);
    }
  };

  const handleOpenNewTab = () => {
    const win = window.open();
    if (win) {
      win.document.write(`<img src="${imageDataUrl}" style="max-width: 100%; height: auto; margin: 20px auto; display: block; background: #0a0d14; border-radius: 8px;" />`);
      win.document.title = filename;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-4xl max-h-[90vh] rounded-2xl glass-panel bg-slate-900/95 border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-3.5 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ImageIcon size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 font-display">
                Exported Diagram Preview ({format.toUpperCase()})
              </h2>
              <p className="text-xs text-slate-400">
                Filename: <span className="font-mono text-emerald-400">{filename}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied Image!' : 'Copy to Clipboard'}</span>
            </button>

            <button
              onClick={handleOpenNewTab}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink size={14} />
              <span>Open in New Tab</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-600/30"
            >
              <Download size={14} />
              <span>Download File</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Image Preview Canvas */}
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-[#06080e]">
          <img
            src={imageDataUrl}
            alt="Exported Flowchart"
            className="max-w-full max-h-[65vh] object-contain rounded-lg border border-white/10 shadow-2xl bg-[#0a0d14]"
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 border-t border-white/10 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span>High-resolution vector/raster export with centered node margins</span>
          <span className="font-mono text-slate-500">2× Pixel Ratio</span>
        </div>
      </div>
    </div>
  );
}

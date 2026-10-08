import React from 'react';
import { Sparkles, FileText, Download, RotateCcw, Plus, Layers } from 'lucide-react';

interface HeaderProps {
  hasDocuments: boolean;
  documentCount: number;
  onOpenSamples: () => void;
  onNewDocument: () => void;
  onExportAllPdf?: () => void;
  onResetSettings: () => void;
  isProcessing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  hasDocuments,
  documentCount,
  onOpenSamples,
  onNewDocument,
  onExportAllPdf,
  onResetSettings,
  isProcessing = false,
}) => {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1px] shadow-lg shadow-blue-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                DocClear <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">AI</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> Ultra Clean
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              ลบพื้นหลังเอกสาร ลบโต๊ะ แสงเงา รอยพับ สกัดลายเซ็นเนียนที่สุด
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenSamples}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>ลองตัวอย่าง</span>
          </button>

          {hasDocuments && (
            <>
              <button
                onClick={onNewDocument}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
                title="เพิ่มเอกสารใหม่"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden md:inline">เพิ่มเอกสาร</span>
              </button>

              {documentCount > 1 && onExportAllPdf && (
                <button
                  onClick={onExportAllPdf}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                  title="รวมเอกสารทุกหน้าเป็น PDF"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">รวมเป็น PDF ({documentCount} หน้า)</span>
                </button>
              )}

              <button
                onClick={onResetSettings}
                className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                title="รีเซ็ตค่าการปรับแต่ง"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

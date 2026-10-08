import React from 'react';
import {
  Sparkles,
  Scissors,
  Eraser,
  Sliders,
  Download,
  Copy,
  FileCheck,
  Check,
  Zap,
  Info,
  RefreshCw,
} from 'lucide-react';
import { CleaningSettings, ProcessingMode, DocumentAnalysisResult } from '../types/document';

interface ControlPanelProps {
  settings: CleaningSettings;
  onUpdateSettings: (newSettings: Partial<CleaningSettings>) => void;
  onOpenCornerAdjuster: () => void;
  onOpenCleanBrush: () => void;
  onRunAiAnalysis: () => void;
  onDownloadImage: (format: 'png' | 'jpeg') => void;
  onDownloadPdf: () => void;
  onCopyToClipboard: () => void;
  isProcessing: boolean;
  isAnalyzing: boolean;
  analysis?: DocumentAnalysisResult;
  copiedSuccess?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  onUpdateSettings,
  onOpenCornerAdjuster,
  onOpenCleanBrush,
  onRunAiAnalysis,
  onDownloadImage,
  onDownloadPdf,
  onCopyToClipboard,
  isProcessing,
  isAnalyzing,
  analysis,
  copiedSuccess,
}) => {
  const modes: { id: ProcessingMode; label: string; desc: string; icon: string }[] = [
    {
      id: 'studio_white',
      label: 'กระดาษขาวใส',
      desc: 'ลบเงา ปรับกระดาษขาว #FFFFFF คงตรายางแดงและหมึกน้ำเงิน',
      icon: '📄',
    },
    {
      id: 'transparent_png',
      label: 'ลบพื้นหลังโปร่งใส',
      desc: 'กระดาษละลายเป็นโปร่งใส เหลือแต่ตัวอักษรและลายเซ็น',
      icon: '🔲',
    },
    {
      id: 'signature_stamp',
      label: 'สกัดลายเซ็น/ตรายาง',
      desc: 'ตัดลายเส้นกระดาษออก สกัดหมึกปากกาและตราประทับเนียน 100%',
      icon: '✍️',
    },
    {
      id: 'high_contrast_bw',
      label: 'ขาวดำคมชัดสูง',
      desc: 'ตัวอักษรดำเข้มกระดาษขาวสนิท เหมาะสำหรับเอกสารราชการ',
      icon: '📑',
    },
    {
      id: 'color_enhanced',
      label: 'สีสดใสตัดเงา',
      desc: 'รักษาสีภาพถ่ายและโลโก้ดั้งเดิม แต่ตัดเงาในห้องออก',
      icon: '🎨',
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-900/80 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-xl overflow-hidden">
      {/* Title Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-bold text-white">แผงควบคุมการลบพื้นหลัง</h3>
        </div>

        <button
          onClick={onRunAiAnalysis}
          disabled={isAnalyzing || isProcessing}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 text-xs font-semibold transition-all disabled:opacity-50"
          title="ให้ AI ปรับจูนค่าที่เหมาะสมที่สุดโดยอัตโนมัติ"
        >
          <Sparkles className={`w-3.5 h-3.5 text-cyan-400 ${isAnalyzing ? 'animate-spin' : ''}`} />
          <span>{isAnalyzing ? 'กำลังคิด...' : 'AI ปรับจูนออโต้'}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* AI Insight Badge (if analyzed) */}
        {analysis && (
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/40 text-xs space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-blue-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> ผลการวิเคราะห์ด้วย AI
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                {analysis.documentType}
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {analysis.documentTitleOrSummary || 'ตรวจพบเอกสารและสภาพแสง'}
            </p>
            {analysis.hasOuterBackground && (
              <div className="pt-1 flex items-center gap-1.5 text-[11px] text-amber-300 font-medium">
                <Info className="w-3.5 h-3.5" /> ตรวจพบขอบโต๊ะหรือพื้นหลังนอกกระดาษ
              </div>
            )}
          </div>
        )}

        {/* Processing Mode Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            1. เลือกโหมดผลลัพธ์
          </label>
          <div className="grid grid-cols-1 gap-2">
            {modes.map((m) => {
              const isSelected = settings.mode === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => onUpdateSettings({ mode: m.id })}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-600/10 text-white shadow-sm'
                      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <span className="text-xl shrink-0 mt-0.5">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white">{m.label}</h4>
                      {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{m.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Geometry & Eraser Quick Tools */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            2. เครื่องมือเสริมความเนียน
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onOpenCornerAdjuster}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              <Scissors className="w-4 h-4 text-cyan-400" />
              <span>ตัดขอบ & ปรับมุม</span>
            </button>
            <button
              onClick={onOpenCleanBrush}
              className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              <Eraser className="w-4 h-4 text-purple-400" />
              <span>แปรงลบรอยส่วนเกิน</span>
            </button>
          </div>
        </div>

        {/* Fine-Tuning Sliders */}
        <div className="space-y-4 pt-2 border-t border-slate-800">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>3. ปรับแต่งความเนียนละเอียด</span>
            <span className="text-[10px] text-slate-500 font-normal">Realtime</span>
          </label>

          {/* Shadow Removal */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">ลบเงาและรอยพับกระดาษ</span>
              <span className="font-mono text-slate-400">{Math.round(settings.shadowRemoval * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(settings.shadowRemoval * 100)}
              onChange={(e) => onUpdateSettings({ shadowRemoval: parseInt(e.target.value, 10) / 100 })}
              className="w-full accent-blue-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>แสงธรรมชาติ</span>
              <span>ลบเงาหนา 100%</span>
            </div>
          </div>

          {/* Background Whiteness */}
          {settings.mode !== 'transparent_png' && settings.mode !== 'signature_stamp' && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">ความขาวบริสุทธิ์ของกระดาษ</span>
                <span className="font-mono text-slate-400">
                  {Math.round(settings.backgroundWhiteness * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                value={Math.round(settings.backgroundWhiteness * 100)}
                onChange={(e) => onUpdateSettings({ backgroundWhiteness: parseInt(e.target.value, 10) / 100 })}
                className="w-full accent-blue-500 cursor-pointer"
              />
            </div>
          )}

          {/* Text Contrast */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">ความคมเข้มของตัวหนังสือ</span>
              <span className="font-mono text-slate-400">{settings.textContrast.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min={80}
              max={220}
              value={Math.round(settings.textContrast * 100)}
              onChange={(e) => onUpdateSettings({ textContrast: parseInt(e.target.value, 10) / 100 })}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Color Boost for Stamps & Signatures */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">ความสดของตรายาง / หมึกน้ำเงิน</span>
              <span className="font-mono text-slate-400">{settings.colorBoost.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min={10}
              max={20}
              value={Math.round(settings.colorBoost * 10)}
              onChange={(e) => onUpdateSettings({ colorBoost: parseInt(e.target.value, 10) / 10 })}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Edge Softness / Anti-Aliasing */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">ความเนียนของขอบ (Anti-aliasing)</span>
              <span className="font-mono text-slate-400">{Math.round(settings.edgeSoftness * 100)}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={Math.round(settings.edgeSoftness * 100)}
              onChange={(e) => onUpdateSettings({ edgeSoftness: parseInt(e.target.value, 10) / 100 })}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Despeckle Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div>
              <h5 className="text-xs font-semibold text-white">ตัวกรองลบจุดฝุ่น/เม็ดสแกน</h5>
              <p className="text-[10px] text-slate-400">ลบเม็ดสแกนเล็กๆ บนเนื้อกระดาษ</p>
            </div>
            <input
              type="checkbox"
              checked={settings.despeckle}
              onChange={(e) => onUpdateSettings({ despeckle: e.target.checked })}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Export & Actions Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/70 space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onDownloadImage('png')}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/25 transition-all"
            title="ดาวน์โหลดไฟล์ PNG (รองรับพื้นหลังโปร่งใส)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>โหลด PNG คมชัด</span>
          </button>

          <button
            onClick={onDownloadPdf}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-colors"
            title="ส่งออกเป็นเอกสาร PDF ขนาด A4 พร้อมพิมพ์"
          >
            <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>ส่งออก PDF (A4)</span>
          </button>
        </div>

        <button
          onClick={onCopyToClipboard}
          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition-colors"
        >
          {copiedSuccess ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">คัดลอกลง Clipboard แล้ว!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>คัดลอกภาพไปวาง (Ctrl+V)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

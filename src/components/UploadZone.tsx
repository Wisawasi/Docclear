import React, { useRef, useState } from 'react';
import { UploadCloud, Camera, Sparkles, ShieldCheck, Zap, Scissors, FileCheck, ArrowRight } from 'lucide-react';
import { SAMPLE_DOCUMENTS, SampleDoc } from '../utils/samples';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  onSelectSample: (sample: SampleDoc) => void;
  isLoadingSample?: boolean;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onFilesSelected,
  onSelectSample,
  isLoadingSample = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Title */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          AI Document Background Cleaner & Scanner
        </div>
        <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
          ลบพื้นหลังเอกสารให้เนียนกริบ <br className="hidden sm:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-cyan-400">
            ตัดขอบโต๊ะ คืนกระดาษขาวใส สกัดลายเซ็น
          </span>
        </h2>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
          หมดปัญหาถ่ายรูปเอกสารแล้วติดพื้นโต๊ะ มีเงาโทรศัพท์บัง หรือกระดาษยับมัว
          AI ช่วยวิเคราะห์ ปรับมุมตรง 4 ด้าน ลบเงาเรียบเนียน และสกัดหมึกลายเซ็นคมชัดระดับมืออาชีพ
        </p>
      </div>

      {/* Main Dropzone Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`group relative cursor-pointer rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center transition-all duration-300 ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
            : 'border-slate-700/80 bg-slate-900/60 hover:border-blue-500/50 hover:bg-slate-900/90'
        } shadow-2xl backdrop-blur-xl`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 p-0.5 shadow-xl shadow-blue-500/25 group-hover:scale-105 transition-transform duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <UploadCloud className="w-10 h-10 text-blue-400 group-hover:text-cyan-300 transition-colors" />
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-base sm:text-lg font-semibold text-white">
              ลากรูปภาพเอกสารมาวางที่นี่ หรือ <span className="text-blue-400 underline underline-offset-4 decoration-blue-500/40">คลิกเพื่อเลือกไฟล์</span>
            </p>
            <p className="text-xs sm:text-sm text-slate-400">
              รองรับรูปถ่ายมือถือ, สแกน (JPG, PNG, WEBP, PDF) สูงสุด 50MB
            </p>
          </div>

          {/* Quick Buttons Inside Dropzone */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-medium shadow-lg shadow-blue-600/30 transition-all hover:shadow-blue-600/50"
            >
              <UploadCloud className="w-4 h-4" />
              เลือกรูปภาพเอกสาร
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700 transition-colors"
            >
              <Camera className="w-4 h-4 text-emerald-400" />
              ถ่ายรูปด้วยกล้อง
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">ตัดขอบโต๊ะอัตโนมัติ</h4>
            <p className="text-[11px] text-slate-400">AI จับมุมเอกสาร 4 ด้าน ปรับระนาบตรงเป๊ะ</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">ลบเงาและรอยพับ 100%</h4>
            <p className="text-[11px] text-slate-400">กระดาษขาวใสเนียนเท่ากันทั้งแผ่น</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">คงตรายาง & ลายเซ็น</h4>
            <p className="text-[11px] text-slate-400">หมึกสีแดง น้ำเงิน คมชัด ไม่ซีดจาง</p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/80 flex items-start gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 shrink-0">
            <FileCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">PNG โปร่งใส & PDF</h4>
            <p className="text-[11px] text-slate-400">ส่งออก A4 คมชัด หรือโปร่งใสแปะทับได้ทันที</p>
          </div>
        </div>
      </div>

      {/* Preset Realistic Samples Showcase */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              ไม่มีรูปเอกสารในเครื่อง? ลองทดสอบด้วยตัวอย่างได้ทันที:
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              คลิกเพื่อทดสอบพลังการลบพื้นหลังโต๊ะ เงาหนา และการสกัดลายเซ็น
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SAMPLE_DOCUMENTS.map((sample) => (
            <div
              key={sample.id}
              onClick={() => !isLoadingSample && onSelectSample(sample)}
              className="group p-4 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/40 cursor-pointer transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{sample.thumbnail}</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                    {sample.category}
                  </span>
                </div>
                <h4 className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {sample.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {sample.description}
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs text-blue-400 font-medium">
                <span>ลองใช้อันนี้</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

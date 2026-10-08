import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Columns, Split, Eye, ZoomIn, ZoomOut, Maximize2, Sparkles, Check } from 'lucide-react';
import { ProcessingMode } from '../types/document';

interface ComparisonViewerProps {
  originalImage: string;
  processedCanvas: HTMLCanvasElement | null;
  mode: ProcessingMode;
  isProcessing: boolean;
  isAnalyzing: boolean;
}

export const ComparisonViewer: React.FC<ComparisonViewerProps> = ({
  originalImage,
  processedCanvas,
  mode,
  isProcessing,
  isAnalyzing,
}) => {
  const [viewType, setViewType] = useState<'slider' | 'sideBySide'>('slider');
  const [sliderPosition, setSliderPosition] = useState(50); // percentage 0-100
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isHoldingOriginal, setIsHoldingOriginal] = useState(false);
  const [processedDataUrl, setProcessedDataUrl] = useState<string>('');

  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Update processed image data URL when canvas changes
  useEffect(() => {
    if (processedCanvas) {
      setProcessedDataUrl(processedCanvas.toDataURL('image/png'));
    }
  }, [processedCanvas]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateSliderFromEvent(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    updateSliderFromEvent(e.clientX);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const updateSliderFromEvent = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, []);

  const isTransparent = mode === 'transparent_png' || mode === 'signature_stamp';

  return (
    <div className="flex flex-col h-full rounded-2xl bg-slate-900/70 border border-slate-800/80 shadow-2xl backdrop-blur-xl overflow-hidden">
      {/* Top Controls Bar */}
      <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-3">
        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
          <button
            onClick={() => setViewType('slider')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewType === 'slider'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>สไลเดอร์เปรียบเทียบ</span>
          </button>
          <button
            onClick={() => setViewType('sideBySide')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewType === 'sideBySide'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>เทียบข้างกัน</span>
          </button>
        </div>

        {/* Hold to Peek Button & Zoom Controls */}
        <div className="flex items-center gap-2">
          <button
            onMouseDown={() => setIsHoldingOriginal(true)}
            onMouseUp={() => setIsHoldingOriginal(false)}
            onMouseLeave={() => setIsHoldingOriginal(false)}
            onTouchStart={() => setIsHoldingOriginal(true)}
            onTouchEnd={() => setIsHoldingOriginal(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 active:bg-blue-600 active:text-white transition-all select-none"
            title="กดค้างเพื่อดูภาพถ่ายต้นฉบับ"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>กดค้างดูภาพเดิม</span>
          </button>

          <div className="h-4 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

          <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
              className="p-1 hover:text-white rounded transition-colors"
              title="ซูมออก"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-1 min-w-[42px] text-center text-slate-300">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(3, Number((z + 0.25).toFixed(2))))}
              className="p-1 hover:text-white rounded transition-colors"
              title="ซูมเข้า"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1 hover:text-white rounded transition-colors"
              title="ขนาดพอดีหน้าจอ"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-auto p-4 sm:p-6 min-h-[420px] select-none">
        {/* Loading Overlay */}
        {(isProcessing || isAnalyzing) && (
          <div className="absolute inset-0 z-20 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
              <Sparkles className="w-5 h-5 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-white">
              {isAnalyzing ? 'AI กำลังตรวจจับขอบเอกสารและวิเคราะห์แสงเงา...' : 'กำลังลบพื้นหลังและปรับกระดาษขาวใสเนียน...'}
            </p>
            <p className="text-xs text-slate-400">ประมวลผลความละเอียดสูง รักษาขอบตัวหนังสือและตรายาง</p>
          </div>
        )}

        {/* Comparison Render */}
        <div
          ref={containerRef}
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          className="relative max-w-full max-h-[72vh] rounded-lg shadow-2xl transition-transform duration-100 flex items-center justify-center"
        >
          {viewType === 'slider' ? (
            /* Split Slider View */
            <div className="relative inline-block max-w-full overflow-hidden rounded-lg shadow-2xl">
              {/* Checkerboard Pattern for Transparent Modes */}
              {isTransparent && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: `linear-gradient(45deg, #1e293b 25%, transparent 25%), 
                                     linear-gradient(-45deg, #1e293b 25%, transparent 25%), 
                                     linear-gradient(45deg, transparent 75%, #1e293b 75%), 
                                     linear-gradient(-45deg, transparent 75%, #1e293b 75%)`,
                    backgroundSize: '16px 16px',
                    backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                    backgroundColor: '#0f172a',
                  }}
                />
              )}

              {/* Base Layer: Clean Processed Image */}
              <img
                src={processedDataUrl || originalImage}
                alt="Cleaned Document"
                className="max-h-[68vh] w-auto object-contain block pointer-events-none select-none"
              />

              {/* Top Layer: Original Image (Clipped by slider position) */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none select-none"
                style={{
                  width: isHoldingOriginal ? '100%' : `${sliderPosition}%`,
                  transition: isHoldingOriginal ? 'width 0.15s ease' : 'none',
                }}
              >
                <img
                  src={originalImage}
                  alt="Original Document"
                  className="max-h-[68vh] w-auto object-contain block pointer-events-none select-none max-w-none"
                  style={{
                    width: containerRef.current?.querySelector('img')?.clientWidth,
                    height: containerRef.current?.querySelector('img')?.clientHeight,
                  }}
                />
              </div>

              {/* Slider Divider Bar */}
              {!isHoldingOriginal && (
                <div
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="absolute top-0 bottom-0 z-10 w-1 bg-white cursor-ew-resize select-none touch-none flex items-center justify-center shadow-[0_0_15px_rgba(0,0,0,0.8)]"
                  style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                >
                  <div className="w-8 h-8 rounded-full bg-white text-slate-900 shadow-xl border-2 border-blue-600 flex items-center justify-center -translate-y-1/2 absolute top-1/2">
                    <Split className="w-4 h-4 text-blue-600" />
                  </div>
                </div>
              )}

              {/* Badges on Bottom Corners */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white border border-white/10 pointer-events-none">
                ภาพต้นฉบับ (Original)
              </div>
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-blue-600/80 backdrop-blur-md text-[11px] font-semibold text-white border border-blue-400/20 pointer-events-none flex items-center gap-1">
                <Check className="w-3 h-3 text-cyan-300" /> AI ลบพื้นหลังเนียนกริบ
              </div>
            </div>
          ) : (
            /* Side-by-Side View */
            <div className="flex flex-col md:flex-row items-center gap-4 max-w-full">
              {/* Original */}
              <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-slate-900 shadow-xl">
                <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-[11px] font-medium text-slate-200">
                  ต้นฉบับ
                </div>
                <img
                  src={originalImage}
                  alt="Original"
                  className="max-h-[50vh] sm:max-h-[62vh] w-auto object-contain block"
                />
              </div>

              {/* Cleaned */}
              <div
                className="relative rounded-lg overflow-hidden border border-blue-500/40 bg-slate-900 shadow-xl"
                style={
                  isTransparent
                    ? {
                        backgroundImage: `linear-gradient(45deg, #1e293b 25%, transparent 25%), 
                                         linear-gradient(-45deg, #1e293b 25%, transparent 25%), 
                                         linear-gradient(45deg, transparent 75%, #1e293b 75%), 
                                         linear-gradient(-45deg, transparent 75%, #1e293b 75%)`,
                        backgroundSize: '16px 16px',
                        backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                        backgroundColor: '#0f172a',
                      }
                    : {}
                }
              >
                <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded bg-blue-600 text-[11px] font-medium text-white shadow">
                  ลบพื้นหลังแล้ว
                </div>
                <img
                  src={processedDataUrl || originalImage}
                  alt="Cleaned"
                  className="max-h-[50vh] sm:max-h-[62vh] w-auto object-contain block"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Eraser, Undo, Paintbrush, ZoomIn, ZoomOut } from 'lucide-react';

interface CleanBrushModalProps {
  canvas: HTMLCanvasElement;
  onApply: (updatedCanvas: HTMLCanvasElement) => void;
  onClose: () => void;
  isTransparentMode: boolean;
}

export const CleanBrushModal: React.FC<CleanBrushModalProps> = ({
  canvas,
  onApply,
  onClose,
  isTransparentMode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const workCanvasRef = useRef<HTMLCanvasElement>(null);
  const [brushSize, setBrushSize] = useState(25);
  const [tool, setTool] = useState<'erase' | 'restore'>('erase');
  const [history, setHistory] = useState<ImageData[]>([]);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const workCanvas = workCanvasRef.current;
    if (!workCanvas) return;

    workCanvas.width = canvas.width;
    workCanvas.height = canvas.height;
    const ctx = workCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    ctx.drawImage(canvas, 0, 0);

    // Save initial state for undo
    const initialData = ctx.getImageData(0, 0, workCanvas.width, workCanvas.height);
    setHistory([initialData]);
  }, [canvas]);

  const saveHistory = () => {
    const workCanvas = workCanvasRef.current;
    if (!workCanvas) return;
    const ctx = workCanvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const data = ctx.getImageData(0, 0, workCanvas.width, workCanvas.height);
    setHistory((prev) => [...prev.slice(-10), data]);
  };

  const handleUndo = () => {
    if (history.length <= 1) return;
    const workCanvas = workCanvasRef.current;
    if (!workCanvas) return;
    const ctx = workCanvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...history];
    newHistory.pop(); // Remove current
    const prevState = newHistory[newHistory.length - 1];
    ctx.putImageData(prevState, 0, 0);
    setHistory(newHistory);
  };

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const workCanvas = workCanvasRef.current;
    if (!workCanvas) return { x: 0, y: 0 };
    const rect = workCanvas.getBoundingClientRect();
    const scaleX = workCanvas.width / rect.width;
    const scaleY = workCanvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const pt = getCanvasCoords(e);
    lastPointRef.current = pt;
    paintAt(pt.x, pt.y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const pt = getCanvasCoords(e);
    if (lastPointRef.current) {
      paintStroke(lastPointRef.current, pt);
    }
    lastPointRef.current = pt;
  };

  const handlePointerUp = () => {
    if (isDrawingRef.current) {
      isDrawingRef.current = false;
      lastPointRef.current = null;
      saveHistory();
    }
  };

  const paintStroke = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const workCanvas = workCanvasRef.current;
    if (!workCanvas) return;
    const ctx = workCanvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    if (tool === 'erase') {
      if (isTransparentMode) {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#ffffff';
      }
    }

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    ctx.restore();
  };

  const paintAt = (x: number, y: number) => {
    const workCanvas = workCanvasRef.current;
    if (!workCanvas) return;
    const ctx = workCanvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    if (tool === 'erase') {
      if (isTransparentMode) {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.fillStyle = '#ffffff';
      }
    }

    ctx.beginPath();
    ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const handleConfirm = () => {
    if (workCanvasRef.current) {
      onApply(workCanvasRef.current);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Eraser className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">แปรงลบจุดส่วนเกิน / รอยเปื้อน</h3>
            <p className="text-xs text-slate-400">
              ระบายทับจุดดำ รอยนิ้วมือ รูเจาะ หรือเงาขอบโต๊ะที่หลงเหลืออยู่เพื่อความเนียน 100%
            </p>
          </div>
        </div>

        <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="flex-1 my-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden relative select-none p-4"
        style={
          isTransparentMode
            ? {
                backgroundImage: `linear-gradient(45deg, #1e293b 25%, transparent 25%), 
                                 linear-gradient(-45deg, #1e293b 25%, transparent 25%), 
                                 linear-gradient(45deg, transparent 75%, #1e293b 75%), 
                                 linear-gradient(-45deg, transparent 75%, #1e293b 75%)`,
                backgroundSize: '16px 16px',
                backgroundColor: '#0f172a',
              }
            : {}
        }
      >
        <canvas
          ref={workCanvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="max-h-[70vh] max-w-full object-contain cursor-crosshair touch-none shadow-2xl rounded"
        />
      </div>

      {/* Tool Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">ขนาดหัวแปรง:</span>
            <input
              type="range"
              min={5}
              max={80}
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value, 10))}
              className="w-32 accent-blue-500"
            />
            <span className="text-xs font-mono text-slate-300 min-w-[28px]">{brushSize}px</span>
          </div>

          <button
            onClick={handleUndo}
            disabled={history.length <= 1}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 disabled:opacity-40 transition-colors"
          >
            <Undo className="w-3.5 h-3.5" />
            <span>ย้อนกลับ</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-500/20"
          >
            <Check className="w-4 h-4" />
            <span>บันทึกการลบจุด</span>
          </button>
        </div>
      </div>
    </div>
  );
};

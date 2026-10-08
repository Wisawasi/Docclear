import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Check, Sparkles, RotateCcw, Crosshair } from 'lucide-react';
import { Point, QuadCorners } from '../types/document';

interface CornerAdjusterProps {
  imageSrc: string;
  initialCorners?: QuadCorners;
  onApplyCrop: (corners: QuadCorners) => void;
  onAutoDetectAI: () => Promise<QuadCorners | null>;
  onClose: () => void;
  isDetectingAI?: boolean;
}

export const CornerAdjuster: React.FC<CornerAdjusterProps> = ({
  imageSrc,
  initialCorners,
  onApplyCrop,
  onAutoDetectAI,
  onClose,
  isDetectingAI = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [corners, setCorners] = useState<QuadCorners>(
    initialCorners || {
      topLeft: { x: 50, y: 50 },
      topRight: { x: 750, y: 50 },
      bottomRight: { x: 750, y: 950 },
      bottomLeft: { x: 50, y: 950 },
    }
  );

  const [activeCorner, setActiveCorner] = useState<keyof QuadCorners | null>(null);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  // Load image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      if (!initialCorners) {
        // Default to inset 8% of original image dimensions
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        setCorners({
          topLeft: { x: Math.round(w * 0.08), y: Math.round(h * 0.08) },
          topRight: { x: Math.round(w * 0.92), y: Math.round(h * 0.08) },
          bottomRight: { x: Math.round(w * 0.92), y: Math.round(h * 0.92) },
          bottomLeft: { x: Math.round(w * 0.08), y: Math.round(h * 0.92) },
        });
      }
      drawCanvas();
    };
    img.src = imageSrc;
  }, [imageSrc, initialCorners]);

  // Redraw canvas whenever corners change
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !containerRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fit canvas into container view
    const containerW = containerRef.current.clientWidth - 32;
    const containerH = containerRef.current.clientHeight - 32;

    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;

    const s = Math.min(containerW / imgW, containerH / imgH, 1);
    setScale(s);

    const canvasW = Math.round(imgW * s);
    const canvasH = Math.round(imgH * s);

    canvas.width = canvasW;
    canvas.height = canvasH;

    // Draw original image scaled
    ctx.drawImage(img, 0, 0, canvasW, canvasH);

    // Draw dark semi-transparent mask outside crop area
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.fillRect(0, 0, canvasW, canvasH);

    // Clear inside crop polygon
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(corners.topLeft.x * s, corners.topLeft.y * s);
    ctx.lineTo(corners.topRight.x * s, corners.topRight.y * s);
    ctx.lineTo(corners.bottomRight.x * s, corners.bottomRight.y * s);
    ctx.lineTo(corners.bottomLeft.x * s, corners.bottomLeft.y * s);
    ctx.closePath();
    ctx.clip();

    // Re-draw clear image inside polygon
    ctx.drawImage(img, 0, 0, canvasW, canvasH);
    ctx.restore();

    // Draw polygon borders with high-contrast cyan-blue stroke
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(corners.topLeft.x * s, corners.topLeft.y * s);
    ctx.lineTo(corners.topRight.x * s, corners.topRight.y * s);
    ctx.lineTo(corners.bottomRight.x * s, corners.bottomRight.y * s);
    ctx.lineTo(corners.bottomLeft.x * s, corners.bottomLeft.y * s);
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw corner handles
    const cornerKeys: (keyof QuadCorners)[] = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'];
    cornerKeys.forEach((key) => {
      const p = corners[key];
      const cx = p.x * s;
      const cy = p.y * s;
      const isActive = activeCorner === key;

      // Outer ring
      ctx.beginPath();
      ctx.arc(cx, cy, isActive ? 14 : 11, 0, Math.PI * 2);
      ctx.fillStyle = isActive ? '#0284c7' : '#0ea5e9';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    });
  }, [corners, activeCorner]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Pointer event handlers for dragging corners
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) / scale;
    const clickY = (e.clientY - rect.top) / scale;

    // Find nearest corner within hit radius
    const hitRadius = 35 / scale;
    let closestKey: keyof QuadCorners | null = null;
    let minDistance = Infinity;

    const cornerKeys: (keyof QuadCorners)[] = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'];
    cornerKeys.forEach((key) => {
      const p = corners[key];
      const d = Math.hypot(p.x - clickX, p.y - clickY);
      if (d < hitRadius && d < minDistance) {
        minDistance = d;
        closestKey = key;
      }
    });

    if (closestKey) {
      setActiveCorner(closestKey);
      canvas.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!activeCorner || !canvasRef.current || !imgRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = Math.round((e.clientX - rect.left) / scale);
    const mouseY = Math.round((e.clientY - rect.top) / scale);

    const clampedX = Math.max(0, Math.min(imgRef.current.naturalWidth, mouseX));
    const clampedY = Math.max(0, Math.min(imgRef.current.naturalHeight, mouseY));

    setCorners((prev) => ({
      ...prev,
      [activeCorner]: { x: clampedX, y: clampedY },
    }));
  };

  const handlePointerUp = () => {
    setActiveCorner(null);
  };

  // Reset to full image
  const handleResetFull = () => {
    if (!imgRef.current) return;
    const w = imgRef.current.naturalWidth;
    const h = imgRef.current.naturalHeight;
    setCorners({
      topLeft: { x: 0, y: 0 },
      topRight: { x: w, y: 0 },
      bottomRight: { x: w, y: h },
      bottomLeft: { x: 0, y: h },
    });
  };

  const handleTriggerAI = async () => {
    const aiCorners = await onAutoDetectAI();
    if (aiCorners) {
      setCorners(aiCorners);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex flex-col p-4 sm:p-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Crosshair className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              ตัดขอบและปรับมุมเอกสาร 4 ด้าน
            </h3>
            <p className="text-xs text-slate-400">
              ลากจุดมุมสีฟ้า 4 จุดให้ตรงกับขอบกระดาษเอกสาร เพื่อลบขอบโต๊ะและปรับระนาบให้ตรง
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="flex-1 my-3 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden relative select-none"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="cursor-crosshair touch-none shadow-2xl rounded"
        />

        {/* AI Detecting Spinner */}
        {isDetectingAI && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-white">AI กำลังตรวจจับขอบเอกสารในรูป...</p>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleTriggerAI}
            disabled={isDetectingAI}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 text-xs font-semibold transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>AI ตรวจจับขอบอัตโนมัติ</span>
          </button>

          <button
            onClick={handleResetFull}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>เลือกทั้งรูป</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={() => onApplyCrop(corners)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-500/30 transition-all"
          >
            <Check className="w-4 h-4" />
            <span>ยืนยันตัดขอบและปรับระนาบ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

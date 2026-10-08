import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { UploadZone } from './components/UploadZone';
import { ComparisonViewer } from './components/ComparisonViewer';
import { ControlPanel } from './components/ControlPanel';
import { CornerAdjuster } from './components/CornerAdjuster';
import { CleanBrushModal } from './components/CleanBrushModal';
import { BatchStrip } from './components/BatchStrip';
import { ToastContainer, ToastMessage } from './components/Toast';
import {
  DocumentItem,
  CleaningSettings,
  QuadCorners,
  DocumentAnalysisResult,
} from './types/document';
import {
  loadImageToCanvas,
  processDocumentImage,
  downloadCanvas,
  copyCanvasToClipboard,
} from './utils/imageProcessing';
import { warpPerspective } from './utils/perspective';
import { exportCanvasesToPdf } from './utils/pdfExport';
import { SAMPLE_DOCUMENTS, SampleDoc } from './utils/samples';
import { Sparkles, X, Plus } from 'lucide-react';

const DEFAULT_SETTINGS: CleaningSettings = {
  mode: 'studio_white',
  shadowRemoval: 0.85,
  backgroundWhiteness: 0.90,
  textContrast: 1.35,
  edgeSoftness: 0.45,
  colorBoost: 1.30,
  despeckle: true,
  brightness: 0,
  blackLevel: 15,
};

export default function App() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDocId, setActiveDocId] = useState<string>('');
  const [processedCanvas, setProcessedCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isCornerAdjusterOpen, setIsCornerAdjusterOpen] = useState<boolean>(false);
  const [isCleanBrushOpen, setIsCleanBrushOpen] = useState<boolean>(false);
  const [isSamplesModalOpen, setIsSamplesModalOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isDetectingAI, setIsDetectingAI] = useState<boolean>(false);
  const [isLoadingSample, setIsLoadingSample] = useState<boolean>(false);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const activeDoc = documents.find((d) => d.id === activeDocId) || null;

  const addToast = (type: 'success' | 'error' | 'info', title: string, message?: string) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, title, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Re-run document background cleaning when activeDoc or its settings change
  const runProcessing = useCallback(async (doc: DocumentItem) => {
    if (!doc) return;
    setIsProcessing(true);
    try {
      const sourceImage = doc.croppedImage || doc.originalImage;
      const srcCanvas = await loadImageToCanvas(sourceImage);
      const outCanvas = processDocumentImage(srcCanvas, doc.settings);

      setProcessedCanvas(outCanvas);
      const dataUrl = outCanvas.toDataURL(
        doc.settings.mode === 'transparent_png' || doc.settings.mode === 'signature_stamp'
          ? 'image/png'
          : 'image/jpeg',
        0.95
      );

      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, processedImage: dataUrl } : d))
      );
    } catch (err) {
      console.error('Processing error:', err);
      addToast('error', 'เกิดข้อผิดพลาดในการประมวลผล', 'ไม่สามารถประมวลผลเอกสารได้');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Trigger processing on settings change
  useEffect(() => {
    if (activeDoc) {
      const timer = setTimeout(() => {
        runProcessing(activeDoc);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [
    activeDocId,
    activeDoc?.settings,
    activeDoc?.croppedImage,
    activeDoc?.originalImage,
  ]);

  // Request AI Document Analysis via backend
  const analyzeWithAI = async (docItem: DocumentItem): Promise<DocumentAnalysisResult | null> => {
    try {
      setDocuments((prev) =>
        prev.map((d) => (d.id === docItem.id ? { ...d, isAnalyzing: true } : d))
      );

      const response = await fetch('/api/ai/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: docItem.originalImage,
          mimeType: 'image/jpeg',
        }),
      });

      if (!response.ok) {
        throw new Error('AI Server analysis failed');
      }

      const data = await response.json();
      if (data.success && data.analysis) {
        const analysis: DocumentAnalysisResult = data.analysis;

        // Convert normalized [0-1000] corners to image pixel coordinates
        const w = docItem.originalWidth;
        const h = docItem.originalHeight;

        const corners: QuadCorners = {
          topLeft: {
            x: Math.round((analysis.corners.topLeft[0] / 1000) * w),
            y: Math.round((analysis.corners.topLeft[1] / 1000) * h),
          },
          topRight: {
            x: Math.round((analysis.corners.topRight[0] / 1000) * w),
            y: Math.round((analysis.corners.topRight[1] / 1000) * h),
          },
          bottomRight: {
            x: Math.round((analysis.corners.bottomRight[0] / 1000) * w),
            y: Math.round((analysis.corners.bottomRight[1] / 1000) * h),
          },
          bottomLeft: {
            x: Math.round((analysis.corners.bottomLeft[0] / 1000) * w),
            y: Math.round((analysis.corners.bottomLeft[1] / 1000) * h),
          },
        };

        // Determine if auto-warp is beneficial (when desk background detected)
        let autoCroppedImage: string | undefined = undefined;
        let hasCropped = false;

        if (analysis.hasOuterBackground) {
          try {
            const rawCanvas = await loadImageToCanvas(docItem.originalImage);
            const warpedCanvas = warpPerspective(rawCanvas, corners);
            autoCroppedImage = warpedCanvas.toDataURL('image/jpeg', 0.95);
            hasCropped = true;
          } catch (e) {
            console.error('Auto warp error:', e);
          }
        }

        // Apply recommended settings
        const newSettings: CleaningSettings = {
          ...docItem.settings,
          shadowRemoval: analysis.recommendedSettings.shadowRemovalStrength ?? 0.85,
          backgroundWhiteness: analysis.recommendedSettings.backgroundWhiteness ?? 0.90,
          textContrast: analysis.recommendedSettings.contrast ?? 1.35,
          colorBoost: analysis.hasColoredStampsOrSignatures ? 1.45 : 1.2,
        };

        setDocuments((prev) =>
          prev.map((d) =>
            d.id === docItem.id
              ? {
                  ...d,
                  analysis,
                  corners,
                  croppedImage: autoCroppedImage || d.croppedImage,
                  hasCropped: hasCropped || d.hasCropped,
                  settings: newSettings,
                  isAnalyzing: false,
                }
              : d
          )
        );

        addToast(
          'success',
          'AI วิเคราะห์เอกสารสำเร็จ',
          analysis.hasOuterBackground
            ? `ตรวจพบขอบโต๊ะและปรับระนาบเอกสาร ${analysis.documentType} อัตโนมัติ`
            : `ปรับจูนค่าลบเงาสำหรับ ${analysis.documentType} เรียบร้อยแล้ว`
        );

        return analysis;
      }
    } catch (err) {
      console.warn('AI analysis fallback:', err);
    } finally {
      setDocuments((prev) =>
        prev.map((d) => (d.id === docItem.id ? { ...d, isAnalyzing: false } : d))
      );
    }
    return null;
  };

  // Upload handler
  const handleFilesSelected = async (files: File[]) => {
    setIsAddModalOpen(false);

    for (const file of files) {
      try {
        const reader = new FileReader();
        const fileDataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        // Get image dimensions
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = resolve;
          img.src = fileDataUrl;
        });

        const newDoc: DocumentItem = {
          id: 'doc_' + Date.now() + Math.random().toString(36).substring(2, 6),
          name: file.name.replace(/\.[^/.]+$/, ''),
          originalImage: fileDataUrl,
          originalWidth: img.naturalWidth || 1200,
          originalHeight: img.naturalHeight || 1600,
          hasCropped: false,
          isAnalyzing: false,
          isProcessing: false,
          settings: { ...DEFAULT_SETTINGS },
        };

        setDocuments((prev) => [...prev, newDoc]);
        setActiveDocId(newDoc.id);

        // Run AI analysis in background
        setTimeout(() => {
          analyzeWithAI(newDoc);
        }, 100);
      } catch (err) {
        console.error('File load error:', err);
        addToast('error', 'ไม่สามารถเปิดไฟล์ได้', file.name);
      }
    }
  };

  // Select Sample Document
  const handleSelectSample = async (sample: SampleDoc) => {
    setIsLoadingSample(true);
    setIsSamplesModalOpen(false);
    try {
      const dataUrl = await sample.generator();
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = dataUrl;
      });

      const initialSettings: CleaningSettings = {
        ...DEFAULT_SETTINGS,
        mode: sample.id === 'sample-signature' ? 'signature_stamp' : 'studio_white',
      };

      const newDoc: DocumentItem = {
        id: 'sample_' + Date.now(),
        name: sample.title.split('(')[0].trim(),
        originalImage: dataUrl,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
        hasCropped: false,
        isAnalyzing: false,
        isProcessing: false,
        settings: initialSettings,
      };

      setDocuments((prev) => [...prev, newDoc]);
      setActiveDocId(newDoc.id);

      addToast('info', 'โหลดตัวอย่างสำเร็จ', sample.title);

      // Trigger AI analysis
      setTimeout(() => {
        analyzeWithAI(newDoc);
      }, 100);
    } catch (err) {
      console.error('Failed to load sample:', err);
      addToast('error', 'ไม่สามารถโหลดตัวอย่างได้');
    } finally {
      setIsLoadingSample(false);
    }
  };

  // Corner adjuster callback
  const handleApplyCrop = async (corners: QuadCorners) => {
    if (!activeDoc) return;
    try {
      const rawCanvas = await loadImageToCanvas(activeDoc.originalImage);
      const warped = warpPerspective(rawCanvas, corners);
      const croppedUrl = warped.toDataURL('image/jpeg', 0.95);

      setDocuments((prev) =>
        prev.map((d) =>
          d.id === activeDoc.id
            ? { ...d, croppedImage: croppedUrl, corners, hasCropped: true }
            : d
        )
      );

      setIsCornerAdjusterOpen(false);
      addToast('success', 'ตัดขอบและปรับระนาบสำเร็จ', 'ลบขอบโต๊ะและปรับเอกสารตรงเรียบร้อย');
    } catch (err) {
      console.error('Crop error:', err);
      addToast('error', 'เกิดข้อผิดพลาดในการตัดขอบ');
    }
  };

  // Trigger auto-detect AI from corner modal
  const handleAutoDetectCornersAI = async (): Promise<QuadCorners | null> => {
    if (!activeDoc) return null;
    setIsDetectingAI(true);
    try {
      const analysis = await analyzeWithAI(activeDoc);
      if (analysis) {
        const w = activeDoc.originalWidth;
        const h = activeDoc.originalHeight;
        return {
          topLeft: {
            x: Math.round((analysis.corners.topLeft[0] / 1000) * w),
            y: Math.round((analysis.corners.topLeft[1] / 1000) * h),
          },
          topRight: {
            x: Math.round((analysis.corners.topRight[0] / 1000) * w),
            y: Math.round((analysis.corners.topRight[1] / 1000) * h),
          },
          bottomRight: {
            x: Math.round((analysis.corners.bottomRight[0] / 1000) * w),
            y: Math.round((analysis.corners.bottomRight[1] / 1000) * h),
          },
          bottomLeft: {
            x: Math.round((analysis.corners.bottomLeft[0] / 1000) * w),
            y: Math.round((analysis.corners.bottomLeft[1] / 1000) * h),
          },
        };
      }
    } finally {
      setIsDetectingAI(false);
    }
    return null;
  };

  // Clean Brush callback
  const handleApplyCleanBrush = (updatedCanvas: HTMLCanvasElement) => {
    if (!activeDoc) return;
    const dataUrl = updatedCanvas.toDataURL(
      activeDoc.settings.mode === 'transparent_png' || activeDoc.settings.mode === 'signature_stamp'
        ? 'image/png'
        : 'image/jpeg',
      0.95
    );

    setProcessedCanvas(updatedCanvas);
    setDocuments((prev) =>
      prev.map((d) => (d.id === activeDoc.id ? { ...d, processedImage: dataUrl } : d))
    );

    setIsCleanBrushOpen(false);
    addToast('success', 'บันทึกการลบรอยเรียบร้อย');
  };

  // Update settings
  const handleUpdateSettings = (newSettings: Partial<CleaningSettings>) => {
    if (!activeDoc) return;
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === activeDoc.id ? { ...d, settings: { ...d.settings, ...newSettings } } : d
      )
    );
  };

  // Reset settings
  const handleResetSettings = () => {
    if (!activeDoc) return;
    handleUpdateSettings(DEFAULT_SETTINGS);
    addToast('info', 'รีเซ็ตค่าเริ่มต้นเรียบร้อย');
  };

  // Downloads
  const handleDownloadImage = (format: 'png' | 'jpeg') => {
    if (!processedCanvas || !activeDoc) return;
    const filename = `${activeDoc.name}_DocClear.${format}`;
    downloadCanvas(processedCanvas, filename, format);
    addToast('success', 'ดาวน์โหลดสำเร็จ', filename);
  };

  const handleDownloadPdf = async () => {
    if (!processedCanvas || !activeDoc) return;
    try {
      await exportCanvasesToPdf([processedCanvas], `${activeDoc.name}_DocClear.pdf`);
      addToast('success', 'ส่งออก PDF (A4) สำเร็จ');
    } catch (err) {
      console.error('PDF export error:', err);
      addToast('error', 'ไม่สามารถสร้างไฟล์ PDF ได้');
    }
  };

  const handleExportAllPdf = async () => {
    if (documents.length === 0) return;
    try {
      setIsProcessing(true);
      const canvases: HTMLCanvasElement[] = [];
      for (const doc of documents) {
        const sourceImage = doc.croppedImage || doc.originalImage;
        const srcCanvas = await loadImageToCanvas(sourceImage);
        const outCanvas = processDocumentImage(srcCanvas, doc.settings);
        canvases.push(outCanvas);
      }
      await exportCanvasesToPdf(canvases, 'DocClear_All_Pages.pdf');
      addToast('success', `ส่งออก PDF รวม ${documents.length} หน้าสำเร็จ`);
    } catch (err) {
      console.error('Batch PDF export error:', err);
      addToast('error', 'เกิดข้อผิดพลาดในการรวม PDF');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!processedCanvas) return;
    const success = await copyCanvasToClipboard(processedCanvas);
    if (success) {
      setCopiedSuccess(true);
      addToast('success', 'คัดลอกลง Clipboard แล้ว', 'สามารถกด Ctrl+V ในเอกสารหรือแชทได้ทันที');
      setTimeout(() => setCopiedSuccess(false), 2500);
    } else {
      addToast('error', 'เบราว์เซอร์ไม่อนุญาตให้คัดลอกรูปภาพ');
    }
  };

  const handleRemoveDocument = (id: string) => {
    const remaining = documents.filter((d) => d.id !== id);
    setDocuments(remaining);
    if (activeDocId === id && remaining.length > 0) {
      setActiveDocId(remaining[0].id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Prompt','Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Global Header */}
      <Header
        hasDocuments={documents.length > 0}
        documentCount={documents.length}
        onOpenSamples={() => setIsSamplesModalOpen(true)}
        onNewDocument={() => setIsAddModalOpen(true)}
        onExportAllPdf={handleExportAllPdf}
        onResetSettings={handleResetSettings}
        isProcessing={isProcessing}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 flex flex-col">
        {documents.length === 0 ? (
          /* Empty / Upload State */
          <div className="flex-1 flex items-center justify-center p-4">
            <UploadZone
              onFilesSelected={handleFilesSelected}
              onSelectSample={handleSelectSample}
              isLoadingSample={isLoadingSample}
            />
          </div>
        ) : (
          /* Active Document Editor Workspace */
          <div className="flex-1 flex flex-col max-w-[1600px] w-full mx-auto p-4 sm:p-6 gap-4">
            {/* Multi-Document Batch Strip */}
            <BatchStrip
              documents={documents}
              activeId={activeDocId}
              onSelectDocument={setActiveDocId}
              onRemoveDocument={handleRemoveDocument}
              onAddNew={() => setIsAddModalOpen(true)}
            />

            {/* Editor Workspace Split View */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[560px]">
              {/* Left/Center: Visual Comparison & Canvas Viewer */}
              <div className="lg:col-span-8 xl:col-span-9 flex flex-col min-h-[460px]">
                {activeDoc && (
                  <ComparisonViewer
                    originalImage={activeDoc.croppedImage || activeDoc.originalImage}
                    processedCanvas={processedCanvas}
                    mode={activeDoc.settings.mode}
                    isProcessing={isProcessing}
                    isAnalyzing={activeDoc.isAnalyzing}
                  />
                )}
              </div>

              {/* Right: Fine-Tuning Controls & Export Actions */}
              <div className="lg:col-span-4 xl:col-span-3 flex flex-col">
                {activeDoc && (
                  <ControlPanel
                    settings={activeDoc.settings}
                    onUpdateSettings={handleUpdateSettings}
                    onOpenCornerAdjuster={() => setIsCornerAdjusterOpen(true)}
                    onOpenCleanBrush={() => setIsCleanBrushOpen(true)}
                    onRunAiAnalysis={() => analyzeWithAI(activeDoc)}
                    onDownloadImage={handleDownloadImage}
                    onDownloadPdf={handleDownloadPdf}
                    onCopyToClipboard={handleCopyToClipboard}
                    isProcessing={isProcessing}
                    isAnalyzing={activeDoc.isAnalyzing}
                    analysis={activeDoc.analysis}
                    copiedSuccess={copiedSuccess}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Corner Adjuster & Desk Warp Modal */}
      {isCornerAdjusterOpen && activeDoc && (
        <CornerAdjuster
          imageSrc={activeDoc.originalImage}
          initialCorners={activeDoc.corners}
          onApplyCrop={handleApplyCrop}
          onAutoDetectAI={handleAutoDetectCornersAI}
          onClose={() => setIsCornerAdjusterOpen(false)}
          isDetectingAI={isDetectingAI}
        />
      )}

      {/* Clean Brush Modal */}
      {isCleanBrushOpen && processedCanvas && activeDoc && (
        <CleanBrushModal
          canvas={processedCanvas}
          onApply={handleApplyCleanBrush}
          onClose={() => setIsCleanBrushOpen(false)}
          isTransparentMode={
            activeDoc.settings.mode === 'transparent_png' ||
            activeDoc.settings.mode === 'signature_stamp'
          }
        />
      )}

      {/* Add Document Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" /> เพิ่มเอกสารใหม่
            </h3>
            <UploadZone
              onFilesSelected={handleFilesSelected}
              onSelectSample={handleSelectSample}
              isLoadingSample={isLoadingSample}
            />
          </div>
        </div>
      )}

      {/* Preset Samples Modal */}
      {isSamplesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl">
            <button
              onClick={() => setIsSamplesModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                เลือกตัวอย่างเอกสารสำหรับทดสอบ
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                เอกสารจำลองสถานการณ์จริง เช่น ถ่ายบนโต๊ะไม้ มีเงาบัง หรือต้องการสกัดลายเซ็น
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {SAMPLE_DOCUMENTS.map((sample) => (
                <div
                  key={sample.id}
                  onClick={() => handleSelectSample(sample)}
                  className="p-4 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 cursor-pointer transition-all duration-200 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-3xl block mb-2">{sample.thumbnail}</span>
                    <h4 className="text-xs font-bold text-white">{sample.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {sample.description}
                    </p>
                  </div>
                  <button className="mt-4 w-full py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-semibold transition-colors">
                    โหลดตัวอย่างนี้
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Plus, Trash2, CheckCircle2, FileText } from 'lucide-react';
import { DocumentItem } from '../types/document';

interface BatchStripProps {
  documents: DocumentItem[];
  activeId: string;
  onSelectDocument: (id: string) => void;
  onRemoveDocument: (id: string) => void;
  onAddNew: () => void;
}

export const BatchStrip: React.FC<BatchStripProps> = ({
  documents,
  activeId,
  onSelectDocument,
  onRemoveDocument,
  onAddNew,
}) => {
  if (documents.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-2 px-1 max-w-full no-scrollbar">
      <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
        <FileText className="w-3.5 h-3.5" /> หน้า ({documents.length}):
      </span>

      {documents.map((doc, index) => {
        const isActive = doc.id === activeId;
        return (
          <div
            key={doc.id}
            onClick={() => onSelectDocument(doc.id)}
            className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer transition-all shrink-0 ${
              isActive
                ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
            }`}
          >
            <div className="w-6 h-7 rounded bg-slate-950 border border-slate-800 overflow-hidden shrink-0">
              <img
                src={doc.processedImage || doc.croppedImage || doc.originalImage}
                alt={doc.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col">
              <span className="text-xs font-semibold truncate max-w-[120px]">
                หน้า {index + 1}: {doc.name}
              </span>
              <span className="text-[10px] text-slate-400">
                {doc.settings.mode === 'studio_white'
                  ? 'ขาวใส'
                  : doc.settings.mode === 'transparent_png'
                  ? 'โปร่งใส'
                  : doc.settings.mode === 'signature_stamp'
                  ? 'ลายเซ็น'
                  : 'คมชัด'}
              </span>
            </div>

            {doc.hasCropped && (
              <span title="ตัดขอบระนาบแล้ว">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              </span>
            )}

            {documents.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveDocument(doc.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 text-slate-500 transition-opacity"
                title="ลบหน้านี้"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}

      <button
        onClick={onAddNew}
        className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-dashed border-slate-700 text-slate-400 hover:text-white text-xs font-medium shrink-0 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>เพิ่มหน้า</span>
      </button>
    </div>
  );
};

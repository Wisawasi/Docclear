import { jsPDF } from 'jspdf';

/**
 * Exports one or more canvas images into a clean standardized PDF (e.g. A4)
 */
export async function exportCanvasesToPdf(
  canvases: HTMLCanvasElement[],
  pdfFileName = 'DocClear_Export.pdf'
): Promise<void> {
  if (canvases.length === 0) return;

  // Standard A4 dimensions in mm: 210 x 297
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const a4Width = 210;
  const a4Height = 297;
  const margin = 10; // 10mm margin
  const printableWidth = a4Width - margin * 2;
  const printableHeight = a4Height - margin * 2;

  for (let i = 0; i < canvases.length; i++) {
    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    const canvas = canvases[i];
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Calculate aspect ratio fit
    const imgRatio = imgWidth / imgHeight;
    const printableRatio = printableWidth / printableHeight;

    let renderWidth = printableWidth;
    let renderHeight = printableHeight;
    let offsetX = margin;
    let offsetY = margin;

    if (imgRatio > printableRatio) {
      // Image is wider than printable area
      renderWidth = printableWidth;
      renderHeight = printableWidth / imgRatio;
      offsetY = margin + (printableHeight - renderHeight) / 2;
    } else {
      // Image is taller than printable area
      renderHeight = printableHeight;
      renderWidth = printableHeight * imgRatio;
      offsetX = margin + (printableWidth - renderWidth) / 2;
    }

    // Convert canvas to JPEG or PNG
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', offsetX, offsetY, renderWidth, renderHeight);
  }

  pdf.save(pdfFileName);
}

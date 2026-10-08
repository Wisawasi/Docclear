import { CleaningSettings } from '../types/document';

/**
 * Converts Image element or URL to HTMLCanvasElement
 */
export async function loadImageToCanvas(imageSource: string | HTMLImageElement): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    if (typeof imageSource === 'string') {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = (e) => reject(e);
      img.src = imageSource;
    } else {
      const canvas = document.createElement('canvas');
      canvas.width = imageSource.naturalWidth || imageSource.width;
      canvas.height = imageSource.naturalHeight || imageSource.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Canvas 2D context not available'));
        return;
      }
      ctx.drawImage(imageSource, 0, 0);
      resolve(canvas);
    }
  });
}

/**
 * Computes a smooth local illumination surface to eliminate uneven shadows,
 * fold creases, and room lighting gradients across the paper.
 */
function estimateIlluminationSurface(
  srcData: Uint8ClampedArray,
  width: number,
  height: number,
  gridStep = 24
): Float32Array {
  const gridW = Math.ceil(width / gridStep);
  const gridH = Math.ceil(height / gridStep);
  const gridLuminance = new Float32Array(gridW * gridH);

  // For each grid cell, sample pixels to find the local paper brightness (upper 90th percentile)
  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      const startX = gx * gridStep;
      const startY = gy * gridStep;
      const endX = Math.min(startX + gridStep, width);
      const endY = Math.min(startY + gridStep, height);

      const luminances: number[] = [];
      for (let y = startY; y < endY; y += 2) {
        for (let x = startX; x < endX; x += 2) {
          const idx = (y * width + x) * 4;
          const r = srcData[idx];
          const g = srcData[idx + 1];
          const b = srcData[idx + 2];
          // Standard relative luminance
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          luminances.push(lum);
        }
      }

      if (luminances.length > 0) {
        luminances.sort((a, b) => a - b);
        // Use 88th percentile as estimate of local paper background
        const pIdx = Math.min(Math.floor(luminances.length * 0.88), luminances.length - 1);
        gridLuminance[gy * gridW + gx] = Math.max(luminances[pIdx], 35);
      } else {
        gridLuminance[gy * gridW + gx] = 220;
      }
    }
  }

  // Smooth the grid with a 3x3 box blur to avoid step boundaries
  const smoothedGrid = new Float32Array(gridW * gridH);
  for (let gy = 0; gy < gridH; gy++) {
    for (let gx = 0; gx < gridW; gx++) {
      let sum = 0;
      let count = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const ny = gy + dy;
          const nx = gx + dx;
          if (nx >= 0 && nx < gridW && ny >= 0 && ny < gridH) {
            sum += gridLuminance[ny * gridW + nx];
            count++;
          }
        }
      }
      smoothedGrid[gy * gridW + gx] = sum / count;
    }
  }

  // Bilinear interpolation across all pixels for smooth continuous background field
  const backgroundField = new Float32Array(width * height);
  for (let y = 0; y < height; y++) {
    const gy = y / gridStep;
    const gy0 = Math.floor(gy);
    const gy1 = Math.min(gy0 + 1, gridH - 1);
    const ty = gy - gy0;

    for (let x = 0; x < width; x++) {
      const gx = x / gridStep;
      const gx0 = Math.floor(gx);
      const gx1 = Math.min(gx0 + 1, gridW - 1);
      const tx = gx - gx0;

      const v00 = smoothedGrid[gy0 * gridW + gx0];
      const v10 = smoothedGrid[gy0 * gridW + gx1];
      const v01 = smoothedGrid[gy1 * gridW + gx0];
      const v11 = smoothedGrid[gy1 * gridW + gx1];

      const val = (v00 * (1 - tx) + v10 * tx) * (1 - ty) + (v01 * (1 - tx) + v11 * tx) * ty;
      backgroundField[y * width + x] = Math.max(val, 25);
    }
  }

  return backgroundField;
}

/**
 * Hermite smoothstep for ultra-smooth anti-aliased edge blending
 */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Main AI-grade document processing function
 */
export function processDocumentImage(
  sourceCanvas: HTMLCanvasElement,
  settings: CleaningSettings
): HTMLCanvasElement {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;

  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = width;
  outputCanvas.height = height;

  const srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  const outCtx = outputCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx || !outCtx) return sourceCanvas;

  const srcImgData = srcCtx.getImageData(0, 0, width, height);
  const srcData = srcImgData.data;

  const outImgData = outCtx.createImageData(width, height);
  const outData = outImgData.data;

  // Step 1: Compute illumination surface to flatten lighting and shadow gradients
  const illumination = estimateIlluminationSurface(srcData, width, height, 28);

  const {
    mode,
    shadowRemoval = 0.85,
    backgroundWhiteness = 0.88,
    textContrast = 1.35,
    edgeSoftness = 0.45,
    colorBoost = 1.25,
    despeckle = true,
    brightness = 0,
    blackLevel = 15,
  } = settings;

  // Calibrate thresholds based on settings
  let lowThresh = 0.70 - (textContrast - 1.0) * 0.15;
  let highThresh = 0.93 - (1.0 - backgroundWhiteness) * 0.12;

  if (mode === 'signature_stamp') {
    // Aggressive background cleaning for signatures and rubber stamps
    lowThresh = 0.65;
    highThresh = 0.88;
  } else if (mode === 'high_contrast_bw') {
    lowThresh = 0.76;
    highThresh = 0.86;
  }

  // Transition width for anti-aliasing
  const transitionWidth = Math.max(0.04, edgeSoftness * 0.16);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = srcData[idx];
      const g = srcData[idx + 1];
      const b = srcData[idx + 2];
      const origAlpha = srcData[idx + 3];

      if (origAlpha === 0) {
        outData[idx] = 255;
        outData[idx + 1] = 255;
        outData[idx + 2] = 255;
        outData[idx + 3] = 0;
        continue;
      }

      // Pixel luminance
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Local paper luminance
      const localBgLum = illumination[y * width + x];

      // Normalized reflectance: 1.0 = clean paper, <0.8 = ink/text
      // Blend between raw normalized and shadow-flattened based on shadowRemoval
      const shadowRatio = localBgLum / 240;
      const compensatedLum = lum / (1.0 - shadowRemoval + shadowRemoval * shadowRatio);
      const normY = compensatedLum / 240;

      // Color saturation detection to preserve stamps (red seals) and blue pen ink
      const maxC = Math.max(r, g, b);
      const minC = Math.min(r, g, b);
      const chroma = maxC - minC;
      const saturation = maxC > 10 ? chroma / maxC : 0;

      // Check if pixel is colorful ink (e.g. red seal, blue ballpoint signature)
      const isRedStamp = r > g + 25 && r > b + 25 && saturation > 0.20;
      const isBlueInk = b > r + 15 && b > g + 10 && saturation > 0.18;
      const isGreenInk = g > r + 18 && g > b + 18 && saturation > 0.20;
      const isColoredInk = isRedStamp || isBlueInk || isGreenInk;

      // Calculate ink factor (0.0 = pure paper, 1.0 = dark ink)
      // Use Hermite smoothstep for velvety smooth anti-aliased stroke edges
      const edge0 = lowThresh - transitionWidth;
      const edge1 = highThresh + transitionWidth;
      const paperFactor = smoothstep(edge0, edge1, normY);
      let inkFactor = 1.0 - paperFactor;

      // Apply brightness adjustment
      if (brightness !== 0) {
        inkFactor = Math.max(0, Math.min(1, inkFactor * (1 - brightness / 100)));
      }

      // Processing Modes
      if (mode === 'transparent_png') {
        // Pure transparent PNG: background paper disappears completely
        let finalR = r;
        let finalG = g;
        let finalB = b;

        if (isColoredInk) {
          // Boost saturation of ink
          finalR = Math.min(255, r * colorBoost);
          finalG = Math.min(255, g * colorBoost);
          finalB = Math.min(255, b * colorBoost);
        } else {
          // Deepen black text
          const blackness = Math.pow(1 - inkFactor, textContrast);
          const gray = Math.round(blackness * blackLevel);
          finalR = gray;
          finalG = gray;
          finalB = gray;
        }

        const alphaVal = Math.round(Math.min(255, inkFactor * 255 * (1 + textContrast * 0.2)));

        outData[idx] = Math.round(finalR);
        outData[idx + 1] = Math.round(finalG);
        outData[idx + 2] = Math.round(finalB);
        outData[idx + 3] = alphaVal;
      } else if (mode === 'signature_stamp') {
        // Signature & Stamp isolation (Transparent PNG with clean cutoff)
        const sigAlpha = inkFactor > 0.08 ? Math.min(255, Math.pow(inkFactor, 0.85) * 270) : 0;

        let outR = r;
        let outG = g;
        let outB = b;

        if (isColoredInk) {
          outR = Math.min(255, r * (1 + (colorBoost - 1) * 0.8));
          outG = Math.min(255, g * (1 + (colorBoost - 1) * 0.8));
          outB = Math.min(255, b * (1 + (colorBoost - 1) * 0.8));
        } else {
          // Pure black/deep navy ink
          const val = Math.max(0, 15 - Math.round(inkFactor * 15));
          outR = val;
          outG = val;
          outB = val;
        }

        outData[idx] = Math.round(outR);
        outData[idx + 1] = Math.round(outG);
        outData[idx + 2] = Math.round(outB);
        outData[idx + 3] = Math.round(sigAlpha);
      } else if (mode === 'high_contrast_bw') {
        // High contrast black & white scan
        const isInk = inkFactor > 0.35;
        const color = isInk ? 0 : 255;
        outData[idx] = color;
        outData[idx + 1] = color;
        outData[idx + 2] = color;
        outData[idx + 3] = 255;
      } else if (mode === 'color_enhanced') {
        // Keep original document colors, but brighten background to pure white
        const blend = paperFactor;
        outData[idx] = Math.round(r * (1 - blend) + 255 * blend);
        outData[idx + 1] = Math.round(g * (1 - blend) + 255 * blend);
        outData[idx + 2] = Math.round(b * (1 - blend) + 255 * blend);
        outData[idx + 3] = 255;
      } else {
        // Default: 'studio_white' (Pure white clean studio document)
        if (isColoredInk) {
          // Blend colored ink with pure white paper
          const inkIntensity = Math.min(1.0, inkFactor * (1.1 + (textContrast - 1.0) * 0.5));
          const boostedR = Math.min(255, r * colorBoost);
          const boostedG = Math.min(255, g * colorBoost);
          const boostedB = Math.min(255, b * colorBoost);

          outData[idx] = Math.round(boostedR * inkIntensity + 255 * (1 - inkIntensity));
          outData[idx + 1] = Math.round(boostedG * inkIntensity + 255 * (1 - inkIntensity));
          outData[idx + 2] = Math.round(boostedB * inkIntensity + 255 * (1 - inkIntensity));
        } else {
          // Crisp text on pure white paper
          const boostedInk = Math.min(1.0, Math.pow(inkFactor, 1.0 / textContrast));
          const textDarkness = Math.round(blackLevel * (1.0 - boostedInk));
          const paperWhite = 255;

          const val = Math.round(textDarkness * boostedInk + paperWhite * (1.0 - boostedInk));
          outData[idx] = val;
          outData[idx + 1] = val;
          outData[idx + 2] = val;
        }
        outData[idx + 3] = 255;
      }
    }
  }

  // Step 2: Despeckle filter to clean random noise specks on paper if enabled
  if (despeckle && mode !== 'color_enhanced') {
    applyDespeckle(outData, width, height, mode === 'transparent_png' || mode === 'signature_stamp');
  }

  outCtx.putImageData(outImgData, 0, 0);
  return outputCanvas;
}

/**
 * Cleans isolated noise specks and scanner dust particles
 */
function applyDespeckle(data: Uint8ClampedArray, width: number, height: number, isTransparent: boolean): void {
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;

      if (isTransparent) {
        // If pixel is semi-opaque but all 8 neighbors are transparent, it's noise
        if (data[idx + 3] > 0) {
          let neighborOpaqueCount = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nIdx = ((y + dy) * width + (x + dx)) * 4;
              if (data[nIdx + 3] > 30) neighborOpaqueCount++;
            }
          }
          if (neighborOpaqueCount <= 1) {
            data[idx + 3] = 0;
          }
        }
      } else {
        // If pixel is dark but all 8 neighbors are pure white (>245), clear it to white
        const lum = data[idx];
        if (lum < 200) {
          let neighborWhiteCount = 0;
          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const nIdx = ((y + dy) * width + (x + dx)) * 4;
              if (data[nIdx] > 240) neighborWhiteCount++;
            }
          }
          if (neighborWhiteCount >= 7) {
            data[idx] = 255;
            data[idx + 1] = 255;
            data[idx + 2] = 255;
          }
        }
      }
    }
  }
}

/**
 * Downloads a canvas as an image file
 */
export function downloadCanvas(canvas: HTMLCanvasElement, filename: string, format: 'png' | 'jpeg' = 'png', quality = 0.95): void {
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(mime, quality);
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copies a canvas image to system clipboard as PNG
 */
export async function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  try {
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          resolve(false);
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          resolve(true);
        } catch (err) {
          console.error('Clipboard write error:', err);
          resolve(false);
        }
      }, 'image/png');
    });
  } catch (err) {
    console.error('Clipboard error:', err);
    return false;
  }
}

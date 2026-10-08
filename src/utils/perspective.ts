import { Point, QuadCorners } from '../types/document';

/**
 * Solves an 8x8 linear system using Gaussian elimination to find
 * the 3x3 projective homography matrix mapping dst (rectangle) -> src (quad)
 */
function getProjectiveTransform(
  src: [Point, Point, Point, Point],
  dst: [Point, Point, Point, Point]
): number[] {
  // We want mapping from dst (rectangle) -> src (quad) for backward mapping interpolation
  const a: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i++) {
    const sx = dst[i].x;
    const sy = dst[i].y;
    const dx = src[i].x;
    const dy = src[i].y;

    a.push([sx, sy, 1, 0, 0, 0, -sx * dx, -sy * dx]);
    b.push(dx);

    a.push([0, 0, 0, sx, sy, 1, -sx * dy, -sy * dy]);
    b.push(dy);
  }

  // Gaussian elimination
  const n = 8;
  for (let i = 0; i < n; i++) {
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(a[k][i]) > Math.abs(a[maxRow][i])) {
        maxRow = k;
      }
    }

    [a[i], a[maxRow]] = [a[maxRow], a[i]];
    [b[i], b[maxRow]] = [b[maxRow], b[i]];

    const pivot = a[i][i];
    if (Math.abs(pivot) < 1e-10) continue;

    for (let j = i; j < n; j++) {
      a[i][j] /= pivot;
    }
    b[i] /= pivot;

    for (let k = 0; k < n; k++) {
      if (k !== i) {
        const factor = a[k][i];
        for (let j = i; j < n; j++) {
          a[k][j] -= factor * a[i][j];
        }
        b[k] -= factor * b[i];
      }
    }
  }

  // Matrix: [h0, h1, h2, h3, h4, h5, h6, h7, 1]
  return [b[0], b[1], b[2], b[3], b[4], b[5], b[6], b[7], 1];
}

/**
 * Calculates Euclidean distance between two points
 */
function dist(p1: Point, p2: Point): number {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

/**
 * Warps a 4-point quadrilateral on an image to a clean flat rectangle
 * with high-quality bilinear interpolation
 */
export function warpPerspective(
  sourceCanvas: HTMLCanvasElement,
  corners: QuadCorners,
  targetWidth?: number,
  targetHeight?: number
): HTMLCanvasElement {
  const { topLeft, topRight, bottomRight, bottomLeft } = corners;

  // Calculate natural target width and height based on the average opposite edge lengths
  const widthTop = dist(topLeft, topRight);
  const widthBottom = dist(bottomLeft, bottomRight);
  const avgWidth = Math.round(Math.max(widthTop, widthBottom));

  const heightLeft = dist(topLeft, bottomLeft);
  const heightRight = dist(topRight, bottomRight);
  const avgHeight = Math.round(Math.max(heightLeft, heightRight));

  // Determine output dimensions (limit max dimension to 3000 to keep memory safe while retaining ultra crisp detail)
  const maxDim = 2800;
  let finalWidth = targetWidth || avgWidth;
  let finalHeight = targetHeight || avgHeight;

  if (finalWidth > maxDim || finalHeight > maxDim) {
    const scale = maxDim / Math.max(finalWidth, finalHeight);
    finalWidth = Math.round(finalWidth * scale);
    finalHeight = Math.round(finalHeight * scale);
  }

  // Create destination canvas
  const dstCanvas = document.createElement('canvas');
  dstCanvas.width = finalWidth;
  dstCanvas.height = finalHeight;
  const dstCtx = dstCanvas.getContext('2d', { willReadFrequently: true });
  if (!dstCtx) return sourceCanvas;

  const srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) return sourceCanvas;

  const srcWidth = sourceCanvas.width;
  const srcHeight = sourceCanvas.height;
  const srcImgData = srcCtx.getImageData(0, 0, srcWidth, srcHeight);
  const srcData = srcImgData.data;

  const dstImgData = dstCtx.createImageData(finalWidth, finalHeight);
  const dstData = dstImgData.data;

  // Destination rectangle points
  const dstPoints: [Point, Point, Point, Point] = [
    { x: 0, y: 0 },
    { x: finalWidth, y: 0 },
    { x: finalWidth, y: finalHeight },
    { x: 0, y: finalHeight },
  ];

  // Source quadrilateral points
  const srcPoints: [Point, Point, Point, Point] = [
    topLeft,
    topRight,
    bottomRight,
    bottomLeft,
  ];

  // Projective matrix mapping dst (x, y) -> src (u, v)
  const H = getProjectiveTransform(srcPoints, dstPoints);

  // Backward mapping with bilinear interpolation
  for (let y = 0; y < finalHeight; y++) {
    for (let x = 0; x < finalWidth; x++) {
      // Apply homography
      const denom = H[6] * x + H[7] * y + H[8];
      if (Math.abs(denom) < 1e-8) continue;

      const u = (H[0] * x + H[1] * y + H[2]) / denom;
      const v = (H[3] * x + H[4] * y + H[5]) / denom;

      // Check bounds
      if (u >= 0 && u < srcWidth - 1 && v >= 0 && v < srcHeight - 1) {
        const u0 = Math.floor(u);
        const v0 = Math.floor(v);
        const u1 = u0 + 1;
        const v1 = v0 + 1;

        const du = u - u0;
        const dv = v - v0;
        const du1 = 1 - du;
        const dv1 = 1 - dv;

        // 4 corner indices
        const idx00 = (v0 * srcWidth + u0) * 4;
        const idx10 = (v0 * srcWidth + u1) * 4;
        const idx01 = (v1 * srcWidth + u0) * 4;
        const idx11 = (v1 * srcWidth + u1) * 4;

        const dstIdx = (y * finalWidth + x) * 4;

        // Bilinear interpolate R, G, B, A
        for (let c = 0; c < 4; c++) {
          const val =
            srcData[idx00 + c] * du1 * dv1 +
            srcData[idx10 + c] * du * dv1 +
            srcData[idx01 + c] * du1 * dv +
            srcData[idx11 + c] * du * dv;
          dstData[dstIdx + c] = Math.round(val);
        }
      } else {
        // Outside bounds: make transparent or white
        const dstIdx = (y * finalWidth + x) * 4;
        dstData[dstIdx] = 255;
        dstData[dstIdx + 1] = 255;
        dstData[dstIdx + 2] = 255;
        dstData[dstIdx + 3] = 0;
      }
    }
  }

  dstCtx.putImageData(dstImgData, 0, 0);
  return dstCanvas;
}

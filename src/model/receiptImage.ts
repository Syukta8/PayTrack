/** Canvas-based receipt photo preparation. Separated from receiptVision so the extraction
 * and validation logic stays free of DOM dependencies. */

/** Receipt text legibility depends on horizontal resolution, so width is clamped and
 * height is left free — a tall thermal receipt must not be squeezed to fit a square box.
 * MAX_PIXELS keeps very long receipts inside a sane request size. */
const MAX_WIDTH = 1100;
const MAX_PIXELS = 6_000_000;
const JPEG_QUALITY = 0.9;

export const MIN_LEGIBLE_WIDTH = 800;

export interface PreparedImage {
  dataUrl: string;
  sourceWidth: number;
  width: number;
}

/** Reads a photo's intrinsic width so the user can be warned before spending a scan. */
export function measureWidth(dataUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.width);
    img.onerror = () => resolve(0);
    img.src = dataUrl;
  });
}

/** Scales a receipt photo by width only, preserving its aspect ratio and vertical detail. */
export function prepareImage(dataUrl: string): Promise<PreparedImage> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const sourceWidth = img.width;
      if (!sourceWidth || !img.height) {
        resolve({ dataUrl, sourceWidth: 0, width: 0 });
        return;
      }

      let scale = sourceWidth > MAX_WIDTH ? MAX_WIDTH / sourceWidth : 1;
      const scaledPixels = sourceWidth * scale * img.height * scale;
      if (scaledPixels > MAX_PIXELS) scale *= Math.sqrt(MAX_PIXELS / scaledPixels);

      const width = Math.max(1, Math.round(sourceWidth * scale));
      const height = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ dataUrl, sourceWidth, width: sourceWidth });
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve({ dataUrl: canvas.toDataURL("image/jpeg", JPEG_QUALITY), sourceWidth, width });
    };
    img.onerror = () => resolve({ dataUrl, sourceWidth: 0, width: 0 });
    img.src = dataUrl;
  });
}

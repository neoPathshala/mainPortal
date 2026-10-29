/**
 * neoPathshala High-Performance Image Compression & WebP Conversion Engine
 * Converts images (PNG, JPEG, HEIC, TIFF, BMP) into ultra-optimized WebP
 * with custom quality tuning, dimensional constraints, and byte analytics.
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default 0.82)
  targetFormat?: "image/webp" | "image/jpeg" | "image/png";
  preserveSvg?: boolean;
}

export interface CompressedImageResult {
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  savingsBytes: number;
  savingsPercent: number;
  width: number;
  height: number;
  format: string;
  mimeType: string;
  name: string;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Compresses an image File or Blob and encodes it to WebP.
 */
export async function compressImageToWebP(
  input: File | Blob,
  options: ImageCompressionOptions = {}
): Promise<CompressedImageResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.82,
    targetFormat = "image/webp",
    preserveSvg = false,
  } = options;

  const originalSize = input.size;
  const originalName = (input instanceof File ? input.name : "image.jpg");
  const isSvg = input.type === "image/svg+xml" || originalName.toLowerCase().endsWith(".svg");

  // If user requested preserving SVG and file is SVG, return as is
  if (isSvg && preserveSvg) {
    const text = await input.text();
    const dataUrl = `data:image/svg+xml;base64,${typeof window !== "undefined" ? btoa(unescape(encodeURIComponent(text))) : ""}`;
    const file = input instanceof File ? input : new File([input], originalName, { type: "image/svg+xml" });
    return {
      file,
      dataUrl,
      originalSize,
      compressedSize: originalSize,
      savingsBytes: 0,
      savingsPercent: 0,
      width: 0,
      height: 0,
      format: "svg",
      mimeType: "image/svg+xml",
      name: originalName,
    };
  }

  // Convert to ImageBitmap or HTMLImageElement
  const imageBitmap = await loadImage(input);
  const srcWidth = imageBitmap.width;
  const srcHeight = imageBitmap.height;

  // Calculate target dimensions maintaining aspect ratio
  let targetWidth = srcWidth;
  let targetHeight = srcHeight;

  if (targetWidth > maxWidth || targetHeight > maxHeight) {
    const ratio = Math.min(maxWidth / targetWidth, maxHeight / targetHeight);
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  // Create canvas
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to obtain 2D canvas context for image compression");
  }

  // High quality interpolation
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);

  // Export to WebP blob
  const webpBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          // Fallback if browser doesn't support webp encoding (rare)
          canvas.toBlob((jpegBlob) => {
            if (jpegBlob) resolve(jpegBlob);
            else reject(new Error("Canvas toBlob failed"));
          }, "image/jpeg", quality);
        }
      },
      targetFormat,
      quality
    );
  });

  const baseName = originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
  const outputFormat = webpBlob.type;
  const newExtension = outputFormat === "image/webp" ? ".webp" : outputFormat === "image/png" ? ".png" : ".jpg";
  const newFileName = `${baseName}${newExtension}`;

  const compressedFile = new File([webpBlob], newFileName, {
    type: webpBlob.type,
    lastModified: Date.now(),
  });

  const dataUrl = canvas.toDataURL(targetFormat, quality);
  const compressedSize = compressedFile.size;
  const savingsBytes = Math.max(0, originalSize - compressedSize);
  const savingsPercent = originalSize > 0 
    ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 1000) / 10)
    : 0;

  return {
    file: compressedFile,
    dataUrl,
    originalSize,
    compressedSize,
    savingsBytes,
    savingsPercent,
    width: targetWidth,
    height: targetHeight,
    format: outputFormat.replace("image/", ""),
    mimeType: outputFormat,
    name: newFileName,
  };
}

/**
 * Loads an image from Blob or File into an HTMLImageElement
 */
function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to decode image file for compression"));
    };
    img.src = url;
  });
}

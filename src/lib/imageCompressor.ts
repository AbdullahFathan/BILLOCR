/** Max original file size accepted by the uploader (binary). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Maximum width/height (px) before the image gets downscaled. */
const MAX_IMAGE_DIMENSION = 1600;

/** JPEG quality factor: 0 (worst) – 1 (best). */
const JPEG_QUALITY = 0.72;

/** Fallback resize when the first pass still exceeds the soft threshold. */
const FALLBACK_DIMENSION = 1200;
const FALLBACK_QUALITY = 0.6;

/** Soft threshold that triggers a single more-aggressive compression pass. */
const OCR_FALLBACK_THRESHOLD_BYTES = 1 * 1024 * 1024;

/**
 * Compresses an image file using the Canvas API.
 * Resizes the image to fit within maxWidth/maxHeight (default MAX_IMAGE_DIMENSION)
 * and outputs a compressed JPEG Blob at the specified quality (default JPEG_QUALITY).
 */
export function compressImage(
  file: File,
  maxWidth = MAX_IMAGE_DIMENSION,
  maxHeight = MAX_IMAGE_DIMENSION,
  quality = JPEG_QUALITY
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // Check if window and FileReader are available (client-side only)
    if (typeof window === 'undefined' || !window.FileReader) {
      reject(new Error('Pembaca file hanya tersedia di browser.'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio and new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal memproses gambar.'));
          return;
        }

        // Draw image onto canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert canvas content to compressed JPEG blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Gagal mengompres gambar.'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Gagal memuat gambar.'));
      };
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca file.'));
    };
  });
}

/**
 * Compresses a receipt image for Mistral OCR:
 * 1) 1600px / quality 0.72
 * 2) If still > 1 MB, one fallback pass at 1200px / quality 0.6
 */
export async function compressForOcr(file: File): Promise<Blob> {
  const firstPass = await compressImage(
    file,
    MAX_IMAGE_DIMENSION,
    MAX_IMAGE_DIMENSION,
    JPEG_QUALITY
  );

  if (firstPass.size <= OCR_FALLBACK_THRESHOLD_BYTES) {
    return firstPass;
  }

  return compressImage(
    new File([firstPass], "receipt.jpg", { type: "image/jpeg" }),
    FALLBACK_DIMENSION,
    FALLBACK_DIMENSION,
    FALLBACK_QUALITY
  );
}

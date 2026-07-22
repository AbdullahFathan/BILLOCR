/** Maximum width/height (px) before the image gets downscaled. */
const MAX_IMAGE_DIMENSION = 1600;

/** JPEG quality factor: 0 (worst) – 1 (best). 0.75 = good balance of quality vs. size. */
const JPEG_QUALITY = 0.75;

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
      reject(new Error('FileReader is only available in browser environments.'));
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
          reject(new Error('Could not get 2D context from canvas.'));
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
              reject(new Error('Canvas compression failed.'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => {
        reject(new Error('Failed to load image element.'));
      };
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file.'));
    };
  });
}

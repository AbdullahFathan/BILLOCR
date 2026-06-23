/**
 * Compresses an image file using the Canvas API.
 * Resizes the image to fit within maxWidth/maxHeight (default 1600px)
 * and outputs a compressed JPEG Blob at the specified quality (default 0.75).
 */
export function compressImage(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.75
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

      img.onerror = (err) => {
        reject(new Error('Failed to load image element.'));
      };
    };

    reader.onerror = (err) => {
      reject(new Error('Failed to read file.'));
    };
  });
}

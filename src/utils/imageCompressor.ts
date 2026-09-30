const MAX_BYTES = 800 * 1024;
const MAX_DIMENSION = 1080;

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => canvas.toBlob(
    blob => blob ? resolve(blob) : reject(new Error('Canvas to Blob failed')),
    'image/jpeg',
    quality,
  ));
}

/** Compresses camera images to a 1080p JPEG, aiming for an upload below 800 KB. */
export async function compressImage(file: File): Promise<Blob> {
  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = imageUrl;
    });

    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
    let width = Math.max(1, Math.round(image.width * scale));
    let height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas context not available');

    let result: Blob | null = null;
    for (let pass = 0; pass < 3; pass += 1) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(image, 0, 0, width, height);
      for (const quality of [0.78, 0.68, 0.58, 0.48]) {
        result = await canvasBlob(canvas, quality);
        if (result.size <= MAX_BYTES) return result;
      }
      width = Math.round(width * 0.85);
      height = Math.round(height * 0.85);
    }
    return result || file;
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

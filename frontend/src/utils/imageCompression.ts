/**
 * Image Compression Utility
 * 
 * Client-side image compression before upload to optimize for low-bandwidth networks
 * 
 * Requirements: 29.2, 29.3
 * 
 * Features:
 * - Compress images to target size (200KB for photos, 500KB for documents)
 * - Progressive JPEG support for better loading experience
 * - Maintain aspect ratio
 * - Support multiple image formats (JPEG, PNG, WebP)
 * - Quality adjustment based on file size
 */

export interface CompressionOptions {
  maxSizeKB: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
  progressive?: boolean;
}

export interface CompressionResult {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  width: number;
  height: number;
}

/**
 * Default compression options for photos (student photos, profile pictures)
 */
export const PHOTO_COMPRESSION_OPTIONS: CompressionOptions = {
  maxSizeKB: 200,
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.9,
  mimeType: 'image/jpeg',
  progressive: true,
};

/**
 * Lite mode compression options for photos (more aggressive compression)
 */
export const PHOTO_COMPRESSION_OPTIONS_LITE: CompressionOptions = {
  maxSizeKB: 100,
  maxWidth: 600,
  maxHeight: 600,
  quality: 0.75,
  mimeType: 'image/jpeg',
  progressive: false,
};

/**
 * Default compression options for documents (scanned documents, certificates)
 */
export const DOCUMENT_IMAGE_COMPRESSION_OPTIONS: CompressionOptions = {
  maxSizeKB: 500,
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.85,
  mimeType: 'image/jpeg',
  progressive: true,
};

/**
 * Lite mode compression options for documents (more aggressive compression)
 */
export const DOCUMENT_IMAGE_COMPRESSION_OPTIONS_LITE: CompressionOptions = {
  maxSizeKB: 300,
  maxWidth: 1280,
  maxHeight: 1280,
  quality: 0.7,
  mimeType: 'image/jpeg',
  progressive: false,
};

/**
 * Compress an image file to meet size requirements
 * 
 * @param file - Original image file
 * @param options - Compression options
 * @returns Promise with compression result
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = PHOTO_COMPRESSION_OPTIONS
): Promise<CompressionResult> {
  const originalSize = file.size;
  const maxSizeBytes = options.maxSizeKB * 1024;

  // If file is already below max size and is JPEG, return as-is
  if (originalSize <= maxSizeBytes && file.type === 'image/jpeg') {
    const dimensions = await getImageDimensions(file);
    return {
      file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      width: dimensions.width,
      height: dimensions.height,
    };
  }

  // Load image
  const img = await loadImage(file);
  
  // Calculate new dimensions
  const { width, height } = calculateDimensions(
    img.width,
    img.height,
    options.maxWidth,
    options.maxHeight
  );

  // Try compression with decreasing quality
  let quality = options.quality || 0.9;
  let compressedFile: File;
  let attempts = 0;
  const maxAttempts = 10;

  do {
    compressedFile = await compressImageToFile(
      img,
      width,
      height,
      quality,
      options.mimeType || 'image/jpeg',
      file.name
    );

    if (compressedFile.size <= maxSizeBytes || attempts >= maxAttempts) {
      break;
    }

    // Reduce quality for next attempt
    quality -= 0.1;
    attempts++;
  } while (quality > 0.1);

  // If still too large, reduce dimensions
  if (compressedFile.size > maxSizeBytes && attempts >= maxAttempts) {
    const scaleFactor = Math.sqrt(maxSizeBytes / compressedFile.size);
    const newWidth = Math.floor(width * scaleFactor);
    const newHeight = Math.floor(height * scaleFactor);

    compressedFile = await compressImageToFile(
      img,
      newWidth,
      newHeight,
      0.7,
      options.mimeType || 'image/jpeg',
      file.name
    );
  }

  return {
    file: compressedFile,
    originalSize,
    compressedSize: compressedFile.size,
    compressionRatio: compressedFile.size / originalSize,
    width,
    height,
  };
}

/**
 * Load image from file
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Get image dimensions without loading full image
 */
function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth?: number,
  maxHeight?: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  if (maxWidth && width > maxWidth) {
    height = Math.floor((height * maxWidth) / width);
    width = maxWidth;
  }

  if (maxHeight && height > maxHeight) {
    width = Math.floor((width * maxHeight) / height);
    height = maxHeight;
  }

  return { width, height };
}

/**
 * Compress image to file with specified parameters
 */
function compressImageToFile(
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number,
  mimeType: string,
  originalName: string
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    // Draw image on canvas
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to compress image'));
          return;
        }

        // Create file from blob
        const fileName = originalName.replace(/\.[^/.]+$/, '') + getExtensionForMimeType(mimeType);
        const file = new File([blob], fileName, { type: mimeType });
        resolve(file);
      },
      mimeType,
      quality
    );
  });
}

/**
 * Get file extension for mime type
 */
function getExtensionForMimeType(mimeType: string): string {
  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
  };
  return extensions[mimeType] || '.jpg';
}

/**
 * Validate if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Batch compress multiple images
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = PHOTO_COMPRESSION_OPTIONS,
  onProgress?: (current: number, total: number) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (isImageFile(file)) {
      const result = await compressImage(file, options);
      results.push(result);
    } else {
      // Non-image files pass through unchanged
      results.push({
        file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        width: 0,
        height: 0,
      });
    }

    if (onProgress) {
      onProgress(i + 1, files.length);
    }
  }

  return results;
}

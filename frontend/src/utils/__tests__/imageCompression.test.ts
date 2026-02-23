/**
 * Unit Tests for Image Compression Utility
 * 
 * Requirements: 29.2, 29.3
 */

import {
  compressImage,
  compressImages,
  isImageFile,
  formatFileSize,
  PHOTO_COMPRESSION_OPTIONS,
  DOCUMENT_IMAGE_COMPRESSION_OPTIONS,
} from '../imageCompression';

// Mock canvas and image
class MockImage {
  width = 1920;
  height = 1080;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';

  constructor() {
    setTimeout(() => {
      if (this.onload) {
        this.onload();
      }
    }, 0);
  }
}

class MockCanvas {
  width = 0;
  height = 0;

  getContext() {
    return {
      drawImage: jest.fn(),
    };
  }

  toBlob(callback: (blob: Blob | null) => void, mimeType: string, quality: number) {
    // Create a mock blob with size based on quality
    const size = Math.floor(100000 * quality);
    const blob = new Blob(['x'.repeat(size)], { type: mimeType });
    setTimeout(() => callback(blob), 0);
  }
}

// Setup mocks
beforeAll(() => {
  global.Image = MockImage as any;
  global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = jest.fn();
  document.createElement = jest.fn((tagName: string) => {
    if (tagName === 'canvas') {
      return new MockCanvas() as any;
    }
    return {} as any;
  });
});

describe('imageCompression', () => {
  describe('isImageFile', () => {
    it('should return true for image files', () => {
      const imageFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      expect(isImageFile(imageFile)).toBe(true);
    });

    it('should return false for non-image files', () => {
      const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
      expect(isImageFile(pdfFile)).toBe(false);
    });

    it('should handle various image types', () => {
      const jpegFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File([''], 'test.png', { type: 'image/png' });
      const gifFile = new File([''], 'test.gif', { type: 'image/gif' });
      const webpFile = new File([''], 'test.webp', { type: 'image/webp' });

      expect(isImageFile(jpegFile)).toBe(true);
      expect(isImageFile(pngFile)).toBe(true);
      expect(isImageFile(gifFile)).toBe(true);
      expect(isImageFile(webpFile)).toBe(true);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(1073741824)).toBe('1 GB');
    });

    it('should handle decimal places', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(2560)).toBe('2.5 KB');
    });
  });

  describe('compressImage', () => {
    it('should compress image to target size', async () => {
      const largeFile = new File(['x'.repeat(500000)], 'large.jpg', { type: 'image/jpeg' });
      
      const result = await compressImage(largeFile, PHOTO_COMPRESSION_OPTIONS);

      expect(result.file).toBeInstanceOf(File);
      expect(result.originalSize).toBe(largeFile.size);
      expect(result.compressedSize).toBeLessThanOrEqual(PHOTO_COMPRESSION_OPTIONS.maxSizeKB * 1024);
      expect(result.compressionRatio).toBeLessThanOrEqual(1);
    });

    it('should not compress if already below max size', async () => {
      const smallFile = new File(['x'.repeat(50000)], 'small.jpg', { type: 'image/jpeg' });
      
      const result = await compressImage(smallFile, PHOTO_COMPRESSION_OPTIONS);

      expect(result.file).toBe(smallFile);
      expect(result.compressionRatio).toBe(1);
    });

    it('should use photo compression options by default', async () => {
      const file = new File(['x'.repeat(300000)], 'photo.jpg', { type: 'image/jpeg' });
      
      const result = await compressImage(file);

      expect(result.compressedSize).toBeLessThanOrEqual(PHOTO_COMPRESSION_OPTIONS.maxSizeKB * 1024);
    });

    it('should use document compression options when specified', async () => {
      const file = new File(['x'.repeat(600000)], 'document.jpg', { type: 'image/jpeg' });
      
      const result = await compressImage(file, DOCUMENT_IMAGE_COMPRESSION_OPTIONS);

      expect(result.compressedSize).toBeLessThanOrEqual(DOCUMENT_IMAGE_COMPRESSION_OPTIONS.maxSizeKB * 1024);
    });

    it('should maintain aspect ratio', async () => {
      const file = new File(['x'.repeat(300000)], 'photo.jpg', { type: 'image/jpeg' });
      
      const result = await compressImage(file, {
        maxSizeKB: 200,
        maxWidth: 800,
        maxHeight: 600,
      });

      expect(result.width).toBeLessThanOrEqual(800);
      expect(result.height).toBeLessThanOrEqual(600);
    });

    it('should handle compression errors gracefully', async () => {
      // Mock canvas.toBlob to fail
      const originalCreateElement = document.createElement;
      document.createElement = jest.fn((tagName: string) => {
        if (tagName === 'canvas') {
          const canvas = new MockCanvas() as any;
          canvas.toBlob = (callback: (blob: Blob | null) => void) => {
            setTimeout(() => callback(null), 0);
          };
          return canvas;
        }
        return {} as any;
      });

      const file = new File(['x'.repeat(300000)], 'photo.jpg', { type: 'image/jpeg' });
      
      await expect(compressImage(file)).rejects.toThrow();

      // Restore
      document.createElement = originalCreateElement;
    });
  });

  describe('compressImages', () => {
    it('should compress multiple images', async () => {
      const files = [
        new File(['x'.repeat(300000)], 'photo1.jpg', { type: 'image/jpeg' }),
        new File(['x'.repeat(400000)], 'photo2.jpg', { type: 'image/jpeg' }),
        new File(['x'.repeat(250000)], 'photo3.jpg', { type: 'image/jpeg' }),
      ];

      const results = await compressImages(files, PHOTO_COMPRESSION_OPTIONS);

      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.compressedSize).toBeLessThanOrEqual(PHOTO_COMPRESSION_OPTIONS.maxSizeKB * 1024);
      });
    });

    it('should call progress callback', async () => {
      const files = [
        new File(['x'.repeat(300000)], 'photo1.jpg', { type: 'image/jpeg' }),
        new File(['x'.repeat(400000)], 'photo2.jpg', { type: 'image/jpeg' }),
      ];

      const progressCallback = jest.fn();
      await compressImages(files, PHOTO_COMPRESSION_OPTIONS, progressCallback);

      expect(progressCallback).toHaveBeenCalledWith(1, 2);
      expect(progressCallback).toHaveBeenCalledWith(2, 2);
    });

    it('should pass through non-image files unchanged', async () => {
      const files = [
        new File(['x'.repeat(300000)], 'photo.jpg', { type: 'image/jpeg' }),
        new File(['document content'], 'document.pdf', { type: 'application/pdf' }),
      ];

      const results = await compressImages(files, PHOTO_COMPRESSION_OPTIONS);

      expect(results).toHaveLength(2);
      expect(results[0].compressionRatio).toBeLessThan(1); // Image compressed
      expect(results[1].compressionRatio).toBe(1); // PDF unchanged
      expect(results[1].file).toBe(files[1]);
    });

    it('should handle empty array', async () => {
      const results = await compressImages([]);
      expect(results).toHaveLength(0);
    });
  });

  describe('compression options', () => {
    it('should have correct photo compression defaults', () => {
      expect(PHOTO_COMPRESSION_OPTIONS.maxSizeKB).toBe(200);
      expect(PHOTO_COMPRESSION_OPTIONS.maxWidth).toBe(800);
      expect(PHOTO_COMPRESSION_OPTIONS.maxHeight).toBe(800);
      expect(PHOTO_COMPRESSION_OPTIONS.progressive).toBe(true);
    });

    it('should have correct document compression defaults', () => {
      expect(DOCUMENT_IMAGE_COMPRESSION_OPTIONS.maxSizeKB).toBe(500);
      expect(DOCUMENT_IMAGE_COMPRESSION_OPTIONS.maxWidth).toBe(1920);
      expect(DOCUMENT_IMAGE_COMPRESSION_OPTIONS.maxHeight).toBe(1920);
      expect(DOCUMENT_IMAGE_COMPRESSION_OPTIONS.progressive).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle very small images', async () => {
      const tinyFile = new File(['x'.repeat(1000)], 'tiny.jpg', { type: 'image/jpeg' });
      
      const result = await compressImage(tinyFile, PHOTO_COMPRESSION_OPTIONS);

      expect(result.file).toBe(tinyFile);
      expect(result.compressionRatio).toBe(1);
    });

    it('should handle images at exact max size', async () => {
      const exactFile = new File(['x'.repeat(204800)], 'exact.jpg', { type: 'image/jpeg' });
      
      const result = await compressImage(exactFile, PHOTO_COMPRESSION_OPTIONS);

      expect(result.compressedSize).toBeLessThanOrEqual(PHOTO_COMPRESSION_OPTIONS.maxSizeKB * 1024);
    });

    it('should handle very large images', async () => {
      const hugeFile = new File(['x'.repeat(5000000)], 'huge.jpg', { type: 'image/jpeg' });
      
      const result = await compressImage(hugeFile, PHOTO_COMPRESSION_OPTIONS);

      expect(result.compressedSize).toBeLessThanOrEqual(PHOTO_COMPRESSION_OPTIONS.maxSizeKB * 1024);
      expect(result.compressionRatio).toBeLessThan(0.1);
    });
  });
});

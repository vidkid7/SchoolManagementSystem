/**
 * Property-Based Tests for Image Compression
 * 
 * Feature: school-management-system-nodejs-react
 * Property 31: Image Compression Enforcement
 * 
 * Validates: Requirements 29.2
 * 
 * Property: For any uploaded image file, if it exceeds the size limit 
 * (200KB for photos, 500KB for documents), it should be compressed to 
 * meet the limit while maintaining acceptable quality.
 */

import fc from 'fast-check';
import {
  compressImage,
  PHOTO_COMPRESSION_OPTIONS,
  DOCUMENT_IMAGE_COMPRESSION_OPTIONS,
  isImageFile,
  CompressionOptions,
} from '../imageCompression';

// Mock canvas and image APIs for testing
class MockImage {
  width = 800;
  height = 600;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';

  constructor() {
    setTimeout(() => {
      if (this.onload) this.onload();
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
    const baseSize = this.width * this.height * 0.1; // Base size calculation
    const size = Math.floor(baseSize * quality);
    const blob = new Blob(['x'.repeat(size)], { type: mimeType });
    setTimeout(() => callback(blob), 0);
  }
}

// Setup mocks
beforeAll(() => {
  global.Image = MockImage as any;
  global.URL.createObjectURL = jest.fn(() => 'mock-url');
  global.URL.revokeObjectURL = jest.fn();
  document.createElement = jest.fn((tag: string) => {
    if (tag === 'canvas') {
      return new MockCanvas() as any;
    }
    return {} as any;
  });
});

describe('Image Compression Property Tests', () => {
  // Feature: school-management-system-nodejs-react, Property 31: Image Compression Enforcement
  describe('Property 31: Image Compression Enforcement', () => {
    it('should compress photos exceeding 200KB to meet the limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate file sizes from 201KB to 5MB
          fc.integer({ min: 201, max: 5000 }),
          async (sizeKB) => {
            // Create a mock file exceeding the photo size limit
            const fileSize = sizeKB * 1024;
            const mockFile = new File(
              ['x'.repeat(fileSize)],
              'test-photo.jpg',
              { type: 'image/jpeg' }
            );

            // Compress the image
            const result = await compressImage(mockFile, PHOTO_COMPRESSION_OPTIONS);

            // Property: Compressed file should be at or below the limit
            const maxSizeBytes = PHOTO_COMPRESSION_OPTIONS.maxSizeKB * 1024;
            expect(result.compressedSize).toBeLessThanOrEqual(maxSizeBytes);

            // Property: Compression ratio should be less than 1 (file was compressed)
            expect(result.compressionRatio).toBeLessThanOrEqual(1);

            // Property: Original size should be preserved in result
            expect(result.originalSize).toBe(fileSize);
          }
        ),
        { numRuns: 50 } // Run 50 iterations
      );
    });

    it('should compress documents exceeding 500KB to meet the limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate file sizes from 501KB to 10MB
          fc.integer({ min: 501, max: 10000 }),
          async (sizeKB) => {
            // Create a mock file exceeding the document size limit
            const fileSize = sizeKB * 1024;
            const mockFile = new File(
              ['x'.repeat(fileSize)],
              'test-document.jpg',
              { type: 'image/jpeg' }
            );

            // Compress the image
            const result = await compressImage(mockFile, DOCUMENT_IMAGE_COMPRESSION_OPTIONS);

            // Property: Compressed file should be at or below the limit
            const maxSizeBytes = DOCUMENT_IMAGE_COMPRESSION_OPTIONS.maxSizeKB * 1024;
            expect(result.compressedSize).toBeLessThanOrEqual(maxSizeBytes);

            // Property: Compression ratio should be less than 1 (file was compressed)
            expect(result.compressionRatio).toBeLessThanOrEqual(1);

            // Property: Original size should be preserved in result
            expect(result.originalSize).toBe(fileSize);
          }
        ),
        { numRuns: 50 } // Run 50 iterations
      );
    }, 10000); // Increase timeout to 10 seconds

    it('should not compress files already below the size limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate file sizes from 1KB to 199KB (below photo limit)
          fc.integer({ min: 1, max: 199 }),
          async (sizeKB) => {
            // Create a mock file below the size limit
            const fileSize = sizeKB * 1024;
            const mockFile = new File(
              ['x'.repeat(fileSize)],
              'test-photo.jpg',
              { type: 'image/jpeg' }
            );

            // Compress the image
            const result = await compressImage(mockFile, PHOTO_COMPRESSION_OPTIONS);

            // Property: File should remain unchanged (compression ratio = 1)
            expect(result.compressionRatio).toBe(1);

            // Property: Compressed size should equal original size
            expect(result.compressedSize).toBe(result.originalSize);

            // Property: Same file object should be returned
            expect(result.file).toBe(mockFile);
          }
        ),
        { numRuns: 50 } // Run 50 iterations
      );
    });

    it('should maintain aspect ratio during compression', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate various image dimensions (avoid very small dimensions)
          fc.integer({ min: 400, max: 4000 }),
          fc.integer({ min: 400, max: 4000 }),
          fc.integer({ min: 201, max: 1000 }), // File size
          async (width, height, sizeKB) => {
            // Calculate original aspect ratio
            const originalAspectRatio = width / height;
            
            // Create a mock file
            const fileSize = sizeKB * 1024;
            const mockFile = new File(
              ['x'.repeat(fileSize)],
              'test-photo.jpg',
              { type: 'image/jpeg' }
            );

            // Create a custom mock image for this test
            const mockImage = new MockImage();
            mockImage.width = width;
            mockImage.height = height;
            
            // Override Image constructor temporarily
            const OriginalImage = global.Image;
            global.Image = function() {
              return mockImage;
            } as any;

            try {
              // Compress the image
              const result = await compressImage(mockFile, PHOTO_COMPRESSION_OPTIONS);

              // Property: Aspect ratio should be maintained (within 5% tolerance for edge cases)
              const resultAspectRatio = result.width / result.height;
              const aspectRatioDiff = Math.abs(resultAspectRatio - originalAspectRatio);
              const tolerance = originalAspectRatio * 0.05; // 5% tolerance for rounding
              
              expect(aspectRatioDiff).toBeLessThanOrEqual(tolerance);
            } finally {
              // Restore original Image constructor
              global.Image = OriginalImage;
            }
          }
        ),
        { numRuns: 30 } // Run 30 iterations (fewer due to complexity)
      );
    });

    it('should respect maximum dimensions constraint', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate dimensions larger than max
          fc.integer({ min: 1000, max: 5000 }),
          fc.integer({ min: 1000, max: 5000 }),
          async (width, height) => {
            // Create a mock file
            const mockFile = new File(
              ['x'.repeat(300 * 1024)], // 300KB
              'test-photo.jpg',
              { type: 'image/jpeg' }
            );

            // Create a custom mock image for this test
            const mockImage = new MockImage();
            mockImage.width = width;
            mockImage.height = height;
            
            // Override Image constructor temporarily
            const OriginalImage = global.Image;
            global.Image = function() {
              return mockImage;
            } as any;

            try {
              // Compress with max dimensions
              const options: CompressionOptions = {
                ...PHOTO_COMPRESSION_OPTIONS,
                maxWidth: 800,
                maxHeight: 800,
              };

              const result = await compressImage(mockFile, options);

              // Property: Result dimensions should not exceed max dimensions
              expect(result.width).toBeLessThanOrEqual(options.maxWidth!);
              expect(result.height).toBeLessThanOrEqual(options.maxHeight!);
            } finally {
              // Restore original Image constructor
              global.Image = OriginalImage;
            }
          }
        ),
        { numRuns: 30 } // Run 30 iterations
      );
    });

    it('should handle various image formats', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate different image MIME types
          fc.constantFrom('image/jpeg', 'image/png', 'image/webp'),
          fc.integer({ min: 201, max: 1000 }),
          async (mimeType, sizeKB) => {
            // Create a mock file with specific MIME type
            const fileSize = sizeKB * 1024;
            const mockFile = new File(
              ['x'.repeat(fileSize)],
              `test-image.${mimeType.split('/')[1]}`,
              { type: mimeType }
            );

            // Compress the image
            const result = await compressImage(mockFile, {
              ...PHOTO_COMPRESSION_OPTIONS,
              mimeType,
            });

            // Property: Result file should have correct MIME type
            expect(result.file.type).toBe(mimeType);

            // Property: Compressed size should be at or below limit
            const maxSizeBytes = PHOTO_COMPRESSION_OPTIONS.maxSizeKB * 1024;
            expect(result.compressedSize).toBeLessThanOrEqual(maxSizeBytes);
          }
        ),
        { numRuns: 30 } // Run 30 iterations
      );
    });

    it('should correctly identify image files', () => {
      fc.assert(
        fc.property(
          // Generate various MIME types
          fc.constantFrom(
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'text/plain',
            'video/mp4'
          ),
          (mimeType) => {
            const file = new File(['test'], 'test-file', { type: mimeType });
            const result = isImageFile(file);

            // Property: Should return true only for image MIME types
            const expected = mimeType.startsWith('image/');
            expect(result).toBe(expected);
          }
        ),
        { numRuns: 50 } // Run 50 iterations
      );
    });

    it('should produce deterministic results for same input', async () => {
      // Create a specific test file
      const fileSize = 300 * 1024; // 300KB
      const mockFile = new File(
        ['x'.repeat(fileSize)],
        'test-photo.jpg',
        { type: 'image/jpeg' }
      );

      // Compress multiple times
      const result1 = await compressImage(mockFile, PHOTO_COMPRESSION_OPTIONS);
      const result2 = await compressImage(mockFile, PHOTO_COMPRESSION_OPTIONS);

      // Property: Results should be identical for same input
      expect(result1.compressedSize).toBe(result2.compressedSize);
      expect(result1.compressionRatio).toBe(result2.compressionRatio);
      expect(result1.width).toBe(result2.width);
      expect(result1.height).toBe(result2.height);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very small files (< 1KB)', async () => {
      const mockFile = new File(
        ['x'.repeat(500)], // 500 bytes
        'tiny-photo.jpg',
        { type: 'image/jpeg' }
      );

      const result = await compressImage(mockFile, PHOTO_COMPRESSION_OPTIONS);

      // Should not compress files already well below limit
      expect(result.compressionRatio).toBe(1);
      expect(result.file).toBe(mockFile);
    });

    it('should handle files exactly at the size limit', async () => {
      const exactSize = PHOTO_COMPRESSION_OPTIONS.maxSizeKB * 1024;
      const mockFile = new File(
        ['x'.repeat(exactSize)],
        'exact-size-photo.jpg',
        { type: 'image/jpeg' }
      );

      const result = await compressImage(mockFile, PHOTO_COMPRESSION_OPTIONS);

      // File at exact limit should not be compressed
      expect(result.compressionRatio).toBe(1);
    });
  });
});

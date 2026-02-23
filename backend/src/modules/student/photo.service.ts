import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import multer from 'multer';
import { Request } from 'express';
import { logger } from '@utils/logger';
import { FILE_UPLOAD } from '@config/constants';

/**
 * Student Photo Upload Service
 * Handles photo upload with compression (max 200KB)
 * Requirements: 2.12, 29.2
 * 
 * Features:
 * - Photo compression to max 200KB using sharp
 * - Organized directory structure: uploads/students/{studentId}/
 * - Unique filenames to prevent conflicts
 * - Support for JPEG, PNG, GIF formats
 * - Automatic thumbnail generation
 */

const UPLOAD_BASE_DIR = path.resolve(process.cwd(), 'uploads');
const STUDENT_PHOTOS_DIR = path.join(UPLOAD_BASE_DIR, 'students');
const STUDENT_DOCUMENTS_DIR = path.join(UPLOAD_BASE_DIR, 'documents', 'students');
const MAX_PHOTO_SIZE_BYTES = 200 * 1024; // 200KB
const THUMBNAIL_WIDTH = 150;
const THUMBNAIL_HEIGHT = 150;
const PHOTO_MAX_WIDTH = 800;
const PHOTO_MAX_HEIGHT = 800;

/**
 * Ensure directory exists, create if not
 */
function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Generate unique filename
 */
function generateUniqueFilename(originalName: string, prefix: string = ''): string {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}${timestamp}-${random}${ext}`;
}

/**
 * Multer storage configuration for temporary uploads
 */
const tempStorage = multer.memoryStorage();

/**
 * File filter for image uploads
 */
const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  if (FILE_UPLOAD.ALLOWED_IMAGE_TYPES.includes(file.mimetype as typeof FILE_UPLOAD.ALLOWED_IMAGE_TYPES[number])) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${FILE_UPLOAD.ALLOWED_IMAGE_TYPES.join(', ')}`));
  }
};

/**
 * File filter for document uploads
 */
const documentFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedTypes = [
    ...FILE_UPLOAD.ALLOWED_IMAGE_TYPES,
    ...FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES
  ];
  if (allowedTypes.includes(file.mimetype as any)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${allowedTypes.join(', ')}`));
  }
};

/**
 * Multer upload middleware for student photos
 */
export const photoUpload = multer({
  storage: tempStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE_BYTES, // 10MB max before compression
    files: 1
  }
});

/**
 * Multer upload middleware for student documents
 */
export const documentUpload = multer({
  storage: tempStorage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE_BYTES,
    files: 5 // Allow up to 5 documents at once
  }
});

class PhotoService {
  /**
   * Process and save student photo with compression
   * @param file - Uploaded file buffer from multer
   * @param studentId - Student ID for directory organization
   * @returns Object with photo URL and thumbnail URL
   */
  async processStudentPhoto(
    file: Express.Multer.File,
    studentId: number | string
  ): Promise<{ photoUrl: string; thumbnailUrl: string }> {
    try {
      const studentDir = path.join(STUDENT_PHOTOS_DIR, String(studentId));
      ensureDirectoryExists(studentDir);

      const filename = generateUniqueFilename(file.originalname, 'photo-');
      const photoPath = path.join(studentDir, filename);
      
      // Generate thumbnail filename
      const thumbFilename = `thumb-${filename}`;
      const thumbPath = path.join(studentDir, thumbFilename);

      // Process and compress the photo
      await this.compressAndSavePhoto(file.buffer, photoPath);
      
      // Generate thumbnail
      await this.generateThumbnail(file.buffer, thumbPath);

      // Generate relative URLs
      const photoUrl = `/uploads/students/${studentId}/${filename}`;
      const thumbnailUrl = `/uploads/students/${studentId}/${thumbFilename}`;

      logger.info('Student photo processed successfully', {
        studentId,
        photoUrl,
        thumbnailUrl,
        originalSize: file.size
      });

      return { photoUrl, thumbnailUrl };
    } catch (error) {
      logger.error('Error processing student photo', { error, studentId });
      throw new Error('Failed to process student photo');
    }
  }

  /**
   * Compress and save photo to max 200KB
   * @param buffer - Image buffer
   * @param outputPath - Output file path
   */
  private async compressAndSavePhoto(buffer: Buffer, outputPath: string): Promise<void> {
    let quality = 90;
    let outputBuffer: Buffer;

    // First resize to max dimensions
    let pipeline = sharp(buffer)
      .resize(PHOTO_MAX_WIDTH, PHOTO_MAX_HEIGHT, {
        fit: 'inside',
        withoutEnlargement: true
      });

    // Try JPEG compression with decreasing quality until under 200KB
    do {
      outputBuffer = await pipeline
        .jpeg({ quality, mozjpeg: true })
        .toBuffer();

      if (outputBuffer.length <= MAX_PHOTO_SIZE_BYTES) {
        break;
      }

      quality -= 10;
      
      // Re-create pipeline from original buffer for next iteration
      pipeline = sharp(buffer)
        .resize(PHOTO_MAX_WIDTH, PHOTO_MAX_HEIGHT, {
          fit: 'inside',
          withoutEnlargement: true
        });
    } while (quality > 10);

    // If still too large, resize further
    if (outputBuffer.length > MAX_PHOTO_SIZE_BYTES) {
      outputBuffer = await sharp(buffer)
        .resize(400, 400, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 60, mozjpeg: true })
        .toBuffer();
    }

    await fs.promises.writeFile(outputPath, outputBuffer);

    logger.debug('Photo compressed', {
      outputPath,
      finalSize: outputBuffer.length,
      maxSize: MAX_PHOTO_SIZE_BYTES
    });
  }

  /**
   * Generate thumbnail from image buffer
   * @param buffer - Image buffer
   * @param outputPath - Output file path
   */
  private async generateThumbnail(buffer: Buffer, outputPath: string): Promise<void> {
    await sharp(buffer)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
        fit: 'cover',
        position: 'centre'
      })
      .jpeg({ quality: 80 })
      .toBuffer()
      .then(thumbBuffer => fs.promises.writeFile(outputPath, thumbBuffer));
  }

  /**
   * Delete student photo and thumbnail
   * @param photoUrl - Photo URL to delete
   */
  async deleteStudentPhoto(photoUrl: string): Promise<void> {
    try {
      const photoPath = path.join(process.cwd(), photoUrl);
      const dir = path.dirname(photoPath);
      const filename = path.basename(photoPath);
      const thumbPath = path.join(dir, `thumb-${filename}`);

      // Delete photo
      if (fs.existsSync(photoPath)) {
        await fs.promises.unlink(photoPath);
      }

      // Delete thumbnail
      if (fs.existsSync(thumbPath)) {
        await fs.promises.unlink(thumbPath);
      }

      logger.info('Student photo deleted', { photoUrl });
    } catch (error) {
      logger.error('Error deleting student photo', { error, photoUrl });
      throw new Error('Failed to delete student photo');
    }
  }

  /**
   * Save student document (birth certificate, medical records, etc.)
   * @param file - Uploaded file
   * @param studentId - Student ID
   * @param category - Document category
   * @returns Document URL
   */
  async saveStudentDocument(
    file: Express.Multer.File,
    studentId: number | string,
    category: string = 'general'
  ): Promise<{ documentUrl: string; originalName: string; size: number; mimeType: string }> {
    try {
      const docDir = path.join(STUDENT_DOCUMENTS_DIR, String(studentId), category);
      ensureDirectoryExists(docDir);

      const filename = generateUniqueFilename(file.originalname, `${category}-`);
      const docPath = path.join(docDir, filename);

      await fs.promises.writeFile(docPath, file.buffer);

      const documentUrl = `/uploads/documents/students/${studentId}/${category}/${filename}`;

      logger.info('Student document saved', {
        studentId,
        category,
        documentUrl,
        originalName: file.originalname,
        size: file.size
      });

      return {
        documentUrl,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype
      };
    } catch (error) {
      logger.error('Error saving student document', { error, studentId, category });
      throw new Error('Failed to save student document');
    }
  }

  /**
   * Delete student document
   * @param documentUrl - Document URL to delete
   */
  async deleteStudentDocument(documentUrl: string): Promise<void> {
    try {
      const docPath = path.join(process.cwd(), documentUrl);

      if (fs.existsSync(docPath)) {
        await fs.promises.unlink(docPath);
        logger.info('Student document deleted', { documentUrl });
      }
    } catch (error) {
      logger.error('Error deleting student document', { error, documentUrl });
      throw new Error('Failed to delete student document');
    }
  }

  /**
   * Get photo URL for a student
   * @param studentId - Student ID
   * @returns Photo URL or null
   */
  getPhotoDirectory(studentId: number | string): string {
    return path.join(STUDENT_PHOTOS_DIR, String(studentId));
  }

  /**
   * List all documents for a student
   * @param studentId - Student ID
   * @param category - Optional category filter
   * @returns Array of document info
   */
  async listStudentDocuments(
    studentId: number | string,
    category?: string
  ): Promise<Array<{ filename: string; url: string; category: string }>> {
    try {
      const baseDir = path.join(STUDENT_DOCUMENTS_DIR, String(studentId));
      
      if (!fs.existsSync(baseDir)) {
        return [];
      }

      const documents: Array<{ filename: string; url: string; category: string }> = [];
      
      const categories = category 
        ? [category] 
        : await fs.promises.readdir(baseDir);

      for (const cat of categories) {
        const catDir = path.join(baseDir, cat);
        
        if (!fs.existsSync(catDir) || !(await fs.promises.stat(catDir)).isDirectory()) {
          continue;
        }

        const files = await fs.promises.readdir(catDir);
        
        for (const file of files) {
          documents.push({
            filename: file,
            url: `/uploads/documents/students/${studentId}/${cat}/${file}`,
            category: cat
          });
        }
      }

      return documents;
    } catch (error) {
      logger.error('Error listing student documents', { error, studentId });
      throw new Error('Failed to list student documents');
    }
  }
}

export default new PhotoService();

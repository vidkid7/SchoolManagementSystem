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
const DOCUMENT_CATEGORY_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

function assertSafeDocumentCategory(category: string): void {
  if (!DOCUMENT_CATEGORY_PATTERN.test(category)) {
    throw new Error('Invalid document category');
  }
}

function assertPathIsWithin(parentPath: string, childPath: string): void {
  const resolvedParent = path.resolve(parentPath);
  const resolvedChild = path.resolve(childPath);
  if (!resolvedChild.startsWith(`${resolvedParent}${path.sep}`)) {
    throw new Error('Document path is outside the allowed directory');
  }
}

interface StudentDocumentMetadata {
  name: string;
  originalName: string;
  size: number;
  mimeType: string;
  expiryDate?: string;
  createdAt: string;
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

async function readDocumentMetadata(documentPath: string): Promise<Partial<StudentDocumentMetadata>> {
  try {
    const text = await fs.promises.readFile(`${documentPath}.meta.json`, 'utf8');
    const parsed = JSON.parse(text) as Partial<StudentDocumentMetadata>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

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
    files: 10 // Bulk document upload supports up to 10 files; route-level limits constrain single uploads.
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
    category: string = 'general',
    options: { name?: string; expiryDate?: string } = {}
  ): Promise<{ documentUrl: string; originalName: string; name: string; size: number; mimeType: string; category: string; expiryDate?: string; createdAt: string }> {
    try {
      assertSafeDocumentCategory(category);
      const normalizedStudentId = String(studentId);
      if (!/^[1-9]\d*$/.test(normalizedStudentId)) {
        throw new Error('Invalid student id');
      }
      if (options.expiryDate !== undefined && !isValidDateOnly(options.expiryDate)) {
        throw new Error('Invalid expiry date');
      }

      const studentDir = path.resolve(STUDENT_DOCUMENTS_DIR, normalizedStudentId);
      assertPathIsWithin(STUDENT_DOCUMENTS_DIR, studentDir);
      const docDir = path.resolve(studentDir, category);
      assertPathIsWithin(studentDir, docDir);
      ensureDirectoryExists(docDir);

      const filename = generateUniqueFilename(file.originalname, `${category}-`);
      const docPath = path.join(docDir, filename);

      await fs.promises.writeFile(docPath, file.buffer);

      const createdAt = new Date().toISOString();
      const metadata: StudentDocumentMetadata = {
        name: options.name?.trim() || file.originalname,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        expiryDate: options.expiryDate,
        createdAt,
      };
      try {
        await fs.promises.writeFile(`${docPath}.meta.json`, JSON.stringify(metadata), 'utf8');
      } catch (metadataError) {
        await fs.promises.unlink(docPath).catch(() => undefined);
        throw metadataError;
      }

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
        name: metadata.name,
        size: file.size,
        mimeType: file.mimetype,
        category,
        expiryDate: options.expiryDate,
        createdAt,
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
      const normalizedUrl = documentUrl.replace(/\\/g, '/');
      if (!normalizedUrl.startsWith('/uploads/documents/students/')) {
        throw new Error('Invalid student document path');
      }
      const docPath = path.resolve(process.cwd(), `.${normalizedUrl}`);
      assertPathIsWithin(STUDENT_DOCUMENTS_DIR, docPath);

      if (fs.existsSync(docPath)) {
        await fs.promises.unlink(docPath);
        await fs.promises.unlink(`${docPath}.meta.json`).catch(() => undefined);
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
  ): Promise<Array<{ filename: string; url: string; category: string; name: string; originalName: string; size: number; mimeType: string; expiryDate?: string; createdAt: string }>> {
    try {
      const normalizedStudentId = String(studentId);
      if (!/^[1-9]\d*$/.test(normalizedStudentId)) {
        throw new Error('Invalid student id');
      }
      if (category !== undefined) assertSafeDocumentCategory(category);

      const baseDir = path.resolve(STUDENT_DOCUMENTS_DIR, normalizedStudentId);
      assertPathIsWithin(STUDENT_DOCUMENTS_DIR, baseDir);
      
      if (!fs.existsSync(baseDir)) {
        return [];
      }

      const documents: Array<{ filename: string; url: string; category: string; name: string; originalName: string; size: number; mimeType: string; expiryDate?: string; createdAt: string }> = [];
      
      const categories = category 
        ? [category] 
        : await fs.promises.readdir(baseDir);

      for (const cat of categories) {
        assertSafeDocumentCategory(cat);
        const catDir = path.resolve(baseDir, cat);
        assertPathIsWithin(baseDir, catDir);
        
        if (!fs.existsSync(catDir) || !(await fs.promises.stat(catDir)).isDirectory()) {
          continue;
        }

        const files = (await fs.promises.readdir(catDir)).filter((file) => !file.endsWith('.meta.json'));
        
        for (const file of files) {
          const filePath = path.join(catDir, file);
          const fileStat = await fs.promises.stat(filePath);
          if (!fileStat.isFile()) continue;
          const metadata = await readDocumentMetadata(filePath);
          documents.push({
            filename: file,
            url: `/uploads/documents/students/${studentId}/${cat}/${file}`,
            category: cat,
            name: metadata.name || metadata.originalName || file,
            originalName: metadata.originalName || file,
            size: typeof metadata.size === 'number' ? metadata.size : fileStat.size,
            mimeType: metadata.mimeType || 'application/octet-stream',
            expiryDate: metadata.expiryDate,
            createdAt: metadata.createdAt || fileStat.birthtime.toISOString(),
          });
        }
      }

      return documents;
    } catch (error) {
      logger.error('Error listing student documents', { error, studentId });
      throw new Error('Failed to list student documents');
    }
  }

  async readStudentDocumentFile(
    studentId: number | string,
    category: string,
    filename: string
  ): Promise<{ buffer: Buffer; mimeType: string }> {
    try {
      const normalizedStudentId = String(studentId);
      if (!/^[1-9]\d*$/.test(normalizedStudentId)) throw new Error('Invalid student id');
      assertSafeDocumentCategory(category);
      if (!filename || filename !== path.basename(filename) || filename.endsWith('.meta.json')) {
        throw new Error('Invalid document filename');
      }
      const studentDir = path.resolve(STUDENT_DOCUMENTS_DIR, normalizedStudentId);
      const categoryDir = path.resolve(studentDir, category);
      const filePath = path.resolve(categoryDir, filename);
      assertPathIsWithin(STUDENT_DOCUMENTS_DIR, studentDir);
      assertPathIsWithin(studentDir, categoryDir);
      assertPathIsWithin(categoryDir, filePath);
      const stat = await fs.promises.stat(filePath);
      if (!stat.isFile()) throw new Error('Document not found');
      const metadata = await readDocumentMetadata(filePath);
      return {
        buffer: await fs.promises.readFile(filePath),
        mimeType: metadata.mimeType || 'application/octet-stream',
      };
    } catch (error) {
      logger.error('Error reading student document', { error, studentId });
      throw new Error('Failed to read student document');
    }
  }
}

export default new PhotoService();

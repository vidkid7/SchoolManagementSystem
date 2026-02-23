/**
 * Message Attachment Service
 * 
 * Handles file uploads for message attachments
 * 
 * Requirements: 24.4
 * 
 * Features:
 * - Support for images, documents, videos, and audio files
 * - Secure file storage with organized directory structure
 * - File size validation (max 10MB per file, max 5 files per message)
 * - Automatic file type detection
 * - Image compression for photos
 */

import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import multer from 'multer';
import { Request } from 'express';
import { logger } from '@utils/logger';
import { FILE_UPLOAD } from '@config/constants';

const UPLOAD_BASE_DIR = path.resolve(process.cwd(), 'uploads');
const ATTACHMENTS_DIR = path.join(UPLOAD_BASE_DIR, 'attachments', 'messages');
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB for images
const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGE_HEIGHT = 1920;

/**
 * Attachment metadata interface
 */
export interface AttachmentMetadata {
  type: 'image' | 'document' | 'video' | 'audio';
  url: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
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
function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 12);
  return `${timestamp}-${random}${ext}`;
}

/**
 * Determine file type from MIME type
 */
function getFileType(mimeType: string): 'image' | 'document' | 'video' | 'audio' {
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType.startsWith('video/')) {
    return 'video';
  } else if (mimeType.startsWith('audio/')) {
    return 'audio';
  } else {
    return 'document';
  }
}

/**
 * Multer storage configuration for temporary uploads
 */
const tempStorage = multer.memoryStorage();

/**
 * File filter for message attachments
 * Allows images, documents, videos, and audio files
 */
const attachmentFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
): void => {
  const allowedTypes = [
    // Images
    ...FILE_UPLOAD.ALLOWED_IMAGE_TYPES,
    // Documents
    ...FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES,
    // Videos
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/webm',
    // Audio
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/webm',
    'audio/aac',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(
      `Invalid file type: ${file.mimetype}. Allowed types: images, documents, videos, and audio files.`
    ));
  }
};

/**
 * Multer upload middleware for message attachments
 * Allows up to 5 files per message, max 10MB each
 */
export const attachmentUpload = multer({
  storage: tempStorage,
  fileFilter: attachmentFileFilter,
  limits: {
    fileSize: FILE_UPLOAD.MAX_SIZE_BYTES, // 10MB max per file
    files: 5 // Max 5 files per message
  }
});

class AttachmentService {
  /**
   * Process and save message attachment
   * @param file - Uploaded file buffer from multer
   * @param userId - User ID for directory organization
   * @returns Attachment metadata
   */
  async processAttachment(
    file: Express.Multer.File,
    userId: number | string
  ): Promise<AttachmentMetadata> {
    try {
      // Create user-specific directory for organization
      const userDir = path.join(ATTACHMENTS_DIR, String(userId));
      ensureDirectoryExists(userDir);

      const filename = generateUniqueFilename(file.originalname);
      const filePath = path.join(userDir, filename);
      const fileType = getFileType(file.mimetype);

      // Process based on file type
      if (fileType === 'image') {
        await this.processAndSaveImage(file.buffer, filePath);
      } else {
        // Save other file types directly
        await fs.promises.writeFile(filePath, file.buffer);
      }

      // Get final file size
      const stats = await fs.promises.stat(filePath);
      const fileUrl = `/uploads/attachments/messages/${userId}/${filename}`;

      const metadata: AttachmentMetadata = {
        type: fileType,
        url: fileUrl,
        name: file.originalname,
        size: stats.size,
        mimeType: file.mimetype,
        uploadedAt: new Date()
      };

      logger.info('Message attachment processed successfully', {
        userId,
        filename: file.originalname,
        type: fileType,
        size: stats.size,
        url: fileUrl
      });

      return metadata;
    } catch (error) {
      logger.error('Error processing message attachment', { 
        error, 
        userId,
        filename: file.originalname 
      });
      throw new Error('Failed to process message attachment');
    }
  }

  /**
   * Process and save image with compression if needed
   * @param buffer - Image buffer
   * @param outputPath - Output file path
   */
  private async processAndSaveImage(buffer: Buffer, outputPath: string): Promise<void> {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();

      // Check if image needs resizing or compression
      const needsResize = 
        (metadata.width && metadata.width > MAX_IMAGE_WIDTH) ||
        (metadata.height && metadata.height > MAX_IMAGE_HEIGHT);
      
      const needsCompression = buffer.length > MAX_IMAGE_SIZE_BYTES;

      if (!needsResize && !needsCompression) {
        // Save original if it's already within limits
        await fs.promises.writeFile(outputPath, buffer);
        return;
      }

      // Resize and/or compress
      let quality = 85;
      let outputBuffer: Buffer;

      do {
        const pipeline = sharp(buffer);

        if (needsResize) {
          pipeline.resize(MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT, {
            fit: 'inside',
            withoutEnlargement: true
          });
        }

        // Convert to JPEG for better compression
        outputBuffer = await pipeline
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();

        if (outputBuffer.length <= MAX_IMAGE_SIZE_BYTES) {
          break;
        }

        quality -= 10;
      } while (quality > 30);

      await fs.promises.writeFile(outputPath, outputBuffer);

      logger.debug('Image compressed', {
        outputPath,
        originalSize: buffer.length,
        finalSize: outputBuffer.length,
        quality
      });
    } catch (error) {
      logger.error('Error processing image', { error, outputPath });
      throw error;
    }
  }

  /**
   * Process multiple attachments
   * @param files - Array of uploaded files
   * @param userId - User ID
   * @returns Array of attachment metadata
   */
  async processMultipleAttachments(
    files: Express.Multer.File[],
    userId: number | string
  ): Promise<AttachmentMetadata[]> {
    const attachments: AttachmentMetadata[] = [];

    for (const file of files) {
      try {
        const metadata = await this.processAttachment(file, userId);
        attachments.push(metadata);
      } catch (error) {
        logger.error('Error processing attachment in batch', {
          error,
          filename: file.originalname,
          userId
        });
        // Continue processing other files even if one fails
      }
    }

    return attachments;
  }

  /**
   * Delete attachment file
   * @param attachmentUrl - Attachment URL to delete
   */
  async deleteAttachment(attachmentUrl: string): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), attachmentUrl);

      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        logger.info('Attachment deleted', { attachmentUrl });
      }
    } catch (error) {
      logger.error('Error deleting attachment', { error, attachmentUrl });
      throw new Error('Failed to delete attachment');
    }
  }

  /**
   * Delete multiple attachments
   * @param attachments - Array of attachment metadata
   */
  async deleteMultipleAttachments(attachments: AttachmentMetadata[]): Promise<void> {
    for (const attachment of attachments) {
      try {
        await this.deleteAttachment(attachment.url);
      } catch (error) {
        logger.error('Error deleting attachment in batch', {
          error,
          url: attachment.url
        });
        // Continue deleting other files even if one fails
      }
    }
  }

  /**
   * Validate attachment metadata
   * @param attachments - Array of attachment metadata to validate
   * @returns True if valid, throws error otherwise
   */
  validateAttachments(attachments: any[]): boolean {
    if (!Array.isArray(attachments)) {
      throw new Error('Attachments must be an array');
    }

    if (attachments.length > 5) {
      throw new Error('Maximum 5 attachments allowed per message');
    }

    for (const attachment of attachments) {
      if (!attachment.type || !attachment.url || !attachment.name || !attachment.size) {
        throw new Error('Invalid attachment metadata');
      }

      if (!['image', 'document', 'video', 'audio'].includes(attachment.type)) {
        throw new Error(`Invalid attachment type: ${attachment.type}`);
      }

      if (attachment.size > FILE_UPLOAD.MAX_SIZE_BYTES) {
        throw new Error(`Attachment ${attachment.name} exceeds maximum size of ${FILE_UPLOAD.MAX_SIZE_MB}MB`);
      }
    }

    return true;
  }

  /**
   * Get attachment file path from URL
   * @param attachmentUrl - Attachment URL
   * @returns Full file path
   */
  getAttachmentPath(attachmentUrl: string): string {
    return path.join(process.cwd(), attachmentUrl);
  }

  /**
   * Check if attachment file exists
   * @param attachmentUrl - Attachment URL
   * @returns True if file exists
   */
  attachmentExists(attachmentUrl: string): boolean {
    const filePath = this.getAttachmentPath(attachmentUrl);
    return fs.existsSync(filePath);
  }
}

export const attachmentService = new AttachmentService();
export default attachmentService;

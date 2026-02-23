/**
 * Attachment Integration Tests
 * 
 * Integration tests for file attachment upload endpoints
 * 
 * Requirements: 24.4
 */

import request from 'supertest';
import express, { Express, Response, NextFunction } from 'express';
import { communicationController } from '../communication.controller';

// Mock authentication middleware
const mockAuthenticate = (req: any, _res: Response, next: NextFunction) => {
  req.user = { userId: 1, role: 'student' };
  next();
};

// Mock socket service
jest.mock('../../../services/socket.service', () => ({
  socketService: {
    emitToUser: jest.fn(),
    isUserOnline: jest.fn(() => false),
    getOnlineUserIds: jest.fn(() => []),
  },
}));

// Mock attachment service
jest.mock('../attachment.service', () => ({
  attachmentService: {
    processMultipleAttachments: jest.fn().mockImplementation(async (files: Express.Multer.File[], userId: number | string) => {
      return files.map((file: Express.Multer.File) => {
        let type: 'image' | 'document' | 'video' | 'audio' = 'document';
        if (file.mimetype.startsWith('image/')) {
          type = 'image';
        } else if (file.mimetype.startsWith('video/')) {
          type = 'video';
        } else if (file.mimetype.startsWith('audio/')) {
          type = 'audio';
        }
        return {
          type,
          url: `/uploads/attachments/messages/${userId}/${file.originalname}`,
          name: file.originalname,
          size: file.size,
          mimeType: file.mimetype,
          uploadedAt: new Date(),
        };
      });
    }),
    deleteAttachment: jest.fn().mockResolvedValue(undefined),
    validateAttachments: jest.fn().mockReturnValue(true),
  },
}));

describe('Attachment Integration Tests', () => {
  let app: Express;

  beforeEach(() => {
    // Set up Express app with controller methods directly
    app = express();
    app.use(express.json());

    // Mock multer to simulate file uploads
    const mockUpload = (req: any, _res: Response, next: NextFunction) => {
      // Simulate uploaded files
      if (req.headers['x-mock-files']) {
        const files = JSON.parse(req.headers['x-mock-files'] as string);
        req.files = files;
      } else {
        req.files = [];
      }
      next();
    };

    // Attachment routes with authentication
    app.post(
      '/api/v1/communication/attachments',
      mockAuthenticate,
      mockUpload,
      communicationController.uploadAttachments.bind(communicationController)
    );
    app.delete(
      '/api/v1/communication/attachments',
      mockAuthenticate,
      communicationController.deleteAttachment.bind(communicationController)
    );
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/communication/attachments', () => {
    it('should upload a single file attachment', async () => {
      const mockFiles = [
        {
          fieldname: 'files',
          originalname: 'test-file.txt',
          mimetype: 'text/plain',
          size: 100,
          buffer: Buffer.from('test content'),
        },
      ];

      const response = await request(app)
        .post('/api/v1/communication/attachments')
        .set('x-mock-files', JSON.stringify(mockFiles));

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.attachments).toHaveLength(1);
      expect(response.body.data.attachments[0]).toHaveProperty('type', 'document');
      expect(response.body.data.attachments[0]).toHaveProperty('name', 'test-file.txt');
    });

    it('should upload multiple file attachments', async () => {
      const mockFiles = [
        {
          fieldname: 'files',
          originalname: 'file1.pdf',
          mimetype: 'application/pdf',
          size: 1000,
          buffer: Buffer.from('pdf content'),
        },
        {
          fieldname: 'files',
          originalname: 'file2.jpg',
          mimetype: 'image/jpeg',
          size: 2000,
          buffer: Buffer.from('image content'),
        },
      ];

      const response = await request(app)
        .post('/api/v1/communication/attachments')
        .set('x-mock-files', JSON.stringify(mockFiles));

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.attachments).toHaveLength(2);
      expect(response.body.data.attachments[0].type).toBe('document');
      expect(response.body.data.attachments[1].type).toBe('image');
    });

    it('should return 400 when no files are provided', async () => {
      const response = await request(app)
        .post('/api/v1/communication/attachments')
        .set('x-mock-files', JSON.stringify([]));

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_FILES');
    });

    it('should return 401 when user is not authenticated', async () => {
      const appUnauthorized = express();
      appUnauthorized.use(express.json());
      appUnauthorized.post(
        '/api/v1/communication/attachments',
        communicationController.uploadAttachments.bind(communicationController)
      );

      const response = await request(appUnauthorized)
        .post('/api/v1/communication/attachments')
        .set('x-mock-files', JSON.stringify([]));

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/communication/attachments', () => {
    it('should delete an attachment', async () => {
      const attachmentUrl = '/uploads/attachments/messages/1/test-delete.txt';

      const response = await request(app)
        .delete('/api/v1/communication/attachments')
        .send({ attachmentUrl });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 when attachment URL is missing', async () => {
      const response = await request(app)
        .delete('/api/v1/communication/attachments')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 when trying to delete another user\'s attachment', async () => {
      const attachmentUrl = '/uploads/attachments/messages/999/other-user-file.txt';

      const response = await request(app)
        .delete('/api/v1/communication/attachments')
        .send({ attachmentUrl });

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should handle deleting non-existent file gracefully', async () => {
      const attachmentUrl = '/uploads/attachments/messages/1/nonexistent.txt';

      const response = await request(app)
        .delete('/api/v1/communication/attachments')
        .send({ attachmentUrl });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('File Type Validation', () => {
    it('should correctly identify image files', async () => {
      const mockFiles = [
        {
          fieldname: 'files',
          originalname: 'photo.jpg',
          mimetype: 'image/jpeg',
          size: 5000,
          buffer: Buffer.from('image'),
        },
      ];

      const response = await request(app)
        .post('/api/v1/communication/attachments')
        .set('x-mock-files', JSON.stringify(mockFiles));

      expect(response.status).toBe(201);
      expect(response.body.data.attachments[0].type).toBe('image');
    });

    it('should correctly identify document files', async () => {
      const mockFiles = [
        {
          fieldname: 'files',
          originalname: 'document.pdf',
          mimetype: 'application/pdf',
          size: 5000,
          buffer: Buffer.from('pdf'),
        },
        {
          fieldname: 'files',
          originalname: 'document.docx',
          mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          size: 5000,
          buffer: Buffer.from('docx'),
        },
      ];

      const response = await request(app)
        .post('/api/v1/communication/attachments')
        .set('x-mock-files', JSON.stringify(mockFiles));

      expect(response.status).toBe(201);
      expect(response.body.data.attachments[0].type).toBe('document');
      expect(response.body.data.attachments[1].type).toBe('document');
    });

    it('should correctly identify video files', async () => {
      const mockFiles = [
        {
          fieldname: 'files',
          originalname: 'video.mp4',
          mimetype: 'video/mp4',
          size: 50000,
          buffer: Buffer.from('video'),
        },
      ];

      const response = await request(app)
        .post('/api/v1/communication/attachments')
        .set('x-mock-files', JSON.stringify(mockFiles));

      expect(response.status).toBe(201);
      expect(response.body.data.attachments[0].type).toBe('video');
    });

    it('should correctly identify audio files', async () => {
      const mockFiles = [
        {
          fieldname: 'files',
          originalname: 'audio.mp3',
          mimetype: 'audio/mpeg',
          size: 5000,
          buffer: Buffer.from('audio'),
        },
      ];

      const response = await request(app)
        .post('/api/v1/communication/attachments')
        .set('x-mock-files', JSON.stringify(mockFiles));

      expect(response.status).toBe(201);
      expect(response.body.data.attachments[0].type).toBe('audio');
    });
  });
});
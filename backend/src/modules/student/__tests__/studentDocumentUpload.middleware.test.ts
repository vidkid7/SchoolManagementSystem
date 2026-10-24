import express from 'express';
import request from 'supertest';
import { documentUpload } from '../photo.service';

function createUploadApp() {
  const app = express();
  app.post('/single', documentUpload.array('documents', 5), (req, res) => {
    res.json({ count: (req.files as Express.Multer.File[]).length });
  });
  app.post('/bulk', documentUpload.array('documents', 10), (req, res) => {
    res.json({ count: (req.files as Express.Multer.File[]).length });
  });
  app.use((error: { code?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    res.status(400).json({ code: error.code });
  });
  return app;
}

function attachPdfFiles(upload: request.Test, count: number) {
  for (let index = 0; index < count; index += 1) {
    upload.attach('documents', Buffer.from(`pdf-${index}`), {
      filename: `document-${index}.pdf`,
      contentType: 'application/pdf',
    });
  }
  return upload;
}

describe('student document upload count limits', () => {
  const app = createUploadApp();

  it('allows ten files on the bulk upload route', async () => {
    const response = await attachPdfFiles(request(app).post('/bulk'), 10);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ count: 10 });
  });

  it('keeps the ordinary upload route capped at five files', async () => {
    const response = await attachPdfFiles(request(app).post('/single'), 6);
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('LIMIT_UNEXPECTED_FILE');
  });

  it('rejects more than ten files on the bulk upload route', async () => {
    const response = await attachPdfFiles(request(app).post('/bulk'), 11);
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('LIMIT_FILE_COUNT');
  });
});

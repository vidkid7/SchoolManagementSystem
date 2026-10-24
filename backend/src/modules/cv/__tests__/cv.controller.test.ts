import express from 'express';
import request from 'supertest';
import CVController from '../cv.controller';
import CVService from '../cv.service';
import { errorHandler } from '@middleware/errorHandler';

jest.mock('../cv.service', () => ({
  __esModule: true,
  default: {
    getCVData: jest.fn(),
    getOrCreateCustomization: jest.fn(),
    updateCustomization: jest.fn(),
    needsRegeneration: jest.fn(),
    generatePDF: jest.fn(),
    markGenerated: jest.fn(),
  },
}));

const service = CVService as jest.Mocked<typeof CVService>;
const app = express();
app.use(express.json());
app.get('/cv/:id/data', CVController.getCVData);
app.get('/cv/:id/needs-regeneration', CVController.checkNeedsRegeneration);
app.get('/cv/:id/download', CVController.downloadPDF);
app.post('/cv/:id/regenerate', CVController.regeneratePDF);
app.get('/cv/:id', CVController.getCustomization);
app.put('/cv/:id', CVController.updateCustomization);
app.use(errorHandler);

describe('CVController', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the current customization for a student', async () => {
    const customization = { studentId: 17, templateId: 'standard', skills: ['Reading'] };
    service.getOrCreateCustomization.mockResolvedValue(customization as any);

    const response = await request(app).get('/cv/17');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, data: customization });
    expect(service.getOrCreateCustomization).toHaveBeenCalledWith(17);
  });

  it('updates customization with the path student ID and request body', async () => {
    const updates = { templateId: 'modern', showAttendance: false };
    service.updateCustomization.mockResolvedValue({ studentId: 17, ...updates } as any);

    const response = await request(app).put('/cv/17').send(updates);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ studentId: 17, ...updates });
    expect(service.updateCustomization).toHaveBeenCalledWith(17, updates);
  });

  it('returns compiled CV data and maps missing students to 404', async () => {
    service.getCVData.mockResolvedValueOnce({ student: { studentId: 17 }, grades: [] } as any);
    const found = await request(app).get('/cv/17/data');
    expect(found.status).toBe(200);
    expect(found.body.data).toMatchObject({ student: { studentId: 17 }, grades: [] });

    service.getCVData.mockResolvedValueOnce(null);
    const missing = await request(app).get('/cv/999/data');
    expect(missing.status).toBe(404);
    expect(missing.body.success).toBe(false);
  });

  it('returns the regeneration decision', async () => {
    service.needsRegeneration.mockResolvedValue(true);

    const response = await request(app).get('/cv/17/needs-regeneration');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({ needsRegeneration: true });
    expect(service.needsRegeneration).toHaveBeenCalledWith(17);
  });

  it('streams a generated PDF with attachment headers and selected options', async () => {
    const pdf = Buffer.from('%PDF-1.4 QA');
    service.generatePDF.mockResolvedValue(pdf);

    const response = await request(app)
      .get('/cv/17/download')
      .query({ template: 'modern', branding: 'true', photo: 'false', attendance: 'false', grades: 'true', eca: 'false' });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/pdf');
    expect(response.headers['content-disposition']).toMatch(/^attachment; filename=CV_17_/);
    expect(service.generatePDF).toHaveBeenCalledWith(17, expect.objectContaining({
      templateId: 'modern',
      schoolBrandingEnabled: true,
      includePhoto: false,
      includeAttendance: false,
      includeGrades: true,
      includeECA: false,
    }));
    expect(response.body).toEqual(pdf);
  });

  it('regenerates a PDF and records the generated state', async () => {
    const pdf = Buffer.from('%PDF-1.4 QA');
    service.generatePDF.mockResolvedValue(pdf);

    const response = await request(app).post('/cv/17/regenerate').query({ template: 'modern', branding: 'true' });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/pdf');
    expect(service.generatePDF).toHaveBeenCalledWith(17, {
      templateId: 'modern',
      schoolBrandingEnabled: true,
      includePersonalInfo: true,
      includeAttendance: true,
      includeGrades: true,
      includeECA: true,
      includeSports: true,
      includeCertificates: true,
    });
    expect(service.markGenerated).toHaveBeenCalledWith(17);
    expect(response.body).toEqual(pdf);
  });

  it('applies hidden section options during PDF regeneration', async () => {
    service.generatePDF.mockResolvedValue(Buffer.from('%PDF-1.4 QA'));

    await request(app).post('/cv/17/regenerate').query({
      personalInfo: 'false', attendance: 'false', grades: 'false', eca: 'false', sports: 'false', certificates: 'false',
    });

    expect(service.generatePDF).toHaveBeenCalledWith(17, expect.objectContaining({
      includePersonalInfo: false,
      includeAttendance: false,
      includeGrades: false,
      includeECA: false,
      includeSports: false,
      includeCertificates: false,
    }));
  });
});

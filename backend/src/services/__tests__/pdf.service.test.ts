import fs from 'fs';
import pdfService from '../pdf.service';
import Student from '@models/Student.model';
import { Term } from '@models/AcademicYear.model';

jest.mock('@models/Student.model', () => ({
  __esModule: true,
  default: {
    findByPk: jest.fn()
  }
}));

jest.mock('@models/AcademicYear.model', () => ({
  __esModule: true,
  Term: {
    findByPk: jest.fn()
  }
}));

describe('PDFService', () => {
  const service = pdfService as unknown as {
    generateSimpleDocument: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service.generateSimpleDocument = jest.fn().mockResolvedValue(undefined);
  });

  describe('generateReportCard', () => {
    it('generates report card path for valid student and term', async () => {
      (Student.findByPk as jest.Mock).mockResolvedValue({
        studentCode: 'STD001',
        currentClassId: 8,
        admissionClass: 7,
        getFullNameEn: () => 'Test Student'
      });
      (Term.findByPk as jest.Mock).mockResolvedValue({ name: 'First Term' });

      const result = await pdfService.generateReportCard(1, 2);

      expect(result).toMatch(/^\/uploads\/documents\/report-cards\/report-card-1-2-\d+\.pdf$/);
      expect(Student.findByPk).toHaveBeenCalledWith(1);
      expect(Term.findByPk).toHaveBeenCalledWith(2);
      expect(service.generateSimpleDocument).toHaveBeenCalledTimes(1);
    });

    it('throws when student is missing', async () => {
      (Student.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(pdfService.generateReportCard(999, 2)).rejects.toThrow('Student not found');
    });

    it('throws when term is missing', async () => {
      (Student.findByPk as jest.Mock).mockResolvedValue({
        studentCode: 'STD001',
        currentClassId: 8,
        admissionClass: 7,
        getFullNameEn: () => 'Test Student'
      });
      (Term.findByPk as jest.Mock).mockResolvedValue(null);

      await expect(pdfService.generateReportCard(1, 999)).rejects.toThrow('Term not found');
    });
  });

  describe('generateCertificate', () => {
    it('generates certificate path for valid student', async () => {
      (Student.findByPk as jest.Mock).mockResolvedValue({
        studentCode: 'STD001',
        getFullNameEn: () => 'Test Student'
      });

      const result = await pdfService.generateCertificate('character_certificate', 1);

      expect(result).toMatch(/^\/uploads\/documents\/certificates\/certificate-character_certificate-1-\d+\.pdf$/);
      expect(service.generateSimpleDocument).toHaveBeenCalledTimes(1);
    });
  });

  describe('deletePDF', () => {
    it('deletes an existing PDF file', async () => {
      const accessSpy = jest.spyOn(fs.promises, 'access').mockResolvedValue(undefined);
      const unlinkSpy = jest.spyOn(fs.promises, 'unlink').mockResolvedValue(undefined);

      await pdfService.deletePDF('/uploads/documents/test.pdf');

      expect(accessSpy).toHaveBeenCalledTimes(1);
      expect(unlinkSpy).toHaveBeenCalledTimes(1);

      accessSpy.mockRestore();
      unlinkSpy.mockRestore();
    });

    it('does not throw when file does not exist', async () => {
      const error = Object.assign(new Error('File not found'), { code: 'ENOENT' });
      const accessSpy = jest.spyOn(fs.promises, 'access').mockRejectedValue(error);

      await expect(pdfService.deletePDF('/uploads/documents/missing.pdf')).resolves.toBeUndefined();

      accessSpy.mockRestore();
    });
  });
});

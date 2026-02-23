import { Request, Response, NextFunction } from 'express';
import reportService from './report.service';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

class ReportController {
  async getEnrollmentReport(req: Request, res: Response) {
    try {
      const report = await reportService.generateEnrollmentReport(req.query);
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  async getAttendanceReport(req: Request, res: Response) {
    try {
      const report = await reportService.generateAttendanceReport(req.query as any);
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  async getFeeCollectionReport(req: Request, res: Response) {
    try {
      const report = await reportService.generateFeeCollectionReport(req.query as any);
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  async getExaminationReport(req: Request, res: Response) {
    try {
      const report = await reportService.generateExaminationReport(req.query);
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  async getTeacherPerformanceReport(req: Request, res: Response) {
    try {
      const report = await reportService.generateTeacherPerformanceReport(req.query as any);
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  async getLibraryReport(req: Request, res: Response) {
    try {
      const report = await reportService.generateLibraryReport(req.query as any);
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  async getECAReport(req: Request, res: Response) {
    try {
      const report = await reportService.generateECAReport(req.query);
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  async getSportsReport(req: Request, res: Response) {
    try {
      const report = await reportService.generateSportsReport(req.query);
      res.json({ success: true, data: report });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const { role, userId } = req.user as any;
      const data = await reportService.getDashboardData(role, userId);
      res.json({ success: true, data });
    } catch (error: any) {
      next(error);
    }
  }

  async exportReportToExcel(req: Request, res: Response): Promise<void> {
    try {
      const { reportType } = req.params;
      let report: any;

      switch (reportType) {
        case 'enrollment':
          report = await reportService.generateEnrollmentReport(req.query);
          break;
        case 'attendance':
          report = await reportService.generateAttendanceReport(req.query as any);
          break;
        case 'fee-collection':
          report = await reportService.generateFeeCollectionReport(req.query as any);
          break;
        case 'examination':
          report = await reportService.generateExaminationReport(req.query);
          break;
        case 'library':
          report = await reportService.generateLibraryReport(req.query as any);
          break;
        case 'eca':
          report = await reportService.generateECAReport(req.query);
          break;
        case 'sports':
          report = await reportService.generateSportsReport(req.query);
          break;
        default:
          res.status(400).json({ success: false, error: { message: 'Invalid report type' } });
          return;
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Report');

      worksheet.columns = [
        { header: 'Metric', key: 'metric', width: 30 },
        { header: 'Value', key: 'value', width: 20 },
      ];

      Object.entries(report).forEach(([key, value]) => {
        if (typeof value !== 'object') {
          worksheet.addRow({ metric: key, value: String(value) });
        }
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report.xlsx`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }

  async exportReportToPDF(req: Request, res: Response): Promise<void> {
    try {
      const { reportType } = req.params;
      let report: any;

      switch (reportType) {
        case 'enrollment':
          report = await reportService.generateEnrollmentReport(req.query);
          break;
        case 'attendance':
          report = await reportService.generateAttendanceReport(req.query as any);
          break;
        case 'fee-collection':
          report = await reportService.generateFeeCollectionReport(req.query as any);
          break;
        case 'examination':
          report = await reportService.generateExaminationReport(req.query);
          break;
        case 'library':
          report = await reportService.generateLibraryReport(req.query as any);
          break;
        case 'eca':
          report = await reportService.generateECAReport(req.query);
          break;
        case 'sports':
          report = await reportService.generateSportsReport(req.query);
          break;
        default:
          res.status(400).json({ success: false, error: { message: 'Invalid report type' } });
          return;
      }

      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${reportType}-report.pdf`);

      doc.pipe(res);

      doc.fontSize(20).text(`${reportType.toUpperCase()} Report`, { align: 'center' });
      doc.moveDown();

      Object.entries(report).forEach(([key, value]) => {
        if (typeof value !== 'object') {
          doc.fontSize(12).text(`${key}: ${value}`);
        }
      });

      doc.end();
    } catch (error: any) {
      res.status(500).json({ success: false, error: { message: error.message } });
    }
  }
}

export default new ReportController();

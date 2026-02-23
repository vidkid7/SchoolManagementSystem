import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { logger } from '@utils/logger';

/**
 * PDF Generation Service
 * Generates PDF documents for admission letters, certificates, etc.
 * Requirements: 3.8, 7.7, N1.9
 */

export interface AdmissionOfferLetterData {
  temporaryId: string;
  applicantName: string;
  applyingForClass: number;
  admissionDate: Date;
  schoolName: string;
  schoolAddress: string;
  principalName?: string;
  validUntil?: Date;
}

class PDFService {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'documents', 'admission-letters');
    this.ensureDirectoryExists(this.uploadsDir);
  }

  /**
   * Ensure directory exists, create if not
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info('Created directory', { path: dirPath });
    }
  }

  /**
   * Generate admission offer letter PDF
   * Requirements: 3.8
   */
  async generateAdmissionOfferLetter(data: AdmissionOfferLetterData): Promise<string> {
    try {
      const fileName = `admission-offer-${data.temporaryId}-${Date.now()}.pdf`;
      const filePath = path.join(this.uploadsDir, fileName);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      // Pipe to file
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

      // Add school letterhead
      doc.fontSize(20)
        .font('Helvetica-Bold')
        .text(data.schoolName, { align: 'center' });

      doc.fontSize(10)
        .font('Helvetica')
        .text(data.schoolAddress, { align: 'center' })
        .moveDown(0.5);

      // Add horizontal line
      doc.moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .stroke()
        .moveDown(1);

      // Add title
      doc.fontSize(16)
        .font('Helvetica-Bold')
        .text('ADMISSION OFFER LETTER', { align: 'center' })
        .moveDown(1);

      // Add date
      doc.fontSize(10)
        .font('Helvetica')
        .text(`Date: ${data.admissionDate.toLocaleDateString('en-GB')}`, { align: 'right' })
        .moveDown(1);

      // Add reference number
      doc.text(`Reference No: ${data.temporaryId}`, { align: 'left' })
        .moveDown(1.5);

      // Add salutation
      doc.fontSize(11)
        .text(`Dear ${data.applicantName},`)
        .moveDown(1);

      // Add body
      doc.fontSize(11)
        .font('Helvetica')
        .text(
          `We are pleased to inform you that you have been selected for admission to Class ${data.applyingForClass} ` +
          `at ${data.schoolName} for the academic year ${new Date().getFullYear()}.`,
          { align: 'justify' }
        )
        .moveDown(1);

      doc.text(
        'This offer is subject to the following conditions:',
        { align: 'justify' }
      )
        .moveDown(0.5);

      // Add conditions list
      const conditions = [
        'Submission of all required documents within 7 days',
        'Payment of admission and first term fees',
        'Verification of previous academic records',
        'Compliance with school rules and regulations',
        'Medical fitness certificate'
      ];

      conditions.forEach((condition, index) => {
        doc.fontSize(10)
          .text(`${index + 1}. ${condition}`, { indent: 20 })
          .moveDown(0.3);
      });

      doc.moveDown(1);

      // Add validity
      if (data.validUntil) {
        doc.fontSize(11)
          .font('Helvetica-Bold')
          .text(`This offer is valid until: ${data.validUntil.toLocaleDateString('en-GB')}`)
          .moveDown(1);
      }

      // Add instructions
      doc.fontSize(10)
        .font('Helvetica')
        .text(
          'Please visit the school office during working hours (10:00 AM - 4:00 PM) to complete the enrollment process.',
          { align: 'justify' }
        )
        .moveDown(2);

      // Add closing
      doc.fontSize(11)
        .text('We look forward to welcoming you to our school community.')
        .moveDown(2);

      // Add signature section
      doc.fontSize(10)
        .text('Sincerely,')
        .moveDown(2);

      doc.fontSize(11)
        .font('Helvetica-Bold')
        .text(data.principalName || 'Principal')
        .font('Helvetica')
        .text(data.schoolName);

      // Add footer
      doc.fontSize(8)
        .moveDown(3)
        .fillColor('gray')
        .text(
          'Note: This is a computer-generated document and does not require a signature.',
          { align: 'center' }
        );

      // Finalize PDF
      doc.end();

      // Wait for file to be written
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', reject);
      });

      logger.info('Admission offer letter generated', {
        temporaryId: data.temporaryId,
        fileName
      });

      // Return relative path for storage in database
      return `/uploads/documents/admission-letters/${fileName}`;
    } catch (error) {
      logger.error('Error generating admission offer letter', { error, data });
      throw error;
    }
  }

  /**
   * Generate report card PDF (placeholder for future implementation)
   * Requirements: 7.7, N1.9
   */
  async generateReportCard(_studentId: number, _termId: number): Promise<string> {
    // TODO: Implement report card generation
    throw new Error('Report card generation not yet implemented');
  }

  /**
   * Generate certificate PDF (placeholder for future implementation)
   */
  async generateCertificate(_certificateType: string, _studentId: number): Promise<string> {
    // TODO: Implement certificate generation
    throw new Error('Certificate generation not yet implemented');
  }

  /**
   * Delete PDF file
   */
  async deletePDF(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        logger.info('PDF file deleted', { filePath });
      }
    } catch (error) {
      logger.error('Error deleting PDF file', { error, filePath });
      throw error;
    }
  }
}

export default new PDFService();

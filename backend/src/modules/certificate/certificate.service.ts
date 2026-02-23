/**
 * Certificate Service
 * 
 * Business logic for certificate generation with PDF and QR code support
 * 
 * Requirements: 25.1, 25.3, 25.4, 25.5
 */

import { CertificateRepository, CertificateFilters } from './certificate.repository';
import { CertificateTemplateRepository } from './certificateTemplate.repository';
import { Certificate, CertificateCreationAttributes } from '../../models/Certificate.model';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);

export interface GenerateCertificateDTO {
  templateId: number;
  studentId: number;
  data: Record<string, any>;
  issuedBy: number;
  issuedDate?: Date;
  issuedDateBS?: string;
}

export interface BulkGenerateCertificateDTO {
  templateId: number;
  students: Array<{
    studentId: number;
    data: Record<string, any>;
  }>;
  issuedBy: number;
  issuedDate?: Date;
  issuedDateBS?: string;
}

export class CertificateService {
  private certificateRepository: CertificateRepository;
  private templateRepository: CertificateTemplateRepository;
  private baseUrl: string;
  private uploadDir: string;

  constructor(
    certificateRepository: CertificateRepository,
    templateRepository: CertificateTemplateRepository,
    baseUrl: string = process.env.BASE_URL || 'http://localhost:3000',
    uploadDir: string = process.env.UPLOAD_DIR || 'uploads/certificates'
  ) {
    this.certificateRepository = certificateRepository;
    this.templateRepository = templateRepository;
    this.baseUrl = baseUrl;
    this.uploadDir = uploadDir;
  }

  /**
   * Generate a certificate
   */
  async generateCertificate(dto: GenerateCertificateDTO): Promise<Certificate> {
    // Get template
    const template = await this.templateRepository.findById(dto.templateId);
    if (!template) {
      throw new Error(`Template with ID ${dto.templateId} not found`);
    }

    if (!template.isActive) {
      throw new Error('Cannot generate certificate from inactive template');
    }

    // Validate that all required variables are provided
    const missingVars = template.variables.filter(v => !(v in dto.data));
    if (missingVars.length > 0) {
      throw new Error(`Missing required variables: ${missingVars.join(', ')}`);
    }

    // Generate unique certificate number
    const certificateNumber = await this.generateCertificateNumber(template.type);

    // Set issued date
    const issuedDate = dto.issuedDate || new Date();
    const issuedDateBS = dto.issuedDateBS || this.convertToBS(issuedDate);

    // Generate verification URL
    const verificationUrl = `${this.baseUrl}/api/v1/certificates/verify/${certificateNumber}`;

    // Generate QR code
    const qrCode = await this.generateQRCode(verificationUrl);

    // Add QR code to data for PDF generation
    const pdfData = {
      ...dto.data,
      certificate_number: certificateNumber,
      issued_date: this.formatDate(issuedDate),
      issued_date_bs: issuedDateBS,
      qr_code: qrCode,
      verification_url: verificationUrl,
    };

    // Render template HTML
    const renderedHtml = template.renderTemplate(pdfData);

    // Generate PDF
    const pdfUrl = await this.generatePDF(certificateNumber, renderedHtml, qrCode);

    // Create certificate record
    const certificateData: CertificateCreationAttributes = {
      certificateNumber,
      templateId: dto.templateId,
      studentId: dto.studentId,
      type: template.type,
      issuedDate,
      issuedDateBS,
      data: dto.data,
      pdfUrl,
      qrCode,
      issuedBy: dto.issuedBy,
      verificationUrl,
      status: 'active',
    };

    return await this.certificateRepository.create(certificateData);
  }

  /**
   * Generate multiple certificates in bulk
   */
  async bulkGenerateCertificates(dto: BulkGenerateCertificateDTO): Promise<{
    success: Certificate[];
    failed: Array<{ studentId: number; error: string }>;
  }> {
    const success: Certificate[] = [];
    const failed: Array<{ studentId: number; error: string }> = [];

    for (const student of dto.students) {
      try {
        const certificate = await this.generateCertificate({
          templateId: dto.templateId,
          studentId: student.studentId,
          data: student.data,
          issuedBy: dto.issuedBy,
          issuedDate: dto.issuedDate,
          issuedDateBS: dto.issuedDateBS,
        });
        success.push(certificate);
      } catch (error) {
        failed.push({
          studentId: student.studentId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return { success, failed };
  }

  /**
   * Get certificate by ID
   */
  async getCertificateById(certificateId: number): Promise<Certificate> {
    const certificate = await this.certificateRepository.findById(certificateId);
    if (!certificate) {
      throw new Error(`Certificate with ID ${certificateId} not found`);
    }
    return certificate;
  }

  /**
   * Get certificate by certificate number
   */
  async getCertificateByCertificateNumber(certificateNumber: string): Promise<Certificate> {
    const certificate = await this.certificateRepository.findByCertificateNumber(certificateNumber);
    if (!certificate) {
      throw new Error(`Certificate with number ${certificateNumber} not found`);
    }
    return certificate;
  }

  /**
   * Get all certificates with filters
   */
  async getAllCertificates(filters: CertificateFilters = {}): Promise<Certificate[]> {
    return await this.certificateRepository.findAll(filters);
  }

  /**
   * Get certificates by student ID
   */
  async getCertificatesByStudentId(studentId: number): Promise<Certificate[]> {
    return await this.certificateRepository.findByStudentId(studentId);
  }

  /**
   * Get active certificates by student ID
   */
  async getActiveCertificatesByStudentId(studentId: number): Promise<Certificate[]> {
    return await this.certificateRepository.findActiveByStudentId(studentId);
  }

  /**
   * Revoke certificate
   */
  async revokeCertificate(certificateId: number, revokedBy: number, reason: string): Promise<Certificate> {
    const certificate = await this.certificateRepository.revoke(certificateId, revokedBy, reason);
    if (!certificate) {
      throw new Error(`Certificate with ID ${certificateId} not found`);
    }
    return certificate;
  }

  /**
   * Verify certificate - Enhanced for public access
   * Supports both QR code scanning and direct certificate number lookup
   * 
   * Requirements: 25.7
   */
  async verifyCertificate(certificateNumber: string): Promise<{
    valid: boolean;
    certificate?: {
      certificateNumber: string;
      type: string;
      studentId: number;
      issuedDate: Date;
      issuedDateBS: string;
      data: Record<string, any>;
      status: string;
      revokedAt?: Date;
      revokedReason?: string;
      verificationUrl: string;
    };
    message: string;
  }> {
    // Validate certificate number format
    if (!certificateNumber || certificateNumber.trim() === '') {
      return {
        valid: false,
        message: 'Certificate number is required',
      };
    }

    const certificate = await this.certificateRepository.findByCertificateNumber(certificateNumber);

    if (!certificate) {
      return {
        valid: false,
        message: 'Certificate not found. Please verify the certificate number and try again.',
      };
    }

    // Prepare comprehensive certificate information for verification
    const certificateInfo = {
      certificateNumber: certificate.certificateNumber,
      type: certificate.type,
      studentId: certificate.studentId,
      issuedDate: certificate.issuedDate,
      issuedDateBS: certificate.issuedDateBS,
      data: certificate.data,
      status: certificate.status,
      revokedAt: certificate.revokedAt,
      revokedReason: certificate.revokedReason,
      verificationUrl: certificate.verificationUrl,
    };

    if (certificate.status === 'revoked') {
      return {
        valid: false,
        certificate: certificateInfo,
        message: `Certificate has been revoked${certificate.revokedAt ? ` on ${this.formatDate(certificate.revokedAt)}` : ''}. Reason: ${certificate.revokedReason || 'Not specified'}`,
      };
    }

    return {
      valid: true,
      certificate: certificateInfo,
      message: 'Certificate is valid and authentic',
    };
  }

/**
   * Get certificate statistics
   */
  async getCertificateStats(): Promise<{
    total: number;
    active: number;
    revoked: number;
    byType: Record<string, number>;
    thisMonth: number;
    recent: Array<{
      certificateNumber: string;
      studentName: string;
      type: string;
      issuedDate: Date;
    }>;
  }> {
    return await this.certificateRepository.getStats();
  }

  /**
   * Generate unique certificate number
   */
  private async generateCertificateNumber(type: string): Promise<string> {
    const year = new Date().getFullYear();
    const typePrefix = this.getTypePrefix(type);
    
    let attempts = 0;
    const maxAttempts = 100;

    while (attempts < maxAttempts) {
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const certificateNumber = `CERT-${typePrefix}-${year}-${randomNum}`;

      const exists = await this.certificateRepository.existsByCertificateNumber(certificateNumber);
      if (!exists) {
        return certificateNumber;
      }

      attempts++;
    }

    throw new Error('Failed to generate unique certificate number after maximum attempts');
  }

  /**
   * Get type prefix for certificate number
   */
  private getTypePrefix(type: string): string {
    const prefixes: Record<string, string> = {
      character: 'CHAR',
      transfer: 'TRAN',
      academic_excellence: 'ACAD',
      eca: 'ECA',
      sports: 'SPRT',
      course_completion: 'CRSE',
      bonafide: 'BONF',
      conduct: 'COND',
      participation: 'PART',
    };

    return prefixes[type] || 'CERT';
  }

  /**
   * Generate QR code
   */
  private async generateQRCode(data: string): Promise<string> {
    try {
      return await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 200,
        margin: 1,
      });
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate PDF from HTML
   */
  private async generatePDF(certificateNumber: string, html: string, qrCode: string): Promise<string> {
    try {
      // Ensure upload directory exists
      await this.ensureUploadDir();

      const fileName = `${certificateNumber}.pdf`;
      const filePath = path.join(this.uploadDir, fileName);

      // Create PDF document
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margins: { top: 50, bottom: 50, left: 50, right: 50 },
      });

      // Pipe to file
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Add school branding header
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .text('School Management System', { align: 'center' });

      doc.moveDown(0.5);

      // Add certificate title
      doc.fontSize(20)
         .font('Helvetica-Bold')
         .text('CERTIFICATE', { align: 'center' });

      doc.moveDown(1);

      // Parse and add HTML content (simplified - in production, use a proper HTML-to-PDF library)
      const textContent = this.extractTextFromHtml(html);
      doc.fontSize(12)
         .font('Helvetica')
         .text(textContent, { align: 'left' });

      doc.moveDown(2);

      // Add QR code
      if (qrCode) {
        const qrBuffer = Buffer.from(qrCode.split(',')[1], 'base64');
        doc.image(qrBuffer, doc.page.width - 150, doc.page.height - 150, {
          width: 100,
          height: 100,
        });
      }

      // Add certificate number at bottom
      doc.fontSize(10)
         .font('Helvetica')
         .text(`Certificate Number: ${certificateNumber}`, 50, doc.page.height - 50, {
           align: 'left',
         });

      // Finalize PDF
      doc.end();

      // Wait for stream to finish
      await new Promise<void>((resolve, reject) => {
        stream.on('finish', () => resolve());
        stream.on('error', reject);
      });

      return `/uploads/certificates/${fileName}`;
    } catch (error) {
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract text from HTML (simplified)
   */
  private extractTextFromHtml(html: string): string {
    // Remove HTML tags and decode entities
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir(): Promise<void> {
    try {
      await mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Convert AD date to BS (simplified - use proper library in production)
   */
  private convertToBS(date: Date): string {
    // This is a placeholder - in production, use nepali-date-converter library
    const year = date.getFullYear() + 57; // Approximate conversion
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Format date for display
   */
  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

export default new CertificateService(
  new CertificateRepository(),
  new CertificateTemplateRepository()
);

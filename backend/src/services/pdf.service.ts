import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { logger } from '@utils/logger';
import Student from '@models/Student.model';
import { Term } from '@models/AcademicYear.model';
import Exam from '@models/Exam.model';
import Grade from '@models/Grade.model';
import AttendanceRecord from '@models/AttendanceRecord.model';
import Certificate from '@models/Certificate.model';
import { Op } from 'sequelize';

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
  private reportsDir: string;
  private certificatesDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads', 'documents', 'admission-letters');
    this.reportsDir = path.join(process.cwd(), 'uploads', 'documents', 'report-cards');
    this.certificatesDir = path.join(process.cwd(), 'uploads', 'documents', 'certificates');
    this.ensureDirectoryExists(this.uploadsDir);
    this.ensureDirectoryExists(this.reportsDir);
    this.ensureDirectoryExists(this.certificatesDir);
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
   * Generate report card PDF
   * Requirements: 7.7, N1.9
   */
  async generateReportCard(_studentId: number, _termId: number): Promise<string> {
    const student = await Student.findByPk(_studentId);
    if (!student) {
      throw new Error(`Student not found for ID: ${_studentId}`);
    }

    const term = await Term.findByPk(_termId);
    if (!term) {
      throw new Error(`Term not found for ID: ${_termId}`);
    }

    const fileName = `report-card-${_studentId}-${_termId}-${Date.now()}.pdf`;
    const filePath = path.join(this.reportsDir, fileName);

    const exams = await Exam.findAll({
      where: { termId: _termId },
      attributes: ['examId', 'name', 'examDate', 'fullMarks']
    });
    const examIds = exams.map(exam => exam.examId);

    const grades = examIds.length > 0
      ? await Grade.findAll({
          where: {
            studentId: _studentId,
            examId: { [Op.in]: examIds }
          },
          order: [['enteredAt', 'ASC']]
        })
      : [];

    const attendance = await AttendanceRecord.findAll({
      where: {
        studentId: _studentId,
        date: {
          [Op.between]: [
            new Date(term.startDate),
            new Date(term.endDate)
          ]
        }
      }
    });

    const gradeRows = grades.map(grade => {
      const exam = exams.find(item => item.examId === grade.examId);
      return {
        examName: exam?.name || `Exam #${grade.examId}`,
        examDate: exam?.examDate,
        fullMarks: Number(exam?.fullMarks || 100),
        obtained: Number(grade.totalMarks || 0),
        grade: grade.grade,
        gradePoint: Number(grade.gradePoint || 0)
      };
    });

    const totalObtained = gradeRows.reduce((sum, row) => sum + row.obtained, 0);
    const totalFullMarks = gradeRows.reduce((sum, row) => sum + row.fullMarks, 0);
    const percentage = totalFullMarks > 0 ? (totalObtained / totalFullMarks) * 100 : 0;
    const averageGradePoint = gradeRows.length > 0
      ? gradeRows.reduce((sum, row) => sum + row.gradePoint, 0) / gradeRows.length
      : 0;

    const present = attendance.filter(record => record.status === 'present').length;
    const absent = attendance.filter(record => record.status === 'absent').length;
    const late = attendance.filter(record => record.status === 'late').length;
    const attendancePct = attendance.length > 0 ? ((present + late) / attendance.length) * 100 : 0;

    await this.generateSimpleDocument(filePath, doc => {
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('STUDENT REPORT CARD', { align: 'center' })
        .moveDown(1);

      doc
        .fontSize(12)
        .font('Helvetica')
        .text(`Student: ${student.getFullNameEn()} (${student.studentCode})`)
        .text(`Class: ${student.currentClassId || student.admissionClass}`)
        .text(`Term: ${term.name}`)
        .text(`Period: ${new Date(term.startDate).toLocaleDateString('en-GB')} - ${new Date(term.endDate).toLocaleDateString('en-GB')}`)
        .text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`)
        .moveDown(1);

      doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Academic Summary')
        .font('Helvetica')
        .moveDown(0.3)
        .fontSize(10)
        .text(`Exams Recorded: ${gradeRows.length}`)
        .text(`Total Marks: ${totalObtained.toFixed(2)} / ${totalFullMarks.toFixed(2)}`)
        .text(`Percentage: ${percentage.toFixed(2)}%`)
        .text(`Average Grade Point: ${averageGradePoint.toFixed(2)}`)
        .moveDown(0.8)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Attendance Summary')
        .font('Helvetica')
        .moveDown(0.3)
        .fontSize(10)
        .text(`Attendance Days: ${attendance.length}`)
        .text(`Present: ${present}, Absent: ${absent}, Late: ${late}`)
        .text(`Attendance Percentage: ${attendancePct.toFixed(2)}%`)
        .moveDown(0.5)
        .fontSize(11)
        .font('Helvetica-Bold')
        .text('Exam-wise Breakdown')
        .font('Helvetica')
        .moveDown(0.3);

      if (gradeRows.length === 0) {
        doc.fontSize(10).text('No grades available for this term.');
      } else {
        gradeRows.forEach((row, index) => {
          doc
            .fontSize(10)
            .text(
              `${index + 1}. ${row.examName} (${row.examDate ? new Date(row.examDate).toLocaleDateString('en-GB') : 'No date'}) - ` +
              `${row.obtained.toFixed(2)}/${row.fullMarks.toFixed(2)} | Grade: ${row.grade} | GPA: ${row.gradePoint.toFixed(2)}`
            );
        });
      }
    });

    logger.info('Report card PDF generated', {
      studentId: _studentId,
      termId: _termId,
      fileName
    });

    return `/uploads/documents/report-cards/${fileName}`;
  }

  /**
   * Generate certificate PDF
   */
  async generateCertificate(_certificateType: string, _studentId: number): Promise<string> {
    const student = await Student.findByPk(_studentId);
    if (!student) {
      throw new Error(`Student not found for ID: ${_studentId}`);
    }

    const normalizedType = (_certificateType || 'general').trim().toLowerCase();
    const title = normalizedType
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    const fileName = `certificate-${normalizedType}-${_studentId}-${Date.now()}.pdf`;
    const filePath = path.join(this.certificatesDir, fileName);
    const certificateRecord = await Certificate.findOne({
      where: {
        studentId: _studentId,
        type: normalizedType as any
      },
      order: [['issuedDate', 'DESC']]
    });

    await this.generateSimpleDocument(filePath, doc => {
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('CERTIFICATE', { align: 'center' })
        .moveDown(1.5);

      doc
        .fontSize(14)
        .font('Helvetica')
        .text('This is to certify that', { align: 'center' })
        .moveDown(0.5)
        .font('Helvetica-Bold')
        .text(student.getFullNameEn(), { align: 'center' })
        .moveDown(0.5)
        .font('Helvetica')
        .text(`Student Code: ${student.studentCode}`, { align: 'center' })
        .moveDown(1)
        .text(`has successfully received the "${title}" certificate.`, { align: 'center' });

      if (certificateRecord) {
        doc
          .moveDown(1)
          .fontSize(11)
          .text(`Certificate Number: ${certificateRecord.certificateNumber}`, { align: 'center' })
          .text(`Issued Date: ${new Date(certificateRecord.issuedDate).toLocaleDateString('en-GB')}`, { align: 'center' })
          .text(`Status: ${certificateRecord.status}`, { align: 'center' })
          .moveDown(0.8);

        if (certificateRecord.verificationUrl) {
          doc
            .fontSize(9)
            .fillColor('blue')
            .text(`Verify at: ${certificateRecord.verificationUrl}`, { align: 'center', underline: true })
            .fillColor('black');
        }
      } else {
        doc
          .moveDown(1.2)
          .fontSize(10)
          .text('No existing issued certificate record was found. This is a generated copy.', { align: 'center' })
          .moveDown(0.5);
      }

      doc
        .fontSize(10)
        .fillColor('gray')
        .text(`Issued on ${new Date().toLocaleDateString('en-GB')}`, { align: 'center' });
    });

    logger.info('Certificate PDF generated', {
      certificateType: normalizedType,
      studentId: _studentId,
      fileName
    });

    return `/uploads/documents/certificates/${fileName}`;
  }

  /**
   * Delete PDF file
   */
  async deletePDF(filePath: string): Promise<void> {
    try {
      const normalizedRelativePath = filePath.replace(/^[/\\]+/, '');
      const fullPath = path.join(process.cwd(), normalizedRelativePath);
      await fs.promises.access(fullPath, fs.constants.F_OK);
      await fs.promises.unlink(fullPath);
      logger.info('PDF file deleted', { filePath: normalizedRelativePath });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.warn('PDF file not found for deletion', { filePath });
        return;
      }
      logger.error('Error deleting PDF file', { error, filePath });
      throw error;
    }
  }

  private async generateSimpleDocument(
    filePath: string,
    render: (doc: PDFKit.PDFDocument) => void
  ): Promise<void> {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    render(doc);
    doc.end();

    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
      doc.on('error', reject);
    });
  }
}

export default new PDFService();

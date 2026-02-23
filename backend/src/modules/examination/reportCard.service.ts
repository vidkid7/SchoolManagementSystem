import PDFDocument from 'pdfkit';
import Grade, { NEBGrade } from '@models/Grade.model';
import Exam from '@models/Exam.model';
import Student from '@models/Student.model';
import AttendanceRecord, { AttendanceStatus } from '@models/AttendanceRecord.model';
import { calculateNEBGrade } from '@services/nebGrading.service';
import rankCalculationService from './rankCalculation.service';
import { Op } from 'sequelize';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Report Card Generation Service
 * Generates NEB-compliant report cards in PDF format
 * 
 * Requirements: 7.7, N1.9
 */

/**
 * Subject grade information for report card
 */
export interface SubjectGradeInfo {
  subjectId: number;
  subjectName: string;
  subjectNameNp?: string;
  creditHours: number;
  theoryMarks: number;
  practicalMarks: number;
  totalMarks: number;
  fullMarks: number;
  grade: NEBGrade;
  gradePoint: number;
  remarks?: string;
}

/**
 * Attendance summary for report card
 */
export interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
}

/**
 * Report card data structure
 */
export interface ReportCardData {
  // Student Information
  studentId: number;
  studentCode: string;
  studentNameEn: string;
  studentNameNp?: string;
  symbolNumber?: string;
  nebRegistrationNumber?: string;
  rollNumber?: number;
  dateOfBirthBS: string;
  dateOfBirthAD: Date;
  
  // Academic Information
  academicYearId: number;
  academicYearName: string;
  termId: number;
  termName: string;
  className: string;
  sectionName?: string;
  
  // Grades
  subjects: SubjectGradeInfo[];
  termGPA: number;
  cumulativeGPA?: number;
  
  // Rank
  rank: number;
  totalStudents: number;
  percentile: number;
  
  // Attendance
  attendance: AttendanceSummary;
  
  // Remarks
  classTeacherRemarks?: string;
  principalRemarks?: string;
  
  // Metadata
  generatedAt: Date;
  generatedBy: number;
}

/**
 * Report card generation options
 */
export interface ReportCardOptions {
  language: 'english' | 'nepali' | 'bilingual';
  includeSchoolSeal?: boolean;
  includePrincipalSignature?: boolean;
  includeClassTeacherSignature?: boolean;
  format?: 'ledger' | 'standard';
  outputPath?: string;
}

/**
 * School information for report card header
 */
export interface SchoolInfo {
  nameEn: string;
  nameNp?: string;
  addressEn: string;
  addressNp?: string;
  phone?: string;
  email?: string;
  website?: string;
  logoPath?: string;
  sealPath?: string;
  principalName?: string;
  principalSignaturePath?: string;
}

class ReportCardService {
  /**
   * Calculate attendance summary for a student in a term
   * 
   * Requirements: 7.7
   */
  async calculateAttendanceSummary(
    studentId: number,
    termStartDate: Date,
    termEndDate: Date
  ): Promise<AttendanceSummary> {
    const attendanceRecords = await AttendanceRecord.findAll({
      where: {
        studentId,
        date: {
          [Op.between]: [termStartDate, termEndDate]
        }
      }
    });

    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const absentDays = attendanceRecords.filter(r => r.status === AttendanceStatus.ABSENT).length;
    const lateDays = attendanceRecords.filter(r => r.status === AttendanceStatus.LATE).length;
    const excusedDays = attendanceRecords.filter(r => r.status === AttendanceStatus.EXCUSED).length;

    // Calculate attendance percentage: (present + late) / total * 100
    const attendancePercentage = totalDays > 0 
      ? ((presentDays + lateDays) / totalDays) * 100 
      : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      excusedDays,
      attendancePercentage: Math.round(attendancePercentage * 100) / 100
    };
  }

  /**
   * Calculate term GPA from subject grades
   * 
   * GPA = Σ(credit_hours × grade_point) / total_credit_hours
   * 
   * Requirements: N1.2
   */
  calculateTermGPA(subjects: SubjectGradeInfo[]): number {
    if (subjects.length === 0) {
      return 0;
    }

    const totalCreditHours = subjects.reduce((sum, s) => sum + s.creditHours, 0);
    if (totalCreditHours === 0) {
      return 0;
    }

    const weightedSum = subjects.reduce(
      (sum, s) => sum + (s.creditHours * s.gradePoint),
      0
    );

    const gpa = weightedSum / totalCreditHours;
    return Math.round(gpa * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Gather report card data for a student
   * 
   * Requirements: 7.7, N1.9
   */
  async gatherReportCardData(
    studentId: number,
    termId: number,
    academicYearId: number
  ): Promise<ReportCardData> {
    // Get student information
    const student = await Student.findByPk(studentId);
    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    // Get all exams for this term
    const exams = await Exam.findAll({
      where: {
        termId,
        academicYearId
      }
    });

    if (exams.length === 0) {
      throw new Error(`No exams found for term ${termId} and academic year ${academicYearId}`);
    }

    // Get all grades for this student in this term
    const examIds = exams.map(e => e.examId);
    const grades = await Grade.findAll({
      where: {
        studentId,
        examId: {
          [Op.in]: examIds
        }
      }
    });

    // Group grades by subject and calculate subject-wise totals
    const subjectGrades = new Map<number, SubjectGradeInfo>();

    for (const grade of grades) {
      const exam = exams.find(e => e.examId === grade.examId);
      if (!exam) continue;

      const subjectId = exam.subjectId;
      
      if (!subjectGrades.has(subjectId)) {
        // Initialize subject grade info
        subjectGrades.set(subjectId, {
          subjectId,
          subjectName: `Subject ${subjectId}`, // TODO: Get from Subject model
          creditHours: 0, // TODO: Get from Subject model
          theoryMarks: 0,
          practicalMarks: 0,
          totalMarks: 0,
          fullMarks: 0,
          grade: NEBGrade.NG,
          gradePoint: 0
        });
      }

      const subjectGrade = subjectGrades.get(subjectId);
      if (!subjectGrade) continue;
      
      // Accumulate marks
      subjectGrade.theoryMarks += grade.theoryMarks || 0;
      subjectGrade.practicalMarks += grade.practicalMarks || 0;
      subjectGrade.totalMarks += grade.totalMarks;
      subjectGrade.fullMarks += exam.fullMarks;
    }

    // Calculate final grades for each subject
    const subjects: SubjectGradeInfo[] = [];
    for (const [, subjectGrade] of subjectGrades) {
      // Calculate percentage
      const percentage = subjectGrade.fullMarks > 0
        ? (subjectGrade.totalMarks / subjectGrade.fullMarks) * 100
        : 0;

      // Calculate NEB grade
      const nebGrade = calculateNEBGrade(percentage);
      subjectGrade.grade = nebGrade.grade as NEBGrade;
      subjectGrade.gradePoint = nebGrade.gradePoint;

      subjects.push(subjectGrade);
    }

    // Calculate term GPA
    const termGPA = this.calculateTermGPA(subjects);

    // Get rank information
    // For simplicity, we'll use the first exam's class for rank calculation
    const firstExam = exams[0];
    const rankInfo = await rankCalculationService.getStudentRank(
      firstExam.examId,
      studentId
    );

    // Calculate attendance summary
    // TODO: Get term dates from Term model
    const termStartDate = new Date(); // Placeholder
    const termEndDate = new Date(); // Placeholder
    const attendance = await this.calculateAttendanceSummary(
      studentId,
      termStartDate,
      termEndDate
    );

    // Build report card data
    const reportCardData: ReportCardData = {
      // Student Information
      studentId: student.studentId,
      studentCode: student.studentCode,
      studentNameEn: `${student.firstNameEn} ${student.middleNameEn || ''} ${student.lastNameEn}`.trim(),
      studentNameNp: student.firstNameNp 
        ? `${student.firstNameNp} ${student.middleNameNp || ''} ${student.lastNameNp || ''}`.trim()
        : undefined,
      symbolNumber: student.symbolNumber,
      nebRegistrationNumber: student.nebRegistrationNumber,
      rollNumber: student.rollNumber,
      dateOfBirthBS: student.dateOfBirthBS,
      dateOfBirthAD: student.dateOfBirthAD,
      
      // Academic Information
      academicYearId,
      academicYearName: 'Academic Year', // TODO: Get from AcademicYear model
      termId,
      termName: 'Term', // TODO: Get from Term model
      className: 'Class', // TODO: Get from Class model
      
      // Grades
      subjects,
      termGPA,
      
      // Rank
      rank: rankInfo?.rank || 0,
      totalStudents: rankInfo ? subjects.length : 0,
      percentile: rankInfo?.percentile || 0,
      
      // Attendance
      attendance,
      
      // Metadata
      generatedAt: new Date(),
      generatedBy: 0 // TODO: Get from context
    };

    return reportCardData;
  }

  /**
   * Generate report card PDF
   * 
   * Generates NEB-compliant report card in ledger format
   * Supports bilingual (Nepali/English) output
   * 
   * Requirements: 7.7, N1.9
   */
  async generateReportCardPDF(
    reportCardData: ReportCardData,
    schoolInfo: SchoolInfo,
    options: ReportCardOptions = { language: 'bilingual', format: 'ledger' }
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // Create PDF document
        // Ledger format: 11 x 17 inches (landscape) = 792 x 1224 points
        const doc = new PDFDocument({
          size: options.format === 'ledger' ? [1224, 792] : 'A4',
          layout: 'landscape',
          margins: {
            top: 40,
            bottom: 40,
            left: 40,
            right: 40
          }
        });

        // Buffer to store PDF
        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header Section
        this.generateHeader(doc, schoolInfo, reportCardData, options);

        // Student Information Section
        this.generateStudentInfo(doc, reportCardData, options);

        // Grades Table
        this.generateGradesTable(doc, reportCardData, options);

        // Summary Section (GPA, Rank, Attendance)
        this.generateSummary(doc, reportCardData, options);

        // Remarks Section
        this.generateRemarks(doc, reportCardData, options);

        // Footer Section (Signatures)
        this.generateFooter(doc, schoolInfo, options);

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate report card header
   */
  private generateHeader(
    doc: PDFKit.PDFDocument,
    schoolInfo: SchoolInfo,
    reportCardData: ReportCardData,
    options: ReportCardOptions
  ): void {
    const pageWidth = doc.page.width;
    const margin = 40;
    const headerHeight = 180;

    // Draw outer border with double line effect
    doc.lineWidth(2);
    doc.rect(margin, margin, pageWidth - (margin * 2), headerHeight).stroke();
    doc.lineWidth(0.5);
    doc.rect(margin + 3, margin + 3, pageWidth - (margin * 2) - 6, headerHeight - 6).stroke();

    // School Logo (if available)
    let logoWidth = 0;
    if (options.includeSchoolSeal && schoolInfo.logoPath && fs.existsSync(schoolInfo.logoPath)) {
      doc.image(schoolInfo.logoPath, margin + 30, margin + 25, { width: 80, height: 80 });
      logoWidth = 100;
    }

    // School Name - Centered and Bold with styling
    const centerX = pageWidth / 2;
    const textStartX = margin + logoWidth + 20;
    const textWidth = pageWidth - (margin * 2) - logoWidth - 40;

    doc.fontSize(26).font('Helvetica-Bold');
    doc.fillColor('#1a237e');
    doc.text(schoolInfo.nameEn, textStartX, margin + 20, { 
      width: textWidth,
      align: 'center' 
    });

    if (options.language !== 'english' && schoolInfo.nameNp) {
      doc.fontSize(18).font('Helvetica-Bold');
      doc.fillColor('#1a237e');
      doc.text(schoolInfo.nameNp, textStartX, margin + 50, { 
        width: textWidth,
        align: 'center' 
      });
    }

    // School Address with icon styling
    doc.fontSize(12).font('Helvetica');
    doc.fillColor('#333333');
    const addressParts = [schoolInfo.addressEn];
    if (schoolInfo.addressNp) {
      addressParts.push(`(${schoolInfo.addressNp})`);
    }
    doc.text(addressParts.join(' '), textStartX, margin + 80, { 
      width: textWidth,
      align: 'center' 
    });
    
    // Contact Information
    if (schoolInfo.phone || schoolInfo.email || schoolInfo.website) {
      const contactParts = [
        schoolInfo.phone ? `Phone: ${schoolInfo.phone}` : '',
        schoolInfo.email ? `Email: ${schoolInfo.email}` : '',
        schoolInfo.website ? `Website: ${schoolInfo.website}` : ''
      ].filter(Boolean);
      
      doc.fontSize(10);
      doc.fillColor('#555555');
      doc.text(contactParts.join('  |  '), textStartX, margin + 100, { 
        width: textWidth,
        align: 'center' 
      });
    }

    // Report Card Title with decorative background
    const titleY = margin + 125;
    doc.fillColor('#e8f5e9');
    doc.rect(margin + 100, titleY, pageWidth - (margin * 2) - 200, 45).fill();
    
    doc.fontSize(22).font('Helvetica-Bold');
    doc.fillColor('#1b5e20');
    doc.text('PROGRESS REPORT CARD', margin + 100, titleY + 8, { 
      width: pageWidth - (margin * 2) - 200,
      align: 'center' 
    });
    
    if (options.language !== 'english') {
      doc.fontSize(14).font('Helvetica-Bold');
      doc.fillColor('#1b5e20');
      doc.text('प्रगति प्रतिवेदन पत्र', margin + 100, titleY + 28, { 
        width: pageWidth - (margin * 2) - 200,
        align: 'center' 
      });
    }
    
    doc.fillColor('#000000');

    // Academic Year and Term in a styled box
    const infoBoxY = margin + headerHeight + 10;
    doc.fillColor('#fff3e0');
    doc.rect(margin + 20, infoBoxY, pageWidth - (margin * 2) - 40, 28).fill();
    doc.strokeColor('#ff9800');
    doc.rect(margin + 20, infoBoxY, pageWidth - (margin * 2) - 40, 28).stroke();
    doc.strokeColor('#000000');
    
    doc.fontSize(13).font('Helvetica-Bold');
    doc.fillColor('#e65100');
    const academicInfo = `Academic Year: ${reportCardData.academicYearName}  |  Term: ${reportCardData.termName}  |  Exam: ${reportCardData.termName} Examination`;
    doc.text(academicInfo, margin + 20, infoBoxY + 8, { 
      width: pageWidth - (margin * 2) - 40,
      align: 'center' 
    });
    doc.fillColor('#000000');
  }

  /**
   * Generate student information section
   */
  private generateStudentInfo(
    doc: PDFKit.PDFDocument,
    reportCardData: ReportCardData,
    _options: ReportCardOptions
  ): void {
    const margin = 40;
    const startY = 270;
    const boxHeight = 80;
    const pageWidth = doc.page.width;

    // Draw student info box with styling
    doc.fillColor('#e3f2fd');
    doc.rect(margin + 20, startY, pageWidth - (margin * 2) - 40, boxHeight).fill();
    doc.strokeColor('#1976d2');
    doc.lineWidth(1.5);
    doc.rect(margin + 20, startY, pageWidth - (margin * 2) - 40, boxHeight).stroke();
    doc.lineWidth(0.5);
    doc.strokeColor('#000000');

    // Section title
    doc.fontSize(12).font('Helvetica-Bold');
    doc.fillColor('#0d47a1');
    doc.text('STUDENT INFORMATION', margin + 30, startY + 8);
    doc.fillColor('#000000');

    // Column positions - better distributed
    const col1 = margin + 40;
    const col2 = margin + 350;
    const col3 = margin + 650;
    const col4 = margin + 900;
    const lineHeight = 18;

    doc.fontSize(11);

    // Row 1
    let currentY = startY + 28;
    doc.font('Helvetica-Bold').fillColor('#333');
    doc.text('Student Name:', col1, currentY);
    doc.font('Helvetica').fillColor('#000');
    doc.text(`${reportCardData.studentNameEn}`, col1 + 100, currentY);
    
    doc.font('Helvetica-Bold').fillColor('#333');
    doc.text('Class:', col2, currentY);
    doc.font('Helvetica').fillColor('#000');
    doc.text(`${reportCardData.className}${reportCardData.sectionName ? ' - ' + reportCardData.sectionName : ''}`, col2 + 50, currentY);

    doc.font('Helvetica-Bold').fillColor('#333');
    doc.text('Roll No:', col3, currentY);
    doc.font('Helvetica').fillColor('#000');
    doc.text(`${reportCardData.rollNumber || 'N/A'}`, col3 + 60, currentY);

    doc.font('Helvetica-Bold').fillColor('#333');
    doc.text('Student ID:', col4, currentY);
    doc.font('Helvetica').fillColor('#000');
    doc.text(`${reportCardData.studentCode}`, col4 + 75, currentY);

    // Row 2
    currentY += lineHeight + 4;
    if (_options.language !== 'english' && reportCardData.studentNameNp) {
      doc.font('Helvetica-Bold').fillColor('#333');
      doc.text('विद्यार्थीको नाम:', col1, currentY);
      doc.font('Helvetica').fillColor('#000');
      doc.text(`${reportCardData.studentNameNp}`, col1 + 115, currentY);
    }

    doc.font('Helvetica-Bold').fillColor('#333');
    doc.text('Date of Birth:', col2, currentY);
    doc.font('Helvetica').fillColor('#000');
    doc.text(`${reportCardData.dateOfBirthBS} BS`, col2 + 85, currentY);

    if (reportCardData.symbolNumber) {
      doc.font('Helvetica-Bold').fillColor('#333');
      doc.text('Symbol No:', col3, currentY);
      doc.font('Helvetica').fillColor('#000');
      doc.text(`${reportCardData.symbolNumber}`, col3 + 70, currentY);
    }

    if (reportCardData.nebRegistrationNumber) {
      doc.font('Helvetica-Bold').fillColor('#333');
      doc.text('NEB Reg:', col4, currentY);
      doc.font('Helvetica').fillColor('#000');
      doc.text(`${reportCardData.nebRegistrationNumber}`, col4 + 60, currentY);
    }
  }

  /**
   * Generate grades table
   */
  private generateGradesTable(
    doc: PDFKit.PDFDocument,
    reportCardData: ReportCardData,
    _options: ReportCardOptions
  ): void {
    const margin = 40;
    const startY = 365;
    const tableLeft = margin + 20;
    const pageWidth = doc.page.width;
    const tableWidth = pageWidth - (margin * 2) - 40;

    // Column widths (proportional to table width for ledger format)
    const colWidths = {
      sn: 45,
      subject: 250,
      creditHrs: 80,
      theory: 100,
      practical: 100,
      total: 90,
      fullMarks: 90,
      grade: 70,
      gradePoint: 90
    };

    let currentY = startY;

    // Table Title
    doc.fontSize(13).font('Helvetica-Bold');
    doc.fillColor('#1a237e');
    doc.text('ACADEMIC PERFORMANCE - GRADES', tableLeft, currentY);
    doc.fillColor('#000000');
    currentY += 22;

    // Table Header with gradient-like background
    const headerHeight = 32;
    
    // Draw header background
    doc.fillColor('#1a237e');
    doc.rect(tableLeft, currentY, tableWidth, headerHeight).fill();
    
    doc.fillColor('#ffffff');
    doc.fontSize(10).font('Helvetica-Bold');

    let currentX = tableLeft;
    
    // Draw header cells
    doc.rect(currentX, currentY, colWidths.sn, headerHeight).stroke();
    doc.text('S.N.', currentX + 5, currentY + 10, { width: colWidths.sn - 10, align: 'center' });
    currentX += colWidths.sn;

    doc.rect(currentX, currentY, colWidths.subject, headerHeight).stroke();
    doc.text('Subject', currentX + 5, currentY + 10, { width: colWidths.subject - 10, align: 'center' });
    currentX += colWidths.subject;

    doc.rect(currentX, currentY, colWidths.creditHrs, headerHeight).stroke();
    doc.text('Credit\nHrs', currentX + 5, currentY + 6, { width: colWidths.creditHrs - 10, align: 'center' });
    currentX += colWidths.creditHrs;

    doc.rect(currentX, currentY, colWidths.theory, headerHeight).stroke();
    doc.text('Theory\nMarks', currentX + 5, currentY + 6, { width: colWidths.theory - 10, align: 'center' });
    currentX += colWidths.theory;

    doc.rect(currentX, currentY, colWidths.practical, headerHeight).stroke();
    doc.text('Practical\nMarks', currentX + 5, currentY + 6, { width: colWidths.practical - 10, align: 'center' });
    currentX += colWidths.practical;

    doc.rect(currentX, currentY, colWidths.total, headerHeight).stroke();
    doc.text('Total\nMarks', currentX + 5, currentY + 6, { width: colWidths.total - 10, align: 'center' });
    currentX += colWidths.total;

    doc.rect(currentX, currentY, colWidths.fullMarks, headerHeight).stroke();
    doc.text('Full\nMarks', currentX + 5, currentY + 6, { width: colWidths.fullMarks - 10, align: 'center' });
    currentX += colWidths.fullMarks;

    doc.rect(currentX, currentY, colWidths.grade, headerHeight).stroke();
    doc.text('Grade', currentX + 5, currentY + 10, { width: colWidths.grade - 10, align: 'center' });
    currentX += colWidths.grade;

    doc.rect(currentX, currentY, colWidths.gradePoint, headerHeight).stroke();
    doc.text('Grade\nPoint', currentX + 5, currentY + 6, { width: colWidths.gradePoint - 10, align: 'center' });

    currentY += headerHeight;

    // Table Rows
    doc.fontSize(10).font('Helvetica');
    doc.fillColor('#000000');
    
    reportCardData.subjects.forEach((subject, index) => {
      currentX = tableLeft;
      const rowHeight = 26;

      // Alternate row background
      if (index % 2 === 0) {
        doc.fillColor('#f5f5f5');
        doc.rect(currentX, currentY, tableWidth, rowHeight).fill();
        doc.fillColor('#000000');
      }

      // Draw row borders
      doc.rect(currentX, currentY, colWidths.sn, rowHeight).stroke();
      doc.text((index + 1).toString(), currentX + 5, currentY + 8, { width: colWidths.sn - 10, align: 'center' });
      currentX += colWidths.sn;

      doc.rect(currentX, currentY, colWidths.subject, rowHeight).stroke();
      doc.text(subject.subjectName, currentX + 5, currentY + 8, {
        width: colWidths.subject - 10,
        ellipsis: true
      });
      currentX += colWidths.subject;

      doc.rect(currentX, currentY, colWidths.creditHrs, rowHeight).stroke();
      doc.text(subject.creditHours?.toString() || '-', currentX + 5, currentY + 8, { width: colWidths.creditHrs - 10, align: 'center' });
      currentX += colWidths.creditHrs;

      doc.rect(currentX, currentY, colWidths.theory, rowHeight).stroke();
      doc.text(subject.theoryMarks > 0 ? subject.theoryMarks.toFixed(1) : '-', currentX + 5, currentY + 8, { width: colWidths.theory - 10, align: 'center' });
      currentX += colWidths.theory;

      doc.rect(currentX, currentY, colWidths.practical, rowHeight).stroke();
      doc.text(subject.practicalMarks > 0 ? subject.practicalMarks.toFixed(1) : '-', currentX + 5, currentY + 8, { width: colWidths.practical - 10, align: 'center' });
      currentX += colWidths.practical;

      doc.rect(currentX, currentY, colWidths.total, rowHeight).stroke();
      doc.font('Helvetica-Bold').text(subject.totalMarks.toFixed(1), currentX + 5, currentY + 8, { width: colWidths.total - 10, align: 'center' });
      doc.font('Helvetica');
      currentX += colWidths.total;

      doc.rect(currentX, currentY, colWidths.fullMarks, rowHeight).stroke();
      doc.text(subject.fullMarks.toString(), currentX + 5, currentY + 8, { width: colWidths.fullMarks - 10, align: 'center' });
      currentX += colWidths.fullMarks;

      doc.rect(currentX, currentY, colWidths.grade, rowHeight).stroke();
      
      // Grade colors based on performance
      const gradeColors: Record<string, string> = {
        'A+': '#1b5e20', 'A': '#2e7d32', 'B+': '#388e3c', 'B': '#4caf50',
        'C+': '#ff9800', 'C': '#f57c00', 'D': '#ef6c00', 'NG': '#c62828'
      };
      doc.fillColor(gradeColors[subject.grade] || '#000000');
      doc.font('Helvetica-Bold').text(subject.grade, currentX + 5, currentY + 8, { width: colWidths.grade - 10, align: 'center' });
      doc.fillColor('#000000');
      doc.font('Helvetica');
      currentX += colWidths.grade;

      doc.rect(currentX, currentY, colWidths.gradePoint, rowHeight).stroke();
      doc.text(subject.gradePoint.toFixed(2), currentX + 5, currentY + 8, { width: colWidths.gradePoint - 10, align: 'center' });

      currentY += rowHeight;
    });

    // Draw final outer border for table
    doc.lineWidth(1.5);
    doc.rect(tableLeft, startY + 22, tableWidth, currentY - startY - 22).stroke();
    doc.lineWidth(0.5);
  }

  /**
   * Generate summary section (GPA, Rank, Attendance)
   */
  private generateSummary(
    doc: PDFKit.PDFDocument,
    reportCardData: ReportCardData,
    _options: ReportCardOptions
  ): void {
    const margin = 40;
    const startY = 560;
    const pageWidth = doc.page.width;
    const boxWidth = (pageWidth - (margin * 2) - 80) / 3;
    const boxHeight = 90;
    const leftBox = margin + 20;
    const midBox = leftBox + boxWidth + 20;
    const rightBox = midBox + boxWidth + 20;

    // Academic Performance Box
    doc.fillColor('#e8f5e9');
    doc.rect(leftBox, startY, boxWidth, boxHeight).fill();
    doc.strokeColor('#2e7d32');
    doc.lineWidth(1.5);
    doc.rect(leftBox, startY, boxWidth, boxHeight).stroke();
    doc.lineWidth(0.5);
    doc.strokeColor('#000000');
    
    doc.fontSize(12).font('Helvetica-Bold');
    doc.fillColor('#1b5e20');
    doc.text('ACADEMIC PERFORMANCE', leftBox + 10, startY + 10, { width: boxWidth - 20, align: 'center' });
    doc.fillColor('#000000');
    
    doc.fontSize(11).font('Helvetica');
    doc.text('Term GPA:', leftBox + 15, startY + 35, { continued: true });
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#1b5e20');
    doc.text(` ${reportCardData.termGPA.toFixed(2)}`, { continued: false });
    doc.fillColor('#000000');
    
    if (reportCardData.cumulativeGPA) {
      doc.fontSize(11).font('Helvetica');
      doc.text('Cumulative GPA:', leftBox + 15, startY + 58, { continued: true });
      doc.font('Helvetica-Bold').fontSize(14);
      doc.text(` ${reportCardData.cumulativeGPA.toFixed(2)}`, { continued: false });
    }

    // Class Rank Box
    doc.fillColor('#e3f2fd');
    doc.rect(midBox, startY, boxWidth, boxHeight).fill();
    doc.strokeColor('#1976d2');
    doc.lineWidth(1.5);
    doc.rect(midBox, startY, boxWidth, boxHeight).stroke();
    doc.lineWidth(0.5);
    doc.strokeColor('#000000');
    
    doc.fontSize(12).font('Helvetica-Bold');
    doc.fillColor('#0d47a1');
    doc.text('CLASS RANK', midBox + 10, startY + 10, { width: boxWidth - 20, align: 'center' });
    doc.fillColor('#000000');
    
    doc.fontSize(11).font('Helvetica');
    doc.text('Position:', midBox + 15, startY + 35, { continued: true });
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#0d47a1');
    doc.text(` ${reportCardData.rank} / ${reportCardData.totalStudents}`, { continued: false });
    doc.fillColor('#000000');
    
    doc.fontSize(11).font('Helvetica');
    doc.text('Percentile:', midBox + 15, startY + 58, { continued: true });
    doc.font('Helvetica-Bold').fontSize(14);
    doc.text(` ${reportCardData.percentile.toFixed(1)}%`, { continued: false });

    // Attendance Box
    doc.fillColor('#fff3e0');
    doc.rect(rightBox, startY, boxWidth, boxHeight).fill();
    doc.strokeColor('#f57c00');
    doc.lineWidth(1.5);
    doc.rect(rightBox, startY, boxWidth, boxHeight).stroke();
    doc.lineWidth(0.5);
    doc.strokeColor('#000000');
    
    doc.fontSize(12).font('Helvetica-Bold');
    doc.fillColor('#e65100');
    doc.text('ATTENDANCE', rightBox + 10, startY + 10, { width: boxWidth - 20, align: 'center' });
    doc.fillColor('#000000');
    
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Days: ${reportCardData.attendance.totalDays}`, rightBox + 15, startY + 32);
    doc.text(`Present: ${reportCardData.attendance.presentDays}  |  Absent: ${reportCardData.attendance.absentDays}`, rightBox + 15, startY + 48);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#e65100');
    doc.text(`Percentage: ${reportCardData.attendance.attendancePercentage.toFixed(1)}%`, rightBox + 15, startY + 68);
    doc.fillColor('#000000');
  }

  /**
   * Generate remarks section
   */
  private generateRemarks(
    doc: PDFKit.PDFDocument,
    reportCardData: ReportCardData,
    _options: ReportCardOptions
  ): void {
    const margin = 40;
    const startY = 665;
    const pageWidth = doc.page.width;
    const remarksWidth = pageWidth - (margin * 2) - 40;

    // Remarks Box with styling
    doc.fillColor('#fafafa');
    doc.rect(margin + 20, startY, remarksWidth, 50).fill();
    doc.strokeColor('#9e9e9e');
    doc.rect(margin + 20, startY, remarksWidth, 50).stroke();
    doc.strokeColor('#000000');
    
    doc.fontSize(11).font('Helvetica-Bold');
    doc.fillColor('#424242');
    doc.text('TEACHER\'S REMARKS:', margin + 30, startY + 8);
    doc.fillColor('#000000');
    
    doc.font('Helvetica').fontSize(10);
    const remarks = reportCardData.classTeacherRemarks || reportCardData.principalRemarks || 
      'Good academic performance. Continue to work hard and improve in all subjects.';
    doc.text(remarks, margin + 30, startY + 25, {
      width: remarksWidth - 20,
      align: 'left'
    });
  }

  /**
   * Generate footer with signatures
   */
  private generateFooter(
    doc: PDFKit.PDFDocument,
    schoolInfo: SchoolInfo,
    options: ReportCardOptions
  ): void {
    const margin = 40;
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const footerY = pageHeight - 90;
    
    // Calculate signature positions
    const sigWidth = (pageWidth - (margin * 2) - 100) / 3;
    const leftSig = margin + 30;
    const centerSig = leftSig + sigWidth + 30;
    const rightSig = centerSig + sigWidth + 30;

    // Signature lines with styling
    doc.fontSize(10).font('Helvetica');
    doc.fillColor('#333333');

    // Class Teacher Signature
    if (options.includeClassTeacherSignature) {
      doc.strokeColor('#1976d2');
      doc.lineWidth(1);
      doc.moveTo(leftSig + 20, footerY).lineTo(leftSig + sigWidth - 20, footerY).stroke();
      doc.lineWidth(0.5);
      doc.strokeColor('#000000');
      
      doc.fontSize(10).font('Helvetica-Bold');
      doc.fillColor('#1976d2');
      doc.text('Class Teacher', leftSig, footerY + 8, { width: sigWidth, align: 'center' });
      doc.font('Helvetica').fontSize(9).fillColor('#666666');
      doc.text('Signature & Date', leftSig, footerY + 22, { width: sigWidth, align: 'center' });
    }

    // Principal Signature
    if (options.includePrincipalSignature) {
      doc.strokeColor('#1b5e20');
      doc.lineWidth(1);
      doc.moveTo(centerSig + 20, footerY).lineTo(centerSig + sigWidth - 20, footerY).stroke();
      doc.lineWidth(0.5);
      doc.strokeColor('#000000');
      
      doc.fontSize(10).font('Helvetica-Bold');
      doc.fillColor('#1b5e20');
      doc.text('Principal', centerSig, footerY + 8, { width: sigWidth, align: 'center' });
      doc.font('Helvetica').fontSize(9).fillColor('#666666');
      doc.text('Signature & Seal', centerSig, footerY + 22, { width: sigWidth, align: 'center' });
    }

    // Parent Signature
    doc.strokeColor('#f57c00');
    doc.lineWidth(1);
    doc.moveTo(rightSig + 20, footerY).lineTo(rightSig + sigWidth - 20, footerY).stroke();
    doc.lineWidth(0.5);
    doc.strokeColor('#000000');
    
    doc.fontSize(10).font('Helvetica-Bold');
    doc.fillColor('#e65100');
    doc.text('Parent/Guardian', rightSig, footerY + 8, { width: sigWidth, align: 'center' });
    doc.font('Helvetica').fontSize(9).fillColor('#666666');
    doc.text('Signature', rightSig, footerY + 22, { width: sigWidth, align: 'center' });

    // Footer note
    doc.fontSize(8).font('Helvetica').fillColor('#888888');
    doc.text(
      `Generated on: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} | This is a computer-generated document and does not require physical signature.`,
      margin,
      pageHeight - 30,
      { width: pageWidth - (margin * 2), align: 'center' }
    );

    // School Seal (if available)
    if (options.includeSchoolSeal && schoolInfo.sealPath && fs.existsSync(schoolInfo.sealPath)) {
      doc.image(schoolInfo.sealPath, rightSig + sigWidth - 80, footerY - 30, {
        width: 50,
        height: 50
      });
    }
  }

  /**
   * Save report card PDF to file
   */
  async saveReportCardPDF(
    reportCardData: ReportCardData,
    schoolInfo: SchoolInfo,
    outputPath: string,
    options: ReportCardOptions = { language: 'bilingual', format: 'ledger' }
  ): Promise<string> {
    const pdfBuffer = await this.generateReportCardPDF(reportCardData, schoolInfo, options);
    
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, pdfBuffer);
    
    return outputPath;
  }

  /**
   * Generate report card for a student
   */
  async generateStudentReportCard(
    studentId: number,
    termId: number,
    academicYearId: number,
    schoolInfo: SchoolInfo,
    options: ReportCardOptions = { language: 'bilingual', format: 'ledger' }
  ): Promise<Buffer> {
    const reportCardData = await this.gatherReportCardData(
      studentId,
      termId,
      academicYearId
    );

    const pdfBuffer = await this.generateReportCardPDF(
      reportCardData,
      schoolInfo,
      options
    );

    return pdfBuffer;
  }
}

// Export instance
export default new ReportCardService();

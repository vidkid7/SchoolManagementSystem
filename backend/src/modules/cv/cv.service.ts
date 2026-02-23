import PDFDocument from 'pdfkit';
import { logger } from '@utils/logger';
import StudentRepository from '@modules/student/student.repository';
import Student from '@models/Student.model';

/**
 * CV Data Interface
 */
export interface CVData {
  student: Student;
  attendance: {
    overallPercentage: number;
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    excusedDays: number;
  };
  grades: Array<{
    subject: string;
    marks: number;
    grade: string;
  }>;
  eca: {
    participations: Array<{
      ecaName: string;
      category: string;
      duration: string;
      attendancePercentage: number;
      status: string;
    }>;
    achievements: Array<{
      title: string;
      ecaName: string;
      type: string;
      level: string;
      position?: string;
      date: Date;
    }>;
    summary: {
      totalECAs: number;
      totalAchievements: number;
      highLevelAchievements: number;
      averageAttendance: number;
    };
  };
  sports: {
    participations: Array<{
      sportName: string;
      category: string;
      duration: string;
      attendancePercentage: number;
      status: string;
    }>;
    achievements: Array<{
      title: string;
      sportName: string;
      type: string;
      level: string;
      position?: string;
      medal?: string;
      date: Date;
    }>;
    summary: {
      totalSports: number;
      totalAchievements: number;
      highLevelAchievements: number;
      averageAttendance: number;
      medalCount: {
        gold: number;
        silver: number;
        bronze: number;
      };
      recordsSet: number;
    };
  };
  certificates: Array<{
    title: string;
    issuedDate: string;
  }>;
}

/**
 * CV Customization Options
 */
export interface CVCustomization {
  templateId: string;
  schoolBrandingEnabled: boolean;
  includePhoto: boolean;
  includeAttendance: boolean;
  includeGrades: boolean;
  includeECA: boolean;
  includeSports: boolean;
  includeCertificates: boolean;
}

/**
 * CV Service
 * Handles CV data aggregation and PDF generation
 */
class CVService {
  /**
   * Get CV data for a student
   */
  async getCVData(studentId: number): Promise<CVData> {
    try {
      const student = await StudentRepository.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      // Mock data - replace with actual data from respective modules
      const cvData: CVData = {
        student,
        attendance: {
          overallPercentage: 92.5,
          totalDays: 200,
          presentDays: 185,
          absentDays: 10,
          lateDays: 5,
          excusedDays: 0
        },
        grades: [
          { subject: 'English', marks: 85, grade: 'A' },
          { subject: 'Mathematics', marks: 92, grade: 'A+' },
          { subject: 'Science', marks: 78, grade: 'B+' },
          { subject: 'Nepali', marks: 88, grade: 'A' },
          { subject: 'Social Studies', marks: 82, grade: 'A-' }
        ],
        eca: {
          participations: [
            {
              ecaName: 'Scouts',
              category: 'Community Service',
              duration: '2 years',
              attendancePercentage: 95,
              status: 'Active'
            },
            {
              ecaName: 'Music Club',
              category: 'Arts',
              duration: '1 year',
              attendancePercentage: 88,
              status: 'Active'
            }
          ],
          achievements: [
            {
              title: 'First Prize in School Music Competition',
              ecaName: 'Music Club',
              type: 'Competition',
              level: 'School',
              position: '1st',
              date: new Date('2024-01-15')
            }
          ],
          summary: {
            totalECAs: 2,
            totalAchievements: 1,
            highLevelAchievements: 0,
            averageAttendance: 91.5
          }
        },
        sports: {
          participations: [
            {
              sportName: 'Football',
              category: 'Team Sports',
              duration: '3 years',
              attendancePercentage: 92,
              status: 'Active'
            }
          ],
          achievements: [
            {
              title: 'District Level Winner',
              sportName: 'Football',
              type: 'Tournament',
              level: 'District',
              position: 'Captain',
              medal: 'Gold',
              date: new Date('2024-02-20')
            }
          ],
          summary: {
            totalSports: 1,
            totalAchievements: 1,
            highLevelAchievements: 1,
            averageAttendance: 92,
            medalCount: {
              gold: 1,
              silver: 0,
              bronze: 0
            },
            recordsSet: 0
          }
        },
        certificates: [
          { title: 'Character Certificate', issuedDate: '2024-03-15' },
          { title: 'Transfer Certificate', issuedDate: '2024-03-20' }
        ]
      };

      return cvData;
    } catch (error) {
      logger.error('Error getting CV data', { error, studentId });
      throw error;
    }
  }

  /**
   * Generate PDF CV
   */
  async generatePDF(
    studentId: number,
    customization: Partial<CVCustomization> = {}
  ): Promise<Buffer> {
    try {
      const cvData = await this.getCVData(studentId);
      
      const defaultCustomization: CVCustomization = {
        templateId: 'default',
        schoolBrandingEnabled: true,
        includePhoto: true,
        includeAttendance: true,
        includeGrades: true,
        includeECA: true,
        includeSports: true,
        includeCertificates: true,
        ...customization
      };

      return this.createPDF(cvData, defaultCustomization);
    } catch (error) {
      logger.error('Error generating PDF', { error, studentId });
      throw error;
    }
  }

  /**
   * Create PDF document
   */
  // eslint-disable-next-line max-lines-per-function
  private createPDF(
    cvData: CVData,
    customization: CVCustomization
  ): Promise<Buffer> {
    // eslint-disable-next-line max-lines-per-function, complexity
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Header
        if (customization.schoolBrandingEnabled) {
          doc.fontSize(20).text('School Management System', { align: 'center' });
          doc.fontSize(16).text('Student Curriculum Vitae', { align: 'center' });
          doc.moveDown();
        }

        // Student Info
        doc.fontSize(14).text('Personal Information', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        doc.text(`Name: ${cvData.student.firstNameEn} ${cvData.student.lastNameEn}`);
        doc.text(`Student ID: ${cvData.student.studentCode}`);
        doc.text(`Class: ${'N/A'}`);
        doc.text(`Date of Birth: ${cvData.student.dateOfBirthBS || 'N/A'}`);
        doc.text(`Gender: ${cvData.student.gender || 'N/A'}`);
        doc.text(`Contact: ${cvData.student.phone || 'N/A'}`);
        doc.moveDown();

        // Attendance
        if (customization.includeAttendance) {
          doc.fontSize(14).text('Attendance Record', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12);
          doc.text(`Total Days: ${cvData.attendance.totalDays}`);
          doc.text(`Present Days: ${cvData.attendance.presentDays}`);
          doc.text(`Absent Days: ${cvData.attendance.absentDays}`);
          doc.text(`Attendance Percentage: ${cvData.attendance.overallPercentage}%`);
          doc.moveDown();
        }

        // Grades
        if (customization.includeGrades && cvData.grades.length > 0) {
          doc.fontSize(14).text('Academic Performance', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12);
          cvData.grades.forEach(grade => {
            doc.text(`${grade.subject}: ${grade.marks}/100 (Grade: ${grade.grade})`);
          });
          doc.moveDown();
        }

        // ECA
        if (customization.includeECA && cvData.eca.participations.length > 0) {
          doc.fontSize(14).text('Extra-Curricular Activities', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12);
          cvData.eca.participations.forEach(participation => {
            doc.text(`• ${participation.ecaName} (${participation.category})`);
            doc.text(`  Duration: ${participation.duration}, Attendance: ${participation.attendancePercentage}%`, { indent: 20 });
          });
          if (cvData.eca.achievements.length > 0) {
            doc.moveDown(0.5);
            doc.text('Achievements:');
            cvData.eca.achievements.forEach(achievement => {
              doc.text(`• ${achievement.title} - ${achievement.level} Level`, { indent: 20 });
            });
          }
          doc.moveDown();
        }

        // Sports
        if (customization.includeSports && cvData.sports.participations.length > 0) {
          doc.fontSize(14).text('Sports Activities', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12);
          cvData.sports.participations.forEach(participation => {
            doc.text(`• ${participation.sportName} (${participation.category})`);
            doc.text(`  Duration: ${participation.duration}, Attendance: ${participation.attendancePercentage}%`, { indent: 20 });
          });
          if (cvData.sports.achievements.length > 0) {
            doc.moveDown(0.5);
            doc.text('Achievements:');
            cvData.sports.achievements.forEach(achievement => {
              doc.text(`• ${achievement.title} - ${achievement.level} Level${achievement.medal ? ` (${achievement.medal})` : ''}`, { indent: 20 });
            });
          }
          doc.moveDown();
        }

        // Certificates
        if (customization.includeCertificates && cvData.certificates.length > 0) {
          doc.fontSize(14).text('Certificates', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12);
          cvData.certificates.forEach(cert => {
            doc.text(`• ${cert.title} (Issued: ${cert.issuedDate})`);
          });
          doc.moveDown();
        }

        // Footer
        doc.fontSize(10).text(
          `Generated on: ${new Date().toLocaleDateString()}`,
          { align: 'center' }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Check if CV needs regeneration
   */
  needsRegeneration(_studentId: number): boolean {
    // Logic to check if student data has changed since last CV generation
    // For now, always return false
    return false;
  }
}

export default new CVService();

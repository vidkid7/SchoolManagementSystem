import PDFDocument from 'pdfkit';
import { logger } from '@utils/logger';
import StudentRepository from '@modules/student/student.repository';
import Student from '@models/Student.model';
import AttendanceRecord, { AttendanceStatus } from '@models/AttendanceRecord.model';
import Grade from '@models/Grade.model';
import Exam from '@models/Exam.model';
import { Subject } from '@models/Subject.model';
import ECAEnrollment from '@models/ECAEnrollment.model';
import ECAAchievement from '@models/ECAAchievement.model';
import ECA from '@models/ECA.model';
import SportsEnrollment from '@models/SportsEnrollment.model';
import SportsAchievement from '@models/SportsAchievement.model';
import Sport from '@models/Sport.model';
import { Certificate } from '@models/Certificate.model';
import { Op } from 'sequelize';

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
  private getDurationLabel(dateValue?: string | Date): string {
    if (!dateValue) return 'N/A';

    const start = new Date(dateValue);
    if (Number.isNaN(start.getTime())) return 'N/A';

    const now = new Date();
    const diffMs = Math.max(0, now.getTime() - start.getTime());
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays >= 365) {
      const years = Math.floor(diffDays / 365);
      return `${years} year${years > 1 ? 's' : ''}`;
    }

    if (diffDays >= 30) {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? 's' : ''}`;
    }

    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  }

  /**
   * Get CV data for a student
   */
  async getCVData(studentId: number): Promise<CVData> {
    try {
      const student = await StudentRepository.findById(studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      const [
        attendanceRecords,
        grades,
        ecaEnrollments,
        ecaAchievements,
        sportsEnrollments,
        sportsAchievements,
        certificates
      ] = await Promise.all([
        AttendanceRecord.findAll({ where: { studentId } }),
        Grade.findAll({
          where: { studentId },
          include: [
            {
              model: Exam,
              as: 'exam',
              required: false,
              include: [{ model: Subject, as: 'subject', required: false }]
            }
          ],
          order: [['enteredAt', 'DESC']],
          limit: 30
        }),
        ECAEnrollment.findAll({
          where: { studentId },
          include: [{ model: ECA, as: 'eca', required: false }],
          order: [['createdAt', 'DESC']]
        }),
        ECAAchievement.findAll({
          where: { studentId },
          include: [{ model: ECA, as: 'eca', required: false }],
          order: [['achievementDate', 'DESC']]
        }),
        SportsEnrollment.findAll({
          where: { studentId },
          include: [{ model: Sport, as: 'sport', required: false }],
          order: [['createdAt', 'DESC']]
        }),
        SportsAchievement.findAll({
          where: { studentId },
          order: [['achievementDate', 'DESC']]
        }),
        Certificate.findAll({
          where: { studentId },
          order: [['issuedDate', 'DESC']],
          limit: 20
        })
      ]);

      const sportIds = Array.from(new Set(sportsAchievements.map(a => a.sportId).filter(Boolean)));
      const sports = sportIds.length > 0
        ? await Sport.findAll({ where: { sportId: { [Op.in]: sportIds } } as any })
        : [];
      const sportNameMap = new Map<number, string>(
        sports.map(sport => [sport.sportId, sport.name])
      );

      const presentDays = attendanceRecords.filter(
        r => r.status === AttendanceStatus.PRESENT
      ).length;
      const absentDays = attendanceRecords.filter(
        r => r.status === AttendanceStatus.ABSENT
      ).length;
      const lateDays = attendanceRecords.filter(
        r => r.status === AttendanceStatus.LATE
      ).length;
      const excusedDays = attendanceRecords.filter(
        r => r.status === AttendanceStatus.EXCUSED
      ).length;
      const totalDays = attendanceRecords.length;

      const ecaParticipationRows = ecaEnrollments.map((enrollment: any) => ({
        ecaName: enrollment.eca?.name || `ECA ${enrollment.ecaId}`,
        category: enrollment.eca?.category || 'unknown',
        duration: this.getDurationLabel(enrollment.enrollmentDate),
        attendancePercentage: enrollment.getAttendancePercentage(),
        status: enrollment.status
      }));

      const ecaAchievementRows = ecaAchievements.map((achievement: any) => ({
        title: achievement.title,
        ecaName: achievement.eca?.name || `ECA ${achievement.ecaId}`,
        type: achievement.type,
        level: achievement.level,
        position: achievement.position,
        date: new Date(achievement.achievementDate)
      }));

      const sportsParticipationRows = sportsEnrollments.map((enrollment: any) => ({
        sportName: enrollment.sport?.name || `Sport ${enrollment.sportId}`,
        category: enrollment.sport?.category || 'unknown',
        duration: this.getDurationLabel(enrollment.enrollmentDate),
        attendancePercentage: enrollment.getAttendancePercentage(),
        status: enrollment.status
      }));

      const sportsAchievementRows = sportsAchievements.map((achievement) => ({
        title: achievement.title,
        sportName: sportNameMap.get(achievement.sportId) || `Sport ${achievement.sportId}`,
        type: achievement.type,
        level: achievement.level,
        position: achievement.position,
        medal: achievement.medal,
        date: new Date(achievement.achievementDate)
      }));

      const sportMedals = sportsAchievements.reduce(
        (acc, achievement) => {
          if (achievement.medal === 'gold') acc.gold += 1;
          if (achievement.medal === 'silver') acc.silver += 1;
          if (achievement.medal === 'bronze') acc.bronze += 1;
          return acc;
        },
        { gold: 0, silver: 0, bronze: 0 }
      );

      const cvData: CVData = {
        student,
        attendance: {
          overallPercentage: totalDays > 0 ? Number(((presentDays / totalDays) * 100).toFixed(2)) : 0,
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          excusedDays
        },
        grades: grades.map((grade: any) => ({
          subject: grade.exam?.subject?.nameEn || grade.exam?.name || `Exam ${grade.examId}`,
          marks: Number(grade.totalMarks),
          grade: grade.grade
        })),
        eca: {
          participations: ecaParticipationRows,
          achievements: ecaAchievementRows,
          summary: {
            totalECAs: ecaParticipationRows.length,
            totalAchievements: ecaAchievementRows.length,
            highLevelAchievements: ecaAchievementRows.filter(a => ['national', 'international'].includes(a.level)).length,
            averageAttendance: ecaParticipationRows.length > 0
              ? Number((ecaParticipationRows.reduce((sum, p) => sum + p.attendancePercentage, 0) / ecaParticipationRows.length).toFixed(2))
              : 0
          }
        },
        sports: {
          participations: sportsParticipationRows,
          achievements: sportsAchievementRows,
          summary: {
            totalSports: sportsParticipationRows.length,
            totalAchievements: sportsAchievementRows.length,
            highLevelAchievements: sportsAchievementRows.filter(a => ['national', 'international'].includes(a.level)).length,
            averageAttendance: sportsParticipationRows.length > 0
              ? Number((sportsParticipationRows.reduce((sum, p) => sum + p.attendancePercentage, 0) / sportsParticipationRows.length).toFixed(2))
              : 0,
            medalCount: sportMedals,
            recordsSet: sportsAchievements.filter(achievement => achievement.type === 'record').length
          }
        },
        certificates: certificates.map(certificate => ({
          title: String(certificate.data?.title || `${certificate.type.replace(/_/g, ' ')} certificate`),
          issuedDate: certificate.issuedDateBS || new Date(certificate.issuedDate).toISOString().split('T')[0]
        }))
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
    // Always regenerate to ensure CV reflects latest profile/activity state.
    return true;
  }
}

export default new CVService();

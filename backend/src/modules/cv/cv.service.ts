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
  async getCVData(studentId: number): Promise<any> {
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
        AttendanceRecord.findAll({ where: { studentId } }).catch(() => []),
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
        }).catch(() => []),
        ECAEnrollment.findAll({
          where: { studentId },
          include: [{ model: ECA, as: 'eca', required: false }],
          order: [['createdAt', 'DESC']]
        }).catch(() => []),
        ECAAchievement.findAll({
          where: { studentId },
          include: [{ model: ECA, as: 'eca', required: false }],
          order: [['achievementDate', 'DESC']]
        }).catch(err => {
          console.error('Error fetching ECA achievements:', err);
          return [];
        }),
        SportsEnrollment.findAll({
          where: { studentId },
          include: [{ model: Sport, as: 'sport', required: false }],
          order: [['createdAt', 'DESC']]
        }).catch(() => []),
        SportsAchievement.findAll({
          where: { studentId },
          order: [['achievementDate', 'DESC']]
        }).catch(() => []),
        Certificate.findAll({
          where: { studentId },
          order: [['issuedDate', 'DESC']],
          limit: 20
        }).catch(() => [])
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

      const sportMedals = {
        gold: sportsAchievements.filter(a => a.medal === 'gold').length,
        silver: sportsAchievements.filter(a => a.medal === 'silver').length,
        bronze: sportsAchievements.filter(a => a.medal === 'bronze').length
      };

      // Calculate GPA and academic performance
      const gradePoints: { [key: string]: number } = {
        'A+': 4.0, 'A': 4.0, 'A-': 3.7,
        'B+': 3.3, 'B': 3.0, 'B-': 2.7,
        'C+': 2.3, 'C': 2.0, 'C-': 1.7,
        'D+': 1.3, 'D': 1.0, 'F': 0.0
      };

      const validGrades = grades.filter((g: any) => g.grade && gradePoints[g.grade] !== undefined);
      const overallGPA = validGrades.length > 0
        ? validGrades.reduce((sum: number, g: any) => sum + gradePoints[g.grade], 0) / validGrades.length
        : 0;

      // Transform data to match frontend interface
      const cvData = {
        studentId: student.studentId,
        generatedAt: new Date(),
        verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/verify-cv/${student.studentId}`,
        personalInfo: {
          studentId: student.studentId,
          studentCode: student.studentCode,
          fullNameEn: `${student.firstNameEn} ${student.lastNameEn}`,
          fullNameNp: student.firstNameNp && student.lastNameNp ? `${student.firstNameNp} ${student.lastNameNp}` : undefined,
          dateOfBirthBS: student.dateOfBirthBS || '',
          dateOfBirthAD: student.dateOfBirthAD || new Date(),
          gender: student.gender || 'Not specified',
          bloodGroup: student.bloodGroup,
          addressEn: student.addressEn || 'Not provided',
          addressNp: student.addressNp || '',
          phone: student.phone,
          email: student.email,
          photoUrl: student.photoUrl
        },
        academicPerformance: validGrades.length > 0 ? {
          academicYears: [],
          overallGPA: Number(overallGPA.toFixed(2)),
          totalSubjects: validGrades.length,
          averageGrade: validGrades.length > 0 ? validGrades[0].grade : 'N/A'
        } : undefined,
        attendance: {
          overallPercentage: totalDays > 0 ? Number(((presentDays / totalDays) * 100).toFixed(2)) : 0,
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          excusedDays,
          yearWise: []
        },
        eca: ecaParticipationRows.length > 0 || ecaAchievementRows.length > 0 ? {
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
        } : undefined,
        sports: sportsParticipationRows.length > 0 || sportsAchievementRows.length > 0 ? {
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
        } : undefined,
        certificates: certificates.length > 0 ? {
          certificates: certificates.map(certificate => ({
            certificateNumber: certificate.certificateNumber || '',
            type: certificate.type,
            name: String(certificate.data?.title || `${certificate.type.replace(/_/g, ' ')} certificate`),
            issuedDate: certificate.issuedDate,
            issuedDateBS: certificate.issuedDateBS || ''
          })),
          totalCount: certificates.length
        } : undefined,
        customFields: {
          skills: [],
          hobbies: [],
          careerGoals: '',
          personalStatement: ''
        }
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
        templateId: 'standard',
        schoolBrandingEnabled: true,
        includePhoto: true,
        includeAttendance: true,
        includeGrades: true,
        includeECA: true,
        includeSports: true,
        includeCertificates: true,
        ...customization
      };

      // Ensure valid templateId
      const validTemplates = ['standard', 'professional', 'modern'];
      if (!defaultCustomization.templateId || !validTemplates.includes(defaultCustomization.templateId)) {
        defaultCustomization.templateId = 'standard';
      }

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
    cvData: any,
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
        if (cvData.personalInfo) {
          doc.fontSize(14).text('Personal Information', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12);
          doc.text(`Name: ${cvData.personalInfo.fullNameEn}`);
          doc.text(`Student ID: ${cvData.personalInfo.studentCode}`);
          doc.text(`Date of Birth: ${cvData.personalInfo.dateOfBirthBS || 'N/A'}`);
          doc.text(`Gender: ${cvData.personalInfo.gender || 'N/A'}`);
          doc.text(`Address: ${cvData.personalInfo.addressEn || 'N/A'}`);
          doc.text(`Contact: ${cvData.personalInfo.phone || 'N/A'}`);
          if (cvData.personalInfo.email) {
            doc.text(`Email: ${cvData.personalInfo.email}`);
          }
          doc.moveDown();
        }

        // Attendance
        if (customization.includeAttendance && cvData.attendance) {
          doc.fontSize(14).text('Attendance Record', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12);
          doc.text(`Total Days: ${cvData.attendance.totalDays}`);
          doc.text(`Present Days: ${cvData.attendance.presentDays}`);
          doc.text(`Absent Days: ${cvData.attendance.absentDays}`);
          doc.text(`Attendance Percentage: ${cvData.attendance.overallPercentage}%`);
          doc.moveDown();
        }

        // Academic Performance
        if (customization.includeGrades && cvData.academicPerformance) {
          doc.fontSize(14).text('Academic Performance', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12);
          doc.text(`Overall GPA: ${cvData.academicPerformance.overallGPA}`);
          doc.text(`Total Subjects: ${cvData.academicPerformance.totalSubjects}`);
          doc.text(`Average Grade: ${cvData.academicPerformance.averageGrade}`);
          doc.moveDown();
        }

        // ECA
        if (customization.includeECA && cvData.eca && cvData.eca.participations.length > 0) {
          doc.fontSize(14).text('Extra-Curricular Activities', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12);
          cvData.eca.participations.forEach((participation: any) => {
            doc.text(`• ${participation.ecaName} (${participation.category})`);
            doc.text(`  Duration: ${participation.duration}, Attendance: ${participation.attendancePercentage}%`, { indent: 20 });
          });
          if (cvData.eca.achievements.length > 0) {
            doc.moveDown(0.5);
            doc.text('Achievements:');
            cvData.eca.achievements.forEach((achievement: any) => {
              doc.text(`• ${achievement.title} - ${achievement.level} Level`, { indent: 20 });
            });
          }
          doc.moveDown();
        }

        // Sports
        if (customization.includeSports && cvData.sports && cvData.sports.participations.length > 0) {
          doc.fontSize(14).text('Sports Activities', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12);
          cvData.sports.participations.forEach((participation: any) => {
            doc.text(`• ${participation.sportName} (${participation.category})`);
            doc.text(`  Duration: ${participation.duration}, Attendance: ${participation.attendancePercentage}%`, { indent: 20 });
          });
          if (cvData.sports.achievements.length > 0) {
            doc.moveDown(0.5);
            doc.text('Achievements:');
            cvData.sports.achievements.forEach((achievement: any) => {
              doc.text(`• ${achievement.title} - ${achievement.level} Level${achievement.medal ? ` (${achievement.medal})` : ''}`, { indent: 20 });
            });
          }
          doc.moveDown();
        }

        // Certificates
        if (customization.includeCertificates && cvData.certificates && cvData.certificates.totalCount > 0) {
          doc.fontSize(14).text('Certificates', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(12);
          cvData.certificates.certificates.forEach((cert: any) => {
            doc.text(`• ${cert.name} (Issued: ${cert.issuedDateBS || new Date(cert.issuedDate).toLocaleDateString()})`);
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

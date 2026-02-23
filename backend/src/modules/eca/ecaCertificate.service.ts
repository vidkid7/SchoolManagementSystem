/**
 * ECA Certificate Service
 * Business logic for ECA certificate generation
 * 
 * Features:
 * - Generate participation certificates
 * - Generate achievement certificates
 * - Include ECA participation in student CV
 * - Certificate data aggregation
 * 
 * Requirements: 11.8, 11.9
 */

import ECAEnrollment from '@models/ECAEnrollment.model';
import ECAAchievement from '@models/ECAAchievement.model';
import ECA from '@models/ECA.model';
import { logger } from '@utils/logger';

export interface ParticipationCertificateData {
  studentId: number;
  studentName: string;
  ecaId: number;
  ecaName: string;
  ecaCategory: string;
  enrollmentDate: Date;
  completionDate?: Date;
  attendancePercentage: number;
  totalSessions: number;
  academicYear: string;
  remarks?: string;
}

export interface AchievementCertificateData {
  studentId: number;
  studentName: string;
  achievementId: number;
  ecaId: number;
  ecaName: string;
  achievementTitle: string;
  achievementType: string;
  achievementLevel: string;
  position?: string;
  achievementDate: Date;
  achievementDateBS?: string;
  description?: string;
}

export interface StudentECACV {
  studentId: number;
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
}

class ECACertificateService {
  /**
   * Generate participation certificate data for a student's ECA enrollment
   * Requirements: 11.9
   * 
   * @param enrollmentId - ECA enrollment ID
   * @param studentName - Student's full name
   * @returns Participation certificate data
   * @throws Error if enrollment not found
   */
  async generateParticipationCertificateData(
    enrollmentId: number,
    studentName: string
  ): Promise<ParticipationCertificateData> {
    try {
      // 1. Find enrollment with ECA details
      const enrollment = await ECAEnrollment.findByPk(enrollmentId, {
        include: [
          {
            model: ECA,
            as: 'eca',
            attributes: ['ecaId', 'name', 'category', 'academicYearId']
          }
        ]
      });

      if (!enrollment) {
        throw new Error(`Enrollment with ID ${enrollmentId} not found`);
      }

      const eca = (enrollment as any).eca;
      if (!eca) {
        throw new Error(`ECA details not found for enrollment ${enrollmentId}`);
      }

      // 2. Validate enrollment is completed or has sufficient participation
      if (enrollment.status === 'withdrawn') {
        throw new Error('Cannot generate certificate for withdrawn enrollment');
      }

      // 3. Calculate attendance percentage
      const attendancePercentage = enrollment.getAttendancePercentage();

      // 4. Prepare certificate data
      const certificateData: ParticipationCertificateData = {
        studentId: enrollment.studentId,
        studentName,
        ecaId: eca.ecaId,
        ecaName: eca.name,
        ecaCategory: this.formatCategory(eca.category),
        enrollmentDate: enrollment.enrollmentDate,
        completionDate: enrollment.status === 'completed' ? enrollment.updatedAt : undefined,
        attendancePercentage,
        totalSessions: enrollment.totalSessions,
        academicYear: await this.getAcademicYearName(eca.academicYearId),
        remarks: enrollment.remarks
      };

      logger.info('Participation certificate data generated', {
        enrollmentId,
        studentId: enrollment.studentId,
        ecaName: eca.name,
        attendancePercentage
      });

      return certificateData;
    } catch (error) {
      logger.error('Error generating participation certificate data', {
        error,
        enrollmentId
      });
      throw error;
    }
  }

  /**
   * Generate achievement certificate data for a student's ECA achievement
   * Requirements: 11.9
   * 
   * @param achievementId - ECA achievement ID
   * @param studentName - Student's full name
   * @returns Achievement certificate data
   * @throws Error if achievement not found
   */
  async generateAchievementCertificateData(
    achievementId: number,
    studentName: string
  ): Promise<AchievementCertificateData> {
    try {
      // 1. Find achievement with ECA details
      const achievement = await ECAAchievement.findByPk(achievementId, {
        include: [
          {
            model: ECA,
            as: 'eca',
            attributes: ['ecaId', 'name']
          }
        ]
      });

      if (!achievement) {
        throw new Error(`Achievement with ID ${achievementId} not found`);
      }

      const eca = (achievement as any).eca;
      if (!eca) {
        throw new Error(`ECA details not found for achievement ${achievementId}`);
      }

      // 2. Prepare certificate data
      const certificateData: AchievementCertificateData = {
        studentId: achievement.studentId,
        studentName,
        achievementId: achievement.achievementId,
        ecaId: eca.ecaId,
        ecaName: eca.name,
        achievementTitle: achievement.title,
        achievementType: this.formatAchievementType(achievement.type),
        achievementLevel: this.formatAchievementLevel(achievement.level),
        position: achievement.position,
        achievementDate: achievement.achievementDate,
        achievementDateBS: achievement.achievementDateBS,
        description: achievement.description
      };

      logger.info('Achievement certificate data generated', {
        achievementId,
        studentId: achievement.studentId,
        achievementTitle: achievement.title,
        level: achievement.level
      });

      return certificateData;
    } catch (error) {
      logger.error('Error generating achievement certificate data', {
        error,
        achievementId
      });
      throw error;
    }
  }

  /**
   * Get all participation certificates data for a student
   * 
   * @param studentId - Student ID
   * @param studentName - Student's full name
   * @returns Array of participation certificate data
   */
  async getStudentParticipationCertificates(
    studentId: number,
    studentName: string
  ): Promise<ParticipationCertificateData[]> {
    try {
      // Get all completed enrollments
      const enrollments = await ECAEnrollment.findAll({
        where: {
          studentId,
          status: 'completed'
        },
        include: [
          {
            model: ECA,
            as: 'eca',
            attributes: ['ecaId', 'name', 'category', 'academicYearId']
          }
        ]
      });

      const certificates: ParticipationCertificateData[] = [];

      for (const enrollment of enrollments) {
        try {
          const certData = await this.generateParticipationCertificateData(
            enrollment.enrollmentId,
            studentName
          );
          certificates.push(certData);
        } catch (error) {
          logger.warn('Failed to generate certificate for enrollment', {
            enrollmentId: enrollment.enrollmentId,
            error
          });
        }
      }

      logger.info('Student participation certificates retrieved', {
        studentId,
        count: certificates.length
      });

      return certificates;
    } catch (error) {
      logger.error('Error getting student participation certificates', {
        error,
        studentId
      });
      throw error;
    }
  }

  /**
   * Get all achievement certificates data for a student
   * 
   * @param studentId - Student ID
   * @param studentName - Student's full name
   * @returns Array of achievement certificate data
   */
  async getStudentAchievementCertificates(
    studentId: number,
    studentName: string
  ): Promise<AchievementCertificateData[]> {
    try {
      // Get all achievements
      const achievements = await ECAAchievement.findAll({
        where: { studentId },
        include: [
          {
            model: ECA,
            as: 'eca',
            attributes: ['ecaId', 'name']
          }
        ],
        order: [['achievementDate', 'DESC']]
      });

      const certificates: AchievementCertificateData[] = [];

      for (const achievement of achievements) {
        try {
          const certData = await this.generateAchievementCertificateData(
            achievement.achievementId,
            studentName
          );
          certificates.push(certData);
        } catch (error) {
          logger.warn('Failed to generate certificate for achievement', {
            achievementId: achievement.achievementId,
            error
          });
        }
      }

      logger.info('Student achievement certificates retrieved', {
        studentId,
        count: certificates.length
      });

      return certificates;
    } catch (error) {
      logger.error('Error getting student achievement certificates', {
        error,
        studentId
      });
      throw error;
    }
  }

  /**
   * Get ECA participation data for student CV
   * Requirements: 11.8
   * 
   * @param studentId - Student ID
   * @returns Student ECA CV data
   */
  async getStudentECAForCV(studentId: number): Promise<StudentECACV> {
    try {
      // 1. Get all enrollments
      const enrollments = await ECAEnrollment.findAll({
        where: { studentId },
        include: [
          {
            model: ECA,
            as: 'eca',
            attributes: ['name', 'category']
          }
        ],
        order: [['enrollmentDate', 'DESC']]
      });

      // 2. Get all achievements
      const achievements = await ECAAchievement.findAll({
        where: { studentId },
        include: [
          {
            model: ECA,
            as: 'eca',
            attributes: ['name']
          }
        ],
        order: [['achievementDate', 'DESC']]
      });

      // 3. Format participations
      const participations = enrollments.map(enrollment => {
        const eca = (enrollment as any).eca;
        return {
          ecaName: eca?.name || 'Unknown',
          category: this.formatCategory(eca?.category || ''),
          duration: this.calculateDuration(enrollment.enrollmentDate, enrollment.updatedAt),
          attendancePercentage: enrollment.getAttendancePercentage(),
          status: enrollment.status
        };
      });

      // 4. Format achievements
      const achievementsList = achievements.map(achievement => {
        const eca = (achievement as any).eca;
        return {
          title: achievement.getDisplayTitle(),
          ecaName: eca?.name || 'Unknown',
          type: this.formatAchievementType(achievement.type),
          level: this.formatAchievementLevel(achievement.level),
          position: achievement.position,
          date: achievement.achievementDate
        };
      });

      // 5. Calculate summary statistics
      const totalAttendance = enrollments.reduce(
        (sum, e) => sum + e.getAttendancePercentage(),
        0
      );
      const averageAttendance = enrollments.length > 0
        ? Math.round(totalAttendance / enrollments.length)
        : 0;

      const highLevelAchievements = achievements.filter(a => a.isHighLevel()).length;

      const cvData: StudentECACV = {
        studentId,
        participations,
        achievements: achievementsList,
        summary: {
          totalECAs: enrollments.length,
          totalAchievements: achievements.length,
          highLevelAchievements,
          averageAttendance
        }
      };

      logger.info('Student ECA CV data generated', {
        studentId,
        totalECAs: enrollments.length,
        totalAchievements: achievements.length
      });

      return cvData;
    } catch (error) {
      logger.error('Error getting student ECA for CV', { error, studentId });
      throw error;
    }
  }

  /**
   * Validate if student is eligible for participation certificate
   * 
   * @param enrollmentId - Enrollment ID
   * @returns Eligibility result with message
   */
  async isEligibleForParticipationCertificate(
    enrollmentId: number
  ): Promise<{ eligible: boolean; message?: string }> {
    try {
      const enrollment = await ECAEnrollment.findByPk(enrollmentId);

      if (!enrollment) {
        return { eligible: false, message: 'Enrollment not found' };
      }

      if (enrollment.status === 'withdrawn') {
        return { eligible: false, message: 'Enrollment was withdrawn' };
      }

      // Require minimum 50% attendance for certificate
      const attendancePercentage = enrollment.getAttendancePercentage();
      if (attendancePercentage < 50) {
        return {
          eligible: false,
          message: `Insufficient attendance (${attendancePercentage}%). Minimum 50% required.`
        };
      }

      // Require minimum 5 sessions
      if (enrollment.totalSessions < 5) {
        return {
          eligible: false,
          message: `Insufficient sessions (${enrollment.totalSessions}). Minimum 5 required.`
        };
      }

      return { eligible: true };
    } catch (error) {
      logger.error('Error checking certificate eligibility', {
        error,
        enrollmentId
      });
      throw error;
    }
  }

  /**
   * Get certificate statistics for an ECA
   * 
   * @param ecaId - ECA ID
   * @returns Certificate statistics
   */
  async getECACertificateStats(ecaId: number): Promise<{
    totalParticipants: number;
    eligibleForCertificate: number;
    totalAchievements: number;
    achievementsByLevel: Record<string, number>;
  }> {
    try {
      // Get all enrollments
      const enrollments = await ECAEnrollment.findAll({
        where: { ecaId }
      });

      // Count eligible participants
      let eligibleCount = 0;
      for (const enrollment of enrollments) {
        const { eligible } = await this.isEligibleForParticipationCertificate(
          enrollment.enrollmentId
        );
        if (eligible) eligibleCount++;
      }

      // Get achievements
      const achievements = await ECAAchievement.findAll({
        where: { ecaId }
      });

      // Count by level
      const achievementsByLevel: Record<string, number> = {};
      achievements.forEach(achievement => {
        const level = achievement.level;
        achievementsByLevel[level] = (achievementsByLevel[level] || 0) + 1;
      });

      return {
        totalParticipants: enrollments.length,
        eligibleForCertificate: eligibleCount,
        totalAchievements: achievements.length,
        achievementsByLevel
      };
    } catch (error) {
      logger.error('Error getting ECA certificate stats', { error, ecaId });
      throw error;
    }
  }

  // Helper methods

  private formatCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      club: 'Club',
      cultural: 'Cultural Activity',
      community_service: 'Community Service',
      leadership: 'Leadership Program'
    };
    return categoryMap[category] || category;
  }

  private formatAchievementType(type: string): string {
    const typeMap: Record<string, string> = {
      award: 'Award',
      medal: 'Medal',
      certificate: 'Certificate',
      recognition: 'Recognition',
      position: 'Position'
    };
    return typeMap[type] || type;
  }

  private formatAchievementLevel(level: string): string {
    const levelMap: Record<string, string> = {
      school: 'School Level',
      district: 'District Level',
      regional: 'Regional Level',
      national: 'National Level',
      international: 'International Level'
    };
    return levelMap[level] || level;
  }

  private calculateDuration(startDate: Date, endDate: Date): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)
    );

    if (months < 1) return 'Less than 1 month';
    if (months === 1) return '1 month';
    if (months < 12) return `${months} months`;

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (remainingMonths === 0) {
      return years === 1 ? '1 year' : `${years} years`;
    }

    return `${years} year${years > 1 ? 's' : ''} ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
  }

  private async getAcademicYearName(academicYearId: number): Promise<string> {
    try {
      // This would typically query the AcademicYear model
      // For now, return a placeholder
      return `Academic Year ${academicYearId}`;
    } catch (error) {
      logger.warn('Error getting academic year name', { error, academicYearId });
      return 'Unknown Academic Year';
    }
  }
}

export default new ECACertificateService();

/**
 * Sports Achievement Service
 * Business logic for sports achievement tracking
 * 
 * Features:
 * - Record achievements (medals, ranks, records)
 * - Maintain school sports records
 * - Generate certificates for participants and winners
 * - Include sports achievements in student CV
 * - Upload tournament photos/videos
 * 
 * Requirements: 12.7, 12.8, 12.9, 12.10, 12.11
 */

import sportsAchievementRepository, { AchievementFilters, SchoolRecord } from './sportsAchievement.repository';
import SportsAchievement, { SportsAchievementCreationAttributes } from '@models/SportsAchievement.model';
import SportsEnrollment from '@models/SportsEnrollment.model';
import Sport from '@models/Sport.model';
import Tournament from '@models/Tournament.model';
import { logger } from '@utils/logger';

export interface ParticipationCertificateData {
  studentId: number;
  studentName: string;
  sportId: number;
  sportName: string;
  sportCategory: string;
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
  sportId: number;
  sportName: string;
  achievementTitle: string;
  achievementType: string;
  achievementLevel: string;
  position?: string;
  medal?: string;
  recordType?: string;
  recordValue?: string;
  tournamentName?: string;
  achievementDate: Date;
  achievementDateBS?: string;
  description?: string;
}

export interface StudentSportsCV {
  studentId: number;
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
    medalCount: { gold: number; silver: number; bronze: number };
    recordsSet: number;
    averageAttendance: number;
  };
}

class SportsAchievementService {
  /**
   * Record a new sports achievement
   * Requirements: 12.7
   * 
   * @param achievementData - Achievement data
   * @returns Created achievement
   */
  async recordAchievement(
    achievementData: SportsAchievementCreationAttributes
  ): Promise<SportsAchievement> {
    try {
      // Validate required fields
      this.validateAchievementData(achievementData);

      // Create achievement
      const achievement = await sportsAchievementRepository.create(achievementData);

      logger.info('Sports achievement recorded', {
        achievementId: achievement.achievementId,
        studentId: achievement.studentId,
        type: achievement.type,
        level: achievement.level
      });

      return achievement;
    } catch (error) {
      logger.error('Error recording achievement', { error, achievementData });
      throw error;
    }
  }

  /**
   * Get achievement by ID
   * 
   * @param achievementId - Achievement ID
   * @returns Achievement or null
   */
  async getAchievementById(achievementId: number): Promise<SportsAchievement | null> {
    return sportsAchievementRepository.findById(achievementId);
  }

  /**
   * Get all achievements with filters
   * 
   * @param filters - Filter criteria
   * @returns Array of achievements
   */
  async getAchievements(filters: AchievementFilters = {}): Promise<SportsAchievement[]> {
    return sportsAchievementRepository.findAll(filters);
  }

  /**
   * Get student achievements
   * Requirements: 12.11
   * 
   * @param studentId - Student ID
   * @returns Array of student achievements
   */
  async getStudentAchievements(studentId: number): Promise<SportsAchievement[]> {
    return sportsAchievementRepository.findByStudentId(studentId);
  }

  /**
   * Get school sports records (best performances)
   * Requirements: 12.9
   * 
   * @param sportId - Optional sport ID to filter
   * @returns Array of school records
   */
  async getSchoolRecords(sportId?: number): Promise<SchoolRecord[]> {
    try {
      const records = await sportsAchievementRepository.getSchoolRecords(sportId);

      // TODO: Populate student names from Student model
      // For now, records will have empty studentName field

      logger.info('School records retrieved', {
        sportId,
        count: records.length
      });

      return records;
    } catch (error) {
      logger.error('Error getting school records', { error, sportId });
      throw error;
    }
  }

  /**
   * Generate participation certificate data for a student's sports enrollment
   * Requirements: 12.8
   * 
   * @param enrollmentId - Sports enrollment ID
   * @param studentName - Student's full name
   * @returns Participation certificate data
   */
  async generateParticipationCertificateData(
    enrollmentId: number,
    studentName: string
  ): Promise<ParticipationCertificateData> {
    try {
      // Find enrollment with sport details
      const enrollment = await SportsEnrollment.findByPk(enrollmentId, {
        include: [
          {
            model: Sport,
            as: 'sport',
            attributes: ['sportId', 'name', 'category', 'academicYearId']
          }
        ]
      });

      if (!enrollment) {
        throw new Error(`Enrollment with ID ${enrollmentId} not found`);
      }

      const sport = (enrollment as any).sport;
      if (!sport) {
        throw new Error(`Sport details not found for enrollment ${enrollmentId}`);
      }

      // Validate enrollment is completed or has sufficient participation
      if (enrollment.status === 'withdrawn') {
        throw new Error('Cannot generate certificate for withdrawn enrollment');
      }

      // Calculate attendance percentage
      const attendancePercentage = enrollment.getAttendancePercentage();

      // Prepare certificate data
      const certificateData: ParticipationCertificateData = {
        studentId: enrollment.studentId,
        studentName,
        sportId: sport.sportId,
        sportName: sport.name,
        sportCategory: this.formatCategory(sport.category),
        enrollmentDate: enrollment.enrollmentDate,
        completionDate: enrollment.status === 'completed' ? enrollment.updatedAt : undefined,
        attendancePercentage,
        totalSessions: enrollment.totalSessions,
        academicYear: await this.getAcademicYearName(sport.academicYearId),
        remarks: enrollment.remarks
      };

      logger.info('Participation certificate data generated', {
        enrollmentId,
        studentId: enrollment.studentId,
        sportName: sport.name,
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
   * Generate achievement certificate data for a student's sports achievement
   * Requirements: 12.8
   * 
   * @param achievementId - Sports achievement ID
   * @param studentName - Student's full name
   * @returns Achievement certificate data
   */
  async generateAchievementCertificateData(
    achievementId: number,
    studentName: string
  ): Promise<AchievementCertificateData> {
    try {
      // Find achievement with sport and tournament details
      const achievement = await sportsAchievementRepository.findById(achievementId);

      if (!achievement) {
        throw new Error(`Achievement with ID ${achievementId} not found`);
      }

      const sport = (achievement as any).sport;
      const tournament = (achievement as any).tournament;

      if (!sport) {
        throw new Error(`Sport details not found for achievement ${achievementId}`);
      }

      // Prepare certificate data
      const certificateData: AchievementCertificateData = {
        studentId: achievement.studentId,
        studentName,
        achievementId: achievement.achievementId,
        sportId: sport.sportId,
        sportName: sport.name,
        achievementTitle: achievement.title,
        achievementType: this.formatAchievementType(achievement.type),
        achievementLevel: this.formatAchievementLevel(achievement.level),
        position: achievement.position,
        medal: achievement.medal,
        recordType: achievement.recordType,
        recordValue: achievement.recordValue,
        tournamentName: tournament?.name,
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
      const enrollments = await SportsEnrollment.findAll({
        where: {
          studentId,
          status: 'completed'
        },
        include: [
          {
            model: Sport,
            as: 'sport',
            attributes: ['sportId', 'name', 'category', 'academicYearId']
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
      const achievements = await this.getStudentAchievements(studentId);

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
   * Get sports participation data for student CV
   * Requirements: 12.11
   * 
   * @param studentId - Student ID
   * @returns Student sports CV data
   */
  async getStudentSportsForCV(studentId: number): Promise<StudentSportsCV> {
    try {
      // Get all enrollments
      const enrollments = await SportsEnrollment.findAll({
        where: { studentId },
        include: [
          {
            model: Sport,
            as: 'sport',
            attributes: ['name', 'category']
          }
        ],
        order: [['enrollmentDate', 'DESC']]
      });

      // Get all achievements
      const achievements = await this.getStudentAchievements(studentId);

      // Format participations
      const participations = enrollments.map(enrollment => {
        const sport = (enrollment as any).sport;
        return {
          sportName: sport?.name || 'Unknown',
          category: this.formatCategory(sport?.category || ''),
          duration: this.calculateDuration(enrollment.enrollmentDate, enrollment.updatedAt),
          attendancePercentage: enrollment.getAttendancePercentage(),
          status: enrollment.status
        };
      });

      // Format achievements
      const achievementsList = achievements.map(achievement => {
        const sport = (achievement as any).sport;
        return {
          title: achievement.getDisplayTitle(),
          sportName: sport?.name || 'Unknown',
          type: this.formatAchievementType(achievement.type),
          level: this.formatAchievementLevel(achievement.level),
          position: achievement.position,
          medal: achievement.medal,
          date: achievement.achievementDate
        };
      });

      // Calculate summary statistics
      const totalAttendance = enrollments.reduce(
        (sum, e) => sum + e.getAttendancePercentage(),
        0
      );
      const averageAttendance = enrollments.length > 0
        ? Math.round(totalAttendance / enrollments.length)
        : 0;

      const highLevelAchievements = achievements.filter(a => a.isHighLevel()).length;
      const recordsSet = achievements.filter(a => a.isRecord()).length;

      // Get medal count
      const medalCount = await sportsAchievementRepository.getMedalCountByStudent(studentId);

      const cvData: StudentSportsCV = {
        studentId,
        participations,
        achievements: achievementsList,
        summary: {
          totalSports: enrollments.length,
          totalAchievements: achievements.length,
          highLevelAchievements,
          medalCount,
          recordsSet,
          averageAttendance
        }
      };

      logger.info('Student sports CV data generated', {
        studentId,
        totalSports: enrollments.length,
        totalAchievements: achievements.length
      });

      return cvData;
    } catch (error) {
      logger.error('Error getting student sports for CV', { error, studentId });
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
      const enrollment = await SportsEnrollment.findByPk(enrollmentId);

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
   * Get achievement statistics for a sport
   * 
   * @param sportId - Sport ID
   * @returns Achievement statistics
   */
  async getSportAchievementStats(sportId: number): Promise<{
    totalAchievements: number;
    byType: Record<string, number>;
    byLevel: Record<string, number>;
    medalCount: { gold: number; silver: number; bronze: number };
    recordCount: number;
  }> {
    return sportsAchievementRepository.getAchievementStatsBySport(sportId);
  }

  /**
   * Update achievement
   * 
   * @param achievementId - Achievement ID
   * @param updates - Fields to update
   * @returns Updated achievement
   */
  async updateAchievement(
    achievementId: number,
    updates: Partial<SportsAchievementCreationAttributes>
  ): Promise<SportsAchievement> {
    try {
      // Validate updates if needed
      if (updates.type || updates.medal || updates.recordType) {
        this.validateAchievementData(updates as any);
      }

      return await sportsAchievementRepository.update(achievementId, updates);
    } catch (error) {
      logger.error('Error updating achievement', { error, achievementId, updates });
      throw error;
    }
  }

  /**
   * Delete achievement
   * 
   * @param achievementId - Achievement ID
   * @returns True if deleted
   */
  async deleteAchievement(achievementId: number): Promise<boolean> {
    return sportsAchievementRepository.delete(achievementId);
  }

  /**
   * Upload tournament photo
   * Requirements: 12.10
   * 
   * @param tournamentId - Tournament ID
   * @param photoUrl - Photo URL
   * @returns Updated tournament
   */
  async uploadTournamentPhoto(tournamentId: number, photoUrl: string): Promise<Tournament> {
    try {
      const tournament = await Tournament.findByPk(tournamentId);

      if (!tournament) {
        throw new Error(`Tournament with ID ${tournamentId} not found`);
      }

      tournament.addPhoto(photoUrl);
      await tournament.save();

      logger.info('Tournament photo uploaded', { tournamentId, photoUrl });

      return tournament;
    } catch (error) {
      logger.error('Error uploading tournament photo', { error, tournamentId });
      throw error;
    }
  }

  /**
   * Upload tournament video
   * Requirements: 12.10
   * 
   * @param tournamentId - Tournament ID
   * @param videoUrl - Video URL
   * @returns Updated tournament
   */
  async uploadTournamentVideo(tournamentId: number, videoUrl: string): Promise<Tournament> {
    try {
      const tournament = await Tournament.findByPk(tournamentId);

      if (!tournament) {
        throw new Error(`Tournament with ID ${tournamentId} not found`);
      }

      tournament.addVideo(videoUrl);
      await tournament.save();

      logger.info('Tournament video uploaded', { tournamentId, videoUrl });

      return tournament;
    } catch (error) {
      logger.error('Error uploading tournament video', { error, tournamentId });
      throw error;
    }
  }

  // Helper methods

  private validateAchievementData(data: Partial<SportsAchievementCreationAttributes>): void {
    // Validate medal type achievements have medal field
    if (data.type === 'medal' && !data.medal) {
      throw new Error('Medal achievements must specify medal type (gold, silver, bronze)');
    }

    // Validate record type achievements have record details
    if (data.type === 'record' && (!data.recordType || !data.recordValue)) {
      throw new Error('Record achievements must specify recordType and recordValue');
    }

    // Validate rank type achievements have position
    if (data.type === 'rank' && !data.position) {
      throw new Error('Rank achievements must specify position');
    }
  }

  private formatCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      individual: 'Individual Sport',
      team: 'Team Sport',
      traditional: 'Traditional Sport'
    };
    return categoryMap[category] || category;
  }

  private formatAchievementType(type: string): string {
    const typeMap: Record<string, string> = {
      medal: 'Medal',
      trophy: 'Trophy',
      certificate: 'Certificate',
      rank: 'Rank',
      record: 'Record',
      recognition: 'Recognition'
    };
    return typeMap[type] || type;
  }

  private formatAchievementLevel(level: string): string {
    const levelMap: Record<string, string> = {
      school: 'School Level',
      inter_school: 'Inter-School Level',
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
      // TODO: Query the AcademicYear model
      // For now, return a placeholder
      return `Academic Year ${academicYearId}`;
    } catch (error) {
      logger.warn('Error getting academic year name', { error, academicYearId });
      return 'Unknown Academic Year';
    }
  }
}

export default new SportsAchievementService();

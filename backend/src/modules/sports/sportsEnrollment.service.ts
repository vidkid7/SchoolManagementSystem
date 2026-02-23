/**
 * Sports Enrollment Service
 * Business logic for sports enrollment management
 * 
 * Features:
 * - Student enrollment in sports
 * - Team assignment for team sports
 * - Practice session attendance tracking
 * - Enrollment validation and business rules
 * 
 * Requirements: 12.3, 12.4
 */

import sportsEnrollmentRepository from './sportsEnrollment.repository';
import Sport from '@models/Sport.model';
import Team from '@models/Team.model';
import SportsEnrollment, { SportsEnrollmentCreationAttributes } from '@models/SportsEnrollment.model';
import { logger } from '@utils/logger';
import { Request } from 'express';

interface EnrollmentInput {
  sportId: number;
  studentId: number;
  teamId?: number;
  enrollmentDate?: Date;
  remarks?: string;
}

interface EnrollmentFilters {
  sportId?: number;
  studentId?: number;
  teamId?: number;
  status?: 'active' | 'withdrawn' | 'completed';
  enrollmentDateFrom?: Date;
  enrollmentDateTo?: Date;
}

class SportsEnrollmentService {
  /**
   * Enroll a student in a sport
   * Validates sport status and checks for duplicate enrollment
   * 
   * @param enrollmentData - Enrollment data
   * @param userId - User ID performing the enrollment
   * @param req - Express request object
   * @returns Created enrollment
   * @throws Error if validation fails
   */
  async enrollStudent(
    enrollmentData: EnrollmentInput,
    userId?: number,
    req?: Request
  ): Promise<SportsEnrollment> {
    try {
      const { sportId, studentId, teamId, enrollmentDate, remarks } = enrollmentData;

      // 1. Check if sport exists
      const sport = await Sport.findByPk(sportId);
      if (!sport) {
        throw new Error(`Sport with ID ${sportId} not found`);
      }

      // 2. Check if sport is active
      if (sport.status !== 'active') {
        throw new Error(`Sport "${sport.name}" is not active for enrollment`);
      }

      // 3. Check if student is already enrolled (Requirement 12.3)
      const existingEnrollment = await sportsEnrollmentRepository.isStudentEnrolled(
        sportId,
        studentId
      );

      if (existingEnrollment) {
        throw new Error(
          `Student is already enrolled in sport "${sport.name}"`
        );
      }

      // 4. If team is specified, validate team assignment
      if (teamId) {
        const team = await Team.findByPk(teamId);
        if (!team) {
          throw new Error(`Team with ID ${teamId} not found`);
        }

        // Verify team belongs to the sport
        if (team.sportId !== sportId) {
          throw new Error(
            `Team "${team.name}" does not belong to sport "${sport.name}"`
          );
        }

        // Verify team is active
        if (team.status !== 'active') {
          throw new Error(`Team "${team.name}" is not active`);
        }
      }

      // 5. Create enrollment
      const enrollmentCreateData: SportsEnrollmentCreationAttributes = {
        sportId,
        studentId,
        teamId,
        enrollmentDate: enrollmentDate || new Date(),
        status: 'active',
        attendanceCount: 0,
        totalSessions: 0,
        remarks
      };

      const enrollment = await sportsEnrollmentRepository.create(
        enrollmentCreateData,
        userId,
        req
      );

      // 6. If team is specified, add student to team members
      if (teamId) {
        const team = await Team.findByPk(teamId);
        if (team) {
          team.addMember(studentId);
          await team.save();
        }
      }

      logger.info('Student enrolled in sport successfully', {
        enrollmentId: enrollment.enrollmentId,
        sportId,
        studentId,
        teamId,
        sportName: sport.name
      });

      return enrollment;
    } catch (error) {
      logger.error('Error enrolling student in sport', {
        error,
        enrollmentData
      });
      throw error;
    }
  }

  /**
   * Assign a student to a team
   * Updates existing enrollment with team assignment
   * 
   * @param enrollmentId - Enrollment ID
   * @param teamId - Team ID
   * @param userId - User ID performing the assignment
   * @param req - Express request object
   * @returns Updated enrollment
   * @throws Error if validation fails
   */
  async assignToTeam(
    enrollmentId: number,
    teamId: number,
    userId?: number,
    req?: Request
  ): Promise<SportsEnrollment> {
    try {
      // 1. Find enrollment
      const enrollment = await sportsEnrollmentRepository.findById(enrollmentId);
      if (!enrollment) {
        throw new Error(`Enrollment with ID ${enrollmentId} not found`);
      }

      // 2. Check if enrollment is active
      if (enrollment.status !== 'active') {
        throw new Error(
          `Cannot assign team to ${enrollment.status} enrollment`
        );
      }

      // 3. Validate team
      const team = await Team.findByPk(teamId);
      if (!team) {
        throw new Error(`Team with ID ${teamId} not found`);
      }

      // 4. Verify team belongs to the same sport
      if (team.sportId !== enrollment.sportId) {
        throw new Error(
          `Team does not belong to the same sport as enrollment`
        );
      }

      // 5. Verify team is active
      if (team.status !== 'active') {
        throw new Error(`Team "${team.name}" is not active`);
      }

      // 6. Remove from old team if exists
      if (enrollment.teamId) {
        const oldTeam = await Team.findByPk(enrollment.teamId);
        if (oldTeam) {
          oldTeam.removeMember(enrollment.studentId);
          await oldTeam.save();
        }
      }

      // 7. Update enrollment with new team
      const updatedEnrollment = await sportsEnrollmentRepository.update(
        enrollmentId,
        { teamId },
        userId,
        req
      );

      if (!updatedEnrollment) {
        throw new Error('Failed to update enrollment');
      }

      // 8. Add student to new team members
      team.addMember(enrollment.studentId);
      await team.save();

      logger.info('Student assigned to team', {
        enrollmentId,
        teamId,
        teamName: team.name,
        studentId: enrollment.studentId
      });

      return updatedEnrollment;
    } catch (error) {
      logger.error('Error assigning student to team', {
        error,
        enrollmentId,
        teamId
      });
      throw error;
    }
  }

  /**
   * Withdraw a student from a sport
   * 
   * @param enrollmentId - Enrollment ID
   * @param remarks - Withdrawal remarks
   * @param userId - User ID performing the withdrawal
   * @param req - Express request object
   * @returns Updated enrollment
   * @throws Error if enrollment not found or already withdrawn
   */
  async withdrawStudent(
    enrollmentId: number,
    remarks?: string,
    userId?: number,
    req?: Request
  ): Promise<SportsEnrollment> {
    try {
      // 1. Find enrollment
      const enrollment = await sportsEnrollmentRepository.findById(enrollmentId);
      if (!enrollment) {
        throw new Error(`Enrollment with ID ${enrollmentId} not found`);
      }

      // 2. Check if already withdrawn or completed
      if (enrollment.status === 'withdrawn') {
        throw new Error('Enrollment is already withdrawn');
      }

      if (enrollment.status === 'completed') {
        throw new Error('Cannot withdraw a completed enrollment');
      }

      // 3. Remove from team if assigned
      if (enrollment.teamId) {
        const team = await Team.findByPk(enrollment.teamId);
        if (team) {
          team.removeMember(enrollment.studentId);
          await team.save();
        }
      }

      // 4. Withdraw enrollment
      const updatedEnrollment = await sportsEnrollmentRepository.withdraw(
        enrollmentId,
        remarks,
        userId,
        req
      );

      if (!updatedEnrollment) {
        throw new Error('Failed to withdraw enrollment');
      }

      logger.info('Student withdrawn from sport', {
        enrollmentId,
        sportId: enrollment.sportId,
        studentId: enrollment.studentId
      });

      return updatedEnrollment;
    } catch (error) {
      logger.error('Error withdrawing student from sport', {
        error,
        enrollmentId
      });
      throw error;
    }
  }

  /**
   * Mark attendance for a student in a practice session
   * Tracks practice session attendance (Requirement 12.4)
   * 
   * @param enrollmentId - Enrollment ID
   * @param present - Whether student was present
   * @returns Updated enrollment
   * @throws Error if enrollment not found or not active
   */
  async markAttendance(
    enrollmentId: number,
    present: boolean
  ): Promise<SportsEnrollment> {
    try {
      // 1. Find enrollment
      const enrollment = await sportsEnrollmentRepository.findById(enrollmentId);
      if (!enrollment) {
        throw new Error(`Enrollment with ID ${enrollmentId} not found`);
      }

      // 2. Check if enrollment is active
      if (enrollment.status !== 'active') {
        throw new Error(
          `Cannot mark attendance for ${enrollment.status} enrollment`
        );
      }

      // 3. Mark attendance
      const updatedEnrollment = await sportsEnrollmentRepository.markAttendance(
        enrollmentId,
        present
      );

      if (!updatedEnrollment) {
        throw new Error('Failed to mark attendance');
      }

      logger.info('Sports practice attendance marked', {
        enrollmentId,
        present,
        attendancePercentage: updatedEnrollment.getAttendancePercentage()
      });

      return updatedEnrollment;
    } catch (error) {
      logger.error('Error marking sports attendance', {
        error,
        enrollmentId,
        present
      });
      throw error;
    }
  }

  /**
   * Bulk mark attendance for multiple students
   * 
   * @param attendanceData - Array of enrollment IDs and attendance status
   * @returns Array of updated enrollments
   */
  async bulkMarkAttendance(
    attendanceData: Array<{ enrollmentId: number; present: boolean }>
  ): Promise<SportsEnrollment[]> {
    try {
      const updatedEnrollments: SportsEnrollment[] = [];

      for (const { enrollmentId, present } of attendanceData) {
        try {
          const enrollment = await this.markAttendance(enrollmentId, present);
          updatedEnrollments.push(enrollment);
        } catch (error) {
          logger.warn('Failed to mark attendance for enrollment', {
            enrollmentId,
            error
          });
          // Continue with other enrollments
        }
      }

      logger.info('Bulk sports attendance marked', {
        total: attendanceData.length,
        successful: updatedEnrollments.length
      });

      return updatedEnrollments;
    } catch (error) {
      logger.error('Error bulk marking sports attendance', {
        error,
        count: attendanceData.length
      });
      throw error;
    }
  }

  /**
   * Get enrollment by ID
   * 
   * @param enrollmentId - Enrollment ID
   * @returns Enrollment or null
   */
  async getEnrollmentById(enrollmentId: number): Promise<SportsEnrollment | null> {
    try {
      return await sportsEnrollmentRepository.findById(enrollmentId);
    } catch (error) {
      logger.error('Error getting enrollment by ID', { error, enrollmentId });
      throw error;
    }
  }

  /**
   * Get all enrollments for a student
   * 
   * @param studentId - Student ID
   * @param status - Optional status filter
   * @returns Array of enrollments
   */
  async getStudentEnrollments(
    studentId: number,
    status?: 'active' | 'withdrawn' | 'completed'
  ): Promise<SportsEnrollment[]> {
    try {
      return await sportsEnrollmentRepository.findByStudent(studentId, status);
    } catch (error) {
      logger.error('Error getting student enrollments', { error, studentId });
      throw error;
    }
  }

  /**
   * Get all enrollments for a sport
   * 
   * @param sportId - Sport ID
   * @param status - Optional status filter
   * @returns Array of enrollments
   */
  async getSportEnrollments(
    sportId: number,
    status?: 'active' | 'withdrawn' | 'completed'
  ): Promise<SportsEnrollment[]> {
    try {
      return await sportsEnrollmentRepository.findBySport(sportId, status);
    } catch (error) {
      logger.error('Error getting sport enrollments', { error, sportId });
      throw error;
    }
  }

  /**
   * Get all enrollments for a team
   * 
   * @param teamId - Team ID
   * @param status - Optional status filter
   * @returns Array of enrollments
   */
  async getTeamEnrollments(
    teamId: number,
    status?: 'active' | 'withdrawn' | 'completed'
  ): Promise<SportsEnrollment[]> {
    try {
      return await sportsEnrollmentRepository.findByTeam(teamId, status);
    } catch (error) {
      logger.error('Error getting team enrollments', { error, teamId });
      throw error;
    }
  }

  /**
   * Get enrollments with filters and pagination
   * 
   * @param filters - Optional filters
   * @param page - Page number
   * @param limit - Items per page
   * @returns Enrollments with pagination metadata
   */
  async getEnrollments(
    filters?: EnrollmentFilters,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    enrollments: SportsEnrollment[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      return await sportsEnrollmentRepository.findWithPagination(filters, page, limit);
    } catch (error) {
      logger.error('Error getting enrollments', { error, filters, page, limit });
      throw error;
    }
  }

  /**
   * Get enrollment statistics for a sport
   * 
   * @param sportId - Sport ID
   * @returns Enrollment statistics
   */
  async getEnrollmentStats(sportId: number): Promise<{
    total: number;
    active: number;
    withdrawn: number;
    completed: number;
    averageAttendance: number;
  }> {
    try {
      return await sportsEnrollmentRepository.getEnrollmentStats(sportId);
    } catch (error) {
      logger.error('Error getting enrollment stats', { error, sportId });
      throw error;
    }
  }

  /**
   * Get student's sports participation summary
   * Tracks participation across all sports (Requirement 12.3, 12.4)
   * 
   * @param studentId - Student ID
   * @returns Participation summary
   */
  async getStudentParticipationSummary(studentId: number): Promise<{
    totalEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
    averageAttendance: number;
    sports: Array<{
      sportId: number;
      sportName: string;
      teamId?: number;
      teamName?: string;
      status: string;
      attendancePercentage: number;
    }>;
  }> {
    try {
      return await sportsEnrollmentRepository.getStudentParticipationSummary(studentId);
    } catch (error) {
      logger.error('Error getting student participation summary', {
        error,
        studentId
      });
      throw error;
    }
  }

  /**
   * Complete an enrollment
   * Marks enrollment as completed at end of academic year
   * 
   * @param enrollmentId - Enrollment ID
   * @param userId - User ID performing the completion
   * @param req - Express request object
   * @returns Updated enrollment
   */
  async completeEnrollment(
    enrollmentId: number,
    userId?: number,
    req?: Request
  ): Promise<SportsEnrollment> {
    try {
      const enrollment = await sportsEnrollmentRepository.findById(enrollmentId);
      if (!enrollment) {
        throw new Error(`Enrollment with ID ${enrollmentId} not found`);
      }

      if (enrollment.status !== 'active') {
        throw new Error(
          `Cannot complete enrollment with status: ${enrollment.status}`
        );
      }

      const updatedEnrollment = await sportsEnrollmentRepository.update(
        enrollmentId,
        { status: 'completed' },
        userId,
        req
      );

      if (!updatedEnrollment) {
        throw new Error('Failed to complete enrollment');
      }

      logger.info('Enrollment completed', {
        enrollmentId,
        sportId: enrollment.sportId,
        studentId: enrollment.studentId
      });

      return updatedEnrollment;
    } catch (error) {
      logger.error('Error completing enrollment', { error, enrollmentId });
      throw error;
    }
  }

  /**
   * Update enrollment remarks
   * 
   * @param enrollmentId - Enrollment ID
   * @param remarks - New remarks
   * @param userId - User ID performing the update
   * @param req - Express request object
   * @returns Updated enrollment
   */
  async updateRemarks(
    enrollmentId: number,
    remarks: string,
    userId?: number,
    req?: Request
  ): Promise<SportsEnrollment> {
    try {
      const enrollment = await sportsEnrollmentRepository.update(
        enrollmentId,
        { remarks },
        userId,
        req
      );

      if (!enrollment) {
        throw new Error(`Enrollment with ID ${enrollmentId} not found`);
      }

      logger.info('Enrollment remarks updated', { enrollmentId });

      return enrollment;
    } catch (error) {
      logger.error('Error updating enrollment remarks', {
        error,
        enrollmentId
      });
      throw error;
    }
  }

  /**
   * Check if student can enroll in a sport
   * Validates sport status and existing enrollment
   * 
   * @param sportId - Sport ID
   * @param studentId - Student ID
   * @returns Validation result with message
   */
  async canEnroll(
    sportId: number,
    studentId: number
  ): Promise<{ canEnroll: boolean; message?: string }> {
    try {
      // Check if sport exists
      const sport = await Sport.findByPk(sportId);
      if (!sport) {
        return { canEnroll: false, message: 'Sport not found' };
      }

      // Check if sport is active
      if (sport.status !== 'active') {
        return { canEnroll: false, message: 'Sport is not active' };
      }

      // Check if already enrolled
      const isEnrolled = await sportsEnrollmentRepository.isStudentEnrolled(
        sportId,
        studentId
      );

      if (isEnrolled) {
        return { canEnroll: false, message: 'Student is already enrolled' };
      }

      return { canEnroll: true };
    } catch (error) {
      logger.error('Error checking enrollment eligibility', {
        error,
        sportId,
        studentId
      });
      throw error;
    }
  }
}

export default new SportsEnrollmentService();

/**
 * Sports Enrollment Service Unit Tests
 * 
 * Tests for sports enrollment business logic
 * 
 * Requirements: 12.3, 12.4
 */

import sportsEnrollmentService from '../sportsEnrollment.service';
import sportsEnrollmentRepository from '../sportsEnrollment.repository';
import Sport from '@models/Sport.model';
import Team from '@models/Team.model';

// Mock dependencies
jest.mock('../sportsEnrollment.repository');
jest.mock('@models/Sport.model');
jest.mock('@models/Team.model');
jest.mock('@utils/logger');

describe('SportsEnrollmentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('enrollStudent', () => {
    it('should successfully enroll a student in a sport', async () => {
      // Arrange
      const enrollmentData = {
        sportId: 1,
        studentId: 100,
        enrollmentDate: new Date('2024-01-15')
      };

      const mockSport = {
        sportId: 1,
        name: 'Football',
        status: 'active'
      };

      const mockEnrollment = {
        enrollmentId: 1,
        sportId: 1,
        studentId: 100,
        enrollmentDate: new Date('2024-01-15'),
        status: 'active',
        attendanceCount: 0,
        totalSessions: 0
      };

      (Sport.findByPk as jest.Mock).mockResolvedValue(mockSport);
      (sportsEnrollmentRepository.isStudentEnrolled as jest.Mock).mockResolvedValue(false);
      (sportsEnrollmentRepository.create as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act
      const result = await sportsEnrollmentService.enrollStudent(enrollmentData);

      // Assert
      expect(Sport.findByPk).toHaveBeenCalledWith(1);
      expect(sportsEnrollmentRepository.isStudentEnrolled).toHaveBeenCalledWith(1, 100);
      expect(sportsEnrollmentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sportId: 1,
          studentId: 100,
          status: 'active',
          attendanceCount: 0,
          totalSessions: 0
        }),
        undefined,
        undefined
      );
      expect(result).toEqual(mockEnrollment);
    });

    it('should throw error if sport does not exist', async () => {
      // Arrange
      const enrollmentData = {
        sportId: 999,
        studentId: 100
      };

      (Sport.findByPk as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        sportsEnrollmentService.enrollStudent(enrollmentData)
      ).rejects.toThrow('Sport with ID 999 not found');
    });

    it('should throw error if sport is not active', async () => {
      // Arrange
      const enrollmentData = {
        sportId: 1,
        studentId: 100
      };

      const mockSport = {
        sportId: 1,
        name: 'Football',
        status: 'inactive'
      };

      (Sport.findByPk as jest.Mock).mockResolvedValue(mockSport);

      // Act & Assert
      await expect(
        sportsEnrollmentService.enrollStudent(enrollmentData)
      ).rejects.toThrow('Sport "Football" is not active for enrollment');
    });

    it('should throw error if student is already enrolled', async () => {
      // Arrange
      const enrollmentData = {
        sportId: 1,
        studentId: 100
      };

      const mockSport = {
        sportId: 1,
        name: 'Football',
        status: 'active'
      };

      (Sport.findByPk as jest.Mock).mockResolvedValue(mockSport);
      (sportsEnrollmentRepository.isStudentEnrolled as jest.Mock).mockResolvedValue(true);

      // Act & Assert
      await expect(
        sportsEnrollmentService.enrollStudent(enrollmentData)
      ).rejects.toThrow('Student is already enrolled in sport "Football"');
    });

    it('should enroll student with team assignment', async () => {
      // Arrange
      const enrollmentData = {
        sportId: 1,
        studentId: 100,
        teamId: 5
      };

      const mockSport = {
        sportId: 1,
        name: 'Football',
        status: 'active'
      };

      const mockTeam = {
        teamId: 5,
        sportId: 1,
        name: 'Team A',
        status: 'active',
        members: [],
        addMember: jest.fn(),
        save: jest.fn()
      };

      const mockEnrollment = {
        enrollmentId: 1,
        sportId: 1,
        studentId: 100,
        teamId: 5,
        status: 'active'
      };

      (Sport.findByPk as jest.Mock).mockResolvedValue(mockSport);
      (Team.findByPk as jest.Mock).mockResolvedValue(mockTeam);
      (sportsEnrollmentRepository.isStudentEnrolled as jest.Mock).mockResolvedValue(false);
      (sportsEnrollmentRepository.create as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act
      const result = await sportsEnrollmentService.enrollStudent(enrollmentData);

      // Assert
      expect(Team.findByPk).toHaveBeenCalledWith(5);
      expect(mockTeam.addMember).toHaveBeenCalledWith(100);
      expect(mockTeam.save).toHaveBeenCalled();
      expect(result.teamId).toBe(5);
    });

    it('should throw error if team does not belong to sport', async () => {
      // Arrange
      const enrollmentData = {
        sportId: 1,
        studentId: 100,
        teamId: 5
      };

      const mockSport = {
        sportId: 1,
        name: 'Football',
        status: 'active'
      };

      const mockTeam = {
        teamId: 5,
        sportId: 2, // Different sport
        name: 'Team A',
        status: 'active'
      };

      (Sport.findByPk as jest.Mock).mockResolvedValue(mockSport);
      (Team.findByPk as jest.Mock).mockResolvedValue(mockTeam);
      (sportsEnrollmentRepository.isStudentEnrolled as jest.Mock).mockResolvedValue(false);

      // Act & Assert
      await expect(
        sportsEnrollmentService.enrollStudent(enrollmentData)
      ).rejects.toThrow('Team "Team A" does not belong to sport "Football"');
    });
  });

  describe('assignToTeam', () => {
    it('should successfully assign student to team', async () => {
      // Arrange
      const enrollmentId = 1;
      const teamId = 5;

      const mockEnrollment = {
        enrollmentId: 1,
        sportId: 1,
        studentId: 100,
        teamId: null,
        status: 'active'
      };

      const mockTeam = {
        teamId: 5,
        sportId: 1,
        name: 'Team A',
        status: 'active',
        addMember: jest.fn(),
        save: jest.fn()
      };

      const mockUpdatedEnrollment = {
        ...mockEnrollment,
        teamId: 5
      };

      (sportsEnrollmentRepository.findById as jest.Mock).mockResolvedValue(mockEnrollment);
      (Team.findByPk as jest.Mock).mockResolvedValue(mockTeam);
      (sportsEnrollmentRepository.update as jest.Mock).mockResolvedValue(mockUpdatedEnrollment);

      // Act
      const result = await sportsEnrollmentService.assignToTeam(enrollmentId, teamId);

      // Assert
      expect(sportsEnrollmentRepository.findById).toHaveBeenCalledWith(1);
      expect(Team.findByPk).toHaveBeenCalledWith(5);
      expect(sportsEnrollmentRepository.update).toHaveBeenCalledWith(
        1,
        { teamId: 5 },
        undefined,
        undefined
      );
      expect(mockTeam.addMember).toHaveBeenCalledWith(100);
      expect(mockTeam.save).toHaveBeenCalled();
      expect(result.teamId).toBe(5);
    });

    it('should remove student from old team when reassigning', async () => {
      // Arrange
      const enrollmentId = 1;
      const newTeamId = 6;

      const mockOldTeam = {
        teamId: 5,
        sportId: 1,
        removeMember: jest.fn(),
        save: jest.fn()
      };

      const mockNewTeam = {
        teamId: 6,
        sportId: 1,
        name: 'Team B',
        status: 'active',
        addMember: jest.fn(),
        save: jest.fn()
      };

      const mockEnrollment = {
        enrollmentId: 1,
        sportId: 1,
        studentId: 100,
        teamId: 5,
        status: 'active'
      };

      const mockUpdatedEnrollment = {
        ...mockEnrollment,
        teamId: 6
      };

      (sportsEnrollmentRepository.findById as jest.Mock).mockResolvedValue(mockEnrollment);
      (Team.findByPk as jest.Mock)
        .mockResolvedValueOnce(mockNewTeam)
        .mockResolvedValueOnce(mockOldTeam);
      (sportsEnrollmentRepository.update as jest.Mock).mockResolvedValue(mockUpdatedEnrollment);

      // Act
      const result = await sportsEnrollmentService.assignToTeam(enrollmentId, newTeamId);

      // Assert
      expect(mockOldTeam.removeMember).toHaveBeenCalledWith(100);
      expect(mockOldTeam.save).toHaveBeenCalled();
      expect(mockNewTeam.addMember).toHaveBeenCalledWith(100);
      expect(mockNewTeam.save).toHaveBeenCalled();
      expect(result.teamId).toBe(6);
    });

    it('should throw error if enrollment is not active', async () => {
      // Arrange
      const enrollmentId = 1;
      const teamId = 5;

      const mockEnrollment = {
        enrollmentId: 1,
        sportId: 1,
        studentId: 100,
        status: 'withdrawn'
      };

      (sportsEnrollmentRepository.findById as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act & Assert
      await expect(
        sportsEnrollmentService.assignToTeam(enrollmentId, teamId)
      ).rejects.toThrow('Cannot assign team to withdrawn enrollment');
    });
  });

  describe('markAttendance', () => {
    it('should mark student as present in practice session', async () => {
      // Arrange
      const enrollmentId = 1;
      const present = true;

      const mockEnrollment = {
        enrollmentId: 1,
        sportId: 1,
        studentId: 100,
        status: 'active',
        attendanceCount: 5,
        totalSessions: 8,
        getAttendancePercentage: jest.fn().mockReturnValue(62.5)
      };

      const mockUpdatedEnrollment = {
        ...mockEnrollment,
        attendanceCount: 6,
        totalSessions: 9
      };

      (sportsEnrollmentRepository.findById as jest.Mock).mockResolvedValue(mockEnrollment);
      (sportsEnrollmentRepository.markAttendance as jest.Mock).mockResolvedValue(mockUpdatedEnrollment);

      // Act
      const result = await sportsEnrollmentService.markAttendance(enrollmentId, present);

      // Assert
      expect(sportsEnrollmentRepository.findById).toHaveBeenCalledWith(1);
      expect(sportsEnrollmentRepository.markAttendance).toHaveBeenCalledWith(1, true);
      expect(result).toEqual(mockUpdatedEnrollment);
    });

    it('should mark student as absent in practice session', async () => {
      // Arrange
      const enrollmentId = 1;
      const present = false;

      const mockEnrollment = {
        enrollmentId: 1,
        sportId: 1,
        studentId: 100,
        status: 'active'
      };

      const mockUpdatedEnrollment = {
        ...mockEnrollment,
        attendanceCount: 5,
        totalSessions: 9,
        getAttendancePercentage: jest.fn().mockReturnValue(55.56)
      };

      (sportsEnrollmentRepository.findById as jest.Mock).mockResolvedValue(mockEnrollment);
      (sportsEnrollmentRepository.markAttendance as jest.Mock).mockResolvedValue(mockUpdatedEnrollment);

      // Act
      const result = await sportsEnrollmentService.markAttendance(enrollmentId, present);

      // Assert
      expect(sportsEnrollmentRepository.markAttendance).toHaveBeenCalledWith(1, false);
      expect(result).toEqual(mockUpdatedEnrollment);
    });

    it('should throw error if enrollment is not active', async () => {
      // Arrange
      const enrollmentId = 1;
      const present = true;

      const mockEnrollment = {
        enrollmentId: 1,
        sportId: 1,
        studentId: 100,
        status: 'completed'
      };

      (sportsEnrollmentRepository.findById as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act & Assert
      await expect(
        sportsEnrollmentService.markAttendance(enrollmentId, present)
      ).rejects.toThrow('Cannot mark attendance for completed enrollment');
    });
  });

  describe('bulkMarkAttendance', () => {
    it('should mark attendance for multiple students', async () => {
      // Arrange
      const attendanceData = [
        { enrollmentId: 1, present: true },
        { enrollmentId: 2, present: false },
        { enrollmentId: 3, present: true }
      ];

      const mockEnrollments = [
        { enrollmentId: 1, status: 'active', getAttendancePercentage: jest.fn().mockReturnValue(80) },
        { enrollmentId: 2, status: 'active', getAttendancePercentage: jest.fn().mockReturnValue(75) },
        { enrollmentId: 3, status: 'active', getAttendancePercentage: jest.fn().mockReturnValue(90) }
      ];

      (sportsEnrollmentRepository.findById as jest.Mock)
        .mockResolvedValueOnce(mockEnrollments[0])
        .mockResolvedValueOnce(mockEnrollments[1])
        .mockResolvedValueOnce(mockEnrollments[2]);

      (sportsEnrollmentRepository.markAttendance as jest.Mock)
        .mockResolvedValueOnce(mockEnrollments[0])
        .mockResolvedValueOnce(mockEnrollments[1])
        .mockResolvedValueOnce(mockEnrollments[2]);

      // Act
      const result = await sportsEnrollmentService.bulkMarkAttendance(attendanceData);

      // Assert
      expect(result).toHaveLength(3);
      expect(sportsEnrollmentRepository.markAttendance).toHaveBeenCalledTimes(3);
    });

    it('should continue processing even if one enrollment fails', async () => {
      // Arrange
      const attendanceData = [
        { enrollmentId: 1, present: true },
        { enrollmentId: 2, present: false },
        { enrollmentId: 3, present: true }
      ];

      const mockEnrollments = [
        { enrollmentId: 1, status: 'active', getAttendancePercentage: jest.fn().mockReturnValue(80) },
        null, // Second enrollment not found
        { enrollmentId: 3, status: 'active', getAttendancePercentage: jest.fn().mockReturnValue(90) }
      ];

      (sportsEnrollmentRepository.findById as jest.Mock)
        .mockResolvedValueOnce(mockEnrollments[0])
        .mockResolvedValueOnce(mockEnrollments[1])
        .mockResolvedValueOnce(mockEnrollments[2]);

      (sportsEnrollmentRepository.markAttendance as jest.Mock)
        .mockResolvedValueOnce(mockEnrollments[0])
        .mockResolvedValueOnce(mockEnrollments[2]);

      // Act
      const result = await sportsEnrollmentService.bulkMarkAttendance(attendanceData);

      // Assert
      expect(result).toHaveLength(2); // Only 2 successful
      expect(sportsEnrollmentRepository.markAttendance).toHaveBeenCalledTimes(2);
    });
  });

  describe('withdrawStudent', () => {
    it('should successfully withdraw student from sport', async () => {
      // Arrange
      const enrollmentId = 1;
      const remarks = 'Student moved to another school';

      const mockEnrollment = {
        enrollmentId: 1,
        sportId: 1,
        studentId: 100,
        teamId: 5,
        status: 'active'
      };

      const mockTeam = {
        teamId: 5,
        removeMember: jest.fn(),
        save: jest.fn()
      };

      const mockUpdatedEnrollment = {
        ...mockEnrollment,
        status: 'withdrawn',
        remarks
      };

      (sportsEnrollmentRepository.findById as jest.Mock).mockResolvedValue(mockEnrollment);
      (Team.findByPk as jest.Mock).mockResolvedValue(mockTeam);
      (sportsEnrollmentRepository.withdraw as jest.Mock).mockResolvedValue(mockUpdatedEnrollment);

      // Act
      const result = await sportsEnrollmentService.withdrawStudent(enrollmentId, remarks);

      // Assert
      expect(sportsEnrollmentRepository.findById).toHaveBeenCalledWith(1);
      expect(mockTeam.removeMember).toHaveBeenCalledWith(100);
      expect(mockTeam.save).toHaveBeenCalled();
      expect(sportsEnrollmentRepository.withdraw).toHaveBeenCalledWith(
        1,
        remarks,
        undefined,
        undefined
      );
      expect(result.status).toBe('withdrawn');
    });

    it('should throw error if enrollment is already withdrawn', async () => {
      // Arrange
      const enrollmentId = 1;

      const mockEnrollment = {
        enrollmentId: 1,
        sportId: 1,
        studentId: 100,
        status: 'withdrawn'
      };

      (sportsEnrollmentRepository.findById as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act & Assert
      await expect(
        sportsEnrollmentService.withdrawStudent(enrollmentId)
      ).rejects.toThrow('Enrollment is already withdrawn');
    });

    it('should throw error if enrollment is completed', async () => {
      // Arrange
      const enrollmentId = 1;

      const mockEnrollment = {
        enrollmentId: 1,
        sportId: 1,
        studentId: 100,
        status: 'completed'
      };

      (sportsEnrollmentRepository.findById as jest.Mock).mockResolvedValue(mockEnrollment);

      // Act & Assert
      await expect(
        sportsEnrollmentService.withdrawStudent(enrollmentId)
      ).rejects.toThrow('Cannot withdraw a completed enrollment');
    });
  });

  describe('canEnroll', () => {
    it('should return true if student can enroll', async () => {
      // Arrange
      const sportId = 1;
      const studentId = 100;

      const mockSport = {
        sportId: 1,
        name: 'Football',
        status: 'active'
      };

      (Sport.findByPk as jest.Mock).mockResolvedValue(mockSport);
      (sportsEnrollmentRepository.isStudentEnrolled as jest.Mock).mockResolvedValue(false);

      // Act
      const result = await sportsEnrollmentService.canEnroll(sportId, studentId);

      // Assert
      expect(result).toEqual({ canEnroll: true });
    });

    it('should return false if sport does not exist', async () => {
      // Arrange
      const sportId = 999;
      const studentId = 100;

      (Sport.findByPk as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await sportsEnrollmentService.canEnroll(sportId, studentId);

      // Assert
      expect(result).toEqual({
        canEnroll: false,
        message: 'Sport not found'
      });
    });

    it('should return false if sport is not active', async () => {
      // Arrange
      const sportId = 1;
      const studentId = 100;

      const mockSport = {
        sportId: 1,
        name: 'Football',
        status: 'inactive'
      };

      (Sport.findByPk as jest.Mock).mockResolvedValue(mockSport);

      // Act
      const result = await sportsEnrollmentService.canEnroll(sportId, studentId);

      // Assert
      expect(result).toEqual({
        canEnroll: false,
        message: 'Sport is not active'
      });
    });

    it('should return false if student is already enrolled', async () => {
      // Arrange
      const sportId = 1;
      const studentId = 100;

      const mockSport = {
        sportId: 1,
        name: 'Football',
        status: 'active'
      };

      (Sport.findByPk as jest.Mock).mockResolvedValue(mockSport);
      (sportsEnrollmentRepository.isStudentEnrolled as jest.Mock).mockResolvedValue(true);

      // Act
      const result = await sportsEnrollmentService.canEnroll(sportId, studentId);

      // Assert
      expect(result).toEqual({
        canEnroll: false,
        message: 'Student is already enrolled'
      });
    });
  });

  describe('getStudentParticipationSummary', () => {
    it('should return student participation summary', async () => {
      // Arrange
      const studentId = 100;

      const mockSummary = {
        totalEnrollments: 3,
        activeEnrollments: 2,
        completedEnrollments: 1,
        averageAttendance: 75.5,
        sports: [
          {
            sportId: 1,
            sportName: 'Football',
            teamId: 5,
            teamName: 'Team A',
            status: 'active',
            attendancePercentage: 80
          },
          {
            sportId: 2,
            sportName: 'Basketball',
            status: 'active',
            attendancePercentage: 71
          }
        ]
      };

      (sportsEnrollmentRepository.getStudentParticipationSummary as jest.Mock)
        .mockResolvedValue(mockSummary);

      // Act
      const result = await sportsEnrollmentService.getStudentParticipationSummary(studentId);

      // Assert
      expect(sportsEnrollmentRepository.getStudentParticipationSummary)
        .toHaveBeenCalledWith(100);
      expect(result).toEqual(mockSummary);
      expect(result.totalEnrollments).toBe(3);
      expect(result.sports).toHaveLength(2);
    });
  });
});

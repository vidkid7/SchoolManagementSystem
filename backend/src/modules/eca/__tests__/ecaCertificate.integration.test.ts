/**
 * ECA Certificate Service Integration Tests
 * 
 * Integration tests for ECA certificate generation with database
 * 
 * Requirements: 11.8, 11.9
 */

import ecaCertificateService from '../ecaCertificate.service';
import ECAEnrollment from '@models/ECAEnrollment.model';
import ECAAchievement from '@models/ECAAchievement.model';
import ECA from '@models/ECA.model';
import { sequelize } from '@config/database';

describe('ECACertificateService Integration Tests', () => {
  beforeAll(async () => {
    // Sync database models
    await sequelize.sync({ force: true });
    
    // Set up associations after models are synced
    ECA.hasMany(ECAEnrollment, {
      foreignKey: 'ecaId',
      as: 'enrollments'
    });

    ECA.hasMany(ECAAchievement, {
      foreignKey: 'ecaId',
      as: 'achievements'
    });

    ECAEnrollment.belongsTo(ECA, {
      foreignKey: 'ecaId',
      as: 'eca'
    });

    ECAAchievement.belongsTo(ECA, {
      foreignKey: 'ecaId',
      as: 'eca'
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up tables before each test
    await ECAAchievement.destroy({ where: {}, force: true });
    await ECAEnrollment.destroy({ where: {}, force: true });
    await ECA.destroy({ where: {}, force: true });
  });

  describe('generateParticipationCertificateData', () => {
    it('should generate certificate data from database', async () => {
      // Arrange - Create ECA
      const eca = await ECA.create({
        name: 'Debate Club',
        category: 'club',
        coordinatorId: 1,
        academicYearId: 1,
        currentEnrollment: 0,
        status: 'active'
      });

      // Create enrollment
      const enrollment = await ECAEnrollment.create({
        ecaId: eca.ecaId,
        studentId: 100,
        enrollmentDate: new Date('2024-01-01'),
        status: 'completed',
        attendanceCount: 18,
        totalSessions: 20
      });

      // Act
      const result = await ecaCertificateService.generateParticipationCertificateData(
        enrollment.enrollmentId,
        'John Doe'
      );

      // Assert
      expect(result.studentId).toBe(100);
      expect(result.studentName).toBe('John Doe');
      expect(result.ecaName).toBe('Debate Club');
      expect(result.ecaCategory).toBe('Club');
      expect(result.attendancePercentage).toBe(90);
      expect(result.totalSessions).toBe(20);
    });
  });

  describe('generateAchievementCertificateData', () => {
    it('should generate achievement certificate from database', async () => {
      // Arrange - Create ECA
      const eca = await ECA.create({
        name: 'Debate Club',
        category: 'club',
        coordinatorId: 1,
        academicYearId: 1,
        currentEnrollment: 0,
        status: 'active'
      });

      // Create achievement
      const achievement = await ECAAchievement.create({
        ecaId: eca.ecaId,
        studentId: 100,
        title: 'First Place',
        type: 'medal',
        level: 'national',
        position: '1st',
        achievementDate: new Date('2024-05-15'),
        achievementDateBS: '2081-02-01'
      });

      // Act
      const result = await ecaCertificateService.generateAchievementCertificateData(
        achievement.achievementId,
        'John Doe'
      );

      // Assert
      expect(result.studentId).toBe(100);
      expect(result.studentName).toBe('John Doe');
      expect(result.ecaName).toBe('Debate Club');
      expect(result.achievementTitle).toBe('First Place');
      expect(result.achievementType).toBe('Medal');
      expect(result.achievementLevel).toBe('National Level');
      expect(result.position).toBe('1st');
    });
  });

  describe('getStudentECAForCV', () => {
    it('should aggregate student ECA data for CV', async () => {
      // Arrange - Create ECAs
      const eca1 = await ECA.create({
        name: 'Debate Club',
        category: 'club',
        coordinatorId: 1,
        academicYearId: 1,
        currentEnrollment: 0,
        status: 'active'
      });

      const eca2 = await ECA.create({
        name: 'Music Club',
        category: 'cultural',
        coordinatorId: 1,
        academicYearId: 1,
        currentEnrollment: 0,
        status: 'active'
      });

      // Create enrollments
      await ECAEnrollment.create({
        ecaId: eca1.ecaId,
        studentId: 100,
        enrollmentDate: new Date('2024-01-01'),
        status: 'completed',
        attendanceCount: 18,
        totalSessions: 20
      });

      await ECAEnrollment.create({
        ecaId: eca2.ecaId,
        studentId: 100,
        enrollmentDate: new Date('2024-02-01'),
        status: 'active',
        attendanceCount: 12,
        totalSessions: 15
      });

      // Create achievement
      await ECAAchievement.create({
        ecaId: eca1.ecaId,
        studentId: 100,
        title: 'First Place',
        type: 'medal',
        level: 'national',
        position: '1st',
        achievementDate: new Date('2024-05-15')
      });

      // Act
      const result = await ecaCertificateService.getStudentECAForCV(100);

      // Assert
      expect(result.studentId).toBe(100);
      expect(result.participations).toHaveLength(2);
      expect(result.achievements).toHaveLength(1);
      expect(result.summary.totalECAs).toBe(2);
      expect(result.summary.totalAchievements).toBe(1);
      expect(result.summary.highLevelAchievements).toBe(1);
      expect(result.summary.averageAttendance).toBe(85); // (90 + 80) / 2
    });
  });

  describe('isEligibleForParticipationCertificate', () => {
    it('should validate eligibility based on attendance and sessions', async () => {
      // Arrange - Create ECA and enrollment with good attendance
      const eca = await ECA.create({
        name: 'Debate Club',
        category: 'club',
        coordinatorId: 1,
        academicYearId: 1,
        currentEnrollment: 0,
        status: 'active'
      });

      const enrollment = await ECAEnrollment.create({
        ecaId: eca.ecaId,
        studentId: 100,
        enrollmentDate: new Date('2024-01-01'),
        status: 'completed',
        attendanceCount: 15,
        totalSessions: 20
      });

      // Act
      const result = await ecaCertificateService.isEligibleForParticipationCertificate(
        enrollment.enrollmentId
      );

      // Assert
      expect(result.eligible).toBe(true);
    });

    it('should reject eligibility for low attendance', async () => {
      // Arrange - Create ECA and enrollment with low attendance
      const eca = await ECA.create({
        name: 'Debate Club',
        category: 'club',
        coordinatorId: 1,
        academicYearId: 1,
        currentEnrollment: 0,
        status: 'active'
      });

      const enrollment = await ECAEnrollment.create({
        ecaId: eca.ecaId,
        studentId: 100,
        enrollmentDate: new Date('2024-01-01'),
        status: 'completed',
        attendanceCount: 8,
        totalSessions: 20
      });

      // Act
      const result = await ecaCertificateService.isEligibleForParticipationCertificate(
        enrollment.enrollmentId
      );

      // Assert
      expect(result.eligible).toBe(false);
      expect(result.message).toContain('Insufficient attendance');
    });
  });

  describe('getECACertificateStats', () => {
    it('should calculate statistics for an ECA', async () => {
      // Arrange - Create ECA
      const eca = await ECA.create({
        name: 'Debate Club',
        category: 'club',
        coordinatorId: 1,
        academicYearId: 1,
        currentEnrollment: 0,
        status: 'active'
      });

      // Create enrollments with varying attendance
      await ECAEnrollment.create({
        ecaId: eca.ecaId,
        studentId: 100,
        enrollmentDate: new Date('2024-01-01'),
        status: 'completed',
        attendanceCount: 18,
        totalSessions: 20
      });

      await ECAEnrollment.create({
        ecaId: eca.ecaId,
        studentId: 101,
        enrollmentDate: new Date('2024-01-01'),
        status: 'completed',
        attendanceCount: 8,
        totalSessions: 20
      });

      // Create achievements at different levels
      await ECAAchievement.create({
        ecaId: eca.ecaId,
        studentId: 100,
        title: 'National Winner',
        type: 'medal',
        level: 'national',
        achievementDate: new Date('2024-05-15')
      });

      await ECAAchievement.create({
        ecaId: eca.ecaId,
        studentId: 101,
        title: 'School Winner',
        type: 'certificate',
        level: 'school',
        achievementDate: new Date('2024-04-10')
      });

      // Act
      const result = await ecaCertificateService.getECACertificateStats(eca.ecaId);

      // Assert
      expect(result.totalParticipants).toBe(2);
      expect(result.totalAchievements).toBe(2);
      expect(result.achievementsByLevel).toEqual({
        national: 1,
        school: 1
      });
      // Only one enrollment has sufficient attendance (>= 50%) and sessions (>= 5)
      expect(result.eligibleForCertificate).toBe(1);
    });
  });
});

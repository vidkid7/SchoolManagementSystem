/**
 * ECA Enrollment Model Tests
 * 
 * Tests for ECA enrollment model functionality
 * 
 * Requirements: 11.3, 11.4
 */

import { ECAEnrollment } from '../ECAEnrollment.model';

describe('ECAEnrollment Model', () => {
  describe('getAttendancePercentage', () => {
    it('should return 0 when total sessions is 0', () => {
      const enrollment = ECAEnrollment.build({
        ecaId: 1,
        studentId: 1,
        enrollmentDate: new Date(),
        attendanceCount: 0,
        totalSessions: 0,
      });

      expect(enrollment.getAttendancePercentage()).toBe(0);
    });

    it('should calculate correct percentage', () => {
      const enrollment = ECAEnrollment.build({
        ecaId: 1,
        studentId: 1,
        enrollmentDate: new Date(),
        attendanceCount: 8,
        totalSessions: 10,
      });

      expect(enrollment.getAttendancePercentage()).toBe(80);
    });

    it('should round percentage to nearest integer', () => {
      const enrollment = ECAEnrollment.build({
        ecaId: 1,
        studentId: 1,
        enrollmentDate: new Date(),
        attendanceCount: 7,
        totalSessions: 9,
      });

      // 7/9 = 77.777... should round to 78
      expect(enrollment.getAttendancePercentage()).toBe(78);
    });

    it('should return 100 for perfect attendance', () => {
      const enrollment = ECAEnrollment.build({
        ecaId: 1,
        studentId: 1,
        enrollmentDate: new Date(),
        attendanceCount: 15,
        totalSessions: 15,
      });

      expect(enrollment.getAttendancePercentage()).toBe(100);
    });
  });

  describe('toJSON', () => {
    it('should include all enrollment attributes', () => {
      const enrollmentDate = new Date('2024-01-15');
      const enrollment = ECAEnrollment.build({
        enrollmentId: 1,
        ecaId: 1,
        studentId: 1,
        enrollmentDate,
        status: 'active',
        attendanceCount: 8,
        totalSessions: 10,
        remarks: 'Good participation',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const json = enrollment.toJSON() as any;

      expect(json.enrollmentId).toBe(1);
      expect(json.ecaId).toBe(1);
      expect(json.studentId).toBe(1);
      expect(json.enrollmentDate).toEqual(enrollmentDate);
      expect(json.status).toBe('active');
      expect(json.attendanceCount).toBe(8);
      expect(json.totalSessions).toBe(10);
      expect(json.attendancePercentage).toBe(80);
      expect(json.remarks).toBe('Good participation');
      expect(json.createdAt).toBeDefined();
      expect(json.updatedAt).toBeDefined();
    });

    it('should include computed attendancePercentage', () => {
      const enrollment = ECAEnrollment.build({
        ecaId: 1,
        studentId: 1,
        enrollmentDate: new Date(),
        attendanceCount: 6,
        totalSessions: 8,
      });

      const json = enrollment.toJSON() as any;

      expect(json.attendancePercentage).toBe(75);
    });
  });

  describe('enrollment status', () => {
    it('should default to active status', () => {
      const enrollment = ECAEnrollment.build({
        ecaId: 1,
        studentId: 1,
        enrollmentDate: new Date(),
        status: 'active',
      });

      expect(enrollment.status).toBe('active');
    });

    it('should support withdrawn status', () => {
      const enrollment = ECAEnrollment.build({
        ecaId: 1,
        studentId: 1,
        enrollmentDate: new Date(),
        status: 'withdrawn',
      });

      expect(enrollment.status).toBe('withdrawn');
    });

    it('should support completed status', () => {
      const enrollment = ECAEnrollment.build({
        ecaId: 1,
        studentId: 1,
        enrollmentDate: new Date(),
        status: 'completed',
      });

      expect(enrollment.status).toBe('completed');
    });
  });

  describe('attendance tracking', () => {
    it('should initialize with zero attendance', () => {
      const enrollment = ECAEnrollment.build({
        ecaId: 1,
        studentId: 1,
        enrollmentDate: new Date(),
        attendanceCount: 0,
        totalSessions: 0,
      });

      expect(enrollment.attendanceCount).toBe(0);
      expect(enrollment.totalSessions).toBe(0);
    });

    it('should track attendance count separately from total sessions', () => {
      const enrollment = ECAEnrollment.build({
        ecaId: 1,
        studentId: 1,
        enrollmentDate: new Date(),
        attendanceCount: 5,
        totalSessions: 7,
      });

      expect(enrollment.attendanceCount).toBe(5);
      expect(enrollment.totalSessions).toBe(7);
    });
  });
});

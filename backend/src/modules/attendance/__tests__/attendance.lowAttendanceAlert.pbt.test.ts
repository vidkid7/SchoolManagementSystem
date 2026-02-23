/**
 * Property-Based Tests for Attendance Service - Low Attendance Alerts
 * 
 * Uses fast-check to verify the low attendance alert property
 * across a large number of randomly generated test cases.
 * 
 * Task: 13.6 Write property test for low attendance alerts
 * Property 18: Low Attendance Alert Threshold
 * Validates: Requirements 6.8
 */

import * as fc from 'fast-check';
import AttendanceService from '../attendance.service';
import AttendanceRepository from '../attendance.repository';
import Student from '@models/Student.model';
import User from '@models/User.model';
import smsService from '@services/sms.service';

// Mock dependencies
jest.mock('../attendance.repository');
jest.mock('@models/Student.model');
jest.mock('@models/User.model');
jest.mock('@services/sms.service');

describe('Attendance Service - Low Attendance Alert Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('Property 18: Low Attendance Alert Threshold', () => {
    /**
     * **Validates: Requirements 6.8**
     * 
     * Property: For any student whose attendance percentage falls below 75%,
     * a notification should be sent to both the parent and admin users.
     * 
     * This is a critical business rule that ensures:
     * 1. Parents are informed when their child's attendance is at risk
     * 2. School administrators can take proactive measures
     * 3. Students maintain minimum attendance requirements
     * 
     * This test runs 100+ iterations with varying attendance percentages
     * to verify the property holds across all scenarios.
     */
    it('should trigger alerts when attendance falls below 75% threshold', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate student ID
          fc.integer({ min: 1, max: 10000 }),
          // Generate attendance percentage (0-100)
          fc.double({ min: 0, max: 100, noNaN: true }),
          // Generate student name
          fc.string({ minLength: 3, maxLength: 50 }),
          // Generate student code
          fc.string({ minLength: 5, maxLength: 20 }),
          // Generate parent phone (Nepal format)
          fc.constantFrom('9812345678', '9887654321', '9801234567', null),
          // Generate admin count
          fc.integer({ min: 0, max: 5 }),
          async (
            studentId,
            attendancePercentage,
            studentName,
            studentCode,
            parentPhone,
            adminCount
          ) => {
            // Reset mocks for this iteration
            jest.clearAllMocks();

            const THRESHOLD = 75;

            // Mock attendance percentage calculation
            (AttendanceRepository.calculateAttendancePercentage as jest.Mock).mockResolvedValue(
              attendancePercentage
            );

            // Mock student data
            const mockStudent = {
              studentId,
              studentCode,
              fatherPhone: parentPhone,
              motherPhone: null,
              getFullNameEn: jest.fn().mockReturnValue(studentName),
            };

            (Student.findByPk as jest.Mock).mockResolvedValue(mockStudent);

            // Mock admin users
            const mockAdmins = Array.from({ length: adminCount }, (_, i) => ({
              userId: i + 1,
              username: `admin${i + 1}`,
              phoneNumber: `981${String(i).padStart(7, '0')}`,
              role: 'school_admin',
            }));

            (User.findAll as jest.Mock).mockResolvedValue(mockAdmins);

            // Mock SMS service responses
            (smsService.sendLowAttendanceAlert as jest.Mock).mockResolvedValue({
              success: true,
              messageId: 'SMS-123',
            });

            (smsService.sendBulkSMS as jest.Mock).mockResolvedValue(
              mockAdmins.map(() => ({ success: true, messageId: 'SMS-456' }))
            );

            // Call the service method
            const result = await AttendanceService.checkAndAlertLowAttendance(studentId);

            // Property 1: belowThreshold flag should match attendance < 75%
            const expectedBelowThreshold = attendancePercentage < THRESHOLD;
            expect(result.belowThreshold).toBe(expectedBelowThreshold);

            // Property 2: Alerts should only be sent when below threshold
            if (expectedBelowThreshold) {
              // Should attempt to send alerts
              expect(result.alertSent).toBeDefined();

              // Property 3: Parent notification should be attempted if phone exists
              if (parentPhone) {
                expect(smsService.sendLowAttendanceAlert).toHaveBeenCalledWith(
                  parentPhone,
                  studentName,
                  attendancePercentage
                );
                expect(result.alertDetails?.parentNotified).toBe(true);
              } else {
                expect(smsService.sendLowAttendanceAlert).not.toHaveBeenCalled();
                expect(result.alertDetails?.parentNotified).toBe(false);
              }

              // Property 4: Admin notification should be attempted if admins exist
              if (adminCount > 0) {
                expect(smsService.sendBulkSMS).toHaveBeenCalled();
                expect(result.alertDetails?.adminNotified).toBe(true);

                // Verify all admins with phone numbers received messages
                const bulkSMSCall = (smsService.sendBulkSMS as jest.Mock).mock.calls[0][0];
                expect(bulkSMSCall).toHaveLength(adminCount);
                bulkSMSCall.forEach((msg: any, index: number) => {
                  expect(msg.recipient).toBe(mockAdmins[index].phoneNumber);
                  expect(msg.message).toContain('Low Attendance Alert');
                  expect(msg.message).toContain(studentName);
                  expect(msg.message).toContain(studentCode);
                  expect(msg.message).toContain(attendancePercentage.toFixed(1));
                });
              } else {
                expect(smsService.sendBulkSMS).not.toHaveBeenCalled();
              }

              // Property 5: alertSent should be true if any notification succeeded
              const expectedAlertSent =
                (parentPhone !== null) || (adminCount > 0);
              expect(result.alertSent).toBe(expectedAlertSent);
            } else {
              // Property 6: No alerts should be sent when above threshold
              expect(result.alertSent).toBe(false);
              expect(smsService.sendLowAttendanceAlert).not.toHaveBeenCalled();
              expect(smsService.sendBulkSMS).not.toHaveBeenCalled();
              expect(result.alertDetails).toBeUndefined();
            }

            // Property 7: Returned attendance percentage should match calculated value
            expect(result.attendancePercentage).toBe(attendancePercentage);

            // Property 8: Student ID should be preserved in result
            expect(result.studentId).toBe(studentId);
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    });

    /**
     * Property: Exact threshold boundary test
     * 
     * Test the exact 75% boundary to ensure:
     * - 74.9%: Alert triggered
     * - 75.0%: No alert (inclusive boundary)
     * - 75.1%: No alert
     */
    it('should enforce exact 75% threshold boundary', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }), // studentId
          fc.string({ minLength: 3, maxLength: 50 }), // studentName
          fc.string({ minLength: 5, maxLength: 20 }), // studentCode
          // Test boundary cases
          fc.constantFrom(74.9, 75.0, 75.1),
          async (studentId, studentName, studentCode, attendancePercentage) => {
            jest.clearAllMocks();

            (AttendanceRepository.calculateAttendancePercentage as jest.Mock).mockResolvedValue(
              attendancePercentage
            );

            const mockStudent = {
              studentId,
              studentCode,
              fatherPhone: '9812345678',
              motherPhone: null,
              getFullNameEn: jest.fn().mockReturnValue(studentName),
            };

            (Student.findByPk as jest.Mock).mockResolvedValue(mockStudent);
            (User.findAll as jest.Mock).mockResolvedValue([]);

            (smsService.sendLowAttendanceAlert as jest.Mock).mockResolvedValue({
              success: true,
              messageId: 'SMS-123',
            });

            const result = await AttendanceService.checkAndAlertLowAttendance(studentId);

            // Property: Threshold is strictly less than 75%
            if (attendancePercentage < 75.0) {
              expect(result.belowThreshold).toBe(true);
              expect(smsService.sendLowAttendanceAlert).toHaveBeenCalled();
            } else {
              expect(result.belowThreshold).toBe(false);
              expect(smsService.sendLowAttendanceAlert).not.toHaveBeenCalled();
            }
          }
        ),
        {
          numRuns: 60,
          verbose: true,
        }
      );
    });

    /**
     * Property: Alert message content validation
     * 
     * When alerts are sent, they should contain all required information:
     * - Student name
     * - Attendance percentage
     * - Threshold value (75%)
     */
    it('should include required information in alert messages', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }), // studentId
          fc.string({ minLength: 3, maxLength: 50 }), // studentName
          fc.string({ minLength: 5, maxLength: 20 }), // studentCode
          // Only test below threshold
          fc.double({ min: 0, max: 74.9, noNaN: true }),
          async (studentId, studentName, studentCode, attendancePercentage) => {
            jest.clearAllMocks();

            (AttendanceRepository.calculateAttendancePercentage as jest.Mock).mockResolvedValue(
              attendancePercentage
            );

            const mockStudent = {
              studentId,
              studentCode,
              fatherPhone: '9812345678',
              motherPhone: null,
              getFullNameEn: jest.fn().mockReturnValue(studentName),
            };

            (Student.findByPk as jest.Mock).mockResolvedValue(mockStudent);

            const mockAdmins = [
              {
                userId: 1,
                username: 'admin1',
                phoneNumber: '9811111111',
                role: 'school_admin',
              },
            ];

            (User.findAll as jest.Mock).mockResolvedValue(mockAdmins);

            (smsService.sendLowAttendanceAlert as jest.Mock).mockResolvedValue({
              success: true,
              messageId: 'SMS-123',
            });

            (smsService.sendBulkSMS as jest.Mock).mockResolvedValue([
              { success: true, messageId: 'SMS-456' },
            ]);

            await AttendanceService.checkAndAlertLowAttendance(studentId);

            // Property: Parent alert should contain student name and percentage
            expect(smsService.sendLowAttendanceAlert).toHaveBeenCalledWith(
              '9812345678',
              studentName,
              attendancePercentage
            );

            // Property: Admin alert should contain all required information
            const bulkSMSCall = (smsService.sendBulkSMS as jest.Mock).mock.calls[0][0];
            expect(bulkSMSCall[0].message).toContain('Low Attendance Alert');
            expect(bulkSMSCall[0].message).toContain(studentName);
            expect(bulkSMSCall[0].message).toContain(studentCode);
            expect(bulkSMSCall[0].message).toContain(attendancePercentage.toFixed(1));
            expect(bulkSMSCall[0].message).toContain('75%'); // Threshold
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    });

    /**
     * Property: Fallback to mother's phone if father's phone unavailable
     * 
     * If father's phone is not available, the system should try mother's phone.
     */
    it('should use mother phone as fallback when father phone unavailable', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }), // studentId
          fc.string({ minLength: 3, maxLength: 50 }), // studentName
          fc.double({ min: 0, max: 74.9, noNaN: true }), // attendancePercentage
          fc.constantFrom('9812345678', null), // motherPhone
          async (studentId, studentName, attendancePercentage, motherPhone) => {
            jest.clearAllMocks();

            (AttendanceRepository.calculateAttendancePercentage as jest.Mock).mockResolvedValue(
              attendancePercentage
            );

            const mockStudent = {
              studentId,
              studentCode: 'STU-001',
              fatherPhone: null, // Father's phone not available
              motherPhone,
              getFullNameEn: jest.fn().mockReturnValue(studentName),
            };

            (Student.findByPk as jest.Mock).mockResolvedValue(mockStudent);
            (User.findAll as jest.Mock).mockResolvedValue([]);

            (smsService.sendLowAttendanceAlert as jest.Mock).mockResolvedValue({
              success: true,
              messageId: 'SMS-123',
            });

            const result = await AttendanceService.checkAndAlertLowAttendance(studentId);

            // Property: Should use mother's phone if available
            if (motherPhone) {
              expect(smsService.sendLowAttendanceAlert).toHaveBeenCalledWith(
                motherPhone,
                studentName,
                attendancePercentage
              );
              expect(result.alertDetails?.parentNotified).toBe(true);
            } else {
              expect(smsService.sendLowAttendanceAlert).not.toHaveBeenCalled();
              expect(result.alertDetails?.parentNotified).toBe(false);
            }
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    });

    /**
     * Property: Batch processing should maintain threshold property
     * 
     * When checking multiple students in batch, the threshold property
     * should hold for each individual student.
     */
    it('should maintain threshold property for batch processing', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate array of students with varying attendance and unique IDs
          fc.uniqueArray(
            fc.record({
              studentId: fc.integer({ min: 1, max: 10000 }),
              attendancePercentage: fc.double({ min: 0, max: 100, noNaN: true }),
              studentName: fc.string({ minLength: 3, maxLength: 50 }),
              studentCode: fc.string({ minLength: 5, maxLength: 20 }),
              hasParentPhone: fc.boolean(),
            }),
            {
              minLength: 1,
              maxLength: 10,
              selector: (student) => student.studentId, // Ensure unique student IDs
            }
          ),
          async (students) => {
            jest.clearAllMocks();

            // Mock each student's data
            for (const student of students) {
              (AttendanceRepository.calculateAttendancePercentage as jest.Mock)
                .mockResolvedValueOnce(student.attendancePercentage);

              if (student.attendancePercentage < 75) {
                const mockStudent = {
                  studentId: student.studentId,
                  studentCode: student.studentCode,
                  fatherPhone: student.hasParentPhone ? '9812345678' : null,
                  motherPhone: null,
                  getFullNameEn: jest.fn().mockReturnValue(student.studentName),
                };

                (Student.findByPk as jest.Mock).mockResolvedValueOnce(mockStudent);
              }
            }

            (User.findAll as jest.Mock).mockResolvedValue([]);

            (smsService.sendLowAttendanceAlert as jest.Mock).mockResolvedValue({
              success: true,
              messageId: 'SMS-123',
            });

            const studentIds = students.map((s) => s.studentId);
            const results = await AttendanceService.batchCheckLowAttendance(studentIds);

            // Property: Each result should correctly reflect threshold
            results.forEach((result) => {
              const student = students.find((s) => s.studentId === result.studentId);
              if (student) {
                const expectedBelowThreshold = student.attendancePercentage < 75;
                expect(result.belowThreshold).toBe(expectedBelowThreshold);
                expect(result.attendancePercentage).toBeCloseTo(student.attendancePercentage, 10);
              }
            });

            // Property: Number of alerts should match number of students below threshold
            const expectedAlertsCount = students.filter(
              (s) => s.attendancePercentage < 75 && s.hasParentPhone
            ).length;

            expect(smsService.sendLowAttendanceAlert).toHaveBeenCalledTimes(
              expectedAlertsCount
            );
          }
        ),
        {
          numRuns: 30,
          verbose: true,
        }
      );
    });

    /**
     * Property: SMS service failures should not prevent alert status reporting
     * 
     * Even if SMS sending fails, the system should still report the
     * attendance status correctly.
     */
    it('should handle SMS service failures gracefully', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }), // studentId
          fc.string({ minLength: 3, maxLength: 50 }), // studentName
          fc.double({ min: 0, max: 74.9, noNaN: true }), // attendancePercentage
          fc.boolean(), // parentSMSSuccess
          fc.boolean(), // adminSMSSuccess
          async (
            studentId,
            studentName,
            attendancePercentage,
            parentSMSSuccess,
            adminSMSSuccess
          ) => {
            jest.clearAllMocks();

            (AttendanceRepository.calculateAttendancePercentage as jest.Mock).mockResolvedValue(
              attendancePercentage
            );

            const mockStudent = {
              studentId,
              studentCode: 'STU-001',
              fatherPhone: '9812345678',
              motherPhone: null,
              getFullNameEn: jest.fn().mockReturnValue(studentName),
            };

            (Student.findByPk as jest.Mock).mockResolvedValue(mockStudent);

            const mockAdmins = [
              {
                userId: 1,
                username: 'admin1',
                phoneNumber: '9811111111',
                role: 'school_admin',
              },
            ];

            (User.findAll as jest.Mock).mockResolvedValue(mockAdmins);

            // Mock SMS service with varying success/failure
            (smsService.sendLowAttendanceAlert as jest.Mock).mockResolvedValue({
              success: parentSMSSuccess,
              messageId: parentSMSSuccess ? 'SMS-123' : undefined,
              error: parentSMSSuccess ? undefined : 'SMS gateway error',
            });

            (smsService.sendBulkSMS as jest.Mock).mockResolvedValue([
              {
                success: adminSMSSuccess,
                messageId: adminSMSSuccess ? 'SMS-456' : undefined,
                error: adminSMSSuccess ? undefined : 'SMS gateway error',
              },
            ]);

            const result = await AttendanceService.checkAndAlertLowAttendance(studentId);

            // Property: belowThreshold should always be true for attendance < 75%
            expect(result.belowThreshold).toBe(true);

            // Property: alertSent should reflect actual SMS success
            const expectedAlertSent = parentSMSSuccess || adminSMSSuccess;
            expect(result.alertSent).toBe(expectedAlertSent);

            // Property: Individual notification statuses should match SMS results
            expect(result.alertDetails?.parentNotified).toBe(parentSMSSuccess);
            expect(result.alertDetails?.adminNotified).toBe(adminSMSSuccess);
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    });

    /**
     * Property: Date range filters should not affect threshold logic
     * 
     * The 75% threshold should apply consistently regardless of
     * the date range used for calculation.
     */
    it('should apply threshold consistently across different date ranges', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10000 }), // studentId
          fc.string({ minLength: 3, maxLength: 50 }), // studentName
          fc.double({ min: 0, max: 100, noNaN: true }), // attendancePercentage
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }), // dateFrom
          fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }), // dateTo
          async (studentId, studentName, attendancePercentage, dateFrom, dateTo) => {
            jest.clearAllMocks();

            // Ensure dateFrom is before dateTo
            if (dateFrom > dateTo) {
              [dateFrom, dateTo] = [dateTo, dateFrom];
            }

            (AttendanceRepository.calculateAttendancePercentage as jest.Mock).mockResolvedValue(
              attendancePercentage
            );

            const mockStudent = {
              studentId,
              studentCode: 'STU-001',
              fatherPhone: '9812345678',
              motherPhone: null,
              getFullNameEn: jest.fn().mockReturnValue(studentName),
            };

            (Student.findByPk as jest.Mock).mockResolvedValue(mockStudent);
            (User.findAll as jest.Mock).mockResolvedValue([]);

            (smsService.sendLowAttendanceAlert as jest.Mock).mockResolvedValue({
              success: true,
              messageId: 'SMS-123',
            });

            const result = await AttendanceService.checkAndAlertLowAttendance(
              studentId,
              dateFrom,
              dateTo
            );

            // Property: Threshold logic should be independent of date range
            const expectedBelowThreshold = attendancePercentage < 75;
            expect(result.belowThreshold).toBe(expectedBelowThreshold);

            // Property: Alerts should be sent based on percentage, not date range
            if (expectedBelowThreshold) {
              expect(smsService.sendLowAttendanceAlert).toHaveBeenCalled();
            } else {
              expect(smsService.sendLowAttendanceAlert).not.toHaveBeenCalled();
            }
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    });
  });
});

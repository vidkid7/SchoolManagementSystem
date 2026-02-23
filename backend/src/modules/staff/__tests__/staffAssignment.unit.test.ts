import qualificationValidationService from '../qualificationValidation.service';
import Staff, { StaffCategory, StaffStatus } from '@models/Staff.model';
import { Subject } from '@models/Subject.model';
import Class from '@models/Class.model';

/**
 * Staff Assignment Unit Tests
 * Unit tests for staff assignment functionality
 * Requirements: 4.3, 4.4, 4.9
 */

// Mock the models
jest.mock('@models/Staff.model');
jest.mock('@models/Subject.model');
jest.mock('@models/Class.model');

describe('Staff Assignment Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Qualification Validation', () => {
    it('should reject non-teaching staff for subject assignment', async () => {
      // Mock staff findByPk to return non-teaching staff
      (Staff.findByPk as jest.Mock).mockResolvedValue({
        staffId: 1,
        category: StaffCategory.NON_TEACHING,
        status: StaffStatus.ACTIVE
      });

      (Subject.findByPk as jest.Mock).mockResolvedValue({
        subjectId: 1,
        nameEn: 'Mathematics'
      });

      const result = await qualificationValidationService.validateSubjectAssignment(1, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Staff member is not in teaching category');
    });

    it('should reject inactive staff for subject assignment', async () => {
      (Staff.findByPk as jest.Mock).mockResolvedValue({
        staffId: 1,
        category: StaffCategory.TEACHING,
        status: StaffStatus.INACTIVE
      });

      (Subject.findByPk as jest.Mock).mockResolvedValue({
        subjectId: 1,
        nameEn: 'Mathematics'
      });

      const result = await qualificationValidationService.validateSubjectAssignment(1, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Staff member is not active');
    });

    it('should validate qualified teaching staff', async () => {
      (Staff.findByPk as jest.Mock).mockResolvedValue({
        staffId: 1,
        category: StaffCategory.TEACHING,
        status: StaffStatus.ACTIVE,
        highestQualification: 'Master of Science in Mathematics',
        specialization: 'Mathematics',
        teachingLicense: 'TL-12345'
      });

      (Subject.findByPk as jest.Mock).mockResolvedValue({
        subjectId: 1,
        nameEn: 'Mathematics'
      });

      (Class.findByPk as jest.Mock).mockResolvedValue({
        classId: 1,
        gradeLevel: 10
      });

      const result = await qualificationValidationService.validateSubjectAssignment(1, 1, 1);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should warn about missing teaching license', async () => {
      (Staff.findByPk as jest.Mock).mockResolvedValue({
        staffId: 1,
        category: StaffCategory.TEACHING,
        status: StaffStatus.ACTIVE,
        highestQualification: 'Bachelor of Science',
        specialization: 'Mathematics'
        // No teaching license
      });

      (Subject.findByPk as jest.Mock).mockResolvedValue({
        subjectId: 1,
        nameEn: 'Mathematics'
      });

      const result = await qualificationValidationService.validateSubjectAssignment(1, 1);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('teaching license'))).toBe(true);
    });

    it('should warn about specialization mismatch', async () => {
      (Staff.findByPk as jest.Mock).mockResolvedValue({
        staffId: 1,
        category: StaffCategory.TEACHING,
        status: StaffStatus.ACTIVE,
        highestQualification: 'Master of Science in Mathematics',
        specialization: 'Mathematics',
        teachingLicense: 'TL-12345'
      });

      (Subject.findByPk as jest.Mock).mockResolvedValue({
        subjectId: 1,
        nameEn: 'English'
      });

      const result = await qualificationValidationService.validateSubjectAssignment(1, 1);

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('may not match'))).toBe(true);
    });
  });

  describe('Class Teacher Validation', () => {
    it('should validate qualified teacher for class teacher role', async () => {
      (Staff.findByPk as jest.Mock).mockResolvedValue({
        staffId: 1,
        category: StaffCategory.TEACHING,
        status: StaffStatus.ACTIVE,
        highestQualification: 'Bachelor of Education',
        teachingLicense: 'TL-12345'
      });

      (Class.findByPk as jest.Mock).mockResolvedValue({
        classId: 1,
        gradeLevel: 10
      });

      const result = await qualificationValidationService.validateClassTeacherAssignment(1, 1);

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject non-teaching staff for class teacher', async () => {
      (Staff.findByPk as jest.Mock).mockResolvedValue({
        staffId: 1,
        category: StaffCategory.NON_TEACHING,
        status: StaffStatus.ACTIVE
      });

      (Class.findByPk as jest.Mock).mockResolvedValue({
        classId: 1,
        gradeLevel: 10
      });

      const result = await qualificationValidationService.validateClassTeacherAssignment(1, 1);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Staff member is not in teaching category');
    });
  });

  describe('Multiple Assignments Validation', () => {
    it('should warn about excessive workload', async () => {
      (Staff.findByPk as jest.Mock).mockResolvedValue({
        staffId: 1,
        category: StaffCategory.TEACHING,
        status: StaffStatus.ACTIVE,
        highestQualification: 'Master of Science',
        teachingLicense: 'TL-12345'
      });

      (Subject.findByPk as jest.Mock).mockResolvedValue({
        subjectId: 1,
        nameEn: 'Mathematics'
      });

      // Create 7 assignments (excessive)
      const assignments = Array(7).fill(null).map(() => ({
        subjectId: 1,
        classId: 1,
        assignmentType: 'subject_teacher'
      }));

      const result = await qualificationValidationService.validateMultipleAssignments(1, assignments);

      expect(result.warnings.some(w => w.includes('excessive'))).toBe(true);
    });
  });
});

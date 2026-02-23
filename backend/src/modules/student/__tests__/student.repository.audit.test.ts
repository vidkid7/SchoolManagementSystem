import studentRepository from '../student.repository';
import auditLogger from '@utils/auditLogger';
import Student, { StudentStatus, Gender } from '@models/Student.model';
import { Request } from 'express';

// Mock the audit logger
jest.mock('@utils/auditLogger');

// Mock the Student model
jest.mock('@models/Student.model');

describe('Student Repository - Audit Logging Integration', () => {
  const mockUserId = 123;
  const mockReq = {
    ip: '192.168.1.1',
    get: jest.fn().mockReturnValue('Mozilla/5.0')
  } as unknown as Request;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should log audit entry when creating a student', async () => {
      const studentData = {
        studentCode: 'TEST-2024-001',
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        dateOfBirthBS: '2060-01-01',
        dateOfBirthAD: new Date('2003-04-14'),
        gender: Gender.MALE,
        addressEn: 'Kathmandu',
        fatherName: 'Father Name',
        fatherPhone: '9841234567',
        motherName: 'Mother Name',
        motherPhone: '9841234568',
        admissionDate: new Date('2024-01-01'),
        admissionClass: 1,
        emergencyContact: '9841234567',
        status: StudentStatus.ACTIVE
      };

      const mockStudent = {
        studentId: 1,
        ...studentData,
        toJSON: jest.fn().mockReturnValue({ studentId: 1, ...studentData })
      };

      (Student.create as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);

      await studentRepository.create(studentData, mockUserId, mockReq);

      expect(auditLogger.logCreate).toHaveBeenCalledWith(
        'student',
        1,
        expect.objectContaining({ studentId: 1 }),
        mockUserId,
        mockReq
      );
    });
  });

  describe('update', () => {
    it('should log audit entry with old and new values when updating a student', async () => {
      const oldData = {
        studentId: 1,
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        email: 'john@example.com'
      };

      const updateData = {
        firstNameEn: 'John',
        lastNameEn: 'Smith',
        email: 'john.smith@example.com'
      };

      const newData = {
        ...oldData,
        ...updateData
      };

      const mockStudent = {
        ...oldData,
        toJSON: jest.fn()
          .mockReturnValueOnce(oldData)  // First call for old value
          .mockReturnValueOnce(newData), // Second call for new value
        update: jest.fn().mockResolvedValue(undefined)
      };

      (Student.findByPk as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);

      await studentRepository.update(1, updateData, mockUserId, mockReq);

      expect(auditLogger.logUpdate).toHaveBeenCalledWith(
        'student',
        1,
        oldData,
        newData,
        mockUserId,
        mockReq
      );
    });

    it('should not log audit entry if student not found', async () => {
      (Student.findByPk as jest.Mock) = jest.fn().mockResolvedValue(null);

      const result = await studentRepository.update(999, { firstNameEn: 'Test' }, mockUserId, mockReq);

      expect(result).toBeNull();
      expect(auditLogger.logUpdate).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should log audit entry when soft deleting a student', async () => {
      const studentData = {
        studentId: 1,
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        status: StudentStatus.ACTIVE
      };

      const mockStudent = {
        ...studentData,
        toJSON: jest.fn().mockReturnValue(studentData),
        destroy: jest.fn().mockResolvedValue(undefined)
      };

      (Student.findByPk as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);

      await studentRepository.delete(1, mockUserId, mockReq);

      expect(auditLogger.logDelete).toHaveBeenCalledWith(
        'student',
        1,
        studentData,
        mockUserId,
        mockReq
      );
    });

    it('should not log audit entry if student not found', async () => {
      (Student.findByPk as jest.Mock) = jest.fn().mockResolvedValue(null);

      const result = await studentRepository.delete(999, mockUserId, mockReq);

      expect(result).toBe(false);
      expect(auditLogger.logDelete).not.toHaveBeenCalled();
    });
  });

  describe('restore', () => {
    it('should log audit entry when restoring a soft-deleted student', async () => {
      const studentData = {
        studentId: 1,
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        deletedAt: new Date()
      };

      const mockStudent = {
        ...studentData,
        toJSON: jest.fn().mockReturnValue(studentData),
        restore: jest.fn().mockResolvedValue(undefined)
      };

      (Student.findByPk as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);

      await studentRepository.restore(1, mockUserId, mockReq);

      expect(auditLogger.logRestore).toHaveBeenCalledWith(
        'student',
        1,
        studentData,
        mockUserId,
        mockReq
      );
    });

    it('should not log audit entry if student not found or not deleted', async () => {
      const mockStudent = {
        studentId: 1,
        deletedAt: null
      };

      (Student.findByPk as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);

      const result = await studentRepository.restore(1, mockUserId, mockReq);

      expect(result).toBeNull();
      expect(auditLogger.logRestore).not.toHaveBeenCalled();
    });
  });

  describe('updateStatus', () => {
    it('should log audit entry when updating student status', async () => {
      const oldData = {
        studentId: 1,
        status: StudentStatus.ACTIVE
      };

      const newData = {
        studentId: 1,
        status: StudentStatus.INACTIVE
      };

      const mockStudent = {
        ...oldData,
        status: StudentStatus.ACTIVE,
        toJSON: jest.fn()
          .mockReturnValueOnce(oldData)
          .mockReturnValueOnce(newData),
        save: jest.fn().mockResolvedValue(undefined)
      };

      (Student.findByPk as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);

      await studentRepository.updateStatus(1, StudentStatus.INACTIVE, mockUserId, mockReq);

      expect(auditLogger.logUpdate).toHaveBeenCalledWith(
        'student',
        1,
        oldData,
        newData,
        mockUserId,
        mockReq
      );
    });
  });

  describe('transferClass', () => {
    it('should log audit entry when transferring student to new class', async () => {
      const oldData = {
        studentId: 1,
        currentClassId: 10,
        rollNumber: 5
      };

      const newData = {
        studentId: 1,
        currentClassId: 20,
        rollNumber: 8
      };

      const mockStudent = {
        ...oldData,
        currentClassId: 10,
        rollNumber: 5,
        toJSON: jest.fn()
          .mockReturnValueOnce(oldData)
          .mockReturnValueOnce(newData),
        save: jest.fn().mockResolvedValue(undefined)
      };

      (Student.findByPk as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);

      await studentRepository.transferClass(1, 20, 8, mockUserId, mockReq);

      expect(auditLogger.logUpdate).toHaveBeenCalledWith(
        'student',
        1,
        oldData,
        newData,
        mockUserId,
        mockReq
      );
    });
  });

  describe('audit logging without request object', () => {
    it('should log audit entry even without request object', async () => {
      const studentData = {
        studentCode: 'TEST-2024-001',
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        dateOfBirthBS: '2060-01-01',
        dateOfBirthAD: new Date('2003-04-14'),
        gender: Gender.MALE,
        addressEn: 'Kathmandu',
        fatherName: 'Father Name',
        fatherPhone: '9841234567',
        motherName: 'Mother Name',
        motherPhone: '9841234568',
        admissionDate: new Date('2024-01-01'),
        admissionClass: 1,
        emergencyContact: '9841234567',
        status: StudentStatus.ACTIVE
      };

      const mockStudent = {
        studentId: 1,
        ...studentData,
        toJSON: jest.fn().mockReturnValue({ studentId: 1, ...studentData })
      };

      (Student.create as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);

      // Call without request object
      await studentRepository.create(studentData, mockUserId);

      expect(auditLogger.logCreate).toHaveBeenCalledWith(
        'student',
        1,
        expect.objectContaining({ studentId: 1 }),
        mockUserId,
        undefined  // No request object
      );
    });
  });

  describe('audit logging without user ID', () => {
    it('should log audit entry even without user ID (system action)', async () => {
      const studentData = {
        studentCode: 'TEST-2024-001',
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        dateOfBirthBS: '2060-01-01',
        dateOfBirthAD: new Date('2003-04-14'),
        gender: Gender.MALE,
        addressEn: 'Kathmandu',
        fatherName: 'Father Name',
        fatherPhone: '9841234567',
        motherName: 'Mother Name',
        motherPhone: '9841234568',
        admissionDate: new Date('2024-01-01'),
        admissionClass: 1,
        emergencyContact: '9841234567',
        status: StudentStatus.ACTIVE
      };

      const mockStudent = {
        studentId: 1,
        ...studentData,
        toJSON: jest.fn().mockReturnValue({ studentId: 1, ...studentData })
      };

      (Student.create as jest.Mock) = jest.fn().mockResolvedValue(mockStudent);

      // Call without user ID (system action)
      await studentRepository.create(studentData);

      expect(auditLogger.logCreate).toHaveBeenCalledWith(
        'student',
        1,
        expect.objectContaining({ studentId: 1 }),
        undefined,  // No user ID
        undefined   // No request object
      );
    });
  });
});

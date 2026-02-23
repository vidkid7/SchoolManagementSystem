/**
 * CV Repository Unit Tests
 * 
 * Tests for CV database operations
 * 
 * Requirements: 26.1, 26.3, 26.4
 */

import { CVRepository, CVCustomization } from '../cv.repository';
import StudentCV from '@models/StudentCV.model';

// Mock the StudentCV model
jest.mock('@models/StudentCV.model');

describe('CVRepository', () => {
  let repository: CVRepository;
  let mockStudentCV: jest.Mocked<typeof StudentCV>;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new CVRepository();
    mockStudentCV = StudentCV as jest.Mocked<typeof StudentCV>;
  });

  describe('findByStudentId', () => {
    it('should return CV when found', async () => {
      const mockCV = {
        cvId: 1,
        studentId: 100,
        showPersonalInfo: true
      };

      mockStudentCV.findOne.mockResolvedValue(mockCV as any);

      const result = await repository.findByStudentId(100);

      expect(mockStudentCV.findOne).toHaveBeenCalledWith({
        where: { studentId: 100 }
      });
      expect(result).toEqual(mockCV);
    });

    it('should return null when not found', async () => {
      mockStudentCV.findOne.mockResolvedValue(null);

      const result = await repository.findByStudentId(999);

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should return CV by ID', async () => {
      const mockCV = {
        cvId: 1,
        studentId: 100
      };

      mockStudentCV.findByPk.mockResolvedValue(mockCV as any);

      const result = await repository.findById(1);

      expect(mockStudentCV.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCV);
    });

    it('should return null when not found', async () => {
      mockStudentCV.findByPk.mockResolvedValue(null);

      const result = await repository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all CVs with no filters', async () => {
      const mockCVs = [
        { cvId: 1, studentId: 100 },
        { cvId: 2, studentId: 200 }
      ];

      mockStudentCV.findAll.mockResolvedValue(mockCVs as any);

      const result = await repository.findAll();

      expect(mockStudentCV.findAll).toHaveBeenCalledWith({ where: {} });
      expect(result).toEqual(mockCVs);
    });

    it('should filter by studentId', async () => {
      const mockCVs = [{ cvId: 1, studentId: 100 }];

      mockStudentCV.findAll.mockResolvedValue(mockCVs as any);

      const result = await repository.findAll({ studentId: 100 });

      expect(mockStudentCV.findAll).toHaveBeenCalledWith({
        where: { studentId: 100 }
      });
      expect(result).toEqual(mockCVs);
    });

    it('should filter by templateId', async () => {
      const mockCVs = [{ cvId: 1, studentId: 100, templateId: 'professional' }];

      mockStudentCV.findAll.mockResolvedValue(mockCVs as any);

      await repository.findAll({ templateId: 'professional' });

      expect(mockStudentCV.findAll).toHaveBeenCalledWith({
        where: { templateId: 'professional' }
      });
    });
  });

  describe('upsert', () => {
    it('should update existing CV', async () => {
      const existingCV = {
        cvId: 1,
        studentId: 100,
        showPersonalInfo: true,
        showAcademicPerformance: true,
        showAttendance: true,
        showECA: true,
        showSports: true,
        showCertificates: true,
        showAwards: true,
        showTeacherRemarks: true,
        skills: '[]',
        hobbies: '[]',
        careerGoals: '',
        personalStatement: '',
        templateId: 'standard',
        schoolBrandingEnabled: true,
        set: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined)
      };

      mockStudentCV.findOne.mockResolvedValue(existingCV as any);

      const dto: CVCustomization = {
        studentId: 100,
        showPersonalInfo: false,
        showAcademicPerformance: true,
        showAttendance: true,
        showECA: true,
        showSports: true,
        showCertificates: true,
        showAwards: true,
        showTeacherRemarks: true,
        skills: ['JavaScript'],
        hobbies: ['Reading'],
        careerGoals: 'Engineer',
        personalStatement: 'Passionate',
        templateId: 'professional',
        schoolBrandingEnabled: true
      };

      const result = await repository.upsert(dto);

      expect(existingCV.set).toHaveBeenCalled();
      expect(existingCV.save).toHaveBeenCalled();
      expect(result).toEqual(existingCV);
    });

    it('should create new CV when not exists', async () => {
      mockStudentCV.findOne.mockResolvedValue(null);

      const newCV = {
        cvId: 1,
        studentId: 100,
        showPersonalInfo: true,
        showAcademicPerformance: true,
        showAttendance: true,
        showECA: true,
        showSports: true,
        showCertificates: true,
        showAwards: true,
        showTeacherRemarks: true,
        skills: '[]',
        hobbies: '[]',
        careerGoals: '',
        personalStatement: '',
        templateId: 'standard',
        schoolBrandingEnabled: true
      };

      mockStudentCV.create.mockResolvedValue(newCV as any);

      const dto: CVCustomization = {
        studentId: 100,
        showPersonalInfo: true,
        showAcademicPerformance: true,
        showAttendance: true,
        showECA: true,
        showSports: true,
        showCertificates: true,
        showAwards: true,
        showTeacherRemarks: true,
        skills: [],
        hobbies: [],
        careerGoals: '',
        personalStatement: '',
        templateId: 'standard',
        schoolBrandingEnabled: true
      };

      const result = await repository.upsert(dto);

      expect(mockStudentCV.create).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 100
        })
      );
      expect(result).toEqual(newCV);
    });
  });

  describe('updateLastGeneratedAt', () => {
    it('should update timestamp when CV exists', async () => {
      const existingCV = {
        cvId: 1,
        studentId: 100,
        lastGeneratedAt: new Date(),
        save: jest.fn().mockResolvedValue(undefined)
      };

      mockStudentCV.findOne.mockResolvedValue(existingCV as any);

      const result = await repository.updateLastGeneratedAt(100);

      expect(existingCV.lastGeneratedAt).toBeDefined();
      expect(existingCV.save).toHaveBeenCalled();
      expect(result).toEqual(existingCV);
    });

    it('should return null when CV does not exist', async () => {
      mockStudentCV.findOne.mockResolvedValue(null);

      const result = await repository.updateLastGeneratedAt(999);

      expect(result).toBeNull();
    });
  });

  describe('updateSectionVisibility', () => {
    it('should update section visibility', async () => {
      const existingCV = {
        cvId: 1,
        studentId: 100,
        showPersonalInfo: true,
        showAcademicPerformance: true,
        showAttendance: true,
        showECA: true,
        showSports: true,
        showCertificates: true,
        showAwards: true,
        showTeacherRemarks: true,
        setSectionVisibility: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined)
      };

      mockStudentCV.findOne.mockResolvedValue(existingCV as any);

      const visibility = {
        personalInfo: false,
        academicPerformance: true,
        attendance: false
      };

      await repository.updateSectionVisibility(100, visibility);

      expect(existingCV.setSectionVisibility).toHaveBeenCalledWith(visibility);
      expect(existingCV.save).toHaveBeenCalled();
    });
  });

  describe('updateCustomFields', () => {
    it('should update custom fields', async () => {
      const existingCV = {
        cvId: 1,
        studentId: 100,
        skills: '[]',
        hobbies: '[]',
        careerGoals: '',
        personalStatement: '',
        setSkills: jest.fn(),
        setHobbies: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined)
      };

      mockStudentCV.findOne.mockResolvedValue(existingCV as any);

      const customFields = {
        skills: ['JavaScript', 'Python'],
        hobbies: ['Reading'],
        careerGoals: 'Software Engineer'
      };

      await repository.updateCustomFields(100, customFields);

      expect(existingCV.setSkills).toHaveBeenCalledWith(['JavaScript', 'Python']);
      expect(existingCV.setHobbies).toHaveBeenCalledWith(['Reading']);
      expect(existingCV.careerGoals).toBe('Software Engineer');
      expect(existingCV.save).toHaveBeenCalled();
    });
  });

  describe('updateTemplate', () => {
    it('should update template ID', async () => {
      const existingCV = {
        cvId: 1,
        studentId: 100,
        templateId: 'standard',
        save: jest.fn().mockResolvedValue(undefined)
      };

      mockStudentCV.findOne.mockResolvedValue(existingCV as any);

      await repository.updateTemplate(100, 'professional');

      expect(existingCV.templateId).toBe('professional');
      expect(existingCV.save).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete CV when exists', async () => {
      const existingCV = {
        cvId: 1,
        studentId: 100,
        destroy: jest.fn().mockResolvedValue(undefined)
      };

      mockStudentCV.findOne.mockResolvedValue(existingCV as any);

      const result = await repository.delete(100);

      expect(existingCV.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when CV does not exist', async () => {
      mockStudentCV.findOne.mockResolvedValue(null);

      const result = await repository.delete(999);

      expect(result).toBe(false);
    });
  });

  describe('exists', () => {
    it('should return true when CV exists', async () => {
      mockStudentCV.findOne.mockResolvedValue({ cvId: 1 } as any);

      const result = await repository.exists(100);

      expect(result).toBe(true);
    });

    it('should return false when CV does not exist', async () => {
      mockStudentCV.findOne.mockResolvedValue(null);

      const result = await repository.exists(999);

      expect(result).toBe(false);
    });
  });
});
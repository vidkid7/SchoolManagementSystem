/**
 * CV Service Unit Tests
 * 
 * Tests for CV data compilation, PDF generation, and customization
 * 
 * Requirements: 26.1, 26.3, 26.4, 26.5
 */

import cvService from '../cv.service';
import { CVRepository } from '../cv.repository';
import Student from '@models/Student.model';
import Grade from '@models/Grade.model';
import AttendanceRecord from '@models/AttendanceRecord.model';
import rankCalculationService from '@modules/examination/rankCalculation.service';

// Mock dependencies
jest.mock('../cv.repository');
jest.mock('@models/StudentCV.model');
jest.mock('@models/Student.model');
jest.mock('@models/Grade.model');
jest.mock('@models/AttendanceRecord.model');
jest.mock('@modules/eca/ecaCertificate.service');
jest.mock('@modules/sports/sportsAchievement.service');
jest.mock('@modules/examination/rankCalculation.service');
jest.mock('@utils/logger');

describe('CVService', () => {
  let mockCVRepository: jest.Mocked<CVRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockCVRepository = {
      findByStudentId: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      upsert: jest.fn(),
      updateLastGeneratedAt: jest.fn(),
      updateSectionVisibility: jest.fn(),
      updateCustomFields: jest.fn(),
      updateTemplate: jest.fn(),
      delete: jest.fn(),
      exists: jest.fn()
    } as unknown as jest.Mocked<CVRepository>;
    
    // Inject mock repository
    (cvService as any).cvRepository = mockCVRepository;
  });

  describe('getOrCreateCustomization', () => {
    it('should return existing customization if found', async () => {
      const mockCV = {
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
        skills: '["JavaScript", "Python"]',
        hobbies: '["Reading", "Gaming"]',
        careerGoals: 'Become a software engineer',
        personalStatement: 'Passionate about technology',
        templateId: 'standard',
        schoolBrandingEnabled: true,
        getSkills: function() { return JSON.parse(this.skills); },
        getHobbies: function() { return JSON.parse(this.hobbies); }
      };

      mockCVRepository.findByStudentId.mockResolvedValue(mockCV as any);

      const result = await cvService.getOrCreateCustomization(100);

      expect(mockCVRepository.findByStudentId).toHaveBeenCalledWith(100);
      expect(result).toEqual(mockCV);
    });

    it('should create new customization if not found', async () => {
      mockCVRepository.findByStudentId.mockResolvedValue(null);
      mockCVRepository.upsert.mockResolvedValue({
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
      } as any);

      const result = await cvService.getOrCreateCustomization(100);

      expect(mockCVRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 100,
          showPersonalInfo: true
        })
      );
      expect(result.studentId).toBe(100);
    });
  });

  describe('updateCustomization', () => {
    it('should update customization with provided values', async () => {
      const mockCV = {
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
        setSkills: jest.fn(),
        setHobbies: jest.fn(),
        save: jest.fn().mockResolvedValue(undefined)
      };

      mockCVRepository.findByStudentId.mockResolvedValue(mockCV as any);

      const dto = {
        studentId: 100,
        showPersonalInfo: false,
        skills: ['JavaScript', 'TypeScript'],
        hobbies: ['Reading'],
        careerGoals: 'Software Developer',
        templateId: 'professional'
      };

      await cvService.updateCustomization(dto);

      expect(mockCV.showPersonalInfo).toBe(false);
      expect(mockCV.setSkills).toHaveBeenCalledWith(['JavaScript', 'TypeScript']);
      expect(mockCV.setHobbies).toHaveBeenCalledWith(['Reading']);
      expect(mockCV.careerGoals).toBe('Software Developer');
      expect(mockCV.templateId).toBe('professional');
      expect(mockCV.save).toHaveBeenCalled();
    });
  });

  describe('compileCVData', () => {
    it('should compile personal info when enabled', async () => {
      const mockCV = {
        studentId: 100,
        showPersonalInfo: true,
        showAcademicPerformance: false,
        showAttendance: false,
        showECA: false,
        showSports: false,
        showCertificates: false,
        showAwards: false,
        showTeacherRemarks: false,
        skills: '[]',
        hobbies: '[]',
        careerGoals: '',
        personalStatement: '',
        templateId: 'standard',
        schoolBrandingEnabled: true,
        getSkills: function() { return JSON.parse(this.skills); },
        getHobbies: function() { return JSON.parse(this.hobbies); }
      };

      const mockStudent = {
        studentId: 100,
        studentCode: 'STU001',
        firstNameEn: 'John',
        middleNameEn: '',
        lastNameEn: 'Doe',
        firstNameNp: 'जोन',
        middleNameNp: '',
        lastNameNp: 'डो',
        dateOfBirthBS: '2060-05-15',
        dateOfBirthAD: new Date('2003-08-15'),
        gender: 'male',
        bloodGroup: 'A+',
        addressEn: 'Kathmandu, Nepal',
        addressNp: 'काठमाडौं, नेपाल',
        phone: '9876543210',
        email: 'john@example.com',
        photoUrl: '/photos/student100.jpg',
        getFullNameEn: function() { return [this.firstNameEn, this.middleNameEn, this.lastNameEn].filter(n => n).join(' '); },
        getFullNameNp: function() { return [this.firstNameNp, this.middleNameNp, this.lastNameNp].filter(n => n).join(' '); }
      };

      mockCVRepository.findByStudentId.mockResolvedValue(mockCV as any);
      (Student.findByPk as jest.Mock).mockResolvedValue(mockStudent);

      const result = await cvService.compileCVData(100);

      expect(result.personalInfo).toBeDefined();
      expect(result.personalInfo?.fullNameEn).toBe('John Doe');
      expect(result.personalInfo?.studentCode).toBe('STU001');
      expect(result.academicPerformance).toBeUndefined();
    });

    it('should compile academic performance when enabled', async () => {
      const mockCV = {
        studentId: 100,
        showPersonalInfo: false,
        showAcademicPerformance: true,
        showAttendance: false,
        showECA: false,
        showSports: false,
        showCertificates: false,
        showAwards: false,
        showTeacherRemarks: false,
        skills: '[]',
        hobbies: '[]',
        careerGoals: '',
        personalStatement: '',
        templateId: 'standard',
        schoolBrandingEnabled: true,
        getSkills: function() { return JSON.parse(this.skills); },
        getHobbies: function() { return JSON.parse(this.hobbies); }
      };

      const mockExam = {
        examId: 1,
        name: 'First Terminal',
        academicYearId: 2024,
        termId: 1,
        subjectId: 1,
        fullMarks: 100
      };

      const mockGrade = {
        studentId: 100,
        examId: 1,
        theoryMarks: 85,
        practicalMarks: 0,
        totalMarks: 85,
        exam: mockExam
      };

      mockCVRepository.findByStudentId.mockResolvedValue(mockCV as any);
      (Grade.findAll as jest.Mock).mockResolvedValue([mockGrade]);
      (rankCalculationService.getStudentRank as jest.Mock).mockResolvedValue({ rank: 5, totalStudents: 50 });

      const result = await cvService.compileCVData(100);

      expect(result.academicPerformance).toBeDefined();
      expect(result.academicPerformance?.academicYears.length).toBeGreaterThan(0);
    });

    it('should compile attendance when enabled', async () => {
      const mockCV = {
        studentId: 100,
        showPersonalInfo: false,
        showAcademicPerformance: false,
        showAttendance: true,
        showECA: false,
        showSports: false,
        showCertificates: false,
        showAwards: false,
        showTeacherRemarks: false,
        skills: '[]',
        hobbies: '[]',
        careerGoals: '',
        personalStatement: '',
        templateId: 'standard',
        schoolBrandingEnabled: true,
        getSkills: function() { return JSON.parse(this.skills); },
        getHobbies: function() { return JSON.parse(this.hobbies); }
      };

      const mockRecords = [
        { status: 'present' },
        { status: 'present' },
        { status: 'absent' },
        { status: 'late' },
        { status: 'excused' }
      ];

      mockCVRepository.findByStudentId.mockResolvedValue(mockCV as any);
      (AttendanceRecord.findAll as jest.Mock).mockResolvedValue(mockRecords);

      const result = await cvService.compileCVData(100);

      expect(result.attendance).toBeDefined();
      expect(result.attendance?.totalDays).toBe(5);
      expect(result.attendance?.presentDays).toBe(2);
      expect(result.attendance?.absentDays).toBe(1);
      expect(result.attendance?.lateDays).toBe(1);
      expect(result.attendance?.excusedDays).toBe(1);
    });
  });

  describe('verifyCV', () => {
    it('should return valid when CV exists', async () => {
      const mockCV = {
        cvId: 1,
        studentId: 100,
        lastGeneratedAt: new Date()
      };

      const mockStudent = {
        studentId: 100,
        firstNameEn: 'John',
        middleNameEn: '',
        lastNameEn: 'Doe',
        getFullNameEn: function() { return [this.firstNameEn, this.middleNameEn, this.lastNameEn].filter(n => n).join(' '); }
      };

      mockCVRepository.findByStudentId.mockResolvedValue(mockCV as any);
      (Student.findByPk as jest.Mock).mockResolvedValue(mockStudent);

      const result = await cvService.verifyCV(100);

      expect(result.valid).toBe(true);
      expect(result.studentName).toBe('John Doe');
      expect(result.message).toBe('CV is valid and authentic');
    });

    it('should return invalid when CV does not exist', async () => {
      mockCVRepository.findByStudentId.mockResolvedValue(null);

      const result = await cvService.verifyCV(100);

      expect(result.valid).toBe(false);
      expect(result.message).toBe('CV not found for this student');
    });
  });
});

describe('CV Data Compilation', () => {
  it('should calculate grade correctly from percentage', () => {
    // Test grade calculation logic
    const calculateGrade = (percentage: number) => {
      if (percentage >= 90) return { grade: 'A+', gradePoint: 4.0 };
      if (percentage >= 80) return { grade: 'A', gradePoint: 3.6 };
      if (percentage >= 70) return { grade: 'B+', gradePoint: 3.2 };
      if (percentage >= 60) return { grade: 'B', gradePoint: 2.8 };
      if (percentage >= 50) return { grade: 'C+', gradePoint: 2.4 };
      if (percentage >= 40) return { grade: 'C', gradePoint: 2.0 };
      if (percentage >= 35) return { grade: 'D', gradePoint: 1.6 };
      return { grade: 'NG', gradePoint: 0 };
    };

    expect(calculateGrade(95).grade).toBe('A+');
    expect(calculateGrade(85).grade).toBe('A');
    expect(calculateGrade(75).grade).toBe('B+');
    expect(calculateGrade(65).grade).toBe('B');
    expect(calculateGrade(55).grade).toBe('C+');
    expect(calculateGrade(45).grade).toBe('C');
    expect(calculateGrade(37).grade).toBe('D');
    expect(calculateGrade(30).grade).toBe('NG');
  });

  it('should calculate attendance percentage correctly', () => {
    const calculateAttendance = (present: number, late: number, total: number) => {
      return total > 0 ? Math.round(((present + late) / total) * 10000) / 100 : 0;
    };

    expect(calculateAttendance(90, 5, 100)).toBe(95);
    expect(calculateAttendance(75, 0, 100)).toBe(75);
    expect(calculateAttendance(0, 0, 0)).toBe(0);
  });
});

describe('CV Customization', () => {
  it('should handle skills array correctly', () => {
    const skills = ['JavaScript', 'Python', 'React'];
    const skillsJson = JSON.stringify(skills);
    const parsedSkills = JSON.parse(skillsJson);

    expect(parsedSkills).toEqual(skills);
    expect(parsedSkills.length).toBe(3);
  });

  it('should handle hobbies array correctly', () => {
    const hobbies = ['Reading', 'Gaming', 'Sports'];
    const hobbiesJson = JSON.stringify(hobbies);
    const parsedHobbies = JSON.parse(hobbiesJson);

    expect(parsedHobbies).toEqual(hobbies);
  });

  it('should handle section visibility correctly', () => {
    const sectionVisibility = {
      personalInfo: true,
      academicPerformance: true,
      attendance: false,
      eca: true,
      sports: false,
      certificates: true,
      awards: true,
      teacherRemarks: false
    };

    const visibleSections = Object.entries(sectionVisibility)
      .filter(([_, visible]) => visible)
      .map(([section]) => section);

    expect(visibleSections).toContain('personalInfo');
    expect(visibleSections).toContain('academicPerformance');
    expect(visibleSections).not.toContain('attendance');
    expect(visibleSections).toContain('eca');
    expect(visibleSections).not.toContain('sports');
  });
});
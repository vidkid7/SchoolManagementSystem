import qualificationValidationService from '../qualificationValidation.service';
import Staff, { StaffCategory, StaffStatus, EmploymentType } from '@models/Staff.model';
import { Subject, SubjectType } from '@models/Subject.model';
import Class, { Shift } from '@models/Class.model';
import { AcademicYear } from '@models/AcademicYear.model';
import sequelize from '@config/database';

/**
 * Qualification Validation Service Tests
 * Tests for teacher qualification validation before assignment
 * Requirements: 4.4
 */

describe('Qualification Validation Service', () => {
  let academicYear: AcademicYear;
  let qualifiedTeacher: Staff;
  let underqualifiedTeacher: Staff;
  let nonTeachingStaff: Staff;
  let inactiveTeacher: Staff;
  let mathSubject: Subject;
  let englishSubject: Subject;
  let class10: Class;
  let class12: Class;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    // Create academic year
    academicYear = await AcademicYear.create({
      name: '2081-2082 BS',
      startDateBS: '2081-01-01',
      endDateBS: '2081-12-30',
      startDateAD: new Date('2024-04-13'),
      endDateAD: new Date('2025-04-12'),
      isCurrent: true
    });

    // Create qualified teacher with Master's degree
    qualifiedTeacher = await Staff.create({
      staffCode: 'SCH-STAFF-2024-0001',
      firstNameEn: 'John',
      lastNameEn: 'Doe',
      category: StaffCategory.TEACHING,
      employmentType: EmploymentType.FULL_TIME,
      joinDate: new Date('2024-01-01'),
      status: StaffStatus.ACTIVE,
      highestQualification: 'Master of Science in Mathematics',
      specialization: 'Mathematics',
      teachingLicense: 'TL-12345'
    });

    // Create underqualified teacher (only diploma)
    underqualifiedTeacher = await Staff.create({
      staffCode: 'SCH-STAFF-2024-0002',
      firstNameEn: 'Jane',
      lastNameEn: 'Smith',
      category: StaffCategory.TEACHING,
      employmentType: EmploymentType.FULL_TIME,
      joinDate: new Date('2024-01-01'),
      status: StaffStatus.ACTIVE,
      highestQualification: 'Diploma in Education',
      specialization: 'General Education',
      teachingLicense: 'TL-67890'
    });

    // Create non-teaching staff
    nonTeachingStaff = await Staff.create({
      staffCode: 'SCH-STAFF-2024-0003',
      firstNameEn: 'Bob',
      lastNameEn: 'Johnson',
      category: StaffCategory.NON_TEACHING,
      employmentType: EmploymentType.FULL_TIME,
      joinDate: new Date('2024-01-01'),
      status: StaffStatus.ACTIVE
    });

    // Create inactive teacher
    inactiveTeacher = await Staff.create({
      staffCode: 'SCH-STAFF-2024-0004',
      firstNameEn: 'Alice',
      lastNameEn: 'Brown',
      category: StaffCategory.TEACHING,
      employmentType: EmploymentType.FULL_TIME,
      joinDate: new Date('2024-01-01'),
      status: StaffStatus.INACTIVE,
      highestQualification: 'Bachelor of Education',
      teachingLicense: 'TL-11111'
    });

    // Create subjects
    mathSubject = await Subject.create({
      code: 'MATH-10',
      nameEn: 'Mathematics',
      nameNp: 'गणित',
      type: SubjectType.COMPULSORY,
      creditHours: 100,
      theoryMarks: 75,
      practicalMarks: 25,
      passMarks: 35,
      fullMarks: 100
    });

    englishSubject = await Subject.create({
      code: 'ENG-10',
      nameEn: 'English',
      nameNp: 'अंग्रेजी',
      type: SubjectType.COMPULSORY,
      creditHours: 100,
      theoryMarks: 75,
      practicalMarks: 25,
      passMarks: 35,
      fullMarks: 100
    });

    // Create classes
    class10 = await Class.create({
      academicYearId: academicYear.academicYearId,
      gradeLevel: 10,
      section: 'A',
      shift: Shift.MORNING,
      capacity: 40,
      currentStrength: 0
    });

    class12 = await Class.create({
      academicYearId: academicYear.academicYearId,
      gradeLevel: 12,
      section: 'A',
      shift: Shift.MORNING,
      capacity: 40,
      currentStrength: 0
    });
  });

  afterEach(async () => {
    await Subject.destroy({ where: {}, force: true });
    await Class.destroy({ where: {}, force: true });
    await Staff.destroy({ where: {}, force: true });
    await AcademicYear.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Subject Assignment Validation', () => {
    it('should validate qualified teacher for subject', async () => {
      const result = await qualificationValidationService.validateSubjectAssignment(
        qualifiedTeacher.staffId,
        mathSubject.subjectId,
        class10.classId
      );

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject non-teaching staff', async () => {
      const result = await qualificationValidationService.validateSubjectAssignment(
        nonTeachingStaff.staffId,
        mathSubject.subjectId,
        class10.classId
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('not in teaching category'))).toBe(true);
    });

    it('should reject inactive staff', async () => {
      const result = await qualificationValidationService.validateSubjectAssignment(
        inactiveTeacher.staffId,
        mathSubject.subjectId,
        class10.classId
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('not active'))).toBe(true);
    });

    it('should warn about specialization mismatch', async () => {
      // Math teacher assigned to English
      const result = await qualificationValidationService.validateSubjectAssignment(
        qualifiedTeacher.staffId,
        englishSubject.subjectId,
        class10.classId
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('may not match'))).toBe(true);
    });

    it('should warn about insufficient qualifications for grade level', async () => {
      // Diploma holder assigned to Class 12
      const result = await qualificationValidationService.validateSubjectAssignment(
        underqualifiedTeacher.staffId,
        mathSubject.subjectId,
        class12.classId
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('insufficient'))).toBe(true);
    });

    it('should warn about missing teaching license', async () => {
      // Create teacher without license
      const noLicenseTeacher = await Staff.create({
        staffCode: 'SCH-STAFF-2024-0005',
        firstNameEn: 'Charlie',
        lastNameEn: 'Davis',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE,
        highestQualification: 'Bachelor of Science'
      });

      const result = await qualificationValidationService.validateSubjectAssignment(
        noLicenseTeacher.staffId,
        mathSubject.subjectId,
        class10.classId
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('teaching license'))).toBe(true);
    });

    it('should return error for non-existent staff', async () => {
      const result = await qualificationValidationService.validateSubjectAssignment(
        99999,
        mathSubject.subjectId,
        class10.classId
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('not found'))).toBe(true);
    });

    it('should return error for non-existent subject', async () => {
      const result = await qualificationValidationService.validateSubjectAssignment(
        qualifiedTeacher.staffId,
        99999,
        class10.classId
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('not found'))).toBe(true);
    });
  });

  describe('Class Teacher Assignment Validation', () => {
    it('should validate qualified teacher for class teacher role', async () => {
      const result = await qualificationValidationService.validateClassTeacherAssignment(
        qualifiedTeacher.staffId,
        class10.classId
      );

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should reject non-teaching staff for class teacher', async () => {
      const result = await qualificationValidationService.validateClassTeacherAssignment(
        nonTeachingStaff.staffId,
        class10.classId
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('not in teaching category'))).toBe(true);
    });

    it('should warn about insufficient qualifications for higher grades', async () => {
      const result = await qualificationValidationService.validateClassTeacherAssignment(
        underqualifiedTeacher.staffId,
        class12.classId
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings.some(w => w.includes('insufficient'))).toBe(true);
    });
  });

  describe('Multiple Assignments Validation', () => {
    it('should validate multiple assignments for a teacher', async () => {
      const assignments = [
        {
          subjectId: mathSubject.subjectId,
          classId: class10.classId,
          assignmentType: 'subject_teacher'
        },
        {
          subjectId: englishSubject.subjectId,
          classId: class10.classId,
          assignmentType: 'subject_teacher'
        }
      ];

      const result = await qualificationValidationService.validateMultipleAssignments(
        qualifiedTeacher.staffId,
        assignments
      );

      expect(result.isValid).toBe(true);
    });

    it('should warn about excessive workload', async () => {
      // Create 7 assignments (excessive)
      const assignments = Array(7).fill(null).map(() => ({
        subjectId: mathSubject.subjectId,
        classId: class10.classId,
        assignmentType: 'subject_teacher'
      }));

      const result = await qualificationValidationService.validateMultipleAssignments(
        qualifiedTeacher.staffId,
        assignments
      );

      expect(result.warnings.some(w => w.includes('excessive'))).toBe(true);
    });
  });

  describe('Specialization Matching', () => {
    it('should match mathematics specialization to math subject', async () => {
      const result = await qualificationValidationService.validateSubjectAssignment(
        qualifiedTeacher.staffId,
        mathSubject.subjectId
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBe(0);
    });

    it('should match related specializations', async () => {
      // Create physics teacher
      const physicsTeacher = await Staff.create({
        staffCode: 'SCH-STAFF-2024-0006',
        firstNameEn: 'David',
        lastNameEn: 'Wilson',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE,
        highestQualification: 'Master of Science in Physics',
        specialization: 'Physics',
        teachingLicense: 'TL-22222'
      });

      // Create science subject
      const scienceSubject = await Subject.create({
        code: 'SCI-10',
        nameEn: 'Science',
        nameNp: 'विज्ञान',
        type: SubjectType.COMPULSORY,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100
      });

      const result = await qualificationValidationService.validateSubjectAssignment(
        physicsTeacher.staffId,
        scienceSubject.subjectId
      );

      expect(result.isValid).toBe(true);
    });
  });
});

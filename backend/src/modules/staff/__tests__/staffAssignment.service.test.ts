import staffService from '../staff.service';
import qualificationValidationService from '../qualificationValidation.service';
import Staff, { StaffCategory, StaffStatus, EmploymentType } from '@models/Staff.model';
import StaffAssignment, { AssignmentType } from '@models/StaffAssignment.model';
import { Subject, SubjectType } from '@models/Subject.model';
import Class, { Shift } from '@models/Class.model';
import { AcademicYear } from '@models/AcademicYear.model';
import sequelize from '@config/database';

/**
 * Staff Assignment Service Tests
 * Tests for staff assignment functionality with qualification validation
 * Requirements: 4.3, 4.4, 4.9
 */

describe('Staff Assignment Service', () => {
  let academicYear: AcademicYear;
  let teachingStaff: Staff;
  let nonTeachingStaff: Staff;
  let testClass: Class;
  let testSubject: Subject;

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

    // Create teaching staff with qualifications
    teachingStaff = await Staff.create({
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

    // Create non-teaching staff
    nonTeachingStaff = await Staff.create({
      staffCode: 'SCH-STAFF-2024-0002',
      firstNameEn: 'Jane',
      lastNameEn: 'Smith',
      category: StaffCategory.NON_TEACHING,
      employmentType: EmploymentType.FULL_TIME,
      joinDate: new Date('2024-01-01'),
      status: StaffStatus.ACTIVE
    });

    // Create class
    testClass = await Class.create({
      academicYearId: academicYear.academicYearId,
      gradeLevel: 10,
      section: 'A',
      shift: Shift.MORNING,
      capacity: 40,
      currentStrength: 0
    });

    // Create subject
    testSubject = await Subject.create({
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
  });

  afterEach(async () => {
    await StaffAssignment.destroy({ where: {}, force: true });
    await Subject.destroy({ where: {}, force: true });
    await Class.destroy({ where: {}, force: true });
    await Staff.destroy({ where: {}, force: true });
    await AcademicYear.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Subject Teacher Assignment', () => {
    it('should assign qualified teacher to subject', async () => {
      const result = await staffService.assign({
        staffId: teachingStaff.staffId,
        academicYearId: academicYear.academicYearId,
        assignmentType: AssignmentType.SUBJECT_TEACHER,
        classId: testClass.classId,
        subjectId: testSubject.subjectId,
        startDate: new Date('2024-04-13')
      });

      expect(result.assignment).toBeDefined();
      expect(result.assignment.staffId).toBe(teachingStaff.staffId);
      expect(result.assignment.subjectId).toBe(testSubject.subjectId);
      expect(result.assignment.classId).toBe(testClass.classId);
      expect(result.assignment.isActive).toBe(true);
      expect(result.validation.isValid).toBe(true);
    });

    it('should reject non-teaching staff for subject assignment', async () => {
      await expect(
        staffService.assign({
          staffId: nonTeachingStaff.staffId,
          academicYearId: academicYear.academicYearId,
          assignmentType: AssignmentType.SUBJECT_TEACHER,
          classId: testClass.classId,
          subjectId: testSubject.subjectId,
          startDate: new Date('2024-04-13')
        })
      ).rejects.toThrow('Qualification validation failed');
    });

    it('should track assignment history', async () => {
      // Create first assignment
      await staffService.assign({
        staffId: teachingStaff.staffId,
        academicYearId: academicYear.academicYearId,
        assignmentType: AssignmentType.SUBJECT_TEACHER,
        classId: testClass.classId,
        subjectId: testSubject.subjectId,
        startDate: new Date('2024-04-13')
      });

      // Create second assignment (should deactivate first)
      await staffService.assign({
        staffId: teachingStaff.staffId,
        academicYearId: academicYear.academicYearId,
        assignmentType: AssignmentType.SUBJECT_TEACHER,
        classId: testClass.classId,
        subjectId: testSubject.subjectId,
        startDate: new Date('2024-05-01')
      });

      // Get all assignments including inactive
      const history = await staffService.getAssignments(teachingStaff.staffId, {
        includeInactive: true
      });

      expect(history.length).toBe(2);
      expect(history[0].isActive).toBe(true);
      expect(history[1].isActive).toBe(false);
      expect(history[1].endDate).toBeDefined();
    });

    it('should support multiple assignments per teacher', async () => {
      // Create second class and subject
      const class2 = await Class.create({
        academicYearId: academicYear.academicYearId,
        gradeLevel: 9,
        section: 'B',
        shift: Shift.MORNING,
        capacity: 40,
        currentStrength: 0
      });

      const subject2 = await Subject.create({
        code: 'SCI-09',
        nameEn: 'Science',
        nameNp: 'विज्ञान',
        type: SubjectType.COMPULSORY,
        creditHours: 100,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100
      });

      // Assign to first subject
      await staffService.assign({
        staffId: teachingStaff.staffId,
        academicYearId: academicYear.academicYearId,
        assignmentType: AssignmentType.SUBJECT_TEACHER,
        classId: testClass.classId,
        subjectId: testSubject.subjectId,
        startDate: new Date('2024-04-13')
      });

      // Assign to second subject
      await staffService.assign({
        staffId: teachingStaff.staffId,
        academicYearId: academicYear.academicYearId,
        assignmentType: AssignmentType.SUBJECT_TEACHER,
        classId: class2.classId,
        subjectId: subject2.subjectId,
        startDate: new Date('2024-04-13')
      });

      const activeAssignments = await staffService.getActiveAssignments(
        teachingStaff.staffId,
        academicYear.academicYearId
      );

      expect(activeAssignments.length).toBe(2);
    });
  });

  describe('Class Teacher Assignment', () => {
    it('should assign qualified teacher as class teacher', async () => {
      const result = await staffService.assign({
        staffId: teachingStaff.staffId,
        academicYearId: academicYear.academicYearId,
        assignmentType: AssignmentType.CLASS_TEACHER,
        classId: testClass.classId,
        startDate: new Date('2024-04-13')
      });

      expect(result.assignment).toBeDefined();
      expect(result.assignment.assignmentType).toBe(AssignmentType.CLASS_TEACHER);
      expect(result.validation.isValid).toBe(true);
    });

    it('should replace previous class teacher', async () => {
      // Create second teacher
      const teacher2 = await Staff.create({
        staffCode: 'SCH-STAFF-2024-0003',
        firstNameEn: 'Bob',
        lastNameEn: 'Johnson',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE,
        highestQualification: 'Bachelor of Education',
        teachingLicense: 'TL-67890'
      });

      // Assign first teacher
      await staffService.assign({
        staffId: teachingStaff.staffId,
        academicYearId: academicYear.academicYearId,
        assignmentType: AssignmentType.CLASS_TEACHER,
        classId: testClass.classId,
        startDate: new Date('2024-04-13')
      });

      // Assign second teacher (should deactivate first)
      await staffService.assign({
        staffId: teacher2.staffId,
        academicYearId: academicYear.academicYearId,
        assignmentType: AssignmentType.CLASS_TEACHER,
        classId: testClass.classId,
        startDate: new Date('2024-05-01')
      });

      const classTeacher = await staffService.getClassTeacher(
        testClass.classId,
        academicYear.academicYearId
      );

      expect(classTeacher?.staffId).toBe(teacher2.staffId);
    });
  });

  describe('Qualification Validation', () => {
    it('should validate teacher qualifications for subject', async () => {
      const result = await qualificationValidationService.validateSubjectAssignment(
        teachingStaff.staffId,
        testSubject.subjectId,
        testClass.classId
      );

      expect(result.isValid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    it('should warn about missing teaching license', async () => {
      // Create staff without teaching license
      const staffNoLicense = await Staff.create({
        staffCode: 'SCH-STAFF-2024-0004',
        firstNameEn: 'Alice',
        lastNameEn: 'Brown',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE,
        highestQualification: 'Bachelor of Science'
      });

      const result = await qualificationValidationService.validateSubjectAssignment(
        staffNoLicense.staffId,
        testSubject.subjectId,
        testClass.classId
      );

      expect(result.isValid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some(w => w.includes('teaching license'))).toBe(true);
    });

    it('should reject inactive staff', async () => {
      // Update staff to inactive
      await teachingStaff.update({ status: StaffStatus.INACTIVE });

      const result = await qualificationValidationService.validateSubjectAssignment(
        teachingStaff.staffId,
        testSubject.subjectId,
        testClass.classId
      );

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('not active'))).toBe(true);
    });
  });

  describe('Assignment History', () => {
    it('should retrieve assignment history for a class', async () => {
      await staffService.assign({
        staffId: teachingStaff.staffId,
        academicYearId: academicYear.academicYearId,
        assignmentType: AssignmentType.CLASS_TEACHER,
        classId: testClass.classId,
        startDate: new Date('2024-04-13')
      });

      const history = await staffService.getAssignmentHistory({
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId
      });

      expect(history.length).toBeGreaterThan(0);
      expect(history[0].classId).toBe(testClass.classId);
    });

    it('should retrieve assignment history for a subject', async () => {
      await staffService.assign({
        staffId: teachingStaff.staffId,
        academicYearId: academicYear.academicYearId,
        assignmentType: AssignmentType.SUBJECT_TEACHER,
        classId: testClass.classId,
        subjectId: testSubject.subjectId,
        startDate: new Date('2024-04-13')
      });

      const history = await staffService.getAssignmentHistory({
        subjectId: testSubject.subjectId,
        academicYearId: academicYear.academicYearId
      });

      expect(history.length).toBeGreaterThan(0);
      expect(history[0].subjectId).toBe(testSubject.subjectId);
    });
  });
});

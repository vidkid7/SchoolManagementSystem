import timetableService from '../timetable.service';
import { Timetable, Period } from '@models/Timetable.model';
import { Subject } from '@models/Subject.model';
import Staff, { StaffStatus, EmploymentType, StaffCategory } from '@models/Staff.model';
import Class from '@models/Class.model';
import { AcademicYear } from '@models/AcademicYear.model';
import sequelize from '@config/database';

// Extend Timetable type to include periods
interface TimetableWithPeriods extends Timetable {
  periods?: Period[];
}

describe('TimetableService', () => {
  let academicYear: AcademicYear;
  let testClass: Class;
  let subject1: Subject;
  let subject2: Subject;
  let teacher1: Staff;
  let teacher2: Staff;

  beforeAll(async () => {
    // Don't use sync({ force: true }) as it tries to drop tables with foreign keys
    // Instead, just ensure the database connection is established
    await sequelize.authenticate();

    // Create test academic year
    academicYear = await AcademicYear.create({
      name: '2081-2082 BS',
      startDateBS: '2081-01-01',
      endDateBS: '2081-12-30',
      startDateAD: new Date('2024-04-13'),
      endDateAD: new Date('2025-04-12'),
      isCurrent: true
    });

    // Create test class
    testClass = await Class.create({
      academicYearId: academicYear.academicYearId,
      gradeLevel: 10,
      section: 'A',
      shift: 'morning',
      capacity: 40,
      currentStrength: 0
    });

    // Create test subjects
    subject1 = await Subject.create({
      code: 'MATH101',
      nameEn: 'Mathematics',
      nameNp: 'गणित',
      type: 'compulsory',
      creditHours: 100,
      theoryMarks: 75,
      practicalMarks: 25,
      passMarks: 35,
      fullMarks: 100,
      applicableClasses: [10]
    });

    subject2 = await Subject.create({
      code: 'ENG101',
      nameEn: 'English',
      nameNp: 'अंग्रेजी',
      type: 'compulsory',
      creditHours: 100,
      theoryMarks: 75,
      practicalMarks: 25,
      passMarks: 35,
      fullMarks: 100,
      applicableClasses: [10]
    });

    // Create test teachers
    teacher1 = await Staff.create({
      staffCode: 'STAFF-2024-001',
      firstNameEn: 'John',
      lastNameEn: 'Doe',
      category: StaffCategory.TEACHING,
      employmentType: EmploymentType.FULL_TIME,
      joinDate: new Date('2020-01-01'),
      status: StaffStatus.ACTIVE
    });

    teacher2 = await Staff.create({
      staffCode: 'STAFF-2024-002',
      firstNameEn: 'Jane',
      lastNameEn: 'Smith',
      category: StaffCategory.TEACHING,
      employmentType: EmploymentType.FULL_TIME,
      joinDate: new Date('2020-01-01'),
      status: StaffStatus.ACTIVE
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  afterEach(async () => {
    // Clean up timetables and periods after each test
    await Period.destroy({ where: {}, force: true });
    await Timetable.destroy({ where: {}, force: true });
  });

  describe('createTimetable', () => {
    it('should create a timetable for a class and day', async () => {
      const timetable = await timetableService.createTimetable({
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId,
        dayOfWeek: 1 // Monday
      });

      expect(timetable).toBeDefined();
      expect(timetable.classId).toBe(testClass.classId);
      expect(timetable.academicYearId).toBe(academicYear.academicYearId);
      expect(timetable.dayOfWeek).toBe(1);
    });

    it('should throw error for invalid day of week', async () => {
      await expect(
        timetableService.createTimetable({
          classId: testClass.classId,
          academicYearId: academicYear.academicYearId,
          dayOfWeek: 7 // Invalid
        })
      ).rejects.toThrow('Day of week must be between 0 (Sunday) and 6 (Saturday)');
    });

    it('should throw error if timetable already exists', async () => {
      await timetableService.createTimetable({
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId,
        dayOfWeek: 1
      });

      await expect(
        timetableService.createTimetable({
          classId: testClass.classId,
          academicYearId: academicYear.academicYearId,
          dayOfWeek: 1
        })
      ).rejects.toThrow('Timetable already exists');
    });
  });

  describe('addPeriod', () => {
    let timetable: Timetable;

    beforeEach(async () => {
      timetable = await timetableService.createTimetable({
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId,
        dayOfWeek: 1
      });
    });

    it('should add a period to a timetable', async () => {
      const period = await timetableService.addPeriod(timetable.timetableId, {
        periodNumber: 1,
        startTime: '09:00',
        endTime: '09:45',
        subjectId: subject1.subjectId,
        teacherId: teacher1.staffId,
        roomNumber: 'Room 101'
      });

      expect(period).toBeDefined();
      expect(period.periodNumber).toBe(1);
      expect(period.startTime).toBe('09:00');
      expect(period.endTime).toBe('09:45');
      expect(period.subjectId).toBe(subject1.subjectId);
      expect(period.teacherId).toBe(teacher1.staffId);
      expect(period.roomNumber).toBe('Room 101');
    });

    it('should throw error for invalid time format', async () => {
      await expect(
        timetableService.addPeriod(timetable.timetableId, {
          periodNumber: 1,
          startTime: '9:00', // Invalid format
          endTime: '09:45',
          subjectId: subject1.subjectId
        })
      ).rejects.toThrow('Time must be in HH:mm format');
    });

    it('should throw error if start time is after end time', async () => {
      await expect(
        timetableService.addPeriod(timetable.timetableId, {
          periodNumber: 1,
          startTime: '10:00',
          endTime: '09:45',
          subjectId: subject1.subjectId
        })
      ).rejects.toThrow('Start time must be before end time');
    });

    it('should throw error if period number already exists', async () => {
      await timetableService.addPeriod(timetable.timetableId, {
        periodNumber: 1,
        startTime: '09:00',
        endTime: '09:45',
        subjectId: subject1.subjectId
      });

      await expect(
        timetableService.addPeriod(timetable.timetableId, {
          periodNumber: 1,
          startTime: '10:00',
          endTime: '10:45',
          subjectId: subject2.subjectId
        })
      ).rejects.toThrow('Period 1 already exists');
    });

    it('should detect teacher conflicts', async () => {
      // Add first period for teacher1
      await timetableService.addPeriod(timetable.timetableId, {
        periodNumber: 1,
        startTime: '09:00',
        endTime: '09:45',
        subjectId: subject1.subjectId,
        teacherId: teacher1.staffId
      });

      // Try to add overlapping period for same teacher
      await expect(
        timetableService.addPeriod(timetable.timetableId, {
          periodNumber: 2,
          startTime: '09:30',
          endTime: '10:15',
          subjectId: subject2.subjectId,
          teacherId: teacher1.staffId
        })
      ).rejects.toThrow('Teacher has a conflicting period');
    });

    it('should allow different teachers in overlapping times', async () => {
      await timetableService.addPeriod(timetable.timetableId, {
        periodNumber: 1,
        startTime: '09:00',
        endTime: '09:45',
        subjectId: subject1.subjectId,
        teacherId: teacher1.staffId
      });

      // Different teacher, same time - should succeed
      const period = await timetableService.addPeriod(timetable.timetableId, {
        periodNumber: 2,
        startTime: '09:00',
        endTime: '09:45',
        subjectId: subject2.subjectId,
        teacherId: teacher2.staffId
      });

      expect(period).toBeDefined();
      expect(period.teacherId).toBe(teacher2.staffId);
    });
  });

  describe('getClassTimetable', () => {
    it('should retrieve timetable with periods for a class', async () => {
      const timetable = await timetableService.createTimetable({
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId,
        dayOfWeek: 1
      });

      await timetableService.addPeriod(timetable.timetableId, {
        periodNumber: 1,
        startTime: '09:00',
        endTime: '09:45',
        subjectId: subject1.subjectId,
        teacherId: teacher1.staffId
      });

      await timetableService.addPeriod(timetable.timetableId, {
        periodNumber: 2,
        startTime: '10:00',
        endTime: '10:45',
        subjectId: subject2.subjectId,
        teacherId: teacher2.staffId
      });

      const timetables = await timetableService.getClassTimetable(testClass.classId) as TimetableWithPeriods[];

      expect(timetables).toHaveLength(1);
      expect(timetables[0].periods).toHaveLength(2);
      expect(timetables[0].periods![0].periodNumber).toBe(1);
      expect(timetables[0].periods![1].periodNumber).toBe(2);
    });

    it('should return empty array if no timetable exists', async () => {
      const timetables = await timetableService.getClassTimetable(testClass.classId);
      expect(timetables).toHaveLength(0);
    });
  });

  describe('getTeacherTimetable', () => {
    it('should retrieve all periods for a teacher', async () => {
      const timetable1 = await timetableService.createTimetable({
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId,
        dayOfWeek: 1
      });

      const timetable2 = await timetableService.createTimetable({
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId,
        dayOfWeek: 2
      });

      await timetableService.addPeriod(timetable1.timetableId, {
        periodNumber: 1,
        startTime: '09:00',
        endTime: '09:45',
        subjectId: subject1.subjectId,
        teacherId: teacher1.staffId
      });

      await timetableService.addPeriod(timetable2.timetableId, {
        periodNumber: 1,
        startTime: '09:00',
        endTime: '09:45',
        subjectId: subject1.subjectId,
        teacherId: teacher1.staffId
      });

      const periods = await timetableService.getTeacherTimetable(teacher1.staffId);

      expect(periods).toHaveLength(2);
      expect(periods[0].teacherId).toBe(teacher1.staffId);
      expect(periods[1].teacherId).toBe(teacher1.staffId);
    });
  });

  describe('updatePeriod', () => {
    let timetable: Timetable;
    let period: Period;

    beforeEach(async () => {
      timetable = await timetableService.createTimetable({
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId,
        dayOfWeek: 1
      });

      period = await timetableService.addPeriod(timetable.timetableId, {
        periodNumber: 1,
        startTime: '09:00',
        endTime: '09:45',
        subjectId: subject1.subjectId,
        teacherId: teacher1.staffId
      });
    });

    it('should update period details', async () => {
      const updated = await timetableService.updatePeriod(period.periodId, {
        startTime: '10:00',
        endTime: '10:45',
        roomNumber: 'Room 202'
      });

      expect(updated).toBeDefined();
      expect(updated!.startTime).toBe('10:00');
      expect(updated!.endTime).toBe('10:45');
      expect(updated!.roomNumber).toBe('Room 202');
    });

    it('should detect teacher conflicts when updating', async () => {
      // Add another period with teacher2
      await timetableService.addPeriod(timetable.timetableId, {
        periodNumber: 2,
        startTime: '10:00',
        endTime: '10:45',
        subjectId: subject2.subjectId,
        teacherId: teacher2.staffId
      });

      // Try to change period 1 to overlap with period 2 using same teacher
      await expect(
        timetableService.updatePeriod(period.periodId, {
          startTime: '10:00',
          endTime: '10:45',
          teacherId: teacher2.staffId
        })
      ).rejects.toThrow('Teacher has a conflicting period');
    });

    it('should return null for non-existent period', async () => {
      const updated = await timetableService.updatePeriod(99999, {
        startTime: '10:00'
      });

      expect(updated).toBeNull();
    });
  });

  describe('deletePeriod', () => {
    it('should delete a period', async () => {
      const timetable = await timetableService.createTimetable({
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId,
        dayOfWeek: 1
      });

      const period = await timetableService.addPeriod(timetable.timetableId, {
        periodNumber: 1,
        startTime: '09:00',
        endTime: '09:45',
        subjectId: subject1.subjectId
      });

      const deleted = await timetableService.deletePeriod(period.periodId);
      expect(deleted).toBe(true);

      const found = await Period.findByPk(period.periodId);
      expect(found).toBeNull();
    });

    it('should return false for non-existent period', async () => {
      const deleted = await timetableService.deletePeriod(99999);
      expect(deleted).toBe(false);
    });
  });

  describe('checkTeacherConflict', () => {
    let timetable: Timetable;

    beforeEach(async () => {
      timetable = await timetableService.createTimetable({
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId,
        dayOfWeek: 1
      });

      await timetableService.addPeriod(timetable.timetableId, {
        periodNumber: 1,
        startTime: '09:00',
        endTime: '09:45',
        subjectId: subject1.subjectId,
        teacherId: teacher1.staffId
      });
    });

    it('should detect exact time overlap', async () => {
      const hasConflict = await timetableService.checkTeacherConflict(
        teacher1.staffId,
        1,
        academicYear.academicYearId,
        '09:00',
        '09:45'
      );

      expect(hasConflict).toBe(true);
    });

    it('should detect partial time overlap', async () => {
      const hasConflict = await timetableService.checkTeacherConflict(
        teacher1.staffId,
        1,
        academicYear.academicYearId,
        '09:30',
        '10:15'
      );

      expect(hasConflict).toBe(true);
    });

    it('should not detect conflict for non-overlapping times', async () => {
      const hasConflict = await timetableService.checkTeacherConflict(
        teacher1.staffId,
        1,
        academicYear.academicYearId,
        '10:00',
        '10:45'
      );

      expect(hasConflict).toBe(false);
    });

    it('should not detect conflict for different day', async () => {
      const hasConflict = await timetableService.checkTeacherConflict(
        teacher1.staffId,
        2, // Tuesday
        academicYear.academicYearId,
        '09:00',
        '09:45'
      );

      expect(hasConflict).toBe(false);
    });

    it('should not detect conflict for different teacher', async () => {
      const hasConflict = await timetableService.checkTeacherConflict(
        teacher2.staffId,
        1,
        academicYear.academicYearId,
        '09:00',
        '09:45'
      );

      expect(hasConflict).toBe(false);
    });
  });

  describe('bulkCreatePeriods', () => {
    let timetable: Timetable;

    beforeEach(async () => {
      timetable = await timetableService.createTimetable({
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId,
        dayOfWeek: 1
      });
    });

    it('should create multiple periods at once', async () => {
      const periods = await timetableService.bulkCreatePeriods(timetable.timetableId, [
        {
          periodNumber: 1,
          startTime: '09:00',
          endTime: '09:45',
          subjectId: subject1.subjectId,
          teacherId: teacher1.staffId
        },
        {
          periodNumber: 2,
          startTime: '10:00',
          endTime: '10:45',
          subjectId: subject2.subjectId,
          teacherId: teacher2.staffId
        },
        {
          periodNumber: 3,
          startTime: '11:00',
          endTime: '11:45',
          subjectId: subject1.subjectId,
          teacherId: teacher1.staffId
        }
      ]);

      expect(periods).toHaveLength(3);
      expect(periods[0].periodNumber).toBe(1);
      expect(periods[1].periodNumber).toBe(2);
      expect(periods[2].periodNumber).toBe(3);
    });

    it('should reject bulk create if any period has teacher conflict', async () => {
      await expect(
        timetableService.bulkCreatePeriods(timetable.timetableId, [
          {
            periodNumber: 1,
            startTime: '09:00',
            endTime: '09:45',
            subjectId: subject1.subjectId,
            teacherId: teacher1.staffId
          },
          {
            periodNumber: 2,
            startTime: '09:30', // Overlaps with period 1
            endTime: '10:15',
            subjectId: subject2.subjectId,
            teacherId: teacher1.staffId // Same teacher
          }
        ])
      ).rejects.toThrow('Teacher conflict');
    });

    it('should reject bulk create if any period has invalid time format', async () => {
      await expect(
        timetableService.bulkCreatePeriods(timetable.timetableId, [
          {
            periodNumber: 1,
            startTime: '9:00', // Invalid format
            endTime: '09:45',
            subjectId: subject1.subjectId
          }
        ])
      ).rejects.toThrow('Invalid time format');
    });
  });

  describe('deleteTimetable', () => {
    it('should delete timetable and cascade delete periods', async () => {
      const timetable = await timetableService.createTimetable({
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId,
        dayOfWeek: 1
      });

      await timetableService.addPeriod(timetable.timetableId, {
        periodNumber: 1,
        startTime: '09:00',
        endTime: '09:45',
        subjectId: subject1.subjectId
      });

      const deleted = await timetableService.deleteTimetable(timetable.timetableId);
      expect(deleted).toBe(true);

      const foundTimetable = await Timetable.findByPk(timetable.timetableId);
      expect(foundTimetable).toBeNull();

      const periods = await Period.findAll({ where: { timetableId: timetable.timetableId } });
      expect(periods).toHaveLength(0);
    });

    it('should return false for non-existent timetable', async () => {
      const deleted = await timetableService.deleteTimetable(99999);
      expect(deleted).toBe(false);
    });
  });
});

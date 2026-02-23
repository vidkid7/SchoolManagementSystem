import examScheduleService from '../examSchedule.service';
import examScheduleRepository from '../examSchedule.repository';
import examRepository from '../exam.repository';
import ExamSchedule, { ExamScheduleCreationAttributes } from '@models/ExamSchedule.model';
import Exam, { ExamType, ExamStatus } from '@models/Exam.model';

// Mock the repositories
jest.mock('../examSchedule.repository');
jest.mock('../exam.repository');

describe('ExamSchedule Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createSchedule', () => {
    it('should create a schedule when no conflicts exist', async () => {
      const scheduleData: ExamScheduleCreationAttributes = {
        examId: 1,
        subjectId: 1,
        date: new Date('2024-03-15'),
        startTime: '09:00',
        endTime: '11:00',
        roomNumber: 'Room 101',
        invigilators: [1, 2]
      };

      const mockExam = {
        examId: 1,
        classId: 1,
        name: 'Math Final',
        type: ExamType.FINAL,
        status: ExamStatus.SCHEDULED
      } as Exam;

      const mockSchedule = {
        examScheduleId: 1,
        ...scheduleData,
        getDurationMinutes: () => 120
      } as ExamSchedule;

      (examRepository.findById as jest.Mock).mockResolvedValue(mockExam);
      (examScheduleRepository.findOverlapping as jest.Mock).mockResolvedValue([]);
      (examScheduleRepository.create as jest.Mock).mockResolvedValue(mockSchedule);

      const result = await examScheduleService.createSchedule(scheduleData);

      expect(result.schedule).toBeDefined();
      expect(result.errors).toHaveLength(0);
      expect(examScheduleRepository.create).toHaveBeenCalledWith(scheduleData);
    });

    it('should reject schedule with invalid time format', async () => {
      const scheduleData: ExamScheduleCreationAttributes = {
        examId: 1,
        subjectId: 1,
        date: new Date('2024-03-15'),
        startTime: '25:00', // Invalid hour
        endTime: '11:00',
        roomNumber: 'Room 101'
      };

      const result = await examScheduleService.createSchedule(scheduleData);

      expect(result.schedule).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].type).toBe('invalid_time');
      expect(result.errors[0].message).toContain('Invalid start time format');
    });

    it('should reject schedule where start time is after end time', async () => {
      const scheduleData: ExamScheduleCreationAttributes = {
        examId: 1,
        subjectId: 1,
        date: new Date('2024-03-15'),
        startTime: '11:00',
        endTime: '09:00', // End before start
        roomNumber: 'Room 101'
      };

      const result = await examScheduleService.createSchedule(scheduleData);

      expect(result.schedule).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('invalid_time');
      expect(result.errors[0].message).toContain('Start time must be before end time');
    });

    it('should detect student conflicts (same class, overlapping time)', async () => {
      const scheduleData: ExamScheduleCreationAttributes = {
        examId: 1,
        subjectId: 1,
        date: new Date('2024-03-15'),
        startTime: '09:00',
        endTime: '11:00',
        roomNumber: 'Room 101'
      };

      const mockExam = {
        examId: 1,
        classId: 1,
        name: 'Math Final',
        type: ExamType.FINAL,
        status: ExamStatus.SCHEDULED
      } as Exam;

      const conflictingExam = {
        examId: 2,
        classId: 1, // Same class
        name: 'Science Final',
        type: ExamType.FINAL,
        status: ExamStatus.SCHEDULED
      } as Exam;

      const conflictingSchedule = {
        examScheduleId: 2,
        examId: 2,
        subjectId: 2,
        date: new Date('2024-03-15'),
        startTime: '10:00', // Overlaps with 09:00-11:00
        endTime: '12:00',
        exam: conflictingExam
      } as ExamSchedule;

      (examRepository.findById as jest.Mock).mockResolvedValue(mockExam);
      (examScheduleRepository.findOverlapping as jest.Mock).mockResolvedValue([conflictingSchedule]);

      const result = await examScheduleService.createSchedule(scheduleData);

      expect(result.schedule).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('student_overlap');
      expect(result.errors[0].message).toContain('Students in this class already have an exam');
    });

    it('should allow schedules for different classes at same time', async () => {
      const scheduleData: ExamScheduleCreationAttributes = {
        examId: 1,
        subjectId: 1,
        date: new Date('2024-03-15'),
        startTime: '09:00',
        endTime: '11:00',
        roomNumber: 'Room 101'
      };

      const mockExam = {
        examId: 1,
        classId: 1,
        name: 'Math Final',
        type: ExamType.FINAL,
        status: ExamStatus.SCHEDULED
      } as Exam;

      const nonConflictingExam = {
        examId: 2,
        classId: 2, // Different class
        name: 'Science Final',
        type: ExamType.FINAL,
        status: ExamStatus.SCHEDULED
      } as Exam;

      const nonConflictingSchedule = {
        examScheduleId: 2,
        examId: 2,
        subjectId: 2,
        date: new Date('2024-03-15'),
        startTime: '09:00',
        endTime: '11:00',
        exam: nonConflictingExam
      } as ExamSchedule;

      const mockSchedule = {
        examScheduleId: 1,
        ...scheduleData
      } as ExamSchedule;

      (examRepository.findById as jest.Mock).mockResolvedValue(mockExam);
      (examScheduleRepository.findOverlapping as jest.Mock).mockResolvedValue([nonConflictingSchedule]);
      (examScheduleRepository.create as jest.Mock).mockResolvedValue(mockSchedule);

      const result = await examScheduleService.createSchedule(scheduleData);

      expect(result.schedule).toBeDefined();
      expect(result.errors).toHaveLength(0);
    });

    it('should detect teacher conflicts (overlapping invigilation duties)', async () => {
      const scheduleData: ExamScheduleCreationAttributes = {
        examId: 1,
        subjectId: 1,
        date: new Date('2024-03-15'),
        startTime: '09:00',
        endTime: '11:00',
        roomNumber: 'Room 101',
        invigilators: [1, 2] // Teacher 1 and 2
      };

      const mockExam = {
        examId: 1,
        classId: 1,
        name: 'Math Final',
        type: ExamType.FINAL,
        status: ExamStatus.SCHEDULED
      } as Exam;

      const conflictingExam = {
        examId: 2,
        classId: 2,
        name: 'Science Final',
        type: ExamType.FINAL,
        status: ExamStatus.SCHEDULED
      } as Exam;

      const conflictingSchedule = {
        examScheduleId: 2,
        examId: 2,
        subjectId: 2,
        date: new Date('2024-03-15'),
        startTime: '10:00',
        endTime: '12:00',
        invigilators: [1, 3], // Teacher 1 has conflict
        exam: conflictingExam
      } as ExamSchedule;

      (examRepository.findById as jest.Mock).mockResolvedValue(mockExam);
      (examScheduleRepository.findOverlapping as jest.Mock).mockResolvedValue([conflictingSchedule]);

      const result = await examScheduleService.createSchedule(scheduleData);

      expect(result.schedule).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('teacher_overlap');
      expect(result.errors[0].message).toContain('Teacher (ID: 1) already has invigilation duty');
    });

    it('should detect room conflicts', async () => {
      const scheduleData: ExamScheduleCreationAttributes = {
        examId: 1,
        subjectId: 1,
        date: new Date('2024-03-15'),
        startTime: '09:00',
        endTime: '11:00',
        roomNumber: 'Room 101'
      };

      const mockExam = {
        examId: 1,
        classId: 1,
        name: 'Math Final',
        type: ExamType.FINAL,
        status: ExamStatus.SCHEDULED
      } as Exam;

      const conflictingExam = {
        examId: 2,
        classId: 2,
        name: 'Science Final',
        type: ExamType.FINAL,
        status: ExamStatus.SCHEDULED
      } as Exam;

      const conflictingSchedule = {
        examScheduleId: 2,
        examId: 2,
        subjectId: 2,
        date: new Date('2024-03-15'),
        startTime: '10:00',
        endTime: '12:00',
        roomNumber: 'Room 101', // Same room
        exam: conflictingExam
      } as ExamSchedule;

      (examRepository.findById as jest.Mock).mockResolvedValue(mockExam);
      (examScheduleRepository.findOverlapping as jest.Mock).mockResolvedValue([conflictingSchedule]);

      const result = await examScheduleService.createSchedule(scheduleData);

      expect(result.schedule).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('room_conflict');
      expect(result.errors[0].message).toContain('Room Room 101 is already booked');
    });

    it('should detect multiple conflicts simultaneously', async () => {
      const scheduleData: ExamScheduleCreationAttributes = {
        examId: 1,
        subjectId: 1,
        date: new Date('2024-03-15'),
        startTime: '09:00',
        endTime: '11:00',
        roomNumber: 'Room 101',
        invigilators: [1, 2]
      };

      const mockExam = {
        examId: 1,
        classId: 1,
        name: 'Math Final',
        type: ExamType.FINAL,
        status: ExamStatus.SCHEDULED
      } as Exam;

      const conflictingExam = {
        examId: 2,
        classId: 1, // Same class - student conflict
        name: 'Science Final',
        type: ExamType.FINAL,
        status: ExamStatus.SCHEDULED
      } as Exam;

      const conflictingSchedule = {
        examScheduleId: 2,
        examId: 2,
        subjectId: 2,
        date: new Date('2024-03-15'),
        startTime: '10:00',
        endTime: '12:00',
        roomNumber: 'Room 101', // Same room - room conflict
        invigilators: [1, 3], // Teacher 1 conflict
        exam: conflictingExam
      } as ExamSchedule;

      (examRepository.findById as jest.Mock).mockResolvedValue(mockExam);
      (examScheduleRepository.findOverlapping as jest.Mock).mockResolvedValue([conflictingSchedule]);

      const result = await examScheduleService.createSchedule(scheduleData);

      expect(result.schedule).toBeNull();
      expect(result.errors.length).toBeGreaterThan(1);
      
      const errorTypes = result.errors.map(e => e.type);
      expect(errorTypes).toContain('student_overlap');
      expect(errorTypes).toContain('teacher_overlap');
      expect(errorTypes).toContain('room_conflict');
    });
  });

  describe('updateSchedule', () => {
    it('should update schedule when no conflicts exist', async () => {
      const existingSchedule = {
        examScheduleId: 1,
        examId: 1,
        subjectId: 1,
        date: new Date('2024-03-15'),
        startTime: '09:00',
        endTime: '11:00',
        roomNumber: 'Room 101',
        invigilators: [1]
      } as ExamSchedule;

      const updateData = {
        startTime: '10:00',
        endTime: '12:00'
      };

      const mockExam = {
        examId: 1,
        classId: 1,
        name: 'Math Final',
        type: ExamType.FINAL,
        status: ExamStatus.SCHEDULED
      } as Exam;

      const updatedSchedule = {
        ...existingSchedule,
        ...updateData
      } as ExamSchedule;

      (examScheduleRepository.findById as jest.Mock).mockResolvedValue(existingSchedule);
      (examRepository.findById as jest.Mock).mockResolvedValue(mockExam);
      (examScheduleRepository.findOverlapping as jest.Mock).mockResolvedValue([]);
      (examScheduleRepository.update as jest.Mock).mockResolvedValue(updatedSchedule);

      const result = await examScheduleService.updateSchedule(1, updateData);

      expect(result.schedule).toBeDefined();
      expect(result.errors).toHaveLength(0);
      expect(examScheduleRepository.update).toHaveBeenCalledWith(1, updateData);
    });

    it('should return error when schedule not found', async () => {
      (examScheduleRepository.findById as jest.Mock).mockResolvedValue(null);

      const result = await examScheduleService.updateSchedule(999, { startTime: '10:00' });

      expect(result.schedule).toBeNull();
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('not found');
    });

    it('should exclude current schedule from conflict check', async () => {
      const existingSchedule = {
        examScheduleId: 1,
        examId: 1,
        subjectId: 1,
        date: new Date('2024-03-15'),
        startTime: '09:00',
        endTime: '11:00',
        roomNumber: 'Room 101',
        invigilators: [1]
      } as ExamSchedule;

      const updateData = {
        startTime: '09:30'
      };

      const mockExam = {
        examId: 1,
        classId: 1,
        name: 'Math Final',
        type: ExamType.FINAL,
        status: ExamStatus.SCHEDULED
      } as Exam;

      (examScheduleRepository.findById as jest.Mock).mockResolvedValue(existingSchedule);
      (examRepository.findById as jest.Mock).mockResolvedValue(mockExam);
      (examScheduleRepository.findOverlapping as jest.Mock).mockResolvedValue([]);
      (examScheduleRepository.update as jest.Mock).mockResolvedValue(existingSchedule);

      await examScheduleService.updateSchedule(1, updateData);

      // Verify that findOverlapping was called with excludeScheduleId
      expect(examScheduleRepository.findOverlapping).toHaveBeenCalledWith(
        expect.any(Date),
        expect.any(String),
        expect.any(String),
        1 // excludeScheduleId
      );
    });
  });

  describe('generateClassTimetable', () => {
    it('should generate timetable for a class', async () => {
      const mockSchedules = [
        {
          examScheduleId: 1,
          examId: 1,
          subjectId: 1,
          date: new Date('2024-03-15'),
          startTime: '09:00',
          endTime: '11:00',
          roomNumber: 'Room 101',
          invigilators: [1],
          getDurationMinutes: () => 120,
          exam: {
            examId: 1,
            name: 'Math Final',
            classId: 1
          }
        },
        {
          examScheduleId: 2,
          examId: 2,
          subjectId: 2,
          date: new Date('2024-03-16'),
          startTime: '09:00',
          endTime: '11:00',
          roomNumber: 'Room 102',
          invigilators: [2],
          getDurationMinutes: () => 120,
          exam: {
            examId: 2,
            name: 'Science Final',
            classId: 1
          }
        }
      ] as ExamSchedule[];

      (examScheduleRepository.findByClassId as jest.Mock).mockResolvedValue(mockSchedules);

      const timetable = await examScheduleService.generateClassTimetable(1);

      expect(timetable).toHaveLength(2);
      expect(timetable[0].examName).toBe('Math Final');
      expect(timetable[0].duration).toBe(120);
      expect(timetable[1].examName).toBe('Science Final');
    });

    it('should generate timetable with date range filter', async () => {
      const dateRange = {
        start: new Date('2024-03-15'),
        end: new Date('2024-03-20')
      };

      (examScheduleRepository.findByClassId as jest.Mock).mockResolvedValue([]);

      await examScheduleService.generateClassTimetable(1, dateRange);

      expect(examScheduleRepository.findByClassId).toHaveBeenCalledWith(1, dateRange);
    });
  });

  describe('generateTeacherTimetable', () => {
    it('should generate timetable for a teacher', async () => {
      const mockSchedules = [
        {
          examScheduleId: 1,
          examId: 1,
          subjectId: 1,
          date: new Date('2024-03-15'),
          startTime: '09:00',
          endTime: '11:00',
          roomNumber: 'Room 101',
          invigilators: [1],
          getDurationMinutes: () => 120,
          exam: {
            examId: 1,
            name: 'Math Final',
            classId: 1
          }
        }
      ] as ExamSchedule[];

      (examScheduleRepository.findByInvigilator as jest.Mock).mockResolvedValue(mockSchedules);

      const timetable = await examScheduleService.generateTeacherTimetable(1);

      expect(timetable).toHaveLength(1);
      expect(timetable[0].examName).toBe('Math Final');
      expect(timetable[0].invigilators).toContain(1);
    });
  });

  describe('bulkCreateSchedules', () => {
    it('should create multiple schedules and report results', async () => {
      const schedules: ExamScheduleCreationAttributes[] = [
        {
          examId: 1,
          subjectId: 1,
          date: new Date('2024-03-15'),
          startTime: '09:00',
          endTime: '11:00',
          roomNumber: 'Room 101'
        },
        {
          examId: 2,
          subjectId: 2,
          date: new Date('2024-03-16'),
          startTime: '09:00',
          endTime: '11:00',
          roomNumber: 'Room 102'
        }
      ];

      const mockExam = {
        examId: 1,
        classId: 1,
        name: 'Math Final',
        type: ExamType.FINAL,
        status: ExamStatus.SCHEDULED
      } as Exam;

      (examRepository.findById as jest.Mock).mockResolvedValue(mockExam);
      (examScheduleRepository.findOverlapping as jest.Mock).mockResolvedValue([]);
      (examScheduleRepository.create as jest.Mock).mockImplementation((data) => 
        Promise.resolve({ examScheduleId: 1, ...data } as ExamSchedule)
      );

      const result = await examScheduleService.bulkCreateSchedules(schedules);

      expect(result.created).toHaveLength(2);
      expect(result.failed).toHaveLength(0);
    });

    it('should report failed schedules with errors', async () => {
      const schedules: ExamScheduleCreationAttributes[] = [
        {
          examId: 1,
          subjectId: 1,
          date: new Date('2024-03-15'),
          startTime: '09:00',
          endTime: '11:00',
          roomNumber: 'Room 101'
        },
        {
          examId: 2,
          subjectId: 2,
          date: new Date('2024-03-15'),
          startTime: '25:00', // Invalid time
          endTime: '11:00',
          roomNumber: 'Room 102'
        }
      ];

      const mockExam = {
        examId: 1,
        classId: 1,
        name: 'Math Final',
        type: ExamType.FINAL,
        status: ExamStatus.SCHEDULED
      } as Exam;

      (examRepository.findById as jest.Mock).mockResolvedValue(mockExam);
      (examScheduleRepository.findOverlapping as jest.Mock).mockResolvedValue([]);
      (examScheduleRepository.create as jest.Mock).mockImplementation((data) => 
        Promise.resolve({ examScheduleId: 1, ...data } as ExamSchedule)
      );

      const result = await examScheduleService.bulkCreateSchedules(schedules);

      expect(result.created).toHaveLength(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].errors[0].type).toBe('invalid_time');
    });
  });

  describe('validateSchedule', () => {
    it('should validate time format', async () => {
      const scheduleData: ExamScheduleCreationAttributes = {
        examId: 1,
        subjectId: 1,
        date: new Date('2024-03-15'),
        startTime: 'invalid',
        endTime: '11:00'
      };

      const result = await examScheduleService.validateSchedule(scheduleData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('invalid_time');
    });

    it('should validate time order', async () => {
      const scheduleData: ExamScheduleCreationAttributes = {
        examId: 1,
        subjectId: 1,
        date: new Date('2024-03-15'),
        startTime: '11:00',
        endTime: '09:00'
      };

      const result = await examScheduleService.validateSchedule(scheduleData);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('Start time must be before end time');
    });

    it('should return valid for non-overlapping schedules', async () => {
      const scheduleData: ExamScheduleCreationAttributes = {
        examId: 1,
        subjectId: 1,
        date: new Date('2024-03-15'),
        startTime: '09:00',
        endTime: '11:00'
      };

      const mockExam = {
        examId: 1,
        classId: 1,
        name: 'Math Final',
        type: ExamType.FINAL,
        status: ExamStatus.SCHEDULED
      } as Exam;

      (examRepository.findById as jest.Mock).mockResolvedValue(mockExam);
      (examScheduleRepository.findOverlapping as jest.Mock).mockResolvedValue([]);

      const result = await examScheduleService.validateSchedule(scheduleData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

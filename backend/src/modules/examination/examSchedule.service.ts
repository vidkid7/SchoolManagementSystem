import ExamSchedule, { ExamScheduleCreationAttributes } from '@models/ExamSchedule.model';
import examScheduleRepository from './examSchedule.repository';
import examRepository from './exam.repository';

/**
 * Validation error types
 */
export interface ValidationError {
  type: 'student_overlap' | 'teacher_overlap' | 'room_conflict' | 'invalid_time';
  message: string;
  details?: any;
}

/**
 * Schedule validation result
 */
export interface ScheduleValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Exam timetable entry
 */
export interface ExamTimetableEntry {
  examScheduleId: number;
  examId: number;
  examName: string;
  subjectId: number;
  subjectName?: string;
  date: Date;
  startTime: string;
  endTime: string;
  duration: number;
  roomNumber?: string;
  invigilators?: number[];
  classId: number;
}

/**
 * ExamSchedule Service
 * Handles business logic for exam scheduling with conflict validation
 * 
 * Requirements: 7.3, 7.4
 */
class ExamScheduleService {
  /**
   * Create exam schedule with validation
   * Validates:
   * - No student has overlapping exams (same class, overlapping time)
   * - No teacher has overlapping invigilation duties
   * - Room is not double-booked
   * 
   * Requirement 7.3: Create exam schedules with date, time, room, invigilators
   * Requirement 7.4: Validate no overlapping exams for students and teachers
   */
  async createSchedule(
    scheduleData: ExamScheduleCreationAttributes
  ): Promise<{ schedule: ExamSchedule | null; errors: ValidationError[] }> {
    // Validate the schedule
    const validation = await this.validateSchedule(scheduleData);
    
    if (!validation.isValid) {
      return {
        schedule: null,
        errors: validation.errors
      };
    }

    // Create the schedule
    const schedule = await examScheduleRepository.create(scheduleData);
    
    return {
      schedule,
      errors: []
    };
  }

  /**
   * Validate exam schedule for conflicts
   * 
   * Requirement 7.4: Validate no student has overlapping exams
   * Requirement 7.4: Validate no teacher has overlapping invigilation duties
   */
  async validateSchedule(
    scheduleData: ExamScheduleCreationAttributes,
    excludeScheduleId?: number
  ): Promise<ScheduleValidationResult> {
    const errors: ValidationError[] = [];

    // Validate time format and order
    if (!ExamSchedule.isValidTimeFormat(scheduleData.startTime)) {
      errors.push({
        type: 'invalid_time',
        message: 'Invalid start time format. Expected HH:mm',
        details: { startTime: scheduleData.startTime }
      });
    }

    if (!ExamSchedule.isValidTimeFormat(scheduleData.endTime)) {
      errors.push({
        type: 'invalid_time',
        message: 'Invalid end time format. Expected HH:mm',
        details: { endTime: scheduleData.endTime }
      });
    }

    // Validate start time is before end time
    if (scheduleData.startTime && scheduleData.endTime) {
      const [startHour, startMin] = scheduleData.startTime.split(':').map(Number);
      const [endHour, endMin] = scheduleData.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      if (startMinutes >= endMinutes) {
        errors.push({
          type: 'invalid_time',
          message: 'Start time must be before end time',
          details: { startTime: scheduleData.startTime, endTime: scheduleData.endTime }
        });
      }
    }

    // If basic validation failed, return early
    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    // Get the exam details to find the class
    const exam = await examRepository.findById(scheduleData.examId);
    if (!exam) {
      errors.push({
        type: 'invalid_time',
        message: 'Exam not found',
        details: { examId: scheduleData.examId }
      });
      return { isValid: false, errors };
    }

    // Find overlapping schedules
    const overlappingSchedules = await examScheduleRepository.findOverlapping(
      scheduleData.date,
      scheduleData.startTime,
      scheduleData.endTime,
      excludeScheduleId
    );

    // Check for student conflicts (same class, overlapping time)
    const studentConflicts = await this.checkStudentConflicts(
      exam.classId,
      overlappingSchedules
    );
    errors.push(...studentConflicts);

    // Check for teacher conflicts (invigilators with overlapping duties)
    if (scheduleData.invigilators && scheduleData.invigilators.length > 0) {
      const teacherConflicts = await this.checkTeacherConflicts(
        scheduleData.invigilators,
        overlappingSchedules
      );
      errors.push(...teacherConflicts);
    }

    // Check for room conflicts
    if (scheduleData.roomNumber) {
      const roomConflicts = this.checkRoomConflicts(
        scheduleData.roomNumber,
        overlappingSchedules
      );
      errors.push(...roomConflicts);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check for student conflicts
   * Students in the same class cannot have overlapping exams
   * 
   * Requirement 7.4: Validate no student has overlapping exams
   */
  private async checkStudentConflicts(
    classId: number,
    overlappingSchedules: ExamSchedule[]
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    for (const schedule of overlappingSchedules) {
      // Load the exam if not already loaded
      const exam = schedule.exam || await examRepository.findById(schedule.examId);
      
      if (exam && exam.classId === classId) {
        errors.push({
          type: 'student_overlap',
          message: `Students in this class already have an exam scheduled at this time`,
          details: {
            conflictingExamId: exam.examId,
            conflictingExamName: exam.name,
            conflictingScheduleId: schedule.examScheduleId,
            date: schedule.date,
            startTime: schedule.startTime,
            endTime: schedule.endTime
          }
        });
      }
    }

    return errors;
  }

  /**
   * Check for teacher conflicts
   * Teachers cannot have overlapping invigilation duties
   * 
   * Requirement 7.4: Validate no teacher has overlapping invigilation duties
   */
  private async checkTeacherConflicts(
    invigilators: number[],
    overlappingSchedules: ExamSchedule[]
  ): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    for (const teacherId of invigilators) {
      for (const schedule of overlappingSchedules) {
        if (schedule.invigilators && schedule.invigilators.includes(teacherId)) {
          errors.push({
            type: 'teacher_overlap',
            message: `Teacher (ID: ${teacherId}) already has invigilation duty at this time`,
            details: {
              teacherId,
              conflictingScheduleId: schedule.examScheduleId,
              conflictingExamId: schedule.examId,
              date: schedule.date,
              startTime: schedule.startTime,
              endTime: schedule.endTime
            }
          });
        }
      }
    }

    return errors;
  }

  /**
   * Check for room conflicts
   * Rooms cannot be double-booked
   */
  private checkRoomConflicts(
    roomNumber: string,
    overlappingSchedules: ExamSchedule[]
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const schedule of overlappingSchedules) {
      if (schedule.roomNumber === roomNumber) {
        errors.push({
          type: 'room_conflict',
          message: `Room ${roomNumber} is already booked at this time`,
          details: {
            roomNumber,
            conflictingScheduleId: schedule.examScheduleId,
            conflictingExamId: schedule.examId,
            date: schedule.date,
            startTime: schedule.startTime,
            endTime: schedule.endTime
          }
        });
      }
    }

    return errors;
  }

  /**
   * Update exam schedule with validation
   */
  async updateSchedule(
    examScheduleId: number,
    updateData: Partial<ExamScheduleCreationAttributes>
  ): Promise<{ schedule: ExamSchedule | null; errors: ValidationError[] }> {
    // Get existing schedule
    const existingSchedule = await examScheduleRepository.findById(examScheduleId);
    if (!existingSchedule) {
      return {
        schedule: null,
        errors: [{
          type: 'invalid_time',
          message: 'Exam schedule not found',
          details: { examScheduleId }
        }]
      };
    }

    // Merge with existing data for validation
    const scheduleData: ExamScheduleCreationAttributes = {
      examId: updateData.examId ?? existingSchedule.examId,
      subjectId: updateData.subjectId ?? existingSchedule.subjectId,
      date: updateData.date ?? existingSchedule.date,
      startTime: updateData.startTime ?? existingSchedule.startTime,
      endTime: updateData.endTime ?? existingSchedule.endTime,
      roomNumber: updateData.roomNumber ?? existingSchedule.roomNumber,
      invigilators: updateData.invigilators ?? existingSchedule.invigilators
    };

    // Validate the updated schedule (excluding current schedule from conflict check)
    const validation = await this.validateSchedule(scheduleData, examScheduleId);
    
    if (!validation.isValid) {
      return {
        schedule: null,
        errors: validation.errors
      };
    }

    // Update the schedule
    const schedule = await examScheduleRepository.update(examScheduleId, updateData);
    
    return {
      schedule,
      errors: []
    };
  }

  /**
   * Get exam schedule by ID
   */
  async getScheduleById(examScheduleId: number): Promise<ExamSchedule | null> {
    return await examScheduleRepository.findById(examScheduleId);
  }

  /**
   * Get all schedules for an exam
   */
  async getSchedulesByExamId(examId: number): Promise<ExamSchedule[]> {
    return await examScheduleRepository.findByExamId(examId);
  }

  /**
   * Get all schedules for a date
   */
  async getSchedulesByDate(date: Date): Promise<ExamSchedule[]> {
    return await examScheduleRepository.findByDate(date);
  }

  /**
   * Get all schedules for a date range
   */
  async getSchedulesByDateRange(startDate: Date, endDate: Date): Promise<ExamSchedule[]> {
    return await examScheduleRepository.findByDateRange(startDate, endDate);
  }

  /**
   * Get all schedules for a teacher (invigilator)
   */
  async getSchedulesByInvigilator(teacherId: number, date?: Date): Promise<ExamSchedule[]> {
    return await examScheduleRepository.findByInvigilator(teacherId, date);
  }

  /**
   * Get all schedules for a room
   */
  async getSchedulesByRoom(roomNumber: string, date?: Date): Promise<ExamSchedule[]> {
    return await examScheduleRepository.findByRoom(roomNumber, date);
  }

  /**
   * Generate exam timetable for a class
   * 
   * Requirement 7.3: Generate exam timetables
   */
  async generateClassTimetable(
    classId: number,
    dateRange?: { start: Date; end: Date }
  ): Promise<ExamTimetableEntry[]> {
    const schedules = await examScheduleRepository.findByClassId(classId, dateRange);
    
    const timetable: ExamTimetableEntry[] = schedules.map(schedule => {
      const exam = schedule.exam;
      
      return {
        examScheduleId: schedule.examScheduleId,
        examId: schedule.examId,
        examName: exam?.name || 'Unknown Exam',
        subjectId: schedule.subjectId,
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        duration: schedule.getDurationMinutes(),
        roomNumber: schedule.roomNumber,
        invigilators: schedule.invigilators,
        classId: exam?.classId || 0
      };
    });

    return timetable;
  }

  /**
   * Generate exam timetable for a teacher (invigilator)
   */
  async generateTeacherTimetable(
    teacherId: number,
    dateRange?: { start: Date; end: Date }
  ): Promise<ExamTimetableEntry[]> {
    let schedules: ExamSchedule[];
    
    if (dateRange) {
      const allSchedules = await examScheduleRepository.findByDateRange(
        dateRange.start,
        dateRange.end
      );
      schedules = allSchedules.filter(s => 
        s.invigilators && s.invigilators.includes(teacherId)
      );
    } else {
      schedules = await examScheduleRepository.findByInvigilator(teacherId);
    }
    
    const timetable: ExamTimetableEntry[] = schedules.map(schedule => {
      const exam = schedule.exam;
      
      return {
        examScheduleId: schedule.examScheduleId,
        examId: schedule.examId,
        examName: exam?.name || 'Unknown Exam',
        subjectId: schedule.subjectId,
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        duration: schedule.getDurationMinutes(),
        roomNumber: schedule.roomNumber,
        invigilators: schedule.invigilators,
        classId: exam?.classId || 0
      };
    });

    return timetable;
  }

  /**
   * Delete exam schedule
   */
  async deleteSchedule(examScheduleId: number): Promise<boolean> {
    return await examScheduleRepository.delete(examScheduleId);
  }

  /**
   * Bulk create exam schedules with validation
   */
  async bulkCreateSchedules(
    schedules: ExamScheduleCreationAttributes[]
  ): Promise<{ 
    created: ExamSchedule[]; 
    failed: Array<{ schedule: ExamScheduleCreationAttributes; errors: ValidationError[] }> 
  }> {
    const created: ExamSchedule[] = [];
    const failed: Array<{ schedule: ExamScheduleCreationAttributes; errors: ValidationError[] }> = [];

    for (const scheduleData of schedules) {
      const result = await this.createSchedule(scheduleData);
      
      if (result.schedule) {
        created.push(result.schedule);
      } else {
        failed.push({
          schedule: scheduleData,
          errors: result.errors
        });
      }
    }

    return { created, failed };
  }
}

export default new ExamScheduleService();

import Staff, { StaffStatus, StaffCategory, StaffAttributes, StaffCreationAttributes } from '@models/Staff.model';
import StaffAssignment, { AssignmentType, StaffAssignmentCreationAttributes } from '@models/StaffAssignment.model';
import { Op, WhereOptions } from 'sequelize';
import { logger } from '@utils/logger';
import { env } from '@config/env';
import qualificationValidationService from './qualificationValidation.service';

/**
 * Staff Service
 * Handles staff CRUD, assignments, and document management
 * Requirements: 4.1-4.10
 */
class StaffService {
  /**
   * Generate unique staff code with retry logic for concurrent safety
   * Format: {school_prefix}-STAFF-{year}-{sequential}
   * Requirements: 4.2
   */
  async generateStaffCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = env.DEFAULT_SCHOOL_CODE || 'SCH';
    
    // Retry up to 5 times in case of concurrent conflicts
    const maxRetries = 5;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Count existing staff codes for this year
        const count = await Staff.count({
          where: {
            staffCode: {
              [Op.like]: `${prefix}-STAFF-${year}-%`
            }
          }
        });

        const seqNum = (count + 1).toString().padStart(4, '0');
        const staffCode = `${prefix}-STAFF-${year}-${seqNum}`;
        
        // Check if this code already exists (race condition check)
        const existing = await Staff.findOne({
          where: { staffCode }
        });
        
        if (!existing) {
          return staffCode;
        }
        
        // If code exists, retry with a small delay
        await new Promise(resolve => setTimeout(resolve, 10 * (attempt + 1)));
      } catch (error) {
        if (attempt === maxRetries - 1) {
          logger.error('Failed to generate unique staff code after retries', { error });
          throw error;
        }
      }
    }
    
    throw new Error('Failed to generate unique staff code after maximum retries');
  }

  /**
   * Create new staff member
   * Automatically generates unique staff code
   * Requirements: 4.1, 4.2
   */
  async create(
    data: StaffCreationAttributes,
    _userId?: number,
    retryCount: number = 0
  ): Promise<Staff> {
    const maxRetries = 10; // Increased for concurrent scenarios
    
    try {
      // Generate staff code if not provided
      const staffCode = data.staffCode || await this.generateStaffCode();

      const staff = await Staff.create({
        ...data,
        staffCode,
        status: data.status || StaffStatus.ACTIVE
      });

      logger.info('Staff created', {
        staffId: staff.staffId,
        staffCode: staff.staffCode
      });

      return staff;
    } catch (error: any) {
      // Handle duplicate key error with retry
      if (error.name === 'SequelizeUniqueConstraintError' && retryCount < maxRetries) {
        logger.warn(`Duplicate staff code detected, retrying... (attempt ${retryCount + 1}/${maxRetries})`, { error });
        // Exponential backoff with jitter
        const baseDelay = 20;
        const jitter = Math.random() * 30;
        const delay = baseDelay * Math.pow(2, retryCount) + jitter;
        await new Promise(resolve => setTimeout(resolve, delay));
        // Retry with a new code (don't pass the old staffCode)
        const { staffCode: _, ...dataWithoutCode } = data;
        return this.create(dataWithoutCode, _userId, retryCount + 1);
      }
      
      logger.error('Error creating staff', { error, data, retryCount });
      throw error;
    }
  }

  /**
   * Find staff by ID
   */
  async findById(staffId: number): Promise<Staff | null> {
    return Staff.findByPk(staffId);
  }

  /**
   * Find all staff with filters
   */
  async findAll(
    filters?: {
      category?: StaffCategory;
      status?: StaffStatus;
      department?: string;
      search?: string;
    },
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<{ staff: Staff[]; total: number }> {
    try {
      const where: WhereOptions<StaffAttributes> = {};

      if (filters?.category) {
        where.category = filters.category;
      }
      if (filters?.status) {
        where.status = filters.status;
      }
      if (filters?.department) {
        where.department = filters.department;
      }
      if (filters?.search) {
        where[Op.or as unknown as keyof WhereOptions<StaffAttributes>] = [
          { firstNameEn: { [Op.like]: `%${filters.search}%` } },
          { lastNameEn: { [Op.like]: `%${filters.search}%` } },
          { staffCode: { [Op.like]: `%${filters.search}%` } },
          { email: { [Op.like]: `%${filters.search}%` } }
        ] as unknown as WhereOptions<StaffAttributes>[keyof WhereOptions<StaffAttributes>];
      }

      const limit = Math.min(options?.limit || 20, 100);
      const offset = options?.offset || 0;

      const { rows: staff, count: total } = await Staff.findAndCountAll({
        where,
        limit,
        offset,
        order: [[options?.orderBy || 'createdAt', options?.orderDirection || 'DESC']]
      });

      return { staff, total };
    } catch (error) {
      logger.error('Error finding staff', { error, filters });
      throw error;
    }
  }

  /**
   * Update staff
   */
  async update(
    staffId: number,
    data: Partial<StaffAttributes>
  ): Promise<Staff | null> {
    try {
      const staff = await Staff.findByPk(staffId);

      if (!staff) {
        return null;
      }

      await staff.update(data);

      logger.info('Staff updated', { staffId });

      return staff;
    } catch (error) {
      logger.error('Error updating staff', { error, staffId });
      throw error;
    }
  }

  /**
   * Soft delete staff
   */
  async delete(staffId: number): Promise<boolean> {
    try {
      const staff = await Staff.findByPk(staffId);

      if (!staff) {
        return false;
      }

      await staff.destroy();

      logger.info('Staff deleted', { staffId });

      return true;
    } catch (error) {
      logger.error('Error deleting staff', { error, staffId });
      throw error;
    }
  }

  /**
   * Assign staff to class/subject with qualification validation
   * Requirements: 4.3, 4.4, 4.9
   */
  async assign(
    data: {
      staffId: number;
      academicYearId: number;
      assignmentType: AssignmentType;
      classId?: number;
      subjectId?: number;
      section?: string;
      department?: string;
      startDate: Date;
      endDate?: Date;
    },
    options?: {
      skipValidation?: boolean;
    }
  ): Promise<{ 
    assignment: StaffAssignment; 
    validation: { isValid: boolean; errors: string[]; warnings: string[] } 
  }> {
    try {
      // Validate qualifications unless explicitly skipped
      let validationResult: { isValid: boolean; errors: string[]; warnings: string[] } = { 
        isValid: true, 
        errors: [], 
        warnings: [] 
      };
      
      if (!options?.skipValidation) {
        if (data.assignmentType === AssignmentType.SUBJECT_TEACHER && data.subjectId) {
          validationResult = await qualificationValidationService.validateSubjectAssignment(
            data.staffId,
            data.subjectId,
            data.classId
          );
        } else if (data.assignmentType === AssignmentType.CLASS_TEACHER && data.classId) {
          validationResult = await qualificationValidationService.validateClassTeacherAssignment(
            data.staffId,
            data.classId
          );
        }

        // If validation fails, throw error
        if (!validationResult.isValid) {
          const error = new Error('Qualification validation failed');
          (error as any).validationErrors = validationResult.errors;
          throw error;
        }
      }

      // CRITICAL: Check if staff is already a class teacher for another class
      if (data.assignmentType === AssignmentType.CLASS_TEACHER) {
        const existingClassTeacher = await StaffAssignment.findOne({
          where: {
            staffId: data.staffId,
            assignmentType: AssignmentType.CLASS_TEACHER,
            isActive: true,
            academicYearId: data.academicYearId
          }
        });

        if (existingClassTeacher) {
          const error = new Error('This teacher is already a class teacher for another class. A teacher can only be a class teacher for one class at a time.');
          (error as any).validationErrors = ['Teacher is already assigned as class teacher'];
          throw error;
        }
      }

      // Check workload limits for subject teachers
      // According to Nepali education rules, a teacher should not teach more than 6-8 periods per day
      // or handle more than 5-6 different classes
      if (data.assignmentType === AssignmentType.SUBJECT_TEACHER) {
        const activeAssignments = await StaffAssignment.count({
          where: {
            staffId: data.staffId,
            assignmentType: AssignmentType.SUBJECT_TEACHER,
            isActive: true,
            academicYearId: data.academicYearId
          }
        });

        // Maximum 6 different class-subject combinations
        if (activeAssignments >= 6) {
          validationResult.warnings.push(
            'Warning: This teacher already has 6 active subject assignments. Consider workload distribution.'
          );
        }

        // Hard limit at 8 assignments
        if (activeAssignments >= 8) {
          const error = new Error('Maximum workload exceeded. A teacher cannot handle more than 8 different class-subject assignments.');
          (error as any).validationErrors = ['Maximum workload limit (8 assignments) exceeded'];
          throw error;
        }
      }

      // If this is a class teacher assignment, deactivate previous class teacher FOR THAT CLASS
      if (data.assignmentType === AssignmentType.CLASS_TEACHER && data.classId) {
        await StaffAssignment.update(
          { isActive: false, endDate: new Date() },
          {
            where: {
              classId: data.classId,
              assignmentType: AssignmentType.CLASS_TEACHER,
              isActive: true
            }
          }
        );
      }

      // If this is a subject teacher assignment, check for duplicates and end previous assignment
      if (data.assignmentType === AssignmentType.SUBJECT_TEACHER && data.subjectId && data.classId) {
        // Check if this exact assignment already exists and is active
        const duplicateAssignment = await StaffAssignment.findOne({
          where: {
            staffId: data.staffId,
            subjectId: data.subjectId,
            classId: data.classId,
            section: data.section,
            assignmentType: AssignmentType.SUBJECT_TEACHER,
            isActive: true,
            academicYearId: data.academicYearId
          }
        });

        if (duplicateAssignment) {
          const error = new Error('This teacher is already assigned to teach this subject in this class and section.');
          (error as any).validationErrors = ['Duplicate assignment'];
          throw error;
        }

        // End any previous assignment for this teacher-subject-class combination
        await StaffAssignment.update(
          { isActive: false, endDate: new Date() },
          {
            where: {
              staffId: data.staffId,
              subjectId: data.subjectId,
              classId: data.classId,
              assignmentType: AssignmentType.SUBJECT_TEACHER,
              isActive: true
            }
          }
        );
      }

      const assignment = await StaffAssignment.create({
        ...data,
        isActive: true
      } as StaffAssignmentCreationAttributes);

      logger.info('Staff assignment created', {
        assignmentId: assignment.assignmentId,
        staffId: data.staffId,
        assignmentType: data.assignmentType,
        hasWarnings: validationResult.warnings.length > 0
      });

      return { assignment, validation: validationResult };
    } catch (error) {
      logger.error('Error creating staff assignment', { error, data });
      throw error;
    }
  }

  /**
   * Get staff assignments with filtering and history
   * Requirements: 4.9
   */
  async getAssignments(
    staffId: number,
    options?: {
      academicYearId?: number;
      includeInactive?: boolean;
      assignmentType?: AssignmentType;
    }
  ): Promise<StaffAssignment[]> {
    try {
      const where: WhereOptions<any> = { staffId };

      if (options?.academicYearId) {
        where.academicYearId = options.academicYearId;
      }

      if (!options?.includeInactive) {
        where.isActive = true;
      }

      if (options?.assignmentType) {
        where.assignmentType = options.assignmentType;
      }

      return StaffAssignment.findAll({
        where,
        order: [['startDate', 'DESC']]
      });
    } catch (error) {
      logger.error('Error getting staff assignments', { error, staffId });
      throw error;
    }
  }

  /**
   * Get assignment history for a class or subject
   * Requirements: 4.9
   */
  async getAssignmentHistory(
    filters: {
      classId?: number;
      subjectId?: number;
      academicYearId?: number;
      assignmentType?: AssignmentType;
    }
  ): Promise<StaffAssignment[]> {
    try {
      const where: WhereOptions<any> = {};

      if (filters.classId) {
        where.classId = filters.classId;
      }

      if (filters.subjectId) {
        where.subjectId = filters.subjectId;
      }

      if (filters.academicYearId) {
        where.academicYearId = filters.academicYearId;
      }

      if (filters.assignmentType) {
        where.assignmentType = filters.assignmentType;
      }

      return StaffAssignment.findAll({
        where,
        order: [['startDate', 'DESC']]
      });
    } catch (error) {
      logger.error('Error getting assignment history', { error, filters });
      throw error;
    }
  }

  /**
   * Get active assignments for a staff member
   * Requirements: 4.3
   */
  async getActiveAssignments(
    staffId: number,
    academicYearId?: number
  ): Promise<StaffAssignment[]> {
    return this.getAssignments(staffId, {
      academicYearId,
      includeInactive: false
    });
  }

  /**
   * Check if staff has conflicting assignments
   * Requirements: 4.3
   */
  async hasConflictingAssignments(
    staffId: number,
    academicYearId: number,
    newAssignment: {
      classId?: number;
      subjectId?: number;
      assignmentType: AssignmentType;
    }
  ): Promise<boolean> {
    try {
      const activeAssignments = await this.getActiveAssignments(staffId, academicYearId);

      // Check for duplicate class teacher assignment
      if (newAssignment.assignmentType === AssignmentType.CLASS_TEACHER) {
        const hasClassTeacher = activeAssignments.some(
          a => a.assignmentType === AssignmentType.CLASS_TEACHER
        );
        if (hasClassTeacher) {
          return true;
        }
      }

      // Check for duplicate subject-class assignment
      if (newAssignment.assignmentType === AssignmentType.SUBJECT_TEACHER &&
          newAssignment.subjectId && newAssignment.classId) {
        const hasDuplicate = activeAssignments.some(
          a => a.assignmentType === AssignmentType.SUBJECT_TEACHER &&
               a.subjectId === newAssignment.subjectId &&
               a.classId === newAssignment.classId
        );
        if (hasDuplicate) {
          return true;
        }
      }

      return false;
    } catch (error) {
      logger.error('Error checking conflicting assignments', { error, staffId });
      throw error;
    }
  }

  /**
   * Get class teacher for a class
   */
  async getClassTeacher(classId: number, academicYearId: number): Promise<Staff | null> {
    try {
      const assignment = await StaffAssignment.findOne({
        where: {
          classId,
          academicYearId,
          assignmentType: AssignmentType.CLASS_TEACHER,
          isActive: true
        }
      });

      if (!assignment) {
        return null;
      }

      return Staff.findByPk(assignment.staffId);
    } catch (error) {
      logger.error('Error getting class teacher', { error, classId });
      throw error;
    }
  }

  /**
   * Get teachers for a subject in a class
   */
  async getSubjectTeachers(
    classId: number,
    subjectId: number,
    academicYearId: number
  ): Promise<Staff[]> {
    try {
      const assignments = await StaffAssignment.findAll({
        where: {
          classId,
          subjectId,
          academicYearId,
          assignmentType: AssignmentType.SUBJECT_TEACHER,
          isActive: true
        }
      });

      const staffIds = assignments.map(a => a.staffId);

      return Staff.findAll({
        where: { staffId: staffIds }
      });
    } catch (error) {
      logger.error('Error getting subject teachers', { error, classId, subjectId });
      throw error;
    }
  }

  /**
   * End an assignment
   */
  async endAssignment(assignmentId: number): Promise<boolean> {
    try {
      const assignment = await StaffAssignment.findByPk(assignmentId);

      if (!assignment) {
        return false;
      }

      await assignment.update({
        isActive: false,
        endDate: new Date()
      });

      logger.info('Staff assignment ended', { assignmentId });

      return true;
    } catch (error) {
      logger.error('Error ending staff assignment', { error, assignmentId });
      throw error;
    }
  }

  /**
   * Delete an assignment
   */
  async deleteAssignment(assignmentId: number): Promise<boolean> {
    try {
      const assignment = await StaffAssignment.findByPk(assignmentId);

      if (!assignment) {
        return false;
      }

      await assignment.destroy();

      logger.info('Staff assignment deleted', { assignmentId });

      return true;
    } catch (error) {
      logger.error('Error deleting staff assignment', { error, assignmentId });
      throw error;
    }
  }

  /**
   * Get staff by category
   */
  async getByCategory(category: StaffCategory): Promise<Staff[]> {
    return Staff.findAll({
      where: { category, status: StaffStatus.ACTIVE },
      order: [['firstNameEn', 'ASC']]
    });
  }

  /**
   * Get staff statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byCategory: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    try {
      const total = await Staff.count();

      const byCategory: Record<string, number> = {};
      for (const cat of Object.values(StaffCategory)) {
        byCategory[cat] = await Staff.count({ where: { category: cat } });
      }

      const byStatus: Record<string, number> = {};
      for (const status of Object.values(StaffStatus)) {
        byStatus[status] = await Staff.count({ where: { status } });
      }

      return { total, byCategory, byStatus };
    } catch (error) {
      logger.error('Error getting staff statistics', { error });
      throw error;
    }
  }
}

export default new StaffService();

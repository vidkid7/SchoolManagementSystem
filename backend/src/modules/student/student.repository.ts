import { Op, WhereOptions } from 'sequelize';
import Student, { StudentStatus, Gender, StudentAttributes, StudentCreationAttributes } from '@models/Student.model';
import { logger } from '@utils/logger';
import auditLogger from '@utils/auditLogger';
import { Request } from 'express';

/**
 * Student Repository
 * Handles all database operations for Student entity using parameterized queries
 * with comprehensive audit logging
 * Requirements: 2.1, 2.9, 38.1, 38.2, 38.6, 40.3, 35.6
 */
class StudentRepository {
  /**
   * Create a new student
   * @param studentData - Student creation data
   * @param userId - User ID who created the student
   * @param req - Express request object for audit logging
   * @returns Created student instance
   */
  async create(
    studentData: StudentCreationAttributes, 
    userId?: number,
    req?: Request
  ): Promise<Student> {
    try {
      const student = await Student.create(studentData);
      logger.info('Student created in database', { 
        studentId: student.studentId, 
        studentCode: student.studentCode 
      });

      // Log audit entry for create operation
      await auditLogger.logCreate(
        'student',
        student.studentId,
        student.toJSON(),
        userId,
        req
      );

      return student;
    } catch (error) {
      logger.error('Error creating student', { error, studentData });
      throw error;
    }
  }

  /**
   * Find student by ID
   * @param studentId - Student ID
   * @returns Student instance or null
   */
  async findById(studentId: number): Promise<Student | null> {
    try {
      return await Student.findByPk(studentId, {
        include: [
          {
            association: 'class',
            attributes: ['classId', 'gradeLevel', 'section'],
            required: false
          }
        ]
      });
    } catch (error) {
      logger.error('Error finding student by ID', { error, studentId });
      throw error;
    }
  }

  /**
   * Find student by student code
   * @param studentCode - Student code
   * @returns Student instance or null
   */
  async findByStudentCode(studentCode: string): Promise<Student | null> {
    try {
      return await Student.findOne({
        where: { studentCode }
      });
    } catch (error) {
      logger.error('Error finding student by student code', { error, studentCode });
      throw error;
    }
  }

  /**
   * Find student by symbol number (SEE students)
   * @param symbolNumber - Symbol number
   * @returns Student instance or null
   */
  async findBySymbolNumber(symbolNumber: string): Promise<Student | null> {
    try {
      return await Student.findOne({
        where: { symbolNumber }
      });
    } catch (error) {
      logger.error('Error finding student by symbol number', { error, symbolNumber });
      throw error;
    }
  }

  /**
   * Find student by NEB registration number (Class 11-12)
   * @param nebRegistrationNumber - NEB registration number
   * @returns Student instance or null
   */
  async findByNebRegistrationNumber(nebRegistrationNumber: string): Promise<Student | null> {
    try {
      return await Student.findOne({
        where: { nebRegistrationNumber }
      });
    } catch (error) {
      logger.error('Error finding student by NEB registration number', { 
        error, 
        nebRegistrationNumber 
      });
      throw error;
    }
  }

  /**
   * Find all students with optional filters and pagination
   * @param filters - Optional filters (class, status, search, etc.)
   * @param options - Pagination and sorting options
   * @returns Array of students and total count
   */
  // eslint-disable-next-line max-lines-per-function
  async findAll(
    filters?: {
      classId?: number;
      gradeLevel?: number;
      section?: string;
      status?: StudentStatus;
      gender?: Gender;
      admissionClass?: number;
      search?: string;
    },
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<{ students: Student[]; total: number }> {
    try {
      const where: WhereOptions<StudentAttributes> = {};
      const classWhere: any = {};

      // Apply filters
      if (filters?.classId) {
        where.currentClassId = filters.classId;
      }

      // Filter by grade level through class relationship
      if (filters?.gradeLevel) {
        classWhere.gradeLevel = filters.gradeLevel;
      }

      // Filter by section through class relationship
      if (filters?.section) {
        classWhere.section = filters.section;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.gender) {
        where.gender = filters.gender;
      }

      if (filters?.admissionClass) {
        where.admissionClass = filters.admissionClass;
      }

      // Full-text search on name fields
      if (filters?.search) {
        where[Op.or as unknown as keyof WhereOptions<StudentAttributes>] = [
          { firstNameEn: { [Op.like]: `%${filters.search}%` } },
          { lastNameEn: { [Op.like]: `%${filters.search}%` } },
          { studentCode: { [Op.like]: `%${filters.search}%` } },
          { email: { [Op.like]: `%${filters.search}%` } }
        ] as unknown as WhereOptions<StudentAttributes>[keyof WhereOptions<StudentAttributes>];
      }

      // Set pagination defaults (default 20, max 100)
      const limit = Math.min(options?.limit || 20, 100);
      const offset = options?.offset || 0;
      const orderBy = options?.orderBy || 'createdAt';
      const orderDirection = options?.orderDirection || 'DESC';

      // Execute query with parameterized filters
      const { rows: students, count: total } = await Student.findAndCountAll({
        where,
        limit,
        offset,
        order: [[orderBy, orderDirection]],
        include: [
          {
            association: 'class',
            attributes: ['classId', 'gradeLevel', 'section'],
            where: Object.keys(classWhere).length > 0 ? classWhere : undefined,
            required: Object.keys(classWhere).length > 0 // Only require join if filtering by class attributes
          }
        ]
      });

      return { students, total };
    } catch (error) {
      logger.error('Error finding all students', { error, filters, options });
      throw error;
    }
  }

  /**
   * Update student by ID
   * @param studentId - Student ID
   * @param updateData - Data to update
   * @param userId - User ID who updated the student
   * @param req - Express request object for audit logging
   * @returns Updated student instance or null
   */
  async update(
    studentId: number, 
    updateData: Partial<StudentAttributes>,
    userId?: number,
    req?: Request
  ): Promise<Student | null> {
    try {
      const student = await Student.findByPk(studentId);
      
      if (!student) {
        return null;
      }

      // Capture old value before update for audit logging
      const oldValue = student.toJSON();

      await student.update(updateData);
      logger.info('Student updated in database', { 
        studentId, 
        updatedFields: Object.keys(updateData) 
      });

      // Capture new value after update
      const newValue = student.toJSON();

      // Log audit entry for update operation
      await auditLogger.logUpdate(
        'student',
        studentId,
        oldValue,
        newValue,
        userId,
        req
      );
      
      return student;
    } catch (error) {
      logger.error('Error updating student', { error, studentId, updateData });
      throw error;
    }
  }

  /**
   * Delete student by ID (soft delete)
   * @param studentId - Student ID
   * @param userId - User ID who deleted the student
   * @param req - Express request object for audit logging
   * @returns True if deleted, false if not found
   */
  async delete(studentId: number, userId?: number, req?: Request): Promise<boolean> {
    try {
      const student = await Student.findByPk(studentId);
      
      if (!student) {
        return false;
      }

      // Capture old value before deletion for audit logging
      const oldValue = student.toJSON();

      await student.destroy(); // Soft delete due to paranoid mode
      logger.info('Student soft deleted', { studentId });

      // Log audit entry for delete operation
      await auditLogger.logDelete(
        'student',
        studentId,
        oldValue,
        userId,
        req
      );
      
      return true;
    } catch (error) {
      logger.error('Error deleting student', { error, studentId });
      throw error;
    }
  }

  /**
   * Permanently delete student by ID (hard delete)
   * @param studentId - Student ID
   * @returns True if deleted, false if not found
   */
  async hardDelete(studentId: number): Promise<boolean> {
    try {
      const student = await Student.findByPk(studentId, { paranoid: false });
      
      if (!student) {
        return false;
      }

      await student.destroy({ force: true });
      logger.info('Student permanently deleted', { studentId });
      
      return true;
    } catch (error) {
      logger.error('Error permanently deleting student', { error, studentId });
      throw error;
    }
  }

  /**
   * Restore soft-deleted student
   * @param studentId - Student ID
   * @param userId - User ID who restored the student
   * @param req - Express request object for audit logging
   * @returns Restored student instance or null
   */
  async restore(studentId: number, userId?: number, req?: Request): Promise<Student | null> {
    try {
      const student = await Student.findByPk(studentId, { paranoid: false });
      
      if (!student || !student.deletedAt) {
        return null;
      }

      await student.restore();
      logger.info('Student restored', { studentId });

      // Log audit entry for restore operation
      await auditLogger.logRestore(
        'student',
        studentId,
        student.toJSON(),
        userId,
        req
      );
      
      return student;
    } catch (error) {
      logger.error('Error restoring student', { error, studentId });
      throw error;
    }
  }

  /**
   * Find students by class ID
   * @param classId - Class ID
   * @param options - Pagination options
   * @returns Array of students and total count
   */
  async findByClassId(
    classId: number,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<{ students: Student[]; total: number }> {
    try {
      const limit = Math.min(options?.limit || 20, 100);
      const offset = options?.offset || 0;
      const orderBy = options?.orderBy || 'rollNumber';
      const orderDirection = options?.orderDirection || 'ASC';

      const { rows: students, count: total } = await Student.findAndCountAll({
        where: { 
          currentClassId: classId,
          status: StudentStatus.ACTIVE
        },
        limit,
        offset,
        order: [[orderBy, orderDirection]]
      });

      return { students, total };
    } catch (error) {
      logger.error('Error finding students by class ID', { error, classId });
      throw error;
    }
  }

  /**
   * Find students by status
   * @param status - Student status
   * @param options - Pagination options
   * @returns Array of students and total count
   */
  async findByStatus(
    status: StudentStatus,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{ students: Student[]; total: number }> {
    try {
      const limit = Math.min(options?.limit || 20, 100);
      const offset = options?.offset || 0;

      const { rows: students, count: total } = await Student.findAndCountAll({
        where: { status },
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      return { students, total };
    } catch (error) {
      logger.error('Error finding students by status', { error, status });
      throw error;
    }
  }

  /**
   * Count students by class ID
   * @param classId - Class ID
   * @returns Count of students
   */
  async countByClassId(classId: number): Promise<number> {
    try {
      return await Student.count({
        where: { 
          currentClassId: classId,
          status: StudentStatus.ACTIVE
        }
      });
    } catch (error) {
      logger.error('Error counting students by class ID', { error, classId });
      throw error;
    }
  }

  /**
   * Count students by status
   * @param status - Student status (optional)
   * @returns Count of students
   */
  async countByStatus(status?: StudentStatus): Promise<number> {
    try {
      const where: WhereOptions<StudentAttributes> = status ? { status } : {};
      return await Student.count({ where });
    } catch (error) {
      logger.error('Error counting students by status', { error, status });
      throw error;
    }
  }

  /**
   * Check if student code exists
   * @param studentCode - Student code to check
   * @param excludeStudentId - Student ID to exclude from check (for updates)
   * @returns True if exists, false otherwise
   */
  async studentCodeExists(studentCode: string, excludeStudentId?: number): Promise<boolean> {
    try {
      const where: WhereOptions<StudentAttributes> = { studentCode };
      
      if (excludeStudentId) {
        where.studentId = { [Op.ne]: excludeStudentId };
      }

      const count = await Student.count({ where });
      return count > 0;
    } catch (error) {
      logger.error('Error checking student code existence', { error, studentCode });
      throw error;
    }
  }

  /**
   * Check if symbol number exists
   * @param symbolNumber - Symbol number to check
   * @param excludeStudentId - Student ID to exclude from check (for updates)
   * @returns True if exists, false otherwise
   */
  async symbolNumberExists(symbolNumber: string, excludeStudentId?: number): Promise<boolean> {
    try {
      const where: WhereOptions<StudentAttributes> = { symbolNumber };
      
      if (excludeStudentId) {
        where.studentId = { [Op.ne]: excludeStudentId };
      }

      const count = await Student.count({ where });
      return count > 0;
    } catch (error) {
      logger.error('Error checking symbol number existence', { error, symbolNumber });
      throw error;
    }
  }

  /**
   * Check if NEB registration number exists
   * @param nebRegistrationNumber - NEB registration number to check
   * @param excludeStudentId - Student ID to exclude from check (for updates)
   * @returns True if exists, false otherwise
   */
  async nebRegistrationNumberExists(
    nebRegistrationNumber: string, 
    excludeStudentId?: number
  ): Promise<boolean> {
    try {
      const where: WhereOptions<StudentAttributes> = { nebRegistrationNumber };
      
      if (excludeStudentId) {
        where.studentId = { [Op.ne]: excludeStudentId };
      }

      const count = await Student.count({ where });
      return count > 0;
    } catch (error) {
      logger.error('Error checking NEB registration number existence', { 
        error, 
        nebRegistrationNumber 
      });
      throw error;
    }
  }

  /**
   * Search students by name (full-text search)
   * @param searchTerm - Search term
   * @param options - Pagination options
   * @returns Array of students and total count
   */
  async searchByName(
    searchTerm: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{ students: Student[]; total: number }> {
    try {
      const limit = Math.min(options?.limit || 20, 100);
      const offset = options?.offset || 0;

      const where: WhereOptions<StudentAttributes> = {
        [Op.or as unknown as keyof WhereOptions<StudentAttributes>]: [
          { firstNameEn: { [Op.like]: `%${searchTerm}%` } },
          { middleNameEn: { [Op.like]: `%${searchTerm}%` } },
          { lastNameEn: { [Op.like]: `%${searchTerm}%` } },
          { firstNameNp: { [Op.like]: `%${searchTerm}%` } },
          { lastNameNp: { [Op.like]: `%${searchTerm}%` } }
        ] as unknown as WhereOptions<StudentAttributes>[keyof WhereOptions<StudentAttributes>]
      };

      const { rows: students, count: total } = await Student.findAndCountAll({
        where,
        limit,
        offset,
        order: [['firstNameEn', 'ASC']]
      });

      return { students, total };
    } catch (error) {
      logger.error('Error searching students by name', { error, searchTerm });
      throw error;
    }
  }

  /**
   * Bulk create students
   * @param studentsData - Array of student creation data
   * @returns Array of created students
   */
  async bulkCreate(studentsData: StudentCreationAttributes[]): Promise<Student[]> {
    try {
      const students = await Student.bulkCreate(studentsData, {
        validate: true,
        individualHooks: true
      });
      
      logger.info('Bulk students created', { count: students.length });
      
      return students;
    } catch (error) {
      logger.error('Error bulk creating students', { error, count: studentsData.length });
      throw error;
    }
  }

  /**
   * Update student status
   * @param studentId - Student ID
   * @param status - New status
   * @param userId - User ID who updated the status
   * @param req - Express request object for audit logging
   * @returns Updated student instance or null
   */
  async updateStatus(
    studentId: number, 
    status: StudentStatus,
    userId?: number,
    req?: Request
  ): Promise<Student | null> {
    try {
      const student = await Student.findByPk(studentId);
      
      if (!student) {
        return null;
      }

      // Capture old value before update
      const oldValue = student.toJSON();

      student.status = status;
      await student.save();
      
      logger.info('Student status updated', { studentId, status });

      // Capture new value after update
      const newValue = student.toJSON();

      // Log audit entry
      await auditLogger.logUpdate(
        'student',
        studentId,
        oldValue,
        newValue,
        userId,
        req
      );
      
      return student;
    } catch (error) {
      logger.error('Error updating student status', { error, studentId, status });
      throw error;
    }
  }

  /**
   * Transfer student to another class
   * @param studentId - Student ID
   * @param newClassId - New class ID
   * @param newRollNumber - New roll number (optional)
   * @param userId - User ID who performed the transfer
   * @param req - Express request object for audit logging
   * @returns Updated student instance or null
   */
  async transferClass(
    studentId: number, 
    newClassId: number, 
    newRollNumber?: number,
    userId?: number,
    req?: Request
  ): Promise<Student | null> {
    try {
      const student = await Student.findByPk(studentId);
      
      if (!student) {
        return null;
      }

      // Capture old value before update
      const oldValue = student.toJSON();

      student.currentClassId = newClassId;
      if (newRollNumber !== undefined) {
        student.rollNumber = newRollNumber;
      }
      await student.save();
      
      logger.info('Student transferred to new class', { 
        studentId, 
        newClassId, 
        newRollNumber 
      });

      // Capture new value after update
      const newValue = student.toJSON();

      // Log audit entry
      await auditLogger.logUpdate(
        'student',
        studentId,
        oldValue,
        newValue,
        userId,
        req
      );
      
      return student;
    } catch (error) {
      logger.error('Error transferring student class', { 
        error, 
        studentId, 
        newClassId 
      });
      throw error;
    }
  }

  /**
   * Get students with pagination metadata
   * @param filters - Optional filters
   * @param page - Page number (1-indexed)
   * @param limit - Items per page (default 20, max 100)
   * @returns Students with pagination metadata
   */
  async findWithPagination(
    filters?: {
      classId?: number;
      status?: StudentStatus;
      search?: string;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{
    students: Student[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    try {
      // Ensure limit doesn't exceed max
      const safeLimit = Math.min(limit, 100);
      const offset = (page - 1) * safeLimit;

      const { students, total } = await this.findAll(filters, {
        limit: safeLimit,
        offset
      });

      return {
        students,
        pagination: {
          page,
          limit: safeLimit,
          total,
          totalPages: Math.ceil(total / safeLimit)
        }
      };
    } catch (error) {
      logger.error('Error finding students with pagination', { error, filters, page, limit });
      throw error;
    }
  }
}

export default new StudentRepository();

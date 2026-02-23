import { Op, WhereOptions } from 'sequelize';
import Staff, { StaffStatus, StaffCategory, EmploymentType, StaffAttributes, StaffCreationAttributes } from '@models/Staff.model';
import { logger } from '@utils/logger';
import auditLogger from '@utils/auditLogger';
import { Request } from 'express';

/**
 * Staff Repository
 * Handles all database operations for Staff entity using parameterized queries
 * with comprehensive audit logging
 * Requirements: 4.1, 4.9, 40.3
 */
class StaffRepository {
  /**
   * Create a new staff member
   * @param staffData - Staff creation data
   * @param userId - User ID who created the staff record
   * @param req - Express request object for audit logging
   * @returns Created staff instance
   */
  async create(
    staffData: StaffCreationAttributes, 
    userId?: number,
    req?: Request
  ): Promise<Staff> {
    try {
      const staff = await Staff.create(staffData);
      logger.info('Staff created in database', { 
        staffId: staff.staffId, 
        staffCode: staff.staffCode 
      });

      // Log audit entry for create operation
      await auditLogger.logCreate(
        'staff',
        staff.staffId,
        staff.toJSON(),
        userId,
        req
      );

      return staff;
    } catch (error) {
      logger.error('Error creating staff', { error, staffData });
      throw error;
    }
  }

  /**
   * Find staff by ID
   * @param staffId - Staff ID
   * @returns Staff instance or null
   */
  async findById(staffId: number): Promise<Staff | null> {
    try {
      return await Staff.findByPk(staffId);
    } catch (error) {
      logger.error('Error finding staff by ID', { error, staffId });
      throw error;
    }
  }

  /**
   * Find staff by staff code
   * @param staffCode - Staff code
   * @returns Staff instance or null
   */
  async findByStaffCode(staffCode: string): Promise<Staff | null> {
    try {
      return await Staff.findOne({
        where: { staffCode }
      });
    } catch (error) {
      logger.error('Error finding staff by staff code', { error, staffCode });
      throw error;
    }
  }

  /**
   * Find staff by employee ID
   * @param employeeId - Employee ID
   * @returns Staff instance or null
   */
  async findByEmployeeId(employeeId: string): Promise<Staff | null> {
    try {
      return await Staff.findOne({
        where: { employeeId }
      });
    } catch (error) {
      logger.error('Error finding staff by employee ID', { error, employeeId });
      throw error;
    }
  }

  /**
   * Find staff by user ID
   * @param userId - User ID
   * @returns Staff instance or null
   */
  async findByUserId(userId: number): Promise<Staff | null> {
    try {
      return await Staff.findOne({
        where: { userId }
      });
    } catch (error) {
      logger.error('Error finding staff by user ID', { error, userId });
      throw error;
    }
  }

  /**
   * Find all staff with optional filters and pagination
   * @param filters - Optional filters (category, status, department, search, etc.)
   * @param options - Pagination and sorting options
   * @returns Array of staff and total count
   */
  // eslint-disable-next-line max-lines-per-function
  async findAll(
    filters?: {
      category?: StaffCategory;
      status?: StaffStatus;
      department?: string;
      employmentType?: EmploymentType;
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

      // Apply filters
      if (filters?.category) {
        where.category = filters.category;
      }

      if (filters?.status) {
        where.status = filters.status;
      }

      if (filters?.department) {
        where.department = filters.department;
      }

      if (filters?.employmentType) {
        where.employmentType = filters.employmentType;
      }

      // Full-text search on name and email fields
      if (filters?.search) {
        where[Op.or as unknown as keyof WhereOptions<StaffAttributes>] = [
          { firstNameEn: { [Op.like]: `%${filters.search}%` } },
          { lastNameEn: { [Op.like]: `%${filters.search}%` } },
          { staffCode: { [Op.like]: `%${filters.search}%` } },
          { email: { [Op.like]: `%${filters.search}%` } },
          { employeeId: { [Op.like]: `%${filters.search}%` } }
        ] as unknown as WhereOptions<StaffAttributes>[keyof WhereOptions<StaffAttributes>];
      }

      // Set pagination defaults (default 20, max 100)
      const limit = Math.min(options?.limit || 20, 100);
      const offset = options?.offset || 0;
      const orderBy = options?.orderBy || 'createdAt';
      const orderDirection = options?.orderDirection || 'DESC';

      // Execute query with parameterized filters
      const { rows: staff, count: total } = await Staff.findAndCountAll({
        where,
        limit,
        offset,
        order: [[orderBy, orderDirection]]
      });

      return { staff, total };
    } catch (error) {
      logger.error('Error finding all staff', { error, filters, options });
      throw error;
    }
  }

  /**
   * Update staff by ID
   * @param staffId - Staff ID
   * @param updateData - Data to update
   * @param userId - User ID who updated the staff record
   * @param req - Express request object for audit logging
   * @returns Updated staff instance or null
   */
  async update(
    staffId: number, 
    updateData: Partial<StaffAttributes>,
    userId?: number,
    req?: Request
  ): Promise<Staff | null> {
    try {
      const staff = await Staff.findByPk(staffId);
      
      if (!staff) {
        return null;
      }

      // Capture old value before update for audit logging
      const oldValue = staff.toJSON();

      await staff.update(updateData);
      logger.info('Staff updated in database', { 
        staffId, 
        updatedFields: Object.keys(updateData) 
      });

      // Capture new value after update
      const newValue = staff.toJSON();

      // Log audit entry for update operation
      await auditLogger.logUpdate(
        'staff',
        staffId,
        oldValue,
        newValue,
        userId,
        req
      );
      
      return staff;
    } catch (error) {
      logger.error('Error updating staff', { error, staffId, updateData });
      throw error;
    }
  }

  /**
   * Delete staff by ID (soft delete)
   * @param staffId - Staff ID
   * @param userId - User ID who deleted the staff record
   * @param req - Express request object for audit logging
   * @returns True if deleted, false if not found
   */
  async delete(staffId: number, userId?: number, req?: Request): Promise<boolean> {
    try {
      const staff = await Staff.findByPk(staffId);
      
      if (!staff) {
        return false;
      }

      // Capture old value before deletion for audit logging
      const oldValue = staff.toJSON();

      await staff.destroy(); // Soft delete due to paranoid mode
      logger.info('Staff soft deleted', { staffId });

      // Log audit entry for delete operation
      await auditLogger.logDelete(
        'staff',
        staffId,
        oldValue,
        userId,
        req
      );
      
      return true;
    } catch (error) {
      logger.error('Error deleting staff', { error, staffId });
      throw error;
    }
  }

  /**
   * Permanently delete staff by ID (hard delete)
   * @param staffId - Staff ID
   * @returns True if deleted, false if not found
   */
  async hardDelete(staffId: number): Promise<boolean> {
    try {
      const staff = await Staff.findByPk(staffId, { paranoid: false });
      
      if (!staff) {
        return false;
      }

      await staff.destroy({ force: true });
      logger.info('Staff permanently deleted', { staffId });
      
      return true;
    } catch (error) {
      logger.error('Error permanently deleting staff', { error, staffId });
      throw error;
    }
  }

  /**
   * Restore soft-deleted staff
   * @param staffId - Staff ID
   * @param userId - User ID who restored the staff record
   * @param req - Express request object for audit logging
   * @returns Restored staff instance or null
   */
  async restore(staffId: number, userId?: number, req?: Request): Promise<Staff | null> {
    try {
      const staff = await Staff.findByPk(staffId, { paranoid: false });
      
      if (!staff || !staff.deletedAt) {
        return null;
      }

      await staff.restore();
      logger.info('Staff restored', { staffId });

      // Log audit entry for restore operation
      await auditLogger.logRestore(
        'staff',
        staffId,
        staff.toJSON(),
        userId,
        req
      );
      
      return staff;
    } catch (error) {
      logger.error('Error restoring staff', { error, staffId });
      throw error;
    }
  }

  /**
   * Find staff by category
   * @param category - Staff category
   * @param options - Pagination options
   * @returns Array of staff and total count
   */
  async findByCategory(
    category: StaffCategory,
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<{ staff: Staff[]; total: number }> {
    try {
      const limit = Math.min(options?.limit || 20, 100);
      const offset = options?.offset || 0;
      const orderBy = options?.orderBy || 'firstNameEn';
      const orderDirection = options?.orderDirection || 'ASC';

      const { rows: staff, count: total } = await Staff.findAndCountAll({
        where: { 
          category,
          status: StaffStatus.ACTIVE
        },
        limit,
        offset,
        order: [[orderBy, orderDirection]]
      });

      return { staff, total };
    } catch (error) {
      logger.error('Error finding staff by category', { error, category });
      throw error;
    }
  }

  /**
   * Find staff by department
   * @param department - Department name
   * @param options - Pagination options
   * @returns Array of staff and total count
   */
  async findByDepartment(
    department: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{ staff: Staff[]; total: number }> {
    try {
      const limit = Math.min(options?.limit || 20, 100);
      const offset = options?.offset || 0;

      const { rows: staff, count: total } = await Staff.findAndCountAll({
        where: { 
          department,
          status: StaffStatus.ACTIVE
        },
        limit,
        offset,
        order: [['firstNameEn', 'ASC']]
      });

      return { staff, total };
    } catch (error) {
      logger.error('Error finding staff by department', { error, department });
      throw error;
    }
  }

  /**
   * Find staff by status
   * @param status - Staff status
   * @param options - Pagination options
   * @returns Array of staff and total count
   */
  async findByStatus(
    status: StaffStatus,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{ staff: Staff[]; total: number }> {
    try {
      const limit = Math.min(options?.limit || 20, 100);
      const offset = options?.offset || 0;

      const { rows: staff, count: total } = await Staff.findAndCountAll({
        where: { status },
        limit,
        offset,
        order: [['createdAt', 'DESC']]
      });

      return { staff, total };
    } catch (error) {
      logger.error('Error finding staff by status', { error, status });
      throw error;
    }
  }

  /**
   * Count staff by category
   * @param category - Staff category (optional)
   * @returns Count of staff
   */
  async countByCategory(category?: StaffCategory): Promise<number> {
    try {
      const where: WhereOptions<StaffAttributes> = category ? { category } : {};
      return await Staff.count({ where });
    } catch (error) {
      logger.error('Error counting staff by category', { error, category });
      throw error;
    }
  }

  /**
   * Count staff by status
   * @param status - Staff status (optional)
   * @returns Count of staff
   */
  async countByStatus(status?: StaffStatus): Promise<number> {
    try {
      const where: WhereOptions<StaffAttributes> = status ? { status } : {};
      return await Staff.count({ where });
    } catch (error) {
      logger.error('Error counting staff by status', { error, status });
      throw error;
    }
  }

  /**
   * Check if staff code exists
   * @param staffCode - Staff code to check
   * @param excludeStaffId - Staff ID to exclude from check (for updates)
   * @returns True if exists, false otherwise
   */
  async staffCodeExists(staffCode: string, excludeStaffId?: number): Promise<boolean> {
    try {
      const where: WhereOptions<StaffAttributes> = { staffCode };
      
      if (excludeStaffId) {
        where.staffId = { [Op.ne]: excludeStaffId };
      }

      const count = await Staff.count({ where });
      return count > 0;
    } catch (error) {
      logger.error('Error checking staff code existence', { error, staffCode });
      throw error;
    }
  }

  /**
   * Check if employee ID exists
   * @param employeeId - Employee ID to check
   * @param excludeStaffId - Staff ID to exclude from check (for updates)
   * @returns True if exists, false otherwise
   */
  async employeeIdExists(employeeId: string, excludeStaffId?: number): Promise<boolean> {
    try {
      const where: WhereOptions<StaffAttributes> = { employeeId };
      
      if (excludeStaffId) {
        where.staffId = { [Op.ne]: excludeStaffId };
      }

      const count = await Staff.count({ where });
      return count > 0;
    } catch (error) {
      logger.error('Error checking employee ID existence', { error, employeeId });
      throw error;
    }
  }

  /**
   * Search staff by name (full-text search)
   * @param searchTerm - Search term
   * @param options - Pagination options
   * @returns Array of staff and total count
   */
  async searchByName(
    searchTerm: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{ staff: Staff[]; total: number }> {
    try {
      const limit = Math.min(options?.limit || 20, 100);
      const offset = options?.offset || 0;

      const where: WhereOptions<StaffAttributes> = {
        [Op.or as unknown as keyof WhereOptions<StaffAttributes>]: [
          { firstNameEn: { [Op.like]: `%${searchTerm}%` } },
          { middleNameEn: { [Op.like]: `%${searchTerm}%` } },
          { lastNameEn: { [Op.like]: `%${searchTerm}%` } },
          { firstNameNp: { [Op.like]: `%${searchTerm}%` } },
          { lastNameNp: { [Op.like]: `%${searchTerm}%` } }
        ] as unknown as WhereOptions<StaffAttributes>[keyof WhereOptions<StaffAttributes>]
      };

      const { rows: staff, count: total } = await Staff.findAndCountAll({
        where,
        limit,
        offset,
        order: [['firstNameEn', 'ASC']]
      });

      return { staff, total };
    } catch (error) {
      logger.error('Error searching staff by name', { error, searchTerm });
      throw error;
    }
  }

  /**
   * Bulk create staff
   * @param staffData - Array of staff creation data
   * @returns Array of created staff
   */
  async bulkCreate(staffData: StaffCreationAttributes[]): Promise<Staff[]> {
    try {
      const staff = await Staff.bulkCreate(staffData, {
        validate: true,
        individualHooks: true
      });
      
      logger.info('Bulk staff created', { count: staff.length });
      
      return staff;
    } catch (error) {
      logger.error('Error bulk creating staff', { error, count: staffData.length });
      throw error;
    }
  }

  /**
   * Update staff status
   * @param staffId - Staff ID
   * @param status - New status
   * @param userId - User ID who updated the status
   * @param req - Express request object for audit logging
   * @returns Updated staff instance or null
   */
  async updateStatus(
    staffId: number, 
    status: StaffStatus,
    userId?: number,
    req?: Request
  ): Promise<Staff | null> {
    try {
      const staff = await Staff.findByPk(staffId);
      
      if (!staff) {
        return null;
      }

      // Capture old value before update
      const oldValue = staff.toJSON();

      staff.status = status;
      await staff.save();
      
      logger.info('Staff status updated', { staffId, status });

      // Capture new value after update
      const newValue = staff.toJSON();

      // Log audit entry
      await auditLogger.logUpdate(
        'staff',
        staffId,
        oldValue,
        newValue,
        userId,
        req
      );
      
      return staff;
    } catch (error) {
      logger.error('Error updating staff status', { error, staffId, status });
      throw error;
    }
  }

  /**
   * Link staff to user account
   * @param staffId - Staff ID
   * @param userId - User ID to link
   * @param adminUserId - Admin user ID who performed the linking
   * @param req - Express request object for audit logging
   * @returns Updated staff instance or null
   */
  async linkToUser(
    staffId: number, 
    userId: number,
    adminUserId?: number,
    req?: Request
  ): Promise<Staff | null> {
    try {
      const staff = await Staff.findByPk(staffId);
      
      if (!staff) {
        return null;
      }

      // Capture old value before update
      const oldValue = staff.toJSON();

      staff.userId = userId;
      await staff.save();
      
      logger.info('Staff linked to user account', { staffId, userId });

      // Capture new value after update
      const newValue = staff.toJSON();

      // Log audit entry
      await auditLogger.logUpdate(
        'staff',
        staffId,
        oldValue,
        newValue,
        adminUserId,
        req
      );
      
      return staff;
    } catch (error) {
      logger.error('Error linking staff to user', { error, staffId, userId });
      throw error;
    }
  }

  /**
   * Get staff with pagination metadata
   * @param filters - Optional filters
   * @param page - Page number (1-indexed)
   * @param limit - Items per page (default 20, max 100)
   * @returns Staff with pagination metadata
   */
  async findWithPagination(
    filters?: {
      category?: StaffCategory;
      status?: StaffStatus;
      department?: string;
      search?: string;
    },
    page: number = 1,
    limit: number = 20
  ): Promise<{
    staff: Staff[];
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

      const { staff, total } = await this.findAll(filters, {
        limit: safeLimit,
        offset
      });

      return {
        staff,
        pagination: {
          page,
          limit: safeLimit,
          total,
          totalPages: Math.ceil(total / safeLimit)
        }
      };
    } catch (error) {
      logger.error('Error finding staff with pagination', { error, filters, page, limit });
      throw error;
    }
  }

  /**
   * Find teaching staff only
   * @param options - Pagination options
   * @returns Array of teaching staff and total count
   */
  async findTeachingStaff(
    options?: {
      limit?: number;
      offset?: number;
    }
  ): Promise<{ staff: Staff[]; total: number }> {
    try {
      return await this.findByCategory(StaffCategory.TEACHING, options);
    } catch (error) {
      logger.error('Error finding teaching staff', { error });
      throw error;
    }
  }

  /**
   * Count active staff
   * @returns Count of active staff
   */
  async countActiveStaff(): Promise<number> {
    try {
      return await this.countByStatus(StaffStatus.ACTIVE);
    } catch (error) {
      logger.error('Error counting active staff', { error });
      throw error;
    }
  }
}

export default new StaffRepository();

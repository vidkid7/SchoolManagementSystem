import { Op, WhereOptions } from 'sequelize';
import { AcademicYear, Term } from '@models/AcademicYear.model';
import { logger } from '@utils/logger';
import auditLogger from '@utils/auditLogger';
import { Request } from 'express';

/**
 * Academic Repository
 * Handles all database operations for AcademicYear and Term entities
 * Requirements: 5.1, 5.2, N4.1
 */
class AcademicRepository {
  // ============ Academic Year Methods ============

  /**
   * Create a new academic year
   * @param data - Academic year creation data
   * @param userId - User ID who created the academic year
   * @param req - Express request object for audit logging
   * @returns Created academic year instance
   */
  async createAcademicYear(
    data: {
      name: string;
      startDateBS: string;
      endDateBS: string;
      startDateAD: Date;
      endDateAD: Date;
      isCurrent?: boolean;
    },
    userId?: number,
    req?: Request
  ): Promise<AcademicYear> {
    try {
      // If setting as current, unset other current years
      if (data.isCurrent) {
        await AcademicYear.update({ isCurrent: false }, { where: {} });
      }

      const academicYear = await AcademicYear.create(data);
      logger.info('Academic year created in database', {
        academicYearId: academicYear.academicYearId,
        name: academicYear.name
      });

      // Log audit entry for create operation
      await auditLogger.logCreate(
        'academic_year',
        academicYear.academicYearId,
        academicYear.toJSON(),
        userId,
        req
      );

      return academicYear;
    } catch (error) {
      logger.error('Error creating academic year', { error, data });
      throw error;
    }
  }

  /**
   * Find academic year by ID
   * @param academicYearId - Academic year ID
   * @returns Academic year instance or null
   */
  async findAcademicYearById(academicYearId: number): Promise<AcademicYear | null> {
    try {
      return await AcademicYear.findByPk(academicYearId);
    } catch (error) {
      logger.error('Error finding academic year by ID', { error, academicYearId });
      throw error;
    }
  }

  /**
   * Find all academic years
   * @param options - Sorting options
   * @returns Array of academic years
   */
  async findAllAcademicYears(options?: {
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<AcademicYear[]> {
    try {
      const orderBy = options?.orderBy || 'startDateAD';
      const orderDirection = options?.orderDirection || 'DESC';

      return await AcademicYear.findAll({
        order: [[orderBy, orderDirection]]
      });
    } catch (error) {
      logger.error('Error finding all academic years', { error });
      throw error;
    }
  }

  /**
   * Find current academic year
   * @returns Current academic year instance or null
   */
  async findCurrentAcademicYear(): Promise<AcademicYear | null> {
    try {
      return await AcademicYear.findOne({
        where: { isCurrent: true }
      });
    } catch (error) {
      logger.error('Error finding current academic year', { error });
      throw error;
    }
  }

  /**
   * Update academic year by ID
   * @param academicYearId - Academic year ID
   * @param updateData - Data to update
   * @param userId - User ID who updated the academic year
   * @param req - Express request object for audit logging
   * @returns Updated academic year instance or null
   */
  async updateAcademicYear(
    academicYearId: number,
    updateData: Partial<{
      name: string;
      startDateBS: string;
      endDateBS: string;
      startDateAD: Date;
      endDateAD: Date;
      isCurrent: boolean;
    }>,
    userId?: number,
    req?: Request
  ): Promise<AcademicYear | null> {
    try {
      const academicYear = await AcademicYear.findByPk(academicYearId);

      if (!academicYear) {
        return null;
      }

      // Capture old value before update for audit logging
      const oldValue = academicYear.toJSON();

      // If setting as current, unset other current years
      if (updateData.isCurrent) {
        await AcademicYear.update({ isCurrent: false }, { where: {} });
      }

      await academicYear.update(updateData);
      logger.info('Academic year updated in database', {
        academicYearId,
        updatedFields: Object.keys(updateData)
      });

      // Capture new value after update
      const newValue = academicYear.toJSON();

      // Log audit entry for update operation
      await auditLogger.logUpdate(
        'academic_year',
        academicYearId,
        oldValue,
        newValue,
        userId,
        req
      );

      return academicYear;
    } catch (error) {
      logger.error('Error updating academic year', { error, academicYearId, updateData });
      throw error;
    }
  }

  /**
   * Set an academic year as current
   * @param academicYearId - Academic year ID to set as current
   * @param userId - User ID who performed the action
   * @param req - Express request object for audit logging
   * @returns Updated academic year instance or null
   */
  async setCurrentAcademicYear(
    academicYearId: number,
    userId?: number,
    req?: Request
  ): Promise<AcademicYear | null> {
    try {
      // Unset all current years
      await AcademicYear.update({ isCurrent: false }, { where: {} });

      // Set the specified year as current
      const academicYear = await AcademicYear.findByPk(academicYearId);
      if (!academicYear) {
        return null;
      }

      const oldValue = academicYear.toJSON();
      await academicYear.update({ isCurrent: true });
      const newValue = academicYear.toJSON();

      logger.info('Academic year set as current', { academicYearId });

      // Log audit entry
      await auditLogger.logUpdate(
        'academic_year',
        academicYearId,
        oldValue,
        newValue,
        userId,
        req
      );

      return academicYear;
    } catch (error) {
      logger.error('Error setting current academic year', { error, academicYearId });
      throw error;
    }
  }

  /**
   * Delete academic year by ID (soft delete)
   * @param academicYearId - Academic year ID
   * @param userId - User ID who deleted the academic year
   * @param req - Express request object for audit logging
   * @returns True if deleted, false if not found
   */
  async deleteAcademicYear(
    academicYearId: number,
    userId?: number,
    req?: Request
  ): Promise<boolean> {
    try {
      const academicYear = await AcademicYear.findByPk(academicYearId);

      if (!academicYear) {
        return false;
      }

      // Capture old value before deletion for audit logging
      const oldValue = academicYear.toJSON();

      await academicYear.destroy(); // Soft delete
      logger.info('Academic year soft deleted', { academicYearId });

      // Log audit entry for delete operation
      await auditLogger.logDelete(
        'academic_year',
        academicYearId,
        oldValue,
        userId,
        req
      );

      return true;
    } catch (error) {
      logger.error('Error deleting academic year', { error, academicYearId });
      throw error;
    }
  }

  /**
   * Check if academic year name exists
   * @param name - Academic year name to check
   * @param excludeAcademicYearId - Academic year ID to exclude from check (for updates)
   * @returns True if exists, false otherwise
   */
  async academicYearNameExists(name: string, excludeAcademicYearId?: number): Promise<boolean> {
    try {
      const where: WhereOptions = { name };

      if (excludeAcademicYearId) {
        where.academicYearId = { [Op.ne]: excludeAcademicYearId };
      }

      const count = await AcademicYear.count({ where });
      return count > 0;
    } catch (error) {
      logger.error('Error checking academic year name existence', { error, name });
      throw error;
    }
  }

  // ============ Term Methods ============

  /**
   * Create a new term
   * @param data - Term creation data
   * @param userId - User ID who created the term
   * @param req - Express request object for audit logging
   * @returns Created term instance
   */
  async createTerm(
    data: {
      academicYearId: number;
      name: string;
      startDate: Date;
      endDate: Date;
      examStartDate?: Date;
      examEndDate?: Date;
    },
    userId?: number,
    req?: Request
  ): Promise<Term> {
    try {
      const term = await Term.create(data);
      logger.info('Term created in database', {
        termId: term.termId,
        name: term.name,
        academicYearId: term.academicYearId
      });

      // Log audit entry for create operation
      await auditLogger.logCreate(
        'term',
        term.termId,
        term.toJSON(),
        userId,
        req
      );

      return term;
    } catch (error) {
      logger.error('Error creating term', { error, data });
      throw error;
    }
  }

  /**
   * Find term by ID
   * @param termId - Term ID
   * @returns Term instance or null
   */
  async findTermById(termId: number): Promise<Term | null> {
    try {
      return await Term.findByPk(termId);
    } catch (error) {
      logger.error('Error finding term by ID', { error, termId });
      throw error;
    }
  }

  /**
   * Find all terms by academic year ID
   * @param academicYearId - Academic year ID
   * @param options - Sorting options
   * @returns Array of terms
   */
  async findTermsByAcademicYear(
    academicYearId: number,
    options?: {
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<Term[]> {
    try {
      const orderBy = options?.orderBy || 'startDate';
      const orderDirection = options?.orderDirection || 'ASC';

      return await Term.findAll({
        where: { academicYearId },
        order: [[orderBy, orderDirection]]
      });
    } catch (error) {
      logger.error('Error finding terms by academic year', { error, academicYearId });
      throw error;
    }
  }

  /**
   * Find all terms
   * @param options - Sorting options
   * @returns Array of terms
   */
  async findAllTerms(options?: {
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  }): Promise<Term[]> {
    try {
      const orderBy = options?.orderBy || 'startDate';
      const orderDirection = options?.orderDirection || 'ASC';

      return await Term.findAll({
        order: [[orderBy, orderDirection]]
      });
    } catch (error) {
      logger.error('Error finding all terms', { error });
      throw error;
    }
  }

  /**
   * Update term by ID
   * @param termId - Term ID
   * @param updateData - Data to update
   * @param userId - User ID who updated the term
   * @param req - Express request object for audit logging
   * @returns Updated term instance or null
   */
  async updateTerm(
    termId: number,
    updateData: Partial<{
      name: string;
      startDate: Date;
      endDate: Date;
      examStartDate?: Date;
      examEndDate?: Date;
    }>,
    userId?: number,
    req?: Request
  ): Promise<Term | null> {
    try {
      const term = await Term.findByPk(termId);

      if (!term) {
        return null;
      }

      // Capture old value before update for audit logging
      const oldValue = term.toJSON();

      await term.update(updateData);
      logger.info('Term updated in database', {
        termId,
        updatedFields: Object.keys(updateData)
      });

      // Capture new value after update
      const newValue = term.toJSON();

      // Log audit entry for update operation
      await auditLogger.logUpdate(
        'term',
        termId,
        oldValue,
        newValue,
        userId,
        req
      );

      return term;
    } catch (error) {
      logger.error('Error updating term', { error, termId, updateData });
      throw error;
    }
  }

  /**
   * Delete term by ID (soft delete)
   * @param termId - Term ID
   * @param userId - User ID who deleted the term
   * @param req - Express request object for audit logging
   * @returns True if deleted, false if not found
   */
  async deleteTerm(termId: number, userId?: number, req?: Request): Promise<boolean> {
    try {
      const term = await Term.findByPk(termId);

      if (!term) {
        return false;
      }

      // Capture old value before deletion for audit logging
      const oldValue = term.toJSON();

      await term.destroy(); // Soft delete
      logger.info('Term soft deleted', { termId });

      // Log audit entry for delete operation
      await auditLogger.logDelete(
        'term',
        termId,
        oldValue,
        userId,
        req
      );

      return true;
    } catch (error) {
      logger.error('Error deleting term', { error, termId });
      throw error;
    }
  }

  /**
   * Count terms by academic year ID
   * @param academicYearId - Academic year ID
   * @returns Count of terms
   */
  async countTermsByAcademicYear(academicYearId: number): Promise<number> {
    try {
      return await Term.count({
        where: { academicYearId }
      });
    } catch (error) {
      logger.error('Error counting terms by academic year', { error, academicYearId });
      throw error;
    }
  }

  /**
   * Find academic year with its terms
   * @param academicYearId - Academic year ID
   * @returns Academic year with terms or null
   */
  async findAcademicYearWithTerms(academicYearId: number): Promise<AcademicYear | null> {
    try {
      return await AcademicYear.findByPk(academicYearId, {
        include: [
          {
            model: Term,
            as: 'terms',
            order: [['startDate', 'ASC']]
          }
        ]
      });
    } catch (error) {
      logger.error('Error finding academic year with terms', { error, academicYearId });
      throw error;
    }
  }
}

export default new AcademicRepository();

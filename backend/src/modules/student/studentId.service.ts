import { Op, QueryTypes, Transaction } from 'sequelize';
import sequelize from '@config/database';
import { env } from '@config/env';
import { logger } from '@utils/logger';
import Student from '@models/Student.model';

/**
 * Student ID Generation Service
 * Generates unique student IDs with format: {school_prefix}-{admission_year}-{sequential_number}
 * Requirements: 2.2
 * 
 * Features:
 * - Thread-safe ID generation using database transactions
 * - Automatic sequential numbering per admission year
 * - Configurable school prefix from environment
 * - Handles concurrent ID generation safely
 */
class StudentIdService {
  private sequenceTableEnsured = false;

  private getCodePrefix(admissionYear: number): string {
    return `${env.DEFAULT_SCHOOL_CODE}-${admissionYear}-`;
  }

  private async ensureSequenceTable(): Promise<void> {
    if (this.sequenceTableEnsured) return;

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS student_id_sequences (
        admission_year INT UNSIGNED NOT NULL PRIMARY KEY,
        last_sequence INT UNSIGNED NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    this.sequenceTableEnsured = true;
  }

  private extractMaxSequentialNumber(studentCodes: string[], codePrefix: string): number {
    return studentCodes.reduce((max, studentCode) => {
      if (!studentCode.startsWith(codePrefix)) {
        return max;
      }

      const suffix = studentCode.slice(codePrefix.length);
      const sequentialNumber = /^\d+$/.test(suffix) ? Number(suffix) : 0;
      return Math.max(max, sequentialNumber);
    }, 0);
  }

  private async getHighestSequentialNumber(
    admissionYear: number,
    transaction?: Transaction
  ): Promise<number> {
    const codePrefix = this.getCodePrefix(admissionYear);

    const students = await Student.findAll({
      where: {
        studentCode: {
          [Op.like]: `${codePrefix}%`
        }
      },
      attributes: ['studentCode'],
      lock: transaction ? transaction.LOCK.UPDATE : undefined,
      paranoid: false,
      transaction
    });

    return this.extractMaxSequentialNumber(
      students.map(student => student.studentCode),
      codePrefix
    );
  }

  private async getReservedSequentialNumber(
    admissionYear: number,
    transaction?: Transaction
  ): Promise<number> {
    await this.ensureSequenceTable();

    const lockClause = transaction ? ' FOR UPDATE' : '';
    const rows = await sequelize.query<{ last_sequence: number }>(
      `SELECT last_sequence FROM student_id_sequences WHERE admission_year = :admissionYear${lockClause}`,
      {
        replacements: { admissionYear },
        type: QueryTypes.SELECT,
        transaction
      }
    );

    return Number(rows[0]?.last_sequence ?? 0);
  }

  private async reserveSequentialNumber(
    admissionYear: number,
    transaction: Transaction
  ): Promise<number> {
    await this.ensureSequenceTable();

    await sequelize.query(
      `INSERT IGNORE INTO student_id_sequences
        (admission_year, last_sequence, created_at, updated_at)
       VALUES
        (:admissionYear, 0, NOW(), NOW())`,
      {
        replacements: { admissionYear },
        transaction
      }
    );

    const existingMax = await this.getHighestSequentialNumber(admissionYear, transaction);
    const reservedMax = await this.getReservedSequentialNumber(admissionYear, transaction);
    const sequentialNumber = Math.max(existingMax, reservedMax) + 1;

    await sequelize.query(
      `UPDATE student_id_sequences
       SET last_sequence = :sequentialNumber, updated_at = NOW()
       WHERE admission_year = :admissionYear`,
      {
        replacements: { admissionYear, sequentialNumber },
        transaction
      }
    );

    return sequentialNumber;
  }

  private async acquireSequenceLock(
    admissionYear: number,
    transaction: Transaction
  ): Promise<void> {
    const lockName = `student_id_sequence_${admissionYear}`;
    const rows = await sequelize.query<{ acquired: number }>(
      'SELECT GET_LOCK(:lockName, 10) AS acquired',
      {
        replacements: { lockName },
        type: QueryTypes.SELECT,
        transaction
      }
    );

    if (Number(rows[0]?.acquired) !== 1) {
      throw new Error(`Could not acquire student ID sequence lock for ${admissionYear}`);
    }
  }

  private async releaseSequenceLock(
    admissionYear: number,
    transaction: Transaction
  ): Promise<void> {
    const lockName = `student_id_sequence_${admissionYear}`;
    await sequelize.query('SELECT RELEASE_LOCK(:lockName)', {
      replacements: { lockName },
      transaction
    });
  }

  async resetSequencesForTesting(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('resetSequencesForTesting can only run in test environment');
    }

    await this.ensureSequenceTable();
    await sequelize.query('DELETE FROM student_id_sequences');
  }

  /**
   * Generate a unique student ID
   * Format: {school_prefix}-{admission_year}-{sequential_number}
   * Example: SCH001-2024-0001
   * 
   * @param admissionDate - Date of admission
   * @param transaction - Optional database transaction for atomicity
   * @returns Generated unique student ID
   */
  async generateStudentId(admissionDate: Date, transaction?: Transaction): Promise<string> {
    try {
      const schoolPrefix = env.DEFAULT_SCHOOL_CODE;
      const admissionYear = admissionDate.getFullYear();
      await this.ensureSequenceTable();

      // Use transaction to ensure thread-safety
      const t = transaction || await sequelize.transaction();

      try {
        await this.acquireSequenceLock(admissionYear, t);

        let sequentialNumber: number;
        try {
          sequentialNumber = await this.reserveSequentialNumber(admissionYear, t);
        } finally {
          await this.releaseSequenceLock(admissionYear, t);
        }

        // Format sequential number with leading zeros (4 digits)
        const formattedSeqNum = sequentialNumber.toString().padStart(4, '0');
        
        // Generate student ID
        const studentId = `${schoolPrefix}-${admissionYear}-${formattedSeqNum}`;

        // Commit transaction if we created it
        if (!transaction) {
          await t.commit();
        }

        logger.info('Student ID generated', { 
          studentId, 
          admissionYear, 
          sequentialNumber 
        });

        return studentId;
      } catch (error) {
        // Rollback transaction if we created it
        if (!transaction) {
          await t.rollback();
        }
        throw error;
      }
    } catch (error) {
      logger.error('Error generating student ID', { error, admissionDate });
      throw new Error('Failed to generate student ID');
    }
  }

  /**
   * Validate student ID format
   * @param studentId - Student ID to validate
   * @returns True if valid, false otherwise
   */
  validateStudentIdFormat(studentId: string): boolean {
    // Format: PREFIX-YEAR-SEQNUM
    // Example: SCH001-2024-0001
    const pattern = /^[A-Z0-9]+-\d{4}-\d{4}$/;
    return pattern.test(studentId);
  }

  /**
   * Parse student ID components
   * @param studentId - Student ID to parse
   * @returns Object with prefix, year, and sequential number
   */
  parseStudentId(studentId: string): { 
    prefix: string; 
    year: number; 
    sequentialNumber: number 
  } | null {
    if (!this.validateStudentIdFormat(studentId)) {
      return null;
    }

    const parts = studentId.split('-');
    return {
      prefix: parts[0],
      year: parseInt(parts[1], 10),
      sequentialNumber: parseInt(parts[2], 10)
    };
  }

  /**
   * Get next available sequential number for a given year
   * @param admissionYear - Admission year
   * @returns Next sequential number
   */
  async getNextSequentialNumber(admissionYear: number): Promise<number> {
    try {
      const [existingMax, reservedMax] = await Promise.all([
        this.getHighestSequentialNumber(admissionYear),
        this.getReservedSequentialNumber(admissionYear)
      ]);
      return Math.max(existingMax, reservedMax) + 1;
    } catch (error) {
      logger.error('Error getting next sequential number', { error, admissionYear });
      throw error;
    }
  }

  /**
   * Count students admitted in a specific year
   * @param admissionYear - Admission year
   * @returns Count of students
   */
  async countStudentsByAdmissionYear(admissionYear: number): Promise<number> {
    try {
      return await Student.count({
        where: sequelize.where(
          sequelize.fn('YEAR', sequelize.col('admission_date')),
          admissionYear
        )
      });
    } catch (error) {
      logger.error('Error counting students by admission year', { error, admissionYear });
      throw error;
    }
  }
}

export default new StudentIdService();


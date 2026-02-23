import { Transaction, Op } from 'sequelize';
import sequelize from '../../config/database';
import ArchiveMetadata from '../../models/ArchiveMetadata.model';
import auditLogger from '../../utils/auditLogger';
import { AuditAction } from '../../models/AuditLog.model';

interface ArchiveOptions {
  academicYearId: number;
  academicYearName: string;
  userId: number;
}

interface RestoreOptions {
  archiveId: number;
  userId: number;
}

interface ArchiveResult {
  archiveId: number;
  status: string;
  recordCounts: Record<string, number>;
  message: string;
}

class ArchiveService {
  /**
   * Archive completed academic year data
   * Requirements: 40.4, 40.5
   */
  async archiveAcademicYear(options: ArchiveOptions): Promise<ArchiveResult> {
    const { academicYearId, academicYearName, userId } = options;
    let transaction: Transaction | undefined;

    try {
      // Start transaction
      transaction = await sequelize.transaction();

      // Check if academic year is already archived
      const existingArchive = await ArchiveMetadata.findOne({
        where: {
          academic_year_id: academicYearId,
          status: 'completed',
        },
      });

      if (existingArchive) {
        throw new Error('Academic year is already archived');
      }

      // Create archive metadata with 10-year retention
      const retentionDate = new Date();
      retentionDate.setFullYear(retentionDate.getFullYear() + 10);

      const archiveMetadata = await ArchiveMetadata.create(
        {
          academic_year_id: academicYearId,
          academic_year_name: academicYearName,
          archived_at: new Date(),
          archived_by: userId,
          status: 'in_progress',
          retention_until: retentionDate,
        },
        { transaction }
      );

      const recordCounts: Record<string, number> = {};
      const tablesArchived: string[] = [];

      // Archive students enrolled in this academic year
      const studentsResult = await sequelize.query(
        `
        INSERT INTO archived_students (archive_id, original_id, student_data, created_at)
        SELECT 
          :archiveId,
          s.id,
          JSON_OBJECT(
            'id', s.id,
            'student_id', s.student_id,
            'first_name_en', s.first_name_en,
            'middle_name_en', s.middle_name_en,
            'last_name_en', s.last_name_en,
            'first_name_np', s.first_name_np,
            'middle_name_np', s.middle_name_np,
            'last_name_np', s.last_name_np,
            'date_of_birth_bs', s.date_of_birth_bs,
            'date_of_birth_ad', s.date_of_birth_ad,
            'gender', s.gender,
            'blood_group', s.blood_group,
            'address_en', s.address_en,
            'address_np', s.address_np,
            'phone', s.phone,
            'email', s.email,
            'father_name', s.father_name,
            'father_phone', s.father_phone,
            'mother_name', s.mother_name,
            'mother_phone', s.mother_phone,
            'admission_date', s.admission_date,
            'admission_class', s.admission_class,
            'current_class', s.current_class,
            'current_section', s.current_section,
            'roll_number', s.roll_number,
            'status', s.status
          ),
          NOW()
        FROM students s
        INNER JOIN academic_history ah ON s.id = ah.student_id
        WHERE ah.academic_year_id = :academicYearId
        `,
        {
          replacements: { archiveId: archiveMetadata.id, academicYearId },
          transaction,
        }
      );
      recordCounts.students = (studentsResult[0] as any).affectedRows || 0;
      tablesArchived.push('students');

      // Archive attendance records
      const attendanceResult = await sequelize.query(
        `
        INSERT INTO archived_attendance (archive_id, original_id, attendance_data, created_at)
        SELECT 
          :archiveId,
          a.id,
          JSON_OBJECT(
            'id', a.id,
            'student_id', a.student_id,
            'class_id', a.class_id,
            'date', a.date,
            'date_bs', a.date_bs,
            'status', a.status,
            'period_number', a.period_number,
            'marked_by', a.marked_by,
            'marked_at', a.marked_at,
            'remarks', a.remarks
          ),
          NOW()
        FROM attendance a
        INNER JOIN classes c ON a.class_id = c.id
        WHERE c.academic_year_id = :academicYearId
        `,
        {
          replacements: { archiveId: archiveMetadata.id, academicYearId },
          transaction,
        }
      );
      recordCounts.attendance = (attendanceResult[0] as any).affectedRows || 0;
      tablesArchived.push('attendance');

      // Archive exams
      const examsResult = await sequelize.query(
        `
        INSERT INTO archived_exams (archive_id, original_id, exam_data, created_at)
        SELECT 
          :archiveId,
          e.id,
          JSON_OBJECT(
            'id', e.id,
            'name', e.name,
            'type', e.type,
            'subject_id', e.subject_id,
            'class_id', e.class_id,
            'exam_date', e.exam_date,
            'duration', e.duration,
            'full_marks', e.full_marks,
            'pass_marks', e.pass_marks,
            'theory_marks', e.theory_marks,
            'practical_marks', e.practical_marks,
            'weightage', e.weightage,
            'status', e.status
          ),
          NOW()
        FROM exams e
        WHERE e.academic_year_id = :academicYearId
        `,
        {
          replacements: { archiveId: archiveMetadata.id, academicYearId },
          transaction,
        }
      );
      recordCounts.exams = (examsResult[0] as any).affectedRows || 0;
      tablesArchived.push('exams');

      // Archive grades
      const gradesResult = await sequelize.query(
        `
        INSERT INTO archived_grades (archive_id, original_id, grade_data, created_at)
        SELECT 
          :archiveId,
          g.id,
          JSON_OBJECT(
            'id', g.id,
            'exam_id', g.exam_id,
            'student_id', g.student_id,
            'theory_marks', g.theory_marks,
            'practical_marks', g.practical_marks,
            'total_marks', g.total_marks,
            'grade', g.grade,
            'grade_point', g.grade_point,
            'remarks', g.remarks,
            'entered_by', g.entered_by,
            'entered_at', g.entered_at
          ),
          NOW()
        FROM grades g
        INNER JOIN exams e ON g.exam_id = e.id
        WHERE e.academic_year_id = :academicYearId
        `,
        {
          replacements: { archiveId: archiveMetadata.id, academicYearId },
          transaction,
        }
      );
      recordCounts.grades = (gradesResult[0] as any).affectedRows || 0;
      tablesArchived.push('grades');

      // Archive invoices
      const invoicesResult = await sequelize.query(
        `
        INSERT INTO archived_invoices (archive_id, original_id, invoice_data, created_at)
        SELECT 
          :archiveId,
          i.id,
          JSON_OBJECT(
            'id', i.id,
            'invoice_number', i.invoice_number,
            'student_id', i.student_id,
            'fee_structure_id', i.fee_structure_id,
            'due_date', i.due_date,
            'subtotal', i.subtotal,
            'discount', i.discount,
            'discount_reason', i.discount_reason,
            'total_amount', i.total_amount,
            'paid_amount', i.paid_amount,
            'balance', i.balance,
            'status', i.status,
            'generated_at', i.generated_at
          ),
          NOW()
        FROM invoices i
        WHERE i.academic_year_id = :academicYearId
        `,
        {
          replacements: { archiveId: archiveMetadata.id, academicYearId },
          transaction,
        }
      );
      recordCounts.invoices = (invoicesResult[0] as any).affectedRows || 0;
      tablesArchived.push('invoices');

      // Archive payments
      const paymentsResult = await sequelize.query(
        `
        INSERT INTO archived_payments (archive_id, original_id, payment_data, created_at)
        SELECT 
          :archiveId,
          p.id,
          JSON_OBJECT(
            'id', p.id,
            'receipt_number', p.receipt_number,
            'invoice_id', p.invoice_id,
            'student_id', p.student_id,
            'amount', p.amount,
            'payment_method', p.payment_method,
            'payment_date', p.payment_date,
            'transaction_id', p.transaction_id,
            'received_by', p.received_by,
            'remarks', p.remarks,
            'status', p.status
          ),
          NOW()
        FROM payments p
        INNER JOIN invoices i ON p.invoice_id = i.id
        WHERE i.academic_year_id = :academicYearId
        `,
        {
          replacements: { archiveId: archiveMetadata.id, academicYearId },
          transaction,
        }
      );
      recordCounts.payments = (paymentsResult[0] as any).affectedRows || 0;
      tablesArchived.push('payments');

      // Update archive metadata with results
      await archiveMetadata.update(
        {
          status: 'completed',
          tables_archived: tablesArchived,
          record_counts: recordCounts,
        },
        { transaction }
      );

      // Commit transaction
      await transaction.commit();

      // Log audit event
      await auditLogger.log({
        userId,
        entityType: 'archive',
        entityId: archiveMetadata.id,
        action: AuditAction.CREATE,
        newValue: {
          academic_year_id: academicYearId,
          academic_year_name: academicYearName,
          record_counts: recordCounts,
        },
        ipAddress: '',
        userAgent: '',
      });

      return {
        archiveId: archiveMetadata.id,
        status: 'completed',
        recordCounts,
        message: `Successfully archived ${academicYearName}`,
      };
    } catch (error) {
      // Rollback transaction on error
      if (transaction) {
        await transaction.rollback();
      }

      // Log error
      console.error('Archive error:', error);

      throw error;
    }
  }

  /**
   * Restore archived academic year data
   * Requirements: 40.6
   */
  async restoreArchivedData(options: RestoreOptions): Promise<ArchiveResult> {
    const { archiveId, userId } = options;
    let transaction: Transaction | undefined;

    try {
      // Start transaction
      transaction = await sequelize.transaction();

      // Get archive metadata
      const archiveMetadata = await ArchiveMetadata.findByPk(archiveId, { transaction });

      if (!archiveMetadata) {
        throw new Error('Archive not found');
      }

      if (archiveMetadata.status !== 'completed') {
        throw new Error('Can only restore completed archives');
      }

      const recordCounts: Record<string, number> = {};

      // Restore students (only if they don't exist)
      const studentsResult = await sequelize.query(
        `
        INSERT IGNORE INTO students (
          id, student_id, first_name_en, middle_name_en, last_name_en,
          first_name_np, middle_name_np, last_name_np,
          date_of_birth_bs, date_of_birth_ad, gender, blood_group,
          address_en, address_np, phone, email,
          father_name, father_phone, mother_name, mother_phone,
          admission_date, admission_class, current_class, current_section,
          roll_number, status, created_at, updated_at
        )
        SELECT 
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.id')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.student_id')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.first_name_en')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.middle_name_en')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.last_name_en')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.first_name_np')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.middle_name_np')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.last_name_np')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.date_of_birth_bs')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.date_of_birth_ad')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.gender')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.blood_group')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.address_en')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.address_np')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.phone')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.email')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.father_name')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.father_phone')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.mother_name')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.mother_phone')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.admission_date')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.admission_class')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.current_class')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.current_section')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.roll_number')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.status')),
          NOW(),
          NOW()
        FROM archived_students
        WHERE archive_id = :archiveId
        `,
        {
          replacements: { archiveId },
          transaction,
        }
      );
      recordCounts.students = (studentsResult[0] as any).affectedRows || 0;

      // Update archive metadata
      await archiveMetadata.update(
        {
          status: 'restored',
        },
        { transaction }
      );

      // Commit transaction
      await transaction.commit();

      // Log audit event
      await auditLogger.log({
        userId,
        entityType: 'archive',
        entityId: archiveId,
        action: AuditAction.RESTORE,
        newValue: {
          academic_year_name: archiveMetadata.academic_year_name,
          record_counts: recordCounts,
        },
        ipAddress: '',
        userAgent: '',
      });

      return {
        archiveId,
        status: 'restored',
        recordCounts,
        message: `Successfully restored ${archiveMetadata.academic_year_name}`,
      };
    } catch (error) {
      // Rollback transaction on error
      if (transaction) {
        await transaction.rollback();
      }

      console.error('Restore error:', error);
      throw error;
    }
  }

  /**
   * Get list of archives
   */
  async getArchives(filters?: {
    status?: string;
    academicYearId?: number;
  }): Promise<ArchiveMetadata[]> {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.academicYearId) {
      where.academic_year_id = filters.academicYearId;
    }

    return ArchiveMetadata.findAll({
      where,
      order: [['archived_at', 'DESC']],
    });
  }

  /**
   * Get archive details
   */
  async getArchiveById(archiveId: number): Promise<ArchiveMetadata | null> {
    return ArchiveMetadata.findByPk(archiveId);
  }

  /**
   * Delete expired archives based on retention policy
   * Requirements: 40.7
   */
  async deleteExpiredArchives(userId: number): Promise<number> {
    const now = new Date();

    // Find expired archives
    const expiredArchives = await ArchiveMetadata.findAll({
      where: {
        retention_until: {
          [Op.lt]: now,
        },
        status: 'completed',
      },
    });

    let deletedCount = 0;

    for (const archive of expiredArchives) {
      try {
        // Delete archive and all related data (CASCADE will handle related tables)
        await archive.destroy();
        deletedCount++;

        // Log audit event
        await auditLogger.log({
          userId,
          entityType: 'archive',
          entityId: archive.id,
          action: AuditAction.DELETE,
          oldValue: {
            academic_year_name: archive.academic_year_name,
            retention_until: archive.retention_until,
          },
          ipAddress: '',
          userAgent: '',
        });
      } catch (error) {
        console.error(`Failed to delete archive ${archive.id}:`, error);
      }
    }

    return deletedCount;
  }
}

export default new ArchiveService();

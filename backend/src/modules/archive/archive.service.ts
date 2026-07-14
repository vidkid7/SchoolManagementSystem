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
  private getAffectedRows(queryResult: unknown): number {
    const [result, metadata] = Array.isArray(queryResult) ? queryResult : [queryResult, undefined];
    return Number((result as any)?.affectedRows ?? (metadata as any)?.affectedRows ?? 0);
  }

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
      const now = new Date();
      const retentionDate = new Date();
      retentionDate.setFullYear(retentionDate.getFullYear() + 10);

      const archiveMetadata = await ArchiveMetadata.create(
        {
          academic_year_id: academicYearId,
          academic_year_name: academicYearName,
          archived_at: now,
          archived_by: userId,
          status: 'in_progress',
          retention_until: retentionDate,
          created_at: now,
          updated_at: now,
        },
        { transaction }
      );
      let archiveId = Number(
        archiveMetadata.getDataValue('id') ??
        archiveMetadata.get('id') ??
        (archiveMetadata as any).id
      );

      if (!archiveId) {
        const [rows] = await sequelize.query(
          `
          SELECT id
          FROM archive_metadata
          WHERE academic_year_id = :academicYearId
            AND archived_by = :userId
          ORDER BY id DESC
          LIMIT 1
          `,
          {
            replacements: { academicYearId, userId },
            transaction,
          }
        );
        archiveId = Number((rows as any[])[0]?.id);
      }

      if (!archiveId) {
        throw new Error('Archive metadata was created without a retrievable ID');
      }

      const recordCounts: Record<string, number> = {};
      const tablesArchived: string[] = [];

      // Archive students enrolled in this academic year
      const studentsResult = await sequelize.query(
        `
        INSERT INTO archived_students (archive_id, original_id, student_data, created_at)
        SELECT 
          :archiveId,
          s.student_id,
          JSON_OBJECT(
            'student_id', s.student_id,
            'user_id', s.user_id,
            'student_code', s.student_code,
            'symbol_number', s.symbol_number,
            'neb_registration_number', s.neb_registration_number,
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
            'father_citizenship_no', s.father_citizenship_no,
            'mother_name', s.mother_name,
            'mother_phone', s.mother_phone,
            'mother_citizenship_no', s.mother_citizenship_no,
            'local_guardian_name', s.local_guardian_name,
            'local_guardian_phone', s.local_guardian_phone,
            'local_guardian_relation', s.local_guardian_relation,
            'admission_date', s.admission_date,
            'admission_class', s.admission_class,
            'current_class_id', s.current_class_id,
            'roll_number', s.roll_number,
            'previous_school', s.previous_school,
            'allergies', s.allergies,
            'medical_conditions', s.medical_conditions,
            'emergency_contact', s.emergency_contact,
            'status', s.status,
            'photo_url', s.photo_url,
            'created_at', s.created_at,
            'updated_at', s.updated_at,
            'deleted_at', s.deleted_at
          ),
          NOW()
        FROM students s
        INNER JOIN academic_history ah ON s.student_id = ah.student_id
        WHERE ah.academic_year_id = :academicYearId
        `,
        {
          replacements: { archiveId, academicYearId },
          transaction,
        }
      );
      recordCounts.students = this.getAffectedRows(studentsResult);
      tablesArchived.push('students');

      // Archive attendance records
      const attendanceResult = await sequelize.query(
        `
        INSERT INTO archived_attendance (archive_id, original_id, attendance_data, created_at)
        SELECT 
          :archiveId,
          a.attendance_id,
          JSON_OBJECT(
            'attendance_id', a.attendance_id,
            'student_id', a.student_id,
            'class_id', a.class_id,
            'date', a.date,
            'date_bs', a.date_bs,
            'status', a.status,
            'period_number', a.period_number,
            'marked_by', a.marked_by,
            'marked_at', a.marked_at,
            'remarks', a.remarks,
            'sync_status', a.sync_status,
            'created_at', a.created_at,
            'updated_at', a.updated_at,
            'deleted_at', a.deleted_at
          ),
          NOW()
        FROM attendance a
        INNER JOIN classes c ON a.class_id = c.class_id
        WHERE c.academic_year_id = :academicYearId
        `,
        {
          replacements: { archiveId, academicYearId },
          transaction,
        }
      );
      recordCounts.attendance = this.getAffectedRows(attendanceResult);
      tablesArchived.push('attendance');

      // Archive exams
      const examsResult = await sequelize.query(
        `
        INSERT INTO archived_exams (archive_id, original_id, exam_data, created_at)
        SELECT 
          :archiveId,
          e.exam_id,
          JSON_OBJECT(
            'exam_id', e.exam_id,
            'name', e.name,
            'type', e.type,
            'subject_id', e.subject_id,
            'class_id', e.class_id,
            'academic_year_id', e.academic_year_id,
            'term_id', e.term_id,
            'exam_date', e.exam_date,
            'duration', e.duration,
            'full_marks', e.full_marks,
            'pass_marks', e.pass_marks,
            'theory_marks', e.theory_marks,
            'practical_marks', e.practical_marks,
            'weightage', e.weightage,
            'status', e.status,
            'created_at', e.created_at,
            'updated_at', e.updated_at,
            'deleted_at', e.deleted_at
          ),
          NOW()
        FROM exams e
        WHERE e.academic_year_id = :academicYearId
        `,
        {
          replacements: { archiveId, academicYearId },
          transaction,
        }
      );
      recordCounts.exams = this.getAffectedRows(examsResult);
      tablesArchived.push('exams');

      // Archive grades
      const gradesResult = await sequelize.query(
        `
        INSERT INTO archived_grades (archive_id, original_id, grade_data, created_at)
        SELECT 
          :archiveId,
          g.grade_id,
          JSON_OBJECT(
            'grade_id', g.grade_id,
            'exam_id', g.exam_id,
            'student_id', g.student_id,
            'theory_marks', g.theory_marks,
            'practical_marks', g.practical_marks,
            'total_marks', g.total_marks,
            'grade', g.grade,
            'grade_point', g.grade_point,
            'remarks', g.remarks,
            'entered_by', g.entered_by,
            'entered_at', g.entered_at,
            'created_at', g.created_at,
            'updated_at', g.updated_at,
            'deleted_at', g.deleted_at
          ),
          NOW()
        FROM grades g
        INNER JOIN exams e ON g.exam_id = e.exam_id
        WHERE e.academic_year_id = :academicYearId
        `,
        {
          replacements: { archiveId, academicYearId },
          transaction,
        }
      );
      recordCounts.grades = this.getAffectedRows(gradesResult);
      tablesArchived.push('grades');

      // Archive invoices
      const invoicesResult = await sequelize.query(
        `
        INSERT INTO archived_invoices (archive_id, original_id, invoice_data, created_at)
        SELECT 
          :archiveId,
          i.invoice_id,
          JSON_OBJECT(
            'invoice_id', i.invoice_id,
            'invoice_number', i.invoice_number,
            'student_id', i.student_id,
            'fee_structure_id', i.fee_structure_id,
            'academic_year_id', i.academic_year_id,
            'due_date', i.due_date,
            'subtotal', i.subtotal,
            'discount', i.discount,
            'discount_reason', i.discount_reason,
            'discount_approval_status', i.discount_approval_status,
            'discount_approved_by', i.discount_approved_by,
            'discount_approved_at', i.discount_approved_at,
            'total_amount', i.total_amount,
            'paid_amount', i.paid_amount,
            'balance', i.balance,
            'status', i.status,
            'generated_at', i.generated_at,
            'created_at', i.created_at,
            'updated_at', i.updated_at,
            'deleted_at', i.deleted_at
          ),
          NOW()
        FROM invoices i
        WHERE i.academic_year_id = :academicYearId
        `,
        {
          replacements: { archiveId, academicYearId },
          transaction,
        }
      );
      recordCounts.invoices = this.getAffectedRows(invoicesResult);
      tablesArchived.push('invoices');

      // Archive payments
      const paymentsResult = await sequelize.query(
        `
        INSERT INTO archived_payments (archive_id, original_id, payment_data, created_at)
        SELECT 
          :archiveId,
          p.payment_id,
          JSON_OBJECT(
            'payment_id', p.payment_id,
            'receipt_number', p.receipt_number,
            'invoice_id', p.invoice_id,
            'student_id', p.student_id,
            'amount', p.amount,
            'payment_method', p.payment_method,
            'payment_date', p.payment_date,
            'transaction_id', p.transaction_id,
            'gateway_response', p.gateway_response,
            'received_by', p.received_by,
            'remarks', p.remarks,
            'status', p.status,
            'qr_code', p.qr_code,
            'installment_number', p.installment_number,
            'installment_plan_id', p.installment_plan_id,
            'created_at', p.created_at,
            'updated_at', p.updated_at
          ),
          NOW()
        FROM payments p
        INNER JOIN invoices i ON p.invoice_id = i.invoice_id
        WHERE i.academic_year_id = :academicYearId
        `,
        {
          replacements: { archiveId, academicYearId },
          transaction,
        }
      );
      recordCounts.payments = this.getAffectedRows(paymentsResult);
      tablesArchived.push('payments');

      // Update archive metadata with results
      await ArchiveMetadata.update(
        {
          status: 'completed',
          tables_archived: tablesArchived,
          record_counts: recordCounts,
          updated_at: new Date(),
        },
        {
          where: { id: archiveId },
          transaction,
        }
      );

      // Commit transaction
      await transaction.commit();

      // Log audit event
      await auditLogger.log({
        userId,
        entityType: 'archive',
        entityId: archiveId,
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
        archiveId,
        status: 'completed',
        recordCounts,
        message: `Successfully archived ${academicYearName}`,
      };
    } catch (error) {
      // Rollback transaction on error
      if (transaction && !(transaction as any).finished) {
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

      const archiveStatus = archiveMetadata.getDataValue('status');
      const academicYearName = archiveMetadata.getDataValue('academic_year_name');

      if (archiveStatus !== 'completed') {
        throw new Error('Can only restore completed archives');
      }

      const recordCounts: Record<string, number> = {};

      // Restore students (only if they don't exist)
      const studentsResult = await sequelize.query(
        `
        INSERT IGNORE INTO students (
          student_id, user_id, student_code, symbol_number, neb_registration_number,
          first_name_en, middle_name_en, last_name_en, first_name_np, middle_name_np, last_name_np,
          date_of_birth_bs, date_of_birth_ad, gender, blood_group,
          address_en, address_np, phone, email,
          father_name, father_phone, father_citizenship_no,
          mother_name, mother_phone, mother_citizenship_no,
          local_guardian_name, local_guardian_phone, local_guardian_relation,
          admission_date, admission_class, current_class_id, roll_number,
          previous_school, allergies, medical_conditions, emergency_contact,
          status, photo_url, created_at, updated_at, deleted_at
        )
        SELECT 
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.student_id')),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.user_id')), 'null'),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.student_code')),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.symbol_number')), 'null'),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.neb_registration_number')), 'null'),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.first_name_en')),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.middle_name_en')), 'null'),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.last_name_en')),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.first_name_np')), 'null'),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.middle_name_np')), 'null'),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.last_name_np')), 'null'),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.date_of_birth_bs')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.date_of_birth_ad')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.gender')),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.blood_group')), 'null'),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.address_en')),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.address_np')), 'null'),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.phone')), 'null'),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.email')), 'null'),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.father_name')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.father_phone')),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.father_citizenship_no')), 'null'),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.mother_name')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.mother_phone')),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.mother_citizenship_no')), 'null'),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.local_guardian_name')), 'null'),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.local_guardian_phone')), 'null'),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.local_guardian_relation')), 'null'),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.admission_date')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.admission_class')),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.current_class_id')), 'null'),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.roll_number')), 'null'),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.previous_school')), 'null'),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.allergies')), 'null'),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.medical_conditions')), 'null'),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.emergency_contact')),
          JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.status')),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.photo_url')), 'null'),
          COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.created_at')), 'null'), NOW()),
          COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.updated_at')), 'null'), NOW()),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(student_data, '$.deleted_at')), 'null')
        FROM archived_students
        WHERE archive_id = :archiveId
        `,
        {
          replacements: { archiveId },
          transaction,
        }
      );
      recordCounts.students = this.getAffectedRows(studentsResult);

      const attendanceResult = await sequelize.query(
        `
        INSERT IGNORE INTO attendance (
          attendance_id, student_id, class_id, date, date_bs, status,
          period_number, marked_by, marked_at, remarks, sync_status,
          created_at, updated_at, deleted_at
        )
        SELECT
          JSON_UNQUOTE(JSON_EXTRACT(attendance_data, '$.attendance_id')),
          JSON_UNQUOTE(JSON_EXTRACT(attendance_data, '$.student_id')),
          JSON_UNQUOTE(JSON_EXTRACT(attendance_data, '$.class_id')),
          JSON_UNQUOTE(JSON_EXTRACT(attendance_data, '$.date')),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(attendance_data, '$.date_bs')), 'null'),
          JSON_UNQUOTE(JSON_EXTRACT(attendance_data, '$.status')),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(attendance_data, '$.period_number')), 'null'),
          JSON_UNQUOTE(JSON_EXTRACT(attendance_data, '$.marked_by')),
          COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(attendance_data, '$.marked_at')), 'null'), NOW()),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(attendance_data, '$.remarks')), 'null'),
          COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(attendance_data, '$.sync_status')), 'null'), 'synced'),
          COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(attendance_data, '$.created_at')), 'null'), NOW()),
          COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(attendance_data, '$.updated_at')), 'null'), NOW()),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(attendance_data, '$.deleted_at')), 'null')
        FROM archived_attendance
        WHERE archive_id = :archiveId
        `,
        {
          replacements: { archiveId },
          transaction,
        }
      );
      recordCounts.attendance = this.getAffectedRows(attendanceResult);

      const examsResult = await sequelize.query(
        `
        INSERT IGNORE INTO exams (
          exam_id, name, type, subject_id, class_id, academic_year_id, term_id,
          exam_date, duration, full_marks, pass_marks, theory_marks,
          practical_marks, weightage, status, created_at, updated_at, deleted_at
        )
        SELECT
          JSON_UNQUOTE(JSON_EXTRACT(exam_data, '$.exam_id')),
          JSON_UNQUOTE(JSON_EXTRACT(exam_data, '$.name')),
          JSON_UNQUOTE(JSON_EXTRACT(exam_data, '$.type')),
          JSON_UNQUOTE(JSON_EXTRACT(exam_data, '$.subject_id')),
          JSON_UNQUOTE(JSON_EXTRACT(exam_data, '$.class_id')),
          JSON_UNQUOTE(JSON_EXTRACT(exam_data, '$.academic_year_id')),
          JSON_UNQUOTE(JSON_EXTRACT(exam_data, '$.term_id')),
          JSON_UNQUOTE(JSON_EXTRACT(exam_data, '$.exam_date')),
          JSON_UNQUOTE(JSON_EXTRACT(exam_data, '$.duration')),
          JSON_UNQUOTE(JSON_EXTRACT(exam_data, '$.full_marks')),
          JSON_UNQUOTE(JSON_EXTRACT(exam_data, '$.pass_marks')),
          JSON_UNQUOTE(JSON_EXTRACT(exam_data, '$.theory_marks')),
          JSON_UNQUOTE(JSON_EXTRACT(exam_data, '$.practical_marks')),
          JSON_UNQUOTE(JSON_EXTRACT(exam_data, '$.weightage')),
          JSON_UNQUOTE(JSON_EXTRACT(exam_data, '$.status')),
          COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(exam_data, '$.created_at')), 'null'), NOW()),
          COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(exam_data, '$.updated_at')), 'null'), NOW()),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(exam_data, '$.deleted_at')), 'null')
        FROM archived_exams
        WHERE archive_id = :archiveId
        `,
        {
          replacements: { archiveId },
          transaction,
        }
      );
      recordCounts.exams = this.getAffectedRows(examsResult);

      const gradesResult = await sequelize.query(
        `
        INSERT IGNORE INTO grades (
          grade_id, exam_id, student_id, theory_marks, practical_marks,
          total_marks, grade, grade_point, remarks, entered_by, entered_at,
          created_at, updated_at, deleted_at
        )
        SELECT
          JSON_UNQUOTE(JSON_EXTRACT(grade_data, '$.grade_id')),
          JSON_UNQUOTE(JSON_EXTRACT(grade_data, '$.exam_id')),
          JSON_UNQUOTE(JSON_EXTRACT(grade_data, '$.student_id')),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(grade_data, '$.theory_marks')), 'null'),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(grade_data, '$.practical_marks')), 'null'),
          JSON_UNQUOTE(JSON_EXTRACT(grade_data, '$.total_marks')),
          JSON_UNQUOTE(JSON_EXTRACT(grade_data, '$.grade')),
          JSON_UNQUOTE(JSON_EXTRACT(grade_data, '$.grade_point')),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(grade_data, '$.remarks')), 'null'),
          JSON_UNQUOTE(JSON_EXTRACT(grade_data, '$.entered_by')),
          COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(grade_data, '$.entered_at')), 'null'), NOW()),
          COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(grade_data, '$.created_at')), 'null'), NOW()),
          COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(grade_data, '$.updated_at')), 'null'), NOW()),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(grade_data, '$.deleted_at')), 'null')
        FROM archived_grades
        WHERE archive_id = :archiveId
        `,
        {
          replacements: { archiveId },
          transaction,
        }
      );
      recordCounts.grades = this.getAffectedRows(gradesResult);

      const invoicesResult = await sequelize.query(
        `
        INSERT IGNORE INTO invoices (
          invoice_id, invoice_number, student_id, fee_structure_id, academic_year_id,
          due_date, subtotal, discount, discount_reason, discount_approval_status,
          discount_approved_by, discount_approved_at, total_amount, paid_amount,
          balance, status, generated_at, created_at, updated_at, deleted_at
        )
        SELECT
          JSON_UNQUOTE(JSON_EXTRACT(invoice_data, '$.invoice_id')),
          JSON_UNQUOTE(JSON_EXTRACT(invoice_data, '$.invoice_number')),
          JSON_UNQUOTE(JSON_EXTRACT(invoice_data, '$.student_id')),
          JSON_UNQUOTE(JSON_EXTRACT(invoice_data, '$.fee_structure_id')),
          JSON_UNQUOTE(JSON_EXTRACT(invoice_data, '$.academic_year_id')),
          JSON_UNQUOTE(JSON_EXTRACT(invoice_data, '$.due_date')),
          JSON_UNQUOTE(JSON_EXTRACT(invoice_data, '$.subtotal')),
          JSON_UNQUOTE(JSON_EXTRACT(invoice_data, '$.discount')),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(invoice_data, '$.discount_reason')), 'null'),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(invoice_data, '$.discount_approval_status')), 'null'),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(invoice_data, '$.discount_approved_by')), 'null'),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(invoice_data, '$.discount_approved_at')), 'null'),
          JSON_UNQUOTE(JSON_EXTRACT(invoice_data, '$.total_amount')),
          JSON_UNQUOTE(JSON_EXTRACT(invoice_data, '$.paid_amount')),
          JSON_UNQUOTE(JSON_EXTRACT(invoice_data, '$.balance')),
          JSON_UNQUOTE(JSON_EXTRACT(invoice_data, '$.status')),
          COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(invoice_data, '$.generated_at')), 'null'), NOW()),
          COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(invoice_data, '$.created_at')), 'null'), NOW()),
          COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(invoice_data, '$.updated_at')), 'null'), NOW()),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(invoice_data, '$.deleted_at')), 'null')
        FROM archived_invoices
        WHERE archive_id = :archiveId
        `,
        {
          replacements: { archiveId },
          transaction,
        }
      );
      recordCounts.invoices = this.getAffectedRows(invoicesResult);

      const paymentsResult = await sequelize.query(
        `
        INSERT IGNORE INTO payments (
          payment_id, receipt_number, invoice_id, student_id, amount, payment_method,
          payment_date, transaction_id, gateway_response, received_by, remarks,
          status, qr_code, installment_number, installment_plan_id, created_at, updated_at
        )
        SELECT
          JSON_UNQUOTE(JSON_EXTRACT(payment_data, '$.payment_id')),
          JSON_UNQUOTE(JSON_EXTRACT(payment_data, '$.receipt_number')),
          JSON_UNQUOTE(JSON_EXTRACT(payment_data, '$.invoice_id')),
          JSON_UNQUOTE(JSON_EXTRACT(payment_data, '$.student_id')),
          JSON_UNQUOTE(JSON_EXTRACT(payment_data, '$.amount')),
          JSON_UNQUOTE(JSON_EXTRACT(payment_data, '$.payment_method')),
          JSON_UNQUOTE(JSON_EXTRACT(payment_data, '$.payment_date')),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(payment_data, '$.transaction_id')), 'null'),
          JSON_EXTRACT(payment_data, '$.gateway_response'),
          JSON_UNQUOTE(JSON_EXTRACT(payment_data, '$.received_by')),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(payment_data, '$.remarks')), 'null'),
          JSON_UNQUOTE(JSON_EXTRACT(payment_data, '$.status')),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(payment_data, '$.qr_code')), 'null'),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(payment_data, '$.installment_number')), 'null'),
          NULLIF(JSON_UNQUOTE(JSON_EXTRACT(payment_data, '$.installment_plan_id')), 'null'),
          COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(payment_data, '$.created_at')), 'null'), NOW()),
          COALESCE(NULLIF(JSON_UNQUOTE(JSON_EXTRACT(payment_data, '$.updated_at')), 'null'), NOW())
        FROM archived_payments
        WHERE archive_id = :archiveId
        `,
        {
          replacements: { archiveId },
          transaction,
        }
      );
      recordCounts.payments = this.getAffectedRows(paymentsResult);

      // Update archive metadata
      await ArchiveMetadata.update(
        {
          status: 'restored',
          updated_at: new Date(),
        },
        {
          where: { id: archiveId },
          transaction,
        }
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
          academic_year_name: academicYearName,
          record_counts: recordCounts,
        },
        ipAddress: '',
        userAgent: '',
      });

      return {
        archiveId,
        status: 'restored',
        recordCounts,
        message: `Successfully restored ${academicYearName}`,
      };
    } catch (error) {
      // Rollback transaction on error
      if (transaction && !(transaction as any).finished) {
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

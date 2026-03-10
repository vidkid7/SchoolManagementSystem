import { Request, Response } from 'express';
import StudentRepository from './student.repository';
import studentIdService from './studentId.service';
import promotionService from './promotion.service';
import photoService from './photo.service';
import bulkImportService from './bulkImport.service';
import fuzzySearchService from './fuzzySearch.service';
import duplicateDetectionService from './duplicateDetection.service';
import enhancedValidationService from './enhancedValidation.service';
import { sendSuccess, calculatePagination } from '@utils/responseFormatter';
import { asyncHandler } from '@middleware/errorHandler';
import { NotFoundError, ValidationError } from '@middleware/errorHandler';
import Student, { StudentStatus } from '@models/Student.model';
import Class from '@models/Class.model';
import { HTTP_STATUS, PAGINATION } from '@config/constants';
import { logger } from '@utils/logger';
import AttendanceRecord from '@models/AttendanceRecord.model';
import Grade from '@models/Grade.model';
import Exam from '@models/Exam.model';
import Invoice from '@models/Invoice.model';
import Payment from '@models/Payment.model';
import ECAEnrollment from '@models/ECAEnrollment.model';
import ECA from '@models/ECA.model';
import SportsEnrollment from '@models/SportsEnrollment.model';
import Sport from '@models/Sport.model';
import Certificate from '@models/Certificate.model';
import Circulation from '@models/Circulation.model';
import Book from '@models/Book.model';
import { Op } from 'sequelize';

/** In-memory document registry for global documentId (studentId + category + filename). Cleared on restart. */
let documentIdNext = 1;
const documentRegistry = new Map<number, { studentId: number; category: string; filename: string }>();

/**
 * Student Controller
 * Handles HTTP requests for student management endpoints
 * Requirements: 2.1-2.13
 */
class StudentController {
  private toNumber(value: unknown): number {
    if (value === null || value === undefined) return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private async getStudentByUserId(userId: number): Promise<Student> {
    const student = await Student.findOne({ where: { userId } });
    if (!student) {
      throw new NotFoundError('Student');
    }
    return student;
  }

  /**
   * Get all students with filters and pagination
   * GET /api/v1/students
   */
  getAll = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const {
      page = PAGINATION.DEFAULT_PAGE,
      limit = PAGINATION.DEFAULT_PAGE_SIZE,
      search,
      classId,
      class: gradeLevel,
      section,
      status,
      gender,
      admissionClass,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const pageNum = Number(page);
    const limitNum = Math.min(Number(limit), PAGINATION.MAX_PAGE_SIZE);
    const offset = (pageNum - 1) * limitNum;

    const { students, total } = await StudentRepository.findAll(
      {
        search: search as string,
        classId: classId ? Number(classId) : undefined,
        gradeLevel: gradeLevel ? Number(gradeLevel) : undefined,
        section: section as string,
        status: status as StudentStatus,
        gender: gender as any,
        admissionClass: admissionClass ? Number(admissionClass) : undefined
      },
      {
        limit: limitNum,
        offset,
        orderBy: sortBy as string,
        orderDirection: (sortOrder as string).toUpperCase() as 'ASC' | 'DESC'
      }
    );

    const meta = calculatePagination(total, pageNum, limitNum);

    sendSuccess(res, students, 'Students retrieved successfully', HTTP_STATUS.OK, meta);
  });

  /**
   * Get student by ID
   * GET /api/v1/students/:id
   */
  getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);

    const student = await StudentRepository.findById(studentId);

    if (!student) {
      throw new NotFoundError('Student');
    }

    sendSuccess(res, student, 'Student retrieved successfully');
  });

  /**
   * Create a new student
   * POST /api/v1/students
   */
  create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    // Enhanced validation
    const validation = await enhancedValidationService.validateStudentData(req.body);
    if (!validation.isValid) {
      throw new ValidationError('Student data validation failed', 
        validation.errors.map(err => ({ field: 'general', message: err }))
      );
    }

    // Duplicate detection
    const duplicates = await duplicateDetectionService.detectDuplicates(req.body);
    const highConfidenceDuplicates = duplicates.filter(d => d.confidence === 'high');
    
    if (highConfidenceDuplicates.length > 0) {
      logger.warn('Potential duplicate student detected', {
        duplicates: highConfidenceDuplicates.map(d => ({
          studentId: d.student.studentId,
          studentCode: d.student.studentCode,
          name: `${d.student.firstNameEn} ${d.student.lastNameEn}`,
          confidence: d.confidence,
          reasons: d.reasons
        }))
      });
      
      // Return warning but allow creation (user can decide)
      // In production, you might want to block creation
      throw new ValidationError('Possible duplicate student detected', [
        { 
          field: 'duplicate', 
          message: `Similar student found: ${highConfidenceDuplicates[0].student.firstNameEn} ${highConfidenceDuplicates[0].student.lastNameEn} (${highConfidenceDuplicates[0].student.studentCode}). Reasons: ${highConfidenceDuplicates[0].reasons.join(', ')}` 
        }
      ]);
    }

    // Auto-assign roll number if not provided
    if (!req.body.rollNumber && req.body.currentClassId) {
      req.body.rollNumber = await enhancedValidationService.getNextRollNumber(
        req.body.currentClassId
      );
    }

    // Generate unique student code
    const admissionDate = new Date(req.body.admissionDate);
    const studentCode = await studentIdService.generateStudentId(admissionDate);

    // Create student with generated code
    const studentData = {
      ...req.body,
      studentCode,
      status: StudentStatus.ACTIVE
    };

    const student = await StudentRepository.create(studentData, userId, req);

    logger.info('Student created via API', {
      studentId: student.studentId,
      studentCode: student.studentCode,
      createdBy: userId,
      warnings: validation.warnings
    });

    sendSuccess(res, student, 'Student created successfully', HTTP_STATUS.CREATED);
  });

  /**
   * Update student by ID
   * PUT /api/v1/students/:id
   */
  update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);
    const userId = req.user?.userId;

    const student = await StudentRepository.update(studentId, req.body, userId, req);

    if (!student) {
      throw new NotFoundError('Student');
    }

    logger.info('Student updated via API', {
      studentId,
      updatedBy: userId,
      updatedFields: Object.keys(req.body)
    });

    sendSuccess(res, student, 'Student updated successfully');
  });

  /**
   * Soft delete student by ID
   * DELETE /api/v1/students/:id
   */
  delete = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);
    const userId = req.user?.userId;

    const deleted = await StudentRepository.delete(studentId, userId, req);

    if (!deleted) {
      throw new NotFoundError('Student');
    }

    logger.info('Student soft deleted via API', {
      studentId,
      deletedBy: userId
    });

    sendSuccess(res, null, 'Student deleted successfully');
  });

  /**
   * Bulk import students from Excel
   * POST /api/v1/students/bulk-import
   */
  bulkImport = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;

    if (!req.file) {
      throw new ValidationError('Excel file is required', [
        { field: 'file', message: 'Please upload an Excel file (.xlsx or .xls)' }
      ]);
    }

    const result = await bulkImportService.importFromExcel(
      req.file.buffer,
      userId,
      req
    );

    logger.info('Bulk student import completed via API', {
      totalRows: result.totalRows,
      successCount: result.successCount,
      errorCount: result.errorCount,
      importedBy: userId
    });

    const statusCode = result.errorCount > 0 && result.successCount > 0
      ? HTTP_STATUS.OK // Partial success
      : result.successCount > 0
        ? HTTP_STATUS.CREATED
        : HTTP_STATUS.BAD_REQUEST;

    sendSuccess(res, result, 'Bulk import completed', statusCode);
  });

  /**
   * Download bulk import template
   * GET /api/v1/students/import-template
   */
  getImportTemplate = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const templateBuffer = bulkImportService.generateImportTemplate();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=student-import-template.xlsx');
    res.send(templateBuffer);
  });

  /**
   * Promote student to next class
   * POST /api/v1/students/:id/promote
   */
  promote = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);
    const userId = req.user?.userId;

    const {
      academicYearId,
      nextClassId,
      currentClassId,
      currentGradeLevel,
      rollNumber,
      attendancePercentage,
      gpa,
      totalMarks,
      rank,
      hasFailingGrades
    } = req.body;

    const result = await promotionService.promoteStudent(
      studentId,
      academicYearId,
      nextClassId,
      {
        currentClassId,
        currentGradeLevel,
        rollNumber,
        attendancePercentage,
        gpa,
        totalMarks,
        rank,
        hasFailingGrades
      },
      undefined, // use default criteria
      userId,
      req
    );

    if (!result.success && result.reason === 'Student not found') {
      throw new NotFoundError('Student');
    }

    logger.info('Student promotion attempted via API', {
      studentId,
      success: result.success,
      fromGrade: result.fromGrade,
      toGrade: result.toGrade,
      promotedBy: userId
    });

    sendSuccess(
      res,
      result,
      result.success ? 'Student promoted successfully' : `Promotion failed: ${result.reason}`
    );
  });

  /**
   * Transfer student to different section/class
   * POST /api/v1/students/:id/transfer
   */
  transfer = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);
    const userId = req.user?.userId;
    const { newClassId, newRollNumber, reason } = req.body;

    const student = await StudentRepository.findById(studentId);

    if (!student) {
      throw new NotFoundError('Student');
    }

    const updateData: Record<string, any> = {
      currentClassId: newClassId
    };

    if (newRollNumber) {
      updateData.rollNumber = newRollNumber;
    }

    const updatedStudent = await StudentRepository.update(
      studentId,
      updateData,
      userId,
      req
    );

    logger.info('Student transferred via API', {
      studentId,
      newClassId,
      reason,
      transferredBy: userId
    });

    sendSuccess(res, updatedStudent, 'Student transferred successfully');
  });

  /**
   * Upload student photo
   * POST /api/v1/students/:id/photo
   */
  uploadPhoto = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);
    const userId = req.user?.userId;

    if (!req.file) {
      throw new ValidationError('Photo file is required', [
        { field: 'photo', message: 'Please upload a photo file (JPEG, PNG, or GIF)' }
      ]);
    }

    // Verify student exists
    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student');
    }

    // Delete old photo if exists
    if (student.photoUrl) {
      try {
        await photoService.deleteStudentPhoto(student.photoUrl);
      } catch (error) {
        logger.warn('Failed to delete old student photo', { studentId, oldPhotoUrl: student.photoUrl });
      }
    }

    // Process and save new photo
    const { photoUrl, thumbnailUrl } = await photoService.processStudentPhoto(req.file, studentId);

    // Update student record with new photo URL
    await StudentRepository.update(
      studentId,
      { photoUrl },
      userId,
      req
    );

    logger.info('Student photo uploaded via API', {
      studentId,
      photoUrl,
      uploadedBy: userId
    });

    sendSuccess(res, { photoUrl, thumbnailUrl }, 'Photo uploaded successfully');
  });

  /**
   * Upload student documents
   * POST /api/v1/students/:id/documents
   */
  uploadDocuments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);
    const userId = req.user?.userId;
    const category = req.body.category || 'general';

    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      throw new ValidationError('At least one document file is required', [
        { field: 'documents', message: 'Please upload at least one document' }
      ]);
    }

    // Verify student exists
    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student');
    }

    const files = Array.isArray(req.files) ? req.files : [req.files as unknown as Express.Multer.File];
    const uploadedDocuments = [];

    for (const file of files) {
      const docInfo = await photoService.saveStudentDocument(file, studentId, category);
      uploadedDocuments.push(docInfo);
    }

    logger.info('Student documents uploaded via API', {
      studentId,
      category,
      documentCount: uploadedDocuments.length,
      uploadedBy: userId
    });

    sendSuccess(res, uploadedDocuments, 'Documents uploaded successfully', HTTP_STATUS.CREATED);
  });

  /**
   * List student documents (with global id for get/delete)
   * GET /api/v1/students/:id/documents
   */
  listDocuments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);
    const category = req.query.category as string | undefined;

    const student = await StudentRepository.findById(studentId);
    if (!student) throw new NotFoundError('Student');

    const list = await photoService.listStudentDocuments(studentId, category);
    const documents = list.map((doc) => {
      const id = documentIdNext++;
      documentRegistry.set(id, { studentId, category: doc.category, filename: doc.filename });
      return { id, ...doc, isExpired: false, isExpiringSoon: false };
    });
    sendSuccess(res, documents, 'Documents retrieved successfully');
  });

  /**
   * List expired documents
   * GET /api/v1/students/:id/documents/expired
   */
  listExpiredDocuments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);
    const student = await StudentRepository.findById(studentId);
    if (!student) throw new NotFoundError('Student');
    sendSuccess(res, [], 'Documents retrieved successfully');
  });

  /**
   * List expiring-soon documents
   * GET /api/v1/students/:id/documents/expiring-soon
   */
  listExpiringSoonDocuments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);
    const student = await StudentRepository.findById(studentId);
    if (!student) throw new NotFoundError('Student');
    const list = await photoService.listStudentDocuments(studentId);
    const documents = list.map((doc) => {
      const id = documentIdNext++;
      documentRegistry.set(id, { studentId, category: doc.category, filename: doc.filename });
      return { id, ...doc, isExpired: false, isExpiringSoon: true };
    });
    sendSuccess(res, documents, 'Documents retrieved successfully');
  });

  /**
   * Document statistics
   * GET /api/v1/students/:id/documents/statistics
   */
  getDocumentStatistics = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);
    const student = await StudentRepository.findById(studentId);
    if (!student) throw new NotFoundError('Student');
    const list = await photoService.listStudentDocuments(studentId);
    const total = list.length;
    sendSuccess(res, { total, active: total, expired: 0, expiringSoon: 0 }, 'Statistics retrieved');
  });

  /**
   * Bulk upload documents
   * POST /api/v1/students/:id/documents/bulk
   */
  uploadDocumentsBulk = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);
    const userId = req.user?.userId;
    const category = req.body.category || 'general';

    const student = await StudentRepository.findById(studentId);
    if (!student) throw new NotFoundError('Student');

    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      throw new ValidationError('At least one document required', [{ field: 'documents', message: 'Please upload at least one document' }]);
    }

    const files = Array.isArray(req.files) ? req.files : [req.files as unknown as Express.Multer.File];
    const uploaded = [];
    for (const file of files) {
      const docInfo = await photoService.saveStudentDocument(file, studentId, category);
      uploaded.push(docInfo);
    }
    logger.info('Student documents bulk upload', { studentId, count: uploaded.length, uploadedBy: userId });
    sendSuccess(res, uploaded, 'Documents uploaded successfully', HTTP_STATUS.CREATED);
  });

  /**
   * Get document by global id
   * GET /api/v1/students/documents/:documentId
   */
  getDocumentById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const documentId = Number(req.params.documentId);
    const entry = documentRegistry.get(documentId);
    if (!entry) throw new NotFoundError('Document');
    const url = `/uploads/documents/students/${entry.studentId}/${entry.category}/${entry.filename}`;
    sendSuccess(res, { id: documentId, filename: entry.filename, url, category: entry.category }, 'Document retrieved');
  });

  /**
   * Delete document by global id
   * DELETE /api/v1/students/documents/:documentId
   */
  deleteDocumentById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const documentId = Number(req.params.documentId);
    const entry = documentRegistry.get(documentId);
    if (!entry) throw new NotFoundError('Document');
    const url = `/uploads/documents/students/${entry.studentId}/${entry.category}/${entry.filename}`;
    await photoService.deleteStudentDocument(url);
    documentRegistry.delete(documentId);
    sendSuccess(res, { deleted: true }, 'Document deleted successfully');
  });

  /**
   * Get student academic history
   * GET /api/v1/students/:id/history
   */
   getAcademicHistory = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);

    // Verify student exists
    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student');
    }

    const history = await promotionService.getStudentHistory(studentId);

    sendSuccess(res, history, 'Academic history retrieved successfully');
  });

  /**
   * Get student attendance records
   * GET /api/v1/students/:id/attendance
   */
  getAttendance = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);

    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student');
    }

    const records = await AttendanceRecord.findAll({
      where: { studentId },
      order: [['date', 'DESC'], ['attendanceId', 'DESC']],
      limit: 200
    });

    const formattedRecords = records.map(record => ({
      id: record.attendanceId,
      date: record.date,
      status: record.status,
      periodNumber: record.periodNumber ?? null,
      remarks: record.remarks ?? ''
    }));

    const present = records.filter(a => a.status === 'present').length;
    const absent = records.filter(a => a.status === 'absent').length;
    const late = records.filter(a => a.status === 'late').length;
    const total = records.length;

    sendSuccess(res, {
      records: formattedRecords,
      summary: {
        total,
        present,
        absent,
        late,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0
      }
    }, 'Attendance retrieved successfully');
  });

  /**
   * Get student grades/marks
   * GET /api/v1/students/:id/grades
   */
  getGrades = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);

    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student');
    }

    const grades = await Grade.findAll({
      where: { studentId },
      include: [
        {
          model: Exam,
          as: 'exam',
          required: false,
          attributes: ['name', 'fullMarks']
        }
      ],
      order: [['enteredAt', 'DESC'], ['gradeId', 'DESC']],
      limit: 200
    });

    const formattedGrades = grades.map((grade: any) => ({
      id: grade.gradeId,
      examName: grade.exam?.name || `Exam #${grade.examId}`,
      subjectName: grade.exam?.name || 'N/A',
      fullMarks: this.toNumber(grade.exam?.fullMarks) || 100,
      obtainedMarks: this.toNumber(grade.totalMarks),
      grade: grade.grade,
      gradePoint: this.toNumber(grade.gradePoint)
    }));

    const totalMarks = formattedGrades.reduce((sum, g) => sum + g.obtainedMarks, 0);
    const average = formattedGrades.length > 0
      ? Math.round(totalMarks / formattedGrades.length)
      : 0;

    sendSuccess(res, {
      grades: formattedGrades,
      summary: {
        totalExams: formattedGrades.length,
        averageMarks: average,
        totalMarks
      }
    }, 'Grades retrieved successfully');
  });

  /**
   * Get student fee records
   * GET /api/v1/students/:id/fees
   */
  getFees = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);

    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student');
    }

    const [invoices, payments] = await Promise.all([
      Invoice.findAll({
        where: { studentId },
        order: [['generatedAt', 'DESC'], ['invoiceId', 'DESC']],
        limit: 200
      }),
      Payment.findAll({
        where: { studentId },
        order: [['paymentDate', 'DESC'], ['paymentId', 'DESC']],
        limit: 200
      })
    ]);

    const invoiceLookup = new Map<number, string>(
      invoices.map(inv => [inv.invoiceId, inv.invoiceNumber])
    );

    const formattedInvoices = invoices.map(inv => ({
      id: inv.invoiceId,
      invoiceNumber: inv.invoiceNumber,
      amount: this.toNumber(inv.totalAmount),
      dueDate: inv.dueDate,
      status: inv.status
    }));

    const formattedPayments = payments.map(pay => ({
      id: pay.paymentId,
      invoiceNumber: invoiceLookup.get(pay.invoiceId) || `INV-${pay.invoiceId}`,
      amount: this.toNumber(pay.amount),
      paymentDate: pay.paymentDate,
      status: pay.status
    }));

    const totalAmount = formattedInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidAmount = formattedPayments
      .filter(payment => payment.status === 'completed')
      .reduce((sum, pay) => sum + pay.amount, 0);

    sendSuccess(res, {
      invoices: formattedInvoices,
      payments: formattedPayments,
      summary: {
        totalAmount,
        paidAmount,
        pendingAmount: totalAmount - paidAmount,
        invoiceCount: formattedInvoices.length,
        paymentCount: formattedPayments.length
      }
    }, 'Fees retrieved successfully');
  });

  /**
   * Get student ECA activities
   * GET /api/v1/students/:id/eca
   */
  getECA = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);

    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student');
    }

    const [ecaEnrollments, sportsEnrollments] = await Promise.all([
      ECAEnrollment.findAll({
        where: { studentId },
        include: [
          {
            model: ECA,
            as: 'eca',
            required: false,
            attributes: ['name']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 100
      }),
      SportsEnrollment.findAll({
        where: { studentId },
        include: [
          {
            model: Sport,
            as: 'sport',
            required: false,
            attributes: ['name']
          }
        ],
        order: [['createdAt', 'DESC']],
        limit: 100
      })
    ]);

    const eca = ecaEnrollments.map((enrollment: any) => ({
      id: enrollment.enrollmentId,
      activityName: enrollment.eca?.name || `ECA #${enrollment.ecaId}`,
      position: enrollment.status,
      achievement: enrollment.remarks || ''
    }));

    const sports = sportsEnrollments.map((enrollment: any) => ({
      id: enrollment.enrollmentId,
      activityName: enrollment.sport?.name || `Sport #${enrollment.sportId}`,
      position: enrollment.status,
      achievement: enrollment.remarks || ''
    }));

    sendSuccess(res, {
      eca,
      sports,
      summary: {
        ecaCount: eca.length,
        sportsCount: sports.length
      }
    }, 'ECA activities retrieved successfully');
  });

  /**
   * Get student certificates
   * GET /api/v1/students/:id/certificates
   */
  getCertificates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);

    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student');
    }

    const certificates = await Certificate.findAll({
      where: { studentId },
      attributes: ['certificateId', 'certificateNumber', 'type', 'issuedDate', 'status'],
      order: [['issuedDate', 'DESC'], ['certificateId', 'DESC']],
      limit: 200
    });

    const formattedCertificates = certificates.map(cert => ({
      id: cert.certificateId,
      certificateNumber: cert.certificateNumber,
      type: cert.type,
      issuedDate: cert.issuedDate,
      status: cert.status
    }));

    sendSuccess(res, {
      certificates: formattedCertificates,
      summary: {
        total: formattedCertificates.length
      }
    }, 'Certificates retrieved successfully');
  });

  /**
   * Get student remarks from teachers
   * GET /api/v1/students/:id/remarks
   */
  getRemarks = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);
    const { type } = req.query;

    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student');
    }

    const grades = await Grade.findAll({
      where: { studentId },
      include: [
        {
          model: Exam,
          as: 'exam',
          required: false,
          attributes: ['name']
        }
      ],
      order: [['enteredAt', 'DESC'], ['gradeId', 'DESC']],
      limit: 200
    });

    const mappedRemarks = grades
      .filter(grade => typeof grade.remarks === 'string' && grade.remarks.trim().length > 0)
      .map((grade: any) => {
        const numericGradePoint = this.toNumber(grade.gradePoint);
        return {
          id: grade.gradeId,
          type: numericGradePoint >= 2.4 ? 'good' : 'bad',
          remark: grade.remarks,
          teacherName: `Teacher #${grade.enteredBy}`,
          date: grade.enteredAt,
          subject: grade.exam?.name || `Exam #${grade.examId}`
        };
      });

    let remarks = mappedRemarks;
    if (type && type !== 'all') {
      remarks = mappedRemarks.filter(remark => remark.type === type);
    }

    const goodRemarks = mappedRemarks.filter(remark => remark.type === 'good').length;
    const badRemarks = mappedRemarks.filter(remark => remark.type === 'bad').length;

    sendSuccess(res, {
      remarks,
      summary: {
        total: remarks.length,
        goodRemarks,
        badRemarks
      }
    }, 'Remarks retrieved successfully');
  });

  /**
   * Get student library borrowing records
   * GET /api/v1/students/:id/library
   */
  getLibrary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);

    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student');
    }

    const records = await Circulation.findAll({
      where: { studentId },
      include: [
        {
          model: Book,
          as: 'book',
          required: false,
          attributes: ['title', 'author', 'accessionNumber']
        }
      ],
      order: [['issueDate', 'DESC'], ['circulationId', 'DESC']],
      limit: 200
    });

    const formattedRecords = records.map((record: any) => ({
      id: record.circulationId,
      bookTitle: record.book?.title || 'Unknown Book',
      bookCode: record.book?.accessionNumber || `BOOK-${record.bookId}`,
      author: record.book?.author || 'Unknown',
      borrowDate: record.issueDate,
      dueDate: record.dueDate,
      returnDate: record.returnDate,
      status: record.status,
      fine: this.toNumber(record.fine),
    }));

    const totalBorrowed = formattedRecords.length;
    const currentlyBorrowed = formattedRecords.filter(r => r.status === 'borrowed' || r.status === 'renewed').length;
    const returned = formattedRecords.filter(r => r.status === 'returned').length;
    const overdue = formattedRecords.filter(r => r.status === 'overdue').length;
    const totalFines = formattedRecords.reduce((sum, r) => sum + (r.fine || 0), 0);

    sendSuccess(res, {
      records: formattedRecords,
      stats: {
        totalBorrowed,
        currentlyBorrowed,
        returned,
        overdue,
        totalFines
      }
    }, 'Library records retrieved successfully');
  });
  /**
   * Fuzzy search students
   * GET /api/v1/students/search/fuzzy
   */
  fuzzySearch = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { query, threshold = 0.4, limit = 50 } = req.query;

    if (!query || typeof query !== 'string') {
      throw new ValidationError('Search query is required', [
        { field: 'query', message: 'Please provide a search query' }
      ]);
    }

    const results = await fuzzySearchService.searchStudents(
      query,
      Number(threshold),
      Number(limit)
    );

    sendSuccess(res, results, 'Fuzzy search completed successfully');
  });

  /**
   * Detect duplicate students
   * POST /api/v1/students/detect-duplicates
   */
  detectDuplicates = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentData = req.body;
    const excludeId = req.query.excludeId ? Number(req.query.excludeId) : undefined;

    const duplicates = await duplicateDetectionService.detectDuplicates(
      studentData,
      excludeId
    );

    sendSuccess(res, {
      found: duplicates.length > 0,
      count: duplicates.length,
      duplicates
    }, 'Duplicate detection completed');
  });

  /**
   * Find potential siblings
   * GET /api/v1/students/:id/siblings
   */
  findSiblings = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);

    const siblings = await duplicateDetectionService.findPotentialSiblings(studentId);

    sendSuccess(res, siblings, 'Siblings retrieved successfully');
  });

  /**
   * Validate student data
   * POST /api/v1/students/validate
   */
  validateStudentData = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentData = req.body;
    const excludeId = req.query.excludeId ? Number(req.query.excludeId) : undefined;

    const validation = await enhancedValidationService.validateStudentData(
      studentData,
      excludeId
    );

    sendSuccess(res, validation, 'Validation completed');
  });

  getMyAttendanceSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      return;
    }

    const student = await this.getStudentByUserId(userId);
    const records = await AttendanceRecord.findAll({
      where: { studentId: student.studentId }
    });

    const present = records.filter(r => r.status === 'present').length;
    const absent = records.filter(r => r.status === 'absent').length;
    const late = records.filter(r => r.status === 'late').length;
    const total = records.length;

    sendSuccess(res, {
      present,
      total,
      percentage: total > 0 ? Number(((present / total) * 100).toFixed(2)) : 0,
      absent,
      late,
    }, 'Attendance summary retrieved successfully');
  });

  getMyGrades = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      return;
    }

    const student = await this.getStudentByUserId(userId);
    const grades = await Grade.findAll({
      where: { studentId: student.studentId },
      include: [
        {
          model: Exam,
          as: 'exam',
          required: false,
          attributes: ['name']
        }
      ],
      order: [['enteredAt', 'DESC']],
      limit: 100
    });

    sendSuccess(res, grades.map((grade: any) => ({
      subject: grade.exam?.name || `Exam #${grade.examId}`,
      grade: grade.grade,
      gpa: this.toNumber(grade.gradePoint)
    })), 'Grades retrieved successfully');
  });

  getMyFeesSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      return;
    }

    const student = await this.getStudentByUserId(userId);
    const [invoices, payments] = await Promise.all([
      Invoice.findAll({ where: { studentId: student.studentId } }),
      Payment.findAll({
        where: {
          studentId: student.studentId,
          status: { [Op.in]: ['completed', 'refunded'] }
        }
      })
    ]);

    const total = invoices.reduce((sum, invoice) => sum + this.toNumber(invoice.totalAmount), 0);
    const paid = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, payment) => sum + this.toNumber(payment.amount), 0);

    sendSuccess(res, {
      paid,
      pending: total - paid,
      total,
    }, 'Fees summary retrieved successfully');
  });

  getMyProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      return;
    }

    const student = await Student.findOne({
      where: { userId },
      include: [
        { model: Class, as: 'currentClass' },
      ],
    });

    if (!student) {
      sendSuccess(res, {
        studentCode: null,
        firstNameEn: req.user?.username || 'Student',
        lastNameEn: '',
        email: req.user?.email || '',
        status: 'active',
      }, 'Profile retrieved successfully');
      return;
    }

    sendSuccess(res, student, 'Profile retrieved successfully');
  });

  getNextRollNumber = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const classId = Number(req.query.classId);

    if (!classId) {
      throw new ValidationError('Class ID is required', [
        { field: 'classId', message: 'Please provide a class ID' }
      ]);
    }

    const nextRollNumber = await enhancedValidationService.getNextRollNumber(classId);

    sendSuccess(res, { nextRollNumber }, 'Next roll number retrieved successfully');
  });
}

export default new StudentController();


 

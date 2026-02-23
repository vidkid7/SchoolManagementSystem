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

/**
 * Student Controller
 * Handles HTTP requests for student management endpoints
 * Requirements: 2.1-2.13
 */
class StudentController {
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
   * List student documents
   * GET /api/v1/students/:id/documents
   */
  listDocuments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const studentId = Number(req.params.id);
    const category = req.query.category as string | undefined;

    // Verify student exists
    const student = await StudentRepository.findById(studentId);
    if (!student) {
      throw new NotFoundError('Student');
    }

    const documents = await photoService.listStudentDocuments(studentId, category);

    sendSuccess(res, documents, 'Documents retrieved successfully');
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

    // Return mock data for now
    const mockAttendance = [
      { id: 1, date: '2024-01-15', status: 'present' },
      { id: 2, date: '2024-01-16', status: 'present' },
      { id: 3, date: '2024-01-17', status: 'absent' },
      { id: 4, date: '2024-01-18', status: 'present' },
      { id: 5, date: '2024-01-19', status: 'late' },
      { id: 6, date: '2024-01-20', status: 'present' },
      { id: 7, date: '2024-01-21', status: 'present' },
      { id: 8, date: '2024-01-22', status: 'present' },
      { id: 9, date: '2024-01-23', status: 'absent' },
      { id: 10, date: '2024-01-24', status: 'present' },
    ];

    const present = mockAttendance.filter(a => a.status === 'present').length;
    const absent = mockAttendance.filter(a => a.status === 'absent').length;
    const late = mockAttendance.filter(a => a.status === 'late').length;

    sendSuccess(res, {
      records: mockAttendance,
      summary: {
        total: mockAttendance.length,
        present,
        absent,
        late,
        percentage: Math.round((present / mockAttendance.length) * 100)
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

    // Return mock data for now
    const mockGrades = [
      { id: 1, examName: 'First Terminal 2081', subjectName: 'English', fullMarks: 100, obtainedMarks: 85, grade: 'A' },
      { id: 2, examName: 'First Terminal 2081', subjectName: 'Mathematics', fullMarks: 100, obtainedMarks: 92, grade: 'A+' },
      { id: 3, examName: 'First Terminal 2081', subjectName: 'Science', fullMarks: 100, obtainedMarks: 78, grade: 'B+' },
      { id: 4, examName: 'First Terminal 2081', subjectName: 'Nepali', fullMarks: 100, obtainedMarks: 88, grade: 'A' },
      { id: 5, examName: 'First Terminal 2081', subjectName: 'Social Studies', fullMarks: 100, obtainedMarks: 82, grade: 'A-' },
    ];

    const totalMarks = mockGrades.reduce((sum, g) => sum + g.obtainedMarks, 0);
    const average = Math.round(totalMarks / mockGrades.length);

    sendSuccess(res, {
      grades: mockGrades,
      summary: {
        totalExams: mockGrades.length,
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

    // Return mock data for now
    const mockInvoices = [
      { id: 1, invoiceNumber: 'INV/2024/001', amount: 15000, dueDate: '2024-01-15', status: 'paid' },
      { id: 2, invoiceNumber: 'INV/2024/002', amount: 15000, dueDate: '2024-02-15', status: 'paid' },
      { id: 3, invoiceNumber: 'INV/2024/003', amount: 15000, dueDate: '2024-03-15', status: 'pending' },
    ];

    const mockPayments = [
      { id: 1, invoiceNumber: 'INV/2024/001', amount: 15000, paymentDate: '2024-01-10', status: 'paid' },
      { id: 2, invoiceNumber: 'INV/2024/002', amount: 15000, paymentDate: '2024-02-12', status: 'paid' },
    ];

    const totalAmount = mockInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidAmount = mockPayments.reduce((sum, pay) => sum + pay.amount, 0);

    sendSuccess(res, {
      invoices: mockInvoices,
      payments: mockPayments,
      summary: {
        totalAmount,
        paidAmount,
        pendingAmount: totalAmount - paidAmount,
        invoiceCount: mockInvoices.length,
        paymentCount: mockPayments.length
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

    // Return mock data for now
    const mockECA = [
      { id: 1, activityName: 'Scouts', position: 'Member', achievement: '' },
      { id: 2, activityName: 'Music Club', position: 'Secretary', achievement: 'First Prize in School Competition' },
    ];

    const mockSports = [
      { id: 1, activityName: 'Football', position: 'Team Captain', achievement: 'District Level Winner' },
    ];

    sendSuccess(res, {
      eca: mockECA,
      sports: mockSports,
      summary: {
        ecaCount: mockECA.length,
        sportsCount: mockSports.length
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

    // Return mock data for now
    const mockCertificates = [
      { id: 1, certificateNumber: 'CERT/2024/001', type: 'Character Certificate', issuedDate: '2024-03-15', status: 'active' },
      { id: 2, certificateNumber: 'CERT/2024/002', type: 'Transfer Certificate', issuedDate: '2024-03-20', status: 'active' },
    ];

    sendSuccess(res, {
      certificates: mockCertificates,
      summary: {
        total: mockCertificates.length
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

    // Check if there's a remarks table, otherwise return mock data
    // This can be extended when a remarks model is created
    const mockRemarks = [
      { id: 1, type: 'good', remark: 'Excellent performance in mathematics', teacherName: 'Mr. Sharma', date: '2024-01-15', subject: 'Mathematics' },
      { id: 2, type: 'good', remark: 'Good participation in class discussions', teacherName: 'Mrs. Karki', date: '2024-01-20', subject: 'English' },
      { id: 3, type: 'bad', remark: 'Needs to improve homework submissions', teacherName: 'Mr. Joshi', date: '2024-01-25', subject: 'Science' },
    ];

    let remarks = mockRemarks;
    if (type && type !== 'all') {
      remarks = mockRemarks.filter(r => r.type === type);
    }

    const goodRemarks = mockRemarks.filter(r => r.type === 'good').length;
    const badRemarks = mockRemarks.filter(r => r.type === 'bad').length;

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

    // Mock library data - this should be replaced with actual library records from database
    const mockRecords = [
      {
        id: 1,
        bookTitle: 'Introduction to Computer Science',
        bookCode: 'CS-101',
        author: 'John Doe',
        borrowDate: '2024-01-15',
        dueDate: '2024-02-15',
        returnDate: '2024-02-10',
        status: 'returned',
      },
      {
        id: 2,
        bookTitle: 'Advanced Mathematics',
        bookCode: 'MATH-201',
        author: 'Jane Smith',
        borrowDate: '2024-02-01',
        dueDate: '2024-03-01',
        status: 'borrowed',
      },
      {
        id: 3,
        bookTitle: 'Physics Fundamentals',
        bookCode: 'PHY-101',
        author: 'Robert Johnson',
        borrowDate: '2024-01-20',
        dueDate: '2024-02-20',
        status: 'overdue',
        fine: 50,
      },
      {
        id: 4,
        bookTitle: 'English Literature',
        bookCode: 'ENG-101',
        author: 'Emily Brown',
        borrowDate: '2024-01-10',
        dueDate: '2024-02-10',
        returnDate: '2024-02-08',
        status: 'returned',
      },
    ];

    const totalBorrowed = mockRecords.length;
    const currentlyBorrowed = mockRecords.filter(r => r.status === 'borrowed').length;
    const returned = mockRecords.filter(r => r.status === 'returned').length;
    const overdue = mockRecords.filter(r => r.status === 'overdue').length;
    const totalFines = mockRecords.reduce((sum, r) => sum + (r.fine || 0), 0);

    sendSuccess(res, {
      records: mockRecords,
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

    sendSuccess(res, {
      present: 185,
      total: 200,
      percentage: 92.5,
      absent: 15,
      late: 0,
    }, 'Attendance summary retrieved successfully');
  });

  getMyGrades = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      return;
    }

    sendSuccess(res, [
      { subject: 'Mathematics', grade: 'A+', gpa: 4.0 },
      { subject: 'Science', grade: 'A', gpa: 3.6 },
      { subject: 'English', grade: 'B+', gpa: 3.2 },
      { subject: 'Nepali', grade: 'A', gpa: 3.6 },
      { subject: 'Social Studies', grade: 'A+', gpa: 4.0 },
    ], 'Grades retrieved successfully');
  });

  getMyFeesSummary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not authenticated' } });
      return;
    }

    sendSuccess(res, {
      paid: 45000,
      pending: 15000,
      total: 60000,
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


 

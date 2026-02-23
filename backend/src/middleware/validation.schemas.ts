import Joi from 'joi';

/**
 * Common Validation Schemas
 * Reusable validation schemas for common data types
 * Requirements: 36.5, 36.6
 */

/**
 * Common field validators
 */
export const commonSchemas = {
  /**
   * ID validation (positive integer)
   */
  id: Joi.number().integer().positive().required(),

  /**
   * Optional ID
   */
  optionalId: Joi.number().integer().positive().optional(),

  /**
   * Pagination parameters
   */
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
  }),

  /**
   * Date validation (YYYY-MM-DD format)
   */
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),

  /**
   * Optional date
   */
  optionalDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),

  /**
   * Date range validation
   */
  dateRange: Joi.object({
    startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required()
  }),

  /**
   * Search query
   */
  search: Joi.string().max(100).optional(),

  /**
   * Status filter
   */
  status: Joi.string().valid('active', 'inactive', 'pending', 'completed', 'cancelled').optional()
};

/**
 * Student-related validation schemas
 */
export const studentSchemas = {
  /**
   * Create student validation
   */
  create: Joi.object({
    firstNameEn: Joi.string().min(2).max(50).required(),
    middleNameEn: Joi.string().min(2).max(50).optional(),
    lastNameEn: Joi.string().min(2).max(50).required(),
    firstNameNp: Joi.string().min(2).max(50).required(),
    middleNameNp: Joi.string().min(2).max(50).optional(),
    lastNameNp: Joi.string().min(2).max(50).required(),
    dateOfBirthBS: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    dateOfBirthAD: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
    addressEn: Joi.string().max(200).required(),
    addressNp: Joi.string().max(200).required(),
    phone: Joi.string().pattern(/^(\+977[-\s]?)?[0-9]{7,10}$/).optional(),
    email: Joi.string().email().max(100).optional(),
    fatherName: Joi.string().min(2).max(100).required(),
    fatherPhone: Joi.string().pattern(/^(\+977[-\s]?)?[0-9]{7,10}$/).required(),
    fatherCitizenshipNo: Joi.string().max(50).optional(),
    motherName: Joi.string().min(2).max(100).required(),
    motherPhone: Joi.string().pattern(/^(\+977[-\s]?)?[0-9]{7,10}$/).required(),
    motherCitizenshipNo: Joi.string().max(50).optional(),
    localGuardianName: Joi.string().min(2).max(100).optional(),
    localGuardianPhone: Joi.string().pattern(/^(\+977[-\s]?)?[0-9]{7,10}$/).optional(),
    localGuardianRelation: Joi.string().max(50).optional(),
    admissionClass: Joi.number().integer().min(1).max(12).required(),
    currentClass: Joi.number().integer().min(1).max(12).required(),
    currentSection: Joi.string().max(10).required(),
    currentShift: Joi.string().valid('morning', 'day', 'evening').required(),
    previousSchool: Joi.string().max(200).optional(),
    allergies: Joi.string().max(500).optional(),
    medicalConditions: Joi.string().max(500).optional(),
    emergencyContact: Joi.string().pattern(/^(\+977[-\s]?)?[0-9]{7,10}$/).required()
  }),

  /**
   * Update student validation (all fields optional)
   */
  update: Joi.object({
    firstNameEn: Joi.string().min(2).max(50).optional(),
    middleNameEn: Joi.string().min(2).max(50).optional(),
    lastNameEn: Joi.string().min(2).max(50).optional(),
    firstNameNp: Joi.string().min(2).max(50).optional(),
    middleNameNp: Joi.string().min(2).max(50).optional(),
    lastNameNp: Joi.string().min(2).max(50).optional(),
    gender: Joi.string().valid('male', 'female', 'other').optional(),
    bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
    addressEn: Joi.string().max(200).optional(),
    addressNp: Joi.string().max(200).optional(),
    phone: Joi.string().pattern(/^(\+977[-\s]?)?[0-9]{7,10}$/).optional(),
    email: Joi.string().email().max(100).optional(),
    currentClass: Joi.number().integer().min(1).max(12).optional(),
    currentSection: Joi.string().max(10).optional(),
    currentShift: Joi.string().valid('morning', 'day', 'evening').optional(),
    status: Joi.string().valid('active', 'inactive', 'transferred', 'graduated').optional()
  }).min(1), // At least one field must be provided

  /**
   * Student list filters
   */
  listFilters: Joi.object({
    class: Joi.number().integer().min(1).max(12).optional(),
    section: Joi.string().max(10).optional(),
    shift: Joi.string().valid('morning', 'day', 'evening').optional(),
    status: Joi.string().valid('active', 'inactive', 'transferred', 'graduated').optional(),
    search: Joi.string().max(100).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
};

/**
 * Attendance-related validation schemas
 */
export const attendanceSchemas = {
  /**
   * Mark attendance validation
   */
  mark: Joi.object({
    studentId: Joi.number().integer().positive().required(),
    classId: Joi.number().integer().positive().required(),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    status: Joi.string().valid('present', 'absent', 'late', 'excused').required(),
    periodNumber: Joi.number().integer().min(1).max(10).optional(),
    remarks: Joi.string().max(500).optional()
  }),

  /**
   * Bulk mark attendance (mark all present)
   */
  bulkMark: Joi.object({
    classId: Joi.number().integer().positive().required(),
    date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    periodNumber: Joi.number().integer().min(1).max(10).optional(),
    exceptions: Joi.array().items(
      Joi.object({
        studentId: Joi.number().integer().positive().required(),
        status: Joi.string().valid('absent', 'late', 'excused').required(),
        remarks: Joi.string().max(500).optional()
      })
    ).optional()
  }),

  /**
   * Leave application validation
   */
  leaveApplication: Joi.object({
    studentId: Joi.number().integer().positive().required(),
    startDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    endDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    reason: Joi.string().min(10).max(500).required()
  })
};

/**
 * Examination-related validation schemas
 */
export const examinationSchemas = {
  /**
   * Create exam validation
   */
  createExam: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    type: Joi.string().valid('unit_test', 'first_terminal', 'second_terminal', 'final', 'practical', 'project').required(),
    subjectId: Joi.number().integer().positive().required(),
    classId: Joi.number().integer().positive().required(),
    academicYearId: Joi.number().integer().positive().required(),
    termId: Joi.number().integer().positive().required(),
    examDate: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    duration: Joi.number().integer().min(30).max(300).required(), // Minutes
    fullMarks: Joi.number().integer().min(1).max(100).required(),
    passMarks: Joi.number().integer().min(1).max(100).required(),
    theoryMarks: Joi.number().integer().min(0).max(100).required(),
    practicalMarks: Joi.number().integer().min(0).max(100).required(),
    weightage: Joi.number().min(0).max(100).required()
  }),

  /**
   * Grade entry validation
   */
  gradeEntry: Joi.object({
    examId: Joi.number().integer().positive().required(),
    studentId: Joi.number().integer().positive().required(),
    theoryMarks: Joi.number().min(0).max(100).optional(),
    practicalMarks: Joi.number().min(0).max(100).optional(),
    remarks: Joi.string().max(500).optional()
  })
};

/**
 * Finance-related validation schemas
 */
export const financeSchemas = {
  /**
   * Create fee structure validation
   */
  createFeeStructure: Joi.object({
    name: Joi.string().min(3).max(100).required(),
    applicableClasses: Joi.array().items(Joi.number().integer().min(1).max(12)).min(1).required(),
    applicableShifts: Joi.array().items(Joi.string().valid('morning', 'day', 'evening')).min(1).required(),
    feeComponents: Joi.array().items(
      Joi.object({
        name: Joi.string().min(3).max(100).required(),
        type: Joi.string().valid('admission', 'annual', 'monthly', 'exam', 'transport', 'hostel', 'library', 'lab', 'eca', 'development').required(),
        amount: Joi.number().min(0).required(),
        frequency: Joi.string().valid('one_time', 'monthly', 'quarterly', 'annual').required(),
        isMandatory: Joi.boolean().required()
      })
    ).min(1).required(),
    academicYearId: Joi.number().integer().positive().required()
  }),

  /**
   * Payment processing validation
   */
  processPayment: Joi.object({
    invoiceId: Joi.number().integer().positive().required(),
    amount: Joi.number().min(0).required(),
    paymentMethod: Joi.string().valid('cash', 'bank_transfer', 'esewa', 'khalti', 'ime_pay').required(),
    transactionId: Joi.string().max(100).optional(),
    remarks: Joi.string().max(500).optional()
  })
};

/**
 * Export all schemas
 */
export const validationSchemas = {
  common: commonSchemas,
  student: studentSchemas,
  attendance: attendanceSchemas,
  examination: examinationSchemas,
  finance: financeSchemas
};

/**
 * Application Constants
 * All magic numbers and strings should be defined here
 */

export const ROLES = {
  SCHOOL_ADMIN: 'School_Admin',
  CLASS_TEACHER: 'Class_Teacher',
  SUBJECT_TEACHER: 'Subject_Teacher',
  DEPARTMENT_HEAD: 'Department_Head',
  ECA_COORDINATOR: 'ECA_Coordinator',
  SPORTS_COORDINATOR: 'Sports_Coordinator',
  STUDENT: 'Student',
  PARENT: 'Parent',
  LIBRARIAN: 'Librarian',
  ACCOUNTANT: 'Accountant',
  TRANSPORT_MANAGER: 'Transport_Manager',
  HOSTEL_WARDEN: 'Hostel_Warden',
  NON_TEACHING_STAFF: 'Non_Teaching_Staff'
} as const;

export const SECURITY = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 128,
  JWT_ACCESS_TOKEN_EXPIRY: '30m',
  JWT_REFRESH_TOKEN_EXPIRY: '7d',
  BCRYPT_SALT_ROUNDS: 12,
  SESSION_MAX_AGE: 30 * 60 * 1000 // 30 minutes
} as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
} as const;

export const NEB_GRADING = {
  GRADES: [
    { min: 90, max: 100, grade: 'A+', gpa: 4.0, description: 'Outstanding' },
    { min: 80, max: 89, grade: 'A', gpa: 3.6, description: 'Excellent' },
    { min: 70, max: 79, grade: 'B+', gpa: 3.2, description: 'Very Good' },
    { min: 60, max: 69, grade: 'B', gpa: 2.8, description: 'Good' },
    { min: 50, max: 59, grade: 'C+', gpa: 2.4, description: 'Satisfactory' },
    { min: 40, max: 49, grade: 'C', gpa: 2.0, description: 'Acceptable' },
    { min: 35, max: 39, grade: 'D', gpa: 1.6, description: 'Basic' },
    { min: 0, max: 34, grade: 'NG', gpa: 0.0, description: 'Not Graded' }
  ],
  PASS_PERCENTAGE: 35,
  MIN_GPA_FOR_PROMOTION: 1.6,
  MAX_GPA: 4.0
} as const;

export const ATTENDANCE_STATUS = {
  PRESENT: 'P',
  ABSENT: 'A',
  LATE: 'L',
  EXCUSED: 'E',
  HALF_DAY: 'H'
} as const;

export const PAYMENT_METHODS = {
  CASH: 'cash',
  BANK_TRANSFER: 'bank_transfer',
  ESEWA: 'esewa',
  KHALTI: 'khalti',
  IME_PAY: 'ime_pay'
} as const;

export const FEE_TYPES = {
  ADMISSION: 'admission',
  TUITION: 'tuition',
  MONTHLY: 'monthly',
  EXAMINATION: 'examination',
  TRANSPORT: 'transport',
  HOSTEL: 'hostel',
  LIBRARY: 'library',
  LAB: 'lab',
  ECA: 'eca',
  DEVELOPMENT: 'development'
} as const;

export const EXAM_TYPES = {
  UNIT_TEST: 'unit_test',
  FIRST_TERMINAL: 'first_terminal',
  SECOND_TERMINAL: 'second_terminal',
  FINAL: 'final',
  PRACTICAL: 'practical',
  PROJECT: 'project',
  SEE: 'see',
  NEB: 'neb'
} as const;

export const GENDER = {
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other'
} as const;

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const NEPALI_MONTHS = [
  'Baisakh', 'Jestha', 'Asar', 'Shrawan',
  'Bhadra', 'Ashwin', 'Kartik', 'Mangsir',
  'Poush', 'Magh', 'Falgun', 'Chaitra'
] as const;

export const NEPALI_MONTHS_NP = [
  'बैशाख', 'जेठ', 'असार', 'श्रावण',
  'भाद्र', 'आश्विन', 'कार्तिक', 'मंसिर',
  'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
] as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR'
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

export const FILE_UPLOAD = {
  MAX_SIZE_MB: 10,
  MAX_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
} as const;

export const RATE_LIMITS = {
  LOGIN: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    MAX_REQUESTS: 20 // Increased for development (change back to 5 for production)
  },
  API: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 100
  },
  FILE_UPLOAD: {
    WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS: 10
  }
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];
export type AttendanceStatusType = typeof ATTENDANCE_STATUS[keyof typeof ATTENDANCE_STATUS];
export type PaymentMethodType = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];
export type FeeTypeType = typeof FEE_TYPES[keyof typeof FEE_TYPES];
export type ExamTypeType = typeof EXAM_TYPES[keyof typeof EXAM_TYPES];
export type GenderType = typeof GENDER[keyof typeof GENDER];
export type ErrorCodeType = typeof ERROR_CODES[keyof typeof ERROR_CODES];

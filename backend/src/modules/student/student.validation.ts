import Joi from 'joi';
import { BLOOD_GROUPS, GENDER, PAGINATION } from '@config/constants';

/**
 * Student Validation Schemas
 * Joi validation schemas for student API endpoints
 * Requirements: 2.1-2.13
 */

/**
 * Create student validation schema
 */
export const createStudentSchema = Joi.object({
  // Personal Information (required)
  firstNameEn: Joi.string().trim().min(1).max(50).required()
    .messages({ 'any.required': 'First name (English) is required' }),
  middleNameEn: Joi.string().trim().max(50).allow('', null).optional(),
  lastNameEn: Joi.string().trim().min(1).max(50).required()
    .messages({ 'any.required': 'Last name (English) is required' }),
  firstNameNp: Joi.string().trim().max(50).allow('', null).optional(),
  middleNameNp: Joi.string().trim().max(50).allow('', null).optional(),
  lastNameNp: Joi.string().trim().max(50).allow('', null).optional(),
  
  dateOfBirthBS: Joi.string().trim().pattern(/^\d{4}-\d{2}-\d{2}$/).required()
    .messages({ 
      'any.required': 'Date of birth (BS) is required',
      'string.pattern.base': 'Date of birth (BS) must be in YYYY-MM-DD format'
    }),
  dateOfBirthAD: Joi.date().iso().required()
    .messages({ 'any.required': 'Date of birth (AD) is required' }),
  gender: Joi.string().valid(...Object.values(GENDER)).required()
    .messages({ 'any.required': 'Gender is required' }),
  bloodGroup: Joi.string().valid(...BLOOD_GROUPS).allow('', null).optional(),

  // Contact Information
  addressEn: Joi.string().trim().min(1).max(255).required()
    .messages({ 'any.required': 'Address (English) is required' }),
  addressNp: Joi.string().trim().max(255).allow('', null).optional(),
  phone: Joi.string().trim().pattern(/^(\+977)?[0-9]{7,10}$/).allow('', null).optional()
    .messages({ 'string.pattern.base': 'Invalid phone number format' }),
  email: Joi.string().trim().email().allow('', null).optional(),

  // Guardian Information
  fatherName: Joi.string().trim().min(1).max(100).required()
    .messages({ 'any.required': 'Father name is required' }),
  fatherPhone: Joi.string().trim().pattern(/^(\+977)?[0-9]{7,10}$/).required()
    .messages({ 'any.required': 'Father phone is required' }),
  fatherCitizenshipNo: Joi.string().trim().max(50).allow('', null).optional(),
  motherName: Joi.string().trim().min(1).max(100).required()
    .messages({ 'any.required': 'Mother name is required' }),
  motherPhone: Joi.string().trim().pattern(/^(\+977)?[0-9]{7,10}$/).required()
    .messages({ 'any.required': 'Mother phone is required' }),
  motherCitizenshipNo: Joi.string().trim().max(50).allow('', null).optional(),
  localGuardianName: Joi.string().trim().max(100).allow('', null).optional(),
  localGuardianPhone: Joi.string().trim().pattern(/^(\+977)?[0-9]{7,10}$/).allow('', null).optional(),
  localGuardianRelation: Joi.string().trim().max(50).allow('', null).optional(),

  // Academic Information
  admissionDate: Joi.date().iso().required()
    .messages({ 'any.required': 'Admission date is required' }),
  admissionClass: Joi.number().integer().min(1).max(12).required()
    .messages({ 'any.required': 'Admission class is required' }),
  currentClassId: Joi.number().integer().positive().allow(null).optional(),
  rollNumber: Joi.number().integer().positive().allow(null).optional(),
  previousSchool: Joi.string().trim().max(255).allow('', null).optional(),

  // Health Information
  allergies: Joi.string().trim().max(500).allow('', null).optional(),
  medicalConditions: Joi.string().trim().max(500).allow('', null).optional(),
  emergencyContact: Joi.string().trim().pattern(/^(\+977)?[0-9]{7,10}$/).required()
    .messages({ 'any.required': 'Emergency contact is required' }),

  // Optional IDs
  symbolNumber: Joi.string().trim().max(50).allow('', null).optional(),
  nebRegistrationNumber: Joi.string().trim().max(50).allow('', null).optional()
});

/**
 * Update student validation schema (all fields optional)
 */
export const updateStudentSchema = Joi.object({
  firstNameEn: Joi.string().trim().min(1).max(50).optional(),
  middleNameEn: Joi.string().trim().max(50).allow('', null).optional(),
  lastNameEn: Joi.string().trim().min(1).max(50).optional(),
  firstNameNp: Joi.string().trim().max(50).allow('', null).optional(),
  middleNameNp: Joi.string().trim().max(50).allow('', null).optional(),
  lastNameNp: Joi.string().trim().max(50).allow('', null).optional(),
  dateOfBirthBS: Joi.string().trim().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateOfBirthAD: Joi.date().iso().optional(),
  gender: Joi.string().valid(...Object.values(GENDER)).optional(),
  bloodGroup: Joi.string().valid(...BLOOD_GROUPS).allow('', null).optional(),
  addressEn: Joi.string().trim().min(1).max(255).optional(),
  addressNp: Joi.string().trim().max(255).allow('', null).optional(),
  phone: Joi.string().trim().pattern(/^(\+977)?[0-9]{7,10}$/).allow('', null).optional(),
  email: Joi.string().trim().email().allow('', null).optional(),
  fatherName: Joi.string().trim().min(1).max(100).optional(),
  fatherPhone: Joi.string().trim().pattern(/^(\+977)?[0-9]{7,10}$/).optional(),
  fatherCitizenshipNo: Joi.string().trim().max(50).allow('', null).optional(),
  motherName: Joi.string().trim().min(1).max(100).optional(),
  motherPhone: Joi.string().trim().pattern(/^(\+977)?[0-9]{7,10}$/).optional(),
  motherCitizenshipNo: Joi.string().trim().max(50).allow('', null).optional(),
  localGuardianName: Joi.string().trim().max(100).allow('', null).optional(),
  localGuardianPhone: Joi.string().trim().pattern(/^(\+977)?[0-9]{7,10}$/).allow('', null).optional(),
  localGuardianRelation: Joi.string().trim().max(50).allow('', null).optional(),
  currentClassId: Joi.number().integer().positive().allow(null).optional(),
  rollNumber: Joi.number().integer().positive().allow(null).optional(),
  previousSchool: Joi.string().trim().max(255).allow('', null).optional(),
  allergies: Joi.string().trim().max(500).allow('', null).optional(),
  medicalConditions: Joi.string().trim().max(500).allow('', null).optional(),
  emergencyContact: Joi.string().trim().pattern(/^(\+977)?[0-9]{7,10}$/).optional(),
  symbolNumber: Joi.string().trim().max(50).allow('', null).optional(),
  nebRegistrationNumber: Joi.string().trim().max(50).allow('', null).optional(),
  status: Joi.string().valid('active', 'inactive', 'transferred', 'graduated', 'suspended').optional()
}).min(1).messages({ 'object.min': 'At least one field must be provided for update' });

/**
 * Student list query validation schema
 */
export const listStudentsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(PAGINATION.DEFAULT_PAGE).optional(),
  limit: Joi.number().integer().min(1).max(PAGINATION.MAX_PAGE_SIZE).default(PAGINATION.DEFAULT_PAGE_SIZE).optional(),
  search: Joi.string().trim().max(100).allow('', null).optional(),
  classId: Joi.number().integer().positive().allow(null).optional(),
  status: Joi.string().valid('active', 'inactive', 'transferred', 'graduated', 'suspended').optional(),
  gender: Joi.string().valid(...Object.values(GENDER)).optional(),
  admissionClass: Joi.number().integer().min(1).max(12).optional(),
  sortBy: Joi.string().valid('firstNameEn', 'lastNameEn', 'studentCode', 'admissionDate', 'rollNumber', 'createdAt').default('createdAt').optional(),
  sortOrder: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC').optional()
});

/**
 * Student ID parameter validation
 */
export const studentIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Student ID is required' })
});

/**
 * Promote student validation schema
 */
export const promoteStudentSchema = Joi.object({
  academicYearId: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Academic year ID is required' }),
  nextClassId: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'Next class ID is required' }),
  currentClassId: Joi.number().integer().positive().required(),
  currentGradeLevel: Joi.number().integer().min(1).max(12).required(),
  rollNumber: Joi.number().integer().positive().optional(),
  attendancePercentage: Joi.number().min(0).max(100).optional(),
  gpa: Joi.number().min(0).max(4.0).optional(),
  totalMarks: Joi.number().min(0).optional(),
  rank: Joi.number().integer().positive().optional(),
  hasFailingGrades: Joi.boolean().optional()
});

/**
 * Transfer student validation schema
 */
export const transferStudentSchema = Joi.object({
  newClassId: Joi.number().integer().positive().required()
    .messages({ 'any.required': 'New class ID is required' }),
  newRollNumber: Joi.number().integer().positive().optional(),
  reason: Joi.string().trim().max(500).optional()
});

/**
 * Document upload category validation
 */
export const documentCategorySchema = Joi.object({
  category: Joi.string().valid(
    'birth_certificate',
    'medical_records',
    'previous_school',
    'id_proof',
    'photo',
    'general'
  ).default('general').optional()
});

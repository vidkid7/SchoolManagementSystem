/**
 * Library Validation Schemas
 * 
 * Defines validation rules for library API endpoints
 * 
 * Requirements: 10.1-10.13
 */

import { body, param, query } from 'express-validator';

export const libraryValidation = {
  /**
   * Validation for creating a book
   */
  createBook: [
    body('accessionNumber')
      .trim()
      .notEmpty()
      .withMessage('Accession number is required')
      .isLength({ min: 3, max: 50 })
      .withMessage('Accession number must be between 3 and 50 characters'),

    body('isbn')
      .optional()
      .trim()
      .isLength({ min: 10, max: 13 })
      .withMessage('ISBN must be 10 or 13 characters'),

    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ min: 1, max: 255 })
      .withMessage('Title must be between 1 and 255 characters'),

    body('author')
      .trim()
      .notEmpty()
      .withMessage('Author is required')
      .isLength({ min: 1, max: 255 })
      .withMessage('Author must be between 1 and 255 characters'),

    body('publisher')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('Publisher must not exceed 255 characters'),

    body('category')
      .trim()
      .notEmpty()
      .withMessage('Category is required')
      .isLength({ max: 100 })
      .withMessage('Category must not exceed 100 characters'),

    body('language')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Language must not exceed 50 characters'),

    body('copies')
      .isInt({ min: 1 })
      .withMessage('Copies must be a positive integer'),

    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),

    body('location')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Location must not exceed 100 characters'),
  ],

  /**
   * Validation for issuing a book
   */
  issueBook: [
    body('bookId')
      .isInt({ min: 1 })
      .withMessage('Valid book ID is required'),

    body('studentId')
      .isInt({ min: 1 })
      .withMessage('Valid student ID is required'),

    body('dueDate')
      .optional()
      .isISO8601()
      .withMessage('Due date must be a valid date'),

    body('condition')
      .optional()
      .isIn(['good', 'damaged', 'poor'])
      .withMessage('Condition must be good, damaged, or poor'),
  ],

  /**
   * Validation for returning a book
   */
  returnBook: [
    body('circulationId')
      .isInt({ min: 1 })
      .withMessage('Valid circulation ID is required'),

    body('condition')
      .optional()
      .isIn(['good', 'damaged', 'poor'])
      .withMessage('Condition must be good, damaged, or poor'),
  ],

  /**
   * Validation for renewing a book
   */
  renewBook: [
    body('circulationId')
      .isInt({ min: 1 })
      .withMessage('Valid circulation ID is required'),
  ],

  /**
   * Validation for reserving a book
   */
  reserveBook: [
    body('bookId')
      .isInt({ min: 1 })
      .withMessage('Valid book ID is required'),

    body('studentId')
      .isInt({ min: 1 })
      .withMessage('Valid student ID is required'),
  ],

  /**
   * Validation for paying a fine
   */
  payFine: [
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Amount must be a positive number'),

    body('paymentMethod')
      .trim()
      .notEmpty()
      .withMessage('Payment method is required')
      .isIn(['cash', 'bank_transfer', 'online', 'esewa', 'khalti', 'ime_pay'])
      .withMessage('Invalid payment method'),

    body('transactionId')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Transaction ID must not exceed 100 characters'),
  ],
};

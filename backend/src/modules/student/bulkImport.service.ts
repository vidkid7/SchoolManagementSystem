import * as XLSX from 'xlsx';
import { logger } from '@utils/logger';
import { Gender, StudentStatus, StudentCreationAttributes } from '@models/Student.model';
import StudentRepository from './student.repository';
import studentIdService from './studentId.service';
import { Request } from 'express';

/**
 * Bulk Import Error
 */
export interface ImportError {
  row: number;
  field: string;
  message: string;
  value?: string;
}

/**
 * Import Result
 */
export interface BulkImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  errors: ImportError[];
  importedStudentIds: string[];
}

/**
 * Expected Excel column mapping
 */
const COLUMN_MAPPING: Record<string, string> = {
  'First Name (English)': 'firstNameEn',
  'Middle Name (English)': 'middleNameEn',
  'Last Name (English)': 'lastNameEn',
  'First Name (Nepali)': 'firstNameNp',
  'Middle Name (Nepali)': 'middleNameNp',
  'Last Name (Nepali)': 'lastNameNp',
  'Date of Birth (BS)': 'dateOfBirthBS',
  'Date of Birth (AD)': 'dateOfBirthAD',
  'Gender': 'gender',
  'Blood Group': 'bloodGroup',
  'Address (English)': 'addressEn',
  'Address (Nepali)': 'addressNp',
  'Phone': 'phone',
  'Email': 'email',
  'Father Name': 'fatherName',
  'Father Phone': 'fatherPhone',
  'Father Citizenship No': 'fatherCitizenshipNo',
  'Mother Name': 'motherName',
  'Mother Phone': 'motherPhone',
  'Mother Citizenship No': 'motherCitizenshipNo',
  'Local Guardian Name': 'localGuardianName',
  'Local Guardian Phone': 'localGuardianPhone',
  'Local Guardian Relation': 'localGuardianRelation',
  'Admission Date': 'admissionDate',
  'Admission Class': 'admissionClass',
  'Current Class ID': 'currentClassId',
  'Roll Number': 'rollNumber',
  'Previous School': 'previousSchool',
  'Allergies': 'allergies',
  'Medical Conditions': 'medicalConditions',
  'Emergency Contact': 'emergencyContact',
  'Symbol Number': 'symbolNumber',
  'NEB Registration Number': 'nebRegistrationNumber',
  'Photo URL': 'photoUrl'
};

/**
 * Required fields for import
 */
const REQUIRED_FIELDS = [
  'firstNameEn',
  'lastNameEn',
  'dateOfBirthBS',
  'dateOfBirthAD',
  'gender',
  'addressEn',
  'fatherName',
  'fatherPhone',
  'motherName',
  'motherPhone',
  'emergencyContact',
  'admissionDate',
  'admissionClass'
];

/**
 * Student Bulk Import Service
 * Parses Excel files with student data and imports them
 * Requirements: 2.7
 */
class BulkImportService {
  private studentRepository: typeof StudentRepository;

  constructor() {
    this.studentRepository = StudentRepository;
  }

  /**
   * Parse Excel file and import students
   * @param fileBuffer - Excel file buffer
   * @param userId - User performing the import
   * @param req - Express request for audit logging
   * @returns Import result with summary
   */
  async importFromExcel(
    fileBuffer: Buffer,
    userId?: number,
    req?: Request
  ): Promise<BulkImportResult> {
    const result: BulkImportResult = {
      totalRows: 0,
      successCount: 0,
      errorCount: 0,
      skippedCount: 0,
      errors: [],
      importedStudentIds: []
    };

    try {
      // Parse Excel file
      const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
      
      if (workbook.SheetNames.length === 0) {
        result.errors.push({
          row: 0,
          field: 'file',
          message: 'Excel file has no sheets'
        });
        return result;
      }

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON with header row
      const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
        defval: '',
        raw: false
      });

      result.totalRows = rawData.length;

      if (rawData.length === 0) {
        result.errors.push({
          row: 0,
          field: 'file',
          message: 'Excel file has no data rows'
        });
        return result;
      }

      logger.info('Starting bulk student import', {
        totalRows: rawData.length,
        sheetName
      });

      // Process each row
      for (let i = 0; i < rawData.length; i++) {
        const rowNumber = i + 2; // +2 because row 1 is header, data starts at row 2
        const rawRow = rawData[i];

        try {
          // Map Excel columns to field names
          const mappedRow = this.mapColumns(rawRow);

          // Validate row data
          const validationErrors = this.validateRow(mappedRow, rowNumber);
          
          if (validationErrors.length > 0) {
            result.errors.push(...validationErrors);
            result.errorCount++;
            continue;
          }

          // Generate student ID
          const admissionDate = new Date(mappedRow.admissionDate);
          const studentCode = await studentIdService.generateStudentId(admissionDate);

          // Prepare student data
          const studentData: StudentCreationAttributes = {
            studentCode,
            firstNameEn: String(mappedRow.firstNameEn).trim(),
            middleNameEn: mappedRow.middleNameEn ? String(mappedRow.middleNameEn).trim() : undefined,
            lastNameEn: String(mappedRow.lastNameEn).trim(),
            firstNameNp: mappedRow.firstNameNp ? String(mappedRow.firstNameNp).trim() : undefined,
            middleNameNp: mappedRow.middleNameNp ? String(mappedRow.middleNameNp).trim() : undefined,
            lastNameNp: mappedRow.lastNameNp ? String(mappedRow.lastNameNp).trim() : undefined,
            dateOfBirthBS: String(mappedRow.dateOfBirthBS).trim(),
            dateOfBirthAD: new Date(mappedRow.dateOfBirthAD),
            gender: this.parseGender(mappedRow.gender),
            bloodGroup: mappedRow.bloodGroup ? String(mappedRow.bloodGroup).trim() : undefined,
            addressEn: String(mappedRow.addressEn).trim(),
            addressNp: mappedRow.addressNp ? String(mappedRow.addressNp).trim() : undefined,
            phone: mappedRow.phone ? String(mappedRow.phone).trim() : undefined,
            email: mappedRow.email ? String(mappedRow.email).trim() : undefined,
            fatherName: String(mappedRow.fatherName).trim(),
            fatherPhone: String(mappedRow.fatherPhone).trim(),
            fatherCitizenshipNo: mappedRow.fatherCitizenshipNo ? String(mappedRow.fatherCitizenshipNo).trim() : undefined,
            motherName: String(mappedRow.motherName).trim(),
            motherPhone: String(mappedRow.motherPhone).trim(),
            motherCitizenshipNo: mappedRow.motherCitizenshipNo ? String(mappedRow.motherCitizenshipNo).trim() : undefined,
            localGuardianName: mappedRow.localGuardianName ? String(mappedRow.localGuardianName).trim() : undefined,
            localGuardianPhone: mappedRow.localGuardianPhone ? String(mappedRow.localGuardianPhone).trim() : undefined,
            localGuardianRelation: mappedRow.localGuardianRelation ? String(mappedRow.localGuardianRelation).trim() : undefined,
            admissionDate,
            admissionClass: parseInt(String(mappedRow.admissionClass), 10),
            currentClassId: mappedRow.currentClassId ? parseInt(String(mappedRow.currentClassId), 10) : undefined,
            rollNumber: mappedRow.rollNumber ? parseInt(String(mappedRow.rollNumber), 10) : undefined,
            previousSchool: mappedRow.previousSchool ? String(mappedRow.previousSchool).trim() : undefined,
            allergies: mappedRow.allergies ? String(mappedRow.allergies).trim() : undefined,
            medicalConditions: mappedRow.medicalConditions ? String(mappedRow.medicalConditions).trim() : undefined,
            emergencyContact: String(mappedRow.emergencyContact).trim(),
            symbolNumber: mappedRow.symbolNumber ? String(mappedRow.symbolNumber).trim() : undefined,
            nebRegistrationNumber: mappedRow.nebRegistrationNumber ? String(mappedRow.nebRegistrationNumber).trim() : undefined,
            status: StudentStatus.ACTIVE
          };

          // Create student
          const student = await this.studentRepository.create(studentData, userId, req);
          result.successCount++;
          result.importedStudentIds.push(student.studentCode);

          logger.debug('Student imported successfully', {
            row: rowNumber,
            studentCode: student.studentCode
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          result.errors.push({
            row: rowNumber,
            field: 'general',
            message: `Failed to import: ${errorMessage}`
          });
          result.errorCount++;

          logger.error('Error importing student row', {
            row: rowNumber,
            error: errorMessage
          });
        }
      }

      logger.info('Bulk student import completed', {
        totalRows: result.totalRows,
        successCount: result.successCount,
        errorCount: result.errorCount,
        skippedCount: result.skippedCount
      });

      return result;

    } catch (error) {
      logger.error('Error parsing Excel file for bulk import', { error });
      result.errors.push({
        row: 0,
        field: 'file',
        message: `Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      return result;
    }
  }

  /**
   * Map Excel column headers to internal field names
   */
  private mapColumns(rawRow: Record<string, any>): Record<string, any> {
    const mapped: Record<string, any> = {};

    for (const [excelHeader, fieldName] of Object.entries(COLUMN_MAPPING)) {
      if (rawRow[excelHeader] !== undefined && rawRow[excelHeader] !== '') {
        mapped[fieldName] = rawRow[excelHeader];
      }
    }

    // Also try direct field names (for programmatic imports)
    for (const fieldName of Object.values(COLUMN_MAPPING)) {
      if (rawRow[fieldName] !== undefined && rawRow[fieldName] !== '' && !mapped[fieldName]) {
        mapped[fieldName] = rawRow[fieldName];
      }
    }

    return mapped;
  }

  /**
   * Validate a single row of import data
   */
  private validateRow(row: Record<string, any>, rowNumber: number): ImportError[] {
    const errors: ImportError[] = [];

    // Check required fields
    for (const field of REQUIRED_FIELDS) {
      if (!row[field] || String(row[field]).trim() === '') {
        const excelHeader = Object.entries(COLUMN_MAPPING).find(([, v]) => v === field)?.[0] || field;
        errors.push({
          row: rowNumber,
          field,
          message: `Required field "${excelHeader}" is missing or empty`
        });
      }
    }

    // Validate gender
    if (row.gender) {
      const validGenders = ['male', 'female', 'other', 'Male', 'Female', 'Other', 'M', 'F'];
      if (!validGenders.includes(String(row.gender).trim())) {
        errors.push({
          row: rowNumber,
          field: 'gender',
          message: `Invalid gender value: "${row.gender}". Expected: male, female, or other`,
          value: String(row.gender)
        });
      }
    }

    // Validate date of birth BS format (YYYY-MM-DD)
    if (row.dateOfBirthBS) {
      const bsDatePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!bsDatePattern.test(String(row.dateOfBirthBS).trim())) {
        errors.push({
          row: rowNumber,
          field: 'dateOfBirthBS',
          message: `Invalid BS date format: "${row.dateOfBirthBS}". Expected: YYYY-MM-DD`,
          value: String(row.dateOfBirthBS)
        });
      }
    }

    // Validate date of birth AD
    if (row.dateOfBirthAD) {
      const adDate = new Date(row.dateOfBirthAD);
      if (isNaN(adDate.getTime())) {
        errors.push({
          row: rowNumber,
          field: 'dateOfBirthAD',
          message: `Invalid AD date: "${row.dateOfBirthAD}"`,
          value: String(row.dateOfBirthAD)
        });
      }
    }

    // Validate admission date
    if (row.admissionDate) {
      const admDate = new Date(row.admissionDate);
      if (isNaN(admDate.getTime())) {
        errors.push({
          row: rowNumber,
          field: 'admissionDate',
          message: `Invalid admission date: "${row.admissionDate}"`,
          value: String(row.admissionDate)
        });
      }
    }

    // Validate admission class (1-12)
    if (row.admissionClass) {
      const classNum = parseInt(String(row.admissionClass), 10);
      if (isNaN(classNum) || classNum < 1 || classNum > 12) {
        errors.push({
          row: rowNumber,
          field: 'admissionClass',
          message: `Invalid admission class: "${row.admissionClass}". Expected: 1-12`,
          value: String(row.admissionClass)
        });
      }
    }

    // Validate phone numbers (Nepal format)
    const phoneFields = ['fatherPhone', 'motherPhone', 'emergencyContact', 'phone'];
    for (const field of phoneFields) {
      if (row[field]) {
        const phone = String(row[field]).trim();
        // Nepal phone: 10 digits starting with 9 (mobile) or landline patterns
        if (phone && !/^(\+977)?[0-9]{7,10}$/.test(phone.replace(/[-\s]/g, ''))) {
          errors.push({
            row: rowNumber,
            field,
            message: `Invalid phone number format: "${phone}"`,
            value: phone
          });
        }
      }
    }

    // Validate email if provided
    if (row.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(String(row.email).trim())) {
        errors.push({
          row: rowNumber,
          field: 'email',
          message: `Invalid email format: "${row.email}"`,
          value: String(row.email)
        });
      }
    }

    // Validate blood group if provided
    if (row.bloodGroup) {
      const validBloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
      if (!validBloodGroups.includes(String(row.bloodGroup).trim())) {
        errors.push({
          row: rowNumber,
          field: 'bloodGroup',
          message: `Invalid blood group: "${row.bloodGroup}". Expected: ${validBloodGroups.join(', ')}`,
          value: String(row.bloodGroup)
        });
      }
    }

    return errors;
  }

  /**
   * Parse gender string to Gender enum
   */
  private parseGender(value: string): Gender {
    const normalized = String(value).trim().toLowerCase();
    switch (normalized) {
      case 'male':
      case 'm':
        return Gender.MALE;
      case 'female':
      case 'f':
        return Gender.FEMALE;
      case 'other':
      case 'o':
        return Gender.OTHER;
      default:
        return Gender.OTHER;
    }
  }

  /**
   * Generate a sample Excel template for bulk import
   * @returns Buffer containing the Excel template
   */
  generateImportTemplate(): Buffer {
    const headers = Object.keys(COLUMN_MAPPING);
    
    const sampleData = [
      {
        'First Name (English)': 'Ram',
        'Middle Name (English)': 'Bahadur',
        'Last Name (English)': 'Thapa',
        'First Name (Nepali)': 'राम',
        'Middle Name (Nepali)': 'बहादुर',
        'Last Name (Nepali)': 'थापा',
        'Date of Birth (BS)': '2067-05-15',
        'Date of Birth (AD)': '2010-08-31',
        'Gender': 'male',
        'Blood Group': 'B+',
        'Address (English)': 'Kathmandu, Nepal',
        'Address (Nepali)': 'काठमाडौं, नेपाल',
        'Phone': '',
        'Email': '',
        'Father Name': 'Hari Thapa',
        'Father Phone': '9841000001',
        'Father Citizenship No': '12-34-56789',
        'Mother Name': 'Sita Thapa',
        'Mother Phone': '9841000002',
        'Mother Citizenship No': '',
        'Local Guardian Name': '',
        'Local Guardian Phone': '',
        'Local Guardian Relation': '',
        'Admission Date': '2024-04-15',
        'Admission Class': '1',
        'Current Class ID': '',
        'Roll Number': '1',
        'Previous School': '',
        'Allergies': '',
        'Medical Conditions': '',
        'Emergency Contact': '9841000001',
        'Symbol Number': '',
        'NEB Registration Number': '',
        'Photo URL': 'https://example.com/photos/student.jpg'
      }
    ];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });

    // Set column widths
    const colWidths = headers.map(h => ({ wch: Math.max(h.length + 2, 15) }));
    worksheet['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Add instructions sheet
    const instructions = [
      { 'Instructions': 'Student Bulk Import Template' },
      { 'Instructions': '' },
      { 'Instructions': 'Required Fields (marked with *):' },
      { 'Instructions': '* First Name (English)' },
      { 'Instructions': '* Last Name (English)' },
      { 'Instructions': '* Date of Birth (BS) - Format: YYYY-MM-DD' },
      { 'Instructions': '* Date of Birth (AD) - Format: YYYY-MM-DD' },
      { 'Instructions': '* Gender - Values: male, female, other' },
      { 'Instructions': '* Address (English)' },
      { 'Instructions': '* Father Name' },
      { 'Instructions': '* Father Phone' },
      { 'Instructions': '* Mother Name' },
      { 'Instructions': '* Mother Phone' },
      { 'Instructions': '* Emergency Contact' },
      { 'Instructions': '* Admission Date - Format: YYYY-MM-DD' },
      { 'Instructions': '* Admission Class - Values: 1-12' },
      { 'Instructions': '' },
      { 'Instructions': 'Optional Fields:' },
      { 'Instructions': 'Middle Name, Nepali names, Blood Group, Phone, Email, etc.' },
      { 'Instructions': '' },
      { 'Instructions': 'Blood Group Values: A+, A-, B+, B-, AB+, AB-, O+, O-' },
      { 'Instructions': 'Phone Format: 10-digit Nepal mobile number (e.g., 9841000001)' }
    ];

    const instructionSheet = XLSX.utils.json_to_sheet(instructions);
    XLSX.utils.book_append_sheet(workbook, instructionSheet, 'Instructions');

    return Buffer.from(XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }));
  }
}

export default new BulkImportService();

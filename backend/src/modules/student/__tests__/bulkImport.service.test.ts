import BulkImportService from '../bulkImport.service';
import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import sequelize from '@config/database';
import Student from '@models/Student.model';

/**
 * Bulk Import Service Tests
 * Tests for student bulk import functionality
 * Requirements: 2.7
 */

describe('BulkImportService', () => {
  let bulkImportService: typeof BulkImportService;
  const TEST_DATA_DIR = path.join(process.cwd(), 'uploads', 'test-imports');

  beforeAll(async () => {
    bulkImportService = BulkImportService;
    
    // Ensure test directory exists
    if (!fs.existsSync(TEST_DATA_DIR)) {
      fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
    }

    // Sync database schema
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.sync({ force: true, logging: false });
  });

  afterAll(async () => {
    // Cleanup test directory
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
    }

    // Re-enable foreign key checks and close connection
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    await sequelize.close();
  });

  describe('importFromExcel', () => {
    it('should import a valid single student', async () => {
      // Create a test Excel file with valid student data
      const studentData = [
        {
          'First Name (English)': 'Test',
          'Middle Name (English)': '',
          'Last Name (English)': 'Student',
          'First Name (Nepali)': 'टेस्ट',
          'Middle Name (Nepali)': '',
          'Last Name (Nepali)': 'विद्यार्थी',
          'Date of Birth (BS)': '2067-01-01',
          'Date of Birth (AD)': '2010-04-14',
          'Gender': 'male',
          'Blood Group': 'B+',
          'Address (English)': 'Kathmandu',
          'Address (Nepali)': 'काठमाडौं',
          'Phone': '',
          'Email': '',
          'Father Name': 'Test Father',
          'Father Phone': '9841000001',
          'Father Citizenship No': '',
          'Mother Name': 'Test Mother',
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
          'NEB Registration Number': ''
        }
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(studentData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const result = await bulkImportService.importFromExcel(excelBuffer, 1);

      expect(result.totalRows).toBe(1);
      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(0);
      expect(result.skippedCount).toBe(0);
      expect(result.importedStudentIds.length).toBe(1);

      // Cleanup
      const student = await Student.findOne({ where: { firstNameEn: 'Test' } });
      if (student) {
        await student.destroy({ force: true });
      }
    });

    it('should handle multiple students in one import', async () => {
      const studentData = [
        {
          'First Name (English)': 'Student',
          'Middle Name (English)': '',
          'Last Name (English)': 'One',
          'First Name (Nepali)': 'विद्यार्थी',
          'Middle Name (Nepali)': '',
          'Last Name (Nepali)': 'एक',
          'Date of Birth (BS)': '2067-01-01',
          'Date of Birth (AD)': '2010-04-14',
          'Gender': 'male',
          'Blood Group': 'A+',
          'Address (English)': 'Kathmandu',
          'Address (Nepali)': 'काठमाडौं',
          'Phone': '',
          'Email': '',
          'Father Name': 'Father One',
          'Father Phone': '9841000001',
          'Father Citizenship No': '',
          'Mother Name': 'Mother One',
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
          'NEB Registration Number': ''
        },
        {
          'First Name (English)': 'Student',
          'Middle Name (English)': '',
          'Last Name (English)': 'Two',
          'First Name (Nepali)': 'विद्यार्थी',
          'Middle Name (Nepali)': '',
          'Last Name (Nepali)': 'दुई',
          'Date of Birth (BS)': '2067-02-01',
          'Date of Birth (AD)': '2010-05-14',
          'Gender': 'female',
          'Blood Group': 'O+',
          'Address (English)': 'Lalitpur',
          'Address (Nepali)': 'ललितपुर',
          'Phone': '',
          'Email': '',
          'Father Name': 'Father Two',
          'Father Phone': '9841000003',
          'Father Citizenship No': '',
          'Mother Name': 'Mother Two',
          'Mother Phone': '9841000004',
          'Mother Citizenship No': '',
          'Local Guardian Name': '',
          'Local Guardian Phone': '',
          'Local Guardian Relation': '',
          'Admission Date': '2024-04-15',
          'Admission Class': '1',
          'Current Class ID': '',
          'Roll Number': '2',
          'Previous School': '',
          'Allergies': '',
          'Medical Conditions': '',
          'Emergency Contact': '9841000003',
          'Symbol Number': '',
          'NEB Registration Number': ''
        }
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(studentData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const result = await bulkImportService.importFromExcel(excelBuffer, 1);

      expect(result.totalRows).toBe(2);
      expect(result.successCount).toBe(2);
      expect(result.errorCount).toBe(0);

      // Cleanup
      const students = await Student.findAll({ where: { lastNameEn: ['One', 'Two'] } });
      for (const student of students) {
        await student.destroy({ force: true });
      }
    });

    it('should report validation errors for missing required fields', async () => {
      // Student data missing required fields
      const invalidData = [
        {
          'First Name (English)': '',
          'Middle Name (English)': '',
          'Last Name (English)': '',
          'First Name (Nepali)': '',
          'Middle Name (Nepali)': '',
          'Last Name (Nepali)': '',
          'Date of Birth (BS)': '',
          'Date of Birth (AD)': '',
          'Gender': '',
          'Blood Group': '',
          'Address (English)': '',
          'Address (Nepali)': '',
          'Phone': '',
          'Email': '',
          'Father Name': '',
          'Father Phone': '',
          'Father Citizenship No': '',
          'Mother Name': '',
          'Mother Phone': '',
          'Mother Citizenship No': '',
          'Local Guardian Name': '',
          'Local Guardian Phone': '',
          'Local Guardian Relation': '',
          'Admission Date': '',
          'Admission Class': '',
          'Current Class ID': '',
          'Roll Number': '',
          'Previous School': '',
          'Allergies': '',
          'Medical Conditions': '',
          'Emergency Contact': '',
          'Symbol Number': '',
          'NEB Registration Number': ''
        }
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(invalidData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const result = await bulkImportService.importFromExcel(excelBuffer, 1);

      expect(result.totalRows).toBe(1);
      expect(result.successCount).toBe(0);
      expect(result.errorCount).toBe(1);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('firstNameEn');
    });

    it('should report errors for invalid gender values', async () => {
      const invalidGenderData = [
        {
          'First Name (English)': 'Test',
          'Middle Name (English)': '',
          'Last Name (English)': 'Student',
          'First Name (Nepali)': 'टेस्ट',
          'Middle Name (Nepali)': '',
          'Last Name (Nepali)': 'विद्यार्थी',
          'Date of Birth (BS)': '2067-01-01',
          'Date of Birth (AD)': '2010-04-14',
          'Gender': 'invalid_gender',
          'Blood Group': 'B+',
          'Address (English)': 'Kathmandu',
          'Address (Nepali)': 'काठमाडौं',
          'Phone': '',
          'Email': '',
          'Father Name': 'Test Father',
          'Father Phone': '9841000001',
          'Father Citizenship No': '',
          'Mother Name': 'Test Mother',
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
          'NEB Registration Number': ''
        }
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(invalidGenderData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const result = await bulkImportService.importFromExcel(excelBuffer, 1);

      expect(result.errorCount).toBe(1);
      expect(result.errors[0].field).toBe('gender');
    });

    it('should report errors for invalid phone numbers', async () => {
      const invalidPhoneData = [
        {
          'First Name (English)': 'Test',
          'Middle Name (English)': '',
          'Last Name (English)': 'Student',
          'First Name (Nepali)': 'टेस्ट',
          'Middle Name (Nepali)': '',
          'Last Name (Nepali)': 'विद्यार्थी',
          'Date of Birth (BS)': '2067-01-01',
          'Date of Birth (AD)': '2010-04-14',
          'Gender': 'male',
          'Blood Group': 'B+',
          'Address (English)': 'Kathmandu',
          'Address (Nepali)': 'काठमाडौं',
          'Phone': '',
          'Email': '',
          'Father Name': 'Test Father',
          'Father Phone': '12345', // Invalid phone
          'Father Citizenship No': '',
          'Mother Name': 'Test Mother',
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
          'NEB Registration Number': ''
        }
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(invalidPhoneData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const result = await bulkImportService.importFromExcel(excelBuffer, 1);

      expect(result.errorCount).toBe(1);
      expect(result.errors.some(e => e.field === 'fatherPhone')).toBe(true);
    });

    it('should report errors for invalid admission class', async () => {
      const invalidClassData = [
        {
          'First Name (English)': 'Test',
          'Middle Name (English)': '',
          'Last Name (English)': 'Student',
          'First Name (Nepali)': 'टेस्ट',
          'Middle Name (Nepali)': '',
          'Last Name (Nepali)': 'विद्यार्थी',
          'Date of Birth (BS)': '2067-01-01',
          'Date of Birth (AD)': '2010-04-14',
          'Gender': 'male',
          'Blood Group': 'B+',
          'Address (English)': 'Kathmandu',
          'Address (Nepali)': 'काठमाडौं',
          'Phone': '',
          'Email': '',
          'Father Name': 'Test Father',
          'Father Phone': '9841000001',
          'Father Citizenship No': '',
          'Mother Name': 'Test Mother',
          'Mother Phone': '9841000002',
          'Mother Citizenship No': '',
          'Local Guardian Name': '',
          'Local Guardian Phone': '',
          'Local Guardian Relation': '',
          'Admission Date': '2024-04-15',
          'Admission Class': '15', // Invalid: > 12
          'Current Class ID': '',
          'Roll Number': '1',
          'Previous School': '',
          'Allergies': '',
          'Medical Conditions': '',
          'Emergency Contact': '9841000001',
          'Symbol Number': '',
          'NEB Registration Number': ''
        }
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(invalidClassData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const result = await bulkImportService.importFromExcel(excelBuffer, 1);

      expect(result.errorCount).toBe(1);
      expect(result.errors.some(e => e.field === 'admissionClass')).toBe(true);
    });

    it('should report errors for invalid email format', async () => {
      const invalidEmailData = [
        {
          'First Name (English)': 'Test',
          'Middle Name (English)': '',
          'Last Name (English)': 'Student',
          'First Name (Nepali)': 'टेस्ट',
          'Middle Name (Nepali)': '',
          'Last Name (Nepali)': 'विद्यार्थी',
          'Date of Birth (BS)': '2067-01-01',
          'Date of Birth (AD)': '2010-04-14',
          'Gender': 'male',
          'Blood Group': 'B+',
          'Address (English)': 'Kathmandu',
          'Address (Nepali)': 'काठमाडौं',
          'Phone': '',
          'Email': 'invalid-email', // Invalid email
          'Father Name': 'Test Father',
          'Father Phone': '9841000001',
          'Father Citizenship No': '',
          'Mother Name': 'Test Mother',
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
          'NEB Registration Number': ''
        }
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(invalidEmailData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const result = await bulkImportService.importFromExcel(excelBuffer, 1);

      expect(result.errorCount).toBe(1);
      expect(result.errors.some(e => e.field === 'email')).toBe(true);
    });

    it('should handle mixed valid and invalid rows', async () => {
      const mixedData = [
        {
          'First Name (English)': 'Valid',
          'Middle Name (English)': '',
          'Last Name (English)': 'Student',
          'First Name (Nepali)': 'वैध',
          'Middle Name (Nepali)': '',
          'Last Name (Nepali)': 'विद्यार्थी',
          'Date of Birth (BS)': '2067-01-01',
          'Date of Birth (AD)': '2010-04-14',
          'Gender': 'male',
          'Blood Group': 'B+',
          'Address (English)': 'Kathmandu',
          'Address (Nepali)': 'काठमाडौं',
          'Phone': '',
          'Email': '',
          'Father Name': 'Test Father',
          'Father Phone': '9841000001',
          'Father Citizenship No': '',
          'Mother Name': 'Test Mother',
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
          'NEB Registration Number': ''
        },
        {
          'First Name (English)': '',
          'Middle Name (English)': '',
          'Last Name (English)': '',
          'First Name (Nepali)': '',
          'Middle Name (Nepali)': '',
          'Last Name (Nepali)': '',
          'Date of Birth (BS)': '',
          'Date of Birth (AD)': '',
          'Gender': '',
          'Blood Group': '',
          'Address (English)': '',
          'Address (Nepali)': '',
          'Phone': '',
          'Email': '',
          'Father Name': '',
          'Father Phone': '',
          'Father Citizenship No': '',
          'Mother Name': '',
          'Mother Phone': '',
          'Mother Citizenship No': '',
          'Local Guardian Name': '',
          'Local Guardian Phone': '',
          'Local Guardian Relation': '',
          'Admission Date': '',
          'Admission Class': '',
          'Current Class ID': '',
          'Roll Number': '',
          'Previous School': '',
          'Allergies': '',
          'Medical Conditions': '',
          'Emergency Contact': '',
          'Symbol Number': '',
          'NEB Registration Number': ''
        }
      ];

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(mixedData);
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

      const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      const result = await bulkImportService.importFromExcel(excelBuffer, 1);

      expect(result.totalRows).toBe(2);
      expect(result.successCount).toBe(1);
      expect(result.errorCount).toBe(1);

      // Cleanup
      const student = await Student.findOne({ where: { firstNameEn: 'Valid' } });
      if (student) {
        await student.destroy({ force: true });
      }
    });
  });

  describe('generateImportTemplate', () => {
    it('should generate a valid Excel template', () => {
      const templateBuffer = bulkImportService.generateImportTemplate();

      expect(templateBuffer).toBeDefined();
      expect(templateBuffer.length).toBeGreaterThan(0);

      // Parse the generated template
      const workbook = XLSX.read(templateBuffer, { type: 'buffer' });
      expect(workbook.SheetNames.length).toBeGreaterThan(0);

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet);

      expect(data.length).toBeGreaterThan(0);
      expect(data[0]).toHaveProperty('First Name (English)');
      expect(data[0]).toHaveProperty('Last Name (English)');
      expect(data[0]).toHaveProperty('Date of Birth (BS)');
      expect(data[0]).toHaveProperty('Gender');
    });
  });
});

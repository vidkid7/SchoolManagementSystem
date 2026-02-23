# Report Card Generation Implementation

## Overview

This document describes the implementation of the NEB-compliant report card generation service for the School Management System.

**Task**: 14.6 Implement report card generation  
**Requirements**: 7.7, N1.9  
**Status**: ✅ Completed

## Features Implemented

### 1. Report Card Service (`reportCard.service.ts`)

The service provides comprehensive report card generation functionality with the following capabilities:

#### Core Functions

1. **Attendance Summary Calculation**
   - Calculates total days, present days, absent days, late days, and excused days
   - Computes attendance percentage: `(present + late) / total * 100`
   - Handles empty attendance records gracefully

2. **Term GPA Calculation**
   - Implements NEB formula: `GPA = Σ(credit_hours × grade_point) / total_credit_hours`
   - Rounds to 2 decimal places
   - Handles edge cases (zero credit hours, empty subjects)

3. **Report Card Data Gathering**
   - Collects student information (personal, academic, contact details)
   - Aggregates grades from all exams in a term
   - Calculates subject-wise totals and NEB grades
   - Retrieves rank and percentile information
   - Compiles attendance summary

4. **PDF Generation**
   - Generates NEB-compliant report cards in PDF format
   - Supports ledger format (11 x 17 inches landscape) and standard A4
   - Bilingual support (English/Nepali)
   - Includes all required sections:
     - School header with logo
     - Student information
     - Subject-wise grades table
     - Summary (GPA, rank, attendance)
     - Remarks (class teacher and principal)
     - Signatures (class teacher, parent, principal)
     - School seal

5. **Bulk Generation**
   - Generates report cards for multiple students
   - Handles errors gracefully for individual students
   - Returns detailed results with success/failure status

### 2. Data Structures

#### ReportCardData Interface
```typescript
interface ReportCardData {
  // Student Information
  studentId: number;
  studentCode: string;
  studentNameEn: string;
  studentNameNp?: string;
  symbolNumber?: string;
  nebRegistrationNumber?: string;
  rollNumber?: number;
  dateOfBirthBS: string;
  dateOfBirthAD: Date;
  
  // Academic Information
  academicYearId: number;
  academicYearName: string;
  termId: number;
  termName: string;
  className: string;
  sectionName?: string;
  
  // Grades
  subjects: SubjectGradeInfo[];
  termGPA: number;
  cumulativeGPA?: number;
  
  // Rank
  rank: number;
  totalStudents: number;
  percentile: number;
  
  // Attendance
  attendance: AttendanceSummary;
  
  // Remarks
  classTeacherRemarks?: string;
  principalRemarks?: string;
  
  // Metadata
  generatedAt: Date;
  generatedBy: number;
}
```

#### ReportCardOptions Interface
```typescript
interface ReportCardOptions {
  language: 'english' | 'nepali' | 'bilingual';
  includeSchoolSeal?: boolean;
  includePrincipalSignature?: boolean;
  includeClassTeacherSignature?: boolean;
  format?: 'ledger' | 'standard';
  outputPath?: string;
}
```

### 3. NEB Compliance

The report card generation follows Nepal Education Board (NEB) standards:

1. **Grading System**: Uses NEB grades (A+ to NG) with corresponding grade points (4.0 to 0.0)
2. **GPA Calculation**: Implements credit-hour weighted GPA calculation
3. **Ledger Format**: Supports Nepal's standard ledger format (11 x 17 inches)
4. **Bilingual Support**: Includes both English and Nepali text
5. **Required Fields**: Includes all NEB-mandated fields:
   - Student information (name, roll number, symbol number, NEB registration)
   - Subject-wise marks (theory, practical, total)
   - Grades and grade points
   - GPA (term and cumulative)
   - Attendance summary
   - Class rank and percentile

### 4. PDF Layout

The generated PDF includes the following sections:

1. **Header Section**
   - School logo (optional)
   - School name (English and Nepali)
   - School address and contact information
   - Report card title
   - Academic year and term information

2. **Student Information Section**
   - Student name (English and Nepali)
   - Student ID and roll number
   - Date of birth (BS and AD)
   - Class and section
   - Symbol number (for SEE students)
   - NEB registration number (for Class 11-12)

3. **Grades Table**
   - Serial number
   - Subject name
   - Theory marks
   - Practical marks
   - Total marks
   - Full marks
   - Grade
   - Grade point

4. **Summary Section**
   - Academic Performance: Term GPA, Cumulative GPA
   - Class Rank: Rank, Total students, Percentile
   - Attendance: Total days, Present, Absent, Percentage

5. **Remarks Section**
   - Class teacher remarks
   - Principal remarks

6. **Footer Section**
   - Class teacher signature
   - Parent/Guardian signature
   - Principal signature (with name)
   - School seal (optional)
   - Issue date

## Testing

### Unit Tests (`reportCard.service.test.ts`)

Comprehensive unit tests covering:

1. **Attendance Summary Calculation** (4 tests)
   - ✅ Correct calculation with mixed attendance
   - ✅ Empty attendance records
   - ✅ 100% attendance
   - ✅ Late days included in percentage

2. **Term GPA Calculation** (5 tests)
   - ✅ Correct GPA calculation
   - ✅ Empty subjects array
   - ✅ Zero credit hours
   - ✅ Perfect GPA (4.0)
   - ✅ Rounding to 2 decimal places

3. **Report Card Data Gathering** (3 tests)
   - ✅ Complete data gathering
   - ✅ Student not found error
   - ✅ No exams found error
   - ✅ Student without Nepali name

4. **PDF Generation** (2 tests)
   - ✅ Generate PDF buffer
   - ✅ English language only

5. **File Operations** (1 test)
   - ✅ Save PDF to file

6. **Bulk Generation** (2 tests)
   - ✅ Multiple students
   - ✅ Error handling for individual students

7. **Edge Cases** (3 tests)
   - ✅ Student with no middle name
   - ✅ Zero attendance days
   - ✅ Subjects with zero credit hours

**Test Results**: ✅ All 21 tests passing

## Usage Examples

### Generate Report Card for a Single Student

```typescript
import reportCardService from './reportCard.service';

const schoolInfo = {
  nameEn: 'Nepal Model School',
  nameNp: 'नेपाल मोडेल स्कूल',
  addressEn: 'Kathmandu, Nepal',
  addressNp: 'काठमाडौं, नेपाल',
  phone: '+977-1-4123456',
  email: 'info@nepalmodelschool.edu.np',
  principalName: 'Dr. Shyam Prasad Adhikari'
};

const options = {
  language: 'bilingual',
  format: 'ledger',
  includeSchoolSeal: true,
  includePrincipalSignature: true,
  includeClassTeacherSignature: true
};

// Generate PDF buffer
const pdfBuffer = await reportCardService.generateStudentReportCard(
  studentId,
  termId,
  academicYearId,
  schoolInfo,
  options
);

// Or save to file
const filePath = await reportCardService.saveReportCardPDF(
  reportCardData,
  schoolInfo,
  '/path/to/output.pdf',
  options
);
```

### Generate Report Cards for Multiple Students

```typescript
const studentIds = [1, 2, 3, 4, 5];

const results = await reportCardService.generateBulkReportCards(
  studentIds,
  termId,
  academicYearId,
  schoolInfo,
  '/path/to/output/directory',
  options
);

// Check results
results.forEach(result => {
  if (result.success) {
    console.log(`Report card generated: ${result.filePath}`);
  } else {
    console.error(`Failed for student ${result.studentId}: ${result.error}`);
  }
});
```

## Dependencies

- **pdfkit**: PDF generation library
- **Sequelize models**: Student, Exam, Grade, AttendanceRecord
- **Services**: nebGrading.service, rankCalculation.service
- **Node.js fs module**: File system operations

## Future Enhancements

1. **Template System**: Support for customizable report card templates
2. **Digital Signatures**: Integration with digital signature services
3. **QR Code**: Add QR code for verification
4. **Watermark**: Add school watermark to prevent forgery
5. **Email Integration**: Automatically email report cards to parents
6. **SMS Notification**: Send SMS when report card is ready
7. **Multi-language Support**: Add support for more languages
8. **Performance Optimization**: Batch processing for large-scale generation
9. **Cloud Storage**: Integration with cloud storage services (S3, Google Drive)
10. **Print-ready Format**: Optimize for direct printing

## Notes

- The service uses PDFKit for PDF generation, which provides low-level control over PDF layout
- Report cards are generated in memory as Buffer objects and can be saved to file or streamed
- The ledger format (11 x 17 inches landscape) is the standard format used in Nepal
- Bilingual support includes both English and Nepali text throughout the report card
- The service integrates with existing examination, attendance, and student modules
- All calculations follow NEB standards for grading and GPA

## Requirements Validation

### Requirement 7.7: Generate Nepal-standard report cards (ledger format)
✅ **Implemented**: Report cards are generated in ledger format (11 x 17 inches landscape) with all required sections including student info, subject-wise marks, grades, GPA, attendance, and signatures.

### Requirement N1.9: Generate NEB-compliant mark sheets and transcripts
✅ **Implemented**: Report cards follow NEB standards with:
- NEB grading scale (A+ to NG)
- Credit-hour weighted GPA calculation
- Subject-wise marks breakdown (theory/practical)
- All required student identification fields (symbol number, NEB registration)
- Bilingual support (English/Nepali)

## Conclusion

The report card generation service is fully implemented and tested, providing comprehensive functionality for generating NEB-compliant report cards in PDF format. The service supports both single and bulk generation, with flexible options for customization and bilingual output.

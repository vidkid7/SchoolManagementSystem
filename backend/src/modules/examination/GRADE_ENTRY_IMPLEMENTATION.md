# Grade Entry Service Implementation

## Overview

This document describes the implementation of the Grade Entry Service for the School Management System, which handles grade entry, validation, bulk import from Excel, weighted grade calculation, and automatic NEB grade calculation.

**Requirements Implemented:** 7.6, 7.9, N1.1

## Features

### 1. Grade Entry with Validation

- **Marks Validation**: Validates that marks are within the valid range (0 to full marks)
- **Theory + Practical Validation**: Ensures theory + practical = total marks when both are provided
- **Duplicate Prevention**: Prevents duplicate grade entries for the same student and exam
- **Exam Configuration**: Validates marks based on exam configuration (theory-only, practical-only, or both)

### 2. Auto-calculation of NEB Grades

- **Automatic Grade Calculation**: Calculates NEB grade (A+ to NG) from marks percentage
- **Grade Point Calculation**: Automatically assigns grade points (0.0 to 4.0) based on NEB standards
- **Percentage Calculation**: Converts marks to percentage based on full marks

### 3. Bulk Grade Import from Excel

- **Excel File Support**: Supports .xls and .xlsx file formats
- **Column Mapping**: Flexible column mapping (Student ID, Theory Marks, Practical Marks, Total Marks, Remarks)
- **Error Handling**: Provides detailed error messages for failed imports
- **Import Summary**: Returns success/failure counts and detailed error list

**Expected Excel Format:**
- Column: Student ID (or StudentID, student_id)
- Column: Theory Marks (or TheoryMarks, theory_marks)
- Column: Practical Marks (or PracticalMarks, practical_marks)
- Column: Total Marks (or TotalMarks, total_marks)
- Column: Remarks (or remarks)

### 4. Weighted Grade Calculation

- **Multiple Assessments**: Calculates weighted grades across multiple assessments
- **Weightage Validation**: Ensures weightages sum to 100%
- **Final Grade Calculation**: Computes final NEB grade from weighted percentage

**Example:**
```typescript
// Final grade = 30% Unit Test + 70% Terminal Exam
const result = await gradeEntryService.calculateWeightedGrades({
  studentId: 1,
  assessments: [
    { examId: 1, weightage: 30 },  // Unit Test
    { examId: 2, weightage: 70 }   // Terminal Exam
  ]
});
```

### 5. Grade Entry Audit Trail

- **Entered By**: Tracks which teacher entered the grade
- **Entered At**: Records timestamp of grade entry
- **Update History**: Maintains audit trail through soft deletes

### 6. Exam Statistics

- **Average Marks**: Calculates average marks for an exam
- **Highest/Lowest Marks**: Identifies top and bottom performers
- **Pass/Fail Count**: Counts students who passed/failed
- **Grade Distribution**: Shows distribution of grades (A+, A, B+, etc.)

## API Endpoints

### Create Grade Entry
```
POST /api/v1/grades
Body: {
  examId: number,
  studentId: number,
  theoryMarks?: number,
  practicalMarks?: number,
  totalMarks?: number,
  remarks?: string
}
```

### Update Grade Entry
```
PUT /api/v1/grades/:gradeId
Body: {
  theoryMarks?: number,
  practicalMarks?: number,
  totalMarks?: number,
  remarks?: string
}
```

### Bulk Grade Entry
```
POST /api/v1/grades/bulk
Body: {
  examId: number,
  grades: Array<{
    studentId: number,
    theoryMarks?: number,
    practicalMarks?: number,
    totalMarks?: number,
    remarks?: string
  }>
}
```

### Bulk Import from Excel
```
POST /api/v1/grades/import/excel
Content-Type: multipart/form-data
Body: {
  examId: number,
  file: Excel file
}
```

### Calculate Weighted Grades
```
POST /api/v1/grades/weighted
Body: {
  studentId: number,
  assessments: Array<{
    examId: number,
    weightage: number
  }>
}
```

### Get Grade by ID
```
GET /api/v1/grades/:gradeId
```

### Get Grades by Exam
```
GET /api/v1/grades/exam/:examId
```

### Get Grades by Student
```
GET /api/v1/grades/student/:studentId
```

### Get Grade by Student and Exam
```
GET /api/v1/grades/student-exam?studentId=1&examId=1
```

### Get Exam Statistics
```
GET /api/v1/grades/exam/:examId/statistics
```

### Delete Grade
```
DELETE /api/v1/grades/:gradeId
```

## File Structure

```
backend/src/modules/examination/
├── gradeEntry.service.ts          # Business logic for grade entry
├── gradeEntry.repository.ts       # Database operations
├── gradeEntry.controller.ts       # HTTP request handlers
├── gradeEntry.routes.ts           # Route definitions
├── gradeEntry.validation.ts       # Input validation schemas
└── __tests__/
    ├── gradeEntry.service.test.ts      # Service unit tests
    ├── gradeEntry.repository.test.ts   # Repository unit tests
    └── gradeEntry.controller.test.ts   # Controller integration tests
```

## Dependencies

- **xlsx**: Excel file parsing
- **multer**: File upload handling
- **express-validator**: Input validation
- **sequelize**: Database ORM
- **@services/nebGrading.service**: NEB grade calculation

## Validation Rules

### Grade Entry Validation
- `examId`: Must be a positive integer
- `studentId`: Must be a positive integer
- `theoryMarks`: Must be between 0 and exam's theory marks
- `practicalMarks`: Must be between 0 and exam's practical marks
- `totalMarks`: Must be between 0 and exam's full marks
- `remarks`: Optional, max 500 characters

### Bulk Import Validation
- File size: Max 5MB
- File type: .xls or .xlsx only
- Student ID: Must be valid integer
- Marks: Must be valid numbers within range

### Weighted Grade Validation
- Weightages must sum to 100%
- Each weightage must be between 0 and 100
- All assessments must have grades entered

## Error Handling

The service provides detailed error messages for:
- Invalid marks (out of range)
- Duplicate grade entries
- Missing exam or student
- Invalid Excel file format
- Missing grades for weighted calculation
- Weightages not summing to 100%

## Testing

### Unit Tests
- **Service Tests**: 18 test cases covering all service methods
- **Repository Tests**: 24 test cases covering all repository methods
- **Controller Tests**: 18 test cases covering all API endpoints

### Test Coverage
- All core functionality is tested
- Edge cases are covered (invalid input, missing data, etc.)
- Error scenarios are validated

## Usage Examples

### Example 1: Create Grade Entry
```typescript
const grade = await gradeEntryService.createGradeEntry({
  examId: 1,
  studentId: 1,
  theoryMarks: 70,
  practicalMarks: 20,
  enteredBy: 1
});
// Returns: { gradeId: 1, totalMarks: 90, grade: 'A', gradePoint: 3.6, ... }
```

### Example 2: Bulk Import from Excel
```typescript
const result = await gradeEntryService.bulkImportFromExcel(
  examId,
  fileBuffer,
  enteredBy
);
// Returns: { success: true, successCount: 25, failureCount: 0, ... }
```

### Example 3: Calculate Weighted Grades
```typescript
const result = await gradeEntryService.calculateWeightedGrades({
  studentId: 1,
  assessments: [
    { examId: 1, weightage: 30 },  // Unit Test: 30%
    { examId: 2, weightage: 70 }   // Terminal: 70%
  ]
});
// Returns: { totalWeightedPercentage: 87, grade: 'A', gradePoint: 3.6, ... }
```

### Example 4: Get Exam Statistics
```typescript
const stats = await gradeEntryService.getExamStatistics(1);
// Returns: {
//   totalStudents: 30,
//   averageMarks: 75.5,
//   highestMarks: 95,
//   lowestMarks: 45,
//   passCount: 28,
//   failCount: 2,
//   passPercentage: 93.33,
//   gradeDistribution: { 'A+': 5, 'A': 10, 'B+': 8, ... }
// }
```

## Integration with NEB Grading Service

The grade entry service integrates with the NEB Grading Service to:
- Calculate NEB grades from marks percentage
- Validate grade calculations
- Ensure compliance with Nepal Education Board standards

## Future Enhancements

1. **Grade Moderation**: Support for grade moderation workflow
2. **Grade Appeals**: Handle student grade appeal process
3. **Grade Analytics**: Advanced analytics and insights
4. **Grade Comparison**: Compare grades across terms/years
5. **Grade Predictions**: ML-based grade predictions
6. **Mobile App Support**: Optimize for mobile grade entry

## Conclusion

The Grade Entry Service provides a comprehensive solution for managing student grades with:
- Robust validation
- Automatic NEB grade calculation
- Bulk import capabilities
- Weighted grade calculation
- Detailed statistics and reporting

All requirements (7.6, 7.9, N1.1) have been successfully implemented and tested.

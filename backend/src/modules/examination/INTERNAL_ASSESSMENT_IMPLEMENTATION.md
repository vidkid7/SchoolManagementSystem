# Internal Assessment Tracking Implementation

## Overview

This document describes the implementation of internal assessment tracking functionality for the School Management System, compliant with Nepal Education Board (NEB) standards.

**Requirements:** 7.11

## Features Implemented

### 1. Internal Assessment Flag

Added `isInternal` boolean field to the `Exam` model to distinguish between:
- **Internal Assessments**: Continuous evaluation (25-50% weightage)
- **Terminal Exams**: Final examinations (50-75% weightage)

### 2. Weightage Validation

Implemented strict validation per NEB standards:
- Internal assessment weightage: 25-50%
- Terminal exam weightage: 50-75%
- Total must equal 100%

### 3. Final Marks Calculation

Formula:
```
Final Marks = (Internal Assessment % × Internal Weightage) + (Terminal Exam % × Terminal Weightage)
```

Example:
- Internal Assessment: 80/100 = 80%
- Terminal Exam: 70/100 = 70%
- Weightage: 30% internal, 70% terminal
- Final = (80% × 30%) + (70% × 70%) = 24% + 49% = 73%
- Final Grade: B+ (3.2 GPA)

### 4. Assessment Summary

Provides comprehensive summary including:
- Number of students with both grades
- Number of students with only internal assessment
- Number of students with only terminal exam
- Configured weightages

## Database Changes

### Migration: 024-add-is-internal-to-exams.ts

Adds `is_internal` column to `exams` table:
```sql
ALTER TABLE exams ADD COLUMN is_internal BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX idx_exams_is_internal ON exams(is_internal);
```

## API Service

### InternalAssessmentService

Located at: `backend/src/modules/examination/internalAssessment.service.ts`

#### Methods

1. **validateWeightageConfig(internalWeightage, terminalWeightage)**
   - Validates weightage configuration per NEB standards
   - Returns validation result with errors if any

2. **calculateFinalMarks(input)**
   - Calculates final marks combining internal and terminal exams
   - Input:
     ```typescript
     {
       studentId: number,
       subjectId: number,
       classId: number,
       termId: number,
       internalWeightage: number  // 25-50
     }
     ```
   - Returns:
     ```typescript
     {
       studentId: number,
       subjectId: number,
       internalAssessment: { examId, marks, percentage, weightage, weightedMarks },
       terminalExam: { examId, marks, percentage, weightage, weightedMarks },
       finalMarks: number,
       finalPercentage: number,
       finalGrade: string,
       finalGradePoint: number
     }
     ```

3. **calculateFinalMarksForClass(subjectId, classId, termId, internalWeightage)**
   - Calculates final marks for all students in a class
   - Returns array of FinalMarksResult

4. **getSubjectAssessmentSummary(subjectId, classId, termId)**
   - Returns summary of assessment status
   - Shows how many students have completed each assessment

5. **getInternalAssessmentExams(classId, termId, subjectId?)**
   - Returns list of internal assessment exams
   - Filters by subject if provided

6. **getTerminalExams(classId, termId, subjectId?)**
   - Returns list of terminal exams
   - Filters by subject if provided

## Usage Examples

### Creating an Internal Assessment Exam

```typescript
const internalExam = await Exam.create({
  name: 'Internal Assessment - Mathematics',
  type: ExamType.UNIT_TEST,
  subjectId: 1,
  classId: 10,
  academicYearId: 1,
  termId: 1,
  examDate: new Date('2024-01-15'),
  duration: 60,
  fullMarks: 100,
  passMarks: 35,
  theoryMarks: 100,
  practicalMarks: 0,
  weightage: 30,  // 30% weightage
  isInternal: true,  // Mark as internal assessment
  status: ExamStatus.SCHEDULED
});
```

### Creating a Terminal Exam

```typescript
const terminalExam = await Exam.create({
  name: 'First Terminal Exam - Mathematics',
  type: ExamType.FIRST_TERMINAL,
  subjectId: 1,
  classId: 10,
  academicYearId: 1,
  termId: 1,
  examDate: new Date('2024-03-15'),
  duration: 180,
  fullMarks: 100,
  passMarks: 35,
  theoryMarks: 75,
  practicalMarks: 25,
  weightage: 70,  // 70% weightage
  isInternal: false,  // Terminal exam
  status: ExamStatus.SCHEDULED
});
```

### Calculating Final Marks for a Student

```typescript
import internalAssessmentService from './internalAssessment.service';

const result = await internalAssessmentService.calculateFinalMarks({
  studentId: 1,
  subjectId: 1,
  classId: 10,
  termId: 1,
  internalWeightage: 30  // 30% internal, 70% terminal
});

console.log(`Final Percentage: ${result.finalPercentage}%`);
console.log(`Final Grade: ${result.finalGrade}`);
console.log(`Final GPA: ${result.finalGradePoint}`);
```

### Getting Assessment Summary

```typescript
const summary = await internalAssessmentService.getSubjectAssessmentSummary(
  1,  // subjectId
  10, // classId
  1   // termId
);

console.log(`Students with both grades: ${summary.studentsWithBothGrades}`);
console.log(`Students with internal only: ${summary.studentsWithInternalOnly}`);
console.log(`Students with terminal only: ${summary.studentsWithTerminalOnly}`);
```

## Testing

### Unit Tests

Located at: `backend/src/modules/examination/__tests__/internalAssessment.service.test.ts`

Test coverage includes:
- ✓ Weightage validation (25-50% internal, 50-75% terminal)
- ✓ Final marks calculation with various weightage combinations
- ✓ Handling cases with only internal or only terminal grades
- ✓ Assessment summary generation
- ✓ Filtering internal vs terminal exams

### Running Tests

```bash
cd backend
npm test -- internalAssessment.service.test.ts
```

## NEB Compliance

This implementation follows Nepal Education Board standards:

1. **Weightage Range**: Internal assessments contribute 25-50% to final marks
2. **Terminal Exams**: Terminal exams contribute 50-75% to final marks
3. **Grade Calculation**: Final grade is calculated from weighted percentage using NEB grading scale
4. **Flexibility**: Schools can configure weightage within NEB-allowed ranges

## Integration Points

### With Existing Systems

1. **Exam Model**: Extended with `isInternal` flag
2. **Grade Entry**: Works with existing grade entry system
3. **NEB Grading**: Uses existing `calculateNEBGrade()` service
4. **Report Cards**: Can be integrated to show internal and terminal marks separately

### Future Enhancements

1. **API Endpoints**: Add REST API endpoints for:
   - GET /api/v1/exams/internal-assessment/:studentId/:subjectId
   - GET /api/v1/exams/final-marks/:studentId/:termId
   - GET /api/v1/exams/assessment-summary/:classId/:termId

2. **Report Card Integration**: Update report card generation to show:
   - Internal assessment marks
   - Terminal exam marks
   - Final calculated marks
   - Weightage breakdown

3. **Bulk Operations**: Add bulk final marks calculation for entire class

4. **Configuration**: Allow school-level configuration of default weightages

## Migration Instructions

1. **Run Migration**:
   ```bash
   cd backend
   npm run migrate
   ```

2. **Update Existing Exams**:
   - All existing exams will have `isInternal = false` by default
   - Update internal assessment exams manually:
   ```sql
   UPDATE exams 
   SET is_internal = true, weightage = 30 
   WHERE type = 'unit_test' AND name LIKE '%Internal%';
   ```

3. **Configure Weightages**:
   - Set appropriate weightages for internal and terminal exams
   - Ensure they sum to 100% per subject

## Troubleshooting

### Common Issues

1. **Weightage Validation Error**
   - Ensure internal weightage is between 25-50%
   - Ensure terminal weightage is between 50-75%
   - Ensure they sum to exactly 100%

2. **Missing Grades**
   - Service handles cases where only internal or only terminal grade exists
   - Final marks will be calculated with available grades only

3. **Multiple Internal Assessments**
   - Currently supports one internal assessment per subject/term
   - For multiple internal assessments, use weighted grade calculation from gradeEntry.service

## References

- Requirements: 7.11
- NEB Grading Standards: Nepal Education Board guidelines
- Related Services:
  - `gradeEntry.service.ts`: Grade entry and weighted calculations
  - `nebGrading.service.ts`: NEB grade calculation
  - `reportCard.service.ts`: Report card generation

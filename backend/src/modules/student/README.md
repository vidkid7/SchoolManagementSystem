# Student Module

## Overview

The Student Module handles all student-related operations including student record management, ID generation, and data persistence.

## Components

### 1. Student Model (`Student.model.ts`)
- Defines the Student entity with all required fields
- Implements soft delete functionality (paranoid mode)
- Provides helper methods for name formatting and age calculation
- Enforces data validation at the model level

### 2. Student Repository (`student.repository.ts`)
- Handles all database operations for students
- Implements CRUD operations with parameterized queries
- Supports pagination, filtering, and full-text search
- Provides soft delete and restore functionality
- **Requirements**: 2.1, 40.3, 35.6

### 3. Student ID Generation Service (`studentId.service.ts`)
- Generates unique student IDs with format: `{school_prefix}-{admission_year}-{sequential_number}`
- Example: `SCH001-2024-0001`
- Thread-safe ID generation using database transactions
- Handles concurrent ID generation safely
- Automatic sequential numbering per admission year
- Configurable school prefix from environment variables
- **Requirements**: 2.2

## Student ID Generation

### Format
```
{SCHOOL_PREFIX}-{YEAR}-{SEQUENTIAL_NUMBER}
```

- **SCHOOL_PREFIX**: Configured via `DEFAULT_SCHOOL_CODE` environment variable (e.g., "SCH001")
- **YEAR**: 4-digit admission year (e.g., "2024")
- **SEQUENTIAL_NUMBER**: 4-digit zero-padded sequential number (e.g., "0001", "0002", ...)

### Features

1. **Uniqueness**: Enforced by database unique constraint on `student_code` column
2. **Thread-Safety**: Uses database transactions with row locking to prevent race conditions
3. **Year-Based Sequencing**: Sequential numbers reset for each admission year
4. **Concurrent Safety**: Handles multiple simultaneous ID generation requests safely

### Usage

```typescript
import studentIdService from './studentId.service';

// Generate a new student ID
const admissionDate = new Date('2024-01-15');
const studentId = await studentIdService.generateStudentId(admissionDate);
// Returns: "SCH001-2024-0001"

// Validate student ID format
const isValid = studentIdService.validateStudentIdFormat('SCH001-2024-0001');
// Returns: true

// Parse student ID components
const parsed = studentIdService.parseStudentId('SCH001-2024-0001');
// Returns: { prefix: 'SCH001', year: 2024, sequentialNumber: 1 }

// Get next sequential number for a year
const nextNum = await studentIdService.getNextSequentialNumber(2024);
// Returns: 2 (if one student already exists for 2024)

// Count students by admission year
const count = await studentIdService.countStudentsByAdmissionYear(2024);
// Returns: 1
```

### Transaction Support

The service supports external transactions for atomic operations:

```typescript
const transaction = await sequelize.transaction();

try {
  const studentId = await studentIdService.generateStudentId(
    admissionDate,
    transaction
  );
  
  // Create student with generated ID
  await Student.create({
    studentCode: studentId,
    // ... other fields
  }, { transaction });
  
  await transaction.commit();
} catch (error) {
  await transaction.rollback();
  throw error;
}
```

## Testing

### Unit Tests
Comprehensive unit tests are provided in `__tests__/studentId.service.test.ts`:

- ✅ Student ID format validation
- ✅ First student ID generation (0001)
- ✅ Sequential number increment
- ✅ Different admission years handled separately
- ✅ Concurrent ID generation safety
- ✅ Leading zero padding
- ✅ Transaction support
- ✅ ID parsing and validation
- ✅ Next sequential number calculation
- ✅ Student count by admission year

### Running Tests

```bash
# Run all student module tests
npm test -- student

# Run only student ID service tests
npm test -- studentId.service.test.ts

# Run with coverage
npm test -- studentId.service.test.ts --coverage
```

## Database Schema

The `students` table includes:

```sql
CREATE TABLE students (
  student_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_code VARCHAR(50) NOT NULL UNIQUE,  -- Generated student ID
  -- ... other fields
  admission_date DATE NOT NULL,
  -- ... more fields
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL  -- For soft delete
);

-- Unique constraint ensures no duplicate student IDs
CREATE UNIQUE INDEX idx_students_student_code ON students(student_code);
```

## Configuration

Set the school prefix in your `.env` file:

```env
DEFAULT_SCHOOL_CODE=SCH001
```

## Error Handling

The service includes comprehensive error handling:

- Logs all ID generation attempts
- Throws descriptive errors on failure
- Rolls back transactions on error
- Validates input parameters

## Performance Considerations

1. **Database Locking**: Uses `FOR UPDATE` lock to prevent race conditions
2. **Transaction Isolation**: Ensures atomic ID generation
3. **Indexed Queries**: Leverages database indexes for fast lookups
4. **Efficient Sequencing**: Queries only the last student for each year

## Future Enhancements

Potential improvements for future phases:

1. Support for multiple school prefixes (multi-school support)
2. Custom ID format configuration
3. ID generation analytics and reporting
4. Bulk ID generation for batch student imports
5. ID reservation system for pre-admission

## Related Requirements

- **Requirement 2.2**: Unique student ID generation
- **Requirement 40.1**: Database unique constraints
- **Requirement 40.3**: Soft delete preservation


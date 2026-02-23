# Admission Module

## Overview

The Admission Module implements a complete student admission workflow system for the School Management System. It manages the entire admission process from initial inquiry through to student enrollment.

## Features

### Admission Workflow States

The module implements a state machine with the following workflow:

```
Inquiry → Application → Test Scheduled → Tested → Interview Scheduled → Interviewed → Admitted → Enrolled
                                                                                              ↓
                                                                                          Rejected
```

### API Endpoints

All endpoints require authentication and `SCHOOL_ADMIN` role authorization.

#### 1. Create Inquiry
- **POST** `/api/v1/admissions/inquiry`
- Creates a new admission inquiry with temporary ID
- Sends SMS notification to guardian
- **Validation**: Required fields (firstNameEn, lastNameEn, applyingForClass)

#### 2. Convert to Application
- **POST** `/api/v1/admissions/:id/apply`
- Converts inquiry to full application
- Collects additional student and guardian information
- **Validation**: Optional fields with proper formats (dates, gender, phone numbers)

#### 3. Schedule Admission Test
- **POST** `/api/v1/admissions/:id/schedule-test`
- Schedules admission test date
- Sends SMS notification to guardian
- **Validation**: Valid date required

#### 4. Record Test Score
- **POST** `/api/v1/admissions/:id/record-test-score`
- Records admission test results
- **Validation**: Score and maxScore must be non-negative

#### 5. Schedule Interview
- **POST** `/api/v1/admissions/:id/schedule-interview`
- Schedules interview date and assigns interviewer
- Sends SMS notification to guardian
- **Validation**: Valid date required

#### 6. Record Interview Feedback
- **POST** `/api/v1/admissions/:id/record-interview`
- Records interview feedback and optional score
- **Validation**: Feedback required, score 0-100 if provided

#### 7. Admit Applicant
- **POST** `/api/v1/admissions/:id/admit`
- Admits applicant and generates admission offer letter PDF
- Sends SMS notification to guardian
- **Validation**: Must be in valid state for admission

#### 8. Enroll Student
- **POST** `/api/v1/admissions/:id/enroll`
- Converts admitted applicant to enrolled student
- Generates unique student code
- Creates student record in database
- Sends SMS notification to guardian
- **Validation**: Optional classId and rollNumber

#### 9. Reject Applicant
- **POST** `/api/v1/admissions/:id/reject`
- Rejects applicant with reason
- **Validation**: Rejection reason required

#### 10. Get Admission by ID
- **GET** `/api/v1/admissions/:id`
- Retrieves single admission record
- **Validation**: Valid numeric ID

#### 11. List Admissions
- **GET** `/api/v1/admissions`
- Lists admissions with filtering and pagination
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20, max: 100)
  - `status`: Filter by admission status
  - `applyingForClass`: Filter by class (1-12)
  - `academicYearId`: Filter by academic year
  - `search`: Search by name or temporary ID
- **Validation**: All query parameters validated

#### 12. Get Admission Statistics
- **GET** `/api/v1/admissions/reports`
- Returns admission statistics
- **Query Parameters**:
  - `academicYearId`: Optional filter by academic year
- **Returns**:
  - Total admissions
  - Count by status
  - Count by class

## Validation

All endpoints use Joi validation schemas defined in `admission.validation.ts`:

### Input Validation
- **Phone Numbers**: Nepal format (+977-XXXXXXXXXX or XXXXXXXXXX)
- **Email**: Standard email format
- **Dates**: YYYY-MM-DD format for BS dates, ISO format for AD dates
- **Class Numbers**: 1-12 range
- **Gender**: male, female, or other
- **Inquiry Source**: walk-in, phone, online, or referral

### Security
- All endpoints protected by JWT authentication
- Role-based authorization (SCHOOL_ADMIN only)
- Input sanitization via validation middleware
- SQL injection prevention via parameterized queries
- XSS prevention via input validation

## Services

### AdmissionService (`admission.service.ts`)

Main service handling all admission workflow logic:

- **createInquiry()**: Creates new inquiry with temporary ID generation
- **convertToApplication()**: State transition with data validation
- **scheduleTest()**: Test scheduling with SMS notifications
- **recordTestScore()**: Test score recording
- **scheduleInterview()**: Interview scheduling with SMS notifications
- **recordInterview()**: Interview feedback recording
- **admit()**: Admission with PDF offer letter generation
- **enroll()**: Student enrollment with student code generation
- **reject()**: Applicant rejection
- **findById()**: Retrieve single admission
- **findAll()**: List with filters and pagination
- **getStatistics()**: Generate admission statistics

### Integration with Other Services

- **SMS Service**: Sends notifications at each workflow stage
- **PDF Service**: Generates admission offer letters
- **Student ID Service**: Generates unique student codes
- **Student Model**: Creates student records on enrollment

## Models

### Admission Model (`@models/Admission.model.ts`)

**Key Fields**:
- `admissionId`: Primary key
- `temporaryId`: Unique inquiry identifier
- `status`: Current workflow state
- Personal information (names in English and Nepali)
- Contact information (phone, email, address)
- Guardian information (father, mother, local guardian)
- Academic information (applying for class, previous school)
- Test information (date, score, remarks)
- Interview information (date, feedback, score)
- Admission information (date, offer letter URL)
- Enrollment information (enrolled student ID, enrollment date)

**Methods**:
- `getFullNameEn()`: Returns full name in English
- `canTransitionTo(newStatus)`: Validates state transitions

## Testing

Integration tests are provided in `__tests__/admission.api.test.ts`:

- Tests all 12 API endpoints
- Tests validation for all inputs
- Tests authentication and authorization
- Tests workflow state transitions
- Tests filtering and pagination
- Tests error handling

**Test Coverage**:
- 34 test cases covering all endpoints
- Positive and negative test scenarios
- Edge case validation
- Authentication/authorization checks

## Requirements Mapping

This module implements the following requirements from the specification:

- **Requirement 3.1**: Admission workflow support
- **Requirement 3.2**: Inquiry record creation with temporary ID
- **Requirement 3.3**: Inquiry to application conversion
- **Requirement 3.4**: Document and fee collection
- **Requirement 3.6**: Test and interview scheduling
- **Requirement 3.7**: Test score and interview feedback recording
- **Requirement 3.8**: Admission offer letter generation
- **Requirement 3.9**: Document verification tracking
- **Requirement 3.10**: Conversion to enrolled student
- **Requirement 3.11**: SMS notifications at each stage
- **Requirement 3.12**: Admission reports and statistics

## Usage Example

```typescript
// Create inquiry
const inquiry = await admissionService.createInquiry({
  firstNameEn: 'John',
  lastNameEn: 'Doe',
  applyingForClass: 5,
  guardianPhone: '9841234567',
  email: 'john.doe@example.com'
});

// Convert to application
const application = await admissionService.convertToApplication(
  inquiry.admissionId,
  {
    dateOfBirthBS: '2070-05-15',
    gender: 'male',
    fatherName: 'John Doe Sr.',
    fatherPhone: '9841234567'
  }
);

// Schedule test
await admissionService.scheduleTest(
  application.admissionId,
  new Date('2024-03-15')
);

// Record test score
await admissionService.recordTestScore(
  application.admissionId,
  { score: 85, maxScore: 100 }
);

// Admit applicant
const admitted = await admissionService.admit(application.admissionId);

// Enroll as student
const { admission, student } = await admissionService.enroll(
  admitted.admissionId,
  { rollNumber: 1 }
);
```

## Error Handling

The module uses consistent error handling:

- **NotFoundError**: When admission record doesn't exist
- **ValidationError**: When input validation fails
- **State Transition Errors**: When invalid state transitions are attempted
- All errors return appropriate HTTP status codes and error messages

## Future Enhancements

Potential improvements for future versions:

1. Online registration form for parents (Requirement 3.5)
2. Document upload and verification system
3. Bulk admission processing
4. Email notifications in addition to SMS
5. Admission test question bank and online testing
6. Interview scheduling calendar integration
7. Admission analytics dashboard
8. Export admission reports to Excel/PDF

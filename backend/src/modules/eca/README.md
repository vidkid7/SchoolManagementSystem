# ECA (Extra-Curricular Activities) Module

## Overview

The ECA module provides comprehensive management of extra-curricular activities including clubs, cultural activities, community service, and leadership programs. It supports student enrollment, attendance tracking, event management, achievement recording, and certificate generation.

## Requirements Coverage

This module implements Requirements 11.1-11.10:

- **11.1**: ECA categories (clubs, cultural, community service, leadership)
- **11.2**: ECA creation with name, type, schedule, coordinator, capacity
- **11.3**: Student enrollment in multiple ECAs
- **11.4**: Participation and attendance tracking
- **11.5**: Event creation (competitions, performances, exhibitions)
- **11.6**: Event notifications to enrolled students
- **11.7**: Achievement and award recording
- **11.8**: ECA participation in student CV/report
- **11.9**: Certificate generation for participation/achievement
- **11.10**: Photo/video upload from events

## API Endpoints

### ECA Management

#### GET /api/v1/eca
List all ECAs with filters and pagination.

**Query Parameters:**
- `category` (optional): Filter by category (club, cultural, community_service, leadership)
- `status` (optional): Filter by status (active, inactive, completed)
- `coordinatorId` (optional): Filter by coordinator
- `academicYearId` (optional): Filter by academic year
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "ecaId": 1,
      "name": "Debate Club",
      "nameNp": "वाद-विवाद क्लब",
      "category": "club",
      "subcategory": "Academic",
      "description": "Debate and public speaking club",
      "coordinatorId": 5,
      "schedule": "Every Friday 3-5 PM",
      "capacity": 30,
      "currentEnrollment": 15,
      "academicYearId": 1,
      "status": "active",
      "hasCapacity": true
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

#### POST /api/v1/eca
Create a new ECA.

**Request Body:**
```json
{
  "name": "Science Club",
  "nameNp": "विज्ञान क्लब",
  "category": "club",
  "subcategory": "STEM",
  "description": "Science and technology club",
  "descriptionNp": "विज्ञान र प्रविधि क्लब",
  "coordinatorId": 5,
  "schedule": "Every Friday 3-5 PM",
  "capacity": 30,
  "academicYearId": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ecaId": 1,
    "name": "Science Club",
    "category": "club",
    "currentEnrollment": 0,
    "status": "active"
  },
  "message": "ECA created successfully"
}
```

#### GET /api/v1/eca/:ecaId
Get ECA details by ID.

#### PUT /api/v1/eca/:ecaId
Update ECA details.

#### DELETE /api/v1/eca/:ecaId
Delete ECA (soft delete).

### Enrollment Management

#### POST /api/v1/eca/:ecaId/enroll
Enroll a student in an ECA.

**Request Body:**
```json
{
  "studentId": 100,
  "enrollmentDate": "2025-02-06",
  "remarks": "Interested in debate"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "enrollmentId": 1,
    "ecaId": 1,
    "studentId": 100,
    "enrollmentDate": "2025-02-06",
    "status": "active",
    "attendanceCount": 0,
    "totalSessions": 0,
    "attendancePercentage": 0
  },
  "message": "Student enrolled successfully"
}
```

**Business Rules:**
- Validates ECA exists and is active
- Checks if student is already enrolled
- Validates capacity before enrollment
- Increments ECA enrollment count

### Attendance Management

#### POST /api/v1/eca/:ecaId/mark-attendance
Mark attendance for an ECA session.

**Request Body:**
```json
{
  "attendanceData": [
    { "enrollmentId": 1, "present": true },
    { "enrollmentId": 2, "present": true },
    { "enrollmentId": 3, "present": false }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "enrollmentId": 1,
      "attendanceCount": 8,
      "totalSessions": 10,
      "attendancePercentage": 80
    }
  ],
  "message": "Attendance marked for 3 students"
}
```

### Event Management

#### POST /api/v1/eca/events
Create a new ECA event.

**Request Body:**
```json
{
  "ecaId": 1,
  "name": "Inter-School Debate Competition",
  "nameNp": "अन्तर-विद्यालय वाद-विवाद प्रतियोगिता",
  "type": "competition",
  "description": "Annual debate competition",
  "eventDate": "2025-03-15",
  "eventDateBS": "2081-12-02",
  "venue": "School Auditorium",
  "venueNp": "विद्यालय सभागार",
  "organizer": "Debate Club"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "eventId": 1,
    "ecaId": 1,
    "name": "Inter-School Debate Competition",
    "type": "competition",
    "eventDate": "2025-03-15",
    "venue": "School Auditorium",
    "status": "scheduled",
    "participantCount": 0
  },
  "message": "Event created successfully"
}
```

**Note:** Automatically sends notifications to all enrolled students (Requirement 11.6).

#### GET /api/v1/eca/events
Get all ECA events with filters.

**Query Parameters:**
- `ecaId` (optional): Filter by ECA
- `type` (optional): Filter by event type
- `status` (optional): Filter by status
- `page` (optional): Page number
- `limit` (optional): Items per page

### Achievement Management

#### POST /api/v1/eca/:ecaId/record-achievement
Record a student achievement.

**Request Body:**
```json
{
  "studentId": 100,
  "eventId": 1,
  "title": "First Place - Inter-School Debate",
  "titleNp": "पहिलो स्थान - अन्तर-विद्यालय वाद-विवाद",
  "type": "position",
  "level": "district",
  "position": "1st",
  "description": "Won first place in district level debate",
  "achievementDate": "2025-03-15",
  "achievementDateBS": "2081-12-02"
}
```

**Achievement Types:**
- `award`: Award
- `medal`: Medal
- `certificate`: Certificate
- `recognition`: Recognition
- `position`: Position

**Achievement Levels:**
- `school`: School Level
- `district`: District Level
- `regional`: Regional Level
- `national`: National Level
- `international`: International Level

**Response:**
```json
{
  "success": true,
  "data": {
    "achievementId": 1,
    "ecaId": 1,
    "studentId": 100,
    "title": "First Place - Inter-School Debate",
    "type": "position",
    "level": "district",
    "position": "1st",
    "displayTitle": "First Place - Inter-School Debate - 1st",
    "isHighLevel": false
  },
  "message": "Achievement recorded successfully"
}
```

### Student ECA History

#### GET /api/v1/eca/student/:studentId
Get complete ECA history for a student.

**Response:**
```json
{
  "success": true,
  "data": {
    "enrollments": [
      {
        "enrollmentId": 1,
        "ecaId": 1,
        "studentId": 100,
        "status": "active",
        "attendanceCount": 8,
        "totalSessions": 10,
        "attendancePercentage": 80
      }
    ],
    "participationSummary": {
      "totalEnrollments": 2,
      "activeEnrollments": 1,
      "completedEnrollments": 1,
      "averageAttendance": 85,
      "ecas": [
        {
          "ecaId": 1,
          "ecaName": "Debate Club",
          "status": "active",
          "attendancePercentage": 80
        }
      ]
    },
    "achievements": [
      {
        "achievementId": 1,
        "title": "First Place",
        "type": "position",
        "level": "district"
      }
    ],
    "cvData": {
      "studentId": 100,
      "participations": [
        {
          "ecaName": "Debate Club",
          "category": "Club",
          "duration": "6 months",
          "attendancePercentage": 80,
          "status": "active"
        }
      ],
      "achievements": [
        {
          "title": "First Place - Inter-School Debate - 1st",
          "ecaName": "Debate Club",
          "type": "Position",
          "level": "District Level",
          "date": "2025-03-15"
        }
      ],
      "summary": {
        "totalECAs": 2,
        "totalAchievements": 1,
        "highLevelAchievements": 0,
        "averageAttendance": 85
      }
    }
  }
}
```

## Services

### ecaEnrollment.service.ts
Handles student enrollment in ECAs with capacity validation and attendance tracking.

**Key Methods:**
- `enrollStudent()`: Enroll student with capacity checking
- `withdrawStudent()`: Withdraw student from ECA
- `markAttendance()`: Mark attendance for a session
- `bulkMarkAttendance()`: Mark attendance for multiple students
- `getStudentEnrollments()`: Get all enrollments for a student
- `getStudentParticipationSummary()`: Get participation statistics

### ecaEvent.service.ts
Manages ECA events including creation, notifications, and participant management.

**Key Methods:**
- `createEvent()`: Create new event with date validation
- `notifyEnrolledStudents()`: Send notifications to enrolled students
- `addParticipants()`: Add students as event participants
- `uploadPhotos()`: Upload event photos
- `uploadVideos()`: Upload event videos
- `getUpcomingEvents()`: Get upcoming events

### ecaCertificate.service.ts
Generates certificates and CV data for student ECA participation.

**Key Methods:**
- `generateParticipationCertificateData()`: Generate participation certificate data
- `generateAchievementCertificateData()`: Generate achievement certificate data
- `getStudentECAForCV()`: Get ECA data for student CV
- `isEligibleForParticipationCertificate()`: Check certificate eligibility

## Models

### ECA
Main ECA entity with categories, capacity, and enrollment tracking.

### ECAEnrollment
Student enrollment in ECAs with attendance tracking.

### ECAEvent
Events associated with ECAs (competitions, performances, etc.).

### ECAAchievement
Student achievements and awards in ECAs.

## Validation

All endpoints include comprehensive validation:
- Required field validation
- Type validation (category, status, achievement type/level)
- Format validation (dates, IDs)
- Range validation (capacity, page numbers)

## Testing

Comprehensive test coverage includes:
- **Route Tests** (25 tests): Integration tests for all endpoints
- **Controller Tests** (9 tests): Unit tests for controller methods
- **Service Tests**: Business logic validation
- **Repository Tests**: Database operation tests

## Error Handling

Standard error responses:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": []
  }
}
```

Common error codes:
- `VALIDATION_ERROR`: Invalid input data
- `ECA_NOT_FOUND`: ECA does not exist
- `CAPACITY_FULL`: ECA has reached capacity
- `ALREADY_ENROLLED`: Student already enrolled
- `INTERNAL_ERROR`: Server error

## Future Enhancements

- Photo/video upload implementation (Requirement 11.10)
- Certificate PDF generation (Requirement 11.9)
- Advanced analytics and reporting
- Integration with notification service
- Mobile app support

# Bulk Certificate Generation

## Overview

The bulk certificate generation feature allows administrators to generate multiple certificates for different students in a single operation. This is particularly useful for scenarios like:

- Generating character certificates for an entire graduating class
- Issuing sports certificates for all tournament participants
- Creating ECA certificates for club members
- Batch generation of academic excellence certificates

**Requirements:** 25.3

## Features

### 1. Batch Generation for Multiple Students

Generate certificates for multiple students in one API call:

```typescript
POST /api/v1/certificates/bulk-generate
{
  "templateId": 1,
  "students": [
    {
      "studentId": 1,
      "data": {
        "student_name": "John Doe",
        "class": "Class 10",
        "achievement": "First Position"
      }
    },
    {
      "studentId": 2,
      "data": {
        "student_name": "Jane Smith",
        "class": "Class 10",
        "achievement": "Second Position"
      }
    }
  ],
  "issuedDate": "2024-03-15",
  "issuedDateBS": "2080-12-02",
  "issuedBy": 1
}
```

### 2. Generation Status Tracking

The system tracks the generation status for each student individually:

**Response Format:**
```json
{
  "success": true,
  "data": {
    "success": [
      {
        "certificateId": 1,
        "certificateNumber": "CERT-ACAD-2024-0001",
        "studentId": 1,
        "type": "academic_excellence",
        "issuedDate": "2024-03-15T00:00:00.000Z",
        "issuedDateBS": "2080-12-02",
        "pdfUrl": "/uploads/certificates/CERT-ACAD-2024-0001.pdf",
        "qrCode": "data:image/png;base64,...",
        "verificationUrl": "http://localhost:3000/api/v1/certificates/verify/CERT-ACAD-2024-0001",
        "status": "active"
      }
    ],
    "failed": [
      {
        "studentId": 2,
        "error": "Missing required variables: achievement"
      }
    ]
  },
  "message": "Generated 1 certificates successfully. 1 failed."
}
```

### 3. Partial Failure Handling

The system gracefully handles partial failures:

- **Continues Processing**: If one certificate fails, the system continues generating certificates for remaining students
- **Detailed Error Messages**: Each failure includes the student ID and specific error message
- **Success/Failure Counts**: Response includes counts of successful and failed generations
- **No Rollback**: Successfully generated certificates are not rolled back if subsequent ones fail

### 4. Unique Certificate Numbers

Each certificate receives a unique certificate number:

- Format: `CERT-{TYPE}-{YEAR}-{RANDOM}`
- Example: `CERT-ACAD-2024-0123`
- Collision Detection: System retries if a generated number already exists
- Maximum Attempts: 100 attempts to generate a unique number

### 5. Same Issued Date

All certificates in a batch share the same issued date:

- Ensures consistency across the batch
- Supports both AD and BS dates
- Defaults to current date if not specified

## API Endpoint

### POST /api/v1/certificates/bulk-generate

**Authentication:** Required (JWT token)

**Authorization:** School Admin, Department Head, ECA Coordinator, Sports Coordinator

**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| templateId | number | Yes | ID of the certificate template to use |
| students | array | Yes | Array of student objects (minimum 1) |
| students[].studentId | number | Yes | Student ID |
| students[].data | object | Yes | Template variable values for this student |
| issuedDate | string | No | Issued date in AD (ISO 8601 format) |
| issuedDateBS | string | No | Issued date in BS (YYYY-MM-DD format) |
| issuedBy | number | Auto | User ID of the issuer (from JWT token) |

**Response:**

```typescript
{
  success: boolean;
  data: {
    success: Certificate[];  // Successfully generated certificates
    failed: Array<{          // Failed generations
      studentId: number;
      error: string;
    }>;
  };
  message: string;
}
```

**Status Codes:**

- `201 Created`: Certificates generated (even if some failed)
- `400 Bad Request`: Invalid request data or template not found
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User doesn't have permission to generate certificates

## Validation

### Request Validation

The system validates:

1. **Template ID**: Must be a positive integer
2. **Students Array**: Must contain at least one student
3. **Student ID**: Must be a positive integer for each student
4. **Student Data**: Must be an object for each student
5. **Issued Date**: Must be a valid date if provided
6. **Issued Date BS**: Must match format YYYY-MM-DD if provided

### Template Validation

Before generation:

1. **Template Exists**: Template with given ID must exist
2. **Template Active**: Template must be active (not archived)
3. **Required Variables**: All template variables must be provided in student data

## Error Handling

### Common Errors

1. **Template Not Found**
   ```json
   {
     "success": false,
     "error": {
       "code": "BULK_GENERATION_FAILED",
       "message": "Template with ID 999 not found"
     }
   }
   ```

2. **Inactive Template**
   ```json
   {
     "success": false,
     "error": {
       "code": "BULK_GENERATION_FAILED",
       "message": "Cannot generate certificate from inactive template"
     }
   }
   ```

3. **Missing Required Variables** (per student)
   ```json
   {
     "studentId": 2,
     "error": "Missing required variables: achievement, gpa"
   }
   ```

4. **Database Error** (per student)
   ```json
   {
     "studentId": 3,
     "error": "Database error: Connection timeout"
     }
   ```

## Performance Considerations

### Batch Size

- **Recommended**: 50-100 certificates per batch
- **Maximum**: No hard limit, but larger batches take longer
- **Processing Time**: Approximately 50-100ms per certificate

### Large Batches

For very large batches (500+ certificates):

1. **Split into Multiple Requests**: Break into batches of 100
2. **Monitor Progress**: Track success/failure counts
3. **Retry Failures**: Re-submit failed students in a new batch

### Example: Processing 500 Students

```typescript
const BATCH_SIZE = 100;
const allStudents = [...]; // 500 students

for (let i = 0; i < allStudents.length; i += BATCH_SIZE) {
  const batch = allStudents.slice(i, i + BATCH_SIZE);
  
  const response = await fetch('/api/v1/certificates/bulk-generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      templateId: 1,
      students: batch,
      issuedDate: '2024-03-15',
      issuedDateBS: '2080-12-02'
    })
  });
  
  const result = await response.json();
  console.log(`Batch ${i/BATCH_SIZE + 1}: ${result.data.success.length} success, ${result.data.failed.length} failed`);
  
  // Collect failures for retry
  if (result.data.failed.length > 0) {
    failedStudents.push(...result.data.failed);
  }
}
```

## Use Cases

### 1. Graduating Class Certificates

Generate character certificates for all students in Class 12:

```typescript
const students = await getStudentsByClass(12);

const certificateData = students.map(student => ({
  studentId: student.id,
  data: {
    student_name: student.fullName,
    class: 'Class 12',
    section: student.section,
    academic_year: '2080-2081',
    character: 'Excellent',
    conduct: 'Very Good'
  }
}));

const result = await bulkGenerateCertificates({
  templateId: CHARACTER_CERTIFICATE_TEMPLATE_ID,
  students: certificateData,
  issuedDate: new Date(),
  issuedDateBS: '2081-03-30'
});
```

### 2. Sports Tournament Certificates

Generate certificates for all tournament participants:

```typescript
const participants = await getTournamentParticipants(tournamentId);

const certificateData = participants.map(participant => ({
  studentId: participant.studentId,
  data: {
    student_name: participant.studentName,
    sport: tournament.sport,
    tournament_name: tournament.name,
    achievement: participant.position || 'Participation',
    date: tournament.date
  }
}));

const result = await bulkGenerateCertificates({
  templateId: SPORTS_CERTIFICATE_TEMPLATE_ID,
  students: certificateData,
  issuedDate: tournament.endDate,
  issuedDateBS: tournament.endDateBS
});
```

### 3. ECA Club Certificates

Generate certificates for all club members:

```typescript
const members = await getECAMembers(clubId);

const certificateData = members.map(member => ({
  studentId: member.studentId,
  data: {
    student_name: member.studentName,
    club_name: club.name,
    role: member.role,
    duration: `${club.startDate} to ${club.endDate}`,
    activities: member.activities.join(', ')
  }
}));

const result = await bulkGenerateCertificates({
  templateId: ECA_CERTIFICATE_TEMPLATE_ID,
  students: certificateData,
  issuedDate: club.endDate,
  issuedDateBS: club.endDateBS
});
```

## Testing

### Unit Tests

The bulk generation feature includes comprehensive unit tests:

- ✅ Generate multiple certificates successfully
- ✅ Handle partial failures
- ✅ Handle all failures
- ✅ Return detailed status for each student
- ✅ Handle service errors
- ✅ Pass issued date to service
- ✅ Handle large batch generation (100+ certificates)
- ✅ Track generation status for each student
- ✅ Provide detailed error messages for each failure
- ✅ Continue processing after individual failures
- ✅ Generate certificates with same issued date
- ✅ Generate unique certificate numbers for each student

### Running Tests

```bash
# Run all certificate tests
npm test -- certificate

# Run only bulk generation tests
npm test -- bulkGeneration

# Run with coverage
npm test -- certificate --coverage
```

## Security Considerations

1. **Authentication Required**: All bulk generation requests require valid JWT token
2. **Authorization Check**: Only authorized roles can generate certificates
3. **Rate Limiting**: API endpoint is rate-limited to prevent abuse
4. **Input Validation**: All inputs are validated before processing
5. **SQL Injection Prevention**: Parameterized queries used throughout
6. **File System Security**: Generated PDFs stored in secure directory

## Monitoring and Logging

### Logged Events

1. **Bulk Generation Started**: Template ID, student count, issued by
2. **Individual Success**: Certificate number, student ID
3. **Individual Failure**: Student ID, error message
4. **Bulk Generation Completed**: Success count, failure count, duration

### Metrics to Monitor

1. **Success Rate**: Percentage of successful generations
2. **Average Processing Time**: Time per certificate
3. **Failure Reasons**: Common error patterns
4. **Batch Sizes**: Distribution of batch sizes

## Future Enhancements

Potential improvements for future versions:

1. **Async Processing**: Queue large batches for background processing
2. **Progress Tracking**: Real-time progress updates via WebSocket
3. **Email Notifications**: Notify when batch generation completes
4. **Retry Mechanism**: Automatic retry for failed certificates
5. **Batch Templates**: Save common batch configurations
6. **Export Results**: Download CSV of generation results
7. **Scheduling**: Schedule batch generation for future date/time

## Related Documentation

- [Certificate Generation](./CERTIFICATE_GENERATION.md)
- [Certificate Templates](./CERTIFICATE_TEMPLATES.md)
- [Certificate Verification](./CERTIFICATE_VERIFICATION.md)
- [API Documentation](../../docs/API.md)

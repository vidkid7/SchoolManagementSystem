# Certificate Generation Implementation

## Task 27.2 - Completed

This document describes the certificate generation implementation for the School Management System.

## Requirements

Implements **Requirements 25.1, 25.3, 25.4, 25.5**:
- Generate certificates from templates
- Support all certificate types (character, transfer, academic, ECA, sports, etc.)
- Generate PDF with school branding
- Generate QR code for verification

## Implementation Summary

### Files Created

1. **Certificate.model.ts** (231 lines)
   - Sequelize model for generated certificates
   - Support for 9 certificate types
   - Certificate revocation functionality
   - Status tracking (active/revoked)

2. **certificate.repository.ts** (203 lines)
   - Database operations for certificates
   - Filtering and search capabilities
   - Certificate verification by number
   - Statistics generation

3. **certificate.service.ts** (450+ lines)
   - Core business logic for certificate generation
   - PDF generation using PDFKit
   - QR code generation using qrcode library
   - Bulk certificate generation
   - Certificate verification
   - Unique certificate number generation

4. **certificate.controller.ts** (250+ lines)
   - HTTP request handlers
   - RESTful API endpoints
   - Error handling

5. **certificate.validation.ts** (243 lines)
   - Joi validation schemas
   - Input validation for all operations

6. **certificate.routes.ts** (98 lines)
   - API route definitions
   - Validation middleware integration

7. **030-create-certificates-table.ts** (151 lines)
   - Database migration for certificates table
   - Indexes for performance

### Test Files

1. **Certificate.model.test.ts** - Model unit tests
2. **certificate.repository.test.ts** - Repository unit tests
3. **certificate.controller.test.ts** - Controller unit tests
4. **certificate.service.test.ts** - Service unit tests (17 tests)

## Features

### Certificate Generation
- Generate certificates from templates with variable substitution
- Support for all certificate types
- Automatic PDF generation with school branding
- QR code generation for verification
- Unique certificate number generation (format: CERT-{TYPE}-{YEAR}-{RANDOM})

### Bulk Generation
- Generate multiple certificates in one operation
- Partial failure handling (some succeed, some fail)
- Detailed success/failure reporting

### Certificate Verification
- Verify certificates by certificate number
- Check certificate status (active/revoked)
- Public verification endpoint

### Certificate Management
- List certificates with filters (student, type, status, date range)
- Get certificate by ID
- Get all certificates for a student
- Revoke certificates with reason tracking
- Certificate statistics

## API Endpoints

```
POST   /api/v1/certificates/generate              - Generate single certificate
POST   /api/v1/certificates/bulk-generate         - Generate multiple certificates
GET    /api/v1/certificates                       - List certificates (with filters)
GET    /api/v1/certificates/stats                 - Get statistics
GET    /api/v1/certificates/verify/:number        - Verify certificate
GET    /api/v1/certificates/student/:studentId    - Get student certificates
GET    /api/v1/certificates/:id                   - Get certificate by ID
PUT    /api/v1/certificates/:id/revoke            - Revoke certificate
```

## Certificate Types Supported

1. **character** - Character Certificate
2. **transfer** - Transfer Certificate
3. **academic_excellence** - Academic Excellence Certificate
4. **eca** - ECA Participation/Achievement
5. **sports** - Sports Participation/Achievement
6. **course_completion** - Course Completion Certificate
7. **bonafide** - Bonafide Certificate
8. **conduct** - Conduct Certificate
9. **participation** - Participation Certificate

## Certificate Number Format

Format: `CERT-{PREFIX}-{YEAR}-{RANDOM}`

**Prefixes:**
- CHAR - Character
- TRAN - Transfer
- ACAD - Academic Excellence
- ECA - ECA
- SPRT - Sports
- CRSE - Course Completion
- BONF - Bonafide
- COND - Conduct
- PART - Participation

**Example:** `CERT-CHAR-2024-0001`

## PDF Generation

The service generates PDF certificates with:
- A4 landscape layout
- School branding header
- Certificate title
- Template content with variable substitution
- QR code (bottom right, 100x100px)
- Certificate number (bottom left)
- Professional formatting

## QR Code Generation

QR codes include:
- Verification URL
- High error correction level (H)
- 200x200 pixel size
- PNG format (base64 encoded)
- Embedded in PDF

## Database Schema

```sql
CREATE TABLE certificates (
  certificate_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  certificate_number VARCHAR(50) NOT NULL UNIQUE,
  template_id INT UNSIGNED NOT NULL,
  student_id INT UNSIGNED NOT NULL,
  type ENUM(...) NOT NULL,
  issued_date DATE NOT NULL,
  issued_date_bs VARCHAR(10) NOT NULL,
  data JSON NOT NULL,
  pdf_url VARCHAR(500) NOT NULL,
  qr_code TEXT NOT NULL,
  issued_by INT UNSIGNED NOT NULL,
  verification_url VARCHAR(500) NOT NULL,
  status ENUM('active', 'revoked') NOT NULL DEFAULT 'active',
  revoked_at DATETIME NULL,
  revoked_by INT UNSIGNED NULL,
  revoked_reason TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  -- Foreign keys and indexes
);
```

## Testing

**Unit Tests:** 17 tests covering:
- Certificate generation (success and error cases)
- Bulk generation (success and partial failures)
- Certificate verification (valid, invalid, revoked)
- Certificate revocation
- Certificate number generation
- QR code generation
- PDF generation
- Repository operations
- Controller endpoints

**Test Coverage:**
- Service: All methods tested
- Repository: All CRUD operations tested
- Controller: All endpoints tested
- Model: Helper methods tested

## Usage Example

```typescript
// Generate a certificate
const certificate = await certificateService.generateCertificate({
  templateId: 1,
  studentId: 123,
  data: {
    student_name: 'John Doe',
    class: 'Class 10',
    achievement: 'Excellent Character'
  },
  issuedBy: 1
});

// Verify a certificate
const verification = await certificateService.verifyCertificate('CERT-CHAR-2024-0001');
console.log(verification.valid); // true or false
console.log(verification.message); // Verification message

// Bulk generate
const result = await certificateService.bulkGenerateCertificates({
  templateId: 1,
  students: [
    { studentId: 123, data: { ... } },
    { studentId: 124, data: { ... } }
  ],
  issuedBy: 1
});
console.log(`Success: ${result.success.length}, Failed: ${result.failed.length}`);
```

## Integration

1. Add routes to app.ts:
```typescript
import certificateRoutes from '@modules/certificate/certificate.routes';
app.use('/api/v1/certificates', certificateRoutes);
```

2. Run migration:
```bash
npm run migrate:up
```

3. Ensure upload directory exists:
```bash
mkdir -p uploads/certificates
```

## Related Tasks

- Task 27.1: Certificate template management (completed)
- Task 27.3: Certificate verification (partially implemented)
- Task 27.4: Bulk certificate generation (completed)

## Notes

- PDFs are stored in `uploads/certificates/` directory
- Certificate numbers are unique and auto-generated
- Revoked certificates remain in database but marked as revoked
- QR codes contain verification URLs for easy scanning
- All operations are logged for audit purposes
- Supports both BS and AD date formats

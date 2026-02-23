# Certificate Verification

## Overview

The certificate verification system provides a public endpoint for verifying the authenticity of certificates issued by the school. This supports both QR code scanning and direct certificate number lookup.

**Requirements:** 25.7

## Features

### 1. Public Verification Endpoint

- **Endpoint:** `GET /api/v1/certificates/verify/:certificateNumber`
- **Access:** Public (no authentication required)
- **Purpose:** Verify certificate authenticity for employers, institutions, or other third parties

### 2. QR Code Support

Each certificate includes a QR code that contains the verification URL:
```
http://localhost:3000/api/v1/certificates/verify/CERT-CHAR-2024-0001
```

When scanned, the QR code directs to the verification endpoint with the certificate number embedded in the URL.

### 3. Direct Certificate Number Lookup

Users can manually enter a certificate number to verify its authenticity without scanning a QR code.

### 4. Comprehensive Verification Information

The verification response includes:
- **Valid status:** Whether the certificate is authentic and active
- **Certificate details:**
  - Certificate number
  - Type (character, transfer, academic_excellence, etc.)
  - Student ID
  - Issue date (both AD and BS)
  - Certificate data (student name, class, achievements, etc.)
  - Status (active or revoked)
  - Verification URL
- **Revocation information** (if applicable):
  - Revocation date
  - Revocation reason
- **Verification timestamp:** When the verification was performed

## API Specification

### Request

```http
GET /api/v1/certificates/verify/:certificateNumber
```

**Parameters:**
- `certificateNumber` (path parameter): The unique certificate number in format `CERT-XXXX-YYYY-NNNN`

**Example:**
```http
GET /api/v1/certificates/verify/CERT-CHAR-2024-0001
```

### Response

#### Success Response (Valid Certificate)

**Status Code:** `200 OK`

```json
{
  "success": true,
  "data": {
    "valid": true,
    "certificate": {
      "certificateNumber": "CERT-CHAR-2024-0001",
      "type": "character",
      "studentId": 1,
      "issuedDate": "2024-01-15T00:00:00.000Z",
      "issuedDateBS": "2080-10-01",
      "data": {
        "student_name": "John Doe",
        "class": "Class 10",
        "conduct": "Excellent"
      },
      "status": "active",
      "verificationUrl": "http://localhost:3000/api/v1/certificates/verify/CERT-CHAR-2024-0001"
    },
    "message": "Certificate is valid and authentic",
    "verifiedAt": "2024-03-20T10:30:00.000Z"
  }
}
```

#### Error Response (Certificate Not Found)

**Status Code:** `404 Not Found`

```json
{
  "success": false,
  "data": {
    "valid": false,
    "message": "Certificate not found. Please verify the certificate number and try again.",
    "verifiedAt": "2024-03-20T10:30:00.000Z"
  }
}
```

#### Error Response (Revoked Certificate)

**Status Code:** `404 Not Found`

```json
{
  "success": false,
  "data": {
    "valid": false,
    "certificate": {
      "certificateNumber": "CERT-CHAR-2024-0001",
      "type": "character",
      "studentId": 1,
      "issuedDate": "2024-01-15T00:00:00.000Z",
      "issuedDateBS": "2080-10-01",
      "data": {
        "student_name": "John Doe",
        "class": "Class 10"
      },
      "status": "revoked",
      "revokedAt": "2024-02-01T00:00:00.000Z",
      "revokedReason": "Student transferred to another school",
      "verificationUrl": "http://localhost:3000/api/v1/certificates/verify/CERT-CHAR-2024-0001"
    },
    "message": "Certificate has been revoked on February 1, 2024. Reason: Student transferred to another school",
    "verifiedAt": "2024-03-20T10:30:00.000Z"
  }
}
```

#### Validation Error (Invalid Certificate Number Format)

**Status Code:** `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "certificateNumber",
        "message": "Invalid certificate number format. Expected format: CERT-XXXX-YYYY-NNNN"
      }
    ]
  }
}
```

#### Validation Error (Empty Certificate Number)

**Status Code:** `400 Bad Request`

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CERTIFICATE_NUMBER",
    "message": "Certificate number is required"
  }
}
```

## Certificate Number Format

Certificate numbers follow a standardized format:

```
CERT-[TYPE]-[YEAR]-[SEQUENCE]
```

**Components:**
- `CERT`: Fixed prefix
- `TYPE`: 4-letter type code (CHAR, TRAN, ACAD, ECA, SPRT, etc.)
- `YEAR`: 4-digit year
- `SEQUENCE`: 4-digit sequential number (0001-9999)

**Examples:**
- `CERT-CHAR-2024-0001` - Character Certificate
- `CERT-TRAN-2024-0042` - Transfer Certificate
- `CERT-ACAD-2024-0123` - Academic Excellence Certificate
- `CERT-ECA-2024-0005` - ECA Participation Certificate
- `CERT-SPRT-2024-0018` - Sports Achievement Certificate

## Type Codes

| Type | Code | Description |
|------|------|-------------|
| Character | CHAR | Character Certificate |
| Transfer | TRAN | Transfer Certificate |
| Academic Excellence | ACAD | Academic Excellence Certificate |
| ECA | ECA | Extra-Curricular Activities Certificate |
| Sports | SPRT | Sports Achievement Certificate |
| Course Completion | CRSE | Course Completion Certificate |
| Bonafide | BONF | Bonafide Certificate |
| Conduct | COND | Conduct Certificate |
| Participation | PART | Participation Certificate |

## Usage Examples

### 1. Verify via QR Code Scan

1. User scans QR code on certificate using mobile device
2. QR code contains URL: `http://localhost:3000/api/v1/certificates/verify/CERT-CHAR-2024-0001`
3. Browser/app makes GET request to verification endpoint
4. System returns verification result

### 2. Manual Certificate Number Entry

1. User enters certificate number: `CERT-CHAR-2024-0001`
2. Application makes GET request: `GET /api/v1/certificates/verify/CERT-CHAR-2024-0001`
3. System returns verification result

### 3. Integration with Third-Party Systems

```javascript
// Example: Verify certificate in Node.js
const axios = require('axios');

async function verifyCertificate(certificateNumber) {
  try {
    const response = await axios.get(
      `http://localhost:3000/api/v1/certificates/verify/${certificateNumber}`
    );
    
    if (response.data.success && response.data.data.valid) {
      console.log('Certificate is valid');
      console.log('Student:', response.data.data.certificate.data.student_name);
      console.log('Type:', response.data.data.certificate.type);
      return true;
    } else {
      console.log('Certificate is invalid:', response.data.data.message);
      return false;
    }
  } catch (error) {
    console.error('Verification failed:', error.message);
    return false;
  }
}

// Usage
verifyCertificate('CERT-CHAR-2024-0001');
```

## Security Considerations

### 1. Public Access

The verification endpoint is intentionally public to allow third parties to verify certificates without authentication. This is a standard practice for certificate verification systems.

### 2. Rate Limiting

Consider implementing rate limiting to prevent abuse:
- Limit: 100 requests per IP per hour
- Prevents automated scraping of certificate data

### 3. Data Exposure

The verification endpoint only exposes:
- Certificate metadata (number, type, dates)
- Student ID (numeric identifier)
- Certificate-specific data (name, class, achievements)

Sensitive information (contact details, addresses, etc.) is NOT exposed.

### 4. Revocation Handling

Revoked certificates are clearly marked with:
- Revocation status
- Revocation date
- Revocation reason

This ensures transparency while maintaining certificate integrity.

## Testing

### Unit Tests

Comprehensive unit tests cover:
- Valid certificate verification
- Invalid certificate handling
- Revoked certificate handling
- Empty/whitespace certificate number validation
- Comprehensive certificate information retrieval
- Revocation date formatting
- Error handling

**Test File:** `backend/src/modules/certificate/__tests__/certificate.service.test.ts`

**Run Tests:**
```bash
npm test -- certificate.service.test.ts
npm test -- certificate.controller.test.ts
```

### Manual Testing

1. **Generate a test certificate:**
```bash
POST /api/v1/certificates/generate
{
  "templateId": 1,
  "studentId": 1,
  "data": {
    "student_name": "Test Student",
    "class": "Class 10"
  }
}
```

2. **Verify the certificate:**
```bash
GET /api/v1/certificates/verify/CERT-CHAR-2024-0001
```

3. **Revoke the certificate:**
```bash
PUT /api/v1/certificates/1/revoke
{
  "reason": "Test revocation"
}
```

4. **Verify revoked certificate:**
```bash
GET /api/v1/certificates/verify/CERT-CHAR-2024-0001
```

## Future Enhancements

### 1. Blockchain Integration

Consider storing certificate hashes on a blockchain for immutable verification:
- Generate SHA-256 hash of certificate data
- Store hash on blockchain
- Verify certificate by comparing hash

### 2. Batch Verification API

Allow verification of multiple certificates in a single request:
```http
POST /api/v1/certificates/verify/batch
{
  "certificateNumbers": [
    "CERT-CHAR-2024-0001",
    "CERT-TRAN-2024-0002"
  ]
}
```

### 3. Verification History

Track verification attempts for analytics:
- Number of verifications per certificate
- Geographic distribution of verifications
- Time-based verification patterns

### 4. Email/SMS Verification Alerts

Notify certificate holders when their certificate is verified:
- Send email/SMS to student/parent
- Include verification timestamp and location
- Helps detect fraudulent verification attempts

## Related Documentation

- [Certificate Generation](./CERTIFICATE_GENERATION.md)
- [Certificate Templates](./README.md)
- [API Documentation](../../docs/API.md)

## Support

For issues or questions about certificate verification:
- Check the [FAQ](./FAQ.md)
- Review [API Documentation](../../docs/API.md)
- Contact: support@schoolsystem.com

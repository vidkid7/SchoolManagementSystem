# Swagger/OpenAPI Documentation

## Overview

This document describes the Swagger/OpenAPI 3.0 documentation implementation for the School Management System API.

## Access Points

### Development Environment

- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI JSON**: http://localhost:3000/api-docs.json
- **API Base URL**: http://localhost:3000/api/v1

### Production Environment

- **Swagger UI**: https://api.schoolsystem.com/api-docs
- **OpenAPI JSON**: https://api.schoolsystem.com/api-docs.json
- **API Base URL**: https://api.schoolsystem.com/api/v1

## Features

### 1. Interactive API Documentation

The Swagger UI provides:
- Interactive API exploration
- Request/response examples
- Schema definitions
- Authentication testing
- Try-it-out functionality

### 2. API Versioning Support

All endpoints are versioned using URL path versioning:
```
/api/v1/students
/api/v1/auth/login
/api/v1/finance/invoices
```

### 3. Comprehensive Schema Definitions

Common schemas are defined in the Swagger configuration:
- `Error` - Standard error response format
- `SuccessResponse` - Standard success response format
- `PaginatedResponse` - Paginated list response format
- `UserRole` - All 13 user roles
- `NEBGrade` - NEB grading system grades
- `AttendanceStatus` - Attendance status values
- `PaymentMethod` - Payment method options

### 4. Security Schemes

JWT Bearer token authentication is configured:
```yaml
securitySchemes:
  bearerAuth:
    type: http
    scheme: bearer
    bearerFormat: JWT
```

Include the token in requests:
```
Authorization: Bearer <your-jwt-token>
```

### 5. Common Response Definitions

Reusable response definitions:
- `UnauthorizedError` (401)
- `ForbiddenError` (403)
- `NotFoundError` (404)
- `ValidationError` (400)
- `RateLimitError` (429)

### 6. Common Parameters

Reusable query parameters:
- `PageParam` - Page number for pagination
- `LimitParam` - Items per page
- `SortParam` - Sort field and order
- `SearchParam` - Search query

## Documentation Structure

### Configuration File
```
backend/src/config/swagger.ts
```
Main Swagger configuration with:
- API metadata
- Server definitions
- Security schemes
- Common schemas
- Tags
- File paths for documentation

### YAML Documentation Files
```
backend/src/docs/swagger/
├── auth.yaml          # Authentication endpoints
├── students.yaml      # Student management endpoints
├── finance.yaml       # Finance and payment endpoints
└── [other modules].yaml
```

Each YAML file contains:
- Path definitions
- Request/response schemas
- Examples
- Parameter definitions

### Controller JSDoc Comments

Controllers can also be documented using JSDoc comments:

```typescript
/**
 * @swagger
 * /api/v1/students:
 *   get:
 *     tags:
 *       - Students
 *     summary: List all students
 *     description: Retrieve a paginated list of students
 *     responses:
 *       200:
 *         description: Success
 */
```

## Module Documentation Status

### ✅ Fully Documented
- Authentication (auth.yaml)
- Students (students.yaml)
- Finance (finance.yaml)

### 🔄 Partially Documented
- Staff
- Academic
- Attendance
- Examinations

### ⏳ To Be Documented
- Library
- ECA
- Sports
- Communication
- Certificates
- Documents
- Calendar
- Reports
- Configuration
- Audit

## Adding New Endpoint Documentation

### Method 1: YAML File (Recommended)

1. Create or edit a YAML file in `backend/src/docs/swagger/`
2. Define the path and operations:

```yaml
paths:
  /your-endpoint:
    get:
      tags:
        - YourModule
      summary: Brief description
      description: Detailed description
      parameters:
        - in: query
          name: param1
          schema:
            type: string
      responses:
        '200':
          description: Success response
          content:
            application/json:
              schema:
                type: object
```

3. The file is automatically picked up by Swagger (no restart needed in dev mode)

### Method 2: JSDoc Comments

Add JSDoc comments above controller methods:

```typescript
/**
 * @swagger
 * /api/v1/endpoint:
 *   post:
 *     tags:
 *       - Module
 *     summary: Create resource
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Created
 */
async createResource(req: Request, res: Response) {
  // Implementation
}
```

## Best Practices

### 1. Use Reusable Components

Reference common schemas instead of duplicating:
```yaml
schema:
  $ref: '#/components/schemas/Error'
```

### 2. Provide Examples

Include realistic examples for requests and responses:
```yaml
example:
  username: admin@school.com
  password: Password123!
```

### 3. Document All Parameters

Include descriptions for all parameters:
```yaml
parameters:
  - in: query
    name: class
    schema:
      type: integer
    description: Filter by class (1-12)
```

### 4. Use Proper HTTP Status Codes

Document all possible response codes:
- 200: Success
- 201: Created
- 400: Validation Error
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Rate Limit Exceeded
- 500: Server Error

### 5. Group Related Endpoints

Use tags to organize endpoints:
```yaml
tags:
  - Students
  - Finance
  - Authentication
```

### 6. Document Authentication Requirements

Specify which endpoints require authentication:
```yaml
security:
  - bearerAuth: []
```

Or disable for public endpoints:
```yaml
security: []
```

## Testing the Documentation

### 1. View in Browser
Navigate to http://localhost:3000/api-docs

### 2. Test Endpoints
1. Click "Authorize" button
2. Enter JWT token: `Bearer <token>`
3. Click "Authorize"
4. Try out endpoints using "Try it out" button

### 3. Validate OpenAPI Spec
```bash
# Install validator
npm install -g @apidevtools/swagger-cli

# Validate spec
swagger-cli validate http://localhost:3000/api-docs.json
```

## Customization

### Swagger UI Options

Configured in `backend/src/app.ts`:
```typescript
swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'School Management System API',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true
  }
})
```

### Theme Customization

Add custom CSS in the setup options:
```typescript
customCss: `
  .swagger-ui .topbar { display: none }
  .swagger-ui .info { background-color: #f5f5f5 }
`
```

## Troubleshooting

### Documentation Not Showing

1. Check file paths in `swagger.ts`:
```typescript
apis: [
  './src/modules/**/*.routes.ts',
  './src/modules/**/*.controller.ts',
  './src/docs/swagger/*.yaml'
]
```

2. Verify YAML syntax:
```bash
# Install YAML linter
npm install -g yaml-lint

# Check syntax
yaml-lint backend/src/docs/swagger/*.yaml
```

3. Check server logs for errors

### Endpoints Not Appearing

1. Ensure route files are in correct location
2. Check JSDoc comment syntax
3. Verify YAML path definitions
4. Restart development server

### Authentication Not Working

1. Get valid JWT token from `/api/v1/auth/login`
2. Click "Authorize" in Swagger UI
3. Enter: `Bearer <your-token>`
4. Click "Authorize"

## Nepal-Specific Features Documented

### 1. Bikram Sambat Calendar
- Date fields support both BS and AD formats
- Example: `dateOfBirthBS: "2065-05-15"`

### 2. NEB Grading System
- Grade enum: A+, A, B+, B, C+, C, D, NG
- GPA calculation formulas documented

### 3. Nepal Payment Gateways
- eSewa integration
- Khalti integration
- IME Pay integration
- Payment initiation and callback flows

### 4. Nepali Language Support
- Bilingual field examples (English and Nepali)
- Example: `firstNameEn` and `firstNameNp`

### 5. Nepal Education System
- Class 1-12 support
- SEE (Class 10) and NEB (Class 11-12) specific fields
- Symbol numbers and registration numbers

## Maintenance

### Regular Updates

1. Document new endpoints as they're added
2. Update examples when data structures change
3. Keep error responses consistent
4. Review and update descriptions periodically

### Version Management

When creating API v2:
1. Update server URLs in `swagger.ts`
2. Create separate documentation files
3. Maintain v1 documentation for backward compatibility

## Resources

- [OpenAPI 3.0 Specification](https://swagger.io/specification/)
- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [Best Practices Guide](https://swagger.io/resources/articles/best-practices-in-api-documentation/)

## Support

For questions or issues with API documentation:
- Check this README
- Review example YAML files
- Consult OpenAPI specification
- Contact development team

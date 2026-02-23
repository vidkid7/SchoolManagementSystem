# Middleware Documentation

This directory contains all middleware implementations for the School Management System API.

## Overview

The middleware layer provides cross-cutting concerns including:
- **Authentication & Authorization**: JWT verification and role-based access control
- **Validation**: Request data validation and sanitization
- **Error Handling**: Consistent error responses and logging
- **Security**: CORS, helmet, XSS protection, rate limiting
- **Rate Limiting**: Prevent API abuse

## Requirements Coverage

- **Requirement 1.4**: JWT token and role permissions verification
- **Requirement 36.7**: RBAC implementation at API level
- **Requirement 36.5**: CSRF protection (double-submit cookie pattern)
- **Requirement 36.6**: Input sanitization (SQL injection and XSS prevention)
- **Requirement 35.4**: Rate limiting implementation

---

## Security Features

### XSS (Cross-Site Scripting) Prevention

The middleware implements comprehensive XSS protection using the `xss` library:

1. **Automatic Sanitization**: All request data (body, query, params) is automatically sanitized
2. **HTML Tag Removal**: Dangerous HTML tags and JavaScript code are removed
3. **Event Handler Removal**: Event handlers like `onclick`, `onerror` are stripped
4. **Protocol Filtering**: Dangerous protocols like `javascript:` are removed
5. **Nested Object Support**: Recursively sanitizes nested objects and arrays

### CSRF (Cross-Site Request Forgery) Protection

The middleware implements CSRF protection using the double-submit cookie pattern:

1. **Token Generation**: Cryptographically secure random tokens
2. **Cookie Storage**: Tokens stored in httpOnly cookies (SameSite=strict)
3. **Token Validation**: Tokens must match between cookie and request header/body
4. **Safe Methods**: GET, HEAD, OPTIONS requests skip CSRF validation
5. **Automatic Token Refresh**: Tokens are automatically generated and refreshed

### SQL Injection Prevention

The middleware provides multiple layers of SQL injection protection:

1. **Primary Defense**: Sequelize ORM with parameterized queries
2. **Secondary Defense**: Pattern detection middleware catches suspicious input
3. **Pattern Matching**: Detects common SQL injection patterns (UNION, DROP, etc.)
4. **Nested Object Scanning**: Recursively checks all input data
5. **Detailed Error Messages**: Identifies specific fields with suspicious content

---

## Authentication & Authorization Middleware

### `authenticate`

Verifies JWT access token and attaches user data to request.

**Usage:**
```typescript
import { authenticate } from '@middleware/auth';

router.get('/protected', authenticate, (req, res) => {
  // req.user is now available
  res.json({ user: req.user });
});
```

**Requirements:** 1.4, 36.7

**Behavior:**
- Extracts token from `Authorization: Bearer <token>` header
- Verifies token signature using JWT service
- Attaches decoded user data to `req.user`
- Throws `AuthenticationError` if token is missing or invalid

---

### `authorize(...roles)`

Role-based authorization middleware factory. Checks if authenticated user has one of the required roles.

**Usage:**
```typescript
import { authenticate, authorize } from '@middleware/auth';

// Single role
router.post('/admin/users', 
  authenticate, 
  authorize('School_Admin'),
  createUser
);

// Multiple roles
router.get('/students', 
  authenticate,
  authorize('School_Admin', 'Class_Teacher', 'Subject_Teacher'),
  getStudents
);
```

**Requirements:** 1.4, 1.5, 36.7

**Behavior:**
- Requires `authenticate` middleware to run first
- Checks if `req.user.role` matches one of the allowed roles
- Throws `AuthorizationError` if user doesn't have required role
- Logs authorization failures for security auditing

---

### `requirePermissions(...permissions)`

Permission-based authorization middleware factory. Checks if user has specific permissions.

**Usage:**
```typescript
import { authenticate, requirePermissions } from '@middleware/auth';

router.delete('/students/:id',
  authenticate,
  requirePermissions('delete:students'),
  deleteStudent
);

// Multiple permissions (user must have ALL)
router.post('/grades/bulk',
  authenticate,
  requirePermissions('write:grades', 'bulk:operations'),
  bulkCreateGrades
);
```

**Requirements:** 1.5, 36.7

**Behavior:**
- Requires `authenticate` middleware to run first
- Checks if user has ALL required permissions
- Permissions are stored in JWT token payload
- Throws `AuthorizationError` if user lacks any required permission

---

### `optionalAuth`

Optional authentication middleware. Attaches user data if token is present, but doesn't fail if missing.

**Usage:**
```typescript
import { optionalAuth } from '@middleware/auth';

// Public endpoint that can show different data for authenticated users
router.get('/announcements', optionalAuth, getAnnouncements);
```

**Behavior:**
- Attempts to verify token if present
- Silently fails if token is missing or invalid
- Useful for public endpoints that can be enhanced for authenticated users

---

### `requireSelfAccess(userIdParam?)`

Ensures user can only access their own resources (or admin can access any).

**Usage:**
```typescript
import { authenticate, requireSelfAccess } from '@middleware/auth';

// Default parameter name is 'userId'
router.get('/users/:userId/profile',
  authenticate,
  requireSelfAccess(),
  getUserProfile
);

// Custom parameter name
router.get('/students/:studentId/grades',
  authenticate,
  requireSelfAccess('studentId'),
  getStudentGrades
);
```

**Requirements:** 36.7

**Behavior:**
- Compares `req.user.userId` with route parameter
- Allows access if IDs match OR user is School_Admin
- Throws `AuthorizationError` if user tries to access other user's resources

---

### `requireResourceOwnership(getOwnerId)`

Ensures user owns the resource they're trying to access.

**Usage:**
```typescript
import { authenticate, requireResourceOwnership } from '@middleware/auth';

// Function to get resource owner ID
const getAssignmentOwnerId = async (req: Request) => {
  const assignment = await Assignment.findByPk(req.params.id);
  return assignment?.studentId || null;
};

router.put('/assignments/:id',
  authenticate,
  requireResourceOwnership(getAssignmentOwnerId),
  updateAssignment
);
```

**Requirements:** 36.7

**Behavior:**
- Calls provided function to get resource owner ID
- Allows access if user owns resource OR user is School_Admin
- Throws `AuthorizationError` if user doesn't own resource
- Throws `AuthorizationError` if resource not found

---

## Validation Middleware

### `validate(schema, target)`

Joi-based validation middleware factory.

**Usage:**
```typescript
import Joi from 'joi';
import { validate } from '@middleware/validation';

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().min(8).required()
});

router.post('/auth/login', validate(loginSchema, 'body'), login);
```

**Parameters:**
- `schema`: Joi validation schema
- `target`: 'body' | 'query' | 'params' (default: 'body')

**Behavior:**
- Validates request data against Joi schema
- Strips unknown fields
- Returns all validation errors (not just first)
- Throws `ValidationError` with detailed error messages

---

### `validateRequest(validations)`

Express-validator based validation middleware.

**Usage:**
```typescript
import { body } from 'express-validator';
import { validateRequest } from '@middleware/validation';

router.post('/students',
  validateRequest([
    body('firstName').notEmpty().trim(),
    body('email').isEmail().normalizeEmail(),
    body('age').isInt({ min: 5, max: 20 })
  ]),
  createStudent
);
```

**Requirements:** 1.4, 36.7

**Parameters:**
- `validations`: Array of express-validator validation chains

**Behavior:**
- Runs all validation chains
- Collects all validation errors
- Throws `ValidationError` with formatted errors
- Supports all express-validator validators and sanitizers

---

### `sanitizeRequest`

Sanitizes request data to prevent XSS and injection attacks.

**Usage:**
```typescript
import { sanitizeRequest } from '@middleware/validation';

// Apply globally in app.ts
app.use(sanitizeRequest);

// Or per route
router.post('/comments', sanitizeRequest, createComment);
```

**Requirements:** 36.6

**Behavior:**
- Removes null bytes (`\0`)
- Trims whitespace from strings
- Removes dangerous HTML tags and JavaScript code (XSS prevention)
- Recursively sanitizes nested objects and arrays
- Preserves non-string values (numbers, booleans, null)
- Sanitizes body, query, and params

---

### `sanitizeHtml(html, allowedTags?)`

Sanitizes HTML content while allowing specific safe tags (for rich text editors).

**Usage:**
```typescript
import { sanitizeHtml } from '@middleware/validation';

// Sanitize with default allowed tags
const safeHtml = sanitizeHtml(userInput);

// Sanitize with custom allowed tags
const safeHtml = sanitizeHtml(userInput, ['p', 'br', 'strong', 'a']);
```

**Requirements:** 36.6

**Parameters:**
- `html`: HTML string to sanitize
- `allowedTags`: Array of allowed HTML tags (default: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li'])

**Behavior:**
- Removes dangerous HTML tags and attributes
- Keeps only specified safe tags
- Removes JavaScript event handlers
- Filters dangerous protocols (javascript:, data:)

---

### `csrfProtection`

CSRF protection middleware using double-submit cookie pattern.

**Usage:**
```typescript
import { csrfProtection, setCsrfToken } from '@middleware/validation';

// Set CSRF token (usually in login or session creation)
router.post('/auth/login', setCsrfToken, login);

// Protect state-changing operations
router.post('/students', authenticate, csrfProtection, createStudent);
router.put('/students/:id', authenticate, csrfProtection, updateStudent);
router.delete('/students/:id', authenticate, csrfProtection, deleteStudent);
```

**Requirements:** 36.5

**Behavior:**
- Skips validation for safe methods (GET, HEAD, OPTIONS)
- Validates token from cookie matches token in header or body
- Throws `ValidationError` if token is missing or invalid
- Token can be sent in `X-CSRF-Token` header or `csrfToken` body field

---

### `setCsrfToken`

Middleware to generate and set CSRF token cookie.

**Usage:**
```typescript
import { setCsrfToken } from '@middleware/validation';

// Set token on login or session creation
router.post('/auth/login', setCsrfToken, login);

// Token is available in res.locals.csrfToken for sending to client
router.get('/csrf-token', setCsrfToken, (req, res) => {
  res.json({ csrfToken: res.locals.csrfToken });
});
```

**Requirements:** 36.5

**Behavior:**
- Generates new token if not exists
- Reuses existing token if present
- Sets cookie with secure options (httpOnly=false, sameSite=strict)
- Makes token available in `res.locals.csrfToken`

---

### `sqlInjectionProtection`

Middleware to detect and block SQL injection attempts.

**Usage:**
```typescript
import { sqlInjectionProtection } from '@middleware/validation';

// Apply globally (recommended)
app.use(sqlInjectionProtection);

// Or per route
router.post('/search', sqlInjectionProtection, search);
```

**Requirements:** 36.6

**Behavior:**
- Scans body, query, and params for SQL injection patterns
- Detects UNION, DROP, INSERT, DELETE, etc.
- Checks nested objects and arrays
- Throws `ValidationError` with field name if suspicious input detected
- Note: This is secondary defense; primary defense is parameterized queries

---

## Validation Schemas

Pre-built validation schemas are available in `validation.schemas.ts`:

**Usage:**
```typescript
import { validationSchemas } from '@middleware/validation.schemas';
import { validate } from '@middleware/validation';

// Student creation
router.post('/students',
  authenticate,
  validate(validationSchemas.student.create, 'body'),
  createStudent
);

// Pagination
router.get('/students',
  authenticate,
  validate(validationSchemas.common.pagination, 'query'),
  getStudents
);

// Attendance marking
router.post('/attendance',
  authenticate,
  validate(validationSchemas.attendance.mark, 'body'),
  markAttendance
);
```

**Available Schema Categories:**
- `common`: ID, pagination, dates, search
- `student`: create, update, listFilters
- `attendance`: mark, bulkMark, leaveApplication
- `examination`: createExam, gradeEntry
- `finance`: createFeeStructure, processPayment

---

## Error Handling Middleware

### `errorHandler`

Global error handler that catches all errors and returns consistent responses.

**Usage:**
```typescript
// Must be registered LAST in app.ts
app.use(errorHandler);
```

**Requirements:** 1.4, 36.7

**Behavior:**
- Catches all errors from routes and middleware
- Logs errors with context (path, method, user, IP)
- Returns consistent error response format
- Handles specific error types (JWT, Sequelize, Multer)
- Hides sensitive error details in production

**Error Response Format:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format"
      }
    ]
  }
}
```

---

### `notFoundHandler`

Handles 404 errors for undefined routes.

**Usage:**
```typescript
// Register before errorHandler in app.ts
app.use(notFoundHandler);
app.use(errorHandler);
```

**Behavior:**
- Returns 404 error for any unmatched route
- Includes requested method and path in error message

---

### `asyncHandler(fn)`

Wrapper for async route handlers to catch errors.

**Usage:**
```typescript
import { asyncHandler } from '@middleware/errorHandler';

router.get('/students', asyncHandler(async (req, res) => {
  const students = await Student.findAll();
  res.json({ success: true, data: students });
}));
```

**Behavior:**
- Wraps async function and catches any thrown errors
- Passes errors to error handler middleware
- Eliminates need for try-catch in every route handler

---

### Custom Error Classes

**Available Error Classes:**
- `AppError`: Base error class
- `ValidationError`: 400 - Validation failures
- `AuthenticationError`: 401 - Authentication required
- `AuthorizationError`: 403 - Permission denied
- `NotFoundError`: 404 - Resource not found
- `ConflictError`: 409 - Resource conflict (e.g., duplicate)
- `RateLimitError`: 429 - Too many requests

**Usage:**
```typescript
import { NotFoundError, ConflictError } from '@middleware/errorHandler';

const getStudent = async (req, res) => {
  const student = await Student.findByPk(req.params.id);
  
  if (!student) {
    throw new NotFoundError('Student');
  }
  
  res.json({ success: true, data: student });
};

const createStudent = async (req, res) => {
  const existing = await Student.findOne({ where: { email: req.body.email } });
  
  if (existing) {
    throw new ConflictError('Student with this email already exists');
  }
  
  const student = await Student.create(req.body);
  res.json({ success: true, data: student });
};
```

---

## Rate Limiting Middleware

### `apiRateLimiter`

General API rate limiter: 100 requests per minute per user.

**Usage:**
```typescript
import { apiRateLimiter } from '@middleware/rateLimiter';

// Apply globally
app.use('/api', apiRateLimiter);
```

**Requirements:** 35.4

**Behavior:**
- Limits to 100 requests per minute
- Uses user ID if authenticated, otherwise IP address
- Skips health check endpoint
- Returns rate limit info in response headers
- Throws `RateLimitError` when limit exceeded

---

### `loginRateLimiter`

Strict rate limiter for login endpoint: 5 attempts per 15 minutes.

**Usage:**
```typescript
import { loginRateLimiter } from '@middleware/rateLimiter';

router.post('/auth/login', loginRateLimiter, login);
```

**Requirements:** 1.9, 35.4

**Behavior:**
- Limits to 5 login attempts per 15 minutes per IP
- Doesn't count successful logins
- Prevents brute force attacks
- Works with account lockout mechanism

---

### `fileUploadRateLimiter`

Rate limiter for file uploads: 10 uploads per minute.

**Usage:**
```typescript
import { fileUploadRateLimiter } from '@middleware/rateLimiter';

router.post('/students/:id/photo', 
  authenticate,
  fileUploadRateLimiter,
  uploadPhoto
);
```

**Requirements:** 35.4

**Behavior:**
- Limits to 10 file uploads per minute per user
- Prevents abuse of file upload endpoints
- Uses user ID for authenticated requests

---

### `createRateLimiter(options)`

Factory function to create custom rate limiters.

**Usage:**
```typescript
import { createRateLimiter } from '@middleware/rateLimiter';

const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests
  message: 'Too many requests to this endpoint',
  skipSuccessfulRequests: false
});

router.post('/sensitive-operation', strictRateLimiter, handler);
```

---

## Security Middleware

### `helmetMiddleware`

Sets security-related HTTP headers using Helmet.

**Usage:**
```typescript
import { helmetMiddleware } from '@middleware/security';

app.use(helmetMiddleware);
```

**Requirements:** 36.1

**Features:**
- Content Security Policy (CSP)
- HTTP Strict Transport Security (HSTS)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

---

### `corsMiddleware`

Configures Cross-Origin Resource Sharing (CORS).

**Usage:**
```typescript
import { corsMiddleware } from '@middleware/security';

app.use(corsMiddleware);
```

**Requirements:** 36.1

**Behavior:**
- Allows configured origins from environment variables
- Supports credentials (cookies)
- Allows standard HTTP methods
- Includes custom headers (X-School-Code)

---

### `hppMiddleware`

Prevents HTTP Parameter Pollution attacks.

**Usage:**
```typescript
import { hppMiddleware } from '@middleware/security';

app.use(hppMiddleware);
```

**Requirements:** 36.6

**Behavior:**
- Prevents duplicate parameters
- Whitelists common query parameters (sort, filter, page, limit)

---

### `xssProtection`

Adds XSS protection headers.

**Usage:**
```typescript
import { xssProtection } from '@middleware/security';

app.use(xssProtection);
```

**Requirements:** 36.6

**Headers:**
- X-XSS-Protection: 1; mode=block
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY

---

## Middleware Chain Examples

### Protected Admin Route
```typescript
router.post('/admin/users',
  authenticate,
  authorize('School_Admin'),
  validateRequest([
    body('username').notEmpty().trim(),
    body('email').isEmail(),
    body('role').isIn(Object.values(UserRole))
  ]),
  asyncHandler(createUser)
);
```

### Student Self-Access Route
```typescript
router.get('/students/:studentId/grades',
  authenticate,
  authorize('Student', 'Parent', 'Class_Teacher', 'School_Admin'),
  requireSelfAccess('studentId'),
  asyncHandler(getStudentGrades)
);
```

### Public Route with Optional Auth
```typescript
router.get('/announcements',
  optionalAuth,
  asyncHandler(getAnnouncements)
);
```

### File Upload with Rate Limiting
```typescript
router.post('/students/:id/documents',
  authenticate,
  authorize('School_Admin', 'Student'),
  fileUploadRateLimiter,
  requireSelfAccess('id'),
  upload.single('document'),
  asyncHandler(uploadDocument)
);
```

---

## Testing

All middleware have comprehensive unit tests in `__tests__/` directory.

**Run tests:**
```bash
npm test -- middleware
```

**Test coverage:**
- Authentication scenarios (valid/invalid tokens)
- Authorization scenarios (role checks, permission checks)
- Validation scenarios (valid/invalid data)
- Error handling scenarios
- Rate limiting scenarios
- Sanitization scenarios

---

## Best Practices

1. **Always use `authenticate` before `authorize`**
   ```typescript
   // ✅ Correct
   router.get('/protected', authenticate, authorize('Admin'), handler);
   
   // ❌ Wrong - authorize needs req.user from authenticate
   router.get('/protected', authorize('Admin'), authenticate, handler);
   ```

2. **Use `asyncHandler` for async route handlers**
   ```typescript
   // ✅ Correct
   router.get('/students', asyncHandler(async (req, res) => {
     const students = await Student.findAll();
     res.json({ success: true, data: students });
   }));
   
   // ❌ Wrong - errors won't be caught
   router.get('/students', async (req, res) => {
     const students = await Student.findAll();
     res.json({ success: true, data: students });
   });
   ```

3. **Validate input before processing**
   ```typescript
   // ✅ Correct
   router.post('/students',
     authenticate,
     validateRequest([...validations]),
     asyncHandler(createStudent)
   );
   ```

4. **Apply rate limiting to sensitive endpoints**
   ```typescript
   // ✅ Correct
   router.post('/auth/login', loginRateLimiter, login);
   router.post('/auth/forgot-password', loginRateLimiter, forgotPassword);
   ```

5. **Use specific error classes**
   ```typescript
   // ✅ Correct
   if (!student) {
     throw new NotFoundError('Student');
   }
   
   // ❌ Wrong - generic error
   if (!student) {
     throw new Error('Student not found');
   }
   ```

---

## Security Considerations

1. **JWT Token Security**
   - Tokens are verified on every request
   - Expired tokens are rejected
   - Refresh tokens stored in Redis with automatic expiration
   - Token invalidation on logout and role changes

2. **Input Validation**
   - All user input is validated before processing
   - Unknown fields are stripped
   - Null bytes and dangerous characters are removed

3. **Rate Limiting**
   - Prevents brute force attacks
   - Prevents API abuse
   - Uses Redis for distributed rate limiting

4. **Error Handling**
   - Sensitive information hidden in production
   - All errors logged with context
   - Consistent error response format

5. **RBAC Implementation**
   - Role checks at API level
   - Permission-based access control
   - Resource ownership validation
   - Comprehensive audit logging

---

## Troubleshooting

### "Authentication required" error
- Check if `Authorization` header is present
- Verify token format: `Bearer <token>`
- Check if token is expired
- Verify JWT_SECRET matches between token generation and verification

### "Permission denied" error
- Check if user has required role
- Verify role is correctly set in JWT token
- Check if route requires specific permissions

### Rate limit exceeded
- Wait for rate limit window to reset
- Check rate limit headers in response
- Verify rate limit configuration

### Validation errors
- Check request body/query/params format
- Verify all required fields are present
- Check field types and constraints
- Review validation schema

---

## Future Enhancements

- [ ] Add permission management system
- [ ] Implement API key authentication
- [ ] Add request logging middleware
- [ ] Implement CSRF token validation
- [ ] Add IP whitelisting/blacklisting
- [ ] Implement advanced rate limiting strategies
- [ ] Add request/response encryption
- [ ] Implement audit trail middleware

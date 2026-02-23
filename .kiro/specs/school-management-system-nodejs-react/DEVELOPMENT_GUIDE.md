# School Management System - Comprehensive Development Guide
# For Agentic IDE Professional Code Generation

## Document Purpose
This guide provides comprehensive standards, best practices, and security implementations for developing the School Management System (SMS) using an agentic IDE. It addresses:
1. System improvements based on best-in-class SMS analysis
2. Security implementation against hacking, theft, and malicious activities
3. Professional coding standards to avoid "vibe coding" pitfalls
4. Robustness and code quality requirements

---

# PART 1: SYSTEM IMPROVEMENTS FROM BEST SMS ANALYSIS

## Features to Add Based on Industry Leaders

### From PowerSchool
| Feature | Priority | Implementation Notes |
|---------|----------|---------------------|
| **Advanced Analytics Dashboard** | HIGH | Real-time enrollment trends, attendance patterns, performance metrics with interactive charts |
| **Hybrid Learning Support** | MEDIUM | Integration with video conferencing (Zoom, Google Meet) for PTM and online classes |
| **Parent Real-Time Updates** | HIGH | Push notifications for grades, attendance, and fee reminders |
| **Comprehensive Reporting** | HIGH | Customizable report builder with export options |

### From iSAMS
| Feature | Priority | Implementation Notes |
|---------|----------|---------------------|
| **Multi-Currency Support** | LOW | For international schools (defer to Phase 4) |
| **Student Wellbeing Module** | MEDIUM | Mental health tracking, counselor notes (Phase 3) |
| **Modular Architecture** | HIGH | Enable/disable modules per school needs |
| **API-First Design** | HIGH | RESTful APIs with comprehensive documentation |

### From Classter
| Feature | Priority | Implementation Notes |
|---------|----------|---------------------|
| **AI-Powered Analytics** | MEDIUM | Predictive analytics for at-risk students |
| **Customizable Dashboards** | HIGH | Drag-and-drop dashboard widgets |
| **Automated Workflows** | HIGH | Configurable approval chains |

### From Proctur
| Feature | Priority | Implementation Notes |
|---------|----------|---------------------|
| **Biometric Integration** | MEDIUM | Fingerprint/RFID attendance support |
| **Robust Customer Support Module** | HIGH | In-app help, ticket system |
| **Continuous Updates System** | HIGH | Version management, migration scripts |

### From DreamClass
| Feature | Priority | Implementation Notes |
|---------|----------|---------------------|
| **Unified Functionality** | HIGH | Seamless flow between modules |
| **Affordability Focus** | HIGH | Tiered pricing, basic free tier consideration |
| **Responsive Support Interface** | MEDIUM | Chat support integration |

---

# PART 2: SECURITY IMPLEMENTATION GUIDE

## OWASP Top 10 Security Controls

### SEC-1: Injection Prevention (SQL, NoSQL, LDAP)

**Threat:** Attackers inject malicious code through user inputs to execute unauthorized commands.

**Implementation:**

```javascript
// ❌ NEVER DO THIS - Vulnerable to SQL Injection
const query = `SELECT * FROM students WHERE id = ${req.params.id}`;

// ✅ ALWAYS USE Parameterized Queries
const query = 'SELECT * FROM students WHERE id = ?';
db.query(query, [req.params.id], (err, results) => {
  // Handle results
});

// ✅ USE ORM (Sequelize) for safer operations
const student = await Student.findOne({
  where: { id: req.params.id }
});
```

**Required Packages:**
```json
{
  "mysql2": "^3.6.0",
  "sequelize": "^6.35.0",
  "express-validator": "^7.0.0",
  "sanitize-html": "^2.11.0"
}
```

**Validation Middleware Example:**
```javascript
const { body, param, validationResult } = require('express-validator');

const validateStudentCreate = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .matches(/^[a-zA-Z\u0900-\u097F\s]+$/) // Allow English and Nepali
    .withMessage('Name must contain only letters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email format'),
  body('phone')
    .isMobilePhone('ne-NP')
    .withMessage('Invalid Nepali phone number'),
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid ID'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }
    next();
  }
];
```

### SEC-2: Broken Authentication Prevention

**Threat:** Weak authentication allows credential stuffing, brute force, and session hijacking.

**Implementation:**

```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

// Password Hashing Configuration
const SALT_ROUNDS = 12;

// ✅ Secure Password Hashing
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// ✅ Secure Password Verification
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// ✅ JWT Token Generation with Secure Settings
function generateTokens(user) {
  const accessToken = jwt.sign(
    { 
      userId: user.id, 
      role: user.role,
      schoolId: user.schoolId 
    },
    process.env.JWT_SECRET,
    { 
      expiresIn: '30m',
      issuer: 'school-management-system',
      audience: 'sms-users'
    }
  );
  
  const refreshToken = jwt.sign(
    { userId: user.id, tokenVersion: user.tokenVersion },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
}

// ✅ Rate Limiting for Login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

// ✅ Account Lockout Implementation
async function handleLoginAttempt(email, success) {
  const key = `login_attempts:${email}`;
  
  if (success) {
    await redis.del(key);
    return { locked: false };
  }
  
  const attempts = await redis.incr(key);
  if (attempts === 1) {
    await redis.expire(key, 15 * 60); // 15 minutes
  }
  
  if (attempts >= 5) {
    return { 
      locked: true, 
      remainingTime: await redis.ttl(key) 
    };
  }
  
  return { 
    locked: false, 
    attemptsRemaining: 5 - attempts 
  };
}

// ✅ Password Strength Validation
const passwordSchema = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 0, // Optional for Nepal context
  pointsPerUnique: 1,
  pointsPerRepeat: 0.5,
  pointsForContainingLower: 10,
  pointsForContainingUpper: 10,
  pointsForContainingNumber: 10,
  pointsForContainingSymbol: 10
};
```

### SEC-3: Sensitive Data Exposure Prevention

**Threat:** Unencrypted or poorly protected sensitive data can be stolen.

**Implementation:**

```javascript
const crypto = require('crypto');

// ✅ Encryption Configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes
const IV_LENGTH = 16;

// ✅ Encrypt Sensitive Data (e.g., citizenship numbers)
function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// ✅ Decrypt Sensitive Data
function decrypt(text) {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift(), 'hex');
  const encryptedText = Buffer.from(textParts.join(':'), 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

// ✅ Data Masking for Display
function maskSensitiveData(data, type) {
  switch (type) {
    case 'phone':
      // Show last 4 digits: ****6789
      return '*'.repeat(data.length - 4) + data.slice(-4);
    case 'email':
      // Show first 2 and domain: jo***@email.com
      const [local, domain] = data.split('@');
      return local.slice(0, 2) + '***@' + domain;
    case 'citizenship':
      // Show only last 4: ****-****-1234
      return '****-****-' + data.slice(-4);
    default:
      return '***HIDDEN***';
  }
}

// ✅ Secure Response - Remove sensitive fields
function sanitizeUserResponse(user) {
  const { password, tokenVersion, citizenship, ...safeUser } = user;
  return {
    ...safeUser,
    citizenship: maskSensitiveData(citizenship, 'citizenship')
  };
}
```

### SEC-4: Broken Access Control Prevention

**Threat:** Users access unauthorized resources or perform unauthorized actions.

**Implementation:**

```javascript
// ✅ Role-Based Access Control (RBAC) Middleware
const permissions = {
  'School_Admin': ['*'], // All permissions
  'Class_Teacher': [
    'students:read:own_class',
    'students:update:own_class',
    'attendance:create:own_class',
    'attendance:read:own_class',
    'grades:create:own_subjects',
    'grades:read:own_class'
  ],
  'Subject_Teacher': [
    'students:read:assigned',
    'attendance:create:assigned',
    'grades:create:assigned',
    'grades:read:assigned'
  ],
  'Parent': [
    'students:read:own_children',
    'grades:read:own_children',
    'attendance:read:own_children',
    'fees:read:own_children',
    'fees:pay:own_children'
  ],
  'Student': [
    'profile:read:self',
    'grades:read:self',
    'attendance:read:self',
    'assignments:read:self',
    'assignments:submit:self'
  ]
};

// ✅ Permission Check Middleware
function checkPermission(resource, action, scope = 'all') {
  return async (req, res, next) => {
    const userRole = req.user.role;
    const requiredPermission = `${resource}:${action}:${scope}`;
    
    // Admin has all permissions
    if (permissions[userRole]?.includes('*')) {
      return next();
    }
    
    // Check specific permission
    const hasPermission = permissions[userRole]?.some(p => {
      const [pResource, pAction, pScope] = p.split(':');
      return (
        (pResource === resource || pResource === '*') &&
        (pAction === action || pAction === '*') &&
        (pScope === scope || pScope === 'all')
      );
    });
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    
    next();
  };
}

// ✅ Resource Ownership Verification
async function verifyOwnership(req, res, next) {
  const { resource, resourceId } = req.params;
  const userId = req.user.userId;
  const userRole = req.user.role;
  
  // Skip for admins
  if (userRole === 'School_Admin') return next();
  
  try {
    let isOwner = false;
    
    switch (resource) {
      case 'student':
        if (userRole === 'Parent') {
          isOwner = await ParentStudent.exists({
            parentId: userId,
            studentId: resourceId
          });
        } else if (userRole === 'Student') {
          isOwner = userId === resourceId;
        } else if (userRole === 'Class_Teacher') {
          const student = await Student.findById(resourceId);
          isOwner = student?.classId === req.user.assignedClass;
        }
        break;
      
      case 'grade':
        if (userRole === 'Subject_Teacher') {
          const grade = await Grade.findById(resourceId);
          isOwner = req.user.assignedSubjects.includes(grade?.subjectId);
        }
        break;
    }
    
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You can only access your own resources'
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
}
```

### SEC-5: Security Misconfiguration Prevention

**Threat:** Default configurations, unnecessary features, unpatched flaws.

**Implementation:**

```javascript
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');

// ✅ Secure Express Configuration
function configureSecurityMiddleware(app) {
  // Helmet - Set security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://api.esewa.com.np", "https://khalti.com"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"]
      }
    },
    crossOriginEmbedderPolicy: false, // Allow embedding payment gateways
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }));
  
  // CORS Configuration
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    credentials: true,
    maxAge: 86400 // 24 hours
  }));
  
  // Prevent HTTP Parameter Pollution
  app.use(hpp({
    whitelist: ['sort', 'filter', 'page', 'limit']
  }));
  
  // Disable X-Powered-By header
  app.disable('x-powered-by');
  
  // Secure cookies configuration
  app.use(session({
    name: 'sms_session',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'strict',
      maxAge: 30 * 60 * 1000 // 30 minutes
    }
  }));
}

// ✅ Environment Configuration Validation
function validateEnvironment() {
  const required = [
    'NODE_ENV',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'ENCRYPTION_KEY',
    'DATABASE_URL',
    'SESSION_SECRET'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate key lengths
  if (process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters');
  }
  
  if (process.env.ENCRYPTION_KEY.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be 64 hex characters (32 bytes)');
  }
}
```

### SEC-6: XSS (Cross-Site Scripting) Prevention

**Threat:** Injection of malicious scripts that execute in user browsers.

**Implementation:**

```javascript
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const xss = require('xss');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// ✅ HTML Sanitization for Rich Text
function sanitizeHtml(dirty) {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'p', 'br', 'ul', 'ol', 'li', 'a', 'strong', 'em'],
    ALLOWED_ATTR: ['href', 'target'],
    ALLOW_DATA_ATTR: false
  });
}

// ✅ XSS Filter for General Input
const xssOptions = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script']
};

function sanitizeInput(input) {
  if (typeof input === 'string') {
    return xss(input, xssOptions);
  }
  if (typeof input === 'object' && input !== null) {
    const sanitized = {};
    for (const key in input) {
      sanitized[key] = sanitizeInput(input[key]);
    }
    return sanitized;
  }
  return input;
}

// ✅ Middleware for Automatic Input Sanitization
function sanitizeRequestMiddleware(req, res, next) {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }
  if (req.params) {
    req.params = sanitizeInput(req.params);
  }
  next();
}

// ✅ Output Encoding for Templates
function encodeForHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function encodeForAttribute(str) {
  return encodeForHtml(str).replace(/\//g, '&#x2F;');
}

function encodeForJavaScript(str) {
  return String(str)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}
```

### SEC-7: CSRF (Cross-Site Request Forgery) Prevention

**Threat:** Attackers trick users into performing unintended actions.

**Implementation:**

```javascript
const Tokens = require('csrf');
const tokens = new Tokens();

// ✅ CSRF Token Generation and Validation
class CSRFProtection {
  constructor() {
    this.secret = tokens.secretSync();
  }
  
  generateToken(req, res, next) {
    const token = tokens.create(this.secret);
    
    // Store token in session
    req.session.csrfToken = token;
    
    // Set token in cookie for SPA to read
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false, // Accessible by JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    // Also add to response header
    res.setHeader('X-CSRF-Token', token);
    
    next();
  }
  
  validateToken(req, res, next) {
    // Skip for GET, HEAD, OPTIONS
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }
    
    // Get token from request
    const token = req.headers['x-csrf-token'] || 
                  req.body._csrf || 
                  req.query._csrf;
    
    if (!token || !tokens.verify(this.secret, token)) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or missing CSRF token'
      });
    }
    
    next();
  }
}

// ✅ Double Submit Cookie Pattern (Alternative)
function doubleSubmitCookie(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  const cookieToken = req.cookies['XSRF-TOKEN'];
  const headerToken = req.headers['x-xsrf-token'];
  
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF validation failed'
    });
  }
  
  next();
}
```

### SEC-8: Audit Logging and Monitoring

**Threat:** Inability to detect, investigate, and respond to security incidents.

**Implementation:**

```javascript
const winston = require('winston');
const { format, transports } = winston;

// ✅ Security Logger Configuration
const securityLogger = winston.createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: { service: 'sms-security' },
  transports: [
    new transports.File({ 
      filename: 'logs/security-error.log', 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10
    }),
    new transports.File({ 
      filename: 'logs/security-audit.log',
      maxsize: 10485760,
      maxFiles: 30
    })
  ]
});

// ✅ Security Event Types
const SECURITY_EVENTS = {
  AUTH_SUCCESS: 'authentication_success',
  AUTH_FAILURE: 'authentication_failure',
  AUTH_LOCKOUT: 'account_lockout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET_REQUEST: 'password_reset_request',
  PERMISSION_DENIED: 'permission_denied',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  DATA_ACCESS: 'sensitive_data_access',
  DATA_EXPORT: 'data_export',
  ADMIN_ACTION: 'administrative_action',
  PAYMENT_ATTEMPT: 'payment_attempt',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded'
};

// ✅ Log Security Event
function logSecurityEvent(event, data) {
  const logData = {
    event,
    timestamp: new Date().toISOString(),
    userId: data.userId || 'anonymous',
    userEmail: data.userEmail || 'unknown',
    userRole: data.userRole || 'unknown',
    ip: data.ip,
    userAgent: data.userAgent,
    resource: data.resource,
    action: data.action,
    outcome: data.outcome,
    details: data.details
  };
  
  if (event.includes('failure') || event.includes('denied') || event.includes('suspicious')) {
    securityLogger.warn(logData);
  } else {
    securityLogger.info(logData);
  }
}

// ✅ Suspicious Activity Detection
function detectSuspiciousActivity(req) {
  const suspiciousPatterns = [
    // SQL Injection patterns
    /(\b(union|select|insert|update|delete|drop|create|alter)\b.*\b(from|into|table|database)\b)/i,
    // XSS patterns
    /<script[^>]*>|javascript:|on\w+\s*=/i,
    // Path traversal
    /\.\.\//,
    // Null bytes
    /%00/
  ];
  
  const inputString = JSON.stringify({ 
    body: req.body, 
    query: req.query, 
    params: req.params 
  });
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(inputString)) {
      logSecurityEvent(SECURITY_EVENTS.SUSPICIOUS_ACTIVITY, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: req.user?.userId,
        details: { 
          pattern: pattern.toString(),
          path: req.path,
          method: req.method
        }
      });
      return true;
    }
  }
  
  return false;
}

// ✅ Audit Middleware
function auditMiddleware(req, res, next) {
  // Store original end function
  const originalEnd = res.end;
  const startTime = Date.now();
  
  res.end = function(chunk, encoding) {
    const duration = Date.now() - startTime;
    
    // Log all sensitive operations
    if (req.path.includes('/api/') && !req.path.includes('/health')) {
      const auditLog = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        userId: req.user?.userId || 'anonymous',
        ip: req.ip,
        userAgent: req.headers['user-agent']
      };
      
      if (res.statusCode >= 400) {
        securityLogger.warn({ ...auditLog, type: 'request_error' });
      } else if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
        securityLogger.info({ ...auditLog, type: 'data_modification' });
      }
    }
    
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
}
```

---

# PART 3: PROFESSIONAL CODING STANDARDS FOR AGENTIC IDE

## Avoiding "Vibe Coding" Pitfalls

### Anti-Pattern 1: Over-reliance on AI Output

**❌ BAD: Blindly accepting AI-generated code**
```javascript
// AI generated this, looks fine, let's use it
const data = fetch('/api/students').then(r => r.json());
console.log(data.name); // Error: data is a Promise!
```

**✅ GOOD: Understand and verify before using**
```javascript
// AI generated, verified async handling needed
async function fetchStudentData() {
  try {
    const response = await fetch('/api/students');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch students:', error);
    throw error;
  }
}
```

### Anti-Pattern 2: Incomplete Error Handling

**❌ BAD: Minimal or missing error handling**
```javascript
app.post('/api/students', async (req, res) => {
  const student = await Student.create(req.body);
  res.json(student);
});
```

**✅ GOOD: Comprehensive error handling**
```javascript
app.post('/api/students', async (req, res, next) => {
  try {
    // Validate input
    const validationErrors = validateStudentInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: validationErrors
      });
    }
    
    // Check for duplicate
    const existing = await Student.findOne({ 
      where: { email: req.body.email } 
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Student with this email already exists'
      });
    }
    
    // Create with transaction
    const student = await sequelize.transaction(async (t) => {
      const newStudent = await Student.create(req.body, { transaction: t });
      
      // Create related records
      await StudentEnrollment.create({
        studentId: newStudent.id,
        academicYearId: req.body.academicYearId,
        classId: req.body.classId
      }, { transaction: t });
      
      return newStudent;
    });
    
    // Log action
    logSecurityEvent('DATA_CREATE', {
      userId: req.user.userId,
      resource: 'student',
      resourceId: student.id
    });
    
    res.status(201).json({
      success: true,
      data: sanitizeStudentResponse(student),
      message: 'Student created successfully'
    });
    
  } catch (error) {
    // Don't expose internal errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }
    
    next(error); // Pass to error handler
  }
});
```

### Anti-Pattern 3: Missing Input Validation

**❌ BAD: No validation**
```javascript
app.post('/api/fees/pay', (req, res) => {
  const { studentId, amount, method } = req.body;
  processPayment(studentId, amount, method);
});
```

**✅ GOOD: Complete validation with Joi/express-validator**
```javascript
const Joi = require('joi');

// Define schemas
const schemas = {
  feePayment: Joi.object({
    studentId: Joi.number().integer().positive().required(),
    feeId: Joi.number().integer().positive().required(),
    amount: Joi.number()
      .positive()
      .precision(2)
      .max(1000000) // Max 10 lakh NPR
      .required(),
    paymentMethod: Joi.string()
      .valid('cash', 'bank_transfer', 'esewa', 'khalti', 'ime_pay')
      .required(),
    transactionReference: Joi.when('paymentMethod', {
      is: Joi.valid('esewa', 'khalti', 'ime_pay'),
      then: Joi.string().required(),
      otherwise: Joi.string().optional()
    }),
    remarks: Joi.string().max(500).optional()
  })
};

// Validation middleware factory
function validate(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return next(new Error(`Schema ${schemaName} not found`));
    }
    
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      return res.status(400).json({
        success: false,
        errors: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message
        }))
      });
    }
    
    req.validatedBody = value;
    next();
  };
}

// Usage
app.post('/api/fees/pay', 
  authenticate,
  checkPermission('fees', 'pay'),
  validate('feePayment'),
  feeController.processPayment
);
```

### Anti-Pattern 4: Hardcoded Values

**❌ BAD: Magic numbers and hardcoded strings**
```javascript
if (user.role === 1) { // What is 1?
  if (attempts > 5) { // Why 5?
    lockoutTime = 900000; // What is this?
  }
}
```

**✅ GOOD: Named constants and configuration**
```javascript
// config/constants.js
const ROLES = {
  SCHOOL_ADMIN: 'school_admin',
  CLASS_TEACHER: 'class_teacher',
  SUBJECT_TEACHER: 'subject_teacher',
  STUDENT: 'student',
  PARENT: 'parent'
};

const SECURITY = {
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MS: 15 * 60 * 1000, // 15 minutes
  PASSWORD_MIN_LENGTH: 8,
  JWT_ACCESS_TOKEN_EXPIRY: '30m',
  JWT_REFRESH_TOKEN_EXPIRY: '7d'
};

const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100
};

const NEB_GRADING = {
  GRADES: [
    { min: 90, max: 100, grade: 'A+', gpa: 4.0, description: 'Outstanding' },
    { min: 80, max: 89, grade: 'A', gpa: 3.6, description: 'Excellent' },
    { min: 70, max: 79, grade: 'B+', gpa: 3.2, description: 'Very Good' },
    { min: 60, max: 69, grade: 'B', gpa: 2.8, description: 'Good' },
    { min: 50, max: 59, grade: 'C+', gpa: 2.4, description: 'Satisfactory' },
    { min: 40, max: 49, grade: 'C', gpa: 2.0, description: 'Acceptable' },
    { min: 35, max: 39, grade: 'D', gpa: 1.6, description: 'Basic' },
    { min: 0, max: 34, grade: 'NG', gpa: 0.0, description: 'Not Graded' }
  ],
  PASS_PERCENTAGE: 35,
  MIN_GPA_FOR_PROMOTION: 1.6
};

module.exports = { ROLES, SECURITY, PAGINATION, NEB_GRADING };

// Usage
const { ROLES, SECURITY } = require('./config/constants');

if (user.role === ROLES.SCHOOL_ADMIN) {
  if (attempts > SECURITY.MAX_LOGIN_ATTEMPTS) {
    lockoutDuration = SECURITY.LOCKOUT_DURATION_MS;
  }
}
```

### Anti-Pattern 5: No Type Safety

**❌ BAD: Loose typing leads to runtime errors**
```javascript
function calculateGPA(grades) {
  let total = 0;
  grades.forEach(g => total += g.point * g.credit);
  return total / grades.length;
}
```

**✅ GOOD: TypeScript or JSDoc with validation**
```typescript
// Using TypeScript
interface GradeEntry {
  subjectId: number;
  subjectName: string;
  gradePoint: number;
  creditHours: number;
  obtainedMarks: number;
  fullMarks: number;
}

interface GPAResult {
  gpa: number;
  totalCreditHours: number;
  totalGradePoints: number;
  grades: GradeEntry[];
}

function calculateGPA(grades: GradeEntry[]): GPAResult {
  if (!grades || grades.length === 0) {
    throw new Error('Grades array cannot be empty');
  }
  
  let totalGradePoints = 0;
  let totalCreditHours = 0;
  
  for (const grade of grades) {
    if (grade.creditHours <= 0) {
      throw new Error(`Invalid credit hours for subject ${grade.subjectName}`);
    }
    if (grade.gradePoint < 0 || grade.gradePoint > 4) {
      throw new Error(`Invalid grade point for subject ${grade.subjectName}`);
    }
    
    totalGradePoints += grade.gradePoint * grade.creditHours;
    totalCreditHours += grade.creditHours;
  }
  
  const gpa = Number((totalGradePoints / totalCreditHours).toFixed(2));
  
  return {
    gpa,
    totalCreditHours,
    totalGradePoints,
    grades
  };
}
```

---

## Code Organization Standards

### Directory Structure

```
src/
├── config/
│   ├── database.js          # Database configuration
│   ├── constants.js          # Application constants
│   ├── security.js           # Security settings
│   └── index.js              # Config aggregator
│
├── middleware/
│   ├── auth.js               # Authentication middleware
│   ├── rbac.js               # Role-based access control
│   ├── validation.js         # Input validation
│   ├── security.js           # Security middleware (helmet, cors, etc.)
│   ├── errorHandler.js       # Global error handler
│   ├── audit.js              # Audit logging
│   └── rateLimiter.js        # Rate limiting
│
├── modules/
│   ├── auth/
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   ├── auth.routes.js
│   │   ├── auth.validation.js
│   │   └── auth.test.js
│   │
│   ├── students/
│   │   ├── student.controller.js
│   │   ├── student.service.js
│   │   ├── student.routes.js
│   │   ├── student.validation.js
│   │   ├── student.model.js
│   │   └── student.test.js
│   │
│   ├── attendance/
│   │   ├── attendance.controller.js
│   │   ├── attendance.service.js
│   │   ├── attendance.routes.js
│   │   ├── attendance.validation.js
│   │   ├── attendance.model.js
│   │   └── attendance.test.js
│   │
│   └── [other modules...]
│
├── models/
│   ├── index.js              # Model associations
│   └── associations.js       # Sequelize associations
│
├── utils/
│   ├── encryption.js         # Encryption utilities
│   ├── dateConverter.js      # BS/AD date conversion
│   ├── gradeCalculator.js    # NEB grade calculation
│   ├── responseFormatter.js  # API response formatting
│   ├── fileUpload.js         # File handling
│   └── smsService.js         # SMS integration
│
├── jobs/
│   ├── attendanceReminder.js # Scheduled jobs
│   ├── feeReminder.js
│   └── backupJob.js
│
├── docs/
│   ├── swagger.json          # OpenAPI specification
│   └── postman/              # Postman collections
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── app.js                    # Express app setup
└── server.js                 # Server entry point
```

### File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Controllers | `{module}.controller.js` | `student.controller.js` |
| Services | `{module}.service.js` | `student.service.js` |
| Models | `{Module}.model.js` | `Student.model.js` |
| Routes | `{module}.routes.js` | `student.routes.js` |
| Validation | `{module}.validation.js` | `student.validation.js` |
| Tests | `{module}.test.js` | `student.test.js` |
| Middleware | `{name}.js` | `auth.js`, `rbac.js` |
| Utils | `{purpose}.js` | `dateConverter.js` |

### Code Style Rules

```javascript
// .eslintrc.js
module.exports = {
  env: {
    node: true,
    es2022: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:security/recommended'
  ],
  plugins: ['security'],
  parserOptions: {
    ecmaVersion: 2022
  },
  rules: {
    // Error Prevention
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['error', 'warn'] }],
    'no-return-await': 'error',
    'require-await': 'error',
    
    // Code Quality
    'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
    'max-depth': ['error', 4],
    'max-nested-callbacks': ['error', 3],
    'complexity': ['warn', 15],
    
    // Security
    'security/detect-object-injection': 'warn',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-non-literal-fs-filename': 'warn',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-possible-timing-attacks': 'warn',
    
    // Naming
    'camelcase': ['error', { properties: 'never' }],
    
    // Formatting (let Prettier handle most)
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { avoidEscape: true }]
  }
};
```

---

## Robustness Checklist

### For Every API Endpoint

```markdown
## API Robustness Checklist

- [ ] **Input Validation**
  - [ ] All inputs validated with Joi/express-validator
  - [ ] Type checking for all parameters
  - [ ] Boundary checks (min/max values, lengths)
  - [ ] Format validation (email, phone, date)
  
- [ ] **Authentication & Authorization**
  - [ ] JWT validation middleware applied
  - [ ] Role-based permission check
  - [ ] Resource ownership verification
  
- [ ] **Security**
  - [ ] SQL injection prevention (parameterized queries)
  - [ ] XSS prevention (input sanitization)
  - [ ] CSRF token validation (for state-changing operations)
  - [ ] Rate limiting applied
  
- [ ] **Error Handling**
  - [ ] Try-catch wrapping
  - [ ] Specific error messages for known errors
  - [ ] Generic messages for unknown errors
  - [ ] Proper HTTP status codes
  
- [ ] **Database**
  - [ ] Transaction for multi-table operations
  - [ ] Proper indexing on queried fields
  - [ ] Pagination for list queries
  
- [ ] **Logging**
  - [ ] Security events logged
  - [ ] Errors logged with context
  - [ ] Sensitive data excluded from logs
  
- [ ] **Testing**
  - [ ] Unit tests for business logic
  - [ ] Integration tests for API
  - [ ] Edge cases covered
  - [ ] Error scenarios tested
```

### For Every Service Function

```javascript
/**
 * Service Function Template
 * 
 * @example Good service function structure
 */
class StudentService {
  /**
   * Create a new student with all validations
   * 
   * @param {Object} data - Student creation data
   * @param {string} data.name - Full name (2-100 chars)
   * @param {string} data.email - Valid email
   * @param {number} data.classId - Class to enroll in
   * @param {Object} context - Request context
   * @param {number} context.userId - Acting user ID
   * @param {number} context.schoolId - School context
   * @returns {Promise<Object>} Created student
   * @throws {ValidationError} If data is invalid
   * @throws {ConflictError} If duplicate exists
   * @throws {NotFoundError} If class doesn't exist
   */
  async createStudent(data, context) {
    // 1. Validate business rules
    await this.validateStudentData(data);
    
    // 2. Check preconditions
    const classExists = await this.classRepository.exists(data.classId);
    if (!classExists) {
      throw new NotFoundError('Class not found');
    }
    
    const duplicate = await this.studentRepository.findByEmail(data.email);
    if (duplicate) {
      throw new ConflictError('Student with this email already exists');
    }
    
    // 3. Generate required values
    const studentId = await this.generateStudentId(context.schoolId, data.admissionYear);
    
    // 4. Execute in transaction
    const student = await this.db.transaction(async (trx) => {
      const newStudent = await this.studentRepository.create({
        ...data,
        studentId,
        schoolId: context.schoolId,
        createdBy: context.userId
      }, trx);
      
      await this.enrollmentRepository.create({
        studentId: newStudent.id,
        classId: data.classId,
        academicYearId: context.currentAcademicYear
      }, trx);
      
      return newStudent;
    });
    
    // 5. Post-creation actions
    await this.notificationService.notify({
      type: 'STUDENT_CREATED',
      recipients: [data.parentEmail],
      data: { studentName: data.name, studentId }
    });
    
    // 6. Return sanitized result
    return this.sanitize(student);
  }
  
  // Helper methods
  async validateStudentData(data) {
    // Business rule validations
  }
  
  async generateStudentId(schoolId, year) {
    // Generate unique ID: SCH001-2082-0001
  }
  
  sanitize(student) {
    // Remove sensitive fields
  }
}
```

---

## Testing Standards

### Unit Test Template

```javascript
const { StudentService } = require('../modules/students/student.service');
const { mockStudentRepository, mockClassRepository } = require('./mocks');

describe('StudentService', () => {
  let service;
  let mockRepos;
  
  beforeEach(() => {
    mockRepos = {
      student: mockStudentRepository(),
      class: mockClassRepository()
    };
    service = new StudentService(mockRepos);
  });
  
  describe('createStudent', () => {
    const validData = {
      name: 'Ram Bahadur',
      email: 'ram@test.com',
      classId: 1,
      dateOfBirth: '2068-01-15'
    };
    
    const context = {
      userId: 1,
      schoolId: 1,
      currentAcademicYear: 2082
    };
    
    it('should create student with valid data', async () => {
      mockRepos.class.exists.mockResolvedValue(true);
      mockRepos.student.findByEmail.mockResolvedValue(null);
      mockRepos.student.create.mockResolvedValue({ id: 1, ...validData });
      
      const result = await service.createStudent(validData, context);
      
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(validData.name);
      expect(mockRepos.student.create).toHaveBeenCalledTimes(1);
    });
    
    it('should throw NotFoundError if class does not exist', async () => {
      mockRepos.class.exists.mockResolvedValue(false);
      
      await expect(service.createStudent(validData, context))
        .rejects.toThrow('Class not found');
    });
    
    it('should throw ConflictError if email already exists', async () => {
      mockRepos.class.exists.mockResolvedValue(true);
      mockRepos.student.findByEmail.mockResolvedValue({ id: 2 });
      
      await expect(service.createStudent(validData, context))
        .rejects.toThrow('Student with this email already exists');
    });
    
    it('should sanitize sensitive data in response', async () => {
      mockRepos.class.exists.mockResolvedValue(true);
      mockRepos.student.findByEmail.mockResolvedValue(null);
      mockRepos.student.create.mockResolvedValue({ 
        id: 1, 
        ...validData,
        password: 'secret',
        citizenship: '12345'
      });
      
      const result = await service.createStudent(validData, context);
      
      expect(result).not.toHaveProperty('password');
      expect(result.citizenship).not.toBe('12345'); // Should be masked
    });
  });
  
  describe('calculateGPA', () => {
    it('should calculate correct GPA for valid grades', () => {
      const grades = [
        { subjectName: 'Nepali', gradePoint: 3.6, creditHours: 4 },
        { subjectName: 'English', gradePoint: 3.2, creditHours: 4 },
        { subjectName: 'Math', gradePoint: 4.0, creditHours: 5 }
      ];
      
      const result = service.calculateGPA(grades);
      
      // (3.6*4 + 3.2*4 + 4.0*5) / (4+4+5) = 47.2/13 = 3.63
      expect(result.gpa).toBeCloseTo(3.63, 2);
      expect(result.totalCreditHours).toBe(13);
    });
    
    it('should throw error for empty grades array', () => {
      expect(() => service.calculateGPA([])).toThrow('Grades array cannot be empty');
    });
    
    it('should handle NG (Not Graded) correctly', () => {
      const grades = [
        { subjectName: 'Nepali', gradePoint: 3.6, creditHours: 4 },
        { subjectName: 'English', gradePoint: 0.0, creditHours: 4 } // NG
      ];
      
      const result = service.calculateGPA(grades);
      
      expect(result.gpa).toBe(1.8); // (3.6*4 + 0*4) / 8 = 14.4/8
    });
  });
});
```

### Integration Test Template

```javascript
const request = require('supertest');
const app = require('../app');
const { sequelize } = require('../models');
const { generateTestToken } = require('./helpers');

describe('Student API Integration', () => {
  let adminToken;
  let teacherToken;
  
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    // Seed test data
    adminToken = generateTestToken({ role: 'School_Admin', userId: 1 });
    teacherToken = generateTestToken({ role: 'Subject_Teacher', userId: 2 });
  });
  
  afterAll(async () => {
    await sequelize.close();
  });
  
  describe('POST /api/v1/students', () => {
    const validStudent = {
      name: 'Test Student',
      email: 'test@example.com',
      dateOfBirth: '2068-05-15',
      classId: 1,
      gender: 'male'
    };
    
    it('should create student when admin authenticated', async () => {
      const response = await request(app)
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validStudent);
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });
    
    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/v1/students')
        .send(validStudent);
      
      expect(response.status).toBe(401);
    });
    
    it('should reject teacher trying to create student', async () => {
      const response = await request(app)
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(validStudent);
      
      expect(response.status).toBe(403);
    });
    
    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validStudent, email: 'invalid-email' });
      
      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({ field: 'email' })
      );
    });
    
    it('should sanitize XSS in name field', async () => {
      const response = await request(app)
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ...validStudent, name: '<script>alert("xss")</script>Ram' });
      
      expect(response.status).toBe(201);
      expect(response.body.data.name).not.toContain('<script>');
    });
  });
});
```

---

## Pre-Commit Checklist for IDE

Before committing any code, the IDE should verify:

```yaml
# .github/pre-commit-checks.yml
checks:
  - name: "Lint Check"
    command: "npm run lint"
    must_pass: true
    
  - name: "Type Check"
    command: "npm run typecheck"
    must_pass: true
    
  - name: "Unit Tests"
    command: "npm run test:unit"
    must_pass: true
    coverage_threshold: 70
    
  - name: "Security Audit"
    command: "npm audit --audit-level=high"
    must_pass: true
    
  - name: "Secrets Scan"
    command: "npx secretlint"
    must_pass: true
    patterns:
      - "API_KEY"
      - "SECRET"
      - "PASSWORD"
      - "TOKEN"
      
  - name: "Dependency Check"
    command: "npx depcheck"
    must_pass: false # Warning only
```

---

# PART 4: MULTI-TENANCY, DYNAMIC CONFIGURATION & FEATURES

## Multi-School Support Architecture

This system is designed to be used by **multiple independent schools** from a single deployment. Each school has its own isolated data, branding, and configuration.

### Database Multi-Tenancy Strategy

**Approach: Single Database with School ID Isolation**

```sql
-- Every table has a school_id column for data isolation
CREATE TABLE students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  school_id INT NOT NULL,  -- Foreign key to schools table
  student_id VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  -- ... other fields
  UNIQUE KEY unique_student_per_school (school_id, student_id),
  FOREIGN KEY (school_id) REFERENCES schools(id)
);

-- Schools table stores all tenant information
CREATE TABLE schools (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(10) UNIQUE NOT NULL,  -- e.g., 'SCH001'
  name VARCHAR(200) NOT NULL,
  name_np VARCHAR(200),  -- Nepali name
  address VARCHAR(500),
  address_np VARCHAR(500),
  phone VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(200),
  logo_url VARCHAR(500),
  favicon_url VARCHAR(500),
  primary_color VARCHAR(7) DEFAULT '#1976d2',
  secondary_color VARCHAR(7) DEFAULT '#dc004e',
  established_year INT,
  school_type ENUM('government', 'private', 'community', 'boarding') DEFAULT 'private',
  affiliation VARCHAR(100),  -- e.g., 'NEB', 'CBSE'
  pan_number VARCHAR(20),
  registration_number VARCHAR(50),
  timezone VARCHAR(50) DEFAULT 'Asia/Kathmandu',
  academic_year_start_month INT DEFAULT 1,  -- Baisakh
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Environment Configuration (.env)

```bash
# ============================================
# SCHOOL MANAGEMENT SYSTEM - ENVIRONMENT CONFIG
# ============================================
# Copy this file to .env and customize for your deployment

# ============================================
# APPLICATION SETTINGS
# ============================================
NODE_ENV=production
PORT=3000
API_BASE_URL=http://localhost:3000/api/v1

# ============================================
# DATABASE CONFIGURATION
# ============================================
DB_HOST=localhost
DB_PORT=3306
DB_NAME=school_management_system
DB_USER=sms_user
DB_PASSWORD=your_secure_password_here
DB_POOL_MIN=2
DB_POOL_MAX=10

# ============================================
# REDIS CONFIGURATION (for caching & sessions)
# ============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# ============================================
# SECURITY SETTINGS
# ============================================
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_here
JWT_REFRESH_SECRET=your_refresh_token_secret_min_32_chars
JWT_ACCESS_EXPIRY=30m
JWT_REFRESH_EXPIRY=7d
ENCRYPTION_KEY=64_hex_characters_for_aes_256_encryption_here
SESSION_SECRET=your_session_secret_key_here

# ============================================
# DEFAULT SCHOOL CONFIGURATION
# (Used when running single-school mode or as defaults)
# ============================================
DEFAULT_SCHOOL_CODE=SCH001
DEFAULT_SCHOOL_NAME=Nepal Model Secondary School
DEFAULT_SCHOOL_NAME_NP=नेपाल मोडेल माध्यमिक विद्यालय
DEFAULT_SCHOOL_ADDRESS=Kathmandu, Nepal
DEFAULT_SCHOOL_ADDRESS_NP=काठमाडौं, नेपाल
DEFAULT_SCHOOL_PHONE=+977-1-4XXXXXX
DEFAULT_SCHOOL_EMAIL=info@schoolname.edu.np
DEFAULT_SCHOOL_WEBSITE=https://schoolname.edu.np
DEFAULT_SCHOOL_LOGO=/assets/images/logo.png
DEFAULT_SCHOOL_FAVICON=/assets/images/favicon.ico

# ============================================
# BRANDING & THEMING
# ============================================
DEFAULT_PRIMARY_COLOR=#1976d2
DEFAULT_SECONDARY_COLOR=#dc004e
DEFAULT_THEME=light
ENABLE_DARK_MODE=true
ENABLE_THEME_CUSTOMIZATION=true

# ============================================
# LOCALIZATION SETTINGS
# ============================================
DEFAULT_LANGUAGE=en
SUPPORTED_LANGUAGES=en,ne
DEFAULT_DATE_FORMAT=BS
ENABLE_BS_CALENDAR=true
DEFAULT_CURRENCY=NPR
CURRENCY_SYMBOL=रू

# ============================================
# FEATURE FLAGS
# ============================================
ENABLE_MULTI_SCHOOL=false
ENABLE_OFFLINE_MODE=true
ENABLE_PWA=true
ENABLE_BIOMETRIC_ATTENDANCE=false
ENABLE_SMS_NOTIFICATIONS=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_VIDEO_CONFERENCING=false
ENABLE_PAYMENT_GATEWAY=true
ENABLE_TRANSPORT_MODULE=true
ENABLE_HOSTEL_MODULE=false
ENABLE_LIBRARY_MODULE=true
ENABLE_ECA_MODULE=true

# ============================================
# SMS GATEWAY CONFIGURATION (Nepal)
# ============================================
SMS_PROVIDER=sparrow
SPARROW_SMS_TOKEN=your_sparrow_sms_token
SPARROW_SMS_FROM=SCHOOL
AAKASH_SMS_TOKEN=your_aakash_sms_token
SMS_RATE_LIMIT_PER_DAY=1000

# ============================================
# PAYMENT GATEWAY CONFIGURATION (Nepal)
# ============================================
ESEWA_MERCHANT_ID=your_esewa_merchant_id
ESEWA_SECRET_KEY=your_esewa_secret
ESEWA_ENVIRONMENT=test
KHALTI_PUBLIC_KEY=your_khalti_public_key
KHALTI_SECRET_KEY=your_khalti_secret_key
KHALTI_ENVIRONMENT=test
IME_PAY_MERCHANT_ID=your_ime_merchant_id
IME_PAY_MODULE=your_ime_module

# ============================================
# FILE STORAGE
# ============================================
STORAGE_TYPE=local
STORAGE_PATH=./uploads
MAX_FILE_SIZE_MB=10
ALLOWED_FILE_TYPES=jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx

# ============================================
# BACKUP CONFIGURATION
# ============================================
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_PATH=./backups

# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info
LOG_FILE_PATH=./logs
LOG_RETENTION_DAYS=30

# ============================================
# EMAIL CONFIGURATION
# ============================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
EMAIL_FROM_NAME=School Management System
EMAIL_FROM_ADDRESS=noreply@schoolname.edu.np
```

### Dynamic Configuration Service

```javascript
// src/config/schoolConfig.js
const { School } = require('../models');

class SchoolConfigService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Get school configuration with caching
   * @param {string} schoolCode - School code or 'default' for env config
   */
  async getConfig(schoolCode = 'default') {
    // Check cache first
    const cached = this.cache.get(schoolCode);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.config;
    }

    let config;
    
    if (schoolCode === 'default' || !process.env.ENABLE_MULTI_SCHOOL) {
      // Use environment variables for single-school mode
      config = this.getEnvConfig();
    } else {
      // Fetch from database for multi-school mode
      const school = await School.findOne({ where: { code: schoolCode } });
      if (!school) {
        throw new Error(`School with code ${schoolCode} not found`);
      }
      config = this.mapSchoolToConfig(school);
    }

    // Cache the result
    this.cache.set(schoolCode, { config, timestamp: Date.now() });
    
    return config;
  }

  /**
   * Get configuration from environment variables
   */
  getEnvConfig() {
    return {
      school: {
        code: process.env.DEFAULT_SCHOOL_CODE || 'SCH001',
        name: process.env.DEFAULT_SCHOOL_NAME || 'School Management System',
        nameNp: process.env.DEFAULT_SCHOOL_NAME_NP || 'विद्यालय व्यवस्थापन प्रणाली',
        address: process.env.DEFAULT_SCHOOL_ADDRESS || '',
        addressNp: process.env.DEFAULT_SCHOOL_ADDRESS_NP || '',
        phone: process.env.DEFAULT_SCHOOL_PHONE || '',
        email: process.env.DEFAULT_SCHOOL_EMAIL || '',
        website: process.env.DEFAULT_SCHOOL_WEBSITE || '',
        logo: process.env.DEFAULT_SCHOOL_LOGO || '/assets/images/logo.png',
        favicon: process.env.DEFAULT_SCHOOL_FAVICON || '/assets/images/favicon.ico'
      },
      theme: {
        primaryColor: process.env.DEFAULT_PRIMARY_COLOR || '#1976d2',
        secondaryColor: process.env.DEFAULT_SECONDARY_COLOR || '#dc004e',
        defaultTheme: process.env.DEFAULT_THEME || 'light',
        enableDarkMode: process.env.ENABLE_DARK_MODE === 'true',
        enableCustomization: process.env.ENABLE_THEME_CUSTOMIZATION === 'true'
      },
      localization: {
        defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
        supportedLanguages: (process.env.SUPPORTED_LANGUAGES || 'en,ne').split(','),
        defaultDateFormat: process.env.DEFAULT_DATE_FORMAT || 'BS',
        enableBSCalendar: process.env.ENABLE_BS_CALENDAR !== 'false',
        currency: process.env.DEFAULT_CURRENCY || 'NPR',
        currencySymbol: process.env.CURRENCY_SYMBOL || 'रू'
      },
      features: {
        multiSchool: process.env.ENABLE_MULTI_SCHOOL === 'true',
        offlineMode: process.env.ENABLE_OFFLINE_MODE !== 'false',
        pwa: process.env.ENABLE_PWA !== 'false',
        biometricAttendance: process.env.ENABLE_BIOMETRIC_ATTENDANCE === 'true',
        smsNotifications: process.env.ENABLE_SMS_NOTIFICATIONS !== 'false',
        emailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false',
        pushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS !== 'false',
        videoConferencing: process.env.ENABLE_VIDEO_CONFERENCING === 'true',
        paymentGateway: process.env.ENABLE_PAYMENT_GATEWAY !== 'false',
        transportModule: process.env.ENABLE_TRANSPORT_MODULE !== 'false',
        hostelModule: process.env.ENABLE_HOSTEL_MODULE === 'true',
        libraryModule: process.env.ENABLE_LIBRARY_MODULE !== 'false',
        ecaModule: process.env.ENABLE_ECA_MODULE !== 'false'
      }
    };
  }

  /**
   * Map database school record to config format
   */
  mapSchoolToConfig(school) {
    return {
      school: {
        id: school.id,
        code: school.code,
        name: school.name,
        nameNp: school.name_np,
        address: school.address,
        addressNp: school.address_np,
        phone: school.phone,
        email: school.email,
        website: school.website,
        logo: school.logo_url,
        favicon: school.favicon_url,
        schoolType: school.school_type,
        affiliation: school.affiliation
      },
      theme: {
        primaryColor: school.primary_color || process.env.DEFAULT_PRIMARY_COLOR,
        secondaryColor: school.secondary_color || process.env.DEFAULT_SECONDARY_COLOR,
        defaultTheme: school.default_theme || 'light',
        enableDarkMode: true,
        enableCustomization: true
      },
      // Inherit other settings from env
      ...this.getEnvConfig()
    };
  }

  /**
   * Clear cache for a specific school or all
   */
  clearCache(schoolCode = null) {
    if (schoolCode) {
      this.cache.delete(schoolCode);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Update school configuration in database
   */
  async updateConfig(schoolCode, updates) {
    const school = await School.findOne({ where: { code: schoolCode } });
    if (!school) {
      throw new Error(`School with code ${schoolCode} not found`);
    }

    await school.update(updates);
    this.clearCache(schoolCode);
    
    return this.getConfig(schoolCode);
  }
}

module.exports = new SchoolConfigService();
```

### API Endpoint for Configuration

```javascript
// src/modules/config/config.controller.js
const schoolConfig = require('../../config/schoolConfig');

const configController = {
  /**
   * Get public configuration for frontend
   * GET /api/v1/config
   */
  getPublicConfig: async (req, res) => {
    try {
      const schoolCode = req.headers['x-school-code'] || 'default';
      const config = await schoolConfig.getConfig(schoolCode);
      
      // Return only public configuration
      res.json({
        success: true,
        data: {
          school: config.school,
          theme: config.theme,
          localization: config.localization,
          features: config.features
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to load configuration'
      });
    }
  },

  /**
   * Update school configuration (Admin only)
   * PUT /api/v1/config
   */
  updateConfig: async (req, res) => {
    try {
      const schoolCode = req.user.schoolCode;
      const updates = req.validatedBody;
      
      const config = await schoolConfig.updateConfig(schoolCode, updates);
      
      res.json({
        success: true,
        data: config,
        message: 'Configuration updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update configuration'
      });
    }
  }
};

module.exports = configController;
```

---

## Localization (English / Nepali)

### Translation File Structure

```
src/
├── locales/
│   ├── en/
│   │   ├── common.json       # Common UI strings
│   │   ├── auth.json         # Authentication related
│   │   ├── students.json     # Student module
│   │   ├── attendance.json   # Attendance module
│   │   ├── fees.json         # Fee management
│   │   ├── exams.json        # Examination module
│   │   ├── reports.json      # Report labels
│   │   └── errors.json       # Error messages
│   │
│   └── ne/
│       ├── common.json
│       ├── auth.json
│       ├── students.json
│       ├── attendance.json
│       ├── fees.json
│       ├── exams.json
│       ├── reports.json
│       └── errors.json
```

### Translation Files Examples

```json
// src/locales/en/common.json
{
  "app": {
    "title": "School Management System",
    "welcome": "Welcome to {{schoolName}}",
    "loading": "Loading...",
    "saving": "Saving...",
    "saved": "Saved successfully",
    "error": "An error occurred"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "students": "Students",
    "teachers": "Teachers",
    "attendance": "Attendance",
    "fees": "Fees",
    "exams": "Examinations",
    "reports": "Reports",
    "settings": "Settings",
    "logout": "Logout"
  },
  "actions": {
    "add": "Add",
    "edit": "Edit",
    "delete": "Delete",
    "save": "Save",
    "cancel": "Cancel",
    "search": "Search",
    "filter": "Filter",
    "export": "Export",
    "print": "Print",
    "refresh": "Refresh"
  },
  "status": {
    "active": "Active",
    "inactive": "Inactive",
    "pending": "Pending",
    "approved": "Approved",
    "rejected": "Rejected"
  },
  "date": {
    "today": "Today",
    "yesterday": "Yesterday",
    "thisWeek": "This Week",
    "thisMonth": "This Month",
    "thisYear": "This Year"
  },
  "pagination": {
    "showing": "Showing {{from}} to {{to}} of {{total}} entries",
    "previous": "Previous",
    "next": "Next",
    "first": "First",
    "last": "Last"
  }
}
```

```json
// src/locales/ne/common.json
{
  "app": {
    "title": "विद्यालय व्यवस्थापन प्रणाली",
    "welcome": "{{schoolName}} मा स्वागत छ",
    "loading": "लोड हुँदैछ...",
    "saving": "सेभ हुँदैछ...",
    "saved": "सफलतापूर्वक सेभ भयो",
    "error": "त्रुटि भयो"
  },
  "navigation": {
    "dashboard": "ड्यासबोर्ड",
    "students": "विद्यार्थीहरू",
    "teachers": "शिक्षकहरू",
    "attendance": "उपस्थिति",
    "fees": "शुल्क",
    "exams": "परीक्षाहरू",
    "reports": "प्रतिवेदनहरू",
    "settings": "सेटिङ्स",
    "logout": "लग आउट"
  },
  "actions": {
    "add": "थप्नुहोस्",
    "edit": "सम्पादन",
    "delete": "मेट्नुहोस्",
    "save": "सेभ गर्नुहोस्",
    "cancel": "रद्द गर्नुहोस्",
    "search": "खोज्नुहोस्",
    "filter": "फिल्टर",
    "export": "निर्यात",
    "print": "प्रिन्ट",
    "refresh": "रिफ्रेस"
  },
  "status": {
    "active": "सक्रिय",
    "inactive": "निष्क्रिय",
    "pending": "पेन्डिङ",
    "approved": "स्वीकृत",
    "rejected": "अस्वीकृत"
  },
  "date": {
    "today": "आज",
    "yesterday": "हिजो",
    "thisWeek": "यो हप्ता",
    "thisMonth": "यो महिना",
    "thisYear": "यो वर्ष"
  },
  "pagination": {
    "showing": "{{total}} मध्ये {{from}} देखि {{to}} देखाउँदै",
    "previous": "अघिल्लो",
    "next": "अर्को",
    "first": "पहिलो",
    "last": "अन्तिम"
  }
}
```

```json
// src/locales/en/students.json
{
  "title": "Student Management",
  "list": {
    "title": "All Students",
    "empty": "No students found",
    "search": "Search students by name, ID, or class..."
  },
  "add": {
    "title": "Add New Student",
    "success": "Student added successfully",
    "error": "Failed to add student"
  },
  "edit": {
    "title": "Edit Student",
    "success": "Student updated successfully",
    "error": "Failed to update student"
  },
  "fields": {
    "studentId": "Student ID",
    "name": "Full Name",
    "nameNp": "Full Name (Nepali)",
    "dateOfBirth": "Date of Birth",
    "gender": "Gender",
    "bloodGroup": "Blood Group",
    "nationality": "Nationality",
    "religion": "Religion",
    "caste": "Caste/Ethnicity",
    "class": "Class",
    "section": "Section",
    "rollNumber": "Roll Number",
    "admissionDate": "Admission Date",
    "previousSchool": "Previous School",
    "address": "Address",
    "phone": "Phone",
    "email": "Email",
    "guardianName": "Guardian Name",
    "guardianPhone": "Guardian Phone",
    "guardianRelation": "Relation with Guardian"
  },
  "validation": {
    "nameRequired": "Student name is required",
    "classRequired": "Class selection is required",
    "dobRequired": "Date of birth is required",
    "invalidPhone": "Invalid phone number format"
  }
}
```

```json
// src/locales/ne/students.json
{
  "title": "विद्यार्थी व्यवस्थापन",
  "list": {
    "title": "सबै विद्यार्थीहरू",
    "empty": "कुनै विद्यार्थी फेला परेन",
    "search": "नाम, आईडी, वा कक्षाद्वारा विद्यार्थी खोज्नुहोस्..."
  },
  "add": {
    "title": "नयाँ विद्यार्थी थप्नुहोस्",
    "success": "विद्यार्थी सफलतापूर्वक थपियो",
    "error": "विद्यार्थी थप्न असफल भयो"
  },
  "edit": {
    "title": "विद्यार्थी सम्पादन",
    "success": "विद्यार्थी सफलतापूर्वक अपडेट भयो",
    "error": "विद्यार्थी अपडेट गर्न असफल भयो"
  },
  "fields": {
    "studentId": "विद्यार्थी आईडी",
    "name": "पूरा नाम",
    "nameNp": "पूरा नाम (नेपाली)",
    "dateOfBirth": "जन्म मिति",
    "gender": "लिङ्ग",
    "bloodGroup": "रक्त समूह",
    "nationality": "राष्ट्रियता",
    "religion": "धर्म",
    "caste": "जाति/जातीयता",
    "class": "कक्षा",
    "section": "सेक्सन",
    "rollNumber": "रोल नम्बर",
    "admissionDate": "भर्ना मिति",
    "previousSchool": "पूर्व विद्यालय",
    "address": "ठेगाना",
    "phone": "फोन",
    "email": "इमेल",
    "guardianName": "अभिभावकको नाम",
    "guardianPhone": "अभिभावकको फोन",
    "guardianRelation": "अभिभावकसँगको सम्बन्ध"
  },
  "validation": {
    "nameRequired": "विद्यार्थीको नाम आवश्यक छ",
    "classRequired": "कक्षा छनोट आवश्यक छ",
    "dobRequired": "जन्म मिति आवश्यक छ",
    "invalidPhone": "अवैध फोन नम्बर ढाँचा"
  }
}
```

### React i18n Setup

```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translation files
import enCommon from '../locales/en/common.json';
import enStudents from '../locales/en/students.json';
import enAuth from '../locales/en/auth.json';
import enFees from '../locales/en/fees.json';
import enAttendance from '../locales/en/attendance.json';
import enExams from '../locales/en/exams.json';

import neCommon from '../locales/ne/common.json';
import neStudents from '../locales/ne/students.json';
import neAuth from '../locales/ne/auth.json';
import neFees from '../locales/ne/fees.json';
import neAttendance from '../locales/ne/attendance.json';
import neExams from '../locales/ne/exams.json';

const resources = {
  en: {
    common: enCommon,
    students: enStudents,
    auth: enAuth,
    fees: enFees,
    attendance: enAttendance,
    exams: enExams
  },
  ne: {
    common: neCommon,
    students: neStudents,
    auth: neAuth,
    fees: neFees,
    attendance: neAttendance,
    exams: neExams
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'students', 'auth', 'fees', 'attendance', 'exams'],
    
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'sms_language',
      caches: ['localStorage']
    },
    
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
```

### Language Switcher Component

```tsx
// src/components/LanguageSwitcher/LanguageSwitcher.tsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇳🇵' }
];

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  
  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];
  
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLanguageChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('sms_language', langCode);
    handleClose();
    
    // Update document direction for RTL languages (if needed in future)
    document.documentElement.lang = langCode;
  };
  
  return (
    <>
      <IconButton
        onClick={handleClick}
        color="inherit"
        aria-label="Change language"
        title={`Current: ${currentLanguage.nativeName}`}
      >
        <span style={{ fontSize: '1.2rem' }}>{currentLanguage.flag}</span>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {languages.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            selected={lang.code === i18n.language}
          >
            <ListItemIcon>
              <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
            </ListItemIcon>
            <ListItemText 
              primary={lang.nativeName} 
              secondary={lang.name !== lang.nativeName ? lang.name : undefined}
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSwitcher;
```

---

## Theme System (Dark / Light Mode)

### Theme Configuration

```typescript
// src/theme/themeConfig.ts
import { createTheme, ThemeOptions, PaletteMode } from '@mui/material';

interface SchoolTheme {
  primaryColor: string;
  secondaryColor: string;
}

// Base theme options shared by both modes
const getBaseTheme = (schoolTheme: SchoolTheme): ThemeOptions => ({
  typography: {
    fontFamily: [
      'Inter',
      'Noto Sans Devanagari',  // For Nepali text
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Arial',
      'sans-serif'
    ].join(','),
    h1: { fontWeight: 700 },
    h2: { fontWeight: 600 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small'
      }
    }
  }
});

// Light mode palette
const getLightPalette = (schoolTheme: SchoolTheme): ThemeOptions => ({
  palette: {
    mode: 'light',
    primary: {
      main: schoolTheme.primaryColor,
      contrastText: '#ffffff'
    },
    secondary: {
      main: schoolTheme.secondaryColor
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff'
    },
    text: {
      primary: '#1a1a2e',
      secondary: '#4a4a68'
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c'
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00'
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f'
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2'
    }
  }
});

// Dark mode palette
const getDarkPalette = (schoolTheme: SchoolTheme): ThemeOptions => ({
  palette: {
    mode: 'dark',
    primary: {
      main: schoolTheme.primaryColor,
      contrastText: '#ffffff'
    },
    secondary: {
      main: schoolTheme.secondaryColor
    },
    background: {
      default: '#0a0a0f',
      paper: '#1a1a2e'
    },
    text: {
      primary: '#ffffff',
      secondary: '#b0b0c0'
    },
    success: {
      main: '#66bb6a',
      light: '#81c784',
      dark: '#388e3c'
    },
    warning: {
      main: '#ffa726',
      light: '#ffb74d',
      dark: '#f57c00'
    },
    error: {
      main: '#ef5350',
      light: '#e57373',
      dark: '#d32f2f'
    },
    info: {
      main: '#42a5f5',
      light: '#64b5f6',
      dark: '#1976d2'
    }
  }
});

// Create theme based on mode and school configuration
export const createAppTheme = (mode: PaletteMode, schoolTheme: SchoolTheme) => {
  const baseTheme = getBaseTheme(schoolTheme);
  const paletteTheme = mode === 'dark' 
    ? getDarkPalette(schoolTheme) 
    : getLightPalette(schoolTheme);
  
  return createTheme({
    ...baseTheme,
    ...paletteTheme
  });
};

export default createAppTheme;
```

### Theme Provider with Context

```tsx
// src/theme/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, PaletteMode } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from './themeConfig';

interface ThemeContextType {
  mode: PaletteMode;
  toggleMode: () => void;
  setMode: (mode: PaletteMode) => void;
  primaryColor: string;
  secondaryColor: string;
  setPrimaryColor: (color: string) => void;
  setSecondaryColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultMode?: PaletteMode;
  defaultPrimaryColor?: string;
  defaultSecondaryColor?: string;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultMode = 'light',
  defaultPrimaryColor = '#1976d2',
  defaultSecondaryColor = '#dc004e'
}) => {
  // Load saved preferences from localStorage
  const [mode, setMode] = useState<PaletteMode>(() => {
    const saved = localStorage.getItem('sms_theme_mode');
    if (saved === 'dark' || saved === 'light') return saved;
    
    // Check system preference
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return defaultMode;
  });
  
  const [primaryColor, setPrimaryColor] = useState(() => 
    localStorage.getItem('sms_primary_color') || defaultPrimaryColor
  );
  
  const [secondaryColor, setSecondaryColor] = useState(() => 
    localStorage.getItem('sms_secondary_color') || defaultSecondaryColor
  );
  
  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('sms_theme_mode', mode);
  }, [mode]);
  
  useEffect(() => {
    localStorage.setItem('sms_primary_color', primaryColor);
  }, [primaryColor]);
  
  useEffect(() => {
    localStorage.setItem('sms_secondary_color', secondaryColor);
  }, [secondaryColor]);
  
  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't explicitly set a preference
      if (!localStorage.getItem('sms_theme_mode')) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  const toggleMode = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };
  
  // Memoize theme to prevent unnecessary re-renders
  const theme = useMemo(() => 
    createAppTheme(mode, { primaryColor, secondaryColor }),
    [mode, primaryColor, secondaryColor]
  );
  
  const contextValue: ThemeContextType = {
    mode,
    toggleMode,
    setMode,
    primaryColor,
    secondaryColor,
    setPrimaryColor,
    setSecondaryColor
  };
  
  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
```

### Theme Toggle Component

```tsx
// src/components/ThemeToggle/ThemeToggle.tsx
import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { DarkMode, LightMode } from '@mui/icons-material';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from 'react-i18next';

const ThemeToggle: React.FC = () => {
  const { mode, toggleMode } = useTheme();
  const { t } = useTranslation();
  
  return (
    <Tooltip title={mode === 'light' ? t('theme.switchToDark') : t('theme.switchToLight')}>
      <IconButton 
        onClick={toggleMode} 
        color="inherit"
        aria-label="Toggle theme"
      >
        {mode === 'light' ? <DarkMode /> : <LightMode />}
      </IconButton>
    </Tooltip>
  );
};

export default ThemeToggle;
```

---

## Additional Essential Features

### 1. Offline Mode / PWA Support

```javascript
// public/service-worker.js
const CACHE_NAME = 'sms-cache-v1';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/assets/images/logo.png',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests differently
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful GET responses
          if (event.request.method === 'GET' && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached API response if available
          return caches.match(event.request);
        })
    );
    return;
  }

  // For static assets, use cache-first strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          // Cache the response
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
        });
    })
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncAttendanceData());
  }
  if (event.tag === 'sync-fees') {
    event.waitUntil(syncFeeData());
  }
});

async function syncAttendanceData() {
  const db = await openIndexedDB();
  const pendingData = await db.getAll('pending-attendance');
  
  for (const record of pendingData) {
    try {
      await fetch('/api/v1/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record.data)
      });
      await db.delete('pending-attendance', record.id);
    } catch (error) {
      console.error('Failed to sync attendance:', error);
    }
  }
}
```

### 2. Accessibility (A11y) Standards

```tsx
// src/components/AccessibilityProvider/AccessibilityProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface A11ySettings {
  highContrast: boolean;
  fontSize: 'normal' | 'large' | 'xlarge';
  reducedMotion: boolean;
  screenReaderMode: boolean;
}

interface A11yContextType {
  settings: A11ySettings;
  updateSettings: (updates: Partial<A11ySettings>) => void;
  resetSettings: () => void;
}

const defaultSettings: A11ySettings = {
  highContrast: false,
  fontSize: 'normal',
  reducedMotion: false,
  screenReaderMode: false
};

const A11yContext = createContext<A11yContextType | undefined>(undefined);

export const useA11y = () => {
  const context = useContext(A11yContext);
  if (!context) {
    throw new Error('useA11y must be used within AccessibilityProvider');
  }
  return context;
};

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<A11ySettings>(() => {
    const saved = localStorage.getItem('sms_a11y_settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('sms_a11y_settings', JSON.stringify(settings));
    
    // Apply settings to document
    const root = document.documentElement;
    
    // Font size
    const fontSizes = { normal: '16px', large: '18px', xlarge: '20px' };
    root.style.fontSize = fontSizes[settings.fontSize];
    
    // High contrast
    root.classList.toggle('high-contrast', settings.highContrast);
    
    // Reduced motion
    if (settings.reducedMotion) {
      root.style.setProperty('--transition-duration', '0s');
    } else {
      root.style.removeProperty('--transition-duration');
    }
  }, [settings]);

  // Check system preferences
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
      setSettings(prev => ({ ...prev, reducedMotion: true }));
    }
  }, []);

  const updateSettings = (updates: Partial<A11ySettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <A11yContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </A11yContext.Provider>
  );
};
```

### 3. Date Format (BS Calendar / AD Calendar)

```typescript
// src/utils/dateConverter.ts
import NepaliDate from 'nepali-date-converter';

export type DateFormat = 'BS' | 'AD';

export interface DateConverterOptions {
  format?: string;
  locale?: 'en' | 'ne';
}

export class DateConverter {
  /**
   * Convert AD date to BS date
   */
  static adToBS(adDate: Date | string, options: DateConverterOptions = {}): string {
    const date = new Date(adDate);
    const npDate = new NepaliDate(date);
    
    const format = options.format || 'YYYY-MM-DD';
    const locale = options.locale || 'en';
    
    if (locale === 'ne') {
      return npDate.format(format, 'np');
    }
    return npDate.format(format);
  }

  /**
   * Convert BS date to AD date
   */
  static bsToAD(bsDate: string): Date {
    const [year, month, day] = bsDate.split('-').map(Number);
    const npDate = new NepaliDate(year, month - 1, day);
    return npDate.toJsDate();
  }

  /**
   * Get current date in BS
   */
  static getCurrentBS(options: DateConverterOptions = {}): string {
    return this.adToBS(new Date(), options);
  }

  /**
   * Format date based on user preference
   */
  static formatDate(
    date: Date | string, 
    dateFormat: DateFormat = 'BS',
    options: DateConverterOptions = {}
  ): string {
    if (dateFormat === 'BS') {
      return this.adToBS(date, options);
    }
    
    const d = new Date(date);
    const format = options.format || 'YYYY-MM-DD';
    
    // Simple format replacement
    return format
      .replace('YYYY', d.getFullYear().toString())
      .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
      .replace('DD', String(d.getDate()).padStart(2, '0'));
  }

  /**
   * Get Nepali month name
   */
  static getNepaliMonthName(month: number, locale: 'en' | 'ne' = 'en'): string {
    const monthsEn = [
      'Baisakh', 'Jestha', 'Asar', 'Shrawan', 
      'Bhadra', 'Ashwin', 'Kartik', 'Mangsir',
      'Poush', 'Magh', 'Falgun', 'Chaitra'
    ];
    
    const monthsNe = [
      'बैशाख', 'जेठ', 'असार', 'श्रावण',
      'भाद्र', 'आश्विन', 'कार्तिक', 'मंसिर',
      'पौष', 'माघ', 'फाल्गुन', 'चैत्र'
    ];
    
    return locale === 'ne' ? monthsNe[month - 1] : monthsEn[month - 1];
  }

  /**
   * Get Nepali day name
   */
  static getNepaliDayName(dayIndex: number, locale: 'en' | 'ne' = 'en'): string {
    const daysEn = ['Aaitabar', 'Sombar', 'Mangalbar', 'Budhabar', 'Bihibar', 'Sukrabar', 'Sanibar'];
    const daysNe = ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'];
    
    return locale === 'ne' ? daysNe[dayIndex] : daysEn[dayIndex];
  }
}

export default DateConverter;
```

### 4. Currency Formatting (NPR)

```typescript
// src/utils/currencyFormatter.ts

export interface CurrencyOptions {
  symbol?: string;
  locale?: 'en' | 'ne';
  showSymbol?: boolean;
  decimals?: number;
}

export class CurrencyFormatter {
  private static defaultOptions: CurrencyOptions = {
    symbol: 'रू',
    locale: 'en',
    showSymbol: true,
    decimals: 2
  };

  /**
   * Format amount as NPR currency
   */
  static format(amount: number, options: CurrencyOptions = {}): string {
    const opts = { ...this.defaultOptions, ...options };
    
    // Format number with Nepali/Indian numbering system
    const formatted = this.formatWithNepalNumbering(amount, opts.decimals!);
    
    if (opts.showSymbol) {
      return opts.locale === 'ne' 
        ? `${opts.symbol} ${formatted}`
        : `${opts.symbol} ${formatted}`;
    }
    
    return formatted;
  }

  /**
   * Format with Nepali/Indian numbering (lakhs, crores)
   */
  private static formatWithNepalNumbering(amount: number, decimals: number): string {
    const [integerPart, decimalPart] = amount.toFixed(decimals).split('.');
    
    // Apply Nepali numbering: XX,XX,XXX
    let result = '';
    const digits = integerPart.split('').reverse();
    
    for (let i = 0; i < digits.length; i++) {
      if (i === 3 || (i > 3 && (i - 3) % 2 === 0)) {
        result = ',' + result;
      }
      result = digits[i] + result;
    }
    
    if (decimalPart && parseInt(decimalPart) > 0) {
      result += '.' + decimalPart;
    }
    
    return result;
  }

  /**
   * Convert number to Nepali words
   */
  static toNepaliWords(amount: number): string {
    if (amount === 0) return 'शून्य';
    
    const ones = ['', 'एक', 'दुई', 'तीन', 'चार', 'पाँच', 'छ', 'सात', 'आठ', 'नौ'];
    const tens = ['', 'दश', 'बीस', 'तीस', 'चालीस', 'पचास', 'साठी', 'सत्तरी', 'अस्सी', 'नब्बे'];
    const scales = ['', 'हजार', 'लाख', 'करोड', 'अरब'];
    
    // Simplified implementation - extend as needed
    if (amount < 10) return ones[amount];
    if (amount < 100) {
      const ten = Math.floor(amount / 10);
      const one = amount % 10;
      return tens[ten] + (one ? ' ' + ones[one] : '');
    }
    
    // For larger numbers, return formatted number
    return this.format(amount, { showSymbol: false });
  }

  /**
   * Parse currency string to number
   */
  static parse(currencyString: string): number {
    const cleaned = currencyString.replace(/[^\d.-]/g, '');
    return parseFloat(cleaned) || 0;
  }
}

export default CurrencyFormatter;
```

### 5. Session Management

```typescript
// src/utils/sessionManager.ts

export interface SessionConfig {
  maxIdleTime: number;  // in milliseconds
  warningTime: number;  // warning before logout
  checkInterval: number;
}

export class SessionManager {
  private config: SessionConfig;
  private lastActivity: number;
  private warningCallback?: () => void;
  private logoutCallback?: () => void;
  private intervalId?: NodeJS.Timeout;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = {
      maxIdleTime: config.maxIdleTime || 30 * 60 * 1000,  // 30 minutes
      warningTime: config.warningTime || 5 * 60 * 1000,   // 5 minutes warning
      checkInterval: config.checkInterval || 60 * 1000     // Check every minute
    };
    this.lastActivity = Date.now();
  }

  /**
   * Start session monitoring
   */
  start(onWarning?: () => void, onLogout?: () => void) {
    this.warningCallback = onWarning;
    this.logoutCallback = onLogout;
    
    // Track user activity
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    activityEvents.forEach(event => {
      document.addEventListener(event, this.updateActivity.bind(this), { passive: true });
    });
    
    // Start checking session
    this.intervalId = setInterval(this.checkSession.bind(this), this.config.checkInterval);
  }

  /**
   * Stop session monitoring
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  /**
   * Update last activity time
   */
  private updateActivity() {
    this.lastActivity = Date.now();
  }

  /**
   * Check session status
   */
  private checkSession() {
    const idleTime = Date.now() - this.lastActivity;
    
    if (idleTime >= this.config.maxIdleTime) {
      this.logoutCallback?.();
    } else if (idleTime >= this.config.maxIdleTime - this.config.warningTime) {
      this.warningCallback?.();
    }
  }

  /**
   * Get remaining session time
   */
  getRemainingTime(): number {
    const idleTime = Date.now() - this.lastActivity;
    return Math.max(0, this.config.maxIdleTime - idleTime);
  }

  /**
   * Extend session (on user action)
   */
  extendSession() {
    this.lastActivity = Date.now();
  }
}

export default SessionManager;
```

---

## Summary: IDE Behavior Guidelines

### DO ✅

1. **Always validate inputs** - Never trust user data
2. **Use parameterized queries** - Prevent SQL injection
3. **Sanitize outputs** - Prevent XSS
4. **Implement proper error handling** - Try-catch everywhere
5. **Use constants** - No magic numbers or strings
6. **Document code** - JSDoc for all public functions
7. **Write tests first** - TDD approach when possible
8. **Use transactions** - For multi-table operations
9. **Log security events** - Authentication, authorization, data access
10. **Follow naming conventions** - Consistent, descriptive names

### DON'T ❌

1. **Blindly accept AI output** - Always review and understand
2. **Expose sensitive data** - In responses, logs, or errors
3. **Skip validation** - Even for internal APIs
4. **Hardcode credentials** - Use environment variables
5. **Ignore security warnings** - From npm audit, linters
6. **Copy-paste without understanding** - Leads to bugs
7. **Skip error handling** - Causes crashes and data loss
8. **Mix concerns** - Keep controllers, services, models separate
9. **Commit untested code** - All code must have tests
10. **Ignore performance** - Indices, pagination, caching

---

*Document Version: 1.0*
*Created: 2082-10-24 BS (2026-02-06 AD)*
*For: School Management System Development*

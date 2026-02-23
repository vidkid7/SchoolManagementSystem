---
description: Agentic IDE Professional Coding Workflow for School Management System
---

# Professional Coding Workflow for Agentic IDE

This workflow ensures professional, secure, and robust code generation for the School Management System.

## 🎯 CRITICAL RULES - READ BEFORE EVERY TASK

### Rule 1: Never Generate Insecure Code
// turbo-all

1. **ALWAYS validate inputs** before using them
2. **NEVER use string concatenation** for SQL queries
3. **ALWAYS sanitize user input** before output
4. **NEVER expose sensitive data** in responses or logs
5. **ALWAYS use parameterized queries** or ORM methods

### Rule 2: Understand Before Generating

1. **READ the existing code structure** before adding new code
2. **FOLLOW the established patterns** in the codebase
3. **CHECK for duplicate functionality** before creating new
4. **VERIFY the context** - don't assume, confirm

### Rule 3: Complete Implementation Only

1. **NEVER generate partial code** that won't compile/run
2. **ALWAYS include error handling**
3. **ALWAYS include input validation**
4. **ALWAYS include proper imports**
5. **ALWAYS include type definitions** (JSDoc or TypeScript)

---

## 📋 WORKFLOW: Creating New API Endpoint

### Step 1: Analyze Requirements
```
Before writing code, answer:
1. What resource is being managed?
2. What operations are needed (CRUD)?
3. What roles can access this endpoint?
4. What validations are required?
5. What security concerns exist?
```

### Step 2: Create Validation Schema
```javascript
// File: src/modules/{resource}/{resource}.validation.js
// Always create validation FIRST before controller

const Joi = require('joi');

const schemas = {
  create: Joi.object({
    // Define all fields with:
    // - Type validation
    // - Required/optional status
    // - Length/range limits
    // - Format validation (email, phone, etc.)
  }),
  update: Joi.object({
    // Update schema (usually partial)
  }),
  params: Joi.object({
    id: Joi.number().integer().positive().required()
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20)
  })
};

module.exports = { schemas };
```

### Step 3: Create Model (if new)
```javascript
// File: src/modules/{resource}/{Resource}.model.js

const { DataTypes } = require('sequelize');
const sequelize = require('../../config/database');

const Resource = sequelize.define('Resource', {
  // Always include:
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // All fields with proper types and constraints
  
  // Standard audit fields:
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
  createdBy: DataTypes.INTEGER,
  updatedBy: DataTypes.INTEGER,
  deletedAt: DataTypes.DATE // Soft delete
}, {
  tableName: 'resources',
  paranoid: true, // Enable soft delete
  indexes: [
    // Add indexes for frequently queried fields
  ]
});

module.exports = Resource;
```

### Step 4: Create Service Layer
```javascript
// File: src/modules/{resource}/{resource}.service.js

class ResourceService {
  constructor(repository) {
    this.repository = repository;
  }
  
  /**
   * Create new resource
   * @param {Object} data - Validated input data
   * @param {Object} context - Request context (userId, schoolId)
   * @returns {Promise<Object>} Created resource
   * @throws {ConflictError} If duplicate exists
   */
  async create(data, context) {
    // 1. Business rule validation
    // 2. Duplicate check
    // 3. Transaction if multi-table
    // 4. Create and return sanitized result
  }
  
  // ... other methods with same structure
}

module.exports = ResourceService;
```

### Step 5: Create Controller
```javascript
// File: src/modules/{resource}/{resource}.controller.js

const { ResourceService } = require('./resource.service');
const { asyncHandler } = require('../../middleware/asyncHandler');

const resourceController = {
  create: asyncHandler(async (req, res) => {
    const result = await ResourceService.create(
      req.validatedBody,
      { userId: req.user.userId, schoolId: req.user.schoolId }
    );
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Resource created successfully'
    });
  }),
  
  // ... other methods
};

module.exports = resourceController;
```

### Step 6: Create Routes with Middleware
```javascript
// File: src/modules/{resource}/{resource}.routes.js

const router = require('express').Router();
const { authenticate } = require('../../middleware/auth');
const { checkPermission } = require('../../middleware/rbac');
const { validate } = require('../../middleware/validation');
const { schemas } = require('./resource.validation');
const controller = require('./resource.controller');

// Apply authentication to all routes
router.use(authenticate);

// CRUD routes with proper middleware chain
router.post('/',
  checkPermission('resource', 'create'),
  validate(schemas.create),
  controller.create
);

router.get('/',
  checkPermission('resource', 'read'),
  validate(schemas.query, 'query'),
  controller.findAll
);

router.get('/:id',
  checkPermission('resource', 'read'),
  validate(schemas.params, 'params'),
  controller.findById
);

router.put('/:id',
  checkPermission('resource', 'update'),
  validate(schemas.params, 'params'),
  validate(schemas.update),
  controller.update
);

router.delete('/:id',
  checkPermission('resource', 'delete'),
  validate(schemas.params, 'params'),
  controller.delete
);

module.exports = router;
```

### Step 7: Create Tests
```javascript
// File: src/modules/{resource}/{resource}.test.js

describe('ResourceService', () => {
  // Unit tests for service methods
});

describe('Resource API', () => {
  // Integration tests for endpoints
});
```

---

## 📋 WORKFLOW: Security Review Checklist

Before committing ANY code, verify:

### Authentication & Authorization
- [ ] All routes have `authenticate` middleware
- [ ] All routes have `checkPermission` middleware
- [ ] Resource ownership is verified where needed
- [ ] JWT tokens are validated properly

### Input Validation
- [ ] All inputs have Joi/express-validator schema
- [ ] Type checking is complete
- [ ] Length limits are set
- [ ] Format validation for emails, phones, dates
- [ ] SQL injection characters are handled

### Output Security
- [ ] Sensitive fields are removed from responses
- [ ] Error messages don't expose internals
- [ ] Stack traces are not sent to client
- [ ] Passwords are never returned

### Data Security
- [ ] Passwords are hashed with bcrypt
- [ ] Sensitive data is encrypted
- [ ] SQL uses parameterized queries
- [ ] XSS is prevented via sanitization

### Logging
- [ ] Security events are logged
- [ ] Errors are logged with context
- [ ] Sensitive data is NOT logged

---

## 📋 WORKFLOW: Code Quality Checklist

### Naming Conventions
- [ ] camelCase for variables and functions
- [ ] PascalCase for classes and React components
- [ ] UPPER_SNAKE_CASE for constants
- [ ] Descriptive names (no single letters except loops)

### Code Structure
- [ ] Functions are under 50 lines
- [ ] Single responsibility principle
- [ ] No code duplication
- [ ] Proper error handling with try-catch
- [ ] No hardcoded values (use constants)

### Documentation
- [ ] JSDoc for all public functions
- [ ] Complex logic has comments explaining "why"
- [ ] README updated if needed

### Testing
- [ ] Unit tests for business logic
- [ ] Edge cases covered
- [ ] Error scenarios tested
- [ ] Test coverage > 70%

---

## 📋 WORKFLOW: React Component Creation

### Step 1: Define Props Interface
```typescript
// File: src/components/{Component}/{Component}.tsx

interface ComponentProps {
  // Define all props with types
  // Use required vs optional appropriately
}
```

### Step 2: Create Component with Error Boundaries
```typescript
const Component: React.FC<ComponentProps> = ({ ...props }) => {
  // 1. Hooks at the top
  // 2. State management
  // 3. Effects with proper dependencies
  // 4. Event handlers
  // 5. Render with conditional handling
  
  // Always handle loading, error, and empty states
  if (loading) return <Loader />;
  if (error) return <ErrorDisplay error={error} />;
  if (!data?.length) return <EmptyState />;
  
  return (
    // Main render
  );
};

export default Component;
```

### Step 3: Create Component Tests
```typescript
// File: src/components/{Component}/{Component}.test.tsx

describe('Component', () => {
  it('renders correctly with props', () => {});
  it('handles loading state', () => {});
  it('handles error state', () => {});
  it('handles empty state', () => {});
  it('handles user interactions', () => {});
});
```

---

## ⚠️ COMMON MISTAKES TO AVOID

### Mistake 1: Missing Await
```javascript
// ❌ WRONG
const user = db.query('SELECT * FROM users WHERE id = ?', [id]);
console.log(user.name); // undefined - user is a Promise!

// ✅ CORRECT
const user = await db.query('SELECT * FROM users WHERE id = ?', [id]);
console.log(user.name);
```

### Mistake 2: Missing Error Handling
```javascript
// ❌ WRONG
app.get('/api/users/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});

// ✅ CORRECT
app.get('/api/users/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});
```

### Mistake 3: SQL Injection
```javascript
// ❌ WRONG - NEVER DO THIS
const query = `SELECT * FROM users WHERE name = '${name}'`;

// ✅ CORRECT
const query = 'SELECT * FROM users WHERE name = ?';
db.query(query, [name]);
```

### Mistake 4: Exposing Sensitive Data
```javascript
// ❌ WRONG
res.json(user); // Includes password hash!

// ✅ CORRECT
const { password, ...safeUser } = user;
res.json(safeUser);
```

### Mistake 5: No Input Validation
```javascript
// ❌ WRONG
const { email, amount } = req.body;
await processPayment(email, amount); // What if amount is negative?

// ✅ CORRECT
const { error, value } = paymentSchema.validate(req.body);
if (error) return res.status(400).json({ errors: error.details });
await processPayment(value.email, value.amount);
```

---

## 🔧 QUICK REFERENCE: Security Packages

```json
{
  "dependencies": {
    "bcrypt": "^5.1.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.0",
    "express-rate-limit": "^7.1.0",
    "express-validator": "^7.0.0",
    "joi": "^17.11.0",
    "xss": "^1.0.14",
    "cors": "^2.8.5",
    "hpp": "^0.2.3",
    "sanitize-html": "^2.11.0",
    "csrf": "^3.1.0"
  },
  "devDependencies": {
    "eslint": "^8.56.0",
    "eslint-plugin-security": "^2.1.0",
    "@types/jest": "^29.5.0",
    "jest": "^29.7.0"
  }
}
```

---

## 📝 TEMPLATES

### API Response Format
```javascript
// Success
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}

// Error
{
  "success": false,
  "message": "Descriptive error message",
  "errors": [
    { "field": "email", "message": "Invalid email format" }
  ],
  "code": "VALIDATION_ERROR"
}
```

### Error Codes
```javascript
const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};
```

---

*Follow this workflow for every coding task to ensure professional, secure, and robust code.*

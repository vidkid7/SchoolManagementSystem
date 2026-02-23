# Authentication Module

## Overview

This module handles all authentication and user management functionality for the School Management System.

## Components

### User Model (`User.model.ts`)
- Sequelize model for the `users` table
- Supports all 13 user roles as per Nepal School Management System requirements
- Password hashing with bcrypt (cost factor 12) for security
- Account lockout tracking fields (`failed_login_attempts`, `account_locked_until`)
- Soft delete support with `deleted_at` timestamp
- Helper methods:
  - `comparePassword()`: Verify password against hash
  - `isAccountLocked()`: Check if account is currently locked
  - `changedPasswordAfter()`: Check if password was changed after JWT was issued

### User Repository (`auth.repository.ts`)
- Data access layer for User entity
- All database operations use parameterized queries to prevent SQL injection
- **CRUD Operations:**
  - `create()`: Create new user with automatic password hashing
  - `findById()`: Find user by ID
  - `findByUsername()`: Find user by username
  - `findByEmail()`: Find user by email
  - `findByUsernameOrEmail()`: Find user by either username or email
  - `findAll()`: Find all users with optional filters (role, status, search) and pagination
  - `update()`: Update user fields
  - `delete()`: Soft delete user
  - `hardDelete()`: Permanently delete user
  - `restore()`: Restore soft-deleted user

- **Account Lockout Management:**
  - `incrementFailedLoginAttempts()`: Increment failed login counter
  - `resetFailedLoginAttempts()`: Reset failed login counter and unlock
  - `lockAccount()`: Lock account until specified time
  - `unlockAccount()`: Unlock account and reset failed attempts

- **Token Management:**
  - `updateRefreshToken()`: Store/clear refresh token
  - `updateLastLogin()`: Update last login timestamp

- **Helper Methods:**
  - `findByRole()`: Find all users with specific role
  - `countByRole()`: Count users by role
  - `usernameExists()`: Check if username is already taken
  - `emailExists()`: Check if email is already taken

### Authentication Service (`auth.service.ts`)
- Business logic for authentication operations
- JWT token generation and verification
- Login/logout functionality
- Password change functionality
- Token refresh mechanism

### Authentication Controller (`auth.controller.ts`)
- HTTP request handlers for authentication endpoints
- Input validation
- Error handling

### Routes (`auth.routes.ts`)
- API endpoint definitions
- Middleware integration

### Validation (`auth.validation.ts`)
- Input validation schemas using express-validator

## Requirements Satisfied

### Requirement 1.1: Role-Based Access Control
✅ Supports all 13 roles:
- School_Admin
- Subject_Teacher
- Class_Teacher
- Department_Head
- ECA_Coordinator
- Sports_Coordinator
- Student
- Parent
- Librarian
- Accountant
- Transport_Manager
- Hostel_Warden
- Non_Teaching_Staff

### Requirement 36.2: Password Security
✅ Password hashing with bcrypt cost factor 12
- Passwords are automatically hashed before storage
- Hash format: `$2a$12$...` or `$2b$12$...` or `$2y$12$...`
- Never stores plaintext passwords

### Requirement 1.9: Account Lockout
✅ Account lockout tracking:
- `failed_login_attempts` field tracks failed login count
- `account_locked_until` field stores lockout expiry time
- Automatic lockout after 5 failed attempts (implemented in auth.service.ts)
- 15-minute lockout duration
- Automatic unlock after timeout

### Requirement 36.6: SQL Injection Prevention
✅ All repository methods use parameterized queries via Sequelize ORM
- No raw SQL string concatenation
- All user inputs are properly escaped
- WHERE clauses use Sequelize operators

## Testing

### Unit Tests (`__tests__/auth.repository.test.ts`)
Comprehensive test suite covering:
- User creation with all 13 roles
- Password hashing verification (bcrypt cost factor 12)
- CRUD operations
- Account lockout functionality
- Refresh token management
- Soft delete and restore
- Helper methods

**To run tests:**
```bash
cd backend
npm test -- auth.repository.test.ts
```

**Note:** Tests require a MySQL database connection. Configure database credentials in `.env` file before running tests.

## Database Schema

The `users` table is created by migration `001-create-users-table.ts` with the following structure:

```sql
CREATE TABLE users (
  user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM(...13 roles...) NOT NULL,
  status ENUM('active', 'inactive', 'suspended', 'locked') DEFAULT 'active',
  phone_number VARCHAR(20),
  profile_photo VARCHAR(255),
  last_login DATETIME,
  failed_login_attempts INT UNSIGNED DEFAULT 0,
  account_locked_until DATETIME,
  password_changed_at DATETIME,
  refresh_token TEXT,
  refresh_token_expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  INDEX idx_users_username (username),
  INDEX idx_users_email (email),
  INDEX idx_users_role (role),
  INDEX idx_users_status (status)
);
```

## API Endpoints

See `auth.routes.ts` for complete endpoint definitions:

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token
- `POST /api/v1/auth/change-password` - Change password (authenticated)
- `GET /api/v1/auth/me` - Get current user info

## Security Features

1. **Password Hashing**: bcrypt with cost factor 12
2. **SQL Injection Prevention**: Parameterized queries via Sequelize
3. **Account Lockout**: 5 failed attempts → 15-minute lockout
4. **Soft Delete**: Users are never permanently deleted by default
5. **Audit Trail**: All operations logged via Winston logger
6. **Token Management**: Secure JWT with refresh token mechanism

## Usage Example

```typescript
import userRepository from './auth.repository';
import { UserRole } from '@models/User.model';

// Create a new user
const user = await userRepository.create({
  username: 'john_doe',
  email: 'john@example.com',
  password: 'SecurePassword123!',
  role: UserRole.STUDENT
});

// Find user by username
const foundUser = await userRepository.findByUsername('john_doe');

// Update user
await userRepository.update(user.userId, {
  phoneNumber: '+977-9841234567'
});

// Soft delete user
await userRepository.delete(user.userId);

// Restore user
await userRepository.restore(user.userId);
```

## Implementation Status

✅ **Task 3.1 Complete:**
- [x] User entity with all 13 roles
- [x] User repository with CRUD operations
- [x] Parameterized queries for SQL injection prevention
- [x] Password hashing with bcrypt (cost factor 12)
- [x] Account lockout tracking fields
- [x] Comprehensive unit tests
- [x] Documentation

## Next Steps

- Task 3.2: Write property test for password hashing security
- Task 3.3: Implement JWT authentication service (already exists, may need updates)
- Task 3.4: Write property test for JWT token role information
- Task 3.5: Write property test for token expiration enforcement

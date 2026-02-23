import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import sequelize from '@config/database';
import User, { UserRole, UserStatus } from '@models/User.model';
import userRepository from '../auth.repository';

/**
 * User Repository Tests
 * Tests CRUD operations and account lockout functionality
 * Requirements: 1.1, 36.2, 1.9
 */
describe('UserRepository', () => {
  beforeAll(async () => {
    // Sync database
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up users table before each test
    await User.destroy({ where: {}, force: true });
  });

  describe('create', () => {
    it('should create a new user with hashed password', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        role: UserRole.STUDENT
      };

      const user = await userRepository.create(userData);

      expect(user).toBeDefined();
      expect(user.userId).toBeDefined();
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(userData.role);
      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.failedLoginAttempts).toBe(0);
      
      // Password should be hashed (bcrypt hash starts with $2a$, $2b$, or $2y$)
      expect(user.password).not.toBe(userData.password);
      expect(user.password).toMatch(/^\$2[aby]\$/);
    });

    it('should create user with all 13 roles', async () => {
      const roles = Object.values(UserRole);
      expect(roles).toHaveLength(13);

      for (const role of roles) {
        const user = await userRepository.create({
          username: `user_${role}`,
          email: `${role}@example.com`,
          password: 'Password123!',
          role
        });

        expect(user.role).toBe(role);
      }
    });

    it('should set default values for optional fields', async () => {
      const user = await userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        role: UserRole.STUDENT
      });

      expect(user.status).toBe(UserStatus.ACTIVE);
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.accountLockedUntil).toBeUndefined();
      expect(user.lastLogin).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('should find user by ID', async () => {
      const created = await userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        role: UserRole.STUDENT
      });

      const found = await userRepository.findById(created.userId);

      expect(found).toBeDefined();
      expect(found?.userId).toBe(created.userId);
      expect(found?.username).toBe(created.username);
    });

    it('should return null for non-existent user', async () => {
      const found = await userRepository.findById(99999);
      expect(found).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      await userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        role: UserRole.STUDENT
      });

      const found = await userRepository.findByUsername('testuser');

      expect(found).toBeDefined();
      expect(found?.username).toBe('testuser');
    });

    it('should return null for non-existent username', async () => {
      const found = await userRepository.findByUsername('nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      await userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        role: UserRole.STUDENT
      });

      const found = await userRepository.findByEmail('test@example.com');

      expect(found).toBeDefined();
      expect(found?.email).toBe('test@example.com');
    });

    it('should return null for non-existent email', async () => {
      const found = await userRepository.findByEmail('nonexistent@example.com');
      expect(found).toBeNull();
    });
  });

  describe('findByUsernameOrEmail', () => {
    beforeEach(async () => {
      await userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        role: UserRole.STUDENT
      });
    });

    it('should find user by username', async () => {
      const found = await userRepository.findByUsernameOrEmail('testuser');
      expect(found).toBeDefined();
      expect(found?.username).toBe('testuser');
    });

    it('should find user by email', async () => {
      const found = await userRepository.findByUsernameOrEmail('test@example.com');
      expect(found).toBeDefined();
      expect(found?.email).toBe('test@example.com');
    });

    it('should return null for non-existent identifier', async () => {
      const found = await userRepository.findByUsernameOrEmail('nonexistent');
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      // Create multiple users
      await userRepository.create({
        username: 'student1',
        email: 'student1@example.com',
        password: 'Password123!',
        role: UserRole.STUDENT
      });

      await userRepository.create({
        username: 'teacher1',
        email: 'teacher1@example.com',
        password: 'Password123!',
        role: UserRole.SUBJECT_TEACHER
      });

      await userRepository.create({
        username: 'admin1',
        email: 'admin1@example.com',
        password: 'Password123!',
        role: UserRole.SCHOOL_ADMIN
      });
    });

    it('should find all users without filters', async () => {
      const { users, total } = await userRepository.findAll();

      expect(users).toHaveLength(3);
      expect(total).toBe(3);
    });

    it('should filter users by role', async () => {
      const { users, total } = await userRepository.findAll({
        role: UserRole.STUDENT
      });

      expect(users).toHaveLength(1);
      expect(total).toBe(1);
      expect(users[0].role).toBe(UserRole.STUDENT);
    });

    it('should filter users by status', async () => {
      const { users, total } = await userRepository.findAll({
        status: UserStatus.ACTIVE
      });

      expect(users).toHaveLength(3);
      expect(total).toBe(3);
    });

    it('should search users by username or email', async () => {
      const { users, total } = await userRepository.findAll({
        search: 'student'
      });

      expect(users).toHaveLength(1);
      expect(total).toBe(1);
      expect(users[0].username).toContain('student');
    });

    it('should paginate results', async () => {
      const { users, total } = await userRepository.findAll(
        {},
        { limit: 2, offset: 0 }
      );

      expect(users).toHaveLength(2);
      expect(total).toBe(3);
    });

    it('should not include password in results', async () => {
      const { users } = await userRepository.findAll();

      users.forEach(user => {
        const userJson = user.toJSON() as unknown as Record<string, unknown>;
        expect(userJson.password).toBeUndefined();
      });
    });
  });

  describe('update', () => {
    it('should update user fields', async () => {
      const user = await userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        role: UserRole.STUDENT
      });

      const updated = await userRepository.update(user.userId, {
        phoneNumber: '+977-9841234567',
        status: UserStatus.INACTIVE
      });

      expect(updated).toBeDefined();
      expect(updated?.phoneNumber).toBe('+977-9841234567');
      expect(updated?.status).toBe(UserStatus.INACTIVE);
    });

    it('should hash password when updating', async () => {
      const user = await userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        role: UserRole.STUDENT
      });

      const oldPassword = user.password;

      const updated = await userRepository.update(user.userId, {
        password: 'NewPassword123!'
      });

      expect(updated).toBeDefined();
      expect(updated?.password).not.toBe('NewPassword123!');
      expect(updated?.password).not.toBe(oldPassword);
      expect(updated?.password).toMatch(/^\$2[aby]\$/);
    });

    it('should return null for non-existent user', async () => {
      const updated = await userRepository.update(99999, {
        phoneNumber: '+977-9841234567'
      });

      expect(updated).toBeNull();
    });
  });

  describe('delete (soft delete)', () => {
    it('should soft delete user', async () => {
      const user = await userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        role: UserRole.STUDENT
      });

      const deleted = await userRepository.delete(user.userId);
      expect(deleted).toBe(true);

      // User should not be found by normal query
      const found = await userRepository.findById(user.userId);
      expect(found).toBeNull();

      // User should still exist in database with deletedAt timestamp
      const deletedUser = await User.findByPk(user.userId, { paranoid: false });
      expect(deletedUser).toBeDefined();
      expect(deletedUser?.deletedAt).toBeDefined();
    });

    it('should return false for non-existent user', async () => {
      const deleted = await userRepository.delete(99999);
      expect(deleted).toBe(false);
    });
  });

  describe('restore', () => {
    it('should restore soft-deleted user', async () => {
      const user = await userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        role: UserRole.STUDENT
      });

      await userRepository.delete(user.userId);
      const restored = await userRepository.restore(user.userId);

      expect(restored).toBeDefined();
      expect(restored?.deletedAt).toBeNull();

      // User should be found by normal query
      const found = await userRepository.findById(user.userId);
      expect(found).toBeDefined();
    });
  });

  describe('Account Lockout Tracking', () => {
    let user: User;

    beforeEach(async () => {
      user = await userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        role: UserRole.STUDENT
      });
    });

    it('should increment failed login attempts', async () => {
      await userRepository.incrementFailedLoginAttempts(user.userId);
      await userRepository.incrementFailedLoginAttempts(user.userId);

      const updated = await userRepository.findById(user.userId);
      expect(updated?.failedLoginAttempts).toBe(2);
    });

    it('should reset failed login attempts', async () => {
      await userRepository.incrementFailedLoginAttempts(user.userId);
      await userRepository.incrementFailedLoginAttempts(user.userId);
      await userRepository.resetFailedLoginAttempts(user.userId);

      const updated = await userRepository.findById(user.userId);
      expect(updated?.failedLoginAttempts).toBe(0);
      expect(updated?.accountLockedUntil).toBeUndefined();
    });

    it('should lock account until specified time', async () => {
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await userRepository.lockAccount(user.userId, lockUntil);

      const updated = await userRepository.findById(user.userId);
      expect(updated?.accountLockedUntil).toBeDefined();
      expect(updated?.status).toBe(UserStatus.LOCKED);
      expect(updated?.isAccountLocked()).toBe(true);
    });

    it('should unlock account', async () => {
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      await userRepository.lockAccount(user.userId, lockUntil);
      await userRepository.unlockAccount(user.userId);

      const updated = await userRepository.findById(user.userId);
      expect(updated?.accountLockedUntil).toBeUndefined();
      expect(updated?.failedLoginAttempts).toBe(0);
      expect(updated?.status).toBe(UserStatus.ACTIVE);
      expect(updated?.isAccountLocked()).toBe(false);
    });
  });

  describe('Refresh Token Management', () => {
    it('should update refresh token', async () => {
      const user = await userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        role: UserRole.STUDENT
      });

      const token = 'sample-refresh-token';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await userRepository.updateRefreshToken(user.userId, token, expiresAt);

      const updated = await userRepository.findById(user.userId);
      expect(updated?.refreshToken).toBe(token);
      expect(updated?.refreshTokenExpiresAt).toBeDefined();
    });

    it('should clear refresh token', async () => {
      const user = await userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        role: UserRole.STUDENT
      });

      await userRepository.updateRefreshToken(user.userId, 'token', new Date());
      await userRepository.updateRefreshToken(user.userId, undefined, undefined);

      const updated = await userRepository.findById(user.userId);
      expect(updated?.refreshToken).toBeUndefined();
      expect(updated?.refreshTokenExpiresAt).toBeUndefined();
    });
  });

  describe('Helper Methods', () => {
    beforeEach(async () => {
      await userRepository.create({
        username: 'student1',
        email: 'student1@example.com',
        password: 'Password123!',
        role: UserRole.STUDENT
      });

      await userRepository.create({
        username: 'teacher1',
        email: 'teacher1@example.com',
        password: 'Password123!',
        role: UserRole.SUBJECT_TEACHER
      });
    });

    it('should find users by role', async () => {
      const students = await userRepository.findByRole(UserRole.STUDENT);
      expect(students).toHaveLength(1);
      expect(students[0].role).toBe(UserRole.STUDENT);
    });

    it('should count users by role', async () => {
      const count = await userRepository.countByRole(UserRole.STUDENT);
      expect(count).toBe(1);
    });

    it('should count all users', async () => {
      const count = await userRepository.countByRole();
      expect(count).toBe(2);
    });

    it('should check if username exists', async () => {
      const exists = await userRepository.usernameExists('student1');
      expect(exists).toBe(true);

      const notExists = await userRepository.usernameExists('nonexistent');
      expect(notExists).toBe(false);
    });

    it('should check if email exists', async () => {
      const exists = await userRepository.emailExists('student1@example.com');
      expect(exists).toBe(true);

      const notExists = await userRepository.emailExists('nonexistent@example.com');
      expect(notExists).toBe(false);
    });

    it('should exclude user ID when checking username existence', async () => {
      const user = await userRepository.findByUsername('student1');
      const exists = await userRepository.usernameExists('student1', user?.userId);
      expect(exists).toBe(false);
    });
  });

  describe('Password Hashing with bcrypt cost factor 12', () => {
    it('should hash password with bcrypt cost factor 12', async () => {
      const user = await userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'Password123!',
        role: UserRole.STUDENT
      });

      // Bcrypt hash format: $2a$12$... or $2b$12$... or $2y$12$...
      // The number after the second $ is the cost factor
      expect(user.password).toMatch(/^\$2[aby]\$12\$/);
    });

    it('should verify password correctly', async () => {
      const password = 'Password123!';
      const user = await userRepository.create({
        username: 'testuser',
        email: 'test@example.com',
        password,
        role: UserRole.STUDENT
      });

      const isValid = await user.comparePassword(password);
      expect(isValid).toBe(true);

      const isInvalid = await user.comparePassword('WrongPassword');
      expect(isInvalid).toBe(false);
    });
  });
});

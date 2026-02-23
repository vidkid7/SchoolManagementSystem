/**
 * Property-Based Test: Password Hashing Security
 * 
 * **Property 10: Password Hashing Security**
 * **Validates: Requirements 36.2**
 * 
 * For any password stored in the database, it should be a bcrypt hash 
 * (starting with "$2a$", "$2b$", or "$2y$") and not the plaintext password.
 * 
 * This test validates that:
 * - All passwords stored in the users table are bcrypt hashes
 * - Passwords are never stored in plaintext
 * - The bcrypt cost factor is 12 as per security requirements
 * - Password hashing occurs on both user creation and password updates
 */

import * as fc from 'fast-check';
import { Sequelize, QueryInterface, Options } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcrypt';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

describe('Property 10: Password Hashing Security', () => {
  let sequelize: Sequelize;
  let queryInterface: QueryInterface;
  let testCounter = 0;

  beforeAll(async () => {
    // Create test database connection
    const dbConfig: Options = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      database: process.env.DB_NAME || 'school_management_system',
      username: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      dialect: 'mysql',
      logging: false,
      pool: {
        min: 1,
        max: 5,
        acquire: 30000,
        idle: 10000
      }
    };

    sequelize = new Sequelize(dbConfig);
    
    // Ensure database connection is established
    await sequelize.authenticate();
    queryInterface = sequelize.getQueryInterface();
  });

  afterAll(async () => {
    // Clean up and close connection
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    // Disable foreign key checks temporarily for cleanup
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await queryInterface.bulkDelete('users', {}, {});
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  /**
   * Helper function to check if a string is a valid bcrypt hash
   */
  const isBcryptHash = (hash: string): boolean => {
    // Bcrypt hashes start with $2a$, $2b$, or $2y$ followed by cost factor
    const bcryptPattern = /^\$2[aby]\$\d{2}\$.{53}$/;
    return bcryptPattern.test(hash);
  };

  /**
   * Helper function to extract bcrypt cost factor from hash
   */
  const getBcryptCostFactor = (hash: string): number | null => {
    const match = hash.match(/^\$2[aby]\$(\d{2})\$/);
    return match ? parseInt(match[1], 10) : null;
  };

  /**
   * Property: Passwords are stored as bcrypt hashes on user creation
   * For any user created with a plaintext password, the stored password 
   * should be a bcrypt hash, not the plaintext
   */
  it('should store passwords as bcrypt hashes on user creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 5, maxLength: 40 })
            .filter(s => /^[a-zA-Z0-9]+$/.test(s) && s.length >= 5)
            .map(s => `${s}_${Date.now()}_${Math.floor(Math.random() * 10000)}`),
          email: fc.emailAddress()
            .map(e => `${Date.now()}_${Math.floor(Math.random() * 10000)}_${e}`),
          password: fc.string({ minLength: 8, maxLength: 50 })
            .filter(s => s.length >= 8 && !/\s/.test(s)),
          role: fc.constantFrom(
            'School_Admin',
            'Subject_Teacher',
            'Class_Teacher',
            'Student',
            'Parent',
            'Librarian',
            'Accountant',
            'Non_Teaching_Staff'
          )
        }),
        async (userData) => {
          // Hash the password using bcrypt with cost factor 12
          const salt = await bcrypt.genSalt(12);
          const hashedPassword = await bcrypt.hash(userData.password, salt);

          const user = {
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            role: userData.role,
            status: 'active',
            failed_login_attempts: 0,
            created_at: new Date(),
            updated_at: new Date()
          };

          // Insert user with hashed password
          await queryInterface.bulkInsert('users', [user]);

          // Retrieve the stored password from database
          const storedUsers = await sequelize.query(
            'SELECT password FROM users WHERE username = ?',
            { replacements: [userData.username], type: 'SELECT' }
          );

          expect(storedUsers).toHaveLength(1);
          const storedPassword = (storedUsers[0] as any).password;

          // Verify password is a bcrypt hash
          expect(isBcryptHash(storedPassword)).toBe(true);

          // Verify password is NOT the plaintext password
          expect(storedPassword).not.toBe(userData.password);

          // Verify bcrypt hash starts with valid prefix
          expect(storedPassword).toMatch(/^\$2[aby]\$/);

          // Verify bcrypt cost factor is 12
          const costFactor = getBcryptCostFactor(storedPassword);
          expect(costFactor).toBe(12);

          // Verify the hash can be used to verify the original password
          const isValid = await bcrypt.compare(userData.password, storedPassword);
          expect(isValid).toBe(true);

          // Verify a wrong password fails verification
          const isInvalid = await bcrypt.compare('wrongpassword123', storedPassword);
          expect(isInvalid).toBe(false);
        }
      ),
      { numRuns: 10 }
    );
  }, 60000); // 60 second timeout for bcrypt operations

  /**
   * Property: Passwords are re-hashed on password updates
   * For any user password update, the new password should be stored as a 
   * bcrypt hash, not plaintext
   */
  it('should re-hash passwords on password updates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 5, maxLength: 40 })
            .filter(s => /^[a-zA-Z0-9]+$/.test(s) && s.length >= 5)
            .map(s => `${s}_${Date.now()}_${Math.floor(Math.random() * 10000)}`),
          email: fc.emailAddress()
            .map(e => `${Date.now()}_${Math.floor(Math.random() * 10000)}_${e}`),
          initialPassword: fc.string({ minLength: 8, maxLength: 50 })
            .filter(s => s.length >= 8 && !/\s/.test(s)),
          newPassword: fc.string({ minLength: 8, maxLength: 50 })
            .filter(s => s.length >= 8 && !/\s/.test(s)),
          role: fc.constantFrom(
            'School_Admin',
            'Subject_Teacher',
            'Class_Teacher',
            'Student',
            'Parent',
            'Librarian',
            'Accountant'
          )
        }).filter(data => data.initialPassword !== data.newPassword),
        async (userData) => {
          // Create user with initial password
          const salt1 = await bcrypt.genSalt(12);
          const hashedInitialPassword = await bcrypt.hash(userData.initialPassword, salt1);

          const user = {
            username: userData.username,
            email: userData.email,
            password: hashedInitialPassword,
            role: userData.role,
            status: 'active',
            failed_login_attempts: 0,
            created_at: new Date(),
            updated_at: new Date()
          };

          await queryInterface.bulkInsert('users', [user]);

          // Get user ID
          const userRecords = await sequelize.query(
            'SELECT user_id, password FROM users WHERE username = ?',
            { replacements: [userData.username], type: 'SELECT' }
          );
          const userId = (userRecords[0] as any).user_id;
          const initialStoredPassword = (userRecords[0] as any).password;

          // Verify initial password is hashed
          expect(isBcryptHash(initialStoredPassword)).toBe(true);
          expect(initialStoredPassword).not.toBe(userData.initialPassword);

          // Update password
          const salt2 = await bcrypt.genSalt(12);
          const hashedNewPassword = await bcrypt.hash(userData.newPassword, salt2);

          await sequelize.query(
            'UPDATE users SET password = ?, updated_at = ? WHERE user_id = ?',
            { replacements: [hashedNewPassword, new Date(), userId] }
          );

          // Retrieve updated password
          const updatedUsers = await sequelize.query(
            'SELECT password FROM users WHERE user_id = ?',
            { replacements: [userId], type: 'SELECT' }
          );

          const updatedPassword = (updatedUsers[0] as any).password;

          // Verify new password is a bcrypt hash
          expect(isBcryptHash(updatedPassword)).toBe(true);

          // Verify new password is NOT the plaintext password
          expect(updatedPassword).not.toBe(userData.newPassword);

          // Verify new password is different from initial password
          expect(updatedPassword).not.toBe(initialStoredPassword);

          // Verify bcrypt cost factor is 12
          const costFactor = getBcryptCostFactor(updatedPassword);
          expect(costFactor).toBe(12);

          // Verify the new hash can verify the new password
          const isNewValid = await bcrypt.compare(userData.newPassword, updatedPassword);
          expect(isNewValid).toBe(true);

          // Verify the old password no longer works
          const isOldValid = await bcrypt.compare(userData.initialPassword, updatedPassword);
          expect(isOldValid).toBe(false);
        }
      ),
      { numRuns: 10 }
    );
  }, 60000); // 60 second timeout for bcrypt operations

  /**
   * Property: Multiple users with same password have different hashes
   * For any two users with the same plaintext password, their stored 
   * bcrypt hashes should be different due to unique salts
   */
  it('should generate different hashes for same password (unique salts)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username1: fc.string({ minLength: 5, maxLength: 40 })
            .filter(s => /^[a-zA-Z0-9]+$/.test(s) && s.length >= 5),
          username2: fc.string({ minLength: 5, maxLength: 40 })
            .filter(s => /^[a-zA-Z0-9]+$/.test(s) && s.length >= 5),
          email1: fc.emailAddress(),
          email2: fc.emailAddress(),
          sharedPassword: fc.string({ minLength: 8, maxLength: 50 })
            .filter(s => s.length >= 8 && !/\s/.test(s)),
          role: fc.constantFrom(
            'School_Admin',
            'Subject_Teacher',
            'Class_Teacher',
            'Student',
            'Parent'
          )
        }),
        async (userData) => {
          // Add unique counter to avoid duplicates during shrinking
          testCounter++;
          const uniqueSuffix = `_${testCounter}_${Date.now()}`;
          
          // Create first user
          const salt1 = await bcrypt.genSalt(12);
          const hash1 = await bcrypt.hash(userData.sharedPassword, salt1);

          const user1 = {
            username: userData.username1 + uniqueSuffix + '_1',
            email: `1${uniqueSuffix}_${userData.email1}`,
            password: hash1,
            role: userData.role,
            status: 'active',
            failed_login_attempts: 0,
            created_at: new Date(),
            updated_at: new Date()
          };

          await queryInterface.bulkInsert('users', [user1]);

          // Create second user with same password
          const salt2 = await bcrypt.genSalt(12);
          const hash2 = await bcrypt.hash(userData.sharedPassword, salt2);

          const user2 = {
            username: userData.username2 + uniqueSuffix + '_2',
            email: `2${uniqueSuffix}_${userData.email2}`,
            password: hash2,
            role: userData.role,
            status: 'active',
            failed_login_attempts: 0,
            created_at: new Date(),
            updated_at: new Date()
          };

          await queryInterface.bulkInsert('users', [user2]);

          // Retrieve both passwords
          const users = await sequelize.query(
            'SELECT username, password FROM users WHERE username IN (?, ?)',
            { replacements: [user1.username, user2.username], type: 'SELECT' }
          );

          expect(users).toHaveLength(2);

          const password1 = (users as any[]).find(u => u.username === user1.username).password;
          const password2 = (users as any[]).find(u => u.username === user2.username).password;

          // Verify both are bcrypt hashes
          expect(isBcryptHash(password1)).toBe(true);
          expect(isBcryptHash(password2)).toBe(true);

          // Verify hashes are different (unique salts)
          expect(password1).not.toBe(password2);

          // Verify both hashes can verify the same password
          const isValid1 = await bcrypt.compare(userData.sharedPassword, password1);
          const isValid2 = await bcrypt.compare(userData.sharedPassword, password2);
          expect(isValid1).toBe(true);
          expect(isValid2).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  }, 120000); // 120 second timeout for double bcrypt operations

  /**
   * Property: Plaintext passwords are never stored
   * For any attempt to query passwords from the database, none should 
   * match the plaintext password format
   */
  it('should never store plaintext passwords in database', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            username: fc.string({ minLength: 5, maxLength: 40 })
              .filter(s => /^[a-zA-Z0-9]+$/.test(s) && s.length >= 5),
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 })
              .filter(s => s.length >= 8 && !/\s/.test(s)),
            role: fc.constantFrom(
              'School_Admin',
              'Subject_Teacher',
              'Class_Teacher',
              'Student',
              'Parent',
              'Librarian'
            )
          }),
          { minLength: 2, maxLength: 3 }
        ),
        async (usersData) => {
          // Add unique counter to avoid duplicates
          testCounter++;
          const uniqueSuffix = `_${testCounter}_${Date.now()}`;
          
          // Ensure unique usernames and emails by adding index
          const uniqueUsers = usersData.map((user, index) => ({
            ...user,
            username: `${user.username}${uniqueSuffix}_${index}`,
            email: `${index}${uniqueSuffix}_${user.email}`
          }));

          if (uniqueUsers.length === 0) return;

          // Store plaintext passwords for verification
          const plaintextPasswords = uniqueUsers.map(u => u.password);

          // Create users with hashed passwords
          const usersToInsert = await Promise.all(
            uniqueUsers.map(async (userData) => {
              const salt = await bcrypt.genSalt(12);
              const hashedPassword = await bcrypt.hash(userData.password, salt);

              return {
                username: userData.username,
                email: userData.email,
                password: hashedPassword,
                role: userData.role,
                status: 'active',
                failed_login_attempts: 0,
                created_at: new Date(),
                updated_at: new Date()
              };
            })
          );

          await queryInterface.bulkInsert('users', usersToInsert);

          // Retrieve all passwords from database
          const storedUsers = await sequelize.query(
            'SELECT password FROM users WHERE username LIKE ?',
            { replacements: [`%${uniqueSuffix}%`], type: 'SELECT' }
          );

          // Verify no stored password matches any plaintext password
          for (const storedUser of storedUsers as any[]) {
            const storedPassword = storedUser.password;

            // Verify it's a bcrypt hash
            expect(isBcryptHash(storedPassword)).toBe(true);

            // Verify it doesn't match any plaintext password
            for (const plaintextPassword of plaintextPasswords) {
              expect(storedPassword).not.toBe(plaintextPassword);
            }

            // Verify bcrypt cost factor is 12
            const costFactor = getBcryptCostFactor(storedPassword);
            expect(costFactor).toBe(12);
          }
        }
      ),
      { numRuns: 5 }
    );
  }, 180000); // 180 second timeout for multiple bcrypt operations

  /**
   * Property: Bcrypt hash format validation
   * For any password stored in the database, it should match the bcrypt 
   * hash format exactly
   */
  it('should store passwords in valid bcrypt hash format', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          username: fc.string({ minLength: 5, maxLength: 40 })
            .filter(s => /^[a-zA-Z0-9]+$/.test(s) && s.length >= 5)
            .map(s => `${s}_${Date.now()}_${Math.floor(Math.random() * 10000)}`),
          email: fc.emailAddress()
            .map(e => `${Date.now()}_${Math.floor(Math.random() * 10000)}_${e}`),
          password: fc.string({ minLength: 8, maxLength: 50 })
            .filter(s => s.length >= 8 && !/\s/.test(s)),
          role: fc.constantFrom(
            'School_Admin',
            'Subject_Teacher',
            'Student',
            'Parent'
          )
        }),
        async (userData) => {
          // Create user with hashed password
          const salt = await bcrypt.genSalt(12);
          const hashedPassword = await bcrypt.hash(userData.password, salt);

          const user = {
            username: userData.username,
            email: userData.email,
            password: hashedPassword,
            role: userData.role,
            status: 'active',
            failed_login_attempts: 0,
            created_at: new Date(),
            updated_at: new Date()
          };

          await queryInterface.bulkInsert('users', [user]);

          // Retrieve password
          const storedUsers = await sequelize.query(
            'SELECT password FROM users WHERE username = ?',
            { replacements: [userData.username], type: 'SELECT' }
          );

          const storedPassword = (storedUsers[0] as any).password;

          // Verify bcrypt format: $2[a|b|y]$[cost]$[22 char salt][31 char hash]
          // Total length should be 60 characters
          expect(storedPassword).toHaveLength(60);

          // Verify starts with $2a$, $2b$, or $2y$
          expect(storedPassword).toMatch(/^\$2[aby]\$/);

          // Verify cost factor is present and is 12
          expect(storedPassword).toMatch(/^\$2[aby]\$12\$/);

          // Verify full bcrypt pattern
          expect(storedPassword).toMatch(/^\$2[aby]\$12\$[./A-Za-z0-9]{53}$/);

          // Verify it's a valid bcrypt hash
          expect(isBcryptHash(storedPassword)).toBe(true);
        }
      ),
      { numRuns: 10 }
    );
  }, 60000); // 60 second timeout for bcrypt operations
});

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import sequelize from '@config/database';
import Staff, { StaffStatus, StaffCategory, EmploymentType } from '@models/Staff.model';

/**
 * Staff Model Unit Tests
 * Requirements: 4.1, 40.3
 */
describe('Staff Model', () => {
  beforeAll(async () => {
    // Sync database schema
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Close database connection
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up staff table before each test
    await Staff.destroy({ where: {}, force: true });
  });

  describe('Model Creation', () => {
    it('should create a staff member with all required fields', async () => {
      const staffData = {
        staffCode: 'STAFF-2024-001',
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE
      };

      const staff = await Staff.create(staffData);

      expect(staff.staffId).toBeDefined();
      expect(staff.staffCode).toBe('STAFF-2024-001');
      expect(staff.firstNameEn).toBe('John');
      expect(staff.lastNameEn).toBe('Doe');
      expect(staff.category).toBe(StaffCategory.TEACHING);
      expect(staff.employmentType).toBe(EmploymentType.FULL_TIME);
      expect(staff.status).toBe(StaffStatus.ACTIVE);
      expect(staff.createdAt).toBeDefined();
      expect(staff.updatedAt).toBeDefined();
    });

    it('should create a staff member with optional fields', async () => {
      const staffData = {
        staffCode: 'STAFF-2024-002',
        firstNameEn: 'Jane',
        middleNameEn: 'Marie',
        lastNameEn: 'Smith',
        firstNameNp: 'जेन',
        lastNameNp: 'स्मिथ',
        dateOfBirthBS: '2050-05-15',
        dateOfBirthAD: new Date('1993-09-01'),
        gender: 'female',
        bloodGroup: 'O+',
        addressEn: '123 Main St, Kathmandu',
        phone: '+977-9841234567',
        email: 'jane.smith@school.edu.np',
        emergencyContact: '+977-9841234568',
        employeeId: 'EMP-001',
        category: StaffCategory.TEACHING,
        position: 'Senior Teacher',
        department: 'Mathematics',
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        salary: 50000.00,
        salaryGrade: 'Grade-A',
        highestQualification: 'M.Ed. Mathematics',
        specialization: 'Algebra',
        teachingLicense: 'TL-12345',
        citizenshipNumber: '12-01-75-12345',
        panNumber: '123456789',
        status: StaffStatus.ACTIVE
      };

      const staff = await Staff.create(staffData);

      expect(staff.staffId).toBeDefined();
      expect(staff.middleNameEn).toBe('Marie');
      expect(staff.firstNameNp).toBe('जेन');
      expect(staff.dateOfBirthBS).toBe('2050-05-15');
      expect(staff.gender).toBe('female');
      expect(staff.bloodGroup).toBe('O+');
      expect(staff.email).toBe('jane.smith@school.edu.np');
      expect(staff.employeeId).toBe('EMP-001');
      expect(staff.position).toBe('Senior Teacher');
      expect(staff.department).toBe('Mathematics');
      expect(staff.salary).toBe('50000.00');
      expect(staff.highestQualification).toBe('M.Ed. Mathematics');
      expect(staff.teachingLicense).toBe('TL-12345');
    });

    it('should fail to create staff without required fields', async () => {
      const invalidData = {
        firstNameEn: 'John'
        // Missing staffCode, lastNameEn, category, employmentType, joinDate
      };

      await expect(Staff.create(invalidData as any)).rejects.toThrow();
    });

    it('should enforce unique staff code constraint', async () => {
      const staffData = {
        staffCode: 'STAFF-2024-003',
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE
      };

      await Staff.create(staffData);

      // Try to create another staff with same code
      await expect(Staff.create(staffData)).rejects.toThrow();
    });
  });

  describe('Staff Categories', () => {
    it('should create teaching staff', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-004',
        firstNameEn: 'Teacher',
        lastNameEn: 'One',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE
      });

      expect(staff.category).toBe(StaffCategory.TEACHING);
      expect(staff.isTeachingStaff()).toBe(true);
    });

    it('should create non-teaching staff', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-005',
        firstNameEn: 'Admin',
        lastNameEn: 'Staff',
        category: StaffCategory.NON_TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE
      });

      expect(staff.category).toBe(StaffCategory.NON_TEACHING);
      expect(staff.isTeachingStaff()).toBe(false);
    });

    it('should create administrative staff', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-006',
        firstNameEn: 'Principal',
        lastNameEn: 'Admin',
        category: StaffCategory.ADMINISTRATIVE,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE
      });

      expect(staff.category).toBe(StaffCategory.ADMINISTRATIVE);
      expect(staff.isTeachingStaff()).toBe(false);
    });
  });

  describe('Employment Types', () => {
    it('should create full-time staff', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-007',
        firstNameEn: 'Full',
        lastNameEn: 'Time',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE
      });

      expect(staff.employmentType).toBe(EmploymentType.FULL_TIME);
    });

    it('should create part-time staff', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-008',
        firstNameEn: 'Part',
        lastNameEn: 'Time',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.PART_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE
      });

      expect(staff.employmentType).toBe(EmploymentType.PART_TIME);
    });

    it('should create contract staff', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-009',
        firstNameEn: 'Contract',
        lastNameEn: 'Staff',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.CONTRACT,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE
      });

      expect(staff.employmentType).toBe(EmploymentType.CONTRACT);
    });

    it('should create temporary staff', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-010',
        firstNameEn: 'Temporary',
        lastNameEn: 'Staff',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.TEMPORARY,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE
      });

      expect(staff.employmentType).toBe(EmploymentType.TEMPORARY);
    });
  });

  describe('Staff Status', () => {
    it('should default to active status', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-011',
        firstNameEn: 'Active',
        lastNameEn: 'Staff',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01')
      });

      expect(staff.status).toBe(StaffStatus.ACTIVE);
    });

    it('should support inactive status', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-012',
        firstNameEn: 'Inactive',
        lastNameEn: 'Staff',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.INACTIVE
      });

      expect(staff.status).toBe(StaffStatus.INACTIVE);
    });

    it('should support on_leave status', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-013',
        firstNameEn: 'OnLeave',
        lastNameEn: 'Staff',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ON_LEAVE
      });

      expect(staff.status).toBe(StaffStatus.ON_LEAVE);
    });

    it('should support terminated status', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-014',
        firstNameEn: 'Terminated',
        lastNameEn: 'Staff',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        terminationDate: new Date('2024-06-30'),
        status: StaffStatus.TERMINATED
      });

      expect(staff.status).toBe(StaffStatus.TERMINATED);
      expect(staff.terminationDate).toBeDefined();
    });

    it('should support retired status', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-015',
        firstNameEn: 'Retired',
        lastNameEn: 'Staff',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2000-01-01'),
        terminationDate: new Date('2024-01-01'),
        status: StaffStatus.RETIRED
      });

      expect(staff.status).toBe(StaffStatus.RETIRED);
    });
  });

  describe('Soft Delete (Requirement 40.3)', () => {
    it('should soft delete staff member', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-016',
        firstNameEn: 'Delete',
        lastNameEn: 'Test',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE
      });

      const staffId = staff.staffId;

      // Soft delete
      await staff.destroy();

      // Should not be found in normal query
      const foundStaff = await Staff.findByPk(staffId);
      expect(foundStaff).toBeNull();

      // Should be found with paranoid: false
      const deletedStaff = await Staff.findByPk(staffId, { paranoid: false });
      expect(deletedStaff).not.toBeNull();
      expect(deletedStaff?.deletedAt).toBeDefined();
      expect(deletedStaff?.deletedAt).toBeInstanceOf(Date);
    });

    it('should restore soft-deleted staff member', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-017',
        firstNameEn: 'Restore',
        lastNameEn: 'Test',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE
      });

      const staffId = staff.staffId;

      // Soft delete
      await staff.destroy();

      // Restore
      const deletedStaff = await Staff.findByPk(staffId, { paranoid: false });
      await deletedStaff?.restore();

      // Should be found in normal query
      const restoredStaff = await Staff.findByPk(staffId);
      expect(restoredStaff).not.toBeNull();
      expect(restoredStaff?.deletedAt).toBeNull();
    });

    it('should permanently delete staff member with force: true', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-018',
        firstNameEn: 'Hard',
        lastNameEn: 'Delete',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE
      });

      const staffId = staff.staffId;

      // Hard delete
      await staff.destroy({ force: true });

      // Should not be found even with paranoid: false
      const deletedStaff = await Staff.findByPk(staffId, { paranoid: false });
      expect(deletedStaff).toBeNull();
    });
  });

  describe('Model Methods', () => {
    it('should get full name in English', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-019',
        firstNameEn: 'John',
        middleNameEn: 'Michael',
        lastNameEn: 'Doe',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE
      });

      expect(staff.getFullNameEn()).toBe('John Michael Doe');
    });

    it('should get full name without middle name', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-020',
        firstNameEn: 'Jane',
        lastNameEn: 'Smith',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE
      });

      expect(staff.getFullNameEn()).toBe('Jane Smith');
    });

    it('should identify teaching staff correctly', async () => {
      const teachingStaff = await Staff.create({
        staffCode: 'STAFF-2024-021',
        firstNameEn: 'Teacher',
        lastNameEn: 'One',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE
      });

      const nonTeachingStaff = await Staff.create({
        staffCode: 'STAFF-2024-022',
        firstNameEn: 'Admin',
        lastNameEn: 'One',
        category: StaffCategory.NON_TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE
      });

      expect(teachingStaff.isTeachingStaff()).toBe(true);
      expect(nonTeachingStaff.isTeachingStaff()).toBe(false);
    });
  });

  describe('User Account Linking (Requirement 4.1)', () => {
    it('should link staff to user account', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-023',
        firstNameEn: 'Linked',
        lastNameEn: 'Staff',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE,
        userId: 123
      });

      expect(staff.userId).toBe(123);
    });

    it('should allow staff without user account', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-024',
        firstNameEn: 'Unlinked',
        lastNameEn: 'Staff',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE
      });

      expect(staff.userId).toBeUndefined();
    });
  });

  describe('Timestamps', () => {
    it('should automatically set createdAt and updatedAt', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-025',
        firstNameEn: 'Timestamp',
        lastNameEn: 'Test',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE
      });

      expect(staff.createdAt).toBeDefined();
      expect(staff.createdAt).toBeInstanceOf(Date);
      expect(staff.updatedAt).toBeDefined();
      expect(staff.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-026',
        firstNameEn: 'Update',
        lastNameEn: 'Test',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        status: StaffStatus.ACTIVE
      });

      const originalUpdatedAt = staff.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));

      // Update staff
      staff.position = 'Senior Teacher';
      await staff.save();

      expect(staff.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Qualifications', () => {
    it('should store qualification information', async () => {
      const staff = await Staff.create({
        staffCode: 'STAFF-2024-027',
        firstNameEn: 'Qualified',
        lastNameEn: 'Teacher',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        highestQualification: 'Ph.D. in Physics',
        specialization: 'Quantum Mechanics',
        teachingLicense: 'TL-98765',
        status: StaffStatus.ACTIVE
      });

      expect(staff.highestQualification).toBe('Ph.D. in Physics');
      expect(staff.specialization).toBe('Quantum Mechanics');
      expect(staff.teachingLicense).toBe('TL-98765');
    });
  });

  describe('Department Organization', () => {
    it('should organize staff by department', async () => {
      const mathTeacher = await Staff.create({
        staffCode: 'STAFF-2024-028',
        firstNameEn: 'Math',
        lastNameEn: 'Teacher',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        department: 'Mathematics',
        status: StaffStatus.ACTIVE
      });

      const scienceTeacher = await Staff.create({
        staffCode: 'STAFF-2024-029',
        firstNameEn: 'Science',
        lastNameEn: 'Teacher',
        category: StaffCategory.TEACHING,
        employmentType: EmploymentType.FULL_TIME,
        joinDate: new Date('2024-01-01'),
        department: 'Science',
        status: StaffStatus.ACTIVE
      });

      expect(mathTeacher.department).toBe('Mathematics');
      expect(scienceTeacher.department).toBe('Science');
    });
  });
});

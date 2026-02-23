import Student, { StudentStatus, Gender } from '@models/Student.model';
import studentRepository from '../student.repository';
import sequelize from '@config/database';

/**
 * Student Repository Tests
 * Tests CRUD operations, soft delete, pagination, and search functionality
 * Requirements: 2.1, 40.3, 35.6
 */

describe('StudentRepository', () => {
  // Setup: Create tables before all tests
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  // Cleanup: Close connection after all tests
  afterAll(async () => {
    await sequelize.close();
  });

  // Clear data before each test
  beforeEach(async () => {
    await Student.destroy({ where: {}, force: true });
  });

  // Helper function to create test student data
  const createTestStudentData = (overrides = {}) => ({
    studentCode: 'TEST-2024-001',
    firstNameEn: 'Ram',
    lastNameEn: 'Sharma',
    dateOfBirthBS: '2060-05-15',
    dateOfBirthAD: new Date('2003-08-30'),
    gender: Gender.MALE,
    addressEn: 'Kathmandu, Nepal',
    fatherName: 'Hari Sharma',
    fatherPhone: '9841234567',
    motherName: 'Sita Sharma',
    motherPhone: '9841234568',
    admissionDate: new Date('2020-04-15'),
    admissionClass: 1,
    emergencyContact: '9841234567',
    status: StudentStatus.ACTIVE,
    ...overrides
  });

  describe('create', () => {
    it('should create a new student with all required fields', async () => {
      const studentData = createTestStudentData();

      const student = await studentRepository.create(studentData);

      expect(student).toBeDefined();
      expect(student.studentId).toBeDefined();
      expect(student.studentCode).toBe(studentData.studentCode);
      expect(student.firstNameEn).toBe(studentData.firstNameEn);
      expect(student.lastNameEn).toBe(studentData.lastNameEn);
      expect(student.status).toBe(StudentStatus.ACTIVE);
      expect(student.deletedAt).toBeNull();
    });

    it('should create student with optional fields', async () => {
      const studentData = createTestStudentData({
        middleNameEn: 'Kumar',
        firstNameNp: 'राम',
        lastNameNp: 'शर्मा',
        bloodGroup: 'O+',
        phone: '9841234569',
        email: 'ram.sharma@example.com',
        allergies: 'Peanuts',
        medicalConditions: 'Asthma'
      });

      const student = await studentRepository.create(studentData);

      expect(student.middleNameEn).toBe('Kumar');
      expect(student.firstNameNp).toBe('राम');
      expect(student.bloodGroup).toBe('O+');
      expect(student.allergies).toBe('Peanuts');
    });

    it('should throw error for duplicate student code', async () => {
      const studentData = createTestStudentData();
      await studentRepository.create(studentData);

      await expect(
        studentRepository.create(studentData)
      ).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find student by ID', async () => {
      const created = await studentRepository.create(createTestStudentData());
      const found = await studentRepository.findById(created.studentId);

      expect(found).toBeDefined();
      expect(found?.studentId).toBe(created.studentId);
      expect(found?.studentCode).toBe(created.studentCode);
    });

    it('should return null for non-existent ID', async () => {
      const found = await studentRepository.findById(99999);
      expect(found).toBeNull();
    });
  });

  describe('findByStudentCode', () => {
    it('should find student by student code', async () => {
      const created = await studentRepository.create(createTestStudentData());
      const found = await studentRepository.findByStudentCode(created.studentCode);

      expect(found).toBeDefined();
      expect(found?.studentCode).toBe(created.studentCode);
    });

    it('should return null for non-existent student code', async () => {
      const found = await studentRepository.findByStudentCode('NON-EXISTENT');
      expect(found).toBeNull();
    });
  });

  describe('update', () => {
    it('should update student fields', async () => {
      const created = await studentRepository.create(createTestStudentData());
      
      const updated = await studentRepository.update(created.studentId, {
        phone: '9841111111',
        email: 'updated@example.com',
        bloodGroup: 'A+'
      });

      expect(updated).toBeDefined();
      expect(updated?.phone).toBe('9841111111');
      expect(updated?.email).toBe('updated@example.com');
      expect(updated?.bloodGroup).toBe('A+');
    });

    it('should return null for non-existent student', async () => {
      const updated = await studentRepository.update(99999, { phone: '9841111111' });
      expect(updated).toBeNull();
    });
  });

  describe('delete (soft delete)', () => {
    it('should soft delete student (set deleted_at)', async () => {
      const created = await studentRepository.create(createTestStudentData());
      
      const deleted = await studentRepository.delete(created.studentId);
      expect(deleted).toBe(true);

      // Should not find with normal query
      const found = await studentRepository.findById(created.studentId);
      expect(found).toBeNull();

      // Should find with paranoid: false
      const foundWithDeleted = await Student.findByPk(created.studentId, { paranoid: false });
      expect(foundWithDeleted).toBeDefined();
      expect(foundWithDeleted?.deletedAt).not.toBeNull();
    });

    it('should return false for non-existent student', async () => {
      const deleted = await studentRepository.delete(99999);
      expect(deleted).toBe(false);
    });
  });

  describe('restore', () => {
    it('should restore soft-deleted student', async () => {
      const created = await studentRepository.create(createTestStudentData());
      await studentRepository.delete(created.studentId);

      const restored = await studentRepository.restore(created.studentId);
      expect(restored).toBeDefined();
      expect(restored?.deletedAt).toBeNull();

      // Should find with normal query after restore
      const found = await studentRepository.findById(created.studentId);
      expect(found).toBeDefined();
    });

    it('should return null for non-deleted student', async () => {
      const created = await studentRepository.create(createTestStudentData());
      const restored = await studentRepository.restore(created.studentId);
      expect(restored).toBeNull();
    });
  });

  describe('findAll with pagination', () => {
    beforeEach(async () => {
      // Create 25 test students
      const students = Array.from({ length: 25 }, (_, i) => 
        createTestStudentData({
          studentCode: `TEST-2024-${String(i + 1).padStart(3, '0')}`,
          firstNameEn: `Student${i + 1}`,
          email: `student${i + 1}@example.com`
        })
      );
      await studentRepository.bulkCreate(students);
    });

    it('should return default 20 items per page', async () => {
      const { students, total } = await studentRepository.findAll();

      expect(students).toHaveLength(20);
      expect(total).toBe(25);
    });

    it('should respect custom limit', async () => {
      const { students, total } = await studentRepository.findAll({}, { limit: 10 });

      expect(students).toHaveLength(10);
      expect(total).toBe(25);
    });

    it('should enforce max limit of 100 items', async () => {
      const { students } = await studentRepository.findAll({}, { limit: 200 });

      expect(students.length).toBeLessThanOrEqual(100);
    });

    it('should support offset for pagination', async () => {
      const page1 = await studentRepository.findAll({}, { limit: 10, offset: 0 });
      const page2 = await studentRepository.findAll({}, { limit: 10, offset: 10 });

      expect(page1.students[0].studentId).not.toBe(page2.students[0].studentId);
    });
  });

  describe('findWithPagination', () => {
    beforeEach(async () => {
      const students = Array.from({ length: 45 }, (_, i) => 
        createTestStudentData({
          studentCode: `TEST-2024-${String(i + 1).padStart(3, '0')}`,
          firstNameEn: `Student${i + 1}`
        })
      );
      await studentRepository.bulkCreate(students);
    });

    it('should return pagination metadata', async () => {
      const result = await studentRepository.findWithPagination({}, 1, 20);

      expect(result.students).toHaveLength(20);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 45,
        totalPages: 3
      });
    });

    it('should return correct page 2', async () => {
      const result = await studentRepository.findWithPagination({}, 2, 20);

      expect(result.students).toHaveLength(20);
      expect(result.pagination.page).toBe(2);
    });

    it('should return remaining items on last page', async () => {
      const result = await studentRepository.findWithPagination({}, 3, 20);

      expect(result.students).toHaveLength(5);
      expect(result.pagination.page).toBe(3);
      expect(result.pagination.totalPages).toBe(3);
    });

    it('should enforce max limit of 100', async () => {
      const result = await studentRepository.findWithPagination({}, 1, 200);

      expect(result.pagination.limit).toBe(100);
    });
  });

  describe('searchByName (full-text search)', () => {
    beforeEach(async () => {
      await studentRepository.create(createTestStudentData({
        studentCode: 'TEST-001',
        firstNameEn: 'Ram',
        lastNameEn: 'Sharma'
      }));
      await studentRepository.create(createTestStudentData({
        studentCode: 'TEST-002',
        firstNameEn: 'Sita',
        lastNameEn: 'Thapa'
      }));
      await studentRepository.create(createTestStudentData({
        studentCode: 'TEST-003',
        firstNameEn: 'Hari',
        lastNameEn: 'Sharma'
      }));
    });

    it('should search by first name', async () => {
      const { students } = await studentRepository.searchByName('Ram');

      expect(students).toHaveLength(1);
      expect(students[0].firstNameEn).toBe('Ram');
    });

    it('should search by last name', async () => {
      const { students } = await studentRepository.searchByName('Sharma');

      expect(students).toHaveLength(2);
    });

    it('should be case-insensitive', async () => {
      const { students } = await studentRepository.searchByName('ram');

      expect(students).toHaveLength(1);
    });

    it('should support partial matches', async () => {
      const { students } = await studentRepository.searchByName('Sha');

      expect(students).toHaveLength(2);
    });
  });

  describe('findAll with filters', () => {
    beforeEach(async () => {
      await studentRepository.create(createTestStudentData({
        studentCode: 'TEST-001',
        status: StudentStatus.ACTIVE,
        gender: Gender.MALE
      }));
      await studentRepository.create(createTestStudentData({
        studentCode: 'TEST-002',
        status: StudentStatus.INACTIVE,
        gender: Gender.FEMALE
      }));
      await studentRepository.create(createTestStudentData({
        studentCode: 'TEST-003',
        status: StudentStatus.ACTIVE,
        gender: Gender.MALE
      }));
    });

    it('should filter by status', async () => {
      const { students } = await studentRepository.findAll({ status: StudentStatus.ACTIVE });

      expect(students).toHaveLength(2);
      students.forEach(s => expect(s.status).toBe(StudentStatus.ACTIVE));
    });

    it('should filter by gender', async () => {
      const { students } = await studentRepository.findAll({ gender: Gender.MALE });

      expect(students).toHaveLength(2);
      students.forEach(s => expect(s.gender).toBe(Gender.MALE));
    });

    it('should support search with filters', async () => {
      const { students } = await studentRepository.findAll({
        status: StudentStatus.ACTIVE,
        search: 'TEST-001'
      });

      expect(students).toHaveLength(1);
      expect(students[0].studentCode).toBe('TEST-001');
    });
  });

  describe('countByStatus', () => {
    beforeEach(async () => {
      await studentRepository.create(createTestStudentData({
        studentCode: 'TEST-001',
        status: StudentStatus.ACTIVE
      }));
      await studentRepository.create(createTestStudentData({
        studentCode: 'TEST-002',
        status: StudentStatus.ACTIVE
      }));
      await studentRepository.create(createTestStudentData({
        studentCode: 'TEST-003',
        status: StudentStatus.INACTIVE
      }));
    });

    it('should count students by status', async () => {
      const activeCount = await studentRepository.countByStatus(StudentStatus.ACTIVE);
      const inactiveCount = await studentRepository.countByStatus(StudentStatus.INACTIVE);

      expect(activeCount).toBe(2);
      expect(inactiveCount).toBe(1);
    });

    it('should count all students when no status provided', async () => {
      const totalCount = await studentRepository.countByStatus();

      expect(totalCount).toBe(3);
    });
  });

  describe('studentCodeExists', () => {
    beforeEach(async () => {
      await studentRepository.create(createTestStudentData({
        studentCode: 'TEST-001'
      }));
    });

    it('should return true for existing student code', async () => {
      const exists = await studentRepository.studentCodeExists('TEST-001');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent student code', async () => {
      const exists = await studentRepository.studentCodeExists('TEST-999');
      expect(exists).toBe(false);
    });

    it('should exclude specific student ID from check', async () => {
      const student = await studentRepository.findByStudentCode('TEST-001');
      expect(student).not.toBeNull();
      if (student) {
        const exists = await studentRepository.studentCodeExists('TEST-001', student.studentId);
        expect(exists).toBe(false);
      }
    });
  });

  describe('updateStatus', () => {
    it('should update student status', async () => {
      const created = await studentRepository.create(createTestStudentData());
      
      const updated = await studentRepository.updateStatus(
        created.studentId, 
        StudentStatus.GRADUATED
      );

      expect(updated).toBeDefined();
      expect(updated?.status).toBe(StudentStatus.GRADUATED);
    });
  });

  describe('transferClass', () => {
    it('should transfer student to new class', async () => {
      const created = await studentRepository.create(createTestStudentData({
        currentClassId: 1,
        rollNumber: 10
      }));
      
      const transferred = await studentRepository.transferClass(
        created.studentId, 
        2, 
        15
      );

      expect(transferred).toBeDefined();
      expect(transferred?.currentClassId).toBe(2);
      expect(transferred?.rollNumber).toBe(15);
    });
  });

  describe('bulkCreate', () => {
    it('should create multiple students', async () => {
      const studentsData = [
        createTestStudentData({ studentCode: 'TEST-001' }),
        createTestStudentData({ studentCode: 'TEST-002' }),
        createTestStudentData({ studentCode: 'TEST-003' })
      ];

      const students = await studentRepository.bulkCreate(studentsData);

      expect(students).toHaveLength(3);
      expect(students[0].studentCode).toBe('TEST-001');
      expect(students[2].studentCode).toBe('TEST-003');
    });
  });
});

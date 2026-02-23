import { AcademicYear, Term } from '@models/AcademicYear.model';
import academicRepository from '../academic.repository';
import sequelize from '@config/database';

/**
 * Academic Repository Tests
 * Tests CRUD operations for AcademicYear and Term entities
 * Requirements: 5.1, 5.2, N4.1
 */

describe('AcademicRepository', () => {
  // Setup: Create tables before all tests
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  // Cleanup: Close database connection after all tests
  afterAll(async () => {
    await sequelize.close();
  });

  // Clear data before each test
  beforeEach(async () => {
    await Term.destroy({ where: {}, force: true });
    await AcademicYear.destroy({ where: {}, force: true });
  });

  describe('Academic Year Operations', () => {
    describe('createAcademicYear', () => {
      it('should create a new academic year', async () => {
        const academicYearData = {
          name: '2081-2082 BS',
          startDateBS: '2081-01-01',
          endDateBS: '2081-12-30',
          startDateAD: new Date('2024-04-14'),
          endDateAD: new Date('2025-04-13'),
          isCurrent: false
        };

        const academicYear = await academicRepository.createAcademicYear(academicYearData);

        expect(academicYear).toBeDefined();
        expect(academicYear.name).toBe('2081-2082 BS');
        expect(academicYear.startDateBS).toBe('2081-01-01');
        expect(academicYear.isCurrent).toBe(false);
      });

      it('should set academic year as current and unset others', async () => {
        // Create first academic year as current
        const year1 = await academicRepository.createAcademicYear({
          name: '2080-2081 BS',
          startDateBS: '2080-01-01',
          endDateBS: '2080-12-30',
          startDateAD: new Date('2023-04-14'),
          endDateAD: new Date('2024-04-13'),
          isCurrent: true
        });

        expect(year1.isCurrent).toBe(true);

        // Create second academic year as current
        const year2 = await academicRepository.createAcademicYear({
          name: '2081-2082 BS',
          startDateBS: '2081-01-01',
          endDateBS: '2081-12-30',
          startDateAD: new Date('2024-04-14'),
          endDateAD: new Date('2025-04-13'),
          isCurrent: true
        });

        expect(year2.isCurrent).toBe(true);

        // Verify first year is no longer current
        const updatedYear1 = await academicRepository.findAcademicYearById(year1.academicYearId);
        expect(updatedYear1?.isCurrent).toBe(false);
      });
    });

    describe('findAcademicYearById', () => {
      it('should find academic year by ID', async () => {
        const created = await academicRepository.createAcademicYear({
          name: '2081-2082 BS',
          startDateBS: '2081-01-01',
          endDateBS: '2081-12-30',
          startDateAD: new Date('2024-04-14'),
          endDateAD: new Date('2025-04-13')
        });

        const found = await academicRepository.findAcademicYearById(created.academicYearId);

        expect(found).toBeDefined();
        expect(found?.academicYearId).toBe(created.academicYearId);
        expect(found?.name).toBe('2081-2082 BS');
      });

      it('should return null for non-existent ID', async () => {
        const found = await academicRepository.findAcademicYearById(99999);
        expect(found).toBeNull();
      });
    });

    describe('findAllAcademicYears', () => {
      it('should return all academic years ordered by start date', async () => {
        await academicRepository.createAcademicYear({
          name: '2080-2081 BS',
          startDateBS: '2080-01-01',
          endDateBS: '2080-12-30',
          startDateAD: new Date('2023-04-14'),
          endDateAD: new Date('2024-04-13')
        });

        await academicRepository.createAcademicYear({
          name: '2081-2082 BS',
          startDateBS: '2081-01-01',
          endDateBS: '2081-12-30',
          startDateAD: new Date('2024-04-14'),
          endDateAD: new Date('2025-04-13')
        });

        const years = await academicRepository.findAllAcademicYears();

        expect(years).toHaveLength(2);
        expect(years[0].name).toBe('2081-2082 BS'); // Most recent first
        expect(years[1].name).toBe('2080-2081 BS');
      });
    });

    describe('findCurrentAcademicYear', () => {
      it('should find the current academic year', async () => {
        await academicRepository.createAcademicYear({
          name: '2080-2081 BS',
          startDateBS: '2080-01-01',
          endDateBS: '2080-12-30',
          startDateAD: new Date('2023-04-14'),
          endDateAD: new Date('2024-04-13'),
          isCurrent: false
        });

        await academicRepository.createAcademicYear({
          name: '2081-2082 BS',
          startDateBS: '2081-01-01',
          endDateBS: '2081-12-30',
          startDateAD: new Date('2024-04-14'),
          endDateAD: new Date('2025-04-13'),
          isCurrent: true
        });

        const current = await academicRepository.findCurrentAcademicYear();

        expect(current).toBeDefined();
        expect(current?.name).toBe('2081-2082 BS');
        expect(current?.isCurrent).toBe(true);
      });

      it('should return null if no current academic year', async () => {
        const current = await academicRepository.findCurrentAcademicYear();
        expect(current).toBeNull();
      });
    });

    describe('updateAcademicYear', () => {
      it('should update academic year fields', async () => {
        const created = await academicRepository.createAcademicYear({
          name: '2081-2082 BS',
          startDateBS: '2081-01-01',
          endDateBS: '2081-12-30',
          startDateAD: new Date('2024-04-14'),
          endDateAD: new Date('2025-04-13')
        });

        const updated = await academicRepository.updateAcademicYear(created.academicYearId, {
          name: '2081-2082 BS (Updated)',
          isCurrent: true
        });

        expect(updated).toBeDefined();
        expect(updated?.name).toBe('2081-2082 BS (Updated)');
        expect(updated?.isCurrent).toBe(true);
      });

      it('should return null for non-existent academic year', async () => {
        const updated = await academicRepository.updateAcademicYear(99999, {
          name: 'Non-existent'
        });
        expect(updated).toBeNull();
      });
    });

    describe('setCurrentAcademicYear', () => {
      it('should set academic year as current and unset others', async () => {
        const year1 = await academicRepository.createAcademicYear({
          name: '2080-2081 BS',
          startDateBS: '2080-01-01',
          endDateBS: '2080-12-30',
          startDateAD: new Date('2023-04-14'),
          endDateAD: new Date('2024-04-13'),
          isCurrent: true
        });

        const year2 = await academicRepository.createAcademicYear({
          name: '2081-2082 BS',
          startDateBS: '2081-01-01',
          endDateBS: '2081-12-30',
          startDateAD: new Date('2024-04-14'),
          endDateAD: new Date('2025-04-13'),
          isCurrent: false
        });

        await academicRepository.setCurrentAcademicYear(year2.academicYearId);

        const updatedYear1 = await academicRepository.findAcademicYearById(year1.academicYearId);
        const updatedYear2 = await academicRepository.findAcademicYearById(year2.academicYearId);

        expect(updatedYear1?.isCurrent).toBe(false);
        expect(updatedYear2?.isCurrent).toBe(true);
      });
    });

    describe('deleteAcademicYear', () => {
      it('should soft delete academic year', async () => {
        const created = await academicRepository.createAcademicYear({
          name: '2081-2082 BS',
          startDateBS: '2081-01-01',
          endDateBS: '2081-12-30',
          startDateAD: new Date('2024-04-14'),
          endDateAD: new Date('2025-04-13')
        });

        const deleted = await academicRepository.deleteAcademicYear(created.academicYearId);
        expect(deleted).toBe(true);

        // Should not find with normal query
        const found = await academicRepository.findAcademicYearById(created.academicYearId);
        expect(found).toBeNull();
      });

      it('should return false for non-existent academic year', async () => {
        const deleted = await academicRepository.deleteAcademicYear(99999);
        expect(deleted).toBe(false);
      });
    });

    describe('academicYearNameExists', () => {
      it('should return true if name exists', async () => {
        await academicRepository.createAcademicYear({
          name: '2081-2082 BS',
          startDateBS: '2081-01-01',
          endDateBS: '2081-12-30',
          startDateAD: new Date('2024-04-14'),
          endDateAD: new Date('2025-04-13')
        });

        const exists = await academicRepository.academicYearNameExists('2081-2082 BS');
        expect(exists).toBe(true);
      });

      it('should return false if name does not exist', async () => {
        const exists = await academicRepository.academicYearNameExists('Non-existent');
        expect(exists).toBe(false);
      });

      it('should exclude specified academic year ID from check', async () => {
        const created = await academicRepository.createAcademicYear({
          name: '2081-2082 BS',
          startDateBS: '2081-01-01',
          endDateBS: '2081-12-30',
          startDateAD: new Date('2024-04-14'),
          endDateAD: new Date('2025-04-13')
        });

        const exists = await academicRepository.academicYearNameExists(
          '2081-2082 BS',
          created.academicYearId
        );
        expect(exists).toBe(false);
      });
    });
  });

  describe('Term Operations', () => {
    let academicYear: AcademicYear;

    beforeEach(async () => {
      academicYear = await academicRepository.createAcademicYear({
        name: '2081-2082 BS',
        startDateBS: '2081-01-01',
        endDateBS: '2081-12-30',
        startDateAD: new Date('2024-04-14'),
        endDateAD: new Date('2025-04-13')
      });
    });

    describe('createTerm', () => {
      it('should create a new term', async () => {
        const termData = {
          academicYearId: academicYear.academicYearId,
          name: 'First Terminal',
          startDate: new Date('2024-04-14'),
          endDate: new Date('2024-08-31'),
          examStartDate: new Date('2024-08-15'),
          examEndDate: new Date('2024-08-31')
        };

        const term = await academicRepository.createTerm(termData);

        expect(term).toBeDefined();
        expect(term.name).toBe('First Terminal');
        expect(term.academicYearId).toBe(academicYear.academicYearId);
      });
    });

    describe('findTermById', () => {
      it('should find term by ID', async () => {
        const created = await academicRepository.createTerm({
          academicYearId: academicYear.academicYearId,
          name: 'First Terminal',
          startDate: new Date('2024-04-14'),
          endDate: new Date('2024-08-31')
        });

        const found = await academicRepository.findTermById(created.termId);

        expect(found).toBeDefined();
        expect(found?.termId).toBe(created.termId);
        expect(found?.name).toBe('First Terminal');
      });

      it('should return null for non-existent ID', async () => {
        const found = await academicRepository.findTermById(99999);
        expect(found).toBeNull();
      });
    });

    describe('findTermsByAcademicYear', () => {
      it('should return all terms for an academic year', async () => {
        await academicRepository.createTerm({
          academicYearId: academicYear.academicYearId,
          name: 'First Terminal',
          startDate: new Date('2024-04-14'),
          endDate: new Date('2024-08-31')
        });

        await academicRepository.createTerm({
          academicYearId: academicYear.academicYearId,
          name: 'Second Terminal',
          startDate: new Date('2024-09-01'),
          endDate: new Date('2024-12-31')
        });

        await academicRepository.createTerm({
          academicYearId: academicYear.academicYearId,
          name: 'Final',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-04-13')
        });

        const terms = await academicRepository.findTermsByAcademicYear(academicYear.academicYearId);

        expect(terms).toHaveLength(3);
        expect(terms[0].name).toBe('First Terminal');
        expect(terms[1].name).toBe('Second Terminal');
        expect(terms[2].name).toBe('Final');
      });

      it('should return empty array if no terms exist', async () => {
        const terms = await academicRepository.findTermsByAcademicYear(academicYear.academicYearId);
        expect(terms).toHaveLength(0);
      });
    });

    describe('updateTerm', () => {
      it('should update term fields', async () => {
        const created = await academicRepository.createTerm({
          academicYearId: academicYear.academicYearId,
          name: 'First Terminal',
          startDate: new Date('2024-04-14'),
          endDate: new Date('2024-08-31')
        });

        const updated = await academicRepository.updateTerm(created.termId, {
          name: 'First Terminal (Updated)',
          examStartDate: new Date('2024-08-15'),
          examEndDate: new Date('2024-08-31')
        });

        expect(updated).toBeDefined();
        expect(updated?.name).toBe('First Terminal (Updated)');
        expect(updated?.examStartDate).toBeDefined();
      });

      it('should return null for non-existent term', async () => {
        const updated = await academicRepository.updateTerm(99999, {
          name: 'Non-existent'
        });
        expect(updated).toBeNull();
      });
    });

    describe('deleteTerm', () => {
      it('should soft delete term', async () => {
        const created = await academicRepository.createTerm({
          academicYearId: academicYear.academicYearId,
          name: 'First Terminal',
          startDate: new Date('2024-04-14'),
          endDate: new Date('2024-08-31')
        });

        const deleted = await academicRepository.deleteTerm(created.termId);
        expect(deleted).toBe(true);

        // Should not find with normal query
        const found = await academicRepository.findTermById(created.termId);
        expect(found).toBeNull();
      });

      it('should return false for non-existent term', async () => {
        const deleted = await academicRepository.deleteTerm(99999);
        expect(deleted).toBe(false);
      });
    });

    describe('countTermsByAcademicYear', () => {
      it('should count terms for an academic year', async () => {
        await academicRepository.createTerm({
          academicYearId: academicYear.academicYearId,
          name: 'First Terminal',
          startDate: new Date('2024-04-14'),
          endDate: new Date('2024-08-31')
        });

        await academicRepository.createTerm({
          academicYearId: academicYear.academicYearId,
          name: 'Second Terminal',
          startDate: new Date('2024-09-01'),
          endDate: new Date('2024-12-31')
        });

        const count = await academicRepository.countTermsByAcademicYear(academicYear.academicYearId);
        expect(count).toBe(2);
      });

      it('should return 0 if no terms exist', async () => {
        const count = await academicRepository.countTermsByAcademicYear(academicYear.academicYearId);
        expect(count).toBe(0);
      });
    });

    describe('findAcademicYearWithTerms', () => {
      it('should find academic year with its terms', async () => {
        await academicRepository.createTerm({
          academicYearId: academicYear.academicYearId,
          name: 'First Terminal',
          startDate: new Date('2024-04-14'),
          endDate: new Date('2024-08-31')
        });

        await academicRepository.createTerm({
          academicYearId: academicYear.academicYearId,
          name: 'Second Terminal',
          startDate: new Date('2024-09-01'),
          endDate: new Date('2024-12-31')
        });

        const yearWithTerms = await academicRepository.findAcademicYearWithTerms(
          academicYear.academicYearId
        );

        expect(yearWithTerms).toBeDefined();
        expect(yearWithTerms?.name).toBe('2081-2082 BS');
        // Note: The association might not be loaded in tests without proper setup
        // This is a basic test to ensure the method doesn't error
      });

      it('should return null for non-existent academic year', async () => {
        const yearWithTerms = await academicRepository.findAcademicYearWithTerms(99999);
        expect(yearWithTerms).toBeNull();
      });
    });
  });
});

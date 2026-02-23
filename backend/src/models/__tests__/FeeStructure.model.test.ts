import { FeeStructure, FeeComponent, FeeComponentType, FeeFrequency } from '../FeeStructure.model';
import { AcademicYear } from '../AcademicYear.model';
import sequelize from '@config/database';

describe('FeeStructure Model', () => {
  let testAcademicYear: AcademicYear;

  beforeAll(async () => {
    await sequelize.authenticate();
    
    // Create a test academic year
    testAcademicYear = await AcademicYear.create({
      name: '2081-2082 BS',
      startDateBS: '2081-01-01',
      endDateBS: '2081-12-30',
      startDateAD: new Date('2024-04-14'),
      endDateAD: new Date('2025-04-13'),
      isCurrent: true
    });
  });

  afterAll(async () => {
    // Clean up test academic year
    await AcademicYear.destroy({ where: {}, force: true });
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await FeeComponent.destroy({ where: {}, force: true });
    await FeeStructure.destroy({ where: {}, force: true });
  });

  describe('Model Creation', () => {
    it('should create a fee structure with valid data', async () => {
      const feeStructure = await FeeStructure.create({
        name: 'Class 1-5 Morning Shift 2081',
        applicableClasses: [1, 2, 3, 4, 5],
        applicableShifts: ['morning'],
        academicYearId: testAcademicYear.academicYearId,
        totalAmount: 50000,
        isActive: true
      });

      expect(feeStructure.feeStructureId).toBeDefined();
      expect(feeStructure.name).toBe('Class 1-5 Morning Shift 2081');
      expect(feeStructure.applicableClasses).toEqual([1, 2, 3, 4, 5]);
      expect(feeStructure.applicableShifts).toEqual(['morning']);
      expect(feeStructure.isActive).toBe(true);
    });

    it('should fail to create fee structure without required fields', async () => {
      await expect(
        FeeStructure.create({
          name: 'Test Structure',
          applicableClasses: [1],
          applicableShifts: ['morning']
          // Missing academicYearId
        } as any)
      ).rejects.toThrow();
    });

    it('should validate applicableClasses is an array', async () => {
      await expect(
        FeeStructure.create({
          name: 'Test Structure',
          applicableClasses: 'not-an-array' as any,
          applicableShifts: ['morning'],
          academicYearId: testAcademicYear.academicYearId
        })
      ).rejects.toThrow('applicableClasses must be an array');
    });

    it('should validate applicableClasses contains valid grade levels', async () => {
      await expect(
        FeeStructure.create({
          name: 'Test Structure',
          applicableClasses: [0, 13], // Invalid grade levels
          applicableShifts: ['morning'],
          academicYearId: testAcademicYear.academicYearId
        })
      ).rejects.toThrow('applicableClasses must contain grade levels between 1 and 12');
    });

    it('should validate applicableShifts is an array', async () => {
      await expect(
        FeeStructure.create({
          name: 'Test Structure',
          applicableClasses: [1],
          applicableShifts: 'not-an-array' as any,
          academicYearId: testAcademicYear.academicYearId
        })
      ).rejects.toThrow('applicableShifts must be an array');
    });

    it('should validate applicableShifts contains valid shift values', async () => {
      await expect(
        FeeStructure.create({
          name: 'Test Structure',
          applicableClasses: [1],
          applicableShifts: ['invalid-shift'],
          academicYearId: testAcademicYear.academicYearId
        })
      ).rejects.toThrow('applicableShifts must contain valid shift values');
    });
  });

  describe('Fee Component Creation', () => {
    let feeStructure: FeeStructure;

    beforeEach(async () => {
      feeStructure = await FeeStructure.create({
        name: 'Test Structure',
        applicableClasses: [1],
        applicableShifts: ['morning'],
        academicYearId: testAcademicYear.academicYearId,
        totalAmount: 0
      });
    });

    it('should create a fee component with valid data', async () => {
      const component = await FeeComponent.create({
        feeStructureId: feeStructure.feeStructureId,
        name: 'Admission Fee',
        type: FeeComponentType.ADMISSION,
        amount: 5000,
        frequency: FeeFrequency.ONE_TIME,
        isMandatory: true
      });

      expect(component.feeComponentId).toBeDefined();
      expect(component.name).toBe('Admission Fee');
      expect(component.type).toBe(FeeComponentType.ADMISSION);
      expect(component.amount).toBe(5000);
      expect(component.frequency).toBe(FeeFrequency.ONE_TIME);
      expect(component.isMandatory).toBe(true);
    });

    it('should fail to create component without required fields', async () => {
      await expect(
        FeeComponent.create({
          feeStructureId: feeStructure.feeStructureId,
          name: 'Test Component',
          type: FeeComponentType.MONTHLY
          // Missing amount and frequency
        } as any)
      ).rejects.toThrow();
    });

    it('should validate amount is non-negative', async () => {
      await expect(
        FeeComponent.create({
          feeStructureId: feeStructure.feeStructureId,
          name: 'Test Component',
          type: FeeComponentType.MONTHLY,
          amount: -100,
          frequency: FeeFrequency.MONTHLY,
          isMandatory: true
        })
      ).rejects.toThrow();
    });

    it('should support all fee component types', async () => {
      const types = Object.values(FeeComponentType);
      
      for (const type of types) {
        const component = await FeeComponent.create({
          feeStructureId: feeStructure.feeStructureId,
          name: `${type} Fee`,
          type,
          amount: 1000,
          frequency: FeeFrequency.ANNUAL,
          isMandatory: true
        });

        expect(component.type).toBe(type);
      }
    });

    it('should support all fee frequencies', async () => {
      const frequencies = Object.values(FeeFrequency);
      
      for (const frequency of frequencies) {
        const component = await FeeComponent.create({
          feeStructureId: feeStructure.feeStructureId,
          name: `${frequency} Fee`,
          type: FeeComponentType.MONTHLY,
          amount: 1000,
          frequency,
          isMandatory: true
        });

        expect(component.frequency).toBe(frequency);
      }
    });
  });

  describe('Model Methods', () => {
    let feeStructure: FeeStructure;

    beforeEach(async () => {
      feeStructure = await FeeStructure.create({
        name: 'Test Structure',
        applicableClasses: [1, 2, 3],
        applicableShifts: ['morning', 'day'],
        academicYearId: testAcademicYear.academicYearId,
        totalAmount: 0
      });

      // Create some components
      await FeeComponent.create({
        feeStructureId: feeStructure.feeStructureId,
        name: 'Admission Fee',
        type: FeeComponentType.ADMISSION,
        amount: 5000,
        frequency: FeeFrequency.ONE_TIME,
        isMandatory: true
      });

      await FeeComponent.create({
        feeStructureId: feeStructure.feeStructureId,
        name: 'Monthly Tuition',
        type: FeeComponentType.MONTHLY,
        amount: 3000,
        frequency: FeeFrequency.MONTHLY,
        isMandatory: true
      });

      await FeeComponent.create({
        feeStructureId: feeStructure.feeStructureId,
        name: 'Transport Fee',
        type: FeeComponentType.TRANSPORT,
        amount: 2000,
        frequency: FeeFrequency.MONTHLY,
        isMandatory: false
      });
    });

    it('should calculate total amount from components', async () => {
      const totalAmount = await feeStructure.calculateTotalAmount();
      expect(totalAmount).toBe(10000); // 5000 + 3000 + 2000
    });

    it('should check if applicable to specific class and shift', () => {
      expect(feeStructure.isApplicableTo(1, 'morning')).toBe(true);
      expect(feeStructure.isApplicableTo(2, 'day')).toBe(true);
      expect(feeStructure.isApplicableTo(4, 'morning')).toBe(false); // Class 4 not in applicableClasses
      expect(feeStructure.isApplicableTo(1, 'evening')).toBe(false); // Evening not in applicableShifts
    });

    it('should get mandatory components', async () => {
      const mandatory = await feeStructure.getMandatoryComponents();
      expect(mandatory).toHaveLength(2);
      expect(mandatory.every(c => c.isMandatory)).toBe(true);
    });

    it('should get optional components', async () => {
      const optional = await feeStructure.getOptionalComponents();
      expect(optional).toHaveLength(1);
      expect(optional.every(c => !c.isMandatory)).toBe(true);
    });
  });

  describe('Associations', () => {
    it('should load fee components with fee structure', async () => {
      const feeStructure = await FeeStructure.create({
        name: 'Test Structure',
        applicableClasses: [1],
        applicableShifts: ['morning'],
        academicYearId: testAcademicYear.academicYearId,
        totalAmount: 0
      });

      await FeeComponent.create({
        feeStructureId: feeStructure.feeStructureId,
        name: 'Test Component',
        type: FeeComponentType.ADMISSION,
        amount: 5000,
        frequency: FeeFrequency.ONE_TIME,
        isMandatory: true
      });

      const loaded = await FeeStructure.findByPk(feeStructure.feeStructureId, {
        include: [{ model: FeeComponent, as: 'feeComponents' }]
      });

      expect(loaded).toBeDefined();
      expect(loaded!.feeComponents).toBeDefined();
      expect(loaded!.feeComponents).toHaveLength(1);
    });
  });

  describe('Soft Delete', () => {
    it('should soft delete fee structure', async () => {
      const feeStructure = await FeeStructure.create({
        name: 'Test Structure',
        applicableClasses: [1],
        applicableShifts: ['morning'],
        academicYearId: testAcademicYear.academicYearId,
        totalAmount: 0
      });

      await feeStructure.destroy();

      // Should not find with normal query
      const found = await FeeStructure.findByPk(feeStructure.feeStructureId);
      expect(found).toBeNull();

      // Should find with paranoid: false
      const foundWithDeleted = await FeeStructure.findByPk(
        feeStructure.feeStructureId,
        { paranoid: false }
      );
      expect(foundWithDeleted).toBeDefined();
      expect(foundWithDeleted!.deletedAt).toBeDefined();
    });
  });
});

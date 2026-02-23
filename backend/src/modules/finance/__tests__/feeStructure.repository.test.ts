import feeStructureRepository from '../feeStructure.repository';
import { FeeStructure, FeeComponent, FeeComponentType, FeeFrequency } from '@models/FeeStructure.model';
import { AcademicYear } from '@models/AcademicYear.model';
import sequelize from '@config/database';

describe('FeeStructure Repository', () => {
  let testAcademicYear: AcademicYear;
  let testAcademicYear2: AcademicYear;

  beforeAll(async () => {
    await sequelize.authenticate();
    
    // Create test academic years
    testAcademicYear = await AcademicYear.create({
      name: '2081-2082 BS',
      startDateBS: '2081-01-01',
      endDateBS: '2081-12-30',
      startDateAD: new Date('2024-04-14'),
      endDateAD: new Date('2025-04-13'),
      isCurrent: true
    });

    testAcademicYear2 = await AcademicYear.create({
      name: '2082-2083 BS',
      startDateBS: '2082-01-01',
      endDateBS: '2082-12-30',
      startDateAD: new Date('2025-04-14'),
      endDateAD: new Date('2026-04-13'),
      isCurrent: false
    });
  });

  afterAll(async () => {
    // Clean up test academic years
    await AcademicYear.destroy({ where: {}, force: true });
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up test data
    await FeeComponent.destroy({ where: {}, force: true });
    await FeeStructure.destroy({ where: {}, force: true });
  });

  describe('create', () => {
    it('should create fee structure with components', async () => {
      const data = {
        name: 'Class 1-5 Morning Shift 2081',
        applicableClasses: [1, 2, 3, 4, 5],
        applicableShifts: ['morning'],
        academicYearId: testAcademicYear.academicYearId,
        description: 'Fee structure for primary classes',
        feeComponents: [
          {
            name: 'Admission Fee',
            type: FeeComponentType.ADMISSION,
            amount: 5000,
            frequency: FeeFrequency.ONE_TIME,
            isMandatory: true
          },
          {
            name: 'Monthly Tuition',
            type: FeeComponentType.MONTHLY,
            amount: 3000,
            frequency: FeeFrequency.MONTHLY,
            isMandatory: true
          }
        ]
      };

      const feeStructure = await feeStructureRepository.create(data);

      expect(feeStructure.feeStructureId).toBeDefined();
      expect(feeStructure.name).toBe(data.name);
      expect(feeStructure.applicableClasses).toEqual(data.applicableClasses);
      expect(feeStructure.feeComponents).toHaveLength(2);
      expect(Number(feeStructure.totalAmount)).toBe(8000); // 5000 + 3000
    });

    it('should create fee structure without components', async () => {
      const data = {
        name: 'Test Structure',
        applicableClasses: [1],
        applicableShifts: ['morning'],
        academicYearId: testAcademicYear.academicYearId,
        feeComponents: []
      };

      const feeStructure = await feeStructureRepository.create(data);

      expect(feeStructure.feeStructureId).toBeDefined();
      expect(Number(feeStructure.totalAmount)).toBe(0);
    });
  });

  describe('findById', () => {
    it('should find fee structure by id with components', async () => {
      const created = await feeStructureRepository.create({
        name: 'Test Structure',
        applicableClasses: [1],
        applicableShifts: ['morning'],
        academicYearId: testAcademicYear.academicYearId,
        feeComponents: [
          {
            name: 'Test Component',
            type: FeeComponentType.ADMISSION,
            amount: 5000,
            frequency: FeeFrequency.ONE_TIME,
            isMandatory: true
          }
        ]
      });

      const found = await feeStructureRepository.findById(created.feeStructureId);

      expect(found).toBeDefined();
      expect(found!.feeStructureId).toBe(created.feeStructureId);
      expect(found!.feeComponents).toHaveLength(1);
    });

    it('should return null for non-existent id', async () => {
      const found = await feeStructureRepository.findById(99999);
      expect(found).toBeNull();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      // Create test data
      await feeStructureRepository.create({
        name: 'Structure 1',
        applicableClasses: [1, 2],
        applicableShifts: ['morning'],
        academicYearId: testAcademicYear.academicYearId,
        feeComponents: []
      });

      await feeStructureRepository.create({
        name: 'Structure 2',
        applicableClasses: [3, 4],
        applicableShifts: ['day'],
        academicYearId: testAcademicYear.academicYearId,
        feeComponents: []
      });

      await feeStructureRepository.create({
        name: 'Structure 3',
        applicableClasses: [5, 6],
        applicableShifts: ['morning'],
        academicYearId: testAcademicYear2.academicYearId,
        feeComponents: []
      });
    });

    it('should find all fee structures', async () => {
      const structures = await feeStructureRepository.findAll();
      expect(structures.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by academic year', async () => {
      const structures = await feeStructureRepository.findAll({ academicYearId: testAcademicYear.academicYearId });
      expect(structures).toHaveLength(2);
      expect(structures.every(s => s.academicYearId === testAcademicYear.academicYearId)).toBe(true);
    });

    it('should filter by active status', async () => {
      // Deactivate one structure
      const all = await feeStructureRepository.findAll();
      await feeStructureRepository.deactivate(all[0].feeStructureId);

      const active = await feeStructureRepository.findAll({ isActive: true });
      expect(active.length).toBe(2);
      expect(active.every(s => s.isActive)).toBe(true);
    });

    it('should filter by grade level', async () => {
      const structures = await feeStructureRepository.findAll({ gradeLevel: 1 });
      expect(structures).toHaveLength(1);
      expect(structures[0].applicableClasses).toContain(1);
    });

    it('should filter by shift', async () => {
      const structures = await feeStructureRepository.findAll({ shift: 'morning' });
      expect(structures).toHaveLength(2);
      expect(structures.every(s => s.applicableShifts.includes('morning'))).toBe(true);
    });
  });

  describe('findApplicable', () => {
    beforeEach(async () => {
      await feeStructureRepository.create({
        name: 'Class 1-3 Morning',
        applicableClasses: [1, 2, 3],
        applicableShifts: ['morning'],
        academicYearId: testAcademicYear.academicYearId,
        feeComponents: []
      });

      await feeStructureRepository.create({
        name: 'Class 1-3 Day',
        applicableClasses: [1, 2, 3],
        applicableShifts: ['day'],
        academicYearId: testAcademicYear.academicYearId,
        feeComponents: []
      });

      await feeStructureRepository.create({
        name: 'Class 4-6 Morning',
        applicableClasses: [4, 5, 6],
        applicableShifts: ['morning'],
        academicYearId: testAcademicYear.academicYearId,
        feeComponents: []
      });
    });

    it('should find applicable fee structures', async () => {
      const structures = await feeStructureRepository.findApplicable(1, 'morning', 1);
      expect(structures).toHaveLength(1);
      expect(structures[0].name).toBe('Class 1-3 Morning');
    });

    it('should return empty array when no match', async () => {
      const structures = await feeStructureRepository.findApplicable(10, 'evening', 1);
      expect(structures).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update fee structure', async () => {
      const created = await feeStructureRepository.create({
        name: 'Original Name',
        applicableClasses: [1],
        applicableShifts: ['morning'],
        academicYearId: testAcademicYear.academicYearId,
        feeComponents: []
      });

      const updated = await feeStructureRepository.update(created.feeStructureId, {
        name: 'Updated Name',
        isActive: false
      });

      expect(updated).toBeDefined();
      expect(updated!.name).toBe('Updated Name');
      expect(updated!.isActive).toBe(false);
    });

    it('should return null for non-existent id', async () => {
      const updated = await feeStructureRepository.update(99999, { name: 'Test' });
      expect(updated).toBeNull();
    });
  });

  describe('delete', () => {
    it('should soft delete fee structure', async () => {
      const created = await feeStructureRepository.create({
        name: 'Test Structure',
        applicableClasses: [1],
        applicableShifts: ['morning'],
        academicYearId: testAcademicYear.academicYearId,
        feeComponents: []
      });

      const deleted = await feeStructureRepository.delete(created.feeStructureId);
      expect(deleted).toBe(true);

      const found = await feeStructureRepository.findById(created.feeStructureId);
      expect(found).toBeNull();
    });

    it('should return false for non-existent id', async () => {
      const deleted = await feeStructureRepository.delete(99999);
      expect(deleted).toBe(false);
    });
  });

  describe('Component Management', () => {
    let feeStructure: FeeStructure;

    beforeEach(async () => {
      feeStructure = await feeStructureRepository.create({
        name: 'Test Structure',
        applicableClasses: [1],
        applicableShifts: ['morning'],
        academicYearId: testAcademicYear.academicYearId,
        feeComponents: [
          {
            name: 'Initial Component',
            type: FeeComponentType.ADMISSION,
            amount: 5000,
            frequency: FeeFrequency.ONE_TIME,
            isMandatory: true
          }
        ]
      });
    });

    it('should add component to structure', async () => {
      const component = await feeStructureRepository.addComponent(
        feeStructure.feeStructureId,
        {
          name: 'New Component',
          type: FeeComponentType.MONTHLY,
          amount: 3000,
          frequency: FeeFrequency.MONTHLY,
          isMandatory: true
        }
      );

      expect(component).toBeDefined();
      expect(component!.name).toBe('New Component');

      // Check total amount updated
      const updated = await feeStructureRepository.findById(feeStructure.feeStructureId);
      expect(Number(updated!.totalAmount)).toBe(8000); // 5000 + 3000
    });

    it('should update component', async () => {
      const components = await feeStructureRepository.getComponents(feeStructure.feeStructureId);
      const componentId = components[0].feeComponentId;

      const updated = await feeStructureRepository.updateComponent(componentId, {
        amount: 6000
      });

      expect(updated).toBeDefined();
      expect(Number(updated!.amount)).toBe(6000);

      // Check total amount updated
      const structure = await feeStructureRepository.findById(feeStructure.feeStructureId);
      expect(Number(structure!.totalAmount)).toBe(6000);
    });

    it('should remove component', async () => {
      const components = await feeStructureRepository.getComponents(feeStructure.feeStructureId);
      const componentId = components[0].feeComponentId;

      const removed = await feeStructureRepository.removeComponent(componentId);
      expect(removed).toBe(true);

      // Check total amount updated
      const structure = await feeStructureRepository.findById(feeStructure.feeStructureId);
      expect(Number(structure!.totalAmount)).toBe(0);
    });

    it('should get mandatory components', async () => {
      await feeStructureRepository.addComponent(feeStructure.feeStructureId, {
        name: 'Optional Component',
        type: FeeComponentType.TRANSPORT,
        amount: 2000,
        frequency: FeeFrequency.MONTHLY,
        isMandatory: false
      });

      const mandatory = await feeStructureRepository.getMandatoryComponents(
        feeStructure.feeStructureId
      );
      expect(mandatory).toHaveLength(1);
      expect(mandatory.every(c => c.isMandatory)).toBe(true);
    });

    it('should get optional components', async () => {
      await feeStructureRepository.addComponent(feeStructure.feeStructureId, {
        name: 'Optional Component',
        type: FeeComponentType.TRANSPORT,
        amount: 2000,
        frequency: FeeFrequency.MONTHLY,
        isMandatory: false
      });

      const optional = await feeStructureRepository.getOptionalComponents(
        feeStructure.feeStructureId
      );
      expect(optional).toHaveLength(1);
      expect(optional.every(c => !c.isMandatory)).toBe(true);
    });
  });

  describe('Activation', () => {
    it('should activate fee structure', async () => {
      const created = await feeStructureRepository.create({
        name: 'Test Structure',
        applicableClasses: [1],
        applicableShifts: ['morning'],
        academicYearId: testAcademicYear.academicYearId,
        feeComponents: []
      });

      await feeStructureRepository.deactivate(created.feeStructureId);
      const activated = await feeStructureRepository.activate(created.feeStructureId);

      expect(activated).toBeDefined();
      expect(activated!.isActive).toBe(true);
    });

    it('should deactivate fee structure', async () => {
      const created = await feeStructureRepository.create({
        name: 'Test Structure',
        applicableClasses: [1],
        applicableShifts: ['morning'],
        academicYearId: testAcademicYear.academicYearId,
        feeComponents: []
      });

      const deactivated = await feeStructureRepository.deactivate(created.feeStructureId);

      expect(deactivated).toBeDefined();
      expect(deactivated!.isActive).toBe(false);
    });
  });

  describe('exists', () => {
    beforeEach(async () => {
      await feeStructureRepository.create({
        name: 'Test Structure',
        applicableClasses: [1, 2, 3],
        applicableShifts: ['morning'],
        academicYearId: testAcademicYear.academicYearId,
        feeComponents: []
      });
    });

    it('should return true when fee structure exists', async () => {
      const exists = await feeStructureRepository.exists(1, 1, 'morning');
      expect(exists).toBe(true);
    });

    it('should return false when fee structure does not exist', async () => {
      const exists = await feeStructureRepository.exists(1, 10, 'morning');
      expect(exists).toBe(false);
    });
  });
});


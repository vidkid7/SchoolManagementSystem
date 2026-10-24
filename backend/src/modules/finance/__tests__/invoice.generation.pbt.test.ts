/**
 * Property-Based Tests for Invoice Generation
 * 
 * Uses fast-check to verify universal properties of invoice generation
 * across a large number of randomly generated test cases.
 * 
 * Task: 16.3 Write property test for invoice generation
 * Property 21: Invoice Generation Completeness
 * Validates: Requirements 9.3
 */

import * as fc from 'fast-check';
import invoiceService from '../invoice.service';
import { Invoice } from '@models/Invoice.model';
import { FeeStructure, FeeComponent, FeeComponentType, FeeFrequency } from '@models/FeeStructure.model';
import { AcademicYear } from '@models/AcademicYear.model';
import Student, { Gender, StudentStatus } from '@models/Student.model';
import sequelize from '@config/database';

describe('Invoice Generation - Property-Based Tests', () => {
  let academicYears: Map<number, AcademicYear>;

  beforeAll(async () => {
    if (sequelize.getDialect() !== 'sqlite') {
      throw new Error('Invoice generation property tests require TEST_DB_DIALECT=sqlite');
    }
    await sequelize.sync({ force: true });

    await Student.create({
      studentCode: 'QA-INVOICE-GENERATION-1',
      firstNameEn: 'InvoiceGeneration',
      lastNameEn: 'Test',
      dateOfBirthBS: '2065-01-01',
      dateOfBirthAD: new Date('2008-04-13'),
      gender: Gender.OTHER,
      addressEn: 'Test address',
      fatherName: 'Test Father',
      fatherPhone: '9800000000',
      motherName: 'Test Mother',
      motherPhone: '9800000001',
      admissionDate: new Date('2026-04-14'),
      admissionClass: 1,
      emergencyContact: '9800000002',
      status: StudentStatus.ACTIVE
    });

    // Create test academic years (1-10)
    academicYears = new Map();
    for (let i = 1; i <= 10; i++) {
      const yearBS = 2080 + i;
      const academicYear = await AcademicYear.create({
        name: `${yearBS}-${yearBS + 1} BS`,
        startDateBS: `${yearBS}-01-01`,
        endDateBS: `${yearBS}-12-30`,
        startDateAD: new Date(2024 + i, 3, 14),
        endDateAD: new Date(2025 + i, 3, 13),
        isCurrent: i === 1
      });
      academicYears.set(i, academicYear);
    }
  });

  afterAll(async () => {
    await Invoice.destroy({ where: { studentId: 1 }, force: true });
    await FeeComponent.destroy({ where: {}, force: true });
    await FeeStructure.destroy({ where: {}, force: true });
    await AcademicYear.destroy({ where: {}, force: true });
    await Student.destroy({ where: { studentId: 1 }, force: true });
    await sequelize.close();
  });

  afterEach(async () => {
    // Clean up after each test in correct order (children first, then parents)
    try {
      await Invoice.destroy({ where: { studentId: 1 }, force: true });
      await FeeComponent.destroy({ where: {}, force: true });
      await FeeStructure.destroy({ where: {}, force: true });
    } catch (error) {
      // Ignore cleanup errors
      console.log('Cleanup warning:', error);
    }
  });

  describe('Property 21: Invoice Generation Completeness', () => {
    /**
     * **Validates: Requirements 9.3**
     * 
     * Property: For any student assigned a fee structure, the generated invoice
     * should contain all fee components from that structure with their respective
     * amounts, and the calculations should be correct:
     * 
     * 1. Invoice items should match all fee components
     * 2. Subtotal should equal sum of all component amounts
     * 3. Total amount should equal subtotal minus discount
     * 4. Balance should equal total amount minus paid amount
     * 5. Initially, paid_amount should be 0 and balance should equal total_amount
     * 
     * This test runs 100+ iterations with random fee structures to verify
     * that invoice generation is always complete and correct.
     */
    it('should generate complete invoices with all fee components and correct totals', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random fee structure configuration
          fc.record({
            // Number of fee components (1-10)
            numComponents: fc.integer({ min: 1, max: 10 }),
            // Student ID
            studentId: fc.constant(1),
            // Academic year ID
            academicYearId: fc.integer({ min: 1, max: 10 }),
            // Discount amount (0-50% of total)
            discountPercentage: fc.integer({ min: 0, max: 50 }),
          }),
          async ({ numComponents, studentId, academicYearId, discountPercentage }) => {
            // Create fee structure
            const feeStructure = await FeeStructure.create({
              name: `Test Fee Structure ${studentId}`,
              applicableClasses: [1, 2, 3],
              applicableShifts: ['morning'],
              academicYearId,
              totalAmount: 0, // Will be calculated
              isActive: true,
            });

            // Generate random fee components
            const componentAmounts: number[] = [];
            const feeTypes = Object.values(FeeComponentType);
            
            for (let i = 0; i < numComponents; i++) {
              // Generate random amount between 100 and 10000
              const amount = Math.floor(Math.random() * 9900) + 100;
              componentAmounts.push(amount);

              await FeeComponent.create({
                feeStructureId: feeStructure.feeStructureId,
                name: `Fee Component ${i + 1}`,
                type: feeTypes[i % feeTypes.length],
                amount,
                frequency: FeeFrequency.ANNUAL,
                isMandatory: true,
              });
            }

            // Calculate expected subtotal
            const expectedSubtotal = componentAmounts.reduce((sum, amount) => sum + amount, 0);

            // Calculate discount
            const discountAmount = Math.floor((expectedSubtotal * discountPercentage) / 100);

            // Generate invoice
            const invoice = await invoiceService.generateInvoice({
              studentId,
              feeStructureId: feeStructure.feeStructureId,
              academicYearId,
              dueDate: '2027-03-01',
              discount: discountAmount,
              discountReason: discountAmount > 0 ? 'Test discount' : undefined,
            });

            // Reload invoice with items
            const reloadedInvoice = await Invoice.findByPk(invoice.invoiceId, {
              include: ['invoiceItems'],
            });

            expect(reloadedInvoice).toBeDefined();

            // Property 1: Invoice should contain all fee components
            expect(reloadedInvoice!.invoiceItems).toHaveLength(numComponents);

            // Property 2: Subtotal should equal sum of all component amounts
            const actualSubtotal = Number(reloadedInvoice!.subtotal);
            expect(actualSubtotal).toBe(expectedSubtotal);

            // Verify each invoice item matches a fee component
            const invoiceItemAmounts = reloadedInvoice!.invoiceItems!
              .map(item => Number(item.amount))
              .sort((a, b) => a - b);
            const sortedComponentAmounts = [...componentAmounts].sort((a, b) => a - b);
            
            expect(invoiceItemAmounts).toEqual(sortedComponentAmounts);

            // Property 3: Total amount should equal subtotal minus discount
            const expectedTotalAmount = expectedSubtotal - discountAmount;
            const actualTotalAmount = Number(reloadedInvoice!.totalAmount);
            expect(actualTotalAmount).toBe(expectedTotalAmount);

            // Property 4: Discount should be correctly applied
            const actualDiscount = Number(reloadedInvoice!.discount);
            expect(actualDiscount).toBe(discountAmount);

            // Property 5: Initially, paid_amount should be 0
            const actualPaidAmount = Number(reloadedInvoice!.paidAmount);
            expect(actualPaidAmount).toBe(0);

            // Property 6: Balance should equal total_amount - paid_amount
            const expectedBalance = expectedTotalAmount - actualPaidAmount;
            const actualBalance = Number(reloadedInvoice!.balance);
            expect(actualBalance).toBe(expectedBalance);

            // Property 7: Initially, balance should equal total_amount (since paid_amount = 0)
            expect(actualBalance).toBe(actualTotalAmount);

            // Property 8: Invoice should have a valid invoice number
            expect(reloadedInvoice!.invoiceNumber).toMatch(/^INV-\d+-\d+$/);

            // Property 9: Invoice status should be 'pending' initially
            expect(reloadedInvoice!.status).toBe('pending');
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    }, 60000); // 60 second timeout for database operations

    /**
     * Property: Invoice generation should be idempotent
     * 
     * Attempting to generate the same invoice twice should fail,
     * preventing duplicate invoices for the same student and fee structure.
     */
    it('should prevent duplicate invoice generation (idempotency)', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            studentId: fc.constant(1),
            academicYearId: fc.integer({ min: 1, max: 10 }),
          }),
          async ({ studentId, academicYearId }) => {
            // Create fee structure
            const feeStructure = await FeeStructure.create({
              name: `Test Fee Structure ${studentId}`,
              applicableClasses: [1],
              applicableShifts: ['morning'],
              academicYearId,
              totalAmount: 5000,
              isActive: true,
            });

            // Create fee component
            await FeeComponent.create({
              feeStructureId: feeStructure.feeStructureId,
              name: 'Tuition Fee',
              type: FeeComponentType.ANNUAL,
              amount: 5000,
              frequency: FeeFrequency.ANNUAL,
              isMandatory: true,
            });

            // Generate first invoice - should succeed
            const invoice1 = await invoiceService.generateInvoice({
              studentId,
              feeStructureId: feeStructure.feeStructureId,
              academicYearId,
              dueDate: '2027-03-01',
            });

            expect(invoice1).toBeDefined();

            // Attempt to generate second invoice - should fail
            await expect(
              invoiceService.generateInvoice({
                studentId,
                feeStructureId: feeStructure.feeStructureId,
                academicYearId,
                dueDate: '2027-03-01',
              })
            ).rejects.toThrow('Invoice already exists for this student and fee structure');
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    }, 60000);

    /**
     * Property: Invoice calculations should be consistent with model methods
     * 
     * The invoice's calculateBalance() method should always return
     * the same value as the stored balance field.
     */
    it('should have consistent balance calculations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            studentId: fc.constant(1),
            academicYearId: fc.integer({ min: 1, max: 10 }),
            componentAmount: fc.integer({ min: 100, max: 50000 }),
            discount: fc.integer({ min: 0, max: 10000 }),
          }),
          async ({ studentId, academicYearId, componentAmount, discount }) => {
            // Create fee structure
            const feeStructure = await FeeStructure.create({
              name: `Test Fee Structure ${studentId}`,
              applicableClasses: [1],
              applicableShifts: ['morning'],
              academicYearId,
              totalAmount: componentAmount,
              isActive: true,
            });

            // Create fee component
            await FeeComponent.create({
              feeStructureId: feeStructure.feeStructureId,
              name: 'Tuition Fee',
              type: FeeComponentType.ANNUAL,
              amount: componentAmount,
              frequency: FeeFrequency.ANNUAL,
              isMandatory: true,
            });

            // Ensure discount doesn't exceed component amount
            const validDiscount = Math.min(discount, componentAmount);

            // Generate invoice
            const invoice = await invoiceService.generateInvoice({
              studentId,
              feeStructureId: feeStructure.feeStructureId,
              academicYearId,
              dueDate: '2027-03-01',
              discount: validDiscount,
            });

            // Property: calculateBalance() should match stored balance
            const calculatedBalance = invoice.calculateBalance();
            const storedBalance = Number(invoice.balance);
            expect(calculatedBalance).toBe(storedBalance);

            // Property: Balance should equal totalAmount - paidAmount
            const totalAmount = Number(invoice.totalAmount);
            const paidAmount = Number(invoice.paidAmount);
            expect(calculatedBalance).toBe(totalAmount - paidAmount);
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    }, 60000);

    /**
     * Property: Invoice with zero discount should have subtotal equal to total
     * 
     * When no discount is applied, subtotal and totalAmount should be equal.
     */
    it('should have subtotal equal to total when no discount is applied', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            studentId: fc.constant(1),
            academicYearId: fc.integer({ min: 1, max: 10 }),
            numComponents: fc.integer({ min: 1, max: 5 }),
          }),
          async ({ studentId, academicYearId, numComponents }) => {
            // Create fee structure
            const feeStructure = await FeeStructure.create({
              name: `Test Fee Structure ${studentId}`,
              applicableClasses: [1],
              applicableShifts: ['morning'],
              academicYearId,
              totalAmount: 0,
              isActive: true,
            });

            // Create fee components
            let expectedTotal = 0;
            for (let i = 0; i < numComponents; i++) {
              const amount = Math.floor(Math.random() * 5000) + 100;
              expectedTotal += amount;

              await FeeComponent.create({
                feeStructureId: feeStructure.feeStructureId,
                name: `Component ${i + 1}`,
                type: FeeComponentType.ANNUAL,
                amount,
                frequency: FeeFrequency.ANNUAL,
                isMandatory: true,
              });
            }

            // Generate invoice without discount
            const invoice = await invoiceService.generateInvoice({
              studentId,
              feeStructureId: feeStructure.feeStructureId,
              academicYearId,
              dueDate: '2027-03-01',
            });

            // Property: Subtotal should equal total amount when no discount
            const subtotal = Number(invoice.subtotal);
            const totalAmount = Number(invoice.totalAmount);
            expect(subtotal).toBe(totalAmount);
            expect(subtotal).toBe(expectedTotal);

            // Property: Discount should be 0
            expect(Number(invoice.discount)).toBe(0);
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    }, 60000);

    /**
     * Property: Invoice items should preserve fee component information
     * 
     * Each invoice item should correctly reference its source fee component
     * and preserve the description and amount.
     */
    it('should preserve fee component information in invoice items', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            studentId: fc.constant(1),
            academicYearId: fc.integer({ min: 1, max: 10 }),
            numComponents: fc.integer({ min: 1, max: 8 }),
          }),
          async ({ studentId, academicYearId, numComponents }) => {
            // Create fee structure
            const feeStructure = await FeeStructure.create({
              name: `Test Fee Structure ${studentId}`,
              applicableClasses: [1],
              applicableShifts: ['morning'],
              academicYearId,
              totalAmount: 0,
              isActive: true,
            });

            // Create fee components and track them
            const createdComponents: Array<{ id: number; name: string; amount: number }> = [];
            
            for (let i = 0; i < numComponents; i++) {
              const amount = Math.floor(Math.random() * 5000) + 100;
              const name = `Component ${i + 1}`;

              const component = await FeeComponent.create({
                feeStructureId: feeStructure.feeStructureId,
                name,
                type: FeeComponentType.ANNUAL,
                amount,
                frequency: FeeFrequency.ANNUAL,
                isMandatory: true,
              });

              createdComponents.push({
                id: component.feeComponentId,
                name,
                amount,
              });
            }

            // Generate invoice
            const invoice = await invoiceService.generateInvoice({
              studentId,
              feeStructureId: feeStructure.feeStructureId,
              academicYearId,
              dueDate: '2027-03-01',
            });

            // Reload with items
            const reloadedInvoice = await Invoice.findByPk(invoice.invoiceId, {
              include: ['invoiceItems'],
            });

            // Property: Each invoice item should reference a fee component
            for (const item of reloadedInvoice!.invoiceItems!) {
              const matchingComponent = createdComponents.find(
                c => c.id === item.feeComponentId
              );

              expect(matchingComponent).toBeDefined();
              expect(item.description).toBe(matchingComponent!.name);
              expect(Number(item.amount)).toBe(matchingComponent!.amount);
            }

            // Property: All fee components should have corresponding invoice items
            expect(reloadedInvoice!.invoiceItems).toHaveLength(createdComponents.length);
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    }, 60000);

    /**
     * Property: Discount should never exceed subtotal
     * 
     * The discount amount should always be less than or equal to the subtotal.
     */
    it('should reject discounts that exceed subtotal', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            studentId: fc.constant(1),
            academicYearId: fc.integer({ min: 1, max: 10 }),
            componentAmount: fc.integer({ min: 100, max: 10000 }),
            excessDiscount: fc.integer({ min: 1, max: 10000 }),
          }),
          async ({ studentId, academicYearId, componentAmount, excessDiscount }) => {
            // Create fee structure
            const feeStructure = await FeeStructure.create({
              name: `Test Fee Structure ${studentId}`,
              applicableClasses: [1],
              applicableShifts: ['morning'],
              academicYearId,
              totalAmount: componentAmount,
              isActive: true,
            });

            // Create fee component
            await FeeComponent.create({
              feeStructureId: feeStructure.feeStructureId,
              name: 'Tuition Fee',
              type: FeeComponentType.ANNUAL,
              amount: componentAmount,
              frequency: FeeFrequency.ANNUAL,
              isMandatory: true,
            });

            // Calculate discount that exceeds subtotal
            const invalidDiscount = componentAmount + excessDiscount;

            // Attempt to generate invoice with excessive discount - should fail
            await expect(
              invoiceService.generateInvoice({
                studentId,
                feeStructureId: feeStructure.feeStructureId,
                academicYearId,
                dueDate: '2027-03-01',
                discount: invalidDiscount,
              })
            ).rejects.toThrow();
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    }, 60000);

    /**
     * Property: Multiple invoices for same student should have unique invoice numbers
     * 
     * Each generated invoice should have a unique invoice number,
     * even for the same student with different fee structures.
     */
    it('should generate unique invoice numbers for multiple invoices', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            studentId: fc.constant(1),
            numInvoices: fc.integer({ min: 2, max: 5 }),
          }),
          async ({ studentId, numInvoices }) => {
            const invoiceNumbers = new Set<string>();

            // Generate multiple invoices for the same student
            for (let i = 0; i < numInvoices; i++) {
              // Create unique fee structure for each invoice
              const feeStructure = await FeeStructure.create({
                name: `Fee Structure ${i + 1}`,
                applicableClasses: [1],
                applicableShifts: ['morning'],
                academicYearId: i + 1, // Different academic year
                totalAmount: 5000,
                isActive: true,
              });

              await FeeComponent.create({
                feeStructureId: feeStructure.feeStructureId,
                name: 'Tuition Fee',
                type: FeeComponentType.ANNUAL,
                amount: 5000,
                frequency: FeeFrequency.ANNUAL,
                isMandatory: true,
              });

              const invoice = await invoiceService.generateInvoice({
                studentId,
                feeStructureId: feeStructure.feeStructureId,
                academicYearId: i + 1,
                dueDate: '2027-03-01',
              });

              invoiceNumbers.add(invoice.invoiceNumber);
            }

            // Property: All invoice numbers should be unique
            expect(invoiceNumbers.size).toBe(numInvoices);
          }
        ),
        {
          numRuns: 30,
          verbose: true,
        }
      );
    }, 60000);
  });
});

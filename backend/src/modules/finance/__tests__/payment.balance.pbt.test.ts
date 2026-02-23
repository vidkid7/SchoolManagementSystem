/**
 * Property-Based Tests for Payment Balance Invariant
 * 
 * Uses fast-check to verify that the payment balance invariant holds
 * across a large number of randomly generated payment scenarios.
 * 
 * Task: 16.5 Write property test for payment balance invariant
 * Property 22: Payment Balance Invariant
 * Validates: Requirements 9.8
 */

import * as fc from 'fast-check';
import paymentService from '../payment.service';
import invoiceService from '../invoice.service';
import { Invoice, InvoiceStatus } from '@models/Invoice.model';
import { Payment, PaymentMethod, PaymentStatus } from '@models/Payment.model';
import { FeeStructure, FeeComponent, FeeComponentType, FeeFrequency } from '@models/FeeStructure.model';
import { AcademicYear } from '@models/AcademicYear.model';
import sequelize from '@config/database';

describe('Payment Balance Invariant - Property-Based Tests', () => {
  let academicYear: AcademicYear;
  let testUserId: number;

  /**
   * Helper function to create a fee structure with guaranteed isActive = true
   */
  async function createActiveFeeStructure(params: {
    name: string;
    applicableClasses: number[];
    applicableShifts: string[];
    academicYearId: number;
    totalAmount: number;
  }): Promise<FeeStructure> {
    const feeStructure = await FeeStructure.create({
      ...params,
      isActive: true,
    });
    
    // Verify it was created correctly
    const reloaded = await FeeStructure.findByPk(feeStructure.feeStructureId);
    if (!reloaded || !reloaded.isActive) {
      // If not active, update it
      await FeeStructure.update(
        { isActive: true },
        { where: { feeStructureId: feeStructure.feeStructureId } }
      );
      return (await FeeStructure.findByPk(feeStructure.feeStructureId))!;
    }
    return reloaded;
  }

  beforeAll(async () => {
    // Ensure tables exist
    try {
      await AcademicYear.sync();
      await FeeStructure.sync();
      await FeeComponent.sync();
      await Invoice.sync();
      await Payment.sync();
      
      // Ensure invoice_items table exists
      await sequelize.query('SELECT 1 FROM invoice_items LIMIT 1').catch(async () => {
        await sequelize.query(`
          CREATE TABLE IF NOT EXISTS invoice_items (
            invoice_item_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            invoice_id INT UNSIGNED NOT NULL,
            fee_component_id INT UNSIGNED NOT NULL,
            description VARCHAR(255) NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
            FOREIGN KEY (fee_component_id) REFERENCES fee_components(fee_component_id),
            INDEX idx_invoice_items_invoice (invoice_id),
            INDEX idx_invoice_items_fee_component (fee_component_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);
      });
    } catch (error) {
      console.log('Table sync warning:', error);
    }

    // Clean up existing test data
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      await Payment.destroy({ where: {}, force: true });
      await Invoice.destroy({ where: {}, force: true });
      await FeeComponent.destroy({ where: {}, force: true });
      await FeeStructure.destroy({ where: {}, force: true });
      await AcademicYear.destroy({ where: {}, force: true });
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (error) {
      console.log('Cleanup warning:', error);
    }

    // Create test academic year
    academicYear = await AcademicYear.create({
      name: '2081-2082 BS',
      startDateBS: '2081-01-01',
      endDateBS: '2081-12-30',
      startDateAD: new Date('2024-04-14'),
      endDateAD: new Date('2025-04-13'),
      isCurrent: true
    });

    // Use a fixed user ID for testing
    testUserId = 1;
  });

  afterAll(async () => {
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await Payment.destroy({ where: {}, force: true });
    await Invoice.destroy({ where: {}, force: true });
    await FeeComponent.destroy({ where: {}, force: true });
    await FeeStructure.destroy({ where: {}, force: true });
    await AcademicYear.destroy({ where: {}, force: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    await sequelize.close();
  });

  afterEach(async () => {
    // Clean up after each test
    try {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
      await Payment.destroy({ where: {}, force: true });
      await Invoice.destroy({ where: {}, force: true });
      await FeeComponent.destroy({ where: {}, force: true });
      await FeeStructure.destroy({ where: {}, force: true });
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (error) {
      console.log('Cleanup warning:', error);
    }
  });

  describe('Property 22: Payment Balance Invariant', () => {
    /**
     * **Validates: Requirements 9.8**
     * 
     * Property: For any invoice, after any payment is recorded, the balance
     * should ALWAYS equal (total_amount - paid_amount).
     * 
     * This is a critical invariant that must hold at all times:
     * 1. After invoice creation: balance = total_amount (since paid_amount = 0)
     * 2. After each payment: balance = total_amount - paid_amount
     * 3. After full payment: balance = 0 and status = 'paid'
     * 4. After partial payment: 0 < balance < total_amount and status = 'partial'
     * 
     * This test runs 100+ iterations with random invoice amounts and payment
     * sequences to verify the invariant always holds.
     */
    it('should maintain balance = total_amount - paid_amount after any payment', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            // Student ID
            studentId: fc.integer({ min: 1, max: 10000 }),
            // Invoice total amount (1000-50000 NPR)
            totalAmount: fc.integer({ min: 1000, max: 50000 }),
            // Number of payments to make (1-10)
            numPayments: fc.integer({ min: 1, max: 10 }),
          }),
          async ({ studentId, totalAmount, numPayments }) => {
            // Create fee structure
            const feeStructure = await createActiveFeeStructure({
              name: `Test Fee Structure ${studentId}`,
              applicableClasses: [1],
              applicableShifts: ['morning'],
              academicYearId: academicYear.academicYearId,
              totalAmount,
            });

            // Create single fee component with the total amount
            await FeeComponent.create({
              feeStructureId: feeStructure.feeStructureId,
              name: 'Tuition Fee',
              type: FeeComponentType.ANNUAL,
              amount: totalAmount,
              frequency: FeeFrequency.ANNUAL,
              isMandatory: true,
            });

            // Generate invoice
            const invoice = await invoiceService.generateInvoice({
              studentId,
              feeStructureId: feeStructure.feeStructureId,
              academicYearId: academicYear.academicYearId,
              dueDate: '2025-03-01',
            });

            // Verify initial state: balance = total_amount (paid_amount = 0)
            expect(Number(invoice.balance)).toBe(Number(invoice.totalAmount));
            expect(Number(invoice.paidAmount)).toBe(0);
            expect(invoice.calculateBalance()).toBe(Number(invoice.totalAmount));

            // Generate random payment amounts that sum to <= total amount
            const paymentAmounts: number[] = [];
            let remainingAmount = totalAmount;
            
            for (let i = 0; i < numPayments && remainingAmount > 0; i++) {
              // Generate payment amount between 1 and remaining amount
              // For last payment, use remaining amount to potentially pay in full
              const maxPayment = i === numPayments - 1 ? remainingAmount : Math.floor(remainingAmount * 0.8);
              const paymentAmount = Math.floor(Math.random() * maxPayment) + 1;
              
              paymentAmounts.push(paymentAmount);
              remainingAmount -= paymentAmount;
            }

            // Process each payment and verify invariant
            let cumulativePaidAmount = 0;

            for (let i = 0; i < paymentAmounts.length; i++) {
              const paymentAmount = paymentAmounts[i];
              cumulativePaidAmount += paymentAmount;

              // Process payment
              const result = await paymentService.processCashPayment(
                invoice.invoiceId,
                studentId,
                paymentAmount,
                '2025-02-15',
                testUserId,
                `Payment ${i + 1}`
              );

              // Reload invoice to get updated values
              const updatedInvoice = await Invoice.findByPk(invoice.invoiceId);
              expect(updatedInvoice).toBeDefined();

              // CRITICAL INVARIANT: balance = total_amount - paid_amount
              const expectedBalance = totalAmount - cumulativePaidAmount;
              const actualBalance = Number(updatedInvoice!.balance);
              const actualPaidAmount = Number(updatedInvoice!.paidAmount);
              const actualTotalAmount = Number(updatedInvoice!.totalAmount);

              // Verify the invariant
              expect(actualBalance).toBe(expectedBalance);
              expect(actualBalance).toBe(actualTotalAmount - actualPaidAmount);
              expect(actualPaidAmount).toBe(cumulativePaidAmount);

              // Verify calculateBalance() method returns same value
              expect(updatedInvoice!.calculateBalance()).toBe(actualBalance);

              // Verify status is correct based on balance
              if (actualBalance === 0) {
                expect(updatedInvoice!.status).toBe(InvoiceStatus.PAID);
              } else if (actualBalance === actualTotalAmount) {
                expect(updatedInvoice!.status).toBe(InvoiceStatus.PENDING);
              } else {
                expect(updatedInvoice!.status).toBe(InvoiceStatus.PARTIAL);
              }

              // Verify payment record
              expect(result.payment).toBeDefined();
              expect(Number(result.payment.amount)).toBe(paymentAmount);
              expect(result.payment.status).toBe(PaymentStatus.COMPLETED);
            }

            // Final verification: total paid should equal sum of all payments
            const finalInvoice = await Invoice.findByPk(invoice.invoiceId);
            const totalPaid = paymentAmounts.reduce((sum, amount) => sum + amount, 0);
            expect(Number(finalInvoice!.paidAmount)).toBe(totalPaid);
            expect(Number(finalInvoice!.balance)).toBe(totalAmount - totalPaid);
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    }, 120000); // 2 minute timeout for multiple database operations

    /**
     * Property: Balance invariant should hold after multiple sequential payments
     * 
     * Tests the invariant with a specific pattern: multiple small payments
     * followed by a final payment to complete the invoice.
     */
    it('should maintain balance invariant with multiple sequential payments', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            studentId: fc.integer({ min: 1, max: 1000 }),
            totalAmount: fc.integer({ min: 5000, max: 20000 }),
            paymentCount: fc.integer({ min: 3, max: 8 }),
          }),
          async ({ studentId, totalAmount, paymentCount }) => {
            // Create fee structure and invoice
            const feeStructure = await createActiveFeeStructure({
              name: `Test Fee Structure ${studentId}`,
              applicableClasses: [1],
              applicableShifts: ['morning'],
              academicYearId: academicYear.academicYearId,
              totalAmount,
            });

            await FeeComponent.create({
              feeStructureId: feeStructure.feeStructureId,
              name: 'Tuition Fee',
              type: FeeComponentType.ANNUAL,
              amount: totalAmount,
              frequency: FeeFrequency.ANNUAL,
              isMandatory: true,
            });

            const invoice = await invoiceService.generateInvoice({
              studentId,
              feeStructureId: feeStructure.feeStructureId,
              academicYearId: academicYear.academicYearId,
              dueDate: '2025-03-01',
            });

            // Make equal payments (except possibly the last one)
            const basePaymentAmount = Math.floor(totalAmount / paymentCount);
            let totalPaid = 0;

            for (let i = 0; i < paymentCount; i++) {
              const currentInvoice = await Invoice.findByPk(invoice.invoiceId);
              const currentBalance = Number(currentInvoice!.balance);

              // For last payment, pay the remaining balance
              const paymentAmount = i === paymentCount - 1 
                ? currentBalance 
                : Math.min(basePaymentAmount, currentBalance);

              if (paymentAmount <= 0) break;

              await paymentService.processCashPayment(
                invoice.invoiceId,
                studentId,
                paymentAmount,
                '2025-02-15',
                testUserId,
                `Payment ${i + 1}`
              );

              totalPaid += paymentAmount;

              // Verify invariant after each payment
              const updatedInvoice = await Invoice.findByPk(invoice.invoiceId);
              const expectedBalance = totalAmount - totalPaid;
              
              expect(Number(updatedInvoice!.balance)).toBe(expectedBalance);
              expect(Number(updatedInvoice!.paidAmount)).toBe(totalPaid);
              expect(updatedInvoice!.calculateBalance()).toBe(expectedBalance);
            }

            // Final check: if all payments made, balance should be 0
            const finalInvoice = await Invoice.findByPk(invoice.invoiceId);
            if (totalPaid === totalAmount) {
              expect(Number(finalInvoice!.balance)).toBe(0);
              expect(finalInvoice!.status).toBe(InvoiceStatus.PAID);
            }
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    }, 120000);

    /**
     * Property: Balance should never be negative
     * 
     * The balance should always be >= 0, and payments exceeding
     * the balance should be rejected.
     */
    it('should reject payments that would make balance negative', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            studentId: fc.integer({ min: 1, max: 1000 }),
            totalAmount: fc.integer({ min: 1000, max: 10000 }),
            excessAmount: fc.integer({ min: 1, max: 5000 }),
          }),
          async ({ studentId, totalAmount, excessAmount }) => {
            // Create fee structure and invoice
            const feeStructure = await createActiveFeeStructure({
              name: `Test Fee Structure ${studentId}`,
              applicableClasses: [1],
              applicableShifts: ['morning'],
              academicYearId: academicYear.academicYearId,
              totalAmount,
            });

            await FeeComponent.create({
              feeStructureId: feeStructure.feeStructureId,
              name: 'Tuition Fee',
              type: FeeComponentType.ANNUAL,
              amount: totalAmount,
              frequency: FeeFrequency.ANNUAL,
              isMandatory: true,
            });

            const invoice = await invoiceService.generateInvoice({
              studentId,
              feeStructureId: feeStructure.feeStructureId,
              academicYearId: academicYear.academicYearId,
              dueDate: '2025-03-01',
            });

            // Attempt to pay more than the total amount
            const excessivePayment = totalAmount + excessAmount;

            await expect(
              paymentService.processCashPayment(
                invoice.invoiceId,
                studentId,
                excessivePayment,
                '2025-02-15',
                testUserId,
                'Excessive payment'
              )
            ).rejects.toThrow(/exceeds.*balance/i);

            // Verify invoice balance unchanged
            const unchangedInvoice = await Invoice.findByPk(invoice.invoiceId);
            expect(Number(unchangedInvoice!.balance)).toBe(totalAmount);
            expect(Number(unchangedInvoice!.paidAmount)).toBe(0);
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    }, 60000);

    /**
     * Property: Balance invariant should hold with different payment methods
     * 
     * The balance calculation should be independent of payment method.
     */
    it('should maintain balance invariant regardless of payment method', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            studentId: fc.integer({ min: 1, max: 1000 }),
            totalAmount: fc.integer({ min: 3000, max: 15000 }),
          }),
          async ({ studentId, totalAmount }) => {
            // Create fee structure and invoice
            const feeStructure = await FeeStructure.create({
              name: `Test Fee Structure ${studentId}`,
              applicableClasses: [1],
              applicableShifts: ['morning'],
              academicYearId: academicYear.academicYearId,
              totalAmount,
              isActive: true,
            });

            await FeeComponent.create({
              feeStructureId: feeStructure.feeStructureId,
              name: 'Tuition Fee',
              type: FeeComponentType.ANNUAL,
              amount: totalAmount,
              frequency: FeeFrequency.ANNUAL,
              isMandatory: true,
            });

            const invoice = await invoiceService.generateInvoice({
              studentId,
              feeStructureId: feeStructure.feeStructureId,
              academicYearId: academicYear.academicYearId,
              dueDate: '2025-03-01',
            });

            // Make payments using different methods
            const paymentMethods = [
              PaymentMethod.CASH,
              PaymentMethod.BANK_TRANSFER,
            ];

            const paymentAmount = Math.floor(totalAmount / 3);
            let totalPaid = 0;

            for (let i = 0; i < paymentMethods.length; i++) {
              const method = paymentMethods[i];
              const currentBalance = totalAmount - totalPaid;
              const amount = Math.min(paymentAmount, currentBalance);

              if (amount <= 0) break;

              if (method === PaymentMethod.CASH) {
                await paymentService.processCashPayment(
                  invoice.invoiceId,
                  studentId,
                  amount,
                  '2025-02-15',
                  testUserId,
                  `Cash payment ${i + 1}`
                );
              } else if (method === PaymentMethod.BANK_TRANSFER) {
                await paymentService.processBankTransferPayment(
                  invoice.invoiceId,
                  studentId,
                  amount,
                  '2025-02-15',
                  `TXN-${Date.now()}-${i}`,
                  testUserId,
                  `Bank transfer ${i + 1}`
                );
              }

              totalPaid += amount;

              // Verify invariant holds regardless of payment method
              const updatedInvoice = await Invoice.findByPk(invoice.invoiceId);
              const expectedBalance = totalAmount - totalPaid;
              
              expect(Number(updatedInvoice!.balance)).toBe(expectedBalance);
              expect(Number(updatedInvoice!.paidAmount)).toBe(totalPaid);
              expect(updatedInvoice!.calculateBalance()).toBe(expectedBalance);
            }
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    }, 120000);

    /**
     * Property: Balance invariant should hold after refund
     * 
     * After a payment is refunded, the balance should increase by the refund amount.
     */
    it('should maintain balance invariant after payment refund', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            studentId: fc.integer({ min: 1, max: 1000 }),
            totalAmount: fc.integer({ min: 5000, max: 20000 }),
            paymentAmount: fc.integer({ min: 1000, max: 5000 }),
          }),
          async ({ studentId, totalAmount, paymentAmount }) => {
            // Ensure payment doesn't exceed total
            const validPayment = Math.min(paymentAmount, totalAmount);

            // Create fee structure and invoice
            const feeStructure = await FeeStructure.create({
              name: `Test Fee Structure ${studentId}`,
              applicableClasses: [1],
              applicableShifts: ['morning'],
              academicYearId: academicYear.academicYearId,
              totalAmount,
              isActive: true,
            });

            await FeeComponent.create({
              feeStructureId: feeStructure.feeStructureId,
              name: 'Tuition Fee',
              type: FeeComponentType.ANNUAL,
              amount: totalAmount,
              frequency: FeeFrequency.ANNUAL,
              isMandatory: true,
            });

            const invoice = await invoiceService.generateInvoice({
              studentId,
              feeStructureId: feeStructure.feeStructureId,
              academicYearId: academicYear.academicYearId,
              dueDate: '2025-03-01',
            });

            // Make a payment
            const paymentResult = await paymentService.processCashPayment(
              invoice.invoiceId,
              studentId,
              validPayment,
              '2025-02-15',
              testUserId,
              'Initial payment'
            );

            // Verify balance after payment
            let updatedInvoice = await Invoice.findByPk(invoice.invoiceId);
            expect(Number(updatedInvoice!.balance)).toBe(totalAmount - validPayment);
            expect(Number(updatedInvoice!.paidAmount)).toBe(validPayment);

            // Refund the payment
            await paymentService.refundPayment(
              paymentResult.payment.paymentId,
              testUserId,
              'Test refund'
            );

            // Verify balance after refund: should be back to original total
            updatedInvoice = await Invoice.findByPk(invoice.invoiceId);
            expect(Number(updatedInvoice!.balance)).toBe(totalAmount);
            expect(Number(updatedInvoice!.paidAmount)).toBe(0);
            expect(updatedInvoice!.calculateBalance()).toBe(totalAmount);

            // Verify invariant: balance = total_amount - paid_amount
            const balance = Number(updatedInvoice!.balance);
            const total = Number(updatedInvoice!.totalAmount);
            const paid = Number(updatedInvoice!.paidAmount);
            expect(balance).toBe(total - paid);
          }
        ),
        {
          numRuns: 50,
          verbose: true,
        }
      );
    }, 120000);

    /**
     * Property: Balance should be exactly 0 when fully paid
     * 
     * When paid_amount equals total_amount, balance must be exactly 0
     * and status must be 'paid'.
     */
    it('should have zero balance and paid status when fully paid', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            studentId: fc.integer({ min: 1, max: 1000 }),
            totalAmount: fc.integer({ min: 1000, max: 50000 }),
          }),
          async ({ studentId, totalAmount }) => {
            // Create fee structure and invoice
            const feeStructure = await FeeStructure.create({
              name: `Test Fee Structure ${studentId}`,
              applicableClasses: [1],
              applicableShifts: ['morning'],
              academicYearId: academicYear.academicYearId,
              totalAmount,
              isActive: true,
            });

            await FeeComponent.create({
              feeStructureId: feeStructure.feeStructureId,
              name: 'Tuition Fee',
              type: FeeComponentType.ANNUAL,
              amount: totalAmount,
              frequency: FeeFrequency.ANNUAL,
              isMandatory: true,
            });

            const invoice = await invoiceService.generateInvoice({
              studentId,
              feeStructureId: feeStructure.feeStructureId,
              academicYearId: academicYear.academicYearId,
              dueDate: '2025-03-01',
            });

            // Pay the full amount
            await paymentService.processCashPayment(
              invoice.invoiceId,
              studentId,
              totalAmount,
              '2025-02-15',
              testUserId,
              'Full payment'
            );

            // Verify final state
            const paidInvoice = await Invoice.findByPk(invoice.invoiceId);
            
            // Balance must be exactly 0
            expect(Number(paidInvoice!.balance)).toBe(0);
            
            // Paid amount must equal total amount
            expect(Number(paidInvoice!.paidAmount)).toBe(totalAmount);
            
            // Status must be 'paid'
            expect(paidInvoice!.status).toBe(InvoiceStatus.PAID);
            
            // Verify invariant
            expect(paidInvoice!.calculateBalance()).toBe(0);
            expect(Number(paidInvoice!.totalAmount) - Number(paidInvoice!.paidAmount)).toBe(0);
          }
        ),
        {
          numRuns: 100,
          verbose: true,
        }
      );
    }, 120000);
  });
});



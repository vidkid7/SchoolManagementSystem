import request from 'supertest';
import app from '../../../app';
import sequelize from '@config/database';
import User, { UserRole } from '@models/User.model';
import { FeeStructure } from '@models/FeeStructure.model';
import { Invoice } from '@models/Invoice.model';
import { Payment } from '@models/Payment.model';
import { AcademicYear } from '@models/AcademicYear.model';
import Student from '@models/Student.model';
import jwt from 'jsonwebtoken';
import { env } from '@config/env';

/**
 * Finance Controller Integration Tests
 * Tests all finance API endpoints
 * Requirements: 9.1-9.16
 */

describe('Finance Controller', () => {
  let adminToken: string;
  let accountantToken: string;
  let adminUser: User;
  let accountantUser: User;
  let academicYear: AcademicYear;
  let student: Student;
  let feeStructure: FeeStructure;
  let invoice: Invoice;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create test users
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'password123',
      role: UserRole.SCHOOL_ADMIN
    });

    accountantUser = await User.create({
      username: 'accountant',
      email: 'accountant@test.com',
      password: 'password123',
      role: UserRole.ACCOUNTANT
    });

    // Generate tokens
    adminToken = jwt.sign(
      { userId: adminUser.userId, role: adminUser.role },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    accountantToken = jwt.sign(
      { userId: accountantUser.userId, role: accountantUser.role },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Create academic year
    academicYear = await AcademicYear.create({
      name: '2081-2082 BS',
      startDateBS: '2081-01-01',
      endDateBS: '2081-12-30',
      startDateAD: '2024-04-13',
      endDateAD: '2025-04-12',
      isCurrent: true
    });

    // Create student
    student = await Student.create({
      studentCode: 'STU-2024-00001',
      firstNameEn: 'John',
      lastNameEn: 'Doe',
      firstNameNp: 'जोन',
      lastNameNp: 'डो',
      dateOfBirthBS: '2065-05-15',
      dateOfBirthAD: new Date('2008-08-30'),
      gender: 'MALE' as any,
      addressEn: 'Kathmandu',
      addressNp: 'काठमाडौं',
      fatherName: 'Father Name',
      fatherPhone: '9841234567',
      motherName: 'Mother Name',
      motherPhone: '9841234568',
      emergencyContact: '9841234567',
      admissionDate: new Date('2024-04-13'),
      admissionClass: 1,
      status: 'ACTIVE' as any
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Fee Structures', () => {
    describe('POST /api/v1/finance/fee-structures', () => {
      it('should create a fee structure', async () => {
        const response = await request(app)
          .post('/api/v1/finance/fee-structures')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Class 1 Fee Structure',
            applicableClasses: [1],
            applicableShifts: ['morning'],
            academicYearId: academicYear.academicYearId,
            description: 'Fee structure for class 1',
            feeComponents: [
              {
                name: 'Tuition Fee',
                type: 'annual',
                amount: 50000,
                frequency: 'annual',
                isMandatory: true
              },
              {
                name: 'Admission Fee',
                type: 'admission',
                amount: 5000,
                frequency: 'one_time',
                isMandatory: true
              }
            ]
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('feeStructureId');
        expect(response.body.data.name).toBe('Class 1 Fee Structure');
        expect(response.body.data.totalAmount).toBe(55000);

        feeStructure = response.body.data;
      });

      it('should reject creation without authentication', async () => {
        const response = await request(app)
          .post('/api/v1/finance/fee-structures')
          .send({
            name: 'Test Fee Structure',
            applicableClasses: [1],
            applicableShifts: ['morning'],
            academicYearId: academicYear.academicYearId,
            feeComponents: []
          });

        expect(response.status).toBe(401);
      });

      it('should reject creation by non-admin', async () => {
        const response = await request(app)
          .post('/api/v1/finance/fee-structures')
          .set('Authorization', `Bearer ${accountantToken}`)
          .send({
            name: 'Test Fee Structure',
            applicableClasses: [1],
            applicableShifts: ['morning'],
            academicYearId: academicYear.academicYearId,
            feeComponents: []
          });

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/v1/finance/fee-structures', () => {
      it('should get all fee structures', async () => {
        const response = await request(app)
          .get('/api/v1/finance/fee-structures')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });

      it('should filter by academic year', async () => {
        const response = await request(app)
          .get(`/api/v1/finance/fee-structures?academicYearId=${academicYear.academicYearId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.every((fs: any) => fs.academicYearId === academicYear.academicYearId)).toBe(true);
      });
    });

    describe('GET /api/v1/finance/fee-structures/:id', () => {
      it('should get fee structure by ID', async () => {
        const response = await request(app)
          .get(`/api/v1/finance/fee-structures/${feeStructure.feeStructureId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.feeStructureId).toBe(feeStructure.feeStructureId);
      });

      it('should return 404 for non-existent fee structure', async () => {
        const response = await request(app)
          .get('/api/v1/finance/fee-structures/99999')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
      });
    });

    describe('PUT /api/v1/finance/fee-structures/:id', () => {
      it('should update fee structure', async () => {
        const response = await request(app)
          .put(`/api/v1/finance/fee-structures/${feeStructure.feeStructureId}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Updated Fee Structure',
            isActive: true
          });

        expect(response.status).toBe(200);
        expect(response.body.data.name).toBe('Updated Fee Structure');
      });
    });
  });

  describe('Invoices', () => {
    describe('POST /api/v1/finance/invoices', () => {
      it('should generate an invoice', async () => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        const response = await request(app)
          .post('/api/v1/finance/invoices')
          .set('Authorization', `Bearer ${accountantToken}`)
          .send({
            studentId: student.studentId,
            feeStructureId: feeStructure.feeStructureId,
            academicYearId: academicYear.academicYearId,
            dueDate: dueDate.toISOString().split('T')[0]
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('invoiceId');
        expect(response.body.data).toHaveProperty('invoiceNumber');
        expect(response.body.data.studentId).toBe(student.studentId);

        invoice = response.body.data;
      });

      it('should reject duplicate invoice', async () => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        const response = await request(app)
          .post('/api/v1/finance/invoices')
          .set('Authorization', `Bearer ${accountantToken}`)
          .send({
            studentId: student.studentId,
            feeStructureId: feeStructure.feeStructureId,
            academicYearId: academicYear.academicYearId,
            dueDate: dueDate.toISOString().split('T')[0]
          });

        expect(response.status).toBe(500);
      });
    });

    describe('POST /api/v1/finance/invoices/bulk-generate', () => {
      it('should bulk generate invoices', async () => {
        // Create another student
        const student2 = await Student.create({
          studentCode: 'STU-2024-00002',
          firstNameEn: 'Jane',
          lastNameEn: 'Smith',
          firstNameNp: 'जेन',
          lastNameNp: 'स्मिथ',
          dateOfBirthBS: '2065-06-15',
          dateOfBirthAD: new Date('2008-09-30'),
          gender: 'FEMALE' as any,
          addressEn: 'Lalitpur',
          addressNp: 'ललितपुर',
          fatherName: 'Father Name',
          fatherPhone: '9841234569',
          motherName: 'Mother Name',
          motherPhone: '9841234570',
          emergencyContact: '9841234569',
          admissionDate: new Date('2024-04-13'),
          admissionClass: 1,
          status: 'ACTIVE' as any
        });

        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        const response = await request(app)
          .post('/api/v1/finance/invoices/bulk-generate')
          .set('Authorization', `Bearer ${accountantToken}`)
          .send({
            studentIds: [student2.studentId],
            feeStructureId: feeStructure.feeStructureId,
            academicYearId: academicYear.academicYearId,
            dueDate: dueDate.toISOString().split('T')[0]
          });

        expect(response.status).toBe(201);
        expect(response.body.data.successful).toBe(1);
        expect(response.body.data.failed).toBe(0);
      });
    });

    describe('GET /api/v1/finance/invoices', () => {
      it('should get all invoices', async () => {
        const response = await request(app)
          .get('/api/v1/finance/invoices')
          .set('Authorization', `Bearer ${accountantToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('should filter by student ID', async () => {
        const response = await request(app)
          .get(`/api/v1/finance/invoices?studentId=${student.studentId}`)
          .set('Authorization', `Bearer ${accountantToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.every((inv: any) => inv.studentId === student.studentId)).toBe(true);
      });
    });

    describe('GET /api/v1/finance/invoices/:id', () => {
      it('should get invoice by ID', async () => {
        const response = await request(app)
          .get(`/api/v1/finance/invoices/${invoice.invoiceId}`)
          .set('Authorization', `Bearer ${accountantToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.invoiceId).toBe(invoice.invoiceId);
      });
    });

    describe('PUT /api/v1/finance/invoices/:id', () => {
      it('should apply discount to invoice', async () => {
        const response = await request(app)
          .put(`/api/v1/finance/invoices/${invoice.invoiceId}`)
          .set('Authorization', `Bearer ${accountantToken}`)
          .send({
            discount: 5000,
            discountReason: 'Scholarship'
          });

        expect(response.status).toBe(200);
        expect(response.body.data.discount).toBe(5000);
      });
    });
  });

  describe('Payments', () => {
    let payment: Payment;

    describe('POST /api/v1/finance/payments', () => {
      it('should process a payment', async () => {
        const response = await request(app)
          .post('/api/v1/finance/payments')
          .set('Authorization', `Bearer ${accountantToken}`)
          .send({
            invoiceId: invoice.invoiceId,
            studentId: student.studentId,
            amount: 25000,
            paymentMethod: 'cash',
            paymentDate: new Date().toISOString().split('T')[0],
            remarks: 'Partial payment'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.payment).toHaveProperty('paymentId');
        expect(response.body.data.payment).toHaveProperty('receiptNumber');
        expect(response.body.data.payment.amount).toBe(25000);

        payment = response.body.data.payment;
      });

      it('should reject payment exceeding balance', async () => {
        const response = await request(app)
          .post('/api/v1/finance/payments')
          .set('Authorization', `Bearer ${accountantToken}`)
          .send({
            invoiceId: invoice.invoiceId,
            studentId: student.studentId,
            amount: 100000,
            paymentMethod: 'cash',
            paymentDate: new Date().toISOString().split('T')[0]
          });

        expect(response.status).toBe(500);
      });
    });

    describe('GET /api/v1/finance/payments', () => {
      it('should get all payments', async () => {
        const response = await request(app)
          .get('/api/v1/finance/payments')
          .set('Authorization', `Bearer ${accountantToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
      });
    });

    describe('GET /api/v1/finance/payments/:id', () => {
      it('should get payment by ID', async () => {
        const response = await request(app)
          .get(`/api/v1/finance/payments/${payment.paymentId}`)
          .set('Authorization', `Bearer ${accountantToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.paymentId).toBe(payment.paymentId);
      });
    });

    describe('GET /api/v1/finance/payments/student/:studentId', () => {
      it('should get payment history for student', async () => {
        const response = await request(app)
          .get(`/api/v1/finance/payments/student/${student.studentId}`)
          .set('Authorization', `Bearer ${accountantToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body.data)).toBe(true);
        expect(response.body.data.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Reports', () => {
    describe('GET /api/v1/finance/reports/collection', () => {
      it('should get collection report', async () => {
        const response = await request(app)
          .get('/api/v1/finance/reports/collection')
          .set('Authorization', `Bearer ${accountantToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('totalAmount');
        expect(response.body.data).toHaveProperty('totalPayments');
        expect(response.body.data).toHaveProperty('byMethod');
      });
    });

    describe('GET /api/v1/finance/reports/pending', () => {
      it('should get pending fees report', async () => {
        const response = await request(app)
          .get('/api/v1/finance/reports/pending')
          .set('Authorization', `Bearer ${accountantToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('totalInvoices');
        expect(response.body.data).toHaveProperty('totalPending');
      });
    });

    describe('GET /api/v1/finance/reports/defaulters', () => {
      it('should get defaulters list', async () => {
        const response = await request(app)
          .get('/api/v1/finance/reports/defaulters')
          .set('Authorization', `Bearer ${accountantToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveProperty('totalDefaulters');
        expect(response.body.data).toHaveProperty('totalOutstanding');
      });
    });
  });

  describe('Refunds', () => {
    describe('POST /api/v1/finance/refunds', () => {
      it('should process a refund', async () => {
        // First, get a payment to refund
        const payments = await Payment.findAll({
          where: { studentId: student.studentId },
          limit: 1
        });

        if (payments.length === 0) {
          // Skip test if no payments
          return;
        }

        const paymentToRefund = payments[0];

        const response = await request(app)
          .post('/api/v1/finance/refunds')
          .set('Authorization', `Bearer ${accountantToken}`)
          .send({
            paymentId: paymentToRefund.paymentId,
            reason: 'Student withdrew',
            remarks: 'Full refund'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.refund).toHaveProperty('refundId');
      });
    });
  });
});

import express, { NextFunction, Request, Response } from 'express';
import request from 'supertest';
import { UserRole } from '@models/User.model';
import financeRoutes from '../finance.routes';
import financeController from '../finance.controller';

jest.mock('@middleware/auth', () => {
  const actual = jest.requireActual('@middleware/auth');
  return {
    ...actual,
    authenticate: (req: Request, res: Response, next: NextFunction) => {
      const role = req.header('x-test-role');
      if (!role) return res.status(401).json({ success: false });
      req.user = {
        userId: 1,
        username: 'qa-finance',
        email: 'qa-finance@example.test',
        role: role as UserRole,
      };
      return next();
    },
  };
});

jest.mock('../finance.controller', () => {
  const handler = () => jest.fn((_req: Request, res: Response) => res.status(200).json({ success: true }));
  return {
    __esModule: true,
    default: {
      getStudentsByFeeStatus: handler(),
      getSummary: handler(),
      getStatistics: handler(),
      getRecentTransactions: handler(),
      getAllFeeStructures: handler(),
      getFeeStructureById: handler(),
      createFeeStructure: handler(),
      updateFeeStructure: handler(),
      deleteFeeStructure: handler(),
      getAllInvoices: handler(),
      getInvoiceById: handler(),
      generateInvoice: handler(),
      bulkGenerateInvoices: handler(),
      updateInvoice: handler(),
      sendInvoiceReminder: handler(),
      getAllPayments: handler(),
      getPaymentById: handler(),
      getStudentPaymentHistory: handler(),
      processPayment: handler(),
      refundPaymentById: handler(),
      getPaymentGatewayConfigs: handler(),
      getPaymentGatewayTransactions: handler(),
      updatePaymentGatewayConfig: handler(),
      testPaymentGatewayConnection: handler(),
      getRefunds: handler(),
      processRefund: handler(),
      getReportByType: handler(),
      getCollectionReport: handler(),
      getPendingFeesReport: handler(),
      getDefaultersList: handler(),
    },
  };
});

const app = express();
app.use(express.json());
app.use('/api/v1/finance', financeRoutes);
app.use((error: { statusCode?: number; message?: string }, _req: Request, res: Response, _next: NextFunction) => {
  res.status(error.statusCode ?? 500).json({ message: error.message });
});

describe('Finance routes authorization and validation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('requires authentication before processing payments', async () => {
    await request(app).post('/api/v1/finance/payments').send({}).expect(401);
    expect(financeController.processPayment).not.toHaveBeenCalled();
  });

  it('allows accountants to process valid payments and rejects student payment writes', async () => {
    const validPayment = {
      invoiceId: 1,
      studentId: 2,
      amount: 125,
      paymentMethod: 'cash',
      paymentDate: '2026-10-23',
    };

    await request(app)
      .post('/api/v1/finance/payments')
      .set('x-test-role', UserRole.STUDENT)
      .send(validPayment)
      .expect(403);
    expect(financeController.processPayment).not.toHaveBeenCalled();

    await request(app)
      .post('/api/v1/finance/payments')
      .set('x-test-role', UserRole.ACCOUNTANT)
      .send(validPayment)
      .expect(200);
    expect(financeController.processPayment).toHaveBeenCalledTimes(1);
  });

  it('allows parents to read scoped payment history and rejects invalid student IDs before the controller', async () => {
    await request(app)
      .get('/api/v1/finance/payments/student/42')
      .set('x-test-role', UserRole.PARENT)
      .expect(200);
    expect(financeController.getStudentPaymentHistory).toHaveBeenCalledTimes(1);

    await request(app)
      .get('/api/v1/finance/payments/student/not-a-number')
      .set('x-test-role', UserRole.PARENT)
      .expect(400);
    expect(financeController.getStudentPaymentHistory).toHaveBeenCalledTimes(1);
  });

  it('limits gateway configuration changes to school admins', async () => {
    await request(app)
      .put('/api/v1/finance/payment-gateways/esewa')
      .set('x-test-role', UserRole.ACCOUNTANT)
      .send({ enabled: false })
      .expect(403);
    expect(financeController.updatePaymentGatewayConfig).not.toHaveBeenCalled();

    await request(app)
      .put('/api/v1/finance/payment-gateways/esewa')
      .set('x-test-role', UserRole.SCHOOL_ADMIN)
      .send({ enabled: false })
      .expect(200);
    expect(financeController.updatePaymentGatewayConfig).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid payment query filters before listing records', async () => {
    await request(app)
      .get('/api/v1/finance/payments?limit=1001')
      .set('x-test-role', UserRole.ACCOUNTANT)
      .expect(400);
    expect(financeController.getAllPayments).not.toHaveBeenCalled();
  });
});


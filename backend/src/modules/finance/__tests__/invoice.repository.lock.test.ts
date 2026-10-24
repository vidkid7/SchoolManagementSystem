import { Transaction } from 'sequelize';
import { Invoice } from '@models/Invoice.model';
import invoiceRepository from '../invoice.repository';

jest.mock('@models/Invoice.model', () => ({
  Invoice: { findByPk: jest.fn() },
  InvoiceItem: {}
}));

jest.mock('@models/FeeStructure.model', () => ({
  FeeComponent: {}
}));

describe('InvoiceRepository row locking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Invoice.findByPk as jest.Mock).mockResolvedValue(null);
  });

  it('requests a row lock when reading an invoice for payment processing', async () => {
    const transaction = { LOCK: { UPDATE: 'UPDATE' } } as unknown as Transaction;

    await invoiceRepository.findById(41, transaction, true);

    expect(Invoice.findByPk).toHaveBeenCalledWith(
      41,
      expect.objectContaining({ transaction, lock: 'UPDATE' })
    );
  });

  it('does not request a lock for ordinary invoice reads', async () => {
    await invoiceRepository.findById(41);

    expect(Invoice.findByPk).toHaveBeenCalledWith(
      41,
      expect.objectContaining({ transaction: undefined, lock: undefined })
    );
  });
});

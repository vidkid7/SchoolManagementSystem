import { libraryService } from '../library.service';
import { Book } from '../../../models/Book.model';
import { Circulation } from '../../../models/Circulation.model';
import { LibraryFine } from '../../../models/LibraryFine.model';
import { lateFeeService } from '../lateFee.service';

jest.mock('../../../models/Book.model', () => ({ Book: { findByPk: jest.fn() } }));
jest.mock('../../../models/Circulation.model', () => ({ Circulation: { findByPk: jest.fn() } }));
jest.mock('../../../models/LibraryFine.model', () => ({ LibraryFine: { findOne: jest.fn() } }));
jest.mock('../lateFee.service', () => ({ lateFeeService: { createFine: jest.fn() } }));

describe('returnBook overdue fine ledger', () => {
  beforeEach(() => jest.clearAllMocks());

  const makeCirculation = (daysOverdue: number) => ({
    circulationId: 17,
    bookId: 9,
    studentId: 31,
    status: 'borrowed',
    fine: 0,
    getDaysOverdue: () => daysOverdue,
    save: jest.fn().mockResolvedValue(undefined),
  });

  it('creates a payable fine ledger record when an overdue book is returned', async () => {
    const circulation = makeCirculation(3);
    const book = { incrementAvailableCopies: jest.fn().mockResolvedValue(undefined) };
    (Circulation.findByPk as jest.Mock).mockResolvedValue(circulation);
    (Book.findByPk as jest.Mock).mockResolvedValue(book);
    (LibraryFine.findOne as jest.Mock).mockResolvedValue(null);
    (lateFeeService.createFine as jest.Mock).mockResolvedValue({ fineId: 4 });

    await libraryService.returnBook({ circulationId: 17, returnedBy: 7 });

    expect(lateFeeService.createFine).toHaveBeenCalledWith({
      circulationId: 17,
      studentId: 31,
      fineAmount: 15,
      fineReason: 'overdue',
      daysOverdue: 3,
      dailyRate: 5,
    });
    expect(circulation.save).toHaveBeenCalled();
    expect(book.incrementAvailableCopies).toHaveBeenCalled();
  });

  it('updates the outstanding balance for an existing overdue fine', async () => {
    const circulation = makeCirculation(4);
    const existingFine = { paidAmount: '5.00', waivedAmount: '0.00', update: jest.fn().mockResolvedValue(undefined) };
    const book = { incrementAvailableCopies: jest.fn().mockResolvedValue(undefined) };
    (Circulation.findByPk as jest.Mock).mockResolvedValue(circulation);
    (Book.findByPk as jest.Mock).mockResolvedValue(book);
    (LibraryFine.findOne as jest.Mock).mockResolvedValue(existingFine);

    await libraryService.returnBook({ circulationId: 17, returnedBy: 7 });

    expect(existingFine.update).toHaveBeenCalledWith(expect.objectContaining({
      fineAmount: 20,
      balance: 15,
      daysOverdue: 4,
      dailyRate: 5,
      status: 'partial',
    }));
    expect(lateFeeService.createFine).not.toHaveBeenCalled();
  });
});

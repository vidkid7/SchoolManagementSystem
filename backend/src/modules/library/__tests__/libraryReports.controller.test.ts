import express from 'express';
import request from 'supertest';
import { Book } from '../../../models/Book.model';
import { LibraryFine } from '../../../models/LibraryFine.model';
import { Circulation } from '../../../models/Circulation.model';
import { LibraryController } from '../library.controller';

jest.mock('../../../models/Book.model', () => ({ Book: { findAll: jest.fn() } }));
jest.mock('../../../models/LibraryFine.model', () => ({ LibraryFine: { findAll: jest.fn() } }));
jest.mock('../../../models/Circulation.model', () => ({ Circulation: { findAll: jest.fn() } }));
jest.mock('../../../models/LibraryCategory.model', () => ({ LibraryCategory: {} }));
jest.mock('../../../models/Student.model', () => ({ __esModule: true, default: {} }));
jest.mock('../../../config/database', () => ({ __esModule: true, default: {} }));
jest.mock('../library.service', () => ({ libraryService: { getLibraryStats: jest.fn() } }));
jest.mock('../lateFee.service', () => ({ lateFeeService: { getFineStats: jest.fn() } }));
jest.mock('../reservation.service', () => ({ reservationService: { getReservationStats: jest.fn() } }));

const app = express();
const controller = new LibraryController();
app.get('/reports', controller.getLibraryReports.bind(controller));

describe('Library report exports', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects unsupported report types and invalid date ranges', async () => {
    const invalidType = await request(app).get('/reports').query({ type: 'unknown', startDate: '2026-01-01', endDate: '2026-01-31' });
    const invalidDate = await request(app).get('/reports').query({ type: 'inventory', startDate: '2026-02-31', endDate: '2026-03-01' });

    expect(invalidType.status).toBe(400);
    expect(invalidDate.status).toBe(400);
    expect(Book.findAll).not.toHaveBeenCalled();
  });

  it('returns a PDF document for inventory exports', async () => {
    (Book.findAll as jest.Mock).mockResolvedValue([]);

    const response = await request(app)
      .get('/reports')
      .query({ type: 'inventory', startDate: '2026-10-01', endDate: '2026-10-31' });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('application/pdf');
    expect(response.headers['content-disposition']).toContain('library_inventory_2026-10-01_2026-10-31.pdf');
    expect(Buffer.isBuffer(response.body)).toBe(true);
    expect(response.body.subarray(0, 4).toString()).toBe('%PDF');
    expect(Book.findAll).toHaveBeenCalledTimes(1);
    expect(Circulation.findAll).not.toHaveBeenCalled();
    expect(LibraryFine.findAll).not.toHaveBeenCalled();
  });
});

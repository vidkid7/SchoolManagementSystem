import { LibraryController } from '../library.controller';
import { lateFeeService } from '../lateFee.service';

jest.mock('../lateFee.service', () => ({
  lateFeeService: {
    getFinesByStudent: jest.fn(),
  },
}));

describe('LibraryController.getFinesByStudent', () => {
  const controller = new LibraryController();
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(['', '7a', '0', '-1', '1.5'])('rejects invalid student ID %p without querying fines', async (studentId) => {
    await controller.getFinesByStudent({ params: { studentId }, query: {} } as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Student ID must be a positive integer',
    });
    expect(lateFeeService.getFinesByStudent).not.toHaveBeenCalled();
  });

  it('queries fines using the parsed positive student ID', async () => {
    (lateFeeService.getFinesByStudent as jest.Mock).mockResolvedValue([]);

    await controller.getFinesByStudent({ params: { studentId: '720001' }, query: {} } as any, res as any);

    expect(lateFeeService.getFinesByStudent).toHaveBeenCalledWith(720001, undefined);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
  });
});

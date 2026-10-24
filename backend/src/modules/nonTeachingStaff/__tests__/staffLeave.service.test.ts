import Staff from '@models/Staff.model';
import StaffLeaveRequest from '@models/StaffLeaveRequest.model';
import staffLeaveService from '../staffLeave.service';

jest.mock('@models/Staff.model', () => ({ __esModule: true, default: { findOne: jest.fn() } }));
jest.mock('@models/StaffLeaveRequest.model', () => ({ __esModule: true, default: { findAll: jest.fn(), create: jest.fn(), findOne: jest.fn() } }));

describe('StaffLeaveService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists only leave requests belonging to the signed-in staff profile', async () => {
    const staff = { staffId: 42 };
    const requests = [{ staffLeaveRequestId: 1 }];
    jest.mocked(Staff.findOne).mockResolvedValue(staff as never);
    jest.mocked(StaffLeaveRequest.findAll).mockResolvedValue(requests as never);

    await expect(staffLeaveService.listForUser(17)).resolves.toBe(requests);
    expect(Staff.findOne).toHaveBeenCalledWith({ where: { userId: 17 } });
    expect(StaffLeaveRequest.findAll).toHaveBeenCalledWith({
      where: { staffId: 42, appliedBy: 17 },
      order: [['createdAt', 'DESC']],
    });
  });

  it('creates a pending staff leave request with trimmed reason and verified staff ownership', async () => {
    const staff = { staffId: 42 };
    const created = { staffLeaveRequestId: 8, status: 'pending' };
    jest.mocked(Staff.findOne).mockResolvedValue(staff as never);
    jest.mocked(StaffLeaveRequest.create).mockResolvedValue(created as never);

    await expect(staffLeaveService.applyForUser(17, {
      leaveType: 'sick', startDate: '2026-10-23', endDate: '2026-10-24', reason: '  Medical appointment  ',
    })).resolves.toBe(created);

    expect(StaffLeaveRequest.create).toHaveBeenCalledWith(expect.objectContaining({
      staffId: 42,
      appliedBy: 17,
      leaveType: 'sick',
      startDate: new Date('2026-10-23'),
      endDate: new Date('2026-10-24'),
      reason: 'Medical appointment',
      status: 'pending',
    }));
  });

  it('rejects reversed date ranges before creating a request', async () => {
    jest.mocked(Staff.findOne).mockResolvedValue({ staffId: 42 } as never);
    await expect(staffLeaveService.applyForUser(17, {
      leaveType: 'casual', startDate: '2026-10-24', endDate: '2026-10-23', reason: 'Need a personal day',
    })).rejects.toMatchObject({ statusCode: 400 });
    expect(StaffLeaveRequest.create).not.toHaveBeenCalled();
  });

  it('allows staff to cancel only their own pending request', async () => {
    jest.mocked(Staff.findOne).mockResolvedValue({ staffId: 42 } as never);
    const update = jest.fn().mockResolvedValue(undefined);
    jest.mocked(StaffLeaveRequest.findOne).mockResolvedValue({ status: 'pending', update } as never);

    await expect(staffLeaveService.cancelForUser(17, 8)).resolves.toBe(true);
    expect(StaffLeaveRequest.findOne).toHaveBeenCalledWith({ where: { staffLeaveRequestId: 8, staffId: 42, appliedBy: 17 } });
    expect(update).toHaveBeenCalledWith({ status: 'cancelled' });
  });
});

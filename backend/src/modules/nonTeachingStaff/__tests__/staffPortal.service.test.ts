import User, { UserRole } from '@models/User.model';
import StaffTask from '@models/StaffTask.model';
import StaffWorkSchedule from '@models/StaffWorkSchedule.model';
import staffPortalService from '../staffPortal.service';

jest.mock('@models/User.model', () => ({ __esModule: true, default: { findByPk: jest.fn(), findOne: jest.fn() }, UserRole: { NON_TEACHING_STAFF: 'Non_Teaching_Staff', SCHOOL_ADMIN: 'School_Admin' } }));
jest.mock('@models/StaffTask.model', () => ({ __esModule: true, default: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() } }));
jest.mock('@models/StaffWorkSchedule.model', () => ({ __esModule: true, default: { findAll: jest.fn(), findOne: jest.fn(), create: jest.fn() } }));

describe('StaffPortalService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists only the requested user’s tasks and applies status filters', async () => {
    jest.mocked(StaffTask.findAll).mockResolvedValue([] as never);
    await staffPortalService.listTasks(42, 'pending');
    expect(StaffTask.findAll).toHaveBeenCalledWith({ where: { assignedTo: 42, status: 'pending' }, order: [['dueDate', 'ASC'], ['createdAt', 'DESC']] });
  });

  it('persists a task only for a non-teaching staff account', async () => {
    jest.mocked(User.findByPk).mockResolvedValue({ role: UserRole.SCHOOL_ADMIN, schoolConfigId: 'school-a' } as never);
    jest.mocked(User.findOne).mockResolvedValue({ userId: 42 } as never);
    jest.mocked(StaffTask.create).mockResolvedValue({ id: 4 } as never);
    await staffPortalService.createTask(3, { title: ' Clean library ', assignedTo: 42, dueDate: '2026-10-29' });
    expect(User.findOne).toHaveBeenCalledWith({ where: { userId: 42, schoolConfigId: 'school-a', role: UserRole.NON_TEACHING_STAFF }, attributes: ['userId'] });
    expect(StaffTask.create).toHaveBeenCalledWith(expect.objectContaining({ title: 'Clean library', assignedTo: 42, assignedBy: 3, status: 'pending' }));
  });

  it('scopes non-admin status updates to the assigned user', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    jest.mocked(StaffTask.findOne).mockResolvedValue({ update } as never);
    await staffPortalService.updateTaskStatus(7, 42, false, 'completed');
    expect(StaffTask.findOne).toHaveBeenCalledWith({ where: { id: 7, assignedTo: 42 } });
    expect(update).toHaveBeenCalledWith({ status: 'completed' });
  });

  it('maps persisted dates and times into the weekly portal contract', async () => {
    jest.mocked(StaffWorkSchedule.findAll).mockResolvedValue([{
      id: 2, date: '2026-10-26', shiftStart: '08:30:00', shiftEnd: '16:30:00', location: 'Library', notes: 'Inventory',
    }] as never);
    const result = await staffPortalService.listSchedule(42, '2026-10-26');
    expect(StaffWorkSchedule.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 42, date: expect.anything() },
    }));
    expect(result).toEqual([{ id: 2, date: '2026-10-26', day: 'Monday', startTime: '08:30', endTime: '16:30', location: 'Library', duties: 'Inventory' }]);
  });

  it('updates an existing user/date schedule instead of creating a duplicate', async () => {
    jest.mocked(User.findByPk).mockResolvedValue({ role: UserRole.SCHOOL_ADMIN, schoolConfigId: 'school-a' } as never);
    jest.mocked(User.findOne).mockResolvedValue({ userId: 42 } as never);
    const update = jest.fn().mockResolvedValue(undefined);
    const existing = { update };
    jest.mocked(StaffWorkSchedule.findOne).mockResolvedValue(existing as never);
    await staffPortalService.setSchedule(3, { userId: 42, date: '2026-10-26', shiftStart: '08:30', shiftEnd: '16:30', location: 'Library' });
    expect(StaffWorkSchedule.findOne).toHaveBeenCalledWith({ where: { userId: 42, date: '2026-10-26' } });
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ updatedBy: 3, shiftStart: '08:30', location: 'Library' }));
    expect(StaffWorkSchedule.create).not.toHaveBeenCalled();
  });
});

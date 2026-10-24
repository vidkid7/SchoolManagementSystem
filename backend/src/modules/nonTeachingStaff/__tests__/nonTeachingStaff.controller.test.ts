import nonTeachingStaffController from '../nonTeachingStaff.controller';
import staffPortalService from '../staffPortal.service';
import { UserRole } from '@models/User.model';

jest.mock('../staffPortal.service', () => ({
  __esModule: true,
  default: { updateTaskStatus: jest.fn() },
}));

function makeResponse() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
}

describe('NonTeachingStaffController task authorization', () => {
  it('hides tasks the staff member does not own', async () => {
    jest.mocked(staffPortalService.updateTaskStatus).mockResolvedValue(null);
    const response = makeResponse();
    await nonTeachingStaffController.updateTaskStatus({
      params: { taskId: '7' }, body: { status: 'completed' },
      user: { userId: 90211, role: UserRole.NON_TEACHING_STAFF },
    } as never, response as never);
    expect(staffPortalService.updateTaskStatus).toHaveBeenCalledWith(7, 90211, false, 'completed', undefined);
    expect(response.status).toHaveBeenCalledWith(404);
  });
});

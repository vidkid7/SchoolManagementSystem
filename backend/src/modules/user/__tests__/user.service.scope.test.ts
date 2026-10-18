import User from '../../../models/User.model';
import { UserService } from '../user.service';

describe('UserService school scope', () => {
  const service = new UserService();

  afterEach(() => jest.restoreAllMocks());

  it('restricts the user list query to the authenticated school', async () => {
    const findAndCountAll = jest.spyOn(User, 'findAndCountAll').mockResolvedValue({ count: 0, rows: [] } as any);

    await service.getAllUsers({ page: 1, limit: 10 }, 'school-1');

    expect(findAndCountAll).toHaveBeenCalledWith(expect.objectContaining({
      where: { schoolConfigId: 'school-1' },
    }));
  });

  it('does not return a user from a different school', async () => {
    const findOne = jest.spyOn(User, 'findOne').mockResolvedValue(null);

    await expect(service.getUserById(22, 'school-1')).rejects.toThrow('User not found');

    expect(findOne).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 22, schoolConfigId: 'school-1' },
    }));
  });

  it('does not update a user from a different school', async () => {
    const findOne = jest.spyOn(User, 'findOne').mockResolvedValue(null);

    await expect(service.updateUser(22, 'school-1', { status: 'inactive' as any }))
      .rejects.toThrow('User not found');

    expect(findOne).toHaveBeenCalledWith({ where: { userId: 22, schoolConfigId: 'school-1' } });
  });

  it('limits aggregate counts to the authenticated school', async () => {
    const count = jest.spyOn(User, 'count').mockResolvedValue(0);

    await service.getUserStats('school-1');

    expect(count).toHaveBeenCalledTimes(4);
    expect(count).toHaveBeenNthCalledWith(1, { where: { schoolConfigId: 'school-1' } });
  });
});

import User from '../../../models/User.model';
import { UserService } from '../user.service';

describe('UserService role assignment boundary', () => {
  const service = new UserService();

  it.each(['School_Admin', 'Municipality_Admin'])(
    'rejects %s creation through generic school user management', async (roleId) => {
    const findOne = jest.spyOn(User, 'findOne');

    await expect(service.createUser({
      username: 'restricted-admin',
      email: 'restricted-admin@example.test',
      password: 'SecurePassword123!',
      roleId
    })).rejects.toThrow('This role cannot be assigned through school user management');

    expect(findOne).not.toHaveBeenCalled();
    findOne.mockRestore();
  });

  it.each(['School_Admin', 'Municipality_Admin', 'Super_Admin'])(
    'rejects %s assignment before updating a user', async (roleId) => {
    const findByPk = jest.spyOn(User, 'findByPk');

    await expect(service.updateUser(10, 'school-1', { roleId }))
      .rejects.toThrow('This role cannot be assigned through school user management');

    expect(findByPk).not.toHaveBeenCalled();
    findByPk.mockRestore();
  });

  it('persists the authenticated tenant scope supplied by the controller', async () => {
    const findOne = jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const created = {
      userId: 12,
      username: 'transport-manager',
      email: 'transport@example.test',
      role: 'Transport_Manager',
      status: 'active',
      municipalityId: 'municipality-1',
      schoolConfigId: 'school-1',
      phoneNumber: undefined,
    } as unknown as User;
    const create = jest.spyOn(User, 'create').mockResolvedValue(created);

    await service.createUser({
      username: 'transport-manager',
      email: 'transport@example.test',
      password: 'SecurePassword123!',
      roleId: 'Transport_Manager',
      municipalityId: 'municipality-1',
      schoolConfigId: 'school-1',
    });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      municipalityId: 'municipality-1',
      schoolConfigId: 'school-1',
    }));
    findOne.mockRestore();
    create.mockRestore();
  });
});

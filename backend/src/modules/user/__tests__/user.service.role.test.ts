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

    await expect(service.updateUser(10, { roleId }))
      .rejects.toThrow('This role cannot be assigned through school user management');

    expect(findByPk).not.toHaveBeenCalled();
    findByPk.mockRestore();
  });
});

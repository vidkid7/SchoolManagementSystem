import User, { UserRole, UserStatus } from '@models/User.model';
import authService from '../auth.service';

describe('AuthService.register tenant scope', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('requires a school assignment for school users', async () => {
    const findOne = jest.spyOn(User, 'findOne');
    const create = jest.spyOn(User, 'create');

    await expect(authService.register({
      username: 'unscoped-user',
      email: 'unscoped@example.test',
      password: 'SecurePassword123!',
      role: UserRole.TRANSPORT_MANAGER,
    })).rejects.toThrow('A school assignment is required to register a school user');

    expect(findOne).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it.each([UserRole.SCHOOL_ADMIN, UserRole.MUNICIPALITY_ADMIN])(
    'does not allow registration of privileged role %s', async role => {
      const findOne = jest.spyOn(User, 'findOne');
      const create = jest.spyOn(User, 'create');

      await expect(authService.register({
        username: 'privileged-user',
        email: 'privileged@example.test',
        password: 'SecurePassword123!',
        role,
        schoolConfigId: 'school-1',
      })).rejects.toThrow('This role cannot be assigned through school user registration');

      expect(findOne).not.toHaveBeenCalled();
      expect(create).not.toHaveBeenCalled();
    }
  );

  it('persists the authenticated tenant assignment on registration', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    const createdUser = {
      toJSON: () => ({
        userId: 42,
        username: 'scoped-transport',
        role: UserRole.TRANSPORT_MANAGER,
        status: UserStatus.ACTIVE,
        municipalityId: 'municipality-1',
        schoolConfigId: 'school-1',
      }),
    } as User;
    const create = jest.spyOn(User, 'create').mockResolvedValue(createdUser);

    await authService.register({
      username: 'scoped-transport',
      email: 'scoped-transport@example.test',
      password: 'SecurePassword123!',
      role: UserRole.TRANSPORT_MANAGER,
      municipalityId: 'municipality-1',
      schoolConfigId: 'school-1',
    });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      municipalityId: 'municipality-1',
      schoolConfigId: 'school-1',
      status: UserStatus.ACTIVE,
    }));
  });
});

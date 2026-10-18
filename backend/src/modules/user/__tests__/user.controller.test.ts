import { UserController } from '../user.controller';

describe('UserController.createUser tenant ownership', () => {
  it('uses authenticated tenant scope instead of client-supplied tenant IDs', async () => {
    const createUser = jest.fn().mockResolvedValue({ userId: 1 });
    const controller = new UserController();
    (controller as any).userService = { createUser };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    await controller.createUser({
      body: {
        username: 'transport-manager',
        municipalityId: 'attacker-municipality',
        schoolConfigId: 'attacker-school',
      },
      user: {
        userId: 7,
        username: 'admin',
        email: 'admin@example.test',
        role: 'School_Admin',
        municipalityId: 'municipality-1',
        schoolConfigId: 'school-1',
      },
    } as any, res as any);

    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({
      municipalityId: 'municipality-1',
      schoolConfigId: 'school-1',
    }));
    expect(createUser.mock.calls[0][0]).not.toEqual(expect.objectContaining({
      municipalityId: 'attacker-municipality',
      schoolConfigId: 'attacker-school',
    }));
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

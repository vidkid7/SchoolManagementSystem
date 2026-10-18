import { up } from '../20261018000003-ensure-user-name-columns';

describe('ensure user name columns migration', () => {
  it('adds only missing name columns', async () => {
    const addColumn = jest.fn().mockResolvedValue(undefined);
    const queryInterface = {
      describeTable: jest.fn().mockResolvedValue({ first_name: {}, username: {} }),
      addColumn,
    };

    await up(queryInterface as any, {} as any);

    expect(addColumn).toHaveBeenCalledTimes(1);
    expect(addColumn).toHaveBeenCalledWith('users', 'last_name', expect.objectContaining({ allowNull: true }));
  });

  it('does nothing when both name columns already exist', async () => {
    const addColumn = jest.fn();
    const queryInterface = {
      describeTable: jest.fn().mockResolvedValue({ first_name: {}, last_name: {} }),
      addColumn,
    };

    await up(queryInterface as any, {} as any);

    expect(addColumn).not.toHaveBeenCalled();
  });
});

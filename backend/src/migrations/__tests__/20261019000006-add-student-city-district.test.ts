import { down, up } from '../20261019000006-add-student-city-district';

describe('student city and district migration', () => {
  it('adds only missing columns', async () => {
    const queryInterface = {
      describeTable: jest.fn().mockResolvedValue({ city: {}, id: {} }),
      addColumn: jest.fn().mockResolvedValue(undefined),
    };

    await up(queryInterface as any);

    expect(queryInterface.addColumn).toHaveBeenCalledTimes(1);
    expect(queryInterface.addColumn).toHaveBeenCalledWith('students', 'district', expect.objectContaining({ allowNull: true }));
  });

  it('does nothing when the students table is not available', async () => {
    const queryInterface = { describeTable: jest.fn().mockRejectedValue(new Error('missing table')), addColumn: jest.fn() };

    await up(queryInterface as any);

    expect(queryInterface.addColumn).not.toHaveBeenCalled();
  });

  it('drops existing columns during rollback', async () => {
    const queryInterface = {
      describeTable: jest.fn().mockResolvedValue({ city: {}, district: {}, id: {} }),
      removeColumn: jest.fn().mockResolvedValue(undefined),
    };

    await down(queryInterface as any);

    expect(queryInterface.removeColumn).toHaveBeenNthCalledWith(1, 'students', 'district');
    expect(queryInterface.removeColumn).toHaveBeenNthCalledWith(2, 'students', 'city');
  });
});

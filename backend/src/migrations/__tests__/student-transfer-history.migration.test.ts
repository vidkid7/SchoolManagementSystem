import { up, down } from '../20261023000001-create-student-transfer-history';

describe('student transfer history migration', () => {
  it('creates the transfer history table with reason and lookup indexes', async () => {
    const queryInterface = {
      showAllTables: jest.fn().mockResolvedValue([]),
      createTable: jest.fn().mockResolvedValue(undefined),
      addIndex: jest.fn().mockResolvedValue(undefined),
    };

    await up(queryInterface as never);

    expect(queryInterface.createTable).toHaveBeenCalledWith('student_transfer_history', expect.objectContaining({
      student_id: expect.objectContaining({ allowNull: false }),
      reason: expect.objectContaining({ allowNull: true }),
      transferred_by: expect.objectContaining({ allowNull: true }),
      school_config_id: expect.objectContaining({ allowNull: true }),
    }));
    expect(queryInterface.addIndex).toHaveBeenCalledTimes(2);
  });

  it('skips table creation when transfer history already exists', async () => {
    const queryInterface = {
      showAllTables: jest.fn().mockResolvedValue(['student_transfer_history']),
      createTable: jest.fn(),
      addIndex: jest.fn(),
    };

    await up(queryInterface as never);

    expect(queryInterface.createTable).not.toHaveBeenCalled();
    expect(queryInterface.addIndex).not.toHaveBeenCalled();
  });

  it('drops the transfer history table on rollback', async () => {
    const queryInterface = { dropTable: jest.fn().mockResolvedValue(undefined) };

    await down(queryInterface as never);

    expect(queryInterface.dropTable).toHaveBeenCalledWith('student_transfer_history');
  });
});

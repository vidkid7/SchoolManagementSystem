import { up, down } from '../20261022000003-create-staff-task-schedule-tables';

describe('staff task/schedule migration', () => {
  it('creates tenant-scoped task and schedule tables with their indexes', async () => {
    const queryInterface = {
      showAllTables: jest.fn().mockResolvedValue([]),
      createTable: jest.fn().mockResolvedValue(undefined),
      addIndex: jest.fn().mockResolvedValue(undefined),
    };

    await up(queryInterface as never);

    expect(queryInterface.createTable).toHaveBeenCalledTimes(2);
    expect(queryInterface.createTable).toHaveBeenCalledWith('staff_tasks', expect.objectContaining({
      assigned_to: expect.objectContaining({ allowNull: false }),
      municipality_id: expect.anything(),
      school_config_id: expect.anything(),
    }));
    expect(queryInterface.createTable).toHaveBeenCalledWith('staff_work_schedules', expect.objectContaining({
      user_id: expect.objectContaining({ allowNull: false }),
      municipality_id: expect.anything(),
      school_config_id: expect.anything(),
    }));
    expect(queryInterface.addIndex).toHaveBeenCalledTimes(5);
  });

  it('recognizes Sequelize table-name objects and skips existing tables', async () => {
    const queryInterface = {
      showAllTables: jest.fn().mockResolvedValue([{ tableName: 'staff_tasks' }, { tableName: 'staff_work_schedules' }]),
      createTable: jest.fn(),
      addIndex: jest.fn(),
    };

    await up(queryInterface as never);

    expect(queryInterface.createTable).not.toHaveBeenCalled();
    expect(queryInterface.addIndex).not.toHaveBeenCalled();
  });

  it('drops schedules before their dependent task table', async () => {
    const queryInterface = { dropTable: jest.fn().mockResolvedValue(undefined) };
    await down(queryInterface as never);
    expect(queryInterface.dropTable.mock.calls).toEqual([['staff_work_schedules'], ['staff_tasks']]);
  });
});

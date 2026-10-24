import type { Sequelize } from 'sequelize';
import { repairMissingTenantColumns } from '../tenantSchemaRepair';

const fakeDatabase = (query: jest.Mock) => ({ query }) as unknown as Pick<Sequelize, 'query'>;

describe('repairMissingTenantColumns', () => {
  it('uses one metadata scan and adds only missing tenant columns for existing tables', async () => {
    const query = jest.fn()
      .mockResolvedValueOnce([[
        { TABLE_NAME: 'students', COLUMN_NAME: 'municipality_id' },
        { TABLE_NAME: 'students', COLUMN_NAME: 'school_config_id' },
        { TABLE_NAME: 'staff', COLUMN_NAME: 'municipality_id' },
      ], {}])
      .mockResolvedValue([[], {}]);

    await repairMissingTenantColumns(fakeDatabase(query), ['students', 'staff', 'missing_table']);

    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[0][0]).toContain('IN (:tenantTables)');
    expect(query.mock.calls[0][1]).toEqual({ replacements: { tenantTables: ['students', 'staff', 'missing_table'] } });
    expect(query.mock.calls.slice(1).map(([sql]) => sql)).toEqual([
      'ALTER TABLE `staff` ADD COLUMN school_config_id CHAR(36) NULL',
    ]);
  });

  it('adds both tenant columns when an existing table has neither', async () => {
    const query = jest.fn()
      .mockResolvedValueOnce([[{ TABLE_NAME: 'events', COLUMN_NAME: null }], {}])
      .mockResolvedValue([[], {}]);

    await repairMissingTenantColumns(fakeDatabase(query), ['events']);

    expect(query.mock.calls.slice(1).map(([sql]) => sql)).toEqual([
      'ALTER TABLE `events` ADD COLUMN municipality_id CHAR(36) NULL',
      'ALTER TABLE `events` ADD COLUMN school_config_id CHAR(36) NULL',
    ]);
  });

  it('continues startup if the metadata scan fails', async () => {
    const query = jest.fn().mockRejectedValue(new Error('metadata unavailable'));

    await expect(repairMissingTenantColumns(fakeDatabase(query), ['students'])).resolves.toBeUndefined();
    expect(query).toHaveBeenCalledTimes(1);
  });
});

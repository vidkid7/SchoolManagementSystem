import { up } from '../20261019000004-ensure-refunds-table';

describe('ensure refunds table migration', () => {
  it('creates the refunds table and tenant columns once, and can run again safely', async () => {
    const tables = new Set(['school_config', 'municipalities', 'payments', 'invoices', 'students', 'users']);
    const columns = new Set<string>();
    const indexes = new Set<string>();
    const foreignKeys = new Set<string>();
    const createTable = jest.fn(async (name: string, definition: Record<string, unknown>) => {
      tables.add(name);
      Object.keys(definition).forEach((column) => columns.add(column));
    });
    const addIndex = jest.fn(async (_table: string, _fields: string[], options: { name: string }) => {
      indexes.add(options.name);
    });
    const addColumn = jest.fn(async (_table: string, column: string) => {
      columns.add(column);
    });
    const addConstraint = jest.fn(async (_table: string, options: { name: string }) => {
      foreignKeys.add(options.name);
    });
    const query = jest.fn(async (sql: string) => {
      if (sql.includes('information_schema.KEY_COLUMN_USAGE')) {
        return [[...(foreignKeys.size ? [{ CONSTRAINT_NAME: 'fk_refunds_school_config_id' }] : [])], {}];
      }
      return [[], {}];
    });
    const queryInterface = {
      showAllTables: async () => [...tables],
      describeTable: async (_table: string) => Object.fromEntries([...columns].map((column) => [column, {}])),
      showIndex: async (_table: string) => [...indexes].map((name) => ({ name })),
      createTable,
      addIndex,
      addColumn,
      addConstraint,
      sequelize: { query },
    };

    await up(queryInterface as never);
    await up(queryInterface as never);

    expect(createTable).toHaveBeenCalledTimes(1);
    expect(createTable).toHaveBeenCalledWith('refunds', expect.objectContaining({ payment_id: expect.any(Object) }));
    expect(columns.has('school_config_id')).toBe(true);
    expect(columns.has('municipality_id')).toBe(true);
    expect(addConstraint).toHaveBeenCalledTimes(1);
    expect(indexes).toContain('idx_refunds_muni_school');
    expect(addColumn).toHaveBeenCalledTimes(2);
    expect(addIndex).toHaveBeenCalledTimes(10);
  });
});

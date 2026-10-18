import { up } from '../20261018000004-add-uuid-audit-entity-support';

describe('UUID audit entity support migration', () => {
  it('adds the UUID column and makes the numeric entity ID nullable', async () => {
    const addColumn = jest.fn().mockResolvedValue(undefined);
    const changeColumn = jest.fn().mockResolvedValue(undefined);
    const queryInterface = {
      describeTable: jest.fn().mockResolvedValue({ entity_id: { allowNull: false } }),
      addColumn,
      changeColumn,
    };

    await up(queryInterface as any, {} as any);

    expect(addColumn).toHaveBeenCalledWith('audit_logs', 'entity_uuid', expect.objectContaining({ allowNull: true }));
    expect(changeColumn).toHaveBeenCalledWith('audit_logs', 'entity_id', expect.objectContaining({ allowNull: true }));
  });

  it('is repeat-safe when both schema changes are already applied', async () => {
    const addColumn = jest.fn();
    const changeColumn = jest.fn();
    const queryInterface = {
      describeTable: jest.fn().mockResolvedValue({
        entity_id: { allowNull: true },
        entity_uuid: { allowNull: true },
      }),
      addColumn,
      changeColumn,
    };

    await up(queryInterface as any, {} as any);

    expect(addColumn).not.toHaveBeenCalled();
    expect(changeColumn).not.toHaveBeenCalled();
  });
});

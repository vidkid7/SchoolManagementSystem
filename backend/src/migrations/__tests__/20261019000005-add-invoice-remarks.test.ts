import { down, up } from '../20261019000005-add-invoice-remarks';

describe('add invoice remarks migration', () => {
  it('adds the nullable remarks column idempotently and can roll it back', async () => {
    const columns: Record<string, unknown> = { invoice_id: {} };
    const addColumn = jest.fn(async (_table: string, name: string, definition: unknown) => {
      columns[name] = definition;
    });
    const removeColumn = jest.fn(async (_table: string, name: string) => {
      delete columns[name];
    });
    const queryInterface = {
      describeTable: jest.fn(async () => ({ ...columns })),
      addColumn,
      removeColumn,
    };

    await up(queryInterface as never);
    await up(queryInterface as never);

    expect(addColumn).toHaveBeenCalledTimes(1);
    expect(addColumn).toHaveBeenCalledWith('invoices', 'remarks', expect.objectContaining({ allowNull: true }));

    await down(queryInterface as never);
    expect(removeColumn).toHaveBeenCalledWith('invoices', 'remarks');
    expect(columns).not.toHaveProperty('remarks');
  });
});

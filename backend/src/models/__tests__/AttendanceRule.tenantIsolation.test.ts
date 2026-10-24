import AttendanceRule from '../AttendanceRule.model';
import { runWithTenantContext } from '@middleware/tenantContext';
import { Op } from 'sequelize';

describe('AttendanceRule tenant isolation', () => {
  const municipalityId = '11111111-1111-4111-8111-111111111111';

  it('adds the active municipality to reads', async () => {
    const options: { where: Record<string, unknown> } = { where: { isActive: true } };
    let hookPromise: Promise<unknown> | undefined;

    runWithTenantContext({ municipalityId, schoolConfigIds: [], enforceIsolation: true }, () => {
      hookPromise = (AttendanceRule as any).runHooks('beforeFind', options);
    });
    await hookPromise;

    expect(options.where).toEqual({
      [Op.and]: [
        { isActive: true },
        { municipality_id: municipalityId },
      ],
    });
  });

  it('assigns the active municipality to newly created rules', async () => {
    const rule = AttendanceRule.build({ name: 'Municipal attendance policy' });
    let hookPromise: Promise<unknown> | undefined;

    runWithTenantContext({ municipalityId, schoolConfigIds: [], enforceIsolation: true }, () => {
      hookPromise = (AttendanceRule as any).runHooks('beforeCreate', rule, {});
    });
    await hookPromise;

    expect(rule.getDataValue('municipalityId' as any)).toBe(municipalityId);
  });

  it.each(['beforeBulkUpdate', 'beforeBulkDestroy'])('scopes %s to the active municipality', async (hookName) => {
    const options: { where: Record<string, unknown>; attributes?: Record<string, unknown> } = {
      where: { isActive: true },
      attributes: { isActive: false },
    };
    let hookPromise: Promise<unknown> | undefined;

    runWithTenantContext({ municipalityId, schoolConfigIds: [], enforceIsolation: true }, () => {
      hookPromise = (AttendanceRule as any).runHooks(hookName, options);
    });
    await hookPromise;

    expect(options.where).toEqual({
      [Op.and]: [
        { isActive: true },
        { municipality_id: municipalityId },
      ],
    });
  });
});

import { describe, expect, it } from '@jest/globals';
import { assignPermissionsSchema } from '../rolePermission.validation';

describe('assignPermissionsSchema', () => {
  it('allows an empty list to clear a role’s permissions', () => {
    const { error, value } = assignPermissionsSchema.validate({ permissionIds: [] });

    expect(error).toBeUndefined();
    expect(value.permissionIds).toEqual([]);
  });

  it('rejects malformed permission IDs', () => {
    const { error } = assignPermissionsSchema.validate({ permissionIds: ['not-a-uuid'] });

    expect(error?.details[0]?.message).toBe('Invalid permission ID format');
  });
});

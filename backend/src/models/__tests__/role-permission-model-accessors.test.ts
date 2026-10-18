import { describe, expect, it } from '@jest/globals';
import Role from '../Role.model';
import Permission, { PermissionAction, PermissionCategory } from '../Permission.model';
import RolePermission from '../RolePermission.model';

describe('role and permission Sequelize accessors', () => {
  it('keeps UUID and relationship properties backed by Sequelize accessors', () => {
    const role = Role.build({ id: '1cf11d90-90d6-4054-9acd-e004b95b26fa', name: 'QA Role', code: 'QA_ROLE' });
    const permission = Permission.build({
      id: '34a5e9c2-e8d4-4edc-a60b-3dc06eebea48',
      name: 'QA Permission',
      code: 'qa:read',
      category: PermissionCategory.SYSTEM,
      action: PermissionAction.READ,
      resource: 'qa',
    });
    const assignment = RolePermission.build({ roleId: role.id, permissionId: permission.id });

    expect(role.id).toBe('1cf11d90-90d6-4054-9acd-e004b95b26fa');
    expect(permission.id).toBe('34a5e9c2-e8d4-4edc-a60b-3dc06eebea48');
    expect(assignment.roleId).toBe(role.id);
    expect(assignment.permissionId).toBe(permission.id);
  });
});

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import sequelize from '@config/database';
import Role from '@models/Role.model';
import Permission, { PermissionCategory, PermissionAction } from '@models/Permission.model';
import RolePermission from '@models/RolePermission.model';
import rolePermissionService from '../rolePermission.service';
import { NotFoundError, ValidationError } from '@middleware/errorHandler';

describe('RolePermissionService', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await RolePermission.destroy({ where: {}, force: true });
    await Permission.destroy({ where: {}, force: true });
    await Role.destroy({ where: {}, force: true });
  });

  describe('Role Management', () => {
    describe('createRole', () => {
      it('should create a new role', async () => {
        const roleData = {
          name: 'Test Role',
          code: 'TEST_ROLE',
          description: 'A test role',
        };

        const role = await rolePermissionService.createRole(roleData, 1);

        expect(role).toBeDefined();
        expect(role.name).toBe(roleData.name);
        expect(role.code).toBe(roleData.code);
        expect(role.description).toBe(roleData.description);
        expect(role.isSystem).toBe(false);
        expect(role.isActive).toBe(true);
      });

      it('should throw error if role code already exists', async () => {
        const roleData = {
          name: 'Test Role',
          code: 'TEST_ROLE',
        };

        await rolePermissionService.createRole(roleData, 1);

        await expect(
          rolePermissionService.createRole(roleData, 1)
        ).rejects.toThrow(ValidationError);
      });
    });

    describe('getRoles', () => {
      it('should return all active roles', async () => {
        await Role.create({
          name: 'Role 1',
          code: 'ROLE_1',
          isSystem: false,
          isActive: true,
        });

        await Role.create({
          name: 'Role 2',
          code: 'ROLE_2',
          isSystem: false,
          isActive: false,
        });

        const roles = await rolePermissionService.getRoles();

        expect(roles).toHaveLength(1);
        expect(roles[0].name).toBe('Role 1');
      });

      it('should return all roles including inactive when specified', async () => {
        await Role.create({
          name: 'Role 1',
          code: 'ROLE_1',
          isSystem: false,
          isActive: true,
        });

        await Role.create({
          name: 'Role 2',
          code: 'ROLE_2',
          isSystem: false,
          isActive: false,
        });

        const roles = await rolePermissionService.getRoles(true);

        expect(roles).toHaveLength(2);
      });
    });

    describe('getRoleById', () => {
      it('should return role with permissions', async () => {
        const role = await Role.create({
          name: 'Test Role',
          code: 'TEST_ROLE',
          isSystem: false,
          isActive: true,
        });

        const permission = await Permission.create({
          name: 'Test Permission',
          code: 'test_permission',
          category: PermissionCategory.STUDENT,
          action: PermissionAction.READ,
          resource: 'student',
          isSystem: false,
          isActive: true,
        });

        await RolePermission.create({
          roleId: role.id,
          permissionId: permission.id,
        });

        const result = await rolePermissionService.getRoleById(role.id);

        expect(result).toBeDefined();
        expect(result.name).toBe('Test Role');
        expect(result.permissions).toHaveLength(1);
        expect(result.permissions[0].code).toBe('test_permission');
      });

      it('should throw error if role not found', async () => {
        await expect(
          rolePermissionService.getRoleById('00000000-0000-0000-0000-000000000000')
        ).rejects.toThrow(NotFoundError);
      });
    });

    describe('updateRole', () => {
      it('should update role', async () => {
        const role = await Role.create({
          name: 'Test Role',
          code: 'TEST_ROLE',
          isSystem: false,
          isActive: true,
        });

        const updated = await rolePermissionService.updateRole(
          role.id,
          { name: 'Updated Role' },
          1
        );

        expect(updated.name).toBe('Updated Role');
        expect(updated.code).toBe('TEST_ROLE');
      });

      it('should not allow updating system roles', async () => {
        const role = await Role.create({
          name: 'System Role',
          code: 'SYSTEM_ROLE',
          isSystem: true,
          isActive: true,
        });

        await expect(
          rolePermissionService.updateRole(role.id, { name: 'Updated' }, 1)
        ).rejects.toThrow(ValidationError);
      });
    });

    describe('deleteRole', () => {
      it('should soft delete role', async () => {
        const role = await Role.create({
          name: 'Test Role',
          code: 'TEST_ROLE',
          isSystem: false,
          isActive: true,
        });

        await rolePermissionService.deleteRole(role.id, 1);

        const deleted = await Role.findByPk(role.id);
        expect(deleted?.isActive).toBe(false);
      });

      it('should not allow deleting system roles', async () => {
        const role = await Role.create({
          name: 'System Role',
          code: 'SYSTEM_ROLE',
          isSystem: true,
          isActive: true,
        });

        await expect(
          rolePermissionService.deleteRole(role.id, 1)
        ).rejects.toThrow(ValidationError);
      });
    });
  });

  describe('Permission Management', () => {
    describe('createPermission', () => {
      it('should create a new permission', async () => {
        const permData = {
          name: 'Test Permission',
          code: 'test_permission',
          category: PermissionCategory.STUDENT,
          action: PermissionAction.READ,
          resource: 'student',
        };

        const permission = await rolePermissionService.createPermission(permData, 1);

        expect(permission).toBeDefined();
        expect(permission.name).toBe(permData.name);
        expect(permission.code).toBe(permData.code);
        expect(permission.category).toBe(permData.category);
        expect(permission.action).toBe(permData.action);
        expect(permission.resource).toBe(permData.resource);
      });

      it('should throw error if permission code already exists', async () => {
        const permData = {
          name: 'Test Permission',
          code: 'test_permission',
          category: PermissionCategory.STUDENT,
          action: PermissionAction.READ,
          resource: 'student',
        };

        await rolePermissionService.createPermission(permData, 1);

        await expect(
          rolePermissionService.createPermission(permData, 1)
        ).rejects.toThrow(ValidationError);
      });
    });

    describe('getPermissions', () => {
      it('should return all active permissions', async () => {
        await Permission.create({
          name: 'Permission 1',
          code: 'permission_1',
          category: PermissionCategory.STUDENT,
          action: PermissionAction.READ,
          resource: 'student',
          isSystem: false,
          isActive: true,
        });

        await Permission.create({
          name: 'Permission 2',
          code: 'permission_2',
          category: PermissionCategory.STAFF,
          action: PermissionAction.CREATE,
          resource: 'staff',
          isSystem: false,
          isActive: false,
        });

        const permissions = await rolePermissionService.getPermissions();

        expect(permissions).toHaveLength(1);
        expect(permissions[0].name).toBe('Permission 1');
      });

      it('should filter permissions by category', async () => {
        await Permission.create({
          name: 'Student Permission',
          code: 'student_permission',
          category: PermissionCategory.STUDENT,
          action: PermissionAction.READ,
          resource: 'student',
          isSystem: false,
          isActive: true,
        });

        await Permission.create({
          name: 'Staff Permission',
          code: 'staff_permission',
          category: PermissionCategory.STAFF,
          action: PermissionAction.READ,
          resource: 'staff',
          isSystem: false,
          isActive: true,
        });

        const permissions = await rolePermissionService.getPermissions({
          category: PermissionCategory.STUDENT,
        });

        expect(permissions).toHaveLength(1);
        expect(permissions[0].category).toBe(PermissionCategory.STUDENT);
      });
    });
  });

  describe('Role-Permission Assignment', () => {
    describe('assignPermissionsToRole', () => {
      it('should assign permissions to role', async () => {
        const role = await Role.create({
          name: 'Test Role',
          code: 'TEST_ROLE',
          isSystem: false,
          isActive: true,
        });

        const perm1 = await Permission.create({
          name: 'Permission 1',
          code: 'permission_1',
          category: PermissionCategory.STUDENT,
          action: PermissionAction.READ,
          resource: 'student',
          isSystem: false,
          isActive: true,
        });

        const perm2 = await Permission.create({
          name: 'Permission 2',
          code: 'permission_2',
          category: PermissionCategory.STAFF,
          action: PermissionAction.READ,
          resource: 'staff',
          isSystem: false,
          isActive: true,
        });

        await rolePermissionService.assignPermissionsToRole(
          role.id,
          [perm1.id, perm2.id],
          1
        );

        const permissions = await rolePermissionService.getRolePermissions(role.id);

        expect(permissions).toHaveLength(2);
      });

      it('should replace existing permissions', async () => {
        const role = await Role.create({
          name: 'Test Role',
          code: 'TEST_ROLE',
          isSystem: false,
          isActive: true,
        });

        const perm1 = await Permission.create({
          name: 'Permission 1',
          code: 'permission_1',
          category: PermissionCategory.STUDENT,
          action: PermissionAction.READ,
          resource: 'student',
          isSystem: false,
          isActive: true,
        });

        const perm2 = await Permission.create({
          name: 'Permission 2',
          code: 'permission_2',
          category: PermissionCategory.STAFF,
          action: PermissionAction.READ,
          resource: 'staff',
          isSystem: false,
          isActive: true,
        });

        // Assign first permission
        await rolePermissionService.assignPermissionsToRole(role.id, [perm1.id], 1);

        // Replace with second permission
        await rolePermissionService.assignPermissionsToRole(role.id, [perm2.id], 1);

        const permissions = await rolePermissionService.getRolePermissions(role.id);

        expect(permissions).toHaveLength(1);
        expect(permissions[0].code).toBe('permission_2');
      });

      it('should not allow modifying system role permissions', async () => {
        const role = await Role.create({
          name: 'System Role',
          code: 'SYSTEM_ROLE',
          isSystem: true,
          isActive: true,
        });

        const perm = await Permission.create({
          name: 'Permission',
          code: 'permission',
          category: PermissionCategory.STUDENT,
          action: PermissionAction.READ,
          resource: 'student',
          isSystem: false,
          isActive: true,
        });

        await expect(
          rolePermissionService.assignPermissionsToRole(role.id, [perm.id], 1)
        ).rejects.toThrow(ValidationError);
      });
    });

    describe('roleHasPermission', () => {
      it('should return true if role has permission', async () => {
        const role = await Role.create({
          name: 'Test Role',
          code: 'TEST_ROLE',
          isSystem: false,
          isActive: true,
        });

        const permission = await Permission.create({
          name: 'Test Permission',
          code: 'test_permission',
          category: PermissionCategory.STUDENT,
          action: PermissionAction.READ,
          resource: 'student',
          isSystem: false,
          isActive: true,
        });

        await RolePermission.create({
          roleId: role.id,
          permissionId: permission.id,
        });

        const hasPermission = await rolePermissionService.roleHasPermission(
          role.id,
          'test_permission'
        );

        expect(hasPermission).toBe(true);
      });

      it('should return false if role does not have permission', async () => {
        const role = await Role.create({
          name: 'Test Role',
          code: 'TEST_ROLE',
          isSystem: false,
          isActive: true,
        });

        const hasPermission = await rolePermissionService.roleHasPermission(
          role.id,
          'nonexistent_permission'
        );

        expect(hasPermission).toBe(false);
      });
    });

    describe('removePermissionFromRole', () => {
      it('should remove permission from role', async () => {
        const role = await Role.create({
          name: 'Test Role',
          code: 'TEST_ROLE',
          isSystem: false,
          isActive: true,
        });

        const permission = await Permission.create({
          name: 'Test Permission',
          code: 'test_permission',
          category: PermissionCategory.STUDENT,
          action: PermissionAction.READ,
          resource: 'student',
          isSystem: false,
          isActive: true,
        });

        await RolePermission.create({
          roleId: role.id,
          permissionId: permission.id,
        });

        await rolePermissionService.removePermissionFromRole(role.id, permission.id, 1);

        const rolePermission = await RolePermission.findOne({
          where: { roleId: role.id, permissionId: permission.id },
        });

        expect(rolePermission).toBeNull();
      });

      it('should not allow removing permission from system role', async () => {
        const role = await Role.create({
          name: 'System Role',
          code: 'SYSTEM_ROLE',
          isSystem: true,
          isActive: true,
        });

        const permission = await Permission.create({
          name: 'Permission',
          code: 'permission',
          category: PermissionCategory.STUDENT,
          action: PermissionAction.READ,
          resource: 'student',
          isSystem: false,
          isActive: true,
        });

        await expect(
          rolePermissionService.removePermissionFromRole(role.id, permission.id, 1)
        ).rejects.toThrow(ValidationError);
      });
    });

    describe('getRoleByCode', () => {
      it('should return role by code', async () => {
        await Role.create({
          name: 'Test Role',
          code: 'TEST_ROLE',
          isSystem: false,
          isActive: true,
        });

        const foundRole = await rolePermissionService.getRoleByCode('TEST_ROLE');

        expect(foundRole).toBeDefined();
        expect(foundRole?.code).toBe('TEST_ROLE');
      });

      it('should return null if role not found', async () => {
        const foundRole = await rolePermissionService.getRoleByCode('NONEXISTENT');

        expect(foundRole).toBeNull();
      });
    });

    describe('Permission Filtering', () => {
      it('should filter permissions by action', async () => {
        await Permission.create({
          name: 'Read Permission',
          code: 'read_permission',
          category: PermissionCategory.STUDENT,
          action: PermissionAction.READ,
          resource: 'student',
          isSystem: false,
          isActive: true,
        });

        await Permission.create({
          name: 'Create Permission',
          code: 'create_permission',
          category: PermissionCategory.STUDENT,
          action: PermissionAction.CREATE,
          resource: 'student',
          isSystem: false,
          isActive: true,
        });

        const permissions = await rolePermissionService.getPermissions({
          action: PermissionAction.READ,
        });

        expect(permissions).toHaveLength(1);
        expect(permissions[0].action).toBe(PermissionAction.READ);
      });

      it('should include inactive permissions when specified', async () => {
        await Permission.create({
          name: 'Active Permission',
          code: 'active_permission',
          category: PermissionCategory.STUDENT,
          action: PermissionAction.READ,
          resource: 'student',
          isSystem: false,
          isActive: true,
        });

        await Permission.create({
          name: 'Inactive Permission',
          code: 'inactive_permission',
          category: PermissionCategory.STUDENT,
          action: PermissionAction.READ,
          resource: 'student',
          isSystem: false,
          isActive: false,
        });

        const permissions = await rolePermissionService.getPermissions({
          includeInactive: true,
        });

        expect(permissions.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('Role Permission Validation', () => {
      it('should validate permission IDs exist before assignment', async () => {
        const role = await Role.create({
          name: 'Test Role',
          code: 'TEST_ROLE',
          isSystem: false,
          isActive: true,
        });

        await expect(
          rolePermissionService.assignPermissionsToRole(
            role.id,
            ['nonexistent-id-1', 'nonexistent-id-2'],
            1
          )
        ).rejects.toThrow(ValidationError);
      });

      it('should handle empty permission array', async () => {
        const role = await Role.create({
          name: 'Test Role',
          code: 'TEST_ROLE',
          isSystem: false,
          isActive: true,
        });

        const permission = await Permission.create({
          name: 'Test Permission',
          code: 'test_permission',
          category: PermissionCategory.STUDENT,
          action: PermissionAction.READ,
          resource: 'student',
          isSystem: false,
          isActive: true,
        });

        // First assign a permission
        await rolePermissionService.assignPermissionsToRole(role.id, [permission.id], 1);

        // Then assign empty array (should remove all permissions)
        await rolePermissionService.assignPermissionsToRole(role.id, [], 1);

        const permissions = await rolePermissionService.getRolePermissions(role.id);
        expect(permissions).toHaveLength(0);
      });
    });
  });
});

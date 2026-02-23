import Role from '@models/Role.model';
import Permission, { PermissionCategory, PermissionAction } from '@models/Permission.model';
import RolePermission from '@models/RolePermission.model';
import { NotFoundError, ValidationError } from '@middleware/errorHandler';
import auditLogger from '@utils/auditLogger';
import { AuditAction } from '@models/AuditLog.model';
import { Transaction } from 'sequelize';

interface RoleData {
  name: string;
  code: string;
  description?: string;
}

interface PermissionData {
  name: string;
  code: string;
  description?: string;
  category: PermissionCategory;
  action: PermissionAction;
  resource: string;
}

interface RoleWithPermissions {
  id: string;
  name: string;
  code: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  permissions: Array<{
    id: string;
    name: string;
    code: string;
    category: PermissionCategory;
    action: PermissionAction;
    resource: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

class RolePermissionService {
  // ==================== Role Management ====================

  /**
   * Get all roles
   */
  async getRoles(includeInactive = false): Promise<Role[]> {
    const where: any = {};
    if (!includeInactive) {
      where.isActive = true;
    }

    return Role.findAll({
      where,
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
          where: { isActive: true },
          required: false,
        },
      ],
      order: [['name', 'ASC']],
    });
  }

  /**
   * Get role by ID with permissions
   */
  async getRoleById(id: string): Promise<RoleWithPermissions> {
    const role = await Role.findByPk(id, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
          where: { isActive: true },
          required: false,
        },
      ],
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    return this.formatRoleWithPermissions(role);
  }

  /**
   * Get role by code
   */
  async getRoleByCode(code: string): Promise<Role | null> {
    return Role.findOne({
      where: { code, isActive: true },
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
          where: { isActive: true },
          required: false,
        },
      ],
    });
  }

  /**
   * Create a new role
   */
  async createRole(
    data: RoleData,
    userId: number,
    transaction?: Transaction
  ): Promise<Role> {
    // Check if role with same code already exists
    const existing = await Role.findOne({
      where: { code: data.code },
    });

    if (existing) {
      throw new ValidationError('A role with this code already exists');
    }

    const role = await Role.create(
      {
        ...data,
        isSystem: false,
        isActive: true,
      },
      { transaction }
    );

    await auditLogger.log({
      userId,
      entityType: 'role',
      entityId: role.id as any,
      action: AuditAction.CREATE,
      newValue: data,
    });

    return role;
  }

  /**
   * Update a role
   */
  async updateRole(
    id: string,
    data: Partial<RoleData>,
    userId: number,
    transaction?: Transaction
  ): Promise<Role> {
    const role = await Role.findByPk(id);

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    if (role.isSystem) {
      throw new ValidationError('System roles cannot be modified');
    }

    // Check if code is being changed and if it already exists
    if (data.code && data.code !== role.code) {
      const existing = await Role.findOne({
        where: { code: data.code },
      });

      if (existing) {
        throw new ValidationError('A role with this code already exists');
      }
    }

    const oldData = role.toJSON();

    await role.update(data, { transaction });

    await auditLogger.log({
      userId,
      entityType: 'role',
      entityId: role.id as any,
      action: AuditAction.UPDATE,
      oldValue: oldData,
      newValue: data,
    });

    return role;
  }

  /**
   * Delete a role (soft delete)
   */
  async deleteRole(
    id: string,
    userId: number,
    transaction?: Transaction
  ): Promise<void> {
    const role = await Role.findByPk(id);

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    if (role.isSystem) {
      throw new ValidationError('System roles cannot be deleted');
    }

    await role.update({ isActive: false }, { transaction });

    await auditLogger.log({
      userId,
      entityType: 'role',
      entityId: role.id as any,
      action: AuditAction.DELETE,
      oldValue: role.toJSON(),
    });
  }

  // ==================== Permission Management ====================

  /**
   * Get all permissions
   */
  async getPermissions(filters?: {
    category?: PermissionCategory;
    action?: PermissionAction;
    includeInactive?: boolean;
  }): Promise<Permission[]> {
    const where: any = {};

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.action) {
      where.action = filters.action;
    }

    if (!filters?.includeInactive) {
      where.isActive = true;
    }

    return Permission.findAll({
      where,
      order: [
        ['category', 'ASC'],
        ['resource', 'ASC'],
        ['action', 'ASC'],
      ],
    });
  }

  /**
   * Get permission by ID
   */
  async getPermissionById(id: string): Promise<Permission> {
    const permission = await Permission.findByPk(id);

    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    return permission;
  }

  /**
   * Create a new permission
   */
  async createPermission(
    data: PermissionData,
    userId: number,
    transaction?: Transaction
  ): Promise<Permission> {
    // Check if permission with same code already exists
    const existing = await Permission.findOne({
      where: { code: data.code },
    });

    if (existing) {
      throw new ValidationError('A permission with this code already exists');
    }

    const permission = await Permission.create(
      {
        ...data,
        isSystem: false,
        isActive: true,
      },
      { transaction }
    );

    await auditLogger.log({
      userId,
      entityType: 'permission',
      entityId: permission.id as any,
      action: AuditAction.CREATE,
      newValue: data,
    });

    return permission;
  }

  /**
   * Update a permission
   */
  async updatePermission(
    id: string,
    data: Partial<PermissionData>,
    userId: number,
    transaction?: Transaction
  ): Promise<Permission> {
    const permission = await Permission.findByPk(id);

    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    if (permission.isSystem) {
      throw new ValidationError('System permissions cannot be modified');
    }

    // Check if code is being changed and if it already exists
    if (data.code && data.code !== permission.code) {
      const existing = await Permission.findOne({
        where: { code: data.code },
      });

      if (existing) {
        throw new ValidationError('A permission with this code already exists');
      }
    }

    const oldData = permission.toJSON();

    await permission.update(data, { transaction });

    await auditLogger.log({
      userId,
      entityType: 'permission',
      entityId: permission.id as any,
      action: AuditAction.UPDATE,
      oldValue: oldData,
      newValue: data,
    });

    return permission;
  }

  /**
   * Delete a permission (soft delete)
   */
  async deletePermission(
    id: string,
    userId: number,
    transaction?: Transaction
  ): Promise<void> {
    const permission = await Permission.findByPk(id);

    if (!permission) {
      throw new NotFoundError('Permission not found');
    }

    if (permission.isSystem) {
      throw new ValidationError('System permissions cannot be deleted');
    }

    await permission.update({ isActive: false }, { transaction });

    await auditLogger.log({
      userId,
      entityType: 'permission',
      entityId: permission.id as any,
      action: AuditAction.DELETE,
      oldValue: permission.toJSON(),
    });
  }

  // ==================== Role-Permission Assignment ====================

  /**
   * Assign permissions to a role
   */
  async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[],
    userId: number,
    transaction?: Transaction
  ): Promise<void> {
    const role = await Role.findByPk(roleId);

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    if (role.isSystem) {
      throw new ValidationError('System role permissions cannot be modified');
    }

    // Verify all permissions exist
    const permissions = await Permission.findAll({
      where: { id: permissionIds, isActive: true },
    });

    if (permissions.length !== permissionIds.length) {
      throw new ValidationError('One or more permissions not found');
    }

    // Get current permissions
    const currentPermissions = await RolePermission.findAll({
      where: { roleId },
    });

    const currentPermissionIds = currentPermissions.map((rp) => rp.permissionId);

    // Remove permissions that are no longer assigned
    const toRemove = currentPermissionIds.filter((id) => !permissionIds.includes(id));
    if (toRemove.length > 0) {
      await RolePermission.destroy({
        where: {
          roleId,
          permissionId: toRemove,
        },
        transaction,
      });
    }

    // Add new permissions
    const toAdd = permissionIds.filter((id) => !currentPermissionIds.includes(id));
    if (toAdd.length > 0) {
      await RolePermission.bulkCreate(
        toAdd.map((permissionId) => ({
          roleId,
          permissionId,
        })),
        { transaction }
      );
    }

    await auditLogger.log({
      userId,
      entityType: 'role_permission',
      entityId: roleId as any,
      action: AuditAction.UPDATE,
      oldValue: { permissionIds: currentPermissionIds },
      newValue: { permissionIds },
    });
  }

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(
    roleId: string,
    permissionId: string,
    userId: number,
    transaction?: Transaction
  ): Promise<void> {
    const role = await Role.findByPk(roleId);

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    if (role.isSystem) {
      throw new ValidationError('System role permissions cannot be modified');
    }

    await RolePermission.destroy({
      where: {
        roleId,
        permissionId,
      },
      transaction,
    });

    await auditLogger.log({
      userId,
      entityType: 'role_permission',
      entityId: roleId as any,
      action: AuditAction.DELETE,
      oldValue: { permissionId },
    });
  }

  /**
   * Get permissions for a role
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const role = await Role.findByPk(roleId, {
      include: [
        {
          model: Permission,
          as: 'permissions',
          through: { attributes: [] },
          where: { isActive: true },
          required: false,
        },
      ],
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    return (role as any).permissions || [];
  }

  /**
   * Check if role has permission
   */
  async roleHasPermission(roleId: string, permissionCode: string): Promise<boolean> {
    const rolePermission = await RolePermission.findOne({
      include: [
        {
          model: Permission,
          as: 'permission',
          where: { code: permissionCode, isActive: true },
          required: true,
        },
      ],
      where: { roleId },
    });

    return rolePermission !== null;
  }

  // ==================== Helper Methods ====================

  /**
   * Format role with permissions
   */
  private formatRoleWithPermissions(role: any): RoleWithPermissions {
    return {
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description,
      isSystem: role.isSystem,
      isActive: role.isActive,
      permissions: (role.permissions || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        category: p.category,
        action: p.action,
        resource: p.resource,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
}

export default new RolePermissionService();

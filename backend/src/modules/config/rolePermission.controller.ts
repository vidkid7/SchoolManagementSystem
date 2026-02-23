import { Request, Response, NextFunction } from 'express';
import rolePermissionService from './rolePermission.service';

class RolePermissionController {
  // ==================== Role Management ====================

  /**
   * Get all roles
   */
  async getRoles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const roles = await rolePermissionService.getRoles(includeInactive);

      res.json({
        success: true,
        message: 'Roles retrieved successfully',
        data: roles
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const role = await rolePermissionService.getRoleById(id);

      res.json({
        success: true,
        message: 'Role retrieved successfully',
        data: role
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new role
   */
  async createRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const role = await rolePermissionService.createRole(req.body, userId);

      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: role
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a role
   */
  async updateRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const role = await rolePermissionService.updateRole(id, req.body, userId);

      res.json({
        success: true,
        message: 'Role updated successfully',
        data: role
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a role
   */
  async deleteRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      await rolePermissionService.deleteRole(id, userId);

      res.json({
        success: true,
        message: 'Role deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== Permission Management ====================

  /**
   * Get all permissions
   */
  async getPermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = {
        category: req.query.category as any,
        action: req.query.action as any,
        includeInactive: req.query.includeInactive === 'true',
      };

      const permissions = await rolePermissionService.getPermissions(filters);

      res.json({
        success: true,
        message: 'Permissions retrieved successfully',
        data: permissions
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get permission by ID
   */
  async getPermissionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const permission = await rolePermissionService.getPermissionById(id);

      res.json({
        success: true,
        message: 'Permission retrieved successfully',
        data: permission
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new permission
   */
  async createPermission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const permission = await rolePermissionService.createPermission(req.body, userId);

      res.status(201).json({
        success: true,
        message: 'Permission created successfully',
        data: permission
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a permission
   */
  async updatePermission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      const permission = await rolePermissionService.updatePermission(id, req.body, userId);

      res.json({
        success: true,
        message: 'Permission updated successfully',
        data: permission
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a permission
   */
  async deletePermission(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;
      await rolePermissionService.deletePermission(id, userId);

      res.json({
        success: true,
        message: 'Permission deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // ==================== Role-Permission Assignment ====================

  /**
   * Assign permissions to a role
   */
  async assignPermissionsToRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { permissionIds } = req.body;
      const userId = req.user!.userId;

      await rolePermissionService.assignPermissionsToRole(id, permissionIds, userId);

      res.json({
        success: true,
        message: 'Permissions assigned to role successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove permission from role
   */
  async removePermissionFromRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, permissionId } = req.params;
      const userId = req.user!.userId;

      await rolePermissionService.removePermissionFromRole(id, permissionId, userId);

      res.json({
        success: true,
        message: 'Permission removed from role successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get permissions for a role
   */
  async getRolePermissions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const permissions = await rolePermissionService.getRolePermissions(id);

      res.json({
        success: true,
        message: 'Role permissions retrieved successfully',
        data: permissions
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new RolePermissionController();

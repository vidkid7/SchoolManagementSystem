import { Router } from 'express';
import rolePermissionController from './rolePermission.controller';
import { authenticate, authorize } from '@middleware/auth';
import { UserRole } from '@models/User.model';
import { validate } from '@middleware/validation';
import {
  createRoleSchema,
  updateRoleSchema,
  createPermissionSchema,
  updatePermissionSchema,
  assignPermissionsSchema,
  uuidParamSchema,
  permissionIdParamSchema,
} from './rolePermission.validation';

const router = Router();

// Only School_Admin can manage roles and permissions
const adminOnly = [UserRole.SCHOOL_ADMIN];

// ==================== Role Routes ====================

/**
 * @route   GET /api/v1/config/roles
 * @desc    Get all roles
 * @access  Private (School_Admin)
 */
router.get(
  '/roles',
  authenticate,
  authorize(...adminOnly),
  rolePermissionController.getRoles
);

/**
 * @route   GET /api/v1/config/roles/:id
 * @desc    Get role by ID
 * @access  Private (School_Admin)
 */
router.get(
  '/roles/:id',
  authenticate,
  authorize(...adminOnly),
  validate(uuidParamSchema, 'params'),
  rolePermissionController.getRoleById
);

/**
 * @route   POST /api/v1/config/roles
 * @desc    Create a new role
 * @access  Private (School_Admin)
 */
router.post(
  '/roles',
  authenticate,
  authorize(...adminOnly),
  validate(createRoleSchema),
  rolePermissionController.createRole
);

/**
 * @route   PUT /api/v1/config/roles/:id
 * @desc    Update a role
 * @access  Private (School_Admin)
 */
router.put(
  '/roles/:id',
  authenticate,
  authorize(...adminOnly),
  validate(uuidParamSchema, 'params'),
  validate(updateRoleSchema),
  rolePermissionController.updateRole
);

/**
 * @route   DELETE /api/v1/config/roles/:id
 * @desc    Delete a role
 * @access  Private (School_Admin)
 */
router.delete(
  '/roles/:id',
  authenticate,
  authorize(...adminOnly),
  validate(uuidParamSchema, 'params'),
  rolePermissionController.deleteRole
);

// ==================== Permission Routes ====================

/**
 * @route   GET /api/v1/config/permissions
 * @desc    Get all permissions
 * @access  Private (School_Admin)
 */
router.get(
  '/permissions',
  authenticate,
  authorize(...adminOnly),
  rolePermissionController.getPermissions
);

/**
 * @route   GET /api/v1/config/permissions/:id
 * @desc    Get permission by ID
 * @access  Private (School_Admin)
 */
router.get(
  '/permissions/:id',
  authenticate,
  authorize(...adminOnly),
  validate(uuidParamSchema, 'params'),
  rolePermissionController.getPermissionById
);

/**
 * @route   POST /api/v1/config/permissions
 * @desc    Create a new permission
 * @access  Private (School_Admin)
 */
router.post(
  '/permissions',
  authenticate,
  authorize(...adminOnly),
  validate(createPermissionSchema),
  rolePermissionController.createPermission
);

/**
 * @route   PUT /api/v1/config/permissions/:id
 * @desc    Update a permission
 * @access  Private (School_Admin)
 */
router.put(
  '/permissions/:id',
  authenticate,
  authorize(...adminOnly),
  validate(uuidParamSchema, 'params'),
  validate(updatePermissionSchema),
  rolePermissionController.updatePermission
);

/**
 * @route   DELETE /api/v1/config/permissions/:id
 * @desc    Delete a permission
 * @access  Private (School_Admin)
 */
router.delete(
  '/permissions/:id',
  authenticate,
  authorize(...adminOnly),
  validate(uuidParamSchema, 'params'),
  rolePermissionController.deletePermission
);

// ==================== Role-Permission Assignment Routes ====================

/**
 * @route   GET /api/v1/config/roles/:id/permissions
 * @desc    Get permissions for a role
 * @access  Private (School_Admin)
 */
router.get(
  '/roles/:id/permissions',
  authenticate,
  authorize(...adminOnly),
  validate(uuidParamSchema, 'params'),
  rolePermissionController.getRolePermissions
);

/**
 * @route   POST /api/v1/config/roles/:id/permissions
 * @desc    Assign permissions to a role
 * @access  Private (School_Admin)
 */
router.post(
  '/roles/:id/permissions',
  authenticate,
  authorize(...adminOnly),
  validate(uuidParamSchema, 'params'),
  validate(assignPermissionsSchema),
  rolePermissionController.assignPermissionsToRole
);

/**
 * @route   DELETE /api/v1/config/roles/:id/permissions/:permissionId
 * @desc    Remove permission from role
 * @access  Private (School_Admin)
 */
router.delete(
  '/roles/:id/permissions/:permissionId',
  authenticate,
  authorize(...adminOnly),
  validate(permissionIdParamSchema, 'params'),
  rolePermissionController.removePermissionFromRole
);

export default router;

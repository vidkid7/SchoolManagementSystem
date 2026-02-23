/**
 * User Routes
 * 
 * Route definitions for user management operations
 */

import { Router } from 'express';
import userController from './user.controller';
import { authenticate } from '../../middleware/auth';

const router = Router();

router.use(authenticate);

/**
 * @route   GET /api/v1/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 */
router.get('/stats', userController.getUserStats);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get('/', userController.getAllUsers);

/**
 * @route   POST /api/v1/users
 * @desc    Create new user
 * @access  Private (Admin only)
 */
router.post('/', userController.createUser);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get('/:id', userController.getUserById);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put('/:id', userController.updateUser);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 */
router.delete('/:id', userController.deleteUser);

/**
 * @route   POST /api/v1/users/:id/reset-password
 * @desc    Reset user password
 * @access  Private (Admin only)
 */
router.post('/:id/reset-password', userController.resetPassword);

/**
 * @route   GET /api/v1/users/:id/activity
 * @desc    Get user activity log
 * @access  Private (Admin only)
 */
router.get('/:id/activity', userController.getUserActivity);

export default router;

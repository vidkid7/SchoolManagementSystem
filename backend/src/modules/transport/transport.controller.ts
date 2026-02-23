import { Request, Response } from 'express';
import { Op } from 'sequelize';
import User, { UserRole } from '@models/User.model';
import Student from '@models/Student.model';
import { logger } from '@utils/logger';

class TransportController {
  async getDashboard(_req: Request, res: Response): Promise<void> {
    try {
      const [totalStudents, activeStudents] = await Promise.all([
        Student.count(),
        Student.count({ where: { status: 'active' } })
      ]);

      res.status(200).json({
        success: true,
        data: {
          summary: {
            totalStudents,
            activeStudents,
            role: UserRole.TRANSPORT_MANAGER
          },
          quickLinks: [
            { label: 'Student List', path: '/students' },
            { label: 'Communication', path: '/communication/messages' },
            { label: 'Calendar', path: '/calendar' },
            { label: 'Documents', path: '/documents' }
          ]
        }
      });
    } catch (error: any) {
      logger.error('Transport dashboard error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'TRANSPORT_DASHBOARD_ERROR', message: error.message || 'Failed to load dashboard' }
      });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      const user = await User.findByPk(userId, {
        attributes: ['id', 'username', 'email', 'firstName', 'lastName', 'phoneNumber', 'role', 'status', 'createdAt']
      });

      if (!user) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
        return;
      }

      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      logger.error('Transport profile error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'PROFILE_ERROR', message: error.message || 'Failed to load profile' }
      });
    }
  }

  async getStudentTransportList(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 20, search } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const whereClause: any = { status: 'active' };
      if (search) {
        whereClause[Op.or] = [
          { firstNameEn: { [Op.like]: `%${search}%` } },
          { lastNameEn: { [Op.like]: `%${search}%` } },
          { studentCode: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Student.findAndCountAll({
        where: whereClause,
        attributes: ['studentId', 'firstNameEn', 'lastNameEn', 'studentCode', 'addressEn', 'fatherPhone', 'fatherName'],
        limit: Number(limit),
        offset,
        order: [['firstNameEn', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: {
          students: rows,
          pagination: {
            total: count,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(count / Number(limit))
          }
        }
      });
    } catch (error: any) {
      logger.error('Transport student list error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'STUDENT_LIST_ERROR', message: error.message || 'Failed to load student list' }
      });
    }
  }
}

export default new TransportController();

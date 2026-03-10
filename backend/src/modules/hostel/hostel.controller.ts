import { Request, Response } from 'express';
import { Op } from 'sequelize';
import User, { UserRole } from '@models/User.model';
import Student from '@models/Student.model';
import LeaveApplication, { LeaveStatus } from '@models/LeaveApplication.model';
import { logger } from '@utils/logger';

class HostelController {
  async getDashboard(req: Request, res: Response): Promise<void> {
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
            role: UserRole.HOSTEL_WARDEN
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
      logger.error('Hostel dashboard error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'HOSTEL_DASHBOARD_ERROR', message: error.message || 'Failed to load dashboard' }
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
      logger.error('Hostel profile error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'PROFILE_ERROR', message: error.message || 'Failed to load profile' }
      });
    }
  }

  async getResidentStudents(req: Request, res: Response): Promise<void> {
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
      logger.error('Hostel resident students error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'RESIDENT_LIST_ERROR', message: error.message || 'Failed to load resident list' }
      });
    }
  }

  async getLeaveRequests(req: Request, res: Response): Promise<void> {
    try {
      const { status, page = 1, limit = 20 } = req.query;
      const where: any = {};
      if (status) where.status = status;

      const { count, rows } = await LeaveApplication.findAndCountAll({
        where,
        limit: Number(limit),
        offset: (Number(page) - 1) * Number(limit),
        order: [['appliedAt', 'DESC']],
      });

      res.status(200).json({
        success: true,
        data: rows,
        meta: { total: count, page: Number(page), limit: Number(limit), pages: Math.ceil(count / Number(limit)) },
      });
    } catch (error: any) {
      logger.error('Hostel leave requests error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'LEAVE_LIST_ERROR', message: error.message || 'Failed to load leave requests' },
      });
    }
  }

  async approveLeave(req: Request, res: Response): Promise<void> {
    try {
      const { leaveId } = req.params;
      const leave = await LeaveApplication.findByPk(leaveId);
      if (!leave) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Leave request not found' } });
        return;
      }
      await leave.update({ status: LeaveStatus.APPROVED, approvedBy: req.user?.userId, approvedAt: new Date() });
      res.status(200).json({ success: true, data: leave, message: 'Leave approved' });
    } catch (error: any) {
      logger.error('Hostel approve leave error:', error);
      res.status(500).json({ success: false, error: { code: 'APPROVE_LEAVE_ERROR', message: error.message || 'Failed to approve leave' } });
    }
  }

  async rejectLeave(req: Request, res: Response): Promise<void> {
    try {
      const { leaveId } = req.params;
      const { reason } = req.body;
      const leave = await LeaveApplication.findByPk(leaveId);
      if (!leave) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Leave request not found' } });
        return;
      }
      await leave.update({ status: LeaveStatus.REJECTED, rejectionReason: reason, approvedBy: req.user?.userId, approvedAt: new Date() });
      res.status(200).json({ success: true, data: leave, message: 'Leave rejected' });
    } catch (error: any) {
      logger.error('Hostel reject leave error:', error);
      res.status(500).json({ success: false, error: { code: 'REJECT_LEAVE_ERROR', message: error.message || 'Failed to reject leave' } });
    }
  }

  async getAttendanceSummary(req: Request, res: Response): Promise<void> {
    try {
      const [total, active] = await Promise.all([
        Student.count(),
        Student.count({ where: { status: 'active' } }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          date: new Date().toISOString().split('T')[0],
          totalResidents: total,
          present: active,
          absent: total - active,
          attendanceRate: total > 0 ? Math.round((active / total) * 100) : 0,
        },
      });
    } catch (error: any) {
      logger.error('Hostel attendance summary error:', error);
      res.status(500).json({ success: false, error: { code: 'ATTENDANCE_ERROR', message: error.message || 'Failed to load attendance' } });
    }
  }

  async getIncidents(req: Request, res: Response): Promise<void> {
    try {
      // Return a summary of incidents derived from leave rejections and locked students
      const [rejectedLeaves, lockedStudentUsers] = await Promise.all([
        LeaveApplication.count({ where: { status: LeaveStatus.REJECTED } }),
        User.count({ where: { status: 'locked', role: UserRole.STUDENT } }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          summary: { totalIncidents: rejectedLeaves + lockedStudentUsers, rejectedLeaves, flaggedStudents: lockedStudentUsers },
          incidents: [
            ...(rejectedLeaves > 0 ? [{ type: 'leave_rejection', count: rejectedLeaves, severity: 'medium', description: 'Rejected leave applications requiring follow-up' }] : []),
            ...(lockedStudentUsers > 0 ? [{ type: 'locked_accounts', count: lockedStudentUsers, severity: 'high', description: 'Student accounts locked — requires warden review' }] : []),
          ],
        },
      });
    } catch (error: any) {
      logger.error('Hostel incidents error:', error);
      res.status(500).json({ success: false, error: { code: 'INCIDENTS_ERROR', message: error.message || 'Failed to load incidents' } });
    }
  }
}

export default new HostelController();

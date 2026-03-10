import Staff from '@models/Staff.model';
import StaffAssignment from '@models/StaffAssignment.model';
import StaffAttendance from '@models/StaffAttendance.model';
import { logger } from '@utils/logger';

class DepartmentService {
  async getStaffFromUserId(userId: number): Promise<Staff | null> {
    return Staff.findOne({
      where: { userId },
    });
  }

  async getDepartmentTeachers(userId: number): Promise<any> {
    try {
      // Get the department head's staff record
      const staff = await this.getStaffFromUserId(userId);

      if (!staff || !staff.department) {
        return {
          teachers: [],
          stats: {
            totalTeachers: 0,
            activeTeachers: 0,
            onLeave: 0,
            avgAttendance: 0,
          },
        };
      }

      // Get all teachers in the same department
      const teachers = await Staff.findAll({
        where: {
          department: staff.department,
          category: 'teaching',
        },
        attributes: [
          'staffId',
          'firstName',
          'lastName',
          'email',
          'phone',
          'department',
          'position',
          'employmentType',
          'status',
        ],
      });

      // Get class assignments for each teacher
      const teachersWithStats = await Promise.all(
        teachers.map(async (teacher) => {
          const assignments = await StaffAssignment.findAll({
            where: {
              staffId: teacher.staffId,
              isActive: true,
            },
          });

          // Get attendance records
          const attendanceRecords = await StaffAttendance.findAll({
            where: {
              staffId: teacher.staffId,
            },
          });

          const totalRecords = attendanceRecords.length;
          const presentRecords = attendanceRecords.filter((r) => r.status === 'present').length;
          const attendanceRate = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;

          return {
            ...teacher.toJSON(),
            classCount: assignments.length,
            attendanceRate,
          };
        })
      );

      // Calculate stats
      const totalTeachers = teachers.length;
      const activeTeachers = teachers.filter((t) => t.status === 'active').length;
      const onLeave = teachers.filter((t) => t.status === 'on_leave').length;
      const avgAttendance =
        teachersWithStats.reduce((sum, t) => sum + (t.attendanceRate || 0), 0) / (totalTeachers || 1);

      return {
        teachers: teachersWithStats,
        stats: {
          totalTeachers,
          activeTeachers,
          onLeave,
          avgAttendance,
        },
      };
    } catch (error) {
      logger.error('Error getting department teachers:', error);
      throw error;
    }
  }

  async getDepartmentStats(userId: number): Promise<any> {
    try {
      const staff = await this.getStaffFromUserId(userId);

      if (!staff || !staff.department) {
        return {
          totalTeachers: 0,
          totalClasses: 0,
          avgPerformance: 0,
          pendingReviews: 0,
        };
      }

      const teachers = await Staff.findAll({
        where: {
          department: staff.department,
          category: 'teaching',
        },
      });

      const totalTeachers = teachers.length;

      // Get total class assignments
      const assignments = await StaffAssignment.findAll({
        where: {
          staffId: teachers.map((t) => t.staffId),
          isActive: true,
        },
      });

      const totalClasses = assignments.length;

      return {
        totalTeachers,
        totalClasses,
        avgPerformance: 0, // Can be calculated from exam results
        pendingReviews: 0, // Can be calculated from lesson plan reviews
      };
    } catch (error) {
      logger.error('Error getting department stats:', error);
      throw error;
    }
  }

  async getDepartmentPerformance(userId: number): Promise<any> {
    try {
      const staff = await this.getStaffFromUserId(userId);

      if (!staff || !staff.department) {
        return [];
      }

      // This would typically aggregate exam results by class/subject
      // For now, return empty array
      return [];
    } catch (error) {
      logger.error('Error getting department performance:', error);
      throw error;
    }
  }
}

export default new DepartmentService();

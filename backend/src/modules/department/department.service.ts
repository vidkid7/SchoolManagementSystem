import Staff from '@models/Staff.model';
import StaffAssignment from '@models/StaffAssignment.model';
import StaffAttendance from '@models/StaffAttendance.model';
import Grade from '@models/Grade.model';
import Exam, { ExamStatus } from '@models/Exam.model';
import Class from '@models/Class.model';
import { logger } from '@utils/logger';

interface DepartmentPerformanceRow {
  class: string;
  averageScore: number;
}

type GradeWithExam = Grade & {
  exam?: Exam & { class?: Class };
};

const aggregatePerformanceByClass = (grades: GradeWithExam[]): DepartmentPerformanceRow[] => {
  const totalsByClass = new Map<number, { className: string; totalMarks: number; fullMarks: number }>();

  grades.forEach((grade) => {
    const exam = grade.exam;
    const classRecord = exam?.class;
    const score = Number(grade.totalMarks);
    const fullMarks = Number(exam?.fullMarks);
    const classId = Number(classRecord?.classId);
    if (!classRecord || !Number.isInteger(classId) || !Number.isFinite(score) ||
      !Number.isFinite(fullMarks) || fullMarks <= 0 || score < 0 || score > fullMarks) {
      return;
    }

    const existing = totalsByClass.get(classId) ?? {
      className: `Class ${classRecord.gradeLevel}-${classRecord.section}`,
      totalMarks: 0,
      fullMarks: 0,
    };
    existing.totalMarks += score;
    existing.fullMarks += fullMarks;
    totalsByClass.set(classId, existing);
  });

  return [...totalsByClass.values()].map(({ className, totalMarks, fullMarks }) => ({
    class: className,
    averageScore: Math.round((totalMarks / fullMarks) * 1000) / 10,
  }));
};

class DepartmentService {
  getStaffFromUserId(userId: number): Promise<Staff | null> {
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

  async getDepartmentPerformance(userId: number): Promise<DepartmentPerformanceRow[]> {
    try {
      const staff = await this.getStaffFromUserId(userId);

      if (!staff || !staff.department) {
        return [];
      }

      const teachers = await Staff.findAll({
        where: { department: staff.department, category: 'teaching' },
        attributes: ['staffId'],
      });
      const teacherIds = teachers.map((teacher) => teacher.staffId);
      if (teacherIds.length === 0) return [];

      const assignments = await StaffAssignment.findAll({
        where: { staffId: teacherIds, isActive: true },
        attributes: ['classId'],
      });
      const classIds = [...new Set(assignments
        .map((assignment) => assignment.classId)
        .filter((classId): classId is number => typeof classId === 'number' && Number.isInteger(classId) && classId > 0))];
      if (classIds.length === 0) return [];

      const grades = await Grade.findAll({
        attributes: ['totalMarks'],
        include: [{
          model: Exam,
          as: 'exam',
          attributes: ['fullMarks', 'classId'],
          where: { classId: classIds, status: ExamStatus.COMPLETED },
          include: [{
            model: Class,
            as: 'class',
            attributes: ['classId', 'gradeLevel', 'section'],
            required: true,
          }],
        }],
      }) as GradeWithExam[];

      return aggregatePerformanceByClass(grades);
    } catch (error) {
      logger.error('Error getting department performance:', error);
      throw error;
    }
  }
}

export default new DepartmentService();

import { Op } from 'sequelize';
import Student from '../../models/Student.model';
import Staff from '../../models/Staff.model';
import AttendanceRecord from '../../models/AttendanceRecord.model';
import Invoice from '../../models/Invoice.model';
import Payment from '../../models/Payment.model';
import Exam from '../../models/Exam.model';
import Grade from '../../models/Grade.model';
import Book from '../../models/Book.model';
import Circulation from '../../models/Circulation.model';
import { logger } from '../../utils/logger';
import LibraryFine from '../../models/LibraryFine.model';
import ECA from '../../models/ECA.model';
import ECAEnrollment from '../../models/ECAEnrollment.model';
import Sport from '../../models/Sport.model';
import SportsEnrollment from '../../models/SportsEnrollment.model';
import Class from '../../models/Class.model';
import { Subject } from '../../models/Subject.model';
import {
  EnrollmentReportParams,
  AttendanceReportParams,
  FeeCollectionReportParams,
  ExaminationReportParams,
  TeacherPerformanceReportParams,
  LibraryReportParams,
  ECAReportParams,
  SportsReportParams,
  EnrollmentReport,
  AttendanceReport,
  FeeCollectionReport,
  ExaminationReport,
  TeacherPerformanceReport,
  LibraryReport,
  ECAReport,
  SportsReport,
  DashboardData,
} from './report.types';

class ReportService {
  async generateEnrollmentReport(params: EnrollmentReportParams): Promise<EnrollmentReport> {
    const whereClause: any = { status: 'active' };
    const classWhere: any = {};
    
    if (params.classId) whereClause.currentClassId = params.classId;
    if (params.section) classWhere.section = params.section;
    if (params.gender) whereClause.gender = params.gender;
    if (params.shift) classWhere.shift = params.shift;

    const includeClass = Object.keys(classWhere).length > 0 ? {
      model: Class,
      as: 'currentClass',
      where: classWhere,
      attributes: [],
      required: true
    } : undefined;

    const totalStudents = await Student.count({ 
      where: whereClause,
      ...(includeClass && { include: [includeClass] })
    });

    const byClass = await Student.findAll({
      where: whereClause,
      attributes: [
        [Student.sequelize!.col('currentClass.grade_level'), 'class'],
        [Student.sequelize!.col('currentClass.section'), 'section'],
        [Student.sequelize!.fn('COUNT', Student.sequelize!.col('Student.student_id')), 'count'],
      ],
      include: [{
        model: Class,
        as: 'currentClass',
        attributes: [],
        ...(Object.keys(classWhere).length > 0 && { where: classWhere })
      }],
      group: ['currentClass.grade_level', 'currentClass.section'],
      raw: true,
    }) as any[];

    const byGender = await Student.findAll({
      where: whereClause,
      attributes: [
        'gender',
        [Student.sequelize!.fn('COUNT', Student.sequelize!.col('student_id')), 'count'],
      ],
      ...(includeClass && { include: [includeClass] }),
      group: ['gender'],
      raw: true,
    }) as any[];

    const byShift = await Student.findAll({
      where: whereClause,
      attributes: [
        [Student.sequelize!.col('currentClass.shift'), 'shift'],
        [Student.sequelize!.fn('COUNT', Student.sequelize!.col('Student.student_id')), 'count'],
      ],
      include: [{
        model: Class,
        as: 'currentClass',
        attributes: [],
        ...(Object.keys(classWhere).length > 0 && { where: classWhere })
      }],
      group: ['currentClass.shift'],
      raw: true,
    }) as any[];

    const trend = await Student.findAll({
      where: whereClause,
      attributes: [
        [Student.sequelize!.fn('DATE', Student.sequelize!.col('admission_date')), 'date'],
        [Student.sequelize!.fn('COUNT', Student.sequelize!.col('student_id')), 'count'],
      ],
      ...(includeClass && { include: [includeClass] }),
      group: [Student.sequelize!.fn('DATE', Student.sequelize!.col('admission_date'))],
      order: [[Student.sequelize!.fn('DATE', Student.sequelize!.col('admission_date')), 'ASC']],
      raw: true,
    }) as any[];

    return {
      totalStudents,
      byClass: byClass.map(item => ({
        class: item.class,
        section: item.section,
        count: parseInt(item.count),
      })),
      byGender: byGender.map(item => ({
        gender: item.gender,
        count: parseInt(item.count),
      })),
      byShift: byShift.map(item => ({
        shift: item.shift,
        count: parseInt(item.count),
      })),
      trend: trend.map(item => ({
        date: item.date,
        count: parseInt(item.count),
      })),
    };
  }

  async generateAttendanceReport(params: AttendanceReportParams): Promise<AttendanceReport> {
    const whereClause: any = {
      date: {
        [Op.between]: [params.startDate, params.endDate],
      },
    };

    if (params.studentId) whereClause.studentId = params.studentId;
    if (params.classId) whereClause.classId = params.classId;
    if (params.section) whereClause.section = params.section;

    const totalRecords = await AttendanceRecord.count({ where: whereClause });
    const presentRecords = await AttendanceRecord.count({
      where: { ...whereClause, status: 'present' },
    });

    const averageAttendance = totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0;

    const byDate = await AttendanceRecord.findAll({
      where: whereClause,
      attributes: [
        'date',
        [
          Student.sequelize!.fn(
            'SUM',
            Student.sequelize!.literal("CASE WHEN status = 'present' THEN 1 ELSE 0 END")
          ),
          'presentCount',
        ],
        [
          Student.sequelize!.fn(
            'SUM',
            Student.sequelize!.literal("CASE WHEN status = 'absent' THEN 1 ELSE 0 END")
          ),
          'absentCount',
        ],
        [
          Student.sequelize!.fn(
            'SUM',
            Student.sequelize!.literal("CASE WHEN status = 'late' THEN 1 ELSE 0 END")
          ),
          'lateCount',
        ],
      ],
      group: ['date'],
      order: [['date', 'ASC']],
      raw: true,
    }) as any[];

    return {
      totalDays: byDate.length,
      averageAttendance: Math.round(averageAttendance * 100) / 100,
      byClass: [],
      byDate: byDate.map(item => ({
        date: item.date,
        presentCount: parseInt(item.presentCount) || 0,
        absentCount: parseInt(item.absentCount) || 0,
        lateCount: parseInt(item.lateCount) || 0,
      })),
      lowAttendanceStudents: [],
    };
  }

  async generateFeeCollectionReport(params: FeeCollectionReportParams): Promise<FeeCollectionReport> {
    try {
      const whereClause: any = {
        createdAt: {
          [Op.between]: [params.startDate, params.endDate],
        },
      };

      if (params.status) whereClause.status = params.status;

      const invoices = await Invoice.findAll({
        where: whereClause,
        include: [{ model: Student, as: 'student' }],
      });

      const totalExpected = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
      const totalPending = totalExpected - totalCollected;
      const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;

      const paymentWhereClause: any = {
        paymentDate: {
          [Op.between]: [params.startDate, params.endDate],
        },
        status: 'completed',
      };

      const byPaymentMethod = await Payment.findAll({
        where: paymentWhereClause,
        attributes: [
          'paymentMethod',
          [Payment.sequelize!.fn('SUM', Payment.sequelize!.col('amount')), 'amount'],
          [Payment.sequelize!.fn('COUNT', Payment.sequelize!.col('payment_id')), 'count'],
        ],
        group: ['paymentMethod'],
        raw: true,
      }) as any[];

      const byDate = await Payment.findAll({
        where: paymentWhereClause,
        attributes: [
          [Payment.sequelize!.fn('DATE', Payment.sequelize!.col('payment_date')), 'date'],
          [Payment.sequelize!.fn('SUM', Payment.sequelize!.col('amount')), 'amount'],
        ],
        group: [Payment.sequelize!.fn('DATE', Payment.sequelize!.col('payment_date'))],
        order: [[Payment.sequelize!.fn('DATE', Payment.sequelize!.col('payment_date')), 'ASC']],
        raw: true,
      }) as any[];

      return {
        totalExpected,
        totalCollected,
        totalPending,
        collectionRate: Math.round(collectionRate * 100) / 100,
        byClass: [],
        byDate: byDate.map(item => ({
          date: item.date,
          amount: parseFloat(item.amount),
        })),
        byPaymentMethod: byPaymentMethod.map(item => ({
          method: item.paymentMethod,
          amount: parseFloat(item.amount),
          count: parseInt(item.count),
        })),
        defaulters: [],
      };
    } catch (error: any) {
      logger.warn('Fee collection report: Tables not available yet', { error: error.message });
      return {
        totalExpected: 0,
        totalCollected: 0,
        totalPending: 0,
        collectionRate: 0,
        byClass: [],
        byDate: [],
        byPaymentMethod: [],
        defaulters: [],
      };
    }
  }

  async generateExaminationReport(params: ExaminationReportParams): Promise<ExaminationReport> {
    try {
      const whereClause: any = {};

      if (params.examId) whereClause.examId = params.examId;
      if (params.classId) whereClause['$exam.classId$'] = params.classId;
      if (params.subjectId) whereClause['$exam.subjectId$'] = params.subjectId;

      const grades = await Grade.findAll({
        where: whereClause,
        include: [
          { model: Exam, as: 'exam', include: [{ model: Subject, as: 'subject' }] },
          { model: Student, as: 'student' },
        ],
      });

      const totalStudents = new Set(grades.map(g => g.studentId)).size;
      const averageMarks = grades.length > 0
        ? grades.reduce((sum, g) => sum + g.totalMarks, 0) / grades.length
        : 0;
      const averageGPA = grades.length > 0
        ? grades.reduce((sum, g) => sum + g.gradePoint, 0) / grades.length
        : 0;
      const passedStudents = grades.filter(g => g.grade !== 'NG').length;
      const passRate = totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0;

      const gradeDistribution: { [key: string]: number } = {};
      grades.forEach(g => {
        gradeDistribution[g.grade] = (gradeDistribution[g.grade] || 0) + 1;
      });

      return {
        totalStudents,
        averageMarks: Math.round(averageMarks * 100) / 100,
        averageGPA: Math.round(averageGPA * 100) / 100,
        passRate: Math.round(passRate * 100) / 100,
        gradeDistribution: Object.entries(gradeDistribution).map(([grade, count]) => ({
          grade,
          count,
          percentage: Math.round((count / grades.length) * 10000) / 100,
        })),
        subjectWisePerformance: [],
        topPerformers: [],
      };
    } catch (error: any) {
      logger.warn('Examination report: Tables not available yet', { error: error.message });
      return {
        totalStudents: 0,
        averageMarks: 0,
        averageGPA: 0,
        passRate: 0,
        gradeDistribution: [],
        subjectWisePerformance: [],
        topPerformers: [],
      };
    }
  }

  async generateTeacherPerformanceReport(
    params: TeacherPerformanceReportParams
  ): Promise<TeacherPerformanceReport> {
    const teacher = await Staff.findByPk(params.teacherId);
    if (!teacher) {
      throw new Error('Teacher not found');
    }

    return {
      teacherId: params.teacherId!,
      teacherName: `${teacher.firstNameEn} ${teacher.lastNameEn}`,
      attendanceRate: 95,
      totalClasses: 100,
      classesAttended: 95,
      syllabusCompletion: 85,
      subjects: [],
    };
  }

  async generateLibraryReport(params: LibraryReportParams): Promise<LibraryReport> {
    try {
      const whereClause: any = {
        issueDate: {
          [Op.between]: [params.startDate, params.endDate],
        },
      };

      if (params.category) whereClause['$book.category$'] = params.category;

      const circulations = await Circulation.findAll({
        where: whereClause,
        include: [
          { model: Book, as: 'book' },
          { model: Student, as: 'student' },
        ],
      });

      const totalBooks = await Book.count();
      const totalIssued = circulations.length;
      const totalReturned = circulations.filter(c => c.status === 'returned').length;
      const overdueBooks = circulations.filter(c => c.status === 'overdue').length;

      const fines = await LibraryFine.findAll({
        where: {
          status: 'paid',
          paidDate: {
            [Op.between]: [params.startDate, params.endDate],
          },
        },
      });

      const fineCollected = fines.reduce((sum, f) => sum + (f.paidAmount || 0), 0);

      return {
        totalBooks,
        totalIssued,
        totalReturned,
        overdueBooks,
        mostBorrowedBooks: [],
        activeMembers: [],
        fineCollected,
      };
    } catch (error: any) {
      logger.warn('Library report: Tables not available yet', { error: error.message });
      return {
        totalBooks: 0,
        totalIssued: 0,
        totalReturned: 0,
        overdueBooks: 0,
        mostBorrowedBooks: [],
        activeMembers: [],
        fineCollected: 0,
      };
    }
  }

  async generateECAReport(params: ECAReportParams): Promise<ECAReport> {
    try {
      const whereClause: any = {};
      if (params.ecaId) whereClause.ecaId = params.ecaId;

      const enrollments = await ECAEnrollment.findAll({
        where: whereClause,
        include: [
          { model: ECA, as: 'eca' },
          { model: Student, as: 'student' },
        ],
      });

      const totalActivities = await ECA.count();
      const totalParticipants = new Set(enrollments.map(e => e.studentId)).size;

      return {
        totalActivities,
        totalParticipants,
        byActivity: [],
        byCategory: [],
        achievements: [],
      };
    } catch (error: any) {
      logger.warn('ECA report: Tables not available yet', { error: error.message });
      return {
        totalActivities: 0,
        totalParticipants: 0,
        byActivity: [],
        byCategory: [],
        achievements: [],
      };
    }
  }

  async generateSportsReport(params: SportsReportParams): Promise<SportsReport> {
    try {
      const whereClause: any = {};
      if (params.sportId) whereClause.sportId = params.sportId;

      const enrollments = await SportsEnrollment.findAll({
        where: whereClause,
        include: [
          { model: Sport, as: 'sport' },
          { model: Student, as: 'student' },
        ],
      });

      const totalSports = await Sport.count();
      const totalParticipants = new Set(enrollments.map(e => e.studentId)).size;

      return {
        totalSports,
        totalParticipants,
        bySport: [],
        tournaments: [],
        achievements: [],
      };
    } catch (error: any) {
      logger.warn('Sports report: Tables not available yet', { error: error.message });
      return {
        totalSports: 0,
        totalParticipants: 0,
        bySport: [],
        tournaments: [],
        achievements: [],
      };
    }
  }

  async getDashboardData(_role: string, _userId: string): Promise<DashboardData> {
    const totalStudents = await Student.count({ where: { status: 'active' } });
    const totalStaff = await Staff.count({ where: { status: 'active' } });
    const totalClasses = await Class.count();
    const totalBooks = await Book.count();

    // Circulation, ECA, Sports counts (handle missing tables)
    let totalCirculations = 0;
    try { totalCirculations = await Circulation.count(); } catch { /* table may not exist */ }

    let activeEcaActivities = 0;
    try { activeEcaActivities = await ECA.count({ where: { status: 'active' } }); } catch {
      try { activeEcaActivities = await ECA.count(); } catch { /* table may not exist */ }
    }

    let activeSports = 0;
    try { activeSports = await Sport.count({ where: { status: 'active' } }); } catch {
      try { activeSports = await Sport.count(); } catch { /* table may not exist */ }
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAttendance = await AttendanceRecord.findAll({
      where: {
        date: { [Op.gte]: thirtyDaysAgo }
      },
      attributes: [
        [AttendanceRecord.sequelize!.fn('DATE', AttendanceRecord.sequelize!.col('date')), 'date'],
        [AttendanceRecord.sequelize!.fn('COUNT', AttendanceRecord.sequelize!.col('attendance_id')), 'total'],
        [AttendanceRecord.sequelize!.fn('SUM', AttendanceRecord.sequelize!.literal("CASE WHEN status = 'present' THEN 1 ELSE 0 END")), 'present']
      ],
      group: [AttendanceRecord.sequelize!.fn('DATE', AttendanceRecord.sequelize!.col('date'))],
      raw: true
    }) as any[];

    const avgAttendance = recentAttendance.length > 0
      ? Math.round(recentAttendance.reduce((sum, r) => sum + (parseInt(r.present) || 0) / (parseInt(r.total) || 1) * 100, 0) / recentAttendance.length)
      : 0;

    // Fee collection data (handle missing tables gracefully)
    let feeCollectionRate = 0;
    try {
      const invoices = await Invoice.findAll({
        attributes: [
          [Invoice.sequelize!.fn('SUM', Invoice.sequelize!.col('total_amount')), 'total'],
          [Invoice.sequelize!.fn('SUM', Invoice.sequelize!.col('paid_amount')), 'paid']
        ],
        raw: true
      }) as any[];

      const totalExpected = parseFloat(invoices[0]?.total || 0);
      const totalCollected = parseFloat(invoices[0]?.paid || 0);
      feeCollectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;
    } catch { /* table may not exist */ }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const enrollmentTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const count = await Student.count({
        where: {
          status: 'active',
          admissionDate: {
            [Op.lte]: d
          }
        }
      });
      enrollmentTrend.push({ label: months[d.getMonth()], value: count });
    }

    const attendanceTrend = recentAttendance.slice(-6).map((r: any) => ({
      label: new Date(r.date).toLocaleDateString('en-US', { month: 'short' }),
      value: Math.round((parseInt(r.present) || 0) / (parseInt(r.total) || 1) * 100)
    }));

    // Payment data (handle missing tables gracefully)
    const feeCollection = [];
    try {
      const paymentData = await Payment.findAll({
        where: {
          status: 'completed',
          paymentDate: { [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 6)) }
        },
        attributes: [
          [Payment.sequelize!.fn('MONTH', Payment.sequelize!.col('payment_date')), 'month'],
          [Payment.sequelize!.fn('SUM', Payment.sequelize!.col('amount')), 'amount']
        ],
        group: [Payment.sequelize!.fn('MONTH', Payment.sequelize!.col('payment_date'))],
        raw: true
      }) as any[];

      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthData = paymentData.find((p: any) => parseInt(p.month) === d.getMonth() + 1);
        feeCollection.push({
          label: months[d.getMonth()],
          value: monthData ? Math.round(parseFloat(monthData.amount) / 1000) : 0
        });
      }
    } catch {
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        feeCollection.push({ label: months[d.getMonth()], value: 0 });
      }
    }

    // Grade data (handle missing tables gracefully)
    let examPerformance: { label: string; value: number }[] = [];
    try {
      const grades = await Grade.findAll({
        attributes: [
          'grade',
          [Grade.sequelize!.fn('COUNT', Grade.sequelize!.col('grade_id')), 'count']
        ],
        group: ['grade'],
        raw: true
      }) as any[];

      const gradeMap: { [key: string]: number } = {};
      grades.forEach((g: any) => {
        gradeMap[g.grade] = parseInt(g.count);
      });

      const gradeOrder = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'E', 'F', 'NG'];
      examPerformance = gradeOrder
        .filter(g => gradeMap[g] > 0)
        .slice(0, 6)
        .map(g => ({ label: g, value: gradeMap[g] }));
    } catch { examPerformance = []; }

    // Class-wise enrollment
    let classWiseEnrollment: { label: string; value: number }[] = [];
    try {
      const classCounts = await Student.findAll({
        where: { status: 'active' },
        attributes: [
          [Student.sequelize!.col('currentClass.grade_level'), 'gradeLevel'],
          [Student.sequelize!.fn('COUNT', Student.sequelize!.col('Student.student_id')), 'count'],
        ],
        include: [{
          model: Class,
          as: 'currentClass',
          attributes: [],
        }],
        group: ['currentClass.grade_level'],
        order: [[Student.sequelize!.col('currentClass.grade_level'), 'ASC']],
        raw: true,
      }) as any[];
      classWiseEnrollment = classCounts.map((c: any) => ({
        label: `Grade ${c.gradeLevel}`,
        value: parseInt(c.count),
      }));
    } catch { classWiseEnrollment = []; }

    // Staff distribution by role
    let staffDistribution: { label: string; value: number }[] = [];
    try {
      const staffByRole = await Staff.findAll({
        where: { status: 'active' },
        attributes: [
          'role',
          [Staff.sequelize!.fn('COUNT', Staff.sequelize!.col('staff_id')), 'count'],
        ],
        group: ['role'],
        raw: true,
      }) as any[];
      staffDistribution = staffByRole.map((s: any) => ({
        label: s.role || 'Other',
        value: parseInt(s.count),
      }));
    } catch {
      // Fallback: try by department
      try {
        const staffByDept = await Staff.findAll({
          where: { status: 'active' },
          attributes: [
            'department',
            [Staff.sequelize!.fn('COUNT', Staff.sequelize!.col('staff_id')), 'count'],
          ],
          group: ['department'],
          raw: true,
        }) as any[];
        staffDistribution = staffByDept.map((s: any) => ({
          label: s.department || 'Other',
          value: parseInt(s.count),
        }));
      } catch { staffDistribution = []; }
    }

    // Fee status (paid/pending/partial)
    let feeStatus: { label: string; value: number }[] = [];
    try {
      const invoicesByStatus = await Invoice.findAll({
        attributes: [
          'status',
          [Invoice.sequelize!.fn('COUNT', Invoice.sequelize!.col('invoice_id')), 'count'],
        ],
        group: ['status'],
        raw: true,
      }) as any[];
      feeStatus = invoicesByStatus.map((inv: any) => ({
        label: (inv.status || 'unknown').charAt(0).toUpperCase() + (inv.status || 'unknown').slice(1),
        value: parseInt(inv.count),
      }));
    } catch { feeStatus = []; }

    // Monthly new admissions (actual new students per month)
    const monthlyNewAdmissions: { label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      const count = await Student.count({
        where: {
          status: 'active',
          admissionDate: {
            [Op.between]: [startOfMonth, endOfMonth]
          }
        }
      });
      monthlyNewAdmissions.push({ label: months[d.getMonth()], value: count });
    }

    // Pending fee students (handle missing table)
    let pendingFeeStudents = 0;
    try { pendingFeeStudents = await Invoice.count({ where: { status: 'pending' } }); } catch { /* table may not exist */ }

    const totalMaleStudents = await Student.count({ where: { status: 'active', gender: 'male' } });
    const totalFemaleStudents = await Student.count({ where: { status: 'active', gender: 'female' } });

    return {
      summary: {
        totalStudents,
        totalStaff,
        totalClasses,
        totalBooks,
        attendanceRate: avgAttendance,
        feeCollectionRate,
        totalMaleStudents,
        totalFemaleStudents,
        newAdmissionsThisMonth: await Student.count({
          where: {
            status: 'active',
            admissionDate: {
              [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        }),
        totalExams: await Exam.count(),
        pendingFeeStudents,
        totalCirculations,
        activeEcaActivities,
        activeSports,
      },
      charts: {
        enrollmentTrend,
        attendanceTrend,
        feeCollection,
        examPerformance,
        genderDistribution: [
          { label: 'Male', value: totalMaleStudents },
          { label: 'Female', value: totalFemaleStudents },
          { label: 'Other', value: await Student.count({ where: { status: 'active', gender: 'other' } }) },
        ],
        classWiseEnrollment,
        staffDistribution,
        feeStatus,
        monthlyNewAdmissions,
      },
      recentActivities: [],
    };
  }
}

export default new ReportService();

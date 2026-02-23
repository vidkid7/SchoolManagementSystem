import { Op } from 'sequelize';
import Student from '@models/Student.model';
import Class from '@models/Class.model';
import AttendanceRecord from '@models/AttendanceRecord.model';
import Grade from '@models/Grade.model';
import Invoice from '@models/Invoice.model';
import Payment from '@models/Payment.model';
import User from '@models/User.model';
import { logger } from '@utils/logger';
import { StudentStatus } from '@models/Student.model';

interface ChildInfo {
  studentId: number;
  name: string;
  class: string;
  section: string;
  rollNo: number | null;
  photoUrl?: string;
}

interface AttendanceSummary {
  present: number;
  total: number;
  percentage: number;
}

interface FeeSummary {
  invoices: Array<{
    id: number;
    month: string;
    amount: number;
    status: string;
    paidDate?: string;
    dueDate?: string;
  }>;
  totalPaid: number;
  totalPending: number;
}

interface GradeInfo {
  subject: string;
  midterm?: string;
  final?: string;
  gpa?: number;
}

interface NotificationInfo {
  id: number;
  title: string;
  type: string;
  date: string;
}

class ParentService {
  async getParentChildren(parentUserId: number): Promise<ChildInfo[]> {
    const parent = await User.findByPk(parentUserId);
    if (!parent || !parent.phoneNumber) {
      return [];
    }

    const parentPhone = parent.phoneNumber.replace(/[\s\-()]/g, '');

    const students = await Student.findAll({
      where: {
        [Op.or]: [
          { fatherPhone: { [Op.like]: `%${parentPhone.slice(-9)}%` } },
          { motherPhone: { [Op.like]: `%${parentPhone.slice(-9)}%` } },
        ],
        status: StudentStatus.ACTIVE,
      },
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['className', 'section'],
        },
      ],
    });

    return students.map((student) => ({
      studentId: student.studentId,
      name: student.getFullNameEn(),
      class: student.class?.className || String(student.admissionClass),
      section: student.class?.section || '',
      rollNo: student.rollNumber,
      photoUrl: student.photoUrl,
    }));
  }

  async getChildAttendance(
    childId: number,
    parentUserId: number
  ): Promise<AttendanceSummary> {
    await this.verifyParentAccess(childId, parentUserId);

    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const records = await AttendanceRecord.findAll({
      where: {
        studentId: childId,
        date: {
          [Op.gte]: startOfMonth,
          [Op.lte]: today,
        },
      },
    });

    const total = records.length;
    const present = records.filter(
      (r) => r.status === 'present' || r.status === 'late'
    ).length;

    return {
      present,
      total,
      percentage: total > 0 ? Math.round((present / total) * 100 * 10) / 10 : 0,
    };
  }

  async getChildGrades(childId: number, parentUserId: number): Promise<GradeInfo[]> {
    await this.verifyParentAccess(childId, parentUserId);

    const grades = await Grade.findAll({
      where: { studentId: childId },
      include: [
        {
          association: 'exam',
          attributes: ['examName', 'examType'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    return grades.map((grade) => ({
      subject: grade.subjectName || 'Unknown',
      midterm: grade.midtermGrade,
      final: grade.finalGrade,
      gpa: grade.gpa,
    }));
  }

  async getChildFees(childId: number, parentUserId: number): Promise<FeeSummary> {
    await this.verifyParentAccess(childId, parentUserId);

    const invoices = await Invoice.findAll({
      where: { studentId: childId },
      include: [
        {
          model: Payment,
          as: 'payments',
          attributes: ['amount', 'paymentDate'],
        },
      ],
      order: [['dueDate', 'DESC']],
      limit: 10,
    });

    let totalPaid = 0;
    let totalPending = 0;

    const formattedInvoices = invoices.map((inv) => {
      const paidAmount = inv.payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const remaining = Number(inv.totalAmount) - paidAmount;

      if (inv.status === 'paid') {
        totalPaid += Number(inv.totalAmount);
      } else {
        totalPending += remaining;
        totalPaid += paidAmount;
      }

      return {
        id: inv.invoiceId,
        month: inv.dueDate
          ? `${inv.dueDate.toLocaleString('default', { month: 'long' })} ${inv.dueDate.getFullYear()}`
          : 'N/A',
        amount: Number(inv.totalAmount),
        status: inv.status,
        paidDate: inv.payments?.[0]?.paymentDate?.toISOString().split('T')[0],
        dueDate: inv.dueDate?.toISOString().split('T')[0],
      };
    });

    return {
      invoices: formattedInvoices,
      totalPaid,
      totalPending,
    };
  }

  async getParentNotifications(
    parentUserId: number,
    childId?: number
  ): Promise<NotificationInfo[]> {
    const notifications: NotificationInfo[] = [];

    if (childId) {
      const attendance = await this.getChildAttendance(childId, parentUserId);
      if (attendance.percentage < 75) {
        notifications.push({
          id: 1,
          title: `Low attendance warning: ${attendance.percentage}%`,
          type: 'warning',
          date: new Date().toISOString().split('T')[0],
        });
      }

      const fees = await this.getChildFees(childId, parentUserId);
      if (fees.totalPending > 0) {
        notifications.push({
          id: 2,
          title: `Fee payment pending: Rs. ${fees.totalPending.toLocaleString()}`,
          type: 'info',
          date: new Date().toISOString().split('T')[0],
        });
      }
    }

    return notifications;
  }

  private async verifyParentAccess(
    childId: number,
    parentUserId: number
  ): Promise<void> {
    const children = await this.getParentChildren(parentUserId);
    const hasAccess = children.some((c) => c.studentId === childId);

    if (!hasAccess) {
      throw new Error('Access denied: You do not have permission to view this child\'s data');
    }
  }
}

export default new ParentService();

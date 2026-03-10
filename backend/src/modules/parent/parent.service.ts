import { Op } from 'sequelize';
import Student from '@models/Student.model';
import Class from '@models/Class.model';
import AttendanceRecord from '@models/AttendanceRecord.model';
import Grade from '@models/Grade.model';
import Invoice from '@models/Invoice.model';
import User from '@models/User.model';
import { StudentStatus } from '@models/Student.model';
import BookCirculation from '@models/BookCirculation.model';
import Book from '@models/Book.model';
import Assignment from '@models/Assignment.model';
import AssignmentSubmission from '@models/AssignmentSubmission.model';
import ECAEnrollment from '@models/ECAEnrollment.model';
import ECA from '@models/ECA.model';
import SportsEnrollment from '@models/SportsEnrollment.model';
import Sport from '@models/Sport.model';
import Event from '@models/Event.model';
import Certificate from '@models/Certificate.model';

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
          as: 'currentClass',
          attributes: ['gradeLevel', 'section'],
        },
      ],
    });

    return students.map((student: any) => ({
      studentId: student.studentId,
      name: student.getFullNameEn(),
      class: student.currentClass?.gradeLevel ? `Grade ${student.currentClass.gradeLevel}` : String(student.admissionClass),
      section: student.currentClass?.section || '',
      rollNo: student.rollNumber ?? null,
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

    return grades.map((grade: any) => ({
      subject: grade.exam?.examName || 'Exam',
      midterm: grade.grade,
      final: grade.grade,
      gpa: Number(grade.gradePoint),
    }));
  }

  async getChildFees(childId: number, parentUserId: number): Promise<FeeSummary> {
    await this.verifyParentAccess(childId, parentUserId);

    const invoices = await Invoice.findAll({
      where: { studentId: childId },
      order: [['dueDate', 'DESC']],
      limit: 10,
    });

    let totalPaid = 0;
    let totalPending = 0;

    const formattedInvoices = invoices.map((inv) => {
      const paidAmount = Number(inv.paidAmount || 0);
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
          ? `${new Date(inv.dueDate).toLocaleString('default', { month: 'long' })} ${new Date(inv.dueDate).getFullYear()}`
          : 'N/A',
        amount: Number(inv.totalAmount),
        status: inv.status,
        paidDate: paidAmount > 0 ? new Date(inv.updatedAt).toISOString().split('T')[0] : undefined,
        dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : undefined,
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

  async getChildLibrary(childId: number, parentUserId: number): Promise<any[]> {
    await this.verifyParentAccess(childId, parentUserId);

    const circulations = await BookCirculation.findAll({
      where: { studentId: childId },
      include: [
        {
          model: Book,
          as: 'book',
          attributes: ['title', 'author', 'isbn'],
        },
      ],
      order: [['issueDate', 'DESC']],
      limit: 20,
    });

    return circulations.map((circ: any) => ({
      bookTitle: circ.book?.title || 'Unknown',
      author: circ.book?.author || '',
      issuedDate: circ.issueDate ? new Date(circ.issueDate).toISOString().split('T')[0] : '',
      dueDate: circ.dueDate ? new Date(circ.dueDate).toISOString().split('T')[0] : '',
      returnDate: circ.returnDate ? new Date(circ.returnDate).toISOString().split('T')[0] : null,
      fine: circ.fine || 0,
      status: circ.returnDate ? 'returned' : (new Date() > new Date(circ.dueDate) ? 'overdue' : 'borrowed'),
    }));
  }

  async getChildAssignments(childId: number, parentUserId: number): Promise<any[]> {
    await this.verifyParentAccess(childId, parentUserId);

    const student = await Student.findByPk(childId);
    if (!student || !student.classId) {
      return [];
    }

    const assignments = await Assignment.findAll({
      where: { classId: student.classId },
      include: [
        {
          model: AssignmentSubmission,
          as: 'submissions',
          where: { studentId: childId },
          required: false,
        },
      ],
      order: [['dueDate', 'DESC']],
      limit: 20,
    });

    return assignments.map((assign: any) => {
      const submission = assign.submissions?.[0];
      return {
        id: assign.assignmentId,
        title: assign.title,
        subject: assign.subject,
        dueDate: assign.dueDate ? new Date(assign.dueDate).toISOString().split('T')[0] : '',
        status: submission ? submission.status : 'pending',
        grade: submission?.grade || null,
        submittedAt: submission?.submittedAt ? new Date(submission.submittedAt).toISOString().split('T')[0] : null,
      };
    });
  }

  async getChildActivities(childId: number, parentUserId: number): Promise<any> {
    await this.verifyParentAccess(childId, parentUserId);

    const [ecaEnrollments, sportsEnrollments] = await Promise.all([
      ECAEnrollment.findAll({
        where: { studentId: childId },
        include: [
          {
            model: ECA,
            as: 'eca',
            attributes: ['name', 'description', 'category'],
          },
        ],
      }),
      SportsEnrollment.findAll({
        where: { studentId: childId },
        include: [
          {
            model: Sport,
            as: 'sport',
            attributes: ['name', 'category'],
          },
        ],
      }),
    ]);

    return {
      eca: ecaEnrollments.map((e: any) => ({
        name: e.eca?.name || 'Unknown',
        category: e.eca?.category || '',
        enrolledDate: e.enrollmentDate ? new Date(e.enrollmentDate).toISOString().split('T')[0] : '',
        status: e.status || 'active',
      })),
      sports: sportsEnrollments.map((s: any) => ({
        name: s.sport?.name || 'Unknown',
        category: s.sport?.category || '',
        enrolledDate: s.enrollmentDate ? new Date(s.enrollmentDate).toISOString().split('T')[0] : '',
        status: s.status || 'active',
      })),
    };
  }

  async getChildBehavior(childId: number, parentUserId: number): Promise<any[]> {
    await this.verifyParentAccess(childId, parentUserId);

    // Placeholder - behavior tracking would need a dedicated table
    // For now, return empty array or mock data
    return [];
  }

  async getSchoolCalendar(): Promise<any[]> {
    const events = await Event.findAll({
      where: {
        eventDate: {
          [Op.gte]: new Date(),
        },
      },
      order: [['eventDate', 'ASC']],
      limit: 50,
    });

    return events.map((event: any) => ({
      id: event.eventId,
      title: event.title || event.eventName,
      date: event.eventDate ? new Date(event.eventDate).toISOString().split('T')[0] : '',
      type: event.eventType || 'general',
      description: event.description || '',
    }));
  }

  async getChildCertificates(childId: number, parentUserId: number): Promise<any[]> {
    await this.verifyParentAccess(childId, parentUserId);

    const certificates = await Certificate.findAll({
      where: { studentId: childId },
      order: [['issueDate', 'DESC']],
    });

    return certificates.map((cert: any) => ({
      id: cert.certificateId,
      type: cert.certificateType,
      title: cert.title || cert.certificateType,
      issueDate: cert.issueDate ? new Date(cert.issueDate).toISOString().split('T')[0] : '',
      downloadUrl: cert.fileUrl || null,
    }));
  }
}

export default new ParentService();

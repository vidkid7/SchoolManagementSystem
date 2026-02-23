/**
 * Late Fee Service
 * 
 * Implements library late fee calculation, tracking, and payment
 * 
 * Requirements: 10.5, 10.6
 */

import { Op } from 'sequelize';
import { LibraryFine } from '../../models/LibraryFine.model';
import { Circulation } from '../../models/Circulation.model';
import { Book } from '../../models/Book.model';
import Student from '../../models/Student.model';
import { Notification } from '../../models/Notification.model';

export interface CreateFineRequest {
  circulationId: number;
  studentId: number;
  fineAmount: number;
  fineReason: 'overdue' | 'lost' | 'damaged';
  daysOverdue?: number;
  dailyRate?: number;
}

export interface PayFineRequest {
  fineId: number;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
}

export interface WaiveFineRequest {
  fineId: number;
  amount: number;
  waivedBy: number;
  reason: string;
}

export class LateFeeService {
  private readonly DEFAULT_DAILY_RATE = 5; // NPR 5 per day
  private readonly LOST_BOOK_FINE_MULTIPLIER = 2; // 2x book price
  private readonly DAMAGED_BOOK_FINE = 100; // NPR 100 for damaged books

  /**
   * Calculate late fee for overdue circulation
   */
  calculateOverdueFine(daysOverdue: number, dailyRate?: number): number {
    if (daysOverdue <= 0) return 0;
    const rate = dailyRate || this.DEFAULT_DAILY_RATE;
    return daysOverdue * rate;
  }

  /**
   * Create a fine record
   */
  async createFine(request: CreateFineRequest): Promise<LibraryFine> {
    const { circulationId, studentId, fineAmount, fineReason, daysOverdue, dailyRate } = request;

    // Check if fine already exists for this circulation
    const existingFine = await LibraryFine.findOne({
      where: { circulationId },
    });

    if (existingFine) {
      throw new Error('Fine already exists for this circulation');
    }

    // Create fine record
    const fine = await LibraryFine.create({
      circulationId,
      studentId,
      fineAmount,
      paidAmount: 0,
      balance: fineAmount,
      fineReason,
      daysOverdue,
      dailyRate,
      status: 'pending',
    });

    // Send notification to student
    await this.sendFineNotification(studentId, fineAmount, fineReason);

    return fine;
  }

  /**
   * Generate fine for overdue circulation
   */
  async generateOverdueFine(circulationId: number): Promise<LibraryFine | null> {
    const circulation = await Circulation.findByPk(circulationId);
    if (!circulation) {
      throw new Error('Circulation record not found');
    }

    // Check if already returned
    if (circulation.status === 'returned') {
      return null;
    }

    // Calculate days overdue
    const daysOverdue = circulation.getDaysOverdue();
    if (daysOverdue <= 0) {
      return null; // Not overdue yet
    }

    // Calculate fine amount
    const fineAmount = this.calculateOverdueFine(daysOverdue, this.DEFAULT_DAILY_RATE);

    // Create fine record
    return this.createFine({
      circulationId,
      studentId: circulation.studentId,
      fineAmount,
      fineReason: 'overdue',
      daysOverdue,
      dailyRate: this.DEFAULT_DAILY_RATE,
    });
  }

  /**
   * Generate fine for lost book
   */
  async generateLostBookFine(circulationId: number, bookPrice: number): Promise<LibraryFine> {
    const circulation = await Circulation.findByPk(circulationId);
    if (!circulation) {
      throw new Error('Circulation record not found');
    }

    const fineAmount = bookPrice * this.LOST_BOOK_FINE_MULTIPLIER;

    return this.createFine({
      circulationId,
      studentId: circulation.studentId,
      fineAmount,
      fineReason: 'lost',
    });
  }

  /**
   * Generate fine for damaged book
   */
  async generateDamagedBookFine(circulationId: number): Promise<LibraryFine> {
    const circulation = await Circulation.findByPk(circulationId);
    if (!circulation) {
      throw new Error('Circulation record not found');
    }

    return this.createFine({
      circulationId,
      studentId: circulation.studentId,
      fineAmount: this.DAMAGED_BOOK_FINE,
      fineReason: 'damaged',
    });
  }

  /**
   * Pay fine
   */
  async payFine(request: PayFineRequest): Promise<LibraryFine> {
    const { fineId, amount, paymentMethod, transactionId } = request;

    const fine = await LibraryFine.findByPk(fineId);
    if (!fine) {
      throw new Error('Fine not found');
    }

    if (fine.status === 'paid') {
      throw new Error('Fine has already been paid');
    }

    await fine.recordPayment(amount, paymentMethod, transactionId);

    // Send payment confirmation notification
    await this.sendPaymentConfirmation(fine.studentId, amount, fine.balance);

    return fine;
  }

  /**
   * Waive fine (with approval)
   */
  async waiveFine(request: WaiveFineRequest): Promise<LibraryFine> {
    const { fineId, amount, waivedBy, reason } = request;

    const fine = await LibraryFine.findByPk(fineId);
    if (!fine) {
      throw new Error('Fine not found');
    }

    await fine.waive(amount, waivedBy, reason);

    // Send waiver notification
    await this.sendWaiverNotification(fine.studentId, amount, reason);

    return fine;
  }

  /**
   * Get fine by ID
   */
  async getFineById(fineId: number): Promise<LibraryFine | null> {
    return LibraryFine.findByPk(fineId, {
      include: [
        {
          model: Circulation,
          include: [Book],
        },
        Student,
      ],
    });
  }

  /**
   * Get fines by student
   */
  async getFinesByStudent(studentId: number, status?: string): Promise<LibraryFine[]> {
    const whereClause: Record<string, unknown> = { studentId };
    if (status) {
      whereClause.status = status;
    }

    return LibraryFine.findAll({
      where: whereClause,
      include: [
        {
          model: Circulation,
          include: [Book],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Get pending fines by student
   */
  async getPendingFinesByStudent(studentId: number): Promise<LibraryFine[]> {
    return LibraryFine.findAll({
      where: {
        studentId,
        status: { [Op.in]: ['pending', 'partial'] },
      },
      include: [
        {
          model: Circulation,
          include: [Book],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Get total pending fine amount for student
   */
  async getTotalPendingFines(studentId: number): Promise<number> {
    const fines = await this.getPendingFinesByStudent(studentId);
    return fines.reduce((total, fine) => total + parseFloat(fine.balance.toString()), 0);
  }

  /**
   * Get all overdue fines
   */
  async getOverdueFines(): Promise<LibraryFine[]> {
    return LibraryFine.findAll({
      where: {
        fineReason: 'overdue',
        status: { [Op.in]: ['pending', 'partial'] },
      },
      include: [
        {
          model: Circulation,
          include: [Book],
        },
        Student,
      ],
      order: [['createdAt', 'ASC']],
    });
  }

  /**
   * Update overdue fines (recalculate for ongoing overdues)
   */
  async updateOverdueFines(): Promise<void> {
    // Get all active circulations that are overdue
    const overdueCirculations = await Circulation.findAll({
      where: {
        status: { [Op.in]: ['borrowed', 'renewed'] },
        dueDate: { [Op.lt]: new Date() },
      },
    });

    for (const circulation of overdueCirculations) {
      // Check if fine exists
      const existingFine = await LibraryFine.findOne({
        where: { circulationId: circulation.circulationId },
      });

      const daysOverdue = circulation.getDaysOverdue();
      const newFineAmount = this.calculateOverdueFine(daysOverdue, this.DEFAULT_DAILY_RATE);

      if (existingFine) {
        // Update existing fine
        existingFine.fineAmount = newFineAmount;
        existingFine.daysOverdue = daysOverdue;
        existingFine.balance = newFineAmount - existingFine.paidAmount - (existingFine.waivedAmount || 0);
        await existingFine.save();
      } else {
        // Create new fine
        await this.createFine({
          circulationId: circulation.circulationId,
          studentId: circulation.studentId,
          fineAmount: newFineAmount,
          fineReason: 'overdue',
          daysOverdue,
          dailyRate: this.DEFAULT_DAILY_RATE,
        });
      }
    }
  }

  /**
   * Get fine statistics
   */
  async getFineStats(): Promise<{
    totalFines: number;
    pendingFines: number;
    paidFines: number;
    totalAmount: number;
    totalPending: number;
    totalPaid: number;
  }> {
    const allFines = await LibraryFine.findAll();

    const totalFines = allFines.length;
    const pendingFines = allFines.filter((f) => f.status === 'pending' || f.status === 'partial').length;
    const paidFines = allFines.filter((f) => f.status === 'paid').length;

    const totalAmount = allFines.reduce((sum, f) => sum + parseFloat(f.fineAmount.toString()), 0);
    const totalPending = allFines.reduce((sum, f) => sum + parseFloat(f.balance.toString()), 0);
    const totalPaid = allFines.reduce((sum, f) => sum + parseFloat(f.paidAmount.toString()), 0);

    return {
      totalFines,
      pendingFines,
      paidFines,
      totalAmount,
      totalPending,
      totalPaid,
    };
  }

  /**
   * Send fine notification to student
   */
  private async sendFineNotification(
    studentId: number,
    amount: number,
    reason: 'overdue' | 'lost' | 'damaged'
  ): Promise<void> {
    const student = await Student.findByPk(studentId);
    if (!student || !student.userId) return;

    const reasonText = {
      overdue: 'late return',
      lost: 'lost book',
      damaged: 'damaged book',
    };

    await Notification.create({
      userId: student.userId,
      type: 'warning',
      category: 'library',
      title: 'Library Fine Generated',
      message: `A fine of NPR ${amount.toFixed(2)} has been generated for ${reasonText[reason]}. Please pay at the library.`,
      data: { studentId, fineAmount: amount, reason },
    });
  }

  /**
   * Send payment confirmation notification
   */
  private async sendPaymentConfirmation(studentId: number, paidAmount: number, balance: number): Promise<void> {
    const student = await Student.findByPk(studentId);
    if (!student || !student.userId) return;

    const message =
      balance === 0
        ? `Payment of NPR ${paidAmount.toFixed(2)} received. Your fine has been cleared.`
        : `Payment of NPR ${paidAmount.toFixed(2)} received. Remaining balance: NPR ${balance.toFixed(2)}.`;

    await Notification.create({
      userId: student.userId,
      type: 'success',
      category: 'library',
      title: 'Fine Payment Received',
      message,
      data: { studentId, paidAmount, balance },
    });
  }

  /**
   * Send waiver notification
   */
  private async sendWaiverNotification(studentId: number, waivedAmount: number, reason: string): Promise<void> {
    const student = await Student.findByPk(studentId);
    if (!student || !student.userId) return;

    await Notification.create({
      userId: student.userId,
      type: 'info',
      category: 'library',
      title: 'Fine Waived',
      message: `A fine of NPR ${waivedAmount.toFixed(2)} has been waived. Reason: ${reason}`,
      data: { studentId, waivedAmount, reason },
    });
  }
}

export const lateFeeService = new LateFeeService();

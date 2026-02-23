/**
 * Reservation Service
 * 
 * Implements book reservation system with notifications and auto-expiry
 * 
 * Requirements: 10.7, 10.8
 */

import { Op } from 'sequelize';
import { Reservation } from '../../models/Reservation.model';
import { Book } from '../../models/Book.model';
import Student from '../../models/Student.model';
import { Notification } from '../../models/Notification.model';

export interface CreateReservationRequest {
  bookId: number;
  studentId: number;
}

export interface CancelReservationRequest {
  reservationId: number;
  cancelledBy?: number;
  reason?: string;
}

export class ReservationService {
  private readonly DEFAULT_RESERVATION_EXPIRY_DAYS = 3; // Days to collect after notification

  /**
   * Create a book reservation
   */
  async createReservation(request: CreateReservationRequest): Promise<Reservation> {
    const { bookId, studentId } = request;

    // Check if book exists
    const book = await Book.findByPk(bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    // Check if book is available
    if (book.isAvailable()) {
      throw new Error('Book is currently available. No need to reserve. Please borrow directly.');
    }

    // Check if student already has an active reservation for this book
    const existingReservation = await Reservation.findOne({
      where: {
        bookId,
        studentId,
        status: { [Op.in]: ['pending', 'available'] },
      },
    });

    if (existingReservation) {
      throw new Error('You already have an active reservation for this book');
    }

    // Calculate queue position
    const queuePosition = await this.getQueuePosition(bookId);

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // Default 30 days for pending reservations

    // Create reservation
    const reservation = await Reservation.create({
      bookId,
      studentId,
      reservationDate: new Date(),
      expiryDate,
      status: 'pending',
      queuePosition: queuePosition + 1,
    });

    // Send confirmation notification
    await this.sendReservationConfirmation(studentId, book.title, queuePosition + 1);

    return reservation;
  }

  /**
   * Mark reservation as available (when book becomes available)
   */
  async markAsAvailable(reservationId: number): Promise<Reservation> {
    const reservation = await Reservation.findByPk(reservationId);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.status !== 'pending') {
      throw new Error('Reservation is not in pending status');
    }

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.DEFAULT_RESERVATION_EXPIRY_DAYS);

    // Update reservation
    reservation.status = 'available';
    reservation.availableDate = new Date();
    reservation.expiryDate = expiryDate;
    await reservation.save();

    // Send availability notification
    const book = await Book.findByPk(reservation.bookId);
    if (book) {
      await this.sendAvailabilityNotification(
        reservation.studentId,
        book.title,
        this.DEFAULT_RESERVATION_EXPIRY_DAYS
      );
    }

    return reservation;
  }

  /**
   * Fulfill reservation (when student collects the book)
   */
  async fulfillReservation(reservationId: number): Promise<Reservation> {
    const reservation = await Reservation.findByPk(reservationId);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.status !== 'available') {
      throw new Error('Reservation is not available for fulfillment');
    }

    // Check if expired
    if (reservation.expiryDate && new Date() > reservation.expiryDate) {
      throw new Error('Reservation has expired. Please create a new reservation.');
    }

    // Update reservation
    reservation.status = 'fulfilled';
    reservation.fulfilledDate = new Date();
    await reservation.save();

    return reservation;
  }

  /**
   * Cancel reservation
   */
  async cancelReservation(request: CancelReservationRequest): Promise<Reservation> {
    const { reservationId, cancelledBy, reason } = request;

    const reservation = await Reservation.findByPk(reservationId);
    if (!reservation) {
      throw new Error('Reservation not found');
    }

    if (reservation.status === 'fulfilled' || reservation.status === 'cancelled') {
      throw new Error('Reservation cannot be cancelled');
    }

    // Update reservation
    reservation.status = 'cancelled';
    reservation.cancelledDate = new Date();
    reservation.cancelledBy = cancelledBy;
    reservation.cancelReason = reason;
    await reservation.save();

    // Update queue positions for remaining reservations
    await this.updateQueuePositions(reservation.bookId);

    // Send cancellation notification
    const book = await Book.findByPk(reservation.bookId);
    if (book) {
      await this.sendCancellationNotification(reservation.studentId, book.title);
    }

    return reservation;
  }

  /**
   * Auto-expire reservations that weren't collected
   */
  async expireReservations(): Promise<number> {
    const now = new Date();

    // Find all available reservations that have expired
    const expiredReservations = await Reservation.findAll({
      where: {
        status: 'available',
        expiryDate: { [Op.lt]: now },
      },
    });

    let expiredCount = 0;

    for (const reservation of expiredReservations) {
      reservation.status = 'expired';
      await reservation.save();
      expiredCount++;

      // Send expiry notification
      const book = await Book.findByPk(reservation.bookId);
      if (book) {
        await this.sendExpiryNotification(reservation.studentId, book.title);
      }

      // Update queue positions
      await this.updateQueuePositions(reservation.bookId);
    }

    return expiredCount;
  }

  /**
   * Get reservation by ID
   */
  getReservationById(reservationId: number): Promise<Reservation | null> {
    return Reservation.findByPk(reservationId, {
      include: [Book, Student],
    });
  }

  /**
   * Get reservations by student
   */
  getReservationsByStudent(studentId: number, status?: string): Promise<Reservation[]> {
    const whereClause: Record<string, unknown> = { studentId };
    if (status) {
      whereClause.status = status;
    }

    return Reservation.findAll({
      where: whereClause,
      include: [Book],
      order: [['reservationDate', 'DESC']],
    });
  }

  /**
   * Get active reservations by student
   */
  getActiveReservationsByStudent(studentId: number): Promise<Reservation[]> {
    return Reservation.findAll({
      where: {
        studentId,
        status: { [Op.in]: ['pending', 'available'] },
      },
      include: [Book],
      order: [['reservationDate', 'ASC']],
    });
  }

  /**
   * Get reservations by book
   */
  getReservationsByBook(bookId: number, status?: string): Promise<Reservation[]> {
    const whereClause: Record<string, unknown> = { bookId };
    if (status) {
      whereClause.status = status;
    }

    return Reservation.findAll({
      where: whereClause,
      include: [Student],
      order: [['queuePosition', 'ASC']],
    });
  }

  /**
   * Get pending reservations by book (queue)
   */
  getPendingReservationsByBook(bookId: number): Promise<Reservation[]> {
    return Reservation.findAll({
      where: {
        bookId,
        status: 'pending',
      },
      include: [Student],
      order: [['queuePosition', 'ASC']],
    });
  }

  /**
   * Get next reservation in queue for a book
   */
  getNextReservation(bookId: number): Promise<Reservation | null> {
    return Reservation.findOne({
      where: {
        bookId,
        status: 'pending',
      },
      order: [['queuePosition', 'ASC']],
      include: [Student],
    });
  }

  /**
   * Process book return and notify next in queue
   */
  async processBookReturn(bookId: number): Promise<void> {
    // Get next reservation in queue
    const nextReservation = await this.getNextReservation(bookId);

    if (nextReservation) {
      // Mark as available
      await this.markAsAvailable(nextReservation.reservationId);
    }
  }

  /**
   * Get queue position for a book
   */
  private async getQueuePosition(bookId: number): Promise<number> {
    const count = await Reservation.count({
      where: {
        bookId,
        status: 'pending',
      },
    });
    return count;
  }

  /**
   * Update queue positions after cancellation/expiry
   */
  private async updateQueuePositions(bookId: number): Promise<void> {
    const pendingReservations = await Reservation.findAll({
      where: {
        bookId,
        status: 'pending',
      },
      order: [['queuePosition', 'ASC']],
    });

    // Reassign queue positions
    for (let i = 0; i < pendingReservations.length; i++) {
      pendingReservations[i].queuePosition = i + 1;
      await pendingReservations[i].save();
    }
  }

  /**
   * Get reservation statistics
   */
  async getReservationStats(): Promise<{
    totalReservations: number;
    pendingReservations: number;
    availableReservations: number;
    fulfilledReservations: number;
    expiredReservations: number;
    cancelledReservations: number;
  }> {
    const totalReservations = await Reservation.count();
    const pendingReservations = await Reservation.count({ where: { status: 'pending' } });
    const availableReservations = await Reservation.count({ where: { status: 'available' } });
    const fulfilledReservations = await Reservation.count({ where: { status: 'fulfilled' } });
    const expiredReservations = await Reservation.count({ where: { status: 'expired' } });
    const cancelledReservations = await Reservation.count({ where: { status: 'cancelled' } });

    return {
      totalReservations,
      pendingReservations,
      availableReservations,
      fulfilledReservations,
      expiredReservations,
      cancelledReservations,
    };
  }

  /**
   * Send reservation confirmation notification
   */
  private async sendReservationConfirmation(
    studentId: number,
    bookTitle: string,
    queuePosition: number
  ): Promise<void> {
    const student = await Student.findByPk(studentId);
    if (!student || !student.userId) return;

    await Notification.create({
      userId: student.userId,
      type: 'info',
      category: 'library',
      title: 'Book Reservation Confirmed',
      message: `Your reservation for "${bookTitle}" has been confirmed. You are #${queuePosition} in the queue. We will notify you when the book becomes available.`,
      data: { studentId, bookTitle, queuePosition },
    });
  }

  /**
   * Send availability notification
   */
  private async sendAvailabilityNotification(
    studentId: number,
    bookTitle: string,
    expiryDays: number
  ): Promise<void> {
    const student = await Student.findByPk(studentId);
    if (!student || !student.userId) return;

    await Notification.create({
      userId: student.userId,
      type: 'success',
      category: 'library',
      title: 'Reserved Book Available',
      message: `The book "${bookTitle}" you reserved is now available. Please collect it within ${expiryDays} days or your reservation will expire.`,
      data: { studentId, bookTitle, expiryDays },
    });
  }

  /**
   * Send cancellation notification
   */
  private async sendCancellationNotification(studentId: number, bookTitle: string): Promise<void> {
    const student = await Student.findByPk(studentId);
    if (!student || !student.userId) return;

    await Notification.create({
      userId: student.userId,
      type: 'info',
      category: 'library',
      title: 'Reservation Cancelled',
      message: `Your reservation for "${bookTitle}" has been cancelled.`,
      data: { studentId, bookTitle },
    });
  }

  /**
   * Send expiry notification
   */
  private async sendExpiryNotification(studentId: number, bookTitle: string): Promise<void> {
    const student = await Student.findByPk(studentId);
    if (!student || !student.userId) return;

    await Notification.create({
      userId: student.userId,
      type: 'warning',
      category: 'library',
      title: 'Reservation Expired',
      message: `Your reservation for "${bookTitle}" has expired as it was not collected within the specified time. Please create a new reservation if you still need the book.`,
      data: { studentId, bookTitle },
    });
  }
}

export const reservationService = new ReservationService();

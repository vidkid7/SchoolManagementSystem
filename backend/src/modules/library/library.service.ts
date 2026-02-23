/**
 * Library Service
 * 
 * Implements library book circulation, late fee calculation, and borrowing limits
 * 
 * Requirements: 10.4, 10.5, 10.6, 10.7, 10.8, 10.13
 */

import { Op } from 'sequelize';
import { Book, BookCreationAttributes } from '../../models/Book.model';
import { Circulation, CirculationCreationAttributes } from '../../models/Circulation.model';
import { Notification } from '../../models/Notification.model';
import Student from '../../models/Student.model';

export interface BookFilters {
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface IssueBookRequest {
  bookId: number;
  studentId: number;
  issuedBy: number;
  dueDate?: Date;
  condition?: 'good' | 'damaged' | 'poor';
}

export interface ReturnBookRequest {
  circulationId: number;
  returnedBy: number;
  condition?: 'good' | 'damaged' | 'poor';
}

export interface RenewBookRequest {
  circulationId: number;
}

export interface BookWithCirculation extends Book {
  circulation?: Circulation;
}

export class LibraryService {
  private readonly DEFAULT_BORROWING_DAYS = 14;
  private readonly DEFAULT_MAX_RENEWALS = 2;
  private readonly DEFAULT_DAILY_FINE = 5;
  private readonly DEFAULT_BORROWING_LIMIT = 3;

  /**
   * Get all books with filters
   */
  async getBooks(filters: BookFilters = {}): Promise<{ books: Book[]; total: number; page: number; limit: number }> {
    const { category, status, search, page = 1, limit = 20 } = filters;

    const whereClause: any = {};
    if (category) whereClause.category = category;
    if (status) whereClause.status = status;
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { author: { [Op.like]: `%${search}%` } },
        { accessionNumber: { [Op.like]: `%${search}%` } },
        { isbn: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Book.findAndCountAll({
      where: whereClause,
      order: [['title', 'ASC']],
      limit,
      offset: (page - 1) * limit,
    });

    return { books: rows, total: count, page, limit };
  }

  /**
   * Get book by ID
   */
  async getBookById(bookId: number): Promise<Book | null> {
    return Book.findByPk(bookId);
  }

  /**
   * Create a new book
   */
  async createBook(data: BookCreationAttributes): Promise<Book> {
    return Book.create({
      ...data,
      availableCopies: data.copies || 1,
      status: 'available',
    });
  }

  /**
   * Issue a book to a student
   */
  async issueBook(request: IssueBookRequest): Promise<Circulation> {
    const { bookId, studentId, issuedBy, dueDate, condition } = request;

    // Get the book
    const book = await Book.findByPk(bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    // Check if book is available
    if (!book.isAvailable()) {
      throw new Error('Book is not available for borrowing');
    }

    // Check student's borrowing limit
    const activeBorrowings = await this.getActiveBorrowingsByStudent(studentId);
    if (activeBorrowings.length >= this.DEFAULT_BORROWING_LIMIT) {
      throw new Error(`Student has reached the maximum borrowing limit of ${this.DEFAULT_BORROWING_LIMIT} books`);
    }

    // Create circulation record
    const circulation = await Circulation.create({
      bookId,
      studentId,
      issueDate: new Date(),
      dueDate: dueDate || this.calculateDueDate(),
      issuedBy,
      status: 'borrowed',
      maxRenewals: this.DEFAULT_MAX_RENEWALS,
      conditionOnIssue: condition || 'good',
    } as CirculationCreationAttributes);

    // Update book available copies
    await book.decrementAvailableCopies();

    return circulation;
  }

  /**
   * Return a book
   */
  async returnBook(request: ReturnBookRequest): Promise<Circulation> {
    const { circulationId, returnedBy, condition } = request;

    const circulation = await Circulation.findByPk(circulationId);
    if (!circulation) {
      throw new Error('Circulation record not found');
    }

    if (circulation.status === 'returned') {
      throw new Error('Book has already been returned');
    }

    // Calculate fine if overdue
    const daysOverdue = circulation.getDaysOverdue();
    if (daysOverdue > 0) {
      circulation.fine = daysOverdue * this.DEFAULT_DAILY_FINE;
    }

    // Update circulation
    circulation.returnDate = new Date();
    circulation.status = 'returned';
    circulation.returnedBy = returnedBy;
    circulation.conditionOnReturn = condition;
    await circulation.save();

    // Update book available copies
    const book = await Book.findByPk(circulation.bookId);
    if (book) {
      await book.incrementAvailableCopies();
    }

    // Send notification for fine if applicable
    if (circulation.fine > 0) {
      await this.sendFineNotification(circulation.studentId, circulation.fine);
    }

    return circulation;
  }

  /**
   * Renew a book
   */
  async renewBook(request: RenewBookRequest): Promise<Circulation> {
    const { circulationId } = request;

    const circulation = await Circulation.findByPk(circulationId);
    if (!circulation) {
      throw new Error('Circulation record not found');
    }

    if (!circulation.canRenew()) {
      throw new Error('Book cannot be renewed. Maximum renewals reached or book is not borrowed');
    }

    return circulation.renew();
  }

  /**
   * Get currently borrowed books by student
   */
  async getBorrowedBooksByStudent(studentId: number): Promise<Circulation[]> {
    return Circulation.findAll({
      where: {
        studentId,
        status: { [Op.in]: ['borrowed', 'renewed'] },
      },
      include: [Book],
      order: [['dueDate', 'ASC']],
    });
  }

  /**
   * Get active borrowings by student
   */
  async getActiveBorrowingsByStudent(studentId: number): Promise<Circulation[]> {
    return Circulation.findAll({
      where: {
        studentId,
        status: { [Op.in]: ['borrowed', 'renewed'] },
      },
    });
  }

  /**
   * Get overdue books
   */
  async getOverdueBooks(): Promise<Circulation[]> {
    return Circulation.findAll({
      where: {
        status: 'borrowed',
        dueDate: { [Op.lt]: new Date() },
      },
      include: [Book, Student],
      order: [['dueDate', 'ASC']],
    });
  }

  /**
   * Calculate fine for a circulation
   */
  calculateFine(circulation: Circulation, dailyRate?: number): number {
    return circulation.calculateFine(dailyRate || this.DEFAULT_DAILY_FINE);
  }

  /**
   * Check borrowing limit
   */
  async checkBorrowingLimit(studentId: number): Promise<{ canBorrow: boolean; currentCount: number; limit: number }> {
    const borrowings = await this.getActiveBorrowingsByStudent(studentId);
    return {
      canBorrow: borrowings.length < this.DEFAULT_BORROWING_LIMIT,
      currentCount: borrowings.length,
      limit: this.DEFAULT_BORROWING_LIMIT,
    };
  }

  /**
   * Reserve a book
   */
  async reserveBook(bookId: number, studentId: number): Promise<void> {
    const book = await Book.findByPk(bookId);
    if (!book) {
      throw new Error('Book not found');
    }

    if (book.isAvailable()) {
      throw new Error('Book is available, no need to reserve');
    }

    // Create notification when book becomes available
    // This would typically be triggered by a background job
    await Notification.create({
      userId: (await Student.findByPk(studentId))?.userId || 0,
      type: 'info',
      category: 'library',
      title: 'Book Reservation Available',
      message: `The book "${book.title}" you reserved is now available. Please collect it within 3 days.`,
      data: { bookId, studentId },
    });
  }

  /**
   * Calculate due date
   */
  private calculateDueDate(): Date {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + this.DEFAULT_BORROWING_DAYS);
    return dueDate;
  }

  /**
   * Send fine notification
   */
  private async sendFineNotification(studentId: number, fine: number): Promise<void> {
    const student = await Student.findByPk(studentId);
    if (student && student.userId) {
      await Notification.create({
        userId: student.userId,
        type: 'warning',
        category: 'library',
        title: 'Library Fine Generated',
        message: `A fine of NPR ${fine.toFixed(2)} has been generated for late return of a library book.`,
        data: { studentId, fineAmount: fine },
      });
    }
  }

  /**
   * Get library statistics
   */
  async getLibraryStats(): Promise<{
    totalBooks: number;
    availableBooks: number;
    borrowedBooks: number;
    overdueBooks: number;
    totalCirculations: number;
  }> {
    const totalBooks = await Book.count();
    const availableBooks = await Book.count({ where: { status: 'available' } });
    const borrowedBooks = await Book.count({ where: { status: 'borrowed' } });
    const overdueBooks = await Circulation.count({
      where: {
        status: 'borrowed',
        dueDate: { [Op.lt]: new Date() },
      },
    });
    const totalCirculations = await Circulation.count();

    return {
      totalBooks,
      availableBooks,
      borrowedBooks,
      overdueBooks,
      totalCirculations,
    };
  }
}

export const libraryService = new LibraryService();

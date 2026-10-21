/**
 * Library Controller
 * 
 * Handles HTTP requests for library management
 * 
 * Requirements: 10.1-10.13
 */

import { Request, Response } from 'express';
import { Op } from 'sequelize';
import PDFDocument from 'pdfkit';
import sequelize from '../../config/database';
import { LibraryFine } from '../../models/LibraryFine.model';
import { LibraryCategory } from '../../models/LibraryCategory.model';
import { Book } from '../../models/Book.model';
import { Circulation } from '../../models/Circulation.model';
import Student from '../../models/Student.model';
import { libraryService } from './library.service';
import { lateFeeService } from './lateFee.service';
import { reservationService } from './reservation.service';

const defaultCategories = [
  { name: 'Fiction', description: 'Fiction and literature' },
  { name: 'Non-Fiction', description: 'Non-fiction and reference' },
  { name: 'Academic', description: 'Academic and textbooks' },
  { name: 'Science', description: '' },
  { name: 'History', description: '' },
  { name: 'Reference', description: '' },
  { name: 'Textbook', description: '' },
];

export class LibraryController {
  /**
   * Get all categories
   * GET /api/v1/library/categories
   */
  async getCategories(_req: Request, res: Response): Promise<void> {
    try {
      const existingBooks = await Book.findAll({ attributes: ['category'], group: ['category'], raw: true }) as unknown as Array<{ category: string }>;
      const categoriesByName = new Map(defaultCategories.map((category) => [category.name, category.description]));
      existingBooks.forEach(({ category }) => {
        if (category?.trim()) categoriesByName.set(category.trim(), categoriesByName.get(category.trim()) ?? '');
      });

      for (const [name, description] of categoriesByName) {
        await LibraryCategory.findOrCreate({ where: { name }, defaults: { name, description } });
      }

      const categories = await LibraryCategory.findAll({ order: [['name', 'ASC']] });
      const data = await Promise.all(categories.map(async (category) => ({
        ...category.toJSON(),
        bookCount: await Book.count({ where: { category: category.name } }),
      })));
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch categories',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Create category
   * POST /api/v1/library/categories
   */
  async createCategory(req: Request, res: Response): Promise<void> {
    try {
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
      const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';
      if (!name || name.length > 100 || description.length > 255) {
        res.status(400).json({ success: false, message: 'Category name is required and must be 100 characters or fewer; description must be 255 characters or fewer.' });
        return;
      }

      const [newCategory, created] = await LibraryCategory.findOrCreate({ where: { name }, defaults: { name, description } });
      if (!created) {
        res.status(409).json({ success: false, message: 'A category with this name already exists.' });
        return;
      }
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: { ...newCategory.toJSON(), bookCount: 0 },
      });
    } catch (error) {
      if ((error as { name?: string }).name === 'SequelizeUniqueConstraintError') {
        res.status(409).json({ success: false, message: 'A category with this name already exists.' });
        return;
      }
      res.status(500).json({
        success: false,
        message: 'Failed to create category',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update category
   * PUT /api/v1/library/categories/:id
   */
  async updateCategory(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const category = await LibraryCategory.findByPk(id);
      if (!category) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : undefined;
      const description = typeof req.body?.description === 'string' ? req.body.description.trim() : undefined;
      if (name !== undefined && (!name || name.length > 100)) {
        res.status(400).json({ success: false, message: 'Category name is required and must be 100 characters or fewer.' });
        return;
      }
      if (description !== undefined && description.length > 255) {
        res.status(400).json({ success: false, message: 'Description must be 255 characters or fewer.' });
        return;
      }

      const oldName = category.name;
      await sequelize.transaction(async (transaction) => {
        if (name && name !== oldName) {
          const duplicate = await LibraryCategory.findOne({ where: { name }, transaction });
          if (duplicate) throw Object.assign(new Error('A category with this name already exists.'), { status: 409 });
          await Book.update({ category: name }, { where: { category: oldName }, transaction });
        }
        await category.update({ ...(name ? { name } : {}), ...(description !== undefined ? { description } : {}) }, { transaction });
      });
      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: { ...category.toJSON(), bookCount: await Book.count({ where: { category: category.name } }) },
      });
    } catch (error) {
      if ((error as { status?: number }).status === 409) {
        res.status(409).json({ success: false, message: (error as Error).message });
        return;
      }
      if ((error as { name?: string }).name === 'SequelizeUniqueConstraintError') {
        res.status(409).json({ success: false, message: 'A category with this name already exists.' });
        return;
      }
      res.status(500).json({
        success: false,
        message: 'Failed to update category',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete category
   * DELETE /api/v1/library/categories/:id
   */
  async deleteCategory(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const category = await LibraryCategory.findByPk(id);
      if (!category) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }
      const bookCount = await Book.count({ where: { category: category.name } });
      if (bookCount > 0) {
        res.status(409).json({ success: false, message: 'Cannot delete a category while books are assigned to it.' });
        return;
      }
      await category.destroy();
      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete category',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get all books with filters
   * GET /api/v1/library/books
   */
  async getBooks(req: Request, res: Response): Promise<void> {
    try {
      const { category, status, search, page, limit } = req.query;

      const result = await libraryService.getBooks({
        category: category as string,
        status: status as string,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch books',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get book by ID
   * GET /api/v1/library/books/:id
   */
  async getBookById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const book = await libraryService.getBookById(parseInt(id));

      if (!book) {
        res.status(404).json({
          success: false,
          message: 'Book not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: book,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch book',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Create a new book
   * POST /api/v1/library/books
   */
  async createBook(req: Request, res: Response): Promise<void> {
    try {
      const book = await libraryService.createBook(req.body);

      res.status(201).json({
        success: true,
        message: 'Book created successfully',
        data: book,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create book',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Update a book
   * PUT /api/v1/library/books/:id
   */
  async updateBook(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const book = await libraryService.updateBook(id, req.body);
      if (!book) {
        res.status(404).json({ success: false, message: 'Book not found' });
        return;
      }
      res.status(200).json({
        success: true,
        message: 'Book updated successfully',
        data: book,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update book',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Delete a book
   * DELETE /api/v1/library/books/:id
   */
  async deleteBook(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const deleted = await libraryService.deleteBook(id);
      if (!deleted) {
        res.status(404).json({ success: false, message: 'Book not found' });
        return;
      }
      res.status(200).json({
        success: true,
        message: 'Book deleted successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete book',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get circulation list (issued, overdue, returned) - frontend GET /library/circulation
   * GET /api/v1/library/circulation
   */
  async getCirculation(req: Request, res: Response): Promise<void> {
    try {
      const status = (req.query.status as string) || 'issued';
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await libraryService.getCirculationList(status, page, limit);
      res.status(200).json({
        success: true,
        data: result.circulations,
        meta: { total: result.total, page: result.page, limit: result.limit },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch circulation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Return book by circulation ID (frontend POST /library/return/:id)
   * POST /api/v1/library/return/:id
   */
  async returnBookById(req: Request, res: Response): Promise<void> {
    try {
      const circulationId = parseInt(req.params.id);
      const returnedBy = req.user?.userId || 0;
      const { condition } = req.body || {};
      const circulation = await libraryService.returnBook({
        circulationId,
        returnedBy,
        condition,
      });
      res.status(200).json({
        success: true,
        message: 'Book returned successfully',
        data: circulation,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to return book',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Issue a book to a student
   * POST /api/v1/library/issue
   */
  async issueBook(req: Request, res: Response): Promise<void> {
    try {
      const { bookId, studentId, dueDate, condition } = req.body;
      const issuedBy = req.user?.userId || 0;

      const circulation = await libraryService.issueBook({
        bookId,
        studentId,
        issuedBy,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        condition,
      });

      res.status(201).json({
        success: true,
        message: 'Book issued successfully',
        data: circulation,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to issue book',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Return a book
   * POST /api/v1/library/return
   */
  async returnBook(req: Request, res: Response): Promise<void> {
    try {
      const circulationId = req.body.circulationId ?? req.body.circulation_id;
      const { condition } = req.body || {};
      const returnedBy = req.user?.userId || 0;

      const circulation = await libraryService.returnBook({
        circulationId,
        returnedBy,
        condition,
      });

      res.status(200).json({
        success: true,
        message: 'Book returned successfully',
        data: circulation,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to return book',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Renew a book
   * POST /api/v1/library/renew
   */
  async renewBook(req: Request, res: Response): Promise<void> {
    try {
      const { circulationId } = req.body;

      const circulation = await libraryService.renewBook({ circulationId });

      res.status(200).json({
        success: true,
        message: 'Book renewed successfully',
        data: circulation,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to renew book',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get currently issued books
   * GET /api/v1/library/issued
   */
  async getIssuedBooks(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.query;

      if (!studentId) {
        res.status(400).json({
          success: false,
          message: 'Student ID is required',
        });
        return;
      }

      const books = await libraryService.getBorrowedBooksByStudent(parseInt(studentId as string));

      res.status(200).json({
        success: true,
        data: books,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch issued books',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get overdue books
   * GET /api/v1/library/overdue
   */
  async getOverdueBooks(_req: Request, res: Response): Promise<void> {
    try {
      const books = await libraryService.getOverdueBooks();

      res.status(200).json({
        success: true,
        data: books,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch overdue books',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Reserve a book
   * POST /api/v1/library/reserve
   */
  async reserveBook(req: Request, res: Response): Promise<void> {
    try {
      const { bookId, studentId } = req.body;

      const reservation = await reservationService.createReservation({
        bookId,
        studentId,
      });

      res.status(201).json({
        success: true,
        message: 'Book reserved successfully',
        data: reservation,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to reserve book',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get reservations
   * GET /api/v1/library/reservations
   */
  async getReservations(req: Request, res: Response): Promise<void> {
    try {
      const { studentId, bookId, status } = req.query;

      let reservations;
      if (studentId) {
        reservations = await reservationService.getReservationsByStudent(
          parseInt(studentId as string),
          status as string
        );
      } else if (bookId) {
        reservations = await reservationService.getReservationsByBook(
          parseInt(bookId as string),
          status as string
        );
      } else {
        res.status(400).json({
          success: false,
          message: 'Either studentId or bookId is required',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: reservations,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch reservations',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Cancel reservation
   * PUT /api/v1/library/reservations/:id/cancel
   */
  async cancelReservation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const cancelledBy = req.user?.userId;

      const reservation = await reservationService.cancelReservation({
        reservationId: parseInt(id),
        cancelledBy,
        reason,
      });

      res.status(200).json({
        success: true,
        message: 'Reservation cancelled successfully',
        data: reservation,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to cancel reservation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get all fines (optionally filtered by status)
   * GET /api/v1/library/fines
   */
  async getAllFines(req: Request, res: Response): Promise<void> {
    try {
      const { status, limit } = req.query;
      const whereClause: Record<string, unknown> = {};
      if (status) {
        whereClause.status = status;
      }

      const fines = await LibraryFine.findAll({
        where: whereClause,
        limit: Math.min(Number(limit) || 50, 200),
        order: [['createdAt', 'DESC']],
      });

      res.status(200).json({
        success: true,
        data: fines,
      });
    } catch (error) {
      res.status(200).json({
        success: true,
        data: [],
      });
    }
  }

  /**
   * Get fines by student
   * GET /api/v1/library/fines/:studentId
   */
  async getFinesByStudent(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { status } = req.query;
      const parsedStudentId = Number(studentId);

      if (!Number.isInteger(parsedStudentId) || parsedStudentId <= 0) {
        res.status(400).json({ success: false, message: 'Student ID must be a positive integer' });
        return;
      }

      const fines = await lateFeeService.getFinesByStudent(parsedStudentId, status as string);

      res.status(200).json({
        success: true,
        data: fines,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch fines',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Pay fine
   * POST /api/v1/library/fines/:id/pay
   */
  async payFine(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { amount, paymentMethod, transactionId } = req.body;

      const fine = await lateFeeService.payFine({
        fineId: parseInt(id),
        amount,
        paymentMethod,
        transactionId,
      });

      res.status(200).json({
        success: true,
        message: 'Fine paid successfully',
        data: fine,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to pay fine',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Pay fine by circulation ID (frontend POST /library/pay-fine/:id)
   * POST /api/v1/library/pay-fine/:id
   */
  async payFineByCirculationId(req: Request, res: Response): Promise<void> {
    try {
      const circulationId = parseInt(req.params.id);
      const fineRecord = await LibraryFine.findOne({ where: { circulationId } });
      if (!fineRecord) {
        res.status(404).json({
          success: false,
          message: 'No fine found for this circulation. Return the book first to generate a fine if overdue.',
        });
        return;
      }
      const { amount, paymentMethod, transactionId } = req.body || {};
      const fine = await lateFeeService.payFine({
        fineId: fineRecord.fineId,
        amount: amount ?? fineRecord.balance,
        paymentMethod: paymentMethod || 'cash',
        transactionId,
      });
      res.status(200).json({
        success: true,
        message: 'Fine paid successfully',
        data: fine,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: 'Failed to pay fine',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get library statistics
   * GET /api/v1/library/reports
   */
  async getLibraryReports(req: Request, res: Response): Promise<void> {
    try {
      const reportType = typeof req.query.type === 'string' ? req.query.type : '';
      if (reportType) {
        const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : '';
        const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : '';
        const validDate = (value: string) => {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
          const parsed = new Date(`${value}T00:00:00Z`);
          return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
        };
        const allowedTypes = ['circulation', 'overdue', 'popular', 'fines', 'inventory', 'member'];
        if (!allowedTypes.includes(reportType) || !validDate(startDate) || !validDate(endDate) || startDate > endDate) {
          res.status(400).json({ success: false, message: 'A supported report type and valid start/end dates are required.' });
          return;
        }
        await this.downloadLibraryReport(reportType, startDate, endDate, res);
        return;
      }

      console.log('Fetching library stats...');
      const libraryStats = await libraryService.getLibraryStats();
      console.log('Library stats:', libraryStats);
      
      console.log('Fetching fine stats...');
      const fineStats = await lateFeeService.getFineStats();
      console.log('Fine stats:', fineStats);
      
      console.log('Fetching reservation stats...');
      let reservationStats;
      try {
        reservationStats = await reservationService.getReservationStats();
        console.log('Reservation stats:', reservationStats);
      } catch (error: any) {
        // Handle case where reservations table doesn't exist yet
        if (error?.original?.code === 'ER_NO_SUCH_TABLE') {
          console.log('Reservations table does not exist yet, using zero values');
          reservationStats = {
            totalReservations: 0,
            pendingReservations: 0,
            availableReservations: 0,
            fulfilledReservations: 0,
            expiredReservations: 0,
            cancelledReservations: 0,
          };
        } else {
          throw error;
        }
      }

      res.status(200).json({
        success: true,
        data: {
          booksIssuedMonth: libraryStats.totalCirculations || 0,
          booksReturned: libraryStats.totalCirculations - libraryStats.borrowedBooks || 0,
          overdueBooks: libraryStats.overdueBooks || 0,
          finesCollected: fineStats.totalPaid || 0,
          totalBooks: libraryStats.totalBooks || 0,
          library: libraryStats,
          fines: fineStats,
          reservations: reservationStats,
        },
      });
    } catch (error) {
      console.error('Error in getLibraryReports:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      res.status(500).json({
        success: false,
        message: 'Failed to fetch library reports',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async downloadLibraryReport(reportType: string, startDate: string, endDate: string, res: Response): Promise<void> {
    const range = { [Op.between]: [startDate, endDate] };
    let lines: string[] = [];
    const title = reportType.replace(/^./, (letter) => letter.toUpperCase());

    if (reportType === 'inventory') {
      const books = await Book.findAll({ order: [['title', 'ASC']], limit: 10000 });
      lines = books.map((book) => `${book.accessionNumber} | ${book.title} | ${book.author} | ${book.category} | ${book.availableCopies}/${book.copies} available | ${book.status}`);
    } else if (reportType === 'fines') {
      const fines = await LibraryFine.findAll({
        where: { createdAt: range },
        order: [['createdAt', 'DESC']],
        limit: 10000,
      });
      lines = fines.map((fine) => `Fine #${fine.fineId} | Student #${fine.studentId} | ${fine.fineReason} | Amount: NPR ${fine.fineAmount} | Paid: NPR ${fine.paidAmount} | Balance: NPR ${fine.balance} | ${fine.status}`);
    } else {
      const where: any = { issueDate: range };
      if (reportType === 'overdue') {
        where.dueDate = { [Op.between]: [startDate, endDate] };
        where.status = { [Op.in]: ['borrowed', 'overdue'] };
      }
      const circulations = await Circulation.findAll({
        where,
        include: [
          { model: Book, as: 'book', attributes: ['title', 'accessionNumber'] },
          { model: Student, as: 'student', attributes: ['studentCode', 'firstNameEn', 'lastNameEn'] },
        ],
        order: [['issueDate', 'DESC']],
        limit: 10000,
      });
      const rows = circulations.map((circulation) => {
        const book = circulation.get('book') as Book | undefined;
        const student = circulation.get('student') as Student | undefined;
        const studentName = student ? `${student.firstNameEn} ${student.lastNameEn}` : `Student #${circulation.studentId}`;
        return { circulation, book, studentName };
      });

      if (reportType === 'popular') {
        const counts = new Map<string, number>();
        rows.forEach(({ book }) => {
          const key = book?.title || 'Unknown book';
          counts.set(key, (counts.get(key) || 0) + 1);
        });
        lines = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([book, count]) => `${book} | Issues: ${count}`);
      } else if (reportType === 'member') {
        const counts = new Map<string, number>();
        rows.forEach(({ circulation, studentName }) => {
          const key = `${studentName} (ID ${circulation.studentId})`;
          counts.set(key, (counts.get(key) || 0) + 1);
        });
        lines = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([student, count]) => `${student} | Circulations: ${count}`);
      } else {
        lines = rows.map(({ circulation, book, studentName }) => `${circulation.issueDate} | ${book?.accessionNumber || `Book #${circulation.bookId}`} ${book?.title || ''} | ${studentName} | Due ${circulation.dueDate} | ${circulation.status}`);
      }
    }

    const filename = `library_${reportType}_${startDate}_${endDate}.pdf`;
    res.status(200);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    doc.pipe(res);
    doc.fontSize(18).text(`${title} Library Report`, { align: 'center' });
    doc.moveDown(0.5).fontSize(10).text(`Date range: ${startDate} to ${endDate}`);
    doc.moveDown();
    doc.fontSize(9);
    if (!lines.length) {
      doc.text('No records found for this report.');
    } else {
      lines.forEach((line, index) => doc.text(`${index + 1}. ${line}`, { width: 500 }));
    }
    doc.end();
  }

  /**
   * Get library dashboard statistics
   * GET /api/v1/library/statistics
   */
  async getStatistics(_req: Request, res: Response): Promise<void> {
    try {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const [libraryStats, fineStats, categoryRows, circulations] = await Promise.all([
        libraryService.getLibraryStats(),
        lateFeeService.getFineStats(),
        Book.findAll({
          attributes: [
            'category',
            [Book.sequelize!.fn('COUNT', Book.sequelize!.col('book_id')), 'count'],
          ],
          group: ['category'],
          raw: true,
        }) as unknown as Promise<Array<{ category: string; count: string | number }>>,
        Circulation.findAll({
          where: { issueDate: { [Op.gte]: sixMonthsAgo } },
          attributes: ['issueDate'],
          raw: true,
        }) as Promise<Array<{ issueDate: string | Date }>>,
      ]);

      const monthBuckets = new Map<string, number>();
      for (let i = 5; i >= 0; i -= 1) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        monthBuckets.set(date.toLocaleString('en-US', { month: 'short' }), 0);
      }

      circulations.forEach((circulation) => {
        const date = new Date(circulation.issueDate);
        if (Number.isNaN(date.getTime())) return;
        const label = date.toLocaleString('en-US', { month: 'short' });
        if (monthBuckets.has(label)) {
          monthBuckets.set(label, (monthBuckets.get(label) || 0) + 1);
        }
      });

      const statistics = {
        totalBooks: libraryStats?.totalBooks ?? 0,
        availableBooks: libraryStats?.availableBooks ?? 0,
        issuedBooks: libraryStats?.borrowedBooks ?? 0,
        overdueBooks: libraryStats?.overdueBooks ?? 0,
        totalMembers: libraryStats?.totalCirculations ?? 0,
        activeMembers: libraryStats?.borrowedBooks ?? 0,
        totalFines: fineStats?.totalFines ?? 0,
        collectedFines: fineStats?.totalPaid ?? 0,
        pendingFines: fineStats?.pendingFines ?? 0,
        booksByCategory: categoryRows.map((row) => ({
          category: row.category || 'Uncategorized',
          count: Number(row.count || 0),
        })),
        monthlyIssuance: Array.from(monthBuckets.entries()).map(([month, count]) => ({ month, count })),
      };

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch library statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get recent library activities
   * GET /api/v1/library/recent-activities
   */
  async getRecentActivities(req: Request, res: Response): Promise<void> {
    try {
      const limit = Number(req.query.limit) || 10;

      const [circulations, fines] = await Promise.all([
        Circulation.findAll({ order: [['createdAt', 'DESC']], limit, raw: true }) as Promise<any[]>,
        LibraryFine.findAll({ order: [['createdAt', 'DESC']], limit, raw: true }) as Promise<any[]>,
      ]);

      const bookIds = circulations.map((item) => item.bookId).filter(Boolean);
      const studentIds = [
        ...circulations.map((item) => item.studentId),
        ...fines.map((item) => item.studentId),
      ].filter(Boolean);

      const [books, students] = await Promise.all([
        bookIds.length
          ? Book.findAll({
              where: { bookId: { [Op.in]: Array.from(new Set(bookIds)) } },
              attributes: ['bookId', 'title'],
              raw: true,
            }) as Promise<Array<{ bookId: number; title: string }>>
          : Promise.resolve([]),
        studentIds.length
          ? Student.findAll({
              where: { studentId: { [Op.in]: Array.from(new Set(studentIds)) } },
              attributes: ['studentId', 'firstNameEn', 'lastNameEn'],
              raw: true,
            }) as Promise<Array<{ studentId: number; firstNameEn?: string; lastNameEn?: string }>>
          : Promise.resolve([]),
      ]);

      const bookTitleById = new Map(books.map((book) => [Number(book.bookId), book.title]));
      const studentNameById = new Map(students.map((student) => [
        Number(student.studentId),
        `${student.firstNameEn || ''} ${student.lastNameEn || ''}`.trim() || `Student #${student.studentId}`,
      ]));

      const activities = [
        ...circulations.map((item) => ({
          id: `circulation-${item.circulationId}`,
          type: item.returnDate ? 'return' : item.status === 'renewed' ? 'renew' : 'issue',
          book: bookTitleById.get(Number(item.bookId)) || `Book #${item.bookId}`,
          student: studentNameById.get(Number(item.studentId)) || `Student #${item.studentId}`,
          date: item.returnDate || item.issueDate || item.createdAt,
          status: item.status,
        })),
        ...fines.map((item) => ({
          id: `fine-${item.fineId}`,
          type: 'fine',
          book: `Circulation #${item.circulationId}`,
          student: studentNameById.get(Number(item.studentId)) || `Student #${item.studentId}`,
          date: item.createdAt,
          amount: Number(item.fineAmount || 0),
          status: item.status,
        })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, limit);

      res.status(200).json({
        success: true,
        data: activities,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch recent activities',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export const libraryController = new LibraryController();

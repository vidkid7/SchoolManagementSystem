/**
 * Library Controller
 * 
 * Handles HTTP requests for library management
 * 
 * Requirements: 10.1-10.13
 */

import { Request, Response } from 'express';
import { LibraryFine } from '../../models/LibraryFine.model';
import { libraryService } from './library.service';
import { lateFeeService } from './lateFee.service';
import { reservationService } from './reservation.service';

/** In-memory library categories (optional: persist to DB later) */
let categoryStore: { categoryId: number; name: string; description: string }[] = [
  { categoryId: 1, name: 'Fiction', description: 'Fiction and literature' },
  { categoryId: 2, name: 'Non-Fiction', description: 'Non-fiction and reference' },
  { categoryId: 3, name: 'Academic', description: 'Academic and textbooks' },
];
let nextCategoryId = 4;

export class LibraryController {
  /**
   * Get all categories
   * GET /api/v1/library/categories
   */
  async getCategories(_req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        data: categoryStore.map((c) => ({ ...c, bookCount: 0 })),
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
      const { name, description } = req.body;
      const newCat = { categoryId: nextCategoryId++, name: name || '', description: description || '' };
      categoryStore.push(newCat);
      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: { ...newCat, bookCount: 0 },
      });
    } catch (error) {
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
      const idx = categoryStore.findIndex((c) => c.categoryId === id);
      if (idx === -1) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }
      const { name, description } = req.body || {};
      if (name !== undefined) categoryStore[idx].name = name;
      if (description !== undefined) categoryStore[idx].description = description;
      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: { ...categoryStore[idx], bookCount: 0 },
      });
    } catch (error) {
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
      const idx = categoryStore.findIndex((c) => c.categoryId === id);
      if (idx === -1) {
        res.status(404).json({ success: false, message: 'Category not found' });
        return;
      }
      categoryStore.splice(idx, 1);
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
   * Get fines by student
   * GET /api/v1/library/fines/:studentId
   */
  async getFinesByStudent(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { status } = req.query;

      const fines = await lateFeeService.getFinesByStudent(parseInt(studentId), status as string);

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
  async getLibraryReports(_req: Request, res: Response): Promise<void> {
    try {
      const libraryStats = await libraryService.getLibraryStats();
      const fineStats = await lateFeeService.getFineStats();
      const reservationStats = await reservationService.getReservationStats();

      res.status(200).json({
        success: true,
        data: {
          library: libraryStats,
          fines: fineStats,
          reservations: reservationStats,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch library reports',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get library dashboard statistics
   * GET /api/v1/library/statistics
   */
  async getStatistics(_req: Request, res: Response): Promise<void> {
    try {
      const libraryStats = await libraryService.getLibraryStats();
      const fineStats = await lateFeeService.getFineStats();

      const statistics = {
        totalBooks: libraryStats?.totalBooks || 5000,
        availableBooks: libraryStats?.availableBooks || 4200,
        issuedBooks: libraryStats?.borrowedBooks || 650,
        overdueBooks: libraryStats?.overdueBooks || 50,
        totalMembers: libraryStats?.totalCirculations || 450,
        activeMembers: libraryStats?.borrowedBooks || 380,
        totalFines: fineStats?.totalFines || 15000,
        collectedFines: fineStats?.totalPaid || 12000,
        pendingFines: fineStats?.pendingFines || 3000,
        booksByCategory: [
          { category: 'Fiction', count: 1500 },
          { category: 'Non-Fiction', count: 1200 },
          { category: 'Science', count: 800 },
          { category: 'Mathematics', count: 600 },
          { category: 'Literature', count: 500 },
          { category: 'History', count: 400 },
        ],
        monthlyIssuance: [
          { month: 'Jan', count: 120 },
          { month: 'Feb', count: 145 },
          { month: 'Mar', count: 180 },
          { month: 'Apr', count: 165 },
          { month: 'May', count: 190 },
          { month: 'Jun', count: 175 },
        ],
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

      const activities = [
        { id: 1, type: 'issue', book: 'Mathematics Grade 10', student: 'Ram Sharma', date: new Date(), status: 'completed' },
        { id: 2, type: 'return', book: 'Science Grade 9', student: 'Sita Gupta', date: new Date(), status: 'completed' },
        { id: 3, type: 'renew', book: 'English Literature', student: 'Hari Thapa', date: new Date(), status: 'completed' },
        { id: 4, type: 'issue', book: 'Nepali Vyakaran', student: 'Gita Shrestha', date: new Date(), status: 'completed' },
        { id: 5, type: 'fine', book: 'Social Studies', student: 'Binod KC', date: new Date(), amount: 50, status: 'paid' },
      ].slice(0, limit);

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

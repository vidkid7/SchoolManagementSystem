import { Request, Response } from 'express';
import archiveController from '../archive.controller';
import archiveService from '../archive.service';

// Mock the service
jest.mock('../archive.service');

describe('Archive Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      user: { userId: 1, role: 'school_admin' } as any,
      body: {},
      params: {},
      query: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    jest.clearAllMocks();
  });

  describe('archiveAcademicYear', () => {
    it('should archive academic year successfully', async () => {
      mockRequest.body = {
        academicYearId: 1,
        academicYearName: '2081-2082 BS',
      };

      const mockResult = {
        archiveId: 1,
        status: 'completed',
        recordCounts: { students: 100, attendance: 500 },
        message: 'Successfully archived 2081-2082 BS',
      };

      (archiveService.archiveAcademicYear as jest.Mock).mockResolvedValue(mockResult);

      await archiveController.archiveAcademicYear(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(archiveService.archiveAcademicYear).toHaveBeenCalledWith({
        academicYearId: 1,
        academicYearName: '2081-2082 BS',
        userId: 1,
      });

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'Academic year archived successfully',
      });
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await archiveController.archiveAcademicYear(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    });

    it('should return 500 on service error', async () => {
      mockRequest.body = {
        academicYearId: 1,
        academicYearName: '2081-2082 BS',
      };

      (archiveService.archiveAcademicYear as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await archiveController.archiveAcademicYear(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ARCHIVE_ERROR',
          message: 'Database error',
        },
      });
    });
  });

  describe('restoreArchivedData', () => {
    it('should restore archived data successfully', async () => {
      mockRequest.params = { archiveId: '1' };

      const mockResult = {
        archiveId: 1,
        status: 'restored',
        recordCounts: { students: 100 },
        message: 'Successfully restored 2081-2082 BS',
      };

      (archiveService.restoreArchivedData as jest.Mock).mockResolvedValue(mockResult);

      await archiveController.restoreArchivedData(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(archiveService.restoreArchivedData).toHaveBeenCalledWith({
        archiveId: 1,
        userId: 1,
      });

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'Archived data restored successfully',
      });
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;
      mockRequest.params = { archiveId: '1' };

      await archiveController.restoreArchivedData(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    });

    it('should return 500 on service error', async () => {
      mockRequest.params = { archiveId: '1' };

      (archiveService.restoreArchivedData as jest.Mock).mockRejectedValue(
        new Error('Archive not found')
      );

      await archiveController.restoreArchivedData(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'RESTORE_ERROR',
          message: 'Archive not found',
        },
      });
    });
  });

  describe('getArchives', () => {
    it('should return all archives', async () => {
      const mockArchives = [
        { id: 1, academic_year_name: '2081-2082 BS', status: 'completed' },
        { id: 2, academic_year_name: '2080-2081 BS', status: 'completed' },
      ];

      (archiveService.getArchives as jest.Mock).mockResolvedValue(mockArchives);

      await archiveController.getArchives(mockRequest as Request, mockResponse as Response);

      expect(archiveService.getArchives).toHaveBeenCalledWith({});
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockArchives,
      });
    });

    it('should filter archives by status', async () => {
      mockRequest.query = { status: 'completed' };

      const mockArchives = [
        { id: 1, academic_year_name: '2081-2082 BS', status: 'completed' },
      ];

      (archiveService.getArchives as jest.Mock).mockResolvedValue(mockArchives);

      await archiveController.getArchives(mockRequest as Request, mockResponse as Response);

      expect(archiveService.getArchives).toHaveBeenCalledWith({ status: 'completed' });
      expect(statusMock).toHaveBeenCalledWith(200);
    });

    it('should return 500 on service error', async () => {
      (archiveService.getArchives as jest.Mock).mockRejectedValue(new Error('Database error'));

      await archiveController.getArchives(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'GET_ARCHIVES_ERROR',
          message: 'Database error',
        },
      });
    });
  });

  describe('getArchiveById', () => {
    it('should return archive by ID', async () => {
      mockRequest.params = { archiveId: '1' };

      const mockArchive = {
        id: 1,
        academic_year_name: '2081-2082 BS',
        status: 'completed',
      };

      (archiveService.getArchiveById as jest.Mock).mockResolvedValue(mockArchive);

      await archiveController.getArchiveById(mockRequest as Request, mockResponse as Response);

      expect(archiveService.getArchiveById).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockArchive,
      });
    });

    it('should return 404 if archive not found', async () => {
      mockRequest.params = { archiveId: '999' };

      (archiveService.getArchiveById as jest.Mock).mockResolvedValue(null);

      await archiveController.getArchiveById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'ARCHIVE_NOT_FOUND',
          message: 'Archive not found',
        },
      });
    });

    it('should return 500 on service error', async () => {
      mockRequest.params = { archiveId: '1' };

      (archiveService.getArchiveById as jest.Mock).mockRejectedValue(new Error('Database error'));

      await archiveController.getArchiveById(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'GET_ARCHIVE_ERROR',
          message: 'Database error',
        },
      });
    });
  });

  describe('deleteExpiredArchives', () => {
    it('should delete expired archives successfully', async () => {
      (archiveService.deleteExpiredArchives as jest.Mock).mockResolvedValue(2);

      await archiveController.deleteExpiredArchives(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(archiveService.deleteExpiredArchives).toHaveBeenCalledWith(1);
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          deletedCount: 2,
        },
        message: 'Deleted 2 expired archive(s)',
      });
    });

    it('should return 401 if user not authenticated', async () => {
      mockRequest.user = undefined;

      await archiveController.deleteExpiredArchives(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
        },
      });
    });

    it('should return 500 on service error', async () => {
      (archiveService.deleteExpiredArchives as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await archiveController.deleteExpiredArchives(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'CLEANUP_ERROR',
          message: 'Database error',
        },
      });
    });
  });
});

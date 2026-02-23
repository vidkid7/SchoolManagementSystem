import { Request, Response } from 'express';
import archiveService from './archive.service';

class ArchiveController {
  /**
   * Archive an academic year
   * POST /api/v1/archive/academic-year
   */
  async archiveAcademicYear(req: Request, res: Response): Promise<void> {
    try {
      const { academicYearId, academicYearName } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const result = await archiveService.archiveAcademicYear({
        academicYearId,
        academicYearName,
        userId,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Academic year archived successfully',
      });
    } catch (error: any) {
      console.error('Archive academic year error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ARCHIVE_ERROR',
          message: error.message || 'Failed to archive academic year',
        },
      });
    }
  }

  /**
   * Restore archived data
   * POST /api/v1/archive/:archiveId/restore
   */
  async restoreArchivedData(req: Request, res: Response): Promise<void> {
    try {
      const archiveId = parseInt(req.params.archiveId, 10);
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const result = await archiveService.restoreArchivedData({
        archiveId,
        userId,
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Archived data restored successfully',
      });
    } catch (error: any) {
      console.error('Restore archived data error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'RESTORE_ERROR',
          message: error.message || 'Failed to restore archived data',
        },
      });
    }
  }

  /**
   * Get list of archives
   * GET /api/v1/archive
   */
  async getArchives(req: Request, res: Response): Promise<void> {
    try {
      const { status, academicYearId } = req.query;

      const filters: any = {};
      if (status) filters.status = status as string;
      if (academicYearId) filters.academicYearId = parseInt(academicYearId as string, 10);

      const archives = await archiveService.getArchives(filters);

      res.status(200).json({
        success: true,
        data: archives,
      });
    } catch (error: any) {
      console.error('Get archives error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_ARCHIVES_ERROR',
          message: error.message || 'Failed to get archives',
        },
      });
    }
  }

  /**
   * Get archive details
   * GET /api/v1/archive/:archiveId
   */
  async getArchiveById(req: Request, res: Response): Promise<void> {
    try {
      const archiveId = parseInt(req.params.archiveId, 10);

      const archive = await archiveService.getArchiveById(archiveId);

      if (!archive) {
        res.status(404).json({
          success: false,
          error: {
            code: 'ARCHIVE_NOT_FOUND',
            message: 'Archive not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: archive,
      });
    } catch (error: any) {
      console.error('Get archive by ID error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'GET_ARCHIVE_ERROR',
          message: error.message || 'Failed to get archive',
        },
      });
    }
  }

  /**
   * Delete expired archives
   * POST /api/v1/archive/cleanup
   */
  async deleteExpiredArchives(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          },
        });
        return;
      }

      const deletedCount = await archiveService.deleteExpiredArchives(userId);

      res.status(200).json({
        success: true,
        data: {
          deletedCount,
        },
        message: `Deleted ${deletedCount} expired archive(s)`,
      });
    } catch (error: any) {
      console.error('Delete expired archives error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CLEANUP_ERROR',
          message: error.message || 'Failed to delete expired archives',
        },
      });
    }
  }
}

export default new ArchiveController();

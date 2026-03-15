import { Request, Response } from 'express';
import { logger } from '@utils/logger';
import LessonPlan from '@models/LessonPlan.model';
import SyllabusProgress from '@models/SyllabusProgress.model';

class LessonPlanController {
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const [total, completed, inProgress, draft, reviewed, approved] = await Promise.all([
        LessonPlan.count(),
        LessonPlan.count({ where: { status: 'completed' } }),
        LessonPlan.count({ where: { status: 'scheduled' } }),
        LessonPlan.count({ where: { status: 'draft' } }),
        LessonPlan.count({ where: { status: 'reviewed' } }),
        LessonPlan.count({ where: { status: 'approved' } }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          summary: { total, completed, inProgress, draft, reviewed, approved },
          quickLinks: [
            { label: 'Create Lesson Plan', path: '/lesson-plans/create' },
            { label: 'Syllabus Progress', path: '/lesson-plans/syllabus-progress' },
            { label: 'My Plans', path: '/lesson-plans' },
            { label: 'Calendar', path: '/calendar' }
          ]
        },
        message: 'Lesson plan dashboard loaded successfully'
      });
    } catch (error: any) {
      logger.error('Lesson plan dashboard error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'LESSON_PLAN_DASHBOARD_ERROR', message: error.message || 'Failed to load dashboard' }
      });
    }
  }

  async getLessonPlans(req: Request, res: Response): Promise<void> {
    try {
      const { subject, className, status, teacherId, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (subject) where.subject = String(subject);
      if (className) where.className = String(className);
      if (status) where.status = String(status);
      if (teacherId) where.createdBy = Number(teacherId);

      const offset = (Number(page) - 1) * Number(limit);
      const { count: total, rows: paginatedPlans } = await LessonPlan.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']],
      });

      res.status(200).json({
        success: true,
        data: {
          lessonPlans: paginatedPlans,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
          }
        },
        message: 'Lesson plans retrieved successfully'
      });
    } catch (error: any) {
      logger.error('Get lesson plans error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'LESSON_PLAN_LIST_ERROR', message: error.message || 'Failed to load lesson plans' }
      });
    }
  }

  async getLessonPlanById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const plan = await LessonPlan.findByPk(id);
      if (!plan) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lesson plan not found' } });
        return;
      }
      res.status(200).json({ success: true, data: plan, message: 'Lesson plan retrieved successfully' });
    } catch (error: any) {
      logger.error('Get lesson plan by ID error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'LESSON_PLAN_GET_ERROR', message: error.message || 'Failed to get lesson plan' }
      });
    }
  }

  async createLessonPlan(req: Request, res: Response): Promise<void> {
    try {
      const { subject, className, section, topic, date, duration, objectives, materials, methodology, assessment, status } = req.body;
      if (!subject || !topic) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'subject and topic are required' } });
        return;
      }

      const plan = await LessonPlan.create({
        subject,
        className: className ?? '',
        section: section ?? '',
        topic,
        date: date ? new Date(date) : new Date(),
        duration: duration ?? 45,
        objectives: objectives ?? [],
        materials: materials ?? '',
        methodology: methodology ?? '',
        assessment: assessment ?? '',
        status: status ?? 'draft',
        createdBy: req.user?.userId,
      });

      res.status(201).json({ success: true, data: plan, message: 'Lesson plan created successfully' });
    } catch (error: any) {
      logger.error('Create lesson plan error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'LESSON_PLAN_CREATE_ERROR', message: error.message || 'Failed to create lesson plan' }
      });
    }
  }

  async updateLessonPlan(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const plan = await LessonPlan.findByPk(id);
      if (!plan) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lesson plan not found' } });
        return;
      }

      // Strip id from body to prevent overwriting PK
      const { id: _id, ...updateData } = req.body;
      await plan.update(updateData);
      res.status(200).json({ success: true, data: plan, message: 'Lesson plan updated successfully' });
    } catch (error: any) {
      logger.error('Update lesson plan error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'LESSON_PLAN_UPDATE_ERROR', message: error.message || 'Failed to update lesson plan' }
      });
    }
  }

  async deleteLessonPlan(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const plan = await LessonPlan.findByPk(id);
      if (!plan) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lesson plan not found' } });
        return;
      }

      await plan.destroy();
      res.status(200).json({ success: true, message: 'Lesson plan deleted successfully' });
    } catch (error: any) {
      logger.error('Delete lesson plan error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'LESSON_PLAN_DELETE_ERROR', message: error.message || 'Failed to delete lesson plan' }
      });
    }
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;
      const allowedStatuses = ['draft', 'scheduled', 'completed', 'reviewed', 'approved'];

      if (!status || !allowedStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `status must be one of: ${allowedStatuses.join(', ')}` }
        });
        return;
      }

      const plan = await LessonPlan.findByPk(id);
      if (!plan) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lesson plan not found' } });
        return;
      }

      await plan.update({ status });
      res.status(200).json({ success: true, data: plan, message: 'Lesson plan status updated successfully' });
    } catch (error: any) {
      logger.error('Update lesson plan status error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'LESSON_PLAN_STATUS_ERROR', message: error.message || 'Failed to update status' }
      });
    }
  }

  // ─────────────────── SYLLABUS PROGRESS ───────────────────

  async getSyllabusProgress(req: Request, res: Response): Promise<void> {
    try {
      const { subject, className, teacherId } = req.query;

      const where: any = {};
      if (subject) where.subject = String(subject);
      if (className) where.className = String(className);
      if (teacherId) where.teacherId = Number(teacherId);

      const entries = await SyllabusProgress.findAll({ where, order: [['updatedAt', 'DESC']] });

      res.status(200).json({
        success: true,
        data: { syllabusProgress: entries, total: entries.length },
        message: 'Syllabus progress retrieved successfully'
      });
    } catch (error: any) {
      logger.error('Get syllabus progress error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYLLABUS_PROGRESS_LIST_ERROR', message: error.message || 'Failed to load syllabus progress' }
      });
    }
  }

  async updateSyllabusProgress(req: Request, res: Response): Promise<void> {
    try {
      const { subject, className, unit, topic, status, progress } = req.body;
      if (!subject || !unit) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'subject and unit are required' } });
        return;
      }

      const teacherId = req.user?.userId!;
      const clampedProgress = progress != null ? Math.min(100, Math.max(0, Number(progress))) : undefined;

      const [entry] = await SyllabusProgress.findOrCreate({
        where: { teacherId, subject, unit },
        defaults: {
          teacherId,
          subject,
          className: className ?? '',
          unit,
          topic: topic ?? '',
          status: status ?? 'not-started',
          progress: clampedProgress ?? 0,
        },
      });

      if (entry && (status != null || clampedProgress != null || topic != null || className != null)) {
        await entry.update({
          ...(className != null && { className }),
          ...(topic != null && { topic }),
          ...(status != null && { status }),
          ...(clampedProgress != null && { progress: clampedProgress }),
        });
      }

      res.status(200).json({ success: true, data: entry, message: 'Syllabus progress updated successfully' });
    } catch (error: any) {
      logger.error('Update syllabus progress error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SYLLABUS_PROGRESS_UPDATE_ERROR', message: error.message || 'Failed to update syllabus progress' }
      });
    }
  }
}

export default new LessonPlanController();

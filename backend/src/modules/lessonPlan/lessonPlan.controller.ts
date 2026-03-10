import { Request, Response } from 'express';
import User, { UserRole } from '@models/User.model';
import { logger } from '@utils/logger';

// In-memory stores for lesson plan data (persists during server runtime)
// In production these would be DB tables
const lessonPlans: Map<number, any> = new Map();
const syllabusProgress: Map<string, any> = new Map(); // `${teacherId}_${subject}_${unit}` -> progress
let nextLessonPlanId = 1;
let nextProgressId = 1;

class LessonPlanController {
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const plans = Array.from(lessonPlans.values());
      const total = plans.length;
      const completed = plans.filter(p => p.status === 'completed').length;
      const inProgress = plans.filter(p => p.status === 'scheduled').length;
      const draft = plans.filter(p => p.status === 'draft').length;
      const reviewed = plans.filter(p => p.status === 'reviewed').length;
      const approved = plans.filter(p => p.status === 'approved').length;

      res.status(200).json({
        success: true,
        data: {
          summary: {
            total,
            completed,
            inProgress,
            draft,
            reviewed,
            approved
          },
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
      let plans = Array.from(lessonPlans.values());

      if (subject) plans = plans.filter(p => p.subject === String(subject));
      if (className) plans = plans.filter(p => p.className === String(className));
      if (status) plans = plans.filter(p => p.status === String(status));
      if (teacherId) plans = plans.filter(p => String(p.createdBy) === String(teacherId));

      const total = plans.length;
      const offset = (Number(page) - 1) * Number(limit);
      const paginatedPlans = plans.slice(offset, offset + Number(limit));

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
      const plan = lessonPlans.get(id);
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

      const plan = {
        id: nextLessonPlanId++,
        subject,
        className: className ?? '',
        section: section ?? '',
        topic,
        date: date ?? new Date().toISOString(),
        duration: duration ?? 45,
        objectives: objectives ?? [],
        materials: materials ?? '',
        methodology: methodology ?? '',
        assessment: assessment ?? '',
        status: status ?? 'draft',
        createdBy: req.user?.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      lessonPlans.set(plan.id, plan);
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
      const plan = lessonPlans.get(id);
      if (!plan) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lesson plan not found' } });
        return;
      }

      const updated = { ...plan, ...req.body, id, updatedAt: new Date().toISOString() };
      lessonPlans.set(id, updated);
      res.status(200).json({ success: true, data: updated, message: 'Lesson plan updated successfully' });
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
      if (!lessonPlans.has(id)) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lesson plan not found' } });
        return;
      }

      lessonPlans.delete(id);
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

      const plan = lessonPlans.get(id);
      if (!plan) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Lesson plan not found' } });
        return;
      }

      plan.status = status;
      plan.updatedAt = new Date().toISOString();
      lessonPlans.set(id, plan);
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
      let entries = Array.from(syllabusProgress.values());

      if (subject) entries = entries.filter(e => e.subject === String(subject));
      if (className) entries = entries.filter(e => e.className === String(className));
      if (teacherId) entries = entries.filter(e => String(e.teacherId) === String(teacherId));

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

      const teacherId = req.user?.userId;
      const key = `${teacherId}_${subject}_${unit}`;
      const existing = syllabusProgress.get(key);

      const entry = {
        id: existing?.id ?? nextProgressId++,
        teacherId,
        subject,
        className: className ?? '',
        unit,
        topic: topic ?? '',
        status: status ?? 'not-started',
        progress: progress != null ? Math.min(100, Math.max(0, Number(progress))) : (existing?.progress ?? 0),
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      syllabusProgress.set(key, entry);
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

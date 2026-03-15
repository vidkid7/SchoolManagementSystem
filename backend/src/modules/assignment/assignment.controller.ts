import { Request, Response } from 'express';
import { Op } from 'sequelize';
import { logger } from '@utils/logger';
import Assignment from '@models/Assignment.model';
import AssignmentSubmission from '@models/AssignmentSubmission.model';

class AssignmentController {
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const now = new Date();

      const [total, active, overdue, pendingGrading] = await Promise.all([
        Assignment.count(),
        Assignment.count({ where: { status: 'active' } }),
        Assignment.count({ where: { status: 'active', dueDate: { [Op.lt]: now } } }),
        AssignmentSubmission.count({ where: { status: 'submitted' } }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          summary: { total, active, overdue, pendingGrading }
        },
        message: 'Assignment dashboard loaded successfully'
      });
    } catch (error: any) {
      logger.error('Assignment dashboard error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'ASSIGNMENT_DASHBOARD_ERROR', message: error.message || 'Failed to load dashboard' }
      });
    }
  }

  async getAssignments(req: Request, res: Response): Promise<void> {
    try {
      const { subject, class: className, status, teacherId, page = 1, limit = 20 } = req.query;

      const where: any = {};
      if (subject) where.subject = subject;
      if (className) where.className = className;
      if (status) where.status = status;
      if (teacherId) where.createdBy = Number(teacherId);

      const offset = (Number(page) - 1) * Number(limit);
      const { count: total, rows: result } = await Assignment.findAndCountAll({
        where,
        limit: Number(limit),
        offset,
        order: [['createdAt', 'DESC']],
      });

      res.status(200).json({
        success: true,
        data: {
          assignments: result,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit))
          }
        },
        message: 'Assignments retrieved successfully'
      });
    } catch (error: any) {
      logger.error('Get assignments error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'ASSIGNMENT_LIST_ERROR', message: error.message || 'Failed to retrieve assignments' }
      });
    }
  }

  async getAssignmentById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const assignment = await Assignment.findByPk(id);
      if (!assignment) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } });
        return;
      }

      res.status(200).json({
        success: true,
        data: assignment,
        message: 'Assignment retrieved successfully'
      });
    } catch (error: any) {
      logger.error('Get assignment by ID error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'ASSIGNMENT_FETCH_ERROR', message: error.message || 'Failed to retrieve assignment' }
      });
    }
  }

  async createAssignment(req: Request, res: Response): Promise<void> {
    try {
      const { title, subject, className, section, description, dueDate, totalMarks, attachments } = req.body;
      if (!title || !subject || !className || !dueDate || !totalMarks) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'title, subject, className, dueDate, and totalMarks are required' } });
        return;
      }

      const assignment = await Assignment.create({
        title,
        subject,
        className,
        section: section ?? '',
        description: description ?? '',
        dueDate,
        totalMarks: Number(totalMarks),
        attachments: attachments ?? [],
        createdBy: req.user?.userId,
        status: 'active',
      });

      res.status(201).json({
        success: true,
        data: assignment,
        message: 'Assignment created successfully'
      });
    } catch (error: any) {
      logger.error('Create assignment error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'ASSIGNMENT_CREATE_ERROR', message: error.message || 'Failed to create assignment' }
      });
    }
  }

  async updateAssignment(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const assignment = await Assignment.findByPk(id);
      if (!assignment) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } });
        return;
      }

      const { title, subject, className, section, description, dueDate, totalMarks, status } = req.body;
      await assignment.update({
        ...(title != null && { title }),
        ...(subject != null && { subject }),
        ...(className != null && { className }),
        ...(section != null && { section }),
        ...(description != null && { description }),
        ...(dueDate != null && { dueDate }),
        ...(totalMarks != null && { totalMarks: Number(totalMarks) }),
        ...(status != null && { status }),
      });

      res.status(200).json({
        success: true,
        data: assignment,
        message: 'Assignment updated successfully'
      });
    } catch (error: any) {
      logger.error('Update assignment error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'ASSIGNMENT_UPDATE_ERROR', message: error.message || 'Failed to update assignment' }
      });
    }
  }

  async deleteAssignment(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const assignment = await Assignment.findByPk(id);
      if (!assignment) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } });
        return;
      }

      await assignment.destroy();
      res.status(200).json({
        success: true,
        data: null,
        message: 'Assignment deleted successfully'
      });
    } catch (error: any) {
      logger.error('Delete assignment error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'ASSIGNMENT_DELETE_ERROR', message: error.message || 'Failed to delete assignment' }
      });
    }
  }

  async getSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const assignmentId = Number(req.params.id);
      const assignment = await Assignment.findByPk(assignmentId);
      if (!assignment) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } });
        return;
      }

      const result = await AssignmentSubmission.findAll({ where: { assignmentId } });

      res.status(200).json({
        success: true,
        data: { submissions: result, total: result.length },
        message: 'Submissions retrieved successfully'
      });
    } catch (error: any) {
      logger.error('Get submissions error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SUBMISSION_LIST_ERROR', message: error.message || 'Failed to retrieve submissions' }
      });
    }
  }

  async submitAssignment(req: Request, res: Response): Promise<void> {
    try {
      const assignmentId = Number(req.params.id);
      const studentId = req.user?.userId;

      const assignment = await Assignment.findByPk(assignmentId);
      if (!assignment) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } });
        return;
      }

      const { content, attachments } = req.body;
      if (!content) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'content is required' } });
        return;
      }

      const submission = await AssignmentSubmission.create({
        assignmentId,
        studentId: studentId!,
        content,
        attachments: attachments ?? [],
        status: 'submitted',
        submittedDate: new Date(),
      });

      res.status(201).json({
        success: true,
        data: submission,
        message: 'Assignment submitted successfully'
      });
    } catch (error: any) {
      logger.error('Submit assignment error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SUBMISSION_CREATE_ERROR', message: error.message || 'Failed to submit assignment' }
      });
    }
  }

  async gradeSubmission(req: Request, res: Response): Promise<void> {
    try {
      const submissionId = Number(req.params.submissionId);
      const { marks, feedback } = req.body;

      if (marks == null) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'marks is required' } });
        return;
      }

      const submission = await AssignmentSubmission.findByPk(submissionId);
      if (!submission) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Submission not found' } });
        return;
      }

      await submission.update({
        marks: Number(marks),
        feedback: feedback ?? '',
        status: 'graded',
        gradedAt: new Date(),
      });

      res.status(200).json({
        success: true,
        data: submission,
        message: 'Submission graded successfully'
      });
    } catch (error: any) {
      logger.error('Grade submission error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'SUBMISSION_GRADE_ERROR', message: error.message || 'Failed to grade submission' }
      });
    }
  }

  async getMyAssignments(req: Request, res: Response): Promise<void> {
    try {
      const studentId = req.user?.userId;
      const allAssignments = await Assignment.findAll({ order: [['createdAt', 'DESC']] });

      const mySubmissions = await AssignmentSubmission.findAll({ where: { studentId } });
      const submissionMap = new Map(mySubmissions.map(s => [s.assignmentId, s]));

      const result = allAssignments.map(a => {
        const submission = submissionMap.get(a.id) ?? null;
        return {
          ...a.toJSON(),
          submissionStatus: submission ? submission.status : 'not_submitted',
          submission,
        };
      });

      res.status(200).json({
        success: true,
        data: { assignments: result, total: result.length },
        message: 'My assignments retrieved successfully'
      });
    } catch (error: any) {
      logger.error('Get my assignments error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'MY_ASSIGNMENTS_ERROR', message: error.message || 'Failed to retrieve assignments' }
      });
    }
  }

  // Helper for cross-module access (used by student controller)
  async getAllAssignmentsForStudent(className?: string): Promise<any[]> {
    const where: any = { status: 'active' };
    if (className) where.className = className;
    return Assignment.findAll({ where });
  }
}

export default new AssignmentController();

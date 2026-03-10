import { Request, Response } from 'express';
import { Op } from 'sequelize';
import User, { UserRole } from '@models/User.model';
import Student from '@models/Student.model';
import { logger } from '@utils/logger';

// In-memory stores for assignment data (persists during server runtime)
// In production these would be DB tables
const assignments: Map<number, any> = new Map();
const submissions: Map<string, any> = new Map(); // `${assignmentId}_${studentId}` -> submission
let nextAssignmentId = 1;
let nextSubmissionId = 1;

class AssignmentController {
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      const now = new Date();
      const allAssignments = Array.from(assignments.values());

      const total = allAssignments.length;
      const active = allAssignments.filter(a => a.status === 'active').length;
      const overdue = allAssignments.filter(a => a.status === 'active' && new Date(a.dueDate) < now).length;

      const allSubmissions = Array.from(submissions.values());
      const pendingGrading = allSubmissions.filter(s => s.status === 'submitted').length;

      res.status(200).json({
        success: true,
        data: {
          summary: {
            total,
            active,
            overdue,
            pendingGrading
          }
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
      let result = Array.from(assignments.values());

      if (subject) {
        result = result.filter(a => a.subject === subject);
      }
      if (className) {
        result = result.filter(a => a.className === className);
      }
      if (status) {
        result = result.filter(a => a.status === status);
      }
      if (teacherId) {
        result = result.filter(a => a.createdBy === Number(teacherId));
      }

      const total = result.length;
      const offset = (Number(page) - 1) * Number(limit);
      const paginated = result.slice(offset, offset + Number(limit));

      res.status(200).json({
        success: true,
        data: {
          assignments: paginated,
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
      const assignment = assignments.get(id);
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

      const now = new Date().toISOString();
      const assignment = {
        id: nextAssignmentId++,
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
        createdAt: now,
        updatedAt: now
      };

      assignments.set(assignment.id, assignment);
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
      const assignment = assignments.get(id);
      if (!assignment) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } });
        return;
      }

      const { title, subject, className, section, description, dueDate, totalMarks, status } = req.body;
      const updated = {
        ...assignment,
        title: title ?? assignment.title,
        subject: subject ?? assignment.subject,
        className: className ?? assignment.className,
        section: section ?? assignment.section,
        description: description ?? assignment.description,
        dueDate: dueDate ?? assignment.dueDate,
        totalMarks: totalMarks != null ? Number(totalMarks) : assignment.totalMarks,
        status: status ?? assignment.status,
        updatedAt: new Date().toISOString()
      };

      assignments.set(id, updated);
      res.status(200).json({
        success: true,
        data: updated,
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
      if (!assignments.has(id)) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } });
        return;
      }

      assignments.delete(id);
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
      if (!assignments.has(assignmentId)) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } });
        return;
      }

      const result = Array.from(submissions.values()).filter(s => s.assignmentId === assignmentId);

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

      if (!assignments.has(assignmentId)) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Assignment not found' } });
        return;
      }

      const { content, attachments } = req.body;
      if (!content) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'content is required' } });
        return;
      }

      const key = `${assignmentId}_${studentId}`;
      const submission = {
        id: nextSubmissionId++,
        assignmentId,
        studentId,
        content,
        attachments: attachments ?? [],
        status: 'submitted',
        submittedDate: new Date().toISOString(),
        marks: null,
        feedback: null
      };

      submissions.set(key, submission);
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

      const entry = Array.from(submissions.entries()).find(([, s]) => s.id === submissionId);
      if (!entry) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Submission not found' } });
        return;
      }

      const [key, submission] = entry;
      const updated = {
        ...submission,
        marks: Number(marks),
        feedback: feedback ?? '',
        status: 'graded',
        gradedAt: new Date().toISOString()
      };

      submissions.set(key, updated);
      res.status(200).json({
        success: true,
        data: updated,
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
      const allAssignments = Array.from(assignments.values());

      const result = allAssignments.map(a => {
        const key = `${a.id}_${studentId}`;
        const submission = submissions.get(key);
        return {
          ...a,
          submissionStatus: submission ? submission.status : 'not_submitted',
          submission: submission ?? null
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
  getAllAssignmentsForStudent(className?: string): any[] {
    const allAssignments = Array.from(assignments.values());
    if (className) {
      return allAssignments.filter(a => a.className === className && a.status === 'active');
    }
    return allAssignments.filter(a => a.status === 'active');
  }
}

export default new AssignmentController();

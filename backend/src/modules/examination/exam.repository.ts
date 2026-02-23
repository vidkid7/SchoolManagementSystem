import Exam, { ExamAttributes, ExamCreationAttributes, ExamStatus, ExamType } from '@models/Exam.model';
import { Op } from 'sequelize';

/**
 * Exam Repository
 * Handles database operations for exams
 * 
 * Requirements: 7.1, 7.2
 */
class ExamRepository {
  /**
   * Create a new exam
   */
  async create(examData: ExamCreationAttributes): Promise<Exam> {
    return await Exam.create(examData);
  }

  /**
   * Find exam by ID
   */
  async findById(examId: number): Promise<Exam | null> {
    const { Subject } = await import('@models/Subject.model');
    const Class = (await import('@models/Class.model')).default;
    
    return await Exam.findByPk(examId, {
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['subjectId', 'nameEn', 'nameNp', 'code']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['classId', 'gradeLevel', 'section']
        }
      ]
    });
  }

  /**
   * Find all exams with optional filters
   */
  async findAll(filters?: {
    classId?: number;
    subjectId?: number;
    academicYearId?: number;
    termId?: number;
    type?: ExamType;
    status?: ExamStatus;
  }): Promise<Exam[]> {
    const where: any = {};

    if (filters) {
      if (filters.classId) where.classId = filters.classId;
      if (filters.subjectId) where.subjectId = filters.subjectId;
      if (filters.academicYearId) where.academicYearId = filters.academicYearId;
      if (filters.termId) where.termId = filters.termId;
      if (filters.type) where.type = filters.type;
      if (filters.status) where.status = filters.status;
    }

    const { Subject } = await import('@models/Subject.model');
    const Class = (await import('@models/Class.model')).default;

    return await Exam.findAll({
      where,
      include: [
        {
          model: Subject,
          as: 'subject',
          attributes: ['subjectId', 'nameEn', 'nameNp', 'code']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['classId', 'gradeLevel', 'section']
        }
      ],
      order: [['examDate', 'ASC']]
    });
  }

  /**
   * Find exams by class ID
   */
  async findByClassId(classId: number): Promise<Exam[]> {
    return await Exam.findAll({
      where: { classId },
      order: [['examDate', 'ASC']]
    });
  }

  /**
   * Find exams by subject ID
   */
  async findBySubjectId(subjectId: number): Promise<Exam[]> {
    return await Exam.findAll({
      where: { subjectId },
      order: [['examDate', 'ASC']]
    });
  }

  /**
   * Find exams by academic year
   */
  async findByAcademicYear(academicYearId: number): Promise<Exam[]> {
    return await Exam.findAll({
      where: { academicYearId },
      order: [['examDate', 'ASC']]
    });
  }

  /**
   * Find exams by term
   */
  async findByTerm(termId: number): Promise<Exam[]> {
    return await Exam.findAll({
      where: { termId },
      order: [['examDate', 'ASC']]
    });
  }

  /**
   * Find exams by date range
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Exam[]> {
    return await Exam.findAll({
      where: {
        examDate: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['examDate', 'ASC']]
    });
  }

  /**
   * Update exam
   */
  async update(examId: number, updateData: Partial<ExamAttributes>): Promise<Exam | null> {
    const exam = await Exam.findByPk(examId);
    if (!exam) {
      return null;
    }

    await exam.update(updateData);
    return exam;
  }

  /**
   * Delete exam (soft delete)
   */
  async delete(examId: number): Promise<boolean> {
    const exam = await Exam.findByPk(examId);
    if (!exam) {
      return false;
    }

    await exam.destroy();
    return true;
  }

  /**
   * Update exam status
   */
  async updateStatus(examId: number, status: ExamStatus): Promise<Exam | null> {
    return await this.update(examId, { status });
  }

  /**
   * Find scheduled exams
   */
  async findScheduled(): Promise<Exam[]> {
    return await Exam.findAll({
      where: { status: ExamStatus.SCHEDULED },
      order: [['examDate', 'ASC']]
    });
  }

  /**
   * Find ongoing exams
   */
  async findOngoing(): Promise<Exam[]> {
    return await Exam.findAll({
      where: { status: ExamStatus.ONGOING },
      order: [['examDate', 'ASC']]
    });
  }

  /**
   * Find completed exams
   */
  async findCompleted(): Promise<Exam[]> {
    return await Exam.findAll({
      where: { status: ExamStatus.COMPLETED },
      order: [['examDate', 'DESC']]
    });
  }

  /**
   * Bulk create exams
   */
  async bulkCreate(exams: ExamCreationAttributes[]): Promise<Exam[]> {
    return await Exam.bulkCreate(exams);
  }
}

export default new ExamRepository();

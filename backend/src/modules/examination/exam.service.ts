import Exam, { ExamCreationAttributes, ExamStatus, ExamType } from '@models/Exam.model';
import examRepository from './exam.repository';
import gradeEntryService from './gradeEntry.service';
import rankCalculationService from './rankCalculation.service';
import reportCardService, { SchoolInfo, ReportCardOptions } from './reportCard.service';
import internalAssessmentService from './internalAssessment.service';

/**
 * Exam Service
 * Handles business logic for examination management
 * 
 * Requirements: 7.1-7.12
 */

/**
 * Exam creation input
 */
export interface ExamInput {
  name: string;
  type: ExamType;
  subjectId: number;
  classId: number;
  academicYearId: number;
  termId: number;
  examDate: Date;
  duration: number;
  fullMarks: number;
  passMarks: number;
  theoryMarks: number;
  practicalMarks: number;
  weightage: number;
  isInternal?: boolean;
}

/**
 * Exam filter options
 */
export interface ExamFilters {
  classId?: number;
  subjectId?: number;
  academicYearId?: number;
  termId?: number;
  type?: ExamType;
  status?: ExamStatus;
  isInternal?: boolean;
  page?: number;
  limit?: number;
}

/**
 * Paginated exam result
 */
export interface PaginatedExamResult {
  exams: Exam[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Exam analytics data
 */
export interface ExamAnalytics {
  examId: number;
  examName: string;
  totalStudents: number;
  averageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  passCount: number;
  failCount: number;
  passPercentage: number;
  gradeDistribution: Record<string, number>;
  rankStatistics: {
    topRank: number;
    bottomRank: number;
    medianMarks: number;
    tiedRanks: Array<{ rank: number; count: number }>;
  };
}

class ExamService {
  /**
   * Create a new exam
   * 
   * Requirements: 7.1
   */
  async createExam(input: ExamInput): Promise<Exam> {
    // Validate marks configuration
    if (input.theoryMarks + input.practicalMarks !== input.fullMarks) {
      throw new Error('Theory marks + Practical marks must equal Full marks');
    }

    if (input.passMarks > input.fullMarks) {
      throw new Error('Pass marks cannot exceed full marks');
    }

    if (input.passMarks < 0 || input.fullMarks < 0) {
      throw new Error('Marks cannot be negative');
    }

    if (input.weightage < 0 || input.weightage > 100) {
      throw new Error('Weightage must be between 0 and 100');
    }

    const examData: ExamCreationAttributes = {
      name: input.name,
      type: input.type,
      subjectId: input.subjectId,
      classId: input.classId,
      academicYearId: input.academicYearId,
      termId: input.termId,
      examDate: input.examDate,
      duration: input.duration,
      fullMarks: input.fullMarks,
      passMarks: input.passMarks,
      theoryMarks: input.theoryMarks,
      practicalMarks: input.practicalMarks,
      weightage: input.weightage,
      status: ExamStatus.SCHEDULED,
      isInternal: input.isInternal || false
    };

    return await examRepository.create(examData);
  }

  /**
   * Get exam by ID
   * 
   * Requirements: 7.1
   */
  async getExamById(examId: number): Promise<Exam | null> {
    return await examRepository.findById(examId);
  }

  /**
   * Get exams with filters and pagination
   * 
   * Requirements: 7.1
   */
  async getExams(filters: ExamFilters): Promise<PaginatedExamResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    // Build filter object for repository
    const repoFilters: any = {};
    if (filters.classId) repoFilters.classId = filters.classId;
    if (filters.subjectId) repoFilters.subjectId = filters.subjectId;
    if (filters.academicYearId) repoFilters.academicYearId = filters.academicYearId;
    if (filters.termId) repoFilters.termId = filters.termId;
    if (filters.type) repoFilters.type = filters.type;
    if (filters.status) repoFilters.status = filters.status;

    const exams = await examRepository.findAll(repoFilters);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedExams = exams.slice(startIndex, endIndex);

    return {
      exams: paginatedExams,
      total: exams.length,
      page,
      limit,
      totalPages: Math.ceil(exams.length / limit)
    };
  }

  /**
   * Update exam
   * 
   * Requirements: 7.1
   */
  async updateExam(examId: number, updates: Partial<ExamInput>): Promise<Exam | null> {
    const exam = await examRepository.findById(examId);
    if (!exam) {
      throw new Error(`Exam with ID ${examId} not found`);
    }

    // Validate marks if being updated
    const theoryMarks = updates.theoryMarks ?? exam.theoryMarks;
    const practicalMarks = updates.practicalMarks ?? exam.practicalMarks;
    const fullMarks = updates.fullMarks ?? exam.fullMarks;
    const passMarks = updates.passMarks ?? exam.passMarks;

    if (theoryMarks + practicalMarks !== fullMarks) {
      throw new Error('Theory marks + Practical marks must equal Full marks');
    }

    if (passMarks > fullMarks) {
      throw new Error('Pass marks cannot exceed full marks');
    }

    if (updates.weightage !== undefined && (updates.weightage < 0 || updates.weightage > 100)) {
      throw new Error('Weightage must be between 0 and 100');
    }

    return await examRepository.update(examId, updates);
  }

  /**
   * Delete exam (soft delete)
   * 
   * Requirements: 7.1
   */
  async deleteExam(examId: number): Promise<boolean> {
    return await examRepository.delete(examId);
  }

  /**
   * Update exam status
   * 
   * Requirements: 7.1
   */
  async updateExamStatus(examId: number, status: ExamStatus): Promise<Exam | null> {
    return await examRepository.updateStatus(examId, status);
  }

  /**
   * Get exam analytics
   * 
   * Requirements: 7.12
   */
  async getExamAnalytics(examId: number): Promise<ExamAnalytics> {
    const exam = await examRepository.findById(examId);
    if (!exam) {
      throw new Error(`Exam with ID ${examId} not found`);
    }

    // Get exam statistics from grade entry service
    const statistics = await gradeEntryService.getExamStatistics(examId);

    // Get rank statistics
    const rankStats = await rankCalculationService.getRankStatistics(examId, exam.classId);

    return {
      examId: exam.examId,
      examName: exam.name,
      totalStudents: statistics.totalStudents,
      averageMarks: statistics.averageMarks,
      highestMarks: statistics.highestMarks,
      lowestMarks: statistics.lowestMarks,
      passCount: statistics.passCount,
      failCount: statistics.failCount,
      passPercentage: statistics.passPercentage,
      gradeDistribution: statistics.gradeDistribution,
      rankStatistics: {
        topRank: rankStats.topRank,
        bottomRank: rankStats.bottomRank,
        medianMarks: rankStats.medianMarks,
        tiedRanks: rankStats.tiedRanks
      }
    };
  }

  /**
   * Generate report card for a student
   * 
   * Requirements: 7.7, N1.9
   */
  async generateReportCard(
    studentId: number,
    termId: number,
    academicYearId: number,
    schoolInfo: SchoolInfo,
    options?: ReportCardOptions
  ): Promise<Buffer> {
    return await reportCardService.generateStudentReportCard(
      studentId,
      termId,
      academicYearId,
      schoolInfo,
      options
    );
  }

  /**
   * Generate mark sheet for a student
   * Similar to report card but focused on marks only
   * 
   * Requirements: N1.9
   */
  async generateMarkSheet(
    studentId: number,
    termId: number,
    academicYearId: number,
    schoolInfo: SchoolInfo,
    options?: ReportCardOptions
  ): Promise<Buffer> {
    // Mark sheet is essentially a report card with standard format
    const markSheetOptions: ReportCardOptions = {
      ...options,
      format: 'standard',
      language: options?.language || 'bilingual'
    };

    return await reportCardService.generateStudentReportCard(
      studentId,
      termId,
      academicYearId,
      schoolInfo,
      markSheetOptions
    );
  }

  /**
   * Calculate aggregate GPA for Class 11-12 students
   * 
   * Requirements: N1.8
   */
  async calculateAggregateGPA(
    studentId: number,
    class11TermId: number,
    class12TermId: number,
    academicYearId: number
  ): Promise<{
    studentId: number;
    class11GPA: number;
    class12GPA: number;
    aggregateGPA: number;
  }> {
    // Get report card data for both years
    const class11Data = await reportCardService.gatherReportCardData(
      studentId,
      class11TermId,
      academicYearId
    );

    const class12Data = await reportCardService.gatherReportCardData(
      studentId,
      class12TermId,
      academicYearId
    );

    // Calculate aggregate GPA (average of both years)
    const aggregateGPA = (class11Data.termGPA + class12Data.termGPA) / 2;

    return {
      studentId,
      class11GPA: class11Data.termGPA,
      class12GPA: class12Data.termGPA,
      aggregateGPA: Math.round(aggregateGPA * 100) / 100
    };
  }

  /**
   * Get student grades for an exam
   * 
   * Requirements: 7.6
   */
  async getStudentGrades(examId: number, studentId: number) {
    return await gradeEntryService.getGradeByStudentAndExam(studentId, examId);
  }

  /**
   * Get all grades for an exam
   * 
   * Requirements: 7.6
   */
  async getExamGrades(examId: number) {
    return await gradeEntryService.getGradesByExam(examId);
  }

  /**
   * Calculate final marks with internal assessment
   * 
   * Requirements: 7.11
   */
  async calculateFinalMarksWithInternal(
    studentId: number,
    subjectId: number,
    classId: number,
    termId: number,
    internalWeightage: number
  ) {
    return await internalAssessmentService.calculateFinalMarks({
      studentId,
      subjectId,
      classId,
      termId,
      internalWeightage
    });
  }
}

export default new ExamService();

import { Request, Response } from 'express';
import academicService from './academic.service';
import { sendSuccess } from '@utils/responseFormatter';
import { asyncHandler, NotFoundError, ValidationError } from '@middleware/errorHandler';
import { HTTP_STATUS } from '@config/constants';

class AcademicController {
  getAcademicYears = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const years = await academicService.getAcademicYears();
    sendSuccess(res, years, 'Academic years retrieved successfully');
  });

  createAcademicYear = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { name, startDateBS, endDateBS, startDateAD, endDateAD, isCurrent } = req.body;

    const year = await academicService.createAcademicYear({
      name,
      startDateBS,
      endDateBS,
      startDateAD: new Date(startDateAD),
      endDateAD: new Date(endDateAD),
      isCurrent
    });

    sendSuccess(res, year, 'Academic year created successfully', HTTP_STATUS.CREATED);
  });

  updateAcademicYear = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { academicYearId, ...rest } = req.body;
    if (!academicYearId) {
      throw new ValidationError('academicYearId is required');
    }

    const year = await academicService.updateAcademicYear(Number(academicYearId), {
      ...rest,
      startDateAD: rest.startDateAD ? new Date(rest.startDateAD) : undefined,
      endDateAD: rest.endDateAD ? new Date(rest.endDateAD) : undefined
    });

    if (!year) {
      throw new NotFoundError('AcademicYear');
    }

    sendSuccess(res, year, 'Academic year updated successfully');
  });

  getTerms = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const academicYearId = req.query.academicYearId ? Number(req.query.academicYearId) : undefined;
    if (!academicYearId) {
      throw new ValidationError('academicYearId is required');
    }

    const terms = await academicService.getTermsByAcademicYear(academicYearId);
    sendSuccess(res, terms, 'Terms retrieved successfully');
  });

  createTerm = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { academicYearId, name, startDate, endDate, examStartDate, examEndDate } = req.body;
    if (!academicYearId) {
      throw new ValidationError('academicYearId is required');
    }

    const term = await academicService.createTerm({
      academicYearId,
      name,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      examStartDate: examStartDate ? new Date(examStartDate) : undefined,
      examEndDate: examEndDate ? new Date(examEndDate) : undefined
    });

    sendSuccess(res, term, 'Term created successfully', HTTP_STATUS.CREATED);
  });

  updateTerm = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { termId, ...rest } = req.body;
    if (!termId) {
      throw new ValidationError('termId is required');
    }

    const term = await academicService.updateTerm(Number(termId), {
      ...rest,
      startDate: rest.startDate ? new Date(rest.startDate) : undefined,
      endDate: rest.endDate ? new Date(rest.endDate) : undefined,
      examStartDate: rest.examStartDate ? new Date(rest.examStartDate) : undefined,
      examEndDate: rest.examEndDate ? new Date(rest.examEndDate) : undefined
    });

    if (!term) {
      throw new NotFoundError('Term');
    }

    sendSuccess(res, term, 'Term updated successfully');
  });

  getClasses = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const academicYearId = req.query.academicYearId ? Number(req.query.academicYearId) : undefined;
    const gradeLevel = req.query.gradeLevel ? Number(req.query.gradeLevel) : undefined;

    const classes = gradeLevel
      ? await academicService.getClassesByGrade(gradeLevel, academicYearId)
      : await academicService.getClasses(academicYearId);

    sendSuccess(res, classes, 'Classes retrieved successfully');
  });

  createClass = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { academicYearId, gradeLevel, section, shift, capacity, classTeacherId } = req.body;
    if (!academicYearId || !gradeLevel || !section) {
      throw new ValidationError('academicYearId, gradeLevel, and section are required');
    }

    const cls = await academicService.createClass({
      academicYearId,
      gradeLevel,
      section,
      shift,
      capacity,
      classTeacherId
    });

    sendSuccess(res, cls, 'Class created successfully', HTTP_STATUS.CREATED);
  });

  updateClass = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { classId, ...rest } = req.body;
    if (!classId) {
      throw new ValidationError('classId is required');
    }

    const cls = await academicService.updateClass(Number(classId), rest);
    if (!cls) {
      throw new NotFoundError('Class');
    }

    sendSuccess(res, cls, 'Class updated successfully');
  });

  getSubjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const type = req.query.type as string | undefined;
    const stream = req.query.stream as string | undefined;
    const subjects = await academicService.getSubjects(type, stream);
    sendSuccess(res, subjects, 'Subjects retrieved successfully');
  });

  createSubject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { code, nameEn, nameNp, type, stream, creditHours, theoryMarks, practicalMarks, passMarks } = req.body;
    if (!code || !nameEn || !nameNp || !type) {
      throw new ValidationError('code, nameEn, nameNp, and type are required');
    }

    const subject = await academicService.createSubject({
      code,
      nameEn,
      nameNp,
      type,
      stream,
      creditHours,
      theoryMarks,
      practicalMarks,
      passMarks
    });

    sendSuccess(res, subject, 'Subject created successfully', HTTP_STATUS.CREATED);
  });

  updateSubject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { subjectId, ...rest } = req.body;
    if (!subjectId) {
      throw new ValidationError('subjectId is required');
    }

    const subject = await academicService.updateSubject(Number(subjectId), rest);
    if (!subject) {
      throw new NotFoundError('Subject');
    }

    sendSuccess(res, subject, 'Subject updated successfully');
  });

  getTimetable = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const classId = req.query.classId ? Number(req.query.classId) : undefined;
    const academicYearId = req.query.academicYearId ? Number(req.query.academicYearId) : undefined;
    if (!classId) {
      throw new ValidationError('classId is required');
    }

    const timetable = await academicService.getClassTimetable(classId, academicYearId);
    sendSuccess(res, timetable, 'Timetable retrieved successfully');
  });

  getTimetableByClass = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const classId = Number(req.params.classId);
    const academicYearId = req.query.academicYearId ? Number(req.query.academicYearId) : undefined;
    const timetable = await academicService.getClassTimetable(classId, academicYearId);
    sendSuccess(res, timetable, 'Timetable retrieved successfully');
  });

  createTimetable = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { timetableId, periodNumber, startTime, endTime, subjectId, teacherId, roomNumber } = req.body;

    if (timetableId && periodNumber !== undefined) {
      const period = await academicService.addPeriod(Number(timetableId), {
        periodNumber,
        startTime,
        endTime,
        subjectId,
        teacherId,
        roomNumber
      });
      sendSuccess(res, period, 'Period added successfully', HTTP_STATUS.CREATED);
      return;
    }

    const { classId, academicYearId, dayOfWeek } = req.body;
    if (!classId || academicYearId === undefined || dayOfWeek === undefined) {
      throw new ValidationError('classId, academicYearId, and dayOfWeek are required');
    }

    const timetable = await academicService.createTimetable({
      classId,
      academicYearId,
      dayOfWeek
    });

    sendSuccess(res, timetable, 'Timetable created successfully', HTTP_STATUS.CREATED);
  });

  updateTimetable = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { periodId, timetableId, ...rest } = req.body;

    if (periodId) {
      const period = await academicService.updatePeriod(Number(periodId), rest);
      if (!period) {
        throw new NotFoundError('Period');
      }
      sendSuccess(res, period, 'Period updated successfully');
      return;
    }

    if (!timetableId) {
      throw new ValidationError('timetableId or periodId is required');
    }

    const timetable = await academicService.updateTimetable(Number(timetableId), rest);
    if (!timetable) {
      throw new NotFoundError('Timetable');
    }

    sendSuccess(res, timetable, 'Timetable updated successfully');
  });

  getSyllabus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const subjectId = req.query.subjectId ? Number(req.query.subjectId) : undefined;
    const classId = req.query.classId ? Number(req.query.classId) : undefined;
    const academicYearId = req.query.academicYearId ? Number(req.query.academicYearId) : undefined;

    if (!subjectId || !classId) {
      throw new ValidationError('subjectId and classId are required');
    }

    const syllabus = await academicService.getSyllabus(subjectId, classId, academicYearId);
    if (!syllabus) {
      throw new NotFoundError('Syllabus');
    }

    sendSuccess(res, syllabus, 'Syllabus retrieved successfully');
  });

  getSyllabusBySubject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const subjectId = Number(req.params.subjectId);
    const classId = req.query.classId ? Number(req.query.classId) : undefined;
    const academicYearId = req.query.academicYearId ? Number(req.query.academicYearId) : undefined;

    if (!classId) {
      throw new ValidationError('classId is required');
    }

    const syllabus = await academicService.getSyllabus(subjectId, classId, academicYearId);
    if (!syllabus) {
      throw new NotFoundError('Syllabus');
    }

    sendSuccess(res, syllabus, 'Syllabus retrieved successfully');
  });

  createSyllabus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { syllabusId, title, description, estimatedHours } = req.body;

    if (syllabusId && title) {
      const topic = await academicService.addSyllabusTopic(Number(syllabusId), {
        title,
        description,
        estimatedHours
      });
      sendSuccess(res, topic, 'Syllabus topic added successfully', HTTP_STATUS.CREATED);
      return;
    }

    const { subjectId, classId, academicYearId } = req.body;
    if (!subjectId || !classId || !academicYearId) {
      throw new ValidationError('subjectId, classId, and academicYearId are required');
    }

    const syllabus = await academicService.createSyllabus({
      subjectId,
      classId,
      academicYearId
    });

    sendSuccess(res, syllabus, 'Syllabus created successfully', HTTP_STATUS.CREATED);
  });

  updateSyllabus = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { topicId, completedHours } = req.body;
    if (!topicId || completedHours === undefined) {
      throw new ValidationError('topicId and completedHours are required');
    }

    await academicService.updateTopicProgress(Number(topicId), Number(completedHours));
    sendSuccess(res, { topicId, completedHours }, 'Syllabus progress updated successfully');
  });

  // Class-Subject Assignment
  getClassSubjects = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const classId = Number(req.params.classId);
    const subjects = await academicService.getClassSubjects(classId);
    sendSuccess(res, subjects, 'Class subjects retrieved successfully');
  });

  assignSubjectToClass = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const classId = Number(req.params.classId);
    const { subjectId, teacherId } = req.body;
    
    if (!subjectId) {
      throw new ValidationError('subjectId is required');
    }

    const assignment = await academicService.assignSubjectToClass({
      classId,
      subjectId,
      teacherId
    });

    sendSuccess(res, assignment, 'Subject assigned to class successfully', HTTP_STATUS.CREATED);
  });

  removeSubjectFromClass = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const classId = Number(req.params.classId);
    const subjectId = Number(req.params.subjectId);

    await academicService.removeSubjectFromClass(classId, subjectId);
    sendSuccess(res, null, 'Subject removed from class successfully');
  });

  deleteClass = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const classId = Number(req.params.classId);
    await academicService.deleteClass(classId);
    sendSuccess(res, null, 'Class deleted successfully');
  });

  deleteSubject = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const subjectId = Number(req.params.subjectId);
    await academicService.deleteSubject(subjectId);
    sendSuccess(res, null, 'Subject deleted successfully');
  });
}

export default new AcademicController();

import { AcademicYear, Term } from '@models/AcademicYear.model';
import Class, { Shift } from '@models/Class.model';
import { Subject, ClassSubject } from '@models/Subject.model';
import { Timetable, Period, Syllabus, SyllabusTopic } from '@models/Timetable.model';
import Student from '@models/Student.model';
import Staff from '@models/Staff.model';
import { WhereOptions } from 'sequelize';
import { literal } from 'sequelize';
import academicRepository from './academic.repository';
import timetableService from './timetable.service';

/**
 * Academic Service
 * Handles academic years, terms, classes, subjects, timetables, and syllabus
 * Requirements: 5.1-5.11
 */
class AcademicService {
  // ============ Academic Year Methods ============

  createAcademicYear(data: {
    name: string;
    startDateBS: string;
    endDateBS: string;
    startDateAD: Date;
    endDateAD: Date;
    isCurrent?: boolean;
  }): Promise<AcademicYear> {
    return academicRepository.createAcademicYear(data);
  }

  getAcademicYears(): Promise<AcademicYear[]> {
    return academicRepository.findAllAcademicYears({ orderBy: 'startDateAD', orderDirection: 'DESC' });
  }

  getCurrentAcademicYear(): Promise<AcademicYear | null> {
    return academicRepository.findCurrentAcademicYear();
  }

  async setCurrentAcademicYear(id: number): Promise<void> {
    await academicRepository.setCurrentAcademicYear(id);
  }

  updateAcademicYear(
    academicYearId: number,
    data: Partial<{
      name: string;
      startDateBS: string;
      endDateBS: string;
      startDateAD: Date;
      endDateAD: Date;
      isCurrent: boolean;
    }>
  ): Promise<AcademicYear | null> {
    return academicRepository.updateAcademicYear(academicYearId, data);
  }

  // ============ Term Methods ============

  createTerm(data: {
    academicYearId: number;
    name: string;
    startDate: Date;
    endDate: Date;
    examStartDate?: Date;
    examEndDate?: Date;
  }): Promise<Term> {
    return academicRepository.createTerm(data);
  }

  getTermsByAcademicYear(academicYearId: number): Promise<Term[]> {
    return academicRepository.findTermsByAcademicYear(academicYearId, { orderBy: 'startDate', orderDirection: 'ASC' });
  }

  updateTerm(
    termId: number,
    data: Partial<{
      name: string;
      startDate: Date;
      endDate: Date;
      examStartDate?: Date;
      examEndDate?: Date;
    }>
  ): Promise<Term | null> {
    return academicRepository.updateTerm(termId, data);
  }

  // ============ Class Methods ============

  createClass(data: {
    academicYearId: number;
    gradeLevel: number;
    section: string;
    shift?: Shift;
    capacity?: number;
    classTeacherId?: number;
  }): Promise<Class> {
    return Class.create({
      ...data,
      currentStrength: 0,
      shift: data.shift || Shift.MORNING,
      capacity: data.capacity || 40
    });
  }

  getClasses(academicYearId?: number): Promise<Class[]> {
    const where: WhereOptions<Class> = {};
    if (academicYearId) {
      where.academicYearId = academicYearId;
    }
    return Class.findAll({
      where,
      attributes: {
        include: [
          // Count students in this class
          [
            literal(`(
              SELECT COUNT(*)
              FROM students
              WHERE students.current_class_id = \`Class\`.class_id
              AND students.deleted_at IS NULL
            )`),
            'currentStrength'
          ],
          // Get class teacher name
          [
            literal(`(
              SELECT CONCAT(first_name_en, ' ', last_name_en)
              FROM staff
              WHERE staff.staff_id = \`Class\`.class_teacher_id
              AND staff.deleted_at IS NULL
            )`),
            'classTeacherName'
          ]
        ]
      },
      order: [['gradeLevel', 'ASC'], ['section', 'ASC']]
    });
  }

  getClassById(classId: number): Promise<Class | null> {
    return Class.findByPk(classId);
  }

  getClassesByGrade(gradeLevel: number, academicYearId?: number): Promise<Class[]> {
    const where: WhereOptions<Class> = { gradeLevel };
    if (academicYearId) {
      where.academicYearId = academicYearId;
    }
    return Class.findAll({ 
      where, 
      attributes: {
        include: [
          // Count students in this class
          [
            literal(`(
              SELECT COUNT(*)
              FROM students
              WHERE students.current_class_id = \`Class\`.class_id
              AND students.deleted_at IS NULL
            )`),
            'currentStrength'
          ],
          // Get class teacher name
          [
            literal(`(
              SELECT CONCAT(first_name_en, ' ', last_name_en)
              FROM staff
              WHERE staff.staff_id = \`Class\`.class_teacher_id
              AND staff.deleted_at IS NULL
            )`),
            'classTeacherName'
          ]
        ]
      },
      order: [['section', 'ASC']] 
    });
  }

  async updateClassTeacher(classId: number, teacherId?: number): Promise<void> {
    await Class.update({ classTeacherId: teacherId }, { where: { classId } });
  }

  async updateClass(
    classId: number,
    data: Partial<{
      academicYearId: number;
      gradeLevel: number;
      section: string;
      shift: Shift;
      capacity: number;
      classTeacherId?: number;
      currentStrength: number;
    }>
  ): Promise<Class | null> {
    const cls = await Class.findByPk(classId);
    if (!cls) {
      return null;
    }
    await cls.update(data);
    return cls;
  }

  async incrementClassStrength(classId: number): Promise<void> {
    const cls = await Class.findByPk(classId);
    if (cls) {
      await cls.update({ currentStrength: cls.currentStrength + 1 });
    }
  }

  async decrementClassStrength(classId: number): Promise<void> {
    const cls = await Class.findByPk(classId);
    if (cls && cls.currentStrength > 0) {
      await cls.update({ currentStrength: cls.currentStrength - 1 });
    }
  }

  // ============ Subject Methods ============

  createSubject(data: {
    code: string;
    nameEn: string;
    nameNp: string;
    type: 'compulsory' | 'optional';
    stream?: string;
    creditHours?: number;
    theoryMarks?: number;
    practicalMarks?: number;
    passMarks?: number;
  }): Promise<Subject> {
    const fullMarks = (data.theoryMarks || 75) + (data.practicalMarks || 25);
    return Subject.create({
      ...data,
      creditHours: data.creditHours || 100,
      theoryMarks: data.theoryMarks || 75,
      practicalMarks: data.practicalMarks || 25,
      passMarks: data.passMarks || 35,
      fullMarks
    });
  }

  getSubjects(type?: string, stream?: string): Promise<Subject[]> {
    const where: WhereOptions<Subject> = {};
    if (type) where.type = type;
    if (stream) where.stream = stream;
    return Subject.findAll({ where, order: [['nameEn', 'ASC']] });
  }

  getSubjectById(subjectId: number): Promise<Subject | null> {
    return Subject.findByPk(subjectId);
  }

  async updateSubject(
    subjectId: number,
    data: Partial<{
      code: string;
      nameEn: string;
      nameNp: string;
      type: 'compulsory' | 'optional';
      stream?: string;
      creditHours?: number;
      theoryMarks?: number;
      practicalMarks?: number;
      passMarks?: number;
      fullMarks?: number;
    }>
  ): Promise<Subject | null> {
    const subject = await Subject.findByPk(subjectId);
    if (!subject) {
      return null;
    }

    const updates: Record<string, unknown> = { ...data };
    if (data.theoryMarks !== undefined || data.practicalMarks !== undefined) {
      const theoryMarks = data.theoryMarks ?? subject.theoryMarks;
      const practicalMarks = data.practicalMarks ?? subject.practicalMarks;
      updates.fullMarks = theoryMarks + practicalMarks;
    }

    await subject.update(updates);
    return subject;
  }

  // ============ Class-Subject Methods ============

  assignSubjectToClass(data: {
    classId: number;
    subjectId: number;
    teacherId?: number;
  }): Promise<ClassSubject> {
    return ClassSubject.create(data);
  }

  getClassSubjects(classId: number): Promise<ClassSubject[]> {
      return ClassSubject.findAll({
        where: { classId },
        include: [
          { model: Subject, as: 'subject' },
          { model: Staff, as: 'teacher', required: false }
        ]
      });
    }

  async updateClassSubjectTeacher(classSubjectId: number, teacherId?: number): Promise<void> {
    await ClassSubject.update({ teacherId }, { where: { classSubjectId } });
  }

  async removeSubjectFromClass(classId: number, subjectId: number): Promise<void> {
    await ClassSubject.destroy({ where: { classId, subjectId } });
  }

  async deleteClass(classId: number): Promise<void> {
    await Class.destroy({ where: { classId } });
  }

  async deleteSubject(subjectId: number): Promise<void> {
    await Subject.destroy({ where: { subjectId } });
  }

  // ============ Timetable Methods ============

  createTimetable(data: {
    classId: number;
    academicYearId: number;
    dayOfWeek: number;
  }): Promise<Timetable> {
    return timetableService.createTimetable(data);
  }

  addPeriod(timetableId: number, data: {
    periodNumber: number;
    startTime: string;
    endTime: string;
    subjectId?: number;
    teacherId?: number;
    roomNumber?: string;
  }): Promise<Period> {
    return timetableService.addPeriod(timetableId, data);
  }

  getClassTimetable(classId: number, academicYearId?: number): Promise<Timetable[]> {
    return timetableService.getClassTimetable(classId, academicYearId);
  }

  getTeacherTimetable(teacherId: number, academicYearId?: number): Promise<Period[]> {
    return timetableService.getTeacherTimetable(teacherId, academicYearId);
  }

  async deletePeriod(periodId: number): Promise<void> {
    await timetableService.deletePeriod(periodId);
  }

  updateTimetable(
    timetableId: number,
    data: Partial<{
      classId: number;
      academicYearId: number;
      dayOfWeek: number;
    }>
  ): Promise<Timetable | null> {
    return timetableService.updateTimetable(timetableId, data);
  }

  updatePeriod(
    periodId: number,
    data: Partial<{
      periodNumber: number;
      startTime: string;
      endTime: string;
      subjectId?: number;
      teacherId?: number;
      roomNumber?: string;
    }>
  ): Promise<Period | null> {
    return timetableService.updatePeriod(periodId, data);
  }

  checkTeacherConflict(
    teacherId: number,
    dayOfWeek: number,
    academicYearId: number,
    startTime: string,
    endTime: string,
    excludePeriodId?: number
  ): Promise<boolean> {
    return timetableService.checkTeacherConflict(
      teacherId,
      dayOfWeek,
      academicYearId,
      startTime,
      endTime,
      excludePeriodId
    );
  }

  bulkCreatePeriods(
    timetableId: number,
    periods: Array<{
      periodNumber: number;
      startTime: string;
      endTime: string;
      subjectId?: number;
      teacherId?: number;
      roomNumber?: string;
    }>
  ): Promise<Period[]> {
    return timetableService.bulkCreatePeriods(timetableId, periods);
  }

  // ============ Syllabus Methods ============

  createSyllabus(data: {
    subjectId: number;
    classId: number;
    academicYearId: number;
  }): Promise<Syllabus> {
    return Syllabus.create({ ...data, completedPercentage: 0 });
  }

  addSyllabusTopic(syllabusId: number, data: {
    title: string;
    description?: string;
    estimatedHours: number;
  }): Promise<SyllabusTopic> {
    return SyllabusTopic.create({
      ...data,
      syllabusId,
      completedHours: 0,
      status: 'not_started'
    });
  }

  getSyllabus(subjectId: number, classId: number, academicYearId?: number): Promise<Syllabus | null> {
    const where: WhereOptions<Syllabus> = { subjectId, classId };
    if (academicYearId) where.academicYearId = academicYearId;
    return Syllabus.findOne({ 
      where,
      include: [{ model: SyllabusTopic, as: 'topics', order: [['topicId', 'ASC']] }]
    });
  }

  getSyllabusWithTopics(syllabusId: number): Promise<Syllabus | null> {
    return Syllabus.findByPk(syllabusId, {
      include: [{ model: SyllabusTopic, as: 'topics', order: [['topicId', 'ASC']] }]
    });
  }

  async updateTopicProgress(topicId: number, completedHours: number): Promise<void> {
    const topic = await SyllabusTopic.findByPk(topicId);
    if (topic) {
      const status = completedHours >= Number(topic.estimatedHours) 
        ? 'completed' 
        : completedHours > 0 
          ? 'in_progress' 
          : 'not_started';
      
      await topic.update({ completedHours, status });

      // Update overall syllabus percentage
      const syllabus = await Syllabus.findByPk(topic.syllabusId);
      if (syllabus) {
        const topics = await SyllabusTopic.findAll({ where: { syllabusId: syllabus.syllabusId } });
        const totalHours = topics.reduce((sum, t) => sum + Number(t.estimatedHours), 0);
        const completedTotal = topics.reduce((sum, t) => sum + Number(t.completedHours), 0);
        const percentage = totalHours > 0 ? (completedTotal / totalHours) * 100 : 0;
        await syllabus.update({ completedPercentage: percentage });
      }
    }
  }

  async getSyllabusProgress(subjectId: number, classId: number, academicYearId?: number): Promise<number | null> {
    const syllabus = await this.getSyllabus(subjectId, classId, academicYearId);
    return syllabus ? Number(syllabus.completedPercentage) : null;
  }
}

export default new AcademicService();
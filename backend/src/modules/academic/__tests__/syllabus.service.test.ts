import syllabusService from '../syllabus.service';
import { Syllabus, SyllabusTopic } from '@models/Timetable.model';
import { AcademicYear } from '@models/AcademicYear.model';
import Class from '@models/Class.model';
import { Subject } from '@models/Subject.model';
import sequelize from '@config/database';

/**
 * Syllabus Service Unit Tests
 * Requirements: 5.8, 5.9
 */
describe('SyllabusService', () => {
  let academicYear: AcademicYear;
  let testClass: Class;
  let subject: Subject;

  beforeAll(async () => {
    // Ensure database connection is established
    await sequelize.authenticate();

    // Create test academic year
    academicYear = await AcademicYear.create({
      name: '2081-2082 BS',
      startDateBS: '2081-01-01',
      endDateBS: '2081-12-30',
      startDateAD: new Date('2024-04-13'),
      endDateAD: new Date('2025-04-12'),
      isCurrent: true
    });

    // Create test class
    testClass = await Class.create({
      gradeLevel: 10,
      section: 'A',
      shift: 'morning',
      capacity: 40,
      currentStrength: 0,
      academicYearId: academicYear.academicYearId
    });

    // Create test subject
    subject = await Subject.create({
      code: 'MATH101',
      nameEn: 'Mathematics',
      nameNp: 'गणित',
      type: 'compulsory',
      creditHours: 5,
      theoryMarks: 75,
      practicalMarks: 25,
      passMarks: 35,
      fullMarks: 100
    });
  });

  afterAll(async () => {
    // Clean up test data
    await SyllabusTopic.destroy({ where: {}, force: true });
    await Syllabus.destroy({ where: {}, force: true });
    await Subject.destroy({ where: {}, force: true });
    await Class.destroy({ where: {}, force: true });
    await AcademicYear.destroy({ where: {}, force: true });
    await sequelize.close();
  });

  describe('createSyllabus', () => {
    it('should create a syllabus without topics', async () => {
      const syllabusData = {
        subjectId: subject.subjectId,
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId
      };

      const syllabus = await syllabusService.createSyllabus(syllabusData);

      expect(syllabus).toBeDefined();
      expect(syllabus.subjectId).toBe(subject.subjectId);
      expect(syllabus.classId).toBe(testClass.classId);
      expect(syllabus.academicYearId).toBe(academicYear.academicYearId);
      expect(syllabus.completedPercentage).toBe(0);
    });

    it('should create a syllabus with topics', async () => {
      const subject2 = await Subject.create({
        code: 'SCI101',
        nameEn: 'Science',
        nameNp: 'विज्ञान',
        type: 'compulsory',
        creditHours: 5,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100
      });

      const syllabusData = {
        subjectId: subject2.subjectId,
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId,
        topics: [
          {
            title: 'Introduction to Physics',
            description: 'Basic concepts of physics',
            estimatedHours: 10
          },
          {
            title: 'Motion and Force',
            description: 'Laws of motion',
            estimatedHours: 15
          }
        ]
      };

      const syllabus = await syllabusService.createSyllabus(syllabusData);

      expect(syllabus).toBeDefined();
      expect((syllabus as any).topics).toHaveLength(2);
      expect((syllabus as any).topics[0].title).toBe('Introduction to Physics');
      expect((syllabus as any).topics[1].title).toBe('Motion and Force');
    });

    it('should throw error if syllabus already exists', async () => {
      const syllabusData = {
        subjectId: subject.subjectId,
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId
      };

      await expect(syllabusService.createSyllabus(syllabusData)).rejects.toThrow(
        'Syllabus already exists'
      );
    });
  });

  describe('getSyllabusById', () => {
    it('should get syllabus by ID with topics', async () => {
      const syllabusData = {
        subjectId: subject.subjectId,
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId
      };

      const created = await Syllabus.findOne({ where: syllabusData });
      const syllabus = await syllabusService.getSyllabusById(created!.syllabusId);

      expect(syllabus).toBeDefined();
      expect(syllabus!.syllabusId).toBe(created!.syllabusId);
    });

    it('should return null for non-existent syllabus', async () => {
      const syllabus = await syllabusService.getSyllabusById(99999);
      expect(syllabus).toBeNull();
    });
  });

  describe('getSyllabusBySubjectClassYear', () => {
    it('should get syllabus by subject, class, and year', async () => {
      const syllabus = await syllabusService.getSyllabusBySubjectClassYear(
        subject.subjectId,
        testClass.classId,
        academicYear.academicYearId
      );

      expect(syllabus).toBeDefined();
      expect(syllabus!.subjectId).toBe(subject.subjectId);
      expect(syllabus!.classId).toBe(testClass.classId);
    });

    it('should return null if not found', async () => {
      const syllabus = await syllabusService.getSyllabusBySubjectClassYear(99999, 99999, 99999);
      expect(syllabus).toBeNull();
    });
  });

  describe('getSyllabiByClass', () => {
    it('should get all syllabi for a class', async () => {
      const syllabi = await syllabusService.getSyllabiByClass(testClass.classId);

      expect(syllabi).toBeDefined();
      expect(syllabi.length).toBeGreaterThan(0);
      expect(syllabi.every((s) => s.classId === testClass.classId)).toBe(true);
    });

    it('should filter by academic year', async () => {
      const syllabi = await syllabusService.getSyllabiByClass(
        testClass.classId,
        academicYear.academicYearId
      );

      expect(syllabi).toBeDefined();
      expect(syllabi.every((s) => s.academicYearId === academicYear.academicYearId)).toBe(true);
    });
  });

  describe('updateSyllabus', () => {
    it('should update syllabus', async () => {
      const syllabus = await Syllabus.findOne({
        where: {
          subjectId: subject.subjectId,
          classId: testClass.classId
        }
      });

      const updated = await syllabusService.updateSyllabus(syllabus!.syllabusId, {
        subjectId: subject.subjectId
      });

      expect(updated).toBeDefined();
      expect(updated!.syllabusId).toBe(syllabus!.syllabusId);
    });

    it('should return null for non-existent syllabus', async () => {
      const updated = await syllabusService.updateSyllabus(99999, {
        subjectId: subject.subjectId
      });
      expect(updated).toBeNull();
    });
  });

  describe('Topic Management', () => {
    let syllabus: Syllabus;

    beforeEach(async () => {
      syllabus = (await Syllabus.findOne({
        where: {
          subjectId: subject.subjectId,
          classId: testClass.classId
        }
      }))!;
    });

    describe('createTopic', () => {
      it('should create a topic', async () => {
        const topicData = {
          syllabusId: syllabus.syllabusId,
          title: 'Algebra Basics',
          description: 'Introduction to algebra',
          estimatedHours: 12
        };

        const topic = await syllabusService.createTopic(topicData);

        expect(topic).toBeDefined();
        expect(topic.title).toBe('Algebra Basics');
        expect(topic.estimatedHours).toBe(12);
        expect(topic.completedHours).toBe(0);
        expect(topic.status).toBe('not_started');
      });
    });

    describe('getTopicById', () => {
      it('should get topic by ID', async () => {
        const created = await syllabusService.createTopic({
          syllabusId: syllabus.syllabusId,
          title: 'Geometry',
          estimatedHours: 10
        });

        const topic = await syllabusService.getTopicById(created.topicId);

        expect(topic).toBeDefined();
        expect(topic!.topicId).toBe(created.topicId);
        expect(topic!.title).toBe('Geometry');
      });

      it('should return null for non-existent topic', async () => {
        const topic = await syllabusService.getTopicById(99999);
        expect(topic).toBeNull();
      });
    });

    describe('updateTopic', () => {
      it('should update topic', async () => {
        const created = await syllabusService.createTopic({
          syllabusId: syllabus.syllabusId,
          title: 'Trigonometry',
          estimatedHours: 15
        });

        const updated = await syllabusService.updateTopic(created.topicId, {
          title: 'Advanced Trigonometry',
          estimatedHours: 20
        });

        expect(updated).toBeDefined();
        expect(updated!.title).toBe('Advanced Trigonometry');
        expect(updated!.estimatedHours).toBe(20);
      });

      it('should return null for non-existent topic', async () => {
        const updated = await syllabusService.updateTopic(99999, {
          title: 'Test'
        });
        expect(updated).toBeNull();
      });
    });

    describe('deleteTopic', () => {
      it('should delete topic', async () => {
        const created = await syllabusService.createTopic({
          syllabusId: syllabus.syllabusId,
          title: 'To Delete',
          estimatedHours: 5
        });

        const deleted = await syllabusService.deleteTopic(created.topicId);
        expect(deleted).toBe(true);

        const found = await syllabusService.getTopicById(created.topicId);
        expect(found).toBeNull();
      });

      it('should return false for non-existent topic', async () => {
        const deleted = await syllabusService.deleteTopic(99999);
        expect(deleted).toBe(false);
      });
    });
  });

  describe('Progress Tracking', () => {
    let syllabus: Syllabus;
    let topic: SyllabusTopic;

    beforeEach(async () => {
      // Create a fresh syllabus for progress tracking tests
      const subject3 = await Subject.create({
        code: 'ENG101',
        nameEn: 'English',
        nameNp: 'अंग्रेजी',
        type: 'compulsory',
        creditHours: 5,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100
      });

      syllabus = await syllabusService.createSyllabus({
        subjectId: subject3.subjectId,
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId
      });

      topic = await syllabusService.createTopic({
        syllabusId: syllabus.syllabusId,
        title: 'Grammar',
        estimatedHours: 20
      });
    });

    describe('markTopicProgress', () => {
      it('should mark topic progress and update status to in_progress', async () => {
        const updated = await syllabusService.markTopicProgress(topic.topicId, 5);

        expect(updated).toBeDefined();
        expect(updated!.completedHours).toBe(5);
        expect(updated!.status).toBe('in_progress');
      });

      it('should mark topic as completed when hours reach estimated', async () => {
        const updated = await syllabusService.markTopicProgress(topic.topicId, 20);

        expect(updated).toBeDefined();
        expect(updated!.completedHours).toBe(20);
        expect(updated!.status).toBe('completed');
      });

      it('should accumulate completed hours', async () => {
        await syllabusService.markTopicProgress(topic.topicId, 5);
        const updated = await syllabusService.markTopicProgress(topic.topicId, 10);

        expect(updated).toBeDefined();
        expect(updated!.completedHours).toBe(15);
        expect(updated!.status).toBe('in_progress');
      });

      it('should return null for non-existent topic', async () => {
        const updated = await syllabusService.markTopicProgress(99999, 5);
        expect(updated).toBeNull();
      });
    });

    describe('markTopicInProgress', () => {
      it('should mark topic as in progress', async () => {
        const updated = await syllabusService.markTopicInProgress(topic.topicId);

        expect(updated).toBeDefined();
        expect(updated!.status).toBe('in_progress');
      });

      it('should return null for non-existent topic', async () => {
        const updated = await syllabusService.markTopicInProgress(99999);
        expect(updated).toBeNull();
      });
    });

    describe('markTopicCompleted', () => {
      it('should mark topic as completed and set completed hours', async () => {
        const updated = await syllabusService.markTopicCompleted(topic.topicId);

        expect(updated).toBeDefined();
        expect(updated!.status).toBe('completed');
        expect(updated!.completedHours).toBe(topic.estimatedHours);
      });

      it('should return null for non-existent topic', async () => {
        const updated = await syllabusService.markTopicCompleted(99999);
        expect(updated).toBeNull();
      });
    });

    describe('recalculateSyllabusCompletion', () => {
      it('should calculate 0% when no topics', async () => {
        const subject4 = await Subject.create({
          code: 'HIST101',
          nameEn: 'History',
          nameNp: 'इतिहास',
          type: 'compulsory',
          creditHours: 4,
          theoryMarks: 75,
          practicalMarks: 25,
          passMarks: 35,
          fullMarks: 100
        });

        const emptySyllabus = await syllabusService.createSyllabus({
          subjectId: subject4.subjectId,
          classId: testClass.classId,
          academicYearId: academicYear.academicYearId
        });

        const updated = await syllabusService.recalculateSyllabusCompletion(
          emptySyllabus.syllabusId
        );

        expect(updated).toBeDefined();
        expect(updated!.completedPercentage).toBe(0);
      });

      it('should calculate correct percentage with partial completion', async () => {
        // Create topics with different completion levels
        const topic1 = await syllabusService.createTopic({
          syllabusId: syllabus.syllabusId,
          title: 'Topic 1',
          estimatedHours: 10
        });

        const topic2 = await syllabusService.createTopic({
          syllabusId: syllabus.syllabusId,
          title: 'Topic 2',
          estimatedHours: 10
        });

        // Mark first topic as completed (10 hours)
        await syllabusService.markTopicCompleted(topic1.topicId);

        // Mark second topic partially (5 hours)
        await syllabusService.markTopicProgress(topic2.topicId, 5);

        // Total: 20 estimated, 15 completed = 75%
        const updated = await Syllabus.findByPk(syllabus.syllabusId);
        expect(updated).toBeDefined();
        expect(updated!.completedPercentage).toBe(75);
      });

      it('should calculate 100% when all topics completed', async () => {
        const topic1 = await syllabusService.createTopic({
          syllabusId: syllabus.syllabusId,
          title: 'Topic A',
          estimatedHours: 10
        });

        const topic2 = await syllabusService.createTopic({
          syllabusId: syllabus.syllabusId,
          title: 'Topic B',
          estimatedHours: 10
        });

        await syllabusService.markTopicCompleted(topic1.topicId);
        await syllabusService.markTopicCompleted(topic2.topicId);

        const updated = await Syllabus.findByPk(syllabus.syllabusId);
        expect(updated).toBeDefined();
        expect(updated!.completedPercentage).toBe(100);
      });

      it('should return null for non-existent syllabus', async () => {
        const updated = await syllabusService.recalculateSyllabusCompletion(99999);
        expect(updated).toBeNull();
      });
    });

    describe('getSyllabusCompletionSummary', () => {
      it('should return correct completion summary', async () => {
        // Create topics with different statuses
        const topic1 = await syllabusService.createTopic({
          syllabusId: syllabus.syllabusId,
          title: 'Completed Topic',
          estimatedHours: 10
        });

        const topic2 = await syllabusService.createTopic({
          syllabusId: syllabus.syllabusId,
          title: 'In Progress Topic',
          estimatedHours: 15
        });

        await syllabusService.createTopic({
          syllabusId: syllabus.syllabusId,
          title: 'Not Started Topic',
          estimatedHours: 5
        });

        await syllabusService.markTopicCompleted(topic1.topicId);
        await syllabusService.markTopicProgress(topic2.topicId, 7.5);

        const summary = await syllabusService.getSyllabusCompletionSummary(syllabus.syllabusId);

        expect(summary).toBeDefined();
        expect(summary!.totalTopics).toBe(3);
        expect(summary!.completedTopics).toBe(1);
        expect(summary!.inProgressTopics).toBe(1);
        expect(summary!.notStartedTopics).toBe(1);
        expect(summary!.totalEstimatedHours).toBe(30);
        expect(summary!.totalCompletedHours).toBe(17.5);
        expect(summary!.completionPercentage).toBeCloseTo(58.33, 1);
      });

      it('should return null for non-existent syllabus', async () => {
        const summary = await syllabusService.getSyllabusCompletionSummary(99999);
        expect(summary).toBeNull();
      });
    });
  });

  describe('deleteSyllabus', () => {
    it('should delete syllabus and cascade delete topics', async () => {
      const subject5 = await Subject.create({
        code: 'GEO101',
        nameEn: 'Geography',
        nameNp: 'भूगोल',
        type: 'compulsory',
        creditHours: 4,
        theoryMarks: 75,
        practicalMarks: 25,
        passMarks: 35,
        fullMarks: 100
      });

      const syllabus = await syllabusService.createSyllabus({
        subjectId: subject5.subjectId,
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId,
        topics: [
          { title: 'Topic 1', estimatedHours: 10 },
          { title: 'Topic 2', estimatedHours: 10 }
        ]
      });

      const deleted = await syllabusService.deleteSyllabus(syllabus.syllabusId);
      expect(deleted).toBe(true);

      const found = await syllabusService.getSyllabusById(syllabus.syllabusId);
      expect(found).toBeNull();

      // Topics should also be deleted (cascade)
      const topics = await SyllabusTopic.findAll({
        where: { syllabusId: syllabus.syllabusId }
      });
      expect(topics).toHaveLength(0);
    });

    it('should return false for non-existent syllabus', async () => {
      const deleted = await syllabusService.deleteSyllabus(99999);
      expect(deleted).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle decimal hours correctly', async () => {
      const subject6 = await Subject.create({
        code: 'ART101',
        nameEn: 'Art',
        nameNp: 'कला',
        type: 'optional',
        creditHours: 3,
        theoryMarks: 50,
        practicalMarks: 50,
        passMarks: 35,
        fullMarks: 100
      });

      const syllabus = await syllabusService.createSyllabus({
        subjectId: subject6.subjectId,
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId
      });

      const topic = await syllabusService.createTopic({
        syllabusId: syllabus.syllabusId,
        title: 'Drawing',
        estimatedHours: 12.5
      });

      await syllabusService.markTopicProgress(topic.topicId, 6.25);

      const updated = await syllabusService.getTopicById(topic.topicId);
      expect(updated!.completedHours).toBe(6.25);
      expect(updated!.status).toBe('in_progress');

      const syllabusUpdated = await Syllabus.findByPk(syllabus.syllabusId);
      expect(syllabusUpdated!.completedPercentage).toBe(50);
    });

    it('should handle over-completion gracefully', async () => {
      const subject7 = await Subject.create({
        code: 'MUS101',
        nameEn: 'Music',
        nameNp: 'संगीत',
        type: 'optional',
        creditHours: 2,
        theoryMarks: 40,
        practicalMarks: 60,
        passMarks: 35,
        fullMarks: 100
      });

      const syllabus = await syllabusService.createSyllabus({
        subjectId: subject7.subjectId,
        classId: testClass.classId,
        academicYearId: academicYear.academicYearId
      });

      const topic = await syllabusService.createTopic({
        syllabusId: syllabus.syllabusId,
        title: 'Singing',
        estimatedHours: 10
      });

      // Mark more hours than estimated
      await syllabusService.markTopicProgress(topic.topicId, 15);

      const updated = await syllabusService.getTopicById(topic.topicId);
      expect(updated!.completedHours).toBe(15);
      expect(updated!.status).toBe('completed');

      // Completion percentage should be capped at 100% or show actual
      const syllabusUpdated = await Syllabus.findByPk(syllabus.syllabusId);
      expect(syllabusUpdated!.completedPercentage).toBe(150); // Shows actual completion
    });
  });
});

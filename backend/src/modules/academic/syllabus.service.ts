import { Syllabus, SyllabusTopic } from '@models/Timetable.model';
import { logger } from '@utils/logger';
import auditLogger from '@utils/auditLogger';
import { Request } from 'express';
import { WhereOptions } from 'sequelize';

/**
 * Syllabus Service
 * Handles business logic for syllabus and topic management
 * Requirements: 5.8, 5.9
 */
class SyllabusService {
  /**
   * Create a new syllabus
   */
  async createSyllabus(
    data: {
      subjectId: number;
      classId: number;
      academicYearId: number;
      topics?: Array<{
        title: string;
        description?: string;
        estimatedHours: number;
      }>;
    },
    userId?: number,
    req?: Request
  ): Promise<Syllabus> {
    await this.checkSyllabusExists(data.subjectId, data.classId, data.academicYearId);
    
    const syllabus = await Syllabus.create({
      subjectId: data.subjectId,
      classId: data.classId,
      academicYearId: data.academicYearId,
      completedPercentage: 0
    });

    logger.info('Syllabus created', { syllabusId: syllabus.syllabusId, subjectId: data.subjectId, classId: data.classId });

    await auditLogger.logCreate('syllabus', syllabus.syllabusId, syllabus.toJSON(), userId, req);

    if (data.topics && data.topics.length > 0) {
      await this.createTopicsFromData(syllabus.syllabusId, data.topics, userId, req);
    }

    const reloaded = await this.getSyllabusById(syllabus.syllabusId);
    if (!reloaded) throw new Error('Failed to reload syllabus after creation');
    return reloaded;
  }

  /**
   * Get syllabus by ID with topics
   */
  async getSyllabusById(syllabusId: number): Promise<Syllabus | null> {
    return Syllabus.findByPk(syllabusId, {
      include: [{ model: SyllabusTopic, as: 'topics', order: [['topicId', 'ASC']] }]
    });
  }

  /**
   * Get syllabus by subject, class, and academic year
   */
  async getSyllabusBySubjectClassYear(
    subjectId: number,
    classId: number,
    academicYearId: number
  ): Promise<Syllabus | null> {
    return Syllabus.findOne({
      where: { subjectId, classId, academicYearId },
      include: [{ model: SyllabusTopic, as: 'topics', order: [['topicId', 'ASC']] }]
    });
  }

  /**
   * Get all syllabi for a class
   */
  async getSyllabiByClass(classId: number, academicYearId?: number): Promise<Syllabus[]> {
    const where: WhereOptions<Syllabus> = { classId };
    if (academicYearId) where.academicYearId = academicYearId;

    return Syllabus.findAll({
      where,
      include: [{ model: SyllabusTopic, as: 'topics', order: [['topicId', 'ASC']] }],
      order: [['syllabusId', 'ASC']]
    });
  }

  /**
   * Update syllabus
   */
  async updateSyllabus(
    syllabusId: number,
    updateData: Partial<{ subjectId: number; classId: number; academicYearId: number }>,
    userId?: number,
    req?: Request
  ): Promise<Syllabus | null> {
    const syllabus = await Syllabus.findByPk(syllabusId);
    if (!syllabus) return null;

    await syllabus.update(updateData);
    logger.info('Syllabus updated', { syllabusId, updatedFields: Object.keys(updateData) });

    await auditLogger.logUpdate('syllabus', syllabusId, syllabus.toJSON(), userId, req);
    return syllabus;
  }

  /**
   * Delete syllabus
   */
  async deleteSyllabus(syllabusId: number, userId?: number, req?: Request): Promise<boolean> {
    const syllabus = await Syllabus.findByPk(syllabusId);
    if (!syllabus) return false;

    await syllabus.destroy();
    logger.info('Syllabus deleted', { syllabusId });

    await auditLogger.logDelete('syllabus', syllabusId, userId, req);
    return true;
  }

  /**
   * Create a new topic
   */
  async createTopic(
    data: {
      syllabusId: number;
      title: string;
      description?: string;
      estimatedHours: number;
    },
    userId?: number,
    req?: Request
  ): Promise<SyllabusTopic> {
    const topic = await SyllabusTopic.create({
      ...data,
      completedHours: 0,
      status: 'not_started'
    });

    logger.info('Syllabus topic created', { topicId: topic.topicId, syllabusId: data.syllabusId });

    await auditLogger.logCreate('syllabus_topic', topic.topicId, topic.toJSON(), userId, req);
    return topic;
  }

  /**
   * Update a topic
   */
  async updateTopic(
    topicId: number,
    updateData: Partial<{ title: string; description?: string; estimatedHours: number; completedHours: number; status: string }>,
    userId?: number,
    req?: Request
  ): Promise<SyllabusTopic | null> {
    const topic = await SyllabusTopic.findByPk(topicId);
    if (!topic) return null;

    await topic.update(updateData);
    logger.info('Syllabus topic updated', { topicId, updatedFields: Object.keys(updateData) });

    await auditLogger.logUpdate('syllabus_topic', topicId, topic.toJSON(), userId, req);
    return topic;
  }

  /**
   * Delete a topic
   */
  async deleteTopic(topicId: number, userId?: number, req?: Request): Promise<boolean> {
    const topic = await SyllabusTopic.findByPk(topicId);
    if (!topic) return false;

    await topic.destroy();
    logger.info('Syllabus topic deleted', { topicId });

    await auditLogger.logDelete('syllabus_topic', topicId, userId, req);
    return true;
  }

  /**
   * Recalculate syllabus completion percentage
   */
  async recalculateSyllabusCompletion(syllabusId: number): Promise<Syllabus | null> {
    const syllabus = await Syllabus.findByPk(syllabusId, {
      include: [{ model: SyllabusTopic, as: 'topics' }]
    });

    if (!syllabus) return null;

    const topics = syllabus.topics || [];
    if (topics.length === 0) {
      await syllabus.update({ completedPercentage: 0 });
      return syllabus;
    }

    const { totalEstimatedHours, totalCompletedHours } = this.calculateHours(topics);
    const completionPercentage = this.calculateCompletionPercentage(totalEstimatedHours, totalCompletedHours);

    await syllabus.update({ completedPercentage: completionPercentage });
    logger.info('Syllabus completion percentage recalculated', { syllabusId, completedPercentage: completionPercentage });
    return syllabus;
  }

  /**
   * Get syllabus completion summary
   */
  async getSyllabusCompletionSummary(syllabusId: number): Promise<{
    syllabusId: number;
    totalTopics: number;
    completedTopics: number;
    inProgressTopics: number;
    notStartedTopics: number;
    totalEstimatedHours: number;
    totalCompletedHours: number;
    completionPercentage: number;
  } | null> {
    const syllabus = await Syllabus.findByPk(syllabusId, {
      include: [{ model: SyllabusTopic, as: 'topics' }]
    });

    if (!syllabus) return null;

    const topics = syllabus.topics || [];
    return {
      syllabusId,
      totalTopics: topics.length,
      completedTopics: topics.filter(t => t.status === 'completed').length,
      inProgressTopics: topics.filter(t => t.status === 'in_progress').length,
      notStartedTopics: topics.filter(t => t.status === 'not_started').length,
      totalEstimatedHours: topics.reduce((sum, t) => sum + Number(t.estimatedHours), 0),
      totalCompletedHours: topics.reduce((sum, t) => sum + Number(t.completedHours), 0),
      completionPercentage: Number(syllabus.completedPercentage)
    };
  }

  // ============ Private Helper Methods ============

  private async checkSyllabusExists(subjectId: number, classId: number, academicYearId: number): Promise<void> {
    const existing = await Syllabus.findOne({ where: { subjectId, classId, academicYearId } });
    if (existing) {
      throw new Error('Syllabus already exists for this subject, class, and academic year');
    }
  }

  private async createTopicsFromData(
    syllabusId: number,
    topics: Array<{ title: string; description?: string; estimatedHours: number }>,
    userId?: number,
    req?: Request
  ): Promise<void> {
    for (const topicData of topics) {
      await this.createTopic({ syllabusId, ...topicData }, userId, req);
    }
  }

  private calculateHours(topics: SyllabusTopic[]): { totalEstimatedHours: number; totalCompletedHours: number } {
    let totalEstimatedHours = 0;
    let totalCompletedHours = 0;
    for (const topic of topics) {
      totalEstimatedHours += Number(topic.estimatedHours);
      totalCompletedHours += Number(topic.completedHours);
    }
    return { totalEstimatedHours, totalCompletedHours };
  }

  private calculateCompletionPercentage(totalEstimatedHours: number, totalCompletedHours: number): number {
    const percentage = totalEstimatedHours > 0 ? (totalCompletedHours / totalEstimatedHours) * 100 : 0;
    return Math.round(percentage * 100) / 100;
  }
}

export default new SyllabusService();
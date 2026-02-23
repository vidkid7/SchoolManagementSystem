/**
 * CV Repository
 * Database operations for CV management
 * 
 * Requirements: 26.1, 26.3, 26.4
 */

import StudentCV from '@models/StudentCV.model';
import { Transaction } from 'sequelize';

export interface CVCustomization {
  studentId: number;
  showPersonalInfo: boolean;
  showAcademicPerformance: boolean;
  showAttendance: boolean;
  showECA: boolean;
  showSports: boolean;
  showCertificates: boolean;
  showAwards: boolean;
  showTeacherRemarks: boolean;
  skills: string[];
  hobbies: string[];
  careerGoals: string;
  personalStatement: string;
  templateId: string;
  schoolBrandingEnabled: boolean;
}

export interface CVFilters {
  studentId?: number;
  templateId?: string;
}

class CVRepository {
  /**
   * Find CV customization by student ID
   * 
   * @param studentId - Student ID
   * @returns CV customization or null
   */
  async findByStudentId(studentId: number): Promise<StudentCV | null> {
    return StudentCV.findOne({
      where: { studentId }
    });
  }

  /**
   * Find CV customization by ID
   * 
   * @param cvId - CV ID
   * @returns CV customization or null
   */
  async findById(cvId: number): Promise<StudentCV | null> {
    return StudentCV.findByPk(cvId);
  }

  /**
   * Find all CV customizations with filters
   * 
   * @param filters - Filter criteria
   * @returns Array of CV customizations
   */
  async findAll(filters: CVFilters = {}): Promise<StudentCV[]> {
    const where: Record<string, any> = {};

    if (filters.studentId) {
      where.studentId = filters.studentId;
    }

    if (filters.templateId) {
      where.templateId = filters.templateId;
    }

    return StudentCV.findAll({ where });
  }

  /**
   * Create or update CV customization for a student
   * 
   * @param data - CV customization data
   * @param transaction - Optional transaction
   * @returns Created or updated CV customization
   */
  async upsert(data: CVCustomization): Promise<StudentCV> {
    const existing = await this.findByStudentId(data.studentId);

    if (existing) {
      // Update existing record
      existing.set({
        showPersonalInfo: data.showPersonalInfo,
        showAcademicPerformance: data.showAcademicPerformance,
        showAttendance: data.showAttendance,
        showECA: data.showECA,
        showSports: data.showSports,
        showCertificates: data.showCertificates,
        showAwards: data.showAwards,
        showTeacherRemarks: data.showTeacherRemarks,
        skills: JSON.stringify(data.skills),
        hobbies: JSON.stringify(data.hobbies),
        careerGoals: data.careerGoals,
        personalStatement: data.personalStatement,
        templateId: data.templateId,
        schoolBrandingEnabled: data.schoolBrandingEnabled
      });
      await existing.save();
      return existing;
    }

    // Create new record
    return StudentCV.create({
      studentId: data.studentId,
      showPersonalInfo: data.showPersonalInfo,
      showAcademicPerformance: data.showAcademicPerformance,
      showAttendance: data.showAttendance,
      showECA: data.showECA,
      showSports: data.showSports,
      showCertificates: data.showCertificates,
      showAwards: data.showAwards,
      showTeacherRemarks: data.showTeacherRemarks,
      skills: JSON.stringify(data.skills),
      hobbies: JSON.stringify(data.hobbies),
      careerGoals: data.careerGoals,
      personalStatement: data.personalStatement,
      templateId: data.templateId,
      schoolBrandingEnabled: data.schoolBrandingEnabled
    });
  }

  /**
   * Update last generated timestamp
   * 
   * @param studentId - Student ID
   * @param transaction - Optional transaction
   * @returns Updated record or null
   */
  async updateLastGeneratedAt(studentId: number, transaction?: Transaction): Promise<StudentCV | null> {
    const cv = await this.findByStudentId(studentId);
    if (!cv) return null;

    cv.lastGeneratedAt = new Date();
    await cv.save({ transaction });
    return cv;
  }

  /**
   * Update section visibility
   * 
   * @param studentId - Student ID
   * @param visibility - Section visibility settings
   * @param transaction - Optional transaction
   * @returns Updated record or null
   */
  async updateSectionVisibility(
    studentId: number,
    visibility: Record<string, boolean>,
    transaction?: Transaction
  ): Promise<StudentCV | null> {
    const cv = await this.findByStudentId(studentId);
    if (!cv) return null;

    cv.setSectionVisibility(visibility);
    await cv.save({ transaction });
    return cv;
  }

  /**
   * Update custom fields (skills, hobbies, goals)
   * 
   * @param studentId - Student ID
   * @param customFields - Custom fields to update
   * @param transaction - Optional transaction
   * @returns Updated record or null
   */
  async updateCustomFields(
    studentId: number,
    customFields: {
      skills?: string[];
      hobbies?: string[];
      careerGoals?: string;
      personalStatement?: string;
    },
    transaction?: Transaction
  ): Promise<StudentCV | null> {
    const cv = await this.findByStudentId(studentId);
    if (!cv) return null;

    if (customFields.skills !== undefined) {
      cv.setSkills(customFields.skills);
    }
    if (customFields.hobbies !== undefined) {
      cv.setHobbies(customFields.hobbies);
    }
    if (customFields.careerGoals !== undefined) {
      cv.careerGoals = customFields.careerGoals;
    }
    if (customFields.personalStatement !== undefined) {
      cv.personalStatement = customFields.personalStatement;
    }

    await cv.save({ transaction });
    return cv;
  }

  /**
   * Update template
   * 
   * @param studentId - Student ID
   * @param templateId - Template ID
   * @param transaction - Optional transaction
   * @returns Updated record or null
   */
  async updateTemplate(
    studentId: number,
    templateId: string,
    transaction?: Transaction
  ): Promise<StudentCV | null> {
    const cv = await this.findByStudentId(studentId);
    if (!cv) return null;

    cv.templateId = templateId;
    await cv.save({ transaction });
    return cv;
  }

  /**
   * Delete CV customization
   * 
   * @param studentId - Student ID
   * @param transaction - Optional transaction
   * @returns True if deleted
   */
  async delete(studentId: number, transaction?: Transaction): Promise<boolean> {
    const cv = await this.findByStudentId(studentId);
    if (!cv) return false;

    await cv.destroy({ transaction });
    return true;
  }

  /**
   * Check if CV customization exists for student
   * 
   * @param studentId - Student ID
   * @returns True if exists
   */
  async exists(studentId: number): Promise<boolean> {
    const cv = await this.findByStudentId(studentId);
    return cv !== null;
  }
}

export { CVRepository };
export default new CVRepository();
import { distance } from 'fastest-levenshtein';
import Student, { StudentCreationAttributes, StudentStatus } from '@models/Student.model';
import StudentRepository from './student.repository';
import { logger } from '@utils/logger';
import { Op } from 'sequelize';

/**
 * Duplicate Detection Result
 */
export interface DuplicateScore {
  student: Student;
  nameScore: number;
  dobScore: number;
  guardianScore: number;
  addressScore: number;
  overallScore: number;
  isDuplicate: boolean;
  confidence: 'low' | 'medium' | 'high';
  reasons: string[];
}

/**
 * Duplicate Detection Service
 * Detects potential duplicate student records using fuzzy matching
 */
class DuplicateDetectionService {
  // Thresholds for duplicate detection
  private readonly THRESHOLDS = {
    NAME_HIGH: 0.9,
    NAME_MEDIUM: 0.8,
    DOB_EXACT: 1.0,
    DOB_CLOSE: 0.95,
    GUARDIAN_EXACT: 1.0,
    ADDRESS_HIGH: 0.8,
    OVERALL_HIGH: 0.85,
    OVERALL_MEDIUM: 0.7
  };

  /**
   * Detect potential duplicates for a new student
   * @param newStudent - New student data
   * @param excludeId - Student ID to exclude from search (for updates)
   * @returns Array of potential duplicates with scores
   */
  async detectDuplicates(
    newStudent: Partial<StudentCreationAttributes>,
    excludeId?: number
  ): Promise<DuplicateScore[]> {
    try {
      // Fetch existing students for comparison
      const { students } = await StudentRepository.findAll(
        { status: StudentStatus.ACTIVE },
        { limit: 10000, offset: 0 }
      );

      const duplicates: DuplicateScore[] = [];

      for (const existing of students) {
        // Skip if this is the same student (for updates)
        if (excludeId && existing.studentId === excludeId) {
          continue;
        }

        // Calculate similarity scores
        const nameScore = this.calculateNameSimilarity(newStudent, existing);
        const dobScore = this.calculateDobSimilarity(newStudent, existing);
        const guardianScore = this.calculateGuardianSimilarity(newStudent, existing);
        const addressScore = this.calculateAddressSimilarity(newStudent, existing);

        // Calculate weighted overall score
        const overallScore = this.calculateOverallScore({
          nameScore,
          dobScore,
          guardianScore,
          addressScore
        });

        // Determine if duplicate and confidence level
        const { isDuplicate, confidence, reasons } = this.evaluateDuplicate({
          nameScore,
          dobScore,
          guardianScore,
          addressScore,
          overallScore
        });

        if (isDuplicate) {
          duplicates.push({
            student: existing,
            nameScore,
            dobScore,
            guardianScore,
            addressScore,
            overallScore,
            isDuplicate,
            confidence,
            reasons
          });
        }
      }

      // Sort by overall score (highest first)
      return duplicates.sort((a, b) => b.overallScore - a.overallScore);

    } catch (error) {
      logger.error('Error detecting duplicates', { error, newStudent });
      throw error;
    }
  }

  /**
   * Calculate name similarity score
   */
  private calculateNameSimilarity(
    student1: Partial<StudentCreationAttributes>,
    student2: Student
  ): number {
    const name1 = this.normalizeFullName(
      student1.firstNameEn,
      student1.middleNameEn,
      student1.lastNameEn
    );
    const name2 = this.normalizeFullName(
      student2.firstNameEn,
      student2.middleNameEn,
      student2.lastNameEn
    );

    if (!name1 || !name2) return 0;

    const maxLength = Math.max(name1.length, name2.length);
    const dist = distance(name1, name2);
    
    return 1 - (dist / maxLength);
  }

  /**
   * Calculate date of birth similarity score
   */
  private calculateDobSimilarity(
    student1: Partial<StudentCreationAttributes>,
    student2: Student
  ): number {
    if (!student1.dateOfBirthAD || !student2.dateOfBirthAD) return 0;

    const date1 = new Date(student1.dateOfBirthAD);
    const date2 = new Date(student2.dateOfBirthAD);

    // Exact match
    if (date1.getTime() === date2.getTime()) return 1.0;

    // Calculate day difference
    const daysDiff = Math.abs(
      (date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Within 30 days = possible typo (score 0.95)
    // Within 90 days = suspicious (score 0.8)
    // Within 365 days = low similarity (score 0.5)
    if (daysDiff <= 30) return 0.95;
    if (daysDiff <= 90) return 0.8;
    if (daysDiff <= 365) return 0.5;
    
    return 0;
  }

  /**
   * Calculate guardian similarity score
   */
  private calculateGuardianSimilarity(
    student1: Partial<StudentCreationAttributes>,
    student2: Student
  ): number {
    // Check father phone exact match
    if (student1.fatherPhone && student2.fatherPhone) {
      const phone1 = this.normalizePhone(student1.fatherPhone);
      const phone2 = this.normalizePhone(student2.fatherPhone);
      if (phone1 === phone2) return 1.0;
    }

    // Check mother phone exact match
    if (student1.motherPhone && student2.motherPhone) {
      const phone1 = this.normalizePhone(student1.motherPhone);
      const phone2 = this.normalizePhone(student2.motherPhone);
      if (phone1 === phone2) return 1.0;
    }

    // Check guardian name similarity
    let nameScore = 0;
    if (student1.fatherName && student2.fatherName) {
      nameScore = Math.max(nameScore, this.calculateStringSimilarity(
        student1.fatherName,
        student2.fatherName
      ));
    }
    if (student1.motherName && student2.motherName) {
      nameScore = Math.max(nameScore, this.calculateStringSimilarity(
        student1.motherName,
        student2.motherName
      ));
    }

    return nameScore;
  }

  /**
   * Calculate address similarity score
   */
  private calculateAddressSimilarity(
    student1: Partial<StudentCreationAttributes>,
    student2: Student
  ): number {
    if (!student1.addressEn || !student2.addressEn) return 0;

    return this.calculateStringSimilarity(
      student1.addressEn,
      student2.addressEn
    );
  }

  /**
   * Calculate overall weighted score
   */
  private calculateOverallScore(scores: {
    nameScore: number;
    dobScore: number;
    guardianScore: number;
    addressScore: number;
  }): number {
    // Weighted average
    const weights = {
      name: 0.4,
      dob: 0.3,
      guardian: 0.2,
      address: 0.1
    };

    return (
      scores.nameScore * weights.name +
      scores.dobScore * weights.dob +
      scores.guardianScore * weights.guardian +
      scores.addressScore * weights.address
    );
  }

  /**
   * Evaluate if duplicate and determine confidence
   */
  private evaluateDuplicate(scores: {
    nameScore: number;
    dobScore: number;
    guardianScore: number;
    addressScore: number;
    overallScore: number;
  }): { isDuplicate: boolean; confidence: 'low' | 'medium' | 'high'; reasons: string[] } {
    const reasons: string[] = [];

    // High confidence duplicate scenarios
    if (scores.nameScore >= this.THRESHOLDS.NAME_HIGH && 
        scores.dobScore >= this.THRESHOLDS.DOB_CLOSE) {
      reasons.push('Very similar name and date of birth');
      return { isDuplicate: true, confidence: 'high', reasons };
    }

    if (scores.guardianScore === this.THRESHOLDS.GUARDIAN_EXACT && 
        scores.nameScore >= this.THRESHOLDS.NAME_MEDIUM) {
      reasons.push('Same guardian phone and similar name (possible sibling or duplicate)');
      return { isDuplicate: true, confidence: 'high', reasons };
    }

    // Medium confidence duplicate scenarios
    if (scores.overallScore >= this.THRESHOLDS.OVERALL_HIGH) {
      if (scores.nameScore >= this.THRESHOLDS.NAME_MEDIUM) {
        reasons.push('Similar name');
      }
      if (scores.dobScore >= this.THRESHOLDS.DOB_CLOSE) {
        reasons.push('Similar date of birth');
      }
      if (scores.addressScore >= this.THRESHOLDS.ADDRESS_HIGH) {
        reasons.push('Similar address');
      }
      return { isDuplicate: true, confidence: 'medium', reasons };
    }

    // Low confidence duplicate scenarios
    if (scores.overallScore >= this.THRESHOLDS.OVERALL_MEDIUM) {
      if (scores.nameScore >= this.THRESHOLDS.NAME_MEDIUM) {
        reasons.push('Somewhat similar name');
      }
      if (scores.guardianScore > 0.5) {
        reasons.push('Similar guardian information');
      }
      return { isDuplicate: true, confidence: 'low', reasons };
    }

    return { isDuplicate: false, confidence: 'low', reasons: [] };
  }

  /**
   * Normalize full name for comparison
   */
  private normalizeFullName(
    firstName?: string,
    middleName?: string,
    lastName?: string
  ): string {
    const parts = [firstName, middleName, lastName]
      .filter(Boolean)
      .map(part => part?.toLowerCase().trim());
    
    return parts.join(' ');
  }

  /**
   * Normalize phone number for comparison
   */
  private normalizePhone(phone: string): string {
    // Remove all non-digit characters
    return phone.replace(/\D/g, '');
  }

  /**
   * Calculate string similarity using Levenshtein distance
   */
  private calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase().trim();
    const s2 = str2.toLowerCase().trim();
    
    const maxLength = Math.max(s1.length, s2.length);
    if (maxLength === 0) return 1;
    
    const dist = distance(s1, s2);
    return 1 - (dist / maxLength);
  }

  /**
   * Find potential siblings based on guardian phone
   */
  async findPotentialSiblings(studentId: number): Promise<Student[]> {
    try {
      const student = await StudentRepository.findById(studentId);
      if (!student) return [];

      const siblings = await Student.findAll({
        where: {
          [Op.or]: [
            { fatherPhone: student.fatherPhone },
            { motherPhone: student.motherPhone }
          ],
          studentId: { [Op.ne]: studentId },
          status: StudentStatus.ACTIVE
        }
      });

      return siblings;
    } catch (error) {
      logger.error('Error finding siblings', { error, studentId });
      throw error;
    }
  }
}

export default new DuplicateDetectionService();

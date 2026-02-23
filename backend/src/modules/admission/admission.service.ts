import Admission, { AdmissionStatus } from '@models/Admission.model';
import Student, { StudentStatus, Gender, StudentCreationAttributes } from '@models/Student.model';
import User, { UserRole, UserStatus } from '@models/User.model';
import studentIdService from '@modules/student/studentId.service';
import smsService from '@services/sms.service';
import pdfService from '@services/pdf.service';
import { logger } from '@utils/logger';
import { Op, WhereOptions } from 'sequelize';
import { env } from '@config/env';
import crypto from 'crypto';

/**
 * Admission Workflow Service
 * Implements state machine: inquiry → application → test → interview → admission → enrollment
 * Requirements: 3.1, 3.2, 3.8, 3.9, 3.10, 3.11
 */
class AdmissionService {
  /**
   * Generate a secure temporary password
   */
  private generateTemporaryPassword(): string {
    const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const digits = '23456789';
    const special = '@#$!';
    const pick = (s: string) => s[crypto.randomInt(s.length)];
    const base = pick(upper) + pick(lower) + pick(digits) + pick(special);
    const rest = Array.from({ length: 4 }, () =>
      pick(upper + lower + digits)
    ).join('');
    return (base + rest).split('').sort(() => crypto.randomInt(3) - 1).join('');
  }

  /**
   * Create login account for a newly enrolled student and their parent/guardian
   * Returns { studentUsername, studentPassword, parentUsername, parentPassword }
   */
  private async createLoginCredentials(
    studentCode: string,
    studentEmail: string | undefined,
    guardianPhone: string | undefined,
    guardianEmail: string | undefined,
    studentName: string
  ): Promise<{
    studentUsername: string;
    studentPassword: string;
    parentUsername: string | null;
    parentPassword: string | null;
  }> {
    const studentUsername = studentCode.toLowerCase().replace(/-/g, '.');
    const studentPassword = this.generateTemporaryPassword();

    const existingStudent = await User.findOne({ where: { username: studentUsername } });
    if (!existingStudent) {
      await User.create({
        username: studentUsername,
        email: studentEmail || `${studentUsername}@student.school.edu.np`,
        password: studentPassword,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        phoneNumber: '',
        failedLoginAttempts: 0,
      });
      logger.info('Student login account created', { studentUsername });
    }

    let parentUsername: string | null = null;
    let parentPassword: string | null = null;

    if (guardianPhone || guardianEmail) {
      const phoneDigits = (guardianPhone || '').replace(/\D/g, '').slice(-6);
      parentUsername = `parent.${studentCode.toLowerCase().replace(/-/g, '.')}`;
      parentPassword = this.generateTemporaryPassword();

      const existingParent = await User.findOne({ where: { username: parentUsername } });
      if (!existingParent) {
        await User.create({
          username: parentUsername,
          email: guardianEmail || `${parentUsername}@parent.school.edu.np`,
          password: parentPassword,
          role: UserRole.PARENT,
          status: UserStatus.ACTIVE,
          phoneNumber: guardianPhone || '',
          failedLoginAttempts: 0,
        });
        logger.info('Parent login account created', { parentUsername });
      }
    }

    return { studentUsername, studentPassword, parentUsername, parentPassword };
  }

  /**
   * Generate temporary ID for inquiry
   */
  private async generateTemporaryId(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = env.DEFAULT_SCHOOL_CODE || 'SCH';
    
    const count = await Admission.count({
      where: {
        inquiryDate: {
          [Op.gte]: new Date(`${year}-01-01`),
          [Op.lt]: new Date(`${year + 1}-01-01`)
        }
      }
    });

    const seqNum = (count + 1).toString().padStart(4, '0');
    return `${prefix}-INQ-${year}-${seqNum}`;
  }

  /**
   * Create a new inquiry
   * Requirements: 3.1, 3.2, 3.11
   */
  async createInquiry(data: {
    firstNameEn: string;
    lastNameEn: string;
    middleNameEn?: string;
    applyingForClass: number;
    phone?: string;
    email?: string;
    guardianName?: string;
    guardianPhone?: string;
    inquirySource?: string;
    inquiryNotes?: string;
    academicYearId?: number;
  }, processedBy?: number): Promise<Admission> {
    try {
      const temporaryId = await this.generateTemporaryId();

      const admission = await Admission.create({
        temporaryId,
        firstNameEn: data.firstNameEn,
        lastNameEn: data.lastNameEn,
        middleNameEn: data.middleNameEn,
        applyingForClass: data.applyingForClass,
        phone: data.phone,
        email: data.email,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        inquirySource: data.inquirySource as any,
        inquiryNotes: data.inquiryNotes,
        status: AdmissionStatus.INQUIRY,
        inquiryDate: new Date(),
        applicationFeePaid: false,
        documentsVerified: false,
        processedBy,
        academicYearId: data.academicYearId
      });

      logger.info('Admission inquiry created', {
        admissionId: admission.admissionId,
        temporaryId: admission.temporaryId
      });

      // Send SMS notification to guardian
      if (data.guardianPhone) {
        await smsService.sendAdmissionNotification(
          data.guardianPhone,
          'inquiry',
          {
            applicantName: `${data.firstNameEn} ${data.lastNameEn}`,
            temporaryId,
            schoolName: env.SCHOOL_NAME
          }
        );
      }

      return admission;
    } catch (error) {
      logger.error('Error creating admission inquiry', { error, data });
      throw error;
    }
  }

  /**
   * Convert inquiry to application
   * Requirements: 3.3, 3.4, 3.11
   */
  async convertToApplication(
    admissionId: number,
    data: {
      firstNameNp?: string;
      lastNameNp?: string;
      dateOfBirthBS?: string;
      dateOfBirthAD?: Date;
      gender?: string;
      addressEn?: string;
      addressNp?: string;
      fatherName?: string;
      fatherPhone?: string;
      motherName?: string;
      motherPhone?: string;
      previousSchool?: string;
      previousClass?: number;
      previousGpa?: number;
      applicationFee?: number;
      applicationFeePaid?: boolean;
    },
    processedBy?: number
  ): Promise<Admission> {
    try {
      const admission = await Admission.findByPk(admissionId);

      if (!admission) {
        throw new Error('Admission not found');
      }

      if (!admission.canTransitionTo(AdmissionStatus.APPLIED)) {
        throw new Error(`Cannot convert to application from status: ${admission.status}`);
      }

      await admission.update({
        ...data,
        status: AdmissionStatus.APPLIED,
        applicationDate: new Date(),
        processedBy
      });

      logger.info('Admission converted to application', {
        admissionId,
        temporaryId: admission.temporaryId
      });

      // Send SMS notification
      const phone = admission.guardianPhone || admission.fatherPhone || admission.motherPhone;
      if (phone) {
        await smsService.sendAdmissionNotification(
          phone,
          'application',
          {
            applicantName: admission.getFullNameEn(),
            temporaryId: admission.temporaryId,
            schoolName: env.SCHOOL_NAME
          }
        );
      }

      return admission;
    } catch (error) {
      logger.error('Error converting to application', { error, admissionId });
      throw error;
    }
  }

  /**
   * Schedule admission test
   * Requirements: 3.6, 3.11
   */
  async scheduleTest(
    admissionId: number,
    testDate: Date,
    processedBy?: number
  ): Promise<Admission> {
    try {
      const admission = await Admission.findByPk(admissionId);

      if (!admission) {
        throw new Error('Admission not found');
      }

      if (!admission.canTransitionTo(AdmissionStatus.TEST_SCHEDULED)) {
        throw new Error(`Cannot schedule test from status: ${admission.status}`);
      }

      await admission.update({
        status: AdmissionStatus.TEST_SCHEDULED,
        admissionTestDate: testDate,
        processedBy
      });

      logger.info('Admission test scheduled', {
        admissionId,
        testDate
      });

      // Send SMS notification
      const phone = admission.guardianPhone || admission.fatherPhone || admission.motherPhone;
      if (phone) {
        await smsService.sendAdmissionNotification(
          phone,
          'test_scheduled',
          {
            applicantName: admission.getFullNameEn(),
            temporaryId: admission.temporaryId,
            testDate,
            schoolName: env.SCHOOL_NAME
          }
        );
      }

      return admission;
    } catch (error) {
      logger.error('Error scheduling admission test', { error, admissionId });
      throw error;
    }
  }

  /**
   * Record admission test score
   * Requirements: 3.7
   */
  async recordTestScore(
    admissionId: number,
    data: {
      score: number;
      maxScore: number;
      remarks?: string;
    },
    processedBy?: number
  ): Promise<Admission> {
    try {
      const admission = await Admission.findByPk(admissionId);

      if (!admission) {
        throw new Error('Admission not found');
      }

      if (admission.status !== AdmissionStatus.TEST_SCHEDULED) {
        throw new Error(`Cannot record test score for status: ${admission.status}`);
      }

      await admission.update({
        status: AdmissionStatus.TESTED,
        admissionTestScore: data.score,
        admissionTestMaxScore: data.maxScore,
        admissionTestRemarks: data.remarks,
        processedBy
      });

      logger.info('Admission test score recorded', {
        admissionId,
        score: data.score,
        maxScore: data.maxScore
      });

      return admission;
    } catch (error) {
      logger.error('Error recording test score', { error, admissionId });
      throw error;
    }
  }

  /**
   * Schedule interview
   * Requirements: 3.6, 3.11
   */
  async scheduleInterview(
    admissionId: number,
    interviewDate: Date,
    interviewerName?: string,
    processedBy?: number
  ): Promise<Admission> {
    try {
      const admission = await Admission.findByPk(admissionId);

      if (!admission) {
        throw new Error('Admission not found');
      }

      if (!admission.canTransitionTo(AdmissionStatus.INTERVIEW_SCHEDULED)) {
        throw new Error(`Cannot schedule interview from status: ${admission.status}`);
      }

      await admission.update({
        status: AdmissionStatus.INTERVIEW_SCHEDULED,
        interviewDate,
        interviewerName,
        processedBy
      });

      logger.info('Admission interview scheduled', {
        admissionId,
        interviewDate
      });

      // Send SMS notification
      const phone = admission.guardianPhone || admission.fatherPhone || admission.motherPhone;
      if (phone) {
        await smsService.sendAdmissionNotification(
          phone,
          'interview_scheduled',
          {
            applicantName: admission.getFullNameEn(),
            temporaryId: admission.temporaryId,
            interviewDate,
            schoolName: env.SCHOOL_NAME
          }
        );
      }

      return admission;
    } catch (error) {
      logger.error('Error scheduling interview', { error, admissionId });
      throw error;
    }
  }

  /**
   * Record interview feedback
   * Requirements: 3.7
   */
  async recordInterview(
    admissionId: number,
    data: {
      feedback: string;
      score?: number;
    },
    processedBy?: number
  ): Promise<Admission> {
    try {
      const admission = await Admission.findByPk(admissionId);

      if (!admission) {
        throw new Error('Admission not found');
      }

      if (admission.status !== AdmissionStatus.INTERVIEW_SCHEDULED) {
        throw new Error(`Cannot record interview for status: ${admission.status}`);
      }

      await admission.update({
        status: AdmissionStatus.INTERVIEWED,
        interviewFeedback: data.feedback,
        interviewScore: data.score,
        processedBy
      });

      logger.info('Admission interview recorded', {
        admissionId
      });

      return admission;
    } catch (error) {
      logger.error('Error recording interview', { error, admissionId });
      throw error;
    }
  }

  /**
   * Admit applicant (generate admission offer)
   * Requirements: 3.8, 3.11
   */
  async admit(
    admissionId: number,
    processedBy?: number
  ): Promise<Admission> {
    try {
      const admission = await Admission.findByPk(admissionId);

      if (!admission) {
        throw new Error('Admission not found');
      }

      if (!admission.canTransitionTo(AdmissionStatus.ADMITTED)) {
        throw new Error(`Cannot admit from status: ${admission.status}`);
      }

      // Generate admission offer letter PDF
      const offerLetterUrl = await pdfService.generateAdmissionOfferLetter({
        temporaryId: admission.temporaryId,
        applicantName: admission.getFullNameEn(),
        applyingForClass: admission.applyingForClass,
        admissionDate: new Date(),
        schoolName: env.SCHOOL_NAME || 'School Name',
        schoolAddress: env.SCHOOL_ADDRESS || 'School Address',
        principalName: env.PRINCIPAL_NAME,
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Valid for 7 days
      });

      await admission.update({
        status: AdmissionStatus.ADMITTED,
        admissionDate: new Date(),
        admissionOfferLetterUrl: offerLetterUrl,
        processedBy
      });

      logger.info('Applicant admitted', {
        admissionId,
        temporaryId: admission.temporaryId,
        offerLetterUrl
      });

      // Send SMS notification to parents
      const phone = admission.guardianPhone || admission.fatherPhone || admission.motherPhone;
      if (phone) {
        await smsService.sendAdmissionNotification(
          phone,
          'admitted',
          {
            applicantName: admission.getFullNameEn(),
            temporaryId: admission.temporaryId,
            schoolName: env.SCHOOL_NAME
          }
        );
      }

      return admission;
    } catch (error) {
      logger.error('Error admitting applicant', { error, admissionId });
      throw error;
    }
  }

  /**
   * Enroll admitted applicant as student
   * Requirements: 3.10, 3.11
   */
  async enroll(
    admissionId: number,
    enrollmentData: {
      currentClassId?: number;
      rollNumber?: number;
    },
    processedBy?: number
  ): Promise<{ admission: Admission; student: Student; credentials: { studentUsername: string; studentPassword: string; parentUsername: string | null; parentPassword: string | null } }> {
    try {
      const admission = await Admission.findByPk(admissionId);

      if (!admission) {
        throw new Error('Admission not found');
      }

      if (!admission.canTransitionTo(AdmissionStatus.ENROLLED)) {
        throw new Error(`Cannot enroll from status: ${admission.status}`);
      }

      // Generate student code
      const admissionDate = admission.admissionDate || new Date();
      const studentCode = await studentIdService.generateStudentId(admissionDate);

      // Create student record from admission data
      const studentData: StudentCreationAttributes = {
        studentCode,
        firstNameEn: admission.firstNameEn,
        middleNameEn: admission.middleNameEn,
        lastNameEn: admission.lastNameEn,
        firstNameNp: admission.firstNameNp,
        middleNameNp: admission.middleNameNp,
        lastNameNp: admission.lastNameNp,
        dateOfBirthBS: admission.dateOfBirthBS || '',
        dateOfBirthAD: admission.dateOfBirthAD || new Date(),
        gender: (admission.gender as Gender) || Gender.OTHER,
        addressEn: admission.addressEn || '',
        addressNp: admission.addressNp,
        phone: admission.phone,
        email: admission.email,
        fatherName: admission.fatherName || '',
        fatherPhone: admission.fatherPhone || '',
        motherName: admission.motherName || '',
        motherPhone: admission.motherPhone || '',
        localGuardianName: admission.guardianName,
        localGuardianPhone: admission.guardianPhone,
        localGuardianRelation: admission.guardianRelation,
        admissionDate,
        admissionClass: admission.applyingForClass,
        currentClassId: enrollmentData.currentClassId,
        rollNumber: enrollmentData.rollNumber,
        previousSchool: admission.previousSchool,
        emergencyContact: admission.guardianPhone || admission.fatherPhone || admission.motherPhone || '',
        status: StudentStatus.ACTIVE
      };

      const student = await Student.create(studentData);

      // Update admission record
      await admission.update({
        status: AdmissionStatus.ENROLLED,
        enrolledStudentId: student.studentId,
        enrollmentDate: new Date(),
        processedBy
      });

      logger.info('Applicant enrolled as student', {
        admissionId,
        studentId: student.studentId,
        studentCode: student.studentCode
      });

      // Auto-create login credentials for student and parent
      const guardianPhone = admission.guardianPhone || admission.fatherPhone || admission.motherPhone;
      const guardianEmail = admission.email;
      const credentials = await this.createLoginCredentials(
        studentCode,
        admission.email,
        guardianPhone,
        guardianEmail,
        admission.getFullNameEn()
      );

      // Send enrollment SMS with login credentials
      if (guardianPhone) {
        const credMsg = `${admission.getFullNameEn()} enrolled at ${env.SCHOOL_NAME || 'School'}. ` +
          `Student login: ${credentials.studentUsername} / ${credentials.studentPassword}` +
          (credentials.parentUsername
            ? ` | Parent login: ${credentials.parentUsername} / ${credentials.parentPassword}`
            : '') +
          ` Please change your password on first login.`;
        await smsService.sendSMS(guardianPhone, credMsg);
      }

      return { admission, student, credentials };
    } catch (error) {
      logger.error('Error enrolling applicant', { error, admissionId });
      throw error;
    }
  }

  /**
   * Reject applicant
   */
  async reject(
    admissionId: number,
    reason: string,
    processedBy?: number
  ): Promise<Admission> {
    try {
      const admission = await Admission.findByPk(admissionId);

      if (!admission) {
        throw new Error('Admission not found');
      }

      if (!admission.canTransitionTo(AdmissionStatus.REJECTED)) {
        throw new Error(`Cannot reject from status: ${admission.status}`);
      }

      await admission.update({
        status: AdmissionStatus.REJECTED,
        rejectionReason: reason,
        rejectionDate: new Date(),
        processedBy
      });

      logger.info('Applicant rejected', {
        admissionId,
        reason
      });

      return admission;
    } catch (error) {
      logger.error('Error rejecting applicant', { error, admissionId });
      throw error;
    }
  }

  /**
   * Get admission by ID
   */
  async findById(admissionId: number): Promise<Admission | null> {
    return Admission.findByPk(admissionId);
  }

  /**
   * List admissions with filters
   */
  async findAll(
    filters?: {
      status?: AdmissionStatus;
      applyingForClass?: number;
      academicYearId?: number;
      search?: string;
    },
    options?: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    }
  ): Promise<{ admissions: Admission[]; total: number }> {
    try {
      const where: WhereOptions<any> = {};

      if (filters?.status) {
        where.status = filters.status;
      }
      if (filters?.applyingForClass) {
        where.applyingForClass = filters.applyingForClass;
      }
      if (filters?.academicYearId) {
        where.academicYearId = filters.academicYearId;
      }
      if (filters?.search) {
        where[Op.or as any] = [
          { firstNameEn: { [Op.like]: `%${filters.search}%` } },
          { lastNameEn: { [Op.like]: `%${filters.search}%` } },
          { temporaryId: { [Op.like]: `%${filters.search}%` } }
        ];
      }

      const limit = Math.min(options?.limit || 20, 100);
      const offset = options?.offset || 0;

      const { rows: admissions, count: total } = await Admission.findAndCountAll({
        where,
        limit,
        offset,
        order: [[options?.orderBy || 'createdAt', options?.orderDirection || 'DESC']]
      });

      return { admissions, total };
    } catch (error) {
      logger.error('Error finding admissions', { error, filters });
      throw error;
    }
  }

  /**
   * Get admission statistics
   * Requirements: 3.12
   */
  async getStatistics(academicYearId?: number): Promise<{
    total: number;
    byStatus: Record<string, number>;
    byClass: Record<number, number>;
  }> {
    try {
      const where: WhereOptions<any> = {};
      if (academicYearId) {
        where.academicYearId = academicYearId;
      }

      const total = await Admission.count({ where });

      const byStatus: Record<string, number> = {};
      for (const status of Object.values(AdmissionStatus)) {
        byStatus[status] = await Admission.count({
          where: { ...where, status }
        });
      }

      const byClass: Record<number, number> = {};
      for (let cls = 1; cls <= 12; cls++) {
        const count = await Admission.count({
          where: { ...where, applyingForClass: cls }
        });
        if (count > 0) {
          byClass[cls] = count;
        }
      }

      return { total, byStatus, byClass };
    } catch (error) {
      logger.error('Error getting admission statistics', { error });
      throw error;
    }
  }
}

export default new AdmissionService();

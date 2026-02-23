import admissionService from '../admission.service';
import Admission, { AdmissionStatus } from '@models/Admission.model';
import Student from '@models/Student.model';
import sequelize from '@config/database';
import smsService from '@services/sms.service';
import pdfService from '@services/pdf.service';
import studentIdService from '@modules/student/studentId.service';

/**
 * Admission Service Tests
 * Tests the admission workflow service with state transitions, SMS notifications, and PDF generation
 * Requirements: 3.8, 3.10, 3.11
 */

// Mock services
jest.mock('@services/sms.service');
jest.mock('@services/pdf.service');
jest.mock('@modules/student/studentId.service');

describe('Admission Service', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Admission.destroy({ where: {}, force: true, truncate: true });
    await Student.destroy({ where: {}, force: true, truncate: true });
    jest.clearAllMocks();
  });

  describe('createInquiry', () => {
    it('should create inquiry and send SMS notification', async () => {
      const inquiryData = {
        firstNameEn: 'Ram',
        lastNameEn: 'Sharma',
        applyingForClass: 1,
        guardianPhone: '9841234567'
      };

      const admission = await admissionService.createInquiry(inquiryData);

      expect(admission).toBeDefined();
      expect(admission.status).toBe(AdmissionStatus.INQUIRY);
      expect(admission.temporaryId).toMatch(/^SCH001-INQ-\d{4}-\d{4}$/);
      expect(smsService.sendAdmissionNotification).toHaveBeenCalledWith(
        '9841234567',
        'inquiry',
        expect.objectContaining({
          applicantName: 'Ram Sharma',
          temporaryId: admission.temporaryId
        })
      );
    });

    it('should create inquiry without SMS if no phone provided', async () => {
      const inquiryData = {
        firstNameEn: 'Ram',
        lastNameEn: 'Sharma',
        applyingForClass: 1
      };

      const admission = await admissionService.createInquiry(inquiryData);

      expect(admission).toBeDefined();
      expect(smsService.sendAdmissionNotification).not.toHaveBeenCalled();
    });
  });

  describe('convertToApplication', () => {
    it('should convert inquiry to application and send SMS', async () => {
      const admission = await Admission.create({
        temporaryId: 'INQ-001',
        firstNameEn: 'Ram',
        lastNameEn: 'Sharma',
        applyingForClass: 1,
        inquiryDate: new Date(),
        status: AdmissionStatus.INQUIRY,
        applicationFeePaid: false,
        documentsVerified: false,
        guardianPhone: '9841234567'
      });

      const applicationData = {
        fatherName: 'Hari Sharma',
        fatherPhone: '9841234568',
        applicationFee: 1000,
        applicationFeePaid: true
      };

      const updated = await admissionService.convertToApplication(
        admission.admissionId,
        applicationData
      );

      expect(updated.status).toBe(AdmissionStatus.APPLIED);
      expect(updated.fatherName).toBe('Hari Sharma');
      expect(updated.applicationFeePaid).toBe(true);
      expect(smsService.sendAdmissionNotification).toHaveBeenCalledWith(
        '9841234567',
        'application',
        expect.any(Object)
      );
    });

    it('should throw error if admission not found', async () => {
      await expect(
        admissionService.convertToApplication(999, {})
      ).rejects.toThrow('Admission not found');
    });

    it('should throw error if invalid state transition', async () => {
      const admission = await Admission.create({
        temporaryId: 'INQ-002',
        firstNameEn: 'Ram',
        lastNameEn: 'Sharma',
        applyingForClass: 1,
        inquiryDate: new Date(),
        status: AdmissionStatus.ENROLLED,
        applicationFeePaid: false,
        documentsVerified: false
      });

      await expect(
        admissionService.convertToApplication(admission.admissionId, {})
      ).rejects.toThrow('Cannot convert to application from status');
    });
  });

  describe('scheduleTest', () => {
    it('should schedule test and send SMS notification', async () => {
      const admission = await Admission.create({
        temporaryId: 'INQ-003',
        firstNameEn: 'Ram',
        lastNameEn: 'Sharma',
        applyingForClass: 1,
        inquiryDate: new Date(),
        status: AdmissionStatus.APPLIED,
        applicationFeePaid: true,
        documentsVerified: false,
        guardianPhone: '9841234567'
      });

      const testDate = new Date('2024-02-15');
      const updated = await admissionService.scheduleTest(admission.admissionId, testDate);

      expect(updated.status).toBe(AdmissionStatus.TEST_SCHEDULED);
      expect(updated.admissionTestDate).toEqual(testDate);
      expect(smsService.sendAdmissionNotification).toHaveBeenCalledWith(
        '9841234567',
        'test_scheduled',
        expect.objectContaining({
          testDate
        })
      );
    });
  });

  describe('recordTestScore', () => {
    it('should record test score and update status', async () => {
      const admission = await Admission.create({
        temporaryId: 'INQ-004',
        firstNameEn: 'Ram',
        lastNameEn: 'Sharma',
        applyingForClass: 1,
        inquiryDate: new Date(),
        status: AdmissionStatus.TEST_SCHEDULED,
        applicationFeePaid: true,
        documentsVerified: false
      });

      const scoreData = {
        score: 85,
        maxScore: 100,
        remarks: 'Good performance'
      };

      const updated = await admissionService.recordTestScore(admission.admissionId, scoreData);

      expect(updated.status).toBe(AdmissionStatus.TESTED);
      expect(updated.admissionTestScore).toBe(85);
      expect(updated.admissionTestMaxScore).toBe(100);
      expect(updated.admissionTestRemarks).toBe('Good performance');
    });

    it('should throw error if not in TEST_SCHEDULED status', async () => {
      const admission = await Admission.create({
        temporaryId: 'INQ-005',
        firstNameEn: 'Ram',
        lastNameEn: 'Sharma',
        applyingForClass: 1,
        inquiryDate: new Date(),
        status: AdmissionStatus.INQUIRY,
        applicationFeePaid: false,
        documentsVerified: false
      });

      await expect(
        admissionService.recordTestScore(admission.admissionId, { score: 85, maxScore: 100 })
      ).rejects.toThrow('Cannot record test score for status');
    });
  });

  describe('scheduleInterview', () => {
    it('should schedule interview and send SMS notification', async () => {
      const admission = await Admission.create({
        temporaryId: 'INQ-006',
        firstNameEn: 'Ram',
        lastNameEn: 'Sharma',
        applyingForClass: 1,
        inquiryDate: new Date(),
        status: AdmissionStatus.TESTED,
        applicationFeePaid: true,
        documentsVerified: false,
        fatherPhone: '9841234568'
      });

      const interviewDate = new Date('2024-02-20');
      const updated = await admissionService.scheduleInterview(
        admission.admissionId,
        interviewDate,
        'Principal Name'
      );

      expect(updated.status).toBe(AdmissionStatus.INTERVIEW_SCHEDULED);
      expect(updated.interviewDate).toEqual(interviewDate);
      expect(updated.interviewerName).toBe('Principal Name');
      expect(smsService.sendAdmissionNotification).toHaveBeenCalledWith(
        '9841234568',
        'interview_scheduled',
        expect.objectContaining({
          interviewDate
        })
      );
    });
  });

  describe('recordInterview', () => {
    it('should record interview feedback and update status', async () => {
      const admission = await Admission.create({
        temporaryId: 'INQ-007',
        firstNameEn: 'Ram',
        lastNameEn: 'Sharma',
        applyingForClass: 1,
        inquiryDate: new Date(),
        status: AdmissionStatus.INTERVIEW_SCHEDULED,
        applicationFeePaid: true,
        documentsVerified: false
      });

      const interviewData = {
        feedback: 'Excellent candidate',
        score: 9
      };

      const updated = await admissionService.recordInterview(admission.admissionId, interviewData);

      expect(updated.status).toBe(AdmissionStatus.INTERVIEWED);
      expect(updated.interviewFeedback).toBe('Excellent candidate');
      expect(updated.interviewScore).toBe(9);
    });
  });

  describe('admit', () => {
    it('should admit applicant, generate PDF, and send SMS', async () => {
      const admission = await Admission.create({
        temporaryId: 'INQ-008',
        firstNameEn: 'Ram',
        lastNameEn: 'Sharma',
        applyingForClass: 1,
        inquiryDate: new Date(),
        status: AdmissionStatus.INTERVIEWED,
        applicationFeePaid: true,
        documentsVerified: true,
        motherPhone: '9841234569'
      });

      const mockPdfUrl = '/uploads/documents/admission-letters/offer-INQ-008.pdf';
      (pdfService.generateAdmissionOfferLetter as jest.Mock).mockResolvedValue(mockPdfUrl);

      const updated = await admissionService.admit(admission.admissionId);

      expect(updated.status).toBe(AdmissionStatus.ADMITTED);
      expect(updated.admissionDate).toBeDefined();
      expect(updated.admissionOfferLetterUrl).toBe(mockPdfUrl);
      
      expect(pdfService.generateAdmissionOfferLetter).toHaveBeenCalledWith(
        expect.objectContaining({
          temporaryId: 'INQ-008',
          applicantName: 'Ram Sharma',
          applyingForClass: 1
        })
      );

      expect(smsService.sendAdmissionNotification).toHaveBeenCalledWith(
        '9841234569',
        'admitted',
        expect.any(Object)
      );
    });

    it('should throw error if cannot transition to admitted', async () => {
      const admission = await Admission.create({
        temporaryId: 'INQ-009',
        firstNameEn: 'Ram',
        lastNameEn: 'Sharma',
        applyingForClass: 1,
        inquiryDate: new Date(),
        status: AdmissionStatus.INQUIRY,
        applicationFeePaid: false,
        documentsVerified: false
      });

      await expect(
        admissionService.admit(admission.admissionId)
      ).rejects.toThrow('Cannot admit from status');
    });
  });

  describe('enroll', () => {
    it('should enroll admitted applicant as student and send SMS', async () => {
      const admission = await Admission.create({
        temporaryId: 'INQ-010',
        firstNameEn: 'Ram',
        middleNameEn: 'Kumar',
        lastNameEn: 'Sharma',
        firstNameNp: 'राम',
        lastNameNp: 'शर्मा',
        dateOfBirthBS: '2060-05-15',
        dateOfBirthAD: new Date('2003-08-30'),
        gender: 'male',
        addressEn: 'Kathmandu',
        phone: '9841234567',
        fatherName: 'Hari Sharma',
        fatherPhone: '9841234568',
        motherName: 'Sita Sharma',
        motherPhone: '9841234569',
        applyingForClass: 1,
        inquiryDate: new Date(),
        status: AdmissionStatus.ADMITTED,
        admissionDate: new Date(),
        applicationFeePaid: true,
        documentsVerified: true
      });

      const mockStudentCode = 'SCH001-2024-0001';
      (studentIdService.generateStudentId as jest.Mock).mockResolvedValue(mockStudentCode);

      const result = await admissionService.enroll(admission.admissionId, {
        currentClassId: 1,
        rollNumber: 1
      });

      expect(result.admission.status).toBe(AdmissionStatus.ENROLLED);
      expect(result.admission.enrolledStudentId).toBe(result.student.studentId);
      expect(result.admission.enrollmentDate).toBeDefined();

      expect(result.student).toBeDefined();
      expect(result.student.studentCode).toBe(mockStudentCode);
      expect(result.student.firstNameEn).toBe('Ram');
      expect(result.student.lastNameEn).toBe('Sharma');
      expect(result.student.admissionClass).toBe(1);

      expect(smsService.sendAdmissionNotification).toHaveBeenCalledWith(
        expect.any(String),
        'enrolled',
        expect.any(Object)
      );
    });

    it('should throw error if not in admitted status', async () => {
      const admission = await Admission.create({
        temporaryId: 'INQ-011',
        firstNameEn: 'Ram',
        lastNameEn: 'Sharma',
        applyingForClass: 1,
        inquiryDate: new Date(),
        status: AdmissionStatus.APPLIED,
        applicationFeePaid: true,
        documentsVerified: false
      });

      await expect(
        admissionService.enroll(admission.admissionId, {})
      ).rejects.toThrow('Cannot enroll from status');
    });
  });

  describe('reject', () => {
    it('should reject applicant with reason', async () => {
      const admission = await Admission.create({
        temporaryId: 'INQ-012',
        firstNameEn: 'Ram',
        lastNameEn: 'Sharma',
        applyingForClass: 1,
        inquiryDate: new Date(),
        status: AdmissionStatus.TESTED,
        applicationFeePaid: true,
        documentsVerified: false
      });

      const updated = await admissionService.reject(
        admission.admissionId,
        'Did not meet minimum test score'
      );

      expect(updated.status).toBe(AdmissionStatus.REJECTED);
      expect(updated.rejectionReason).toBe('Did not meet minimum test score');
      expect(updated.rejectionDate).toBeDefined();
    });
  });

  describe('findAll', () => {
    beforeEach(async () => {
      await Admission.create({
        temporaryId: 'INQ-013',
        firstNameEn: 'Ram',
        lastNameEn: 'Sharma',
        applyingForClass: 1,
        inquiryDate: new Date(),
        status: AdmissionStatus.INQUIRY,
        applicationFeePaid: false,
        documentsVerified: false
      });

      await Admission.create({
        temporaryId: 'INQ-014',
        firstNameEn: 'Sita',
        lastNameEn: 'Thapa',
        applyingForClass: 1,
        inquiryDate: new Date(),
        status: AdmissionStatus.APPLIED,
        applicationFeePaid: true,
        documentsVerified: false
      });

      await Admission.create({
        temporaryId: 'INQ-015',
        firstNameEn: 'Hari',
        lastNameEn: 'Rai',
        applyingForClass: 5,
        inquiryDate: new Date(),
        status: AdmissionStatus.ADMITTED,
        applicationFeePaid: true,
        documentsVerified: true
      });
    });

    it('should return all admissions without filters', async () => {
      const result = await admissionService.findAll();

      expect(result.admissions).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it('should filter by status', async () => {
      const result = await admissionService.findAll({
        status: AdmissionStatus.INQUIRY
      });

      expect(result.admissions).toHaveLength(1);
      expect(result.admissions[0].status).toBe(AdmissionStatus.INQUIRY);
    });

    it('should filter by applying class', async () => {
      const result = await admissionService.findAll({
        applyingForClass: 5
      });

      expect(result.admissions).toHaveLength(1);
      expect(result.admissions[0].applyingForClass).toBe(5);
    });

    it('should search by name', async () => {
      const result = await admissionService.findAll({
        search: 'Sita'
      });

      expect(result.admissions).toHaveLength(1);
      expect(result.admissions[0].firstNameEn).toBe('Sita');
    });

    it('should support pagination', async () => {
      const result = await admissionService.findAll({}, {
        limit: 2,
        offset: 0
      });

      expect(result.admissions).toHaveLength(2);
      expect(result.total).toBe(3);
    });
  });

  describe('getStatistics', () => {
    beforeEach(async () => {
      await Admission.create({
        temporaryId: 'INQ-016',
        firstNameEn: 'Student1',
        lastNameEn: 'Test',
        applyingForClass: 1,
        inquiryDate: new Date(),
        status: AdmissionStatus.INQUIRY,
        applicationFeePaid: false,
        documentsVerified: false
      });

      await Admission.create({
        temporaryId: 'INQ-017',
        firstNameEn: 'Student2',
        lastNameEn: 'Test',
        applyingForClass: 1,
        inquiryDate: new Date(),
        status: AdmissionStatus.APPLIED,
        applicationFeePaid: true,
        documentsVerified: false
      });

      await Admission.create({
        temporaryId: 'INQ-018',
        firstNameEn: 'Student3',
        lastNameEn: 'Test',
        applyingForClass: 5,
        inquiryDate: new Date(),
        status: AdmissionStatus.ADMITTED,
        applicationFeePaid: true,
        documentsVerified: true
      });
    });

    it('should return admission statistics', async () => {
      const stats = await admissionService.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.byStatus[AdmissionStatus.INQUIRY]).toBe(1);
      expect(stats.byStatus[AdmissionStatus.APPLIED]).toBe(1);
      expect(stats.byStatus[AdmissionStatus.ADMITTED]).toBe(1);
      expect(stats.byClass[1]).toBe(2);
      expect(stats.byClass[5]).toBe(1);
    });
  });

  describe('Complete Workflow Integration', () => {
    it('should complete full admission workflow from inquiry to enrollment', async () => {
      // Step 1: Create inquiry
      const inquiry = await admissionService.createInquiry({
        firstNameEn: 'Ram',
        lastNameEn: 'Sharma',
        applyingForClass: 1,
        guardianPhone: '9841234567'
      });

      expect(inquiry.status).toBe(AdmissionStatus.INQUIRY);

      // Step 2: Convert to application
      const application = await admissionService.convertToApplication(inquiry.admissionId, {
        fatherName: 'Hari Sharma',
        fatherPhone: '9841234568',
        applicationFee: 1000,
        applicationFeePaid: true
      });

      expect(application.status).toBe(AdmissionStatus.APPLIED);

      // Step 3: Schedule and record test
      const testScheduled = await admissionService.scheduleTest(
        application.admissionId,
        new Date('2024-02-15')
      );
      expect(testScheduled.status).toBe(AdmissionStatus.TEST_SCHEDULED);

      const tested = await admissionService.recordTestScore(testScheduled.admissionId, {
        score: 85,
        maxScore: 100
      });
      expect(tested.status).toBe(AdmissionStatus.TESTED);

      // Step 4: Schedule and record interview
      const interviewScheduled = await admissionService.scheduleInterview(
        tested.admissionId,
        new Date('2024-02-20')
      );
      expect(interviewScheduled.status).toBe(AdmissionStatus.INTERVIEW_SCHEDULED);

      const interviewed = await admissionService.recordInterview(interviewScheduled.admissionId, {
        feedback: 'Excellent',
        score: 9
      });
      expect(interviewed.status).toBe(AdmissionStatus.INTERVIEWED);

      // Step 5: Admit
      const mockPdfUrl = '/uploads/documents/admission-letters/offer.pdf';
      (pdfService.generateAdmissionOfferLetter as jest.Mock).mockResolvedValue(mockPdfUrl);

      const admitted = await admissionService.admit(interviewed.admissionId);
      expect(admitted.status).toBe(AdmissionStatus.ADMITTED);
      expect(admitted.admissionOfferLetterUrl).toBe(mockPdfUrl);

      // Step 6: Enroll
      const mockStudentCode = 'SCH001-2024-0001';
      (studentIdService.generateStudentId as jest.Mock).mockResolvedValue(mockStudentCode);

      const enrolled = await admissionService.enroll(admitted.admissionId, {
        currentClassId: 1,
        rollNumber: 1
      });

      expect(enrolled.admission.status).toBe(AdmissionStatus.ENROLLED);
      expect(enrolled.student).toBeDefined();
      expect(enrolled.student.studentCode).toBe(mockStudentCode);

      // Verify SMS notifications were sent at each stage
      expect(smsService.sendAdmissionNotification).toHaveBeenCalledTimes(6);
    });
  });
});

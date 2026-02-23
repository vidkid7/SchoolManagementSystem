import Admission, { AdmissionStatus } from '@models/Admission.model';
import sequelize from '@config/database';

/**
 * Admission Model Tests
 * Tests the StudentAdmission entity with workflow states
 * Requirements: 3.1, 3.2, 3.9
 */

describe('Admission Model', () => {
  // Setup: Create tables before all tests
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  // Cleanup: Close connection after all tests
  afterAll(async () => {
    await sequelize.close();
  });

  // Clear data before each test
  beforeEach(async () => {
    await Admission.destroy({ where: {}, force: true, truncate: true });
  });

  // Helper function to create test admission data
  const createTestAdmissionData = (overrides = {}) => ({
    temporaryId: `INQ-${Date.now()}`,
    firstNameEn: 'Ram',
    lastNameEn: 'Sharma',
    applyingForClass: 1,
    inquiryDate: new Date(),
    status: AdmissionStatus.INQUIRY,
    applicationFeePaid: false,
    documentsVerified: false,
    ...overrides
  });

  describe('Model Creation', () => {
    it('should create admission record with required fields', async () => {
      const admissionData = createTestAdmissionData();

      const admission = await Admission.create(admissionData);

      expect(admission).toBeDefined();
      expect(admission.get('admissionId')).toBeDefined();
      expect(admission.get('temporaryId')).toBe(admissionData.temporaryId);
      expect(admission.get('firstNameEn')).toBe('Ram');
      expect(admission.get('lastNameEn')).toBe('Sharma');
      expect(admission.get('applyingForClass')).toBe(1);
      expect(admission.get('status')).toBe(AdmissionStatus.INQUIRY);
      expect(admission.get('applicationFeePaid')).toBe(false);
      expect(admission.get('documentsVerified')).toBe(false);
    });

    it('should create admission with all optional fields', async () => {
      const admissionData = createTestAdmissionData({
        middleNameEn: 'Kumar',
        firstNameNp: 'राम',
        lastNameNp: 'शर्मा',
        dateOfBirthBS: '2060-05-15',
        dateOfBirthAD: new Date('2003-08-30'),
        gender: 'male',
        addressEn: 'Kathmandu',
        addressNp: 'काठमाडौं',
        phone: '9841234567',
        email: 'ram@example.com',
        fatherName: 'Hari Sharma',
        fatherPhone: '9841234568',
        motherName: 'Sita Sharma',
        motherPhone: '9841234569',
        guardianName: 'Local Guardian',
        guardianPhone: '9841234570',
        guardianRelation: 'Uncle',
        previousSchool: 'ABC School',
        previousClass: 5,
        previousGpa: 3.5,
        inquirySource: 'online',
        inquiryNotes: 'Interested in science stream'
      });

      const admission = await Admission.create(admissionData);

      expect(admission.get('middleNameEn')).toBe('Kumar');
      expect(admission.get('firstNameNp')).toBe('राम');
      expect(admission.get('dateOfBirthBS')).toBe('2060-05-15');
      expect(admission.get('gender')).toBe('male');
      expect(admission.get('phone')).toBe('9841234567');
      expect(admission.get('fatherName')).toBe('Hari Sharma');
      expect(admission.get('previousSchool')).toBe('ABC School');
      expect(admission.get('inquirySource')).toBe('online');
    });

    it('should enforce unique temporary_id constraint', async () => {
      const admissionData = createTestAdmissionData({ temporaryId: 'INQ-UNIQUE-001' });
      await Admission.create(admissionData);

      await expect(
        Admission.create(admissionData)
      ).rejects.toThrow();
    });

    it('should validate applying_for_class range (1-12)', async () => {
      const invalidData = createTestAdmissionData({ applyingForClass: 13 });

      await expect(
        Admission.create(invalidData)
      ).rejects.toThrow();
    });

    it('should set default status to INQUIRY', async () => {
      const admissionData = createTestAdmissionData();
      delete (admissionData as any).status;

      const admission = await Admission.create(admissionData);

      expect(admission.get('status')).toBe(AdmissionStatus.INQUIRY);
    });

    it('should set default applicationFeePaid to false', async () => {
      const admissionData = createTestAdmissionData();
      delete (admissionData as any).applicationFeePaid;

      const admission = await Admission.create(admissionData);

      expect(admission.get('applicationFeePaid')).toBe(false);
    });

    it('should set default documentsVerified to false', async () => {
      const admissionData = createTestAdmissionData();
      delete (admissionData as any).documentsVerified;

      const admission = await Admission.create(admissionData);

      expect(admission.get('documentsVerified')).toBe(false);
    });
  });

  describe('Workflow State Machine', () => {
    it('should support inquiry → application transition', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        status: AdmissionStatus.INQUIRY
      }));

      expect(admission.canTransitionTo(AdmissionStatus.APPLIED)).toBe(true);
    });

    it('should support application → test transition', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        status: AdmissionStatus.APPLIED
      }));

      expect(admission.canTransitionTo(AdmissionStatus.TEST_SCHEDULED)).toBe(true);
    });

    it('should support test → interview transition', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        status: AdmissionStatus.TESTED
      }));

      expect(admission.canTransitionTo(AdmissionStatus.INTERVIEW_SCHEDULED)).toBe(true);
    });

    it('should support interview → admission transition', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        status: AdmissionStatus.INTERVIEWED
      }));

      expect(admission.canTransitionTo(AdmissionStatus.ADMITTED)).toBe(true);
    });

    it('should support admission → enrollment transition', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        status: AdmissionStatus.ADMITTED
      }));

      expect(admission.canTransitionTo(AdmissionStatus.ENROLLED)).toBe(true);
    });

    it('should allow rejection from any stage', async () => {
      const statuses = [
        AdmissionStatus.INQUIRY,
        AdmissionStatus.APPLIED,
        AdmissionStatus.TEST_SCHEDULED,
        AdmissionStatus.TESTED,
        AdmissionStatus.INTERVIEW_SCHEDULED,
        AdmissionStatus.INTERVIEWED
      ];

      for (const status of statuses) {
        const admission = await Admission.create(createTestAdmissionData({
          temporaryId: `INQ-${status}-${Date.now()}`,
          status
        }));

        expect(admission.canTransitionTo(AdmissionStatus.REJECTED)).toBe(true);
      }
    });

    it('should not allow transition from enrolled state', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        status: AdmissionStatus.ENROLLED
      }));

      expect(admission.canTransitionTo(AdmissionStatus.INQUIRY)).toBe(false);
      expect(admission.canTransitionTo(AdmissionStatus.APPLIED)).toBe(false);
      expect(admission.canTransitionTo(AdmissionStatus.REJECTED)).toBe(false);
    });

    it('should not allow transition from rejected state', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        status: AdmissionStatus.REJECTED
      }));

      expect(admission.canTransitionTo(AdmissionStatus.APPLIED)).toBe(false);
      expect(admission.canTransitionTo(AdmissionStatus.ADMITTED)).toBe(false);
    });

    it('should not allow invalid transitions', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        status: AdmissionStatus.INQUIRY
      }));

      // Cannot skip directly to enrolled
      expect(admission.canTransitionTo(AdmissionStatus.ENROLLED)).toBe(false);
      // Cannot go to test_scheduled without applying
      expect(admission.canTransitionTo(AdmissionStatus.TEST_SCHEDULED)).toBe(false);
    });
  });

  describe('Document Verification Status', () => {
    it('should track documents_verified status', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        documentsVerified: false
      }));

      expect(admission.get('documentsVerified')).toBe(false);

      await admission.update({
        documentsVerified: true,
        documentsNotes: 'All documents verified'
      });

      // Check the updated instance
      expect(admission.get('documentsVerified')).toBe(true);
      expect(admission.get('documentsNotes')).toBe('All documents verified');
    });

    it('should allow storing document verification notes', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        documentsVerified: false,
        documentsNotes: 'Birth certificate pending'
      }));

      expect(admission.get('documentsNotes')).toBe('Birth certificate pending');
    });
  });

  describe('Application Fee Payment Status', () => {
    it('should track application_fee_paid status', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        applicationFee: 1000,
        applicationFeePaid: false
      }));

      expect(admission.get('applicationFeePaid')).toBe(false);
      expect(admission.get('applicationFee')).toBe(1000);

      await admission.update({ applicationFeePaid: true });

      // Check the updated instance
      expect(admission.get('applicationFeePaid')).toBe(true);
    });

    it('should store application fee amount', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        applicationFee: 1500.50,
        applicationFeePaid: true
      }));

      expect(admission.get('applicationFee')).toBe(1500.50);
      expect(admission.get('applicationFeePaid')).toBe(true);
    });
  });

  describe('Admission Test Tracking', () => {
    it('should store admission test details', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        status: AdmissionStatus.TESTED,
        admissionTestDate: new Date('2024-01-15'),
        admissionTestScore: 85,
        admissionTestMaxScore: 100,
        admissionTestRemarks: 'Good performance'
      }));

      expect(admission.get('admissionTestDate')).toBeDefined();
      expect(admission.get('admissionTestScore')).toBe(85);
      expect(admission.get('admissionTestMaxScore')).toBe(100);
      expect(admission.get('admissionTestRemarks')).toBe('Good performance');
    });

    it('should allow decimal test scores', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        admissionTestScore: 87.5,
        admissionTestMaxScore: 100
      }));

      expect(admission.get('admissionTestScore')).toBe(87.5);
    });
  });

  describe('Interview Tracking', () => {
    it('should store interview details', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        status: AdmissionStatus.INTERVIEWED,
        interviewDate: new Date('2024-01-20'),
        interviewerName: 'Principal Name',
        interviewFeedback: 'Confident and well-prepared',
        interviewScore: 8
      }));

      expect(admission.get('interviewDate')).toBeDefined();
      expect(admission.get('interviewerName')).toBe('Principal Name');
      expect(admission.get('interviewFeedback')).toBe('Confident and well-prepared');
      expect(admission.get('interviewScore')).toBe(8);
    });
  });

  describe('Admission and Enrollment', () => {
    it('should store admission date and offer letter URL', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        status: AdmissionStatus.ADMITTED,
        admissionDate: new Date('2024-01-25'),
        admissionOfferLetterUrl: '/documents/offer-letters/2024-001.pdf'
      }));

      expect(admission.get('admissionDate')).toBeDefined();
      expect(admission.get('admissionOfferLetterUrl')).toBe('/documents/offer-letters/2024-001.pdf');
    });

    it('should link to enrolled student record', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        status: AdmissionStatus.ENROLLED,
        enrolledStudentId: 123,
        enrollmentDate: new Date('2024-02-01')
      }));

      expect(admission.get('enrolledStudentId')).toBe(123);
      expect(admission.get('enrollmentDate')).toBeDefined();
    });
  });

  describe('Rejection Tracking', () => {
    it('should store rejection details', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        status: AdmissionStatus.REJECTED,
        rejectionReason: 'Did not meet minimum test score',
        rejectionDate: new Date('2024-01-18')
      }));

      expect(admission.get('rejectionReason')).toBe('Did not meet minimum test score');
      expect(admission.get('rejectionDate')).toBeDefined();
    });
  });

  describe('Helper Methods', () => {
    it('should return full name in English', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        firstNameEn: 'Ram',
        middleNameEn: 'Kumar',
        lastNameEn: 'Sharma'
      }));

      expect(admission.getFullNameEn()).toBe('Ram Kumar Sharma');
    });

    it('should return full name without middle name', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        firstNameEn: 'Ram',
        lastNameEn: 'Sharma'
      }));

      expect(admission.getFullNameEn()).toBe('Ram Sharma');
    });
  });

  describe('Metadata Fields', () => {
    it('should store processed_by user ID', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        processedBy: 5
      }));

      expect(admission.get('processedBy')).toBe(5);
    });

    it('should link to academic year', async () => {
      const admission = await Admission.create(createTestAdmissionData({
        academicYearId: 10
      }));

      expect(admission.get('academicYearId')).toBe(10);
    });

    it('should auto-populate timestamps', async () => {
      const admission = await Admission.create(createTestAdmissionData());

      expect(admission.get('createdAt')).toBeDefined();
      expect(admission.get('updatedAt')).toBeDefined();
      expect(admission.get('createdAt')).toBeInstanceOf(Date);
      expect(admission.get('updatedAt')).toBeInstanceOf(Date);
    });

    it('should update updatedAt on modification', async () => {
      const admission = await Admission.create(createTestAdmissionData());
      const originalUpdatedAt = admission.get('updatedAt') as Date;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      await admission.update({ phone: '9841111111' });

      const updatedAt = admission.get('updatedAt') as Date;
      expect(updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('Query and Filtering', () => {
    beforeEach(async () => {
      await Admission.create(createTestAdmissionData({
        temporaryId: 'INQ-001',
        status: AdmissionStatus.INQUIRY,
        applyingForClass: 1
      }));
      await Admission.create(createTestAdmissionData({
        temporaryId: 'INQ-002',
        status: AdmissionStatus.APPLIED,
        applyingForClass: 1
      }));
      await Admission.create(createTestAdmissionData({
        temporaryId: 'INQ-003',
        status: AdmissionStatus.ADMITTED,
        applyingForClass: 5
      }));
    });

    it('should filter by status', async () => {
      const inquiries = await Admission.findAll({
        where: { status: AdmissionStatus.INQUIRY }
      });

      expect(inquiries).toHaveLength(1);
      expect(inquiries[0].get('status')).toBe(AdmissionStatus.INQUIRY);
    });

    it('should filter by applying_for_class', async () => {
      const class1Admissions = await Admission.findAll({
        where: { applyingForClass: 1 }
      });

      expect(class1Admissions).toHaveLength(2);
    });

    it('should find by temporary_id', async () => {
      const admission = await Admission.findOne({
        where: { temporaryId: 'INQ-001' }
      });

      expect(admission).toBeDefined();
      expect(admission?.get('temporaryId')).toBe('INQ-001');
    });
  });

  describe('Complete Workflow Scenario', () => {
    it('should track complete admission workflow from inquiry to enrollment', async () => {
      // Step 1: Create inquiry
      const admission = await Admission.create(createTestAdmissionData({
        temporaryId: 'INQ-WORKFLOW-001',
        firstNameEn: 'Test',
        lastNameEn: 'Student',
        applyingForClass: 1,
        inquiryDate: new Date(),
        inquirySource: 'online',
        status: AdmissionStatus.INQUIRY
      }));

      expect(admission.get('status')).toBe(AdmissionStatus.INQUIRY);

      // Step 2: Convert to application
      await admission.update({
        status: AdmissionStatus.APPLIED,
        applicationDate: new Date(),
        applicationFee: 1000,
        applicationFeePaid: true
      });

      expect(admission.get('status')).toBe(AdmissionStatus.APPLIED);
      expect(admission.get('applicationFeePaid')).toBe(true);

      // Step 3: Schedule and complete test
      await admission.update({
        status: AdmissionStatus.TEST_SCHEDULED,
        admissionTestDate: new Date()
      });

      await admission.update({
        status: AdmissionStatus.TESTED,
        admissionTestScore: 85,
        admissionTestMaxScore: 100
      });

      expect(admission.get('status')).toBe(AdmissionStatus.TESTED);
      expect(admission.get('admissionTestScore')).toBe(85);

      // Step 4: Schedule and complete interview
      await admission.update({
        status: AdmissionStatus.INTERVIEW_SCHEDULED,
        interviewDate: new Date()
      });

      await admission.update({
        status: AdmissionStatus.INTERVIEWED,
        interviewFeedback: 'Excellent candidate',
        interviewScore: 9
      });

      expect(admission.get('status')).toBe(AdmissionStatus.INTERVIEWED);

      // Step 5: Admit student
      await admission.update({
        status: AdmissionStatus.ADMITTED,
        admissionDate: new Date(),
        documentsVerified: true
      });

      expect(admission.get('status')).toBe(AdmissionStatus.ADMITTED);
      expect(admission.get('documentsVerified')).toBe(true);

      // Step 6: Enroll student
      await admission.update({
        status: AdmissionStatus.ENROLLED,
        enrolledStudentId: 456,
        enrollmentDate: new Date()
      });

      // Check the updated instance
      expect(admission.get('status')).toBe(AdmissionStatus.ENROLLED);
      expect(admission.get('enrolledStudentId')).toBe(456);
    });
  });
});

import { Sequelize } from 'sequelize';
import Student, { Gender, StudentStatus } from '../Student.model';
import { decrypt } from '@utils/encryption';

describe('Student Model - Data Encryption', () => {
  let sequelize: Sequelize;

  beforeAll(async () => {
    // Use the actual database connection for testing
    // This ensures hooks are properly registered
    const { default: testSequelize } = await import('@config/database');
    sequelize = testSequelize;

    // Sync database
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    // Don't close the connection as it's shared
  });

  afterEach(async () => {
    // Clean up after each test
    await Student.destroy({ where: {}, force: true });
  });

  describe('Citizenship Number Encryption', () => {
    it('should encrypt father citizenship number on create', async () => {
      const plainCitizenship = '12-34-56-7890';
      
      const student = await Student.create({
        studentCode: 'STU001',
        userId: 1,
        firstNameEn: 'John',
        lastNameEn: 'Doe',
        firstNameNp: 'जोन',
        lastNameNp: 'डो',
        dateOfBirthBS: '2060-01-01',
        dateOfBirthAD: new Date('2003-04-14'),
        gender: Gender.MALE,
        addressEn: 'Kathmandu',
        addressNp: 'काठमाडौं',
        fatherName: 'Father Name',
        fatherPhone: '9841234567',
        fatherCitizenshipNo: plainCitizenship,
        motherName: 'Mother Name',
        motherPhone: '9841234568',
        emergencyContact: '9841234569',
        admissionDate: new Date(),
        admissionClass: 1,
        status: StudentStatus.ACTIVE
      });

      // Fetch raw data from database to verify encryption
      const rawData = await sequelize.query(
        'SELECT father_citizenship_no FROM students WHERE student_code = ?',
        {
          replacements: ['STU001'],
          type: 'SELECT'
        }
      );

      const storedValue = (rawData[0] as any).father_citizenship_no;

      // Stored value should be encrypted (not plaintext)
      expect(storedValue).not.toBe(plainCitizenship);
      expect(storedValue).toContain(':'); // Encrypted format: IV:ciphertext

      // Decrypted value should match original
      expect(decrypt(storedValue)).toBe(plainCitizenship);

      // Model instance should have decrypted value (via afterFind hook)
      const foundStudent = await Student.findByPk(student.studentId);
      expect(foundStudent?.fatherCitizenshipNo).toBe(plainCitizenship);
    });

    it('should encrypt mother citizenship number on create', async () => {
      const plainCitizenship = '98-76-54-3210';
      
      const student = await Student.create({
        studentCode: 'STU002',
        userId: 2,
        firstNameEn: 'Jane',
        lastNameEn: 'Doe',
        firstNameNp: 'जेन',
        lastNameNp: 'डो',
        dateOfBirthBS: '2061-01-01',
        dateOfBirthAD: new Date('2004-04-14'),
        gender: Gender.FEMALE,
        addressEn: 'Pokhara',
        addressNp: 'पोखरा',
        fatherName: 'Father Name',
        fatherPhone: '9841234567',
        motherName: 'Mother Name',
        motherPhone: '9841234568',
        motherCitizenshipNo: plainCitizenship,
        emergencyContact: '9841234569',
        admissionDate: new Date(),
        admissionClass: 1,
        status: StudentStatus.ACTIVE
      });

      // Fetch raw data from database
      const rawData = await sequelize.query(
        'SELECT mother_citizenship_no FROM students WHERE student_code = ?',
        {
          replacements: ['STU002'],
          type: 'SELECT'
        }
      );

      const storedValue = (rawData[0] as any).mother_citizenship_no;

      // Verify encryption
      expect(storedValue).not.toBe(plainCitizenship);
      expect(storedValue).toContain(':');
      expect(decrypt(storedValue)).toBe(plainCitizenship);

      // Verify decryption on retrieval
      const foundStudent = await Student.findByPk(student.studentId);
      expect(foundStudent?.motherCitizenshipNo).toBe(plainCitizenship);
    });

    it('should encrypt both citizenship numbers when provided', async () => {
      const fatherCitizenship = '11-22-33-4455';
      const motherCitizenship = '55-44-33-2211';
      
      const student = await Student.create({
        studentCode: 'STU003',
        userId: 3,
        firstNameEn: 'Test',
        lastNameEn: 'Student',
        firstNameNp: 'टेस्ट',
        lastNameNp: 'विद्यार्थी',
        dateOfBirthBS: '2062-01-01',
        dateOfBirthAD: new Date('2005-04-14'),
        gender: Gender.MALE,
        addressEn: 'Lalitpur',
        addressNp: 'ललितपुर',
        fatherName: 'Father Name',
        fatherPhone: '9841234567',
        fatherCitizenshipNo: fatherCitizenship,
        motherName: 'Mother Name',
        motherPhone: '9841234568',
        motherCitizenshipNo: motherCitizenship,
        emergencyContact: '9841234569',
        admissionDate: new Date(),
        admissionClass: 1,
        status: StudentStatus.ACTIVE
      });

      // Verify both are encrypted in database
      const rawData = await sequelize.query(
        'SELECT father_citizenship_no, mother_citizenship_no FROM students WHERE student_code = ?',
        {
          replacements: ['STU003'],
          type: 'SELECT'
        }
      );

      const row = rawData[0] as any;
      
      expect(row.father_citizenship_no).not.toBe(fatherCitizenship);
      expect(row.mother_citizenship_no).not.toBe(motherCitizenship);
      expect(decrypt(row.father_citizenship_no)).toBe(fatherCitizenship);
      expect(decrypt(row.mother_citizenship_no)).toBe(motherCitizenship);

      // Verify both are decrypted on retrieval
      const foundStudent = await Student.findByPk(student.studentId);
      expect(foundStudent?.fatherCitizenshipNo).toBe(fatherCitizenship);
      expect(foundStudent?.motherCitizenshipNo).toBe(motherCitizenship);
    });

    it('should handle null citizenship numbers', async () => {
      const student = await Student.create({
        studentCode: 'STU004',
        userId: 4,
        firstNameEn: 'No',
        lastNameEn: 'Citizenship',
        firstNameNp: 'नो',
        lastNameNp: 'सिटिजनशिप',
        dateOfBirthBS: '2063-01-01',
        dateOfBirthAD: new Date('2006-04-14'),
        gender: Gender.FEMALE,
        addressEn: 'Bhaktapur',
        addressNp: 'भक्तपुर',
        fatherName: 'Father Name',
        fatherPhone: '9841234567',
        motherName: 'Mother Name',
        motherPhone: '9841234568',
        emergencyContact: '9841234569',
        admissionDate: new Date(),
        admissionClass: 1,
        status: StudentStatus.ACTIVE
      });

      // Verify null values are not encrypted
      const foundStudent = await Student.findByPk(student.studentId);
      expect(foundStudent?.fatherCitizenshipNo).toBeUndefined();
      expect(foundStudent?.motherCitizenshipNo).toBeUndefined();
    });

    it('should encrypt citizenship number on update', async () => {
      const student = await Student.create({
        studentCode: 'STU005',
        userId: 5,
        firstNameEn: 'Update',
        lastNameEn: 'Test',
        firstNameNp: 'अपडेट',
        lastNameNp: 'टेस्ट',
        dateOfBirthBS: '2064-01-01',
        dateOfBirthAD: new Date('2007-04-14'),
        gender: Gender.MALE,
        addressEn: 'Chitwan',
        addressNp: 'चितवन',
        fatherName: 'Father Name',
        fatherPhone: '9841234567',
        motherName: 'Mother Name',
        motherPhone: '9841234568',
        emergencyContact: '9841234569',
        admissionDate: new Date(),
        admissionClass: 1,
        status: StudentStatus.ACTIVE
      });

      // Update with citizenship number
      const newCitizenship = '99-88-77-6655';
      student.fatherCitizenshipNo = newCitizenship;
      await student.save();

      // Verify encryption in database
      const rawData = await sequelize.query(
        'SELECT father_citizenship_no FROM students WHERE student_code = ?',
        {
          replacements: ['STU005'],
          type: 'SELECT'
        }
      );

      const storedValue = (rawData[0] as any).father_citizenship_no;
      expect(storedValue).not.toBe(newCitizenship);
      expect(decrypt(storedValue)).toBe(newCitizenship);

      // Verify decryption on retrieval
      const foundStudent = await Student.findByPk(student.studentId);
      expect(foundStudent?.fatherCitizenshipNo).toBe(newCitizenship);
    });

    it('should not re-encrypt unchanged citizenship numbers on update', async () => {
      const citizenship = '77-66-55-4433';
      
      const student = await Student.create({
        studentCode: 'STU006',
        userId: 6,
        firstNameEn: 'Unchanged',
        lastNameEn: 'Test',
        firstNameNp: 'अनचेन्ज्ड',
        lastNameNp: 'टेस्ट',
        dateOfBirthBS: '2065-01-01',
        dateOfBirthAD: new Date('2008-04-14'),
        gender: Gender.FEMALE,
        addressEn: 'Butwal',
        addressNp: 'बुटवल',
        fatherName: 'Father Name',
        fatherPhone: '9841234567',
        fatherCitizenshipNo: citizenship,
        motherName: 'Mother Name',
        motherPhone: '9841234568',
        emergencyContact: '9841234569',
        admissionDate: new Date(),
        admissionClass: 1,
        status: StudentStatus.ACTIVE
      });

      // Get encrypted value from database
      const rawData1 = await sequelize.query(
        'SELECT father_citizenship_no FROM students WHERE student_code = ?',
        {
          replacements: ['STU006'],
          type: 'SELECT'
        }
      );
      const encryptedValue1 = (rawData1[0] as any).father_citizenship_no;

      // Update other field (not citizenship)
      student.addressEn = 'New Address';
      await student.save();

      // Get encrypted value again
      const rawData2 = await sequelize.query(
        'SELECT father_citizenship_no FROM students WHERE student_code = ?',
        {
          replacements: ['STU006'],
          type: 'SELECT'
        }
      );
      const encryptedValue2 = (rawData2[0] as any).father_citizenship_no;

      // Encrypted value should remain the same (not re-encrypted)
      expect(encryptedValue2).toBe(encryptedValue1);
      expect(decrypt(encryptedValue2)).toBe(citizenship);
    });

    it('should handle batch retrieval with encryption', async () => {
      const students = [
        {
          studentCode: 'STU007',
          userId: 7,
          firstNameEn: 'Batch',
          lastNameEn: 'One',
          firstNameNp: 'ब्याच',
          lastNameNp: 'वन',
          dateOfBirthBS: '2066-01-01',
          dateOfBirthAD: new Date('2009-04-14'),
          gender: Gender.MALE,
          addressEn: 'Biratnagar',
          addressNp: 'विराटनगर',
          fatherName: 'Father One',
          fatherPhone: '9841234567',
          fatherCitizenshipNo: '11-11-11-1111',
          motherName: 'Mother One',
          motherPhone: '9841234568',
          emergencyContact: '9841234569',
          admissionDate: new Date(),
          admissionClass: 1,
          status: StudentStatus.ACTIVE as const
        },
        {
          studentCode: 'STU008',
          userId: 8,
          firstNameEn: 'Batch',
          lastNameEn: 'Two',
          firstNameNp: 'ब्याच',
          lastNameNp: 'टू',
          dateOfBirthBS: '2067-01-01',
          dateOfBirthAD: new Date('2010-04-14'),
          gender: Gender.FEMALE,
          addressEn: 'Dharan',
          addressNp: 'धरान',
          fatherName: 'Father Two',
          fatherPhone: '9841234567',
          motherName: 'Mother Two',
          motherPhone: '9841234568',
          motherCitizenshipNo: '22-22-22-2222',
          emergencyContact: '9841234569',
          admissionDate: new Date(),
          admissionClass: 1,
          status: StudentStatus.ACTIVE as const
        }
      ];

      await Student.bulkCreate(students);

      // Retrieve all students
      const foundStudents = await Student.findAll({
        where: {
          studentCode: ['STU007', 'STU008']
        }
      });

      expect(foundStudents).toHaveLength(2);
      expect(foundStudents[0].fatherCitizenshipNo).toBe('11-11-11-1111');
      expect(foundStudents[1].motherCitizenshipNo).toBe('22-22-22-2222');
    });
  });

  describe('Security Properties', () => {
    it('should use different IVs for same citizenship number', async () => {
      const citizenship = '12-34-56-7890';
      
      // Create two students with same citizenship number
      await Student.create({
        studentCode: 'STU009',
        userId: 9,
        firstNameEn: 'Same',
        lastNameEn: 'One',
        firstNameNp: 'सेम',
        lastNameNp: 'वन',
        dateOfBirthBS: '2068-01-01',
        dateOfBirthAD: new Date('2011-04-14'),
        gender: Gender.MALE,
        addressEn: 'Hetauda',
        addressNp: 'हेटौडा',
        fatherName: 'Father Name',
        fatherPhone: '9841234567',
        fatherCitizenshipNo: citizenship,
        motherName: 'Mother Name',
        motherPhone: '9841234568',
        emergencyContact: '9841234569',
        admissionDate: new Date(),
        admissionClass: 1,
        status: StudentStatus.ACTIVE
      });

      await Student.create({
        studentCode: 'STU010',
        userId: 10,
        firstNameEn: 'Same',
        lastNameEn: 'Two',
        firstNameNp: 'सेम',
        lastNameNp: 'टू',
        dateOfBirthBS: '2069-01-01',
        dateOfBirthAD: new Date('2012-04-14'),
        gender: Gender.FEMALE,
        addressEn: 'Janakpur',
        addressNp: 'जनकपुर',
        fatherName: 'Father Name',
        fatherPhone: '9841234567',
        fatherCitizenshipNo: citizenship,
        motherName: 'Mother Name',
        motherPhone: '9841234568',
        emergencyContact: '9841234569',
        admissionDate: new Date(),
        admissionClass: 1,
        status: StudentStatus.ACTIVE
      });

      // Get encrypted values from database
      const rawData = await sequelize.query(
        'SELECT father_citizenship_no FROM students WHERE student_code IN (?, ?)',
        {
          replacements: ['STU009', 'STU010'],
          type: 'SELECT'
        }
      );

      const encrypted1 = (rawData[0] as any).father_citizenship_no;
      const encrypted2 = (rawData[1] as any).father_citizenship_no;

      // Encrypted values should be different (due to random IV)
      expect(encrypted1).not.toBe(encrypted2);
      
      // But both should decrypt to same value
      expect(decrypt(encrypted1)).toBe(citizenship);
      expect(decrypt(encrypted2)).toBe(citizenship);
    });

    it('should not leak plaintext in encrypted data', async () => {
      const citizenship = 'SENSITIVE-DATA-12345';
      
      await Student.create({
        studentCode: 'STU011',
        userId: 11,
        firstNameEn: 'Leak',
        lastNameEn: 'Test',
        firstNameNp: 'लीक',
        lastNameNp: 'टेस्ट',
        dateOfBirthBS: '2070-01-01',
        dateOfBirthAD: new Date('2013-04-14'),
        gender: Gender.MALE,
        addressEn: 'Nepalgunj',
        addressNp: 'नेपालगंज',
        fatherName: 'Father Name',
        fatherPhone: '9841234567',
        fatherCitizenshipNo: citizenship,
        motherName: 'Mother Name',
        motherPhone: '9841234568',
        emergencyContact: '9841234569',
        admissionDate: new Date(),
        admissionClass: 1,
        status: StudentStatus.ACTIVE
      });

      // Get encrypted value
      const rawData = await sequelize.query(
        'SELECT father_citizenship_no FROM students WHERE student_code = ?',
        {
          replacements: ['STU011'],
          type: 'SELECT'
        }
      );

      const encryptedValue = (rawData[0] as any).father_citizenship_no;

      // Encrypted value should not contain plaintext
      expect(encryptedValue.toLowerCase()).not.toContain('sensitive');
      expect(encryptedValue).not.toContain('12345');
      expect(encryptedValue).not.toContain('DATA');
    });
  });
});

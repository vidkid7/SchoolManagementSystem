import { sequelize } from '@config/database';
import { AcademicYear } from '@models/AcademicYear.model';
import ECA, { initECA } from '@models/ECA.model';
import ECAEnrollment, { initECAEnrollment } from '@models/ECAEnrollment.model';
import ECAEvent, { initECAEvent } from '@models/ECAEvent.model';
import ECAAchievement, { initECAAchievement } from '@models/ECAAchievement.model';
import Staff, { EmploymentType, StaffCategory, StaffStatus } from '@models/Staff.model';
import Student, { Gender, StudentStatus } from '@models/Student.model';

/** Set up an isolated ECA schema and the minimum foreign-key parents for integration tests. */
export async function setupEcaTestDatabase(): Promise<void> {
  if (sequelize.getDialect() !== 'sqlite') {
    throw new Error('ECA integration tests require TEST_DB_DIALECT=sqlite');
  }

  initECA(sequelize);
  initECAEnrollment(sequelize);
  initECAEvent(sequelize);
  initECAAchievement(sequelize);
  await sequelize.sync({ force: true });

  ECA.hasMany(ECAEnrollment, { foreignKey: 'ecaId', as: 'enrollments' });
  ECAEnrollment.belongsTo(ECA, { foreignKey: 'ecaId', as: 'eca' });
  ECA.hasMany(ECAEvent, { foreignKey: 'ecaId', as: 'events' });
  ECAEvent.belongsTo(ECA, { foreignKey: 'ecaId', as: 'eca' });
  ECA.hasMany(ECAAchievement, { foreignKey: 'ecaId', as: 'achievements' });
  ECAAchievement.belongsTo(ECA, { foreignKey: 'ecaId', as: 'eca' });

  await AcademicYear.create({
    name: '2081-2082 BS',
    startDateBS: '2081-01-01',
    endDateBS: '2081-12-30',
    startDateAD: new Date('2024-04-13'),
    endDateAD: new Date('2025-04-13'),
  });
  await Staff.create({
    staffCode: 'ECA-TEST-COORDINATOR',
    firstNameEn: 'Test',
    lastNameEn: 'Coordinator',
    category: StaffCategory.TEACHING,
    employmentType: EmploymentType.FULL_TIME,
    joinDate: new Date('2020-01-01'),
    status: StaffStatus.ACTIVE,
  });

  for (const studentId of [1, 2, 3, 100, 101]) {
    await Student.create({
      studentId,
      studentCode: `ECA-TEST-STUDENT-${studentId}`,
      firstNameEn: studentId === 101 ? 'Jane' : 'John',
      lastNameEn: 'Doe',
      dateOfBirthBS: '2062-01-01',
      dateOfBirthAD: new Date('2005-01-01'),
      gender: studentId === 101 ? Gender.FEMALE : Gender.MALE,
      addressEn: 'Test Address',
      fatherName: 'Test Father',
      fatherPhone: '9841234567',
      motherName: 'Test Mother',
      motherPhone: '9841234568',
      emergencyContact: '9841234569',
      admissionDate: new Date('2020-01-01'),
      admissionClass: 10,
      status: StudentStatus.ACTIVE,
    });
  }
}

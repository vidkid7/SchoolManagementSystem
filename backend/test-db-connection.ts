import sequelize from './src/config/database';
import Student, { StudentStatus, Gender } from './src/models/Student.model';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    console.log('\nSyncing database...');
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');

    console.log('\nCreating test student...');
    const student = await Student.create({
      studentCode: `TEST-${Date.now()}`,
      firstNameEn: 'Test',
      lastNameEn: 'Student',
      firstNameNp: 'टेस्ट',
      lastNameNp: 'विद्यार्थी',
      dateOfBirthBS: '2067-01-01',
      dateOfBirthAD: new Date('2010-04-14'),
      gender: Gender.MALE,
      addressEn: 'Test Address',
      addressNp: 'परीक्षण ठेगाना',
      fatherName: 'Test Father',
      fatherPhone: '9800000000',
      motherName: 'Test Mother',
      motherPhone: '9800000001',
      emergencyContact: '9800000000',
      admissionDate: new Date('2024-01-01'),
      admissionClass: 1,
      currentClassId: 1,
      rollNumber: 1,
      status: StudentStatus.ACTIVE
    });

    console.log('✅ Student created:', student.studentId);

    // Cleanup
    await student.destroy({ force: true });
    console.log('✅ Student deleted');

    await sequelize.close();
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testConnection();

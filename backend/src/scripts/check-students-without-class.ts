/**
 * Check students without valid class assignment
 */

import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/database';

async function checkStudentsWithoutClass() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Get total students
    const [totalResult]: any = await sequelize.query(`
      SELECT COUNT(*) as count FROM students WHERE deleted_at IS NULL
    `);
    const totalStudents = totalResult[0].count;
    console.log(`\n📊 Total Students: ${totalStudents}`);

    // Get students with valid class assignment
    const [withClassResult]: any = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM students 
      WHERE deleted_at IS NULL AND current_class_id IS NOT NULL
    `);
    const studentsWithClass = withClassResult[0].count;
    console.log(`✅ Students with class assigned: ${studentsWithClass}`);

    // Get students without class assignment
    const [studentsWithoutClass]: any = await sequelize.query(`
      SELECT student_id, first_name_en, last_name_en, current_class_id, status
      FROM students
      WHERE deleted_at IS NULL AND current_class_id IS NULL
    `);
    
    console.log(`\n❌ Students without class assignment: ${studentsWithoutClass.length}`);
    
    if (studentsWithoutClass.length > 0) {
      console.log('\nDetails:');
      studentsWithoutClass.forEach((student: any) => {
        console.log(`  - ID: ${student.student_id}, Name: ${student.first_name_en} ${student.last_name_en}, Status: ${student.status}`);
      });
    }

    // Get students with invalid class ID (class doesn't exist)
    const [studentsWithInvalidClass]: any = await sequelize.query(`
      SELECT s.student_id, s.first_name_en, s.last_name_en, s.current_class_id
      FROM students s
      LEFT JOIN classes c ON s.current_class_id = c.class_id
      WHERE s.deleted_at IS NULL 
        AND s.current_class_id IS NOT NULL
        AND c.class_id IS NULL
    `);

    if (studentsWithInvalidClass.length > 0) {
      console.log(`\n⚠️  Students with invalid class_id (class doesn't exist): ${studentsWithInvalidClass.length}`);
      console.log('Details:');
      studentsWithInvalidClass.forEach((student: any) => {
        console.log(`  - ID: ${student.student_id}, Name: ${student.first_name_en} ${student.last_name_en}, Invalid Class ID: ${student.current_class_id}`);
      });
    }

    const invalidCount = studentsWithInvalidClass.length;

    // Summary
    console.log('\n📈 Summary:');
    console.log(`Total Students: ${totalStudents}`);
    console.log(`Students counted in classes: ${studentsWithClass - invalidCount}`);
    console.log(`Students without class: ${studentsWithoutClass.length}`);
    console.log(`Students with invalid class ID: ${invalidCount}`);
    console.log(`Difference: ${totalStudents - (studentsWithClass - invalidCount)}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkStudentsWithoutClass();

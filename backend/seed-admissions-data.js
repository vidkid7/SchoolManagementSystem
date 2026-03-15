const mysql = require('mysql2/promise');
require('dotenv').config();

async function seedAdmissionsData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system',
  });

  try {
    console.log('Seeding admissions data...\n');

    // Get tenant IDs from admin user
    const [adminUsers] = await connection.query(
      "SELECT municipality_id, school_config_id FROM users WHERE role = 'School_Admin' LIMIT 1"
    );

    if (adminUsers.length === 0) {
      console.log('❌ No admin user found. Cannot seed data.');
      return;
    }

    const { municipality_id, school_config_id } = adminUsers[0];
    console.log(`Using tenant IDs: municipality_id=${municipality_id}, school_config_id=${school_config_id}`);

    // Get current academic year
    const [academicYears] = await connection.query(
      "SELECT academic_year_id FROM academic_years WHERE is_current = 1 LIMIT 1"
    );
    
    const academicYearId = academicYears.length > 0 ? academicYears[0].academic_year_id : null;

    // Sample admission data
    const admissions = [
      {
        student_name: 'Rajesh Kumar',
        date_of_birth: '2010-05-15',
        gender: 'Male',
        guardian_name: 'Ram Kumar',
        guardian_phone: '9841234567',
        guardian_email: 'ram.kumar@example.com',
        address: 'Kathmandu, Nepal',
        applying_for_class: 6,
        status: 'inquiry',
        academic_year_id: academicYearId,
      },
      {
        student_name: 'Sita Sharma',
        date_of_birth: '2011-08-20',
        gender: 'Female',
        guardian_name: 'Hari Sharma',
        guardian_phone: '9841234568',
        guardian_email: 'hari.sharma@example.com',
        address: 'Lalitpur, Nepal',
        applying_for_class: 5,
        status: 'application_submitted',
        academic_year_id: academicYearId,
      },
      {
        student_name: 'Anil Thapa',
        date_of_birth: '2009-03-10',
        gender: 'Male',
        guardian_name: 'Krishna Thapa',
        guardian_phone: '9841234569',
        guardian_email: 'krishna.thapa@example.com',
        address: 'Bhaktapur, Nepal',
        applying_for_class: 7,
        status: 'test_scheduled',
        test_date: '2026-03-20',
        academic_year_id: academicYearId,
      },
      {
        student_name: 'Maya Gurung',
        date_of_birth: '2010-11-25',
        gender: 'Female',
        guardian_name: 'Dhan Gurung',
        guardian_phone: '9841234570',
        guardian_email: 'dhan.gurung@example.com',
        address: 'Pokhara, Nepal',
        applying_for_class: 6,
        status: 'test_completed',
        test_date: '2026-03-10',
        test_score: 85.5,
        academic_year_id: academicYearId,
      },
      {
        student_name: 'Bikash Rai',
        date_of_birth: '2011-01-30',
        gender: 'Male',
        guardian_name: 'Surya Rai',
        guardian_phone: '9841234571',
        guardian_email: 'surya.rai@example.com',
        address: 'Dharan, Nepal',
        applying_for_class: 5,
        status: 'interview_scheduled',
        test_date: '2026-03-08',
        test_score: 78.0,
        interview_date: '2026-03-18',
        interviewer_name: 'Principal Sharma',
        academic_year_id: academicYearId,
      },
      {
        student_name: 'Sunita Tamang',
        date_of_birth: '2009-07-12',
        gender: 'Female',
        guardian_name: 'Laxman Tamang',
        guardian_phone: '9841234572',
        guardian_email: 'laxman.tamang@example.com',
        address: 'Hetauda, Nepal',
        applying_for_class: 7,
        status: 'admitted',
        test_date: '2026-03-05',
        test_score: 92.0,
        interview_date: '2026-03-12',
        interviewer_name: 'Principal Sharma',
        interview_feedback: 'Excellent candidate with strong academic background',
        admission_date: '2026-03-13',
        academic_year_id: academicYearId,
      },
      {
        student_name: 'Ramesh Magar',
        date_of_birth: '2010-09-18',
        gender: 'Male',
        guardian_name: 'Tej Magar',
        guardian_phone: '9841234573',
        guardian_email: 'tej.magar@example.com',
        address: 'Butwal, Nepal',
        applying_for_class: 6,
        status: 'rejected',
        test_date: '2026-03-06',
        test_score: 45.0,
        rejection_reason: 'Did not meet minimum test score requirement',
        academic_year_id: academicYearId,
      },
      {
        student_name: 'Anita Shrestha',
        date_of_birth: '2011-04-22',
        gender: 'Female',
        guardian_name: 'Gopal Shrestha',
        guardian_phone: '9841234574',
        guardian_email: 'gopal.shrestha@example.com',
        address: 'Biratnagar, Nepal',
        applying_for_class: 5,
        status: 'inquiry',
        academic_year_id: academicYearId,
      },
    ];

    for (const admission of admissions) {
      await connection.query(
        `INSERT INTO admissions SET ?, municipality_id = ?, school_config_id = ?`,
        [admission, municipality_id, school_config_id]
      );
    }

    console.log(`✅ Successfully seeded ${admissions.length} admission records`);

    // Show statistics
    const [stats] = await connection.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM admissions
      GROUP BY status
      ORDER BY count DESC
    `);

    console.log('\nAdmission statistics by status:');
    console.table(stats);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

seedAdmissionsData();

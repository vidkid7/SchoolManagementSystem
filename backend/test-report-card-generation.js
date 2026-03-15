/**
 * Test Report Card Generation
 * This script tests the report card generation endpoint
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/v1';

async function testReportCardGeneration() {
  try {
    console.log('Testing Report Card Generation...\n');

    // First, login to get token
    console.log('1. Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'Admin@123'
    });

    const token = loginResponse.data.data.accessToken;
    console.log('✓ Login successful\n');

    // Get a student ID
    console.log('2. Fetching students...');
    const studentsResponse = await axios.get(`${BASE_URL}/students?limit=1`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!studentsResponse.data.data || studentsResponse.data.data.length === 0) {
      console.log('✗ No students found in database');
      console.log('\nTo fix: Add students to the database first');
      return;
    }

    const studentId = studentsResponse.data.data[0].studentId;
    console.log(`✓ Found student ID: ${studentId}\n`);

    // Get academic years
    console.log('3. Fetching academic years...');
    const yearsResponse = await axios.get(`${BASE_URL}/academic/years`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!yearsResponse.data.data || yearsResponse.data.data.length === 0) {
      console.log('✗ No academic years found');
      console.log('\nTo fix: Create academic years first');
      return;
    }

    const academicYearId = yearsResponse.data.data[0].academicYearId;
    console.log(`✓ Found academic year ID: ${academicYearId}\n`);

    // Try to generate report card
    console.log('4. Generating report card...');
    const reportCardResponse = await axios.get(
      `${BASE_URL}/examinations/report-card/${studentId}`,
      {
        params: {
          termId: 1,
          academicYearId: academicYearId,
          language: 'bilingual',
          format: 'ledger'
        },
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'arraybuffer'
      }
    );

    console.log('✓ Report card generated successfully!');
    console.log(`  Size: ${reportCardResponse.data.length} bytes`);
    console.log(`  Content-Type: ${reportCardResponse.headers['content-type']}`);

  } catch (error) {
    console.error('\n✗ Error:', error.response?.data || error.message);
    
    if (error.response?.status === 500) {
      console.log('\nPossible causes:');
      console.log('1. No exams created for the term/academic year');
      console.log('2. No grades entered for the student');
      console.log('3. Missing term data');
      console.log('4. Database connection issues');
      console.log('\nTo fix:');
      console.log('- Create exams: POST /api/v1/examinations');
      console.log('- Enter grades: POST /api/v1/examinations/grades');
      console.log('- Ensure term exists in academic year');
    }
  }
}

testReportCardGeneration();

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Test credentials
const credentials = {
  username: 'admin',
  password: 'admin123'
};

async function testAttendanceReportsAPI() {
  try {
    console.log('=== Testing Attendance Reports API ===\n');

    // 1. Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, credentials);
    const token = loginResponse.data.data.accessToken;
    console.log('✓ Login successful\n');

    const headers = {
      Authorization: `Bearer ${token}`
    };

    // 2. Test Student Attendance Report (no filters)
    console.log('2. Testing Student Attendance Report (no filters)...');
    try {
      const studentReportResponse = await axios.get(`${BASE_URL}/attendance/student/report`, { headers });
      const studentData = studentReportResponse.data.data;
      console.log('✓ Student Attendance Report API working');
      console.log(`  - Total records: ${studentData.records?.length || studentData.length || 0}`);
      console.log(`  - Sample record:`, studentData.records?.[0] || studentData[0] || 'No records');
      console.log('');
    } catch (error) {
      console.log('✗ Student Attendance Report failed:', error.response?.data?.message || error.message);
      console.log('');
    }

    // 3. Test Student Attendance Report (with date range)
    console.log('3. Testing Student Attendance Report (with date range)...');
    try {
      const dateFrom = new Date('2026-01-01').toISOString();
      const dateTo = new Date('2026-03-14').toISOString();
      const studentReportWithDatesResponse = await axios.get(`${BASE_URL}/attendance/student/report`, {
        headers,
        params: { dateFrom, dateTo }
      });
      const studentDataWithDates = studentReportWithDatesResponse.data.data;
      console.log('✓ Student Attendance Report with dates working');
      console.log(`  - Total records: ${studentDataWithDates.records?.length || studentDataWithDates.length || 0}`);
      console.log('');
    } catch (error) {
      console.log('✗ Student Attendance Report with dates failed:', error.response?.data?.message || error.message);
      console.log('');
    }

    // 4. Test Student Attendance Report (with class filter)
    console.log('4. Testing Student Attendance Report (with class filter)...');
    try {
      const studentReportWithClassResponse = await axios.get(`${BASE_URL}/attendance/student/report`, {
        headers,
        params: { classId: 6 }
      });
      const studentDataWithClass = studentReportWithClassResponse.data.data;
      console.log('✓ Student Attendance Report with class filter working');
      console.log(`  - Total records: ${studentDataWithClass.records?.length || studentDataWithClass.length || 0}`);
      console.log('');
    } catch (error) {
      console.log('✗ Student Attendance Report with class filter failed:', error.response?.data?.message || error.message);
      console.log('');
    }

    // 5. Test Staff Attendance Report
    console.log('5. Testing Staff Attendance Report...');
    try {
      const staffReportResponse = await axios.get(`${BASE_URL}/attendance/staff/report`, { headers });
      const staffData = staffReportResponse.data.data;
      console.log('✓ Staff Attendance Report API working');
      console.log(`  - Total records: ${staffData.records?.length || staffData.length || 0}`);
      console.log(`  - Sample record:`, staffData.records?.[0] || staffData[0] || 'No records');
      console.log('');
    } catch (error) {
      console.log('✗ Staff Attendance Report failed:', error.response?.data?.message || error.message);
      console.log('');
    }

    // 6. Test Classes API (for dropdown)
    console.log('6. Testing Classes API (for dropdown)...');
    try {
      const classesResponse = await axios.get(`${BASE_URL}/academic/classes`, { headers });
      const classesData = classesResponse.data.data;
      console.log('✓ Classes API working');
      console.log(`  - Total classes: ${classesData.length || 0}`);
      if (classesData.length > 0) {
        console.log(`  - Sample class:`, {
          classId: classesData[0].classId,
          classLevel: classesData[0].classLevel,
          className: classesData[0].className
        });
      }
      console.log('');
    } catch (error) {
      console.log('✗ Classes API failed:', error.response?.data?.message || error.message);
      console.log('');
    }

    console.log('=== All API Tests Completed ===');

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testAttendanceReportsAPI();

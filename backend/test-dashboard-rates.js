const axios = require('axios');

async function testDashboardRates() {
  try {
    console.log('Testing dashboard data with rates...\n');
    
    // Login first
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✓ Logged in successfully\n');
    
    // Test dashboard endpoint
    console.log('='.repeat(60));
    console.log('DASHBOARD DATA');
    console.log('='.repeat(60));
    const dashboardResponse = await axios.get('http://localhost:3000/api/v1/reports/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const summary = dashboardResponse.data.data.summary;
    console.log('\nSummary:');
    console.log(`  Total Students: ${summary.totalStudents}`);
    console.log(`  Total Staff: ${summary.totalStaff}`);
    console.log(`  Total Classes: ${summary.totalClasses}`);
    console.log(`  Total Books: ${summary.totalBooks}`);
    console.log(`  Attendance Rate: ${summary.attendanceRate}%`);
    console.log(`  Fee Collection Rate: ${summary.feeCollectionRate}%`);
    console.log(`  Total Circulations: ${summary.totalCirculations}`);
    console.log(`  Active ECA Activities: ${summary.activeEcaActivities}`);
    console.log(`  Active Sports: ${summary.activeSports}`);
    
    // Test library report
    console.log('\n' + '='.repeat(60));
    console.log('LIBRARY REPORT');
    console.log('='.repeat(60));
    const libraryResponse = await axios.get('http://localhost:3000/api/v1/reports/library?startDate=2026-01-01&endDate=2026-03-14', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const library = libraryResponse.data.data;
    console.log(`  Total Books: ${library.totalBooks}`);
    console.log(`  Total Issued: ${library.totalIssued}`);
    console.log(`  Total Returned: ${library.totalReturned}`);
    console.log(`  Overdue Books: ${library.overdueBooks}`);
    console.log(`  Circulation Rate: ${library.circulationRate}%`);
    console.log(`  Fine Collected: Rs ${library.fineCollected}`);
    
    // Test ECA report
    console.log('\n' + '='.repeat(60));
    console.log('ECA REPORT');
    console.log('='.repeat(60));
    const ecaResponse = await axios.get('http://localhost:3000/api/v1/reports/eca', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const eca = ecaResponse.data.data;
    console.log(`  Total Activities: ${eca.totalActivities}`);
    console.log(`  Total Participants: ${eca.totalParticipants}`);
    console.log(`  Participation Rate: ${eca.participationRate}%`);
    console.log(`  By Category: ${JSON.stringify(eca.byCategory)}`);
    
    // Test sports report
    console.log('\n' + '='.repeat(60));
    console.log('SPORTS REPORT');
    console.log('='.repeat(60));
    const sportsResponse = await axios.get('http://localhost:3000/api/v1/reports/sports', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const sports = sportsResponse.data.data;
    console.log(`  Total Sports: ${sports.totalSports}`);
    console.log(`  Total Participants: ${sports.totalParticipants}`);
    
    console.log('\n' + '='.repeat(60));
    console.log('✓ ALL APIS CONNECTED AND RETURNING DATA');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testDashboardRates();

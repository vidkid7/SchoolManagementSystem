const axios = require('axios');

async function testDashboard() {
  try {
    console.log('Testing complete dashboard data...\n');
    
    // Login first
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✓ Logged in successfully\n');
    
    // Test all report endpoints
    const endpoints = [
      { name: 'Dashboard', url: '/api/v1/reports/dashboard' },
      { name: 'Enrollment', url: '/api/v1/reports/enrollment' },
      { name: 'Attendance', url: '/api/v1/reports/attendance?startDate=2026-01-01&endDate=2026-03-14' },
      { name: 'Fee Collection', url: '/api/v1/reports/fee-collection?startDate=2026-01-01&endDate=2026-03-14' },
      { name: 'Examination', url: '/api/v1/reports/examination' },
      { name: 'Library', url: '/api/v1/reports/library?startDate=2026-01-01&endDate=2026-03-14' },
      { name: 'ECA', url: '/api/v1/reports/eca' },
      { name: 'Sports', url: '/api/v1/reports/sports' },
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`http://localhost:3000${endpoint.url}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✓ ${endpoint.name}: SUCCESS`);
        if (endpoint.name === 'Dashboard') {
          console.log(`  - Students: ${response.data.data.summary.totalStudents}`);
          console.log(`  - Staff: ${response.data.data.summary.totalStaff}`);
          console.log(`  - Classes: ${response.data.data.summary.totalClasses}`);
          console.log(`  - Books: ${response.data.data.summary.totalBooks}`);
        }
      } catch (error) {
        console.log(`✗ ${endpoint.name}: FAILED`);
        console.log(`  Error: ${error.response?.data?.message || error.message}`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testDashboard();

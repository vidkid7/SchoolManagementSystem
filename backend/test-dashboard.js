const axios = require('axios');

async function testDashboard() {
  try {
    // First, login to get token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });

    const token = loginResponse.data.data.accessToken;
    console.log('✅ Login successful');
    console.log('Token:', token.substring(0, 50) + '...');

    // Test dashboard endpoint
    console.log('\n📊 Testing dashboard endpoint...');
    const dashboardResponse = await axios.get('http://localhost:3000/api/v1/reports/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Dashboard endpoint successful!');
    console.log('\n📈 Dashboard Data:');
    console.log(JSON.stringify(dashboardResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

testDashboard();

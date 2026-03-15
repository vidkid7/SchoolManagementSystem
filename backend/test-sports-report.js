const axios = require('axios');

async function testSportsReport() {
  try {
    console.log('Testing sports report endpoint...\n');
    
    // Login first
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✓ Logged in successfully\n');
    
    // Test sports report
    const sportsResponse = await axios.get('http://localhost:3000/api/v1/reports/sports', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Sports Report Response:');
    console.log(JSON.stringify(sportsResponse.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testSportsReport();

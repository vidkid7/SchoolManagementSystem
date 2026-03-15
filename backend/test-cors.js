const axios = require('axios');

async function testCORS() {
  try {
    console.log('🔐 Testing CORS from localhost:5174...\n');

    const response = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'admin',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5174'
      }
    });

    console.log('✅ Request successful!');
    console.log('Status:', response.status);
    console.log('CORS Headers:');
    console.log('  Access-Control-Allow-Origin:', response.headers['access-control-allow-origin']);
    console.log('  Access-Control-Allow-Credentials:', response.headers['access-control-allow-credentials']);

  } catch (error) {
    console.error('❌ Request failed!');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

testCORS();

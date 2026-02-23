// Simple test to check if students endpoint works
// Run with: node test-endpoint.js

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/students?page=1&limit=10',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
    // Add your auth token here from browser DevTools
    'Authorization': 'Bearer YOUR_TOKEN_HERE'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data);
    
    try {
      const parsed = JSON.parse(data);
      console.log('\nParsed Response:');
      console.log('- Success:', parsed.success);
      console.log('- Data length:', Array.isArray(parsed.data) ? parsed.data.length : 'Not an array');
      console.log('- Message:', parsed.message);
      
      if (parsed.data && parsed.data.length > 0) {
        console.log('\nFirst student:');
        console.log('  ID:', parsed.data[0].studentId);
        console.log('  Code:', parsed.data[0].studentCode);
        console.log('  Name:', parsed.data[0].firstNameEn, parsed.data[0].lastNameEn);
      }
    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
});

req.end();

const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testAccountantAuth() {
  console.log('🔍 Testing Accountant Authentication\n');

  // Connect to database
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'school_management_system'
  });

  try {
    // 1. Check user in database
    console.log('1️⃣ Checking user in database...');
    const [users] = await connection.execute(
      'SELECT user_id, username, email, role, municipality_id, school_config_id FROM users WHERE username = ?',
      ['accountant']
    );

    if (users.length === 0) {
      console.log('❌ User not found in database!');
      return;
    }

    const user = users[0];
    console.log('✅ User found:');
    console.log(JSON.stringify(user, null, 2));

    // 2. Generate a test JWT token
    console.log('\n2️⃣ Generating test JWT token...');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';
    
    const payload = {
      userId: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role,
      municipalityId: user.municipality_id,
      schoolConfigId: user.school_config_id
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
    console.log('✅ Token generated');
    console.log('Token payload:', JSON.stringify(payload, null, 2));

    // 3. Verify the token
    console.log('\n3️⃣ Verifying token...');
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token verified');
    console.log('Decoded payload:', JSON.stringify(decoded, null, 2));

    // 4. Check role comparison
    console.log('\n4️⃣ Testing role comparison...');
    const ALLOWED_ROLES = ['School_Admin', 'Accountant'];
    
    console.log('User role:', decoded.role);
    console.log('Allowed roles:', ALLOWED_ROLES);
    
    // Case-insensitive comparison (like the middleware does)
    const userRoleLower = decoded.role.toLowerCase();
    const hasPermission = ALLOWED_ROLES.some(role => role.toLowerCase() === userRoleLower);
    
    console.log('User role (lowercase):', userRoleLower);
    console.log('Has permission:', hasPermission);

    if (hasPermission) {
      console.log('✅ Authorization would PASS');
    } else {
      console.log('❌ Authorization would FAIL');
      console.log('Expected one of:', ALLOWED_ROLES.map(r => r.toLowerCase()));
    }

    // 5. Test with actual backend endpoint
    console.log('\n5️⃣ Testing actual API call...');
    const axios = require('axios');
    
    try {
      const response = await axios.get('http://localhost:3000/api/v1/admissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ API call successful!');
      console.log('Response status:', response.status);
      console.log('Data:', response.data);
    } catch (error) {
      console.log('❌ API call failed!');
      console.log('Status:', error.response?.status);
      console.log('Error:', error.response?.data);
      
      // Check if it's an authorization error
      if (error.response?.status === 403) {
        console.log('\n🔍 Authorization failed. Checking backend logs...');
        console.log('The backend rejected the request even though:');
        console.log('- Token is valid:', !!decoded);
        console.log('- Role is correct:', decoded.role);
        console.log('- Role matches allowed:', hasPermission);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

testAccountantAuth().catch(console.error);

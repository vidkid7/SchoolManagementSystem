const axios = require('axios');

async function testAccountantLogin() {
  try {
    console.log('🔐 Testing accountant login...\n');
    
    // Login
    const loginResponse = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username: 'accountant',
      password: 'accountant123'
    });

    const { accessToken, user } = loginResponse.data.data;
    
    console.log('✅ Login successful!');
    console.log('\n👤 User Details:');
    console.log('   Username:', user.username);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Municipality Code:', user.municipalityCode);
    
    console.log('\n🔑 Token (first 50 chars):', accessToken.substring(0, 50) + '...');
    
    console.log('\n✅ Expected redirect path: /' + user.municipalityCode + '/accountant/dashboard');
    console.log('❌ Old (wrong) path: /' + user.municipalityCode + '/portal/accountant');
    
    // Test finance statistics endpoint
    console.log('\n📊 Testing finance statistics endpoint...');
    try {
      const statsResponse = await axios.get('http://localhost:3000/api/v1/finance/statistics', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      console.log('✅ Finance statistics accessible');
      console.log('   Total Collection:', statsResponse.data.data?.totalCollection || 0);
      console.log('   Pending Fees:', statsResponse.data.data?.pendingFees || 0);
    } catch (err) {
      console.log('⚠️  Finance statistics endpoint error:', err.response?.status, err.response?.data?.error?.message);
    }

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testAccountantLogin();

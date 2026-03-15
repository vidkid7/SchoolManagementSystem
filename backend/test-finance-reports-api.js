const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Test credentials
const credentials = {
  username: 'admin',
  password: 'admin123'
};

async function testFinanceReportsAPI() {
  try {
    console.log('=== Testing Finance Reports API ===\n');

    // 1. Login
    console.log('1. Logging in...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, credentials);
    const token = loginResponse.data.data.accessToken;
    console.log('✓ Login successful\n');

    const headers = {
      Authorization: `Bearer ${token}`
    };

    // 2. Test Financial Summary API
    console.log('2. Testing Financial Summary API...');
    try {
      const summaryResponse = await axios.get(`${BASE_URL}/finance/summary`, { headers });
      const summaryData = summaryResponse.data.data;
      console.log('✓ Financial Summary API working');
      console.log(`  - Total Revenue: ${summaryData.totalRevenue || 0}`);
      console.log(`  - Total Collected: ${summaryData.totalCollected || 0}`);
      console.log(`  - Total Outstanding: ${summaryData.totalOutstanding || 0}`);
      console.log(`  - Collection Rate: ${summaryData.collectionRate || 0}%`);
      console.log('');
    } catch (error) {
      console.log('✗ Financial Summary API failed:', error.response?.data?.message || error.message);
      console.log('');
    }

    // 3. Test Financial Reports API (revenue)
    console.log('3. Testing Financial Reports API (revenue)...');
    try {
      const reportsResponse = await axios.get(`${BASE_URL}/finance/reports`, {
        headers,
        params: {
          type: 'revenue',
          startDate: '2026-01-01',
          endDate: '2026-03-14'
        }
      });
      const reportsData = reportsResponse.data.data;
      console.log('✓ Financial Reports API working');
      console.log(`  - Report type: revenue`);
      console.log(`  - Data structure:`, Object.keys(reportsData));
      console.log('');
    } catch (error) {
      console.log('✗ Financial Reports API failed:', error.response?.data?.message || error.message);
      console.log('');
    }

    // 4. Test Financial Reports API (collection)
    console.log('4. Testing Financial Reports API (collection)...');
    try {
      const collectionResponse = await axios.get(`${BASE_URL}/finance/reports`, {
        headers,
        params: {
          type: 'collection',
          startDate: '2026-01-01',
          endDate: '2026-03-14'
        }
      });
      const collectionData = collectionResponse.data.data;
      console.log('✓ Collection Report API working');
      console.log(`  - Report type: collection`);
      console.log('');
    } catch (error) {
      console.log('✗ Collection Report API failed:', error.response?.data?.message || error.message);
      console.log('');
    }

    // 5. Test Financial Reports API (outstanding)
    console.log('5. Testing Financial Reports API (outstanding)...');
    try {
      const outstandingResponse = await axios.get(`${BASE_URL}/finance/reports`, {
        headers,
        params: {
          type: 'outstanding'
        }
      });
      const outstandingData = outstandingResponse.data.data;
      console.log('✓ Outstanding Report API working');
      console.log(`  - Report type: outstanding`);
      console.log('');
    } catch (error) {
      console.log('✗ Outstanding Report API failed:', error.response?.data?.message || error.message);
      console.log('');
    }

    // 6. Test Invoices API
    console.log('6. Testing Invoices API...');
    try {
      const invoicesResponse = await axios.get(`${BASE_URL}/finance/invoices`, { headers });
      const invoicesData = invoicesResponse.data.data;
      console.log('✓ Invoices API working');
      console.log(`  - Total invoices: ${invoicesData.records?.length || invoicesData.length || 0}`);
      if (invoicesData.records?.length > 0 || invoicesData.length > 0) {
        const sample = invoicesData.records?.[0] || invoicesData[0];
        console.log(`  - Sample invoice:`, {
          invoiceId: sample.invoiceId,
          studentId: sample.studentId,
          totalAmount: sample.totalAmount,
          status: sample.status
        });
      }
      console.log('');
    } catch (error) {
      console.log('✗ Invoices API failed:', error.response?.data?.message || error.message);
      console.log('');
    }

    // 7. Test Payments API
    console.log('7. Testing Payments API...');
    try {
      const paymentsResponse = await axios.get(`${BASE_URL}/finance/payments`, { headers });
      const paymentsData = paymentsResponse.data.data;
      console.log('✓ Payments API working');
      console.log(`  - Total payments: ${paymentsData.records?.length || paymentsData.length || 0}`);
      console.log('');
    } catch (error) {
      console.log('✗ Payments API failed:', error.response?.data?.message || error.message);
      console.log('');
    }

    console.log('=== All API Tests Completed ===');

  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testFinanceReportsAPI();

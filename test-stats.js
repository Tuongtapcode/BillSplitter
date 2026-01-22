// Test script for stats API
const http = require('http');

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testStatsAPI() {
  try {
    console.log('Testing stats API...');

    // Test without auth (should fail)
    const response1 = await makeRequest('http://localhost:5000/api/bills/stats');
    console.log('Without auth:', response1.status);

    // Test with invalid token (should fail)
    const response2 = await makeRequest('http://localhost:5000/api/bills/stats', {
      headers: { 'Authorization': 'Bearer invalid' }
    });
    console.log('With invalid token:', response2.status);

    console.log('API test completed');
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testStatsAPI();
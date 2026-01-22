// Quick test for stats API
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

async function testStats() {
  try {
    console.log('Testing stats API...');

    // Test with invalid token (should fail)
    const response = await makeRequest('http://localhost:5000/api/bills/stats', {
      headers: { 'Authorization': 'Bearer invalid' }
    });
    console.log('Response:', response.status);
    console.log('Data:', response.data);

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testStats();
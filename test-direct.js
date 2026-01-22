// Test stats API directly
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

async function testAPI() {
  console.log('Testing stats API...');

  // Test without auth (should fail)
  const response = await makeRequest('http://localhost:5000/api/bills/stats');
  console.log('Status:', response.status);
  console.log('Response:', JSON.stringify(response.data, null, 2));
}

testAPI();
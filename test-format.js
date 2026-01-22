// Test stats API response format
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
  console.log('Testing stats API response format...');

  // Test without auth (should fail)
  const response = await makeRequest('http://localhost:5000/api/bills/stats');
  console.log('Status:', response.status);

  if (response.status === 200) {
    console.log('Response keys:', Object.keys(response.data));
    console.log('Has currentMonth:', !!response.data.currentMonth);
    console.log('Has previousMonth:', !!response.data.previousMonth);
    console.log('Has changePercent:', 'changePercent' in response.data);
    console.log('Has monthlyStats:', !!response.data.monthlyStats);
  } else {
    console.log('Error response:', response.data);
  }
}

testAPI();
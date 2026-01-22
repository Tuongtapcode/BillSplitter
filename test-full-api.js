// Test stats API with proper authentication
const http = require('http');

function makeRequest(url, options = {}, body = null) {
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
    if (body) {
      req.write(body);
    }
    req.end();
  });
}

async function testAPI() {
  try {
    console.log('Testing API...');

    // Register user
    console.log('1. Registering user...');
    const registerRes = await makeRequest('http://localhost:5000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({
      username: 'testuser',
      password: 'testpass123'
    }));
    console.log('Register:', registerRes.status, registerRes.data);

    // Login
    console.log('2. Logging in...');
    const loginRes = await makeRequest('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, JSON.stringify({
      username: 'testuser',
      password: 'testpass123'
    }));
    console.log('Login:', loginRes.status);

    if (loginRes.status === 200 && loginRes.data.token) {
      const token = loginRes.data.token;
      console.log('Token received');

      // Test stats API
      console.log('3. Testing stats API...');
      const statsRes = await makeRequest('http://localhost:5000/api/bills/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Stats API:', statsRes.status);
      if (statsRes.status === 200) {
        console.log('Stats data:', JSON.stringify(statsRes.data, null, 2));
      } else {
        console.log('Stats error:', statsRes.data);
      }
    } else {
      console.log('Login failed:', loginRes.data);
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testAPI();
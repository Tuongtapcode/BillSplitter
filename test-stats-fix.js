// Test stats API
const http = require('http');

const req = http.request('http://localhost:5000/api/bills/stats', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data.substring(0, 200));
  });
});

req.on('error', (e) => console.error('Error:', e.message));
req.end();
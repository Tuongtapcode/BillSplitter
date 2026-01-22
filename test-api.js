const fetch = require('node-fetch');

async function testAPI() {
  try {
    console.log('Testing API endpoints...\n');

    // Test register
    console.log('1. Registering user...');
    const regRes = await fetch('http://localhost:3001/api/register', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username: 'testuser123', password: 'testpass'})
    });
    const regData = await regRes.json();
    console.log('Register result:', regData);

    // Test login
    console.log('\n2. Logging in...');
    const loginRes = await fetch('http://localhost:3001/api/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username: 'testuser123', password: 'testpass'})
    });
    const loginData = await loginRes.json();
    console.log('Login result:', loginData);

    if (loginData.token) {
      const token = loginData.token;

      // Test get profile
      console.log('\n3. Getting profile...');
      const profileRes = await fetch('http://localhost:3001/api/profile', {
        headers: {'Authorization': `Bearer ${token}`}
      });
      const profileData = await profileRes.json();
      console.log('Profile result:', profileData);

      // Test update people
      console.log('\n4. Updating people...');
      const updateRes = await fetch('http://localhost:3001/api/profile/people', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({people: ['Alice', 'Bob', 'Charlie', 'David']})
      });
      const updateData = await updateRes.json();
      console.log('Update people result:', updateData);

      // Test get profile again
      console.log('\n5. Getting profile after update...');
      const profileRes2 = await fetch('http://localhost:3001/api/profile', {
        headers: {'Authorization': `Bearer ${token}`}
      });
      const profileData2 = await profileRes2.json();
      console.log('Profile result after update:', profileData2);
    }

    console.log('\n✅ API test completed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAPI();
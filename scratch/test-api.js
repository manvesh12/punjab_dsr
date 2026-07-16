const url = 'https://dsr-portal.onrender.com';

async function test() {
  try {
    const loginRes = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'super.admin', password: 'Gov@2026!Secure' })
    });
    
    if (!loginRes.ok) {
      console.log('Login failed:', loginRes.status, await loginRes.text());
      return;
    }
    
    const loginData = await loginRes.json();
    console.log('Logged in successfully. Token:', loginData.token.substring(0, 20) + '...');
    
    const projectsRes = await fetch(`${url}/api/projects`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    
    if (!projectsRes.ok) {
      console.log('Projects API failed:', projectsRes.status, await projectsRes.text());
      return;
    }
    
    const projectsData = await projectsRes.json();
    console.log('Projects loaded successfully. Count:', projectsData.length);
  } catch (e) {
    console.error('Script error:', e);
  }
}

test();

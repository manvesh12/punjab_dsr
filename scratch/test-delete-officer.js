const url = 'https://dsr-portal.onrender.com';

async function test() {
  try {
    const loginRes = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'amritsar.officer', password: 'Gov@2026!Secure' })
    });
    const loginData = await loginRes.json();
    if (!loginData.token) {
        console.log("Login failed");
        return;
    }
    const token = loginData.token;
    
    // Create a project
    const createRes = await fetch(`${url}/api/projects`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ projectName: 'Test Officer Project', year: '2026' })
    });
    
    const project = await createRes.json();
    console.log('Created project:', project.id);
    
    // Try to delete it
    const delRes = await fetch(`${url}/api/projects/${project.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const delText = await delRes.text();
    console.log('Delete status:', delRes.status, delText);
    
    // Try a fetch after delete
    const afterRes = await fetch(`${url}/api/projects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('After delete fetch status:', afterRes.status);
    
  } catch (e) {
    console.error(e);
  }
}
test();

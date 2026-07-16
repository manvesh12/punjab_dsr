const url = 'https://dsr-portal.onrender.com';

async function test() {
  try {
    const loginRes = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'super.admin', password: 'Gov@2026!Secure' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    
    const projectsRes = await fetch(`${url}/api/projects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const projects = await projectsRes.json();
    console.log('Found projects:', projects.length);
    
    if (projects.length > 0) {
      const p = projects[0];
      console.log('Deleting project:', p.id);
      const delRes = await fetch(`${url}/api/projects/${p.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('Delete status:', delRes.status);
      
      const afterRes = await fetch(`${url}/api/projects`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      console.log('After delete fetch status:', afterRes.status, await afterRes.text());
    }
  } catch (e) {
    console.error(e);
  }
}
test();

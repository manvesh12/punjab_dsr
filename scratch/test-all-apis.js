const url = 'https://dsr-portal.onrender.com';

async function testAllApis() {
  console.log("=== Testing All APIs ===");
  try {
    // 1. Login
    console.log("1. Logging in as super.admin...");
    const loginRes = await fetch(`${url}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'super.admin', password: 'Gov@2026!Secure' })
    });
    
    if (loginRes.status !== 200) {
      console.error("Login failed with status:", loginRes.status, await loginRes.text());
      return;
    }
    
    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log("Login successful! Token length:", token.length);
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    // 2. Fetch Users (User Management)
    console.log("\n2. Fetching Users (/api/users)...");
    const usersRes = await fetch(`${url}/api/users`, { headers });
    console.log("Users API Status:", usersRes.status, await usersRes.text().then(t => t.slice(0, 100)));
    
    // 3. Fetch Dashboard Stats
    console.log("\n3. Fetching Dashboard Stats (/api/dashboard/stats)...");
    const statsRes = await fetch(`${url}/api/dashboard/stats`, { headers });
    console.log("Stats API Status:", statsRes.status, await statsRes.text().then(t => t.slice(0, 100)));
    
    // 4. Fetch Projects
    console.log("\n4. Fetching Projects (/api/projects)...");
    const projectsRes = await fetch(`${url}/api/projects`, { headers });
    console.log("Projects API Status:", projectsRes.status, await projectsRes.text().then(t => t.slice(0, 100)));
    
    // 5. Fetch Reports
    console.log("\n5. Fetching Reports (/api/reports)...");
    const reportsRes = await fetch(`${url}/api/reports`, { headers });
    console.log("Reports API Status:", reportsRes.status, await reportsRes.text().then(t => t.slice(0, 100)));
    
  } catch (e) {
    console.error("Test script error:", e);
  }
}
testAllApis();

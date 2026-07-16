const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 8080, // Note: hitting 8080 now
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log("Login Response:");
    console.log(data);
    try {
      const json = JSON.parse(data);
      const token = json.token;
      
      const req2 = http.request({
        hostname: 'localhost',
        port: 8080,
        path: '/api/users',
        method: 'GET',
        headers: { 'Cookie': `dsr_session=${token}`, 'Authorization': `Bearer ${token}` }
      }, (res2) => {
        let data2 = '';
        res2.on('data', chunk => data2 += chunk);
        res2.on('end', () => {
          console.log("Users API Response:");
          console.log(data2);
        });
      });
      req2.end();
      
      const req3 = http.request({
        hostname: 'localhost',
        port: 8080,
        path: '/api/projects',
        method: 'GET',
        headers: { 'Cookie': `dsr_session=${token}`, 'Authorization': `Bearer ${token}` }
      }, (res3) => {
        let data3 = '';
        res3.on('data', chunk => data3 += chunk);
        res3.on('end', () => {
          console.log("Projects API Response:");
          console.log(data3);
        });
      });
      req3.end();
      
    } catch(e) {
      console.error(e);
    }
  });
});
req.write(JSON.stringify({ username: "super.admin", password: "Gov@2026!Secure" }));
req.end();

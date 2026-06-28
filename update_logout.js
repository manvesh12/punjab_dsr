const fs = require('fs');
const file = 'frontend/public/legacy/js/portal.bundle.js';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/function doLogout\(\) \{\r?\n\s*try \{\r?\n\s*apiFetch\('\/auth\/logout', \{ method: 'POST' \}\)\.catch\(\(\) => \{\}\);\r?\n\s*\} catch \(e\) \{\}\r?\n\s*localStorage\.removeItem\('dsr_token'\);/, 
  `function doLogout() {
  try {
    apiFetch('/auth/logout', { method: 'POST' }).catch(() => {});
  } catch (e) {}
  localStorage.removeItem('dsr_token');
  localStorage.removeItem('dsr_user');
  localStorage.removeItem('dsr_role');`);

fs.writeFileSync(file, c);

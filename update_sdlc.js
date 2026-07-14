const fs = require('fs');
const file = 'frontend/public/legacy/js/portal.bundle.js';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/S\.role = 'sdlc';\r?\n\s*await showAppScreen\(\);/,
  "S.role = 'sdlc';\n    localStorage.setItem('dsr_user', JSON.stringify(S.user));\n    localStorage.setItem('dsr_role', S.role);\n    await showAppScreen();");

c = c.replace(/S\.role = 'authority';\r?\n\s*showAuthorityScreen\(\);/g,
  "S.role = 'authority';\n  localStorage.setItem('dsr_user', JSON.stringify(S.user));\n  localStorage.setItem('dsr_role', S.role);\n  showAuthorityScreen();");

fs.writeFileSync(file, c);

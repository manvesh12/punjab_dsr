const fs = require('fs');
let content = fs.readFileSync('backend/prisma/seed.ts', 'utf8');
content = content.replace(/import \{ PrismaClient, Role, ProjectStatus/g, 'import { PrismaClient, ProjectStatus');
content = content.replace(/Role\.([A-Z_]+)/g, '"$1"');
content = content.replace(/role: u.role \}/g, 'role: u.role as any }');
fs.writeFileSync('backend/prisma/seed.ts', content);
console.log('Done');

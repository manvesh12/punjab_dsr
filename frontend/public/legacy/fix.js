const fs = require('fs');
const files = [
  'workspace.js',
  'preview.js',
  'index.js'
];
for(const f of files) {
  const p = 'c:\\Users\\iPC\\Downloads\\punjab_dsr-main final\\punjab_dsr-main\\frontend\\public\\legacy\\js\\modules\\replenishment\\' + f;
  let text = fs.readFileSync(p, 'utf8');
  text = text.replace(/\\`/g, '`');
  fs.writeFileSync(p, text);
}
console.log('Fixed');

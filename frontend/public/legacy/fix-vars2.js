const fs = require('fs');
const files = [
  'workspace.js',
  'preview.js',
  'index.js',
  'sidebar.js'
];
for(const f of files) {
  const p = 'c:\\Users\\iPC\\Downloads\\punjab_dsr-main final\\punjab_dsr-main\\frontend\\public\\legacy\\js\\modules\\replenishment\\' + f;
  if (fs.existsSync(p)) {
    let text = fs.readFileSync(p, 'utf8');
    text = text.split('\\${').join('${');
    fs.writeFileSync(p, text);
  }
}
console.log('Fixed interpolation');

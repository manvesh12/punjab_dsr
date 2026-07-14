const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const buildSource = fs.readFileSync(path.join(root, 'build.js'), 'utf8');
const namesMatch = buildSource.match(/const JS_FILES = \[([\s\S]*?)\]\.map/);
if (!namesMatch) throw new Error('Could not read the legacy module manifest from build.js.');

const names = [...namesMatch[1].matchAll(/'([^']+\.js)'/g)].map(match => match[1]);
const errors = [];
for (const name of names) {
  const file = path.join(root, 'js', 'modules', name);
  if (!fs.existsSync(file)) { errors.push(`Missing source module: ${file}`); continue; }
  try { new vm.Script(fs.readFileSync(file, 'utf8'), { filename: file }); }
  catch (error) { errors.push(`Invalid JavaScript in ${name}: ${error.message}`); }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Legacy source check passed: ${names.length} ordered modules are present and parse correctly.`);

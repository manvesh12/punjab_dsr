const jsdom = require('jsdom');
const fs = require('fs');

const html = fs.readFileSync('frontend/public/legacy/login.html', 'utf8');

const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", (err) => { console.log("JS Error:", err); });
virtualConsole.on("warn", (warn) => { console.log("JS Warn:", warn); });
virtualConsole.on("log", (log) => { console.log("JS Log:", log); });
virtualConsole.on("jsdomError", (err) => { console.log("JSDOM Error:", err); });

const dom = new jsdom.JSDOM(html, {
  url: 'http://localhost/legacy/login.html',
  runScripts: 'dangerously',
  resources: 'usable',
  virtualConsole
});

dom.window.addEventListener('load', () => {
  console.log('Window loaded!');
  setTimeout(() => {
    try {
      if (dom.window.pdfPreview) {
        dom.window.pdfPreview.show('front-matter');
        console.log('Called pdfPreview.show');
      } else {
        console.error('pdfPreview is undefined');
      }
    } catch(e) {
      console.error("Eval error:", e);
    }
    process.exit(0);
  }, 1500);
});

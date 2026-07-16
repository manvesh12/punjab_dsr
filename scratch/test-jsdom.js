const jsdom = require('jsdom');
const fs = require('fs');

const html = fs.readFileSync('frontend/public/legacy/login.html', 'utf8');

const dom = new jsdom.JSDOM(html, {
  url: 'http://localhost/legacy/login.html',
  runScripts: 'dangerously',
  resources: 'usable',
  virtualConsole: new jsdom.VirtualConsole().sendTo(console)
});

dom.window.addEventListener('load', () => {
  console.log('Window loaded!');
  setTimeout(() => {
    console.log('Attempting to trigger front-matter preview...');
    try {
      if (dom.window.pdfPreview) {
        dom.window.pdfPreview.show('front-matter');
        console.log('Called pdfPreview.show');
      } else {
        console.error('pdfPreview is undefined');
      }
    } catch(e) {
      console.error(e);
    }
    
    // Close so node exits
    setTimeout(() => {
      dom.window.close();
    }, 1000);
  }, 1000);
});

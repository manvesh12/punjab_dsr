const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({ 
      headless: true,
      executablePath: 'C:\\Users\\iPC\\.cache\\puppeteer\\chrome\\win64-150.0.7871.24\\chrome-win64\\chrome.exe'
    });
    const page = await browser.newPage();
    
    page.on('console', msg => {
      console.log(`[Browser Console ${msg.type()}] ${msg.text()}`);
    });
    
    page.on('pageerror', err => {
      console.log(`[Browser PageError] ${err.message}`);
    });

    console.log('Navigating to Live Preview URL...');
    await page.goto('https://punjab-dsr.vercel.app/legacy/login.html?invite=c3fcbfc54fc14ba2a78f1894fff483d44c4b3a45014840b3bc60d36f0f38af89', { waitUntil: 'networkidle0' });
    
    console.log('Executing window.pdfPreview.show...');
    await page.evaluate(() => {
      if (window.pdfPreview && typeof window.pdfPreview.show === 'function') {
        window.pdfPreview.show('front-matter');
      } else {
        console.error('window.pdfPreview is not available!');
      }
    });

    await new Promise(r => setTimeout(r, 2000));
    console.log('Done capturing logs.');
    
    await browser.close();
  } catch (err) {
    console.error('Script Error:', err);
  }
})();
